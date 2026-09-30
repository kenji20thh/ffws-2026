import type { TeamPlayerStats } from "@/types";

export default function KillParticipationChart({ players }: { players: TeamPlayerStats[] }) {
  const sorted = [...players].sort((a, b) => b.kill_participation - a.kill_participation);
  if (sorted.every((p) => p.total_kills === 0)) {
    return <p className="font-stat text-xs uppercase tracking-widest text-ash">No kills recorded yet</p>;
  }
  const max = Math.max(...sorted.map((p) => p.kill_participation), 1);
  return (
    <div className="space-y-3">
      {sorted.map((p) => (
        <div key={p.player_id}>
          <div className="mb-1 flex items-baseline justify-between font-stat text-xs uppercase tracking-widest">
            <span className="text-bone">{p.ign}</span>
            <span className="tabular-nums text-ember">{p.kill_participation.toFixed(1)}% · {p.total_kills} kills</span>
          </div>
          <div className="h-2.5 w-full bg-char-3">
            <div className="h-full bg-ember transition-all" style={{ width: `${(p.kill_participation / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}