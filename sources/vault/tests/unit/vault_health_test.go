package unit

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestVaultHealthHandler_MissingTenant(t *testing.T) {
	app := fiber.New()
	app.Get("/ui/system/vault-health", handlers.VaultHealthHandler("", ""))

	req := httptest.NewRequest("GET", "/ui/system/vault-health", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestVaultHealthHandler_StubWhenNoDvigConfig(t *testing.T) {
	app := fiber.New()
	app.Get("/ui/system/vault-health", handlers.VaultHealthHandler("", ""))

	req := httptest.NewRequest("GET", "/ui/system/vault-health?tenant=sarl-la-platine", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)

	var body struct {
		VaultRate     *float64 `json:"vault_rate"`
		PendingEvents int      `json:"pending_events"`
		FailedEvents  int      `json:"failed_events"`
		LastSyncAt    *string  `json:"last_sync_at"`
	}
	err = json.NewDecoder(resp.Body).Decode(&body)
	assert.NoError(t, err)
	assert.Nil(t, body.VaultRate)
	assert.Equal(t, 0, body.PendingEvents)
	assert.Equal(t, 0, body.FailedEvents)
	assert.Nil(t, body.LastSyncAt)
}
