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
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(p).Error; err != nil {
			return err
		}
		return clearOtherCaptains(tx, p)
	})
}

// clearOtherCaptains keeps a team to a single captain: when p is the captain,
// every other player on the same team loses the flag.
func clearOtherCaptains(tx *gorm.DB, p *models.Player) error {
	if !p.IsCaptain {
		return nil
	}
	return tx.Model(&models.Player{}).
		Where("team_id = ? AND id <> ? AND is_captain = ?", p.TeamID, p.ID, true).
		Update("is_captain", false).Error
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
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(p).Error; err != nil {
			return err
		}
		return clearOtherCaptains(tx, p)
	})
}

func (r *PlayerRepository) Delete(id uint) error {
	return r.db.Delete(&models.Player{}, id).Error
}
