package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/ledger"
	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/google/uuid"
)

// PaymentsServiceInterface définit les opérations du service Payments
type PaymentsServiceInterface interface {
	Ingest(ctx context.Context, input PaymentInput) (*PaymentResult, error)
}

// PaymentsService gère l'ingestion des paiements
type PaymentsService struct {
	repo   storage.DocumentRepository // Interface, pas *storage.DB
	ledger ledger.Service              // Interface
	signer crypto.Signer
}

// Vérifier que PaymentsService implémente PaymentsServiceInterface
var _ PaymentsServiceInterface = (*PaymentsService)(nil)

// NewPaymentsService crée un nouveau service Payments
func NewPaymentsService(
	repo storage.DocumentRepository,
	ledger ledger.Service,
	signer crypto.Signer,
) *PaymentsService {
	return &PaymentsService{
		repo:   repo,
		ledger: ledger,
		signer: signer,
	}
}

// PaymentResult représente le résultat de l'ingestion d'un paiement
type PaymentResult struct {
	ID          uuid.UUID
	Tenant      string
	SHA256Hex   string
	LedgerHash  *string
	EvidenceJWS *string
	CreatedAt   time.Time
}

// Ingest ingère un paiement avec idempotence basée sur le hash SHA256 du payload complet
func (s *PaymentsService) Ingest(ctx context.Context, input PaymentInput) (*PaymentResult, error) {
	// 1. Construire le payload complet pour le hash (idempotence)
	fullPayload := map[string]interface{}{
		"tenant":            input.Tenant,
		"source_system":     input.SourceSystem,
		"source_model":      input.SourceModel,
		"source_id":         input.SourceID,
		"payment_date":      input.PaymentDate,
		"amount":            input.Amount,
		"currency":          input.Currency,
		"method":            input.Method,
		"source":            input.Source,
		"payment_direction": input.PaymentDirection,
		"is_refund":         input.IsRefund,
		"company_id":        input.CompanyID,
		"payment":           input.Payment,
	}

	// 2. Marshal et canonicaliser le payload complet
	fullPayloadBytes, err := json.Marshal(fullPayload)
	if err != nil {
		return nil, fmt.Errorf("marshal payload: %w", err)
	}

	canonicalBytes, err := utils.CanonicalizeJSON(fullPayloadBytes)
	if err != nil {
		return nil, fmt.Errorf("canonicalize JSON: %w", err)
	}

	// 3. Calculer SHA256 pour idempotence
	hash := sha256.Sum256(canonicalBytes)
	sha256Hex := hex.EncodeToString(hash[:])

	// 4. Vérifier idempotence (par sha256)
	existingDoc, err := s.repo.GetDocumentBySHA256(ctx, sha256Hex)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing document: %w", err)
	}
	if existingDoc != nil {
		// Document déjà existant (idempotence)
		return &PaymentResult{
			ID:          existingDoc.ID,
			Tenant:      input.Tenant,
			SHA256Hex:   existingDoc.SHA256Hex,
			LedgerHash:  existingDoc.LedgerHash,
			EvidenceJWS: existingDoc.EvidenceJWS,
			CreatedAt:   existingDoc.CreatedAt,
		}, nil
	}

	// 5. Valider le format de date (déjà fait dans le handler, mais on vérifie ici aussi)
	if _, err := time.Parse(time.RFC3339, input.PaymentDate); err != nil {
		return nil, fmt.Errorf("invalid payment_date format (must be RFC3339): %w", err)
	}

	// 6. Créer le document
	docID := uuid.New()
	source := "payment"
	now := time.Now()

	doc := &models.Document{
		ID:           docID,
		Filename:     fmt.Sprintf("payment-%s.json", input.SourceID),
		ContentType:  "application/json",
		SizeBytes:    int64(len(canonicalBytes)),
		SHA256Hex:    sha256Hex,
		StoredPath:   "", // Pas de fichier, stockage en DB uniquement
		CreatedAt:    now,
		Source:       &source,
		OdooModel:    &input.SourceModel,
		SourceIDText: &input.SourceID,
		OdooID:       &input.CompanyID,
		PayloadJSON:  canonicalBytes, // JSON complet canonicalisé pour stockage
		Currency:     &input.Currency,
	}

	// 7. Construire le payload Evidence et signer
	evidencePayload := crypto.EvidencePayload{
		DocumentID: docID.String(),
		Sha256:     sha256Hex,
		Timestamp:  now.UTC().Format(time.RFC3339),
	}
	evidenceBytes, err := json.Marshal(evidencePayload)
	if err != nil {
		return nil, fmt.Errorf("marshal evidence payload: %w", err)
	}

	signature, err := s.signer.SignPayload(ctx, evidenceBytes)
	if err != nil {
		return nil, fmt.Errorf("sign evidence: %w", err)
	}
	evidenceJWS := signature.JWS

	// 8. Insérer le document avec evidence via le repository
	// Le repository gère la transaction, l'insertion, l'ajout au ledger et la mise à jour
	err = s.repo.InsertDocumentWithEvidence(ctx, doc, evidenceJWS, s.ledger)
	if err != nil {
		return nil, fmt.Errorf("insert document: %w", err)
	}

	// 9. Récupérer le ledger_hash depuis le document (mis à jour par le repository)
	var ledgerHash *string
	if doc.LedgerHash != nil {
		ledgerHash = doc.LedgerHash
	}

	return &PaymentResult{
		ID:          docID,
		Tenant:      input.Tenant,
		SHA256Hex:   sha256Hex,
		LedgerHash:  ledgerHash,
		EvidenceJWS: &evidenceJWS,
		CreatedAt:   now,
	}, nil
}

