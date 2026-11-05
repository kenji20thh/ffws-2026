import Monogram from "@/components/ui/Monogram";
import type { Team } from "@/types";

export default function PredictionSummary({
  order,
  heading = "Confirm before submitting",
  compact = false,
}: {
  order: Team[];
  heading?: string;
  /** Tighter two-column layout (6 + 6) so all 12 teams fit on screen. */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="chamfer-sm border border-amber/40 bg-char-2">
        <div className="border-b border-bone/10 px-3 py-2">
          <p className="font-stat text-[10px] uppercase tracking-[0.25em] text-amber">
            {heading}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-4 p-2 sm:grid-flow-col sm:grid-cols-[repeat(2,minmax(0,1fr))] sm:grid-rows-6 sm:p-3">
          {order.map((team, i) => (
            <div
              key={team.id}
              className="flex min-w-0 items-center gap-2.5 border-b border-bone/5 py-1.5"
            >
              <span className="w-6 shrink-0 text-center font-stat text-sm font-bold tabular-nums text-ember">
                {i + 1}
              </span>
              <Monogram label={team.tag || team.name} imageUrl={team.logo_url} size={26} />
              <span className="truncate font-display text-base font-bold uppercase">
                {team.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chamfer border border-amber/40 bg-char-2 p-5">
      <p className="mb-4 font-stat text-[11px] uppercase tracking-[0.3em] text-amber">
        {heading}
      </p>
      <div className="space-y-1.5">
        {order.map((team, i) => (
          <div key={team.id} className="flex items-center gap-3 border-b border-bone/5 py-1.5 last:border-0">
            <span className="w-8 font-stat text-sm font-bold tabular-nums text-ember">{i + 1}.</span>
            <Monogram label={team.tag || team.name} imageUrl={team.logo_url} size={28} />
            <span className="font-display text-base font-bold uppercase">{team.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
