package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"sort"
	"time"

	"github.com/doreviateam/diva/internal/cache"
	"github.com/doreviateam/diva/internal/guard"
	"github.com/doreviateam/diva/internal/mistral"
	"github.com/doreviateam/diva/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const modelName = "mistral-7b-instruct-v0.2.Q4_K_M"

func Explain(cacheStore *cache.Cache, refreshGuard *guard.RefreshGuard, mc *mistral.Client) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		requestID := uuid.New().String()

		var req models.ExplainRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "Request invalide."},
			})
		}

		// Validation minimale
		if req.Context.Tenant == "" {
			req.Context.Tenant = "core"
		}
		if req.Context.DateStart == "" {
			req.Context.DateStart = "2000-01-01"
		}
		if req.Context.DateEnd == "" {
			req.Context.DateEnd = "2030-12-31"
		}
		if req.Context.Currency == "" {
			req.Context.Currency = "EUR"
		}
		if req.Dashboard.Cards == nil {
			req.Dashboard.Cards = []models.Card{}
		}
		if req.Options.Mode == "" {
			req.Options.Mode = "flash"
		}

		// Données insuffisantes : 200 avec confidence=low (SPEC v1.1)
		if len(req.Dashboard.Cards) == 0 {
			resp := models.ExplainResponse{
				Meta: models.Meta{
					RequestID:   requestID,
					ContextHash: "sha256:empty",
					GeneratedAt: time.Now().UTC().Format(time.RFC3339),
					Cached:      false,
					Model:       modelName,
					LatencyMs:   time.Since(start).Milliseconds(),
				},
				Flash: models.Flash{
					Headline:   "Données insuffisantes pour une synthèse. Complétez les indicateurs puis rafraîchissez.",
					WhatISee:   []string{},
					ToCheck:    []string{},
					Confidence: "low",
				},
			}
			return c.JSON(resp)
		}

		contextHash := computeContextHash(req.Context, req.Dashboard.Cards, req.Options.FocusCard)

		// Cache lookup (sauf force_refresh)
		if !req.Options.ForceRefresh {
			if flash, meta, ok := cacheStore.Get(contextHash); ok {
				meta.RequestID = requestID
				meta.GeneratedAt = time.Now().UTC().Format(time.RFC3339)
				meta.LatencyMs = time.Since(start).Milliseconds()
				return c.JSON(models.ExplainResponse{Meta: meta, Flash: flash})
			}
		}

		// Guard : 1 appel Mistral max par context_hash (évite les annulations en cascade)
		if !refreshGuard.TryAcquire(contextHash) {
			resp := models.ExplainResponse{
				Meta: models.Meta{
					RequestID:         requestID,
					ContextHash:       "sha256:" + contextHash,
					GeneratedAt:       time.Now().UTC().Format(time.RFC3339),
					Cached:            false,
					Model:             modelName,
					LatencyMs:         time.Since(start).Milliseconds(),
					RefreshInProgress: true,
				},
				Flash: models.Flash{
					Headline:   "Analyse en cours de génération.",
					WhatISee:   []string{},
					ToCheck:    []string{},
					Confidence: "low",
				},
			}
			return c.JSON(resp)
		}
		defer refreshGuard.Release(contextHash)

		// Appel Mistral
		flash, err := mc.Chat(req.Context, req.Dashboard.Cards, req.Options.FocusCard, req.Options.FocusCardDetails, req.Dashboard.Details)
		latencyMs := time.Since(start).Milliseconds()

		meta := models.Meta{
			RequestID:   requestID,
			ContextHash: "sha256:" + contextHash,
			GeneratedAt: time.Now().UTC().Format(time.RFC3339),
			Cached:      false,
			Model:       modelName,
			LatencyMs:   latencyMs,
		}

		if err != nil {
			if errors.Is(err, mistral.ErrMistralTimeout) {
				return c.Status(408).JSON(fiber.Map{
					"error": fiber.Map{
						"code":    "MISTRAL_TIMEOUT",
						"message": "Lecture DIVA momentanément indisponible. Les cartes restent consultables.",
					},
				})
			}
			return c.Status(503).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "SERVICE_UNAVAILABLE",
					"message": "Lecture DIVA momentanément indisponible. Les cartes restent consultables.",
				},
			})
		}

		// Cache store
		cacheStore.Set(contextHash, flash, meta)

		return c.JSON(models.ExplainResponse{Meta: meta, Flash: flash})
	}
}

// computeContextHash — JSON canonicalisé, cards triées par key, focus_card inclus si présent
func computeContextHash(ctx models.Context, cards []models.Card, focusCard string) string {
	// Tri par key
	sorted := make([]struct {
		Key   string   `json:"key"`
		Value *float64 `json:"value"`
		Unit  string   `json:"unit"`
	}, len(cards))
	for i, c := range cards {
		sorted[i] = struct {
			Key   string   `json:"key"`
			Value *float64 `json:"value"`
			Unit  string   `json:"unit"`
		}{Key: c.Key, Value: c.Value, Unit: c.Unit}
	}
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].Key < sorted[j].Key })

	payload := struct {
		Tenant    string `json:"tenant"`
		CompanyID int    `json:"company_id"`
		DateStart string `json:"date_start"`
		DateEnd   string `json:"date_end"`
		Cards     interface{} `json:"cards"`
		FocusCard string `json:"focus_card,omitempty"`
	}{
		Tenant:    ctx.Tenant,
		CompanyID: ctx.CompanyID,
		DateStart: ctx.DateStart,
		DateEnd:   ctx.DateEnd,
		Cards:     sorted,
		FocusCard: focusCard,
	}
	canon, _ := json.Marshal(payload)

	h := sha256.Sum256(canon)
	return hex.EncodeToString(h[:])
}
