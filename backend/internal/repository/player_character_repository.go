package repository

import (
	"errors"

	"ffws/internal/models"

	"gorm.io/gorm"
)

var ErrCharacterPlayerNotFound = errors.New("player not found")

// MaxPlayerCharacters is how many characters a player can show on the profile.
const MaxPlayerCharacters = 5

type PlayerCharacterRepository struct {
	db *gorm.DB
}

func NewPlayerCharacterRepository(db *gorm.DB) *PlayerCharacterRepository {
	return &PlayerCharacterRepository{db: db}
}

// List returns the player's characters ordered by slot (slot 1 = main).
func (r *PlayerCharacterRepository) List(playerID uint) ([]models.PlayerCharacter, error) {
	var rows []models.PlayerCharacter
	err := r.db.Where("player_id = ?", playerID).Order("slot ASC").Find(&rows).Error
	return rows, err
}

// Replace makes characters the player's complete list: the first one becomes slot 1
// (the main), the next slot 2, and so on. Callers pass at most MaxPlayerCharacters
// names with no duplicates; an empty list clears the player's characters.
func (r *PlayerCharacterRepository) Replace(playerID uint, characters []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var n int64
		if err := tx.Model(&models.Player{}).Where("id = ?", playerID).Count(&n).Error; err != nil {
			return err
		}
		if n == 0 {
			return ErrCharacterPlayerNotFound
		}

		if err := tx.Where("player_id = ?", playerID).Delete(&models.PlayerCharacter{}).Error; err != nil {
			return err
		}
		if len(characters) == 0 {
			return nil
		}

		rows := make([]models.PlayerCharacter, 0, len(characters))
		for i, c := range characters {
			rows = append(rows, models.PlayerCharacter{PlayerID: playerID, Slot: i + 1, Character: c})
		}
		return tx.Create(&rows).Error
	})
}
