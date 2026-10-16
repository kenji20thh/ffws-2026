"use client";

import { useEffect, useState } from "react";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { getDayTeams, getRoomResults, getRooms } from "@/lib/api";
import type { DayTeam, Room, RoomTeamSummary, TournamentDay } from "@/types";
import DayTabs from "./DayTabs";
import RoomCard from "./RoomCard";
import RoomResultsTable from "./RoomResultsTable";
import TeamsOfDay from "./TeamsOfDay";

const PHASES = [
  {
    title: "Knockout Stage",
    subtitle: "Phase 1 · Weeks 1–2",
    dates: "NOV 6–15",
    description:
      "24 teams split into four groups of six. Teams compete across six matchdays, with 24 matches per team across the round-robin phase.",
    start: "2026-11-06",
    end: "2026-11-15",
  },
  {
    title: "Knockout Stage",
    subtitle: "Phase 2 · Week 3",
    dates: "NOV 19–22",
    description:
      "Four matchdays. Teams qualify directly for the Grand Finals or advance to the next phase based on their results.",
    start: "2026-11-19",
    end: "2026-11-22",
  },
  {
    title: "Last Chance",
    subtitle: "Final qualification",
    dates: "NOV 27",
    description:
      "Twelve teams compete across ten matches. The top four qualify for the Grand Finals.",
    start: "2026-11-27",
    end: "2026-11-27",
  },
  {
    title: "Grand Finals",
    subtitle: "World Championship",
    dates: "NOV 28",
    description:
      "Twelve teams compete for the championship using the Champion Rush format at BITEC LIVE, Bangkok, Thailand.",
    start: "2026-11-28",
    end: "2026-11-28",
  },
];

function getDateKey(date: string | Date) {
  const value = typeof date === "string" ? date : date.toISOString();
  return value.slice(0, 10);
}

function getPhaseForDay(day: TournamentDay) {
  const date = getDateKey(day.date);
  return PHASES.find((phase) => date >= phase.start && date <= phase.end);
}

function formatDate(date: string | Date) {
  const value = typeof date === "string" ? date : date.toISOString();

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value));
}

export default function ScheduleView({ days }: { days: TournamentDay[] }) {
  const [dayId, setDayId] = useState(days[0]?.id ?? 0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dayTeams, setDayTeams] = useState<DayTeam[]>([]);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [results, setResults] = useState<RoomTeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dayId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);
    setRooms([]);
    setDayTeams([]);
    setRoomId(null);
    setResults([]);

    Promise.all([getRooms(dayId), getDayTeams(dayId)])
      .then(([loadedRooms, loadedTeams]) => {
        if (cancelled) return;

        setRooms(loadedRooms);
        setDayTeams(loadedTeams);

        const live = loadedRooms.find((room) => room.status === "live");
        setRoomId((live ?? loadedRooms[0])?.id ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load day");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dayId]);

  const room = rooms.find((item) => item.id === roomId) ?? null;
  const isLive = room?.status === "live";

  useEffect(() => {
    if (!roomId) {
      setResults([]);
      return;
    }

    let cancelled = false;

    const load = () => {
      getRoomResults(roomId)
        .then((data) => {
          if (!cancelled) setResults(data);
        })
        .catch(() => {});
    };

    load();

    if (!isLive) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = setInterval(load, 10_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [roomId, isLive]);

  const activeDay = days.find((day) => day.id === dayId) ?? days[0];
  const activePhase = activeDay ? getPhaseForDay(activeDay) : undefined;

  if (days.length === 0) {
    return (
      <div className="space-y-8">
        <TournamentPhases />
        <EmptyState
          title="Matchdays being prepared"
          hint="The tournament format and dates are announced. Matchday details, teams, and rooms will appear here when available."
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <TournamentPhases />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-stat text-[10px] uppercase tracking-[0.3em] text-ember">
              Official match calendar
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase sm:text-4xl">
              Matchdays
            </h2>
          </div>

          {activeDay && (
            <p className="font-stat text-xs uppercase tracking-wider text-ash">
              {formatDate(activeDay.date)}
            </p>
          )}
        </div>

        <DayTabs days={days} activeId={dayId} onSelect={setDayId} />

        {activeDay && (
          <div className="border-l-2 border-ember bg-char-2 p-4 sm:p-5">
            <p className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember">
              {activePhase?.subtitle ?? "Tournament matchday"}
            </p>
            <h3 className="mt-1 font-display text-2xl font-extrabold uppercase">
              {activeDay.name}
            </h3>
            {activePhase && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ash">
                {activePhase.description}
              </p>
            )}
          </div>
        )}
      </section>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">
                Participating teams
              </h2>
              {dayTeams.length > 0 && (
                <span className="font-stat text-xs text-ash">
                  {dayTeams.length} teams
                </span>
              )}
            </div>

            {dayTeams.length > 0 ? (
              <TeamsOfDay teams={dayTeams} />
            ) : (
              <EmptyState
                title="Teams not assigned yet"
                hint="The matchday is listed, but participating teams have not been added."
              />
            )}
          </section>

          <section>
            <h2 className="mb-4 font-stat text-[11px] uppercase tracking-[0.3em] text-ember">
              Matches & rooms
            </h2>

            {rooms.length === 0 ? (
              <EmptyState
                title="Match details not available yet"
                hint="Rooms and match results will appear here once they are configured."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {rooms.map((item) => (
                  <RoomCard
                    key={item.id}
                    room={item}
                    active={item.id === roomId}
                    onSelect={() => setRoomId(item.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {room && (
            <section>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">
                  Room {room.room_number} results
                </h2>
                {isLive && (
                  <span className="font-stat text-xs uppercase tracking-wider text-ember">
                    Live · Refreshes every 10 seconds
                  </span>
                )}
              </div>
              <RoomResultsTable rows={results} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TournamentPhases() {
  return (
    <section className="space-y-4">
      <div>
        <p className="font-stat text-[10px] uppercase tracking-[0.3em] text-ember">
          November 2026
        </p>
        <h2 className="mt-2 font-display text-3xl font-extrabold uppercase sm:text-4xl">
          Tournament format
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PHASES.map((phase, index) => (
          <article
            key={`${phase.title}-${phase.start}`}
            className="relative overflow-hidden border border-white/10 bg-char-2 p-5"
          >
            <span className="absolute right-4 top-2 font-display text-5xl font-black text-white/[0.06]">
              0{index + 1}
            </span>

            <p className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember">
              {phase.subtitle}
            </p>

            <h3 className="mt-2 font-display text-2xl font-extrabold uppercase">
              {phase.title}
            </h3>

            <p className="mt-1 font-stat text-xs tracking-wider text-bone">
              {phase.dates}, 2026
            </p>

            <p className="mt-3 text-sm leading-6 text-ash">
              {phase.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
