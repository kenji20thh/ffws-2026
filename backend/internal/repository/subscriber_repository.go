package repository

import (
	"ffws/internal/models"

	"gorm.io/gorm"
)

type SubscriberRepository struct {
	db *gorm.DB
}

func NewSubscriberRepository(db *gorm.DB) *SubscriberRepository {
	return &SubscriberRepository{db: db}
}

func (r *SubscriberRepository) Create(email string) (*models.Subscriber, error) {
	subscriber := &models.Subscriber{Email: email}
	result := r.db.Create(subscriber)
	if result.Error != nil {
		return nil, result.Error
	}
	return subscriber, nil
}

func (r *SubscriberRepository) EmailExists(email string) (bool, error) {
	var count int64
	err := r.db.Model(&models.Subscriber{}).Where("email = ?", email).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
