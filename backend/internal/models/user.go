package models

import "time"

type User struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Username string `gorm:"uniqueIndex;not null" json:"username"`

	// Email is a pointer so accounts created before emails existed stay NULL
	// (Postgres allows many NULLs in a unique index). Always stored lowercase.
	Email *string `gorm:"uniqueIndex" json:"email,omitempty"`

	// EmailVerified is true only when the address was proven (Google sign-in).
	EmailVerified bool `gorm:"not null;default:false" json:"email_verified"`

	// GoogleSub is Google's stable account id; NULL for non-Google accounts.
	GoogleSub *string `gorm:"uniqueIndex" json:"-"`

	// PasswordHash is empty for accounts that only use Google.
	PasswordHash string    `gorm:"not null;default:''" json:"-"`
	Role         string    `gorm:"not null;default:user" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
