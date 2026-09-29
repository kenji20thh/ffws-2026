import Link from "next/link";
import type { TeamStanding } from "@/types";

export default function StandingsPreview({ rows }: { rows: TeamStanding[] }) {
  const top5 = rows.slice(0, 5);

  return (
    <div className="chamfer border border-bone/10 bg-char-2 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-extrabold uppercase">Standings</h2>
        <Link href="/standings" className="font-stat text-[10px] uppercase tracking-widest text-ember hover:underline">
          Full table →
        </Link>
      </div>
      {top5.length === 0 ? (
        <p className="font-stat text-xs uppercase tracking-widest text-ash">No results yet</p>
      ) : (
        <ol className="space-y-2">
          {top5.map((r, i) => (
            <li key={r.team_id} className="flex items-center justify-between border-b border-bone/5 pb-2 last:border-0">
              <span className="flex items-center gap-3">
                <span className={`font-display text-xl font-black ${i === 0 ? "text-amber" : "text-bone/50"}`}>{i + 1}</span>
                <span className="font-display text-lg font-bold uppercase">{r.team_name}</span>
              </span>
              <span className="font-stat text-sm tabular-nums text-ember">{r.total_points}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}