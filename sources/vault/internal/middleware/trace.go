package middleware

import (
	"regexp"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// TraceIDKey stocke le trace_id dans fiber.Ctx.Locals
const TraceIDKey = "trace_id"

// TraceIDSourceKey : "header" | "generated" | "invalid_replaced" — diagnostic immédiat
const TraceIDSourceKey = "trace_id_source"

// TenantKey stocke la valeur X-Tenant (pour les routes qui l'utilisent)
const TenantKey = "tenant"

// TenantSourceKey : "header" | "default" | "missing" — diagnostic proof not found
const TenantSourceKey = "tenant_source"

// uuidV4Regex : 8-4-4-4-12 hex, lowercase (RFC 4122)
var uuidV4Regex = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

// isValidUUIDv4Lower vérifie UUID v4 lowercase.
func isValidUUIDv4Lower(s string) bool {
	return len(s) == 36 && uuidV4Regex.MatchString(strings.ToLower(s))
}

// TraceMiddleware extrait ou génère X-Trace-Id (UUID v4 lowercase).
// Si header invalide : génère un nouveau et log trace_id_invalid=true.
// trace_id_source = "header" | "generated" | "invalid_replaced"
// X-Trace-Id ajouté sur toutes les réponses (2xx, 4xx, 5xx).
func TraceMiddlewareWithLog(log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		traceID := c.Get("X-Trace-Id")
		traceIDSource := "header"
		if traceID == "" {
			traceIDSource = "generated"
			traceID = strings.ToLower(uuid.New().String())
		} else if !isValidUUIDv4Lower(traceID) {
			traceIDSource = "invalid_replaced"
			if log != nil {
				log.Debug().
					Str("trace_id_replaced", traceID).
					Bool("trace_id_invalid", true).
					Msg("trace_id replaced (invalid format, expected UUID v4)")
			}
			traceID = strings.ToLower(uuid.New().String())
		} else {
			traceID = strings.ToLower(traceID)
		}
		c.Locals(TraceIDKey, traceID)
		c.Locals(TraceIDSourceKey, traceIDSource)
		c.Set("X-Trace-Id", traceID)
		return c.Next()
	}
}

// TenantMiddleware extrait X-Tenant et pose tenant_source pour diagnostic.
// tenant_source = "header" | "missing" (ou "default" si fallback configuré plus tard)
func TenantMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := strings.TrimSpace(c.Get("X-Tenant"))
		source := "missing"
		if tenant != "" {
			source = "header"
		}
		c.Locals(TenantKey, tenant)
		c.Locals(TenantSourceKey, source)
		return c.Next()
	}
}

// TraceMiddleware sans log (pour tests ou when log=nil).
func TraceMiddleware() fiber.Handler {
	return TraceMiddlewareWithLog(nil)
}

// GetTraceID retourne le trace_id depuis Ctx.Locals (ou "" si absent).
func GetTraceID(c *fiber.Ctx) string {
	if v := c.Locals(TraceIDKey); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

// GetTraceIDSource retourne trace_id_source ("header"|"generated"|"invalid_replaced").
func GetTraceIDSource(c *fiber.Ctx) string {
	if v := c.Locals(TraceIDSourceKey); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

// GetTenant retourne le tenant depuis X-Tenant (middleware TenantMiddleware).
func GetTenant(c *fiber.Ctx) string {
	if v := c.Locals(TenantKey); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return c.Get("X-Tenant") // fallback si middleware absent
}

// GetTenantSource retourne tenant_source ("header"|"missing"|"default").
func GetTenantSource(c *fiber.Ctx) string {
	if v := c.Locals(TenantSourceKey); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return "missing"
}
