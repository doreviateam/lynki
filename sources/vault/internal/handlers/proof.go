package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/middleware"
	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

func proofTenant(c *fiber.Ctx) string {
	tenant := c.Get("X-Tenant")
	if tenant == "" {
		tenant = c.Query("tenant")
	}
	return tenant
}

// ProofResponse représente la réponse standardisée pour les preuves (format v1.0)
type ProofResponse struct {
	ID          string  `json:"id"`
	Hash        string  `json:"hash"`
	Ledger      *string `json:"ledger,omitempty"`
	PrevHash    *string `json:"prev_hash,omitempty"` // Sprint 8 : Hash du document précédent dans le ledger
	Timestamp   string  `json:"timestamp"`
	JWS         *string `json:"jws,omitempty"`
	Status      string  `json:"status"`
	SourceModel *string `json:"source_model,omitempty"`
	SourceID    *string `json:"source_id,omitempty"`
}

// ProofResponseV11 représente le format de preuve v1.1 (amendements NF525 / LNE 2026).
// Référence : ZeDocs/web12/AMENDEMENTS_FORMAT_PREUVE_DOREVIA_VAULT_v1.1.md
// — Séparation hashes / proof.attestation_jws ; canonicalization ; verification ; ledger ; event ; status.
type ProofResponseV11 struct {
	ID               string                `json:"id"`
	Canonicalization string                `json:"canonicalization,omitempty"` // ex: "internal_v1"
	Hashes           ProofHashesV11        `json:"hashes"`
	Proof            ProofBlockV11         `json:"proof"`
	Ledger           *ProofLedgerV11       `json:"ledger,omitempty"`
	Verification     *ProofVerificationV11 `json:"verification,omitempty"`
	Event            ProofEventV11         `json:"event"`
	Status           string                `json:"status"`
}

type ProofHashesV11 struct {
	PayloadSHA256 string  `json:"payload_sha256"`
	PdfSHA256     *string `json:"pdf_sha256,omitempty"`
}

type ProofBlockV11 struct {
	ProofID            string  `json:"proof_id"`
	SealedAt           string  `json:"sealed_at"`
	AttestationJWS     *string `json:"attestation_jws,omitempty"`
	SignatureAlg       string  `json:"signature_alg"`
	KeyID              string  `json:"key_id"`
	ProofFormatVersion string  `json:"proof_format_version"`
}

type ProofLedgerV11 struct {
	Seq      int64   `json:"seq"`
	Hash     string  `json:"hash"`
	PrevHash *string `json:"prev_hash,omitempty"`
}

type ProofVerificationV11 struct {
	JWKSUri              string `json:"jwks_uri"`
	PublicKeyFingerprint string `json:"public_key_fingerprint,omitempty"`
}

type ProofEventV11 struct {
	Source         string  `json:"source"`
	SourceEventID  *string `json:"source_event_id,omitempty"`
	IdempotencyKey *string `json:"idempotency_key,omitempty"`
}

// BulkProofRequest représente une requête bulk
type BulkProofRequest struct {
	Requests []ProofRequest `json:"requests"`
}

// ProofRequest représente une requête de preuve dans un bulk
type ProofRequest struct {
	Type string `json:"type"` // account_move, account_payment, pos_order, etc.
	ID   string `json:"id"`   // ID Odoo
}

// BulkProofResponse représente la réponse bulk
type BulkProofResponse struct {
	Results []BulkProofResult `json:"results"`
}

// BulkProofResult représente un résultat dans une réponse bulk
type BulkProofResult struct {
	Type  string         `json:"type"`
	ID    string         `json:"id"`
	Proof *ProofResponse `json:"proof,omitempty"`
}

// buildProofResponse construit une réponse standardisée depuis un document
// Sprint 8 : Ajout de prev_hash depuis le ledger (Option B)
func buildProofResponse(doc *models.Document, db *storage.DB) ProofResponse {
	status := "verified"
	if doc.EvidenceJWS == nil {
		status = "pending"
	}

	var sourceID *string
	if doc.OdooID != nil {
		idStr := fmt.Sprintf("%d", *doc.OdooID)
		sourceID = &idStr
	} else if doc.SourceIDText != nil {
		sourceID = doc.SourceIDText
	}

	// Récupérer prev_hash depuis le ledger (Option B)
	var prevHash *string
	if db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		ledgerEntry, err := db.GetLedgerEntryByDocumentID(ctx, doc.ID.String())
		if err == nil && ledgerEntry != nil {
			prevHash = ledgerEntry.PrevHash
		}
		// Si erreur ou non trouvé, prevHash reste nil (champ optionnel)
	}

	return ProofResponse{
		ID:          doc.ID.String(),
		Hash:        doc.SHA256Hex,
		Ledger:      doc.LedgerHash,
		PrevHash:    prevHash, // Sprint 8 : Hash du document précédent
		Timestamp:   doc.CreatedAt.Format(time.RFC3339),
		JWS:         doc.EvidenceJWS,
		Status:      status,
		SourceModel: doc.OdooModel,
		SourceID:    sourceID,
	}
}

// extractSourceEventID extrait event_id du payload JSON (format DVIG / spec v1.1)
func extractSourceEventID(payloadJSON []byte) *string {
	if len(payloadJSON) == 0 {
		return nil
	}
	var m map[string]interface{}
	if err := json.Unmarshal(payloadJSON, &m); err != nil {
		return nil
	}
	if v, ok := m["event_id"]; ok {
		if s, ok := v.(string); ok {
			return &s
		}
	}
	return nil
}

// buildProofResponseV11 construit la réponse preuve au format v1.1 (amendements NF525 / LNE 2026)
func buildProofResponseV11(doc *models.Document, db *storage.DB, jwsService *crypto.Service, baseURL string) ProofResponseV11 {
	status := "verified"
	if doc.EvidenceJWS == nil {
		status = "pending"
	}

	hashes := ProofHashesV11{PayloadSHA256: doc.SHA256Hex}
	// PdfSHA256 optionnel : à remplir si le modèle Document gagne un champ pdf_sha256_hex

	proof := ProofBlockV11{
		ProofID:            doc.ID.String(),
		SealedAt:           doc.CreatedAt.Format(time.RFC3339),
		AttestationJWS:     doc.EvidenceJWS,
		SignatureAlg:       "RS256",
		KeyID:              "",
		ProofFormatVersion: "1.1",
	}
	if jwsService != nil {
		proof.KeyID = jwsService.GetKID()
	}

	var ledger *ProofLedgerV11
	if db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		ledgerEntry, err := db.GetLedgerEntryByDocumentID(ctx, doc.ID.String())
		if err == nil && ledgerEntry != nil {
			ledger = &ProofLedgerV11{
				Seq:      ledgerEntry.Seq,
				Hash:     ledgerEntry.Hash,
				PrevHash: ledgerEntry.PrevHash,
			}
		}
	}

	var verification *ProofVerificationV11
	if jwsService != nil && baseURL != "" {
		v := ProofVerificationV11{JWKSUri: baseURL + "/jwks.json"}
		if fp, err := jwsService.PublicKeyFingerprint(); err == nil {
			v.PublicKeyFingerprint = fp
		}
		verification = &v
	}

	source := "odoo"
	if doc.OdooModel != nil {
		source = *doc.OdooModel
	}
	event := ProofEventV11{
		Source:         source,
		IdempotencyKey: doc.IdempotencyKey,
	}
	event.SourceEventID = extractSourceEventID(doc.PayloadJSON)
	if event.SourceEventID == nil && doc.OdooID != nil {
		idStr := fmt.Sprintf("%d", *doc.OdooID)
		event.SourceEventID = &idStr
	}
	if event.SourceEventID == nil && doc.SourceIDText != nil {
		event.SourceEventID = doc.SourceIDText
	}

	return ProofResponseV11{
		ID:               doc.ID.String(),
		Canonicalization: "internal_v1",
		Hashes:           hashes,
		Proof:            proof,
		Ledger:           ledger,
		Verification:     verification,
		Event:            event,
		Status:           status,
	}
}

// mapTypeToSourceModel mappe le type de requête vers source_model
func mapTypeToSourceModel(proofType string) string {
	mapping := map[string]string{
		"account_move":    "account.move",
		"account_payment": "account.payment",
		"pos_order":       "pos.order",
		"pos_payment":     "pos.payment",
		"pos_zreport":     "pos.zreport",
	}
	return mapping[proofType]
}

// GetProofAccountMove récupère la preuve d'une facture par ID Odoo.
// Si query ?format=1.1 : retourne ProofResponseV11 (amendements NF525 / LNE 2026).
func GetProofAccountMove(db *storage.DB, jwsService *crypto.Service, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		traceID := middleware.GetTraceID(c)
		tenant := proofTenant(c)
		modelIn := "account_move"
		modelNormalized := "account.move"
		odooID := c.Params("id")

		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		if odooID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing id parameter",
			})
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		var doc *models.Document
		var err error
		if tenant != "" {
			doc, err = db.GetDocumentBySourceIDAndTenant(ctx, "account.move", odooID, tenant)
		} else {
			doc, err = db.GetDocumentBySourceID(ctx, "account.move", odooID)
		}
		durationMs := int(time.Since(start).Milliseconds())

		if err != nil {
			if log != nil {
				log.Info().
					Str("trace_id", traceID).
					Str("trace_id_source", middleware.GetTraceIDSource(c)).
					Str("tenant", tenant).
					Str("tenant_source", middleware.GetTenantSource(c)).
					Str("model_in", modelIn).
					Str("model_normalized", modelNormalized).
					Str("odoo_id", odooID).
					Bool("found", false).
					Int("duration_ms", durationMs).
					Err(err).
					Msg("vault_proof_lookup_error")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":  "Failed to retrieve proof",
				"detail": err.Error(),
			})
		}

		if doc == nil {
			if log != nil {
				log.Info().
					Str("trace_id", traceID).
					Str("trace_id_source", middleware.GetTraceIDSource(c)).
					Str("tenant", tenant).
					Str("tenant_source", middleware.GetTenantSource(c)).
					Str("model_in", modelIn).
					Str("model_normalized", modelNormalized).
					Str("odoo_id", odooID).
					Bool("found", false).
					Int("duration_ms", durationMs).
					Msg("vault_proof_lookup_not_found")
			}
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Proof not found",
			})
		}

		if log != nil {
			log.Info().
				Str("trace_id", traceID).
				Str("trace_id_source", middleware.GetTraceIDSource(c)).
				Str("tenant", tenant).
				Str("tenant_source", middleware.GetTenantSource(c)).
				Str("model_in", modelIn).
				Str("model_normalized", modelNormalized).
				Str("odoo_id", odooID).
				Bool("found", true).
				Str("document_id", doc.ID.String()).
				Int("duration_ms", durationMs).
				Msg("vault_proof_lookup_ok")
		}

		if c.Query("format") == "1.1" {
			baseURL := c.Protocol() + "://" + c.Hostname()
			return c.JSON(buildProofResponseV11(doc, db, jwsService, baseURL))
		}
		return c.JSON(buildProofResponse(doc, db))
	}
}

// GetProofAccountPayment récupère la preuve d'un paiement par ID Odoo.
// ?format=1.1 : retourne ProofResponseV11.
func GetProofAccountPayment(db *storage.DB, jwsService *crypto.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		odooID := c.Params("id")
		if odooID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing id parameter",
			})
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		tenant := proofTenant(c)
		var doc *models.Document
		var err error
		if tenant != "" {
			doc, err = db.GetDocumentBySourceIDAndTenant(ctx, "account.payment", odooID, tenant)
		} else {
			doc, err = db.GetDocumentBySourceID(ctx, "account.payment", odooID)
		}
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to retrieve proof",
			})
		}

		if doc == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Proof not found",
			})
		}

		if c.Query("format") == "1.1" {
			baseURL := c.Protocol() + "://" + c.Hostname()
			return c.JSON(buildProofResponseV11(doc, db, jwsService, baseURL))
		}
		return c.JSON(buildProofResponse(doc, db))
	}
}

// GetProofPosOrder récupère la preuve d'un ticket POS par ID Odoo.
// ?format=1.1 : retourne ProofResponseV11.
func GetProofPosOrder(db *storage.DB, jwsService *crypto.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		odooID := c.Params("id")
		if odooID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing id parameter",
			})
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		tenant := proofTenant(c)
		var doc *models.Document
		var err error
		if tenant != "" {
			doc, err = db.GetDocumentBySourceIDAndTenant(ctx, "pos.order", odooID, tenant)
		} else {
			doc, err = db.GetDocumentBySourceID(ctx, "pos.order", odooID)
		}
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to retrieve proof",
			})
		}

		if doc == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Proof not found",
			})
		}

		if c.Query("format") == "1.1" {
			baseURL := c.Protocol() + "://" + c.Hostname()
			return c.JSON(buildProofResponseV11(doc, db, jwsService, baseURL))
		}
		return c.JSON(buildProofResponse(doc, db))
	}
}

// GetProofPosPayment récupère la preuve d'un paiement POS par ID Odoo.
// ?format=1.1 : retourne ProofResponseV11.
func GetProofPosPayment(db *storage.DB, jwsService *crypto.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		odooID := c.Params("id")
		if odooID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing id parameter",
			})
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		tenant := proofTenant(c)
		var doc *models.Document
		var err error
		if tenant != "" {
			doc, err = db.GetDocumentBySourceIDAndTenant(ctx, "pos.payment", odooID, tenant)
		} else {
			doc, err = db.GetDocumentBySourceID(ctx, "pos.payment", odooID)
		}
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to retrieve proof",
			})
		}

		if doc == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Proof not found",
			})
		}

		if c.Query("format") == "1.1" {
			baseURL := c.Protocol() + "://" + c.Hostname()
			return c.JSON(buildProofResponseV11(doc, db, jwsService, baseURL))
		}
		return c.JSON(buildProofResponse(doc, db))
	}
}

// GetProofPosZreport récupère la preuve d'un Z-Report par ID Odoo
// Note: Les Z-Reports sont stockés dans le ledger filesystem, pas dans PostgreSQL
// Cette fonction nécessitera une intégration avec le service Z-Reports
// Pour l'instant, on retourne NotImplemented
func GetProofPosZreport() fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
			"error": "Z-Report proof retrieval not yet implemented. Use GET /api/v1/evidence/:tenant/:z_id instead",
		})
	}
}

// GetProofsBulk récupère plusieurs preuves en une fois
func GetProofsBulk(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		var req BulkProofRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request body",
			})
		}

		// Limite de 100 requêtes par appel
		if len(req.Requests) > 100 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Too many requests (maximum 100)",
			})
		}

		ctx, cancel := context.WithTimeout(c.Context(), 30*time.Second)
		defer cancel()

		results := make([]BulkProofResult, 0, len(req.Requests))

		// Traiter chaque requête
		for _, proofReq := range req.Requests {
			result := BulkProofResult{
				Type: proofReq.Type,
				ID:   proofReq.ID,
			}

			// Mapper le type vers source_model
			sourceModel := mapTypeToSourceModel(proofReq.Type)
			if sourceModel == "" {
				result.Proof = nil
				results = append(results, result)
				continue
			}

			// Gérer le cas spécial des Z-Reports (pas encore implémenté)
			if proofReq.Type == "pos_zreport" {
				result.Proof = nil
				results = append(results, result)
				continue
			}

			// Récupérer le document
			doc, err := db.GetDocumentBySourceID(ctx, sourceModel, proofReq.ID)
			if err != nil || doc == nil {
				result.Proof = nil
			} else {
				proof := buildProofResponse(doc, db)
				result.Proof = &proof
			}

			results = append(results, result)
		}

		return c.JSON(BulkProofResponse{
			Results: results,
		})
	}
}

// GetProofEvent récupère la preuve d'un événement par event_id DVIG.
// ?format=1.1 : retourne ProofResponseV11.
func GetProofEvent(db *storage.DB, jwsService *crypto.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		eventID := c.Params("event_id")
		if eventID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing event_id parameter",
			})
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		doc, err := db.GetDocumentByEventID(ctx, eventID)
		if err != nil {
			if err.Error() == "document not found" {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
					"error": "Proof not found for event_id",
				})
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to retrieve proof",
			})
		}

		if c.Query("format") == "1.1" {
			baseURL := c.Protocol() + "://" + c.Hostname()
			return c.JSON(buildProofResponseV11(doc, db, jwsService, baseURL))
		}
		return c.JSON(buildProofResponse(doc, db))
	}
}
