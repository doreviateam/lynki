package handlers

import (
	"context"
	"os"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// DiagnosticDocumentHandler permet de diagnostiquer l'état d'un document
// GET /api/v1/diagnostic/document/{id}
func DiagnosticDocumentHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		idStr := c.Params("id")
		id, err := uuid.Parse(idStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid document ID",
			})
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// Vérifier en base
		doc, err := db.GetDocumentByID(ctx, id)
		existsInDB := err == nil

		// Vérifier sur disque
		fileExists := false
		var fileSize int64
		if existsInDB {
			if info, err := os.Stat(doc.StoredPath); err == nil {
				fileExists = true
				fileSize = info.Size()
			}
		}

		response := fiber.Map{
			"vault_id":           idStr,
			"exists_in_database": existsInDB,
			"exists_on_disk":     fileExists,
		}

		if existsInDB {
			response["document"] = fiber.Map{
				"id":         doc.ID.String(),
				"filename":   doc.Filename,
				"sha256_hex": doc.SHA256Hex,
				"created_at": doc.CreatedAt.Format(time.RFC3339),
				"tenant":     doc.Tenant,
				"has_jws":    doc.EvidenceJWS != nil && *doc.EvidenceJWS != "",
				"has_ledger": doc.LedgerHash != nil && *doc.LedgerHash != "",
				"file_path":  doc.StoredPath,
				"file_size":  fileSize,
			}
			if doc.EvidenceJWS != nil {
				response["document"].(fiber.Map)["evidence_jws"] = *doc.EvidenceJWS
			}
			if doc.LedgerHash != nil {
				response["document"].(fiber.Map)["ledger_hash"] = *doc.LedgerHash
			}
		} else {
			response["error"] = "Document not found in database"
			if err != nil {
				response["error_details"] = err.Error()
			}
		}

		return c.JSON(response)
	}
}
