package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

const (
	cleanupInterval = 5 * time.Minute
	visitorTTL      = 15 * time.Minute // must be longer than the time a limiter needs to refill
)

var (
	visitors    = make(map[string]*visitor)
	mu          sync.Mutex
	cleanupOnce sync.Once
)

// startCleanup drops limiters that have been idle, so the map can't grow forever.
func startCleanup() {
	go func() {
		ticker := time.NewTicker(cleanupInterval)
		defer ticker.Stop()
		for range ticker.C {
			mu.Lock()
			for key, v := range visitors {
				if time.Since(v.lastSeen) > visitorTTL {
					delete(visitors, key)
				}
			}
			mu.Unlock()
		}
	}()
}

func getLimiter(key string, r rate.Limit, burst int) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	v, exists := visitors[key]
	if !exists {
		v = &visitor{limiter: rate.NewLimiter(r, burst)}
		visitors[key] = v
	}
	v.lastSeen = time.Now()
	return v.limiter
}

// RateLimit allows `burst` requests immediately, then refills at `r` per second.
// Limits are tracked per route AND per client IP, so hitting /login never uses up
// the allowance for /register or /subscribe.
// Use rate.Every(d) for "one request per d", e.g. RateLimit(rate.Every(15*time.Second), 5).
func RateLimit(r rate.Limit, burst int) gin.HandlerFunc {
	cleanupOnce.Do(startCleanup)

	return func(c *gin.Context) {
		key := c.FullPath() + "|" + c.ClientIP()

		if !getLimiter(key, r, burst).Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "too many requests, please slow down"})
			c.Abort()
			return
		}

		c.Next()
	}
}
