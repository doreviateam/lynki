package server

import (
	"github.com/gofiber/fiber/v2"
)

func ErrorHandler(c *fiber.Ctx, err error) error {
	if e, ok := err.(*fiber.Error); ok {
		return c.Status(e.Code).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    errorCode(e.Code),
				"message": e.Message,
			},
		})
	}
	return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
		"error": fiber.Map{
			"code":    "INTERNAL_ERROR",
			"message": "Erreur interne.",
		},
	})
}

func errorCode(status int) string {
	switch status {
	case 400:
		return "BAD_REQUEST"
	case 408:
		return "MISTRAL_TIMEOUT"
	case 503:
		return "SERVICE_UNAVAILABLE"
	default:
		return "INTERNAL_ERROR"
	}
}
