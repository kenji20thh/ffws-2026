package repository

import (
	"ffws/internal/models"
	"ffws/internal/service"

	"gorm.io/gorm"
)

type RoomResultRepository struct {
	db *gorm.DB
}

func NewRoomResultRepository(db *gorm.DB) *RoomResultRepository {
	return &RoomResultRepository{db: db}
}

type TeamResultInput struct {
	TeamID    uint
	Placement int
	Players   []PlayerKillInput
}

type PlayerKillInput struct {
	PlayerID uint
	Kills    int
}

// SubmitTeamResult saves or updates one team's placement and player kills for a room.
// Safe to call multiple times for the same team (corrections) without affecting other teams.
func (r *RoomResultRepository) SubmitTeamResult(roomID uint, team TeamResultInput) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// remove only this team's previous results for this room (not the whole room)
		if err := tx.Where("room_id = ? AND team_id = ?", roomID, team.TeamID).
			Delete(&models.RoomTeamResult{}).Error; err != nil {
			return err
		}
		if err := tx.Where("room_id = ? AND team_id = ?", roomID, team.TeamID).
			Delete(&models.PlayerRoomStat{}).Error; err != nil {
			return err
		}

		teamResult := models.RoomTeamResult{
			RoomID:    roomID,
			TeamID:    team.TeamID,
			Placement: team.Placement,
		}
		if err := tx.Create(&teamResult).Error; err != nil {
			return err
		}

		for _, p := range team.Players {
			stat := models.PlayerRoomStat{
				RoomID:   roomID,
				PlayerID: p.PlayerID,
				TeamID:   team.TeamID,
				Kills:    p.Kills,
			}
			if err := tx.Create(&stat).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// SubmitRoomResults handles one or more teams at once, calling SubmitTeamResult for each.
// You can submit a single team (as they die) or several at once — same entrypoint either way.
func (r *RoomResultRepository) SubmitRoomResults(roomID uint, teams []TeamResultInput) error {
	for _, team := range teams {
		if err := r.SubmitTeamResult(roomID, team); err != nil {
			return err
		}
	}
	return nil
}

// GetRoomSummary returns each team's placement, total kills, and total points for a room.
func (r *RoomResultRepository) GetRoomSummary(roomID uint) ([]TeamRoomSummary, error) {
	var results []models.RoomTeamResult
	if err := r.db.Preload("Team").Where("room_id = ?", roomID).Find(&results).Error; err != nil {
		return nil, err
	}

	var summaries []TeamRoomSummary
	for _, res := range results {
		var totalKills int64
		r.db.Model(&models.PlayerRoomStat{}).
			Where("room_id = ? AND team_id = ?", roomID, res.TeamID).
			Select("COALESCE(SUM(kills), 0)").
			Scan(&totalKills)

		summaries = append(summaries, TeamRoomSummary{
			TeamID:          res.TeamID,
			TeamName:        res.Team.Name,
			Placement:       res.Placement,
			TotalKills:      int(totalKills),
			PlacementPoints: service.PlacementPoints(res.Placement),
			KillPoints:      service.KillPoints(int(totalKills)),
			TotalPoints:     service.PlacementPoints(res.Placement) + service.KillPoints(int(totalKills)),
		})
	}
	return summaries, nil
}

type TeamRoomSummary struct {
	TeamID          uint   `json:"team_id"`
	TeamName        string `json:"team_name"`
	Placement       int    `json:"placement"`
	TotalKills      int    `json:"total_kills"`
	PlacementPoints int    `json:"placement_points"`
	KillPoints      int    `json:"kill_points"`
	TotalPoints     int    `json:"total_points"`
}
