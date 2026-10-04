package handlers

import (
	"net/http"
	"strconv"
	"time"

	"ffws/internal/models"
	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
)

type TournamentDayHandler struct {
	dayRepo     *repository.TournamentDayRepository
	dayTeamRepo *repository.TournamentDayTeamRepository
}

func NewTournamentDayHandler(dayRepo *repository.TournamentDayRepository, dayTeamRepo *repository.TournamentDayTeamRepository) *TournamentDayHandler {
	return &TournamentDayHandler{dayRepo: dayRepo, dayTeamRepo: dayTeamRepo}
}

type createDayRequest struct {
	TournamentID uint   `json:"tournament_id" binding:"required"`
	Name         string `json:"name" binding:"required"`
	DayOrder     int    `json:"day_order"`
	Date         string `json:"date"`     // "2026-11-06"
	Deadline     string `json:"deadline"` // "2026-11-06T13:30:00Z"
}

func (h *TournamentDayHandler) Create(c *gin.Context) {
	var req createDayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	day := models.TournamentDay{
		TournamentID: req.TournamentID,
		Name:         req.Name,
		DayOrder:     req.DayOrder,
	}
	if req.Date != "" {
		t, err := parseDate(req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date, expected YYYY-MM-DD"})
			return
		}
		day.Date = t
	}
	if req.Deadline != "" {
		t, err := time.Parse(time.RFC3339, req.Deadline)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deadline, expected RFC3339 (e.g. 2026-11-06T13:30:00Z)"})
			return
		}
		day.Deadline = t
	}

	if err := h.dayRepo.Create(&day); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create tournament day"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": day})
}

func (h *TournamentDayHandler) List(c *gin.Context) {
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

	days, err := h.dayRepo.FindByTournament(uint(tournamentID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tournament days"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": days})
}

func (h *TournamentDayHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	day, err := h.dayRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tournament day not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": day})
}

type updateDayRequest struct {
	Name     string `json:"name"`
	DayOrder int    `json:"day_order"`
	Date     string `json:"date"`
	Deadline string `json:"deadline"`
}

func (h *TournamentDayHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid day id"})
		return
	}

	day, err := h.dayRepo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tournament day not found"})
		return
	}

	var req updateDayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		day.Name = req.Name
	}
	if req.DayOrder != 0 {
		day.DayOrder = req.DayOrder
	}
	if req.Date != "" {
		t, err := parseDate(req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date, expected YYYY-MM-DD"})
			return
		}
		day.Date = t
	}
	if req.Deadline != "" {
		t, err := time.Parse(time.RFC3339, req.Deadline)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deadline, expected RFC3339 (e.g. 2026-11-06T13:30:00Z)"})
			return
		}
		day.Deadline = t
	}

	if err := h.dayRepo.Update(day); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update tournament day"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": day})
}

type assignTeamsRequest struct {
	TeamIDs []uint `json:"team_ids" binding:"required"`
}

func (h *TournamentDayHandler) AssignTeams(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid day id"})
		return
	}

	var req assignTeamsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.dayTeamRepo.AssignTeams(uint(id), req.TeamIDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to assign teams"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "teams assigned successfully"})
}

func (h *TournamentDayHandler) GetTeams(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid day id"})
		return
	}

	entries, err := h.dayTeamRepo.FindByDay(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch teams for this day"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": entries})
}
