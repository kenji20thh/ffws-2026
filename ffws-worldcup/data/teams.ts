import type { Team } from "./types";
// DEMO DATA — replace with the official participating teams.
export const teams: Team[] = [
  { slug: "demo-team-1", name: "Demo Team 1", country: "Brazil", countryCode: "BR", region: "Americas", isPlaceholder: true },
  { slug: "demo-team-2", name: "Demo Team 2", country: "Indonesia", countryCode: "ID", region: "Asia", isPlaceholder: true },
  { slug: "demo-team-3", name: "Demo Team 3", country: "Thailand", countryCode: "TH", region: "Asia", isPlaceholder: true },
  { slug: "demo-team-4", name: "Demo Team 4", country: "Morocco", countryCode: "MA", region: "MENA", isPlaceholder: true },
];
export const getTeam = (slug: string) => teams.find((t) => t.slug === slug);
