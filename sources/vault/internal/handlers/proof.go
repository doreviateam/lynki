package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
)

// ProofResponse représente la réponse standardisée pour les preuves
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

// BulkProofRequest représente une requête bulk
type BulkProofRequest struct {
	Requests []ProofRequest `json:"requests"`
}

// ProofRequest représente une requête de preuve dans un bulk
type ProofRequest struct {
	Type string `json:"type"` // account_move, account_payment, pos_order, etc.
	ID   string `json:"id"`    // ID Odoo
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

// mapTypeToSourceModel mappe le type de requête vers source_model
func mapTypeToSourceModel(proofType string) string {
	mapping := map[string]string{
		"account_move":   "account.move",
		"account_payment": "account.payment",
		"pos_order":       "pos.order",
		"pos_payment":     "pos.payment",
		"pos_zreport":     "pos.zreport",
	}
	return mapping[proofType]
}

// GetProofAccountMove récupère la preuve d'une facture par ID Odoo
func GetProofAccountMove(db *storage.DB) fiber.Handler {
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

		doc, err := db.GetDocumentBySourceID(ctx, "account.move", odooID)
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

		proof := buildProofResponse(doc, db)
		return c.JSON(proof)
	}
}

// GetProofAccountPayment récupère la preuve d'un paiement par ID Odoo
func GetProofAccountPayment(db *storage.DB) fiber.Handler {
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

		doc, err := db.GetDocumentBySourceID(ctx, "account.payment", odooID)
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

		proof := buildProofResponse(doc, db)
		return c.JSON(proof)
	}
}

// GetProofPosOrder récupère la preuve d'un ticket POS par ID Odoo
func GetProofPosOrder(db *storage.DB) fiber.Handler {
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

		doc, err := db.GetDocumentBySourceID(ctx, "pos.order", odooID)
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

		proof := buildProofResponse(doc, db)
		return c.JSON(proof)
	}
}

// GetProofPosPayment récupère la preuve d'un paiement POS par ID Odoo
func GetProofPosPayment(db *storage.DB) fiber.Handler {
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

		doc, err := db.GetDocumentBySourceID(ctx, "pos.payment", odooID)
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

		proof := buildProofResponse(doc, db)
		return c.JSON(proof)
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

