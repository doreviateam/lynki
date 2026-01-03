package utils

import (
	"strings"
)

// SafeError représente une erreur avec message utilisateur et erreur interne
type SafeError struct {
	UserMessage   string // Message générique pour l'utilisateur
	InternalError error  // Erreur complète pour les logs
	StatusCode    int    // Code HTTP approprié
}

func (e *SafeError) Error() string {
	return e.UserMessage
}

// NewSafeError crée une nouvelle SafeError
func NewSafeError(userMessage string, internalError error, statusCode int) *SafeError {
	return &SafeError{
		UserMessage:   userMessage,
		InternalError: internalError,
		StatusCode:    statusCode,
	}
}

// SanitizeErrorMessage nettoie un message d'erreur pour éviter l'exposition d'informations
func SanitizeErrorMessage(err error) string {
	if err == nil {
		return "An error occurred"
	}

	errMsg := err.Error()

	// Liste de patterns à masquer (chemins, tokens, etc.)
	sensitivePatterns := []string{
		"/opt/",
		"/etc/",
		"/home/",
		"password",
		"token",
		"key",
		"secret",
		"authorization",
		"database",
		"connection",
		"postgres",
		"postgresql",
	}

	errMsgLower := strings.ToLower(errMsg)
	for _, pattern := range sensitivePatterns {
		if strings.Contains(errMsgLower, pattern) {
			return "An internal error occurred"
		}
	}

	// Si l'erreur contient des détails techniques, la généraliser
	if strings.Contains(errMsg, "SQL") || strings.Contains(errMsgLower, "database") {
		return "Database operation failed"
	}

	if strings.Contains(errMsgLower, "file") || strings.Contains(errMsgLower, "path") {
		return "File operation failed"
	}

	if strings.Contains(errMsgLower, "network") || strings.Contains(errMsgLower, "connection") {
		return "Network operation failed"
	}

	// Par défaut, retourner un message générique
	return "An error occurred"
}

