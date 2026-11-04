package middleware

import (
	"net/http"
	"strconv"
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

	// Hard cap on tracked clients. Without it, an attacker rotating through many source
	// addresses could grow the map until the process runs out of memory. Past the cap, new
	// clients share one limiter per route instead of getting their own.
	maxVisitors = 100_000
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

func getLimiter(route, ip string, r rate.Limit, burst int) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	key := route + "|" + ip
	v, exists := visitors[key]
	if !exists {
		if len(visitors) >= maxVisitors {
			key = route + "|overflow"
			v = visitors[key]
		}
		if v == nil {
			v = &visitor{limiter: rate.NewLimiter(r, burst)}
			visitors[key] = v
		}
	}
	v.lastSeen = time.Now()
	return v.limiter
}

func tooMany(c *gin.Context, r rate.Limit) {
	retry := 1
	if r > 0 {
		if s := int(1/float64(r)) + 1; s > retry {
			retry = s
		}
	}
	c.Header("Retry-After", strconv.Itoa(retry))
	c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "too many requests, please slow down"})
}

// RateLimit allows `burst` requests immediately, then refills at `r` per second.
// Limits are tracked per route AND per client IP, so hitting /login never uses up
// the allowance for /register or /subscribe.
// Use rate.Every(d) for "one request per d", e.g. RateLimit(rate.Every(15*time.Second), 5).
func RateLimit(r rate.Limit, burst int) gin.HandlerFunc {
	cleanupOnce.Do(startCleanup)

	return func(c *gin.Context) {
		if !getLimiter(c.FullPath(), c.ClientIP(), r, burst).Allow() {
			tooMany(c, r)
			return
		}
		c.Next()
	}
}

// GlobalRateLimit is a per-IP limit across the WHOLE API (one shared allowance for all
// routes), a safety net on top of the stricter per-route limits. IPs in exempt are never
// limited: put your frontend server there if it renders pages for many visitors from one IP.
func GlobalRateLimit(rps float64, burst int, exempt []string) gin.HandlerFunc {
	cleanupOnce.Do(startCleanup)

	skip := make(map[string]bool, len(exempt))
	for _, ip := range exempt {
		skip[ip] = true
	}
	limit := rate.Limit(rps)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		if skip[ip] || c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}
		if !getLimiter("global", ip, limit, burst).Allow() {
			tooMany(c, limit)
			return
		}
		c.Next()
	}
}
