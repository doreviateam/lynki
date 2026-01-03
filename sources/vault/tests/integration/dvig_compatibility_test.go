package integration

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/audit"
	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/doreviateam/dorevia-vault/internal/ledger"
	"github.com/doreviateam/dorevia-vault/internal/services"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/pkg/logger"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// encodeTestPDF crée un PDF minimal encodé en base64 pour les tests
func encodeTestPDF() string {
	// PDF minimal valide
	pdfContent := []byte("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\ntrailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n9\n%%EOF")
	return base64.StdEncoding.EncodeToString(pdfContent)
}

// ============================================================================
// TEST A : Payload avec champs DVIG
// ============================================================================

// TestInvoicesHandler_WithDVIGFields teste que l'API accepte les payloads enrichis par DVIG
func TestInvoicesHandler_WithDVIGFields(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)

	// Créer l'application Fiber
	app := fiber.New()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		MaxUploadSizeBytes: 10 * 1024 * 1024,
		JWSEnabled:         true,
		JWSRequired:        false,
		LedgerEnabled:      true,
	}
	log := logger.New("error")
	auditLogger := setupTestAuditLogger(t)

	app.Post("/api/v1/invoices", handlers.InvoicesHandler(
		db, "/tmp/test-storage", jwsService, cfg, log, auditLogger, nil))

	// Payload avec champs DVIG
	payload := map[string]interface{}{
		"source": "sales",
		"model":  "account.move",
		"odoo_id": 123,
		"state":  "posted",
		"file":   encodeTestPDF(),
		"meta": map[string]interface{}{
			"name":           "FAC/2025/00123",
			"tenant":         "doreviateam",
			"correlation_id": "550e8400-e29b-41d4-a716-446655440000",
			"dvig_version":   "1.1.0",
			"timestamp":     "2025-11-26T10:30:00Z",
			"dvig_signature": "abc123def456...",
			"source_ip":     "192.168.1.100",
			"user_agent":    "DVIG/1.1.0",
		},
	}

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewBuffer(payloadJSON))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	require.NoError(t, err)

	// Vérifier que la réponse est 200 OK (ou 201 Created)
	assert.True(t, resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated,
		"Expected 200 or 201, got %d", resp.StatusCode)

	// Vérifier que la réponse contient un JSON valide
	var response handlers.InvoiceResponse
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err, "Response should be valid JSON")

	// Vérifier que le document a été créé
	assert.NotEmpty(t, response.ID, "Document ID should not be empty")
	assert.NotEmpty(t, response.SHA256Hex, "SHA256 should not be empty")
}

// TestPaymentsHandler_WithDVIGFields teste que l'API payments accepte les champs DVIG
func TestPaymentsHandler_WithDVIGFields(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)

	// Créer les services
	repo := storage.NewPostgresRepository(db.Pool, logger.New("error"))
	ledgerService := ledger.NewService()
	signer := crypto.NewLocalSigner(jwsService)
	paymentsService := services.NewPaymentsService(repo, ledgerService, signer)

	// Créer l'application Fiber
	app := fiber.New()
	cfg := &config.Config{PaymentMaxSizeBytes: 65536}
	log := logger.New("error")

	app.Post("/api/v1/payments", handlers.PaymentsHandler(paymentsService, cfg, log))

	// Payload avec champs DVIG dans meta (si le handler supporte meta)
	payload := handlers.PaymentPayload{
		Tenant:           "test-tenant",
		SourceSystem:     "odoo",
		SourceModel:      "account.payment",
		SourceID:         "PAY/TEST/001",
		PaymentDate:      "2025-11-26T10:30:00Z",
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
			// Champs DVIG dans payment (si supporté)
			"correlation_id": "550e8400-e29b-41d4-a716-446655440000",
			"dvig_version":   "1.1.0",
		},
	}

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/payments", bytes.NewBuffer(payloadJSON))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant", "test-tenant")

	resp, err := app.Test(req)
	require.NoError(t, err)

	// Vérifier que la réponse est 201 Created
	assert.Equal(t, http.StatusCreated, resp.StatusCode, "Expected 201, got %d", resp.StatusCode)

	var response handlers.PaymentResponse
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err)

	assert.NotEmpty(t, response.ID)
	assert.NotEmpty(t, response.SHA256Hex)
}

// TestPosTicketsHandler_WithDVIGFields teste que l'API pos-tickets accepte les champs DVIG
func TestPosTicketsHandler_WithDVIGFields(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)

	// Créer les services
	repo := storage.NewPostgresRepository(db.Pool, logger.New("error"))
	ledgerService := ledger.NewService()
	signer := crypto.NewLocalSigner(jwsService)
	posTicketsService := services.NewPosTicketsService(repo, ledgerService, signer)

	// Créer l'application Fiber
	app := fiber.New()
	cfg := &config.Config{PosTicketMaxSizeBytes: 65536}
	log := logger.New("error")

	app.Post("/api/v1/pos-tickets", handlers.PosTicketsHandler(posTicketsService, cfg, log))

	// Payload avec champs DVIG (dans ticket si supporté)
	currency := "EUR"
	payload := handlers.PosTicketPayload{
		Tenant:      "test-tenant",
		SourceModel: "pos.order",
		SourceID:    "POS/2025/0001",
		Currency:    &currency,
		Ticket: map[string]interface{}{
			"lines": []map[string]interface{}{
				{"product": "Test Product", "quantity": 1, "unit_price": 10.0},
			},
			"payments": []map[string]interface{}{
				{"method": "cash", "amount": 10.0},
			},
			// Champs DVIG dans ticket (si supporté)
			"correlation_id": "550e8400-e29b-41d4-a716-446655440000",
			"dvig_version":   "1.1.0",
		},
	}

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/pos-tickets", bytes.NewBuffer(payloadJSON))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	require.NoError(t, err)

	// Vérifier que la réponse est 201 Created
	assert.Equal(t, http.StatusCreated, resp.StatusCode, "Expected 201, got %d", resp.StatusCode)

	var response handlers.PosTicketResponse
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err)

	assert.NotEmpty(t, response.ID)
	assert.NotEmpty(t, response.SHA256Hex)
}

// TestPushDocumentHandler_WithDVIGFields teste que l'API push_document accepte les champs DVIG
func TestPushDocumentHandler_WithDVIGFields(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)

	// Créer l'application Fiber
	app := fiber.New()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		JWSEnabled:         false,
		LedgerEnabled:      false,
	}
	log := logger.New("error")

	app.Post("/api/v1/push_document", handlers.PushDocumentHandler(
		db, "/tmp/test-storage", jwsService, cfg, log))

	// Payload avec champs DVIG dans meta
	payload := map[string]interface{}{
		"file":     encodeTestPDF(),
		"filename": "test.pdf",
		"meta": map[string]interface{}{
			"tenant":         "doreviateam",
			"correlation_id": "550e8400-e29b-41d4-a716-446655440000",
			"dvig_version":   "1.1.0",
			"timestamp":     "2025-11-26T10:30:00Z",
		},
	}

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/push_document", bytes.NewBuffer(payloadJSON))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	require.NoError(t, err)

	// Vérifier que la réponse est 200 OK
	assert.Equal(t, http.StatusOK, resp.StatusCode, "Expected 200, got %d", resp.StatusCode)

	// Vérifier que la réponse contient un JSON valide
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err, "Response should be valid JSON")

	// Vérifier le format de réponse
	assert.Equal(t, "success", response["status"])
	assert.NotEmpty(t, response["document_id"])
	assert.NotEmpty(t, response["hash"])
}

// ============================================================================
// TEST B : Payload sans champs DVIG (rétrocompatibilité)
// ============================================================================

// TestInvoicesHandler_WithoutDVIGFields teste la rétrocompatibilité
func TestInvoicesHandler_WithoutDVIGFields(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)

	// Créer l'application Fiber
	app := fiber.New()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		MaxUploadSizeBytes: 10 * 1024 * 1024,
		JWSEnabled:         true,
		JWSRequired:        false,
		LedgerEnabled:      true,
	}
	log := logger.New("error")
	auditLogger := setupTestAuditLogger(t)

	app.Post("/api/v1/invoices", handlers.InvoicesHandler(
		db, "/tmp/test-storage", jwsService, cfg, log, auditLogger, nil))

	// Payload classique sans champs DVIG
	payload := map[string]interface{}{
		"source": "sales",
		"model":  "account.move",
		"odoo_id": 123,
		"state":  "posted",
		"file":   encodeTestPDF(),
		"meta": map[string]interface{}{
			"name": "FAC/2025/00123",
		},
	}

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewBuffer(payloadJSON))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	require.NoError(t, err)

	// Vérifier que la réponse est 200 OK (rétrocompatibilité maintenue)
	assert.True(t, resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated,
		"Expected 200 or 201, got %d", resp.StatusCode)

	var response handlers.InvoiceResponse
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err)

	assert.NotEmpty(t, response.ID)
	assert.NotEmpty(t, response.SHA256Hex)
}

// TestPaymentsHandler_WithoutDVIGFields teste la rétrocompatibilité payments
func TestPaymentsHandler_WithoutDVIGFields(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)

	repo := storage.NewPostgresRepository(db.Pool, logger.New("error"))
	ledgerService := ledger.NewService()
	signer := crypto.NewLocalSigner(jwsService)
	paymentsService := services.NewPaymentsService(repo, ledgerService, signer)

	app := fiber.New()
	cfg := &config.Config{PaymentMaxSizeBytes: 65536}
	log := logger.New("error")

	app.Post("/api/v1/payments", handlers.PaymentsHandler(paymentsService, cfg, log))

	// Payload classique sans champs DVIG
	payload := handlers.PaymentPayload{
		Tenant:           "test-tenant",
		SourceSystem:     "odoo",
		SourceModel:      "account.payment",
		SourceID:         "PAY/TEST/002",
		PaymentDate:      "2025-11-26T10:30:00Z",
		Amount:           100.50,
		Currency:         "EUR",
		Method:           "cash",
		Source:           "pos",
		PaymentDirection: "inbound",
		IsRefund:         false,
		CompanyID:        1,
		Payment: map[string]interface{}{
			"pos_order_ref": "ORDER/002",
		},
	}

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/payments", bytes.NewBuffer(payloadJSON))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant", "test-tenant")

	resp, err := app.Test(req)
	require.NoError(t, err)

	assert.Equal(t, http.StatusCreated, resp.StatusCode)
}

// ============================================================================
// TEST C : Payload avec champs totalement inconnus
// ============================================================================

// TestInvoicesHandler_WithUnknownFields teste la tolérance aux champs inconnus
func TestInvoicesHandler_WithUnknownFields(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)

	app := fiber.New()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		MaxUploadSizeBytes: 10 * 1024 * 1024,
		JWSEnabled:         true,
		JWSRequired:        false,
		LedgerEnabled:      true,
	}
	log := logger.New("error")
	auditLogger := setupTestAuditLogger(t)

	app.Post("/api/v1/invoices", handlers.InvoicesHandler(
		db, "/tmp/test-storage", jwsService, cfg, log, auditLogger, nil))

	// Payload avec champs totalement inconnus dans meta
	payload := map[string]interface{}{
		"source": "sales",
		"model":  "account.move",
		"odoo_id": 123,
		"state":  "posted",
		"file":   encodeTestPDF(),
		"meta": map[string]interface{}{
			"name":            "FAC/2025/00123",
			"unknown_field_xyz": "should_be_ignored",
			"another_unknown":   12345,
			"yet_another":       map[string]interface{}{"nested": "value"},
		},
	}

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewBuffer(payloadJSON))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	require.NoError(t, err)

	// Vérifier que la réponse est 200 OK (champs inconnus ignorés)
	assert.True(t, resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated,
		"Expected 200 or 201, got %d (champs inconnus doivent être ignorés)", resp.StatusCode)

	var response handlers.InvoiceResponse
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err, "Response should be valid JSON even with unknown fields")

	assert.NotEmpty(t, response.ID)
	assert.NotEmpty(t, response.SHA256Hex)
}

// TestPushDocumentHandler_WithUnknownFields teste la tolérance push_document
func TestPushDocumentHandler_WithUnknownFields(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)

	app := fiber.New()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		JWSEnabled:         false,
		LedgerEnabled:      false,
	}
	log := logger.New("error")

	app.Post("/api/v1/push_document", handlers.PushDocumentHandler(
		db, "/tmp/test-storage", jwsService, cfg, log))

	// Payload avec champs inconnus dans meta
	payload := map[string]interface{}{
		"file":     encodeTestPDF(),
		"filename": "test.pdf",
		"meta": map[string]interface{}{
			"unknown_field_xyz": "should_be_ignored",
			"another_unknown":   12345,
		},
	}

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/push_document", bytes.NewBuffer(payloadJSON))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	require.NoError(t, err)

	// Vérifier que la réponse est 200 OK
	assert.Equal(t, http.StatusOK, resp.StatusCode, "Expected 200, got %d", resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err)

	assert.Equal(t, "success", response["status"])
}

// ============================================================================
// Helpers
// ============================================================================

// setupTestAuditLogger crée un logger d'audit de test
func setupTestAuditLogger(t *testing.T) *audit.Logger {
	auditDir := "/tmp/test-audit"
	err := os.MkdirAll(auditDir, 0755)
	require.NoError(t, err)

	auditCfg := audit.Config{
		AuditDir:      auditDir,
		MaxBuffer:     100,
		FlushInterval: 1,
		Logger:        *logger.New("error"),
	}

	auditLogger, err := audit.NewLogger(auditCfg)
	if err != nil {
		t.Skipf("Audit logger not available: %v", err)
	}

	return auditLogger
}

