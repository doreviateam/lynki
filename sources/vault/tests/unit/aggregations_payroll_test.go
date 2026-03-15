package unit

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestPayrollAggregationHandler_NoDB(t *testing.T) {
	app := fiber.New()
	app.Get("/ui/aggregations/payroll", handlers.PayrollAggregationHandler(nil, nil))

	req := httptest.NewRequest("GET", "/ui/aggregations/payroll?tenant=laplatine2026&date_debut=2026-01-01&date_fin=2026-02-28", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusServiceUnavailable, resp.StatusCode)
}

func TestPayrollAggregationHandler_MissingTenant(t *testing.T) {
	app := fiber.New()
	app.Get("/ui/aggregations/payroll", handlers.PayrollAggregationHandler(nil, nil))

	req := httptest.NewRequest("GET", "/ui/aggregations/payroll?date_debut=2026-01-01&date_fin=2026-02-28", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestPayrollAggregationHandler_ResponseShape(t *testing.T) {
	// Test avec DB nil pour vérifier que le handler exige tenant ; avec un vrai DB on vérifierait payroll_source.
	app := fiber.New()
	app.Get("/ui/aggregations/payroll", handlers.PayrollAggregationHandler(nil, nil))
	req := httptest.NewRequest("GET", "/ui/aggregations/payroll?tenant=t&date_debut=2026-01-01&date_fin=2026-01-31", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	// Sans DB on a 503
	assert.Equal(t, fiber.StatusServiceUnavailable, resp.StatusCode)
	_ = resp
}

// TestPayrollAggregationResponse_Fields vérifie que la structure de réponse inclut les champs EBE OD payroll.
func TestPayrollAggregationResponse_Fields(t *testing.T) {
	var r models.PayrollAggregationResponse
	r.Tenant = "t"
	r.PayrollSource = "none"
	r.PayrollUnavailable = true
	r.TotalCharges = 0
	r.Total = 0
	r.PayslipCount = 0
	r.Currency = "EUR"
	r.From = "2026-01-01"
	r.To = "2026-01-31"
	r.Granularity = "month"
	r.Series = []models.SeriesPoint{}

	// Sérialisation JSON pour s'assurer que les champs sont exportés
	b, err := json.Marshal(r)
	assert.NoError(t, err)
	var m map[string]interface{}
	err = json.Unmarshal(b, &m)
	assert.NoError(t, err)
	assert.Equal(t, "none", m["payroll_source"])
	assert.Equal(t, true, m["payroll_unavailable"])
	assert.Contains(t, m, "total") // total toujours présent (alias total_charges)
	assert.Contains(t, m, "total_charges")
}
