package models

type FantasySelection struct {
	ID              uint `gorm:"primaryKey" json:"id"`
	FantasyTeamID   uint `gorm:"not null;index" json:"fantasy_team_id"`
	TournamentDayID uint `gorm:"not null;index" json:"tournament_day_id"`
	PlayerID        uint `gorm:"not null;index" json:"player_id"`
	IsCaptain       bool `gorm:"not null;default:false" json:"is_captain"`

	Player Player `gorm:"foreignKey:PlayerID" json:"player"`
}
