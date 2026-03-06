package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/gofiber/fiber/v2"
)

type VaultHealthResponse struct {
	VaultRate     *float64 `json:"vault_rate"`
	PendingEvents int      `json:"pending_events"`
	FailedEvents  int      `json:"failed_events"`
	LastSyncAt    *string  `json:"last_sync_at"`
}

func VaultHealthHandler(dvigURL, dvigToken string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		if dvigURL == "" || dvigToken == "" {
			return c.JSON(VaultHealthResponse{VaultRate: nil, PendingEvents: 0, FailedEvents: 0, LastSyncAt: nil})
		}
		base, _ := url.Parse(dvigURL)
		base.Path = "/internal/vault-health"
		q := base.Query()
		q.Set("tenant", tenant)
		base.RawQuery = q.Encode()
		req, err := http.NewRequestWithContext(c.Context(), http.MethodGet, base.String(), nil)
		if err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(VaultHealthResponse{VaultRate: nil, PendingEvents: 0, FailedEvents: 0, LastSyncAt: nil})
		}
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Authorization", "Bearer "+dvigToken)
		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(VaultHealthResponse{VaultRate: nil, PendingEvents: 0, FailedEvents: 0, LastSyncAt: nil})
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			return c.Status(fiber.StatusServiceUnavailable).JSON(VaultHealthResponse{VaultRate: nil, PendingEvents: 0, FailedEvents: 0, LastSyncAt: nil})
		}
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(VaultHealthResponse{VaultRate: nil, PendingEvents: 0, FailedEvents: 0, LastSyncAt: nil})
		}
		var data struct {
			VaultRate     *float64 `json:"vault_rate"`
			PendingEvents int      `json:"pending_events"`
			FailedEvents  int      `json:"failed_events"`
			LastSyncAt    *string  `json:"last_sync_at"`
		}
		if err := json.NewDecoder(bytes.NewReader(body)).Decode(&data); err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(VaultHealthResponse{VaultRate: nil, PendingEvents: 0, FailedEvents: 0, LastSyncAt: nil})
		}
		return c.JSON(VaultHealthResponse{
			VaultRate:     data.VaultRate,
			PendingEvents: data.PendingEvents,
			FailedEvents:  data.FailedEvents,
			LastSyncAt:    data.LastSyncAt,
		})
	}
}
