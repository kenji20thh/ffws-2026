package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"ffws/internal/models"
	"ffws/internal/repository"
	"ffws/internal/service"

	"github.com/gin-gonic/gin"
)

const (
	privateLeagueType       = "private"
	privateLeagueSlugPrefix = "private-"
)

func privateLeagueSlug(id uint) string {
	return privateLeagueSlugPrefix + strconv.FormatUint(uint64(id), 10)
}

// parsePrivateLeagueSlug extracts the league id from "private-12".
func parsePrivateLeagueSlug(slug string) (uint, bool) {
	if !strings.HasPrefix(slug, privateLeagueSlugPrefix) {
		return 0, false
	}
	id, err := strconv.ParseUint(strings.TrimPrefix(slug, privateLeagueSlugPrefix), 10, 32)
	if err != nil || id == 0 {
		return 0, false
	}
	return uint(id), true
}

func privateLeagueResponse(l models.PrivateLeague, members int64) leagueResponse {
	return leagueResponse{
		Slug: privateLeagueSlug(l.ID), Name: l.Name, Type: privateLeagueType,
		Teams: members,
		// Only ever returned to members of the league: every member may share it.
		Code: service.FormatLeagueCode(l.Code),
	}
}

type createPrivateLeagueRequest struct {
	TournamentID uint   `json:"tournament_id" binding:"required"`
	Name         string `json:"name" binding:"required"`
}

// CreatePrivateLeague makes a new private league and adds the caller's team to it.
func (h *FantasyHandler) CreatePrivateLeague(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req createPrivateLeagueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tournament_id and name are required"})
		return
	}

	team, ok := h.requireTeam(c, userID, req.TournamentID)
	if !ok {
		return
	}

	league, err := h.repo.CreatePrivateLeague(userID, team, req.Name)
	if err != nil {
		var limitErr *repository.LeagueLimitError
		if errors.As(err, &limitErr) {
			c.JSON(http.StatusBadRequest, gin.H{"error": limitErr.Error()})
			return
		}
		log.Printf("create private league failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create league"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": privateLeagueResponse(*league, 1)})
}

type joinPrivateLeagueRequest struct {
	TournamentID uint   `json:"tournament_id" binding:"required"`
	Code         string `json:"code" binding:"required"`
}

// JoinPrivateLeague adds the caller's team to the league that owns the code.
func (h *FantasyHandler) JoinPrivateLeague(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req joinPrivateLeagueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tournament_id and code are required"})
		return
	}

	team, ok := h.requireTeam(c, userID, req.TournamentID)
	if !ok {
		return
	}

	league, err := h.repo.JoinPrivateLeague(team, req.Code)
	if err != nil {
		var limitErr *repository.LeagueLimitError
		switch {
		case errors.Is(err, repository.ErrLeagueNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "no league found with that code"})
		case errors.Is(err, repository.ErrAlreadyMember):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error(), "slug": privateLeagueSlug(league.ID)})
		case errors.Is(err, repository.ErrLeagueFull):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case errors.As(err, &limitErr):
			c.JSON(http.StatusBadRequest, gin.H{"error": limitErr.Error()})
		default:
			log.Printf("join private league failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to join league"})
		}
		return
	}

	summaries, err := h.repo.GetMyPrivateLeagues(team.ID, team.TournamentID)
	if err != nil {
		log.Printf("load private leagues after join failed: %v", err)
		c.JSON(http.StatusCreated, gin.H{"data": privateLeagueResponse(*league, 0)})
		return
	}
	for _, s := range summaries {
		if s.League.ID == league.ID {
			c.JSON(http.StatusCreated, gin.H{"data": privateLeagueResponse(s.League, s.Members)})
			return
		}
	}
	c.JSON(http.StatusCreated, gin.H{"data": privateLeagueResponse(*league, 0)})
}

// LeavePrivateLeague removes the caller's team from a private league.
func (h *FantasyHandler) LeavePrivateLeague(c *gin.Context) {
	userID := c.GetUint("user_id")
	leagueID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "league not found"})
		return
	}
	tournamentID, err := strconv.ParseUint(c.Query("tournament_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tournament_id query param is required"})
		return
	}
	team, ok := h.requireTeam(c, userID, uint(tournamentID))
	if !ok {
		return
	}

	if err := h.repo.LeavePrivateLeague(uint(leagueID), team.ID); err != nil {
		if errors.Is(err, repository.ErrLeagueNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "league not found"})
			return
		}
		log.Printf("leave private league failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to leave league"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "you left the league"})
}

// requireTeam loads the caller's fantasy team or writes the error response itself.
func (h *FantasyHandler) requireTeam(c *gin.Context, userID, tournamentID uint) (*models.FantasyTeam, bool) {
	team, err := h.repo.GetTeamByUser(userID, tournamentID)
	if err != nil {
		if errors.Is(err, repository.ErrFantasyTeamNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "create a fantasy team first"})
			return nil, false
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch fantasy team"})
		return nil, false
	}
	return team, true
}
