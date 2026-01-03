package handlers

import (
	"context"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/audit"
	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/ledger"
	"github.com/doreviateam/dorevia-vault/internal/metrics"
	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/doreviateam/dorevia-vault/internal/validation"
	"github.com/doreviateam/dorevia-vault/internal/webhooks"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// InvoicePayload représente le payload JSON pour l'endpoint /api/v1/invoices
type InvoicePayload struct {
	Source      string                 `json:"source"`         // sales|purchase|pos|stock|sale
	Model       string                 `json:"model"`          // account.move, pos.order, etc.
	OdooID      int                    `json:"odoo_id"`        // ID dans Odoo
	State       string                 `json:"state"`          // posted, paid, done, etc.
	PDPRequired bool                   `json:"pdp_required"`   // Nécessite dispatch PDP ?
	File        string                 `json:"file"`           // Base64 encoded file
	Meta        map[string]interface{} `json:"meta,omitempty"` // Métadonnées facture
}

// InvoiceResponse représente la réponse de l'endpoint /api/v1/invoices
type InvoiceResponse struct {
	ID          string    `json:"id"`
	SHA256Hex   string    `json:"sha256_hex"`
	CreatedAt   time.Time `json:"created_at"`
	EvidenceJWS *string   `json:"evidence_jws,omitempty"` // JWS si disponible
	LedgerHash  *string   `json:"ledger_hash,omitempty"`  // Hash ledger si disponible
	Message     string    `json:"message,omitempty"`      // Pour idempotence
}

// InvoicesHandler gère l'endpoint POST /api/v1/invoices
// Intègre JWS + Ledger si configurés
func InvoicesHandler(db *storage.DB, storageDir string, jwsService *crypto.Service, cfg *config.Config, log *zerolog.Logger, auditLogger *audit.Logger, webhookManager *webhooks.Manager) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		// Parser le payload JSON
		var payload InvoicePayload
		if err := c.BodyParser(&payload); err != nil {
			log.Error().Err(err).Msg("Failed to parse invoice payload")
			// ✅ SÉCURITÉ : Utiliser SafeError pour ne pas exposer les détails
			return utils.NewSafeError(
				"Invalid JSON payload",
				err,
				fiber.StatusBadRequest,
			)
		}

		// Validation des champs obligatoires
		if payload.Source == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required field: source",
			})
		}
		if payload.Model == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required field: model",
			})
		}
		if payload.File == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required field: file",
			})
		}

		// ✅ SÉCURITÉ : Vérifier la taille du payload base64
		maxBase64Size := cfg.MaxBase64SizeBytes
		if maxBase64Size == 0 {
			maxBase64Size = 15 * 1024 * 1024 // 15 MB par défaut (compense overhead base64 ~33%)
		}

		if len(payload.File) > maxBase64Size {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
				"error": fmt.Sprintf("Base64 payload too large (max %d bytes)", maxBase64Size),
			})
		}

		// Décoder le fichier base64
		fileContent, err := base64.StdEncoding.DecodeString(payload.File)
		if err != nil {
			log.Error().Err(err).Msg("Failed to decode base64 file")
			// ✅ SÉCURITÉ : Utiliser SafeError pour ne pas exposer les détails
			return utils.NewSafeError(
				"Invalid base64 file encoding",
				err,
				fiber.StatusBadRequest,
			)
		}

		// ✅ SÉCURITÉ : Vérifier la taille décodée
		maxFileSize := cfg.MaxUploadSizeBytes
		if maxFileSize == 0 {
			maxFileSize = 10 * 1024 * 1024 // 10 MB par défaut
		}

		if len(fileContent) > maxFileSize {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
				"error": fmt.Sprintf("Decoded file size exceeds maximum allowed size (%d bytes)", maxFileSize),
			})
		}

		// Validation Factur-X (Sprint 5 Phase 5.3)
		var facturXResult *validation.ValidationResult
		if cfg.FacturXValidationEnabled {
			validator := validation.NewFacturXValidator(*log)
			contentType := "application/pdf" // Par défaut, peut être détecté depuis meta
			if payload.Meta != nil {
				if ct, ok := payload.Meta["content_type"].(string); ok {
					contentType = ct
				}
			}

			result, err := validator.Validate(fileContent, contentType)
			if err != nil {
				log.Warn().Err(err).Msg("Factur-X validation error")
			} else {
				facturXResult = result
				if !result.Valid {
					log.Warn().
						Strs("errors", result.Errors).
						Msg("Factur-X validation failed")
					// Retourner erreur si validation requise
					if cfg.FacturXValidationRequired {
						return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
							"error":               "Factur-X validation failed",
							"validation_errors":   result.Errors,
							"validation_warnings": result.Warnings,
						})
					}
				} else {
					log.Info().Msg("Factur-X validation successful")
				}
			}
		}

		// Extraire le nom de fichier depuis meta ou utiliser un nom par défaut
		filename := "document.pdf"
		if payload.Meta != nil {
			if number, ok := payload.Meta["number"].(string); ok && number != "" {
				filename = fmt.Sprintf("%s.pdf", number)
			}
		}

		// ✅ SÉCURITÉ : Sanitizer le nom de fichier pour éviter path traversal
		filename = utils.SanitizeFilename(filename)
		if err := utils.ValidateFilename(filename); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid filename",
			})
		}

		// Construire le document
		doc := &models.Document{
			Filename:    filename,
			ContentType: "application/pdf", // Par défaut, peut être amélioré avec détection MIME
			SizeBytes:   int64(len(fileContent)),
			Source:      &payload.Source,
			OdooModel:   &payload.Model,
			OdooID:      &payload.OdooID,
			OdooState:   &payload.State,
			PDPRequired: &payload.PDPRequired,
		}

		// Définir dispatch_status par défaut
		defaultStatus := "PENDING"
		doc.DispatchStatus = &defaultStatus

		// Extraire correlation_id et tenant depuis meta pour traçabilité DVIG
		var correlationID, tenant string
		if payload.Meta != nil {
			if cid, ok := payload.Meta["correlation_id"].(string); ok {
				correlationID = cid
			}
			if t, ok := payload.Meta["tenant"].(string); ok && t != "" {
				tenant = t
			}
		}

		// Assigner le tenant au document si présent (Sprint 4 - US-4.3)
		if tenant != "" {
			doc.Tenant = &tenant
		}

		// Extraire les métadonnées facture
		// Priorité : métadonnées Factur-X validées > métadonnées payload
		if facturXResult != nil && facturXResult.Metadata != nil {
			// Utiliser les métadonnées extraites de Factur-X
			meta := facturXResult.Metadata
			doc.InvoiceNumber = &meta.InvoiceNumber
			doc.InvoiceDate = &meta.InvoiceDate
			// Note: DueDate n'est pas stocké dans le modèle Document actuellement
			doc.TotalHT = &meta.TotalHT
			doc.TotalTTC = &meta.TotalTTC
			doc.Currency = &meta.Currency
			doc.SellerVAT = &meta.SellerVAT
			doc.BuyerVAT = &meta.BuyerVAT
		} else if payload.Meta != nil {
			// Fallback vers métadonnées payload si Factur-X non disponible
			if number, ok := payload.Meta["number"].(string); ok {
				doc.InvoiceNumber = &number
			}
			if dateStr, ok := payload.Meta["invoice_date"].(string); ok {
				if date, err := time.Parse("2006-01-02", dateStr); err == nil {
					doc.InvoiceDate = &date
				}
			}
			if totalHT, ok := payload.Meta["total_ht"].(float64); ok {
				doc.TotalHT = &totalHT
			}
			if totalTTC, ok := payload.Meta["total_ttc"].(float64); ok {
				doc.TotalTTC = &totalTTC
			}
			if currency, ok := payload.Meta["currency"].(string); ok {
				doc.Currency = &currency
			}
			if sellerVAT, ok := payload.Meta["seller_vat"].(string); ok {
				doc.SellerVAT = &sellerVAT
			}
			if buyerVAT, ok := payload.Meta["buyer_vat"].(string); ok {
				doc.BuyerVAT = &buyerVAT
			}
		}

		// Stocker le document avec JWS + Ledger (si configurés)
		ctx := context.Background()
		startTime := time.Now() // Sprint 3 Phase 2 : Mesure durée transaction

		// Utiliser StoreDocumentWithEvidence si JWS ou Ledger activés
		if (cfg.JWSEnabled && jwsService != nil) || cfg.LedgerEnabled {
			err = db.StoreDocumentWithEvidence(ctx, doc, fileContent, storageDir, jwsService, cfg.JWSEnabled, cfg.JWSRequired, cfg.LedgerEnabled)
		} else {
			// Fallback vers méthode simple (Sprint 1)
			err = db.StoreDocumentWithTransaction(ctx, doc, fileContent, storageDir)
		}

		// Mesurer durée transaction (Sprint 3 Phase 2)
		transactionDuration := time.Since(startTime).Seconds()
		metrics.RecordTransactionDuration(transactionDuration)

		// Gérer l'idempotence (document déjà existant)
		if err != nil {
			if docExistsErr, ok := err.(storage.ErrDocumentExists); ok {
				// Récupérer les informations du document existant
				existingDoc, err := db.GetDocumentByID(ctx, docExistsErr.ID)
				if err != nil {
					log.Error().Err(err).Msg("Failed to retrieve existing document")
					return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
						"error": "Failed to retrieve existing document",
					})
				}

				// Document déjà existant - retourner 200 OK avec les infos existantes
				logEntry := log.Info().
					Str("document_id", existingDoc.ID.String()).
					Str("sha256", existingDoc.SHA256Hex)
				// Ajouter correlation_id et tenant si présents (DVIG traçabilité)
				if correlationID != "" {
					logEntry = logEntry.Str("correlation_id", correlationID)
				}
				if tenant != "" {
					logEntry = logEntry.Str("tenant", tenant)
				}
				logEntry.Msg("Document already exists (idempotence)")

				// Métrique : document idempotent (Sprint 3 Phase 2)
				source := "unknown"
				if payload.Source != "" {
					source = payload.Source
				}
				metrics.RecordDocumentVaulted("idempotent", source)

				// Audit : document idempotent (Sprint 4 Phase 4.2)
				if auditLogger != nil {
					requestID := c.Get("X-Request-ID")
					auditLogger.Log(audit.Event{
						EventType:  audit.EventTypeDocumentVaulted,
						DocumentID: existingDoc.ID.String(),
						RequestID:  requestID,
						Source:     source,
						Status:     audit.EventStatusIdempotent,
						DurationMS: int64(time.Since(startTime).Milliseconds()),
						Metadata: map[string]interface{}{
							"sha256_hex": existingDoc.SHA256Hex,
							"odoo_id":    payload.OdooID,
							"model":      payload.Model,
						},
					})
				}

				// Vérifier si ledger existe pour document existant (idempotence renforcée)
				var hasLedger bool
				if cfg.LedgerEnabled && db != nil {
					tx, _ := db.Pool.Begin(ctx)
					if tx != nil {
						hasLedger, _ = ledger.ExistsByDocumentID(ctx, tx, existingDoc.ID)
						tx.Rollback(ctx)
					}
					// Si document existe mais pas de ledger, compléter le ledger
					if !hasLedger && jwsService != nil {
						// TODO: Compléter le ledger si nécessaire (optionnel)
					}
				}

				return c.Status(fiber.StatusOK).JSON(InvoiceResponse{
					ID:          existingDoc.ID.String(),
					SHA256Hex:   existingDoc.SHA256Hex,
					CreatedAt:   existingDoc.CreatedAt,
					EvidenceJWS: existingDoc.EvidenceJWS,
					LedgerHash:  existingDoc.LedgerHash,
					Message:     "Document already exists",
				})
			}

			// Métrique : erreur de stockage (Sprint 3 Phase 2)
			source := "unknown"
			if payload.Source != "" {
				source = payload.Source
			}
			metrics.RecordDocumentVaulted("error", source)

			// Audit : erreur de stockage (Sprint 4 Phase 4.2)
			if auditLogger != nil {
				requestID := c.Get("X-Request-ID")
				auditLogger.Log(audit.Event{
					EventType:  audit.EventTypeDocumentVaulted,
					RequestID:  requestID,
					Source:     source,
					Status:     audit.EventStatusError,
					DurationMS: int64(time.Since(startTime).Milliseconds()),
					Metadata: map[string]interface{}{
						"error": err.Error(),
						"model": payload.Model,
					},
				})
			}

			log.Error().Err(err).Msg("Failed to store document")
			// ✅ SÉCURITÉ : Utiliser SafeError pour ne pas exposer les détails
			return utils.NewSafeError(
				"Failed to store document",
				err,
				fiber.StatusInternalServerError,
			)
		}

		// Métrique : succès de stockage (Sprint 3 Phase 2)
		source := "unknown"
		if payload.Source != "" {
			source = payload.Source
		}
		metrics.RecordDocumentVaulted("success", source)

		// Audit : succès de stockage (Sprint 4 Phase 4.2)
		if auditLogger != nil {
			requestID := c.Get("X-Request-ID")
			auditLogger.Log(audit.Event{
				EventType:  audit.EventTypeDocumentVaulted,
				DocumentID: doc.ID.String(),
				RequestID:  requestID,
				Source:     source,
				Status:     audit.EventStatusSuccess,
				DurationMS: int64(time.Since(startTime).Milliseconds()),
				Metadata: map[string]interface{}{
					"sha256_hex":   doc.SHA256Hex,
					"filename":     filename,
					"size_bytes":   len(fileContent),
					"odoo_id":      payload.OdooID,
					"model":        payload.Model,
					"evidence_jws": doc.EvidenceJWS != nil,
					"ledger_hash":  doc.LedgerHash != nil,
				},
			})
		}

		// Webhook : document.vaulted (Sprint 5 Phase 5.3)
		if webhookManager != nil {
			webhookPayload := map[string]interface{}{
				"document_id":  doc.ID.String(),
				"sha256_hex":   doc.SHA256Hex,
				"filename":     filename,
				"size_bytes":   len(fileContent),
				"created_at":   doc.CreatedAt,
				"evidence_jws": doc.EvidenceJWS != nil,
				"ledger_hash":  doc.LedgerHash != nil,
				"odoo_id":      payload.OdooID,
				"model":        payload.Model,
				"source":       source,
			}
			if err := webhookManager.EmitEvent(ctx, webhooks.EventTypeDocumentVaulted, doc.ID.String(), webhookPayload); err != nil {
				log.Warn().Err(err).Msg("Failed to emit webhook event")
			}
		}

		// Succès - retourner 201 Created
		logEntry := log.Info().
			Str("document_id", doc.ID.String()).
			Str("sha256", doc.SHA256Hex).
			Int("odoo_id", payload.OdooID)
		// Ajouter correlation_id et tenant si présents (DVIG traçabilité)
		if correlationID != "" {
			logEntry = logEntry.Str("correlation_id", correlationID)
		}
		if tenant != "" {
			logEntry = logEntry.Str("tenant", tenant)
		}
		logEntry.Msg("Document vaulted successfully")

		return c.Status(fiber.StatusCreated).JSON(InvoiceResponse{
			ID:          doc.ID.String(),
			SHA256Hex:   doc.SHA256Hex,
			CreatedAt:   doc.CreatedAt,
			EvidenceJWS: doc.EvidenceJWS,
			LedgerHash:  doc.LedgerHash,
		})
	}
}

// GetInvoice gère GET /api/v1/invoices -> 405 Method Not Allowed
// Retourne une erreur claire avec header Allow: POST
func GetInvoice(c *fiber.Ctx) error {
	c.Set("Allow", "POST")
	return c.Status(fiber.StatusMethodNotAllowed).JSON(fiber.Map{
		"error":   "Method Not Allowed",
		"message": "Only POST method is allowed for /api/v1/invoices",
	})
}
