package unit

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockDB est un mock de storage.DB pour les tests
type MockDB struct {
	mock.Mock
	storage.DB
}

func TestPushDocument_Success(t *testing.T) {
	app := fiber.New()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
		JWSEnabled:         false,
		LedgerEnabled:      false,
	}

	// Créer un mock DB (simplifié pour le test)
	// Note: Dans un vrai test, on utiliserait un vrai DB ou un mock complet
	handler := handlers.PushDocumentHandler(nil, "/tmp/test", nil, cfg, nil)

	app.Post("/api/v1/push_document", handler)

	// Créer un fichier test (PDF minimal)
	testContent := []byte("%PDF-1.4\n1 0 obj\nendobj\nxref\ntrailer\n%%EOF")
	base64Content := base64.StdEncoding.EncodeToString(testContent)

	payload := map[string]interface{}{
		"file":     base64Content,
		"filename": "test.pdf",
	}

	jsonPayload, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/api/v1/push_document", bytes.NewReader(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)

	// Vérifier que la réponse n'est jamais vide
	assert.Greater(t, resp.ContentLength, int64(0), "Response body should never be empty")
}

func TestPushDocument_InvalidJSON(t *testing.T) {
	app := fiber.New()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
	}

	handler := handlers.PushDocumentHandler(nil, "/tmp/test", nil, cfg, nil)
	app.Post("/api/v1/push_document", handler)

	req := httptest.NewRequest("POST", "/api/v1/push_document", bytes.NewReader([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

	// Vérifier que la réponse contient un JSON valide
	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)
	assert.Equal(t, "error", result["status"])
	assert.Equal(t, "permanent", result["type"])
	assert.Equal(t, false, result["retryable"])
}

func TestPushDocument_MissingFile(t *testing.T) {
	app := fiber.New()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
	}

	handler := handlers.PushDocumentHandler(nil, "/tmp/test", nil, cfg, nil)
	app.Post("/api/v1/push_document", handler)

	payload := map[string]interface{}{
		"filename": "test.pdf",
	}

	jsonPayload, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/api/v1/push_document", bytes.NewReader(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

	// Vérifier que la réponse contient un JSON valide
	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)
	assert.Equal(t, "error", result["status"])
	assert.Equal(t, "permanent", result["type"])
	assert.Equal(t, false, result["retryable"])
}

func TestPushDocument_EmptyFile(t *testing.T) {
	app := fiber.New()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
	}

	handler := handlers.PushDocumentHandler(nil, "/tmp/test", nil, cfg, nil)
	app.Post("/api/v1/push_document", handler)

	emptyContent := base64.StdEncoding.EncodeToString([]byte(""))
	payload := map[string]interface{}{
		"file":     emptyContent,
		"filename": "test.pdf",
	}

	jsonPayload, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/api/v1/push_document", bytes.NewReader(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

	// Vérifier que la réponse contient un JSON valide
	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)
	assert.Equal(t, "error", result["status"])
	assert.Equal(t, "permanent", result["type"])
	assert.Equal(t, false, result["retryable"])
}

func TestPushDocument_InvalidBase64(t *testing.T) {
	app := fiber.New()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
	}

	handler := handlers.PushDocumentHandler(nil, "/tmp/test", nil, cfg, nil)
	app.Post("/api/v1/push_document", handler)

	payload := map[string]interface{}{
		"file":     "invalid base64!!!",
		"filename": "test.pdf",
	}

	jsonPayload, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/api/v1/push_document", bytes.NewReader(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

	// Vérifier que la réponse contient un JSON valide
	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)
	assert.Equal(t, "error", result["status"])
	assert.Equal(t, "permanent", result["type"])
	assert.Equal(t, false, result["retryable"])
}

func TestPushDocument_FileTooLarge(t *testing.T) {
	app := fiber.New()
	cfg := &config.Config{
		MaxBase64SizeBytes: 100, // Très petit pour le test
	}

	handler := handlers.PushDocumentHandler(nil, "/tmp/test", nil, cfg, nil)
	app.Post("/api/v1/push_document", handler)

	largeContent := base64.StdEncoding.EncodeToString(make([]byte, 1000))
	payload := map[string]interface{}{
		"file":     largeContent,
		"filename": "test.pdf",
	}

	jsonPayload, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/api/v1/push_document", bytes.NewReader(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	// Le handler peut retourner 400 ou 413 selon l'implémentation
	assert.True(t, resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusRequestEntityTooLarge, 
		"Status should be 400 or 413, got %d", resp.StatusCode)

	// Vérifier que la réponse contient un JSON valide
	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)
	assert.Equal(t, "error", result["status"])
	// Les erreurs de validation (fichier trop grand) sont permanentes
	assert.Equal(t, "permanent", result["type"])
	assert.Equal(t, false, result["retryable"])
}

func TestPushDocument_ResponseNeverEmpty(t *testing.T) {
	// Ce test vérifie que même en cas d'erreur, la réponse n'est jamais vide
	app := fiber.New()
	cfg := &config.Config{
		MaxBase64SizeBytes: 15 * 1024 * 1024,
	}

	handler := handlers.PushDocumentHandler(nil, "/tmp/test", nil, cfg, nil)
	app.Post("/api/v1/push_document", handler)

	// Test avec payload invalide
	req := httptest.NewRequest("POST", "/api/v1/push_document", bytes.NewReader([]byte("{")))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)

	// Vérifier que ContentLength > 0 (body non vide)
	assert.Greater(t, resp.ContentLength, int64(0), "Response body should never be empty")

	// Vérifier que le body peut être décodé en JSON
	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err, "Response should always be valid JSON")
	assert.Contains(t, result, "status", "Response should contain 'status' field")
}

