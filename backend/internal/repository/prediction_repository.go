package repository

import (
	"errors"
	"time"

	"ffws/internal/models"
	"ffws/internal/service"

	"gorm.io/gorm"
)

type PredictionRepository struct {
	db *gorm.DB
}

func NewPredictionRepository(db *gorm.DB) *PredictionRepository {
	return &PredictionRepository{db: db}
}

var (
	ErrPredictionNotFound = errors.New("prediction not found")
	ErrPredictionLocked   = errors.New("predictions are locked for this day")
	ErrNoCompetitorTeam   = errors.New("create your team first")
)

type PlacementInput struct {
	TeamID    uint
	Placement int
}

func (r *PredictionRepository) GetDayLockTime(dayID uint) (time.Time, error) {
	var day models.TournamentDay
	if err := r.db.First(&day, dayID).Error; err != nil {
		return time.Time{}, err
	}
	return day.Deadline, nil
}

func (r *PredictionRepository) GetDayTeamIDs(dayID uint) (map[uint]bool, error) {
	var ids []uint
	if err := r.db.Model(&models.TournamentDayTeam{}).
		Where("tournament_day_id = ?", dayID).
		Pluck("team_id", &ids).Error; err != nil {
		return nil, err
	}
	set := make(map[uint]bool, len(ids))
	for _, id := range ids {
		set[id] = true
	}
	return set, nil
}

func (r *PredictionRepository) resolveCompetitorTeam(userID uint, day models.TournamentDay) (*models.FantasyTeam, error) {
	var team models.FantasyTeam
	err := r.db.Where("user_id = ? AND tournament_id = ?", userID, day.TournamentID).First(&team).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrNoCompetitorTeam
		}
		return nil, err
	}
	return &team, nil
}

func (r *PredictionRepository) SubmitPrediction(userID, dayID uint, picks []PlacementInput) (*models.Prediction, error) {
	var day models.TournamentDay
	if err := r.db.First(&day, dayID).Error; err != nil {
		return nil, err
	}

	competitor, err := r.resolveCompetitorTeam(userID, day)
	if err != nil {
		return nil, err
	}

	dayTeams, err := r.GetDayTeamIDs(dayID)
	if err != nil {
		return nil, err
	}
	if len(dayTeams) != 12 {
		return nil, errors.New("this tournament day does not have exactly 12 teams assigned")
	}
	if len(picks) != 12 {
		return nil, errors.New("you must predict all 12 teams")
	}

	seenTeams := map[uint]bool{}
	seenPlacements := map[int]bool{}
	for _, p := range picks {
		if seenTeams[p.TeamID] {
			return nil, errors.New("duplicate team in prediction")
		}
		seenTeams[p.TeamID] = true

		if p.Placement < 1 || p.Placement > 12 {
			return nil, errors.New("placements must be between 1 and 12")
		}
		if seenPlacements[p.Placement] {
			return nil, errors.New("duplicate placement in prediction")
		}
		seenPlacements[p.Placement] = true

		if !dayTeams[p.TeamID] {
			return nil, errors.New("one or more teams are not participating in this tournament day")
		}
	}

	if !day.Deadline.IsZero() && time.Now().After(day.Deadline) {
		return nil, ErrPredictionLocked
	}

	var prediction models.Prediction

	err = r.db.Transaction(func(tx *gorm.DB) error {
		err := tx.Where("competitor_team_id = ? AND tournament_day_id = ?", competitor.ID, dayID).
			First(&prediction).Error
		if err != nil {
			if err != gorm.ErrRecordNotFound {
				return err
			}
			prediction = models.Prediction{
				CompetitorTeamID: competitor.ID, TournamentID: day.TournamentID, TournamentDayID: dayID,
				SubmittedAt: time.Now(),
			}
			if err := tx.Create(&prediction).Error; err != nil {
				return err
			}
		} else {
			prediction.SubmittedAt = time.Now()
			if err := tx.Save(&prediction).Error; err != nil {
				return err
			}
		}

		if err := tx.Where("prediction_id = ?", prediction.ID).
			Delete(&models.PredictionTeam{}).Error; err != nil {
			return err
		}

		for _, p := range picks {
			row := models.PredictionTeam{
				PredictionID: prediction.ID, TeamID: p.TeamID, PredictedPlacement: p.Placement,
			}
			if err := tx.Create(&row).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &prediction, nil
}

type dayTeamAgg struct {
	TeamID          uint
	PlacementPoints int
	KillPoints      int
}

// computeDayActualPlacements derives each team's final rank for a day live, from
// whatever room results currently exist. If results are cleared, this returns fewer
// (or zero) entries, which is exactly what makes prediction points disappear and
// recalculate automatically — there's no stored snapshot to go stale.
func (r *PredictionRepository) computeDayActualPlacements(dayID uint) (map[uint]int, error) {
	var rows []struct {
		TeamID    uint
		RoomID    uint
		Placement int
	}
	if err := r.db.Raw(`
		SELECT rtr.team_id, rtr.room_id, rtr.placement
		FROM room_team_results rtr
		JOIN rooms r ON r.id = rtr.room_id
		WHERE r.tournament_day_id = ?
	`, dayID).Scan(&rows).Error; err != nil {
		return nil, err
	}

	agg := map[uint]*dayTeamAgg{}
	for _, row := range rows {
		a, ok := agg[row.TeamID]
		if !ok {
			a = &dayTeamAgg{TeamID: row.TeamID}
			agg[row.TeamID] = a
		}
		var kills int
		r.db.Raw(`SELECT COALESCE(SUM(kills),0) FROM player_room_stats WHERE room_id = ? AND team_id = ?`,
			row.RoomID, row.TeamID).Scan(&kills)
		a.PlacementPoints += service.PlacementPoints(row.Placement)
		a.KillPoints += kills
	}

	type ranked struct {
		TeamID uint
		Total  int
		Kills  int
	}
	var list []ranked
	for _, a := range agg {
		list = append(list, ranked{TeamID: a.TeamID, Total: a.PlacementPoints + a.KillPoints, Kills: a.KillPoints})
	}

	for i := 0; i < len(list); i++ {
		for j := i + 1; j < len(list); j++ {
			swap := false
			if list[j].Total > list[i].Total {
				swap = true
			} else if list[j].Total == list[i].Total {
				if list[j].Kills > list[i].Kills {
					swap = true
				} else if list[j].Kills == list[i].Kills && list[j].TeamID < list[i].TeamID {
					swap = true
				}
			}
			if swap {
				list[i], list[j] = list[j], list[i]
			}
		}
	}

	placements := map[uint]int{}
	for i, l := range list {
		placements[l.TeamID] = i + 1
	}
	return placements, nil
}

type PredictionTeamScore struct {
	PredictionTeamID   uint        `json:"id"`
	TeamID             uint        `json:"team_id"`
	PredictedPlacement int         `json:"predicted_placement"`
	ActualPlacement    int         `json:"actual_placement"` // 0 = no current result for this team
	Points             int         `json:"points"`
	Team               models.Team `json:"team"`
}

type PredictionWithScore struct {
	Prediction  models.Prediction     `json:"prediction"`
	Teams       []PredictionTeamScore `json:"teams"`
	TotalPoints int                   `json:"total_points"`
	Scored      bool                  `json:"scored"`
}

// computeScoredTeams joins a prediction's stored picks against the day's live
// standings. Nothing here is persisted — rerun it any time and it reflects whatever
// the results currently say, including "no results yet" (all zero) if cleared.
func (r *PredictionRepository) computeScoredTeams(predictionID, dayID uint) ([]PredictionTeamScore, int, error) {
	var rows []models.PredictionTeam
	if err := r.db.Preload("Team").Where("prediction_id = ?", predictionID).
		Order("predicted_placement asc").Find(&rows).Error; err != nil {
		return nil, 0, err
	}

	actual, err := r.computeDayActualPlacements(dayID)
	if err != nil {
		return nil, 0, err
	}

	var out []PredictionTeamScore
	total := 0
	for _, row := range rows {
		act := actual[row.TeamID] // 0 if the team has no result yet
		pts := 0
		if act > 0 {
			pts = service.PredictionPoints(row.PredictedPlacement, act)
		}
		out = append(out, PredictionTeamScore{
			PredictionTeamID: row.ID, TeamID: row.TeamID, PredictedPlacement: row.PredictedPlacement,
			ActualPlacement: act, Points: pts, Team: row.Team,
		})
		total += pts
	}
	return out, total, nil
}

func (r *PredictionRepository) buildScored(prediction models.Prediction) (*PredictionWithScore, error) {
	teams, total, err := r.computeScoredTeams(prediction.ID, prediction.TournamentDayID)
	if err != nil {
		return nil, err
	}
	scored := false
	for _, t := range teams {
		if t.ActualPlacement > 0 {
			scored = true
			break
		}
	}
	return &PredictionWithScore{Prediction: prediction, Teams: teams, TotalPoints: total, Scored: scored}, nil
}

func (r *PredictionRepository) GetByUserAndDay(userID, dayID uint) (*PredictionWithScore, error) {
	var day models.TournamentDay
	if err := r.db.First(&day, dayID).Error; err != nil {
		return nil, err
	}
	competitor, err := r.resolveCompetitorTeam(userID, day)
	if err != nil {
		return nil, err
	}
	var prediction models.Prediction
	err = r.db.Where("competitor_team_id = ? AND tournament_day_id = ?", competitor.ID, dayID).First(&prediction).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrPredictionNotFound
		}
		return nil, err
	}
	return r.buildScored(prediction)
}

func (r *PredictionRepository) GetByID(predictionID uint) (*PredictionWithScore, error) {
	var prediction models.Prediction
	err := r.db.First(&prediction, predictionID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrPredictionNotFound
		}
		return nil, err
	}
	return r.buildScored(prediction)
}

type PredictionStanding struct {
	CompetitorTeamID uint   `json:"competitor_team_id"`
	TeamName         string `json:"team_name"`
	Country          string `json:"country"`
	PredictionID     uint   `json:"prediction_id"`
	TotalPoints      int    `json:"total_points"`
}

func sortPredictionStandings(s []PredictionStanding) {
	for i := 0; i < len(s); i++ {
		for j := i + 1; j < len(s); j++ {
			if s[j].TotalPoints > s[i].TotalPoints {
				s[i], s[j] = s[j], s[i]
			}
		}
	}
}

// GetStandings recomputes every competitor's points live, exactly like Fantasy's
// GetStandings does — no stored totals anywhere.
func (r *PredictionRepository) GetStandings(tournamentID uint, dayID *uint) ([]PredictionStanding, error) {
	q := r.db.Where("tournament_id = ?", tournamentID)
	if dayID != nil {
		q = q.Where("tournament_day_id = ?", *dayID)
	}
	var predictions []models.Prediction
	if err := q.Find(&predictions).Error; err != nil {
		return nil, err
	}

	type agg struct {
		TotalPoints  int
		PredictionID uint
	}
	aggMap := map[uint]*agg{}

	for _, p := range predictions {
		_, total, err := r.computeScoredTeams(p.ID, p.TournamentDayID)
		if err != nil {
			return nil, err
		}
		a, ok := aggMap[p.CompetitorTeamID]
		if !ok {
			a = &agg{}
			aggMap[p.CompetitorTeamID] = a
		}
		a.TotalPoints += total
		a.PredictionID = p.ID
	}

	var out []PredictionStanding
	for teamID, a := range aggMap {
		var ft models.FantasyTeam
		if err := r.db.First(&ft, teamID).Error; err != nil {
			continue
		}
		out = append(out, PredictionStanding{
			CompetitorTeamID: teamID, TeamName: ft.TeamName, Country: ft.Country,
			PredictionID: a.PredictionID, TotalPoints: a.TotalPoints,
		})
	}
	sortPredictionStandings(out)
	return out, nil
}
