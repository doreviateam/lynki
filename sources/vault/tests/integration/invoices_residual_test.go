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
	"github.com/doreviateam/dorevia-vault/internal/server"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestInvoicesResidual_Update teste POST /api/v1/invoices/residual (SPEC AR by Partner S2.1)
func TestInvoicesResidual_Update(t *testing.T) {
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
	cfg := &config.Config{MaxBase64SizeBytes: 15 * 1024 * 1024, JWSEnabled: false, LedgerEnabled: false}

	app := fiber.New()
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, nil, cfg, &logger, nil, nil))
	server.RegisterInvoicesResidualRoute(app, db, &logger)

	// 1. Créer une facture via invoices
	invPayload := map[string]interface{}{
		"source":  "sales",
		"model":  "account.move",
		"odoo_id": 99991,
		"state":  "posted",
		"file":   base64.StdEncoding.EncodeToString([]byte("test invoice for residual")),
		"meta": map[string]interface{}{
			"move_type": "out_invoice",
			"tenant":    "residual-test-tenant",
		},
	}
	invBody, _ := json.Marshal(invPayload)
	req := httptest.NewRequest("POST", "/api/v1/invoices", bytes.NewReader(invBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	require.Equal(t, 201, resp.StatusCode, "invoice must be created first")

	// 2. Envoyer residual
	resPayload := map[string]interface{}{
		"tenant":     "residual-test-tenant",
		"company_id": "",
		"source": map[string]interface{}{
			"model": "account.move",
			"id":   "99991",
		},
		"invoice": map[string]interface{}{
			"amount_residual":   150.50,
			"invoice_date_due":  "2026-03-15",
		},
		"partner": map[string]interface{}{
			"partner_id": "42",
		},
		"change": map[string]interface{}{
			"changed_at": "2026-02-22T10:00:00Z",
		},
		"idempotency": map[string]interface{}{
			"event_id": "evt-residual-test-001",
		},
	}
	resBody, _ := json.Marshal(resPayload)
	req2 := httptest.NewRequest("POST", "/api/v1/invoices/residual", bytes.NewReader(resBody))
	req2.Header.Set("Content-Type", "application/json")
	resp2, err := app.Test(req2)
	require.NoError(t, err)
	assert.Equal(t, 200, resp2.StatusCode)

	var resResp handlers.ResidualResponse
	require.NoError(t, json.NewDecoder(resp2.Body).Decode(&resResp))
	assert.Equal(t, "updated", resResp.Status)

	// 3. Idempotence : même event_id → ignored
	req3 := httptest.NewRequest("POST", "/api/v1/invoices/residual", bytes.NewReader(resBody))
	req3.Header.Set("Content-Type", "application/json")
	resp3, err := app.Test(req3)
	require.NoError(t, err)
	assert.Equal(t, 200, resp3.StatusCode)
	var resResp3 handlers.ResidualResponse
	require.NoError(t, json.NewDecoder(resp3.Body).Decode(&resResp3))
	assert.Equal(t, "ignored_idempotent", resResp3.Status)
}

// TestInvoicesResidual_NotFound vérifie 404 quand le document n'existe pas
func TestInvoicesResidual_NotFound(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	ctx := context.Background()
	logger := zerolog.Nop()
	db, err := storage.NewDB(ctx, dbURL, &logger)
	require.NoError(t, err)
	defer db.Close()

	app := fiber.New()
	server.RegisterInvoicesResidualRoute(app, db, &logger)

	resPayload := map[string]interface{}{
		"tenant":    "nonexistent",
		"company_id": "odoo:99",
		"source": map[string]interface{}{"model": "account.move", "id": "999999"},
		"invoice": map[string]interface{}{"amount_residual": 100, "invoice_date_due": "2026-03-01"},
		"partner": map[string]interface{}{"partner_id": "1"},
		"change": map[string]interface{}{"changed_at": "2026-02-22T10:00:00Z"},
		"idempotency": map[string]interface{}{"event_id": "evt-notfound-001"},
	}
	body, _ := json.Marshal(resPayload)
	req := httptest.NewRequest("POST", "/api/v1/invoices/residual", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 404, resp.StatusCode)
}
