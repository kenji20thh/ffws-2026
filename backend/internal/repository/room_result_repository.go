package repository

import (
	"errors"
	"fmt"
	"sort"

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
	PlayerID   uint
	Kills      int
	FirstBlood bool
}

var ErrRoomNotFound = errors.New("room not found")

// ResultError is a user-facing validation problem with submitted results (safe to show to the admin).
// Any other error returned by SubmitRoomResults is an internal failure.
type ResultError struct{ Msg string }

func (e *ResultError) Error() string { return e.Msg }

func invalidResult(format string, args ...any) error {
	return &ResultError{Msg: fmt.Sprintf(format, args...)}
}

// saveTeamResult replaces one team's placement and player kills for a room, inside tx.
// Re-submitting a team (a correction) never touches other teams' rows.
func saveTeamResult(tx *gorm.DB, roomID uint, team TeamResultInput) error {
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
			RoomID:     roomID,
			PlayerID:   p.PlayerID,
			TeamID:     team.TeamID,
			Kills:      p.Kills,
			FirstBlood: p.FirstBlood,
		}
		if err := tx.Create(&stat).Error; err != nil {
			return err
		}
	}
	return nil
}

// SubmitTeamResult saves or updates a single team. Kept for callers that submit one team at a time.
func (r *RoomResultRepository) SubmitTeamResult(roomID uint, team TeamResultInput) error {
	return r.SubmitRoomResults(roomID, []TeamResultInput{team})
}

// SubmitRoomResults validates and saves one or more teams for a room.
// All teams are saved in ONE transaction: either every team is saved or none is.
func (r *RoomResultRepository) SubmitRoomResults(roomID uint, teams []TeamResultInput) error {
	var room models.Room
	if err := r.db.First(&room, roomID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrRoomNotFound
		}
		return err
	}

	if err := r.validateResults(&room, teams); err != nil {
		return err
	}

	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, team := range teams {
			if err := saveTeamResult(tx, roomID, team); err != nil {
				return err
			}
		}
		return nil
	})
}

// validateResults checks the submission against the room's day, teams and players.
func (r *RoomResultRepository) validateResults(room *models.Room, teams []TeamResultInput) error {
	// 1. No team and no placement may appear twice in the same submission.
	teamIDs := make([]uint, 0, len(teams))
	inRequest := map[uint]bool{}
	placementTaken := map[int]bool{}
	for _, t := range teams {
		if inRequest[t.TeamID] {
			return invalidResult("team %d appears more than once in this submission", t.TeamID)
		}
		inRequest[t.TeamID] = true
		teamIDs = append(teamIDs, t.TeamID)

		if placementTaken[t.Placement] {
			return invalidResult("placement %d is given to more than one team", t.Placement)
		}
		placementTaken[t.Placement] = true
	}

	// 2. Every team must be assigned to this room's tournament day.
	var assigned []uint
	if err := r.db.Model(&models.TournamentDayTeam{}).
		Where("tournament_day_id = ? AND team_id IN ?", room.TournamentDayID, teamIDs).
		Pluck("team_id", &assigned).Error; err != nil {
		return err
	}
	assignedSet := map[uint]bool{}
	for _, id := range assigned {
		assignedSet[id] = true
	}
	for _, id := range teamIDs {
		if !assignedSet[id] {
			return invalidResult("team %d is not assigned to this room's tournament day", id)
		}
	}

	// 3. Every player must exist, belong to the team they are submitted under, and appear once.
	playerIDs := []uint{}
	seenPlayer := map[uint]bool{}
	for _, t := range teams {
		firstBloods := 0
		for _, p := range t.Players {
			if seenPlayer[p.PlayerID] {
				return invalidResult("player %d appears more than once in this submission", p.PlayerID)
			}
			seenPlayer[p.PlayerID] = true
			playerIDs = append(playerIDs, p.PlayerID)
			if p.FirstBlood {
				firstBloods++
			}
		}
		if firstBloods > 1 {
			return invalidResult("team %d has more than one first-blood player", t.TeamID)
		}
	}

	var playerRows []struct {
		ID     uint
		TeamID uint
	}
	if err := r.db.Raw(`SELECT id, team_id FROM players WHERE id IN (?)`, playerIDs).
		Scan(&playerRows).Error; err != nil {
		return err
	}
	playerTeam := map[uint]uint{}
	for _, row := range playerRows {
		playerTeam[row.ID] = row.TeamID
	}
	for _, t := range teams {
		for _, p := range t.Players {
			if owner, ok := playerTeam[p.PlayerID]; !ok || owner != t.TeamID {
				return invalidResult("player %d does not belong to team %d", p.PlayerID, t.TeamID)
			}
		}
	}

	// 4. A placement already saved for a DIFFERENT team in this room can't be reused.
	//    (Teams in this submission are being replaced, so their old placements are free.)
	var existing []models.RoomTeamResult
	if err := r.db.Where("room_id = ?", room.ID).Find(&existing).Error; err != nil {
		return err
	}
	for _, e := range existing {
		if inRequest[e.TeamID] {
			continue
		}
		if placementTaken[e.Placement] {
			return invalidResult("placement %d is already taken by another team in this room (to swap placements, submit both teams together)", e.Placement)
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

// GetTournamentStandings aggregates every team's points across all rooms in a tournament,
// sorted by total points descending (highest first).
// Three queries in total, however many teams and rooms there are.
func (r *RoomResultRepository) GetTournamentStandings(tournamentID uint) ([]TeamStandingSummary, error) {
	var teams []models.Team
	if err := r.db.Where("tournament_id = ?", tournamentID).Order("id ASC").Find(&teams).Error; err != nil {
		return nil, err
	}
	if len(teams) == 0 {
		return []TeamStandingSummary{}, nil
	}

	var results []struct {
		RoomID    uint
		TeamID    uint
		Placement int
	}
	if err := r.db.Raw(`
		SELECT rtr.room_id, rtr.team_id, rtr.placement
		FROM room_team_results rtr
		JOIN teams t ON t.id = rtr.team_id
		WHERE t.tournament_id = ?`, tournamentID).Scan(&results).Error; err != nil {
		return nil, err
	}

	var killRows []struct {
		RoomID uint
		TeamID uint
		Kills  int
	}
	if err := r.db.Raw(`
		SELECT prs.room_id, prs.team_id, COALESCE(SUM(prs.kills), 0) AS kills
		FROM player_room_stats prs
		JOIN teams t ON t.id = prs.team_id
		WHERE t.tournament_id = ?
		GROUP BY prs.room_id, prs.team_id`, tournamentID).Scan(&killRows).Error; err != nil {
		return nil, err
	}

	type roomTeam struct{ roomID, teamID uint }
	kills := map[roomTeam]int{}
	for _, k := range killRows {
		kills[roomTeam{k.RoomID, k.TeamID}] = k.Kills
	}

	byTeam := make(map[uint]*TeamStandingSummary, len(teams))
	standings := make([]TeamStandingSummary, 0, len(teams))
	for _, t := range teams {
		standings = append(standings, TeamStandingSummary{TeamID: t.ID, TeamName: t.Name})
	}
	for i := range standings {
		byTeam[standings[i].TeamID] = &standings[i]
	}

	for _, res := range results {
		s := byTeam[res.TeamID]
		if s == nil {
			continue
		}
		s.RoomsPlayed++
		s.PlacementPoints += service.PlacementPoints(res.Placement)
		s.KillPoints += service.KillPoints(kills[roomTeam{res.RoomID, res.TeamID}])
	}
	for i := range standings {
		standings[i].TotalPoints = standings[i].PlacementPoints + standings[i].KillPoints
	}

	// highest points first; equal points keep their original order (no tiebreak rule is applied)
	sort.SliceStable(standings, func(i, j int) bool { return standings[i].TotalPoints > standings[j].TotalPoints })
	return standings, nil
}

type TeamStandingSummary struct {
	TeamID          uint   `json:"team_id"`
	TeamName        string `json:"team_name"`
	RoomsPlayed     int    `json:"rooms_played"`
	PlacementPoints int    `json:"placement_points"`
	KillPoints      int    `json:"kill_points"`
	TotalPoints     int    `json:"total_points"`
}
