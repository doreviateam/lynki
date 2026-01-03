package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

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

// TestPayments_EndToEnd teste le flux complet HTTP → DB → Ledger → JWS
func TestPayments_EndToEnd(t *testing.T) {
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

	// Payload de test
	payload := handlers.PaymentPayload{
		Tenant:           "test-tenant",
		SourceSystem:     "odoo",
		SourceModel:      "account.payment",
		SourceID:         "PAY/TEST/001",
		PaymentDate:      time.Now().UTC().Format(time.RFC3339),
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

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/payments", bytes.NewBuffer(payloadJSON))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant", "test-tenant")

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var response handlers.PaymentResponse
	err = json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err)

	assert.NotEmpty(t, response.ID)
	assert.Equal(t, "test-tenant", response.Tenant)
	assert.NotEmpty(t, response.SHA256Hex)
	assert.NotNil(t, response.EvidenceJWS)
}

// TestPayments_Idempotent teste l'idempotence
func TestPayments_Idempotent(t *testing.T) {
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

	// Payload de test
	payload := handlers.PaymentPayload{
		Tenant:           "test-tenant",
		SourceSystem:     "odoo",
		SourceModel:      "account.payment",
		SourceID:         "PAY/TEST/002",
		PaymentDate:      time.Now().UTC().Format(time.RFC3339),
		Amount:           200.00,
		Currency:         "EUR",
		Method:           "transfer",
		Source:           "account",
		PaymentDirection: "inbound",
		IsRefund:         false,
		CompanyID:        1,
		Payment: map[string]interface{}{
			"allocated_invoices": []interface{}{
				map[string]interface{}{"invoice": "FAC/001", "portion": 200.00},
			},
		},
	}

	payloadJSON, err := json.Marshal(payload)
	require.NoError(t, err)

	// Premier appel
	req1 := httptest.NewRequest("POST", "/api/v1/payments", bytes.NewBuffer(payloadJSON))
	req1.Header.Set("Content-Type", "application/json")
	req1.Header.Set("X-Tenant", "test-tenant")

	resp1, err := app.Test(req1)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp1.StatusCode)

	var response1 handlers.PaymentResponse
	err = json.NewDecoder(resp1.Body).Decode(&response1)
	require.NoError(t, err)

	// Deuxième appel avec le même payload
	req2 := httptest.NewRequest("POST", "/api/v1/payments", bytes.NewBuffer(payloadJSON))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("X-Tenant", "test-tenant")

	resp2, err := app.Test(req2)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp2.StatusCode) // 200 OK pour idempotence

	var response2 handlers.PaymentResponse
	err = json.NewDecoder(resp2.Body).Decode(&response2)
	require.NoError(t, err)

	// Vérifier que les réponses sont identiques
	assert.Equal(t, response1.ID, response2.ID)
	assert.Equal(t, response1.SHA256Hex, response2.SHA256Hex)
}

// TestPayments_ValidationErrors teste les erreurs de validation
func TestPayments_ValidationErrors(t *testing.T) {
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

	tests := []struct {
		name           string
		payload        map[string]interface{}
		expectedStatus int
		expectedError  string
		tenantHeader   string
	}{
		{
			name:           "missing tenant",
			payload:        map[string]interface{}{},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Missing required field: tenant",
			tenantHeader:   "",
		},
		{
			name: "tenant mismatch",
			payload: map[string]interface{}{
				"tenant": "different-tenant",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Tenant mismatch",
			tenantHeader:   "test-tenant",
		},
		{
			name: "missing source_model",
			payload: map[string]interface{}{
				"tenant": "test-tenant",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Missing required field: source_model",
			tenantHeader:   "test-tenant",
		},
		{
			name: "invalid amount",
			payload: map[string]interface{}{
				"tenant":      "test-tenant",
				"source_model": "account.payment",
				"source_id":    "PAY/001",
				"amount":       0,
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "amount must be greater than 0",
			tenantHeader:   "test-tenant",
		},
		{
			name: "invalid method",
			payload: map[string]interface{}{
				"tenant":            "test-tenant",
				"source_model":      "account.payment",
				"source_id":         "PAY/001",
				"payment_date":      time.Now().UTC().Format(time.RFC3339),
				"amount":            100.00,
				"currency":          "EUR",
				"method":            "invalid-method",
				"source":            "pos",
				"payment_direction": "inbound",
				"is_refund":         false,
				"company_id":        1,
				"payment":           map[string]interface{}{},
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid method",
			tenantHeader:   "test-tenant",
		},
		{
			name: "invalid date format",
			payload: map[string]interface{}{
				"tenant":            "test-tenant",
				"source_model":      "account.payment",
				"source_id":         "PAY/001",
				"payment_date":      "invalid-date",
				"amount":            100.00,
				"currency":          "EUR",
				"method":            "cash",
				"source":            "pos",
				"payment_direction": "inbound",
				"is_refund":         false,
				"company_id":        1,
				"payment":           map[string]interface{}{},
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid payment_date format",
			tenantHeader:   "test-tenant",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payloadJSON, err := json.Marshal(tt.payload)
			require.NoError(t, err)

			req := httptest.NewRequest("POST", "/api/v1/payments", bytes.NewBuffer(payloadJSON))
			req.Header.Set("Content-Type", "application/json")
			if tt.tenantHeader != "" {
				req.Header.Set("X-Tenant", tt.tenantHeader)
			}

			resp, err := app.Test(req)
			require.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			var errorResponse map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&errorResponse)
			require.NoError(t, err)
			assert.Contains(t, errorResponse["error"].(string), tt.expectedError)
		})
	}
}

// Note: setupTestDB et setupTestJWS sont maintenant dans test_helpers.go

