package repository

import (
	"ffws/internal/models"

	"gorm.io/gorm"
)

type PlayerRepository struct {
	db *gorm.DB
}

func NewPlayerRepository(db *gorm.DB) *PlayerRepository {
	return &PlayerRepository{db: db}
}

func (r *PlayerRepository) Create(p *models.Player) error {
	return r.db.Create(p).Error
}

func (r *PlayerRepository) FindByTeam(teamID uint) ([]models.Player, error) {
	var players []models.Player
	err := r.db.Where("team_id = ?", teamID).Find(&players).Error
	return players, err
}

func (r *PlayerRepository) FindByID(id uint) (*models.Player, error) {
	var player models.Player
	err := r.db.First(&player, id).Error
	if err != nil {
		return nil, err
	}
	return &player, nil
}

func (r *PlayerRepository) Update(p *models.Player) error {
	return r.db.Save(p).Error
}

func (r *PlayerRepository) Delete(id uint) error {
	return r.db.Delete(&models.Player{}, id).Error
}
