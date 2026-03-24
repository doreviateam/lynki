package handlers

import (
	"encoding/json"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

type factsPackArchiveRequest struct {
	Tenant          string          `json:"tenant"`
	FactsHash       string          `json:"facts_hash"`
	PackJSON        json.RawMessage `json:"pack_json"`
	Source          string          `json:"source"`
	TemplateVersion string          `json:"template_version"`
}

func FactsPackArchiveHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}

		var req factsPackArchiveRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid JSON body"})
		}

		if req.Tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		if req.FactsHash == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "facts_hash is required"})
		}
		if len(req.PackJSON) == 0 || !json.Valid(req.PackJSON) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "pack_json must be a valid JSON object"})
		}
		if req.Source != "insight" && req.Source != "report" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "source must be 'insight' or 'report'"})
		}

		err := db.UpsertFactsPackArchive(c.Context(), &storage.FactsPackArchiveUpsert{
			Tenant:          req.Tenant,
			FactsHash:       req.FactsHash,
			PackJSON:        req.PackJSON,
			Source:          req.Source,
			TemplateVersion: req.TemplateVersion,
		})
		if err != nil {
			log.Error().Err(err).Str("tenant", req.Tenant).Str("facts_hash", req.FactsHash).Msg("facts_pack_archive: upsert failed")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		log.Info().
			Str("event", "facts_pack_archived").
			Str("tenant", req.Tenant).
			Str("facts_hash", req.FactsHash).
			Str("source", req.Source).
			Str("template_version", req.TemplateVersion).
			Int("size_bytes", len(req.PackJSON)).
			Msg("facts_pack_archive: archived")

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"status":     "archived",
			"facts_hash": req.FactsHash,
			"source":     req.Source,
		})
	}
}

func FactsPackGetHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}

		hash := c.Params("hash")
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}

		source := c.Query("source")
		if source != "" && source != "insight" && source != "report" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "source must be 'insight' or 'report'"})
		}

		rows, err := db.GetFactsPackArchive(c.Context(), tenant, hash)
		if err != nil {
			log.Error().Err(err).Str("tenant", tenant).Str("hash", hash).Msg("facts_pack_get: query failed")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		if source != "" {
			for _, r := range rows {
				if r.Source == source {
					return c.JSON(r)
				}
			}
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": fiber.Map{"code": "NOT_FOUND"}})
		}

		switch len(rows) {
		case 0:
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": fiber.Map{"code": "NOT_FOUND"}})
		case 1:
			return c.JSON(rows[0])
		default:
			available := make([]string, len(rows))
			for i, r := range rows {
				available[i] = r.Source
			}
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": fiber.Map{
					"code":              "AMBIGUOUS_SOURCE",
					"message":           "Plusieurs sources disponibles. Préciser ?source=insight ou ?source=report.",
					"available_sources": available,
				},
			})
		}
	}
}
