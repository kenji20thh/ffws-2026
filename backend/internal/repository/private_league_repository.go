package repository

import (
	"errors"
	"strings"
	"time"

	"ffws/internal/models"
	"ffws/internal/service"

	"gorm.io/gorm"
)

const (
	MaxPrivateLeaguesCreated = 5   // leagues one user may create per tournament
	MaxPrivateLeaguesJoined  = 20  // leagues one team may be in (created + joined)
	MaxPrivateLeagueMembers  = 100 // members per league
	MinLeagueNameLen         = 3
	MaxLeagueNameLen         = 30
)

var (
	// ErrLeagueNotFound is returned both when a code is wrong and when the caller is not a
	// member of the league they asked for, so the two cases cannot be told apart from outside.
	ErrLeagueNotFound = errors.New("league not found")
	ErrLeagueFull     = errors.New("this league is full")
	ErrAlreadyMember  = errors.New("you are already in this league")
)

// LeagueLimitError / LeagueNameError are user-facing validation problems.
type LeagueLimitError struct{ Msg string }

func (e *LeagueLimitError) Error() string { return e.Msg }

// ValidateLeagueName trims the name and checks its length (in characters, not bytes).
func ValidateLeagueName(name string) (string, error) {
	name = strings.Join(strings.Fields(name), " ") // trim + collapse inner whitespace
	n := len([]rune(name))
	if n < MinLeagueNameLen || n > MaxLeagueNameLen {
		return "", &LeagueLimitError{Msg: "league name must be between 3 and 30 characters"}
	}
	return name, nil
}

// CreatePrivateLeague makes a league with a fresh random code and puts the creator's team in it.
func (r *FantasyRepository) CreatePrivateLeague(userID uint, team *models.FantasyTeam, name string) (*models.PrivateLeague, error) {
	name, err := ValidateLeagueName(name)
	if err != nil {
		return nil, err
	}

	var created int64
	if err := r.db.Model(&models.PrivateLeague{}).
		Where("created_by = ? AND tournament_id = ?", userID, team.TournamentID).
		Count(&created).Error; err != nil {
		return nil, err
	}
	if created >= MaxPrivateLeaguesCreated {
		return nil, &LeagueLimitError{Msg: "you have reached the limit of private leagues you can create"}
	}
	if err := r.checkJoinedLimit(team.ID); err != nil {
		return nil, err
	}

	var league models.PrivateLeague
	for attempt := 0; attempt < 5; attempt++ {
		code, err := service.GenerateLeagueCode()
		if err != nil {
			return nil, err
		}
		var clash int64
		if err := r.db.Model(&models.PrivateLeague{}).Where("code = ?", code).Count(&clash).Error; err != nil {
			return nil, err
		}
		if clash > 0 {
			continue // astronomically unlikely, but cheap to handle
		}
		league = models.PrivateLeague{TournamentID: team.TournamentID, Name: name, Code: code, CreatedBy: userID}
		err = r.db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Create(&league).Error; err != nil {
				return err
			}
			return tx.Create(&models.PrivateLeagueMember{
				LeagueID: league.ID, FantasyTeamID: team.ID, JoinedAt: time.Now(),
			}).Error
		})
		if err != nil {
			return nil, err
		}
		return &league, nil
	}
	return nil, errors.New("could not generate a unique league code")
}

func (r *FantasyRepository) checkJoinedLimit(teamID uint) error {
	var joined int64
	if err := r.db.Model(&models.PrivateLeagueMember{}).Where("fantasy_team_id = ?", teamID).Count(&joined).Error; err != nil {
		return err
	}
	if joined >= MaxPrivateLeaguesJoined {
		return &LeagueLimitError{Msg: "you are in the maximum number of private leagues"}
	}
	return nil
}

// JoinPrivateLeague adds the team to the league that owns the code.
// The league must belong to the same tournament as the team.
func (r *FantasyRepository) JoinPrivateLeague(team *models.FantasyTeam, rawCode string) (*models.PrivateLeague, error) {
	code := service.NormalizeLeagueCode(rawCode)
	if !service.IsValidLeagueCode(code) {
		return nil, ErrLeagueNotFound
	}

	var league models.PrivateLeague
	err := r.db.Where("code = ? AND tournament_id = ?", code, team.TournamentID).First(&league).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrLeagueNotFound
		}
		return nil, err
	}

	var already int64
	if err := r.db.Model(&models.PrivateLeagueMember{}).
		Where("league_id = ? AND fantasy_team_id = ?", league.ID, team.ID).Count(&already).Error; err != nil {
		return nil, err
	}
	if already > 0 {
		return &league, ErrAlreadyMember
	}

	var members int64
	if err := r.db.Model(&models.PrivateLeagueMember{}).Where("league_id = ?", league.ID).Count(&members).Error; err != nil {
		return nil, err
	}
	if members >= MaxPrivateLeagueMembers {
		return nil, ErrLeagueFull
	}
	if err := r.checkJoinedLimit(team.ID); err != nil {
		return nil, err
	}

	if err := r.db.Create(&models.PrivateLeagueMember{
		LeagueID: league.ID, FantasyTeamID: team.ID, JoinedAt: time.Now(),
	}).Error; err != nil {
		return nil, err
	}
	return &league, nil
}

// PrivateLeagueSummary is a league plus its member count, as shown to a member.
type PrivateLeagueSummary struct {
	League  models.PrivateLeague
	Members int64
}

// GetMyPrivateLeagues lists only the leagues this team is a member of.
func (r *FantasyRepository) GetMyPrivateLeagues(teamID, tournamentID uint) ([]PrivateLeagueSummary, error) {
	var leagues []models.PrivateLeague
	err := r.db.Raw(`
		SELECT l.*
		FROM private_leagues l
		JOIN private_league_members m ON m.league_id = l.id
		WHERE m.fantasy_team_id = ? AND l.tournament_id = ?
		ORDER BY m.joined_at ASC, l.id ASC
	`, teamID, tournamentID).Scan(&leagues).Error
	if err != nil {
		return nil, err
	}
	out := make([]PrivateLeagueSummary, 0, len(leagues))
	if len(leagues) == 0 {
		return out, nil
	}

	ids := make([]uint, 0, len(leagues))
	for _, l := range leagues {
		ids = append(ids, l.ID)
	}
	var counts []struct {
		LeagueID uint
		N        int64
	}
	if err := r.db.Raw(`
		SELECT league_id, COUNT(*) AS n FROM private_league_members
		WHERE league_id IN ? GROUP BY league_id
	`, ids).Scan(&counts).Error; err != nil {
		return nil, err
	}
	byLeague := map[uint]int64{}
	for _, c := range counts {
		byLeague[c.LeagueID] = c.N
	}
	for _, l := range leagues {
		out = append(out, PrivateLeagueSummary{League: l, Members: byLeague[l.ID]})
	}
	return out, nil
}

// GetPrivateLeagueForMember returns the league only if the team is in it.
// Non-members get ErrLeagueNotFound, exactly as if the league did not exist.
func (r *FantasyRepository) GetPrivateLeagueForMember(leagueID, teamID uint) (*models.PrivateLeague, error) {
	var league models.PrivateLeague
	err := r.db.Raw(`
		SELECT l.*
		FROM private_leagues l
		JOIN private_league_members m ON m.league_id = l.id
		WHERE l.id = ? AND m.fantasy_team_id = ?
		LIMIT 1
	`, leagueID, teamID).Scan(&league).Error
	if err != nil {
		return nil, err
	}
	if league.ID == 0 {
		return nil, ErrLeagueNotFound
	}
	return &league, nil
}

// GetPrivateLeagueStandings ranks the members of a league. Callers must have already
// proved membership with GetPrivateLeagueForMember.
func (r *FantasyRepository) GetPrivateLeagueStandings(league *models.PrivateLeague, dayID *uint) ([]FantasyStanding, error) {
	var ids []uint
	if err := r.db.Model(&models.PrivateLeagueMember{}).
		Where("league_id = ?", league.ID).Pluck("fantasy_team_id", &ids).Error; err != nil {
		return nil, err
	}
	if ids == nil {
		ids = []uint{}
	}
	return r.getStandings(league.TournamentID, dayID, "", ids)
}

// LeavePrivateLeague removes the team from the league. When the last member leaves,
// the league (and its code) is deleted.
func (r *FantasyRepository) LeavePrivateLeague(leagueID, teamID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		res := tx.Where("league_id = ? AND fantasy_team_id = ?", leagueID, teamID).
			Delete(&models.PrivateLeagueMember{})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrLeagueNotFound
		}
		var left int64
		if err := tx.Model(&models.PrivateLeagueMember{}).Where("league_id = ?", leagueID).Count(&left).Error; err != nil {
			return err
		}
		if left == 0 {
			return tx.Delete(&models.PrivateLeague{}, leagueID).Error
		}
		return nil
	})
}
