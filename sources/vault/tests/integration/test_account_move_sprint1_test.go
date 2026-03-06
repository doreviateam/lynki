package integration

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestAccountMoveValidation_ValidPayloads teste les validations account.move avec payloads valides
// AC-1 à AC-4 : out_invoice, in_invoice, out_refund, in_refund
func TestAccountMoveValidation_ValidPayloads(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	// Setup
	ctx := context.Background()
	logger := zerolog.Nop()
	db, err := storage.NewDB(ctx, dbURL, &logger)
	require.NoError(t, err)
	defer db.Close()

	storageDir := t.TempDir()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		JWSEnabled:         false,
		LedgerEnabled:      false,
	}

	app := fiber.New()
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, nil, cfg, &logger, nil, nil))

	// Test content - différents contenus pour éviter l'idempotence entre tests
	testContent1 := []byte("test invoice PDF content AC-1")
	testContent2 := []byte("test invoice PDF content AC-2")
	testContent3 := []byte("test invoice PDF content AC-3")
	testContent4 := []byte("test invoice PDF content AC-4")
	fileBase64_1 := base64.StdEncoding.EncodeToString(testContent1)
	fileBase64_2 := base64.StdEncoding.EncodeToString(testContent2)
	fileBase64_3 := base64.StdEncoding.EncodeToString(testContent3)
	fileBase64_4 := base64.StdEncoding.EncodeToString(testContent4)

	tests := []struct {
		name           string
		payload        map[string]interface{}
		expectedStatus int
	}{
		{
			name: "AC-1: out_invoice posted avec source sales",
			payload: map[string]interface{}{
				"source":  "sales",
				"model":   "account.move",
				"odoo_id": 123,
				"state":   "posted",
				"file":    fileBase64_1,
				"meta": map[string]interface{}{
					"move_type": "out_invoice",
					"tenant":    "test-tenant-1",
				},
			},
			expectedStatus: 201,
		},
		{
			name: "AC-2: in_invoice posted avec source purchase",
			payload: map[string]interface{}{
				"source":  "purchase",
				"model":   "account.move",
				"odoo_id": 124,
				"state":   "posted",
				"file":    fileBase64_2,
				"meta": map[string]interface{}{
					"move_type": "in_invoice",
					"tenant":    "test-tenant-1",
				},
			},
			expectedStatus: 201,
		},
		{
			name: "AC-3: out_refund posted avec source sales",
			payload: map[string]interface{}{
				"source":  "sales",
				"model":   "account.move",
				"odoo_id": 125,
				"state":   "posted",
				"file":    fileBase64_3,
				"meta": map[string]interface{}{
					"move_type": "out_refund",
					"tenant":    "test-tenant-1",
				},
			},
			expectedStatus: 201,
		},
		{
			name: "AC-4: in_refund posted avec source purchase",
			payload: map[string]interface{}{
				"source":  "purchase",
				"model":   "account.move",
				"odoo_id": 126,
				"state":   "posted",
				"file":    fileBase64_4,
				"meta": map[string]interface{}{
					"move_type": "in_refund",
					"tenant":    "test-tenant-1",
				},
			},
			expectedStatus: 201,
		},
	}

		for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			resp, err := app.Test(req)
			require.NoError(t, err)
			
			if resp.StatusCode != tt.expectedStatus {
				// Lire le body pour voir l'erreur
				bodyBytes, _ := io.ReadAll(resp.Body)
				t.Logf("Response status: %d", resp.StatusCode)
				t.Logf("Response body: %s", string(bodyBytes))
				
				var errorResp map[string]interface{}
				if err := json.Unmarshal(bodyBytes, &errorResp); err == nil {
					t.Logf("Error response: %+v", errorResp)
				}
			}
			
			assert.Equal(t, tt.expectedStatus, resp.StatusCode, "Expected status %d, got %d", tt.expectedStatus, resp.StatusCode)

			if resp.StatusCode == 201 {
				var result map[string]interface{}
				err := json.NewDecoder(resp.Body).Decode(&result)
				require.NoError(t, err)
				assert.NotEmpty(t, result["id"], "Document ID should be present")
				assert.NotEmpty(t, result["sha256_hex"], "SHA256 should be present")
			}
		})
	}
}

// TestAccountMoveValidation_InvalidState teste AC-5 et AC-6 : états invalides (draft, cancel)
func TestAccountMoveValidation_InvalidState(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	ctx := context.Background()
	logger := zerolog.Nop()
	db, err := storage.NewDB(ctx, dbURL, &logger)
	require.NoError(t, err)
	defer db.Close()

	storageDir := t.TempDir()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		JWSEnabled:         false,
		LedgerEnabled:      false,
	}

	app := fiber.New()
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, nil, cfg, &logger, nil, nil))

	testContent := []byte("test invoice PDF content")
	fileBase64 := base64.StdEncoding.EncodeToString(testContent)

	invalidStates := []string{"draft", "cancel", "paid", "done"}

	for _, state := range invalidStates {
		t.Run("state_"+state, func(t *testing.T) {
			payload := map[string]interface{}{
				"source":  "sales",
				"model":   "account.move",
				"odoo_id": 123,
				"state":   state,
				"file":    fileBase64,
				"meta": map[string]interface{}{
					"move_type": "out_invoice",
					"tenant":    "test-tenant",
				},
			}

			body, _ := json.Marshal(payload)
			req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			resp, err := app.Test(req)
			require.NoError(t, err)
			assert.Equal(t, 400, resp.StatusCode, "Expected 400 for invalid state '%s'", state)

			var errorResp map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&errorResp)
			require.NoError(t, err)
			assert.Contains(t, errorResp["error"].(string), "state must be 'posted'", "Error message should mention state validation")
		})
	}
}

// TestAccountMoveValidation_InvalidMoveType teste AC-7 : move_type invalide
func TestAccountMoveValidation_InvalidMoveType(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	ctx := context.Background()
	logger := zerolog.Nop()
	db, err := storage.NewDB(ctx, dbURL, &logger)
	require.NoError(t, err)
	defer db.Close()

	storageDir := t.TempDir()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		JWSEnabled:         false,
		LedgerEnabled:      false,
	}

	app := fiber.New()
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, nil, cfg, &logger, nil, nil))

	testContent := []byte("test invoice PDF content")
	fileBase64 := base64.StdEncoding.EncodeToString(testContent)

	invalidMoveTypes := []string{"invalid", "out_credit", "in_credit", ""}

	for _, moveType := range invalidMoveTypes {
		t.Run("move_type_"+moveType, func(t *testing.T) {
			payload := map[string]interface{}{
				"source":  "sales",
				"model":   "account.move",
				"odoo_id": 123,
				"state":   "posted",
				"file":    fileBase64,
				"meta": map[string]interface{}{
					"move_type": moveType,
					"tenant":    "test-tenant",
				},
			}

			body, _ := json.Marshal(payload)
			req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			resp, err := app.Test(req)
			require.NoError(t, err)
			assert.Equal(t, 400, resp.StatusCode, "Expected 400 for invalid move_type '%s'", moveType)

			var errorResp map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&errorResp)
			require.NoError(t, err)
			assert.Contains(t, errorResp["error"].(string), "move_type", "Error message should mention move_type validation")
		})
	}
}

// TestAccountMoveValidation_SourceMoveTypeMismatch teste AC-8 : source/move_type mismatch
func TestAccountMoveValidation_SourceMoveTypeMismatch(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	ctx := context.Background()
	logger := zerolog.Nop()
	db, err := storage.NewDB(ctx, dbURL, &logger)
	require.NoError(t, err)
	defer db.Close()

	storageDir := t.TempDir()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		JWSEnabled:         false,
		LedgerEnabled:      false,
	}

	app := fiber.New()
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, nil, cfg, &logger, nil, nil))

	testContent := []byte("test invoice PDF content")
	fileBase64 := base64.StdEncoding.EncodeToString(testContent)

	tests := []struct {
		name     string
		source   string
		moveType string
	}{
		{"out_invoice avec purchase", "purchase", "out_invoice"},
		{"in_invoice avec sales", "sales", "in_invoice"},
		{"out_refund avec purchase", "purchase", "out_refund"},
		{"in_refund avec sales", "sales", "in_refund"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payload := map[string]interface{}{
				"source":  tt.source,
				"model":   "account.move",
				"odoo_id": 123,
				"state":   "posted",
				"file":    fileBase64,
				"meta": map[string]interface{}{
					"move_type": tt.moveType,
					"tenant":    "test-tenant",
				},
			}

			body, _ := json.Marshal(payload)
			req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			resp, err := app.Test(req)
			require.NoError(t, err)
			assert.Equal(t, 400, resp.StatusCode, "Expected 400 for source/move_type mismatch")

			var errorResp map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&errorResp)
			require.NoError(t, err)
			assert.Contains(t, errorResp["error"].(string), "source", "Error message should mention source validation")
		})
	}
}

// TestAccountMoveValidation_MissingTenant teste AC-9 : tenant manquant
func TestAccountMoveValidation_MissingTenant(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	ctx := context.Background()
	logger := zerolog.Nop()
	db, err := storage.NewDB(ctx, dbURL, &logger)
	require.NoError(t, err)
	defer db.Close()

	storageDir := t.TempDir()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		JWSEnabled:         false,
		LedgerEnabled:      false,
	}

	app := fiber.New()
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, nil, cfg, &logger, nil, nil))

	testContent := []byte("test invoice PDF content")
	fileBase64 := base64.StdEncoding.EncodeToString(testContent)

	payload := map[string]interface{}{
		"source":  "sales",
		"model":   "account.move",
		"odoo_id": 123,
		"state":   "posted",
		"file":    fileBase64,
		"meta": map[string]interface{}{
			"move_type": "out_invoice",
			// tenant manquant
		},
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode, "Expected 400 for missing tenant")

	var errorResp map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&errorResp)
	require.NoError(t, err)
	assert.Contains(t, errorResp["error"].(string), "tenant", "Error message should mention tenant validation")
}

// TestAccountMoveIdempotence_TenantSHA256 teste AC-10 : idempotence (tenant, sha256)
func TestAccountMoveIdempotence_TenantSHA256(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	ctx := context.Background()
	logger := zerolog.Nop()
	db, err := storage.NewDB(ctx, dbURL, &logger)
	require.NoError(t, err)
	defer db.Close()

	// Nettoyer la table avant le test
	_, err = db.Pool.Exec(ctx, "DELETE FROM documents")
	require.NoError(t, err)

	storageDir := t.TempDir()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		JWSEnabled:         false,
		LedgerEnabled:      false,
	}

	app := fiber.New()
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, nil, cfg, &logger, nil, nil))

	// Test content (même contenu = même SHA256)
	testContent := []byte("test invoice PDF content for idempotence")
	fileBase64 := base64.StdEncoding.EncodeToString(testContent)

	tenant1 := "tenant-idempotence-1"
	tenant2 := "tenant-idempotence-2"

	// Premier envoi pour tenant1
	payload1 := map[string]interface{}{
		"source":  "sales",
		"model":   "account.move",
		"odoo_id": 200,
		"state":   "posted",
		"file":    fileBase64,
		"meta": map[string]interface{}{
			"move_type": "out_invoice",
			"tenant":    tenant1,
		},
	}

	body1, _ := json.Marshal(payload1)
	req1 := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body1))
	req1.Header.Set("Content-Type", "application/json")
	resp1, err := app.Test(req1)
	require.NoError(t, err)
	assert.Equal(t, 201, resp1.StatusCode, "First request should return 201")

	var result1 map[string]interface{}
	err = json.NewDecoder(resp1.Body).Decode(&result1)
	require.NoError(t, err)
	docID1 := result1["id"].(string)
	sha256_1 := result1["sha256_hex"].(string)

	// Deuxième envoi pour tenant1 (même contenu) - devrait être idempotent
	req2 := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body1))
	req2.Header.Set("Content-Type", "application/json")
	resp2, err := app.Test(req2)
	require.NoError(t, err)
	assert.Equal(t, 200, resp2.StatusCode, "Second request with same (tenant, sha256) should return 200 (idempotent)")

	var result2 map[string]interface{}
	err = json.NewDecoder(resp2.Body).Decode(&result2)
	require.NoError(t, err)
	docID2 := result2["id"].(string)
	sha256_2 := result2["sha256_hex"].(string)

	// Vérifier que c'est le même document
	assert.Equal(t, docID1, docID2, "Same document ID for idempotent request")
	assert.Equal(t, sha256_1, sha256_2, "Same SHA256 for idempotent request")
	assert.Contains(t, result2["message"].(string), "already exists", "Message should indicate document already exists")

	// Envoi pour tenant2 (même contenu, tenant différent) - devrait créer un nouveau document
	payload2 := map[string]interface{}{
		"source":  "sales",
		"model":   "account.move",
		"odoo_id": 201,
		"state":   "posted",
		"file":    fileBase64,
		"meta": map[string]interface{}{
			"move_type": "out_invoice",
			"tenant":    tenant2,
		},
	}

	body2, _ := json.Marshal(payload2)
	req3 := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body2))
	req3.Header.Set("Content-Type", "application/json")
	resp3, err := app.Test(req3)
	require.NoError(t, err)
	assert.Equal(t, 201, resp3.StatusCode, "Request with different tenant should create new document")

	var result3 map[string]interface{}
	err = json.NewDecoder(resp3.Body).Decode(&result3)
	require.NoError(t, err)
	docID3 := result3["id"].(string)
	sha256_3 := result3["sha256_hex"].(string)

	// Vérifier que c'est un document différent (même SHA256 mais tenant différent)
	assert.NotEqual(t, docID1, docID3, "Different document ID for different tenant")
	assert.Equal(t, sha256_1, sha256_3, "Same SHA256 but different tenant = different document")

	// Vérifier en DB que les deux documents existent avec le bon tenant
	var count int
	err = db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM documents WHERE sha256_hex = $1", sha256_1).Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 2, count, "Should have 2 documents with same SHA256 (different tenants)")

	// Vérifier que move_type est stocké
	var moveType1, moveType2 *string
	err = db.Pool.QueryRow(ctx, "SELECT move_type FROM documents WHERE id = $1", docID1).Scan(&moveType1)
	require.NoError(t, err)
	assert.NotNil(t, moveType1, "move_type should be stored")
	assert.Equal(t, "out_invoice", *moveType1, "move_type should be 'out_invoice'")

	err = db.Pool.QueryRow(ctx, "SELECT move_type FROM documents WHERE id = $1", docID3).Scan(&moveType2)
	require.NoError(t, err)
	assert.NotNil(t, moveType2, "move_type should be stored")
	assert.Equal(t, "out_invoice", *moveType2, "move_type should be 'out_invoice'")
}

// TestAccountMoveFacturXCompliance_AC17 teste AC-17 : Factur-X présent → compliance_status=compliant
func TestAccountMoveFacturXCompliance_AC17(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	// Setup
	ctx := context.Background()
	logger := zerolog.Nop()
	db, err := storage.NewDB(ctx, dbURL, &logger)
	require.NoError(t, err)
	defer db.Close()

	storageDir := t.TempDir()
	cfg := &config.Config{
		MaxBase64SizeBytes:     15 * 1024 * 1024,
		JWSEnabled:             false,
		LedgerEnabled:           false,
		FacturXValidationEnabled: true, // Activer validation Factur-X
		FacturXValidationRequired: false,
	}

	app := fiber.New()
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, nil, cfg, &logger, nil, nil))

	// Créer un PDF avec Factur-X embarqué (simulation)
	// Format simplifié : PDF header + XML Factur-X
	facturXXML := []byte(`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
	<ID>F2025-00123</ID>
	<IssueDate>2025-01-15</IssueDate>
	<InvoiceTypeCode>380</InvoiceTypeCode>
	<DocumentCurrencyCode>EUR</DocumentCurrencyCode>
	<AccountingSupplierParty>
		<Party>
			<PartyTaxScheme>
				<CompanyID>FR12345678901</CompanyID>
			</PartyTaxScheme>
		</Party>
	</AccountingSupplierParty>
	<AccountingCustomerParty>
		<Party>
			<PartyTaxScheme>
				<CompanyID>FR98765432109</CompanyID>
			</PartyTaxScheme>
		</Party>
	</AccountingCustomerParty>
	<LegalMonetaryTotal>
		<TaxExclusiveAmount>158.33</TaxExclusiveAmount>
		<TaxInclusiveAmount>190.00</TaxInclusiveAmount>
	</LegalMonetaryTotal>
</Invoice>`)
	
	// Simuler un PDF avec XML embarqué (format simplifié pour test)
	pdfWithFacturX := append([]byte("%PDF-1.4\n"), facturXXML...)

	// Payload valide avec Factur-X
	payload := map[string]interface{}{
		"source": "sales",
		"model":  "account.move",
		"state":  "posted",
		"odoo_id": 12345,
		"file":   base64.StdEncoding.EncodeToString(pdfWithFacturX),
		"meta": map[string]interface{}{
			"move_type": "out_invoice",
			"tenant":    "test-tenant-ac17",
		},
	}

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(payloadJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 201, resp.StatusCode, "Should return 201 Created")

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err)
	assert.NotEmpty(t, response["id"], "Should return document ID")

	// Vérifier compliance_status et facturx_present en DB
	docID := response["id"].(string)
	var complianceStatus *string
	var facturXPresent *bool
	err = db.Pool.QueryRow(ctx, 
		"SELECT compliance_status, facturx_present FROM documents WHERE id = $1", 
		docID).Scan(&complianceStatus, &facturXPresent)
	require.NoError(t, err)
	
	assert.NotNil(t, complianceStatus, "compliance_status should be stored")
	assert.Equal(t, "compliant", *complianceStatus, "compliance_status should be 'compliant' (AC-17)")
	assert.NotNil(t, facturXPresent, "facturx_present should be stored")
	assert.True(t, *facturXPresent, "facturx_present should be true (AC-17)")
}

// TestAccountMoveFacturXCompliance_AC18 teste AC-18 : B2B probable sans Factur-X → compliance_status=non_compliant_2026
func TestAccountMoveFacturXCompliance_AC18(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	// Setup
	ctx := context.Background()
	logger := zerolog.Nop()
	db, err := storage.NewDB(ctx, dbURL, &logger)
	require.NoError(t, err)
	defer db.Close()

	storageDir := t.TempDir()
	cfg := &config.Config{
		MaxBase64SizeBytes:     15 * 1024 * 1024,
		JWSEnabled:             false,
		LedgerEnabled:           false,
		FacturXValidationEnabled: true, // Activer validation Factur-X
		FacturXValidationRequired: false,
	}

	app := fiber.New()
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, nil, cfg, &logger, nil, nil))

	// PDF standard sans Factur-X
	pdfWithoutFacturX := []byte("%PDF-1.4\ntest PDF content without Factur-X")

	// Payload B2B probable (buyer_vat + seller_vat présents) mais sans Factur-X
	payload := map[string]interface{}{
		"source": "sales",
		"model":  "account.move",
		"state":  "posted",
		"odoo_id": 12346,
		"file":   base64.StdEncoding.EncodeToString(pdfWithoutFacturX),
		"meta": map[string]interface{}{
			"move_type":  "out_invoice",
			"tenant":     "test-tenant-ac18",
			"buyer_vat":  "FR98765432109", // B2B probable
			"seller_vat": "FR12345678901", // B2B probable
		},
	}

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(payloadJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 201, resp.StatusCode, "Should return 201 Created")

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err)
	assert.NotEmpty(t, response["id"], "Should return document ID")

	// Vérifier compliance_status et facturx_present en DB
	docID := response["id"].(string)
	var complianceStatus *string
	var facturXPresent *bool
	err = db.Pool.QueryRow(ctx, 
		"SELECT compliance_status, facturx_present FROM documents WHERE id = $1", 
		docID).Scan(&complianceStatus, &facturXPresent)
	require.NoError(t, err)
	
	assert.NotNil(t, complianceStatus, "compliance_status should be stored")
	assert.Equal(t, "non_compliant_2026", *complianceStatus, "compliance_status should be 'non_compliant_2026' (AC-18)")
	assert.NotNil(t, facturXPresent, "facturx_present should be stored")
	assert.False(t, *facturXPresent, "facturx_present should be false (AC-18)")
}

// TestAccountMoveFacturXCompliance_OutOfScope teste le cas out_of_scope (B2C ou non qualifié)
func TestAccountMoveFacturXCompliance_OutOfScope(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	// Setup
	ctx := context.Background()
	logger := zerolog.Nop()
	db, err := storage.NewDB(ctx, dbURL, &logger)
	require.NoError(t, err)
	defer db.Close()

	storageDir := t.TempDir()
	cfg := &config.Config{
		MaxBase64SizeBytes:     15 * 1024 * 1024,
		JWSEnabled:             false,
		LedgerEnabled:           false,
		FacturXValidationEnabled: true,
		FacturXValidationRequired: false,
	}

	app := fiber.New()
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, nil, cfg, &logger, nil, nil))

	// PDF standard sans Factur-X et sans buyer_vat/seller_vat (B2C probable)
	pdfB2C := []byte("%PDF-1.4\ntest PDF content B2C")

	payload := map[string]interface{}{
		"source": "sales",
		"model":  "account.move",
		"state":  "posted",
		"odoo_id": 12347,
		"file":   base64.StdEncoding.EncodeToString(pdfB2C),
		"meta": map[string]interface{}{
			"move_type": "out_invoice",
			"tenant":    "test-tenant-outofscope",
			// Pas de buyer_vat ni seller_vat → out_of_scope
		},
	}

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(payloadJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 201, resp.StatusCode, "Should return 201 Created")

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err)
	assert.NotEmpty(t, response["id"], "Should return document ID")

	// Vérifier compliance_status et facturx_present en DB
	docID := response["id"].(string)
	var complianceStatus *string
	var facturXPresent *bool
	err = db.Pool.QueryRow(ctx, 
		"SELECT compliance_status, facturx_present FROM documents WHERE id = $1", 
		docID).Scan(&complianceStatus, &facturXPresent)
	require.NoError(t, err)
	
	assert.NotNil(t, complianceStatus, "compliance_status should be stored")
	assert.Equal(t, "out_of_scope", *complianceStatus, "compliance_status should be 'out_of_scope' for B2C")
	assert.NotNil(t, facturXPresent, "facturx_present should be stored")
	assert.False(t, *facturXPresent, "facturx_present should be false for B2C")
}
