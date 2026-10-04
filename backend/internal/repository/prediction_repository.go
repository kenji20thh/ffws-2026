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

// PredictionError is a user-facing validation problem (safe to show to the client).
type PredictionError struct{ Msg string }

func (e *PredictionError) Error() string { return e.Msg }

func invalidPrediction(msg string) error { return &PredictionError{Msg: msg} }

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

// IsDayLocked reports whether predictions for the day are closed (same rule as Fantasy).
func (r *PredictionRepository) IsDayLocked(dayID uint) (bool, error) {
	var day models.TournamentDay
	if err := r.db.First(&day, dayID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, ErrDayNotFound
		}
		return false, err
	}
	return isDayLocked(r.db, &day)
}

// CanView reports whether the viewer may see this prediction's picks: always once the
// day has locked; before that, only the owner. viewerUserID is 0 for anonymous viewers.
func (r *PredictionRepository) CanView(p *models.Prediction, viewerUserID uint) (bool, error) {
	var day models.TournamentDay
	if err := r.db.First(&day, p.TournamentDayID).Error; err != nil {
		return false, err
	}
	locked, err := isDayLocked(r.db, &day)
	if err != nil {
		return false, err
	}
	if locked {
		return true, nil
	}
	if viewerUserID == 0 {
		return false, nil
	}
	var owner struct{ UserID uint }
	if err := r.db.Raw(`SELECT user_id FROM fantasy_teams WHERE id = ?`, p.CompetitorTeamID).Scan(&owner).Error; err != nil {
		return false, err
	}
	return owner.UserID == viewerUserID, nil
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

// resolveCompetitorTeam finds the user's shared competitor team (the same one used
// by Fantasy) for the tournament a given day belongs to.
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
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDayNotFound
		}
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
		return nil, invalidPrediction("this tournament day does not have exactly 12 teams assigned")
	}
	if len(picks) != 12 {
		return nil, invalidPrediction("you must predict all 12 teams")
	}

	seenTeams := map[uint]bool{}
	seenPlacements := map[int]bool{}
	for _, p := range picks {
		if seenTeams[p.TeamID] {
			return nil, invalidPrediction("duplicate team in prediction")
		}
		seenTeams[p.TeamID] = true

		if p.Placement < 1 || p.Placement > 12 {
			return nil, invalidPrediction("placements must be between 1 and 12")
		}
		if seenPlacements[p.Placement] {
			return nil, invalidPrediction("duplicate placement in prediction")
		}
		seenPlacements[p.Placement] = true

		if !dayTeams[p.TeamID] {
			return nil, invalidPrediction("one or more teams are not participating in this tournament day")
		}
	}

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

func (r *PredictionRepository) GetByUserAndDay(userID, dayID uint) (*models.Prediction, []models.PredictionTeam, error) {
	var day models.TournamentDay
	if err := r.db.First(&day, dayID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, ErrDayNotFound
		}
		return nil, nil, err
	}

	competitor, err := r.resolveCompetitorTeam(userID, day)
	if err != nil {
		return nil, nil, err
	}

	var prediction models.Prediction
	err = r.db.Where("competitor_team_id = ? AND tournament_day_id = ?", competitor.ID, dayID).First(&prediction).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil, ErrPredictionNotFound
		}
		return nil, nil, err
	}
	var rows []models.PredictionTeam
	if err := r.db.Preload("Team").Where("prediction_id = ?", prediction.ID).
		Order("predicted_placement asc").Find(&rows).Error; err != nil {
		return nil, nil, err
	}
	return &prediction, rows, nil
}

func (r *PredictionRepository) GetByID(predictionID uint) (*models.Prediction, []models.PredictionTeam, error) {
	var prediction models.Prediction
	err := r.db.First(&prediction, predictionID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil, ErrPredictionNotFound
		}
		return nil, nil, err
	}
	var rows []models.PredictionTeam
	if err := r.db.Preload("Team").Where("prediction_id = ?", prediction.ID).
		Order("predicted_placement asc").Find(&rows).Error; err != nil {
		return nil, nil, err
	}
	return &prediction, rows, nil
}

type dayTeamAgg struct {
	TeamID          uint
	PlacementPoints int
	KillPoints      int
}

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

func (r *PredictionRepository) ScoreDay(dayID uint) (int, error) {
	actual, err := r.computeDayActualPlacements(dayID)
	if err != nil {
		return 0, err
	}
	if len(actual) == 0 {
		return 0, errors.New("no room results exist for this day yet")
	}

	var predictions []models.Prediction
	if err := r.db.Where("tournament_day_id = ?", dayID).Find(&predictions).Error; err != nil {
		return 0, err
	}

	scored := 0
	for _, p := range predictions {
		var rows []models.PredictionTeam
		if err := r.db.Where("prediction_id = ?", p.ID).Find(&rows).Error; err != nil {
			return scored, err
		}

		total := 0
		for i := range rows {
			act, ok := actual[rows[i].TeamID]
			if !ok {
				rows[i].ActualPlacement = 0
				rows[i].Points = 0
			} else {
				rows[i].ActualPlacement = act
				rows[i].Points = service.PredictionPoints(rows[i].PredictedPlacement, act)
			}
			total += rows[i].Points
			if err := r.db.Save(&rows[i]).Error; err != nil {
				return scored, err
			}
		}

		now := time.Now()
		p.TotalPoints = total
		p.ScoredAt = &now
		if err := r.db.Save(&p).Error; err != nil {
			return scored, err
		}
		scored++
	}
	return scored, nil
}

type PredictionStanding struct {
	CompetitorTeamID uint   `json:"competitor_team_id"`
	TeamName         string `json:"team_name"`
	Country          string `json:"country"`
	PredictionID     uint   `json:"prediction_id"`
	TotalPoints      int    `json:"total_points"`
	Scored           bool   `json:"scored"`
}

func sortPredictionStandings(s []PredictionStanding) {
	sort.SliceStable(s, func(i, j int) bool { return s[i].TotalPoints > s[j].TotalPoints })
}

func (r *PredictionRepository) GetStandings(tournamentID uint, dayID *uint) ([]PredictionStanding, error) {
	if dayID != nil {
		type row struct {
			CompetitorTeamID uint
			TeamName         string
			Country          string
			PredictionID     uint
			TotalPoints      int
			ScoredAt         *time.Time
		}
		var rows []row
		if err := r.db.Table("predictions p").
			Select("p.competitor_team_id, ft.team_name, ft.country, p.id as prediction_id, p.total_points, p.scored_at").
			Joins("JOIN fantasy_teams ft ON ft.id = p.competitor_team_id").
			Where("p.tournament_id = ? AND p.tournament_day_id = ?", tournamentID, *dayID).
			Scan(&rows).Error; err != nil {
			return nil, err
		}
		var out []PredictionStanding
		for _, rr := range rows {
			out = append(out, PredictionStanding{
				CompetitorTeamID: rr.CompetitorTeamID, TeamName: rr.TeamName, Country: rr.Country,
				PredictionID: rr.PredictionID, TotalPoints: rr.TotalPoints, Scored: rr.ScoredAt != nil,
			})
		}
		sortPredictionStandings(out)
		return out, nil
	}

	type agg struct {
		CompetitorTeamID uint
		TeamName         string
		Country          string
		TotalPoints      int
	}
	var aggs []agg
	if err := r.db.Table("predictions p").
		Select("p.competitor_team_id, ft.team_name, ft.country, COALESCE(SUM(p.total_points),0) as total_points").
		Joins("JOIN fantasy_teams ft ON ft.id = p.competitor_team_id").
		Where("p.tournament_id = ?", tournamentID).
		Group("p.competitor_team_id, ft.team_name, ft.country").
		Scan(&aggs).Error; err != nil {
		return nil, err
	}
	var out []PredictionStanding
	for _, a := range aggs {
		out = append(out, PredictionStanding{
			CompetitorTeamID: a.CompetitorTeamID, TeamName: a.TeamName, Country: a.Country, TotalPoints: a.TotalPoints, Scored: true,
		})
	}
	sortPredictionStandings(out)
	return out, nil
}
