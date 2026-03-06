package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http/httptest"
	"os"
	"testing"
	"time"

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

// TestConstatIntegration_GenerateAndGet teste la génération et la récupération d'un constat
func TestConstatIntegration_GenerateAndGet(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	ctx := context.Background()
	log := logger.New("error")
	db, err := storage.NewDB(ctx, dbURL, log)
	require.NoError(t, err)
	defer db.Close()

	// Clean up tables before test
	_, err = db.Pool.Exec(ctx, "DELETE FROM constats")
	require.NoError(t, err)
	_, err = db.Pool.Exec(ctx, "DELETE FROM documents")
	require.NoError(t, err)

	// Créer des documents de test pour un tenant
	tenant := "test-constat-tenant"
	period := "2026-01"

	// Insérer des documents de test pour la période
	testDocs := []struct {
		tenant     string
		period     string
		moveType   string
		createdAt  time.Time
		compliance string
	}{
		{tenant, period, "out_invoice", time.Date(2026, 1, 5, 10, 0, 0, 0, time.UTC), "compliant"},
		{tenant, period, "out_invoice", time.Date(2026, 1, 10, 10, 0, 0, 0, time.UTC), "non_compliant_2026"},
		{tenant, period, "in_invoice", time.Date(2026, 1, 15, 10, 0, 0, 0, time.UTC), "out_of_scope"},
		{tenant, period, "out_refund", time.Date(2026, 1, 20, 10, 0, 0, 0, time.UTC), "compliant"},
	}

	for _, doc := range testDocs {
		_, err = db.Pool.Exec(ctx, `
			INSERT INTO documents (id, filename, content_type, size_bytes, sha256_hex, stored_path, created_at,
				tenant, odoo_model, odoo_state, move_type, compliance_status)
			VALUES (gen_random_uuid(), 'test.pdf', 'application/pdf', 1024, 
				encode(gen_random_bytes(32), 'hex'), '/tmp/test.pdf', $1,
				$2, 'account.move', 'posted', $3, $4)
		`, doc.createdAt, doc.tenant, doc.moveType, doc.compliance)
		require.NoError(t, err)
	}

	// Créer le service constat
	jwsService, err := crypto.NewService("/tmp/test_private_key.pem", "/tmp/test_public_key.pem", "test-kid")
	if err != nil {
		// Si les clés n'existent pas, créer un service mock ou skip
		t.Skip("JWS keys not available, skipping test")
	}
	signer := crypto.NewLocalSigner(jwsService)
	ledgerService := ledger.NewService()

	serviceCfg := services.ConstatServiceConfig{
		DB:         db.Pool,
		Signer:     signer,
		Ledger:     ledgerService,
		VaultID:    "test-vault-id",
		CoreURL:    "", // Pas de transmission pour ce test
		CoreToken:  "",
		HTTPClient: nil,
		Logger:     log,
	}
	constatService := services.NewConstatService(serviceCfg)

	// Générer le constat
	constat, err := constatService.GenerateConstat(ctx, tenant, period)
	require.NoError(t, err)
	assert.NotNil(t, constat)
	assert.Equal(t, tenant, constat.Tenant)
	assert.Equal(t, period, constat.Period)
	assert.Equal(t, 2, constat.Volumes.OutInvoice) // 2 out_invoice
	assert.Equal(t, 1, constat.Volumes.InInvoice)  // 1 in_invoice
	assert.Equal(t, 1, constat.Volumes.OutRefund)  // 1 out_refund
	assert.Equal(t, 0, constat.Volumes.InRefund)   // 0 in_refund
	assert.Equal(t, 4, constat.Proofs.DocumentsCount)
	assert.NotEmpty(t, constat.Proofs.JWS)

	// Vérifier la conformité
	assert.NotNil(t, constat.Compliance)
	assert.Equal(t, 2, constat.Compliance.Compliant)        // 2 compliant
	assert.Equal(t, 1, constat.Compliance.NonCompliant2026) // 1 non_compliant_2026
	assert.Equal(t, 1, constat.Compliance.OutOfScope)      // 1 out_of_scope

	// Récupérer le constat
	retrievedConstat, err := constatService.GetConstat(ctx, tenant, period)
	require.NoError(t, err)
	assert.Equal(t, constat.ID, retrievedConstat.ID)
	assert.Equal(t, constat.Volumes, retrievedConstat.Volumes)
}

// TestConstatIntegration_ListConstats teste la liste des constats avec pagination
func TestConstatIntegration_ListConstats(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	ctx := context.Background()
	log := logger.New("error")
	db, err := storage.NewDB(ctx, dbURL, log)
	require.NoError(t, err)
	defer db.Close()

	// Clean up
	_, err = db.Pool.Exec(ctx, "DELETE FROM constats")
	require.NoError(t, err)

	// Créer quelques constats de test
	tenant1 := "tenant-1"
	tenant2 := "tenant-2"

	jwsService, err := crypto.NewService("/tmp/test_private_key.pem", "/tmp/test_public_key.pem", "test-kid")
	if err != nil {
		t.Skip("JWS keys not available, skipping test")
	}
	signer := crypto.NewLocalSigner(jwsService)
	ledgerService := ledger.NewService()

	serviceCfg := services.ConstatServiceConfig{
		DB:         db.Pool,
		Signer:     signer,
		Ledger:     ledgerService,
		VaultID:    "test-vault-id",
		CoreURL:    "",
		CoreToken:  "",
		HTTPClient: nil,
		Logger:     log,
	}
	constatService := services.NewConstatService(serviceCfg)

	// Générer des constats pour différents tenants et périodes
	periods := []string{"2026-01", "2025-12", "2025-11"}
	tenants := []string{tenant1, tenant2}

	for _, tenant := range tenants {
		for _, period := range periods {
			// Créer un document minimal pour permettre la génération
			_, err = db.Pool.Exec(ctx, `
				INSERT INTO documents (id, filename, content_type, size_bytes, sha256_hex, stored_path, created_at,
					tenant, odoo_model, odoo_state, move_type)
				VALUES (gen_random_uuid(), 'test.pdf', 'application/pdf', 1024, 
					encode(gen_random_bytes(32), 'hex'), '/tmp/test.pdf', 
					$1::timestamp - interval '1 month',
					$2, 'account.move', 'posted', 'out_invoice')
			`, period+"-15", tenant)
			require.NoError(t, err)

			_, err = constatService.GenerateConstat(ctx, tenant, period)
			require.NoError(t, err)
		}
	}

	// Tester la liste sans filtre
	constats, total, err := constatService.ListConstats(ctx, "", 10, 0)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, total, 6) // Au moins 6 constats (2 tenants × 3 périodes)
	assert.GreaterOrEqual(t, len(constats), 6)

	// Tester avec filtre tenant
	constatsFiltered, totalFiltered, err := constatService.ListConstats(ctx, tenant1, 10, 0)
	require.NoError(t, err)
	assert.Equal(t, 3, totalFiltered) // 3 périodes pour tenant1
	assert.Equal(t, 3, len(constatsFiltered))

	// Tester la pagination
	constatsPage1, totalPage1, err := constatService.ListConstats(ctx, "", 2, 0)
	require.NoError(t, err)
	assert.Equal(t, total, totalPage1)
	assert.Equal(t, 2, len(constatsPage1))

	constatsPage2, totalPage2, err := constatService.ListConstats(ctx, "", 2, 2)
	require.NoError(t, err)
	assert.Equal(t, total, totalPage2)
	assert.Equal(t, 2, len(constatsPage2))
}

// TestConstatIntegration_APIEndpoints teste les endpoints API
func TestConstatIntegration_APIEndpoints(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	ctx := context.Background()
	log := logger.New("error")
	db, err := storage.NewDB(ctx, dbURL, log)
	require.NoError(t, err)
	defer db.Close()

	// Clean up
	_, err = db.Pool.Exec(ctx, "DELETE FROM constats")
	require.NoError(t, err)
	_, err = db.Pool.Exec(ctx, "DELETE FROM documents")
	require.NoError(t, err)

	// Créer un document de test
	tenant := "api-test-tenant"
	period := "2026-01"
	_, err = db.Pool.Exec(ctx, `
		INSERT INTO documents (id, filename, content_type, size_bytes, sha256_hex, stored_path, created_at,
			tenant, odoo_model, odoo_state, move_type)
		VALUES (gen_random_uuid(), 'test.pdf', 'application/pdf', 1024, 
			encode(gen_random_bytes(32), 'hex'), '/tmp/test.pdf', 
			$1::timestamp,
			$2, 'account.move', 'posted', 'out_invoice')
	`, period+"-15", tenant)
	require.NoError(t, err)

	// Créer le service et handler
	jwsService, err := crypto.NewService("/tmp/test_private_key.pem", "/tmp/test_public_key.pem", "test-kid")
	if err != nil {
		t.Skip("JWS keys not available, skipping test")
	}
	signer := crypto.NewLocalSigner(jwsService)
	ledgerService := ledger.NewService()

	serviceCfg := services.ConstatServiceConfig{
		DB:         db.Pool,
		Signer:     signer,
		Ledger:     ledgerService,
		VaultID:    "test-vault-id",
		CoreURL:    "",
		CoreToken:  "",
		HTTPClient: nil,
		Logger:     log,
	}
	constatService := services.NewConstatService(serviceCfg)
	constatsHandler := handlers.NewConstatsHandler(constatService, log)

	app := fiber.New()
	app.Post("/api/v1/constats/generate", constatsHandler.GenerateConstatHandler)
	app.Get("/api/v1/constats/:tenant/:period", constatsHandler.GetConstatHandler)
	app.Get("/api/v1/constats", constatsHandler.ListConstatsHandler)
	app.Post("/api/v1/constats/:tenant/:period/retransmit", constatsHandler.RetransmitConstatHandler)

	// Test 1: Génération manuelle
	generatePayload := map[string]interface{}{
		"tenant": tenant,
		"period": period,
	}
	body, _ := json.Marshal(generatePayload)
	req := httptest.NewRequest("POST", "/api/v1/constats/generate", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var generateResult map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&generateResult)
	require.NoError(t, err)
	assert.Equal(t, tenant, generateResult["tenant"])
	assert.Equal(t, period, generateResult["period"])
	assert.NotEmpty(t, generateResult["constat_id"])

	// Test 2: Consultation
	req = httptest.NewRequest("GET", "/api/v1/constats/"+tenant+"/"+period, nil)
	resp, err = app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var getResult map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&getResult)
	require.NoError(t, err)
	assert.Equal(t, tenant, getResult["tenant"])
	assert.Equal(t, period, getResult["period"])

	// Test 3: Liste
	req = httptest.NewRequest("GET", "/api/v1/constats?tenant="+tenant+"&limit=10&offset=0", nil)
	resp, err = app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var listResult map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&listResult)
	require.NoError(t, err)
	assert.Contains(t, listResult, "constats")
	assert.Contains(t, listResult, "total")
}

// TestConstatIntegration_Idempotence teste l'idempotence de la génération
func TestConstatIntegration_Idempotence(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	ctx := context.Background()
	log := logger.New("error")
	db, err := storage.NewDB(ctx, dbURL, log)
	require.NoError(t, err)
	defer db.Close()

	// Clean up
	_, err = db.Pool.Exec(ctx, "DELETE FROM constats")
	require.NoError(t, err)
	_, err = db.Pool.Exec(ctx, "DELETE FROM documents")
	require.NoError(t, err)

	tenant := "idempotence-test"
	period := "2026-01"

	// Créer un document de test
	_, err = db.Pool.Exec(ctx, `
		INSERT INTO documents (id, filename, content_type, size_bytes, sha256_hex, stored_path, created_at,
			tenant, odoo_model, odoo_state, move_type)
		VALUES (gen_random_uuid(), 'test.pdf', 'application/pdf', 1024, 
			encode(gen_random_bytes(32), 'hex'), '/tmp/test.pdf', 
			$1::timestamp,
			$2, 'account.move', 'posted', 'out_invoice')
	`, period+"-15", tenant)
	require.NoError(t, err)

	jwsService, err := crypto.NewService("/tmp/test_private_key.pem", "/tmp/test_public_key.pem", "test-kid")
	if err != nil {
		t.Skip("JWS keys not available, skipping test")
	}
	signer := crypto.NewLocalSigner(jwsService)
	ledgerService := ledger.NewService()

	serviceCfg := services.ConstatServiceConfig{
		DB:         db.Pool,
		Signer:     signer,
		Ledger:     ledgerService,
		VaultID:    "test-vault-id",
		CoreURL:    "",
		CoreToken:  "",
		HTTPClient: nil,
		Logger:     log,
	}
	constatService := services.NewConstatService(serviceCfg)

	// Générer le constat une première fois
	constat1, err := constatService.GenerateConstat(ctx, tenant, period)
	require.NoError(t, err)
	assert.NotNil(t, constat1)

	// Générer à nouveau (devrait retourner le même constat)
	constat2, err := constatService.GenerateConstat(ctx, tenant, period)
	require.NoError(t, err)
	assert.NotNil(t, constat2)

	// Vérifier l'idempotence
	assert.Equal(t, constat1.ID, constat2.ID)
	assert.Equal(t, constat1.Volumes, constat2.Volumes)
}

