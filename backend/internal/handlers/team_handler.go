package handlers

import (
	"net/http"
	"strconv"

	"ffws/internal/models"
	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
)

type TeamHandler struct {
	repo *repository.TeamRepository
}

func NewTeamHandler(repo *repository.TeamRepository) *TeamHandler {
	return &TeamHandler{repo: repo}
}

type createTeamRequest struct {
	TournamentID uint   `json:"tournament_id" binding:"required"`
	Name         string `json:"name" binding:"required"`
	Tag          string `json:"tag"`
	LogoURL      string `json:"logo_url"`
	Region       string `json:"region"`
	Country      string `json:"country"`
	SlotNumber   int    `json:"slot_number"`
}

func (h *TeamHandler) Create(c *gin.Context) {
	var req createTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team := models.Team{
		TournamentID: req.TournamentID,
		Name:         req.Name,
		Tag:          req.Tag,
		LogoURL:      req.LogoURL,
		Region:       req.Region,
		Country:      req.Country,
		SlotNumber:   req.SlotNumber,
	}

	if err := h.repo.Create(&team); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create team"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": team})
}

func (h *TeamHandler) List(c *gin.Context) {
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

	teams, err := h.repo.FindByTournament(uint(tournamentID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch teams"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": teams})
}

func (h *TeamHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team id"})
		return
	}

	team, err := h.repo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": team})
}
