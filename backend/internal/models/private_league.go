package models

import "time"

// PrivateLeague is an invite-only league created by a player. It is invisible to
// everyone except its members: the only way in is the join Code.
type PrivateLeague struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	TournamentID uint   `gorm:"not null;index" json:"tournament_id"`
	Name         string `gorm:"not null" json:"name"`

	// Code is the random invite code (stored upper-case, no dashes). Unique across all leagues.
	Code string `gorm:"not null;uniqueIndex" json:"-"`

	// CreatedBy is the user who made the league. It carries no special powers:
	// every member can read and share the code.
	CreatedBy uint      `gorm:"not null;index" json:"-"`
	CreatedAt time.Time `json:"created_at"`
}

// PrivateLeagueMember places one fantasy team in one private league.
// Membership is by fantasy team (one per user per tournament), so the leaderboard
// can reuse the normal standings calculation.
type PrivateLeagueMember struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	LeagueID      uint      `gorm:"not null;uniqueIndex:idx_league_team" json:"league_id"`
	FantasyTeamID uint      `gorm:"not null;uniqueIndex:idx_league_team;index" json:"fantasy_team_id"`
	JoinedAt      time.Time `json:"joined_at"`
}
