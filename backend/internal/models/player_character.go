package models

// PlayerCharacter is one of the characters a player uses most. Slot 1 is the main
// character (shown large on the profile), slots 2-5 are the others. Character is the
// file name (without extension) of the picture in the frontend's public/characters/
// folder, e.g. "skyler" for public/characters/skyler.png.
type PlayerCharacter struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	PlayerID  uint   `gorm:"not null;uniqueIndex:idx_player_character_slot" json:"player_id"`
	Slot      int    `gorm:"not null;uniqueIndex:idx_player_character_slot" json:"slot"`
	Character string `gorm:"column:character_name;not null" json:"character"`

	Player Player `gorm:"foreignKey:PlayerID;constraint:OnDelete:CASCADE" json:"-"`
}
