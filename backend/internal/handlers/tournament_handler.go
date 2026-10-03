package handlers

import (
	"net/http"
	"time"

	"ffws/internal/models"
	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
)

type TournamentHandler struct {
	repo *repository.TournamentRepository
}

func NewTournamentHandler(repo *repository.TournamentRepository) *TournamentHandler {
	return &TournamentHandler{repo: repo}
}

type createTournamentRequest struct {
	Name      string `json:"name" binding:"required"`
	Slug      string `json:"slug" binding:"required"`
	Season    string `json:"season"`
	StartDate string `json:"start_date"` // format: "2026-01-15"
	EndDate   string `json:"end_date"`
	Status    string `json:"status"`
}

func (h *TournamentHandler) Create(c *gin.Context) {
	var req createTournamentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tournament := models.Tournament{
		Name:   req.Name,
		Slug:   req.Slug,
		Season: req.Season,
		Status: req.Status,
	}
	if tournament.Status == "" {
		tournament.Status = "upcoming"
	}

	if req.StartDate != "" {
		if t, err := parseDate(req.StartDate); err == nil {
			tournament.StartDate = t
		}
	}
	if req.EndDate != "" {
		if t, err := parseDate(req.EndDate); err == nil {
			tournament.EndDate = t
		}
	}

	if err := h.repo.Create(&tournament); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create tournament, slug may already exist"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": tournament})
}

func (h *TournamentHandler) List(c *gin.Context) {
	tournaments, err := h.repo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tournaments"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": tournaments})
}

func (h *TournamentHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	tournament, err := h.repo.FindBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tournament not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": tournament})
}

func parseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}
