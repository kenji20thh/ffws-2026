"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDays,
  getDayTeams,
  getRoomResults,
  getRooms,
  getTeams,
} from "@/lib/api";
import { countryFlag } from "@/lib/flags";
import type {
  DayTeam,
  Room,
  RoomTeamSummary,
  Team,
  TournamentDay,
} from "@/types";

type Stage = "knockout" | "last-chance" | "grand-finals";
type Phase = "phase-1" | "phase-2";
type Week = "week-1" | "week-2" | "week-3";
type Session = "overall" | "session-1" | "session-2";
type ViewMode = "overall" | "day" | "session";

type RoomData = {
  room: Room;
  results: RoomTeamSummary[];
};

type DayData = {
  day: TournamentDay;
  rooms: RoomData[];
  teamIds: number[];
};

type StandingRow = {
  team: Team;
  roomsPlayed: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
};

const SESSION_NAMES: { value: Session; label: string }[] = [
  { value: "overall", label: "Overall" },
  { value: "session-1", label: "Session 1" },
  { value: "session-2", label: "Session 2" },
];

function isLastChance(day: TournamentDay) {
  return day.name.toLowerCase().includes("last chance");
}

function isGrandFinal(day: TournamentDay) {
  const name = day.name.toLowerCase();

  return name.includes("grand final") || name.includes("grand final");
}

function getStage(day: TournamentDay): Stage {
  if (isLastChance(day)) return "last-chance";
  if (isGrandFinal(day)) return "grand-finals";

  if (day.day_order >= 11) {
    return "grand-finals";
  }

  return "knockout";
}

function getPhase(day: TournamentDay): Phase {
  return day.day_order <= 6 ? "phase-1" : "phase-2";
}

function getWeek(day: TournamentDay): Week {
  if (day.day_order <= 3) return "week-1";
  if (day.day_order <= 6) return "week-2";
  return "week-3";
}

function sortDays(days: TournamentDay[]) {
  return [...days].sort((a, b) => a.day_order - b.day_order);
}

function splitSessionRooms(rooms: RoomData[], session: Session) {
  if (session === "overall") return rooms;

  const sorted = [...rooms].sort(
    (a, b) => a.room.room_number - b.room.room_number,
  );

  const midpoint = Math.ceil(sorted.length / 2);

  return session === "session-1"
    ? sorted.slice(0, midpoint)
    : sorted.slice(midpoint);
}

function calculateStandings(
  teams: Team[],
  rooms: RoomData[],
  allowedTeamIds?: number[],
): StandingRow[] {
  const allowed = allowedTeamIds ? new Set(allowedTeamIds) : null;

  const totals = new Map<number, StandingRow>();

  for (const team of teams) {
    if (allowed && !allowed.has(team.id)) continue;

    totals.set(team.id, {
      team,
      roomsPlayed: 0,
      placementPoints: 0,
      killPoints: 0,
      totalPoints: 0,
    });
  }

  for (const room of rooms) {
    for (const result of room.results) {
      const standing = totals.get(result.team_id);
      if (!standing) continue;

      standing.roomsPlayed += 1;
      standing.placementPoints += result.placement_points;
      standing.killPoints += result.kill_points;
      standing.totalPoints += result.total_points;
    }
  }

  return [...totals.values()].sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.placementPoints - a.placementPoints ||
      b.killPoints - a.killPoints ||
      a.team.name.localeCompare(b.team.name),
  );
}

function SelectButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 border px-4 py-2 font-stat text-xs font-bold uppercase tracking-wider transition-colors ${
        active
          ? "border-ember bg-ember text-char"
          : "border-bone/10 bg-char-2 text-ash hover:border-bone/30 hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

export default function StandingsExperience({
  tournamentId,
}: {
  tournamentId: number;
}) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [days, setDays] = useState<TournamentDay[]>([]);
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stage, setStage] = useState<Stage>("knockout");
  const [phase, setPhase] = useState<Phase>("phase-1");
  const [week, setWeek] = useState<Week>("week-1");
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [session, setSession] = useState<Session>("overall");
  const [viewMode, setViewMode] = useState<ViewMode>("overall");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [loadedTeams, loadedDays] = await Promise.all([
        getTeams(tournamentId),
        getDays(tournamentId),
      ]);

      const orderedDays = sortDays(loadedDays);

      const loadedDayData = await Promise.all(
        orderedDays.map(async (day): Promise<DayData> => {
          const [rooms, dayTeams] = await Promise.all([
            getRooms(day.id),
            getDayTeams(day.id),
          ]);

          const loadedRooms = await Promise.all(
            [...rooms]
              .sort((a, b) => a.room_number - b.room_number)
              .map(async (room): Promise<RoomData> => ({
                room,
                results: await getRoomResults(room.id),
              })),
          );

          const teamIds = [
            ...new Set(
              (dayTeams as DayTeam[])
                .map((item) => item.team_id)
                .filter((id) => Number.isFinite(id)),
            ),
          ];

          return {
            day,
            rooms: loadedRooms,
            teamIds,
          };
        }),
      );

      setTeams(loadedTeams);
      setDays(orderedDays);
      setDayData(loadedDayData);

      const firstPhaseOneDay = orderedDays.find(
        (day) => getStage(day) === "knockout" && getPhase(day) === "phase-1",
      );

      setSelectedDayId(firstPhaseOneDay?.id ?? null);
    } catch (err) {
      console.error("Failed to load standings:", err);
      setError("Unable to load placements. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stageDays = useMemo(
    () => dayData.filter(({ day }) => getStage(day) === stage),
    [dayData, stage],
  );

  const phaseDays = useMemo(() => {
    if (stage !== "knockout") return stageDays;

    return stageDays.filter(({ day }) => getPhase(day) === phase);
  }, [stage, phase, stageDays]);

  const weekDays = useMemo(() => {
    if (stage !== "knockout") return phaseDays;

    return phaseDays.filter(({ day }) => getWeek(day) === week);
  }, [stage, phaseDays, week]);

  const selectedDay = useMemo(
    () => dayData.find(({ day }) => day.id === selectedDayId) ?? null,
    [dayData, selectedDayId],
  );

  useEffect(() => {
    if (weekDays.length === 0) {
      setSelectedDayId(null);
      return;
    }

    const selectedDayExists = weekDays.some(
      ({ day }) => day.id === selectedDayId,
    );

    if (!selectedDayExists) {
      setSelectedDayId(weekDays[0].day.id);
    }
  }, [weekDays, selectedDayId]);

  const allPhaseOneDays = useMemo(
    () =>
      dayData.filter(
        ({ day }) =>
          getStage(day) === "knockout" && getPhase(day) === "phase-1",
      ),
    [dayData],
  );

  const allPhaseTwoDays = useMemo(
    () =>
      dayData.filter(
        ({ day }) =>
          getStage(day) === "knockout" && getPhase(day) === "phase-2",
      ),
    [dayData],
  );

  const activeRows = useMemo(() => {
    let sourceDays: DayData[] = [];
    let allowedTeamIds: number[] | undefined;
    let rooms: RoomData[] = [];

    if (stage === "knockout" && phase === "phase-1") {
      if (viewMode === "overall") {
        sourceDays = allPhaseOneDays;
      } else if (selectedDay) {
        sourceDays = [selectedDay];
      }
    } else if (stage === "knockout" && phase === "phase-2") {
      if (viewMode === "overall") {
        sourceDays = allPhaseTwoDays;
      } else if (selectedDay) {
        sourceDays = [selectedDay];
      }

      const participantIds = new Set(
        sourceDays.flatMap((item) => item.teamIds),
      );

      if (participantIds.size > 0) {
        allowedTeamIds = [...participantIds];
      }
    } else {
      sourceDays = viewMode === "overall" ? stageDays : selectedDay ? [selectedDay] : [];

      const participantIds = new Set(
        sourceDays.flatMap((item) => item.teamIds),
      );

      if (participantIds.size > 0) {
        allowedTeamIds = [...participantIds];
      }
    }

    rooms = sourceDays.flatMap((item) =>
      splitSessionRooms(
        item.rooms,
        viewMode === "session" ? session : "overall",
      ),
    );

    return calculateStandings(teams, rooms, allowedTeamIds);
  }, [
    stage,
    phase,
    viewMode,
    session,
    selectedDay,
    stageDays,
    allPhaseOneDays,
    allPhaseTwoDays,
    teams,
  ]);

  function chooseStage(nextStage: Stage) {
    setStage(nextStage);
    setViewMode("overall");
    setSession("overall");

    if (nextStage === "knockout") {
      setPhase("phase-1");
      setWeek("week-1");
    }
  }

  function choosePhase(nextPhase: Phase) {
    setPhase(nextPhase);
    setWeek(nextPhase === "phase-1" ? "week-1" : "week-3");
    setViewMode("overall");
    setSession("overall");
  }

  function chooseWeek(nextWeek: Week) {
    setWeek(nextWeek);
    setViewMode("overall");
    setSession("overall");
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse bg-char-2" />
        <div className="h-12 animate-pulse bg-char-2" />
        <div className="h-80 animate-pulse bg-char-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-danger/30 bg-char-2 p-6">
        <p className="text-sm text-bone">{error}</p>
        <button
          type="button"
          onClick={() => void loadData()}
          className="mt-4 border border-ember px-4 py-2 font-stat text-xs uppercase tracking-wider text-ember"
        >
          Try again
        </button>
      </div>
    );
  }

  const visibleDayOptions =
    stage === "knockout" ? weekDays : stageDays;

  return (
    <div className="space-y-6">
      {/* STAGE */}
      <section>
        <p className="mb-2 font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
          Stage
        </p>
        <div className="flex flex-wrap gap-2">
          <SelectButton
            active={stage === "knockout"}
            onClick={() => chooseStage("knockout")}
          >
            Knockout
          </SelectButton>
          <SelectButton
            active={stage === "last-chance"}
            onClick={() => chooseStage("last-chance")}
          >
            Last Chance
          </SelectButton>
          <SelectButton
            active={stage === "grand-finals"}
            onClick={() => chooseStage("grand-finals")}
          >
            Grand Finals
          </SelectButton>
        </div>
      </section>

      {/* PHASE */}
      {stage === "knockout" && (
        <section>
          <p className="mb-2 font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
            Phase
          </p>
          <div className="flex flex-wrap gap-2">
            <SelectButton
              active={phase === "phase-1"}
              onClick={() => choosePhase("phase-1")}
            >
              Phase 1
            </SelectButton>
            <SelectButton
              active={phase === "phase-2"}
              onClick={() => choosePhase("phase-2")}
            >
              Phase 2
            </SelectButton>
          </div>
        </section>
      )}

      {/* WEEK */}
      {stage === "knockout" && (
        <section>
          <p className="mb-2 font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
            Week
          </p>
          <div className="flex flex-wrap gap-2">
            {phase === "phase-1" ? (
              <>
                <SelectButton
                  active={week === "week-1"}
                  onClick={() => chooseWeek("week-1")}
                >
                  Week 1
                </SelectButton>
                <SelectButton
                  active={week === "week-2"}
                  onClick={() => chooseWeek("week-2")}
                >
                  Week 2
                </SelectButton>
              </>
            ) : (
              <SelectButton
                active={week === "week-3"}
                onClick={() => chooseWeek("week-3")}
              >
                Week 3
              </SelectButton>
            )}
          </div>
        </section>
      )}

      {/* DAY */}
      <section>
        <p className="mb-2 font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
          Day
        </p>
        {visibleDayOptions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visibleDayOptions.map(({ day }) => (
              <SelectButton
                key={day.id}
                active={
                  viewMode !== "overall" && selectedDayId === day.id
                }
                onClick={() => {
                  setSelectedDayId(day.id);
                  setViewMode("day");
                  setSession("overall");
                }}
              >
                {day.name}
              </SelectButton>
            ))}
          </div>
        ) : (
          <p className="border border-bone/10 bg-char-2 p-4 text-sm text-ash">
            No days have been configured for this selection yet.
          </p>
        )}
      </section>

      {/* VIEW MODE */}
      <section>
        <p className="mb-2 font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
          Standings view
        </p>
        <div className="flex flex-wrap gap-2">
          <SelectButton
            active={viewMode === "overall"}
            onClick={() => {
              setViewMode("overall");
              setSession("overall");
            }}
          >
            Overall
          </SelectButton>
          <SelectButton
            active={viewMode === "day"}
            onClick={() => {
              setViewMode("day");
              setSession("overall");
            }}
          >
            Selected Day
          </SelectButton>

          {stage === "knockout" && phase === "phase-1" && (
            <>
              <SelectButton
                active={viewMode === "session" && session === "session-1"}
                onClick={() => {
                  setViewMode("session");
                  setSession("session-1");
                }}
              >
                Session 1
              </SelectButton>
              <SelectButton
                active={viewMode === "session" && session === "session-2"}
                onClick={() => {
                  setViewMode("session");
                  setSession("session-2");
                }}
              >
                Session 2
              </SelectButton>
            </>
          )}
        </div>
      </section>

      {/* TABLE */}
      <section className="overflow-hidden border border-bone/10 bg-char">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bone/10 px-4 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-black uppercase text-bone">
              {stage === "knockout"
                ? phase === "phase-1"
                  ? "Phase 1 Placements"
                  : "Phase 2 Placements"
                : stage === "last-chance"
                  ? "Last Chance Placements"
                  : "Grand Finals Placements"}
            </h2>
            <p className="mt-1 font-stat text-[10px] uppercase tracking-wider text-ash">
              {viewMode === "overall"
                ? "Cumulative standings"
                : viewMode === "session"
                  ? `${selectedDay?.day.name ?? "Selected day"} · ${session === "session-1" ? "Session 1" : "Session 2"}`
                  : selectedDay?.day.name ?? "Selected day"}
            </p>
          </div>

          <div className="font-stat text-xs uppercase tracking-wider text-ash">
            {activeRows.length} teams
          </div>
        </div>

        {activeRows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-display text-xl font-bold uppercase text-bone">
              No placements yet
            </p>
            <p className="mt-2 text-sm text-ash">
              Results will appear when match results are available.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-bone/10 bg-char-2 font-stat text-[10px] uppercase tracking-wider text-ash">
                  <th className="px-4 py-3">#</th>
                  <th className="py-3">Team</th>
                  <th className="px-3 py-3 text-right">Rooms</th>
                  <th className="px-3 py-3 text-right">Placement</th>
                  <th className="px-3 py-3 text-right">Kills</th>
                  <th className="px-4 py-3 text-right text-ember">Points</th>
                </tr>
              </thead>

              <tbody>
                {activeRows.map((row, index) => (
                  <tr
                    key={row.team.id}
                    className="border-b border-bone/5 transition-colors hover:bg-char-2"
                  >
                    <td
                      className={`px-4 py-3 font-display text-2xl font-black ${
                        index === 0 ? "text-amber" : "text-bone/50"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-char-2">
                          {row.team.logo_url ? (
                            <Image
                              src={row.team.logo_url}
                              alt={row.team.name}
                              width={36}
                              height={36}
                              className="h-9 w-9 object-contain"
                            />
                          ) : (
                            <span className="font-display text-xs font-bold text-bone/40">
                              {row.team.tag || row.team.name.slice(0, 2)}
                            </span>
                          )}
                        </div>

                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-display text-lg font-bold uppercase text-bone">
                            {row.team.name}
                          </span>
                          <span title={row.team.country || "Unknown"}>
                            {countryFlag(row.team.country)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-stat tabular-nums text-bone/70">
                      {row.roomsPlayed}
                    </td>
                    <td className="px-3 py-3 text-right font-stat tabular-nums text-bone/70">
                      {row.placementPoints}
                    </td>
                    <td className="px-3 py-3 text-right font-stat tabular-nums text-bone/70">
                      {row.killPoints}
                    </td>
                    <td className="px-4 py-3 text-right font-stat text-lg font-bold tabular-nums text-ember">
                      {row.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}