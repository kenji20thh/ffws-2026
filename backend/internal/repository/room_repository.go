package repository

import (
	"ffws/internal/models"

	"gorm.io/gorm"
)

type RoomRepository struct {
	db *gorm.DB
}

func NewRoomRepository(db *gorm.DB) *RoomRepository {
	return &RoomRepository{db: db}
}

func (r *RoomRepository) Create(room *models.Room) error {
	return r.db.Create(room).Error
}

func (r *RoomRepository) FindByDay(dayID uint) ([]models.Room, error) {
	var rooms []models.Room
	err := r.db.Where("tournament_day_id = ?", dayID).
		Order("room_number asc").
		Find(&rooms).Error
	return rooms, err
}

func (r *RoomRepository) FindByID(id uint) (*models.Room, error) {
	var room models.Room
	err := r.db.First(&room, id).Error
	if err != nil {
		return nil, err
	}
	return &room, nil
}
