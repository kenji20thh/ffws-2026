package models

type TeamStaff struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	TeamID   uint   `gorm:"not null;index" json:"team_id"`
	Name     string `gorm:"not null" json:"name"`
	Role     string `json:"role"`
	PhotoURL string `json:"photo_url"`
	Country  string `json:"country"`

	Team Team `gorm:"foreignKey:TeamID" json:"-"`
}
