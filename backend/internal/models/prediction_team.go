package models

type PredictionTeam struct {
	ID                 uint `gorm:"primaryKey" json:"id"`
	PredictionID       uint `gorm:"not null;index" json:"prediction_id"`
	TeamID             uint `gorm:"not null;index" json:"team_id"`
	PredictedPlacement int  `gorm:"not null" json:"predicted_placement"`
	ActualPlacement    int  `gorm:"default:0" json:"actual_placement"`
	Points             int  `gorm:"default:0" json:"points"`

	Team Team `gorm:"foreignKey:TeamID" json:"team"`
}
