package repository

import (
	"ffws/internal/service"

	"gorm.io/gorm"
)

type TeamStatsRepository struct {
	db *gorm.DB
}

func NewTeamStatsRepository(db *gorm.DB) *TeamStatsRepository {
	return &TeamStatsRepository{db: db}
}

func (r *TeamStatsRepository) GetProfile(teamID uint) (*TeamProfile, error) {
	var team struct {
		ID      uint
		Name    string
		Tag     string
		LogoURL string
		Region  string
		Country string
	}
	if err := r.db.Raw(`SELECT id, name, tag, logo_url, region, country FROM teams WHERE id = ?`, teamID).
		Scan(&team).Error; err != nil {
		return nil, err
	}
	if team.ID == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	profile := &TeamProfile{
		Team: TeamProfileTeam{
			ID: team.ID, Name: team.Name, Tag: team.Tag,
			LogoURL: team.LogoURL, Region: team.Region, Country: team.Country,
		},
		Players: []TeamPlayerStats{},
		Rooms:   []TeamRoomHistory{},
		Maps:    []TeamMapStats{},

		WeaponCategories: []TeamWeaponCategoryStat{},
	}

	var players []struct {
		ID        uint
		IGN       string
		Role      string
		IsCaptain bool
		PhotoURL  string
		Country   string
	}
	if err := r.db.Raw(`SELECT id, ign, role, is_captain, photo_url, country FROM players WHERE team_id = ? ORDER BY id ASC`, teamID).
		Scan(&players).Error; err != nil {
		return nil, err
	}

	// A team with no players yet has nothing to compute — return a clean empty
	// profile instead of continuing into logic that assumes at least one player.
	if len(players) == 0 {
		return profile, nil
	}

	teamTotalKills := 0
	playerKills := map[uint]int{}
	playerRooms := map[uint]int{}

	for _, p := range players {
		var kills int
		r.db.Raw(`SELECT COALESCE(SUM(kills),0) FROM player_room_stats WHERE player_id = ?`, p.ID).Scan(&kills)
		var rooms int
		r.db.Raw(`SELECT COUNT(DISTINCT room_id) FROM player_room_stats WHERE player_id = ?`, p.ID).Scan(&rooms)
		playerKills[p.ID] = kills
		playerRooms[p.ID] = rooms
		teamTotalKills += kills
	}

	for _, p := range players {
		participation := 0.0
		if teamTotalKills > 0 {
			participation = float64(playerKills[p.ID]) / float64(teamTotalKills) * 100
		}
		profile.Players = append(profile.Players, TeamPlayerStats{
			PlayerID: p.ID, IGN: p.IGN, Role: p.Role, IsCaptain: p.IsCaptain, PhotoURL: p.PhotoURL, Country: p.Country,
			TotalKills: playerKills[p.ID], RoomsPlayed: playerRooms[p.ID], KillParticipation: participation,
		})
	}

	var rooms []struct {
		RoomID     uint
		RoomNumber int
		MapName    string
		DayName    string
		Placement  int
	}
	if err := r.db.Raw(`
		SELECT r.id AS room_id, r.room_number, r.map_name, td.name AS day_name, rtr.placement
		FROM room_team_results rtr
		JOIN rooms r ON r.id = rtr.room_id
		JOIN tournament_days td ON td.id = r.tournament_day_id
		WHERE rtr.team_id = ?
		ORDER BY td.day_order ASC, r.room_number ASC
	`, teamID).Scan(&rooms).Error; err != nil {
		return nil, err
	}

	mapAgg := map[string]*TeamMapStats{}
	placementSum := 0
	booyahs := 0

	for _, rm := range rooms {
		var teamKills int
		r.db.Raw(`SELECT COALESCE(SUM(kills),0) FROM player_room_stats WHERE room_id = ? AND team_id = ?`, rm.RoomID, teamID).
			Scan(&teamKills)

		placementPts := service.PlacementPoints(rm.Placement)
		profile.Rooms = append(profile.Rooms, TeamRoomHistory{
			RoomID: rm.RoomID, RoomNumber: rm.RoomNumber, MapName: rm.MapName, DayName: rm.DayName,
			Placement: rm.Placement, TeamKills: teamKills, PlacementPoints: placementPts,
			TotalPoints: placementPts + teamKills,
		})

		placementSum += rm.Placement
		if rm.Placement == 1 {
			booyahs++
		}

		mapName := rm.MapName
		if mapName == "" {
			mapName = "Unknown"
		}
		agg, ok := mapAgg[mapName]
		if !ok {
			agg = &TeamMapStats{MapName: mapName}
			mapAgg[mapName] = agg
		}
		agg.RoomsPlayed++
		agg.TotalKills += teamKills
		agg.PlacementSum += rm.Placement
		if rm.Placement == 1 {
			agg.Booyahs++
		}
	}

	for _, m := range mapAgg {
		if m.RoomsPlayed > 0 {
			m.AveragePlacement = float64(m.PlacementSum) / float64(m.RoomsPlayed)
		}
		profile.Maps = append(profile.Maps, *m)
	}

	profile.Overall.TotalKills = teamTotalKills
	profile.Overall.RoomsPlayed = len(rooms)
	if len(rooms) > 0 {
		profile.Overall.KillsPerRoom = float64(teamTotalKills) / float64(len(rooms))
		profile.Overall.AveragePlacement = float64(placementSum) / float64(len(rooms))
	}
	profile.Overall.Booyahs = booyahs

	// Weapon categories are an extra: if they cannot be loaded the profile still works.
	if cats, cerr := r.weaponCategories(teamID); cerr == nil && cats != nil {
		profile.WeaponCategories = cats
	}

	return profile, nil
}

// weaponCategories adds up the weapon kills of every player on the team and groups
// them by weapon category (AR, SMG, Sniper...). Percentage is each category's share
// of all the weapon kills recorded for the team, so the shares always add up to 100.
// A weapon with no category is counted under "Other".
func (r *TeamStatsRepository) weaponCategories(teamID uint) ([]TeamWeaponCategoryStat, error) {
	var rows []TeamWeaponCategoryStat
	err := r.db.Raw(`
		SELECT COALESCE(NULLIF(TRIM(w.category), ''), 'Other') AS category,
		       SUM(pwk.kills) AS kills
		FROM player_weapon_kills pwk
		JOIN weapons w ON w.id = pwk.weapon_id
		JOIN players p ON p.id = pwk.player_id
		WHERE p.team_id = ? AND pwk.kills > 0
		GROUP BY COALESCE(NULLIF(TRIM(w.category), ''), 'Other')
		ORDER BY kills DESC, category ASC
	`, teamID).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	total := 0
	for _, c := range rows {
		total += c.Kills
	}
	if total == 0 {
		return []TeamWeaponCategoryStat{}, nil
	}
	for i := range rows {
		rows[i].Percentage = float64(rows[i].Kills) / float64(total) * 100
	}
	return rows, nil
}

type TeamProfile struct {
	Team    TeamProfileTeam   `json:"team"`
	Overall TeamOverallStats  `json:"overall"`
	Players []TeamPlayerStats `json:"players"`
	Rooms   []TeamRoomHistory `json:"rooms"`
	Maps    []TeamMapStats    `json:"maps"`

	// Kills split by weapon category (empty until weapon kills are entered).
	WeaponCategories []TeamWeaponCategoryStat `json:"weapon_categories"`
}

// TeamWeaponCategoryStat is how many of the team's weapon kills came from one category.
type TeamWeaponCategoryStat struct {
	Category   string  `json:"category"`
	Kills      int     `json:"kills"`
	Percentage float64 `json:"percentage"` // share of the kills recorded with weapons, 0-100
}

type TeamProfileTeam struct {
	ID      uint   `json:"id"`
	Name    string `json:"name"`
	Tag     string `json:"tag"`
	LogoURL string `json:"logo_url"`
	Region  string `json:"region"`
	Country string `json:"country"`
}

type TeamOverallStats struct {
	TotalKills       int     `json:"total_kills"`
	RoomsPlayed      int     `json:"rooms_played"`
	KillsPerRoom     float64 `json:"kills_per_room"`
	AveragePlacement float64 `json:"average_placement"`
	Booyahs          int     `json:"booyahs"`
}

type TeamPlayerStats struct {
	PlayerID          uint    `json:"player_id"`
	IGN               string  `json:"ign"`
	Role              string  `json:"role"`
	IsCaptain         bool    `json:"is_captain"`
	PhotoURL          string  `json:"photo_url"`
	Country           string  `json:"country"`
	TotalKills        int     `json:"total_kills"`
	RoomsPlayed       int     `json:"rooms_played"`
	KillParticipation float64 `json:"kill_participation"`
}

type TeamRoomHistory struct {
	RoomID          uint   `json:"room_id"`
	RoomNumber      int    `json:"room_number"`
	MapName         string `json:"map_name"`
	DayName         string `json:"day_name"`
	Placement       int    `json:"placement"`
	TeamKills       int    `json:"team_kills"`
	PlacementPoints int    `json:"placement_points"`
	TotalPoints     int    `json:"total_points"`
}

type TeamMapStats struct {
	MapName          string  `json:"map_name"`
	RoomsPlayed      int     `json:"rooms_played"`
	TotalKills       int     `json:"total_kills"`
	AveragePlacement float64 `json:"average_placement"`
	Booyahs          int     `json:"booyahs"`
	PlacementSum     int     `json:"-"`
}
