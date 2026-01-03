package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// PanicRecovery est un middleware qui garantit qu'un panic ne renvoie jamais un body vide
// Il intercepte tous les panics et renvoie toujours un JSON valide
func PanicRecovery(log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				// Logger l'erreur avec stack trace
				log.Error().
					Interface("panic", r).
					Str("path", c.Path()).
					Str("method", c.Method()).
					Str("request_id", c.Get("X-Request-ID")).
					Msg("Panic recovered - ensuring JSON response")

				// Garantir une réponse JSON même en cas de panic
				// Utiliser Status() puis JSON() pour s'assurer que le body est écrit
				c.Status(fiber.StatusInternalServerError)
				_ = c.JSON(fiber.Map{
					"status":    "error",
					"type":      "system",
					"message":   "internal panic",
					"retryable": true,
				})
			}
		}()

		return c.Next()
	}
}

