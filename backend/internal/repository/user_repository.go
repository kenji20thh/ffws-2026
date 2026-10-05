package repository

import (
	"fmt"

	"ffws/internal/models"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(u *models.User) error {
	return r.db.Create(u).Error
}

func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByEmail expects an already-lowercased email.
func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByGoogleSub(sub string) (*models.User, error) {
	var user models.User
	err := r.db.Where("google_sub = ?", sub).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UsernameTaken is case-insensitive so "Amine" and "amine" can't both exist.
func (r *UserRepository) UsernameTaken(username string) (bool, error) {
	var n int64
	err := r.db.Model(&models.User{}).Where("LOWER(username) = LOWER(?)", username).Count(&n).Error
	return n > 0, err
}

// SuggestUsername returns base if free, otherwise base1, base2, ... (base is trimmed
// so the result never exceeds maxLen).
func (r *UserRepository) SuggestUsername(base string, maxLen int) (string, error) {
	taken, err := r.UsernameTaken(base)
	if err != nil {
		return "", err
	}
	if !taken {
		return base, nil
	}
	for i := 1; i < 10000; i++ {
		suffix := fmt.Sprintf("%d", i)
		b := base
		if len(b)+len(suffix) > maxLen {
			b = b[:maxLen-len(suffix)]
		}
		candidate := b + suffix
		taken, err := r.UsernameTaken(candidate)
		if err != nil {
			return "", err
		}
		if !taken {
			return candidate, nil
		}
	}
	return "", fmt.Errorf("no free username for %q", base)
}

// LinkGoogle attaches a Google account to an existing user. When the user's email was
// never verified, the password is wiped: otherwise someone could pre-register a victim's
// email with their own password and keep access after the victim signs in with Google.
func (r *UserRepository) LinkGoogle(u *models.User, sub string) error {
	updates := map[string]interface{}{
		"google_sub":     sub,
		"email_verified": true,
	}
	if !u.EmailVerified {
		updates["password_hash"] = ""
	}
	return r.db.Model(&models.User{}).Where("id = ?", u.ID).Updates(updates).Error
}

func (r *UserRepository) UpdateRole(id uint, role string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("role", role).Error
}

func (r *UserRepository) FindAll() ([]models.User, error) {
	var users []models.User
	err := r.db.Find(&users).Error
	return users, err
}
