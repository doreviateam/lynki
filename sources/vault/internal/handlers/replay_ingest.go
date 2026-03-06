package handlers

import (
	"encoding/json"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/replay"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// IngestRequest représente le body POST /api/v1/replay/ingest (format raw DVIG)
type IngestRequest struct {
	Tenant string              `json:"tenant"`
	Raw    *replay.RawPayload  `json:"raw"`
}

// IngestResponse réponse de l'ingest
type IngestResponse struct {
	EventID    string `json:"event_id"`
	Sequence   int64  `json:"sequence"`
	EventType  string `json:"event_type"`
	Hash       string `json:"hash"`
	Message    string `json:"message,omitempty"` // "Already ingested" si idempotent
}

// ReplayIngestHandler gère POST /api/v1/replay/ingest
// Accepte un payload raw DVIG, mappe vers canonique, insère dans economic_events (E1-US3, E1-US4)
func ReplayIngestHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		body := c.Body()
		if len(body) == 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Empty body",
			})
		}

		tenant := c.Get("X-Tenant")
		var req IngestRequest
		_ = json.Unmarshal(body, &req)
		if req.Raw == nil {
			// Format raw seul { source, event_type, idempotency_key, data }
			var raw replay.RawPayload
			if err := json.Unmarshal(body, &raw); err != nil || raw.EventType == "" {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "Invalid JSON: expected raw payload (event_type, data) or { tenant, raw }",
				})
			}
			req.Raw = &raw
		}
		if req.Tenant != "" {
			tenant = req.Tenant
		}
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing tenant (X-Tenant header or body.tenant)",
			})
		}
		if req.Tenant != "" {
			tenant = req.Tenant
		}
		if req.Raw == nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing raw payload",
			})
		}

		// E1-US4 : validation type raw
		if !replay.IsSupportedRawType(req.Raw.EventType) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":       "Unsupported event_type",
				"event_type":  req.Raw.EventType,
				"supported":   replay.SupportedRawTypes(),
			})
		}

		// Mapper raw → canonique
		canonical, err := replay.MapRawToCanonical(req.Raw)
		if err != nil {
			if log != nil {
				log.Warn().Err(err).Str("event_type", req.Raw.EventType).Msg("Map raw to canonical failed")
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		payloadJSON, err := replay.CanonicalToJSON(canonical)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to serialize canonical payload",
			})
		}

		// Calcul hash canonique (🔐 A)
		_, hashHex, err := utils.CanonicalJSONAndHash(payloadJSON)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to compute hash",
			})
		}

		// Source payload pour traçabilité (copie du body)
		sourcePayloadJSON := make([]byte, len(body))
		copy(sourcePayloadJSON, body)

		eventType, _ := canonical["event_type"].(string)
		ingestKey := req.Raw.IdempotencyKey
		if ingestKey == "" {
			ingestKey = hashHex // Fallback si pas de clé fournie
		}

		event := &models.EconomicEvent{
			Tenant:              tenant,
			EventType:           eventType,
			Timestamp:           time.Now().UTC(),
			PayloadJSON:         payloadJSON,
			Hash:                hashHex,
			SourcePayloadJSON:   sourcePayloadJSON,
			SchemaVersion:       "dorevia.economic_event.v1",
			IngestSource:        "dvig",
			IngestIdempotencyKey: &ingestKey,
		}

		inserted, err := db.InsertEconomicEvent(c.Context(), event)
		if err != nil {
			if err == storage.ErrTenantLocked {
				if log != nil {
					log.Info().Str("tenant", tenant).Msg("Ingestion refused: tenant locked for backfill")
				}
				return c.Status(fiber.StatusConflict).JSON(fiber.Map{
					"error":   "Tenant locked for backfill",
					"tenant":  tenant,
				})
			}
			if log != nil {
				log.Error().Err(err).Str("tenant", tenant).Str("event_type", eventType).Msg("Insert economic event failed")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to store event",
			})
		}

		msg := ""
		if inserted != nil && inserted.Sequence == event.Sequence {
			// Vérifier si c'était idempotent (déjà existant)
			if inserted.EventID != event.EventID {
				msg = "Already ingested"
			}
		}

		return c.Status(fiber.StatusCreated).JSON(IngestResponse{
			EventID:   inserted.EventID.String(),
			Sequence:  inserted.Sequence,
			EventType: inserted.EventType,
			Hash:      inserted.Hash,
			Message:   msg,
		})
	}
}
