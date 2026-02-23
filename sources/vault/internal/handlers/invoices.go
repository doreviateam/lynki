package handlers

import (
	"context"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/audit"
	"github.com/google/uuid"
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

		// Validation des champs obligatoires de base
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

		// SPEC 1 : Validation account.move posted (fail-fast)
		if err := validateAccountMovePayload(&payload); err != nil {
			log.Warn().
				Err(err).
				Str("model", payload.Model).
				Str("state", payload.State).
				Str("source", payload.Source).
				Msg("Account move validation failed")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
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

		// SPEC 1 - US-2.1 : Détection conformité Factur-X 2026
		complianceStatus, facturXPresent := detectFacturXCompliance(facturXResult, payload.Meta, log)

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

		// Construire le document (ID obligatoire — évite duplicate key sur documents_pkey)
		doc := &models.Document{
			ID:          uuid.New(),
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

		// SPEC 1 : Extraire et stocker move_type depuis meta
		if payload.Meta != nil {
			if moveTypeRaw, ok := payload.Meta["move_type"]; ok {
				if moveType, ok := moveTypeRaw.(string); ok && moveType != "" {
					doc.MoveType = &moveType
				}
			}
		}

		// SPEC 1 - US-2.1 : Stocker compliance_status et facturx_present
		doc.ComplianceStatus = &complianceStatus
		doc.FacturXPresent = &facturXPresent

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
			if meta.BuyerName != "" {
				doc.PartnerName = &meta.BuyerName
			}
		}
		// Fallback vers métadonnées payload si Factur-X non disponible
		if payload.Meta != nil {
			// Fallback partner_name depuis DVIG si non fourni par Factur-X
			if doc.PartnerName == nil {
				if partnerName, ok := payload.Meta["partner_name"].(string); ok && partnerName != "" {
					doc.PartnerName = &partnerName
				}
			}
			// Fallback autres champs facture uniquement si Factur-X non disponible
			if facturXResult == nil || facturXResult.Metadata == nil {
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
			// AR by Partner (SPEC v1.0.3) — amount_residual, invoice_date_due, partner_id
			if amountRes, ok := payload.Meta["amount_residual"].(float64); ok {
				doc.AmountResidual = &amountRes
			}
			if dueStr, ok := payload.Meta["invoice_date_due"].(string); ok && dueStr != "" {
				if due, err := time.Parse("2006-01-02", dueStr); err == nil {
					doc.InvoiceDateDue = &due
				}
			}
			if partnerIDRaw, ok := payload.Meta["partner_id"]; ok && partnerIDRaw != nil {
				switch v := partnerIDRaw.(type) {
				case float64:
					pid := fmt.Sprintf("%.0f", v)
					doc.PartnerID = &pid
				case int:
					pid := fmt.Sprintf("%d", v)
					doc.PartnerID = &pid
				case string:
					if v != "" {
						doc.PartnerID = &v
					}
				}
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

// detectFacturXCompliance détecte la conformité Factur-X selon la politique 2026
// Retourne (compliance_status, facturx_present)
// compliance_status peut être : "compliant", "non_compliant_2026", "out_of_scope"
func detectFacturXCompliance(facturXResult *validation.ValidationResult, meta map[string]interface{}, log *zerolog.Logger) (string, bool) {
	// Détecter si Factur-X est présent
	facturXPresent := facturXResult != nil && facturXResult.Valid

	// Détecter B2B probable : buyer_vat ET seller_vat présents
	// Priorité : métadonnées Factur-X > métadonnées payload
	var buyerVAT, sellerVAT string
	hasBuyerVAT := false
	hasSellerVAT := false

	if facturXResult != nil && facturXResult.Metadata != nil {
		// Utiliser les métadonnées extraites de Factur-X
		if facturXResult.Metadata.BuyerVAT != "" {
			buyerVAT = facturXResult.Metadata.BuyerVAT
			hasBuyerVAT = true
		}
		if facturXResult.Metadata.SellerVAT != "" {
			sellerVAT = facturXResult.Metadata.SellerVAT
			hasSellerVAT = true
		}
	}

	// Fallback vers métadonnées payload si non disponibles dans Factur-X
	if !hasBuyerVAT && meta != nil {
		if bv, ok := meta["buyer_vat"].(string); ok && bv != "" {
			buyerVAT = bv
			hasBuyerVAT = true
		}
	}
	if !hasSellerVAT && meta != nil {
		if sv, ok := meta["seller_vat"].(string); ok && sv != "" {
			sellerVAT = sv
			hasSellerVAT = true
		}
	}

	// Calculer compliance_status
	var complianceStatus string
	if facturXPresent {
		// Factur-X présent → compliant
		complianceStatus = "compliant"
		log.Info().
			Str("compliance_status", complianceStatus).
			Bool("facturx_present", facturXPresent).
			Msg("Factur-X compliant document detected")
	} else if hasBuyerVAT && hasSellerVAT {
		// B2B probable (buyer_vat + seller_vat) mais Factur-X absent → non_compliant_2026
		complianceStatus = "non_compliant_2026"
		log.Warn().
			Str("compliance_status", complianceStatus).
			Bool("facturx_present", facturXPresent).
			Str("buyer_vat", buyerVAT).
			Str("seller_vat", sellerVAT).
			Msg("B2B probable document without Factur-X detected (non-compliant 2026)")
	} else {
		// B2C / non qualifié → out_of_scope
		complianceStatus = "out_of_scope"
		log.Debug().
			Str("compliance_status", complianceStatus).
			Bool("facturx_present", facturXPresent).
			Msg("Document out of scope for Factur-X compliance (B2C or unqualified)")
	}

	return complianceStatus, facturXPresent
}

// validateAccountMovePayload valide un payload account.move selon SPEC 1
// Retourne une erreur si la validation échoue (fail-fast)
// Ordre de validation :
// 1. model == "account.move"
// 2. state == "posted"
// 3. meta.move_type dans liste autorisée
// 4. mapping source ↔ move_type cohérent
// 5. meta.tenant non vide
func validateAccountMovePayload(payload *InvoicePayload) error {
	// Validation 1 : model == "account.move"
	if payload.Model != "account.move" {
		return fmt.Errorf("validation failed: model must be 'account.move', got '%s'", payload.Model)
	}

	// Validation 2 : state == "posted"
	if payload.State != "posted" {
		return fmt.Errorf("validation failed: state must be 'posted', got '%s'", payload.State)
	}

	// Validation 3 : meta.move_type dans liste autorisée
	if payload.Meta == nil {
		return fmt.Errorf("validation failed: meta is required for account.move")
	}

	moveTypeRaw, ok := payload.Meta["move_type"]
	if !ok {
		return fmt.Errorf("validation failed: meta.move_type is required")
	}

	moveType, ok := moveTypeRaw.(string)
	if !ok || moveType == "" {
		return fmt.Errorf("validation failed: meta.move_type must be a non-empty string")
	}

	allowedMoveTypes := map[string]bool{
		"out_invoice": true,
		"in_invoice":  true,
		"out_refund":  true,
		"in_refund":   true,
	}

	if !allowedMoveTypes[moveType] {
		return fmt.Errorf("validation failed: meta.move_type must be one of [out_invoice, in_invoice, out_refund, in_refund], got '%s'", moveType)
	}

	// Validation 4 : mapping source ↔ move_type cohérent
	// move_type ∈ {"out_invoice","out_refund"} → source = "sales"
	// move_type ∈ {"in_invoice","in_refund"} → source = "purchase"
	expectedSource := ""
	if moveType == "out_invoice" || moveType == "out_refund" {
		expectedSource = "sales"
	} else if moveType == "in_invoice" || moveType == "in_refund" {
		expectedSource = "purchase"
	}

	if payload.Source != expectedSource {
		return fmt.Errorf("validation failed: source '%s' does not match move_type '%s' (expected source: '%s')", payload.Source, moveType, expectedSource)
	}

	// Validation 5 : meta.tenant non vide
	tenantRaw, ok := payload.Meta["tenant"]
	if !ok {
		return fmt.Errorf("validation failed: meta.tenant is required")
	}

	tenant, ok := tenantRaw.(string)
	if !ok || tenant == "" {
		return fmt.Errorf("validation failed: meta.tenant must be a non-empty string")
	}

	return nil
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
