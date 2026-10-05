package models

import "time"

// Prediction stores only the submitted picks. Points are never stored here — they're
// always computed live from current results, the same way Fantasy scores work.
type Prediction struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	CompetitorTeamID uint      `gorm:"not null;uniqueIndex:idx_competitor_day" json:"competitor_team_id"`
	TournamentID     uint      `gorm:"not null;index" json:"tournament_id"`
	TournamentDayID  uint      `gorm:"not null;uniqueIndex:idx_competitor_day" json:"tournament_day_id"`
	SubmittedAt      time.Time `json:"submitted_at"`
}
