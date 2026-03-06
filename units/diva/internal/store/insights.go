package store

import (
	"context"
	"encoding/json"
	"errors"
	"time"
)

var ErrLockTimeout = errors.New("lock timeout")

// GenerateStore gère la génération d'insights avec lock.
type GenerateStore interface {
	InsightsStore
	WithGenerateLock(ctx context.Context, contextKey string, fn func(GenerateTx) error) error
}

// GenerateTx permet check et insert sur la connexion verrouillée.
type GenerateTx interface {
	CheckInsightFresh(contextKey, payloadHash string) (bool, error)
	InsertInsight(ctx context.Context, params InsertInsightParams) error
}

// InsertInsightParams pour l'insert.
type InsertInsightParams struct {
	Tenant              string
	CompanyID           int
	Mode                string
	CardKey             string
	DateStart           string
	DateEnd             string
	ContextKey          string
	PayloadHash         string
	MessageText         string
	FlashJSON           []byte
	Status              string // "ok" (default) ou "error"
	ErrorCode           string // non vide uniquement si Status == "error"
	Confidence          string
	Model               string
	LatencyMs           int
	GeneratedFromRunner bool
}

// Insight représente un insight DIVA depuis diva_insights.
type Insight struct {
	Status      string // "ok" ou "error"
	MessageText string
	Flash       json.RawMessage
	Confidence  string
	ErrorCode   string
	CreatedAt   time.Time
	ExpiresAt   time.Time
}

// InsightsStore permet de lire les insights depuis diva_insights.
type InsightsStore interface {
	GetInsight(ctx context.Context, contextKey string) (*Insight, error)
}
