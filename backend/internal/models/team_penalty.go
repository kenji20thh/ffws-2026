package models

import "time"

// TeamPenalty is a points deduction given to a team on one tournament day.
// Points is stored as a POSITIVE number and is subtracted from the team's day total
// (Points = 3 means -3). Several penalties on the same day/team add up.
// Rows are inserted straight into the database (no admin panel yet), e.g.:
//
//	INSERT INTO team_penalties (tournament_day_id, team_id, points, reason, created_at)
//	VALUES (1, 5, 3, 'Late to lobby', NOW());
type TeamPenalty struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	TournamentDayID uint      `gorm:"not null;index" json:"tournament_day_id"`
	TeamID          uint      `gorm:"not null;index" json:"team_id"`
	Points          int       `gorm:"not null" json:"points"`
	Reason          string    `json:"reason"`
	CreatedAt       time.Time `json:"created_at"`

	TournamentDay TournamentDay `gorm:"foreignKey:TournamentDayID" json:"-"`
	Team          Team          `gorm:"foreignKey:TeamID" json:"-"`
}
