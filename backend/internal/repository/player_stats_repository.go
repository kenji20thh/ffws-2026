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
	FirstBloods int    `json:"first_bloods" gorm:"column:first_bloods"`
}

func (r *PlayerStatsRepository) GetProfile(playerID uint) (*PlayerProfile, error) {
	var player struct {
		ID        uint
		TeamID    uint
		IGN       string
		RealName  string
		Role      string
		IsCaptain bool
		PhotoURL  string
		Region    string
		Country   string
		TeamName  string
		TeamTag   string
		LogoURL   string
	}

	err := r.db.Raw(`
		SELECT
			p.id,
			p.team_id,
			p.ign,
			p.real_name,
			p.role,
			p.is_captain,
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
			ID:        player.ID,
			IGN:       player.IGN,
			RealName:  player.RealName,
			Role:      player.Role,
			IsCaptain: player.IsCaptain,
			PhotoURL:  player.PhotoURL,
			Region:    player.Region,
			Country:   player.Country,
		},
		Team: PlayerProfileTeam{
			ID:      player.TeamID,
			Name:    player.TeamName,
			Tag:     player.TeamTag,
			LogoURL: player.LogoURL,
			Region:  player.Region,
			Country: player.Country,
		},
		Days:       []PlayerDayStats{},
		TopWeapons: []PlayerWeaponStat{},
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

	// Load everything the loop below needs in 4 queries total (it used to run ~5 queries
	// per room, which meant hundreds of queries for one profile page).
	type roomRow struct {
		ID              uint
		RoomNumber      int
		MapName         string
		TournamentDayID uint
	}
	roomsByDay := map[uint][]roomRow{}
	dayIDs := make([]uint, 0, len(days))
	for _, d := range days {
		dayIDs = append(dayIDs, d.ID)
	}

	type playerStat struct {
		Kills      int
		FirstBlood bool
	}
	playerStats := map[uint]playerStat{} // room id -> this player's stat row (present = played)
	placements := map[uint]int{}         // room id -> this team's placement
	teamKillsByRoom := map[uint]int{}    // room id -> this team's total kills

	if len(dayIDs) > 0 {
		var roomRows []roomRow
		err = r.db.Raw(`
			SELECT id, room_number, map_name, tournament_day_id
			FROM rooms
			WHERE tournament_day_id IN (?)
			ORDER BY room_number ASC
		`, dayIDs).Scan(&roomRows).Error
		if err != nil {
			return nil, err
		}
		for _, rr := range roomRows {
			roomsByDay[rr.TournamentDayID] = append(roomsByDay[rr.TournamentDayID], rr)
		}

		var statRows []struct {
			RoomID     uint
			Kills      int
			FirstBlood bool
		}
		err = r.db.Raw(`
			SELECT room_id, kills, first_blood
			FROM player_room_stats
			WHERE player_id = ?
		`, playerID).Scan(&statRows).Error
		if err != nil {
			return nil, err
		}
		for _, sr := range statRows {
			if _, seen := playerStats[sr.RoomID]; !seen {
				playerStats[sr.RoomID] = playerStat{Kills: sr.Kills, FirstBlood: sr.FirstBlood}
			}
		}

		var placementRows []struct {
			RoomID    uint
			Placement int
		}
		err = r.db.Raw(`
			SELECT room_id, placement
			FROM room_team_results
			WHERE team_id = ?
		`, player.TeamID).Scan(&placementRows).Error
		if err != nil {
			return nil, err
		}
		for _, pr := range placementRows {
			if _, seen := placements[pr.RoomID]; !seen {
				placements[pr.RoomID] = pr.Placement
			}
		}

		var killRows []struct {
			RoomID uint
			Kills  int
		}
		err = r.db.Raw(`
			SELECT room_id, COALESCE(SUM(kills), 0) AS kills
			FROM player_room_stats
			WHERE team_id = ?
			GROUP BY room_id
		`, player.TeamID).Scan(&killRows).Error
		if err != nil {
			return nil, err
		}
		for _, kr := range killRows {
			teamKillsByRoom[kr.RoomID] = kr.Kills
		}
	}

	for _, day := range days {
		dayStats := PlayerDayStats{
			DayID:    day.ID,
			DayName:  day.Name,
			DayOrder: day.DayOrder,
			Date:     day.Date,
			Rooms:    []PlayerRoomStats{},
		}

		for _, room := range roomsByDay[day.ID] {
			stat, played := playerStats[room.ID]
			placement := placements[room.ID]
			teamKills := teamKillsByRoom[room.ID]

			placementPoints := 0
			if placement > 0 {
				placementPoints = service.PlacementPoints(placement)
			}

			killParticipation := 0.0
			if teamKills > 0 {
				killParticipation = float64(stat.Kills) / float64(teamKills) * 100
			}

			dayStats.Rooms = append(dayStats.Rooms, PlayerRoomStats{
				RoomID:            room.ID,
				RoomNumber:        room.RoomNumber,
				MapName:           room.MapName,
				Placement:         placement,
				PlacementPoints:   placementPoints,
				Kills:             stat.Kills,
				FirstBlood:        stat.FirstBlood,
				TeamKills:         teamKills,
				KillParticipation: killParticipation,
			})

			// Only count a room as played when the player has a stat row.
			if played {
				dayStats.RoomsPlayed++
				dayStats.TotalKills += stat.Kills
				dayStats.PlacementPoints += placementPoints

				if stat.FirstBlood {
					dayStats.FirstBloods++
				}

				if placement == 1 {
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

	// Headshots and weapons are extras: if they cannot be loaded the profile still works.
	var headshots int
	if herr := r.db.Raw(`SELECT COALESCE(MAX(headshot_kills), 0) FROM player_headshots WHERE player_id = ?`, playerID).Scan(&headshots).Error; herr == nil {
		profile.Overall.HeadshotKills = headshots
	}

	if weapons, werr := r.topWeapons(playerID, 3); werr == nil && weapons != nil {
		profile.TopWeapons = weapons
	}

	return profile, nil
}

// GetLeaderboard returns every player in the tournament ranked by total kills.
// When dayID is non-zero only the rooms of that tournament day are counted (kills,
// rooms played and first bloods for that day); players with no stats still appear
// with zeros. Ties are broken by first bloods, then fewer rooms played, then IGN.
//
// When session is non-zero (and dayID is set) only the rooms of that session of the day
// are counted (1 = first lobby, 2 = second lobby).
func (r *PlayerStatsRepository) GetLeaderboard(tournamentID uint, dayID uint, session int) ([]PlayerLeaderboardEntry, error) {
	var entries []PlayerLeaderboardEntry

	roomFilter := ""
	args := []interface{}{}
	if dayID != 0 {
		roomFilter = " AND prs.room_id IN (SELECT id FROM rooms WHERE tournament_day_id = ?)"
		args = append(args, dayID)
		if session != 0 {
			roomFilter = " AND prs.room_id IN (SELECT id FROM rooms WHERE tournament_day_id = ? AND session = ?)"
			args = append(args, session)
		}
	}
	args = append(args, tournamentID)

	err := r.db.Raw(`
		SELECT p.id AS player_id, p.ign AS ign,
		       t.id AS team_id, t.name AS team_name,
		       COALESCE(SUM(prs.kills), 0) AS total_kills,
		       COUNT(DISTINCT prs.room_id) AS rooms_played,
		       COALESCE(SUM(CASE WHEN prs.first_blood THEN 1 ELSE 0 END), 0) AS first_bloods
		FROM players p
		JOIN teams t ON t.id = p.team_id
		LEFT JOIN player_room_stats prs ON prs.player_id = p.id`+roomFilter+`
		WHERE t.tournament_id = ?
		GROUP BY p.id, p.ign, t.id, t.name
		ORDER BY total_kills DESC, first_bloods DESC, rooms_played ASC, p.ign ASC
	`, args...).Scan(&entries).Error
	return entries, err
}

type PlayerProfile struct {
	Player  PlayerProfilePlayer `json:"player"`
	Team    PlayerProfileTeam   `json:"team"`
	Overall PlayerOverallStats  `json:"overall"`
	Days    []PlayerDayStats    `json:"days"`
	// The player's three most-used weapons (empty until weapon kills are entered).
	TopWeapons []PlayerWeaponStat `json:"top_weapons"`
}

// PlayerWeaponStat is one weapon in a player's top weapons.
type PlayerWeaponStat struct {
	WeaponID   uint    `json:"weapon_id"`
	Name       string  `json:"name"`
	Category   string  `json:"category"`
	ImageURL   string  `json:"image_url"`
	Kills      int     `json:"kills"`
	Percentage float64 `json:"percentage"` // share of the kills recorded with weapons
}

// topWeapons returns the player's most-used weapons by kills, with each one's
// share of all the weapon kills recorded for that player.
func (r *PlayerStatsRepository) topWeapons(playerID uint, limit int) ([]PlayerWeaponStat, error) {
	var rows []PlayerWeaponStat
	err := r.db.Raw(`
		SELECT w.id AS weapon_id, w.name, w.category, w.image_url, pwk.kills
		FROM player_weapon_kills pwk
		JOIN weapons w ON w.id = pwk.weapon_id
		WHERE pwk.player_id = ? AND pwk.kills > 0
		ORDER BY pwk.kills DESC, w.name ASC
	`, playerID).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	total := 0
	for _, w := range rows {
		total += w.Kills
	}
	for i := range rows {
		rows[i].Percentage = float64(rows[i].Kills) / float64(total) * 100
	}
	if len(rows) > limit {
		rows = rows[:limit]
	}
	return rows, nil
}

type PlayerProfilePlayer struct {
	ID        uint   `json:"id"`
	IGN       string `json:"ign"`
	RealName  string `json:"real_name"`
	Role      string `json:"role"`
	IsCaptain bool   `json:"is_captain"`
	PhotoURL  string `json:"photo_url"`
	Region    string `json:"region"`
	Country   string `json:"country"`
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
	// Headshot kills entered by an admin (0 until entered).
	HeadshotKills int `json:"headshot_kills"`
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
