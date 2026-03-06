package handlers

import (
	"context"
	"strconv"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// BankReconciliationPayload payload pour bank.move.reconciled / bank.move.unreconciled (SPEC RECONCIL)
type BankReconciliationPayload struct {
	Tenant     string  `json:"tenant"`
	CompanyID  *int    `json:"company_id,omitempty"`
	EventType  string  `json:"event_type"` // bank.move.reconciled | bank.move.unreconciled
	MoveID     int     `json:"move_id"`
	AccountID  *int    `json:"account_id,omitempty"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency,omitempty"`
	OccurredAt string  `json:"occurred_at"`
	Idempotency struct {
		EventID string `json:"event_id"`
	} `json:"idempotency"`
}

// BankReconciliationResponse réponse POST /api/v1/bank-reconciliation/events
type BankReconciliationResponse struct {
	Status  string `json:"status"` // "updated" | "ignored_idempotent"
	Message string `json:"message,omitempty"`
}

// BankReconciliationEventsHandler gère POST /api/v1/bank-reconciliation/events (SPEC RECONCIL)
func BankReconciliationEventsHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		var payload BankReconciliationPayload
		if err := c.BodyParser(&payload); err != nil {
			log.Error().Err(err).Msg("Failed to parse bank reconciliation payload")
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
		idempotencyKey := payload.Idempotency.EventID
		if idempotencyKey == "" {
			idempotencyKey = payload.Tenant + ":" + strconv.Itoa(payload.MoveID) + ":" + payload.EventType + ":" + payload.OccurredAt
		}

		occurredAt, err := time.Parse(time.RFC3339, payload.OccurredAt)
		if err != nil {
			occurredAt = time.Now()
		}

		ctx := context.Background()

		// Idempotence
		processed, err := db.IsBankReconciliationEventProcessed(ctx, payload.Tenant, idempotencyKey)
		if err != nil {
			log.Error().Err(err).Str("idempotency_key", idempotencyKey).Msg("Check idempotence failed")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Internal error",
			})
		}
		if processed {
			return c.Status(fiber.StatusOK).JSON(BankReconciliationResponse{
				Status:  "ignored_idempotent",
				Message: "Event already processed",
			})
		}

		var companyID *int
		if payload.CompanyID != nil {
			companyID = payload.CompanyID
		}

		err = db.UpsertBankReconciliationEvent(ctx, payload.Tenant, idempotencyKey, payload.EventType,
			payload.MoveID, payload.Amount, occurredAt, payload.AccountID, companyID)
		if err != nil {
			log.Error().Err(err).Msg("Upsert bank reconciliation event failed")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to persist event",
			})
		}

		return c.Status(fiber.StatusOK).JSON(BankReconciliationResponse{
			Status: "updated",
		})
	}
}
