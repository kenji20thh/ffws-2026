package service

import "sort"

// FormMatchdays is how many of the most recent completed matchdays count
// towards a player's form.
const FormMatchdays = 3

// FormNone means "no form to show": the player has no fantasy points yet in
// the recent matchdays (e.g. before the tournament starts).
const FormNone = 0

// FormRatings turns each player's average fantasy points (over the recent
// matchdays) into a form rating from 1 (cold) to 5 (hot).
//
// The rating is relative to the other players: the top fifth gets 5, the
// next fifth 4, and so on down to 1. Players with the same average get the
// same rating. Players missing from avg get no entry, i.e. no form.
func FormRatings(avg map[uint]float64) map[uint]int {
	ratings := make(map[uint]int, len(avg))
	if len(avg) == 0 {
		return ratings
	}

	sorted := make([]float64, 0, len(avg))
	for _, v := range avg {
		sorted = append(sorted, v)
	}
	sort.Float64s(sorted)
	n := len(sorted)

	for id, v := range avg {
		// players strictly above this one; ties share the same rank
		above := n - sort.Search(n, func(i int) bool { return sorted[i] > v })
		rating := 5 - above*5/n
		if rating < 1 {
			rating = 1
		}
		if rating > 5 {
			rating = 5
		}
		ratings[id] = rating
	}
	return ratings
}
