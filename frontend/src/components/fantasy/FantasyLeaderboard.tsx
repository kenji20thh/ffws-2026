"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { getFantasyLeagueStandings, getFantasyStandings } from "@/lib/api";
import type { FantasyStanding, TournamentDay } from "@/types";

export default function FantasyLeaderboard({
  tournamentId,
  days,
  leagueSlug,
  highlightTeamId,
}: {
  tournamentId: number;
  days: TournamentDay[];
  /** Show one league's board (the player's own region, or "global"). Omit for the public global board. */
  leagueSlug?: string;
  /** Marks the logged-in player's own row. */
  highlightTeamId?: number;
}) {
  const [dayId, setDayId] = useState<number | "overall">("overall");
  const [rows, setRows] = useState<FantasyStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const day = dayId === "overall" ? undefined : dayId;

    const load = leagueSlug
      ? getFantasyLeagueStandings(tournamentId, leagueSlug, day)
      : getFantasyStandings(tournamentId, day);

    load
      .then((r) => !cancelled && setRows(r))
      .catch(
        (e) =>
          !cancelled &&
          setError(e instanceof Error ? e.message : "Failed to load standings"),
      )
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [tournamentId, dayId, leagueSlug]);

  return (
    <div className="space-y-6">
      {/* Day selector */}
      <div className="flex items-center gap-4">
        <label
          htmlFor="fantasy-leaderboard-day"
          className="shrink-0 font-stat text-[10px] uppercase tracking-[0.25em] text-ash"
        >
          Standings
        </label>

        <div className="relative w-full max-w-xs">
          <select
            id="fantasy-leaderboard-day"
            value={dayId}
            onChange={(e) =>
              setDayId(
                e.target.value === "overall"
                  ? "overall"
                  : Number(e.target.value),
              )
            }
            className="w-full appearance-none chamfer-sm border border-bone/20 bg-char-2 px-5 py-3 pr-12 font-display text-lg font-bold uppercase tracking-wider text-bone outline-none transition focus:border-ember focus:ring-1 focus:ring-ember/40"
          >
            <option value="overall">Overall</option>

            {days.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ember"
          >
            ▼
          </span>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : error ? (
        <ErrorState message={error} />
      ) : rows.length === 0 ? (
        <EmptyState title="No fantasy teams yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead>
              <tr className="border-b border-bone/15 font-stat text-[10px] uppercase tracking-widest text-ash">
                <th className="py-3 pr-3">#</th>
                <th className="py-3">Team</th>
                <th className="py-3">Country</th>
                <th className="py-3 text-right text-ember">Points</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.fantasy_team_id}
                  className={`border-b border-bone/5 hover:bg-char-2 ${
                    r.fantasy_team_id === highlightTeamId
                      ? "bg-ember/10"
                      : ""
                  }`}
                >
                  <td
                    className={`py-3 pr-3 font-display text-3xl font-black ${
                      i === 0 ? "text-amber" : "text-bone/60"
                    }`}
                  >
                    {i + 1}
                  </td>

                  <td className="py-3 font-display text-2xl font-bold uppercase">
                    <Link
                      href={`/fantasy/${r.fantasy_team_id}`}
                      className="hover:text-ember"
                    >
                      {r.team_name}
                    </Link>

                    {r.fantasy_team_id === highlightTeamId && (
                      <span className="ml-3 align-middle font-stat text-[10px] tracking-widest text-ember">
                        YOU
                      </span>
                    )}
                  </td>

                  <td className="py-3 text-bone/70">{r.country}</td>

                  <td className="py-3 text-right font-stat text-lg font-bold tabular-nums text-ember">
                    {r.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
