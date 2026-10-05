package models

type PredictionTeam struct {
	ID                 uint `gorm:"primaryKey" json:"id"`
	PredictionID       uint `gorm:"not null;index" json:"prediction_id"`
	TeamID             uint `gorm:"not null;index" json:"team_id"`
	PredictedPlacement int  `gorm:"not null" json:"predicted_placement"`

	Team Team `gorm:"foreignKey:TeamID" json:"team"`
}
