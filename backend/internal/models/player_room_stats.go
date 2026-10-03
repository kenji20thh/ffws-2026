package models

type PlayerRoomStat struct {
	ID         uint `gorm:"primaryKey" json:"id"`
	RoomID     uint `gorm:"not null;index" json:"room_id"`
	PlayerID   uint `gorm:"not null;index" json:"player_id"`
	TeamID     uint `gorm:"not null;index" json:"team_id"`
	Kills      int  `gorm:"default:0" json:"kills"`
	FirstBlood bool `gorm:"not null;default:false" json:"first_blood"`

	Room   Room   `gorm:"foreignKey:RoomID" json:"-"`
	Player Player `gorm:"foreignKey:PlayerID" json:"player"`
	Team   Team   `gorm:"foreignKey:TeamID" json:"-"`
}
