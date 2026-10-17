// Card tiers for the Fantasy player card: the card artwork is chosen by the player's price.
//
//   C   Bronze     $0–12    budget picks, substitutes, lower expected output
//   B   Silver     $13–16   reliable players, decent kill potential
//   A   Golden     $17–20   strong starters, proven fraggers
//   S   Diamond    $21–25   elite players, star fraggers
//   S+  Legendary  $26–30   the tournament's biggest stars
//
// Artwork files live in public/cards/ and must share the same geometry as bronze-card.png,
// because the card layout (photo, name, stats positions) is measured on that frame.

export type CardTier = "bronze" | "silver" | "gold" | "diamond" | "legendary" | "basic";

/** "basic" is only a legacy alias (no price known); it uses the bronze artwork. */
export const CARD_TIERS: readonly CardTier[] = ["bronze", "silver", "gold", "diamond", "legendary"];

export const CARD_ARTWORK: Record<CardTier, string> = {
  bronze: "/cards/bronze-card.png",
  silver: "/cards/silver-card.png",
  gold: "/cards/golden-card.png",
  diamond: "/cards/diamond-card.png",
  legendary: "/cards/legendary-card.png",
  basic: "/cards/bronze-card.png",
};

/** Lowest price of each tier, highest tier first. Anything below Silver is Bronze. */
export const TIER_THRESHOLDS: ReadonlyArray<{ tier: CardTier; minPrice: number }> = [
  { tier: "legendary", minPrice: 26 },
  { tier: "diamond", minPrice: 21 },
  { tier: "gold", minPrice: 17 },
  { tier: "silver", minPrice: 13 },
];

export function tierFromPrice(price: number): CardTier {
  for (const { tier, minPrice } of TIER_THRESHOLDS) {
    if (price >= minPrice) return tier;
  }
  return "bronze";
}

export function isCardTier(value: unknown): value is CardTier {
  return typeof value === "string" && value in CARD_ARTWORK;
}

export function cardArtwork(tier: CardTier): string {
  return CARD_ARTWORK[tier] ?? CARD_ARTWORK.bronze;
}