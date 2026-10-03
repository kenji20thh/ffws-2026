package repository

import (
	"ffws/internal/models"

	"gorm.io/gorm"
)

type TeamStaffRepository struct {
	db *gorm.DB
}

func NewTeamStaffRepository(db *gorm.DB) *TeamStaffRepository {
	return &TeamStaffRepository{db: db}
}

func (r *TeamStaffRepository) Create(s *models.TeamStaff) error {
	return r.db.Create(s).Error
}

func (r *TeamStaffRepository) FindByTeam(teamID uint) ([]models.TeamStaff, error) {
	var staff []models.TeamStaff
	err := r.db.Where("team_id = ?", teamID).Find(&staff).Error
	return staff, err
}

func (r *TeamStaffRepository) Delete(id uint) error {
	return r.db.Delete(&models.TeamStaff{}, id).Error
}
