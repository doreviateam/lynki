package handlers

import (
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

const defaultRetentionDays = 90

// FactsPackPurgeJobHandler gère POST /internal/jobs/facts-pack-purge.
// Protégé par Bearer token (FACTS_PACK_PURGE_TOKEN).
// Destiné à un cron plateforme, pas à l'usage navigateur.
func FactsPackPurgeJobHandler(db *storage.DB, cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		auth := c.Get("Authorization")
		token := ""
		if len(auth) > 7 && (auth[:7] == "Bearer " || auth[:7] == "bearer ") {
			token = auth[7:]
		}
		expected := ""
		if cfg != nil {
			expected = cfg.FactsPackPurgeToken
		}
		if expected == "" || token != expected {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "missing or invalid internal token"})
		}

		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "database not configured"})
		}

		retentionDays := defaultRetentionDays

		executedAt := time.Now().UTC()

		deleted, err := db.PurgeFactsPackArchiveOlderThan(c.Context(), retentionDays)
		if err != nil {
			if log != nil {
				log.Error().
					Err(err).
					Int("threshold_days", retentionDays).
					Str("event", "facts_pack_purge_failed").
					Msg("facts_pack_purge: failed")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"status":         "error",
				"error":          err.Error(),
				"threshold_days": retentionDays,
				"executed_at":    executedAt.Format(time.RFC3339),
			})
		}

		if log != nil {
			log.Info().
				Str("event", "facts_pack_purged").
				Int64("deleted_count", deleted).
				Int("threshold_days", retentionDays).
				Str("executed_at", executedAt.Format(time.RFC3339)).
				Msg("facts_pack_purge: completed")
		}

		return c.JSON(fiber.Map{
			"status":         "ok",
			"deleted_count":  deleted,
			"threshold_days": retentionDays,
			"executed_at":    executedAt.Format(time.RFC3339),
		})
	}
}
