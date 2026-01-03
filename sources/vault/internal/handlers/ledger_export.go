package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// LedgerExportHandler gère l'endpoint GET /api/v1/ledger/export
// Params:
//   - format: "json" (défaut) ou "csv"
//   - limit:  nombre de lignes (1..10000, défaut 100)
//   - offset: décalage (défaut 0)
func LedgerExportHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		// ✅ SÉCURITÉ : Validation centralisée des paramètres
		validator := validators.NewValidator()

		// Parse query params
		format := c.Query("format", "json")
		if err := validator.ValidateFormat(format); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		// Sprint 8 : Support du paramètre document_id (Option A)
		documentID := c.Query("document_id")
		
		// Si document_id est fourni, retourner uniquement cette entrée
		if documentID != "" {
			ctx := context.Background()
			entry, err := db.GetLedgerEntryByDocumentID(ctx, documentID)
			if err != nil {
				log.Error().Err(err).Str("document_id", documentID).Msg("Failed to get ledger entry")
				return utils.NewSafeError(
					"Failed to get ledger entry",
					err,
					fiber.StatusInternalServerError,
				)
			}

			if entry == nil {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
					"error": "Ledger entry not found",
				})
			}

			// Format de réponse simplifié pour une seule entrée
			if format == "json" {
				c.Set("Content-Type", "application/json")
				return c.JSON(fiber.Map{
					"document_id": entry.DocumentID,
					"hash":        entry.Hash,
					"prev_hash":   entry.PrevHash,
					"timestamp":   entry.Timestamp.Format(time.RFC3339),
				})
			} else {
				// CSV pour une seule entrée
				c.Set("Content-Type", "text/csv")
				c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=ledger_%s.csv", documentID))
				w := c.Response().BodyWriter()
				_, _ = w.Write([]byte("document_id,hash,prev_hash,timestamp\n"))
				prev := ""
				if entry.PrevHash != nil {
					prev = *entry.PrevHash
				}
				ts := entry.Timestamp.UTC().Format(time.RFC3339)
				line := fmt.Sprintf("%s,%s,%s,%s\n", entry.DocumentID, entry.Hash, prev, ts)
				_, _ = w.Write([]byte(line))
				return nil
			}
		}

		// Comportement normal (export complet avec pagination)
		limitStr := c.Query("limit", "100")
		limit, err := validator.ValidateLimit(limitStr, 10000)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		offsetStr := c.Query("offset", "0")
		offset, err := validator.ValidateOffsetWithValue(offsetStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		ctx := context.Background()

		switch format {
		case "json":
			c.Set("Content-Type", "application/json")

			rows, err := db.ExportLedger(ctx, limit, offset)
			if err != nil {
				log.Error().Err(err).Msg("Failed to export ledger JSON")
				// ✅ SÉCURITÉ : Utiliser SafeError
				return utils.NewSafeError(
					"Failed to export ledger",
					err,
					fiber.StatusInternalServerError,
				)
			}

			// (simple) renvoyer juste le tableau; si tu veux la pagination, on peut l’ajouter
			return c.JSON(rows)

		case "csv":
			c.Set("Content-Type", "text/csv")
			c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=ledger_%d_%d.csv", limit, offset))

			rows, err := db.ExportLedger(ctx, limit, offset)
			if err != nil {
				log.Error().Err(err).Msg("Failed to export ledger CSV")
				// ✅ SÉCURITÉ : Utiliser SafeError
				return utils.NewSafeError(
					"Failed to export ledger",
					err,
					fiber.StatusInternalServerError,
				)
			}

			// Écriture CSV minimaliste
			w := c.Response().BodyWriter()
			_, _ = w.Write([]byte("id,document_id,hash,previous_hash,seq,timestamp\n"))
			for _, r := range rows {
				prev := ""
				if r.PrevHash != nil {
					prev = *r.PrevHash
				}
				ts := r.Timestamp.UTC().Format(time.RFC3339)
				line := fmt.Sprintf("%d,%s,%s,%s,%d,%s\n", r.ID, r.DocumentID, r.Hash, prev, r.Seq, ts)
				_, _ = w.Write([]byte(line))
			}
			return nil

		default:
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid format. Use 'json' or 'csv'",
			})
		}
	}
}
