
"use client";

import Image from "next/image";
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

type Group = {
  name: string;
  color: string;
  teams: string[];
};

const GROUPS: Group[] = [
  {
    name: "Group A",
    color: "#ff5a1f",
    teams: [
      "LYON",
      "Team Flash",
      "ONIC Olympus",
      "LOS Grandes",
      "Horaa Esports",
      "XPROJEKT Esports",
    ],
  },
  {
    name: "Group B",
    color: "#ffb000",
    teams: [
      "Bigetron by Vitality",
      "Blue Cheese",
      "P Esports",
      "Resurrection Esports",
      "Pirate Esports",
      "ParadoX Gaming",
    ],
  },
  {
    name: "Group C",
    color: "#c42cff",
    teams: [
      "LOUD GG",
      "Team Apex Gaming",
      "GOW",
      "RRQ Kazu",
      "Gun Dynasty",
      "Total Winner Esports",
    ],
  },
  {
    name: "Group D",
    color: "#25d366",
    teams: [
      "Team Infinity",
      "All Gamers Global",
      "Buriram United Esports",
      "TSG Pros",
      "Stellar Esports",
      "FLUXO",
    ],
  },
];

const TEAM_LOGOS: Record<string, string> = {
  LYON: "/teams/LYON.png",
  "Team Flash": "/teams/FLASH.png",
  "ONIC Olympus": "/teams/ONIC.png",
  "LOS Grandes": "/teams/LOS.png",
  "Horaa Esports": "/teams/HE.png",
  "XPROJEKT Esports": "/teams/XP.png",
  "Bigetron by Vitality": "/teams/BTR.png",
  "Blue Cheese": "/teams/BlueCheese.png",
  "P Esports": "/teams/pe.png",
  "Resurrection Esports": "/teams/RES.png",
  "Pirate Esports": "/teams/PIRATE.png",
  "ParadoX Gaming": "/teams/PDX.png",
  "LOUD GG": "/teams/LOUD.png",
  "Team Apex Gaming": "/teams/APEX.png",
  GOW: "/teams/GOW.png",
  "RRQ Kazu": "/teams/RRQ.png",
  "Gun Dynasty": "/teams/GunDynasty.png",
  "Total Winner Esports": "/teams/TOTALWINNER.png",
  "Team Infinity": "/teams/INF.png",
  "All Gamers Global": "/teams/AG.png",
  "Buriram United Esports": "/teams/BRU.png",
  "TSG Pros": "/teams/TSG.png",
  "Stellar Esports": "/teams/STELLAR.png",
  FLUXO: "/teams/fluxo.png",
};

type StageName = "knockout" | "last-chance" | "grand-final";

function stageForDay(day: TournamentDay): StageName {
  const name = day.name.toLowerCase();

  if (name.includes("last chance")) return "last-chance";
  if (name.includes("grand final")) return "grand-final";

  return "knockout";
}

function formatDate(date: string) {
  const value = date.slice(0, 10);
  const parsed = new Date(`${value}T12:00:00Z`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function dayLabel(day: TournamentDay) {
  const name = day.name;

  return name
    .replace(/^Knockout Stage\s*[-–:]?\s*/i, "")
    .replace(/^Week\s+(\d+)/i, "Week $1")
    .replace(/\s+Day\s+(\d+)/i, " · Day $1");
}

function StageHeader({
  title,
  subtitle,
  number,
  expanded,
}: {
  title: string;
  subtitle: string;
  number: string;
  expanded: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center border font-display text-xl font-black ${
          expanded
            ? "border-ember bg-ember text-char"
            : "border-char-3 bg-char-2 text-ash"
        }`}
      >
        {number}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide text-bone sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1 font-stat text-[10px] uppercase tracking-[0.18em] text-ash sm:text-xs">
          {subtitle}
        </p>
      </div>

      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
          expanded
            ? "border-ember text-ember"
            : "border-char-3 text-ash"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}

export default function ScheduleView({
  days,
}: {
  days: TournamentDay[];
}) {
  const [dayId, setDayId] = useState(days[0]?.id ?? 0);
  const [expandedStage, setExpandedStage] =
    useState<StageName>("knockout");
  const [activeWeek, setActiveWeek] = useState(1);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [dayTeams, setDayTeams] = useState<DayTeam[]>([]);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [results, setResults] = useState<RoomTeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeDay = days.find((day) => day.id === dayId) ?? days[0];

  const knockoutDays = days
    .filter((day) => stageForDay(day) === "knockout")
    .sort((a, b) => a.day_order - b.day_order);

  const lastChanceDays = days
    .filter((day) => stageForDay(day) === "last-chance")
    .sort((a, b) => a.day_order - b.day_order);

  const grandFinalDays = days
    .filter((day) => stageForDay(day) === "grand-final")
    .sort((a, b) => a.day_order - b.day_order);

  const weekDays = knockoutDays.filter((day) => {
    if (activeWeek === 1) return day.day_order >= 1 && day.day_order <= 3;
    if (activeWeek === 2) return day.day_order >= 4 && day.day_order <= 6;
    return day.day_order >= 7 && day.day_order <= 10;
  });

  const room = rooms.find((item) => item.id === roomId) ?? null;
  const isLive = room?.status === "live";

  function selectDay(day: TournamentDay) {
    setDayId(day.id);
    setExpandedStage(stageForDay(day));

    if (stageForDay(day) === "knockout") {
      setActiveWeek(day.day_order <= 3 ? 1 : day.day_order <= 6 ? 2 : 3);
    }
  }

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
          (item) => item.status === "live",
        );

        setRoomId((liveRoom ?? loadedRooms[0])?.id ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load day",
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
        .catch(() => {});
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
        hint="Tournament groups and match days will appear here."
      />
    );
  }

  return (
    <div className="space-y-12">
      {/* Four tournament groups */}
      <section>
        <div className="mb-5">
          <p className="font-stat text-[10px] uppercase tracking-[0.3em] text-ember">
            Free Fire World Series 2026
          </p>

          <h2 className="mt-2 font-display text-3xl font-black uppercase text-bone sm:text-4xl">
            Group Distribution
          </h2>

          <p className="mt-2 text-sm text-ash">
            The 24 teams competing in four groups.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {GROUPS.map((group, index) => (
            <div
              key={group.name}
              className="overflow-hidden border border-char-3 bg-char-2"
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderLeft: `4px solid ${group.color}`,
                }}
              >
                <h3 className="font-display text-xl font-extrabold uppercase text-bone">
                  {group.name}
                </h3>

                <span
                  className="font-stat text-[10px] uppercase tracking-widest"
                  style={{ color: group.color }}
                >
                  GROUP 0{index + 1}
                </span>
              </div>

              <div className="grid grid-cols-2 border-t border-char-3">
                {group.teams.map((team, teamIndex) => (
                  <div
                    key={team}
                    className={`flex min-h-[64px] items-center justify-center px-3 py-2 ${
                      teamIndex % 2 === 0 ? "border-r border-char-3" : ""
                    } ${
                      teamIndex >= 2 ? "border-t border-char-3" : ""
                    }`}
                    title={team}
                  >
                    <div className="relative h-11 w-full max-w-[120px]">
                      <Image
                        src={TEAM_LOGOS[team]}
                        alt={`${team} logo`}
                        fill
                        sizes="120px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tournament stages */}
      <section className="space-y-4">
        <div className="mb-6">
          <p className="font-stat text-[10px] uppercase tracking-[0.3em] text-ember">
            Tournament roadmap
          </p>
          <h2 className="mt-2 font-display text-3xl font-black uppercase text-bone sm:text-4xl">
            Match Schedule
          </h2>
        </div>

        {/* Knockout Phase */}
        <div
          className={`border ${
            expandedStage === "knockout"
              ? "border-ember/60"
              : "border-char-3"
          } bg-char`}
        >
          <button
            type="button"
            onClick={() =>
              setExpandedStage((current) =>
                current === "knockout" ? "last-chance" : "knockout",
              )
            }
            aria-expanded={expandedStage === "knockout"}
            className="w-full p-4 text-left transition-colors hover:bg-char-2 sm:p-5"
          >
            <StageHeader
              title="Knockout Phase"
              subtitle={`${knockoutDays.length} match days · November 6–22`}
              number="01"
              expanded={expandedStage === "knockout"}
            />
          </button>

          {expandedStage === "knockout" && (
            <div className="space-y-5 border-t border-char-3 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveWeek(1);
                    if (knockoutDays[0]) selectDay(knockoutDays[0]);
                  }}
                  className={`border p-4 text-left transition-colors ${
                    activeWeek !== 3
                      ? "border-ember bg-ember/10"
                      : "border-char-3 bg-char-2 hover:border-ember/50"
                  }`}
                >
                  <p className="font-stat text-[10px] uppercase tracking-widest text-ember">
                    Phase 1
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold uppercase text-bone">
                    Weeks 1 &amp; 2
                  </h3>
                  <p className="mt-1 text-xs text-ash">
                    November 6–15
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveWeek(3);
                    const week3 = knockoutDays.find(
                      (day) => day.day_order >= 7,
                    );
                    if (week3) selectDay(week3);
                  }}
                  className={`border p-4 text-left transition-colors ${
                    activeWeek === 3
                      ? "border-ember bg-ember/10"
                      : "border-char-3 bg-char-2 hover:border-ember/50"
                  }`}
                >
                  <p className="font-stat text-[10px] uppercase tracking-widest text-ember">
                    Phase 2
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold uppercase text-bone">
                    Week 3
                  </h3>
                  <p className="mt-1 text-xs text-ash">
                    November 19–22
                  </p>
                </button>
              </div>

              {activeWeek !== 3 && (
                <div className="flex gap-2">
                  {[1, 2].map((week) => (
                    <button
                      key={week}
                      type="button"
                      onClick={() => {
                        setActiveWeek(week);
                        const firstDay = knockoutDays.find((day) =>
                          week === 1
                            ? day.day_order >= 1 && day.day_order <= 3
                            : day.day_order >= 4 && day.day_order <= 6,
                        );
                        if (firstDay) selectDay(firstDay);
                      }}
                      className={`border px-4 py-2 font-stat text-xs uppercase tracking-wider ${
                        activeWeek === week
                          ? "border-ember bg-ember text-char"
                          : "border-char-3 text-ash hover:text-bone"
                      }`}
                    >
                      Week {week}
                    </button>
                  ))}
                </div>
              )}

              {activeWeek !== 3 && (
                <section className="space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember">
                        Phase 1 · Match rotation
                      </p>
                      <h3 className="mt-1 font-display text-xl font-extrabold uppercase text-bone sm:text-2xl">
                        Weeks 1 &amp; 2
                      </h3>
                    </div>
                    <p className="text-xs text-ash">
                      3 match days · 2 sessions per day
                    </p>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    {[
                      {
                        week: 1,
                        sessions: [
                          ["A × B", "A × C", "A × D"],
                          ["C × D", "B × D", "B × C"],
                        ],
                      },
                      {
                        week: 2,
                        sessions: [
                          ["C × D", "B × D", "B × C"],
                          ["A × B", "A × C", "A × D"],
                        ],
                      },
                    ].map(({ week, sessions }) => (
                      <div
                        key={week}
                        className={`overflow-hidden rounded-sm border ${
                          activeWeek === week
                            ? "border-ember/70 bg-char-2"
                            : "border-char-3 bg-char"
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-char-3 px-4 py-3">
                          <div>
                            <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ember">
                              Knockout · Phase 1
                            </p>
                            <h4 className="mt-1 font-display text-lg font-extrabold uppercase text-bone">
                              Week {week}
                            </h4>
                          </div>
                          <span className="font-stat text-xs text-ash">
                            0{week} / 02
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 p-3 sm:gap-3 sm:p-4">
                          {[0, 1, 2].map((dayIndex) => (
                            <div
                              key={dayIndex}
                              className="min-w-0 border border-char-3 bg-char p-2 sm:p-3"
                            >
                              <p className="mb-3 text-center font-stat text-[10px] uppercase tracking-wider text-ash">
                                Day {dayIndex + 1}
                              </p>
                              {[0, 1].map((sessionIndex) => (
                                <div
                                  key={sessionIndex}
                                  className={sessionIndex === 0 ? "mb-2" : ""}
                                >
                                  <p className="mb-1 text-center text-[9px] uppercase tracking-wider text-ash">
                                    Session {sessionIndex + 1}
                                  </p>
                                  <div className="flex items-center justify-center gap-1 rounded-sm border border-ember/25 bg-ember/10 px-1 py-2">
                                    <span className="font-display text-sm font-black text-bone sm:text-base">
                                      {sessions[sessionIndex][dayIndex].split(" × ")[0]}
                                    </span>
                                    <span className="text-[10px] font-bold text-ember">
                                      ×
                                    </span>
                                    <span className="font-display text-sm font-black text-bone sm:text-base">
                                      {sessions[sessionIndex][dayIndex].split(" × ")[1]}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeWeek === 3 && (
                <div>
                  <p className="mb-3 font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
                    Select match day
                  </p>

                  <DayTabs
                    days={weekDays}
                    activeId={dayId}
                    onSelect={(id) => {
                      const selectedDay = days.find((day) => day.id === id);
                      if (selectedDay) selectDay(selectedDay);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Last Chance */}
        <div
          className={`border ${
            expandedStage === "last-chance"
              ? "border-ember/60"
              : "border-char-3"
          } bg-char`}
        >
          <button
            type="button"
            onClick={() =>
              setExpandedStage((current) =>
                current === "last-chance" ? "knockout" : "last-chance",
              )
            }
            aria-expanded={expandedStage === "last-chance"}
            className="w-full p-4 text-left transition-colors hover:bg-char-2 sm:p-5"
          >
            <StageHeader
              title="Last Chance"
              subtitle="November 27 · Final opportunity"
              number="02"
              expanded={expandedStage === "last-chance"}
            />
          </button>

          {expandedStage === "last-chance" && (
            <div className="space-y-4 border-t border-char-3 p-4 sm:p-5">
              {lastChanceDays.length === 0 ? (
                <EmptyState title="Last Chance schedule not announced" />
              ) : (
                <DayTabs
                  days={lastChanceDays}
                  activeId={dayId}
                  onSelect={(id) => {
                    const selectedDay = days.find((day) => day.id === id);
                    if (selectedDay) selectDay(selectedDay);
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Grand Final */}
        <div
          className={`border ${
            expandedStage === "grand-final"
              ? "border-ember/60"
              : "border-char-3"
          } bg-char`}
        >
          <button
            type="button"
            onClick={() =>
              setExpandedStage((current) =>
                current === "grand-final" ? "knockout" : "grand-final",
              )
            }
            aria-expanded={expandedStage === "grand-final"}
            className="w-full p-4 text-left transition-colors hover:bg-char-2 sm:p-5"
          >
            <StageHeader
              title="Grand Final"
              subtitle="November 28 · Championship day"
              number="03"
              expanded={expandedStage === "grand-final"}
            />
          </button>

          {expandedStage === "grand-final" && (
            <div className="space-y-4 border-t border-char-3 p-4 sm:p-5">
              {grandFinalDays.length === 0 ? (
                <EmptyState title="Grand Final schedule not announced" />
              ) : (
                <DayTabs
                  days={grandFinalDays}
                  activeId={dayId}
                  onSelect={(id) => {
                    const selectedDay = days.find((day) => day.id === id);
                    if (selectedDay) selectDay(selectedDay);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* Selected match-day details */}
      <section className="scroll-mt-6 space-y-8">
        <div className="border-l-2 border-ember pl-4">
          <p className="font-stat text-[10px] uppercase tracking-[0.25em] text-ember">
            {activeDay ? stageForDay(activeDay).replace("-", " ") : "Schedule"}
          </p>

          <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-bone sm:text-4xl">
            {activeDay?.name ?? "Match Day"}
          </h2>

          {activeDay?.date && (
            <p className="mt-2 font-stat text-xs uppercase tracking-widest text-ash">
              {formatDate(activeDay.date)} 2026
            </p>
          )}
        </div>

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
              <h3 className="mb-4 font-stat text-[11px] uppercase tracking-[0.3em] text-ember">
                Teams playing
              </h3>

              {dayTeams.length === 0 ? (
                <EmptyState
                  title="Teams not assigned yet"
                  hint="The participating teams will appear here once assigned to this day."
                />
              ) : (
                <TeamsOfDay teams={dayTeams} />
              )}
            </section>

            <section>
              <h3 className="mb-4 font-stat text-[11px] uppercase tracking-[0.3em] text-ember">
                Match rooms
              </h3>

              {rooms.length === 0 ? (
                <EmptyState
                  title="No rooms yet"
                  hint="Room assignments will appear here when available."
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
                      {isLive ? "Live results" : "Room standings"}
                    </p>

                    <h3 className="mt-1 font-display text-3xl font-extrabold uppercase text-bone">
                      Room {room.room_number}
                    </h3>
                  </div>

                  {isLive && (
                    <span className="flex items-center gap-2 font-stat text-[10px] uppercase tracking-widest text-ember">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-ember" />
                      Live · 10s refresh
                    </span>
                  )}
                </div>

                {results.length === 0 ? (
                  <EmptyState
                    title="No results yet"
                    hint="Room results will appear here when available."
                  />
                ) : (
                  <RoomResultsTable rows={results} />
                )}
              </section>
            )}
          </>
        )}
      </section>
    </div>
  );
}
