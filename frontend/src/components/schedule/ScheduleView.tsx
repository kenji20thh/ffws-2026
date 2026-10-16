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

type Stage = {
  title: string;
  days: TournamentDay[];
};

function getStage(name: string): string {
  const normalized = name.toLowerCase();

  if (normalized.includes("last chance")) return "Last Chance";
  if (normalized.includes("grand final")) return "Grand Finals";
  return "Knockout Stage";
}

function groupDays(days: TournamentDay[]): Stage[] {
  const stages = [
    "Knockout Stage",
    "Last Chance",
    "Grand Finals",
  ];

  return stages
    .map((title) => ({
      title,
      days: days
        .filter((day) => getStage(day.name) === title)
        .sort((a, b) => a.day_order - b.day_order),
    }))
    .filter((stage) => stage.days.length > 0);
}

export default function ScheduleView({
  days,
}: {
  days: TournamentDay[];
}) {
  const [dayId, setDayId] = useState(days[0]?.id ?? 0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dayTeams, setDayTeams] = useState<DayTeam[]>([]);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [results, setResults] = useState<RoomTeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeDay = days.find((day) => day.id === dayId) ?? days[0];
  const stages = groupDays(days);

  useEffect(() => {
    if (!dayId) return;

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

        const liveRoom = loadedRooms.find(
          (room) => room.status === "live",
        );

        setRoomId((liveRoom ?? loadedRooms[0])?.id ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load schedule",
          );
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

    const loadResults = () => {
      getRoomResults(roomId)
        .then((data) => {
          if (!cancelled) setResults(data);
        })
        .catch(() => {
          // Keep the most recently loaded results if a refresh fails.
        });
    };

    loadResults();

    if (!isLive) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = setInterval(loadResults, 10_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [roomId, isLive]);

  if (days.length === 0) {
    return (
      <EmptyState
        title="Schedule not announced"
        hint="Days and rooms will appear here soon."
      />
    );
  }

  return (
    <div className="space-y-10">
      {/* Tournament stages */}
      <div className="space-y-8">
        {stages.map((stage) => {
          const selected = stage.days.some(
            (day) => day.id === dayId,
          );

          return (
            <section key={stage.title} className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide text-bone">
                  {stage.title}
                </h2>

                <div className="h-px flex-1 bg-char-3" />

                <span className="font-stat text-[10px] uppercase tracking-widest text-ash">
                  {stage.days.length}{" "}
                  {stage.days.length === 1 ? "day" : "days"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {stage.days.map((day) => {
                  const active = day.id === dayId;

                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => setDayId(day.id)}
                      aria-pressed={active}
                      className={`border px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-ember bg-ember text-char"
                          : "border-char-3 bg-char-2 text-ash hover:border-ember/60 hover:text-bone"
                      }`}
                    >
                      <span className="block font-stat text-[9px] uppercase tracking-widest opacity-80">
                        {day.date
                          ? new Date(`${day.date}T12:00:00`).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                timeZone: "UTC",
                              },
                            )
                          : `Day ${day.day_order}`}
                      </span>

                      <span className="mt-1 block font-display text-sm font-bold uppercase">
                        {day.name
                          .replace(/^Knockout Stage\s*[-–:]?\s*/i, "")
                          .replace(/^Week\s+/i, "W")
                          .replace(/\s+Day\s+/i, " · Day ")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selected && (
                <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">
                  Selected event day
                </p>
              )}
            </section>
          );
        })}
      </div>

      <div className="h-px bg-char-3" />

      {/* Selected day details */}
      <section className="space-y-6">
        <div className="border-l-2 border-ember pl-4">
          <p className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember">
            {activeDay ? getStage(activeDay.name) : "Tournament"}
          </p>

          <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-bone sm:text-4xl">
            {activeDay?.name}
          </h2>

          <p className="mt-2 font-stat text-xs uppercase tracking-widest text-ash">
            {activeDay?.date
              ? new Date(`${activeDay.date}T12:00:00`).toLocaleDateString(
                  "en-GB",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  },
                )
              : `Tournament day ${activeDay?.day_order ?? ""}`}
          </p>
        </div>

        <DayTabs
          days={days}
          activeId={dayId}
          onSelect={setDayId}
        />
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
            <h2 className="mb-4 font-stat text-[11px] uppercase tracking-[0.3em] text-ember">
              Teams playing
            </h2>
            {dayTeams.length === 0 ? (
              <EmptyState
                title="Teams not announced"
                hint="Teams assigned to this day will appear here."
              />
            ) : (
              <TeamsOfDay teams={dayTeams} />
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">
                Rooms
              </h2>

              <span className="font-stat text-[10px] uppercase tracking-widest text-ash">
                {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
              </span>
            </div>

            {rooms.length === 0 ? (
              <EmptyState
                title="No rooms yet"
                hint="Room assignments will appear here when announced."
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember">
                    {isLive ? "Live results" : "Match results"}
                  </p>

                  <h2 className="mt-1 font-display text-3xl font-extrabold uppercase sm:text-4xl">
                    Room {room.room_number}
                  </h2>
                </div>

                {isLive && (
                  <span className="flex items-center gap-2 font-stat text-[10px] uppercase tracking-widest text-ember">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-ember" />
                    Updating every 10s
                  </span>
                )}
              </div>

              {results.length === 0 ? (
                <EmptyState
                  title="No results yet"
                  hint={
                    isLive
                      ? "Results will appear here as they become available."
                      : "Results for this room have not been published yet."
                  }
                />
              ) : (
                <RoomResultsTable rows={results} />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
