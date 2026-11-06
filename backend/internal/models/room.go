package models

import "time"

type Room struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	TournamentDayID uint      `gorm:"not null;index" json:"tournament_day_id"`
	RoomNumber      int       `gorm:"not null" json:"room_number"`
	// Session is the lobby this room belongs to within the day (1 = first lobby of 12 teams,
	// 2 = second...). Only teams assigned to that session on the day play in this room.
	Session         int       `gorm:"not null;default:1;index" json:"session"`
	MapName         string    `json:"map_name"`
	ScheduledAt     time.Time `json:"scheduled_at"`
	Status          string    `gorm:"default:upcoming" json:"status"` // upcoming, live, completed
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	TournamentDay TournamentDay    `gorm:"foreignKey:TournamentDayID" json:"-"`
	TeamResults   []RoomTeamResult `gorm:"foreignKey:RoomID" json:"team_results,omitempty"`
	PlayerStats   []PlayerRoomStat `gorm:"foreignKey:RoomID" json:"player_stats,omitempty"`
}
