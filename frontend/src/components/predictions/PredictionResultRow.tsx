import Monogram from "@/components/ui/Monogram";
import { pointsTone } from "@/lib/predictionTone";
import type { PredictionTeamEntry } from "@/types";

export default function PredictionResultRow({
  entry,
}: {
  entry: PredictionTeamEntry;
}) {
  const scored = entry.actual_placement > 0;
  const diff = scored
    ? Math.abs(entry.predicted_placement - entry.actual_placement)
    : null;
  const tone = scored ? pointsTone(entry.points) : null;
  const exact = scored && diff === 0;

  return (
    <article
      style={
        tone
          ? {
              borderLeftColor: tone.color,
              backgroundColor: tone.bg,
            }
          : undefined
      }
      className={`group relative overflow-hidden border border-white/[0.08] ${
        tone ? "border-l-[3px]" : "border-l-[3px] border-l-white/15 bg-char-2"
      }`}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap sm:gap-4 sm:px-4">
        <Monogram
          label={entry.team.tag || entry.team.name}
          imageUrl={entry.team.logo_url}
          size={38}
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="min-w-0 break-words font-display text-base font-extrabold uppercase leading-tight sm:text-lg">
              {entry.team.name}
            </p>
            {exact && (
              <span className="shrink-0 border border-white/15 px-1.5 py-0.5 font-stat text-[9px] font-bold uppercase tracking-wider text-bone">
                Exact
              </span>
            )}
          </div>
          <p className="mt-1 font-stat text-[9px] uppercase tracking-[0.15em] text-ash/70">
            {scored
              ? diff === 0
                ? "Perfect prediction"
                : `${diff} position${diff === 1 ? "" : "s"} off`
              : "Awaiting official placement"}
          </p>
        </div>

        <div className="ml-auto shrink-0 text-right">
          <p
            className="font-display text-xl font-black leading-none tabular-nums sm:text-2xl"
            style={{ color: tone?.color ?? "#f1e9dc" }}
          >
            {scored ? `${entry.points > 0 ? "+" : ""}${entry.points}` : "—"}
          </p>
          <p className="mt-1 font-stat text-[9px] uppercase tracking-widest text-ash">
            points
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-white/[0.07] sm:grid-cols-3">
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4">
          <span className="font-stat text-[9px] uppercase tracking-widest text-ash">
            Predicted
          </span>
          <span className="font-stat text-xs font-bold tabular-nums text-bone">
            #{entry.predicted_placement}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-l border-white/[0.07] px-3 py-2 sm:px-4">
          <span className="font-stat text-[9px] uppercase tracking-widest text-ash">
            Actual
          </span>
          <span className="font-stat text-xs font-bold tabular-nums text-bone">
            {scored ? `#${entry.actual_placement}` : "—"}
          </span>
        </div>

        <div className="col-span-2 flex items-center justify-between gap-2 border-t border-white/[0.07] px-3 py-2 sm:col-span-1 sm:border-l sm:border-t-0 sm:px-4">
          <span className="font-stat text-[9px] uppercase tracking-widest text-ash">
            Difference
          </span>
          <span
            className="font-stat text-xs font-bold tabular-nums"
            style={{ color: exact ? tone?.color : undefined }}
          >
            {scored ? (diff === 0 ? "Exact" : `${diff} places`) : "Pending"}
          </span>
        </div>
      </div>
    </article>
  );
}
