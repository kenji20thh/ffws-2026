import { notFound } from "next/navigation";
import PredictionViewer from "@/components/predictions/PredictionViewer";

export const dynamic = "force-dynamic";

export default async function PredictionViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const predictionId = Number(id);
  if (!Number.isInteger(predictionId) || predictionId <= 0) notFound();

  return <PredictionViewer predictionId={predictionId} />;
}
