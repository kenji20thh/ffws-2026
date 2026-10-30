package models

// Weapon is a weapon that kills can be credited to. The rows are added by hand in the database.
type Weapon struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Name     string `gorm:"not null;uniqueIndex" json:"name"`
	Category string `json:"category"` // AR, SMG, Sniper, Shotgun, LMG, Pistol...
	ImageURL string `json:"image_url"`
}

// PlayerWeaponKill is how many kills a player got with one weapon.
// There is one row per (player, weapon).
type PlayerWeaponKill struct {
	ID       uint `gorm:"primaryKey" json:"id"`
	PlayerID uint `gorm:"not null;uniqueIndex:idx_player_weapon" json:"player_id"`
	WeaponID uint `gorm:"not null;uniqueIndex:idx_player_weapon;index" json:"weapon_id"`
	Kills    int  `gorm:"not null;default:0" json:"kills"`

	Player Player `gorm:"foreignKey:PlayerID;constraint:OnDelete:CASCADE" json:"-"`
	Weapon Weapon `gorm:"foreignKey:WeaponID;constraint:OnDelete:CASCADE" json:"-"`
}
