"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { getPredictionStandings } from "@/lib/api";
import type { PredictionStanding, TournamentDay } from "@/types";

export default function PredictionLeaderboard({
  tournamentId,
  days,
}: {
  tournamentId: number;
  days: TournamentDay[];
}) {
  const [dayId, setDayId] = useState<number | "overall">("overall");
  const [rows, setRows] = useState<PredictionStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPredictionStandings(tournamentId, dayId === "overall" ? undefined : dayId)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [tournamentId, dayId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setDayId("overall")}
          className={`chamfer-sm px-5 py-2 font-display text-lg font-bold uppercase tracking-wider ${
            dayId === "overall" ? "bg-ember text-char" : "border border-bone/20 text-bone/70 hover:text-ember"
          }`}
        >
          Overall
        </button>
        {days.map((d) => (
          <button
            key={d.id}
            onClick={() => setDayId(d.id)}
            className={`chamfer-sm px-5 py-2 font-display text-lg font-bold uppercase tracking-wider ${
              dayId === d.id ? "bg-ember text-char" : "border border-bone/20 text-bone/70 hover:text-ember"
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <EmptyState title="No predictions yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead>
              <tr className="border-b border-bone/15 font-stat text-[10px] uppercase tracking-widest text-ash">
                <th className="py-3 pr-3">#</th>
                <th className="py-3">User</th>
                <th className="py-3 text-right text-ember">Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.user_id}-${dayId}`} className="border-b border-bone/5 hover:bg-char-2">
                  <td className={`py-3 pr-3 font-display text-3xl font-black ${i === 0 ? "text-amber" : "text-bone/60"}`}>{i + 1}</td>
                  <td className="py-3 font-display text-2xl font-bold uppercase">
                    {dayId !== "overall" && r.prediction_id ? (
                      <Link href={`/predictions/${r.prediction_id}`} className="hover:text-ember">{r.username}</Link>
                    ) : (
                      r.username
                    )}
                  </td>
                  <td className="py-3 text-right font-stat text-lg font-bold tabular-nums text-ember">{r.total_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}