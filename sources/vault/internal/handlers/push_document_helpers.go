package handlers

import (
	"github.com/gofiber/fiber/v2"
)

// GetPushDocument retourne 405 Method Not Allowed pour GET /api/v1/push_document
func GetPushDocument(c *fiber.Ctx) error {
	return c.Status(fiber.StatusMethodNotAllowed).JSON(fiber.Map{
		"status":    "error",
		"type":      "permanent",
		"message":   "Method not allowed. Use POST to push documents.",
		"retryable": false,
	})
}

