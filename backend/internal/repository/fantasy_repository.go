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
	// The league is decided here from the country, never by the caller.
	team := models.FantasyTeam{
		UserID: userID, TournamentID: tournamentID, TeamName: teamName, Country: country,
		Region: service.RegionForCountry(country),
	}
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
// chip is "" for no chip, otherwise one of the service.Chip* values.
func (r *FantasyRepository) SubmitSelection(fantasyTeamID, tournamentID, dayID uint, picks []PickInput, chip string) error {
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
	if chip != "" && !service.IsValidChip(chip) {
		return invalidSelection("unknown chip")
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

	// Each chip can be played once per tournament (re-submitting the same day with the same chip is fine).
	if chip != "" {
		var usedElsewhere int64
		if err := r.db.Model(&models.FantasyChipUse{}).
			Where("fantasy_team_id = ? AND chip = ? AND tournament_day_id <> ?", fantasyTeamID, chip, dayID).
			Count(&usedElsewhere).Error; err != nil {
			return err
		}
		if usedElsewhere > 0 {
			return invalidSelection("you already used this chip on another day")
		}
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
	// Only players whose team belongs to this tournament AND plays on this day are valid
	// picks. This mirrors GetPlayerPool, so the API enforces the same pool the UI shows
	// (24 teams on a Phase 1 day, 12 from Phase 2 onwards).
	if err := r.db.Raw(`
		SELECT p.id, p.team_id, p.fantasy_price
		FROM players p
		JOIN teams t ON t.id = p.team_id
		WHERE p.id IN (?) AND t.tournament_id = ?
		  AND EXISTS (
		    SELECT 1 FROM tournament_day_teams tdt
		    WHERE tdt.team_id = t.id AND tdt.tournament_day_id = ?
		  )
	`, ids, tournamentID, dayID).Scan(&rows).Error; err != nil {
		return err
	}
	if len(rows) != SelectionSize {
		return invalidSelection("one or more selected players are not playing on this day")
	}

	perTeam := map[uint]int{}
	totalBudget := 0
	for _, row := range rows {
		perTeam[row.TeamID]++
		totalBudget += row.FantasyPrice
	}
	maxPerTeam, pairs := 0, 0
	for _, n := range perTeam {
		if n > maxPerTeam {
			maxPerTeam = n
		}
		if n == 2 {
			pairs++
		}
	}
	if chip == service.ChipDuoStack {
		if maxPerTeam > 2 || pairs > 1 {
			return invalidSelection("the Duo Stack chip allows one pair of players from the same team, no more")
		}
	} else if maxPerTeam > 1 {
		return invalidSelection("all 4 players must be from different teams")
	}
	if chip != service.ChipLimitless && totalBudget > SelectionBudget {
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

		// Replace this day's chip (an empty chip frees the one played earlier).
		if err := tx.Where("fantasy_team_id = ? AND tournament_day_id = ?", fantasyTeamID, dayID).
			Delete(&models.FantasyChipUse{}).Error; err != nil {
			return err
		}
		if chip != "" {
			use := models.FantasyChipUse{FantasyTeamID: fantasyTeamID, TournamentDayID: dayID, Chip: chip}
			if err := tx.Create(&use).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// GetDayChip returns the chip played on the day ("" if none).
func (r *FantasyRepository) GetDayChip(fantasyTeamID, dayID uint) (string, error) {
	var uses []models.FantasyChipUse
	err := r.db.Where("fantasy_team_id = ? AND tournament_day_id = ?", fantasyTeamID, dayID).
		Limit(1).Find(&uses).Error
	if err != nil || len(uses) == 0 {
		return "", err
	}
	return uses[0].Chip, nil
}

// GetChipUses lists every chip the team has played, across all days.
func (r *FantasyRepository) GetChipUses(fantasyTeamID uint) ([]models.FantasyChipUse, error) {
	var uses []models.FantasyChipUse
	err := r.db.Where("fantasy_team_id = ?", fantasyTeamID).Order("tournament_day_id ASC").Find(&uses).Error
	return uses, err
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

	chip, err := r.GetDayChip(fantasyTeamID, dayID)
	if err != nil {
		return nil, 0, err
	}
	captainMult := service.CaptainMultiplier(chip)

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
			final = base * captainMult
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
	Region        string `json:"region"`
	Points        int    `json:"points"`
}

// GetStandings totals every fantasy team's points, optionally for a single day
// and optionally for a single region league (region == "" means everyone, i.e. Global).
// It runs three queries no matter how many teams or picks exist (no per-team queries),
// and scores through service.Fantasy* so the rules live in one place.
func (r *FantasyRepository) GetStandings(tournamentID uint, dayID *uint, region string) ([]FantasyStanding, error) {
	return r.getStandings(tournamentID, dayID, region, nil)
}

// getStandings is the shared implementation. When teamIDs is non-nil only those fantasy
// teams are ranked (used by private leagues); region and teamIDs may be combined.
func (r *FantasyRepository) getStandings(tournamentID uint, dayID *uint, region string, teamIDs []uint) ([]FantasyStanding, error) {
	if teamIDs != nil && len(teamIDs) == 0 {
		return []FantasyStanding{}, nil
	}
	teamQuery := r.db.Where("tournament_id = ?", tournamentID)
	if region != "" {
		teamQuery = teamQuery.Where("region = ?", region)
	}
	if teamIDs != nil {
		teamQuery = teamQuery.Where("id IN ?", teamIDs)
	}
	var teams []models.FantasyTeam
	if err := teamQuery.Order("id ASC").Find(&teams).Error; err != nil {
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
	if region != "" {
		selQuery += " AND ft.region = ?"
		selArgs = append(selArgs, region)
	}
	if teamIDs != nil {
		selQuery += " AND ft.id IN ?"
		selArgs = append(selArgs, teamIDs)
	}
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

	// chips played, so the captain multiplier is right for each (team, day)
	chipQuery := `
		SELECT cu.fantasy_team_id, cu.tournament_day_id AS day_id, cu.chip
		FROM fantasy_chip_uses cu
		JOIN fantasy_teams ft ON ft.id = cu.fantasy_team_id
		WHERE ft.tournament_id = ?`
	chipArgs := []any{tournamentID}
	if region != "" {
		chipQuery += " AND ft.region = ?"
		chipArgs = append(chipArgs, region)
	}
	if teamIDs != nil {
		chipQuery += " AND ft.id IN ?"
		chipArgs = append(chipArgs, teamIDs)
	}
	if dayID != nil {
		chipQuery += " AND cu.tournament_day_id = ?"
		chipArgs = append(chipArgs, *dayID)
	}
	var chipRows []struct {
		FantasyTeamID uint
		DayID         uint
		Chip          string
	}
	if err := r.db.Raw(chipQuery, chipArgs...).Scan(&chipRows).Error; err != nil {
		return nil, err
	}
	type teamDay struct{ teamID, dayID uint }
	chips := map[teamDay]string{}
	for _, c := range chipRows {
		chips[teamDay{c.FantasyTeamID, c.DayID}] = c.Chip
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
			pts *= service.CaptainMultiplier(chips[teamDay{sel.FantasyTeamID, sel.DayID}])
		}
		totals[sel.FantasyTeamID] += pts
	}

	standings := make([]FantasyStanding, 0, len(teams))
	for _, t := range teams {
		standings = append(standings, FantasyStanding{
			FantasyTeamID: t.ID, TeamName: t.TeamName, Country: t.Country, Region: t.Region, Points: totals[t.ID],
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
	// Form is 1 (cold) to 5 (hot), from fantasy points in the last matchdays
	// before this one. 0 = no data yet, so the UI shows nothing.
	Form int `json:"form"`
}

func (r *FantasyRepository) GetPlayerPool(tournamentID, dayID uint) ([]FantasyPlayerOption, error) {
	var options []FantasyPlayerOption

	err := r.db.Raw(`
	SELECT p.id AS player_id,
	       p.ign,
	       p.role,
	       p.country,
	       t.id AS team_id,
	       t.name AS team_name,
	       t.tag AS team_tag,
	       p.fantasy_price
	FROM players p
	JOIN teams t ON t.id = p.team_id
	JOIN tournament_day_teams tdtt ON tdtt.team_id = t.id
	WHERE t.tournament_id = ?
	  AND tdtt.tournament_day_id = ?
	ORDER BY t.name ASC, p.ign ASC
`, tournamentID, dayID).Scan(&options).Error
	if err != nil {
		return nil, err
	}

	// Form is a nice-to-have: if it can't be computed the pool is still returned.
	if forms, ferr := r.playerForms(tournamentID, dayID); ferr == nil {
		for i := range options {
			options[i].Form = forms[options[i].PlayerID]
		}
	}

	return options, nil
}

// fantasyStatRow is one player's result in one room, with the matchday it belongs to.
type fantasyStatRow struct {
	PlayerID   uint
	DayID      uint
	DayOrder   int
	Kills      int
	FirstBlood bool
	Placement  int
}

// fantasyStatRows loads every player result from matchdays ordered before
// beforeOrder (pass a huge number for "all matchdays").
func (r *FantasyRepository) fantasyStatRows(tournamentID uint, beforeOrder int) ([]fantasyStatRow, error) {
	var rows []fantasyStatRow
	err := r.db.Raw(`
		SELECT prs.player_id, r.tournament_day_id AS day_id, td.day_order,
		       prs.kills, prs.first_blood, rtr.placement
		FROM player_room_stats prs
		JOIN rooms r ON r.id = prs.room_id
		JOIN room_team_results rtr ON rtr.room_id = prs.room_id AND rtr.team_id = prs.team_id
		JOIN tournament_days td ON td.id = r.tournament_day_id
		WHERE td.tournament_id = ? AND td.day_order < ?
	`, tournamentID, beforeOrder).Scan(&rows).Error
	return rows, err
}

// fantasyRowPoints is the fantasy points one room result is worth (no captain multiplier).
func fantasyRowPoints(s fantasyStatRow) int {
	pts := s.Kills*service.FantasyKillPoints + service.FantasyPlacementPoints(s.Placement)
	if s.FirstBlood {
		pts += service.FantasyFirstBloodPoints
	}
	return pts
}

// recentAverages is each player's average fantasy points per matchday over the
// last service.FormMatchdays matchdays that have results. Players who did not
// play in those matchdays are left out.
func recentAverages(rows []fantasyStatRow) map[uint]float64 {
	dayOrders := map[uint]int{}
	for _, s := range rows {
		dayOrders[s.DayID] = s.DayOrder
	}
	recent := make([]uint, 0, len(dayOrders))
	for id := range dayOrders {
		recent = append(recent, id)
	}
	sort.Slice(recent, func(i, j int) bool { return dayOrders[recent[i]] > dayOrders[recent[j]] })
	if len(recent) > service.FormMatchdays {
		recent = recent[:service.FormMatchdays]
	}
	counted := map[uint]bool{}
	for _, id := range recent {
		counted[id] = true
	}

	type playerDay struct{ playerID, dayID uint }
	perDay := map[playerDay]int{}
	for _, s := range rows {
		if counted[s.DayID] {
			perDay[playerDay{s.PlayerID, s.DayID}] += fantasyRowPoints(s)
		}
	}
	sum := map[uint]int{}
	days := map[uint]int{}
	for k, pts := range perDay {
		sum[k.playerID] += pts
		days[k.playerID]++
	}
	avg := make(map[uint]float64, len(sum))
	for id, total := range sum {
		avg[id] = float64(total) / float64(days[id])
	}
	return avg
}

// playerForms rates every player's recent form (1-5) as it stands before
// dayID. Players with no points in the recent matchdays are left out (no form).
func (r *FantasyRepository) playerForms(tournamentID, dayID uint) (map[uint]int, error) {
	var currentOrder int
	if err := r.db.Raw(`SELECT day_order FROM tournament_days WHERE id = ? AND tournament_id = ?`,
		dayID, tournamentID).Scan(&currentOrder).Error; err != nil {
		return nil, err
	}
	rows, err := r.fantasyStatRows(tournamentID, currentOrder)
	if err != nil {
		return nil, err
	}
	return service.FormRatings(recentAverages(rows)), nil
}

// PlayerFormEntry is one row of the player form table.
type PlayerFormEntry struct {
	PlayerID        uint    `json:"player_id"`
	IGN             string  `json:"ign"`
	Role            string  `json:"role"`
	Country         string  `json:"country"`
	TeamID          uint    `json:"team_id"`
	TeamName        string  `json:"team_name"`
	TeamTag         string  `json:"team_tag"`
	FantasyPrice    int     `json:"fantasy_price"`
	TotalPoints     int     `json:"total_points"`
	MatchdaysPlayed int     `json:"matchdays_played"`
	RecentAvg       float64 `json:"recent_avg"` // avg points per matchday over the form window
	Form            int     `json:"form"`       // 1 (cold) to 5 (hot); 0 = no form yet
}

// GetPlayerFormTable lists every player in the tournament, ranked by total
// fantasy points (highest first), with their current form.
func (r *FantasyRepository) GetPlayerFormTable(tournamentID uint) ([]PlayerFormEntry, error) {
	var entries []PlayerFormEntry
	if err := r.db.Raw(`
		SELECT p.id AS player_id, p.ign, p.role, p.country,
		       t.id AS team_id, t.name AS team_name, t.tag AS team_tag, p.fantasy_price
		FROM players p
		JOIN teams t ON t.id = p.team_id
		WHERE t.tournament_id = ?
	`, tournamentID).Scan(&entries).Error; err != nil {
		return nil, err
	}

	rows, err := r.fantasyStatRows(tournamentID, 1<<30)
	if err != nil {
		return nil, err
	}

	total := map[uint]int{}
	playedDays := map[uint]map[uint]bool{}
	for _, s := range rows {
		total[s.PlayerID] += fantasyRowPoints(s)
		if playedDays[s.PlayerID] == nil {
			playedDays[s.PlayerID] = map[uint]bool{}
		}
		playedDays[s.PlayerID][s.DayID] = true
	}
	avg := recentAverages(rows)
	forms := service.FormRatings(avg)

	for i := range entries {
		id := entries[i].PlayerID
		entries[i].TotalPoints = total[id]
		entries[i].MatchdaysPlayed = len(playedDays[id])
		entries[i].RecentAvg = avg[id]
		entries[i].Form = forms[id]
	}

	sort.SliceStable(entries, func(i, j int) bool {
		if entries[i].TotalPoints != entries[j].TotalPoints {
			return entries[i].TotalPoints > entries[j].TotalPoints
		}
		return entries[i].IGN < entries[j].IGN
	})
	return entries, nil
}

// CountTeams returns how many fantasy teams are in a league for a tournament
// (region == "" counts everyone, i.e. the Global league).
func (r *FantasyRepository) CountTeams(tournamentID uint, region string) (int64, error) {
	q := r.db.Model(&models.FantasyTeam{}).Where("tournament_id = ?", tournamentID)
	if region != "" {
		q = q.Where("region = ?", region)
	}
	var n int64
	err := q.Count(&n).Error
	return n, err
}

// BackfillRegions assigns a region to teams created before leagues existed.
// It is safe to run on every startup: it only touches teams with no region yet,
// and teams whose country maps to no region are simply left alone.
func (r *FantasyRepository) BackfillRegions() (int, error) {
	var teams []models.FantasyTeam
	if err := r.db.Where("region = ''").Find(&teams).Error; err != nil {
		return 0, err
	}
	updated := 0
	for _, t := range teams {
		region := service.RegionForCountry(t.Country)
		if region == "" {
			continue
		}
		if err := r.db.Model(&models.FantasyTeam{}).Where("id = ?", t.ID).Update("region", region).Error; err != nil {
			return updated, err
		}
		updated++
	}
	return updated, nil
}
