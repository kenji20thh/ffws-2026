const PLACEMENT_POINTS: Record<number, number> = {
  1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1,
};

export const placementPoints = (placement: number) => PLACEMENT_POINTS[placement] ?? 0;
export const killPoints = (kills: number) => kills;
export const teamRoomPoints = (placement: number, totalKills: number) =>
  placementPoints(placement) + killPoints(totalKills);

// --- Fantasy scoring: keep in sync with backend/internal/service/scoring.go ---
export const FANTASY_KILL_POINTS = 10;
export const FANTASY_FIRST_BLOOD_POINTS = 5;
const FANTASY_PLACEMENT_POINTS: Record<number, number> = {
  1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1,
};
export const fantasyPlacementPoints = (placement: number) => FANTASY_PLACEMENT_POINTS[placement] ?? 0;
export const fantasyRoomPoints = (r: { kills: number; first_blood: boolean; placement: number }) =>
  r.kills * FANTASY_KILL_POINTS +
  (r.first_blood ? FANTASY_FIRST_BLOOD_POINTS : 0) +
  fantasyPlacementPoints(r.placement);
