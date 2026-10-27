import Monogram from "@/components/ui/Monogram";
import { pointsTone } from "@/lib/predictionTone";
import type { PredictionTeamEntry } from "@/types";

/** One team of a scored prediction, colored by the points it earned (+12 = green). */
export default function PredictionResultRow({ entry }: { entry: PredictionTeamEntry }) {
  const scored = entry.actual_placement > 0;
  const diff = scored ? Math.abs(entry.predicted_placement - entry.actual_placement) : null;
  const tone = scored ? pointsTone(entry.points) : null;

  return (
    <div
      style={tone ? { borderLeftColor: tone.color, backgroundColor: tone.bg } : undefined}
      className={`chamfer-sm flex flex-wrap items-center gap-3 border border-bone/10 p-3 ${
        tone ? "border-l-4" : "bg-char-2"
      }`}
    >
      <Monogram label={entry.team.tag || entry.team.name} imageUrl={entry.team.logo_url} size={36} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="truncate font-display text-lg font-extrabold uppercase leading-none">{entry.team.name}</p>

          {tone && (
            <span
              style={{ backgroundColor: tone.color, color: tone.ink }}
              className="shrink-0 px-2 py-0.5 font-stat text-xs font-black tabular-nums"
            >
              {entry.points > 0 ? "+" : ""}
              {entry.points} pts
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 font-stat text-xs uppercase tracking-widest tabular-nums">
        <span className="text-ash">Predicted <span className="text-bone">#{entry.predicted_placement}</span></span>
        {scored ? (
          <>
            <span className="text-ash">Actual <span className="text-bone">#{entry.actual_placement}</span></span>
            <span className="text-ash">Diff <span className="text-bone">{diff}</span></span>
          </>
        ) : (
          <span className="text-ash">Not scored yet</span>
        )}
      </div>
    </div>
  );
}