package integration

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestTenantIsolation_Documents tests that documents are properly isolated by tenant
func TestTenantIsolation_Documents(t *testing.T) {
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

	// Create test file content
	testContent := []byte("test document content for tenant isolation")

	// Tenant IDs
	tenant1 := "tenant-001"
	tenant2 := "tenant-002"

	// Create documents for tenant1
	doc1Tenant1, err := createDocumentWithTenant(ctx, db, storageDir, "doc1.pdf", testContent, tenant1)
	require.NoError(t, err)

	doc2Tenant1, err := createDocumentWithTenant(ctx, db, storageDir, "doc2.pdf", testContent, tenant1)
	require.NoError(t, err)

	// Create documents for tenant2
	doc1Tenant2, err := createDocumentWithTenant(ctx, db, storageDir, "doc1.pdf", testContent, tenant2)
	require.NoError(t, err)

	// Verify isolation: tenant1 should only see its documents
	docsTenant1, err := getDocumentsByTenant(ctx, db, tenant1)
	require.NoError(t, err)
	assert.Len(t, docsTenant1, 2, "Tenant1 should have 2 documents")
	assert.Contains(t, []uuid.UUID{doc1Tenant1.ID, doc2Tenant1.ID}, docsTenant1[0].ID)
	assert.Contains(t, []uuid.UUID{doc1Tenant1.ID, doc2Tenant1.ID}, docsTenant1[1].ID)
	assert.NotContains(t, []uuid.UUID{doc1Tenant1.ID, doc2Tenant1.ID}, doc1Tenant2.ID)

	// Verify isolation: tenant2 should only see its documents
	docsTenant2, err := getDocumentsByTenant(ctx, db, tenant2)
	require.NoError(t, err)
	assert.Len(t, docsTenant2, 1, "Tenant2 should have 1 document")
	assert.Equal(t, doc1Tenant2.ID, docsTenant2[0].ID)
	assert.NotEqual(t, doc1Tenant1.ID, docsTenant2[0].ID)
	assert.NotEqual(t, doc2Tenant1.ID, docsTenant2[0].ID)

	// Verify documents with tenant are properly stored
	for _, doc := range docsTenant1 {
		assert.NotNil(t, doc.Tenant, "Document should have tenant")
		assert.Equal(t, tenant1, *doc.Tenant, "Document should have correct tenant")
	}
}

// TestTenantIsolation_PushDocumentHandler tests tenant isolation in push_document endpoint
func TestTenantIsolation_PushDocumentHandler(t *testing.T) {
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
	app.Post("/api/v1/push_document", handlers.PushDocumentHandler(db, storageDir, nil, cfg, &logger))

	// Test content
	testContent := []byte("test document for push handler tenant isolation")
	fileBase64 := base64.StdEncoding.EncodeToString(testContent)

	tenant1 := "tenant-push-001"
	tenant2 := "tenant-push-002"

	// Push document for tenant1
	payload1 := map[string]interface{}{
		"file":     fileBase64,
		"filename": "tenant1-doc.pdf",
		"meta": map[string]interface{}{
			"tenant": tenant1,
		},
	}
	body1, _ := json.Marshal(payload1)
	req1 := httptest.NewRequest("POST", "/api/v1/push_document", bytes.NewReader(body1))
	req1.Header.Set("Content-Type", "application/json")
	resp1, err := app.Test(req1)
	require.NoError(t, err)
	assert.Equal(t, 200, resp1.StatusCode)

	var result1 map[string]interface{}
	json.NewDecoder(resp1.Body).Decode(&result1)
	docID1 := result1["document_id"].(string)

	// Push document for tenant2
	payload2 := map[string]interface{}{
		"file":     fileBase64,
		"filename": "tenant2-doc.pdf",
		"meta": map[string]interface{}{
			"tenant": tenant2,
		},
	}
	body2, _ := json.Marshal(payload2)
	req2 := httptest.NewRequest("POST", "/api/v1/push_document", bytes.NewReader(body2))
	req2.Header.Set("Content-Type", "application/json")
	resp2, err := app.Test(req2)
	require.NoError(t, err)
	assert.Equal(t, 200, resp2.StatusCode)

	var result2 map[string]interface{}
	json.NewDecoder(resp2.Body).Decode(&result2)
	docID2 := result2["document_id"].(string)

	// Verify documents are stored with correct tenant
	doc1, err := getDocumentByID(ctx, db, docID1)
	require.NoError(t, err)
	assert.NotNil(t, doc1.Tenant, "Document 1 should have tenant")
	assert.Equal(t, tenant1, *doc1.Tenant, "Document 1 should have tenant1")

	doc2, err := getDocumentByID(ctx, db, docID2)
	require.NoError(t, err)
	assert.NotNil(t, doc2.Tenant, "Document 2 should have tenant")
	assert.Equal(t, tenant2, *doc2.Tenant, "Document 2 should have tenant2")

	// Verify isolation
	docsTenant1, err := getDocumentsByTenant(ctx, db, tenant1)
	require.NoError(t, err)
	assert.Len(t, docsTenant1, 1, "Tenant1 should have 1 document")
	assert.Equal(t, docID1, docsTenant1[0].ID.String())

	docsTenant2, err := getDocumentsByTenant(ctx, db, tenant2)
	require.NoError(t, err)
	assert.Len(t, docsTenant2, 1, "Tenant2 should have 1 document")
	assert.Equal(t, docID2, docsTenant2[0].ID.String())
}

// TestTenantIsolation_InvoicesHandler tests tenant isolation in invoices endpoint
func TestTenantIsolation_InvoicesHandler(t *testing.T) {
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
		MaxBase64SizeBytes:       15 * 1024 * 1024,
		MaxUploadSizeBytes:       10 * 1024 * 1024,
		JWSEnabled:               false,
		LedgerEnabled:            false,
		FacturXValidationEnabled: false,
	}

	app := fiber.New()
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, nil, cfg, &logger, nil, nil))

	// Test content
	testContent := []byte("test invoice content for tenant isolation")
	fileBase64 := base64.StdEncoding.EncodeToString(testContent)

	tenant1 := "tenant-invoice-001"
	tenant2 := "tenant-invoice-002"

	// Push invoice for tenant1
	payload1 := map[string]interface{}{
		"source":       "sales",
		"model":        "account.move",
		"odoo_id":      1001,
		"state":        "posted",
		"pdp_required": false,
		"file":         fileBase64,
		"meta": map[string]interface{}{
			"tenant": tenant1,
		},
	}
	body1, _ := json.Marshal(payload1)
	req1 := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body1))
	req1.Header.Set("Content-Type", "application/json")
	resp1, err := app.Test(req1)
	require.NoError(t, err)
	assert.Equal(t, 201, resp1.StatusCode)

	var result1 map[string]interface{}
	json.NewDecoder(resp1.Body).Decode(&result1)
	docID1 := result1["id"].(string)

	// Push invoice for tenant2
	payload2 := map[string]interface{}{
		"source":       "sales",
		"model":        "account.move",
		"odoo_id":      1002,
		"state":        "posted",
		"pdp_required": false,
		"file":         fileBase64,
		"meta": map[string]interface{}{
			"tenant": tenant2,
		},
	}
	body2, _ := json.Marshal(payload2)
	req2 := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body2))
	req2.Header.Set("Content-Type", "application/json")
	resp2, err := app.Test(req2)
	require.NoError(t, err)
	assert.Equal(t, 201, resp2.StatusCode)

	var result2 map[string]interface{}
	json.NewDecoder(resp2.Body).Decode(&result2)
	docID2 := result2["id"].(string)

	// Verify documents are stored with correct tenant
	doc1, err := getDocumentByID(ctx, db, docID1)
	require.NoError(t, err)
	assert.NotNil(t, doc1.Tenant, "Document 1 should have tenant")
	assert.Equal(t, tenant1, *doc1.Tenant, "Document 1 should have tenant1")

	doc2, err := getDocumentByID(ctx, db, docID2)
	require.NoError(t, err)
	assert.NotNil(t, doc2.Tenant, "Document 2 should have tenant")
	assert.Equal(t, tenant2, *doc2.Tenant, "Document 2 should have tenant2")

	// Verify isolation
	docsTenant1, err := getDocumentsByTenant(ctx, db, tenant1)
	require.NoError(t, err)
	assert.Len(t, docsTenant1, 1, "Tenant1 should have 1 document")
	assert.Equal(t, docID1, docsTenant1[0].ID.String())

	docsTenant2, err := getDocumentsByTenant(ctx, db, tenant2)
	require.NoError(t, err)
	assert.Len(t, docsTenant2, 1, "Tenant2 should have 1 document")
	assert.Equal(t, docID2, docsTenant2[0].ID.String())
}

// TestTenantIsolation_NoTenant tests that documents without tenant are handled correctly
func TestTenantIsolation_NoTenant(t *testing.T) {
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
	app.Post("/api/v1/push_document", handlers.PushDocumentHandler(db, storageDir, nil, cfg, &logger))

	// Test content
	testContent := []byte("test document without tenant")
	fileBase64 := base64.StdEncoding.EncodeToString(testContent)

	// Push document without tenant
	payload := map[string]interface{}{
		"file":     fileBase64,
		"filename": "no-tenant-doc.pdf",
		"meta":     map[string]interface{}{},
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest("POST", "/api/v1/push_document", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	docID := result["document_id"].(string)

	// Verify document is stored without tenant (nil)
	doc, err := getDocumentByID(ctx, db, docID)
	require.NoError(t, err)
	assert.Nil(t, doc.Tenant, "Document without tenant should have nil tenant")
}

// Helper functions

// createDocumentWithTenant creates a document with a specific tenant
func createDocumentWithTenant(ctx context.Context, db *storage.DB, storageDir, filename string, content []byte, tenant string) (*models.Document, error) {
	docID := uuid.New()
	doc := &models.Document{
		ID:          docID,
		Filename:    filename,
		ContentType: "application/pdf",
		SizeBytes:   int64(len(content)),
		CreatedAt:   time.Now(),
	}
	if tenant != "" {
		doc.Tenant = &tenant
	}

	err := db.StoreDocumentWithTransaction(ctx, doc, content, storageDir)
	if err != nil {
		return nil, err
	}

	return doc, nil
}

// getDocumentsByTenant retrieves all documents for a specific tenant
func getDocumentsByTenant(ctx context.Context, db *storage.DB, tenant string) ([]models.Document, error) {
	var docs []models.Document
	var rows pgx.Rows
	var err error

	if tenant == "" {
		// Get documents without tenant
		rows, err = db.Pool.Query(ctx, `
			SELECT id, filename, content_type, size_bytes, sha256_hex, stored_path, 
			       source, odoo_model, odoo_id, odoo_state, pdp_required, dispatch_status,
			       invoice_number, invoice_date, total_ht, total_ttc, currency, seller_vat, buyer_vat,
			       source_id_text, payload_json, pos_session, cashier, location,
			       tenant, created_at
			FROM documents
			WHERE tenant IS NULL
			ORDER BY created_at DESC
		`)
	} else {
		rows, err = db.Pool.Query(ctx, `
			SELECT id, filename, content_type, size_bytes, sha256_hex, stored_path,
			       source, odoo_model, odoo_id, odoo_state, pdp_required, dispatch_status,
			       invoice_number, invoice_date, total_ht, total_ttc, currency, seller_vat, buyer_vat,
			       source_id_text, payload_json, pos_session, cashier, location,
			       tenant, created_at
			FROM documents
			WHERE tenant = $1
			ORDER BY created_at DESC
		`, tenant)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var doc models.Document
		err := rows.Scan(
			&doc.ID, &doc.Filename, &doc.ContentType, &doc.SizeBytes, &doc.SHA256Hex, &doc.StoredPath,
			&doc.Source, &doc.OdooModel, &doc.OdooID, &doc.OdooState, &doc.PDPRequired, &doc.DispatchStatus,
			&doc.InvoiceNumber, &doc.InvoiceDate, &doc.TotalHT, &doc.TotalTTC, &doc.Currency, &doc.SellerVAT, &doc.BuyerVAT,
			&doc.SourceIDText, &doc.PayloadJSON, &doc.PosSession, &doc.Cashier, &doc.Location,
			&doc.Tenant, &doc.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		docs = append(docs, doc)
	}

	return docs, rows.Err()
}

// getDocumentByID retrieves a document by its ID
func getDocumentByID(ctx context.Context, db *storage.DB, docIDStr string) (*models.Document, error) {
	docID, err := uuid.Parse(docIDStr)
	if err != nil {
		return nil, err
	}

	var doc models.Document
	err = db.Pool.QueryRow(ctx, `
		SELECT id, filename, content_type, size_bytes, sha256_hex, stored_path,
		       source, odoo_model, odoo_id, odoo_state, pdp_required, dispatch_status,
		       invoice_number, invoice_date, total_ht, total_ttc, currency, seller_vat, buyer_vat,
		       source_id_text, payload_json, pos_session, cashier, location,
		       tenant, created_at
		FROM documents
		WHERE id = $1
	`, docID).Scan(
		&doc.ID, &doc.Filename, &doc.ContentType, &doc.SizeBytes, &doc.SHA256Hex, &doc.StoredPath,
		&doc.Source, &doc.OdooModel, &doc.OdooID, &doc.OdooState, &doc.PDPRequired, &doc.DispatchStatus,
		&doc.InvoiceNumber, &doc.InvoiceDate, &doc.TotalHT, &doc.TotalTTC, &doc.Currency, &doc.SellerVAT, &doc.BuyerVAT,
		&doc.SourceIDText, &doc.PayloadJSON, &doc.PosSession, &doc.Cashier, &doc.Location,
		&doc.Tenant, &doc.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &doc, nil
}
