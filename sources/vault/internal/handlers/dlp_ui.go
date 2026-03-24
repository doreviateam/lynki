// Package handlers — gateway UI DLP (ADR-001 ZeDocs/web51).
//
// Le Vault expose des routes UI stables pour Linky ; selon les cas elles proxifient
// un service aval (DLP). Contraintes gateway (ANALYSE § 2.4) :
//   - Relayer les paramètres fonctionnels (tenant, company_id, query).
//   - Propager les headers de corrélation (X-Request-ID, X-Tenant) vers l'aval.
//   - Ne pas relayer aveuglément tous les headers entrants.
//   - Auth technique vers DLP centralisée côté Vault (config).
//
// Erreurs (ANALYSE § 2.5) : body stable { code, message, request_id } ; pas de
// propagation brute des erreurs DLP. Journalisation (V0.4) : route, méthode,
// statut aval, durée, timeout, request_id, tenant — pas de body complet.
package handlers

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// gatewayErrorBody forme minimale d'erreur (V0.3) : code, message, request_id.
type gatewayErrorBody struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	RequestID string `json:"request_id"`
}

func writeGatewayError(c *fiber.Ctx, status int, code, message, requestID string) error {
	c.Set("Content-Type", "application/json")
	return c.Status(status).JSON(gatewayErrorBody{Code: code, Message: message, RequestID: requestID})
}

// DLPEnergySummaryHandler gère GET /ui/dlp/energy-summary (gateway vers DLP).
// Query string transmise telle quelle vers DLP_URL/api/v1/dlp/energy-summary.
// Si DLP_URL est vide, retourne 503. Logs : route, méthode, statut aval, durée, request_id, tenant (pas de body).
func DLPEnergySummaryHandler(cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		requestID := middleware.GetTraceID(c)
		tenant := middleware.GetTenant(c)
		if tenant == "" {
			tenant = c.Query("tenant")
		}

		if cfg == nil || strings.TrimSpace(cfg.DLPURL) == "" {
			if log != nil {
				log.Warn().Str("request_id", requestID).Str("tenant", tenant).
					Msg("gateway dlp: DLP_URL not configured")
			}
			return writeGatewayError(c, fiber.StatusServiceUnavailable, "gateway_unconfigured", "DLP gateway not configured", requestID)
		}

		baseURL := strings.TrimSuffix(cfg.DLPURL, "/")
		targetPath := "/api/v1/dlp/energy-summary"
		rawQuery := c.Context().QueryArgs().String()
		backendURL := baseURL + targetPath
		if rawQuery != "" {
			backendURL += "?" + rawQuery
		}

		timeoutMs := cfg.DLPTimeoutMs
		if timeoutMs <= 0 {
			timeoutMs = 800
		}
		ctx, cancel := context.WithTimeout(c.Context(), time.Duration(timeoutMs)*time.Millisecond)
		defer cancel()

		req, err := http.NewRequestWithContext(ctx, http.MethodGet, backendURL, nil)
		if err != nil {
			if log != nil {
				log.Error().Err(err).Str("request_id", requestID).Str("tenant", tenant).
					Str("route", targetPath).Msg("gateway dlp: request build failed")
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

		client := &http.Client{Timeout: time.Duration(timeoutMs+500) * time.Millisecond}
		resp, err := client.Do(req)
		if err != nil {
			timeoutHit := ctx.Err() == context.DeadlineExceeded
			if log != nil {
				log.Warn().Err(err).Str("request_id", requestID).Str("tenant", tenant).
					Str("route", targetPath).Dur("duration_ms", time.Since(start)).
					Bool("timeout", timeoutHit).Msg("gateway dlp: backend call failed")
			}
			code := "gateway_timeout"
			msg := "Backend timeout"
			if !timeoutHit {
				code = "gateway_error"
				msg = "Backend unreachable"
			}
			return writeGatewayError(c, fiber.StatusBadGateway, code, msg, requestID)
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			if log != nil {
				log.Warn().Err(err).Str("request_id", requestID).Str("tenant", tenant).
					Str("route", targetPath).Int("status_aval", resp.StatusCode).
					Dur("duration_ms", time.Since(start)).Msg("gateway dlp: read body failed")
			}
			return writeGatewayError(c, fiber.StatusBadGateway, "gateway_error", "Failed to read backend response", requestID)
		}

		// Log sans body (V0.4)
		if log != nil {
			log.Info().
				Str("request_id", requestID).Str("tenant", tenant).
				Str("route", targetPath).Str("method", http.MethodGet).
				Int("status_aval", resp.StatusCode).Dur("duration_ms", time.Since(start)).
				Msg("gateway dlp: request completed")
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
		return c.Status(resp.StatusCode).Send(body)
	}
}

// dlpProxyForward forwards a request to DLP backend (GET or POST with optional body).
// Used by other DLP UI routes (companies, dlps, etc.) in Palier 2.
func dlpProxyForward(c *fiber.Ctx, cfg *config.Config, log *zerolog.Logger, targetPath string, method string, timeoutMs int) error {
	if cfg == nil || strings.TrimSpace(cfg.DLPURL) == "" {
		return writeGatewayError(c, fiber.StatusServiceUnavailable, "gateway_unconfigured", "DLP gateway not configured", middleware.GetTraceID(c))
	}
	if timeoutMs <= 0 {
		timeoutMs = 10000
	}
	start := time.Now()
	requestID := middleware.GetTraceID(c)
	tenant := middleware.GetTenant(c)
	if tenant == "" {
		tenant = c.Query("tenant")
	}
	baseURL := strings.TrimSuffix(cfg.DLPURL, "/")
	rawQuery := c.Context().QueryArgs().String()
	backendURL := baseURL + targetPath
	if rawQuery != "" {
		backendURL += "?" + rawQuery
	}
	var bodyReader io.Reader
	if method == http.MethodPost || method == http.MethodPatch {
		bodyReader = bytes.NewReader(c.Body())
	}
	// DELETE et GET : pas de body
	ctx, cancel := context.WithTimeout(c.Context(), time.Duration(timeoutMs)*time.Millisecond)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, method, backendURL, bodyReader)
	if err != nil {
		if log != nil {
			log.Error().Err(err).Str("request_id", requestID).Str("tenant", tenant).Str("route", targetPath).Msg("gateway dlp: request build failed")
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
	client := &http.Client{Timeout: time.Duration(timeoutMs+500) * time.Millisecond}
	resp, err := client.Do(req)
	if err != nil {
		timeoutHit := ctx.Err() == context.DeadlineExceeded
		if log != nil {
			log.Warn().Err(err).Str("request_id", requestID).Str("tenant", tenant).Str("route", targetPath).Dur("duration_ms", time.Since(start)).Bool("timeout", timeoutHit).Msg("gateway dlp: backend call failed")
		}
		code, msg := "gateway_error", "Backend unreachable"
		if timeoutHit {
			code, msg = "gateway_timeout", "Backend timeout"
		}
		return writeGatewayError(c, fiber.StatusBadGateway, code, msg, requestID)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		if log != nil {
			log.Warn().Err(err).Str("request_id", requestID).Str("tenant", tenant).Str("route", targetPath).Int("status_aval", resp.StatusCode).Dur("duration_ms", time.Since(start)).Msg("gateway dlp: read body failed")
		}
		return writeGatewayError(c, fiber.StatusBadGateway, "gateway_error", "Failed to read backend response", requestID)
	}
	if log != nil {
		log.Info().Str("request_id", requestID).Str("tenant", tenant).Str("route", targetPath).Str("method", method).Int("status_aval", resp.StatusCode).Dur("duration_ms", time.Since(start)).Msg("gateway dlp: request completed")
	}
	if resp.StatusCode >= 500 {
		return writeGatewayError(c, fiber.StatusBadGateway, "backend_error", "Backend returned error", requestID)
	}
	if resp.StatusCode >= 400 {
		return writeGatewayError(c, fiber.StatusBadGateway, "backend_client_error", "Backend returned client error", requestID)
	}
	c.Set("Content-Type", resp.Header.Get("Content-Type"))
	if c.Get("Content-Type") == "" {
		c.Set("Content-Type", "application/json")
	}
	return c.Status(resp.StatusCode).Send(body)
}

// DLPProxyHandler retourne un handler qui proxy une route UI vers un chemin DLP fixe (GET, POST, PATCH).
// Lot 3 — admin DLP : companies, dlps (list), perimeters (list), project-perimeter-map (list).
func DLPProxyHandler(cfg *config.Config, log *zerolog.Logger, targetPath, method string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return dlpProxyForward(c, cfg, log, targetPath, method, 10000)
	}
}

// DLPProxyIDHandler retourne un handler qui proxy vers DLP pathPrefix + param (ex. /api/v1/dlps/:id).
// Lot 3 — admin DLP : dlps/:id, perimeters/:id, project-perimeter-map/:id.
func DLPProxyIDHandler(cfg *config.Config, log *zerolog.Logger, pathPrefix, paramKey, method string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := c.Params(paramKey)
		if id == "" {
			return c.Status(fiber.StatusBadRequest).JSON(gatewayErrorBody{Code: "bad_request", Message: paramKey + " required", RequestID: middleware.GetTraceID(c)})
		}
		return dlpProxyForward(c, cfg, log, pathPrefix+id, method, 10000)
	}
}

// Parse DLP path from /ui/dlp/xxx to /api/v1/xxx (or /api/v1/dlp/xxx for energy-summary)
func dlpTargetPath(uiPath string) string {
	// /ui/dlp/energy-summary -> /api/v1/dlp/energy-summary
	if strings.HasSuffix(uiPath, "energy-summary") {
		return "/api/v1/dlp/energy-summary"
	}
	// /ui/dlp/companies -> /api/v1/companies
	u, _ := url.Parse(uiPath)
	path := strings.TrimPrefix(u.Path, "/ui/dlp")
	if path == "" {
		path = "/"
	}
	return "/api/v1" + path
}
