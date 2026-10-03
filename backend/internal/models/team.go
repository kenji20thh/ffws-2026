package models

import "time"

type Team struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	TournamentID uint      `gorm:"not null;index" json:"tournament_id"`
	Name         string    `gorm:"not null" json:"name"`
	Tag          string    `json:"tag"`
	LogoURL      string    `json:"logo_url"`
	Region       string    `json:"region"`
	Country      string    `json:"country"`
	SlotNumber   int       `json:"slot_number"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	Tournament Tournament `gorm:"foreignKey:TournamentID" json:"-"`
	Players    []Player   `gorm:"foreignKey:TeamID" json:"players,omitempty"`
}
