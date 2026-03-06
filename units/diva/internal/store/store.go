package store

import (
	"context"
	"time"

	"github.com/doreviateam/diva/internal/models"
)

// Analysis holds a DIVA job from the persistent store.
type Analysis struct {
	ContextHash string
	Status      string // processing | done | failed
	FlashJSON   []byte // JSON du flash (nil si processing/failed sans résultat)
	StartedAt   time.Time
	UpdatedAt   time.Time
	ExpiresAt   time.Time
	ErrorCode   string
	ErrorMessage string
}

// AnalysisStore is the interface for persistent DIVA analysis storage.
type AnalysisStore interface {
	Get(ctx context.Context, contextHash string) (*Analysis, error)
	UpsertProcessing(ctx context.Context, contextHash string, ttl time.Duration) (inserted bool, err error)
	MarkDone(ctx context.Context, contextHash string, flash models.Flash, meta models.Meta, ttl time.Duration) error
	MarkFailed(ctx context.Context, contextHash string, code, message string) error
	MarkStaleFailed(ctx context.Context, contextHash string) error
}
