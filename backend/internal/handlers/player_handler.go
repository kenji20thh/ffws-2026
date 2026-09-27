package handlers

import (
	"net/http"
	"strconv"

	"ffws/internal/models"
	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
)

type PlayerHandler struct {
	repo *repository.PlayerRepository
}

func NewPlayerHandler(repo *repository.PlayerRepository) *PlayerHandler {
	return &PlayerHandler{repo: repo}
}

type createPlayerRequest struct {
	TeamID   uint   `json:"team_id" binding:"required"`
	IGN      string `json:"ign" binding:"required"`
	RealName string `json:"real_name"`
	Role     string `json:"role"`
	PhotoURL string `json:"photo_url"`
	Region   string `json:"region"`
	Country  string `json:"country"`
}

func (h *PlayerHandler) Create(c *gin.Context) {
	var req createPlayerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	player := models.Player{
		TeamID:   req.TeamID,
		IGN:      req.IGN,
		RealName: req.RealName,
		Role:     req.Role,
		PhotoURL: req.PhotoURL,
		Region:   req.Region,
		Country:  req.Country,
	}

	if err := h.repo.Create(&player); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create player"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": player})
}

func (h *PlayerHandler) List(c *gin.Context) {
	teamIDStr := c.Query("team_id")
	if teamIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "team_id query param is required"})
		return
	}

	teamID, err := strconv.ParseUint(teamIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team_id"})
		return
	}

	players, err := h.repo.FindByTeam(uint(teamID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch players"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": players})
}

func (h *PlayerHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid player id"})
		return
	}

	player, err := h.repo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "player not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": player})
}
