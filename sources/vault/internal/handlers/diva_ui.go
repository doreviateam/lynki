// Package handlers — gateway UI DIVA (ADR-001 ZeDocs/web51).
//
// Le Vault expose des routes UI stables pour Linky ; proxification vers DIVA.
// Contraintes et erreurs : même doctrine que dlp_ui.go (ANALYSE § 2.4, 2.5, V0.4).
package handlers

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// DIVAInsightsHandler gère GET /ui/diva/insights (gateway vers DIVA /diva/insights).
func DIVAInsightsHandler(cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return divaProxyHandler(cfg, log, "GET", "/diva/insights", false, 0)
}

// DIVAGenerateHandler gère POST /ui/diva/generate (gateway vers DIVA /diva/generate).
func DIVAGenerateHandler(cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return divaProxyHandler(cfg, log, "POST", "/diva/generate", true, 0)
}

// DIVAExplainHandler gère POST /ui/diva/explain (gateway vers DIVA /diva/explain).
func DIVAExplainHandler(cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return divaProxyHandler(cfg, log, "POST", "/diva/explain", true, 0)
}

// DIVAExplainAsyncHandler gère POST /ui/diva/explain/async (gateway vers DIVA /diva/explain/async).
func DIVAExplainAsyncHandler(cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return divaProxyHandler(cfg, log, "POST", "/diva/explain/async", true, 0)
}

// DIVAActivityHandler gère POST /ui/diva/activity (gateway vers DIVA /diva/activity).
// Enregistre la dernière consultation utilisateur pour la garde d'inactivité du runner.
func DIVAActivityHandler(cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return divaProxyHandler(cfg, log, "POST", "/diva/activity", true, 0)
}

// DIVAGetActivityHandler gère GET /ui/diva/activity (gateway vers DIVA GET /diva/activity).
func DIVAGetActivityHandler(cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return divaProxyHandler(cfg, log, "GET", "/diva/activity", false, 0)
}

// DIVAJobsHandler gère GET /ui/diva/jobs/:contextHash (gateway vers DIVA /diva/jobs/:contextHash).
func DIVAJobsHandler(cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		contextHash := c.Params("contextHash")
		if contextHash == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "contextHash required"})
		}
		targetPath := "/diva/jobs/" + contextHash
		return divaProxy(c, cfg, log, "GET", targetPath, false, nil)
	}
}

func divaProxyHandler(cfg *config.Config, log *zerolog.Logger, method, targetPath string, withBody bool, timeoutMs int) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body []byte
		if withBody {
			body = c.Body()
		}
		return divaProxy(c, cfg, log, method, targetPath, withBody, body)
	}
}

func divaProxy(c *fiber.Ctx, cfg *config.Config, log *zerolog.Logger, method, targetPath string, withBody bool, body []byte) error {
	start := time.Now()
	requestID := middleware.GetTraceID(c)
	tenant := middleware.GetTenant(c)
	if tenant == "" {
		tenant = c.Query("tenant")
	}

	if cfg == nil || strings.TrimSpace(cfg.DIVAURL) == "" {
		if log != nil {
			log.Warn().Str("request_id", requestID).Str("tenant", tenant).Str("route", targetPath).Msg("gateway diva: DIVA_URL not configured")
		}
		return writeGatewayError(c, fiber.StatusServiceUnavailable, "gateway_unconfigured", "DIVA gateway not configured", requestID)
	}

	timeoutMs := cfg.DIVATimeoutMs
	if timeoutMs <= 0 {
		timeoutMs = 60000
	}
	if targetPath == "/diva/generate" {
		if cfg.DIVAPrewarmMs > 0 {
			timeoutMs = cfg.DIVAPrewarmMs
		}
		if cfg.DIVARefreshMs > 0 && bytes.Contains(body, []byte("refresh")) {
			timeoutMs = cfg.DIVARefreshMs
		}
	}

	baseURL := strings.TrimSuffix(cfg.DIVAURL, "/")
	rawQuery := c.Context().QueryArgs().String()
	backendURL := baseURL + targetPath
	if rawQuery != "" {
		backendURL += "?" + rawQuery
	}

	ctx, cancel := context.WithTimeout(c.Context(), time.Duration(timeoutMs)*time.Millisecond)
	defer cancel()

	var bodyReader io.Reader
	if withBody && len(body) > 0 {
		bodyReader = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, backendURL, bodyReader)
	if err != nil {
		if log != nil {
			log.Error().Err(err).Str("request_id", requestID).Str("tenant", tenant).Str("route", targetPath).Msg("gateway diva: request build failed")
		}
		return writeGatewayError(c, fiber.StatusBadGateway, "gateway_error", "Failed to build request", requestID)
	}
	req.Header.Set("Accept", "application/json")
	if requestID != "" {
		req.Header.Set("X-Trace-Id", requestID)
	}
	if tenant != "" {
		req.Header.Set("X-Tenant", tenant)
	}
	if bodyReader != nil {
		req.Header.Set("Content-Type", c.Get("Content-Type", "application/json"))
	}

	client := &http.Client{Timeout: time.Duration(timeoutMs+2000) * time.Millisecond}
	resp, err := client.Do(req)
	if err != nil {
		timeoutHit := ctx.Err() == context.DeadlineExceeded
		if log != nil {
			log.Warn().Err(err).Str("request_id", requestID).Str("tenant", tenant).Str("route", targetPath).Dur("duration_ms", time.Since(start)).Bool("timeout", timeoutHit).Msg("gateway diva: backend call failed")
		}
		code, msg := "gateway_error", "Backend unreachable"
		if timeoutHit {
			code, msg = "gateway_timeout", "Backend timeout"
		}
		return writeGatewayError(c, fiber.StatusBadGateway, code, msg, requestID)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		if log != nil {
			log.Warn().Err(err).Str("request_id", requestID).Str("tenant", tenant).Str("route", targetPath).Int("status_aval", resp.StatusCode).Dur("duration_ms", time.Since(start)).Msg("gateway diva: read body failed")
		}
		return writeGatewayError(c, fiber.StatusBadGateway, "gateway_error", "Failed to read backend response", requestID)
	}

	if log != nil {
		log.Info().
			Str("request_id", requestID).Str("tenant", tenant).
			Str("route", targetPath).Str("method", method).
			Int("status_aval", resp.StatusCode).Dur("duration_ms", time.Since(start)).
			Msg("gateway diva: request completed")
	}

	if resp.StatusCode >= 500 {
		return writeGatewayError(c, fiber.StatusBadGateway, "backend_error", "Backend returned error", requestID)
	}
	if resp.StatusCode >= 400 {
		return writeGatewayError(c, fiber.StatusBadGateway, "backend_client_error", "Backend returned client error", requestID)
	}

	ct := resp.Header.Get("Content-Type")
	if ct == "" {
		ct = "application/json"
	}
	c.Set("Content-Type", ct)
	return c.Status(resp.StatusCode).Send(respBody)
}
