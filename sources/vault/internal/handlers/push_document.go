package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// ErrTemporary représente une erreur temporaire (retryable)
type ErrTemporary struct {
	Message string
}

func (e *ErrTemporary) Error() string {
	return e.Message
}

// ErrPermanent représente une erreur permanente (non retryable)
type ErrPermanent struct {
	Message string
}

func (e *ErrPermanent) Error() string {
	return e.Message
}

// errorTemporary crée une réponse d'erreur temporaire
func errorTemporary(err error) fiber.Map {
	return fiber.Map{
		"status":    "error",
		"type":      "temporary",
		"message":   err.Error(),
		"retryable": true,
	}
}

// errorPermanent crée une réponse d'erreur permanente
func errorPermanent(err error) fiber.Map {
	return fiber.Map{
		"status":    "error",
		"type":      "permanent",
		"message":   err.Error(),
		"retryable": false,
	}
}

// PushDocumentPayload représente le payload pour /api/v1/push_document
type PushDocumentPayload struct {
	File     string                 `json:"file"`           // Base64 encoded file
	Filename string                 `json:"filename"`       // Nom du fichier
	Meta     map[string]interface{} `json:"meta,omitempty"` // Métadonnées optionnelles
}

// PushDocumentHandler gère l'endpoint POST /api/v1/push_document
// Garantit toujours une réponse JSON, même en cas d'erreur
func PushDocumentHandler(
	db *storage.DB,
	storageDir string,
	jwsService *crypto.Service,
	cfg *config.Config,
	log *zerolog.Logger,
) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Règle absolue : Chaque chemin de code se termine par un return c.JSON(...)

		// Parser le payload JSON (AVANT la vérification DB pour que les erreurs de validation soient permanentes)
		var payload PushDocumentPayload
		if err := c.BodyParser(&payload); err != nil {
			if log != nil {
				log.Error().Err(err).Msg("Failed to parse push_document payload")
			}
			return c.Status(fiber.StatusBadRequest).JSON(errorPermanent(
				fmt.Errorf("invalid JSON payload: %w", err),
			))
		}

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

		// Validation des champs obligatoires
		if payload.File == "" {
			return c.Status(fiber.StatusBadRequest).JSON(errorPermanent(
				errors.New("missing required field: file"),
			))
		}
		if payload.Filename == "" {
			return c.Status(fiber.StatusBadRequest).JSON(errorPermanent(
				errors.New("missing required field: filename"),
			))
		}

		// Vérifier la taille du payload base64
		maxBase64Size := cfg.MaxBase64SizeBytes
		if maxBase64Size == 0 {
			maxBase64Size = 15 * 1024 * 1024 // 15 MB par défaut
		}

		if len(payload.File) > maxBase64Size {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(errorPermanent(
				fmt.Errorf("base64 payload too large (max %d bytes)", maxBase64Size),
			))
		}

		// Décoder le fichier base64
		fileContent, err := base64.StdEncoding.DecodeString(payload.File)
		if err != nil {
			if log != nil {
				log.Error().Err(err).Msg("Failed to decode base64 file")
			}
			return c.Status(fiber.StatusBadRequest).JSON(errorPermanent(
				fmt.Errorf("invalid base64 encoding: %w", err),
			))
		}

		// Vérifier que le fichier n'est pas vide
		if len(fileContent) == 0 {
			return c.Status(fiber.StatusBadRequest).JSON(errorPermanent(
				errors.New("file content is empty"),
			))
		}

		// Vérifier que la base de données est configurée (APRÈS validation pour que les erreurs de validation soient permanentes)
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(errorTemporary(
				errors.New("database not configured"),
			))
		}

		// Calculer le hash SHA256
		hash := sha256.Sum256(fileContent)
		sha256Hex := hex.EncodeToString(hash[:])

		// Vérifier l'idempotence (document déjà existant)
		ctx := context.Background()
		var existingDoc models.Document
		err = db.Pool.QueryRow(ctx, `
			SELECT id, sha256_hex, created_at, evidence_jws, ledger_hash
			FROM documents
			WHERE sha256_hex = $1
			LIMIT 1
		`, sha256Hex).Scan(
			&existingDoc.ID,
			&existingDoc.SHA256Hex,
			&existingDoc.CreatedAt,
			&existingDoc.EvidenceJWS,
			&existingDoc.LedgerHash,
		)
		if err == nil {
			// Document déjà existant - retourner succès avec les informations du document existant
			response := fiber.Map{
				"id":         existingDoc.ID.String(),
				"sha256_hex": existingDoc.SHA256Hex,
				"created_at": existingDoc.CreatedAt.Format(time.RFC3339),
				"message":    "Document already vaulted",
			}
			if existingDoc.EvidenceJWS != nil && *existingDoc.EvidenceJWS != "" {
				response["evidence_jws"] = *existingDoc.EvidenceJWS
			}
			if existingDoc.LedgerHash != nil && *existingDoc.LedgerHash != "" {
				response["ledger_hash"] = *existingDoc.LedgerHash
			}
			return c.Status(fiber.StatusOK).JSON(response)
		}

		// Créer le document
		docID := uuid.New()
		doc := &models.Document{
			ID:          docID,
			Filename:    payload.Filename,
			ContentType: "application/pdf", // Par défaut, peut être amélioré
			SizeBytes:   int64(len(fileContent)),
			SHA256Hex:   sha256Hex,
			CreatedAt:   time.Now(),
		}

		// Assigner le tenant si présent (Sprint 4 - US-4.3)
		if tenant != "" {
			doc.Tenant = &tenant
		}

		// Stocker le document
		// Utiliser StoreDocumentWithEvidence si JWS ou Ledger activés
		if (cfg.JWSEnabled && jwsService != nil) || cfg.LedgerEnabled {
			err = db.StoreDocumentWithEvidence(
				ctx,
				doc,
				fileContent,
				storageDir,
				jwsService,
				cfg.JWSEnabled,
				cfg.JWSRequired,
				cfg.LedgerEnabled,
			)
		} else {
			// Fallback vers méthode simple
			err = db.StoreDocumentWithTransaction(ctx, doc, fileContent, storageDir)
		}

		// Gérer les erreurs
		if err != nil {
			// Vérifier si c'est une erreur temporaire (timeout, connexion, etc.)
			if isTemporaryError(err) {
				if log != nil {
					log.Error().Err(err).Msg("Temporary error storing document")
				}
				return c.Status(fiber.StatusServiceUnavailable).JSON(errorTemporary(err))
			}

			// Sinon, erreur permanente
			if log != nil {
				log.Error().Err(err).Msg("Permanent error storing document")
			}
			return c.Status(fiber.StatusBadRequest).JSON(errorPermanent(err))
		}

		// Récupérer le document depuis la DB pour obtenir evidence_jws et ledger_hash
		// Ajouter un retry pour gérer les problèmes de timing (isolation de transaction, réplication, etc.)
		var storedDoc *models.Document
		maxRetries := 3
		retryDelay := 100 * time.Millisecond
		var retrieveErr error

		for attempt := 0; attempt < maxRetries; attempt++ {
			storedDoc, retrieveErr = db.GetDocumentByID(ctx, docID)
			if retrieveErr == nil {
				break // Succès
			}

			// Si c'est la dernière tentative, on sort de la boucle
			if attempt == maxRetries-1 {
				break
			}

			// Attendre avant de réessayer (backoff exponentiel)
			if log != nil {
				log.Debug().
					Err(retrieveErr).
					Str("document_id", docID.String()).
					Int("attempt", attempt+1).
					Msg("Retrying document retrieval after storage")
			}
			time.Sleep(retryDelay)
			retryDelay *= 2 // Backoff exponentiel
		}

		if retrieveErr != nil {
			// Vérifier si c'est vraiment "document not found" ou une autre erreur
			if retrieveErr.Error() == "document not found" {
				// ⚠️ CRITIQUE : Le document n'existe pas malgré le stockage réussi
				if log != nil {
					log.Error().
						Err(retrieveErr).
						Str("document_id", docID.String()).
						Str("sha256", sha256Hex).
						Str("tenant", tenant).
						Msg("CRITICAL: Document stored but not found in database - possible transaction rollback")
				}
				// Retourner une erreur temporaire pour permettre un retry côté client
				return c.Status(fiber.StatusInternalServerError).JSON(errorTemporary(
					fmt.Errorf("document stored but verification failed - please retry"),
				))
			}

			// Autre erreur (timeout, connexion, etc.) - retourner une réponse partielle avec avertissement
			if log != nil {
				log.Warn().
					Err(retrieveErr).
					Str("document_id", docID.String()).
					Str("sha256", sha256Hex).
					Msg("Failed to retrieve document after storage (non-critical error)")
			}
			// Retourner une réponse partielle avec un avertissement
			return c.Status(fiber.StatusCreated).JSON(fiber.Map{
				"id":         docID.String(),
				"sha256_hex": sha256Hex,
				"created_at": doc.CreatedAt.Format(time.RFC3339),
				"message":    "Document vaulted successfully (verification pending)",
				"warning":    "Document verification failed - please verify document existence",
			})
		}

		// Succès - logger avec correlation_id et tenant si présents (DVIG traçabilité)
		if log != nil {
			logEntry := log.Info().
				Str("document_id", docID.String()).
				Str("sha256", sha256Hex)
			if correlationID != "" {
				logEntry = logEntry.Str("correlation_id", correlationID)
			}
			if tenant != "" {
				logEntry = logEntry.Str("tenant", tenant)
			}
			logEntry.Msg("Document pushed successfully")
		}

		// Succès - retourner la réponse conforme à la documentation
		response := fiber.Map{
			"id":         storedDoc.ID.String(),
			"sha256_hex": storedDoc.SHA256Hex,
			"created_at": storedDoc.CreatedAt.Format(time.RFC3339),
			"message":    "Document vaulted successfully",
		}
		if storedDoc.EvidenceJWS != nil && *storedDoc.EvidenceJWS != "" {
			response["evidence_jws"] = *storedDoc.EvidenceJWS
		}
		if storedDoc.LedgerHash != nil && *storedDoc.LedgerHash != "" {
			response["ledger_hash"] = *storedDoc.LedgerHash
		}
		return c.Status(fiber.StatusCreated).JSON(response)
	}
}

// isTemporaryError détermine si une erreur est temporaire (retryable)
func isTemporaryError(err error) bool {
	if err == nil {
		return false
	}

	errStr := err.Error()

	// Erreurs temporaires typiques
	temporaryPatterns := []string{
		"timeout",
		"deadline exceeded",
		"connection",
		"network",
		"temporary",
		"unavailable",
		"busy",
		"locked",
		"context canceled",
	}

	errLower := errStr
	for _, pattern := range temporaryPatterns {
		if containsIgnoreCase(errLower, pattern) {
			return true
		}
	}

	// Vérifier si c'est une ErrTemporary
	if _, ok := err.(*ErrTemporary); ok {
		return true
	}

	return false
}

// containsIgnoreCase vérifie si une chaîne contient une sous-chaîne (insensible à la casse)
func containsIgnoreCase(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 ||
		containsIgnoreCaseHelper(s, substr))
}

func containsIgnoreCaseHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		match := true
		for j := 0; j < len(substr); j++ {
			if toLower(s[i+j]) != toLower(substr[j]) {
				match = false
				break
			}
		}
		if match {
			return true
		}
	}
	return false
}

func toLower(c byte) byte {
	if c >= 'A' && c <= 'Z' {
		return c + 32
	}
	return c
}
