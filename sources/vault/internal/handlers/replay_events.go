package handlers

import (
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/replay"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// ReplayEventItem élément du feed (pour réponse JSON)
type ReplayEventItem struct {
	EventID       string                 `json:"event_id"`
	Tenant        string                 `json:"tenant"`
	EventType     string                 `json:"event_type"`
	Sequence      int64                  `json:"sequence"`
	Timestamp     time.Time              `json:"timestamp"`
	Payload       map[string]interface{} `json:"payload"`
	Hash          string                 `json:"hash"`
	SchemaVersion string                 `json:"schema_version"`
}

// ReplayEventsResponse réponse GET /api/v1/replay/events
type ReplayEventsResponse struct {
	Data   []ReplayEventItem `json:"data"`
	Next   string            `json:"next,omitempty"`   // Cursor pour pagination (E2-US2)
	Limit  int               `json:"limit"`
	Count  int               `json:"count"`
}

// ReplayEventsHandler gère GET /api/v1/replay/events (E2-US1)
// Params: tenant (required), from, to, types (comma-separated), cursor, limit
func ReplayEventsHandler(db *storage.DB, cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		tenant := c.Query("tenant")
		if tenant == "" {
			tenant = c.Get("X-Tenant")
		}
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing tenant (query param or X-Tenant header)",
			})
		}

		limit := 100
		if s := c.Query("limit"); s != "" {
			if n, err := strconv.Atoi(s); err == nil && n > 0 {
				limit = n
			}
		}
		limitMax := 500
		if cfg != nil && cfg.ReplayEventsLimitMax > 0 {
			limitMax = cfg.ReplayEventsLimitMax
		}
		if limit > limitMax {
			limit = limitMax
		}

		var fromTS, toTS *time.Time
		if s := c.Query("from"); s != "" {
			if t, err := time.Parse(time.RFC3339, s); err == nil {
				fromTS = &t
			}
		}
		if s := c.Query("to"); s != "" {
			if t, err := time.Parse(time.RFC3339, s); err == nil {
				toTS = &t
			}
		}

		var types []string
		if s := c.Query("types"); s != "" {
			for _, t := range strings.Split(s, ",") {
				t = strings.TrimSpace(t)
				if t != "" {
					types = append(types, t)
				}
			}
		}

		afterSeq := int64(0)
		cursorSecret := ""
		if cfg != nil {
			cursorSecret = cfg.ReplayCursorSecret
			if cursorSecret == "" {
				cursorSecret = cfg.WebhooksSecretKey
			}
		}
		if cursor := c.Query("cursor"); cursor != "" {
			seq, err := replay.ParseCursor(cursor, tenant, cursorSecret)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "Invalid or tampered cursor",
				})
			}
			if seq < 0 {
				seq = 0
			}
			afterSeq = seq
		}

		q := storage.ListEconomicEventsQuery{
			Tenant:        tenant,
			AfterSequence: afterSeq,
			FromTimestamp: fromTS,
			ToTimestamp:   toTS,
			EventTypes:    types,
			Limit:         limit,
		}

		events, err := db.ListEconomicEvents(c.Context(), q)
		if err != nil {
			if log != nil {
				log.Error().Err(err).Str("tenant", tenant).Msg("List economic events failed")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to list events",
			})
		}

		items := make([]ReplayEventItem, 0, len(events))
		for _, e := range events {
			var payload map[string]interface{}
			if len(e.PayloadJSON) > 0 {
				_ = json.Unmarshal(e.PayloadJSON, &payload)
			}
			items = append(items, ReplayEventItem{
				EventID:       e.EventID.String(),
				Tenant:        e.Tenant,
				EventType:     e.EventType,
				Sequence:      e.Sequence,
				Timestamp:     e.Timestamp,
				Payload:       payload,
				Hash:          e.Hash,
				SchemaVersion: e.SchemaVersion,
			})
		}

		resp := ReplayEventsResponse{
			Data:  items,
			Limit: limit,
			Count: len(items),
		}

		// E2-US2: générer cursor next si on a des résultats
		if len(events) > 0 {
			lastSeq := events[len(events)-1].Sequence
			if nextCursor, err := replay.BuildCursor(lastSeq, tenant, cursorSecret); err == nil {
				resp.Next = nextCursor
			}
		}

		return c.JSON(resp)
	}
}
