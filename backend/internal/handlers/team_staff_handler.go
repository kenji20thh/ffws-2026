package handlers

import (
	"net/http"
	"strconv"

	"ffws/internal/models"
	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
)

type TeamStaffHandler struct {
	repo *repository.TeamStaffRepository
}

func NewTeamStaffHandler(repo *repository.TeamStaffRepository) *TeamStaffHandler {
	return &TeamStaffHandler{repo: repo}
}

type createStaffRequest struct {
	Name     string `json:"name" binding:"required"`
	RealName string `json:"real_name"`
	Role     string `json:"role"`
	PhotoURL string `json:"photo_url"`
	Country  string `json:"country"`
}

func (h *TeamStaffHandler) Create(c *gin.Context) {
	idStr := c.Param("id")
	teamID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team id"})
		return
	}

	var req createStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	staff := models.TeamStaff{
		TeamID: uint(teamID), Name: req.Name, Role: req.Role,
		PhotoURL: req.PhotoURL, Country: req.Country,
	}
	if err := h.repo.Create(&staff); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create staff member"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": staff})
}

func (h *TeamStaffHandler) List(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team id"})
		return
	}
	staff, err := h.repo.FindByTeam(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch staff"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": staff})
}

func (h *TeamStaffHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid staff id"})
		return
	}
	if err := h.repo.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete staff member"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "staff member deleted"})
}
