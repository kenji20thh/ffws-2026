package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"ffws/internal/repository"

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
	Country      string `json:"country"`
}

func (h *FantasyHandler) CreateTeam(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req createFantasyTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team, err := h.repo.CreateTeam(userID, req.TournamentID, req.TeamName, req.Country)
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
	pool, err := h.repo.GetPlayerPool(uint(tournamentID))
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

	standings, err := h.repo.GetStandings(uint(tournamentID), dayIDPtr)
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
