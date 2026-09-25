import type { Player } from "./types";
import { teams } from "./teams";
// DEMO DATA — generated from demo teams. Replace with real rosters.
export const players: Player[] = teams.flatMap((t, ti) =>
  [1, 2, 3, 4].map((n) => ({ slug: `demo-player-${ti + 1}-${n}`, nickname: `Player ${ti + 1}.${n}`, teamSlug: t.slug, country: t.country, countryCode: t.countryCode, isPlaceholder: true }))
);
export const getPlayer = (slug: string) => players.find((p) => p.slug === slug);
export const playersByTeam = (teamSlug: string) => players.filter((p) => p.teamSlug === teamSlug);
