import { placementPoints } from "@/lib/scoring";

export default function PointsPreview({ placement, kills }: { placement: number | null; kills: number }) {
  const place = placement ? placementPoints(placement) : 0;
  return (
    <div className="font-stat text-xs tabular-nums text-ash" aria-live="polite">
      <span>{place} place</span> + <span>{kills} kills</span> ={" "}
      <span className="text-lg font-bold text-ember">{place + kills}</span>
    </div>
  );
}