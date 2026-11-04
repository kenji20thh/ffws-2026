package cache

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestSingleFlightStampede(t *testing.T) {
	c := New[int](10)
	var calls int32
	var wg sync.WaitGroup
	for i := 0; i < 200; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			v, _, err := c.Do(context.Background(), "k", time.Second, 0, func() (int, bool, error) {
				atomic.AddInt32(&calls, 1)
				time.Sleep(50 * time.Millisecond)
				return 42, true, nil
			})
			if err != nil || v != 42 {
				t.Errorf("got %d, %v", v, err)
			}
		}()
	}
	wg.Wait()
	if calls != 1 {
		t.Fatalf("expected 1 computation for 200 concurrent callers, got %d", calls)
	}
}

func TestStaleOnError(t *testing.T) {
	c := New[string](10)
	_, _, _ = c.Do(nil, "k", 10*time.Millisecond, time.Minute, func() (string, bool, error) { return "good", true, nil })
	time.Sleep(20 * time.Millisecond)
	v, src, err := c.Do(nil, "k", 10*time.Millisecond, time.Minute, func() (string, bool, error) {
		return "", false, errors.New("db down")
	})
	if err != nil || v != "good" || src != Stale {
		t.Fatalf("want stale good value, got %q %v %v", v, src, err)
	}
}

func TestErrorsAreNotCached(t *testing.T) {
	c := New[int](10)
	_, _, err := c.Do(nil, "k", time.Minute, 0, func() (int, bool, error) { return 0, false, errors.New("boom") })
	if err == nil || c.Len() != 0 {
		t.Fatalf("error result must not be stored")
	}
}

func TestBoundedSize(t *testing.T) {
	c := New[int](20)
	for i := 0; i < 500; i++ {
		k := string(rune('a'+i%26)) + string(rune('A'+i/26))
		_, _, _ = c.Do(nil, k, time.Minute, time.Minute, func() (int, bool, error) { return i, true, nil })
	}
	if c.Len() > 20 {
		t.Fatalf("cache grew to %d entries, max is 20", c.Len())
	}
}

func TestPurgeDuringFlightDoesNotStoreOldValue(t *testing.T) {
	c := New[int](10)
	started, release := make(chan struct{}), make(chan struct{})
	go func() {
		_, _, _ = c.Do(nil, "k", time.Minute, 0, func() (int, bool, error) {
			close(started)
			<-release
			return 1, true, nil
		})
	}()
	<-started
	PurgeAll()
	close(release)
	time.Sleep(30 * time.Millisecond)
	if c.Len() != 0 {
		t.Fatal("value computed before a purge was stored after it")
	}
}

func TestPanicReleasesWaiters(t *testing.T) {
	c := New[int](10)
	started, release := make(chan struct{}), make(chan struct{})
	go func() {
		defer func() { _ = recover() }()
		_, _, _ = c.Do(nil, "k", time.Minute, 0, func() (int, bool, error) {
			close(started)
			<-release
			panic("handler bug")
		})
	}()
	<-started
	res := make(chan error, 1)
	go func() {
		_, _, err := c.Do(nil, "k", time.Minute, 0, func() (int, bool, error) { return 0, false, nil })
		res <- err
	}()
	time.Sleep(20 * time.Millisecond)
	close(release)
	select {
	case err := <-res:
		if !errors.Is(err, ErrAborted) {
			t.Fatalf("waiter got %v, want ErrAborted", err)
		}
	case <-time.After(time.Second):
		t.Fatal("waiter hung after the leader panicked")
	}
}
