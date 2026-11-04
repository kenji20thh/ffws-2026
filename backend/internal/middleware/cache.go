package middleware

import (
	"bytes"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"ffws/internal/cache"

	"github.com/gin-gonic/gin"
)

const (
	maxCachedBody    = 2 << 20 // responses bigger than 2 MB are never stored
	maxCachedEntries = 512     // per route
)

type cachedResponse struct {
	status      int
	contentType string
	body        []byte
	cacheable   bool
}

// captureWriter buffers a handler's response instead of sending it, so the middleware can
// decide afterwards whether to send it, store it, or replace it with an older good copy.
type captureWriter struct {
	gin.ResponseWriter
	status  int
	body    bytes.Buffer
	written bool
}

func (w *captureWriter) WriteHeader(code int) {
	if code > 0 {
		w.status = code
	}
}
func (w *captureWriter) WriteHeaderNow() {}
func (w *captureWriter) Write(b []byte) (int, error) {
	w.written = true
	return w.body.Write(b)
}
func (w *captureWriter) WriteString(s string) (int, error) {
	w.written = true
	return w.body.WriteString(s)
}
func (w *captureWriter) Status() int   { return w.status }
func (w *captureWriter) Size() int     { return w.body.Len() }
func (w *captureWriter) Written() bool { return w.written }

var errUpstream = errors.New("handler returned a server error")

// CacheGET caches successful (200) GET responses of PUBLIC routes in memory.
//
//   - ttl: how long a response is served without touching the database.
//   - staleFor: if the handler starts failing (5xx), the last good response is still served
//     for this much longer, so a database hiccup does not show up as error pages.
//   - queryParams: the ONLY query parameters that make up the cache key. List every
//     parameter the handler reads, otherwise two different requests would share one entry.
//
// If 500 visitors ask for the same page at once, the handler runs once and all 500 get its result.
// Never use this on routes whose answer depends on who is logged in.
func CacheGET(ttl, staleFor time.Duration, queryParams ...string) gin.HandlerFunc {
	store := cache.New[*cachedResponse](maxCachedEntries)

	maxAge := int(ttl / time.Second)
	if maxAge > 10 {
		maxAge = 10 // browsers/CDNs may reuse a response briefly; admin edits are visible within seconds
	}
	cacheControl := "public, max-age=" + strconv.Itoa(maxAge)

	return func(c *gin.Context) {
		if c.Request.Method != http.MethodGet {
			c.Next()
			return
		}

		var key strings.Builder
		key.WriteString(c.Request.URL.Path)
		for _, p := range queryParams {
			key.WriteByte('|')
			key.WriteString(c.Query(p))
		}

		resp, src, _ := store.Do(c.Request.Context(), key.String(), ttl, staleFor, func() (*cachedResponse, bool, error) {
			return runCaptured(c)
		})

		if resp == nil {
			if c.Request.Context().Err() != nil {
				c.Abort() // the client went away while waiting
				return
			}
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "temporarily unavailable, please retry"})
			return
		}

		c.Header("X-Cache", string(src))
		if resp.status == http.StatusOK {
			c.Header("Cache-Control", cacheControl)
		}
		c.Data(resp.status, resp.contentType, resp.body)
		c.Abort()
	}
}

// runCaptured runs the rest of the handler chain with its output buffered.
func runCaptured(c *gin.Context) (*cachedResponse, bool, error) {
	orig := c.Writer
	cw := &captureWriter{ResponseWriter: orig, status: http.StatusOK}
	c.Writer = cw
	defer func() { c.Writer = orig }() // also runs if a handler panics

	c.Next()

	resp := &cachedResponse{
		status:      cw.status,
		contentType: orig.Header().Get("Content-Type"),
		body:        append([]byte(nil), cw.body.Bytes()...),
	}
	if resp.contentType == "" {
		resp.contentType = "application/json; charset=utf-8"
	}
	resp.cacheable = resp.status == http.StatusOK && len(resp.body) <= maxCachedBody

	if resp.status >= 500 {
		return resp, false, errUpstream
	}
	return resp, resp.cacheable, nil
}
