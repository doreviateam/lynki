package unit

import (
	"net/http/httptest"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestAdjustmentsAggregationHandler_NoDB(t *testing.T) {
	app := fiber.New()
	app.Get("/ui/aggregations/adjustments", handlers.AdjustmentsAggregationHandler(nil))

	req := httptest.NewRequest("GET", "/ui/aggregations/adjustments?tenant=sarl-la-platine&date_debut=2026-01-01&date_fin=2026-01-31", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusServiceUnavailable, resp.StatusCode)
}

func TestAdjustmentsAggregationHandler_MissingParams(t *testing.T) {
	app := fiber.New()
	app.Get("/ui/aggregations/adjustments", handlers.AdjustmentsAggregationHandler(nil))

	t.Run("missing date_debut", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/ui/aggregations/adjustments?tenant=sarl-la-platine&date_fin=2026-01-31", nil)
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})

	t.Run("missing date_fin", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/ui/aggregations/adjustments?tenant=sarl-la-platine&date_debut=2026-01-01", nil)
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})

	t.Run("missing tenant", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/ui/aggregations/adjustments?date_debut=2026-01-01&date_fin=2026-01-31", nil)
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})
}
