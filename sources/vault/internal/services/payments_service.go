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

// PaymentResult représente le résultat de l'ingestion d'un paiement
type PaymentResult struct {
	ID          uuid.UUID
	Tenant      string
	SHA256Hex   string
	LedgerHash  *string
	EvidenceJWS *string
	CreatedAt   time.Time
}

// PaymentsServiceInterface définit les opérations du service Payments
type PaymentsServiceInterface interface {
	Ingest(ctx context.Context, input PaymentInput) (*PaymentResult, error)
}

// PaymentsService gère l'ingestion des paiements (account.payment, pos.payment)
type PaymentsService struct {
	repo   storage.DocumentRepository
	ledger ledger.Service
	signer crypto.Signer
}

// Vérifier que PaymentsService implémente PaymentsServiceInterface
var _ PaymentsServiceInterface = (*PaymentsService)(nil)

// NewPaymentsService crée un nouveau service Payments
func NewPaymentsService(
	repo storage.DocumentRepository,
	ledgerSvc ledger.Service,
	signer crypto.Signer,
) *PaymentsService {
	return &PaymentsService{
		repo:   repo,
		ledger: ledgerSvc,
		signer: signer,
	}
}

// Ingest ingère un paiement avec idempotence (par idempotency_key ou SHA256)
func (s *PaymentsService) Ingest(ctx context.Context, input PaymentInput) (*PaymentResult, error) {
	// Validation date
	if _, err := time.Parse(time.RFC3339, input.PaymentDate); err != nil {
		return nil, fmt.Errorf("invalid payment_date format (must be RFC3339): %w", err)
	}

	// Idempotence par idempotency_key (priorité)
	if input.IdempotencyKey != "" {
		existing, err := s.repo.GetDocumentByIdempotencyKey(ctx, input.Tenant, input.IdempotencyKey)
		if err != nil {
			return nil, fmt.Errorf("failed to check existing document: %w", err)
		}
		if existing != nil {
			result := &PaymentResult{
				ID:          existing.ID,
				Tenant:      input.Tenant,
				SHA256Hex:   existing.SHA256Hex,
				LedgerHash:  existing.LedgerHash,
				EvidenceJWS: existing.EvidenceJWS,
				CreatedAt:   existing.CreatedAt,
			}
			return result, nil
		}
	}

	// Hash pour idempotence (canonical JSON du payload)
	hashInput := map[string]interface{}{
		"tenant":            input.Tenant,
		"source_model":      input.SourceModel,
		"source_id":         input.SourceID,
		"payment_date":     input.PaymentDate,
		"amount":            input.Amount,
		"currency":          input.Currency,
		"source":           input.Source,
		"payment_direction": input.PaymentDirection,
		"is_refund":        input.IsRefund,
		"payment":          input.Payment,
	}
	hashBytes, err := json.Marshal(hashInput)
	if err != nil {
		return nil, fmt.Errorf("marshal hash input: %w", err)
	}
	canonicalBytes, err := utils.CanonicalizeJSON(hashBytes)
	if err != nil {
		return nil, fmt.Errorf("canonicalize JSON: %w", err)
	}
	hash := sha256.Sum256(canonicalBytes)
	sha256Hex := hex.EncodeToString(hash[:])

	// Vérifier idempotence par SHA256
	existingDoc, err := s.repo.GetDocumentBySHA256(ctx, sha256Hex)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing document: %w", err)
	}
	if existingDoc != nil {
		return &PaymentResult{
			ID:          existingDoc.ID,
			Tenant:      input.Tenant,
			SHA256Hex:   existingDoc.SHA256Hex,
			LedgerHash:  existingDoc.LedgerHash,
			EvidenceJWS: existingDoc.EvidenceJWS,
			CreatedAt:   existingDoc.CreatedAt,
		}, nil
	}

	// Construire le payload complet pour stockage
	fullPayload := map[string]interface{}{
		"tenant":             input.Tenant,
		"source_system":      input.SourceSystem,
		"source_model":       input.SourceModel,
		"source_id":          input.SourceID,
		"payment_date":       input.PaymentDate,
		"amount":             input.Amount,
		"currency":           input.Currency,
		"method":             input.Method,
		"source":             input.Source,
		"payment_direction":  input.PaymentDirection,
		"is_refund":          input.IsRefund,
		"company_id":         input.CompanyID,
		"payment":            input.Payment,
		"idempotency_key":    input.IdempotencyKey,
		"business_source":    input.BusinessSource,
		"technical_source":  input.TechnicalSource,
		"company_name":      input.CompanyName,
		"company_id_string": input.CompanyIDString,
		"allocations":        input.Allocations,
	}
	payloadBytes, err := json.Marshal(fullPayload)
	if err != nil {
		return nil, fmt.Errorf("marshal payload: %w", err)
	}
	canonicalPayload, err := utils.CanonicalizeJSON(payloadBytes)
	if err != nil {
		return nil, fmt.Errorf("canonicalize payload: %w", err)
	}

	// Créer le document
	docID := uuid.New()
	now := time.Now()
	source := "payment"
	sourceModel := input.SourceModel
	sourceID := input.SourceID

	amountSigned := input.Amount
	if input.PaymentDirection == "outbound" || input.IsRefund {
		amountSigned = -input.Amount
	}

	doc := &models.Document{
		ID:           docID,
		Filename:     fmt.Sprintf("payment-%s.json", input.SourceID),
		ContentType:  "application/json",
		SizeBytes:    int64(len(canonicalPayload)),
		SHA256Hex:    sha256Hex,
		StoredPath:   "",
		CreatedAt:    now,
		Source:       &source,
		OdooModel:    &sourceModel,
		SourceIDText: &sourceID,
		PayloadJSON:  canonicalPayload,
		AmountSigned: &amountSigned,
	}
	if input.Tenant != "" {
		doc.Tenant = &input.Tenant
	}
	if input.IdempotencyKey != "" {
		doc.IdempotencyKey = &input.IdempotencyKey
	}
	if input.CompanyIDString != "" {
		doc.CompanyID = &input.CompanyIDString
	} else if input.CompanyID > 0 {
		s := fmt.Sprintf("odoo:%d", input.CompanyID)
		doc.CompanyID = &s
	}

	// Signer l'evidence
	evidencePayload := crypto.EvidencePayload{
		DocumentID: docID.String(),
		Sha256:     sha256Hex,
		Timestamp:  now.UTC().Format(time.RFC3339),
	}
	evidenceBytes, err := json.Marshal(evidencePayload)
	if err != nil {
		return nil, fmt.Errorf("marshal evidence: %w", err)
	}
	signature, err := s.signer.SignPayload(ctx, evidenceBytes)
	if err != nil {
		return nil, fmt.Errorf("sign evidence: %w", err)
	}
	evidenceJWS := signature.JWS

	// Insérer via le repository
	err = s.repo.InsertDocumentWithEvidence(ctx, doc, evidenceJWS, s.ledger)
	if err != nil {
		return nil, fmt.Errorf("insert document: %w", err)
	}

	ledgerHashPtr := doc.LedgerHash
	return &PaymentResult{
		ID:          docID,
		Tenant:      input.Tenant,
		SHA256Hex:   sha256Hex,
		LedgerHash:  ledgerHashPtr,
		EvidenceJWS: &evidenceJWS,
		CreatedAt:   now,
	}, nil
}
