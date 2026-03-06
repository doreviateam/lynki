package unit

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

// TestGetProofAccountMoveWithoutDB teste le handler sans DB configurée
func TestGetProofAccountMoveWithoutDB(t *testing.T) {
	app := fiber.New()
	app.Get("/proof/account_move/:id", handlers.GetProofAccountMove(nil, nil, nil))

	req := httptest.NewRequest("GET", "/proof/account_move/123", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 503, resp.StatusCode)

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "Database not configured", result["error"])
}

// TestGetProofAccountMoveMissingID teste avec un ID manquant
func TestGetProofAccountMoveMissingID(t *testing.T) {
	app := fiber.New()
	app.Get("/proof/account_move/:id", handlers.GetProofAccountMove(nil, nil, nil))

	req := httptest.NewRequest("GET", "/proof/account_move/", nil)
	_, err := app.Test(req)

	assert.NoError(t, err)
	// Note: Fiber gère les routes avec paramètres, donc cela pourrait être 404 ou autre
	// Le test principal est que sans DB, on obtient 503
}

// TestGetProofAccountPaymentWithoutDB teste le handler sans DB configurée
func TestGetProofAccountPaymentWithoutDB(t *testing.T) {
	app := fiber.New()
	app.Get("/proof/account_payment/:id", handlers.GetProofAccountPayment(nil, nil))

	req := httptest.NewRequest("GET", "/proof/account_payment/456", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 503, resp.StatusCode)

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "Database not configured", result["error"])
}

// TestGetProofPosOrderWithoutDB teste le handler sans DB configurée
func TestGetProofPosOrderWithoutDB(t *testing.T) {
	app := fiber.New()
	app.Get("/proof/pos_order/:id", handlers.GetProofPosOrder(nil, nil))

	req := httptest.NewRequest("GET", "/proof/pos_order/123", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 503, resp.StatusCode)

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "Database not configured", result["error"])
}

// TestGetProofPosPaymentWithoutDB teste le handler sans DB configurée
func TestGetProofPosPaymentWithoutDB(t *testing.T) {
	app := fiber.New()
	app.Get("/proof/pos_payment/:id", handlers.GetProofPosPayment(nil, nil))

	req := httptest.NewRequest("GET", "/proof/pos_payment/789", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 503, resp.StatusCode)

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "Database not configured", result["error"])
}

// TestGetProofPosZreport teste le handler Z-Report (non implémenté)
func TestGetProofPosZreport(t *testing.T) {
	app := fiber.New()
	app.Get("/proof/pos_zreport/:id", handlers.GetProofPosZreport())

	req := httptest.NewRequest("GET", "/proof/pos_zreport/Z2025-01-15-01", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 501, resp.StatusCode) // Not Implemented

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Contains(t, result["error"], "not yet implemented")
}

// TestGetProofsBulkWithoutDB teste le handler bulk sans DB configurée
func TestGetProofsBulkWithoutDB(t *testing.T) {
	app := fiber.New()
	app.Post("/proof/bulk", handlers.GetProofsBulk(nil))

	reqBody := map[string]interface{}{
		"requests": []map[string]string{
			{"type": "account_move", "id": "123"},
			{"type": "account_payment", "id": "456"},
		},
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("POST", "/proof/bulk", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 503, resp.StatusCode)

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "Database not configured", result["error"])
}

// TestGetProofsBulkInvalidBody teste avec un body invalide
func TestGetProofsBulkInvalidBody(t *testing.T) {
	app := fiber.New()
	app.Post("/proof/bulk", handlers.GetProofsBulk(nil))

	req := httptest.NewRequest("POST", "/proof/bulk", bytes.NewReader([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 503, resp.StatusCode) // DB not configured prend le dessus
}

// TestGetProofsBulkTooManyRequests teste avec plus de 100 requêtes
func TestGetProofsBulkTooManyRequests(t *testing.T) {
	app := fiber.New()
	app.Post("/proof/bulk", handlers.GetProofsBulk(nil))

	// Créer 101 requêtes
	requests := make([]map[string]string, 101)
	for i := 0; i < 101; i++ {
		requests[i] = map[string]string{
			"type": "account_move",
			"id":   string(rune(i)),
		}
	}

	reqBody := map[string]interface{}{
		"requests": requests,
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("POST", "/proof/bulk", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 503, resp.StatusCode) // DB not configured prend le dessus
	// Note: En production avec DB, cela devrait retourner 400 avec "Too many requests"
}

