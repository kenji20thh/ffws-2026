package handlers

import (
	"net/http"
	"strconv"

	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
)

type RoomResultHandler struct {
	repo *repository.RoomResultRepository
}

func NewRoomResultHandler(repo *repository.RoomResultRepository) *RoomResultHandler {
	return &RoomResultHandler{repo: repo}
}

type submitPlayerResult struct {
	PlayerID uint `json:"player_id" binding:"required"`
	Kills    int  `json:"kills" binding:"gte=0"`
}

type submitTeamResult struct {
	TeamID    uint                 `json:"team_id" binding:"required"`
	Placement int                  `json:"placement" binding:"required,gte=1,lte=12"`
	Players   []submitPlayerResult `json:"players" binding:"required,min=1,dive"`
}

type submitRoomResultsRequest struct {
	Teams []submitTeamResult `json:"teams" binding:"required,min=1,dive"`
}

// Submit accepts one team or many teams in the same request body.
// A single team can be sent right as it dies, or several at once — both work.
func (h *RoomResultHandler) Submit(c *gin.Context) {
	roomIDStr := c.Param("id")
	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid room id"})
		return
	}

	var req submitRoomResultsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var teams []repository.TeamResultInput
	for _, t := range req.Teams {
		var players []repository.PlayerKillInput
		for _, p := range t.Players {
			players = append(players, repository.PlayerKillInput{
				PlayerID: p.PlayerID,
				Kills:    p.Kills,
			})
		}
		teams = append(teams, repository.TeamResultInput{
			TeamID:    t.TeamID,
			Placement: t.Placement,
			Players:   players,
		})
	}

	if err := h.repo.SubmitRoomResults(uint(roomID), teams); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to submit results"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "results submitted successfully"})
}

func (h *RoomResultHandler) GetSummary(c *gin.Context) {
	roomIDStr := c.Param("id")
	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid room id"})
		return
	}

	summary, err := h.repo.GetRoomSummary(uint(roomID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch room summary"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": summary})
}

func (h *RoomResultHandler) GetStandings(c *gin.Context) {
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

	standings, err := h.repo.GetTournamentStandings(uint(tournamentID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch standings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": standings})
}
