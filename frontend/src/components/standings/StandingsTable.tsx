import EmptyState from "@/components/ui/EmptyState";
import type { TeamStanding } from "@/types";

export default function StandingsTable({ rows }: { rows: TeamStanding[] }) {
  if (rows.length === 0) {
    return <EmptyState title="No results yet" hint="Standings appear after the first room." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left">
        <thead>
          <tr className="border-b border-bone/15 font-stat text-[10px] uppercase tracking-widest text-ash">
            <th className="py-3 pr-3">#</th>
            <th className="py-3">Team</th>
            <th className="py-3 text-right">Rooms</th>
            <th className="py-3 text-right">Place</th>
            <th className="py-3 text-right">Kills</th>
            <th className="py-3 text-right text-ember">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team_id} className="border-b border-bone/5 hover:bg-char-2">
              <td className={`py-3 pr-3 font-display text-3xl font-black ${i === 0 ? "text-amber" : "text-bone/60"}`}>
                {i + 1}
              </td>
              <td className="py-3 font-display text-2xl font-bold uppercase">{r.team_name}</td>
              <td className="py-3 text-right font-stat tabular-nums">{r.rooms_played}</td>
              <td className="py-3 text-right font-stat tabular-nums">{r.placement_points}</td>
              <td className="py-3 text-right font-stat tabular-nums">{r.kill_points}</td>
              <td className="py-3 text-right font-stat text-lg font-bold tabular-nums text-ember">
                {r.total_points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}