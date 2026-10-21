package models

type TournamentDayTeam struct {
	ID              uint `gorm:"primaryKey" json:"id"`
	TournamentDayID uint `gorm:"not null;index" json:"tournament_day_id"`
	TeamID          uint `gorm:"not null;index" json:"team_id"`
	// Session is the lobby the team plays in that day, starting at 1. A day can hold
	// several lobbies of 12 teams (Knockout Phase 1 has 2 per day).
	Session int `gorm:"not null;default:1" json:"session"`

	TournamentDay TournamentDay `gorm:"foreignKey:TournamentDayID" json:"-"`
	Team          Team          `gorm:"foreignKey:TeamID" json:"team"`
}
