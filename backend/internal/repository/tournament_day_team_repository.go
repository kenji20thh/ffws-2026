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

// AssignTeams assigns teams to a day's session. A team already assigned to the day is
// moved to the given session instead of being added twice.
func (r *TournamentDayTeamRepository) AssignTeams(dayID uint, teamIDs []uint, session int) error {
	if session < 1 {
		session = 1
	}
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, teamID := range teamIDs {
			res := tx.Model(&models.TournamentDayTeam{}).
				Where("tournament_day_id = ? AND team_id = ?", dayID, teamID).
				Update("session", session)
			if res.Error != nil {
				return res.Error
			}
			if res.RowsAffected > 0 {
				continue
			}
			entry := models.TournamentDayTeam{TournamentDayID: dayID, TeamID: teamID, Session: session}
			if err := tx.Create(&entry).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *TournamentDayTeamRepository) FindByDay(dayID uint) ([]models.TournamentDayTeam, error) {
	var entries []models.TournamentDayTeam
	err := r.db.Preload("Team").Where("tournament_day_id = ?", dayID).Order("session asc, id asc").Find(&entries).Error
	return entries, err
}
