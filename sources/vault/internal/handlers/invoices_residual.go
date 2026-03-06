package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// ResidualPayload représente le payload invoice.residual.changed (SPEC AR by Partner Annexe A)
type ResidualPayload struct {
	Tenant     string `json:"tenant"`
	CompanyID  string `json:"company_id"`
	Source     struct {
		Model string `json:"model"`
		ID    string `json:"id"`
	} `json:"source"`
	Invoice struct {
		AmountResidual   float64  `json:"amount_residual"`
		InvoiceDateDue   string   `json:"invoice_date_due"`
	} `json:"invoice"`
	Partner struct {
		PartnerID string `json:"partner_id"`
	} `json:"partner"`
	Change struct {
		ChangedAt string `json:"changed_at"`
	} `json:"change"`
	Idempotency struct {
		EventID string `json:"event_id"`
	} `json:"idempotency"`
}

// ResidualResponse réponse POST /api/v1/invoices/residual
type ResidualResponse struct {
	Status  string `json:"status"`  // "updated" | "ignored_idempotent" | "ignored_older"
	Message string `json:"message,omitempty"`
}

// InvoicesResidualHandler gère POST /api/v1/invoices/residual (SPEC AR by Partner S2.1)
func InvoicesResidualHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		var payload ResidualPayload
		if err := c.BodyParser(&payload); err != nil {
			log.Error().Err(err).Msg("Failed to parse residual payload")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid JSON payload",
			})
		}

		if err := validateResidualPayload(&payload); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		ctx := context.Background()

		// 1. Idempotence : event_id déjà traité ?
		if payload.Idempotency.EventID != "" {
			processed, err := db.IsResidualEventProcessed(ctx, payload.Tenant, payload.Idempotency.EventID)
			if err != nil {
				log.Error().Err(err).Str("event_id", payload.Idempotency.EventID).Msg("Check idempotence failed")
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Internal error",
				})
			}
			if processed {
				return c.Status(fiber.StatusOK).JSON(ResidualResponse{
					Status:  "ignored_idempotent",
					Message: "Event already processed",
				})
			}
		}

		// 2. Lookup document
		sourceModel := payload.Source.Model
		if sourceModel == "" {
			sourceModel = "account.move"
		}
		doc, err := db.GetDocumentByTenantCompanySourceID(ctx, payload.Tenant, payload.CompanyID, sourceModel, payload.Source.ID)
		if err != nil {
			log.Error().Err(err).Msg("GetDocumentByTenantCompanySourceID failed")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Internal error",
			})
		}
		// Sécurité : document inexistant → 404, pas de création (review parano)
		if doc == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Document not found. Invoice must be vaulted first via POST /api/v1/invoices",
			})
		}

		// 3. Garde-fou ordre : changed_at <= last_residual_event_at → no-op
		changedAt, err := time.Parse(time.RFC3339, payload.Change.ChangedAt)
		if err != nil {
			// Fallback autres formats
			changedAt, err = time.Parse("2006-01-02T15:04:05Z07:00", payload.Change.ChangedAt)
		}
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "change.changed_at must be RFC3339 (e.g. 2006-01-02T15:04:05Z)",
			})
		}

		if doc.LastResidualEventAt != nil && !changedAt.After(*doc.LastResidualEventAt) {
			return c.Status(fiber.StatusOK).JSON(ResidualResponse{
				Status:  "ignored_older",
				Message: "Event older than last processed, skipped",
			})
		}

		// 4. Préparer les valeurs à mettre à jour
		amountRes := &payload.Invoice.AmountResidual
		var dueDate *time.Time
		if payload.Invoice.InvoiceDateDue != "" {
			if d, err := time.Parse("2006-01-02", payload.Invoice.InvoiceDateDue); err == nil {
				dueDate = &d
			}
		}
		var partnerID *string
		if payload.Partner.PartnerID != "" {
			pid := payload.Partner.PartnerID
			partnerID = &pid
		}

		// 5. UPDATE document
		if err := db.UpdateDocumentResidual(ctx, doc.ID, amountRes, dueDate, partnerID, changedAt); err != nil {
			log.Error().Err(err).Str("doc_id", doc.ID.String()).Msg("UpdateDocumentResidual failed")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Internal error",
			})
		}

		// 6. Marquer event_id comme traité
		if payload.Idempotency.EventID != "" {
			_ = db.MarkResidualEventProcessed(ctx, payload.Tenant, payload.Idempotency.EventID)
		}

		return c.Status(fiber.StatusOK).JSON(ResidualResponse{
			Status:  "updated",
			Message: "Document residual updated",
		})
	}
}

func validateResidualPayload(p *ResidualPayload) error {
	if p.Tenant == "" {
		return fmt.Errorf("tenant is required")
	}
	if p.Source.Model == "" {
		p.Source.Model = "account.move"
	}
	if p.Source.Model != "account.move" {
		return fmt.Errorf("source.model must be account.move for residual events")
	}
	if p.Source.ID == "" {
		return fmt.Errorf("source.id is required")
	}
	if p.Change.ChangedAt == "" {
		return fmt.Errorf("change.changed_at is required")
	}
	if p.Idempotency.EventID == "" {
		return fmt.Errorf("idempotency.event_id is required")
	}
	return nil
}
