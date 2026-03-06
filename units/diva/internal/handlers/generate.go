package handlers

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/doreviateam/diva/internal/facts"
	"github.com/doreviateam/diva/internal/hashinput"
	"github.com/doreviateam/diva/internal/mistral"
	"github.com/doreviateam/diva/internal/models"
	"github.com/doreviateam/diva/internal/store"
	"github.com/gofiber/fiber/v2"
)

// Generate — POST /diva/generate. Génère un insight et le stocke dans diva_insights.
func Generate(genStore store.GenerateStore, mc *mistral.Client) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if genStore == nil {
			return c.Status(503).JSON(fiber.Map{
				"error": fiber.Map{"code": "SERVICE_UNAVAILABLE", "message": "Génération non disponible."},
			})
		}

		var req models.ExplainRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "Request invalide."},
			})
		}

		// Validation (SPEC §6.3)
		if req.Context.Tenant == "" {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "context.tenant requis"},
			})
		}
		if req.Context.DateStart == "" {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "context.date_start requis"},
			})
		}
		if req.Context.DateEnd == "" {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "context.date_end requis"},
			})
		}
		if req.Dashboard.Cards == nil || len(req.Dashboard.Cards) == 0 {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "dashboard.cards requis et non vide"},
			})
		}
		mode := "cockpit"
		focusCard := req.Options.FocusCard

		companyID := req.Context.CompanyID

		contextKey := hashinput.ComputeContextKey(
			req.Context.Tenant, companyID,
			req.Context.DateStart, req.Context.DateEnd,
			req.Context.PartnerName,
		)

		// Dashboard details pour Mistral : _details + data_completeness (DIVA Cockpit v1.1)
		dashboardDetails := req.Dashboard.Details
		if dashboardDetails == nil {
			dashboardDetails = make(map[string]interface{})
		}
		if req.Dashboard.DataCompleteness != nil {
			dashboardDetails["data_completeness"] = req.Dashboard.DataCompleteness
		}

		// Cockpit : FactsPack + payload_hash dérivé du canonique (SPEC v1.2.1)
		var fp *facts.FactsPack
		var payloadHash string
		if focusCard == "" {
			ctxMeta := facts.ContextMeta{
				Tenant:    req.Context.Tenant,
				CompanyID: req.Context.CompanyID,
				DateStart: req.Context.DateStart,
				DateEnd:   req.Context.DateEnd,
				Currency:  req.Context.Currency,
			}
			var dc *facts.DataCompleteness
			if req.Dashboard.DataCompleteness != nil {
				dc = &facts.DataCompleteness{BankHealthMetrics: req.Dashboard.DataCompleteness.BankHealthMetrics}
			}
			fp = facts.BuildFactsPack(req.Dashboard.Cards, dashboardDetails, dc, ctxMeta)
			payloadHash = facts.PayloadHash(fp)
		} else {
			var errHash error
			payloadHash, errHash = hashinput.ComputePayloadHash(&req)
			if errHash != nil {
				return c.Status(500).JSON(fiber.Map{
					"error": fiber.Map{"code": "INTERNAL_ERROR", "message": "Erreur calcul hash."},
				})
			}
		}

		outputMode := req.Options.OutputMode
		if outputMode == "" {
			outputMode = "short"
		}

	generatedFromRunner := req.Options.GeneratedFromRunner

	start := time.Now()

	var resultState string
	var resultErrorCode string
	var err error

	err = genStore.WithGenerateLock(c.Context(), contextKey, func(tx store.GenerateTx) error {
		forceRefresh := req.Options.ForceRefresh
		if !forceRefresh {
			fresh, err := tx.CheckInsightFresh(contextKey, payloadHash)
			if err != nil {
				return err
			}
			if fresh {
				return errAlreadyFresh
			}
		}

		flash, chatErr := mc.Chat(req.Context, req.Dashboard.Cards, focusCard, req.Options.FocusCardDetails, dashboardDetails, outputMode, fp)
		latencyMs := int(time.Since(start).Milliseconds())

		if chatErr != nil {
			var code string
			if errors.Is(chatErr, mistral.ErrMistralTimeout) {
				code = "MISTRAL_TIMEOUT"
			} else {
				code = "MISTRAL_UNAVAILABLE"
			}

			insertErr := tx.InsertInsight(c.Context(), store.InsertInsightParams{
				Tenant:              req.Context.Tenant,
				CompanyID:           companyID,
				Mode:                mode,
				DateStart:           req.Context.DateStart,
				DateEnd:             req.Context.DateEnd,
				ContextKey:          contextKey,
				PayloadHash:         payloadHash,
				MessageText:         "Analyse temporairement indisponible.",
				FlashJSON:           []byte("{}"),
				Status:              "error",
				ErrorCode:           code,
				Model:               "mistral",
				LatencyMs:           latencyMs,
				GeneratedFromRunner: generatedFromRunner,
			})
			if insertErr != nil {
				return insertErr
			}
			resultState = "failed"
			resultErrorCode = code
			return nil
		}

		flashJSON, _ := json.Marshal(flash)
		messageText := flash.Headline
		if messageText == "" {
			messageText = "Analyse disponible."
		}
		conf := flash.Confidence
		if conf != "low" && conf != "medium" && conf != "high" {
			conf = "medium"
		}

		insertErr := tx.InsertInsight(c.Context(), store.InsertInsightParams{
			Tenant:              req.Context.Tenant,
			CompanyID:           companyID,
			Mode:                mode,
			DateStart:           req.Context.DateStart,
			DateEnd:             req.Context.DateEnd,
			ContextKey:          contextKey,
			PayloadHash:         payloadHash,
			MessageText:         messageText,
			FlashJSON:           flashJSON,
			Status:              "ok",
			Confidence:          conf,
			Model:               "mistral",
			LatencyMs:           latencyMs,
			GeneratedFromRunner: generatedFromRunner,
		})
		if insertErr != nil {
			return insertErr
		}
		resultState = "ready"
		return nil
	})

	if err != nil {
		if errors.Is(err, errAlreadyFresh) {
			return c.Status(204).Send(nil)
		}
		if errors.Is(err, store.ErrLockTimeout) {
			return c.Status(503).JSON(fiber.Map{
				"error": fiber.Map{"code": "SERVICE_UNAVAILABLE", "message": "Une autre analyse est en cours. Réessayez dans quelques instants."},
			})
		}
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{"code": "INTERNAL_ERROR", "message": "Analyse indisponible. Réessayez ultérieurement."},
		})
	}

	if resultState == "failed" {
		return c.Status(200).JSON(fiber.Map{
			"state":      "failed",
			"error_code": resultErrorCode,
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"state":        "ready",
		"context_key":  contextKey,
		"payload_hash": payloadHash,
	})
	}
}

var errAlreadyFresh = errors.New("already fresh")
