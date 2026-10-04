package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
)

type PredictionHandler struct {
	repo *repository.PredictionRepository
}

func NewPredictionHandler(repo *repository.PredictionRepository) *PredictionHandler {
	return &PredictionHandler{repo: repo}
}

type placementPick struct {
	TeamID    uint `json:"team_id" binding:"required"`
	Placement int  `json:"placement" binding:"required,gte=1,lte=12"`
}

type submitPredictionRequest struct {
	Picks []placementPick `json:"picks" binding:"required,len=12,dive"`
}

func (h *PredictionHandler) Submit(c *gin.Context) {
	userID := c.GetUint("user_id")
	dayID, err := strconv.ParseUint(c.Param("dayId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid day id"})
		return
	}

	var req submitPredictionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	picks := make([]repository.PlacementInput, 0, 12)
	for _, p := range req.Picks {
		picks = append(picks, repository.PlacementInput{TeamID: p.TeamID, Placement: p.Placement})
	}

	prediction, err := h.repo.SubmitPrediction(userID, uint(dayID), picks)
	if err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, repository.ErrPredictionLocked) {
			status = http.StatusConflict
		} else if errors.Is(err, repository.ErrNoCompetitorTeam) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": prediction})
}

func (h *PredictionHandler) GetMine(c *gin.Context) {
	userID := c.GetUint("user_id")
	dayID, err := strconv.ParseUint(c.Param("dayId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid day id"})
		return
	}

	prediction, rows, err := h.repo.GetByUserAndDay(userID, uint(dayID))
	if err != nil {
		if errors.Is(err, repository.ErrPredictionNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch prediction"})
		return
	}
	lockTime, _ := h.repo.GetDayLockTime(uint(dayID))
	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"prediction": prediction, "teams": rows, "lock_time": lockTime,
	}})
}

func (h *PredictionHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid prediction id"})
		return
	}

	prediction, rows, err := h.repo.GetByID(uint(id))
	if err != nil {
		if errors.Is(err, repository.ErrPredictionNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch prediction"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"prediction": prediction, "teams": rows}})
}

func (h *PredictionHandler) ScoreDay(c *gin.Context) {
	dayID, err := strconv.ParseUint(c.Param("dayId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid day id"})
		return
	}
	count, err := h.repo.ScoreDay(uint(dayID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "day scored", "predictions_scored": count})
}

func (h *PredictionHandler) GetStandings(c *gin.Context) {
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
