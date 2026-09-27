package repository

import "gorm.io/gorm"

type PlayerRepository struct {
	db *gorm.DB
}
