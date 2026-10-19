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
import {
  GROUP_BY_KEY,
  groupForTeam,
  GRAND_FINAL,
  LAST_CHANCE,
  PHASE_ONE_OVERALL,
  TONE_COLOR,
  outcomeForRank,
  phaseOneSlot,
  sessionGroups,
  stageDefForDay,
  type GroupKey,
  type StageDef,
} from "@/lib/tournamentFormat";
import { StageRules } from "@/components/schedule/StageRules";
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
type ViewMode = "overall" | "week" | "day" | "session";

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
  /** null = team not known yet (shown as TBA). */
  team: Team | null;
  group?: GroupKey;
  roomsPlayed: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
};

function isLastChance(day: TournamentDay) {
  return day.name.toLowerCase().includes("last chance");
}

function isGrandFinal(day: TournamentDay) {
  return day.name.toLowerCase().includes("grand final");
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

/** Resolve the qualification rules for the current standings view. */
function resolveDef(
  stage: Stage,
  phase: Phase,
  viewMode: ViewMode,
  day: TournamentDay | null,
): StageDef | null {
  if (stage === "knockout" && phase === "phase-1") {
    return viewMode === "overall" ? PHASE_ONE_OVERALL : null;
  }

  if (stage === "knockout") {
    return viewMode !== "overall" && day
      ? (stageDefForDay(day) ?? null)
      : null;
  }

  return stage === "last-chance" ? LAST_CHANCE : GRAND_FINAL;
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
      group: groupForTeam(team),
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
      (a.team?.name ?? "").localeCompare(b.team?.name ?? ""),
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
      aria-pressed={active}
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

function NavigationSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
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

    const isPhaseOne = stage === "knockout" && phase === "phase-1";
    const sessionKey =
      viewMode === "session" && session !== "overall" ? session : null;

    if (isPhaseOne) {
      if (viewMode === "overall") {
        // All six Phase 1 matchdays contribute to the 24-team overall table.
        sourceDays = allPhaseOneDays;
      } else if (viewMode === "week") {
        sourceDays = weekDays;
      } else if (selectedDay) {
        sourceDays = [selectedDay];
      }
    } else if (stage === "knockout") {
      if (viewMode === "overall") {
        sourceDays = allPhaseTwoDays;
      } else if (selectedDay) {
        sourceDays = [selectedDay];
      }

      const participantIds = new Set(
        sourceDays.flatMap((item) => item.teamIds),
      );

      // Phase 2 contains only teams assigned to its matchdays.
      allowedTeamIds = [...participantIds];
    } else {
      sourceDays =
        viewMode === "overall" ? stageDays : selectedDay ? [selectedDay] : [];

      const participantIds = new Set(
        sourceDays.flatMap((item) => item.teamIds),
      );

      allowedTeamIds = [...participantIds];
    }

    const rooms = sourceDays.flatMap((item) =>
      splitSessionRooms(item.rooms, sessionKey ?? "overall"),
    );

    // Phase 1 sessions contain the two groups assigned to that session.
    if (isPhaseOne && sessionKey && selectedDay) {
      const pair = sessionGroups(selectedDay.day.day_order, sessionKey);
      const groupIds = pair
        ? teams
            .filter((team) => {
              const group = groupForTeam(team);
              return group !== undefined && pair.includes(group);
            })
            .map((team) => team.id)
        : [];

      if (groupIds.length === 12) {
        allowedTeamIds = groupIds;
      } else {
        // Fallback if team names do not match the configured group list.
        const played = new Set(
          rooms.flatMap((room) =>
            room.results.map((result) => result.team_id),
          ),
        );

        if (played.size > 0) {
          allowedTeamIds = [...played];
        }
      }
    }

    const rows = calculateStandings(teams, rooms, allowedTeamIds);

    // Keep unknown qualification slots visible as TBA.
    const def = resolveDef(stage, phase, viewMode, selectedDay?.day ?? null);

    if (def && !isPhaseOne) {
      while (rows.length < def.size) {
        rows.push({
          team: null,
          roomsPlayed: 0,
          placementPoints: 0,
          killPoints: 0,
          totalPoints: 0,
        });
      }
    }

    return rows;
  }, [
    stage,
    phase,
    viewMode,
    session,
    selectedDay,
    stageDays,
    weekDays,
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
    setViewMode(nextPhase === "phase-1" ? "overall" : "day");
    setSession("overall");
  }

  function chooseWeek(nextWeek: Week) {
    setWeek(nextWeek);
    setViewMode(phase === "phase-1" ? "day" : "day");
    setSession("overall");
  }

  function chooseDay(dayId: number) {
    setSelectedDayId(dayId);
    setViewMode("day");
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

  const isPhaseOne = stage === "knockout" && phase === "phase-1";
  const isPhaseTwo = stage === "knockout" && phase === "phase-2";

  const activeDef = resolveDef(
    stage,
    phase,
    viewMode,
    selectedDay?.day ?? null,
  );

  const showQualification = activeDef !== null;
  const showGroup = isPhaseOne;
  const anyResults = activeRows.some(
    (row) => row.team && row.roomsPlayed > 0,
  );

  const selectedDayIsVisible = weekDays.some(
    ({ day }) => day.id === selectedDayId,
  );

  return (
    <div className="space-y-6">
      {/* MAIN STAGES */}
      <section>
        <NavigationSection title="Tournament Stage">
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
        </NavigationSection>
      </section>

      {/* KNOCKOUT: PHASES, WEEKS AND MATCHDAYS */}
      {stage === "knockout" && (
        <section className="space-y-5 border-l-2 border-ember/40 pl-4">
          <NavigationSection title="Phase">
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
          </NavigationSection>

          {isPhaseOne && (
            <>
              <NavigationSection title="Week">
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
              </NavigationSection>

              <NavigationSection title="Phase 1 Standings">
                <SelectButton
                  active={viewMode === "overall"}
                  onClick={() => {
                    setViewMode("overall");
                    setSession("overall");
                  }}
                >
                  Overall · 24 Teams
                </SelectButton>
              </NavigationSection>
            </>
          )}

          {isPhaseTwo && (
            <NavigationSection title="Week">
              <SelectButton
                active={week === "week-3"}
                onClick={() => chooseWeek("week-3")}
              >
                Week 3
              </SelectButton>
            </NavigationSection>
          )}

          <NavigationSection
            title={isPhaseOne ? "Matchdays" : "Week 3 Matchdays"}
          >
            {weekDays.length > 0 ? (
              weekDays.map(({ day }) => (
                <SelectButton
                  key={day.id}
                  active={
                    selectedDayId === day.id &&
                    (viewMode === "day" || viewMode === "session")
                  }
                  onClick={() => chooseDay(day.id)}
                >
                  {day.name}
                </SelectButton>
              ))
            ) : (
              <p className="border border-bone/10 bg-char-2 p-3 text-sm text-ash">
                No matchdays configured for this selection yet.
              </p>
            )}
          </NavigationSection>

          {/* MATCHDAY VIEWS: PHASE 1 HAS 24-TEAM OVERALL AND TWO SESSIONS */}
          {selectedDay && selectedDayIsVisible && (
            <div className="space-y-3 border-l border-bone/10 pl-4">
              <NavigationSection title={`${selectedDay.day.name} Standings`}>
                <SelectButton
                  active={viewMode === "day"}
                  onClick={() => {
                    setViewMode("day");
                    setSession("overall");
                  }}
                >
                  Overall
                  {isPhaseOne ? " · 24 Teams" : ""}
                </SelectButton>

                {isPhaseOne && (
                  <>
                    <SelectButton
                      active={
                        viewMode === "session" && session === "session-1"
                      }
                      onClick={() => {
                        setViewMode("session");
                        setSession("session-1");
                      }}
                    >
                      Session 1
                    </SelectButton>

                    <SelectButton
                      active={
                        viewMode === "session" && session === "session-2"
                      }
                      onClick={() => {
                        setViewMode("session");
                        setSession("session-2");
                      }}
                    >
                      Session 2
                    </SelectButton>
                  </>
                )}
              </NavigationSection>

              {isPhaseOne && (
                <SessionLineup
                  day={selectedDay.day}
                  active={viewMode === "session" ? session : null}
                />
              )}
            </div>
          )}
        </section>
      )}

      {/* LAST CHANCE AND GRAND FINALS */}
      {stage !== "knockout" && (
        <section className="border-l-2 border-ember/40 pl-4">
          <NavigationSection title="Standings">
            <SelectButton
              active={viewMode === "overall"}
              onClick={() => {
                setViewMode("overall");
                setSession("overall");
              }}
            >
              Overall
            </SelectButton>
          </NavigationSection>
        </section>
      )}

      {/* QUALIFICATION RULES */}
      {activeDef && (
        <section>
          <p className="mb-2 font-stat text-[10px] uppercase tracking-[0.2em] text-ash">
            {activeDef.title} · {activeDef.date}
          </p>
          <StageRules def={activeDef} />
        </section>
      )}

      {/* STANDINGS TABLE */}
      <section className="overflow-hidden border border-bone/10 bg-char">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bone/10 px-4 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-black uppercase text-bone">
              {stage === "knockout"
                ? isPhaseOne
                  ? "Phase 1 Placements"
                  : "Phase 2 Placements"
                : stage === "last-chance"
                  ? "Last Chance Placements"
                  : "Grand Finals Placements"}
            </h2>

            <p className="mt-1 font-stat text-[10px] uppercase tracking-wider text-ash">
              {viewMode === "overall"
                ? isPhaseOne
                  ? "Phase 1 · All matchdays · 24 teams"
                  : "Cumulative standings"
                : viewMode === "week"
                  ? `${week === "week-1" ? "Week 1" : "Week 2"} · cumulative standings`
                  : viewMode === "session"
                    ? `${selectedDay?.day.name ?? "Selected matchday"} · ${
                        session === "session-1" ? "Session 1" : "Session 2"
                      }`
                    : selectedDay?.day.name ?? "Selected matchday"}
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
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-bone/10 bg-char-2 font-stat text-[10px] uppercase tracking-wider text-ash">
                  <th className="px-4 py-3">#</th>
                  <th className="py-3">Team</th>
                  {showGroup && <th className="px-3 py-3">Group</th>}
                  <th className="px-3 py-3 text-right">Rooms</th>
                  <th className="px-3 py-3 text-right">Placement</th>
                  <th className="px-3 py-3 text-right">Kills</th>
                  <th className="px-4 py-3 text-right text-ember">Points</th>
                  {showQualification && (
                    <th className="px-4 py-3">Advances to</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {activeRows.map((row, index) => {
                  const qualification = activeDef
                    ? outcomeForRank(activeDef, index + 1)
                    : null;

                  const previous =
                    activeDef && index > 0
                      ? outcomeForRank(activeDef, index)
                      : null;

                  const cutLine =
                    qualification &&
                    previous &&
                    qualification.label !== previous.label;

                  const colored =
                    qualification !== null && (!row.team || anyResults);

                  const color = qualification
                    ? TONE_COLOR[qualification.tone]
                    : undefined;

                  return (
                    <tr
                      key={row.team?.id ?? `tba-${index}`}
                      className={`border-b border-bone/5 transition-colors hover:bg-char-2 ${
                        cutLine ? "border-t-2 border-t-bone/20" : ""
                      }`}
                      style={
                        colored && color
                          ? {
                              backgroundColor: `${color}12`,
                              boxShadow: `inset 4px 0 0 ${color}`,
                            }
                          : undefined
                      }
                    >
                      <td
                        className={`px-4 py-3 font-display text-2xl font-black ${
                          index === 0 ? "text-amber" : "text-bone/50"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      <td className="py-3">
                        {row.team ? (
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
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-dashed border-bone/20 bg-char-2 font-display text-sm font-black text-bone/30">
                              ?
                            </div>
                            <span className="font-display text-lg font-bold uppercase text-bone/40">
                              TBA
                            </span>
                          </div>
                        )}
                      </td>

                      {showGroup && (
                        <td className="px-3 py-3">
                          {row.group ? (
                            <span
                              className="inline-flex h-6 min-w-6 items-center justify-center px-1.5 font-stat text-[10px] font-bold uppercase text-char"
                              style={{
                                backgroundColor: GROUP_BY_KEY[row.group].color,
                              }}
                            >
                              {row.group}
                            </span>
                          ) : (
                            <span className="text-bone/30">—</span>
                          )}
                        </td>
                      )}

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

                      {showQualification && (
                        <td className="px-4 py-3">
                          {qualification && (
                            <span
                              className="font-stat text-[10px] font-bold uppercase tracking-wider"
                              style={{
                                color: colored ? color : undefined,
                                opacity: colored ? 1 : 0.6,
                              }}
                            >
                              {qualification.label}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/** Shows which group pairs play each session of a Phase 1 matchday. */
function SessionLineup({
  day,
  active,
}: {
  day: TournamentDay;
  active: Session | null;
}) {
  const slot = phaseOneSlot(day.day_order);
  if (!slot) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {(["session-1", "session-2"] as const).map((key, index) => {
        const pair = sessionGroups(day.day_order, key);
        if (!pair) return null;

        const isActive = active === key;

        return (
          <div
            key={key}
            className={`flex items-center justify-between gap-3 border px-3 py-2 ${
              isActive
                ? "border-ember bg-char-2"
                : "border-bone/10 bg-char"
            }`}
          >
            <span className="font-stat text-[10px] uppercase tracking-widest text-ash">
              {day.name} · Session {index + 1}
            </span>

            <span className="flex items-center gap-1.5">
              {pair.map((group, groupIndex) => (
                <span key={group} className="flex items-center gap-1.5">
                  {groupIndex === 1 && (
                    <span className="text-xs text-ash">×</span>
                  )}

                  <span
                    className="inline-flex h-6 items-center px-2 font-stat text-[10px] font-bold uppercase text-char"
                    style={{
                      backgroundColor: GROUP_BY_KEY[group].color,
                    }}
                  >
                    Group {group}
                  </span>
                </span>
              ))}

              <span className="ml-1 font-stat text-[10px] text-ash">
                12 teams
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
