package handlers

import (
	"fmt"
	"strconv"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// ConstatsHandler gère les endpoints pour les constats mensuels
// SPEC 2 - Vault → Constat Mensuel
type ConstatsHandler struct {
	service *services.ConstatService
	log     *zerolog.Logger
}

// NewConstatsHandler crée un nouveau handler pour les constats
func NewConstatsHandler(service *services.ConstatService, log *zerolog.Logger) *ConstatsHandler {
	return &ConstatsHandler{
		service: service,
		log:     log,
	}
}

// GenerateConstatHandler génère un constat manuellement
// POST /api/v1/constats/generate
func (h *ConstatsHandler) GenerateConstatHandler(c *fiber.Ctx) error {
	var payload struct {
		Tenant string `json:"tenant"`
		Period string `json:"period"` // YYYY-MM
	}

	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
			"detail": err.Error(),
		})
	}

	// Validation
	if payload.Tenant == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "tenant is required",
		})
	}

	if payload.Period == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "period is required (format: YYYY-MM)",
		})
	}

	// Valider le format de période
	if _, err := time.Parse("2006-01", payload.Period); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "invalid period format, expected YYYY-MM",
		})
	}

	ctx := c.Context()
	constat, err := h.service.GenerateConstat(ctx, payload.Tenant, payload.Period)
	if err != nil {
		h.log.Error().
			Str("tenant", payload.Tenant).
			Str("period", payload.Period).
			Err(err).
			Msg("Failed to generate constat")
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to generate constat",
			"detail": err.Error(),
		})
	}

	// Construire la réponse
	response := h.buildConstatResponse(constat)

	return c.Status(200).JSON(response)
}

// GetConstatHandler récupère un constat par tenant et période
// GET /api/v1/constats/:tenant/:period
func (h *ConstatsHandler) GetConstatHandler(c *fiber.Ctx) error {
	tenant := c.Params("tenant")
	period := c.Params("period")

	if tenant == "" || period == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "tenant and period are required",
		})
	}

	// Valider le format de période
	if _, err := time.Parse("2006-01", period); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "invalid period format, expected YYYY-MM",
		})
	}

	ctx := c.Context()
	constat, err := h.service.GetConstat(ctx, tenant, period)
	if err != nil {
		if err.Error() == fmt.Sprintf("constat not found for tenant %s and period %s", tenant, period) {
			return c.Status(404).JSON(fiber.Map{
				"error": "Constat not found",
			})
		}
		h.log.Error().
			Str("tenant", tenant).
			Str("period", period).
			Err(err).
			Msg("Failed to get constat")
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to get constat",
			"detail": err.Error(),
		})
	}

	response := h.buildConstatResponse(constat)
	return c.Status(200).JSON(response)
}

// ListConstatsHandler liste les constats avec pagination
// GET /api/v1/constats?tenant=xxx&limit=10&offset=0
func (h *ConstatsHandler) ListConstatsHandler(c *fiber.Ctx) error {
	tenant := c.Query("tenant")
	limitStr := c.Query("limit", "10")
	offsetStr := c.Query("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100 // Maximum
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	ctx := c.Context()
	constats, total, err := h.service.ListConstats(ctx, tenant, limit, offset)
	if err != nil {
		h.log.Error().
			Str("tenant", tenant).
			Err(err).
			Msg("Failed to list constats")
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to list constats",
			"detail": err.Error(),
		})
	}

	// Construire la réponse
	response := fiber.Map{
		"constats": make([]fiber.Map, 0, len(constats)),
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	}

	constatsList := make([]fiber.Map, 0, len(constats))
	for _, constat := range constats {
		constatsList = append(constatsList, h.buildConstatSummary(constat))
	}
	response["constats"] = constatsList

	return c.Status(200).JSON(response)
}

// RetransmitConstatHandler retransmet un constat vers Odoo CORE
// POST /api/v1/constats/:tenant/:period/retransmit
func (h *ConstatsHandler) RetransmitConstatHandler(c *fiber.Ctx) error {
	tenant := c.Params("tenant")
	period := c.Params("period")

	if tenant == "" || period == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "tenant and period are required",
		})
	}

	// Valider le format de période
	if _, err := time.Parse("2006-01", period); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "invalid period format, expected YYYY-MM",
		})
	}

	ctx := c.Context()

	// Récupérer le constat
	constat, err := h.service.GetConstat(ctx, tenant, period)
	if err != nil {
		if err.Error() == fmt.Sprintf("constat not found for tenant %s and period %s", tenant, period) {
			return c.Status(404).JSON(fiber.Map{
				"error": "Constat not found",
			})
		}
		h.log.Error().
			Str("tenant", tenant).
			Str("period", period).
			Err(err).
			Msg("Failed to get constat for retransmission")
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to get constat",
			"detail": err.Error(),
		})
	}

	// Retransmettre
	err = h.service.TransmitConstat(ctx, constat)
	if err != nil {
		h.log.Error().
			Str("tenant", tenant).
			Str("period", period).
			Str("constat_id", constat.ConstatID).
			Err(err).
			Msg("Failed to retransmit constat")
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to retransmit constat",
			"detail": err.Error(),
		})
	}

	// Récupérer le constat mis à jour
	constat, err = h.service.GetConstat(ctx, tenant, period)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to get updated constat",
			"detail": err.Error(),
		})
	}

	response := h.buildConstatResponse(constat)
	return c.Status(200).JSON(response)
}

// buildConstatResponse construit la réponse JSON complète d'un constat
func (h *ConstatsHandler) buildConstatResponse(constat *models.Constat) fiber.Map {
	response := fiber.Map{
		"constat_id":   constat.ConstatID,
		"tenant":       constat.Tenant,
		"period":       constat.Period,
		"generated_at": constat.GeneratedAt.Format(time.RFC3339),
		"volumes": fiber.Map{
			"out_invoice": constat.Volumes.OutInvoice,
			"in_invoice":  constat.Volumes.InInvoice,
			"out_refund":  constat.Volumes.OutRefund,
			"in_refund":   constat.Volumes.InRefund,
		},
		"proofs": fiber.Map{
			"jws":             constat.Proofs.JWS,
			"documents_count": constat.Proofs.DocumentsCount,
		},
		"transmission_status": constat.TransmissionStatus,
	}

	if constat.VaultID != nil {
		response["vault_id"] = *constat.VaultID
	}

	if constat.Proofs.LedgerHash != nil {
		response["proofs"].(fiber.Map)["ledger_hash"] = *constat.Proofs.LedgerHash
	}

	if constat.Compliance != nil && constat.Compliance.Total() > 0 {
		response["compliance"] = fiber.Map{
			"compliant":            constat.Compliance.Compliant,
			"non_compliant_2026":   constat.Compliance.NonCompliant2026,
			"out_of_scope":         constat.Compliance.OutOfScope,
		}
	}

	if constat.TransmittedAt != nil {
		response["transmitted_at"] = constat.TransmittedAt.Format(time.RFC3339)
	}

	if constat.TransmissionError != nil {
		response["transmission_error"] = *constat.TransmissionError
	}

	return response
}

// buildConstatSummary construit un résumé d'un constat pour la liste
func (h *ConstatsHandler) buildConstatSummary(constat *models.Constat) fiber.Map {
	summary := fiber.Map{
		"constat_id":        constat.ConstatID,
		"tenant":            constat.Tenant,
		"period":            constat.Period,
		"generated_at":      constat.GeneratedAt.Format(time.RFC3339),
		"transmission_status": constat.TransmissionStatus,
	}

	if constat.TransmittedAt != nil {
		summary["transmitted_at"] = constat.TransmittedAt.Format(time.RFC3339)
	}

	return summary
}

