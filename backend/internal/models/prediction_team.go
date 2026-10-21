package models

type PredictionTeam struct {
	ID           uint `gorm:"primaryKey" json:"id"`
	PredictionID uint `gorm:"not null;index" json:"prediction_id"`
	TeamID       uint `gorm:"not null;index" json:"team_id"`
	// Session the team plays in that day (starting at 1). Placements are 1-12 within a session.
	Session            int `gorm:"not null;default:1" json:"session"`
	PredictedPlacement int `gorm:"not null" json:"predicted_placement"`

	Team Team `gorm:"foreignKey:TeamID" json:"team"`
}
