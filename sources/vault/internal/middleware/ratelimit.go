package middleware

import (
	"fmt"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

// RateLimit configure et retourne le middleware de rate limiting général
func RateLimit(cfg *config.Config) fiber.Handler {
	maxRequests := cfg.RateLimitMaxRequests
	if maxRequests == 0 {
		maxRequests = 100 // Par défaut
	}

	expirationSec := cfg.RateLimitExpirationSec
	if expirationSec == 0 {
		expirationSec = 60 // 1 minute par défaut
	}

	return limiter.New(limiter.Config{
		Max:        maxRequests,
		Expiration: time.Duration(expirationSec) * time.Second,
		KeyGenerator: func(c *fiber.Ctx) string {
			// ✅ SÉCURITÉ : Utiliser IP + User-Agent pour meilleure identification
			ip := c.IP()
			userAgent := c.Get("User-Agent", "")
			// Limiter la longueur de l'User-Agent pour éviter des clés trop longues
			if len(userAgent) > 100 {
				userAgent = userAgent[:100]
			}
			return ip + ":" + userAgent
		},
		LimitReached: func(c *fiber.Ctx) error {
			// ✅ SÉCURITÉ : Ajouter des headers informatifs
			c.Set("X-RateLimit-Limit", fmt.Sprintf("%d", maxRequests))
			c.Set("X-RateLimit-Remaining", "0")
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many requests, please try again later",
			})
		},
	})
}

// RateLimitUpload configure un rate limiting plus strict pour les endpoints d'upload
func RateLimitUpload(cfg *config.Config) fiber.Handler {
	maxRequests := cfg.RateLimitUploadMax
	if maxRequests == 0 {
		maxRequests = 20 // Limite plus stricte pour uploads
	}

	expirationSec := cfg.RateLimitUploadExpSec
	if expirationSec == 0 {
		expirationSec = 60 // 1 minute par défaut
	}

	return limiter.New(limiter.Config{
		Max:        maxRequests,
		Expiration: time.Duration(expirationSec) * time.Second,
		KeyGenerator: func(c *fiber.Ctx) string {
			// ✅ SÉCURITÉ : Limite par IP uniquement pour uploads (plus strict)
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			// ✅ SÉCURITÉ : Ajouter des headers informatifs
			c.Set("X-RateLimit-Limit", fmt.Sprintf("%d", maxRequests))
			c.Set("X-RateLimit-Remaining", "0")
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Upload rate limit exceeded, please try again later",
			})
		},
	})
}

// IsUploadRoute détermine si une route est un endpoint d'upload
func IsUploadRoute(path string) bool {
	uploadRoutes := []string{
		"/upload",
		"/api/v1/invoices",
		"/api/v1/pos-tickets",
		"/api/v1/payments",
		"/api/v1/pos/zreports",
	}

	for _, route := range uploadRoutes {
		if strings.HasPrefix(path, route) {
			return true
		}
	}
	return false
}
