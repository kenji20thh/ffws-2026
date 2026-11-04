package middleware

import (
	"net/http"

	"ffws/internal/cache"

	"github.com/gin-gonic/gin"
)

// MaxInFlight caps how many requests are being handled at the same time. When the server is
// saturated, extra requests get an immediate 503 instead of queueing up and eating memory,
// so requests already in progress finish quickly and the process stays healthy.
func MaxInFlight(n int) gin.HandlerFunc {
	slots := make(chan struct{}, n)
	return func(c *gin.Context) {
		select {
		case slots <- struct{}{}:
			defer func() { <-slots }()
			c.Next()
		default:
			c.Header("Retry-After", "2")
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "server is busy, please retry shortly"})
		}
	}
}

// BodyLimit rejects request bodies bigger than maxBytes, so nobody can stream gigabytes at a JSON endpoint.
func BodyLimit(maxBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Body != nil {
			c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		}
		c.Next()
	}
}

// SecurityHeaders adds cheap, standard hardening headers to every API response.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Referrer-Policy", "no-referrer")
		c.Next()
	}
}

// PurgeCacheAfterWrite clears every response/query cache after a successful write
// (POST/PUT/DELETE), so admin edits show up immediately instead of after the cache TTL.
// Put it on admin-only routes.
func PurgeCacheAfterWrite() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		switch c.Request.Method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			return
		}
		if c.Writer.Status() < 400 {
			cache.PurgeAll()
		}
	}
}
