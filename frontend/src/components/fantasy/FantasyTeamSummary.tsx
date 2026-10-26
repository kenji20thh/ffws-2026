import Flag from "@/components/ui/Flag";

const fmt = (n: number) => n.toLocaleString("en-US");

/** "Top X%" from a rank. Rank 1 of 100 => Top 1%. Sub-1% values keep one decimal. */
export function topPercent(rank: number, total: number): string {
  if (total <= 0 || rank <= 0) return "–";
  const pct = (rank / total) * 100;
  if (pct < 1) return `${Math.max(0.1, Math.ceil(pct * 10) / 10).toFixed(1)}%`;
  return `${Math.ceil(pct)}%`;
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="border-t border-bone/10 pt-3">
      <p className="font-stat text-[10px] uppercase tracking-widest text-ash">{label}</p>
      <p className={`font-display text-3xl font-black leading-none tabular-nums ${accent ? "text-ember" : ""}`}>{value}</p>
      {sub && <p className="mt-1 font-stat text-[10px] uppercase tracking-widest text-ash">{sub}</p>}
    </div>
  );
}

/**
 * Left-hand panel next to the player cards: who owns the team and how it ranks
 * across every fantasy team in the tournament.
 */
export default function FantasyTeamSummary({
  username,
  teamName,
  country,
  points,
  rank,
  total,
  loading,
}: {
  username?: string;
  teamName: string;
  country?: string;
  points?: number;
  rank?: number;
  total?: number;
  loading: boolean;
}) {
  const ready = !loading && points !== undefined && rank !== undefined && total !== undefined;
  const dash = loading ? "…" : "–";

  return (
    <aside className="chamfer w-full shrink-0 space-y-4 border border-bone/10 bg-char-2 p-5 lg:w-64">
      <div className="space-y-1">
        {username && (
          <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
            Manager · <span className="text-bone">{username}</span>
          </p>
        )}
        <p className="font-display text-2xl font-black uppercase leading-tight">{teamName}</p>
        {country && (
          <p className="flex items-center gap-2 font-stat text-xs uppercase tracking-widest text-bone/70">
            <Flag country={country} height={14} />
            {country}
          </p>
        )}
      </div>

      <Stat label="Total points" value={ready ? fmt(points!) : dash} accent />
      <Stat label="Placement" value={ready ? `#${rank}` : dash} sub={ready ? `of ${fmt(total!)} teams` : undefined} />
      <Stat
        label="World rank"
        value={ready ? `Top ${topPercent(rank!, total!)}` : dash}
        sub={ready ? "of all fantasy players" : undefined}
      />
    </aside>
  );
}