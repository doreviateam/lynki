package integration

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
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

// TestAccountMoveVaulting_AC11 teste AC-11 : intégration Odoo avec tenant
// Vérifie que le vaulting fonctionne avec un payload Odoo complet incluant tenant
func TestAccountMoveVaulting_AC11(t *testing.T) {
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

	// Payload Odoo complet avec toutes les métadonnées
	testContent := []byte("test invoice PDF content AC-11")
	fileBase64 := base64.StdEncoding.EncodeToString(testContent)

	payload := map[string]interface{}{
		"source":  "sales",
		"model":   "account.move",
		"odoo_id": 12345,
		"state":   "posted",
		"file":    fileBase64,
		"meta": map[string]interface{}{
			"move_type":      "out_invoice",
			"tenant":         "test-tenant-ac11",
			"number":         "FAC2026-001",
			"invoice_date":   "2026-01-15",
			"total_ht":       1000.00,
			"total_ttc":       1200.00,
			"currency":       "EUR",
			"seller_vat":     "FR12345678901",
			"buyer_vat":      "FR98765432109",
			"correlation_id": "account.move_12345_abc123",
		},
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 201, resp.StatusCode, "Should return 201 Created")

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	require.NoError(t, err)
	assert.NotEmpty(t, result["id"], "Document ID should be present")
	assert.NotEmpty(t, result["sha256_hex"], "SHA256 should be present")

	// Vérifier en DB que toutes les métadonnées sont stockées
	docID := result["id"].(string)
	var storedTenant, storedMoveType, storedNumber, storedCurrency *string
	var storedTotalHT, storedTotalTTC *float64
	err = db.Pool.QueryRow(ctx,
		"SELECT tenant, move_type, invoice_number, currency, total_ht, total_ttc FROM documents WHERE id = $1",
		docID).Scan(&storedTenant, &storedMoveType, &storedNumber, &storedCurrency, &storedTotalHT, &storedTotalTTC)
	require.NoError(t, err)

	assert.NotNil(t, storedTenant, "tenant should be stored")
	assert.Equal(t, "test-tenant-ac11", *storedTenant, "tenant should match")
	assert.NotNil(t, storedMoveType, "move_type should be stored")
	assert.Equal(t, "out_invoice", *storedMoveType, "move_type should match")
	assert.NotNil(t, storedNumber, "invoice_number should be stored")
	assert.Equal(t, "FAC2026-001", *storedNumber, "invoice_number should match")
	assert.NotNil(t, storedCurrency, "currency should be stored")
	assert.Equal(t, "EUR", *storedCurrency, "currency should match")
	assert.NotNil(t, storedTotalHT, "total_ht should be stored")
	assert.Equal(t, 1000.00, *storedTotalHT, "total_ht should match")
	assert.NotNil(t, storedTotalTTC, "total_ttc should be stored")
	assert.Equal(t, 1200.00, *storedTotalTTC, "total_ttc should match")
}

// TestAccountMoveVaulting_AC12 teste AC-12 : stockage métadonnées + isolation tenant
// Vérifie que les métadonnées sont stockées et que l'isolation par tenant fonctionne
func TestAccountMoveVaulting_AC12(t *testing.T) {
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

	// Même contenu PDF mais tenants différents
	testContent := []byte("test invoice PDF content AC-12")
	fileBase64 := base64.StdEncoding.EncodeToString(testContent)

	tenant1 := "tenant-ac12-1"
	tenant2 := "tenant-ac12-2"

	// Premier document pour tenant1
	payload1 := map[string]interface{}{
		"source":  "sales",
		"model":   "account.move",
		"odoo_id": 20001,
		"state":   "posted",
		"file":    fileBase64,
		"meta": map[string]interface{}{
			"move_type": "out_invoice",
			"tenant":    tenant1,
			"number":    "FAC-T1-001",
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

	// Deuxième document pour tenant2 (même contenu)
	payload2 := map[string]interface{}{
		"source":  "sales",
		"model":   "account.move",
		"odoo_id": 20002,
		"state":   "posted",
		"file":    fileBase64,
		"meta": map[string]interface{}{
			"move_type": "out_invoice",
			"tenant":    tenant2,
			"number":    "FAC-T2-001",
		},
	}

	body2, _ := json.Marshal(payload2)
	req2 := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body2))
	req2.Header.Set("Content-Type", "application/json")
	resp2, err := app.Test(req2)
	require.NoError(t, err)
	assert.Equal(t, 201, resp2.StatusCode, "Second request should return 201")

	var result2 map[string]interface{}
	err = json.NewDecoder(resp2.Body).Decode(&result2)
	require.NoError(t, err)
	docID2 := result2["id"].(string)

	// Vérifier que ce sont deux documents différents
	assert.NotEqual(t, docID1, docID2, "Different tenants should create different documents")

	// Vérifier l'isolation : chaque document a son propre tenant
	var storedTenant1, storedTenant2 *string
	err = db.Pool.QueryRow(ctx, "SELECT tenant FROM documents WHERE id = $1", docID1).Scan(&storedTenant1)
	require.NoError(t, err)
	err = db.Pool.QueryRow(ctx, "SELECT tenant FROM documents WHERE id = $1", docID2).Scan(&storedTenant2)
	require.NoError(t, err)

	assert.Equal(t, tenant1, *storedTenant1, "First document should have tenant1")
	assert.Equal(t, tenant2, *storedTenant2, "Second document should have tenant2")

	// Vérifier que les métadonnées sont stockées correctement
	var storedNumber1, storedNumber2 *string
	err = db.Pool.QueryRow(ctx, "SELECT invoice_number FROM documents WHERE id = $1", docID1).Scan(&storedNumber1)
	require.NoError(t, err)
	err = db.Pool.QueryRow(ctx, "SELECT invoice_number FROM documents WHERE id = $1", docID2).Scan(&storedNumber2)
	require.NoError(t, err)

	assert.Equal(t, "FAC-T1-001", *storedNumber1, "First document should have correct invoice_number")
	assert.Equal(t, "FAC-T2-001", *storedNumber2, "Second document should have correct invoice_number")
}

// TestAccountMoveVaulting_AC13 teste AC-13 : preuves JWS/Ledger avec tenant
// Vérifie que les preuves JWS et Ledger sont générées correctement avec tenant
func TestAccountMoveVaulting_AC13(t *testing.T) {
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
	jwsService := setupTestJWS(t)

	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		JWSEnabled:         true,
		LedgerEnabled:      true,
	}

	app := fiber.New()
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, jwsService, cfg, &logger, nil, nil))

	testContent := []byte("test invoice PDF content AC-13")
	fileBase64 := base64.StdEncoding.EncodeToString(testContent)

	payload := map[string]interface{}{
		"source":  "sales",
		"model":   "account.move",
		"odoo_id": 30001,
		"state":   "posted",
		"file":    fileBase64,
		"meta": map[string]interface{}{
			"move_type": "out_invoice",
			"tenant":   "test-tenant-ac13",
		},
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 201, resp.StatusCode, "Should return 201 Created")

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	require.NoError(t, err)
	assert.NotEmpty(t, result["id"], "Document ID should be present")

	// Vérifier que JWS est présent si activé
	if cfg.JWSEnabled && jwsService != nil {
		assert.NotNil(t, result["evidence_jws"], "Evidence JWS should be present when JWS is enabled")
		if jws, ok := result["evidence_jws"].(string); ok {
			assert.NotEmpty(t, jws, "Evidence JWS should not be empty")
		}
	}

	// Vérifier que Ledger hash est présent si activé
	if cfg.LedgerEnabled {
		assert.NotNil(t, result["ledger_hash"], "Ledger hash should be present when Ledger is enabled")
		if ledgerHash, ok := result["ledger_hash"].(string); ok {
			assert.NotEmpty(t, ledgerHash, "Ledger hash should not be empty")
		}
	}

	// Vérifier en DB que le tenant est stocké
	docID := result["id"].(string)
	var storedTenant *string
	err = db.Pool.QueryRow(ctx, "SELECT tenant FROM documents WHERE id = $1", docID).Scan(&storedTenant)
	require.NoError(t, err)
	assert.Equal(t, "test-tenant-ac13", *storedTenant, "Tenant should be stored correctly")
}

// TestAccountMoveVaulting_AC14 teste AC-14 : isolation multi-tenant
// Vérifie que les documents de différents tenants sont bien isolés
func TestAccountMoveVaulting_AC14(t *testing.T) {
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

	// Créer des documents pour 3 tenants différents
	tenants := []string{"tenant-multi-1", "tenant-multi-2", "tenant-multi-3"}
	docIDs := make([]string, len(tenants))

	for i, tenant := range tenants {
		testContent := []byte("test invoice PDF content AC-14 tenant " + tenant)
		fileBase64 := base64.StdEncoding.EncodeToString(testContent)

		payload := map[string]interface{}{
			"source":  "sales",
			"model":   "account.move",
			"odoo_id": 40000 + i,
			"state":   "posted",
			"file":    fileBase64,
			"meta": map[string]interface{}{
				"move_type": "out_invoice",
				"tenant":    tenant,
			},
		}

		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 201, resp.StatusCode, "Request for tenant %s should return 201", tenant)

		var result map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&result)
		require.NoError(t, err)
		docIDs[i] = result["id"].(string)
	}

	// Vérifier que tous les documents ont des IDs différents
	for i := 0; i < len(docIDs); i++ {
		for j := i + 1; j < len(docIDs); j++ {
			assert.NotEqual(t, docIDs[i], docIDs[j], "Documents from different tenants should have different IDs")
		}
	}

	// Vérifier en DB que chaque document a le bon tenant
	for i, tenant := range tenants {
		var storedTenant *string
		err = db.Pool.QueryRow(ctx, "SELECT tenant FROM documents WHERE id = $1", docIDs[i]).Scan(&storedTenant)
		require.NoError(t, err)
		assert.Equal(t, tenant, *storedTenant, "Document %d should have tenant %s", i, tenant)
	}

	// Vérifier qu'on peut filtrer par tenant en DB
	var count int
	err = db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM documents WHERE tenant = $1", tenants[0]).Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 1, count, "Should have exactly 1 document for tenant %s", tenants[0])
}

// TestAccountMoveVaulting_AC15 teste AC-15 : non-régression - autres types documents (POS) fonctionnent
// Vérifie que les documents POS continuent de fonctionner après l'ajout de la validation account.move
func TestAccountMoveVaulting_AC15(t *testing.T) {
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

	// Payload POS (non account.move) - devrait fonctionner sans validation account.move
	testContent := []byte("test POS ticket PDF content")
	fileBase64 := base64.StdEncoding.EncodeToString(testContent)

	payload := map[string]interface{}{
		"source":  "pos",
		"model":   "pos.order",
		"odoo_id": 50001,
		"state":   "done",
		"file":    fileBase64,
		"meta": map[string]interface{}{
			"tenant": "test-tenant-pos",
		},
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 201, resp.StatusCode, "POS document should be accepted (non-regression)")

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	require.NoError(t, err)
	assert.NotEmpty(t, result["id"], "Document ID should be present")

	// Vérifier en DB que le document POS est stocké
	docID := result["id"].(string)
	var storedModel, storedSource *string
	err = db.Pool.QueryRow(ctx, "SELECT odoo_model, source FROM documents WHERE id = $1", docID).Scan(&storedModel, &storedSource)
	require.NoError(t, err)
	assert.Equal(t, "pos.order", *storedModel, "Model should be pos.order")
	assert.Equal(t, "pos", *storedSource, "Source should be pos")
}

// TestAccountMoveVaulting_AC16 teste AC-16 : API /api/v1/invoices reste compatible
// Vérifie que l'API reste compatible pour les clients existants (documents non account.move)
func TestAccountMoveVaulting_AC16(t *testing.T) {
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

	// Test avec différents types de documents (compatibilité)
	testCases := []struct {
		name    string
		payload map[string]interface{}
	}{
		{
			name: "Document stock (non account.move)",
			payload: map[string]interface{}{
				"source":  "stock",
				"model":   "stock.picking",
				"odoo_id": 60001,
				"state":   "done",
				"file":    base64.StdEncoding.EncodeToString([]byte("test stock document")),
				"meta": map[string]interface{}{
					"tenant": "test-tenant-stock",
				},
			},
		},
		{
			name: "Document sale (non account.move)",
			payload: map[string]interface{}{
				"source":  "sale",
				"model":   "sale.order",
				"odoo_id": 60002,
				"state":   "sale",
				"file":    base64.StdEncoding.EncodeToString([]byte("test sale document")),
				"meta": map[string]interface{}{
					"tenant": "test-tenant-sale",
				},
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			body, _ := json.Marshal(tc.payload)
			req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			resp, err := app.Test(req)
			require.NoError(t, err)
			assert.Equal(t, 201, resp.StatusCode, "Non-account.move document should be accepted (API compatibility)")

			var result map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&result)
			require.NoError(t, err)
			assert.NotEmpty(t, result["id"], "Document ID should be present")
		})
	}
}

