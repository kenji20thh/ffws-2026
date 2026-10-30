"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Flag from "@/components/ui/Flag";
import FormArrow from "@/components/ui/FormArrow";
import Monogram from "@/components/ui/Monogram";
import type { PlayerFormEntry } from "@/types";

const LEGEND = [5, 4, 3, 2, 1] as const;
const LEGEND_LABEL: Record<number, string> = {
  5: "Excellent",
  4: "Good",
  3: "Average",
  2: "Poor",
  1: "Bad",
};

export default function PlayerFormTable({
  entries,
  logos,
}: {
  entries: PlayerFormEntry[];
  logos: Record<number, string>;
}) {
  const [query, setQuery] = useState("");

  // Rank by total points; players on the same total share a rank (1, 2, 2, 4...).
  const ranked = useMemo(() => {
    let rank = 0;
    return entries.map((e, i) => {
      if (i === 0 || e.total_points !== entries[i - 1].total_points) rank = i + 1;
      return { ...e, rank };
    });
  }, [entries]);

  const q = query.trim().toLowerCase();
  const rows = q
    ? ranked.filter(
        (e) =>
          e.ign.toLowerCase().includes(q) ||
          e.team_name.toLowerCase().includes(q) ||
          e.team_tag.toLowerCase().includes(q),
      )
    : ranked;

  const anyForm = entries.some((e) => e.form > 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">Fantasy</p>
      <h1 className="font-display text-5xl font-black uppercase leading-none sm:text-6xl">Player form</h1>
      <p className="mt-3 max-w-2xl text-bone/70">
        Every player ranked by total fantasy points. The arrow shows how they have been doing over
        the last few matchdays compared with the other players.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        {LEGEND.map((f) => (
          <span
            key={f}
            className="flex items-center gap-1.5 font-stat text-[10px] uppercase tracking-widest text-ash"
          >
            <FormArrow form={f} size={20} />
            {LEGEND_LABEL[f]}
          </span>
        ))}
      </div>

      <div className="mt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search player or team"
          aria-label="Search player or team"
          className="w-full border border-bone/15 bg-char-2 px-4 py-2.5 font-stat text-sm text-bone placeholder:text-ash focus:border-ember focus:outline-none sm:max-w-sm"
        />
      </div>

      {!anyForm && entries.length > 0 && (
        <p className="mt-4 font-stat text-xs uppercase tracking-widest text-ash">
          Form shows up once the first matchday has been played.
        </p>
      )}

      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            title={entries.length === 0 ? "No players yet" : "No match"}
            hint={entries.length === 0 ? "Players will be listed here soon." : "Try a different name."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-separate border-spacing-y-1.5">
              <thead>
                <tr className="text-left font-stat text-[10px] uppercase tracking-widest text-ash">
                  <th className="w-12 px-3 py-1 font-normal">#</th>
                  <th className="px-3 py-1 font-normal">Player</th>
                  <th className="px-3 py-1 text-right font-normal">Total pts</th>
                  <th className="hidden px-3 py-1 text-right font-normal sm:table-cell">Matchdays</th>
                  <th className="hidden px-3 py-1 text-right font-normal sm:table-cell">Recent avg</th>
                  <th className="w-20 px-3 py-1 text-center font-normal">Form</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.player_id} className="bg-char-2">
                    <td className="px-3 py-2.5 font-stat text-sm font-bold tabular-nums text-ash">{e.rank}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/players/${e.player_id}`} className="group flex items-center gap-3">
                        <Monogram label={e.team_tag || e.team_name} imageUrl={logos[e.team_id]} size={34} />
                        <span className="min-w-0">
                          <span className="block truncate font-display text-lg font-extrabold uppercase leading-none group-hover:text-ember">
                            {e.ign}
                          </span>
                          <span className="mt-0.5 block truncate font-stat text-[10px] uppercase tracking-widest text-ash">
                            {e.team_name}
                            <span className="mx-1.5 text-bone/20">·</span>
                            <Flag country={e.country} height={11} />
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-right font-stat text-lg font-bold tabular-nums text-ember">
                      {e.total_points}
                    </td>
                    <td className="hidden px-3 py-2.5 text-right font-stat text-sm tabular-nums text-bone/70 sm:table-cell">
                      {e.matchdays_played}
                    </td>
                    <td className="hidden px-3 py-2.5 text-right font-stat text-sm tabular-nums text-bone/70 sm:table-cell">
                      {e.form > 0 ? e.recent_avg.toFixed(1) : "–"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center">
                        <FormArrow form={e.form} size={28} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
