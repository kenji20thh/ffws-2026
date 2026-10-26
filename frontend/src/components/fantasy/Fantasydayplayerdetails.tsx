"use client";

import { useEffect, useState } from "react";
import { getPlayerProfile } from "@/lib/api";
import { FANTASY_FIRST_BLOOD_POINTS, FANTASY_KILL_POINTS } from "@/lib/scoring";
import type { FantasyPlayerDayScore, FantasySelectionEntry, PlayerDayStats } from "@/types";

const per = (value: number, rooms: number) => (rooms > 0 ? (value / rooms).toFixed(2) : "–");

/**
 * Per-player details for one tournament day: kills, points, per-room averages,
 * kill / placement / first-blood points. The fantasy breakdown gives the totals;
 * the number of rooms played comes from each player's public profile.
 */
export default function FantasyDayPlayerDetails({
  dayId,
  selections,
  breakdown,
  scored,
  chipName,
}: {
  dayId: number;
  selections: FantasySelectionEntry[];
  breakdown: FantasyPlayerDayScore[];
  scored: boolean;
  chipName?: string;
}) {
  // player_id -> that player's stats for this day (undefined = still loading, null = no data)
  const [dayStats, setDayStats] = useState<Map<number, PlayerDayStats | null>>(new Map());

  const idsKey = selections.map((x) => x.player_id).join(",");

  useEffect(() => {
    let cancelled = false;
    setDayStats(new Map());
    if (!scored) return;
    Promise.all(
      selections.map((x) =>
        getPlayerProfile(x.player_id)
          .then((p) => [x.player_id, p.days.find((d) => d.day_id === dayId) ?? null] as const)
          .catch(() => [x.player_id, null] as const),
      ),
    ).then((entries) => {
      if (!cancelled) setDayStats(new Map(entries));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayId, idsKey, scored]);

  if (selections.length === 0) return null;

  const byPlayer = new Map(breakdown.map((b) => [b.player_id, b]));

  const rows = selections.map((sel) => {
    const b: FantasyPlayerDayScore = byPlayer.get(sel.player_id) ?? {
      player_id: sel.player_id,
      ign: sel.player.ign,
      is_captain: sel.is_captain,
      kills: 0,
      first_bloods: 0,
      placement_points: 0,
      base_points: 0,
      final_points: 0,
    };
    const stats = dayStats.get(b.player_id);
    const rooms = stats?.rooms_played ?? stats?.rooms?.length ?? 0;
    const killPts = b.kills * FANTASY_KILL_POINTS;
    const fbPts = b.first_bloods * FANTASY_FIRST_BLOOD_POINTS;
    return { b, stats, rooms, killPts, fbPts, loaded: dayStats.has(b.player_id) };
  });

  const dash = "–";
  const totalFinal = rows.reduce((s, r) => s + r.b.final_points, 0);

  const th = "px-3 py-3 text-right font-stat text-[10px] font-normal uppercase tracking-widest text-ash";
  const td = "px-3 py-3 text-right font-stat tabular-nums";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-bone/10 pb-3">
        <div>
          <p className="font-stat text-[10px] uppercase tracking-[0.3em] text-ember">Matchday breakdown</p>
          <h2 className="font-display text-2xl font-black uppercase">Player details</h2>
        </div>
        <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
          Kill {FANTASY_KILL_POINTS} pts · First blood {FANTASY_FIRST_BLOOD_POINTS} pts
          {chipName ? ` · Chip: ${chipName}` : ""}
        </p>
      </div>

      <div className="chamfer overflow-x-auto border border-bone/10 bg-char-2">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-bone/10">
              <th className="px-3 py-3 text-left font-stat text-[10px] font-normal uppercase tracking-widest text-ash">
                Player
              </th>
              <th className={th}>Rooms</th>
              <th className={th}>Kills</th>
              <th className={th}>Kills / room</th>
              <th className={th}>Kill pts</th>
              <th className={th}>FB pts</th>
              <th className={th}>Place pts</th>
              <th className={th}>Place pts / room</th>
              <th className={th}>Base pts</th>
              <th className={th}>Pts / room</th>
              <th className={th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ b, rooms, killPts, fbPts, loaded }) => {
              const roomsLabel = !scored ? dash : loaded ? (rooms > 0 ? rooms : dash) : "…";
              const hasRooms = scored && loaded && rooms > 0;
              const v = (n: number | string) => (scored ? n : dash);
              return (
                <tr key={b.player_id} className="border-b border-bone/5 last:border-0">
                  <td className="px-3 py-3 text-left font-display font-bold uppercase">
                    {b.ign} {b.is_captain && <span className="text-amber">(C)</span>}
                  </td>
                  <td className={td}>{roomsLabel}</td>
                  <td className={td}>{v(b.kills)}</td>
                  <td className={td}>{hasRooms ? per(b.kills, rooms) : dash}</td>
                  <td className={td}>{v(killPts)}</td>
                  <td className={td}>{v(fbPts)}</td>
                  <td className={td}>{v(b.placement_points)}</td>
                  <td className={td}>{hasRooms ? per(b.placement_points, rooms) : dash}</td>
                  <td className={td}>{v(b.base_points)}</td>
                  <td className={td}>{hasRooms ? per(b.final_points, rooms) : dash}</td>
                  <td className={`${td} font-black text-ember`}>{v(b.final_points)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-bone/10">
              <td colSpan={10} className="px-3 py-3 text-right font-stat text-[10px] uppercase tracking-widest text-ash">
                Day total
              </td>
              <td className={`${td} text-lg font-black text-ember`}>{scored ? totalFinal : dash}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
        {!scored ? "Stats appear here once this matchday has been played and scored. " : ""}Total = base points × captain multiplier (or chip). Pts / room uses the final total.
      </p>
    </section>
  );
}