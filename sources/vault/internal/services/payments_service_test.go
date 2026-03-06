package services

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestPaymentsService_Ingest_Success(t *testing.T) {
	repo := new(MockDocumentRepository)
	ledgerSvc := new(MockLedgerService)
	signer := new(MockSigner)

	service := NewPaymentsService(repo, ledgerSvc, signer)

	input := PaymentInput{
		Tenant:           "test-tenant",
		SourceSystem:     "odoo",
		SourceModel:      "account.payment",
		SourceID:         "PAY/001",
		PaymentDate:      "2025-01-18T10:00:00Z",
		Amount:           100.50,
		Currency:         "EUR",
		Method:           "cash",
		Source:           "pos",
		PaymentDirection: "inbound",
		IsRefund:         false,
		CompanyID:        1,
		Payment: map[string]interface{}{
			"pos_order_ref": "ORDER/001",
			"session_id":    "SESSION/001",
		},
	}

	ctx := context.Background()

	// Mock : document n'existe pas encore
	repo.On("GetDocumentBySHA256", ctx, mock.AnythingOfType("string")).Return(nil, nil)

	// Mock : signature JWS
	signature := &crypto.Signature{
		JWS: "test-jws-token",
		KID: "test-kid",
	}
	signer.On("SignPayload", ctx, mock.AnythingOfType("[]uint8")).Return(signature, nil)

	// Mock : insertion document
	repo.On("InsertDocumentWithEvidence", ctx, mock.AnythingOfType("*models.Document"), "test-jws-token", ledgerSvc).Return(nil)

	result, err := service.Ingest(ctx, input)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "test-tenant", result.Tenant)
	assert.NotEmpty(t, result.SHA256Hex)
	assert.NotNil(t, result.EvidenceJWS)
	assert.Equal(t, "test-jws-token", *result.EvidenceJWS)

	repo.AssertExpectations(t)
	ledgerSvc.AssertExpectations(t)
	signer.AssertExpectations(t)
}

func TestPaymentsService_Ingest_Idempotent(t *testing.T) {
	repo := new(MockDocumentRepository)
	ledgerSvc := new(MockLedgerService)
	signer := new(MockSigner)

	service := NewPaymentsService(repo, ledgerSvc, signer)

	input := PaymentInput{
		Tenant:           "test-tenant",
		SourceSystem:     "odoo",
		SourceModel:      "account.payment",
		SourceID:         "PAY/001",
		PaymentDate:      "2025-01-18T10:00:00Z",
		Amount:           100.50,
		Currency:         "EUR",
		Method:           "cash",
		Source:           "pos",
		PaymentDirection: "inbound",
		IsRefund:         false,
		CompanyID:        1,
		Payment: map[string]interface{}{
			"pos_order_ref": "ORDER/001",
		},
	}

	ctx := context.Background()
	existingID := uuid.New()
	existingDoc := &models.Document{
		ID:          existingID,
		SHA256Hex:   "existing-hash",
		EvidenceJWS: stringPtr("existing-jws"),
		CreatedAt:   time.Now().Add(-1 * time.Hour),
	}

	// Mock : document existe déjà
	repo.On("GetDocumentBySHA256", ctx, mock.AnythingOfType("string")).Return(existingDoc, nil)

	result, err := service.Ingest(ctx, input)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, existingID, result.ID)
	assert.Equal(t, "existing-hash", result.SHA256Hex)
	assert.Equal(t, "existing-jws", *result.EvidenceJWS)

	// Vérifier que InsertDocumentWithEvidence n'a pas été appelé
	repo.AssertNotCalled(t, "InsertDocumentWithEvidence", ctx, mock.Anything, mock.Anything, mock.Anything)
	signer.AssertNotCalled(t, "SignPayload", ctx, mock.Anything)
}

func TestPaymentsService_Ingest_IdempotentByKey(t *testing.T) {
	// Step 1 : idempotence par idempotency_key (priorité sur SHA256)
	repo := new(MockDocumentRepository)
	ledgerSvc := new(MockLedgerService)
	signer := new(MockSigner)
	service := NewPaymentsService(repo, ledgerSvc, signer)

	input := PaymentInput{
		Tenant:           "test-tenant",
		SourceModel:       "account.payment",
		SourceID:          "42",
		PaymentDate:       "2025-01-18T10:00:00Z",
		Amount:            50,
		Currency:          "EUR",
		Method:            "transfer",
		Source:            "account",
		PaymentDirection:  "inbound",
		IsRefund:          false,
		CompanyID:         1,
		Payment:           map[string]interface{}{"name": "PAY/001"},
		IdempotencyKey:    "tenant|odoo_account|account.payment|42",
	}

	ctx := context.Background()
	existingID := uuid.New()
	existingDoc := &models.Document{
		ID:          existingID,
		Tenant:      stringPtr("test-tenant"),
		SHA256Hex:   "old-hash",
		LedgerHash:  stringPtr("ledger-1"),
		EvidenceJWS: stringPtr("old-jws"),
		CreatedAt:   time.Now().Add(-2 * time.Hour),
	}

	repo.On("GetDocumentByIdempotencyKey", ctx, "test-tenant", input.IdempotencyKey).Return(existingDoc, nil)

	result, err := service.Ingest(ctx, input)
	require.NoError(t, err)
	assert.Equal(t, existingID, result.ID)
	assert.Equal(t, "old-hash", result.SHA256Hex)
	assert.Equal(t, "old-jws", *result.EvidenceJWS)
	repo.AssertNotCalled(t, "GetDocumentBySHA256", ctx, mock.Anything)
	repo.AssertNotCalled(t, "InsertDocumentWithEvidence", ctx, mock.Anything, mock.Anything, mock.Anything)
}

func TestPaymentsService_Ingest_InvalidDate(t *testing.T) {
	repo := new(MockDocumentRepository)
	ledgerSvc := new(MockLedgerService)
	signer := new(MockSigner)

	service := NewPaymentsService(repo, ledgerSvc, signer)

	input := PaymentInput{
		Tenant:           "test-tenant",
		SourceSystem:     "odoo",
		SourceModel:      "account.payment",
		SourceID:         "PAY/001",
		PaymentDate:      "invalid-date",
		Amount:           100.50,
		Currency:         "EUR",
		Method:           "cash",
		Source:           "pos",
		PaymentDirection: "inbound",
		IsRefund:         false,
		CompanyID:        1,
		Payment:          map[string]interface{}{},
	}

	ctx := context.Background()

	// Mock : document n'existe pas encore
	repo.On("GetDocumentBySHA256", ctx, mock.AnythingOfType("string")).Return(nil, nil)

	result, err := service.Ingest(ctx, input)

	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "invalid payment_date format")
}

func TestPaymentsService_Ingest_RepositoryError(t *testing.T) {
	repo := new(MockDocumentRepository)
	ledgerSvc := new(MockLedgerService)
	signer := new(MockSigner)

	service := NewPaymentsService(repo, ledgerSvc, signer)

	input := PaymentInput{
		Tenant:           "test-tenant",
		SourceSystem:     "odoo",
		SourceModel:      "account.payment",
		SourceID:         "PAY/001",
		PaymentDate:      "2025-01-18T10:00:00Z",
		Amount:           100.50,
		Currency:         "EUR",
		Method:           "cash",
		Source:           "pos",
		PaymentDirection: "inbound",
		IsRefund:         false,
		CompanyID:        1,
		Payment:          map[string]interface{}{},
	}

	ctx := context.Background()

	// Mock : erreur lors de la vérification d'existence
	repo.On("GetDocumentBySHA256", ctx, mock.AnythingOfType("string")).Return(nil, errors.New("database error"))

	result, err := service.Ingest(ctx, input)

	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "failed to check existing document")
}

// Helper functions (partagées avec pos_tickets_service_test.go)
// Note: Ces fonctions sont définies dans pos_tickets_service_test.go
// pour éviter les duplications, on les réutilise depuis ce fichier
