package handlers

import (
	"github.com/doreviateam/dorevia-vault/internal/replay"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// ReplayBackfillHandler gère POST /api/v1/replay/backfill (E3-US1a, E3-US1b)
// Lance le backfill documents → economic_events pour un tenant
func ReplayBackfillHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		tenant := c.Query("tenant")
		if tenant == "" {
			tenant = c.Get("X-Tenant")
		}
		var body struct {
			Tenant string `json:"tenant"`
		}
		_ = c.BodyParser(&body)
		if body.Tenant != "" {
			tenant = body.Tenant
		}
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing tenant (query param, X-Tenant header, or body.tenant)",
			})
		}

		lockedBy := "api"
		if v := c.Get("X-Request-ID"); v != "" {
			lockedBy = v
		}

		result, err := replay.BackfillFromDocuments(c.Context(), db, tenant, lockedBy)
		if err != nil {
			if log != nil {
				log.Error().Err(err).Str("tenant", tenant).Msg("Backfill failed")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		if log != nil {
			log.Info().
				Str("tenant", tenant).
				Int("invoices", result.Invoices).
				Int("payments", result.Payments).
				Int("errors", result.Errors).
				Msg("Backfill completed")
		}

		return c.JSON(fiber.Map{
			"tenant":     result.Tenant,
			"invoices":   result.Invoices,
			"payments":   result.Payments,
			"legacy":     result.Legacy,
			"errors":     result.Errors,
			"locked_at":  result.LockedAt,
			"unlocked_at": result.UnlockedAt,
		})
	}
}
