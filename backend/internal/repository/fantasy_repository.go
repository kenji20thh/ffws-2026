package repository

import (
	"errors"
	"sort"
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
	ErrDayNotFound         = errors.New("tournament day not found")
)

const (
	SelectionSize   = 4
	SelectionBudget = 100
)

// SelectionError is a user-facing validation problem (safe to show to the client).
// Any other error returned by SubmitSelection is an internal failure.
type SelectionError struct{ Msg string }

func (e *SelectionError) Error() string { return e.Msg }

func invalidSelection(msg string) error { return &SelectionError{Msg: msg} }

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

// GetDayInTournament returns the day only if it belongs to the given tournament.
func (r *FantasyRepository) GetDayInTournament(dayID, tournamentID uint) (*models.TournamentDay, error) {
	var day models.TournamentDay
	err := r.db.Where("id = ? AND tournament_id = ?", dayID, tournamentID).First(&day).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDayNotFound
		}
		return nil, err
	}
	return &day, nil
}

// IsDayLocked reports whether picks for the day are closed. A day is locked when:
//   - its deadline has passed, OR
//   - any of its rooms is live/completed or already has results
//
// The second rule means a day with no deadline set can never be edited after play has started.
func (r *FantasyRepository) IsDayLocked(day *models.TournamentDay) (bool, error) {
	return isDayLocked(r.db, day)
}

// GetDayLockTime returns the tournament day's deadline directly.
// If no deadline has been set yet, it returns the zero time, meaning selections stay open.
func (r *FantasyRepository) GetDayLockTime(dayID uint) (time.Time, error) {
	var day models.TournamentDay
	if err := r.db.First(&day, dayID).Error; err != nil {
		return time.Time{}, err
	}
	return day.Deadline, nil
}

type PickInput struct {
	PlayerID  uint
	IsCaptain bool
}

// SubmitSelection validates and replaces a fantasy team's 4 picks for a day.
func (r *FantasyRepository) SubmitSelection(fantasyTeamID, tournamentID, dayID uint, picks []PickInput) error {
	if len(picks) != SelectionSize {
		return invalidSelection("you must select exactly 4 players")
	}

	captainCount := 0
	seen := map[uint]bool{}
	for _, p := range picks {
		if seen[p.PlayerID] {
			return invalidSelection("duplicate player in selection")
		}
		seen[p.PlayerID] = true
		if p.IsCaptain {
			captainCount++
		}
	}
	if captainCount != 1 {
		return invalidSelection("you must select exactly one captain")
	}

	day, err := r.GetDayInTournament(dayID, tournamentID)
	if err != nil {
		return err
	}
	locked, err := r.IsDayLocked(day)
	if err != nil {
		return err
	}
	if locked {
		return ErrSelectionLocked
	}

	type playerRow struct {
		ID           uint
		TeamID       uint
		FantasyPrice int
	}
	var rows []playerRow
	ids := make([]uint, 0, SelectionSize)
	for _, p := range picks {
		ids = append(ids, p.PlayerID)
	}
	// Only players whose team belongs to this tournament are valid picks.
	if err := r.db.Raw(`
		SELECT p.id, p.team_id, p.fantasy_price
		FROM players p
		JOIN teams t ON t.id = p.team_id
		WHERE p.id IN (?) AND t.tournament_id = ?
	`, ids, tournamentID).Scan(&rows).Error; err != nil {
		return err
	}
	if len(rows) != SelectionSize {
		return invalidSelection("one or more selected players are not available in this tournament")
	}

	teamSeen := map[uint]bool{}
	totalBudget := 0
	for _, row := range rows {
		if teamSeen[row.TeamID] {
			return invalidSelection("all 4 players must be from different teams")
		}
		teamSeen[row.TeamID] = true
		totalBudget += row.FantasyPrice
	}
	if totalBudget > SelectionBudget {
		return invalidSelection("selection exceeds the $100 budget")
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

// GetStandings totals every fantasy team's points, optionally for a single day.
// It runs three queries no matter how many teams or picks exist (no per-team queries),
// and scores through service.Fantasy* so the rules live in one place.
func (r *FantasyRepository) GetStandings(tournamentID uint, dayID *uint) ([]FantasyStanding, error) {
	var teams []models.FantasyTeam
	if err := r.db.Where("tournament_id = ?", tournamentID).Order("id ASC").Find(&teams).Error; err != nil {
		return nil, err
	}
	if len(teams) == 0 {
		return []FantasyStanding{}, nil
	}

	selQuery := `
		SELECT fs.fantasy_team_id, fs.tournament_day_id AS day_id, fs.player_id, fs.is_captain
		FROM fantasy_selections fs
		JOIN fantasy_teams ft ON ft.id = fs.fantasy_team_id
		WHERE ft.tournament_id = ?`
	statQuery := `
		SELECT prs.player_id, r.tournament_day_id AS day_id, prs.kills, prs.first_blood, rtr.placement
		FROM player_room_stats prs
		JOIN rooms r ON r.id = prs.room_id
		JOIN room_team_results rtr ON rtr.room_id = prs.room_id AND rtr.team_id = prs.team_id
		JOIN tournament_days td ON td.id = r.tournament_day_id
		WHERE td.tournament_id = ?`
	selArgs := []any{tournamentID}
	statArgs := []any{tournamentID}
	if dayID != nil {
		selQuery += " AND fs.tournament_day_id = ?"
		statQuery += " AND r.tournament_day_id = ?"
		selArgs = append(selArgs, *dayID)
		statArgs = append(statArgs, *dayID)
	}

	var sels []struct {
		FantasyTeamID uint
		DayID         uint
		PlayerID      uint
		IsCaptain     bool
	}
	if err := r.db.Raw(selQuery, selArgs...).Scan(&sels).Error; err != nil {
		return nil, err
	}

	var stats []struct {
		PlayerID   uint
		DayID      uint
		Kills      int
		FirstBlood bool
		Placement  int
	}
	if err := r.db.Raw(statQuery, statArgs...).Scan(&stats).Error; err != nil {
		return nil, err
	}

	// base points per (player, day), summed over that day's rooms
	type playerDay struct{ playerID, dayID uint }
	base := map[playerDay]int{}
	for _, st := range stats {
		pts := st.Kills*service.FantasyKillPoints + service.FantasyPlacementPoints(st.Placement)
		if st.FirstBlood {
			pts += service.FantasyFirstBloodPoints
		}
		base[playerDay{st.PlayerID, st.DayID}] += pts
	}

	totals := map[uint]int{}
	for _, sel := range sels {
		pts := base[playerDay{sel.PlayerID, sel.DayID}]
		if sel.IsCaptain {
			pts *= 2
		}
		totals[sel.FantasyTeamID] += pts
	}

	standings := make([]FantasyStanding, 0, len(teams))
	for _, t := range teams {
		standings = append(standings, FantasyStanding{
			FantasyTeamID: t.ID, TeamName: t.TeamName, Country: t.Country, Points: totals[t.ID],
		})
	}
	// highest points first; equal points keep registration order
	sort.SliceStable(standings, func(i, j int) bool { return standings[i].Points > standings[j].Points })
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
