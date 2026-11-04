// Package cache is a small in-memory TTL cache built for traffic spikes.
//
// Three things make it safe under load:
//   - Single flight: when many requests ask for the same missing key at once, only ONE of
//     them runs the expensive work; the rest wait and share its result (no stampede on the DB).
//   - Stale-on-error: if a refresh fails, the last good value is served for a grace period,
//     so a struggling database does not turn into error pages.
//   - Bounded size: the cache never holds more than `max` entries.
package cache

import (
	"context"
	"errors"
	"sync"
	"time"
)

// Source says where a value returned by Do came from.
type Source string

const (
	Hit    Source = "HIT"    // fresh value from the cache
	Miss   Source = "MISS"   // this call computed the value
	Shared Source = "SHARED" // another in-flight call computed it and this call waited
	Stale  Source = "STALE"  // refresh failed, an older good value was served instead
)

// ErrAborted is given to waiters when the call computing their value panicked.
var ErrAborted = errors.New("cache: computation aborted")

type item[V any] struct {
	val   V
	fresh time.Time // fresh until here
	stale time.Time // may still be served after a failed refresh until here
}

type flight[V any] struct {
	done chan struct{}
	val  V
	err  error
}

// Cache is safe for concurrent use.
type Cache[V any] struct {
	mu      sync.Mutex
	items   map[string]*item[V]
	flights map[string]*flight[V]
	max     int
	gen     uint64 // bumped by Purge so a refresh that started before a purge is not stored
}

// New creates a cache holding at most max entries and registers it so PurgeAll clears it.
func New[V any](max int) *Cache[V] {
	if max < 1 {
		max = 1
	}
	c := &Cache[V]{
		items:   make(map[string]*item[V]),
		flights: make(map[string]*flight[V]),
		max:     max,
	}
	register(c)
	return c
}

// Do returns the cached value for key, or runs fn to produce it.
//
// fn returns the value, whether it may be stored (cacheable), and an error. A non-nil
// error means "this refresh failed": the value is never stored, and if an older value is
// still inside its stale window that older value is returned instead (Source = Stale).
// When there is nothing stale to fall back on, the value and error from fn are returned as-is.
func (c *Cache[V]) Do(ctx context.Context, key string, ttl, staleFor time.Duration, fn func() (V, bool, error)) (V, Source, error) {
	if ctx == nil {
		ctx = context.Background()
	}
	now := time.Now()

	c.mu.Lock()
	if it, ok := c.items[key]; ok && now.Before(it.fresh) {
		v := it.val
		c.mu.Unlock()
		return v, Hit, nil
	}
	if fl, ok := c.flights[key]; ok {
		c.mu.Unlock()
		select {
		case <-fl.done:
		case <-ctx.Done():
			var zero V
			return zero, Shared, ctx.Err()
		}
		if fl.err != nil {
			if v, ok := c.staleValue(key); ok {
				return v, Stale, nil
			}
		}
		return fl.val, Shared, fl.err
	}
	fl := &flight[V]{done: make(chan struct{})}
	c.flights[key] = fl
	gen := c.gen
	c.mu.Unlock()

	finished := false
	defer func() {
		if !finished { // fn panicked: release the waiters, let the panic continue upward
			fl.err = ErrAborted
			c.mu.Lock()
			delete(c.flights, key)
			c.mu.Unlock()
			close(fl.done)
		}
	}()

	val, cacheable, err := fn()
	finished = true

	c.mu.Lock()
	fl.val, fl.err = val, err
	if err == nil && cacheable {
		c.storeLocked(key, val, ttl, staleFor, gen)
	}
	var staleVal V
	haveStale := false
	if err != nil {
		if it, ok := c.items[key]; ok && time.Now().Before(it.stale) {
			staleVal, haveStale = it.val, true
		}
	}
	delete(c.flights, key)
	c.mu.Unlock()
	close(fl.done)

	if haveStale {
		return staleVal, Stale, nil
	}
	return val, Miss, err
}

func (c *Cache[V]) staleValue(key string) (V, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if it, ok := c.items[key]; ok && time.Now().Before(it.stale) {
		return it.val, true
	}
	var zero V
	return zero, false
}

func (c *Cache[V]) storeLocked(key string, val V, ttl, staleFor time.Duration, gen uint64) {
	if gen != c.gen {
		return // a purge happened while computing; this value may already be outdated
	}
	if _, exists := c.items[key]; !exists && len(c.items) >= c.max {
		c.evictLocked()
	}
	now := time.Now()
	c.items[key] = &item[V]{val: val, fresh: now.Add(ttl), stale: now.Add(ttl + staleFor)}
}

// evictLocked frees room: first anything past its stale window, then ~10% arbitrary entries.
func (c *Cache[V]) evictLocked() {
	now := time.Now()
	for k, it := range c.items {
		if now.After(it.stale) {
			delete(c.items, k)
		}
	}
	if len(c.items) < c.max {
		return
	}
	drop := c.max/10 + 1
	for k := range c.items {
		delete(c.items, k)
		drop--
		if drop <= 0 {
			break
		}
	}
}

// Purge drops every stored value (including stale ones). Use it when the underlying data changed.
func (c *Cache[V]) Purge() {
	c.mu.Lock()
	c.gen++
	c.items = make(map[string]*item[V])
	c.mu.Unlock()
}

// Len reports how many values are stored (for tests and metrics).
func (c *Cache[V]) Len() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return len(c.items)
}

type purger interface{ Purge() }

var (
	regMu    sync.Mutex
	registry []purger
)

func register(p purger) {
	regMu.Lock()
	registry = append(registry, p)
	regMu.Unlock()
}

// PurgeAll clears every cache created with New. Call it after admin edits.
func PurgeAll() {
	regMu.Lock()
	all := make([]purger, len(registry))
	copy(all, registry)
	regMu.Unlock()
	for _, p := range all {
		p.Purge()
	}
}
