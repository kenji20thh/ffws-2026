package handlers

import (
	"errors"
	"log"
	"net/http"
	"net/mail"
	"regexp"
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
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required,min=8,max=72"` // bcrypt rejects > 72 bytes
}

// validUsername trims the name and checks its length. "@" is banned so a login
// identifier containing "@" always means "email".
func validUsername(name string) (string, bool) {
	name = strings.TrimSpace(name)
	return name, len(name) >= minUsernameLen && len(name) <= maxUsernameLen && !strings.Contains(name, "@")
}

// normalizeEmail lowercases/trims and validates the address.
func normalizeEmail(raw string) (string, bool) {
	email := strings.ToLower(strings.TrimSpace(raw))
	if email == "" || len(email) > 254 {
		return "", false
	}
	addr, err := mail.ParseAddress(email)
	if err != nil || addr.Address != email {
		return "", false
	}
	return email, true
}

// respondCreateUserError answers 409 when the username or email is taken, otherwise a logged 500.
func (h *AuthHandler) respondCreateUserError(c *gin.Context, username, email string, err error) {
	if taken, _ := h.repo.UsernameTaken(username); taken {
		c.JSON(http.StatusConflict, gin.H{"error": "username is already taken"})
		return
	}
	if email != "" {
		if _, findErr := h.repo.FindByEmail(email); findErr == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "email is already registered"})
			return
		}
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "username must be 3 to 32 characters and cannot contain @"})
		return
	}
	email, ok := normalizeEmail(req.Email)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email address"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user := models.User{
		Username:     username,
		Email:        &email,
		PasswordHash: string(hash),
		Role:         "user",
	}

	if taken, err := h.repo.UsernameTaken(username); err == nil && taken {
		c.JSON(http.StatusConflict, gin.H{"error": "username is already taken"})
		return
	}
	if err := h.repo.Create(&user); err != nil {
		h.respondCreateUserError(c, username, email, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "account created successfully", "id": user.ID})
}

type createAccountRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email"` // optional for admin-created accounts
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "username must be 3 to 32 characters and cannot contain @"})
		return
	}
	req.Username = username

	var emailPtr *string
	email := ""
	if strings.TrimSpace(req.Email) != "" {
		e, ok := normalizeEmail(req.Email)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email address"})
			return
		}
		email = e
		emailPtr = &e
	}

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
		Email:        emailPtr,
		PasswordHash: string(hash),
		Role:         role,
	}

	if err := h.repo.Create(&user); err != nil {
		h.respondCreateUserError(c, req.Username, email, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "account created successfully", "id": user.ID, "role": user.Role})
}

type loginRequest struct {
	// Identifier is a username OR an email. "username" is still accepted for older clients.
	Identifier string `json:"identifier"`
	Username   string `json:"username"`
	Password   string `json:"password" binding:"required"`
}

func (h *AuthHandler) issueLogin(c *gin.Context, user *models.User) {
	token, err := service.GenerateToken(user.ID, user.Username, user.Role, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": token, "role": user.Role, "username": user.Username})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id := strings.TrimSpace(req.Identifier)
	if id == "" {
		id = strings.TrimSpace(req.Username)
	}
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username or email is required"})
		return
	}

	var (
		user *models.User
		err  error
	)
	if strings.Contains(id, "@") {
		user, err = h.repo.FindByEmail(strings.ToLower(id))
	} else {
		user, err = h.repo.FindByUsername(id)
	}
	// Google-only accounts have an empty hash, so they can never pass a password login.
	if err != nil || user.PasswordHash == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	h.issueLogin(c, user)
}

// ---------- Google sign-in ----------

type googleRequest struct {
	Credential string `json:"credential" binding:"required"` // Google ID token from the browser
}

// Google verifies the ID token, then either logs the user in (known Google account, or an
// existing account with the same email) or starts signup for a new user by returning a
// suggested username plus a short-lived signup token.
func (h *AuthHandler) Google(c *gin.Context) {
	var req googleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing google credential"})
		return
	}
	if h.cfg.GoogleClientID == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "google sign-in is not configured"})
		return
	}

	ident, err := service.VerifyGoogleIDToken(c.Request.Context(), req.Credential, h.cfg.GoogleClientID)
	if err != nil {
		log.Printf("google verify failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "google sign-in failed"})
		return
	}

	// 1. Already linked to a Google account.
	if user, err := h.repo.FindByGoogleSub(ident.Sub); err == nil {
		h.issueLogin(c, user)
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to look up account"})
		return
	}

	// 2. An existing account already uses this email: link it and log in.
	if user, err := h.repo.FindByEmail(ident.Email); err == nil {
		if user.GoogleSub != nil && *user.GoogleSub != ident.Sub {
			c.JSON(http.StatusConflict, gin.H{"error": "this email is linked to a different Google account"})
			return
		}
		if err := h.repo.LinkGoogle(user, ident.Sub); err != nil {
			log.Printf("link google failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to link google account"})
			return
		}
		h.issueLogin(c, user)
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to look up account"})
		return
	}

	// 3. Brand-new user: suggest a username and let them confirm it.
	suggestion, err := h.repo.SuggestUsername(service.UsernameBase(ident.Email, minUsernameLen, maxUsernameLen), maxUsernameLen)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to suggest a username"})
		return
	}
	signupToken, err := service.GenerateGoogleSignupToken(ident.Email, ident.Sub, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to start signup"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"needs_username":     true,
		"signup_token":       signupToken,
		"email":              ident.Email,
		"suggested_username": suggestion,
	})
}

type googleCompleteRequest struct {
	SignupToken string `json:"signup_token" binding:"required"`
	Username    string `json:"username" binding:"required"`
}

var usernameChars = regexp.MustCompile(`^[A-Za-z0-9_.-]+$`)

// GoogleComplete creates the account once the user confirmed (or edited) the suggested username.
func (h *AuthHandler) GoogleComplete(c *gin.Context) {
	var req googleCompleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	claims, err := service.ParseGoogleSignupToken(req.SignupToken, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "signup expired, please sign in with Google again"})
		return
	}

	username, ok := validUsername(req.Username)
	if !ok || !usernameChars.MatchString(username) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username must be 3 to 32 characters: letters, numbers, . _ -"})
		return
	}

	conflict := func() {
		suggestion, _ := h.repo.SuggestUsername(username, maxUsernameLen)
		c.JSON(http.StatusConflict, gin.H{"error": "username is already taken", "suggested_username": suggestion})
	}
	if taken, err := h.repo.UsernameTaken(username); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create account"})
		return
	} else if taken {
		conflict()
		return
	}

	email, sub := claims.Email, claims.Sub
	user := models.User{
		Username:      username,
		Email:         &email,
		EmailVerified: true,
		GoogleSub:     &sub,
		Role:          "user",
	}
	if err := h.repo.Create(&user); err != nil {
		// Lost a race on the username (or the account was already created).
		if taken, _ := h.repo.UsernameTaken(username); taken {
			conflict()
			return
		}
		if existing, findErr := h.repo.FindByGoogleSub(sub); findErr == nil {
			h.issueLogin(c, existing)
			return
		}
		log.Printf("google signup failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create account"})
		return
	}

	h.issueLogin(c, &user)
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
