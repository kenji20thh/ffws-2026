
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { countryFlag } from "@/lib/flags";
import {
  getDays,
  getRoomResults,
  getRooms,
  getTeams,
  getTournament,
} from "@/lib/api";
import type {
  RoomTeamSummary,
  Team,
  TournamentDay,
} from "@/types";

type Stage = "knockout" | "last-chance" | "grand-final";
type Phase = "phase1" | "phase2";
type View = "overall" | "session1" | "session2" | "day";

type PlacementRow = {
  team_id: number;
  team_name: string;
  logo_url: string;
  country: string;
  rooms_played: number;
  placement_points: number;
  kill_points: number;
  total_points: number;
};

type DayResults = {
  day: TournamentDay;
  teamIds: number[];
  results: RoomTeamSummary[];
};

const SESSION_1 = [
  "LYON",
  "Team Flash",
  "ONIC Olympus",
  "LOS Grandes",
  "Horaa Esports",
  "XPROJEKT Esports",
  "Bigetron by Vitality",
  "Blue Cheese",
  "P Esports",
  "Resurrection Esports",
  "Pirate Esports",
  "ParadoX Gaming",
];

const SESSION_2 = [
  "LOUD GG",
  "Team Apex Gaming",
  "GOW",
  "RRQ Kazu",
  "Gun Dynasty",
  "Total Winner Esports",
  "Team Infinity",
  "All Gamers Global",
  "Buriram United Esports",
  "TSG Pros",
  "Stellar Esports",
  "FLUXO",
];

function getStage(day: TournamentDay): Stage {
  const name = day.name.toLowerCase();

  if (name.includes("last chance")) return "last-chance";
  if (name.includes("grand final")) return "grand-final";

  return "knockout";
}

function getPhase(day: TournamentDay): Phase {
  return day.day_order <= 6 ? "phase1" : "phase2";
}

function sortRows(rows: PlacementRow[]) {
  return [...rows].sort(
    (a, b) =>
      b.total_points - a.total_points ||
      b.placement_points - a.placement_points ||
      b.kill_points - a.kill_points ||
      a.team_name.localeCompare(b.team_name),
  );
}

function calculateRows(
  teams: Team[],
  results: RoomTeamSummary[],
  allowedTeamIds?: Set<number>,
): PlacementRow[] {
  const rows = new Map<number, PlacementRow>();

  for (const team of teams) {
    if (allowedTeamIds && !allowedTeamIds.has(team.id)) continue;

    rows.set(team.id, {
      team_id: team.id,
      team_name: team.name,
      logo_url: team.logo_url ?? "",
      country: team.country ?? "",
      rooms_played: 0,
      placement_points: 0,
      kill_points: 0,
      total_points: 0,
    });
  }

  for (const result of results) {
    const row = rows.get(result.team_id);
    if (!row) continue;

    row.rooms_played += 1;
    row.placement_points += result.placement_points;
    row.kill_points += result.kill_points;
    row.total_points += result.total_points;
  }

  return sortRows(Array.from(rows.values()));
}

function formatDate(date: string) {
  if (!date) return "";

  const parsed = new Date(`${date.slice(0, 10)}T12:00:00Z`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default function StandingsExperience() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [days, setDays] = useState<TournamentDay[]>([]);
  const [dayResults, setDayResults] = useState<DayResults[]>([]);
  const [stage, setStage] = useState<Stage>("knockout");
  const [phase, setPhase] = useState<Phase>("phase1");
  const [view, setView] = useState<View>("overall");
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const tournament = await getTournament("ffws-2026");

        const [loadedTeams, loadedDays] = await Promise.all([
          getTeams(tournament.id),
          getDays(tournament.id),
        ]);

        const orderedDays = [...loadedDays].sort(
          (a, b) => a.day_order - b.day_order,
        );

        const loadedResults = await Promise.all(
          orderedDays.map(async (day): Promise<DayResults> => {
            const [rooms] = await Promise.all([getRooms(day.id)]);

            const roomResults = await Promise.all(
              rooms.map((room) => getRoomResults(room.id)),
            );

            const teamIds = new Set<number>();

            return {
              day,
              teamIds: Array.from(teamIds),
              results: roomResults.flat(),
            };
          }),
        );

        if (cancelled) return;

        setTeams(loadedTeams);
        setDays(orderedDays);
        setDayResults(loadedResults);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load placements",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const knockoutDays = useMemo(
    () => days.filter((day) => getStage(day) === "knockout"),
    [days],
  );

  const phase1Days = knockoutDays.filter(
    (day) => getPhase(day) === "phase1",
  );

  const phase2Days = knockoutDays.filter(
    (day) => getPhase(day) === "phase2",
  );

  const activeDays =
    stage === "knockout"
      ? phase === "phase1"
        ? phase1Days
        : phase2Days
      : days.filter((day) => getStage(day) === stage);

  const activeDay = activeDays.find((day) => day.id === selectedDayId);

  const selectedResults = dayResults.filter((entry) => {
    if (stage === "knockout") {
      return (
        getStage(entry.day) === "knockout" &&
        getPhase(entry.day) === phase
      );
    }

    return getStage(entry.day) === stage;
  });

  const allResults = selectedResults.flatMap((entry) => entry.results);

  const sessionNames =
    view === "session1"
      ? SESSION_1
      : view === "session2"
        ? SESSION_2
        : null;

  const sessionIds = sessionNames
    ? new Set(
        teams
          .filter((team) => sessionNames.includes(team.name))
          .map((team) => team.id),
      )
    : undefined;

  const activeResults =
    view === "day" && activeDay
      ? dayResults
          .filter((entry) => entry.day.id === activeDay.id)
          .flatMap((entry) => entry.results)
      : allResults;

  const rows = useMemo(() => {
    const selectedTeamIds =
      stage !== "knockout" || phase === "phase2"
        ? activeDay
          ? new Set(
              teams
                .filter((team) =>
                  dayResults
                    .find((entry) => entry.day.id === activeDay.id)
                    ?.teamIds.includes(team.id),
                )
                .map((team) => team.id),
            )
          : undefined
        : sessionIds;

    return calculateRows(teams, activeResults, selectedTeamIds);
  }, [
    teams,
    activeResults,
    stage,
    phase,
    activeDay,
    dayResults,
    sessionIds,
  ]);

  function chooseStage(nextStage: Stage) {
    setStage(nextStage);
    setPhase("phase1");
    setView("overall");
    setSelectedDayId(null);
  }

  function choosePhase(nextPhase: Phase) {
    setPhase(nextPhase);
    setView("overall");
    setSelectedDayId(null);
  }

  function chooseView(nextView: View) {
    setView(nextView);

    if (nextView === "day" && activeDays.length > 0) {
      setSelectedDayId(activeDays[0].id);
    } else {
      setSelectedDayId(null);
    }
  }

  const tableRows =
    view === "overall" && stage === "knockout" && phase === "phase1"
      ? calculateRows(teams, allResults)
      : rows;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-bone/10">
        {(
          [
            ["knockout", "Knockout Stage"],
            ["last-chance", "Last Chance"],
            ["grand-final", "Grand Finals"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => chooseStage(value)}
            className={`border-b-2 px-4 py-4 font-stat text-xs font-bold uppercase tracking-widest transition ${
              stage === value
                ? "border-ember text-ember"
                : "border-transparent text-bone/45 hover:text-bone"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {stage === "knockout" && (
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["phase1", "Phase 1 · Nov 6–15"],
              ["phase2", "Phase 2 · Nov 19–22"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => choosePhase(value)}
              className={`border px-4 py-3 font-display text-sm font-bold uppercase transition ${
                phase === value
                  ? "border-ember bg-ember text-char"
                  : "border-char-3 bg-char-2 text-bone hover:border-ember/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-display text-2xl font-black uppercase text-bone sm:text-3xl">
          {stage === "knockout"
            ? phase === "phase1"
              ? "Phase 1 Placements"
              : "Phase 2 Placements"
            : stage === "last-chance"
              ? "Last Chance Placements"
              : "Grand Finals Placements"}
        </h2>

        <p className="text-sm leading-6 text-ash">
          {stage === "knockout" && phase === "phase1"
            ? "Follow the standings across the six Phase 1 matchdays. Switch between the overall table and the two configured sessions."
            : "Placements are calculated from the saved room results for the selected stage."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["overall", "Overall"],
            ...(stage === "knockout" && phase === "phase1"
              ? [
                  ["session1", "Session 1"],
                  ["session2", "Session 2"],
                ]
              : []),
            ["day", "Matchday"],
          ] as [View, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => chooseView(value)}
            className={`border px-4 py-2.5 font-stat text-xs font-bold uppercase tracking-widest transition ${
              view === value
                ? "border-ember bg-ember text-char"
                : "border-char-3 text-bone/60 hover:border-ember/60 hover:text-bone"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "day" && (
        <div className="flex flex-wrap gap-2">
          {activeDays.length === 0 ? (
            <p className="text-sm text-ash">No matchdays have been configured.</p>
          ) : (
            activeDays.map((day) => (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedDayId(day.id)}
                className={`border px-3 py-2 text-left transition ${
                  selectedDayId === day.id
                    ? "border-ember bg-char-2 text-ember"
                    : "border-char-3 text-bone/60 hover:border-ember/50"
                }`}
              >
                <span className="block font-display text-sm font-bold uppercase">
                  {day.name}
                </span>
                <span className="font-stat text-[10px] uppercase tracking-widest text-ash">
                  {formatDate(day.date)}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {stage === "knockout" &&
        phase === "phase1" &&
        (view === "session1" || view === "session2") && (
          <p className="border-l-2 border-ember pl-3 text-xs leading-5 text-ash">
            {view === "session1"
              ? "Session 1 roster: Groups A and B from the configured schedule."
              : "Session 2 roster: Groups C and D from the configured schedule."}
            {" "}These are hardcoded team assignments, not automatically inferred from room data.
          </p>
        )}

      {view === "day" && !activeDay ? (
        <EmptyState
          title="Select a matchday"
          hint="Choose a configured matchday to view its results."
        />
      ) : (
        <StandingsTable rows={tableRows} />
      )}
    </div>
  );
}

function StandingsTable({ rows }: { rows: PlacementRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No results yet"
        hint="Placements appear here when room results have been submitted."
      />
    );
  }

  return (
    <div className="overflow-x-auto border border-char-3">
      <table className="w-full min-w-[650px] text-left">
        <thead>
          <tr className="border-b border-bone/15 bg-char-2 font-stat text-[10px] uppercase tracking-widest text-ash">
            <th className="px-3 py-4">#</th>
            <th className="py-4">Team</th>
            <th className="px-3 py-4 text-right">Rooms</th>
            <th className="px-3 py-4 text-right">Place</th>
            <th className="px-3 py-4 text-right">Kills</th>
            <th className="px-4 py-4 text-right text-ember">Total</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.team_id}
              className="border-b border-bone/5 transition-colors hover:bg-char-2"
            >
              <td
                className={`px-3 py-3 font-display text-2xl font-black ${
                  index === 0 ? "text-amber" : "text-bone/60"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </td>

              <td className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-char-2">
                    {row.logo_url ? (
                      <Image
                        src={row.logo_url}
                        alt={row.team_name}
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <span className="font-display text-sm font-bold text-bone/30">
                        {row.team_name.slice(0, 2)}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-display text-base font-bold uppercase text-bone sm:text-lg">
                      {row.team_name}
                    </span>
                    <span title={row.country || "Unknown"}>
                      {countryFlag(row.country)}
                    </span>
                  </div>
                </div>
              </td>

              <td className="px-3 py-3 text-right font-stat tabular-nums text-bone/70">
                {row.rooms_played}
              </td>

              <td className="px-3 py-3 text-right font-stat tabular-nums">
                {row.placement_points}
              </td>

              <td className="px-3 py-3 text-right font-stat tabular-nums">
                {row.kill_points}
              </td>

              <td className="px-4 py-3 text-right font-stat text-lg font-bold tabular-nums text-ember">
                {row.total_points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
