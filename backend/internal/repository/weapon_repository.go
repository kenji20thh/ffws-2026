package repository

import (
	"errors"

	"ffws/internal/models"

	"gorm.io/gorm"
)

var (
	ErrWeaponUnknown        = errors.New("one or more weapons do not exist")
	ErrWeaponPlayerNotFound = errors.New("player not found")
)

type WeaponRepository struct {
	db *gorm.DB
}

func NewWeaponRepository(db *gorm.DB) *WeaponRepository {
	return &WeaponRepository{db: db}
}

// WeaponKillInput is one weapon and how many kills a player got with it.
type WeaponKillInput struct {
	WeaponID uint
	Kills    int
}

func (r *WeaponRepository) List() ([]models.Weapon, error) {
	var weapons []models.Weapon
	err := r.db.Order("name ASC").Find(&weapons).Error
	return weapons, err
}

func (r *WeaponRepository) PlayerKills(playerID uint) ([]models.PlayerWeaponKill, error) {
	var rows []models.PlayerWeaponKill
	err := r.db.Where("player_id = ?", playerID).Order("kills DESC").Find(&rows).Error
	return rows, err
}

// ReplacePlayerKills makes entries the player's complete weapon list: weapons
// that are not in entries are removed. Callers pass only entries with kills > 0
// and no weapon twice.
func (r *WeaponRepository) ReplacePlayerKills(playerID uint, entries []WeaponKillInput) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var n int64
		if err := tx.Model(&models.Player{}).Where("id = ?", playerID).Count(&n).Error; err != nil {
			return err
		}
		if n == 0 {
			return ErrWeaponPlayerNotFound
		}

		if len(entries) > 0 {
			ids := make([]uint, 0, len(entries))
			for _, e := range entries {
				ids = append(ids, e.WeaponID)
			}
			if err := tx.Model(&models.Weapon{}).Where("id IN ?", ids).Count(&n).Error; err != nil {
				return err
			}
			if int(n) != len(ids) {
				return ErrWeaponUnknown
			}
		}

		if err := tx.Where("player_id = ?", playerID).Delete(&models.PlayerWeaponKill{}).Error; err != nil {
			return err
		}

		if len(entries) == 0 {
			return nil
		}
		rows := make([]models.PlayerWeaponKill, 0, len(entries))
		for _, e := range entries {
			rows = append(rows, models.PlayerWeaponKill{PlayerID: playerID, WeaponID: e.WeaponID, Kills: e.Kills})
		}
		return tx.Create(&rows).Error
	})
}
