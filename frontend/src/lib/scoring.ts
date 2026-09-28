const PLACEMENT_POINTS: Record<number, number> = {
  1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1,
};

export const placementPoints = (placement: number) => PLACEMENT_POINTS[placement] ?? 0;
export const killPoints = (kills: number) => kills;
export const teamRoomPoints = (placement: number, totalKills: number) =>
  placementPoints(placement) + killPoints(totalKills);