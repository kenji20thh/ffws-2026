import type { FantasyPlayerDayScore } from "@/types";

export default function DayScoreCard({ breakdown, total }: { breakdown: FantasyPlayerDayScore[]; total: number }) {
  if (breakdown.length === 0) return null;
  const hasPoints = breakdown.some((b) => b.final_points !== 0);
  if (!hasPoints) return null;

  return (
    <div className="chamfer border border-bone/10 bg-char-2 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl font-extrabold uppercase">Day score</h3>
        <span className="font-stat text-2xl font-black tabular-nums text-ember">{total}</span>
      </div>
      <div className="space-y-2">
        {breakdown.map((b) => (
          <div key={b.player_id} className="flex items-center justify-between border-b border-bone/5 pb-2 text-sm last:border-0">
            <span className="font-display font-bold uppercase">
              {b.ign} {b.is_captain && <span className="text-amber">(C)</span>}
            </span>
            <span className="font-stat tabular-nums text-bone/70">
              {b.kills}k · {b.first_bloods}fb · {b.placement_points}pp ={" "}
              <span className="text-ember">{b.final_points}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}