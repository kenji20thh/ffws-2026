package models

import "time"

type Player struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TeamID    uint      `gorm:"not null;index" json:"team_id"`
	IGN       string    `gorm:"not null" json:"ign"`
	RealName  string    `json:"real_name"`
	Role      string    `json:"role"` // in-game role: rusher, bomber, support, sniper
	IsCaptain bool      `gorm:"not null;default:false" json:"is_captain"` // team captain (max one per team)
	PhotoURL  string    `json:"photo_url"`
	Region    string    `json:"region"`
	Country   string    `json:"country"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Team Team `gorm:"foreignKey:TeamID" json:"-"`

	FantasyPrice int `gorm:"default:10" json:"fantasy_price"`
}
