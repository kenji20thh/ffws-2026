"use client";

import { useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { getFantasyStandings } from "@/lib/api";
import type { FantasyStanding, TournamentDay } from "@/types";
import Link from "next/link";

export default function FantasyLeaderboard({
  tournamentId,
  days,
}: {
  tournamentId: number;
  days: TournamentDay[];
}) {
  const [dayId, setDayId] = useState<number | "overall">("overall");
  const [rows, setRows] = useState<FantasyStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFantasyStandings(tournamentId, dayId === "overall" ? undefined : dayId)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [tournamentId, dayId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setDayId("overall")}
          className={`chamfer-sm px-5 py-2 font-display text-lg font-bold uppercase tracking-wider ${
            dayId === "overall"
              ? "bg-ember text-char"
              : "border border-bone/20 text-bone/70 hover:text-ember"
          }`}
        >
          Overall
        </button>
        {days.map((d) => (
          <button
            key={d.id}
            onClick={() => setDayId(d.id)}
            className={`chamfer-sm px-5 py-2 font-display text-lg font-bold uppercase tracking-wider ${
              dayId === d.id
                ? "bg-ember text-char"
                : "border border-bone/20 text-bone/70 hover:text-ember"
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-64" />
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
                  className="border-b border-bone/5 hover:bg-char-2"
                >
                  <td
                    className={`py-3 pr-3 font-display text-3xl font-black ${i === 0 ? "text-amber" : "text-bone/60"}`}
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
                  </td>{" "}
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
