package handlers

import (
	"net/http"
	"strconv"
	"time"

	"ffws/internal/models"
	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
)

type RoomHandler struct {
	repo *repository.RoomRepository
}

func NewRoomHandler(repo *repository.RoomRepository) *RoomHandler {
	return &RoomHandler{repo: repo}
}

type createRoomRequest struct {
	TournamentDayID uint   `json:"tournament_day_id" binding:"required"`
	RoomNumber      int    `json:"room_number" binding:"required"`
	MapName         string `json:"map_name"`
	ScheduledAt     string `json:"scheduled_at"` // "2026-11-06T18:00:00Z"
	Status          string `json:"status"`
}

func (h *RoomHandler) Create(c *gin.Context) {
	var req createRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	room := models.Room{
		TournamentDayID: req.TournamentDayID,
		RoomNumber:      req.RoomNumber,
		MapName:         req.MapName,
		Status:          req.Status,
	}
	if room.Status == "" {
		room.Status = "upcoming"
	}
	if req.ScheduledAt != "" {
		if t, err := time.Parse(time.RFC3339, req.ScheduledAt); err == nil {
			room.ScheduledAt = t
		}
	}

	if err := h.repo.Create(&room); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create room"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": room})
}

func (h *RoomHandler) List(c *gin.Context) {
	dayIDStr := c.Query("tournament_day_id")
	if dayIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tournament_day_id query param is required"})
		return
	}
	dayID, err := strconv.ParseUint(dayIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tournament_day_id"})
		return
	}

	rooms, err := h.repo.FindByDay(uint(dayID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch rooms"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rooms})
}

func (h *RoomHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid room id"})
		return
	}

	room, err := h.repo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": room})
}
