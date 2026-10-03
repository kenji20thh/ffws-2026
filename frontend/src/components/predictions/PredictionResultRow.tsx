import Monogram from "@/components/ui/Monogram";
import type { PredictionTeamEntry } from "@/types";

export default function PredictionResultRow({ entry }: { entry: PredictionTeamEntry }) {
  const scored = entry.actual_placement > 0;
  const diff = scored ? Math.abs(entry.predicted_placement - entry.actual_placement) : null;

  return (
    <div className="chamfer-sm flex flex-wrap items-center gap-3 border border-bone/10 bg-char-2 p-3">
      <Monogram label={entry.team.tag || entry.team.name} imageUrl={entry.team.logo_url} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg font-extrabold uppercase leading-none">{entry.team.name}</p>
      </div>
      <div className="flex items-center gap-4 font-stat text-xs uppercase tracking-widest tabular-nums">
        <span className="text-ash">Predicted <span className="text-bone">#{entry.predicted_placement}</span></span>
        {scored ? (
          <>
            <span className="text-ash">Actual <span className="text-bone">#{entry.actual_placement}</span></span>
            <span className="text-ash">Diff <span className="text-bone">{diff}</span></span>
            <span className={`text-sm font-bold ${entry.points > 0 ? "text-ember" : "text-ash"}`}>
              +{entry.points} pts
            </span>
          </>
        ) : (
          <span className="text-ash">Not scored yet</span>
        )}
      </div>
    </div>
  );
}