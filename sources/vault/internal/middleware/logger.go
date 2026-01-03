package middleware

import (
	"time"

	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// Logger crée un middleware de logging pour Fiber
func Logger(log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Exécution de la requête
		err := c.Next()

		// Calcul de la durée
		duration := time.Since(start)

		// ✅ SÉCURITÉ : Sanitizer les valeurs avant logging
		path := utils.SanitizeLogMessage(c.Path())
		ip := utils.SanitizeLogMessage(c.IP())
		requestID := utils.SanitizeLogMessage(c.Get("X-Request-ID"))

		// Logging de la requête
		event := log.Info().
			Str("method", c.Method()).
			Str("path", path).
			Int("status", c.Response().StatusCode()).
			Dur("duration", duration).
			Str("ip", ip).
			Str("request_id", requestID) // Sprint 3 Phase 2 : Traçabilité requêtes

		if err != nil {
			// ✅ SÉCURITÉ : Sanitizer le message d'erreur
			sanitizedErr := utils.SanitizeLogMessage(err.Error())
			event.Str("error", sanitizedErr)
		}

		event.Msg("HTTP request")

		return err
	}
}
