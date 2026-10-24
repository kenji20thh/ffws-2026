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
import Flag from "@/components/ui/Flag";
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
import MatchdayMenu, { type MenuSection } from "./MatchdayMenu";
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

/** "Knockout Stage - Week 1 Day 2" -> "Week 1 · Day 2" (other names just lose the prefix). */
function shortDayName(name: string) {
  const trimmed = name.replace(/^Knockout Stage\s*[-–—]\s*/i, "").trim();
  const match = trimmed.match(/^Week\s*(\d+)\s*[-–—,]?\s*Day\s*(\d+)/i);
  return match ? `Week ${match[1]} · Day ${match[2]}` : trimmed;
}

/** Label for an option inside a "Week N" group: just "Day N" when possible. */
function dayOptionLabel(name: string) {
  const match = name.match(/Day\s*(\d+)/i);
  return match ? `Day ${match[1]}` : shortDayName(name);
}

function weekLabel(week: Week) {
  return `Week ${week.replace("week-", "")}`;
}

function Chevron({ open = false }: { open?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={`h-3 w-3 shrink-0 text-ash transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 4.5 6 8.5 10 4.5" />
    </svg>
  );
}

/** Compact segmented control: one row of mutually exclusive options. */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  grow = false,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** Stretch to fill the row (used for the stage tabs on small screens). */
  grow?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex divide-x divide-bone/20 border border-bone/10 bg-char-2 ${grow ? "w-full sm:w-auto" : ""}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center gap-2 px-3 py-2 font-stat text-xs font-bold uppercase tracking-wider transition-colors ${
              grow ? "flex-1 sm:flex-none sm:px-4" : ""
            } ${
              active
                ? "bg-ember text-char"
                : "text-ash hover:bg-char-3 hover:text-bone"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Colored group letters, e.g. [A][B]. */
function GroupChips({ pair }: { pair: GroupKey[] }) {
  return (
    <span className="flex items-center gap-1">
      {pair.map((group) => (
        <span
          key={group}
          className="inline-flex h-4 w-4 items-center justify-center font-stat text-[0.5625rem] font-bold text-char"
          style={{ backgroundColor: GROUP_BY_KEY[group].color }}
        >
          {group}
        </span>
      ))}
    </span>
  );
}

/** A closed-by-default block for explanations. */
function Collapsible({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="border border-bone/10 bg-char">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-char-2"
      >
        <span className="min-w-0 truncate">
          <span className="font-stat text-xs font-bold uppercase tracking-wider text-bone">
            {title}
          </span>
          {subtitle && (
            <span className="ml-2 font-stat text-[0.625rem] uppercase tracking-wider text-ash">
              {subtitle}
            </span>
          )}
        </span>
        <Chevron open={open} />
      </button>

      {open && <div className="border-t border-bone/10 p-4">{children}</div>}
    </section>
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

  function chooseOverall() {
    setViewMode("overall");
    setSession("overall");
  }

  function chooseWeekOverall(nextWeek: Week) {
    setWeek(nextWeek);
    setViewMode("week");
    setSession("overall");
  }

  function chooseDay(dayId: number) {
    const picked = dayData.find(({ day }) => day.id === dayId);

    // The matchday dropdown lists every week of the phase, so keep the week in sync.
    if (picked) setWeek(getWeek(picked.day));

    setSelectedDayId(dayId);
    setViewMode("day");
    setSession("overall");
  }

  function chooseSessionView(next: "all" | "session-1" | "session-2") {
    if (next === "all") {
      setViewMode("day");
      setSession("overall");
      return;
    }

    setViewMode("session");
    setSession(next);
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

  // ----- compact navigation helpers -----
  const dayLabel = selectedDay ? shortDayName(selectedDay.day.name) : "Matchday";

  const showSessionControl =
    isPhaseOne &&
    (viewMode === "day" || viewMode === "session") &&
    selectedDay !== null &&
    selectedDayIsVisible;

  // matchday dropdown: days of the chosen phase, grouped by week
  const dayOptionGroups = phaseDays.reduce<{ week: Week; days: TournamentDay[] }[]>(
    (groups, { day }) => {
      const dayWeek = getWeek(day);
      const existing = groups.find((group) => group.week === dayWeek);
      if (existing) existing.days.push(day);
      else groups.push({ week: dayWeek, days: [day] });
      return groups;
    },
    [],
  );

  const matchdayValue =
    viewMode === "overall" && isPhaseOne
      ? "overall"
      : viewMode === "week" && isPhaseOne
        ? `week:${week}`
        : selectedDayId !== null
          ? String(selectedDayId)
          : "";

  const menuSections: MenuSection[] = [
    ...(isPhaseOne && phaseDays.length > 0
      ? [
          {
            key: "phase",
            items: [
              {
                value: "overall",
                label: "Phase 1 · Overall",
                display: "Phase 1 · Overall",
                hint: "24 teams",
                strong: true,
              },
            ],
          },
        ]
      : []),
    ...dayOptionGroups.map((group) => ({
      key: group.week,
      label: weekLabel(group.week),
      items: [
        // Phase 1 weeks can be viewed as a cumulative table of their matchdays.
        ...(isPhaseOne
          ? [
              {
                value: `week:${group.week}`,
                label: "Overall",
                display: `${weekLabel(group.week)} · Overall`,
                hint: `${group.days.length} days`,
                strong: true,
              },
            ]
          : []),
        ...group.days.map((day) => ({
          value: String(day.id),
          label: dayOptionLabel(day.name),
          display: shortDayName(day.name),
        })),
      ],
    })),
  ];

  function onMatchdayChange(value: string) {
    if (value === "overall") chooseOverall();
    else if (value.startsWith("week:")) chooseWeekOverall(value.slice(5) as Week);
    else chooseDay(Number(value));
  }

  const lineupDay = showSessionControl && selectedDay ? selectedDay.day : null;

  // single heading for the table card
  let viewTitle: string;
  if (stage === "last-chance") {
    viewTitle = viewMode === "overall" ? "Last Chance" : dayLabel;
  } else if (stage === "grand-finals") {
    viewTitle = viewMode === "overall" ? "Grand Finals" : dayLabel;
  } else if (viewMode === "overall") {
    viewTitle = `${isPhaseOne ? "Phase 1" : "Phase 2"} · Overall`;
  } else if (viewMode === "week") {
    viewTitle = `${weekLabel(week)} · Overall`;
  } else if (viewMode === "session") {
    viewTitle = `${dayLabel} · ${session === "session-1" ? "Session 1" : "Session 2"}`;
  } else {
    viewTitle = dayLabel;
  }

  return (
    <div className="space-y-4">
      {/* STAGE */}
      <Segmented
        ariaLabel="Stage"
        grow
        value={stage}
        onChange={chooseStage}
        options={[
          { value: "knockout", label: "Knockout" },
          { value: "last-chance", label: "Last Chance" },
          { value: "grand-finals", label: "Grand Finals" },
        ]}
      />

      {/* KNOCKOUT ONLY: PHASE, MATCHDAY, SESSION */}
      {stage === "knockout" && (
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            ariaLabel="Phase"
            value={phase}
            onChange={choosePhase}
            options={[
              { value: "phase-1", label: "Phase 1" },
              { value: "phase-2", label: "Phase 2" },
            ]}
          />

          <MatchdayMenu
            ariaLabel="Matchday"
            sections={menuSections}
            value={matchdayValue}
            onChange={onMatchdayChange}
            disabled={phaseDays.length === 0}
            placeholder="No matchdays yet"
          />

          {showSessionControl && lineupDay && (
            <Segmented
              ariaLabel="Session"
              value={viewMode === "session" ? session : "all"}
              onChange={(next) =>
                chooseSessionView(next as "all" | "session-1" | "session-2")
              }
              options={[
                { value: "all", label: "Both" },
                ...(["session-1", "session-2"] as const).map((key) => {
                  const pair = sessionGroups(lineupDay.day_order, key);
                  return {
                    value: key,
                    label: (
                      <>
                        {key === "session-1" ? "Session 1" : "Session 2"}
                        {pair && <GroupChips pair={pair} />}
                      </>
                    ),
                  };
                }),
              ]}
            />
          )}
        </div>
      )}

      {/* FORMAT / QUALIFICATION (collapsed by default) */}
      {(activeDef || lineupDay) && (
        <Collapsible
          title={activeDef ? "Format & qualification" : "Session lineup"}
          subtitle={
            activeDef ? `${activeDef.title} · ${activeDef.date}` : dayLabel
          }
        >
          <div className="space-y-4">
            {lineupDay && (
              <SessionLineup
                day={lineupDay}
                active={viewMode === "session" ? session : null}
              />
            )}

            {activeDef && <StageRules def={activeDef} />}
          </div>
        </Collapsible>
      )}

      {/* STANDINGS TABLE */}
      <section className="overflow-hidden border border-bone/10 bg-char">
        <div className="flex items-center justify-between gap-3 border-b border-bone/10 px-4 py-3 sm:px-6">
          <h2 className="min-w-0 truncate font-display text-lg font-black uppercase text-bone sm:text-xl">
            {viewTitle}
          </h2>

          <span className="shrink-0 font-stat text-xs uppercase tracking-wider text-ash">
            {activeRows.length} teams
          </span>
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
            <table className="w-full min-w-[47.5rem] text-left">
              <thead>
                <tr className="border-b border-bone/10 bg-char-2 font-stat text-[0.625rem] uppercase tracking-wider text-ash">
                  <th className="px-4 py-3">#</th>
                  <th className="py-3">Team</th>
                  {showGroup && <th className="px-3 py-3">Grp</th>}
                  <th className="px-3 py-3 text-right">Rooms</th>
                  <th className="px-3 py-3 text-right">Place</th>
                  <th className="px-3 py-3 text-right">Kills</th>
                  <th className="px-4 py-3 text-right text-ember">Pts</th>
                  {showQualification && (
                    <th className="px-4 py-3">Advances</th>
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
                              <Flag country={row.team.country} height={16} />
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
                              className="inline-flex h-6 min-w-6 items-center justify-center px-1.5 font-stat text-[0.625rem] font-bold uppercase text-char"
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
                              className="font-stat text-[0.625rem] font-bold uppercase tracking-wider"
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
            <span className="font-stat text-[0.625rem] uppercase tracking-widest text-ash">
              Session {index + 1}
            </span>

            <span className="flex items-center gap-1.5">
              {pair.map((group, groupIndex) => (
                <span key={group} className="flex items-center gap-1.5">
                  {groupIndex === 1 && (
                    <span className="text-xs text-ash">×</span>
                  )}

                  <span
                    className="inline-flex h-6 items-center px-2 font-stat text-[0.625rem] font-bold uppercase text-char"
                    style={{
                      backgroundColor: GROUP_BY_KEY[group].color,
                    }}
                  >
                    Group {group}
                  </span>
                </span>
              ))}

              <span className="ml-1 font-stat text-[0.625rem] text-ash">
                12 teams
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
