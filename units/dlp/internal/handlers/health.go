package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"
)

// Health returns liveness (service up)
func Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "ok"})
}

// Ready returns readiness (DB connected)
func Ready(db HealthChecker) fiber.Handler {
	return func(c *fiber.Ctx) error {
		ctx, cancel := context.WithTimeout(c.Context(), 5e9)
		defer cancel()
		if err := db.Health(ctx); err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"status": "unhealthy", "error": err.Error()})
		}
		return c.JSON(fiber.Map{"status": "ready"})
	}
}

// HealthChecker interface for readiness
type HealthChecker interface {
	Health(ctx context.Context) error
}
