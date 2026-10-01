package repository

import (
	"errors"
	"time"

	"ffws/internal/models"
	"ffws/internal/service"

	"gorm.io/gorm"
)

type FantasyRepository struct {
	db *gorm.DB
}

func NewFantasyRepository(db *gorm.DB) *FantasyRepository {
	return &FantasyRepository{db: db}
}

var (
	ErrFantasyTeamExists   = errors.New("you already have a fantasy team for this tournament")
	ErrFantasyTeamNotFound = errors.New("fantasy team not found")
	ErrSelectionLocked     = errors.New("selections are locked for this day")
)

func (r *FantasyRepository) CreateTeam(userID, tournamentID uint, teamName, country string) (*models.FantasyTeam, error) {
	var count int64
	r.db.Model(&models.FantasyTeam{}).Where("user_id = ? AND tournament_id = ?", userID, tournamentID).Count(&count)
	if count > 0 {
		return nil, ErrFantasyTeamExists
	}
	team := models.FantasyTeam{UserID: userID, TournamentID: tournamentID, TeamName: teamName, Country: country}
	if err := r.db.Create(&team).Error; err != nil {
		return nil, err
	}
	return &team, nil
}

func (r *FantasyRepository) GetTeamByUser(userID, tournamentID uint) (*models.FantasyTeam, error) {
	var team models.FantasyTeam
	err := r.db.Where("user_id = ? AND tournament_id = ?", userID, tournamentID).First(&team).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrFantasyTeamNotFound
		}
		return nil, err
	}
	return &team, nil
}

// GetDayLockTime returns 30 minutes before the day's earliest scheduled room.
// If no rooms are scheduled yet, selections are open (zero time).
func (r *FantasyRepository) GetDayLockTime(dayID uint) (time.Time, error) {
	var earliest *time.Time
	err := r.db.Raw(`SELECT MIN(scheduled_at) FROM rooms WHERE tournament_day_id = ?`, dayID).Scan(&earliest).Error
	if err != nil {
		return time.Time{}, err
	}
	if earliest == nil {
		return time.Time{}, nil
	}
	return earliest.Add(-30 * time.Minute), nil
}

type PickInput struct {
	PlayerID  uint
	IsCaptain bool
}

// SubmitSelection validates and replaces a fantasy team's 4 picks for a day.
func (r *FantasyRepository) SubmitSelection(fantasyTeamID, dayID uint, picks []PickInput) error {
	if len(picks) != 4 {
		return errors.New("you must select exactly 4 players")
	}

	captainCount := 0
	seen := map[uint]bool{}
	for _, p := range picks {
		if seen[p.PlayerID] {
			return errors.New("duplicate player in selection")
		}
		seen[p.PlayerID] = true
		if p.IsCaptain {
			captainCount++
		}
	}
	if captainCount != 1 {
		return errors.New("you must select exactly one captain")
	}

	lockTime, err := r.GetDayLockTime(dayID)
	if err != nil {
		return err
	}
	if !lockTime.IsZero() && time.Now().After(lockTime) {
		return ErrSelectionLocked
	}

	type playerRow struct {
		ID           uint
		TeamID       uint
		FantasyPrice int
	}
	var rows []playerRow
	ids := make([]uint, 0, 4)
	for _, p := range picks {
		ids = append(ids, p.PlayerID)
	}
	if err := r.db.Raw(`SELECT id, team_id, fantasy_price FROM players WHERE id IN (?)`, ids).Scan(&rows).Error; err != nil {
		return err
	}
	if len(rows) != 4 {
		return errors.New("one or more selected players do not exist")
	}

	teamSeen := map[uint]bool{}
	totalBudget := 0
	for _, row := range rows {
		if teamSeen[row.TeamID] {
			return errors.New("all 4 players must be from different teams")
		}
		teamSeen[row.TeamID] = true
		totalBudget += row.FantasyPrice
	}
	if totalBudget > 100 {
		return errors.New("selection exceeds the $100 budget")
	}

	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("fantasy_team_id = ? AND tournament_day_id = ?", fantasyTeamID, dayID).
			Delete(&models.FantasySelection{}).Error; err != nil {
			return err
		}
		for _, p := range picks {
			sel := models.FantasySelection{
				FantasyTeamID: fantasyTeamID, TournamentDayID: dayID,
				PlayerID: p.PlayerID, IsCaptain: p.IsCaptain,
			}
			if err := tx.Create(&sel).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *FantasyRepository) GetSelection(fantasyTeamID, dayID uint) ([]models.FantasySelection, error) {
	var sels []models.FantasySelection
	err := r.db.Preload("Player").
		Where("fantasy_team_id = ? AND tournament_day_id = ?", fantasyTeamID, dayID).
		Find(&sels).Error
	return sels, err
}

type PlayerDayScore struct {
	PlayerID        uint   `json:"player_id"`
	IGN             string `json:"ign"`
	IsCaptain       bool   `json:"is_captain"`
	Kills           int    `json:"kills"`
	FirstBloods     int    `json:"first_bloods"`
	PlacementPoints int    `json:"placement_points"`
	BasePoints      int    `json:"base_points"`
	FinalPoints     int    `json:"final_points"`
}

// ComputeDayScore returns each selected player's breakdown and the team's total for that day.
func (r *FantasyRepository) ComputeDayScore(fantasyTeamID, dayID uint) ([]PlayerDayScore, int, error) {
	sels, err := r.GetSelection(fantasyTeamID, dayID)
	if err != nil {
		return nil, 0, err
	}

	var breakdown []PlayerDayScore
	total := 0

	for _, s := range sels {
		var rows []struct {
			Kills      int
			FirstBlood bool
			Placement  int
		}
		err := r.db.Raw(`
			SELECT prs.kills, prs.first_blood, rtr.placement
			FROM player_room_stats prs
			JOIN rooms r ON r.id = prs.room_id
			JOIN room_team_results rtr ON rtr.room_id = prs.room_id AND rtr.team_id = prs.team_id
			WHERE prs.player_id = ? AND r.tournament_day_id = ?
		`, s.PlayerID, dayID).Scan(&rows).Error
		if err != nil {
			return nil, 0, err
		}

		kills, firstBloods, placementPts := 0, 0, 0
		for _, row := range rows {
			kills += row.Kills
			if row.FirstBlood {
				firstBloods++
			}
			placementPts += service.FantasyPlacementPoints(row.Placement)
		}

		base := kills*service.FantasyKillPoints + firstBloods*service.FantasyFirstBloodPoints + placementPts
		final := base
		if s.IsCaptain {
			final = base * 2
		}

		breakdown = append(breakdown, PlayerDayScore{
			PlayerID: s.PlayerID, IGN: s.Player.IGN, IsCaptain: s.IsCaptain,
			Kills: kills, FirstBloods: firstBloods, PlacementPoints: placementPts,
			BasePoints: base, FinalPoints: final,
		})
		total += final
	}

	return breakdown, total, nil
}

type FantasyStanding struct {
	FantasyTeamID uint   `json:"fantasy_team_id"`
	TeamName      string `json:"team_name"`
	Country       string `json:"country"`
	Points        int    `json:"points"`
}

func (r *FantasyRepository) GetStandings(tournamentID uint, dayID *uint) ([]FantasyStanding, error) {
	var teams []models.FantasyTeam
	if err := r.db.Where("tournament_id = ?", tournamentID).Find(&teams).Error; err != nil {
		return nil, err
	}

	var days []models.TournamentDay
	if dayID == nil {
		if err := r.db.Where("tournament_id = ?", tournamentID).Find(&days).Error; err != nil {
			return nil, err
		}
	} else {
		days = []models.TournamentDay{{ID: *dayID}}
	}

	var standings []FantasyStanding
	for _, t := range teams {
		total := 0
		for _, d := range days {
			_, score, err := r.ComputeDayScore(t.ID, d.ID)
			if err != nil {
				return nil, err
			}
			total += score
		}
		standings = append(standings, FantasyStanding{
			FantasyTeamID: t.ID, TeamName: t.TeamName, Country: t.Country, Points: total,
		})
	}

	for i := 0; i < len(standings); i++ {
		for j := i + 1; j < len(standings); j++ {
			if standings[j].Points > standings[i].Points {
				standings[i], standings[j] = standings[j], standings[i]
			}
		}
	}
	return standings, nil
}

type FantasyPlayerOption struct {
	PlayerID     uint   `json:"player_id"`
	IGN          string `json:"ign"`
	Role         string `json:"role"`
	Country      string `json:"country"`
	TeamID       uint   `json:"team_id"`
	TeamName     string `json:"team_name"`
	TeamTag      string `json:"team_tag"`
	FantasyPrice int    `json:"fantasy_price"`
}

func (r *FantasyRepository) GetPlayerPool(tournamentID uint) ([]FantasyPlayerOption, error) {
	var options []FantasyPlayerOption
	err := r.db.Raw(`
		SELECT p.id AS player_id, p.ign, p.role, p.country,
		       t.id AS team_id, t.name AS team_name, t.tag AS team_tag,
		       p.fantasy_price
		FROM players p
		JOIN teams t ON t.id = p.team_id
		WHERE t.tournament_id = ?
		ORDER BY t.name ASC, p.ign ASC
	`, tournamentID).Scan(&options).Error
	return options, err
}

func (r *FantasyRepository) GetTeamByID(fantasyTeamID uint) (*models.FantasyTeam, error) {
	var team models.FantasyTeam
	err := r.db.First(&team, fantasyTeamID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrFantasyTeamNotFound
		}
		return nil, err
	}
	return &team, nil
}

type FantasyDaySchedule struct {
	DayID    uint       `json:"day_id"`
	DayName  string     `json:"day_name"`
	DayOrder int        `json:"day_order"`
	Date     string     `json:"date"`
	LockTime *time.Time `json:"lock_time"`
}

func (r *FantasyRepository) GetScheduleOverview(tournamentID uint) ([]FantasyDaySchedule, error) {
	var days []models.TournamentDay
	if err := r.db.Where("tournament_id = ?", tournamentID).Order("day_order asc").Find(&days).Error; err != nil {
		return nil, err
	}
	var out []FantasyDaySchedule
	for _, d := range days {
		lock, err := r.GetDayLockTime(d.ID)
		if err != nil {
			return nil, err
		}
		var lockPtr *time.Time
		if !lock.IsZero() {
			lockPtr = &lock
		}
		out = append(out, FantasyDaySchedule{
			DayID: d.ID, DayName: d.Name, DayOrder: d.DayOrder,
			Date: d.Date.Format("2006-01-02"), LockTime: lockPtr,
		})
	}
	return out, nil
}
