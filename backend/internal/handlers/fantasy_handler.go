package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"ffws/internal/repository"
	"ffws/internal/service"

	"github.com/gin-gonic/gin"
)

type FantasyHandler struct {
	repo *repository.FantasyRepository
}

func NewFantasyHandler(repo *repository.FantasyRepository) *FantasyHandler {
	return &FantasyHandler{repo: repo}
}

type createFantasyTeamRequest struct {
	TournamentID uint   `json:"tournament_id" binding:"required"`
	TeamName     string `json:"team_name" binding:"required"`

	// Country decides the region league. The region itself is never accepted from the client.
	Country string `json:"country" binding:"required"`
}

func (h *FantasyHandler) CreateTeam(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req createFantasyTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	country := strings.TrimSpace(req.Country)
	if country == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "country is required"})
		return
	}

	team, err := h.repo.CreateTeam(userID, req.TournamentID, req.TeamName, country)
	if err != nil {
		if errors.Is(err, repository.ErrFantasyTeamExists) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create fantasy team"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": team})
}

func (h *FantasyHandler) GetMyTeam(c *gin.Context) {
	userID := c.GetUint("user_id")
	tournamentID, err := strconv.ParseUint(c.Query("tournament_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tournament_id query param is required"})
		return
	}

	team, err := h.repo.GetTeamByUser(userID, uint(tournamentID))
	if err != nil {
		if errors.Is(err, repository.ErrFantasyTeamNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch fantasy team"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": team})
}

type pickRequest struct {
	PlayerID  uint `json:"player_id" binding:"required"`
	IsCaptain bool `json:"is_captain"`
}

type submitSelectionRequest struct {
	Picks []pickRequest `json:"picks" binding:"required,len=4,dive"`
	Chip  string        `json:"chip"` // optional: triple_captain, limitless or same_team
}

func (h *FantasyHandler) SubmitSelection(c *gin.Context) {
	userID := c.GetUint("user_id")
	dayID, err := strconv.ParseUint(c.Param("dayId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid day id"})
		return
	}
	tournamentID, err := strconv.ParseUint(c.Query("tournament_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tournament_id query param is required"})
		return
	}

	team, err := h.repo.GetTeamByUser(userID, uint(tournamentID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "create a fantasy team first"})
		return
	}

	var req submitSelectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	picks := make([]repository.PickInput, 0, 4)
	for _, p := range req.Picks {
		picks = append(picks, repository.PickInput{PlayerID: p.PlayerID, IsCaptain: p.IsCaptain})
	}

	if err := h.repo.SubmitSelection(team.ID, uint(tournamentID), uint(dayID), picks, req.Chip); err != nil {
		var selErr *repository.SelectionError
		switch {
		case errors.Is(err, repository.ErrDayNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, repository.ErrSelectionLocked):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case errors.As(err, &selErr):
			c.JSON(http.StatusBadRequest, gin.H{"error": selErr.Error()})
		default:
			log.Printf("submit selection failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save selection"})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "selection saved"})
}

func (h *FantasyHandler) GetMySelection(c *gin.Context) {
	userID := c.GetUint("user_id")
	dayID, err := strconv.ParseUint(c.Param("dayId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid day id"})
		return
	}
	tournamentID, err := strconv.ParseUint(c.Query("tournament_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tournament_id query param is required"})
		return
	}

	team, err := h.repo.GetTeamByUser(userID, uint(tournamentID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "create a fantasy team first"})
		return
	}

	day, err := h.repo.GetDayInTournament(uint(dayID), uint(tournamentID))
	if err != nil {
		if errors.Is(err, repository.ErrDayNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tournament day"})
		return
	}

	selections, err := h.repo.GetSelection(team.ID, day.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch selection"})
		return
	}
	breakdown, total, err := h.repo.ComputeDayScore(team.ID, day.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to compute score"})
		return
	}
	locked, err := h.repo.IsDayLocked(day)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check lock status"})
		return
	}

	var lockTime *time.Time
	if !day.Deadline.IsZero() {
		lockTime = &day.Deadline
	}

	chip, err := h.repo.GetDayChip(team.ID, day.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch chip"})
		return
	}
	chipsUsed, err := h.repo.GetChipUses(team.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch chips"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"selections":   selections,
		"breakdown":    breakdown,
		"total_points": total,
		"lock_time":    lockTime,
		"locked":       locked,
		"chip":         chip,
		"chips_used":   chipsUsed,
	}})
}

func (h *FantasyHandler) GetPlayerPool(c *gin.Context) {
	tournamentID, err := strconv.ParseUint(c.Query("tournament_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tournament_id query param is required"})
		return
	}

	dayID, err := strconv.ParseUint(c.Query("day_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "day_id query param is required"})
		return
	}

	// Make sure the day actually belongs to this tournament.
	if _, err := h.repo.GetDayInTournament(uint(dayID), uint(tournamentID)); err != nil {
		if errors.Is(err, repository.ErrDayNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tournament day"})
		return
	}

	pool, err := h.repo.GetPlayerPool(uint(tournamentID), uint(dayID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch player pool"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": pool})

}

func (h *FantasyHandler) GetStandings(c *gin.Context) {
	tournamentID, err := strconv.ParseUint(c.Query("tournament_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tournament_id query param is required"})
		return
	}

	var dayIDPtr *uint
	if dayIDStr := c.Query("day_id"); dayIDStr != "" {
		dayID, err := strconv.ParseUint(dayIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid day_id"})
			return
		}
		d := uint(dayID)
		dayIDPtr = &d
	}

	// This is the Global leaderboard: everyone, no region filter.
	standings, err := h.repo.GetStandings(uint(tournamentID), dayIDPtr, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch standings"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": standings})
}

func (h *FantasyHandler) GetTeamProfile(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid fantasy team id"})
		return
	}

	team, err := h.repo.GetTeamByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "fantasy team not found"})
		return
	}

	// Public view of the team: never expose the owner's user id.
	resp := gin.H{"team": gin.H{
		"id":            team.ID,
		"tournament_id": team.TournamentID,
		"team_name":     team.TeamName,
		"country":       team.Country,
		"region":        team.Region,
		"created_at":    team.CreatedAt,
	}}

	dayIDStr := c.Query("day_id")
	if dayIDStr == "" {
		c.JSON(http.StatusOK, gin.H{"data": resp})
		return
	}
	parsed, err := strconv.ParseUint(dayIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid day_id"})
		return
	}

	day, err := h.repo.GetDayInTournament(uint(parsed), team.TournamentID)
	if err != nil {
		if errors.Is(err, repository.ErrDayNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tournament day"})
		return
	}
	locked, err := h.repo.IsDayLocked(day)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check lock status"})
		return
	}

	// Picks stay private until the day locks, so nobody can copy another player's team.
	// The owner (identified by the optional auth token) can always see their own picks.
	viewerID := c.GetUint("user_id")
	isOwner := viewerID != 0 && viewerID == team.UserID
	resp["locked"] = locked

	if !locked && !isOwner {
		resp["selections"] = []any{}
		resp["hidden"] = true
		c.JSON(http.StatusOK, gin.H{"data": resp})
		return
	}

	selections, err := h.repo.GetSelection(team.ID, day.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch selection"})
		return
	}
	breakdown, total, err := h.repo.ComputeDayScore(team.ID, day.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to compute score"})
		return
	}
	chip, err := h.repo.GetDayChip(team.ID, day.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch chip"})
		return
	}
	resp["selections"] = selections
	resp["breakdown"] = breakdown
	resp["total_points"] = total
	resp["chip"] = chip

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// leagueResponse describes one league the current user belongs to.
type leagueResponse struct {
	Slug  string `json:"slug"`
	Name  string `json:"name"`
	Type  string `json:"type"` // "region", "global" or "private"
	Teams int64  `json:"teams"`
	Code  string `json:"code,omitempty"` // invite code; private leagues only, and only shown to members
}

// GetMyLeagues lists the leagues the logged-in user is in: their own region league
// (if their country belongs to one) and the Global league. Other regions are never
// listed, so nobody can discover or browse them.
func (h *FantasyHandler) GetMyLeagues(c *gin.Context) {
	userID := c.GetUint("user_id")
	tournamentID, err := strconv.ParseUint(c.Query("tournament_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tournament_id query param is required"})
		return
	}

	team, err := h.repo.GetTeamByUser(userID, uint(tournamentID))
	if err != nil {
		if errors.Is(err, repository.ErrFantasyTeamNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "create a fantasy team first"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch fantasy team"})
		return
	}

	leagues := make([]leagueResponse, 0, 2)

	if team.Region != "" {
		n, err := h.repo.CountTeams(uint(tournamentID), team.Region)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch leagues"})
			return
		}
		leagues = append(leagues, leagueResponse{
			Slug: team.Region, Name: service.RegionName(team.Region), Type: "region", Teams: n,
		})
	}

	n, err := h.repo.CountTeams(uint(tournamentID), "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch leagues"})
		return
	}
	leagues = append(leagues, leagueResponse{
		Slug: service.GlobalLeagueSlug, Name: "Global", Type: "global", Teams: n,
	})

	privates, err := h.repo.GetMyPrivateLeagues(team.ID, uint(tournamentID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch leagues"})
		return
	}
	for _, p := range privates {
		leagues = append(leagues, privateLeagueResponse(p.League, p.Members))
	}

	c.JSON(http.StatusOK, gin.H{"data": leagues})
}

// GetLeagueStandings returns the leaderboard of one league. A user may only open
// their own region league or the Global league; any other region is refused (403).
func (h *FantasyHandler) GetLeagueStandings(c *gin.Context) {
	userID := c.GetUint("user_id")
	slug := c.Param("slug")

	tournamentID, err := strconv.ParseUint(c.Query("tournament_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tournament_id query param is required"})
		return
	}

	var dayIDPtr *uint
	if dayIDStr := c.Query("day_id"); dayIDStr != "" {
		dayID, err := strconv.ParseUint(dayIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid day_id"})
			return
		}
		d := uint(dayID)
		dayIDPtr = &d
	}

	team, err := h.repo.GetTeamByUser(userID, uint(tournamentID))
	if err != nil {
		if errors.Is(err, repository.ErrFantasyTeamNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "create a fantasy team first"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch fantasy team"})
		return
	}

	// Private leagues: only members may open them. Everyone else gets a plain 404,
	// the same answer as for a league that does not exist.
	if leagueID, isPrivate := parsePrivateLeagueSlug(slug); isPrivate {
		league, err := h.repo.GetPrivateLeagueForMember(leagueID, team.ID)
		if err != nil {
			if errors.Is(err, repository.ErrLeagueNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "league not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch league"})
			return
		}
		standings, err := h.repo.GetPrivateLeagueStandings(league, dayIDPtr)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch standings"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": standings})
		return
	}

	region := ""
	switch {
	case slug == service.GlobalLeagueSlug:
		// everyone is in Global; region stays "" so nothing is filtered
	case service.RegionName(slug) == "":
		c.JSON(http.StatusNotFound, gin.H{"error": "league not found"})
		return
	case slug != team.Region:
		// A real region, but not the caller's. Region comes from the stored team,
		// never from the request, so it cannot be spoofed.
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only view your own region league"})
		return
	default:
		region = slug
	}

	standings, err := h.repo.GetStandings(uint(tournamentID), dayIDPtr, region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch standings"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": standings})
}
