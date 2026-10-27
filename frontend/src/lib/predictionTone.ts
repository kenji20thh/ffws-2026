/**
 * Colors for prediction results: the closer a team's placement was predicted, the greener
 * it is (exact = +12). Colors are tied to the points earned, not to a fixed distance, so
 * they stay right if the scoring table changes.
 */
export type PredictionTone = {
  color: string; // solid color (badge, left bar)
  bg: string; // soft tint for the row background
  ink: string; // readable text color on top of `color`
};

const tone = (color: string, ink = "#111111"): PredictionTone => ({
  color,
  bg: `${color}1f`, // ~12% opacity
  ink,
});

/** From best to worst. `min` = lowest points that still get this color. */
const TIERS: { min: number; label: string; tone: PredictionTone }[] = [
  { min: 12, label: "Exact", tone: tone("#22c55e") },
  { min: 9, label: "1 off", tone: tone("#84cc16") },
  { min: 7, label: "2 off", tone: tone("#eab308") },
  { min: 5, label: "3 off", tone: tone("#f59e0b") },
  { min: 3, label: "4 off", tone: tone("#f97316") },
  { min: 1, label: "5-6 off", tone: tone("#ef4444", "#ffffff") },
  { min: 0, label: "Missed", tone: tone("#7f1d1d", "#ffffff") },
];

export function pointsTone(points: number): PredictionTone {
  return (TIERS.find((t) => points >= t.min) ?? TIERS[TIERS.length - 1]).tone;
}

/** For the legend under the table. */
export const PREDICTION_LEGEND = [
  { label: "Exact", points: "+12", tone: TIERS[0].tone },
  { label: "1 off", points: "+9", tone: TIERS[1].tone },
  { label: "2 off", points: "+7", tone: TIERS[2].tone },
  { label: "3 off", points: "+5", tone: TIERS[3].tone },
  { label: "4 off", points: "+3", tone: TIERS[4].tone },
  { label: "5-6 off", points: "+2 / +1", tone: TIERS[5].tone },
  { label: "Missed", points: "0", tone: TIERS[6].tone },
];
