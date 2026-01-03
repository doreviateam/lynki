package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// UploadHandler gère l'upload de fichiers
func UploadHandler(db *storage.DB, storageDir string, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		// ✅ SÉCURITÉ : Vérifier la taille du body
		maxSize := cfg.MaxUploadSizeBytes
		if maxSize == 0 {
			maxSize = 10 * 1024 * 1024 // 10 MB par défaut
		}

		contentLength := c.Request().Header.ContentLength()
		if contentLength > 0 && contentLength > maxSize {
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

		// ✅ SÉCURITÉ : Vérifier la taille du fichier
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

		// ✅ SÉCURITÉ : Lire avec limite pour éviter DoS
		limitedReader := io.LimitReader(src, int64(maxSize))
		content, err := io.ReadAll(limitedReader)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to read file content",
			})
		}

		// ✅ SÉCURITÉ : Vérifier qu'on n'a pas dépassé la limite
		if len(content) >= maxSize {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
				"error": "File size exceeds maximum allowed size",
			})
		}

		// ✅ SÉCURITÉ : Validation MIME - Détecter le type réel
		declaredMIME := file.Header.Get("Content-Type")
		if declaredMIME == "" {
			declaredMIME = utils.GetMIMETypeFromFilename(file.Filename)
		}

		// Valider la cohérence du type MIME
		if err := utils.ValidateMIMEType(declaredMIME, content); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("File type validation failed: %s", err.Error()),
			})
		}

		// Calculer le SHA256
		hash := sha256.Sum256(content)
		sha256Hex := hex.EncodeToString(hash[:])

		// Vérifier si le fichier existe déjà (par SHA256)
		var existingID uuid.UUID
		err = db.Pool.QueryRow(
			context.Background(),
			"SELECT id FROM documents WHERE sha256_hex = $1 LIMIT 1",
			sha256Hex,
		).Scan(&existingID)

		if err == nil {
			// Fichier déjà existant
			return c.JSON(fiber.Map{
				"id":           existingID.String(),
				"filename":     file.Filename,
				"size_bytes":   file.Size,
				"content_type": file.Header.Get("Content-Type"),
				"sha256_hex":   sha256Hex,
				"message":      "File already exists",
			})
		} else if err != pgx.ErrNoRows {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to check existing file",
			})
		}

		// Générer un UUID pour le document
		docID := uuid.New()

		// ✅ SÉCURITÉ : Sanitizer le nom de fichier pour éviter path traversal
		sanitizedFilename := utils.SanitizeFilename(file.Filename)
		if err := utils.ValidateFilename(sanitizedFilename); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid filename",
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

		// ✅ SÉCURITÉ : Utiliser le filename sanitizé
		storedPath := filepath.Join(datePath, fmt.Sprintf("%s-%s", docID.String(), sanitizedFilename))

		// Sauvegarder le fichier
		if err := os.WriteFile(storedPath, content, 0644); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to save file",
			})
		}

		// Enregistrer en base de données
		contentType := file.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		_, err = db.Pool.Exec(
			context.Background(),
			`INSERT INTO documents (id, filename, content_type, size_bytes, sha256_hex, stored_path)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			docID, sanitizedFilename, contentType, file.Size, sha256Hex, storedPath,
		)

		if err != nil {
			// Nettoyer le fichier en cas d'erreur
			os.Remove(storedPath)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to save metadata to database",
			})
		}

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"id":           docID.String(),
			"filename":     sanitizedFilename,
			"size_bytes":   file.Size,
			"content_type": contentType,
			"sha256_hex":   sha256Hex,
			"stored_path":  storedPath,
			"uploaded_at":  now.Format(time.RFC3339),
		})
	}
}
