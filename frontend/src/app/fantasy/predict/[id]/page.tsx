import { notFound } from "next/navigation";
import PredictionResultRow from "@/components/predictions/PredictionResultRow";
import PredictionSummary from "@/components/predictions/PredictionSummary";
import ErrorState from "@/components/ui/ErrorState";
import { ApiError, getPredictionById } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function PredictionViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const predictionId = Number(id);
  if (!Number.isInteger(predictionId) || predictionId <= 0) notFound();

  try {
    const detail = await getPredictionById(predictionId);
    const sorted = [...detail.teams].sort((a, b) => a.predicted_placement - b.predicted_placement);

    return (
      <div className="mx-auto max-w-3xl space-y-6 px-5 py-10">
        <div className="chamfer border border-bone/10 bg-char-2 p-6">
          <p className="font-stat text-[10px] uppercase tracking-widest text-ash">
            {detail.scored ? "Live score" : "Submitted prediction"}
          </p>
          {detail.scored && (
            <p className="font-display text-4xl font-black tabular-nums text-ember">
              {detail.total_points} / 144
            </p>
          )}
        </div>

        {detail.scored ? (
          <div className="space-y-2">
            {sorted.map((e) => <PredictionResultRow key={e.id} entry={e} />)}
          </div>
        ) : (
          <PredictionSummary order={sorted.map((e) => e.team)} />
        )}
      </div>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorState message={e instanceof Error ? e.message : undefined} />
      </div>
    );
  }
}