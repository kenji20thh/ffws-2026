
export type CardTier =
  | "bronze"
  | "silver"
  | "gold"
  | "diamond"
  | "legendary"
  | "basic";

/** Legacy alias: use Bronze when no price is known. */
export const CARD_TIERS: readonly CardTier[] = [
  "bronze",
  "silver",
  "gold",
  "diamond",
  "legendary",
];

export const CARD_ARTWORK: Record<CardTier, string> = {
  bronze: "/cards/bronze.png",
  silver: "/cards/silver.png",
  gold: "/cards/gold.png",
  diamond: "/cards/diamond.png",
  legendary: "/cards/legendary.png",
  basic: "/cards/bronze.png",
};

/** Minimum price for each tier, checked from highest to lowest. */
export const TIER_THRESHOLDS: ReadonlyArray<{
  tier: CardTier;
  minPrice: number;
}> = [
  { tier: "legendary", minPrice: 30 },
  { tier: "diamond", minPrice: 25 },
  { tier: "gold", minPrice: 20 },
  { tier: "silver", minPrice: 14 },
];

export function tierFromPrice(price: number): CardTier {
  for (const { tier, minPrice } of TIER_THRESHOLDS) {
    if (price >= minPrice) return tier;
  }

  return "bronze";
}

export function isCardTier(value: unknown): value is CardTier {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(CARD_ARTWORK, value)
  );
}

export function cardArtwork(tier: CardTier): string {
  return CARD_ARTWORK[tier] ?? CARD_ARTWORK.bronze;
}
