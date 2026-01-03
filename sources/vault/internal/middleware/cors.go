package middleware

import (
	"strings"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// CORS configure et retourne le middleware CORS
func CORS(cfg *config.Config) fiber.Handler {
	// ✅ SÉCURITÉ : Limiter les origines autorisées
	allowedOrigins := cfg.CORSAllowedOrigins
	if allowedOrigins == "" {
		allowedOrigins = "*" // Par défaut, toutes les origines (pour compatibilité)
	}

	// Si plusieurs origines sont spécifiées (séparées par virgule), les parser
	var origins []string
	if allowedOrigins != "*" {
		origins = strings.Split(allowedOrigins, ",")
		// Nettoyer les espaces
		for i, origin := range origins {
			origins[i] = strings.TrimSpace(origin)
		}
	} else {
		origins = []string{"*"}
	}

	config := cors.Config{
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Tenant,X-Request-ID",
		AllowCredentials: false, // Fix: Cannot use wildcard "*" with AllowCredentials=true (Fiber v2.52.9 security)
	}

	// Si une seule origine ou wildcard, utiliser AllowOrigins directement
	if len(origins) == 1 && origins[0] == "*" {
		config.AllowOrigins = "*"
	} else {
		// Sinon, utiliser AllowOriginsFunc pour validation dynamique
		config.AllowOriginsFunc = func(origin string) bool {
			for _, allowed := range origins {
				if allowed == "*" || allowed == origin {
					return true
				}
				// Support des patterns avec wildcard (ex: https://*.example.com)
				if strings.Contains(allowed, "*") {
					// Simple pattern matching (pour production, utiliser regexp)
					if strings.HasPrefix(origin, strings.ReplaceAll(allowed, "*", "")) {
						return true
					}
				}
			}
			return false
		}
	}

	return cors.New(config)
}
