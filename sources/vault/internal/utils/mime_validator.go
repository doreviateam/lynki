package utils

import (
	"fmt"
	"io"
	"mime"
	"strings"
)

// DetectMIMEType détecte le type MIME réel d'un fichier en analysant son contenu
// Utilise les "magic bytes" pour une détection fiable
func DetectMIMEType(content []byte) string {
	if len(content) == 0 {
		return "application/octet-stream"
	}

	// Détection par magic bytes (signatures de fichiers)
	// PDF
	if len(content) >= 4 && string(content[0:4]) == "%PDF" {
		return "application/pdf"
	}

	// PNG
	if len(content) >= 8 && string(content[0:8]) == "\x89PNG\r\n\x1a\n" {
		return "image/png"
	}

	// JPEG
	if len(content) >= 3 && content[0] == 0xFF && content[1] == 0xD8 && content[2] == 0xFF {
		return "image/jpeg"
	}

	// GIF
	if len(content) >= 6 && (string(content[0:6]) == "GIF87a" || string(content[0:6]) == "GIF89a") {
		return "image/gif"
	}

	// ZIP (peut être Office documents, EPUB, etc.)
	if len(content) >= 4 && content[0] == 0x50 && content[1] == 0x4B && content[2] == 0x03 && content[3] == 0x04 {
		// Vérifier si c'est un Office document
		if len(content) >= 30 {
			// Office Open XML (docx, xlsx, pptx)
			if strings.Contains(string(content[0:30]), "[Content_Types].xml") ||
				strings.Contains(string(content[0:30]), "word/") ||
				strings.Contains(string(content[0:30]), "xl/") ||
				strings.Contains(string(content[0:30]), "ppt/") {
				return "application/vnd.openxmlformats-officedocument"
			}
		}
		return "application/zip"
	}

	// XML (peut être Factur-X)
	if len(content) >= 5 && string(content[0:5]) == "<?xml" {
		// Vérifier si c'est Factur-X
		contentStr := string(content)
		if strings.Contains(contentStr, "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice") ||
			strings.Contains(contentStr, "factur-x") ||
			strings.Contains(contentStr, "Factur-X") {
			return "application/xml+factur-x"
		}
		return "application/xml"
	}

	// JSON
	if len(content) >= 1 && (content[0] == '{' || content[0] == '[') {
		// Vérifier si c'est du JSON valide (simple check)
		contentStr := strings.TrimSpace(string(content))
		if (strings.HasPrefix(contentStr, "{") && strings.HasSuffix(contentStr, "}")) ||
			(strings.HasPrefix(contentStr, "[") && strings.HasSuffix(contentStr, "]")) {
			return "application/json"
		}
	}

	// Par défaut, utiliser mime.TypeByExtension si possible
	// Sinon, retourner application/octet-stream
	return "application/octet-stream"
}

// ValidateMIMEType vérifie que le type MIME déclaré correspond au type réel détecté
func ValidateMIMEType(declaredMIME string, content []byte) error {
	detectedMIME := DetectMIMEType(content)

	// Normaliser les types MIME (enlever les paramètres)
	declaredBase := strings.Split(declaredMIME, ";")[0]
	declaredBase = strings.TrimSpace(declaredBase)
	detectedBase := strings.TrimSpace(detectedMIME)

	// Si le type déclaré est vide ou générique, accepter
	if declaredBase == "" || declaredBase == "application/octet-stream" {
		return nil
	}

	// Comparaison exacte
	if declaredBase == detectedBase {
		return nil
	}

	// Comparaison avec types équivalents
	equivalentTypes := map[string][]string{
		"application/pdf":          {"application/pdf"},
		"image/jpeg":               {"image/jpeg", "image/jpg"},
		"image/png":                {"image/png"},
		"application/xml":          {"application/xml", "text/xml"},
		"application/xml+factur-x": {"application/xml", "text/xml", "application/xml+factur-x"},
		"application/json":         {"application/json", "text/json"},
	}

	// Vérifier les équivalences
	if equivs, ok := equivalentTypes[detectedBase]; ok {
		for _, equiv := range equivs {
			if declaredBase == equiv {
				return nil
			}
		}
	}

	// Si pas de correspondance, retourner une erreur
	return fmt.Errorf("MIME type mismatch: declared=%s, detected=%s", declaredBase, detectedBase)
}

// GetMIMETypeFromFilename retourne le type MIME basé sur l'extension du fichier
func GetMIMETypeFromFilename(filename string) string {
	ext := getFileExtension(filename)
	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		return "application/octet-stream"
	}
	return mimeType
}

// getFileExtension extrait l'extension d'un nom de fichier
func getFileExtension(filename string) string {
	lastDot := strings.LastIndex(filename, ".")
	if lastDot == -1 || lastDot == len(filename)-1 {
		return ""
	}
	return filename[lastDot:]
}

// ValidateFileType valide le type de fichier en combinant extension et contenu
func ValidateFileType(filename string, content []byte, declaredMIME string) error {
	// 1. Détecter le type réel depuis le contenu
	detectedMIME := DetectMIMEType(content)

	// 2. Obtenir le type depuis l'extension
	extensionMIME := GetMIMETypeFromFilename(filename)

	// 3. Vérifier la cohérence
	// Si le type déclaré est fourni, le vérifier
	if declaredMIME != "" {
		if err := ValidateMIMEType(declaredMIME, content); err != nil {
			return fmt.Errorf("declared MIME type does not match file content: %w", err)
		}
	}

	// 4. Vérifier que le type détecté correspond à l'extension
	if extensionMIME != "application/octet-stream" && detectedMIME != "application/octet-stream" {
		// Normaliser pour comparaison
		extBase := strings.Split(extensionMIME, ";")[0]
		detBase := strings.Split(detectedMIME, ";")[0]

		// Types équivalents acceptables
		acceptableMismatches := map[string][]string{
			"application/pdf": {"application/pdf"},
			"image/jpeg":      {"image/jpeg", "image/jpg"},
		}

		// Si pas de correspondance exacte, vérifier les équivalences
		if extBase != detBase {
			if equivs, ok := acceptableMismatches[extBase]; ok {
				found := false
				for _, equiv := range equivs {
					if detBase == equiv {
						found = true
						break
					}
				}
				if !found {
					return fmt.Errorf("file extension (%s) does not match detected content type (%s)", extensionMIME, detectedMIME)
				}
			} else {
				// Pour les autres types, être plus permissif mais logger un warning
				// On accepte mais on pourrait logger
			}
		}
	}

	return nil
}

// ReadMIMETypeFromReader lit les premiers bytes d'un reader pour détecter le type MIME
func ReadMIMETypeFromReader(r io.Reader) (string, error) {
	// Lire les 512 premiers bytes (suffisant pour la plupart des magic bytes)
	buffer := make([]byte, 512)
	n, err := r.Read(buffer)
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	return DetectMIMEType(buffer[:n]), nil
}
