package models

// FantasyChipUse records that a fantasy team played a chip on a tournament day.
// A team can play each chip once per tournament, and at most one chip per day.
type FantasyChipUse struct {
	ID              uint   `gorm:"primaryKey" json:"id"`
	FantasyTeamID   uint   `gorm:"not null;uniqueIndex:idx_chip_team_day;uniqueIndex:idx_chip_team_chip" json:"fantasy_team_id"`
	TournamentDayID uint   `gorm:"not null;uniqueIndex:idx_chip_team_day" json:"tournament_day_id"`
	Chip            string `gorm:"not null;uniqueIndex:idx_chip_team_chip" json:"chip"`
}
