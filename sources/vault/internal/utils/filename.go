package utils

import (
	"fmt"
	"mime"
	"net/url"
	"path/filepath"
	"strings"
	"unicode"
)

// SanitizeFilename nettoie et sécurise un nom de fichier
// Supprime les caractères dangereux et limite la longueur
func SanitizeFilename(filename string) string {
	if filename == "" {
		return "document"
	}

	// Supprimer les caractères de path traversal d'abord
	filename = strings.ReplaceAll(filename, "..", "")
	filename = strings.ReplaceAll(filename, "/", "_")
	filename = strings.ReplaceAll(filename, "\\", "_")
	filename = strings.ReplaceAll(filename, "\x00", "") // Null bytes

	// Supprimer les caractères de contrôle
	var cleaned strings.Builder
	for _, r := range filename {
		if unicode.IsPrint(r) && !unicode.IsControl(r) {
			cleaned.WriteRune(r)
		}
	}
	filename = cleaned.String()

	// Supprimer les espaces en début/fin
	filename = strings.TrimSpace(filename)

	// Supprimer les underscores multiples et en début/fin
	filename = strings.Trim(filename, "_")
	for strings.Contains(filename, "__") {
		filename = strings.ReplaceAll(filename, "__", "_")
	}

	// Limiter la longueur (255 caractères max pour la plupart des systèmes de fichiers)
	if len(filename) > 255 {
		// Garder l'extension si présente
		ext := filepath.Ext(filename)
		if ext != "" && len(ext) < 20 {
			maxBaseLen := 255 - len(ext)
			if maxBaseLen > 0 {
				filename = filename[:maxBaseLen] + ext
			} else {
				filename = filename[:255]
			}
		} else {
			filename = filename[:255]
		}
	}

	// Si vide après nettoyage, utiliser un nom par défaut
	if filename == "" {
		filename = "document"
	}

	return filename
}

// ValidateFilename vérifie qu'un nom de fichier est valide après sanitization
func ValidateFilename(filename string) error {
	if filename == "" {
		return fmt.Errorf("filename cannot be empty")
	}

	// Vérifier qu'il n'y a pas de path traversal
	if strings.Contains(filename, "..") {
		return fmt.Errorf("filename contains path traversal characters")
	}

	// Vérifier la longueur
	if len(filename) > 255 {
		return fmt.Errorf("filename too long (max 255 characters)")
	}

	return nil
}

// EscapeFilename échappe un nom de fichier pour les headers HTTP
func EscapeFilename(filename string) string {
	// Utiliser mime.QEncoding pour échapper les caractères spéciaux
	escaped := mime.QEncoding.Encode("utf-8", filename)
	return escaped
}

// FormatContentDisposition formate le header Content-Disposition de manière sécurisée
// Utilise la syntaxe RFC 5987 pour support Unicode complet
func FormatContentDisposition(filename string) string {
	// Échapper le filename avec mime.QEncoding
	escaped := mime.QEncoding.Encode("utf-8", filename)

	// URL encoder pour la syntaxe filename* (RFC 5987)
	urlEncoded := url.QueryEscape(filename)

	// Format: attachment; filename="escaped"; filename*=UTF-8''urlencoded
	return fmt.Sprintf(`attachment; filename="%s"; filename*=UTF-8''%s`, escaped, urlEncoded)
}
