package handlers

import (
	"net/http"
	"regexp"
	"strings"

	"ffws/internal/repository"

	"github.com/gin-gonic/gin"
)

type SubscriberHandler struct {
	repo *repository.SubscriberRepository
}

func NewSubscriberHandler(repo *repository.SubscriberRepository) *SubscriberHandler {
	return &SubscriberHandler{repo: repo}
}

type subscribeRequest struct {
	Email string `json:"email"`
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

func (h *SubscriberHandler) Subscribe(c *gin.Context) {
	var req subscribeRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	if email == "" || !emailRegex.MatchString(email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email address"})
		return
	}

	exists, err := h.repo.EmailExists(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "something went wrong"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "email already subscribed"})
		return
	}

	subscriber, err := h.repo.Create(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to subscribe"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "subscribed successfully",
		"data":    subscriber,
	})
}
