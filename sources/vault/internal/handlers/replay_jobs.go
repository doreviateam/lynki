package handlers

import (
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// CreateReplayJobRequest body POST /api/v1/replay/jobs (E4-US2)
type CreateReplayJobRequest struct {
	Tenant   string                 `json:"tenant"`
	Mode     string                 `json:"mode"`     // dry_run | apply
	Range    *ReplayJobRange        `json:"range"`   // from, to (optionnel)
	Options  map[string]interface{} `json:"options"` // odoo_url, etc.
}

// ReplayJobRange plage temporelle du job
type ReplayJobRange struct {
	From string `json:"from"` // RFC3339 ou YYYY-MM-DD
	To   string `json:"to"`   // RFC3339 ou YYYY-MM-DD
}

// CreateReplayJobResponse réponse POST /api/v1/replay/jobs
type CreateReplayJobResponse struct {
	JobID    string    `json:"job_id"`
	Tenant   string    `json:"tenant"`
	Mode     string    `json:"mode"`
	Status   string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

// ReplayJobsCreateHandler gère POST /api/v1/replay/jobs (E4-US2)
func ReplayJobsCreateHandler(db *storage.DB, cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		var req CreateReplayJobRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid JSON body",
			})
		}

		// Validation tenant
		tenant := strings.TrimSpace(req.Tenant)
		if tenant == "" {
			tenant = c.Get("X-Tenant")
		}
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing tenant (body.tenant or X-Tenant header)",
			})
		}

		// Validation mode
		mode := strings.TrimSpace(strings.ToLower(req.Mode))
		if mode == "" {
			mode = "dry_run"
		}
		if mode != "dry_run" && mode != "apply" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid mode (must be dry_run or apply)",
			})
		}

		// Validation range
		var rangeFrom, rangeTo *time.Time
		if req.Range != nil {
			if req.Range.From != "" {
				t, err := parseRangeDate(req.Range.From)
				if err != nil {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "Invalid range.from (use YYYY-MM-DD or RFC3339)",
					})
				}
				rangeFrom = &t
			}
			if req.Range.To != "" {
				t, err := parseRangeDate(req.Range.To)
				if err != nil {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "Invalid range.to (use YYYY-MM-DD or RFC3339)",
					})
				}
				rangeTo = &t
			}
			if rangeFrom != nil && rangeTo != nil && rangeFrom.After(*rangeTo) {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "range.from must be before or equal to range.to",
				})
			}
		}

		// Options JSON
		var optionsJSON []byte
		if len(req.Options) > 0 {
			var err error
			optionsJSON, err = json.Marshal(req.Options)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "Invalid options JSON",
				})
			}
		}

		ctx := c.Context()
		job, err := db.CreateReplayJob(ctx, tenant, mode, rangeFrom, rangeTo, optionsJSON)
		if err != nil {
			if log != nil {
				log.Error().Err(err).Str("tenant", tenant).Msg("Create replay job failed")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create job",
			})
		}

		return c.Status(fiber.StatusCreated).JSON(CreateReplayJobResponse{
			JobID:     job.JobID.String(),
			Tenant:    job.Tenant,
			Mode:      job.Mode,
			Status:    job.Status,
			CreatedAt: job.CreatedAt,
		})
	}
}

func parseRangeDate(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	// Essayer RFC3339
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	// Essayer YYYY-MM-DD
	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t.UTC(), nil
	}
	return time.Time{}, errors.New("invalid date format")
}

// ReplayJobGetHandler gère GET /api/v1/replay/jobs/:id (E4-US3)
func ReplayJobGetHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		idStr := c.Params("id")
		if idStr == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing job id"})
		}
		jobID, err := uuid.Parse(idStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid job id"})
		}

		job, err := db.GetReplayJobByID(c.Context(), jobID)
		if err != nil {
			if log != nil {
				log.Error().Err(err).Str("job_id", idStr).Msg("Get replay job failed")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get job"})
		}
		if job == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Job not found"})
		}

		// Réponse avec champs checkpoint
		resp := fiber.Map{
			"job_id":                    job.JobID.String(),
			"tenant":                    job.Tenant,
			"mode":                      job.Mode,
			"status":                    job.Status,
			"range_from":                job.RangeFrom,
			"range_to":                  job.RangeTo,
			"progress_events_processed": job.ProgressEventsProcessed,
			"progress_last_sequence":    job.ProgressLastSequence,
			"progress_cursor":           job.ProgressCursor,
			"error_message":             job.ErrorMessage,
			"created_at":                job.CreatedAt,
			"started_at":                job.StartedAt,
			"completed_at":              job.CompletedAt,
		}
		if len(job.StatsJSON) > 0 {
			var stats map[string]interface{}
			if json.Unmarshal(job.StatsJSON, &stats) == nil {
				resp["stats_json"] = stats
			}
		}
		return c.JSON(resp)
	}
}

// ReplayJobLogsHandler gère GET /api/v1/replay/jobs/:id/logs (E4-US4) — logs paginés
func ReplayJobLogsHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}

		jobID, err := parseJobID(c)
		if err != nil {
			return err
		}

		job, err := db.GetReplayJobByID(c.Context(), jobID)
		if err != nil || job == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Job not found"})
		}

		limit := 50
		if s := c.Query("limit"); s != "" {
			if n, e := parseInt(s); e == nil && n > 0 && n <= 500 {
				limit = n
			}
		}
		offset := 0
		if s := c.Query("offset"); s != "" {
			if n, e := parseInt(s); e == nil && n >= 0 {
				offset = n
			}
		}

		logs, err := db.ListReplayJobLogs(c.Context(), jobID, limit, offset)
		if err != nil {
			if log != nil {
				log.Error().Err(err).Str("job_id", jobID.String()).Msg("List job logs failed")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to list logs"})
		}

		total, _ := db.CountReplayJobLogs(c.Context(), jobID)

		items := make([]fiber.Map, 0, len(logs))
		for _, l := range logs {
			item := fiber.Map{
				"id":        l.ID,
				"logged_at": l.LoggedAt,
				"level":     l.Level,
				"message":   l.Message,
			}
			if len(l.Data) > 0 {
				var data map[string]interface{}
				if json.Unmarshal(l.Data, &data) == nil {
					item["data"] = data
				}
			}
			items = append(items, item)
		}

		return c.JSON(fiber.Map{
			"job_id": jobID.String(),
			"data":   items,
			"total":  total,
			"limit":  limit,
			"offset": offset,
		})
	}
}

// ReplayJobReportHandler gère GET /api/v1/replay/jobs/:id/report (E4-US4) — rapport structuré exportable
func ReplayJobReportHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}

		jobID, err := parseJobID(c)
		if err != nil {
			return err
		}

		job, err := db.GetReplayJobByID(c.Context(), jobID)
		if err != nil || job == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Job not found"})
		}

		// Rapport structuré pour validation dry_run
		report := fiber.Map{
			"job_id":       job.JobID.String(),
			"tenant":       job.Tenant,
			"mode":         job.Mode,
			"status":       job.Status,
			"range_from":   job.RangeFrom,
			"range_to":     job.RangeTo,
			"created_at":   job.CreatedAt,
			"started_at":   job.StartedAt,
			"completed_at": job.CompletedAt,
			"progress": fiber.Map{
				"events_processed": job.ProgressEventsProcessed,
				"last_sequence":    job.ProgressLastSequence,
				"cursor":           job.ProgressCursor,
			},
			"error_message": job.ErrorMessage,
		}

		if len(job.StatsJSON) > 0 {
			var stats map[string]interface{}
			if json.Unmarshal(job.StatsJSON, &stats) == nil {
				report["stats"] = stats
				report["summary"] = fiber.Map{
					"invoice_issued":   stats["invoice_issued"],
					"invoice_refund":   stats["invoice_refund"],
					"payment_received": stats["payment_received"],
					"payment_sent":     stats["payment_sent"],
					"partners":         stats["partners"],
					"events_total":     stats["events_total"],
					"errors":           stats["errors"],
					"skipped_schema":   stats["skipped_schema"],
				}
				// E6-US4bis : détail allocations paiement → factures
				if a, ok := stats["payment_allocations"]; ok && a != nil {
					report["payment_allocations"] = a
				}
			}
		}

		// Derniers logs (résumé)
		logs, _ := db.ListReplayJobLogs(c.Context(), jobID, 20, 0)
		logEntries := make([]fiber.Map, 0, len(logs))
		for _, l := range logs {
			logEntries = append(logEntries, fiber.Map{
				"logged_at": l.LoggedAt,
				"level":     l.Level,
				"message":   l.Message,
			})
		}
		report["logs_summary"] = logEntries

		// Header pour export (CSV/JSON)
		c.Set("Content-Disposition", `attachment; filename="replay-report-`+jobID.String()+`.json"`)
		return c.JSON(report)
	}
}

func parseJobID(c *fiber.Ctx) (uuid.UUID, error) {
	idStr := c.Params("id")
	if idStr == "" {
		return uuid.Nil, c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing job id"})
	}
	jobID, err := uuid.Parse(idStr)
	if err != nil {
		return uuid.Nil, c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid job id"})
	}
	return jobID, nil
}

func parseInt(s string) (int, error) {
	return strconv.Atoi(s)
}
