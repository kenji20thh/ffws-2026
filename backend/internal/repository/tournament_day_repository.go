package repository

import (
	"ffws/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TournamentDayRepository struct {
	db *gorm.DB
}

func NewTournamentDayRepository(db *gorm.DB) *TournamentDayRepository {
	return &TournamentDayRepository{db: db}
}

func (r *TournamentDayRepository) Create(d *models.TournamentDay) error {
	return r.db.Create(d).Error
}

func (r *TournamentDayRepository) FindByTournament(tournamentID uint) ([]models.TournamentDay, error) {
	var days []models.TournamentDay
	err := r.db.Where("tournament_id = ?", tournamentID).
		Order("day_order asc").
		Find(&days).Error
	return days, err
}

func (r *TournamentDayRepository) FindByID(id uint) (*models.TournamentDay, error) {
	var day models.TournamentDay
	err := r.db.Preload("Rooms").First(&day, id).Error
	if err != nil {
		return nil, err
	}
	return &day, nil
}

func (r *TournamentDayRepository) Update(d *models.TournamentDay) error {
	// Omit associations: FindByID preloads Rooms, and Save would otherwise write those rooms back.
	return r.db.Omit(clause.Associations).Save(d).Error
}
