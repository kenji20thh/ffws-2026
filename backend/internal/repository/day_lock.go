package repository

import (
	"time"

	"ffws/internal/models"

	"gorm.io/gorm"
)

// isDayLocked is the single lock rule shared by Fantasy and Predictions.
//
//   - If the day has a deadline, the deadline is the final word: open until it passes.
//     An admin can reopen or close a day by moving the deadline.
//   - Only a day with NO deadline falls back to "locked once any of its rooms is
//     live/completed or already has results", so nobody can pick after seeing results.
func isDayLocked(db *gorm.DB, day *models.TournamentDay) (bool, error) {
	if !day.Deadline.IsZero() {
		return time.Now().After(day.Deadline), nil
	}

	var started int64
	err := db.Raw(`
		SELECT COUNT(*) FROM rooms r
		WHERE r.tournament_day_id = ?
		  AND (r.status IN ('live', 'completed')
		       OR EXISTS (SELECT 1 FROM room_team_results rtr WHERE rtr.room_id = r.id))
	`, day.ID).Scan(&started).Error
	if err != nil {
		return false, err
	}
	return started > 0, nil
}
