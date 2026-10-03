package models

type RoomTeamResult struct {
	ID        uint `gorm:"primaryKey" json:"id"`
	RoomID    uint `gorm:"not null;index" json:"room_id"`
	TeamID    uint `gorm:"not null;index" json:"team_id"`
	Placement int  `gorm:"not null" json:"placement"`

	Room Room `gorm:"foreignKey:RoomID" json:"-"`
	Team Team `gorm:"foreignKey:TeamID" json:"team"`
}
