package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
)

type WeaponHandler struct {
	repo *repository.WeaponRepository
}

func NewWeaponHandler(repo *repository.WeaponRepository) *WeaponHandler {
	return &WeaponHandler{repo: repo}
}

type weaponKillRequest struct {
	WeaponID uint `json:"weapon_id"`
	Kills    int  `json:"kills"`
}

type setPlayerWeaponsRequest struct {
	Weapons []weaponKillRequest `json:"weapons"`
}

const maxWeaponKills = 100000

// List returns every weapon (public).
func (h *WeaponHandler) List(c *gin.Context) {
	weapons, err := h.repo.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch weapons"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": weapons})
}

// GetPlayerKills returns the weapon kills saved for a player (admin).
func (h *WeaponHandler) GetPlayerKills(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid player id"})
		return
	}

	rows, err := h.repo.PlayerKills(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch player weapons"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// SetPlayerKills replaces a player's whole weapon list (admin).
func (h *WeaponHandler) SetPlayerKills(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid player id"})
		return
	}

	var req setPlayerWeaponsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	seen := map[uint]bool{}
	entries := make([]repository.WeaponKillInput, 0, len(req.Weapons))
	for _, w := range req.Weapons {
		if w.WeaponID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "weapon_id is required"})
			return
		}
		if w.Kills < 0 || w.Kills > maxWeaponKills {
			c.JSON(http.StatusBadRequest, gin.H{"error": "kills must be a whole number from 0 up"})
			return
		}
		if seen[w.WeaponID] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "the same weapon was sent twice"})
			return
		}
		seen[w.WeaponID] = true
		if w.Kills > 0 { // 0 kills = not used, so nothing is stored
			entries = append(entries, repository.WeaponKillInput{WeaponID: w.WeaponID, Kills: w.Kills})
		}
	}

	if err := h.repo.ReplacePlayerKills(uint(id), entries); err != nil {
		switch {
		case errors.Is(err, repository.ErrWeaponPlayerNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, repository.ErrWeaponUnknown):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save player weapons"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "player weapons saved"})
}
