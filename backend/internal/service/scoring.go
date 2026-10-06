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

func FantasyPlacementPoints(placement int) int {
	switch placement {
	case 1:
		return 15
	case 2:
		return 12
	case 3:
		return 10
	case 4:
		return 8
	case 5:
		return 6
	case 6:
		return 5
	case 7:
		return 4
	case 8:
		return 3
	case 9:
		return 2
	case 10:
		return 1
	default:
		return 0
	}
}

const FantasyKillPoints = 10
const FantasyFirstBloodPoints = 5

// PredictionPoints scores a team placement prediction by how close it was to the
// actual result. Same weight regardless of which placement is being predicted —
// no special bonus for predicting 1st.
func PredictionPoints(predicted, actual int) int {
	diff := predicted - actual
	if diff < 0 {
		diff = -diff
	}
	switch diff {
	case 0:
		return 12
	case 1:
		return 9
	case 2:
		return 7
	case 3:
		return 5
	case 4:
		return 3
	case 5:
		return 2
	case 6:
		return 1
	default:
		return 0
	}
}

// Fantasy chips. Each can be played once per tournament, one chip per day.
const (
	ChipTripleCaptain = "triple_captain" // captain scores 3x instead of 2x
	ChipLimitless     = "limitless"      // the $100 budget does not apply
	ChipDuoStack      = "duo_stack"      // one pair of players may come from the same team
)

func IsValidChip(chip string) bool {
	switch chip {
	case ChipTripleCaptain, ChipLimitless, ChipDuoStack:
		return true
	}
	return false
}

// CaptainMultiplier is how many times the captain's points count.
func CaptainMultiplier(chip string) int {
	if chip == ChipTripleCaptain {
		return 3
	}
	return 2
}
