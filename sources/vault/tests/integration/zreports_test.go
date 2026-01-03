package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/doreviateam/dorevia-vault/internal/ledger/filesystem"
	"github.com/doreviateam/dorevia-vault/internal/services/zreports"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/pkg/logger"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupTestZReportsDB crée une connexion DB de test pour Z-Reports
func setupTestZReportsDB(t *testing.T) *storage.DB {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	log := logger.New("error")
	ctx := context.Background()
	db, err := storage.NewDB(ctx, dbURL, log)
	require.NoError(t, err)

	// Nettoyer les documents de test
	_, err = db.Pool.Exec(ctx, "DELETE FROM documents WHERE source = 'pos'")
	require.NoError(t, err)

	return db
}

// setupTestZReportsLedger crée un ledger filesystem de test
func setupTestZReportsLedger(t *testing.T) (string, *filesystem.FilesystemLedger) {
	// Créer un répertoire temporaire pour le ledger
	tmpDir := filepath.Join(os.TempDir(), "zreports_test_"+t.Name())
	err := os.MkdirAll(tmpDir, 0755)
	require.NoError(t, err)

	// Nettoyer après le test
	t.Cleanup(func() {
		os.RemoveAll(tmpDir)
	})

	log := logger.New("error")
	ledger := filesystem.NewFilesystemLedger(tmpDir, true, log)
	return tmpDir, ledger
}

// createTestTicket crée un ticket POS de test dans la DB
func createTestTicket(t *testing.T, db *storage.DB, tenant, ticketID, sha256Hex string) {
	ctx := context.Background()

	// Insérer directement dans la DB pour simplifier
	// Note: id doit être un UUID, on utilise sha256Hex comme base
	_, err := db.Pool.Exec(ctx, `
		INSERT INTO documents (id, sha256_hex, source, source_id_text, created_at)
		VALUES (gen_random_uuid(), $1, $2, $3, $4)
		ON CONFLICT (sha256_hex) DO NOTHING
	`, sha256Hex, "pos", ticketID, time.Now())
	require.NoError(t, err)
}

// TestZReports_EndToEnd_FirstZ teste le flux complet pour le premier Z-Report du mois
func TestZReports_EndToEnd_FirstZ(t *testing.T) {
	db := setupTestZReportsDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)
	ledgerPath, fsLedger := setupTestZReportsLedger(t)
	_ = ledgerPath

	// Créer un ticket de test
	tenant := "test-tenant-1"
	ticketID := "POS/2025/0001"
	ticketHash := "abc123def4567890123456789012345678901234567890123456789012345678"
	createTestTicket(t, db, tenant, ticketID, ticketHash)

	// Créer les services
	repo := storage.NewPostgresRepository(db.Pool, logger.New("error"))
	validator := zreports.NewZReportValidator(fsLedger)
	signer := crypto.NewLocalSigner(jwsService)
	zreportsService := zreports.NewZReportsService(fsLedger, validator, signer, repo)

	// Créer l'application Fiber
	app := fiber.New()
	cfg := &config.Config{
		ZReportMaxSizeBytes: 1024 * 1024,
		LedgerFilesystemPath: ledgerPath,
		ZReportFsyncEnabled:  true,
	}
	log := logger.New("error")
	app.Post("/api/v1/pos/zreports", handlers.PosZReportsHandler(zreportsService, cfg, log))

	// Payload de test (premier Z du mois)
	now := time.Now().UTC()
	payload := handlers.ZReportPayload{
		ZID:           "Z2025-01-15-01",
		CompanyID:     1,
		Sequence:      1,
		DateOpen:      now.Add(-10 * time.Hour).Format(time.RFC3339),
		DateClose:     now.Format(time.RFC3339),
		Totals:        handlers.ZReportTotals{AmountTotal: 1000.0, AmountTax: 100.0, AmountNet: 900.0},
		Payments:      []handlers.ZReportPayment{{Method: "cash", Amount: 1000.0}},
		Tickets:       []string{ticketID},
		TicketsCount:  1,
		LastTicketHash: ticketHash,
		ChainLevel:    "z-report",
		Tenant:        tenant,
	}

	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant", tenant)

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	// Vérifier la réponse
	var response handlers.ZReportResponse
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err)

	assert.Equal(t, payload.ZID, response.ZID)
	assert.Equal(t, tenant, response.Tenant)
	assert.NotEmpty(t, response.HashCurrent)
	assert.Nil(t, response.HashPrev) // Premier Z du mois, pas de hash_prev
	assert.NotEmpty(t, response.EvidenceJWS)
	assert.NotEmpty(t, response.ProofURL)

	// Vérifier que le Z-Report est stocké dans le ledger
	ctx := context.Background()
	storedZReport, err := fsLedger.GetZReport(ctx, tenant, payload.ZID)
	require.NoError(t, err)
	assert.NotNil(t, storedZReport)
	assert.Equal(t, response.HashCurrent, storedZReport.HashCurrent)
}

// TestZReports_EndToEnd_ChainedZ teste le chaînage (deuxième Z du mois)
func TestZReports_EndToEnd_ChainedZ(t *testing.T) {
	db := setupTestZReportsDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)
	ledgerPath, fsLedger := setupTestZReportsLedger(t)

	tenant := "test-tenant-2"
	ticketID1 := "POS/2025/0001"
	ticketHash1 := "abc123def4567890123456789012345678901234567890123456789012345678"
	createTestTicket(t, db, tenant, ticketID1, ticketHash1)

	ticketID2 := "POS/2025/0002"
	ticketHash2 := "def456abc1237890123456789012345678901234567890123456789012345678"
	createTestTicket(t, db, tenant, ticketID2, ticketHash2)

	// Créer les services
	repo := storage.NewPostgresRepository(db.Pool, logger.New("error"))
	validator := zreports.NewZReportValidator(fsLedger)
	signer := crypto.NewLocalSigner(jwsService)
	zreportsService := zreports.NewZReportsService(fsLedger, validator, signer, repo)

	app := fiber.New()
	cfg := &config.Config{
		ZReportMaxSizeBytes:   1024 * 1024,
		LedgerFilesystemPath: ledgerPath,
		ZReportFsyncEnabled:  true,
	}
	log := logger.New("error")
	app.Post("/api/v1/pos/zreports", handlers.PosZReportsHandler(zreportsService, cfg, log))

	now := time.Now().UTC()

	// Premier Z-Report
	payload1 := handlers.ZReportPayload{
		ZID:            "Z2025-01-15-01",
		CompanyID:      1,
		Sequence:       1,
		DateOpen:       now.Add(-10 * time.Hour).Format(time.RFC3339),
		DateClose:      now.Format(time.RFC3339),
		Totals:         handlers.ZReportTotals{AmountTotal: 1000.0, AmountTax: 100.0, AmountNet: 900.0},
		Payments:       []handlers.ZReportPayment{{Method: "cash", Amount: 1000.0}},
		Tickets:        []string{ticketID1},
		TicketsCount:   1,
		LastTicketHash: ticketHash1,
		ChainLevel:     "z-report",
		Tenant:         tenant,
	}

	body1, _ := json.Marshal(payload1)
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader(body1))
	req1.Header.Set("Content-Type", "application/json")
	req1.Header.Set("X-Tenant", tenant)

	resp1, err := app.Test(req1)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp1.StatusCode)

	var response1 handlers.ZReportResponse
	json.NewDecoder(resp1.Body).Decode(&response1)

	// Deuxième Z-Report (chaîné)
	payload2 := handlers.ZReportPayload{
		ZID:            "Z2025-01-15-02",
		CompanyID:      1,
		Sequence:       2,
		DateOpen:       now.Format(time.RFC3339),
		DateClose:      now.Add(10 * time.Hour).Format(time.RFC3339),
		Totals:         handlers.ZReportTotals{AmountTotal: 2000.0, AmountTax: 200.0, AmountNet: 1800.0},
		Payments:       []handlers.ZReportPayment{{Method: "card", Amount: 2000.0}},
		Tickets:        []string{ticketID2},
		TicketsCount:   1,
		HashPrev:       &response1.HashCurrent, // Chaînage
		LastTicketHash: ticketHash2,
		ChainLevel:     "z-report",
		Tenant:         tenant,
	}

	body2, _ := json.Marshal(payload2)
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader(body2))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("X-Tenant", tenant)

	resp2, err := app.Test(req2)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp2.StatusCode)

	var response2 handlers.ZReportResponse
	json.NewDecoder(resp2.Body).Decode(&response2)

	assert.Equal(t, payload2.ZID, response2.ZID)
	assert.NotNil(t, response2.HashPrev)
	assert.Equal(t, response1.HashCurrent, *response2.HashPrev) // Vérifier le chaînage
}

// TestZReports_Validation_TenantMismatch teste la validation du tenant
func TestZReports_Validation_TenantMismatch(t *testing.T) {
	db := setupTestZReportsDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)
	ledgerPath, fsLedger := setupTestZReportsLedger(t)

	tenant := "test-tenant-3"
	headerTenant := "different-tenant"

	repo := storage.NewPostgresRepository(db.Pool, logger.New("error"))
	validator := zreports.NewZReportValidator(fsLedger)
	signer := crypto.NewLocalSigner(jwsService)
	zreportsService := zreports.NewZReportsService(fsLedger, validator, signer, repo)

	app := fiber.New()
	cfg := &config.Config{
		ZReportMaxSizeBytes:   1024 * 1024,
		LedgerFilesystemPath: ledgerPath,
		ZReportFsyncEnabled:  true,
	}
	log := logger.New("error")
	app.Post("/api/v1/pos/zreports", handlers.PosZReportsHandler(zreportsService, cfg, log))

	now := time.Now().UTC()
	payload := handlers.ZReportPayload{
		ZID:            "Z2025-01-15-01",
		CompanyID:      1,
		Sequence:       1,
		DateOpen:       now.Add(-10 * time.Hour).Format(time.RFC3339),
		DateClose:      now.Format(time.RFC3339),
		Totals:         handlers.ZReportTotals{AmountTotal: 1000.0, AmountTax: 100.0, AmountNet: 900.0},
		Payments:       []handlers.ZReportPayment{{Method: "cash", Amount: 1000.0}},
		Tickets:        []string{"POS/2025/0001"},
		TicketsCount:   1,
		LastTicketHash: "abc123",
		ChainLevel:     "z-report",
		Tenant:         tenant, // Différent du header
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant", headerTenant) // Tenant différent

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

// TestZReports_Validation_LastTicketNotFound teste la validation last_ticket_hash
func TestZReports_Validation_LastTicketNotFound(t *testing.T) {
	db := setupTestZReportsDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)
	ledgerPath, fsLedger := setupTestZReportsLedger(t)

	tenant := "test-tenant-4"

	repo := storage.NewPostgresRepository(db.Pool, logger.New("error"))
	validator := zreports.NewZReportValidator(fsLedger)
	signer := crypto.NewLocalSigner(jwsService)
	zreportsService := zreports.NewZReportsService(fsLedger, validator, signer, repo)

	app := fiber.New()
	cfg := &config.Config{
		ZReportMaxSizeBytes:   1024 * 1024,
		LedgerFilesystemPath: ledgerPath,
		ZReportFsyncEnabled:  true,
	}
	log := logger.New("error")
	app.Post("/api/v1/pos/zreports", handlers.PosZReportsHandler(zreportsService, cfg, log))

	now := time.Now().UTC()
	payload := handlers.ZReportPayload{
		ZID:            "Z2025-01-15-01",
		CompanyID:      1,
		Sequence:       1,
		DateOpen:       now.Add(-10 * time.Hour).Format(time.RFC3339),
		DateClose:      now.Format(time.RFC3339),
		Totals:         handlers.ZReportTotals{AmountTotal: 1000.0, AmountTax: 100.0, AmountNet: 900.0},
		Payments:       []handlers.ZReportPayment{{Method: "cash", Amount: 1000.0}},
		Tickets:        []string{"POS/2025/0001"},
		TicketsCount:   1,
		LastTicketHash: "nonexistent_ticket_hash", // Ticket qui n'existe pas
		ChainLevel:     "z-report",
		Tenant:         tenant,
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant", tenant)

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusInternalServerError, resp.StatusCode) // Erreur car ticket non trouvé
}

// TestZReports_Validation_LastTicketHashOptional teste que last_ticket_hash est optionnel pour tickets_count = 0
func TestZReports_Validation_LastTicketHashOptional(t *testing.T) {
	db := setupTestZReportsDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)
	ledgerPath, fsLedger := setupTestZReportsLedger(t)

	tenant := "test-tenant-no-tickets"

	repo := storage.NewPostgresRepository(db.Pool, logger.New("error"))
	validator := zreports.NewZReportValidator(fsLedger)
	signer := crypto.NewLocalSigner(jwsService)
	zreportsService := zreports.NewZReportsService(fsLedger, validator, signer, repo)

	app := fiber.New()
	cfg := &config.Config{
		ZReportMaxSizeBytes:   1024 * 1024,
		LedgerFilesystemPath: ledgerPath,
		ZReportFsyncEnabled:  true,
	}
	log := logger.New("error")
	app.Post("/api/v1/pos/zreports", handlers.PosZReportsHandler(zreportsService, cfg, log))

	now := time.Now().UTC()
	// Z-Report sans tickets (last_ticket_hash omis)
	payload := handlers.ZReportPayload{
		ZID:           "Z2025-01-16-001",
		CompanyID:     1,
		Sequence:      1,
		DateOpen:      now.Add(-2 * time.Hour).Format(time.RFC3339),
		DateClose:     now.Format(time.RFC3339),
		Totals:        handlers.ZReportTotals{AmountTotal: 0.0, AmountTax: 0.0, AmountNet: 0.0},
		Payments:      []handlers.ZReportPayment{},
		Tickets:       []string{},
		TicketsCount:  0,
		// LastTicketHash omis (champ absent du JSON)
		ChainLevel:    "z-report",
		Tenant:        tenant,
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant", tenant)

	resp, err := app.Test(req)
	require.NoError(t, err)
	
	// Devrait réussir (201 Created) car last_ticket_hash est optionnel pour tickets_count = 0
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	// Vérifier la réponse
	var response handlers.ZReportResponse
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err)

	assert.Equal(t, payload.ZID, response.ZID)
	assert.Equal(t, tenant, response.Tenant)
	assert.NotEmpty(t, response.HashCurrent)
	assert.NotEmpty(t, response.EvidenceJWS)
}

// TestZReports_Validation_HashPrevMismatch teste la validation hash_prev
func TestZReports_Validation_HashPrevMismatch(t *testing.T) {
	db := setupTestZReportsDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)
	ledgerPath, fsLedger := setupTestZReportsLedger(t)

	tenant := "test-tenant-5"
	ticketID := "POS/2025/0001"
	ticketHash := "abc123def4567890123456789012345678901234567890123456789012345678"
	createTestTicket(t, db, tenant, ticketID, ticketHash)

	repo := storage.NewPostgresRepository(db.Pool, logger.New("error"))
	validator := zreports.NewZReportValidator(fsLedger)
	signer := crypto.NewLocalSigner(jwsService)
	zreportsService := zreports.NewZReportsService(fsLedger, validator, signer, repo)

	app := fiber.New()
	cfg := &config.Config{
		ZReportMaxSizeBytes:   1024 * 1024,
		LedgerFilesystemPath: ledgerPath,
		ZReportFsyncEnabled:  true,
	}
	log := logger.New("error")
	app.Post("/api/v1/pos/zreports", handlers.PosZReportsHandler(zreportsService, cfg, log))

	now := time.Now().UTC()

	// Premier Z-Report
	payload1 := handlers.ZReportPayload{
		ZID:            "Z2025-01-15-01",
		CompanyID:      1,
		Sequence:       1,
		DateOpen:       now.Add(-10 * time.Hour).Format(time.RFC3339),
		DateClose:      now.Format(time.RFC3339),
		Totals:         handlers.ZReportTotals{AmountTotal: 1000.0, AmountTax: 100.0, AmountNet: 900.0},
		Payments:       []handlers.ZReportPayment{{Method: "cash", Amount: 1000.0}},
		Tickets:        []string{ticketID},
		TicketsCount:   1,
		LastTicketHash: ticketHash,
		ChainLevel:     "z-report",
		Tenant:         tenant,
	}

	body1, _ := json.Marshal(payload1)
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader(body1))
	req1.Header.Set("Content-Type", "application/json")
	req1.Header.Set("X-Tenant", tenant)

	resp1, _ := app.Test(req1)
	var response1 handlers.ZReportResponse
	json.NewDecoder(resp1.Body).Decode(&response1)

	// Deuxième Z avec hash_prev incorrect
	wrongHash := "wrong_hash_prev_value"
	payload2 := handlers.ZReportPayload{
		ZID:            "Z2025-01-15-02",
		CompanyID:      1,
		Sequence:       2,
		DateOpen:       now.Format(time.RFC3339),
		DateClose:      now.Add(10 * time.Hour).Format(time.RFC3339),
		Totals:         handlers.ZReportTotals{AmountTotal: 2000.0, AmountTax: 200.0, AmountNet: 1800.0},
		Payments:       []handlers.ZReportPayment{{Method: "card", Amount: 2000.0}},
		Tickets:        []string{ticketID},
		TicketsCount:   1,
		HashPrev:       &wrongHash, // Hash incorrect
		LastTicketHash: ticketHash,
		ChainLevel:     "z-report",
		Tenant:         tenant,
	}

	body2, _ := json.Marshal(payload2)
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader(body2))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("X-Tenant", tenant)

	resp2, err := app.Test(req2)
	require.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp2.StatusCode) // Erreur de validation
}

// TestZReports_EvidenceEndpoint teste l'endpoint GET /api/v1/evidence/:tenant/:z_id
func TestZReports_EvidenceEndpoint(t *testing.T) {
	db := setupTestZReportsDB(t)
	defer db.Close()

	jwsService := setupTestJWS(t)
	ledgerPath, fsLedger := setupTestZReportsLedger(t)

	tenant := "test-tenant-6"
	ticketID := "POS/2025/0001"
	ticketHash := "abc123def4567890123456789012345678901234567890123456789012345678"
	createTestTicket(t, db, tenant, ticketID, ticketHash)

	repo := storage.NewPostgresRepository(db.Pool, logger.New("error"))
	validator := zreports.NewZReportValidator(fsLedger)
	signer := crypto.NewLocalSigner(jwsService)
	zreportsService := zreports.NewZReportsService(fsLedger, validator, signer, repo)

	app := fiber.New()
	cfg := &config.Config{
		ZReportMaxSizeBytes:   1024 * 1024,
		LedgerFilesystemPath: ledgerPath,
		ZReportFsyncEnabled:  true,
	}
	log := logger.New("error")

	// Créer un Z-Report d'abord
	app.Post("/api/v1/pos/zreports", handlers.PosZReportsHandler(zreportsService, cfg, log))
	now := time.Now().UTC()
	payload := handlers.ZReportPayload{
		ZID:            "Z2025-01-15-01",
		CompanyID:      1,
		Sequence:       1,
		DateOpen:       now.Add(-10 * time.Hour).Format(time.RFC3339),
		DateClose:      now.Format(time.RFC3339),
		Totals:         handlers.ZReportTotals{AmountTotal: 1000.0, AmountTax: 100.0, AmountNet: 900.0},
		Payments:       []handlers.ZReportPayment{{Method: "cash", Amount: 1000.0}},
		Tickets:        []string{ticketID},
		TicketsCount:   1,
		LastTicketHash: ticketHash,
		ChainLevel:     "z-report",
		Tenant:         tenant,
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant", tenant)

	resp, _ := app.Test(req)
	var response handlers.ZReportResponse
	json.NewDecoder(resp.Body).Decode(&response)

	// Tester l'endpoint evidence
	app.Get("/api/v1/evidence/:tenant/:z_id", handlers.GetZReportEvidence(fsLedger, log))

	reqEvidence := httptest.NewRequest(http.MethodGet, "/api/v1/evidence/"+tenant+"/"+payload.ZID, nil)
	respEvidence, err := app.Test(reqEvidence)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, respEvidence.StatusCode)

	var evidence map[string]interface{}
	err = json.NewDecoder(respEvidence.Body).Decode(&evidence)
	require.NoError(t, err)
	assert.Equal(t, payload.ZID, evidence["z_id"])
	assert.Equal(t, tenant, evidence["tenant"])
	assert.Equal(t, response.HashCurrent, evidence["hash_current"])
}

