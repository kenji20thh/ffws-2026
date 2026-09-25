import type { Tournament } from "./types";
// Replace with API data later. Location intentionally omitted until confirmed.
export const tournament: Tournament = {
  name: "FFWS World Cup", tagline: "World's best Free Fire teams", startDate: "2026-11-06T00:00:00Z",
  status: "UPCOMING", teamCount: 0, playerCount: 0,
  stages: [{ name: "Stage 1", description: "Details to be announced." }, { name: "Stage 2", description: "Details to be announced." }, { name: "Finals", description: "Details to be announced." }],
  format: ["Official tournament format will be published here.", "Stage structure, point system and qualification rules follow the official rulebook."],
  schedule: [{ date: "2026-11-06", label: "Tournament start" }],
};
