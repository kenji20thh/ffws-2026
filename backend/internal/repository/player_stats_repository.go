package repository

import (
	"ffws/internal/service"

	"gorm.io/gorm"
)

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

func (r *PlayerStatsRepository) GetProfile(playerID uint) (*PlayerProfile, error) {
	var player struct {
		ID       uint
		TeamID   uint
		IGN      string
		RealName string
		Role     string
		PhotoURL string
		Region   string
		Country  string
		TeamName string
		TeamTag  string
		LogoURL  string
	}

	err := r.db.Raw(`
		SELECT
			p.id,
			p.team_id,
			p.ign,
			p.real_name,
			p.role,
			p.photo_url,
			p.region,
			p.country,
			t.name AS team_name,
			t.tag AS team_tag,
			t.logo_url
		FROM players p
		JOIN teams t ON t.id = p.team_id
		WHERE p.id = ?
	`, playerID).Scan(&player).Error

	if err != nil {
		return nil, err
	}

	if player.ID == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	profile := &PlayerProfile{
		Player: PlayerProfilePlayer{
			ID:       player.ID,
			IGN:      player.IGN,
			RealName: player.RealName,
			Role:     player.Role,
			PhotoURL: player.PhotoURL,
			Region:   player.Region,
			Country:  player.Country,
		},
		Team: PlayerProfileTeam{
			ID:      player.TeamID,
			Name:    player.TeamName,
			Tag:     player.TeamTag,
			LogoURL: player.LogoURL,
			Region:  player.Region,
			Country: player.Country,
		},
		Days: []PlayerDayStats{},
	}

	// Find the tournament this player's team belongs to.
	var tournamentID uint

	err = r.db.Raw(`
		SELECT tournament_id
		FROM teams
		WHERE id = ?
	`, player.TeamID).Scan(&tournamentID).Error

	if err != nil {
		return nil, err
	}

	// Get all tournament days.
	var days []struct {
		ID       uint
		Name     string
		DayOrder int
		Date     string
	}

	err = r.db.Raw(`
		SELECT
			id,
			name,
			day_order,
			TO_CHAR(date, 'YYYY-MM-DD') AS date
		FROM tournament_days
		WHERE tournament_id = ?
		ORDER BY day_order ASC
	`, tournamentID).Scan(&days).Error

	if err != nil {
		return nil, err
	}

	for _, day := range days {
		var rooms []struct {
			ID         uint
			RoomNumber int
			MapName    string
		}

		err = r.db.Raw(`
			SELECT
				r.id,
				r.room_number,
				r.map_name
			FROM rooms r
			WHERE r.tournament_day_id = ?
			ORDER BY r.room_number ASC
		`, day.ID).Scan(&rooms).Error

		if err != nil {
			return nil, err
		}

		dayStats := PlayerDayStats{
			DayID:    day.ID,
			DayName:  day.Name,
			DayOrder: day.DayOrder,
			Date:     day.Date,
			Rooms:    []PlayerRoomStats{},
		}

		for _, room := range rooms {
			var stat struct {
				Kills      int
				FirstBlood bool
			}

			err = r.db.Raw(`
				SELECT
					kills,
					first_blood
				FROM player_room_stats
				WHERE room_id = ?
				  AND player_id = ?
				LIMIT 1
			`, room.ID, playerID).Scan(&stat).Error

			if err != nil {
				return nil, err
			}

			var teamResult struct {
				Placement int
			}

			err = r.db.Raw(`
				SELECT placement
				FROM room_team_results
				WHERE room_id = ?
				  AND team_id = ?
				LIMIT 1
			`, room.ID, player.TeamID).Scan(&teamResult).Error

			if err != nil {
				return nil, err
			}

			var teamKills int

			err = r.db.Raw(`
				SELECT COALESCE(SUM(kills), 0)
				FROM player_room_stats
				WHERE room_id = ?
				  AND team_id = ?
			`, room.ID, player.TeamID).Scan(&teamKills).Error

			if err != nil {
				return nil, err
			}

			placementPoints := 0

			if teamResult.Placement > 0 {
				placementPoints = service.PlacementPoints(teamResult.Placement)
			}

			killParticipation := 0.0

			if teamKills > 0 {
				killParticipation = float64(stat.Kills) / float64(teamKills) * 100
			}

			roomStats := PlayerRoomStats{
				RoomID:            room.ID,
				RoomNumber:        room.RoomNumber,
				MapName:           room.MapName,
				Placement:         teamResult.Placement,
				PlacementPoints:   placementPoints,
				Kills:             stat.Kills,
				FirstBlood:        stat.FirstBlood,
				TeamKills:         teamKills,
				KillParticipation: killParticipation,
			}

			dayStats.Rooms = append(dayStats.Rooms, roomStats)

			// Only count a room as played when the player has a stat row.
			var played bool

			err = r.db.Raw(`
				SELECT EXISTS(
					SELECT 1
					FROM player_room_stats
					WHERE room_id = ?
					  AND player_id = ?
				)
			`, room.ID, playerID).Scan(&played).Error

			if err != nil {
				return nil, err
			}

			if played {
				dayStats.RoomsPlayed++
				dayStats.TotalKills += stat.Kills
				dayStats.PlacementPoints += placementPoints

				if stat.FirstBlood {
					dayStats.FirstBloods++
				}

				if teamResult.Placement == 1 {
					dayStats.Booyahs++
				}
			}
		}

		profile.Days = append(profile.Days, dayStats)
	}

	// Calculate overall statistics from all played rooms.
	for _, day := range profile.Days {
		profile.Overall.TotalKills += day.TotalKills
		profile.Overall.RoomsPlayed += day.RoomsPlayed
		profile.Overall.PlacementPointsPerRoom += float64(day.PlacementPoints)
		profile.Overall.FirstBloods += day.FirstBloods
		profile.Overall.Booyahs += day.Booyahs
	}

	if profile.Overall.RoomsPlayed > 0 {
		profile.Overall.KillsPerRoom =
			float64(profile.Overall.TotalKills) /
				float64(profile.Overall.RoomsPlayed)

		profile.Overall.PlacementPointsPerRoom =
			profile.Overall.PlacementPointsPerRoom /
				float64(profile.Overall.RoomsPlayed)
	}

	// Calculate average placement from played rooms.
	var placementSum int
	var placementCount int

	for _, day := range profile.Days {
		for _, room := range day.Rooms {
			if room.Placement > 0 {
				placementSum += room.Placement
				placementCount++
			}
		}
	}

	if placementCount > 0 {
		profile.Overall.AveragePlacement =
			float64(placementSum) /
				float64(placementCount)
	}

	// Calculate kill participation using all tournament rooms.
	var playerKills int
	var teamKills int

	err = r.db.Raw(`
		SELECT COALESCE(SUM(kills), 0)
		FROM player_room_stats
		WHERE player_id = ?
	`, playerID).Scan(&playerKills).Error

	if err != nil {
		return nil, err
	}

	err = r.db.Raw(`
		SELECT COALESCE(SUM(kills), 0)
		FROM player_room_stats
		WHERE team_id = ?
	`, player.TeamID).Scan(&teamKills).Error

	if err != nil {
		return nil, err
	}

	if teamKills > 0 {
		profile.Overall.KillParticipation =
			float64(playerKills) /
				float64(teamKills) *
				100
	}

	return profile, nil
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

type PlayerProfile struct {
	Player  PlayerProfilePlayer `json:"player"`
	Team    PlayerProfileTeam   `json:"team"`
	Overall PlayerOverallStats  `json:"overall"`
	Days    []PlayerDayStats    `json:"days"`
}

type PlayerProfilePlayer struct {
	ID       uint   `json:"id"`
	IGN      string `json:"ign"`
	RealName string `json:"real_name"`
	Role     string `json:"role"`
	PhotoURL string `json:"photo_url"`
	Region   string `json:"region"`
	Country  string `json:"country"`
}

type PlayerProfileTeam struct {
	ID      uint   `json:"id"`
	Name    string `json:"name"`
	Tag     string `json:"tag"`
	LogoURL string `json:"logo_url"`
	Region  string `json:"region"`
	Country string `json:"country"`
}

type PlayerOverallStats struct {
	TotalKills             int     `json:"total_kills"`
	RoomsPlayed            int     `json:"rooms_played"`
	KillsPerRoom           float64 `json:"kills_per_room"`
	PlacementPointsPerRoom float64 `json:"placement_points_per_room"`
	AveragePlacement       float64 `json:"average_placement"`
	Booyahs                int     `json:"booyahs"`
	FirstBloods            int     `json:"first_bloods"`
	KillParticipation      float64 `json:"kill_participation"`
}

type PlayerDayStats struct {
	DayID           uint              `json:"day_id"`
	DayName         string            `json:"day_name"`
	DayOrder        int               `json:"day_order"`
	Date            string            `json:"date"`
	TotalKills      int               `json:"total_kills"`
	PlacementPoints int               `json:"placement_points"`
	FirstBloods     int               `json:"first_bloods"`
	Booyahs         int               `json:"booyahs"`
	RoomsPlayed     int               `json:"rooms_played"`
	Rooms           []PlayerRoomStats `json:"rooms"`
}

type PlayerRoomStats struct {
	RoomID            uint    `json:"room_id"`
	RoomNumber        int     `json:"room_number"`
	MapName           string  `json:"map_name"`
	Placement         int     `json:"placement"`
	PlacementPoints   int     `json:"placement_points"`
	Kills             int     `json:"kills"`
	FirstBlood        bool    `json:"first_blood"`
	TeamKills         int     `json:"team_kills"`
	KillParticipation float64 `json:"kill_participation"`
}
