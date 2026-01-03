package utils

import (
	"regexp"
	"strings"
)

// SanitizeLogMessage nettoie un message de log pour masquer les informations sensibles
func SanitizeLogMessage(message string) string {
	if message == "" {
		return message
	}

	// Liste de patterns sensibles à masquer
	sensitivePatterns := []struct {
		pattern *regexp.Regexp
		replace string
	}{
		// Mots de passe
		{regexp.MustCompile(`(?i)(password|passwd|pwd)\s*[:=]\s*[^\s,}]+`), `$1: ***REDACTED***`},
		// Tokens et clés
		{regexp.MustCompile(`(?i)(token|api[_-]?key|secret|auth[_-]?key)\s*[:=]\s*[^\s,}]+`), `$1: ***REDACTED***`},
		// JWT tokens (format: Bearer eyJ...)
		{regexp.MustCompile(`(?i)(bearer\s+)(eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)`), `$1***REDACTED***`},
		// Clés privées (commencent par -----BEGIN)
		{regexp.MustCompile(`-----BEGIN\s+[A-Z\s]+-----[\s\S]*?-----END\s+[A-Z\s]+-----`), `***PRIVATE_KEY_REDACTED***`},
		// URLs avec credentials (http://user:pass@host)
		{regexp.MustCompile(`([a-z]+://)([^:]+):([^@]+)@`), `$1***REDACTED***@`},
		// Emails (masquer partiellement)
		{regexp.MustCompile(`([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})`), `***@$2`},
		// Numéros de carte (partiels)
		{regexp.MustCompile(`\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b`), `****-****-****-****`},
		// Chemins système sensibles
		{regexp.MustCompile(`(/etc/|/opt/|/home/|/root/)[^\s,}]+`), `***PATH_REDACTED***`},
		// UUIDs (optionnel - peut être utile pour le debug, mais masquons pour sécurité)
		// {regexp.MustCompile(`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`), `***UUID_REDACTED***`},
	}

	sanitized := message
	for _, pattern := range sensitivePatterns {
		sanitized = pattern.pattern.ReplaceAllString(sanitized, pattern.replace)
	}

	return sanitized
}

// SanitizeLogField nettoie un champ de log spécifique
func SanitizeLogField(key string, value interface{}) (string, interface{}) {
	keyLower := strings.ToLower(key)

	// Champs sensibles à masquer complètement
	sensitiveKeys := []string{
		"password", "passwd", "pwd",
		"token", "api_key", "api-key", "secret", "auth_key", "auth-key",
		"private_key", "private-key",
		"authorization", "bearer",
		"credit_card", "card_number",
	}

	for _, sensitiveKey := range sensitiveKeys {
		if strings.Contains(keyLower, sensitiveKey) {
			return key, "***REDACTED***"
		}
	}

	// Pour les valeurs string, appliquer la sanitization
	if strValue, ok := value.(string); ok {
		return key, SanitizeLogMessage(strValue)
	}

	return key, value
}

// SanitizeMap nettoie une map de champs de log
func SanitizeMap(fields map[string]interface{}) map[string]interface{} {
	sanitized := make(map[string]interface{})
	for k, v := range fields {
		sanitizedKey, sanitizedValue := SanitizeLogField(k, v)
		sanitized[sanitizedKey] = sanitizedValue
	}
	return sanitized
}
