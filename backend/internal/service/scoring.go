package service

var placementPointsTable = map[int]int{
	1:  12,
	2:  9,
	3:  8,
	4:  7,
	5:  6,
	6:  5,
	7:  4,
	8:  3,
	9:  2,
	10: 1,
	11: 0,
	12: 0,
}

func PlacementPoints(placement int) int {
	if pts, ok := placementPointsTable[placement]; ok {
		return pts
	}
	return 0
}

func KillPoints(kills int) int {
	return kills
}
