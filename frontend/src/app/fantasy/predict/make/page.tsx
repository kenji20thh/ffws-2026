import PredictionConsole from "@/components/predictions/PredictionConsole";
import ErrorState from "@/components/ui/ErrorState";
import { getTournament } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Make Prediction · FFWS 2026" };

export default async function MakePredictionPage() {
  try {
    const t = await getTournament("ffws-2026");
    return <PredictionConsole tournamentId={t.id} />;
  } catch (e) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorState message={e instanceof Error ? e.message : undefined} />
      </div>
    );
  }
}