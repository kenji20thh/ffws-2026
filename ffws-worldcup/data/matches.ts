import type { Match } from "./types";
// Empty until the official schedule is published.
export const matches: Match[] = [];
export const getMatch = (id: string) => matches.find((m) => m.id === id);
