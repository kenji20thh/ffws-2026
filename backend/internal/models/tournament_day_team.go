package models

type TournamentDayTeam struct {
	ID              uint `gorm:"primaryKey" json:"id"`
	TournamentDayID uint `gorm:"not null;index" json:"tournament_day_id"`
	TeamID          uint `gorm:"not null;index" json:"team_id"`

	TournamentDay TournamentDay `gorm:"foreignKey:TournamentDayID" json:"-"`
	Team          Team          `gorm:"foreignKey:TeamID" json:"team"`
}
