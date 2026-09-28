package repository

import "gorm.io/gorm"

type PlayerStatsRepository struct {
	db *gorm.DB
}

func NewPlayerStatsRepository(db *gorm.DB) *PlayerStatsRepository {
	return &PlayerStatsRepository{db: db}
}

type PlayerLeaderboardEntry struct {
	PlayerID    uint   `json:"player_id" gorm:"column:player_id"`
	IGN         string `json:"ign" gorm:"column:ign"`
	TeamID      uint   `json:"team_id" gorm:"column:team_id"`
	TeamName    string `json:"team_name" gorm:"column:team_name"`
	TotalKills  int    `json:"total_kills" gorm:"column:total_kills"`
	RoomsPlayed int    `json:"rooms_played" gorm:"column:rooms_played"`
}

// GetLeaderboard returns every player in the tournament ranked by total kills.
func (r *PlayerStatsRepository) GetLeaderboard(tournamentID uint) ([]PlayerLeaderboardEntry, error) {
	var entries []PlayerLeaderboardEntry
	err := r.db.Raw(`
		SELECT p.id AS player_id, p.ign AS ign,
		       t.id AS team_id, t.name AS team_name,
		       COALESCE(SUM(prs.kills), 0) AS total_kills,
		       COUNT(DISTINCT prs.room_id) AS rooms_played
		FROM players p
		JOIN teams t ON t.id = p.team_id
		LEFT JOIN player_room_stats prs ON prs.player_id = p.id
		WHERE t.tournament_id = ?
		GROUP BY p.id, p.ign, t.id, t.name
		ORDER BY total_kills DESC, p.ign ASC
	`, tournamentID).Scan(&entries).Error
	return entries, err
}
