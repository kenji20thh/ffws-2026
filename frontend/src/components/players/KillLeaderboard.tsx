"use client";

import { useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import type { PlayerLeaderboardEntry } from "@/types";

export default function KillLeaderboard({ rows }: { rows: PlayerLeaderboardEntry[] }) {
  const [q, setQ] = useState("");
  const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));
  const shown = ranked.filter((r) => r.ign.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <label htmlFor="q" className="sr-only">Search by IGN</label>
      <input
        id="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search IGN…"
        className="chamfer-sm mb-6 w-full max-w-sm border border-bone/20 bg-char-2 px-4 py-3 font-stat text-sm placeholder:text-ash focus:border-ember focus:outline-none"
      />
      {shown.length === 0 ? (
        <EmptyState title="No players found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-bone/15 font-stat text-[10px] uppercase tracking-widest text-ash">
                <th className="py-3 pr-3">#</th>
                <th className="py-3">Player</th>
                <th className="py-3">Team</th>
                <th className="py-3 text-right">Rooms</th>
                <th className="py-3 text-right text-ember">Kills</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.player_id} className="border-b border-bone/5 hover:bg-char-2">
                  <td className={`py-3 pr-3 font-display text-3xl font-black ${r.rank === 1 ? "text-amber" : "text-bone/60"}`}>
                    {r.rank}
                  </td>
                  <td className="py-3 font-display text-2xl font-bold uppercase">{r.ign}</td>
                  <td className="py-3 text-bone/70">{r.team_name}</td>
                  <td className="py-3 text-right font-stat tabular-nums">{r.rooms_played}</td>
                  <td className="py-3 text-right font-stat text-lg font-bold tabular-nums text-ember">
                    {r.total_kills}
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