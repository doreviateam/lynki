package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/services/zreports"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockZReportsService est un mock pour ZReportsServiceInterface
type MockZReportsService struct {
	mock.Mock
}

func (m *MockZReportsService) Ingest(ctx context.Context, headerTenant string, input zreports.ZReportInput) (*zreports.ZReportResult, error) {
	args := m.Called(ctx, headerTenant, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*zreports.ZReportResult), args.Error(1)
}

func TestPosZReportsHandler_Success(t *testing.T) {
	mockService := new(MockZReportsService)
	cfg := &config.Config{
		ZReportMaxSizeBytes: 1024 * 1024, // 1 MB
	}
	logger := zerolog.Nop()
	log := &logger

	now := time.Now().UTC()
	expectedResult := &zreports.ZReportResult{
		ZID:         "Z2025-11-15-01",
		Tenant:      "tenant1",
		HashCurrent: "hash123",
		HashPrev:    nil,
		EvidenceJWS: "jws.token.here",
		Timestamp:   now,
		ProofURL:    "/api/v1/evidence/tenant1/Z2025-11-15-01",
	}

	mockService.On("Ingest", mock.Anything, "tenant1", mock.Anything).Return(expectedResult, nil)

	app := fiber.New()
	app.Post("/api/v1/pos/zreports", PosZReportsHandler(mockService, cfg, log))

	payload := ZReportPayload{
		ZID:           "Z2025-11-15-01",
		CompanyID:     1,
		Sequence:      1,
		DateOpen:      now.Add(-10 * time.Hour).Format(time.RFC3339),
		DateClose:     now.Format(time.RFC3339),
		Totals:        ZReportTotals{AmountTotal: 1000.0, AmountTax: 100.0, AmountNet: 900.0},
		Payments:      []ZReportPayment{{Method: "cash", Amount: 1000.0}},
		Tickets:       []string{"POS/2025/0001"},
		TicketsCount:  1,
		LastTicketHash: "abc123",
		ChainLevel:    "z-report",
		Tenant:        "tenant1",
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant", "tenant1")

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusCreated, resp.StatusCode)

	mockService.AssertExpectations(t)
}

func TestPosZReportsHandler_MissingXTenant(t *testing.T) {
	mockService := new(MockZReportsService)
	cfg := &config.Config{}
	logger := zerolog.Nop()
	log := &logger

	app := fiber.New()
	app.Post("/api/v1/pos/zreports", PosZReportsHandler(mockService, cfg, log))

	payload := ZReportPayload{
		ZID: "Z2025-11-15-01",
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	// Pas de header X-Tenant

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestPosZReportsHandler_InvalidJSON(t *testing.T) {
	mockService := new(MockZReportsService)
	cfg := &config.Config{}
	logger := zerolog.Nop()
	log := &logger

	app := fiber.New()
	app.Post("/api/v1/pos/zreports", PosZReportsHandler(mockService, cfg, log))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant", "tenant1")

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestPosZReportsHandler_PayloadTooLarge(t *testing.T) {
	mockService := new(MockZReportsService)
	cfg := &config.Config{
		ZReportMaxSizeBytes: 100, // Très petit
	}
	logger := zerolog.Nop()
	log := &logger

	app := fiber.New()
	app.Post("/api/v1/pos/zreports", PosZReportsHandler(mockService, cfg, log))

	largeBody := make([]byte, 200)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pos/zreports", bytes.NewReader(largeBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant", "tenant1")

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusRequestEntityTooLarge, resp.StatusCode)
}

