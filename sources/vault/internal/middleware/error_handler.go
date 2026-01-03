package middleware

import (
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// ErrorHandler gère les erreurs de manière sécurisée
func ErrorHandler(log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Appeler le handler suivant
		err := c.Next()

		// Si pas d'erreur, continuer
		if err == nil {
			return nil
		}

		// ✅ SÉCURITÉ : Sanitizer les valeurs avant logging
		path := utils.SanitizeLogMessage(c.Path())
		ip := utils.SanitizeLogMessage(c.IP())
		requestID := utils.SanitizeLogMessage(c.Get("X-Request-ID"))
		errMsg := ""
		if err != nil {
			errMsg = utils.SanitizeLogMessage(err.Error())
		}

		// Logger l'erreur complète côté serveur (sanitizée)
		log.Error().
			Str("error", errMsg).
			Str("path", path).
			Str("method", c.Method()).
			Str("ip", ip).
			Str("request_id", requestID).
			Msg("Request failed")

		// Déterminer le code de statut et le message
		var statusCode int = fiber.StatusInternalServerError
		var message string = "An error occurred"

		// Si c'est une SafeError, utiliser ses valeurs
		if safeErr, ok := err.(*utils.SafeError); ok {
			statusCode = safeErr.StatusCode
			message = safeErr.UserMessage
			// Logger aussi l'erreur interne si présente
			if safeErr.InternalError != nil {
				log.Error().
					Err(safeErr.InternalError).
					Str("user_message", safeErr.UserMessage).
					Msg("Internal error details")
			}
		} else {
			// Sinon, sanitizer le message
			message = utils.SanitizeErrorMessage(err)
		}

		// Retourner une réponse sécurisée
		return c.Status(statusCode).JSON(fiber.Map{
			"error": message,
		})
	}
}
