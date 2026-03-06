package guard

import (
	"sync"
	"testing"
	"time"
)

func TestRefreshGuard_TryAcquire_Release(t *testing.T) {
	g := New(10 * time.Second)
	hash := "abc123"

	// Acquire h → true
	if !g.TryAcquire(hash) {
		t.Error("TryAcquire expected true")
	}

	// Acquire h (sans release) → false
	if g.TryAcquire(hash) {
		t.Error("TryAcquire expected false (déjà en cours)")
	}

	// Release h
	g.Release(hash)

	// Acquire h après release → true
	if !g.TryAcquire(hash) {
		t.Error("TryAcquire expected true après release")
	}
	g.Release(hash)
}

func TestRefreshGuard_DifferentHashes(t *testing.T) {
	g := New(10 * time.Second)

	if !g.TryAcquire("hash1") {
		t.Error("hash1: TryAcquire expected true")
	}
	if !g.TryAcquire("hash2") {
		t.Error("hash2: TryAcquire expected true (hash différent)")
	}
	g.Release("hash1")
	g.Release("hash2")
}

func TestRefreshGuard_ConcurrentAcquire(t *testing.T) {
	g := New(10 * time.Second)
	hash := "concurrent"

	var wg sync.WaitGroup
	acquired := make(chan bool, 10)
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			acquired <- g.TryAcquire(hash)
		}()
	}
	wg.Wait()
	close(acquired)

	count := 0
	for ok := range acquired {
		if ok {
			count++
		}
	}
	if count != 1 {
		t.Errorf("expected 1 acquire (sans release), got %d", count)
	}
	g.Release(hash) // cleanup
}
