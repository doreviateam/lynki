package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/doreviateam/diva/internal/cache"
	"github.com/doreviateam/diva/internal/facts"
	"github.com/doreviateam/diva/internal/guard"
	"github.com/doreviateam/diva/internal/mistral"
	"github.com/doreviateam/diva/internal/models"
	"github.com/doreviateam/diva/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const asyncMessage = "Analyse en cours. Interroger GET /diva/jobs/{context_hash} pour le résultat."
const errMessage = "Lecture DIVA momentanément indisponible. Les cartes restent consultables."
const maxRuntimeSeconds = 180

func ExplainAsync(
	cacheStore *cache.Cache,
	refreshGuard *guard.RefreshGuard,
	analysisStore store.AnalysisStore,
	mc *mistral.Client,
) fiber.Handler {
	return func(c *fiber.Ctx) error {
		requestID := uuid.New().String()

		var req models.ExplainRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "Request invalide."},
			})
		}

		// Validation minimale (identique à Explain)
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

		// Données insuffisantes : 200 immédiat (comme sync)
		if len(req.Dashboard.Cards) == 0 {
			return c.JSON(models.ExplainResponse{
				Meta: models.Meta{
					RequestID:   requestID,
					ContextHash: "sha256:empty",
					GeneratedAt: "",
					Cached:      false,
					Model:       modelName,
					LatencyMs:   0,
				},
				Flash: models.Flash{
					Headline:   "Données insuffisantes pour une synthèse. Complétez les indicateurs puis rafraîchissez.",
					WhatISee:   []string{},
					ToCheck:    []string{},
					Confidence: "low",
				},
			})
		}

		contextHash := computeContextHash(req.Context, req.Dashboard.Cards, req.Options.FocusCard)
		apiContextHash := "sha256:" + contextHash

		// Cache hit → 200 immédiat (comme sync)
		if !req.Options.ForceRefresh {
			if flash, meta, ok := cacheStore.Get(contextHash); ok {
				meta.RequestID = requestID
				return c.JSON(models.ExplainResponse{Meta: meta, Flash: flash})
			}
		}

		// Check persistent store for Case A (done+valid) ou Case B (processing)
		analysis, err := analysisStore.Get(c.Context(), contextHash)
		if err == nil && analysis != nil {
			if analysis.Status == store.StatusDone && time.Now().Before(analysis.ExpiresAt) && len(analysis.FlashJSON) > 0 {
				var payload struct {
					Flash models.Flash `json:"flash"`
					Meta  models.Meta  `json:"meta"`
				}
				if json.Unmarshal(analysis.FlashJSON, &payload) == nil {
					payload.Meta.RequestID = requestID
					payload.Meta.Cached = true
					payload.Meta.LatencyMs = 0
					return c.JSON(models.ExplainResponse{Meta: payload.Meta, Flash: payload.Flash})
				}
			}
			if analysis.Status == store.StatusProcessing {
				runtime := time.Since(analysis.StartedAt)
				if runtime < maxRuntimeSeconds*time.Second {
					return c.Status(202).JSON(fiber.Map{
						"context_hash": apiContextHash,
						"status":       "pending",
						"message":      asyncMessage,
					})
				}
			}
		}

		// Guard : 1 appel Mistral max par context_hash
		if !refreshGuard.TryAcquire(contextHash) {
			return c.JSON(models.ExplainResponse{
				Meta: models.Meta{
					RequestID:         requestID,
					ContextHash:       apiContextHash,
					RefreshInProgress: true,
				},
				Flash: models.Flash{
					Headline:   "Analyse en cours de génération.",
					WhatISee:   []string{},
					ToCheck:    []string{},
					Confidence: "low",
				},
			})
		}

		ttl := 300 * time.Second

		claimed, err := analysisStore.UpsertProcessing(c.Context(), contextHash, ttl)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": fiber.Map{"code": "INTERNAL_ERROR", "message": "Erreur serveur."},
			})
		}

		if !claimed {
			return c.Status(202).JSON(fiber.Map{
				"context_hash": apiContextHash,
				"status":       "pending",
				"message":      asyncMessage,
			})
		}

		// Cockpit : FactsPack ; card : nil
		var fp *facts.FactsPack
		dashboardDetails := req.Dashboard.Details
		if dashboardDetails == nil {
			dashboardDetails = make(map[string]interface{})
		}
		if req.Dashboard.DataCompleteness != nil {
			dashboardDetails["data_completeness"] = req.Dashboard.DataCompleteness
		}
		if req.Options.FocusCard == "" {
			ctxMeta := facts.ContextMeta{
				Tenant: req.Context.Tenant, CompanyID: req.Context.CompanyID,
				DateStart: req.Context.DateStart, DateEnd: req.Context.DateEnd, Currency: req.Context.Currency,
			}
			var dc *facts.DataCompleteness
			if req.Dashboard.DataCompleteness != nil {
				dc = &facts.DataCompleteness{BankHealthMetrics: req.Dashboard.DataCompleteness.BankHealthMetrics}
			}
			fp = facts.BuildFactsPack(req.Dashboard.Cards, dashboardDetails, dc, ctxMeta)
		}
		outputMode := req.Options.OutputMode
		if outputMode == "" {
			outputMode = "short"
		}

		// Goroutine : Mistral en arrière-plan
		start := time.Now()
		go func() {
			defer refreshGuard.Release(contextHash)

			flash, err := mc.Chat(req.Context, req.Dashboard.Cards, req.Options.FocusCard, req.Options.FocusCardDetails, dashboardDetails, outputMode, fp)
			latencyMs := time.Since(start).Milliseconds()

			if err != nil {
				code := "SERVICE_UNAVAILABLE"
				if errors.Is(err, mistral.ErrMistralTimeout) {
					code = "MISTRAL_TIMEOUT"
				}
				_ = analysisStore.MarkFailed(context.Background(), contextHash, code, errMessage)
				return
			}

			meta := models.Meta{
				RequestID:   uuid.New().String(),
				ContextHash: apiContextHash,
				GeneratedAt: time.Now().UTC().Format(time.RFC3339),
				Cached:       false,
				Model:        modelName,
				LatencyMs:    latencyMs,
			}
			cacheStore.Set(contextHash, flash, meta)
			_ = analysisStore.MarkDone(context.Background(), contextHash, flash, meta, ttl)
		}()

		return c.Status(202).JSON(fiber.Map{
			"context_hash": apiContextHash,
			"status":       "pending",
			"message":      asyncMessage,
		})
	}
}

func normalizeContextHash(s string) string {
	if len(s) > 7 && s[:7] == "sha256:" {
		return s[7:]
	}
	return s
}

func GetJobByContextHash(analysisStore store.AnalysisStore) fiber.Handler {
	return func(c *fiber.Ctx) error {
		param := c.Params("contextHash")
		if param == "" {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "context_hash manquant."},
			})
		}
		contextHash := normalizeContextHash(param)
		apiContextHash := param
		if len(param) <= 7 || param[:7] != "sha256:" {
			apiContextHash = "sha256:" + contextHash
		}

		analysis, err := analysisStore.Get(c.Context(), contextHash)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return c.Status(404).JSON(fiber.Map{
					"error": fiber.Map{"code": "NOT_FOUND", "message": "Job inconnu ou expiré."},
				})
			}
			return c.Status(500).JSON(fiber.Map{
				"error": fiber.Map{"code": "INTERNAL_ERROR", "message": "Erreur serveur."},
			})
		}

		if analysis.Status == store.StatusProcessing {
			runtime := time.Since(analysis.StartedAt)
			if runtime >= maxRuntimeSeconds*time.Second {
				_ = analysisStore.MarkStaleFailed(c.Context(), contextHash)
				return c.JSON(fiber.Map{
					"context_hash": apiContextHash,
					"status":       store.StatusFailed,
					"error":        fiber.Map{"code": "timeout", "message": "Job dépassé."},
				})
			}
			return c.Status(202).JSON(fiber.Map{
				"context_hash": apiContextHash,
				"status":       "pending",
			})
		}

		if analysis.Status == store.StatusDone {
			var payload struct {
				Flash models.Flash `json:"flash"`
				Meta  models.Meta  `json:"meta"`
			}
			if len(analysis.FlashJSON) > 0 && json.Unmarshal(analysis.FlashJSON, &payload) == nil {
				return c.JSON(fiber.Map{
					"context_hash": apiContextHash,
					"status":       store.StatusDone,
					"meta":         payload.Meta,
					"flash":        payload.Flash,
				})
			}
		}

		return c.JSON(fiber.Map{
			"context_hash": apiContextHash,
			"status":       store.StatusFailed,
			"error":        fiber.Map{"code": analysis.ErrorCode, "message": analysis.ErrorMessage},
		})
	}
}
