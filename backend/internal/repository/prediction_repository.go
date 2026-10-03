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
)

type PlacementInput struct {
	TeamID    uint
	Placement int
}

// GetDayLockTime returns the tournament day's deadline. Zero time means open.
// Reuses the same deadline field the fantasy game locks against.
func (r *PredictionRepository) GetDayLockTime(dayID uint) (time.Time, error) {
	var day models.TournamentDay
	if err := r.db.First(&day, dayID).Error; err != nil {
		return time.Time{}, err
	}
	return day.Deadline, nil
}

// GetDayTeamIDs returns the set of team IDs assigned to play on this day.
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

// SubmitPrediction validates and saves a user's 12-team placement prediction for a day,
// replacing any existing prediction for that user/day. Mirrors SubmitSelection's
// replace-in-a-transaction pattern from the fantasy game.
func (r *PredictionRepository) SubmitPrediction(userID, dayID uint, picks []PlacementInput) (*models.Prediction, error) {
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

	lockTime, err := r.GetDayLockTime(dayID)
	if err != nil {
		return nil, err
	}
	if !lockTime.IsZero() && time.Now().After(lockTime) {
		return nil, ErrPredictionLocked
	}

	var prediction models.Prediction

	err = r.db.Transaction(func(tx *gorm.DB) error {
		var day models.TournamentDay
		if err := tx.First(&day, dayID).Error; err != nil {
			return err
		}

		err := tx.Where("user_id = ? AND tournament_day_id = ?", userID, dayID).First(&prediction).Error
		if err != nil {
			if err != gorm.ErrRecordNotFound {
				return err
			}
			prediction = models.Prediction{
				UserID: userID, TournamentID: day.TournamentID, TournamentDayID: dayID,
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
	var prediction models.Prediction
	err := r.db.Where("user_id = ? AND tournament_day_id = ?", userID, dayID).First(&prediction).Error
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

// computeDayActualPlacements derives each team's final rank for a tournament day from
// that day's rooms: teams are ranked by (placement points + kill points) summed across
// every room played that day, highest first. Ties break by total kills, then by team ID,
// so the result is always fully deterministic.
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

// ScoreDay derives actual placements for every team on a day from that day's room
// results, then scores every user's prediction for that day against them.
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
	UserID       uint   `json:"user_id"`
	Username     string `json:"username"`
	PredictionID uint   `json:"prediction_id"`
	TotalPoints  int    `json:"total_points"`
	Scored       bool   `json:"scored"`
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

// GetStandings returns the leaderboard. With dayID, it's that single day's results;
// without it, it's each user's points summed across every day of the tournament.
func (r *PredictionRepository) GetStandings(tournamentID uint, dayID *uint) ([]PredictionStanding, error) {
	if dayID != nil {
		type row struct {
			UserID       uint
			Username     string
			PredictionID uint
			TotalPoints  int
			ScoredAt     *time.Time
		}
		var rows []row
		if err := r.db.Table("predictions p").
			Select("p.user_id, u.username, p.id as prediction_id, p.total_points, p.scored_at").
			Joins("JOIN users u ON u.id = p.user_id").
			Where("p.tournament_id = ? AND p.tournament_day_id = ?", tournamentID, *dayID).
			Scan(&rows).Error; err != nil {
			return nil, err
		}
		var out []PredictionStanding
		for _, rr := range rows {
			out = append(out, PredictionStanding{
				UserID: rr.UserID, Username: rr.Username, PredictionID: rr.PredictionID,
				TotalPoints: rr.TotalPoints, Scored: rr.ScoredAt != nil,
			})
		}
		sortPredictionStandings(out)
		return out, nil
	}

	type agg struct {
		UserID      uint
		Username    string
		TotalPoints int
	}
	var aggs []agg
	if err := r.db.Table("predictions p").
		Select("p.user_id, u.username, COALESCE(SUM(p.total_points),0) as total_points").
		Joins("JOIN users u ON u.id = p.user_id").
		Where("p.tournament_id = ?", tournamentID).
		Group("p.user_id, u.username").
		Scan(&aggs).Error; err != nil {
		return nil, err
	}
	var out []PredictionStanding
	for _, a := range aggs {
		out = append(out, PredictionStanding{UserID: a.UserID, Username: a.Username, TotalPoints: a.TotalPoints, Scored: true})
	}
	sortPredictionStandings(out)
	return out, nil
}
