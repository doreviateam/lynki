package replay

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/rs/zerolog"
)

const (
	SchemaVersionV1 = "dorevia.economic_event.v1"
)

// SupportedSchemaVersions versions supportées par le Runner (🔁 B)
var SupportedSchemaVersions = map[string]bool{
	SchemaVersionV1: true,
}

// PaymentAllocationEntry trace paiement → factures (E6-US4bis)
type PaymentAllocationEntry struct {
	EventID     string           `json:"event_id"`
	PaymentID   int64            `json:"payment_id"`
	Allocations []AllocationItem `json:"allocations"`
}

// RunnerStats compteurs pour stats_json (E5-US1, E5-US3)
type RunnerStats struct {
	InvoiceIssued    int `json:"invoice_issued"`
	InvoiceRefund   int `json:"invoice_refund"`
	PaymentReceived int `json:"payment_received"`
	PaymentSent     int `json:"payment_sent"`
	Partners        int `json:"partners"` // partner_ref uniques
	EventsTotal     int `json:"events_total"`
	Errors          int `json:"errors"`
	SkippedSchema   int `json:"skipped_schema"`
	// Apply mode (E5-US3)
	Applied int `json:"applied"` // créés/mis à jour
	Skipped int `json:"skipped"` // déjà appliqués (idempotence)
	Failed  int `json:"failed"`  // erreurs apply
	// E6-US4bis : journal allocations FIFO
	PaymentAllocations []PaymentAllocationEntry `json:"payment_allocations,omitempty"`
}

// Runner exécute les jobs de replay (E5-US1, E5-US2)
type Runner struct {
	db           *storage.DB
	cfg          *config.Config
	log          *zerolog.Logger
	cursorSecret string
	pollInterval time.Duration
	mu           sync.Mutex
	stopCh       chan struct{}
	running      bool
}

// NewRunner crée un Runner
func NewRunner(db *storage.DB, cfg *config.Config, log *zerolog.Logger) *Runner {
	cursorSecret := ""
	if cfg != nil {
		cursorSecret = cfg.ReplayCursorSecret
		if cursorSecret == "" {
			cursorSecret = cfg.WebhooksSecretKey
		}
	}
	return &Runner{
		db:           db,
		cfg:          cfg,
		log:          log,
		cursorSecret: cursorSecret,
		pollInterval: 5 * time.Second,
		stopCh:       make(chan struct{}),
	}
}

// SetPollInterval configure l'intervalle de poll
func (r *Runner) SetPollInterval(d time.Duration) {
	r.pollInterval = d
}

// Start lance le poll des jobs (goroutine)
func (r *Runner) Start(ctx context.Context) {
	r.mu.Lock()
	if r.running {
		r.mu.Unlock()
		return
	}
	r.running = true
	r.stopCh = make(chan struct{})
	r.mu.Unlock()

	go r.pollLoop(ctx)
	if r.log != nil {
		r.log.Info().Msg("Replay Runner started")
	}
}

// Stop arrête le Runner
func (r *Runner) Stop() {
	r.mu.Lock()
	defer r.mu.Unlock()
	if !r.running {
		return
	}
	close(r.stopCh)
	r.running = false
	if r.log != nil {
		r.log.Info().Msg("Replay Runner stopped")
	}
}

func (r *Runner) pollLoop(ctx context.Context) {
	ticker := time.NewTicker(r.pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-r.stopCh:
			return
		case <-ticker.C:
			r.processQueuedJobs(ctx)
		}
	}
}

// ProcessOneJob traite un seul job queued (pour tests E2E)
func (r *Runner) ProcessOneJob(ctx context.Context) {
	r.processQueuedJobs(ctx)
}

func (r *Runner) processQueuedJobs(ctx context.Context) {
	if r.db == nil {
		return
	}

	jobs, err := r.db.ListReplayJobsQueued(ctx, "", 5)
	if err != nil {
		if r.log != nil {
			r.log.Error().Err(err).Msg("List queued jobs failed")
		}
		return
	}

	for _, job := range jobs {
		r.runJob(ctx, &job)
	}
}

// runJob exécute un job (dry_run ou apply)
func (r *Runner) runJob(ctx context.Context, job *models.ReplayJob) {
	modeLabel := job.Mode
	_ = r.db.UpdateReplayJobStatus(ctx, job.JobID, "running", nil)
	_ = r.db.AppendReplayJobLog(ctx, job.JobID, "info", "Job started ("+modeLabel+")", nil)

	stats := &RunnerStats{}
	partnerRefs := make(map[string]bool)
	afterSeq := int64(0)
	if job.ProgressLastSequence != nil {
		afterSeq = *job.ProgressLastSequence
	}
	cursor := ""
	if job.ProgressCursor != nil {
		cursor = *job.ProgressCursor
	}

	// Adapter Odoo pour mode apply (E5-US3)
	var adapter *OdooAdapter
	if job.Mode == "apply" {
		adapter = r.buildAdapter(job)
		if adapter == nil {
			errMsg := "apply mode requires odoo_url (job options or ODOO_URL env)"
			_ = r.db.UpdateReplayJobStatus(ctx, job.JobID, "failed", &errMsg)
			_ = r.db.AppendReplayJobLog(ctx, job.JobID, "error", errMsg, nil)
			return
		}
	}

	batchSize := 100
	if r.cfg != nil && r.cfg.ReplayEventsLimitMax > 0 {
		batchSize = r.cfg.ReplayEventsLimitMax
		if batchSize > 500 {
			batchSize = 500
		}
	}

	for {
		q := storage.ListEconomicEventsQuery{
			Tenant:        job.Tenant,
			AfterSequence: afterSeq,
			FromTimestamp: job.RangeFrom,
			ToTimestamp:   job.RangeTo,
			Limit:         batchSize,
		}
		if cursor != "" {
			seq, err := ParseCursor(cursor, job.Tenant, r.cursorSecret)
			if err == nil {
				q.AfterSequence = seq
			}
		}

		events, err := r.db.ListEconomicEvents(ctx, q)
		if err != nil {
			stats.Errors++
			errMsg := err.Error()
			_ = r.db.UpdateReplayJobStatus(ctx, job.JobID, "failed", &errMsg)
			_ = r.db.AppendReplayJobLog(ctx, job.JobID, "error", "List events failed: "+err.Error(), nil)
			return
		}

		if len(events) == 0 {
			break
		}

		// E5-US2 : ordonner Invoices → Payments (même ordre dry_run et apply)
		ordered := orderEventsForReplay(events)

		for _, e := range ordered {
			if !SupportedSchemaVersions[e.SchemaVersion] {
				stats.SkippedSchema++
				continue
			}
			stats.EventsTotal++
			incEventStats(stats, e.EventType)

			// Extraire partner_ref pour comptage
			if ref := extractPartnerRef(e.PayloadJSON); ref != "" {
				if !partnerRefs[ref] {
					partnerRefs[ref] = true
					stats.Partners++
				}
			}

			// E5-US3 : apply mode — appels HTTP Odoo
			if adapter != nil {
				r.applyEvent(ctx, job, adapter, &e, stats)
			}
		}

		lastSeq := events[len(events)-1].Sequence
		afterSeq = lastSeq

		nextCursor, err := BuildCursor(lastSeq, job.Tenant, r.cursorSecret)
		if err == nil {
			cursor = nextCursor
		}

		// Checkpoint après chaque batch
		_ = r.db.UpdateReplayJobProgress(ctx, job.JobID, int64(stats.EventsTotal), &lastSeq, &cursor)

		statsJSON, _ := json.Marshal(stats)
		_ = r.db.UpdateReplayJobStats(ctx, job.JobID, statsJSON)

		if len(events) < batchSize {
			break
		}
	}

	// P0 décision explicite : status = completed même avec erreurs partielles (failed > 0).
	// "failed" réservé aux erreurs bloquantes (pas d'Odoo URL, list events erreur).
	// Les stats (applied/skipped/failed) + logs donnent le détail.
	errMsg := (*string)(nil)
	if job.Mode == "apply" && stats.Failed > 0 {
		s := fmt.Sprintf("%d événement(s) en échec — voir logs", stats.Failed)
		errMsg = &s
	}
	_ = r.db.UpdateReplayJobStatus(ctx, job.JobID, "completed", errMsg)
	statsJSON, _ := json.Marshal(stats)
	_ = r.db.UpdateReplayJobStats(ctx, job.JobID, statsJSON)

	msg := fmt.Sprintf("Job completed: %d events, %d partners", stats.EventsTotal, stats.Partners)
	if job.Mode == "apply" {
		msg = fmt.Sprintf("Job completed: %d applied, %d skipped, %d failed", stats.Applied, stats.Skipped, stats.Failed)
	}
	_ = r.db.AppendReplayJobLog(ctx, job.JobID, "info", msg, statsJSON)
}

// buildAdapter construit l'adapter depuis job.Options ou config
func (r *Runner) buildAdapter(job *models.ReplayJob) *OdooAdapter {
	baseURL := ""
	user := ""
	password := ""
	timeoutSec := 0
	retryMax := -1

	var database string
	if len(job.Options) > 0 {
		var opts map[string]interface{}
		if json.Unmarshal(job.Options, &opts) == nil {
			if v, ok := opts["odoo_url"]; ok {
				baseURL = fmt.Sprintf("%v", v)
			}
			if v, ok := opts["odoo_database"]; ok {
				database = strings.TrimSpace(fmt.Sprintf("%v", v))
			}
			if v, ok := opts["odoo_user"]; ok {
				user = fmt.Sprintf("%v", v)
			}
			if v, ok := opts["odoo_password"]; ok {
				password = fmt.Sprintf("%v", v)
			}
			if v, ok := opts["odoo_timeout_sec"]; ok {
				if n, ok := toInt(v); ok && n > 0 {
					timeoutSec = n
				}
			}
			if v, ok := opts["odoo_retry_max"]; ok {
				if n, ok := toInt(v); ok && n >= 0 {
					retryMax = n
				}
			}
		}
	}
	if baseURL == "" && r.cfg != nil {
		baseURL = r.cfg.OdooURL
		user = r.cfg.OdooUser
		password = r.cfg.OdooPassword
		if timeoutSec <= 0 {
			timeoutSec = r.cfg.OdooTimeoutSec
		}
		if retryMax < 0 {
			retryMax = r.cfg.OdooRetryMax
		}
	}
	if baseURL == "" {
		return nil
	}
	timeout := 30 * time.Second
	if timeoutSec > 0 {
		timeout = time.Duration(timeoutSec) * time.Second
	}
	if retryMax < 0 {
		retryMax = 2
	}
	// P0 : avertissement si credentials par défaut (prod = secret manager)
	if user == "admin" && password == "admin" && r.log != nil {
		r.log.Warn().Msg("Odoo adapter: admin/admin détecté — en prod utiliser credentials depuis secret manager")
	}
	return NewOdooAdapter(AdapterConfig{
		BaseURL:   baseURL,
		Database:  database,
		User:      user,
		Password:  password,
		Timeout:   timeout,
		RetryMax:  retryMax,
	})
}

// applyEvent applique un événement via l'adapter Odoo (E5-US3)
// Ordre : partner/upsert si invoice/payment, puis invoice ou payment.
func (r *Runner) applyEvent(ctx context.Context, job *models.ReplayJob, adapter *OdooAdapter, evt *models.EconomicEvent, stats *RunnerStats) {
	partnerRef := extractPartnerRef(evt.PayloadJSON)
	partnerName := extractPartnerName(evt.PayloadJSON)
	if partnerName == "" {
		partnerName = partnerRef
	}

	tenant := job.Tenant

	switch evt.EventType {
	case "invoice_issued", "invoice_refund":
		// 1. Partner upsert (idempotent)
		if partnerRef != "" {
			res, _ := adapter.PartnerUpsert(tenant, partnerName, partnerRef, nil)
			if res.Failed {
				r.logApplyError(ctx, job, evt, "partner/upsert", res.Message)
				stats.Failed++
				return
			}
		}
		// 2. Invoice create_synth
		res, _ := adapter.InvoiceCreateSynth(tenant, evt)
		if res.Skipped {
			stats.Skipped++
		} else if res.Failed {
			r.logApplyError(ctx, job, evt, "invoice/create_synth", res.Message)
			stats.Failed++
		} else {
			stats.Applied++
		}

	case "payment_received", "payment_sent":
		// 1. Partner upsert (idempotent)
		if partnerRef != "" {
			res, _ := adapter.PartnerUpsert(tenant, partnerName, partnerRef, nil)
			if res.Failed {
				r.logApplyError(ctx, job, evt, "partner/upsert", res.Message)
				stats.Failed++
				return
			}
		}
		// 2. Payment create
		res, _ := adapter.PaymentCreate(tenant, evt)
		if res.Skipped {
			stats.Skipped++
		} else if res.Failed {
			r.logApplyError(ctx, job, evt, "payment/create", res.Message)
			stats.Failed++
		} else {
			stats.Applied++
		}
		// E6-US4bis : tracer allocations dans le report
		if len(res.Allocations) > 0 {
			stats.PaymentAllocations = append(stats.PaymentAllocations, PaymentAllocationEntry{
				EventID:     evt.EventID.String(),
				PaymentID:   res.ResID,
				Allocations: res.Allocations,
			})
		}

	default:
		// Autres types : non traités en apply
		stats.Skipped++
	}
}

func toInt(v interface{}) (int, bool) {
	switch x := v.(type) {
	case int:
		return x, true
	case int64:
		return int(x), true
	case float64:
		return int(x), true
	default:
		return 0, false
	}
}

func (r *Runner) logApplyError(ctx context.Context, job *models.ReplayJob, evt *models.EconomicEvent, endpoint, msg string) {
	if r.log != nil {
		r.log.Warn().
			Str("job_id", job.JobID.String()).
			Str("event_id", evt.EventID.String()).
			Str("event_type", evt.EventType).
			Str("endpoint", endpoint).
			Msg("Apply failed: " + msg)
	}
	_ = r.db.AppendReplayJobLog(ctx, job.JobID, "warn",
		fmt.Sprintf("Apply failed %s event_id=%s: %s", endpoint, evt.EventID.String(), msg),
		nil,
	)
}

func incEventStats(s *RunnerStats, eventType string) {
	switch eventType {
	case "invoice_issued":
		s.InvoiceIssued++
	case "invoice_refund":
		s.InvoiceRefund++
	case "payment_received":
		s.PaymentReceived++
	case "payment_sent":
		s.PaymentSent++
	}
}

func extractPartnerRef(payloadJSON []byte) string {
	if len(payloadJSON) == 0 {
		return ""
	}
	var m map[string]interface{}
	if json.Unmarshal(payloadJSON, &m) != nil {
		return ""
	}
	if v, ok := m["partner_ref"]; ok && v != nil {
		return fmt.Sprintf("%v", v)
	}
	return ""
}

// orderEventsForReplay ordonne : Invoices → Payments (E5-US2)
// Partners = partner_ref extraits des payloads (comptés, pas d'event dédié).
// Ordre : invoices d'abord (partner implicite), puis payments. Dry_run = rapport cohérent.
func orderEventsForReplay(events []models.EconomicEvent) []models.EconomicEvent {
	invoices := make([]models.EconomicEvent, 0)
	payments := make([]models.EconomicEvent, 0)
	other := make([]models.EconomicEvent, 0)

	for _, e := range events {
		switch e.EventType {
		case "invoice_issued", "invoice_refund":
			invoices = append(invoices, e)
		case "payment_received", "payment_sent":
			payments = append(payments, e)
		default:
			other = append(other, e)
		}
	}

	result := make([]models.EconomicEvent, 0, len(events))
	result = append(result, invoices...)
	result = append(result, payments...)
	result = append(result, other...)
	return result
}
