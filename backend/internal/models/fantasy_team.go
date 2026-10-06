package models

import "time"

type FantasyTeam struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"not null;uniqueIndex:idx_user_tournament" json:"user_id"`
	TournamentID uint      `gorm:"not null;uniqueIndex:idx_user_tournament" json:"tournament_id"`
	TeamName     string    `gorm:"not null" json:"team_name"`
	Country      string    `json:"country"`

	// Region is the league this team belongs to ("" = Global only). It is derived
	// from Country on the server when the team is created and never set by clients.
	Region    string    `gorm:"not null;default:'';index" json:"region"`
	CreatedAt time.Time `json:"created_at"`
}
