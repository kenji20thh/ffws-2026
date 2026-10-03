package handlers

import (
	"net/http"
	"strconv"

	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
)

type PlayerStatsHandler struct {
	repo *repository.PlayerStatsRepository
}

func NewPlayerStatsHandler(repo *repository.PlayerStatsRepository) *PlayerStatsHandler {
	return &PlayerStatsHandler{repo: repo}
}

func (h *PlayerStatsHandler) GetLeaderboard(c *gin.Context) {
	tournamentIDStr := c.Query("tournament_id")
	if tournamentIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tournament_id query param is required"})
		return
	}
	tournamentID, err := strconv.ParseUint(tournamentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tournament_id"})
		return
	}

	entries, err := h.repo.GetLeaderboard(uint(tournamentID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch player leaderboard"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": entries})
}
