package repository

import (
	"errors"
	"sort"
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

	// Same lock rule as Fantasy: deadline if set, otherwise "locked once results exist".
	locked, err := isDayLocked(r.db, &day)
	if err != nil {
		return nil, err
	}
	if locked {
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

// computeDayActualPlacements derives each team's final rank for a day live, from
// whatever room results currently exist. If results are cleared, this returns fewer
// (or zero) entries, which is exactly what makes prediction points disappear and
// recalculate automatically — there's no stored snapshot to go stale.
func (r *PredictionRepository) computeDayActualPlacements(dayID uint) (map[uint]int, error) {
	var rows []struct {
		TeamID    uint
		Placement int
		Kills     int
	}
	// Kills are summed in SQL (one query) instead of one query per result row.
	if err := r.db.Raw(`
		SELECT rtr.team_id, rtr.placement,
		       COALESCE((SELECT SUM(prs.kills) FROM player_room_stats prs
		                 WHERE prs.room_id = rtr.room_id AND prs.team_id = rtr.team_id), 0) AS kills
		FROM room_team_results rtr
		JOIN rooms r ON r.id = rtr.room_id
		WHERE r.tournament_day_id = ?
	`, dayID).Scan(&rows).Error; err != nil {
		return nil, err
	}

	type ranked struct {
		TeamID uint
		Total  int
		Kills  int
	}
	agg := map[uint]*ranked{}
	for _, row := range rows {
		a, ok := agg[row.TeamID]
		if !ok {
			a = &ranked{TeamID: row.TeamID}
			agg[row.TeamID] = a
		}
		a.Total += service.PlacementPoints(row.Placement) + row.Kills
		a.Kills += row.Kills
	}

	list := make([]ranked, 0, len(agg))
	for _, a := range agg {
		list = append(list, *a)
	}
	// total points desc, then kills desc, then team id asc (deterministic).
	sort.Slice(list, func(i, j int) bool {
		if list[i].Total != list[j].Total {
			return list[i].Total > list[j].Total
		}
		if list[i].Kills != list[j].Kills {
			return list[i].Kills > list[j].Kills
		}
		return list[i].TeamID < list[j].TeamID
	})

	placements := make(map[uint]int, len(list))
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
	Locked      bool                  `json:"locked"`
	// Hidden is true when the picks are withheld: the day is still open and the
	// viewer is not the owner. Teams is then an empty list.
	Hidden bool `json:"hidden"`
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

	out := make([]PredictionTeamScore, 0, len(rows))
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

// GetByID returns a prediction for any viewer. Until the day locks, only the owner
// (viewerID, 0 = anonymous) sees the picks, so nobody can copy another player's
// prediction by walking prediction ids. Same rule as Fantasy team profiles.
func (r *PredictionRepository) GetByID(predictionID, viewerID uint) (*PredictionWithScore, error) {
	var prediction models.Prediction
	if err := r.db.First(&prediction, predictionID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPredictionNotFound
		}
		return nil, err
	}

	var day models.TournamentDay
	if err := r.db.First(&day, prediction.TournamentDayID).Error; err != nil {
		return nil, err
	}
	locked, err := isDayLocked(r.db, &day)
	if err != nil {
		return nil, err
	}

	var owner models.FantasyTeam
	if err := r.db.First(&owner, prediction.CompetitorTeamID).Error; err != nil {
		return nil, err
	}
	isOwner := viewerID != 0 && owner.UserID == viewerID

	if !locked && !isOwner {
		return &PredictionWithScore{
			Prediction: prediction, Teams: []PredictionTeamScore{},
			Locked: false, Hidden: true,
		}, nil
	}

	res, err := r.buildScored(prediction)
	if err != nil {
		return nil, err
	}
	res.Locked = locked
	return res, nil
}

func (r *PredictionRepository) GetByUserAndDay(userID, dayID uint) (*PredictionWithScore, error) {
	var day models.TournamentDay
	if err := r.db.First(&day, dayID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDayNotFound
		}
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
	res, err := r.buildScored(prediction)
	if err != nil {
		return nil, err
	}
	if res.Locked, err = isDayLocked(r.db, &day); err != nil {
		return nil, err
	}
	return res, nil
}

type PredictionStanding struct {
	CompetitorTeamID uint   `json:"competitor_team_id"`
	TeamName         string `json:"team_name"`
	Country          string `json:"country"`
	PredictionID     uint   `json:"prediction_id"`
	TotalPoints      int    `json:"total_points"`
}

func sortPredictionStandings(s []PredictionStanding) {
	sort.Slice(s, func(i, j int) bool {
		if s[i].TotalPoints != s[j].TotalPoints {
			return s[i].TotalPoints > s[j].TotalPoints
		}
		return s[i].CompetitorTeamID < s[j].CompetitorTeamID
	})
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
