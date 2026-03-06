package unit

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestPaymentsCompletenessHandler_MissingTenant(t *testing.T) {
	app := fiber.New()
	app.Get("/ui/aggregations/payments-completeness", handlers.PaymentsCompletenessHandler(nil, "", nil))

	req := httptest.NewRequest("GET", "/ui/aggregations/payments-completeness?date_from=2026-01-01&date_to=2026-01-31", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestPaymentsCompletenessHandler_WithTenant_ReturnsJSON(t *testing.T) {
	app := fiber.New()
	app.Get("/ui/aggregations/payments-completeness", handlers.PaymentsCompletenessHandler(nil, "", nil))

	req := httptest.NewRequest("GET", "/ui/aggregations/payments-completeness?tenant=laplatine2026&date_from=2026-01-01&date_to=2026-01-31", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)

	var body struct {
		OK      bool   `json:"ok"`
		Badge   string `json:"badge"`
		Message string `json:"message"`
	}
	err = json.NewDecoder(resp.Body).Decode(&body)
	assert.NoError(t, err)
	assert.False(t, body.OK, "sans Odoo configuré, ok doit être false")
	assert.Equal(t, "Données incomplètes", body.Badge)
	assert.Contains(t, body.Message, "Odoo")
}

func TestPaymentsCompletenessHandler_ConfigWithoutOdooURL(t *testing.T) {
	cfg := &config.Config{
		OdooBankReconciliationTenant: "sarl-la-platine",
		// OdooBankReconciliationURL vide
	}
	app := fiber.New()
	app.Get("/ui/aggregations/payments-completeness", handlers.PaymentsCompletenessHandler(nil, "", cfg))

	req := httptest.NewRequest("GET", "/ui/aggregations/payments-completeness?tenant=other-tenant&date_from=2026-01-01&date_to=2026-01-31", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)

	var body struct {
		OK    bool   `json:"ok"`
		Badge string `json:"badge"`
	}
	err = json.NewDecoder(resp.Body).Decode(&body)
	assert.NoError(t, err)
	assert.False(t, body.OK)
	assert.Equal(t, "Données incomplètes", body.Badge)
}
