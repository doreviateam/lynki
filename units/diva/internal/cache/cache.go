package cache

import (
	"sync"
	"time"

	"github.com/doreviateam/diva/internal/models"
)

type entry struct {
	flash     models.Flash
	meta      models.Meta
	expiresAt time.Time
}

type Cache struct {
	mu     sync.RWMutex
	items  map[string]*entry
	ttlSec int
}

func New(ttlSec int) *Cache {
	c := &Cache{
		items:  make(map[string]*entry),
		ttlSec: ttlSec,
	}
	go c.purgeLoop()
	return c
}

func (c *Cache) Get(hash string) (models.Flash, models.Meta, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	e, ok := c.items[hash]
	if !ok || e == nil || time.Now().After(e.expiresAt) {
		return models.Flash{}, models.Meta{}, false
	}
	return e.flash, e.meta, true
}

func (c *Cache) Set(hash string, flash models.Flash, meta models.Meta) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items[hash] = &entry{
		flash:     flash,
		meta:      meta,
		expiresAt: time.Now().Add(time.Duration(c.ttlSec) * time.Second),
	}
}

func (c *Cache) purgeLoop() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		c.purgeExpired()
	}
}

func (c *Cache) purgeExpired() {
	c.mu.Lock()
	defer c.mu.Unlock()
	now := time.Now()
	for k, e := range c.items {
		if e != nil && now.After(e.expiresAt) {
			delete(c.items, k)
		}
	}
}
