package repository

import (
	"ffws/internal/models"

	"gorm.io/gorm"
)

type TournamentRepository struct {
	db *gorm.DB
}

func NewTournamentRepository(db *gorm.DB) *TournamentRepository {
	return &TournamentRepository{db: db}
}

func (r *TournamentRepository) Create(t *models.Tournament) error {
	return r.db.Create(t).Error
}

func (r *TournamentRepository) FindAll() ([]models.Tournament, error) {
	var tournaments []models.Tournament
	err := r.db.Find(&tournaments).Error
	return tournaments, err
}

func (r *TournamentRepository) FindBySlug(slug string) (*models.Tournament, error) {
	var tournament models.Tournament
	err := r.db.Where("slug = ?", slug).First(&tournament).Error
	if err != nil {
		return nil, err
	}
	return &tournament, nil
}

func (r *TournamentRepository) Update(t *models.Tournament) error {
	return r.db.Save(t).Error
}

func (r *TournamentRepository) Delete(id uint) error {
	return r.db.Delete(&models.Tournament{}, id).Error
}
