# 🔧 Plan de Correction des Failles de Sécurité

**Date** : Janvier 2025  
**Version** : v1.0  
**Objectif** : Corriger toutes les failles de sécurité identifiées avant de nouvelles évolutions  
**Durée estimée** : 3-4 semaines  
**Priorité** : 🔴 **HAUTE** — À exécuter avant tout nouveau développement

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Phase 1 — Corrections Critiques (Semaine 1)](#phase-1--corrections-critiques-semaine-1)
3. [Phase 2 — Améliorations Élevées (Semaine 2-3)](#phase-2--améliorations-élevées-semaine-2-3)
4. [Phase 3 — Améliorations Moyennes (Semaine 4)](#phase-3--améliorations-moyennes-semaine-4)
5. [Checklist de Validation](#checklist-de-validation)
6. [Tests de Sécurité](#tests-de-sécurité)
7. [Déploiement](#déploiement)

---

## 🎯 Vue d'Ensemble

### Principe

**"Corriger d'abord, évoluer ensuite"** — Toutes les failles de sécurité doivent être corrigées avant de développer de nouvelles fonctionnalités.

### Planning Global

| Phase | Durée | Failles | Priorité |
|-------|-------|---------|----------|
| **Phase 1** | 1 semaine | 2 critiques | 🔴 URGENTE |
| **Phase 2** | 2 semaines | 5 élevées | 🟠 IMPORTANTE |
| **Phase 3** | 1 semaine | 5 moyennes | 🟡 RECOMMANDÉE |
| **Total** | **4 semaines** | **12 failles** | |

### Règle d'Or

✅ **Aucune nouvelle fonctionnalité ne sera développée tant que toutes les failles critiques et élevées ne sont pas corrigées.**

---

## 🔴 Phase 1 — Corrections Critiques (Semaine 1)

**Objectif** : Corriger les 2 failles critiques identifiées  
**Durée** : 5 jours ouvrés  
**Priorité** : 🔴 **URGENTE**

---

### ✅ Correction 1.1 — Path Traversal dans Upload

**Fichier** : `internal/handlers/upload.go`  
**Ligne** : 100  
**CVSS** : 7.5 (High)  
**Durée estimée** : 2-3 heures

#### Étape 1 : Créer une fonction de sanitization

**Fichier** : `internal/utils/filename.go` (nouveau fichier)

```go
package utils

import (
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

	// Supprimer les caractères de path traversal
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

	// Limiter la longueur (255 caractères max pour la plupart des systèmes de fichiers)
	if len(filename) > 255 {
		// Garder l'extension si présente
		ext := filepath.Ext(filename)
		if ext != "" && len(ext) < 20 {
			maxBaseLen := 255 - len(ext)
			filename = filename[:maxBaseLen] + ext
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
```

#### Étape 2 : Créer les tests unitaires

**Fichier** : `tests/unit/filename_test.go` (nouveau fichier)

```go
package unit

import (
	"testing"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/stretchr/testify/assert"
)

func TestSanitizeFilename(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Normal filename",
			input:    "document.pdf",
			expected: "document.pdf",
		},
		{
			name:     "Path traversal",
			input:    "../../etc/passwd",
			expected: "etc_passwd",
		},
		{
			name:     "Backslashes",
			input:    "..\\..\\windows\\system32",
			expected: "windows_system32",
		},
		{
			name:     "Null bytes",
			input:    "file\x00name.pdf",
			expected: "filename.pdf",
		},
		{
			name:     "Empty after sanitization",
			input:    "../../../",
			expected: "document",
		},
		{
			name:     "Very long filename",
			input:    strings.Repeat("a", 300) + ".pdf",
			expected: strings.Repeat("a", 255-4) + ".pdf",
		},
		{
			name:     "Control characters",
			input:    "file\nname\t.pdf",
			expected: "filename.pdf",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := utils.SanitizeFilename(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidateFilename(t *testing.T) {
	tests := []struct {
		name      string
		filename  string
		shouldErr bool
	}{
		{"Valid filename", "document.pdf", false},
		{"Empty filename", "", true},
		{"Path traversal", "../../etc/passwd", true},
		{"Too long", strings.Repeat("a", 300), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := utils.ValidateFilename(tt.filename)
			if tt.shouldErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
```

#### Étape 3 : Modifier le handler upload

**Fichier** : `internal/handlers/upload.go`

```go
// ... existing code ...

import (
	"github.com/doreviateam/dorevia-vault/internal/utils"
	// ... autres imports ...
)

func UploadHandler(db *storage.DB, storageDir string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// ... code existant jusqu'à la ligne 82 ...

		// Générer un UUID pour le document
		docID := uuid.New()

		// ✅ NOUVEAU : Sanitizer le nom de fichier
		sanitizedFilename := utils.SanitizeFilename(file.Filename)
		if err := utils.ValidateFilename(sanitizedFilename); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid filename",
				"details": err.Error(),
			})
		}

		// Créer le répertoire de stockage par date
		now := time.Now()
		datePath := filepath.Join(
			storageDir,
			fmt.Sprintf("%d", now.Year()),
			fmt.Sprintf("%02d", now.Month()),
			fmt.Sprintf("%02d", now.Day()),
		)

		if err := os.MkdirAll(datePath, 0755); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create storage directory",
			})
		}

		// ✅ MODIFIÉ : Utiliser le filename sanitizé
		storedPath := filepath.Join(datePath, fmt.Sprintf("%s-%s", docID.String(), sanitizedFilename))

		// ... reste du code ...
	}
}
```

#### Étape 4 : Appliquer la même correction ailleurs

**Fichiers à modifier** :
- `internal/storage/postgres.go` (ligne 281-282)
- `internal/storage/document_with_evidence.go` (ligne 75-76)
- `internal/handlers/invoices.go` (ligne 128)

**Pattern à appliquer** :
```go
// Avant
finalPath := filepath.Join(datePath, fmt.Sprintf("%s-%s", docID.String(), doc.Filename))

// Après
sanitizedFilename := utils.SanitizeFilename(doc.Filename)
finalPath := filepath.Join(datePath, fmt.Sprintf("%s-%s", docID.String(), sanitizedFilename))
```

#### Checklist de Validation

- [ ] Fonction `SanitizeFilename` créée et testée
- [ ] Tests unitaires passent (100%)
- [ ] Handler `upload.go` modifié
- [ ] Handler `invoices.go` modifié
- [ ] `storage/postgres.go` modifié
- [ ] `storage/document_with_evidence.go` modifié
- [ ] Test d'intégration : upload avec filename malveillant → rejeté
- [ ] Test d'intégration : upload normal → accepté
- [ ] Code review effectué
- [ ] Documentation mise à jour

---

### ✅ Correction 1.2 — Exposition d'Informations dans les Erreurs

**Fichiers** : Multiple handlers  
**CVSS** : 6.5 (Medium-High)  
**Durée estimée** : 4-6 heures

#### Étape 1 : Créer un type d'erreur sécurisé

**Fichier** : `internal/utils/errors.go` (nouveau fichier)

```go
package utils

import (
	"fmt"
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
	}

	errMsgLower := strings.ToLower(errMsg)
	for _, pattern := range sensitivePatterns {
		if strings.Contains(errMsgLower, pattern) {
			return "An internal error occurred"
		}
	}

	// Si l'erreur contient des détails techniques, la généraliser
	if strings.Contains(errMsg, "SQL") || strings.Contains(errMsg, "database") {
		return "Database operation failed"
	}

	if strings.Contains(errMsg, "file") || strings.Contains(errMsg, "path") {
		return "File operation failed"
	}

	// Par défaut, retourner un message générique
	return "An error occurred"
}
```

#### Étape 2 : Créer un middleware de gestion d'erreurs

**Fichier** : `internal/middleware/error_handler.go` (nouveau fichier)

```go
package middleware

import (
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// ErrorHandler gère les erreurs de manière sécurisée
func ErrorHandler(log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Appeler le handler suivant
		err := c.Next()

		// Si pas d'erreur, continuer
		if err == nil {
			return nil
		}

		// Logger l'erreur complète côté serveur
		log.Error().
			Err(err).
			Str("path", c.Path()).
			Str("method", c.Method()).
			Str("ip", c.IP()).
			Msg("Request failed")

		// Déterminer le code de statut et le message
		var statusCode int = fiber.StatusInternalServerError
		var message string = "An error occurred"

		// Si c'est une SafeError, utiliser ses valeurs
		if safeErr, ok := err.(*utils.SafeError); ok {
			statusCode = safeErr.StatusCode
			message = safeErr.UserMessage
		} else {
			// Sinon, sanitizer le message
			message = utils.SanitizeErrorMessage(err)
		}

		// Retourner une réponse sécurisée
		return c.Status(statusCode).JSON(fiber.Map{
			"error": message,
		})
	}
}
```

#### Étape 3 : Modifier les handlers pour utiliser SafeError

**Exemple pour `internal/handlers/invoices.go`** :

```go
// Avant
if err := c.BodyParser(&payload); err != nil {
	log.Error().Err(err).Msg("Failed to parse invoice payload")
	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
		"error": "Invalid JSON payload",
		"details": err.Error(), // ⚠️ EXPOSE L'ERREUR
	})
}

// Après
if err := c.BodyParser(&payload); err != nil {
	log.Error().Err(err).Msg("Failed to parse invoice payload")
	return utils.NewSafeError(
		"Invalid JSON payload",
		err,
		fiber.StatusBadRequest,
	)
}
```

**Exemple pour `internal/handlers/payments.go`** :

```go
// Avant
if _, err := time.Parse(time.RFC3339, payload.PaymentDate); err != nil {
	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
		"error":   "Invalid payment_date format (must be RFC3339)",
		"details": err.Error(), // ⚠️ EXPOSE L'ERREUR
	})
}

// Après
if _, err := time.Parse(time.RFC3339, payload.PaymentDate); err != nil {
	log.Debug().Err(err).Msg("Invalid payment date format")
	return utils.NewSafeError(
		"Invalid payment_date format (must be RFC3339)",
		err,
		fiber.StatusBadRequest,
	)
}
```

#### Étape 4 : Intégrer le middleware dans main.go

**Fichier** : `cmd/vault/main.go`

```go
// ... existing code ...

import (
	"github.com/doreviateam/dorevia-vault/internal/middleware"
	// ... autres imports ...
)

func main() {
	// ... code existant ...

	// ✅ NOUVEAU : Ajouter le middleware de gestion d'erreurs
	app.Use(middleware.ErrorHandler(log))

	// ... reste du code ...
}
```

#### Checklist de Validation

- [ ] Type `SafeError` créé et testé
- [ ] Fonction `SanitizeErrorMessage` créée et testée
- [ ] Middleware `ErrorHandler` créé
- [ ] Middleware intégré dans `main.go`
- [ ] Handler `invoices.go` modifié
- [ ] Handler `payments.go` modifié
- [ ] Handler `pos_tickets_handler.go` modifié
- [ ] Handler `pos_zreports.go` modifié
- [ ] Tous les handlers modifiés pour utiliser `SafeError`
- [ ] Tests unitaires passent
- [ ] Test : erreur avec détails sensibles → message générique
- [ ] Test : erreur normale → message approprié
- [ ] Logs contiennent toujours les détails complets
- [ ] Code review effectué

---

### ✅ Correction 1.3 — Headers HTTP Non Sécurisés

**Fichier** : `internal/handlers/download.go`  
**Ligne** : 57  
**CVSS** : 5.3 (Medium)  
**Durée estimée** : 1 heure

#### Étape 1 : Créer une fonction d'échappement

**Fichier** : `internal/utils/filename.go` (ajout)

```go
import (
	"mime"
	"net/url"
)

// EscapeFilename échappe un nom de fichier pour les headers HTTP
func EscapeFilename(filename string) string {
	// Utiliser mime.QEncoding pour échapper les caractères spéciaux
	encoded := mime.QEncoding.Encode("utf-8", filename)
	return encoded
}

// FormatContentDisposition formate le header Content-Disposition de manière sécurisée
func FormatContentDisposition(filename string) string {
	// Échapper le filename
	escaped := EscapeFilename(filename)
	
	// Utiliser la syntaxe RFC 5987 pour support Unicode
	// Format: attachment; filename="escaped"; filename*=UTF-8''urlencoded
	urlEncoded := url.QueryEscape(filename)
	
	return fmt.Sprintf(`attachment; filename="%s"; filename*=UTF-8''%s`, escaped, urlEncoded)
}
```

#### Étape 2 : Modifier le handler download

**Fichier** : `internal/handlers/download.go`

```go
// ... existing code ...

import (
	"github.com/doreviateam/dorevia-vault/internal/utils"
	// ... autres imports ...
)

func DownloadHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// ... code existant jusqu'à la ligne 55 ...

		// ✅ MODIFIÉ : Utiliser FormatContentDisposition
		c.Set("Content-Type", doc.ContentType)
		c.Set("Content-Disposition", utils.FormatContentDisposition(doc.Filename))
		c.Set("Content-Length", fmt.Sprintf("%d", doc.SizeBytes))

		// ... reste du code ...
	}
}
```

#### Étape 3 : Tests

**Fichier** : `tests/unit/filename_test.go` (ajout)

```go
func TestEscapeFilename(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string // Vérifier qu'il n'y a pas de caractères dangereux
	}{
		{"Normal filename", "document.pdf", "document.pdf"},
		{"Filename with quotes", `file"name.pdf`, "file%22name.pdf"},
		{"Filename with newline", "file\nname.pdf", "file%0Aname.pdf"},
		{"Unicode filename", "fichier-émoji-😀.pdf", "fichier-%C3%A9moji-%F0%9F%98%80.pdf"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := utils.EscapeFilename(tt.input)
			// Vérifier qu'il n'y a pas de caractères dangereux
			assert.NotContains(t, result, "\"")
			assert.NotContains(t, result, "\n")
			assert.NotContains(t, result, "\r")
		})
	}
}
```

#### Checklist de Validation

- [ ] Fonction `EscapeFilename` créée
- [ ] Fonction `FormatContentDisposition` créée
- [ ] Handler `download.go` modifié
- [ ] Tests unitaires passent
- [ ] Test : filename avec caractères spéciaux → échappé correctement
- [ ] Test : header Content-Disposition valide
- [ ] Code review effectué

---

## 🟠 Phase 2 — Améliorations Élevées (Semaine 2-3)

**Objectif** : Corriger les 5 failles élevées  
**Durée** : 10 jours ouvrés  
**Priorité** : 🟠 **IMPORTANTE**

---

### ✅ Correction 2.1 — Validation Insuffisante des Entrées

**Fichiers** : Multiple handlers  
**CVSS** : 6.1 (Medium)  
**Durée estimée** : 1 semaine

#### Étape 1 : Créer un validateur centralisé

**Fichier** : `internal/validators/validator.go` (nouveau fichier)

```go
package validators

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// Validator fournit des fonctions de validation centralisées
type Validator struct{}

// NewValidator crée un nouveau validateur
func NewValidator() *Validator {
	return &Validator{}
}

// ValidateFormat valide un format (json, csv, etc.)
func (v *Validator) ValidateFormat(format string) error {
	allowedFormats := map[string]bool{
		"json": true,
		"csv":  true,
	}
	
	formatLower := strings.ToLower(format)
	if !allowedFormats[formatLower] {
		return fmt.Errorf("invalid format: %s (allowed: json, csv)", format)
	}
	
	return nil
}

// ValidateLimit valide une limite de pagination
func (v *Validator) ValidateLimit(limitStr string, maxLimit int) (int, error) {
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		return 0, fmt.Errorf("invalid limit: %s (must be a number)", limitStr)
	}
	
	if limit < 1 {
		return 0, fmt.Errorf("limit must be >= 1")
	}
	
	if limit > maxLimit {
		return 0, fmt.Errorf("limit must be <= %d", maxLimit)
	}
	
	return limit, nil
}

// ValidateOffset valide un offset de pagination
func (v *Validator) ValidateOffset(offsetStr string) (int, error) {
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		return 0, fmt.Errorf("invalid offset: %s (must be a number)", offsetStr)
	}
	
	if offset < 0 {
		return 0, fmt.Errorf("offset must be >= 0")
	}
	
	return offset, nil
}

// ValidateTenant valide un identifiant de tenant
func (v *Validator) ValidateTenant(tenant string) error {
	if len(tenant) == 0 {
		return fmt.Errorf("tenant cannot be empty")
	}
	
	if len(tenant) > 100 {
		return fmt.Errorf("tenant length must be <= 100 characters")
	}
	
	// Autoriser uniquement alphanumérique, tirets et underscores
	matched, _ := regexp.MatchString(`^[a-zA-Z0-9_-]+$`, tenant)
	if !matched {
		return fmt.Errorf("tenant contains invalid characters (allowed: a-z, A-Z, 0-9, _, -)")
	}
	
	return nil
}

// ValidateUUID valide un UUID
func (v *Validator) ValidateUUID(uuidStr string) error {
	uuidPattern := regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
	if !uuidPattern.MatchString(strings.ToLower(uuidStr)) {
		return fmt.Errorf("invalid UUID format")
	}
	return nil
}

// ValidateDate valide une date au format RFC3339
func (v *Validator) ValidateDate(dateStr string) error {
	if dateStr == "" {
		return fmt.Errorf("date cannot be empty")
	}
	
	// Vérifier le format RFC3339
	_, err := time.Parse(time.RFC3339, dateStr)
	if err != nil {
		return fmt.Errorf("invalid date format (must be RFC3339): %w", err)
	}
	
	return nil
}
```

#### Étape 2 : Appliquer la validation dans les handlers

**Exemple pour `internal/handlers/ledger_export.go`** :

```go
import (
	"github.com/doreviateam/dorevia-vault/internal/validators"
	// ... autres imports ...
)

func LedgerExportHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		validator := validators.NewValidator()
		
		// ✅ VALIDATION
		format := c.Query("format", "json")
		if err := validator.ValidateFormat(format); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		
		limitStr := c.Query("limit", "100")
		limit, err := validator.ValidateLimit(limitStr, 1000)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		
		offsetStr := c.Query("offset", "0")
		offset, err := validator.ValidateOffset(offsetStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		
		// ... reste du code ...
	}
}
```

**Exemple pour `internal/handlers/payments.go`** :

```go
// ✅ VALIDATION du tenant
headerTenant := c.Get("X-Tenant")
if err := validator.ValidateTenant(headerTenant); err != nil {
	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
		"error": err.Error(),
	})
}
```

#### Checklist de Validation

- [ ] Validateur centralisé créé
- [ ] Toutes les fonctions de validation implémentées
- [ ] Tests unitaires pour chaque fonction
- [ ] Handler `ledger_export.go` modifié
- [ ] Handler `audit.go` modifié
- [ ] Handler `documents.go` modifié
- [ ] Handler `payments.go` modifié
- [ ] Handler `pos_zreports.go` modifié
- [ ] Test : format invalide → rejeté
- [ ] Test : limit trop élevé → rejeté
- [ ] Test : tenant invalide → rejeté
- [ ] Code review effectué

---

### ✅ Correction 2.2 — Risque de DoS via Upload Volumineux

**Fichiers** : `internal/handlers/upload.go`, `internal/handlers/invoices.go`  
**CVSS** : 5.3 (Medium)  
**Durée estimée** : 2-3 jours

#### Étape 1 : Ajouter la configuration

**Fichier** : `internal/config/config.go`

```go
// Ajouter dans la struct Config
MaxUploadSizeBytes     int `env:"MAX_UPLOAD_SIZE_BYTES" envDefault:"10485760"` // 10 MB par défaut
MaxBase64SizeBytes     int `env:"MAX_BASE64_SIZE_BYTES" envDefault:"15728640"` // 15 MB (compense overhead base64)
```

#### Étape 2 : Modifier le handler upload

**Fichier** : `internal/handlers/upload.go`

```go
func UploadHandler(db *storage.DB, storageDir string, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// ✅ NOUVEAU : Vérifier la taille du body
		maxSize := cfg.MaxUploadSizeBytes
		if maxSize == 0 {
			maxSize = 10 * 1024 * 1024 // 10 MB par défaut
		}
		
		if c.Request().Header.ContentLength() > int64(maxSize) {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
				"error": fmt.Sprintf("Request body too large (max %d bytes)", maxSize),
			})
		}
		
		// Récupérer le fichier
		file, err := c.FormFile("file")
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "No file provided",
			})
		}
		
		// ✅ NOUVEAU : Vérifier la taille du fichier
		if file.Size > int64(maxSize) {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
				"error": fmt.Sprintf("File size exceeds maximum allowed size (%d bytes)", maxSize),
			})
		}
		
		// Ouvrir le fichier
		src, err := file.Open()
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to open uploaded file",
			})
		}
		defer src.Close()
		
		// ✅ NOUVEAU : Lire avec limite
		limitedReader := io.LimitReader(src, int64(maxSize))
		content, err := io.ReadAll(limitedReader)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to read file content",
			})
		}
		
		// ✅ NOUVEAU : Vérifier qu'on n'a pas dépassé la limite
		if len(content) >= maxSize {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
				"error": "File size exceeds maximum allowed size",
			})
		}
		
		// ... reste du code ...
	}
}
```

#### Étape 3 : Modifier le handler invoices

**Fichier** : `internal/handlers/invoices.go`

```go
func InvoicesHandler(...) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// ... code existant ...
		
		// ✅ NOUVEAU : Vérifier la taille du payload base64
		maxBase64Size := cfg.MaxBase64SizeBytes
		if maxBase64Size == 0 {
			maxBase64Size = 15 * 1024 * 1024 // 15 MB par défaut
		}
		
		if len(payload.File) > maxBase64Size {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
				"error": fmt.Sprintf("Base64 payload too large (max %d bytes)", maxBase64Size),
			})
		}
		
		// Décoder le fichier base64
		fileContent, err := base64.StdEncoding.DecodeString(payload.File)
		if err != nil {
			// ... gestion erreur ...
		}
		
		// ✅ NOUVEAU : Vérifier la taille décodée
		maxFileSize := cfg.MaxUploadSizeBytes
		if maxFileSize == 0 {
			maxFileSize = 10 * 1024 * 1024 // 10 MB par défaut
		}
		
		if len(fileContent) > maxFileSize {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
				"error": fmt.Sprintf("Decoded file size exceeds maximum allowed size (%d bytes)", maxFileSize),
			})
		}
		
		// ... reste du code ...
	}
}
```

#### Checklist de Validation

- [ ] Configuration ajoutée
- [ ] Handler `upload.go` modifié avec limites
- [ ] Handler `invoices.go` modifié avec limites
- [ ] Test : upload fichier > 10 MB → rejeté
- [ ] Test : upload base64 > 15 MB → rejeté
- [ ] Test : upload normal → accepté
- [ ] Documentation mise à jour
- [ ] Code review effectué

---

### ✅ Correction 2.3 — Construction SQL Dynamique

**Fichier** : `internal/storage/queries.go`  
**CVSS** : 6.5 (Medium-High)  
**Durée estimée** : 2-3 jours

#### Étape 1 : Créer une whitelist de colonnes

**Fichier** : `internal/storage/queries.go` (modification)

```go
// ✅ NOUVEAU : Whitelist des colonnes autorisées
var allowedColumns = map[string]bool{
	"filename":     true,
	"content_type": true,
	"created_at":   true,
	"source":       true,
	"odoo_model":   true,
	"odoo_id":      true,
	"odoo_state":   true,
}

// validateColumnName vérifie qu'une colonne est dans la whitelist
func validateColumnName(col string) bool {
	return allowedColumns[col]
}

// ListDocuments récupère une liste paginée de documents avec filtres
func (db *DB) ListDocuments(ctx context.Context, query models.DocumentQuery) ([]models.Document, int, error) {
	// Construction de la requête SQL avec filtres
	whereClauses := []string{"1=1"}
	args := []interface{}{}
	argIndex := 1

	// ✅ AMÉLIORÉ : Validation stricte des filtres
	// Filtre par recherche textuelle (filename uniquement)
	if query.Search != "" {
		// ✅ VÉRIFICATION : filename est dans la whitelist
		if !validateColumnName("filename") {
			return nil, 0, fmt.Errorf("invalid column for search")
		}
		whereClauses = append(whereClauses, fmt.Sprintf("filename ILIKE $%d", argIndex))
		args = append(args, "%"+query.Search+"%")
		argIndex++
	}

	// Filtre par type MIME
	if query.Type != "" {
		// ✅ VÉRIFICATION : content_type est dans la whitelist
		if !validateColumnName("content_type") {
			return nil, 0, fmt.Errorf("invalid column for type filter")
		}
		whereClauses = append(whereClauses, fmt.Sprintf("content_type = $%d", argIndex))
		args = append(args, query.Type)
		argIndex++
	}

	// Filtre par date (from)
	if query.DateFrom != nil {
		// ✅ VÉRIFICATION : created_at est dans la whitelist
		if !validateColumnName("created_at") {
			return nil, 0, fmt.Errorf("invalid column for date filter")
		}
		whereClauses = append(whereClauses, fmt.Sprintf("created_at >= $%d", argIndex))
		args = append(args, *query.DateFrom)
		argIndex++
	}

	// ... reste du code ...
}
```

#### Checklist de Validation

- [ ] Whitelist de colonnes créée
- [ ] Fonction `validateColumnName` créée
- [ ] `ListDocuments` modifié avec validation
- [ ] Tests unitaires passent
- [ ] Test : tentative injection SQL → rejetée
- [ ] Code review effectué

---

### ✅ Correction 2.4 — Absence de Protection CSRF

**Fichiers** : Tous les handlers POST/PUT/DELETE  
**CVSS** : 6.1 (Medium)  
**Durée estimée** : 2-3 jours  
**Note** : Optionnel si API backend uniquement

#### Étape 1 : Évaluer la nécessité

**Question** : L'API est-elle utilisée depuis un navigateur web ?

- **Si NON** (API backend uniquement) : CSRF non nécessaire
- **Si OUI** : Implémenter CSRF

#### Étape 2 : Implémenter CSRF (si nécessaire)

**Fichier** : `cmd/vault/main.go`

```go
import (
	"github.com/gofiber/fiber/v2/middleware/csrf"
	"github.com/gofiber/fiber/v2/utils"
)

// Dans main()
// ✅ NOUVEAU : CSRF pour endpoints modifiants
app.Use(csrf.New(csrf.Config{
	KeyLookup:      "header:X-CSRF-Token",
	CookieName:     "csrf_",
	CookieSameSite: "Strict",
	Expiration:     1 * time.Hour,
	KeyGenerator:   utils.UUIDv4,
}))

// Exclure les endpoints qui n'en ont pas besoin (GET, OPTIONS)
app.Use(func(c *fiber.Ctx) error {
	if c.Method() == "GET" || c.Method() == "OPTIONS" {
		return c.Next()
	}
	// Pour POST/PUT/DELETE, vérifier CSRF
	return c.Next()
})
```

#### Checklist de Validation

- [ ] Évaluation de la nécessité effectuée
- [ ] Si nécessaire : CSRF implémenté
- [ ] Tests : requête sans token CSRF → rejetée
- [ ] Tests : requête avec token CSRF → acceptée
- [ ] Documentation mise à jour
- [ ] Code review effectué

---

## 🟡 Phase 3 — Améliorations Moyennes (Semaine 4)

**Objectif** : Corriger les 5 failles moyennes  
**Durée** : 5 jours ouvrés  
**Priorité** : 🟡 **RECOMMANDÉE**

---

### ✅ Correction 3.1 — Rate Limiting Amélioré

**Fichier** : `internal/middleware/ratelimit.go`  
**Durée estimée** : 1 jour

#### Modifications

```go
// Rate limiting différencié par endpoint
func RateLimitForEndpoint(endpoint string, max int) fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        max,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			// Combiner IP + UserID si authentifié
			ip := c.IP()
			if userInfo := c.Locals("user"); userInfo != nil {
				return fmt.Sprintf("%s:%s", ip, userInfo.(*auth.UserInfo).UserID)
			}
			return ip
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many requests, please try again later",
			})
		},
	})
}
```

---

### ✅ Correction 3.2 — Logs Sécurisés

**Fichier** : `internal/utils/logging.go` (nouveau)  
**Durée estimée** : 1 jour

#### Fonction de logging sécurisé

```go
func SafeLog(log *zerolog.Logger, err error, fields map[string]interface{}) {
	safeFields := make(map[string]interface{})
	sensitiveKeys := []string{"password", "token", "key", "secret", "authorization"}
	
	for k, v := range fields {
		keyLower := strings.ToLower(k)
		isSensitive := false
		for _, sensitive := range sensitiveKeys {
			if strings.Contains(keyLower, sensitive) {
				isSensitive = true
				break
			}
		}
		
		if isSensitive {
			safeFields[k] = "[REDACTED]"
		} else {
			safeFields[k] = v
		}
	}
	
	log.Error().Err(err).Fields(safeFields).Msg("Request failed")
}
```

---

### ✅ Correction 3.3 — Validation MIME

**Fichier** : `internal/validators/mime.go` (nouveau)  
**Durée estimée** : 1 jour

#### Validation du type MIME réel

```go
import (
	"github.com/h2non/filetype"
)

func ValidateMIMEType(content []byte, declaredType string) error {
	kind, err := filetype.Match(content)
	if err != nil {
		return fmt.Errorf("failed to detect file type: %w", err)
	}
	
	allowedTypes := map[string]bool{
		"application/pdf": true,
		"image/png":       true,
		"image/jpeg":      true,
	}
	
	if !allowedTypes[kind.MIME.Value] {
		return fmt.Errorf("file type not allowed: %s", kind.MIME.Value)
	}
	
	if declaredType != "" && declaredType != kind.MIME.Value {
		return fmt.Errorf("MIME type mismatch: declared=%s, detected=%s", declaredType, kind.MIME.Value)
	}
	
	return nil
}
```

---

### ✅ Correction 3.4 — CORS Restrictif

**Fichier** : `internal/middleware/cors.go`  
**Durée estimée** : 1 heure

#### Modification

```go
func CORS(allowedOrigins []string) fiber.Handler {
	if len(allowedOrigins) == 0 {
		allowedOrigins = []string{"*"} // Par défaut, mais à configurer en production
	}
	
	return cors.New(cors.Config{
		AllowOrigins:     strings.Join(allowedOrigins, ","),
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Tenant",
		ExposeHeaders:    "Content-Length",
		AllowCredentials: true,
		MaxAge:           3600,
	})
}
```

---

### ✅ Correction 3.5 — Validation Factur-X Stricte

**Fichier** : `internal/handlers/invoices.go`  
**Durée estimée** : 1 heure

#### Modification

```go
// En production, toujours valider Factur-X
if cfg.FacturXValidationEnabled {
	// ... validation existante ...
	if !result.Valid {
		// ✅ MODIFIÉ : Toujours rejeter en production
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Factur-X validation failed",
			"validation_errors": result.Errors,
		})
	}
}
```

---

## ✅ Checklist de Validation Globale

### Avant Déploiement

- [ ] **Phase 1 complétée** : 2 failles critiques corrigées
- [ ] **Phase 2 complétée** : 5 failles élevées corrigées
- [ ] **Phase 3 complétée** : 5 failles moyennes corrigées
- [ ] **Tous les tests passent** : 100% de réussite
- [ ] **Tests de sécurité** : Toutes les failles testées
- [ ] **Code review** : Toutes les modifications revues
- [ ] **Documentation** : Mise à jour complète
- [ ] **Migration** : Si nécessaire, scripts préparés

### Tests de Sécurité

- [ ] Path traversal : Tentative d'exploitation → rejetée
- [ ] Messages d'erreur : Aucune information sensible exposée
- [ ] Headers HTTP : Content-Disposition échappé correctement
- [ ] Validation : Toutes les entrées validées
- [ ] DoS : Upload volumineux → rejeté
- [ ] SQL Injection : Tentative d'injection → rejetée
- [ ] CSRF : Si implémenté, testé
- [ ] Rate limiting : Limites respectées
- [ ] Logs : Aucune donnée sensible dans les logs
- [ ] MIME : Validation du type réel
- [ ] CORS : Configuration restrictive
- [ ] Factur-X : Validation stricte

---

## 📅 Planning Détaillé

### Semaine 1 — Corrections Critiques

| Jour | Tâche | Durée | Statut |
|------|-------|-------|--------|
| **Lundi** | Correction 1.1 (Path Traversal) | 3h | ⬜ |
| **Mardi** | Correction 1.2 (Messages d'erreur) | 6h | ⬜ |
| **Mercredi** | Correction 1.3 (Headers HTTP) | 1h | ⬜ |
| **Jeudi** | Tests et validation Phase 1 | 4h | ⬜ |
| **Vendredi** | Code review et documentation | 2h | ⬜ |

### Semaine 2-3 — Améliorations Élevées

| Semaine | Jour | Tâche | Durée | Statut |
|---------|------|-------|-------|--------|
| **2** | **Lundi** | Correction 2.1 (Validation) | 8h | ⬜ |
| **2** | **Mardi** | Correction 2.1 (suite) | 4h | ⬜ |
| **2** | **Mercredi** | Correction 2.2 (DoS) | 6h | ⬜ |
| **2** | **Jeudi** | Correction 2.3 (SQL) | 6h | ⬜ |
| **2** | **Vendredi** | Correction 2.4 (CSRF) | 4h | ⬜ |
| **3** | **Lundi** | Tests et validation Phase 2 | 8h | ⬜ |
| **3** | **Mardi** | Code review Phase 2 | 4h | ⬜ |
| **3** | **Mercredi** | Documentation Phase 2 | 4h | ⬜ |

### Semaine 4 — Améliorations Moyennes

| Jour | Tâche | Durée | Statut |
|------|-------|-------|--------|
| **Lundi** | Correction 3.1 (Rate Limiting) | 4h | ⬜ |
| **Mardi** | Correction 3.2 (Logs) | 4h | ⬜ |
| **Mercredi** | Correction 3.3 (MIME) | 4h | ⬜ |
| **Jeudi** | Correction 3.4-3.5 (CORS, Factur-X) | 4h | ⬜ |
| **Vendredi** | Tests finaux et documentation | 4h | ⬜ |

---

## 🚀 Déploiement

### Étapes de Déploiement

1. **Environnement de test**
   - [ ] Déployer les corrections en test
   - [ ] Exécuter tous les tests
   - [ ] Tests de sécurité manuels
   - [ ] Validation fonctionnelle

2. **Environnement de staging**
   - [ ] Déployer en staging
   - [ ] Tests d'intégration
   - [ ] Tests de charge
   - [ ] Validation avec Odoo

3. **Production**
   - [ ] Backup complet
   - [ ] Déploiement progressif
   - [ ] Monitoring renforcé
   - [ ] Rollback plan préparé

### Rollback Plan

En cas de problème :
1. Restaurer la version précédente
2. Analyser les logs
3. Corriger le problème
4. Redéployer

---

## 📝 Notes Importantes

### Règle d'Or

✅ **Aucune nouvelle fonctionnalité ne sera développée tant que toutes les failles critiques et élevées ne sont pas corrigées.**

### Communication

- Informer l'équipe Odoo des changements
- Documenter les nouvelles validations
- Mettre à jour la documentation API

### Suivi

- Créer des issues GitHub pour chaque correction
- Suivre l'avancement dans un tableau de bord
- Valider chaque phase avant de passer à la suivante

---

**Date de création** : Janvier 2025  
**Statut** : 📋 **PLAN PRÊT À EXÉCUTER**  
**Prochaine étape** : Démarrer la Phase 1

---

*"La sécurité n'est pas un état, c'est un processus continu."*  
*Ce plan garantit que Dorevia Vault reste sécurisé avant toute nouvelle évolution.*

