package handlers

import (
	"encoding/json"
	"errors"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/doreviateam/diva/internal/hashinput"
	"github.com/doreviateam/diva/internal/runner"
	"github.com/doreviateam/diva/internal/store"
	"github.com/gofiber/fiber/v2"
)

const defaultInsightsTimezone = "Europe/Paris"

// GetInsights retourne l'insight le plus récent non expiré pour le contexte demandé.
// GET /diva/insights?tenant=X&company_id=0&mode=cockpit&period=YTD
// GET /diva/insights?tenant=X&mode=card&card_key=cash&period=YTD
func GetInsights(insightsStore store.InsightsStore) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if insightsStore == nil {
			return c.Status(503).JSON(fiber.Map{
				"error": fiber.Map{"code": "SERVICE_UNAVAILABLE", "message": "Insights non disponibles (pas de base)."},
			})
		}

		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "tenant requis"},
			})
		}

		companyID := 0
		if s := c.Query("company_id"); s != "" {
			if n, err := strconv.Atoi(s); err == nil {
				companyID = n
			}
		}

		timezone := c.Query("timezone")
		if timezone == "" {
			if tz := os.Getenv("INSIGHTS_TIMEZONE"); tz != "" {
				timezone = tz
			} else {
				timezone = defaultInsightsTimezone
			}
		}

		var dateStart, dateEnd string
		period := c.Query("period")
		if period != "" {
			var err error
			dateStart, dateEnd, err = runner.ResolvePeriod(period, timezone)
			if err != nil || dateStart == "" {
				return c.Status(400).JSON(fiber.Map{
					"error": fiber.Map{"code": "BAD_REQUEST", "message": "period invalide (YTD, MTD, current_month)"},
				})
			}
		} else {
			dateStart = c.Query("date_start")
			dateEnd = c.Query("date_end")
			if dateStart == "" || dateEnd == "" {
				return c.Status(400).JSON(fiber.Map{
					"error": fiber.Map{"code": "BAD_REQUEST", "message": "period ou (date_start, date_end) requis"},
				})
			}
		}

		partnerName := c.Query("partner_name")

		contextKey := hashinput.ComputeContextKey(tenant, companyID, dateStart, dateEnd, partnerName)

		insight, err := insightsStore.GetInsight(c.Context(), contextKey)
		// Pas de fallback vers company 0 : un insight "Tout" ne doit pas s'afficher
		// pour une société spécifique (ex. Sweet Manihot) dont les données diffèrent.
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return c.JSON(fiber.Map{
					"state": "pending",
				})
			}
			// Corruption TOAST/disque : retourner pending pour permettre au runner de régénérer
			// au lieu de bloquer l'UI avec "Analyse indisponible".
			if isToastOrDataCorruption(err) {
				slog.Warn("GetInsight failed (corruption TOAST/disque), fallback pending", "context_key", contextKey, "err", err)
				return c.JSON(fiber.Map{
					"state": "pending",
				})
			}
			slog.Error("GetInsight failed", "context_key", contextKey, "err", err)
			return c.Status(500).JSON(fiber.Map{
				"error": fiber.Map{"code": "INTERNAL_ERROR", "message": "Analyse indisponible. Réessayez ultérieurement."},
			})
		}

		if insight.Status == "error" {
			return c.JSON(fiber.Map{
				"state":      "failed",
				"error_code": insight.ErrorCode,
			})
		}

		var flash interface{}
		if len(insight.Flash) > 0 {
			_ = json.Unmarshal(insight.Flash, &flash)
		}

		insightAgeSeconds := int(time.Since(insight.CreatedAt).Seconds())
		if insightAgeSeconds < 0 {
			insightAgeSeconds = 0
		}

		insightMap := fiber.Map{
			"message_text":        insight.MessageText,
			"flash":               flash,
			"confidence":          insight.Confidence,
			"created_at":          insight.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			"expires_at":          insight.ExpiresAt.Format("2006-01-02T15:04:05Z07:00"),
			"insight_age_seconds": insightAgeSeconds,
		}
		if insight.FactsVersion != "" {
			insightMap["facts_version"] = insight.FactsVersion
		}
		if insight.LatencyMs > 0 {
			insightMap["latency_ms"] = insight.LatencyMs
		}

		return c.JSON(fiber.Map{
			"state":   "ready",
			"insight": insightMap,
		})
	}
}

// isToastOrDataCorruption détecte les erreurs de corruption TOAST/disque PostgreSQL.
func isToastOrDataCorruption(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "missing chunk") ||
		strings.Contains(s, "SQLSTATE XX001") ||
		strings.Contains(s, "read only 0 of")
}
