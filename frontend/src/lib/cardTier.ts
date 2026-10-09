// Card tiers for the Fantasy player card.
//
// Two separate concerns live here so they can change independently:
//   1. which artwork file each tier uses (only files that really exist in /public/cards)
//   2. how a fantasy price maps to a tier (thresholds are TEMPORARY, see below)

export type CardTier = "basic" | "bronze" | "silver" | "gold" | "elite";

export const CARD_TIERS: readonly CardTier[] = ["basic", "bronze", "silver", "gold", "elite"];

const BASIC_ARTWORK = "/cards/bronze-card.png";

/**
 * Artwork per tier. Only tiers whose file actually exists are listed; every other tier
 * falls back to the basic artwork. When a new frame is added under public/cards/,
 * add one line here, e.g.:
 *   bronze: "/cards/ffws-card-bronze.png",
 * NOTE: all tier frames must share the same geometry as the basic frame (same size and
 * panel positions), because the card layout is measured on it. If a future frame is
 * different, give it its own layout in fantasyCardLayout.ts.
 */
export const CARD_ARTWORK: Partial<Record<CardTier, string>> = {
  basic: BASIC_ARTWORK,
};

export function cardArtwork(tier: CardTier): string {
  return CARD_ARTWORK[tier] ?? BASIC_ARTWORK;
}

/**
 * TEMPORARY price thresholds: the project does not define card tiers yet, so these are
 * placeholders chosen only to exercise the tier system (the squad budget is 100 for 4
 * players, so an average pick costs about 25). Change them freely; nothing else depends
 * on these numbers. Keep the list ordered from the highest tier to the lowest.
 */
export const TIER_THRESHOLDS: ReadonlyArray<{ tier: CardTier; minPrice: number }> = [
  { tier: "elite", minPrice: 30 },
  { tier: "gold", minPrice: 25 },
  { tier: "silver", minPrice: 20 },
  { tier: "bronze", minPrice: 15 },
];

export function tierFromPrice(price: number): CardTier {
  for (const { tier, minPrice } of TIER_THRESHOLDS) {
    if (price >= minPrice) return tier;
  }
  return "basic";
}
