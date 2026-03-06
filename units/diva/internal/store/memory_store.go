package store

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/doreviateam/diva/internal/models"
)

// MemoryStore implements AnalysisStore in memory (fallback when DIVA_DATABASE_URL is empty).
type MemoryStore struct {
	mu     sync.RWMutex
	items  map[string]*Analysis
	ttl    time.Duration
	purge  time.Duration
	stopCh chan struct{}
}

func NewMemoryStore(ttlSec, purgeIntervalSec int) *MemoryStore {
	if ttlSec <= 0 {
		ttlSec = 300
	}
	if purgeIntervalSec <= 0 {
		purgeIntervalSec = 60
	}
	s := &MemoryStore{
		items:  make(map[string]*Analysis),
		ttl:    time.Duration(ttlSec) * time.Second,
		purge:  time.Duration(purgeIntervalSec) * time.Second,
		stopCh: make(chan struct{}),
	}
	go s.purgeLoop()
	return s
}

func (s *MemoryStore) purgeLoop() {
	ticker := time.NewTicker(s.purge)
	defer ticker.Stop()
	for {
		select {
		case <-s.stopCh:
			return
		case <-ticker.C:
			s.purgeExpired()
		}
	}
}

func (s *MemoryStore) purgeExpired() {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	for k, a := range s.items {
		if a != nil && now.After(a.ExpiresAt) {
			delete(s.items, k)
		}
	}
}

func (s *MemoryStore) Get(ctx context.Context, contextHash string) (*Analysis, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	a, ok := s.items[contextHash]
	if !ok || a == nil || time.Now().After(a.ExpiresAt) {
		return nil, ErrNotFound
	}
	return a, nil
}

func (s *MemoryStore) UpsertProcessing(ctx context.Context, contextHash string, ttl time.Duration) (inserted bool, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	expiresAt := now.Add(ttl)
	a, exists := s.items[contextHash]
	if exists && a != nil {
		if a.Status == StatusProcessing && now.Before(a.StartedAt.Add(180*time.Second)) {
			return false, nil
		}
	}
	s.items[contextHash] = &Analysis{
		ContextHash: contextHash,
		Status:      StatusProcessing,
		StartedAt:   now,
		UpdatedAt:   now,
		ExpiresAt:   expiresAt,
	}
	return true, nil
}

func (s *MemoryStore) MarkDone(ctx context.Context, contextHash string, flash models.Flash, meta models.Meta, ttl time.Duration) error {
	data, err := json.Marshal(struct {
		Flash models.Flash `json:"flash"`
		Meta  models.Meta  `json:"meta"`
	}{Flash: flash, Meta: meta})
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	if a, ok := s.items[contextHash]; ok && a != nil && a.Status == StatusProcessing {
		a.Status = StatusDone
		a.FlashJSON = data
		a.UpdatedAt = now
		a.ExpiresAt = now.Add(ttl)
	}
	return nil
}

func (s *MemoryStore) MarkFailed(ctx context.Context, contextHash string, code, message string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if a, ok := s.items[contextHash]; ok && a != nil && a.Status == StatusProcessing {
		a.Status = StatusFailed
		a.ErrorCode = code
		a.ErrorMessage = message
		a.UpdatedAt = time.Now()
	}
	return nil
}

func (s *MemoryStore) MarkStaleFailed(ctx context.Context, contextHash string) error {
	return s.MarkFailed(ctx, contextHash, "timeout", "Job dépassé (stale)")
}
