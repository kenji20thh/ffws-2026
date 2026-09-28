import EmptyState from "@/components/ui/EmptyState";
import type { RoomTeamSummary } from "@/types";

export default function RoomResultsTable({ rows }: { rows: RoomTeamSummary[] }) {
  if (rows.length === 0) {
    return <EmptyState title="Results pending" hint="Teams appear here as they are eliminated." />;
  }
  const sorted = [...rows].sort((a, b) => a.placement - b.placement);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left">
        <thead>
          <tr className="border-b border-bone/15 font-stat text-[10px] uppercase tracking-widest text-ash">
            <th className="py-3 pr-3">Rank</th>
            <th className="py-3">Team</th>
            <th className="py-3 text-right">Kills</th>
            <th className="py-3 text-right">Place pts</th>
            <th className="py-3 text-right text-ember">Total</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.team_id} className="border-b border-bone/5 hover:bg-char-2">
              <td className={`py-3 pr-3 font-display text-3xl font-black ${r.placement === 1 ? "text-amber" : "text-bone/60"}`}>
                #{r.placement}
              </td>
              <td className="py-3 font-display text-2xl font-bold uppercase">{r.team_name}</td>
              <td className="py-3 text-right font-stat tabular-nums">{r.total_kills}</td>
              <td className="py-3 text-right font-stat tabular-nums">{r.placement_points}</td>
              <td className="py-3 text-right font-stat text-lg font-bold tabular-nums text-ember">{r.total_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}