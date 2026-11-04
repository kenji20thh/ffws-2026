package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthCheck is a cheap liveness probe: it only proves the process is up and answering.
// It never touches the database, so it stays fast even when the database is struggling.
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "ffws-backend",
	})
}

// ReadyCheck is a readiness probe: it also checks the database answers within 2 seconds.
// Use /health for "restart me if dead" checks and /ready for monitoring / load balancers.
func ReadyCheck(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		if err := db.PingContext(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "database unavailable"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ready"})
	}
}
