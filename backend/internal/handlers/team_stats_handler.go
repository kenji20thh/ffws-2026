package handlers

import (
	"net/http"
	"strconv"

	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TeamStatsHandler struct {
	repo *repository.TeamStatsRepository
}

func NewTeamStatsHandler(repo *repository.TeamStatsRepository) *TeamStatsHandler {
	return &TeamStatsHandler{repo: repo}
}

func (h *TeamStatsHandler) GetProfile(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team id"})
		return
	}
	profile, err := h.repo.GetProfile(uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch team stats"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": profile})
}
