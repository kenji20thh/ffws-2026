package models

import "time"

type TournamentDay struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	TournamentID uint      `gorm:"not null;index" json:"tournament_id"`
	Name         string    `gorm:"not null" json:"name"` // "Day 1", "Day 2"...
	DayOrder     int       `json:"day_order"`
	Date         time.Time `json:"date"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	Tournament Tournament `gorm:"foreignKey:TournamentID" json:"-"`
	Rooms      []Room     `gorm:"foreignKey:TournamentDayID" json:"rooms,omitempty"`
}
