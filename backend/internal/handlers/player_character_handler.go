package handlers

import (
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
)

type PlayerCharacterHandler struct {
	repo *repository.PlayerCharacterRepository
}

func NewPlayerCharacterHandler(repo *repository.PlayerCharacterRepository) *PlayerCharacterHandler {
	return &PlayerCharacterHandler{repo: repo}
}

type setPlayerCharactersRequest struct {
	// Characters in order: the first is the player's main character.
	Characters []string `json:"characters"`
}

// A character is the file name of its picture in public/characters/, so keep it simple.
var characterSlug = regexp.MustCompile(`^[a-z0-9_-]{1,40}$`)

// GetPlayerCharacters returns the characters saved for a player, in order (admin).
func (h *PlayerCharacterHandler) GetPlayerCharacters(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid player id"})
		return
	}

	rows, err := h.repo.List(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch player characters"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// SetPlayerCharacters replaces a player's whole character list (admin).
func (h *PlayerCharacterHandler) SetPlayerCharacters(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid player id"})
		return
	}

	var req setPlayerCharactersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	seen := map[string]bool{}
	characters := make([]string, 0, len(req.Characters))
	for _, raw := range req.Characters {
		name := strings.ToLower(strings.TrimSpace(raw))
		if name == "" {
			continue // empty slot
		}
		if !characterSlug.MatchString(name) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "character names can only use letters, numbers, - and _"})
			return
		}
		if seen[name] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "the same character was sent twice"})
			return
		}
		seen[name] = true
		characters = append(characters, name)
	}
	if len(characters) > repository.MaxPlayerCharacters {
		c.JSON(http.StatusBadRequest, gin.H{"error": "a player can have at most 5 characters"})
		return
	}

	if err := h.repo.Replace(uint(id), characters); err != nil {
		if errors.Is(err, repository.ErrCharacterPlayerNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save player characters"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "player characters saved"})
}
