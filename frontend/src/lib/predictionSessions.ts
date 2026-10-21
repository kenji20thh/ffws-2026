import type { DayTeam, PredictionTeamEntry, Team } from "@/types";

/** Teams per lobby. */
export const SESSION_SIZE = 12;

/** Max points for one session (12 teams x 12). */
export const MAX_SESSION_POINTS = 144;

/** Group a day's teams by session (a missing session counts as 1). */
export function groupTeamsBySession(dayTeams: DayTeam[]): Record<number, Team[]> {
  const out: Record<number, Team[]> = {};
  for (const dt of dayTeams) {
    const s = dt.session ?? 1;
    (out[s] ??= []).push(dt.team);
  }
  return out;
}

/** Group prediction entries by session, each sorted by predicted placement. */
export function groupEntriesBySession(
  entries: PredictionTeamEntry[]
): Record<number, PredictionTeamEntry[]> {
  const out: Record<number, PredictionTeamEntry[]> = {};
  for (const e of entries) {
    (out[e.session ?? 1] ??= []).push(e);
  }
  for (const list of Object.values(out)) {
    list.sort((a, b) => a.predicted_placement - b.predicted_placement);
  }
  return out;
}

/** Sorted session numbers of a grouped record. */
export function sessionKeys(grouped: Record<number, unknown>): number[] {
  return Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);
}
