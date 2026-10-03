package repository

import (
	"ffws/internal/models"

	"gorm.io/gorm"
)

type TeamRepository struct {
	db *gorm.DB
}

func NewTeamRepository(db *gorm.DB) *TeamRepository {
	return &TeamRepository{db: db}
}

func (r *TeamRepository) Create(t *models.Team) error {
	return r.db.Create(t).Error
}

func (r *TeamRepository) FindByTournament(tournamentID uint) ([]models.Team, error) {
	var teams []models.Team
	err := r.db.Where("tournament_id = ?", tournamentID).Find(&teams).Error
	return teams, err
}

func (r *TeamRepository) FindByID(id uint) (*models.Team, error) {
	var team models.Team
	err := r.db.Preload("Players").First(&team, id).Error
	if err != nil {
		return nil, err
	}
	return &team, nil
}

func (r *TeamRepository) Update(t *models.Team) error {
	return r.db.Save(t).Error
}

func (r *TeamRepository) Delete(id uint) error {
	return r.db.Delete(&models.Team{}, id).Error
}
