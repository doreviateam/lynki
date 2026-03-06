package server

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/buildinfo"
	"github.com/gofiber/fiber/v2"
)

// Minimal handlers sans dépendance storage — pour route /ui/system/vault-health (Linky Integrity Badge).

// Health retourne l'état de santé du service
func Health(c *fiber.Ctx) error {
	return c.SendString("ok")
}

// Version retourne la version du service
func Version(c *fiber.Ctx) error {
	return c.JSON(buildinfo.VersionPayload{
		Version: buildinfo.Version,
		Commit:  buildinfo.Commit,
		BuiltAt: buildinfo.BuiltAt,
		Schema:  buildinfo.Schema,
	})
}

// Home retourne la page d'accueil minimale
func Home(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.SendString(`<!DOCTYPE html><html><head><title>Dorevia Vault</title></head><body><h1>Dorevia Vault API</h1><p><a href="/health">/health</a> | <a href="/version">/version</a> | <a href="/ui/system/vault-health?tenant=core">/ui/system/vault-health</a> | <a href="/replay/wizard">Rebrancher un ERP</a></p></body></html>`)
}

// VaultHealthHandler proxy vers DVIG /internal/vault-health (SPEC Indicateur Confiance Vaultage v1.0, SPEC LINKY LAYOUT v1.3)
func VaultHealthHandler(dvigURL, dvigToken string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		if dvigURL == "" || dvigToken == "" {
			return c.JSON(fiber.Map{
				"vault_rate":     nil,
				"pending_events": 0,
				"failed_events":  0,
				"last_sync_at":   nil,
			})
		}
		base, _ := url.Parse(dvigURL)
		base.Path = "/internal/vault-health"
		q := base.Query()
		q.Set("tenant", tenant)
		base.RawQuery = q.Encode()
		req, err := http.NewRequestWithContext(c.Context(), http.MethodGet, base.String(), nil)
		if err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"vault_rate": nil, "pending_events": 0, "failed_events": 0, "last_sync_at": nil,
			})
		}
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Authorization", "Bearer "+dvigToken)
		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"vault_rate": nil, "pending_events": 0, "failed_events": 0, "last_sync_at": nil,
			})
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"vault_rate": nil, "pending_events": 0, "failed_events": 0, "last_sync_at": nil,
			})
		}
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"vault_rate": nil, "pending_events": 0, "failed_events": 0, "last_sync_at": nil,
			})
		}
		var data struct {
			VaultRate     *float64 `json:"vault_rate"`
			PendingEvents int      `json:"pending_events"`
			FailedEvents  int      `json:"failed_events"`
			LastSyncAt    *string  `json:"last_sync_at"`
		}
		if err := json.NewDecoder(bytes.NewReader(body)).Decode(&data); err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"vault_rate": nil, "pending_events": 0, "failed_events": 0, "last_sync_at": nil,
			})
		}
		return c.JSON(fiber.Map{
			"vault_rate":     data.VaultRate,
			"pending_events": data.PendingEvents,
			"failed_events":  data.FailedEvents,
			"last_sync_at":   data.LastSyncAt,
		})
	}
}
