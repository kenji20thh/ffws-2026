package repository

import (
	"ffws/internal/models"

	"gorm.io/gorm"
)

type TournamentDayTeamRepository struct {
	db *gorm.DB
}

func NewTournamentDayTeamRepository(db *gorm.DB) *TournamentDayTeamRepository {
	return &TournamentDayTeamRepository{db: db}
}

// AssignTeams bulk-inserts team assignments for a day, skipping ones that already exist.
func (r *TournamentDayTeamRepository) AssignTeams(dayID uint, teamIDs []uint) error {
	var entries []models.TournamentDayTeam
	for _, teamID := range teamIDs {
		entries = append(entries, models.TournamentDayTeam{
			TournamentDayID: dayID,
			TeamID:          teamID,
		})
	}
	return r.db.Create(&entries).Error
}

func (r *TournamentDayTeamRepository) FindByDay(dayID uint) ([]models.TournamentDayTeam, error) {
	var entries []models.TournamentDayTeam
	err := r.db.Preload("Team").Where("tournament_day_id = ?", dayID).Find(&entries).Error
	return entries, err
}
