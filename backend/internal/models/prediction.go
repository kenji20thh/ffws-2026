package models

import "time"

// Prediction belongs to a competitor team — the same shared identity (team name +
// country) used by the Fantasy game — rather than directly to a user. This is why
// it references models.FantasyTeam: Fantasy and Predictions share one team identity
// per user per tournament, even though they're otherwise fully separate systems.
type Prediction struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	CompetitorTeamID uint       `gorm:"not null;uniqueIndex:idx_competitor_day" json:"competitor_team_id"`
	TournamentID     uint       `gorm:"not null;index" json:"tournament_id"`
	TournamentDayID  uint       `gorm:"not null;uniqueIndex:idx_competitor_day" json:"tournament_day_id"`
	TotalPoints      int        `gorm:"default:0" json:"total_points"`
	SubmittedAt      time.Time  `json:"submitted_at"`
	ScoredAt         *time.Time `json:"scored_at"`
}
