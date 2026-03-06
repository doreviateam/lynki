package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// BankReconciliationConfirmationPayload v1.2 — SPEC Confirmation Bancaire v1.3.
// impacted_documents obligatoire (amendement B).
type BankReconciliationConfirmationPayload struct {
	Tenant                string                           `json:"tenant"`
	EventType             string                           `json:"event_type"` // bank.move.reconciled | bank.move.unreconciled
	BankStatementLineID   int                              `json:"bank_statement_line_id"`
	ImpactedDocuments     []ImpactedDocumentItem           `json:"impacted_documents"`
	OccurredAt            string                           `json:"occurred_at"`
	IdempotencyKey        string                           `json:"idempotency_key"`
}

// ImpactedDocumentItem entrée impacted_documents.
type ImpactedDocumentItem struct {
	OdooModel string  `json:"odoo_model"`
	OdooID    int     `json:"odoo_id"`
	AmountAbs float64 `json:"amount_abs"`
}

// BankReconciliationConfirmationHandler gère POST /api/v1/bank-reconciliation/confirmation-events (format v1.2).
// Écrit dans financial_recon_deltas. Idempotent via (tenant, event_uid).
func BankReconciliationConfirmationHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		var payload BankReconciliationConfirmationPayload
		if err := c.BodyParser(&payload); err != nil {
			log.Error().Err(err).Msg("Failed to parse bank reconciliation confirmation payload")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid JSON payload",
			})
		}

		if payload.Tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "tenant is required",
			})
		}
		if payload.EventType != storage.EventTypeReconciled && payload.EventType != storage.EventTypeUnreconciled {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "event_type must be bank.move.reconciled or bank.move.unreconciled",
			})
		}
		if len(payload.ImpactedDocuments) == 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "impacted_documents is required (amendement B)",
			})
		}

		baseEventUID := payload.IdempotencyKey
		if baseEventUID == "" {
			baseEventUID = fmt.Sprintf("%s:conf:bsl:%d:%s:%s", payload.Tenant, payload.BankStatementLineID, payload.EventType, payload.OccurredAt)
		}

		occurredAt, err := time.Parse(time.RFC3339, payload.OccurredAt)
		if err != nil {
			occurredAt = time.Now()
		}

		direction := '+'
		if payload.EventType == storage.EventTypeUnreconciled {
			direction = '-'
		}

		ctx := context.Background()
		inserted := 0
		for i, imp := range payload.ImpactedDocuments {
			if imp.OdooModel == "" || imp.OdooID == 0 {
				log.Warn().Int("index", i).Msg("confirmation_skip invalid impacted_document")
				continue
			}

			doc, err := db.GetDocumentByTenantOdooModelID(ctx, payload.Tenant, imp.OdooModel, imp.OdooID)
			if err != nil {
				log.Error().Err(err).Str("model", imp.OdooModel).Int("odoo_id", imp.OdooID).Msg("GetDocumentByTenantOdooModelID failed")
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Document lookup failed"})
			}
			if doc == nil {
				log.Warn().Str("model", imp.OdooModel).Int("odoo_id", imp.OdooID).Msg("confirmation_skip DOC_NOT_FOUND")
				continue
			}

			// Cross-currency : si devise delta ≠ document → ignorer
			deltaCurrency := "EUR"
			if doc.Currency != "" {
				deltaCurrency = doc.Currency
			}
			// Le payload n'envoie pas la devise par document ; on utilise celle du document
			// Si le payload avait currency par impacted_doc, on pourrait comparer.

			amountAbs := utils.RoundMoney2(imp.AmountAbs)
			if amountAbs <= 0 {
				continue
			}

			// event_uid unique par delta pour idempotence (multi-split = plusieurs deltas par event)
			perDocEventUID := fmt.Sprintf("%s:%s:%d:%.2f", baseEventUID, imp.OdooModel, imp.OdooID, amountAbs)

			ok, err := db.InsertFinancialReconDelta(ctx, payload.Tenant, doc.ID, nil, payload.BankStatementLineID,
				amountAbs, direction, deltaCurrency, perDocEventUID, occurredAt)
			if err != nil {
				log.Error().Err(err).Msg("InsertFinancialReconDelta failed")
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to persist delta"})
			}
			if ok {
				inserted++
			}
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"status":   "updated",
			"inserted": inserted,
			"message":  "Deltas ingested (idempotent)",
		})
	}
}
