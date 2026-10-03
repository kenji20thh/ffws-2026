import Monogram from "@/components/ui/Monogram";
import type { Team } from "@/types";

export default function PredictionSummary({ order }: { order: Team[] }) {
  return (
    <div className="chamfer border border-amber/40 bg-char-2 p-5">
      <p className="mb-4 font-stat text-[11px] uppercase tracking-[0.3em] text-amber">
        Confirm before submitting
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