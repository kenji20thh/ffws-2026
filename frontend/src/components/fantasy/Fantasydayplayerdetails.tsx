"use client";

import { useEffect, useState } from "react";
import { getPlayerProfile } from "@/lib/api";
import { FANTASY_FIRST_BLOOD_POINTS, FANTASY_KILL_POINTS } from "@/lib/scoring";
import type { FantasyPlayerDayScore, PlayerDayStats } from "@/types";

const per = (value: number, rooms: number) => (rooms > 0 ? (value / rooms).toFixed(2) : "–");

/**
 * Per-player details for one tournament day: kills, points, per-room averages,
 * kill / placement / first-blood points. The fantasy breakdown gives the totals;
 * the number of rooms played comes from each player's public profile.
 */
export default function FantasyDayPlayerDetails({
  dayId,
  breakdown,
  chipName,
}: {
  dayId: number;
  breakdown: FantasyPlayerDayScore[];
  chipName?: string;
}) {
  // player_id -> that player's stats for this day (undefined = still loading, null = no data)
  const [dayStats, setDayStats] = useState<Map<number, PlayerDayStats | null>>(new Map());

  const idsKey = breakdown.map((b) => b.player_id).join(",");

  useEffect(() => {
    let cancelled = false;
    setDayStats(new Map());
    Promise.all(
      breakdown.map((b) =>
        getPlayerProfile(b.player_id)
          .then((p) => [b.player_id, p.days.find((d) => d.day_id === dayId) ?? null] as const)
          .catch(() => [b.player_id, null] as const),
      ),
    ).then((entries) => {
      if (!cancelled) setDayStats(new Map(entries));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayId, idsKey]);

  if (breakdown.length === 0) return null;

  const rows = breakdown.map((b) => {
    const stats = dayStats.get(b.player_id);
    const rooms = stats?.rooms_played ?? stats?.rooms?.length ?? 0;
    const killPts = b.kills * FANTASY_KILL_POINTS;
    const fbPts = b.first_bloods * FANTASY_FIRST_BLOOD_POINTS;
    return { b, stats, rooms, killPts, fbPts, loaded: dayStats.has(b.player_id) };
  });

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
              const roomsLabel = loaded ? (rooms > 0 ? rooms : "–") : "…";
              const hasRooms = loaded && rooms > 0;
              return (
                <tr key={b.player_id} className="border-b border-bone/5 last:border-0">
                  <td className="px-3 py-3 text-left font-display font-bold uppercase">
                    {b.ign} {b.is_captain && <span className="text-amber">(C)</span>}
                  </td>
                  <td className={td}>{roomsLabel}</td>
                  <td className={td}>{b.kills}</td>
                  <td className={td}>{hasRooms ? per(b.kills, rooms) : "–"}</td>
                  <td className={td}>{killPts}</td>
                  <td className={td}>{fbPts}</td>
                  <td className={td}>{b.placement_points}</td>
                  <td className={td}>{hasRooms ? per(b.placement_points, rooms) : "–"}</td>
                  <td className={td}>{b.base_points}</td>
                  <td className={td}>{hasRooms ? per(b.final_points, rooms) : "–"}</td>
                  <td className={`${td} font-black text-ember`}>{b.final_points}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-bone/10">
              <td colSpan={10} className="px-3 py-3 text-right font-stat text-[10px] uppercase tracking-widest text-ash">
                Day total
              </td>
              <td className={`${td} text-lg font-black text-ember`}>{totalFinal}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
        Total = base points × captain multiplier (or chip). Pts / room uses the final total.
      </p>
    </section>
  );
}