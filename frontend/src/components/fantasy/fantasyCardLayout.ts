import type { CSSProperties } from "react";

// Geometry of the card artwork (public/cards/ffws-card-*.png), measured in ARTWORK PIXELS.
// Everything on the card is positioned as a percentage of these numbers and sized in
// container-query units (cqw), so the whole card scales with its width and never needs
// fixed pixel positions. If the artwork is replaced by a frame with different panel
// positions, only the numbers in this file need to change.

export const CARD_ART_WIDTH = 932;
export const CARD_ART_HEIGHT = 1480;

export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const CARD_ZONES = {
  // the big gold field: the player photo sits on its bottom edge, just above the lower plate
  portrait: { x: 108, y: 110, w: 742, h: 815 },
  // black angular panel at the top left
  overall: { x: 66, y: 186, w: 132, h: 96 },
  role: { x: 76, y: 284, w: 112, h: 70 },
  captainBadge: { x: 772, y: 128, w: 62, h: 62 },
  // lower plate, upper band
  name: { x: 150, y: 1034, w: 632, h: 66 },
  // lower plate, lower band (team / flag / price row, then the four stats)
  meta: { x: 150, y: 1124, w: 632, h: 50 },
  stats: { x: 215, y: 1180, w: 502, h: 82 },
  // used instead of meta + stats when the stats are hidden (small cards)
  metaCompact: { x: 190, y: 1130, w: 552, h: 120 },
} as const satisfies Record<string, Zone>;

const pct = (value: number, total: number) => `${((value / total) * 100).toFixed(3)}%`;

/** Absolute-position style for a zone, as percentages of the card. */
export function zoneStyle(z: Zone): CSSProperties {
  return {
    position: "absolute",
    left: pct(z.x, CARD_ART_WIDTH),
    top: pct(z.y, CARD_ART_HEIGHT),
    width: pct(z.w, CARD_ART_WIDTH),
    height: pct(z.h, CARD_ART_HEIGHT),
  };
}

/** A length measured in artwork pixels, expressed in container-query width units. */
export function cq(artworkPx: number): string {
  return `${((artworkPx / CARD_ART_WIDTH) * 100).toFixed(3)}cqw`;
}
