package cache

import (
	"sync"
	"time"
)

// CompletenessSnapshotCache cache court (5 s) pour GET /ui/completeness-snapshot.
// Spec: PLAN_IMPLEMENTATION T2.7 — éviter lectures DB répétées.
type CompletenessSnapshotCache struct {
	mu      sync.RWMutex
	entries map[string]cacheEntry
	ttl     time.Duration
}

type cacheEntry struct {
	data      []byte
	expiresAt time.Time
}

// NewCompletenessSnapshotCache crée un cache avec TTL (ex. 5 s).
func NewCompletenessSnapshotCache(ttl time.Duration) *CompletenessSnapshotCache {
	c := &CompletenessSnapshotCache{
		entries: make(map[string]cacheEntry),
		ttl:     ttl,
	}
	go c.cleanupLoop()
	return c
}

func (c *CompletenessSnapshotCache) key(tenant, companyID, dateDebut, dateFin string) string {
	return tenant + "|" + companyID + "|" + dateDebut + "|" + dateFin
}

// Get retourne la réponse en cache si valide, nil sinon.
func (c *CompletenessSnapshotCache) Get(tenant, companyID, dateDebut, dateFin string) []byte {
	k := c.key(tenant, companyID, dateDebut, dateFin)
	c.mu.RLock()
	defer c.mu.RUnlock()
	e, ok := c.entries[k]
	if !ok || time.Now().After(e.expiresAt) {
		return nil
	}
	return e.data
}

// Set stocke la réponse pour le scope.
func (c *CompletenessSnapshotCache) Set(tenant, companyID, dateDebut, dateFin string, data []byte) {
	k := c.key(tenant, companyID, dateDebut, dateFin)
	now := time.Now()
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries[k] = cacheEntry{
		data:      data,
		expiresAt: now.Add(c.ttl),
	}
}

func (c *CompletenessSnapshotCache) cleanupLoop() {
	ticker := time.NewTicker(c.ttl)
	defer ticker.Stop()
	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for k, e := range c.entries {
			if now.After(e.expiresAt) {
				delete(c.entries, k)
			}
		}
		c.mu.Unlock()
	}
}
