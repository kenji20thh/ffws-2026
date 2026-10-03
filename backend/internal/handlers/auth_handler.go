package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"ffws/internal/config"
	"ffws/internal/models"
	"ffws/internal/repository"
	"ffws/internal/service"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	repo *repository.UserRepository
	cfg  *config.Config
}

func NewAuthHandler(repo *repository.UserRepository, cfg *config.Config) *AuthHandler {
	return &AuthHandler{repo: repo, cfg: cfg}
}

const (
	minUsernameLen = 3
	maxUsernameLen = 32
)

type registerRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=8,max=72"` // bcrypt rejects > 72 bytes
}

// validUsername trims the name and checks its length.
func validUsername(name string) (string, bool) {
	name = strings.TrimSpace(name)
	return name, len(name) >= minUsernameLen && len(name) <= maxUsernameLen
}

// respondCreateUserError answers 409 when the username is taken, otherwise a logged 500.
func (h *AuthHandler) respondCreateUserError(c *gin.Context, username string, err error) {
	if _, findErr := h.repo.FindByUsername(username); findErr == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "username is already taken"})
		return
	}
	log.Printf("create user failed: %v", err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create account"})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	username, ok := validUsername(req.Username)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username must be 3 to 32 characters"})
		return
	}
	req.Username = username

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user := models.User{
		Username:     req.Username,
		PasswordHash: string(hash),
		Role:         "user",
	}

	if err := h.repo.Create(&user); err != nil {
		h.respondCreateUserError(c, req.Username, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "account created successfully", "id": user.ID})
}

type createAccountRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=8,max=72"`
	Role     string `json:"role"`
}

func (h *AuthHandler) CreateAccount(c *gin.Context) {
	var req createAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	username, ok := validUsername(req.Username)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username must be 3 to 32 characters"})
		return
	}
	req.Username = username

	role := req.Role
	if role == "" {
		role = "user"
	}
	if role != "user" && role != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role must be 'user' or 'admin'"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user := models.User{
		Username:     req.Username,
		PasswordHash: string(hash),
		Role:         role,
	}

	if err := h.repo.Create(&user); err != nil {
		h.respondCreateUserError(c, req.Username, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "account created successfully", "id": user.ID, "role": user.Role})
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.repo.FindByUsername(strings.TrimSpace(req.Username))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	token, err := service.GenerateToken(user.ID, user.Username, user.Role, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "role": user.Role})
}

func (h *AuthHandler) GrantAdmin(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	if _, err := h.repo.FindByID(uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "account not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to look up account"})
		return
	}

	if err := h.repo.UpdateRole(uint(id), "admin"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to grant admin role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "account promoted to admin"})
}

func (h *AuthHandler) ListAccounts(c *gin.Context) {
	users, err := h.repo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch accounts"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": users})
}
