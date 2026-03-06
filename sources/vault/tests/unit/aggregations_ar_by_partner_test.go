package unit

import (
	"net/http/httptest"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestArByPartnerAggregationHandler_NoDB(t *testing.T) {
	app := fiber.New()
	app.Get("/ui/aggregations/ar-by-partner", handlers.ArByPartnerAggregationHandler(nil))

	req := httptest.NewRequest("GET", "/ui/aggregations/ar-by-partner?tenant=core&date_debut=2026-01-01&date_fin=2026-01-31", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusServiceUnavailable, resp.StatusCode)
}

func TestArByPartnerAggregationHandler_MissingTenant(t *testing.T) {
	app := fiber.New()
	app.Get("/ui/aggregations/ar-by-partner", handlers.ArByPartnerAggregationHandler(nil))

	req := httptest.NewRequest("GET", "/ui/aggregations/ar-by-partner?date_debut=2026-01-01&date_fin=2026-01-31", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}
