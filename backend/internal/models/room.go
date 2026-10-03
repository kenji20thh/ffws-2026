package models

import "time"

type Room struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	TournamentDayID uint      `gorm:"not null;index" json:"tournament_day_id"`
	RoomNumber      int       `gorm:"not null" json:"room_number"`
	MapName         string    `json:"map_name"`
	ScheduledAt     time.Time `json:"scheduled_at"`
	Status          string    `gorm:"default:upcoming" json:"status"` // upcoming, live, completed
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	TournamentDay TournamentDay    `gorm:"foreignKey:TournamentDayID" json:"-"`
	TeamResults   []RoomTeamResult `gorm:"foreignKey:RoomID" json:"team_results,omitempty"`
	PlayerStats   []PlayerRoomStat `gorm:"foreignKey:RoomID" json:"player_stats,omitempty"`
}
