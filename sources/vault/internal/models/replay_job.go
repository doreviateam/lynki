package models

import (
	"time"

	"github.com/google/uuid"
)

// ReplayJob représente un job de replay ERP (SPEC §6)
type ReplayJob struct {
	JobID                   uuid.UUID  `json:"job_id"`
	Tenant                  string     `json:"tenant"`
	Mode                    string     `json:"mode"`   // dry_run | apply
	Status                  string     `json:"status"` // queued | running | completed | failed
	RangeFrom               *time.Time `json:"range_from,omitempty"`
	RangeTo                 *time.Time `json:"range_to,omitempty"`
	Options                 []byte     `json:"options,omitempty"`
	ProgressEventsProcessed int64      `json:"progress_events_processed"`
	ProgressLastSequence    *int64     `json:"progress_last_sequence,omitempty"` // last_sequence_processed
	ProgressCursor          *string    `json:"progress_cursor,omitempty"`       // cursor_state
	StatsJSON               []byte     `json:"stats_json,omitempty"`             // { "invoice_issued": N, "payment_received": N, "errors": N }
	ErrorMessage            *string    `json:"error_message,omitempty"`          // last_error
	CreatedAt               time.Time  `json:"created_at"`
	StartedAt               *time.Time `json:"started_at,omitempty"`
	CompletedAt             *time.Time `json:"completed_at,omitempty"`
}

// ReplayJobLog représente une entrée du journal d'exécution
type ReplayJobLog struct {
	ID       int64     `json:"id"`
	JobID    uuid.UUID `json:"job_id"`
	LoggedAt time.Time `json:"logged_at"`
	Level    string    `json:"level"`
	Message  string    `json:"message"`
	Data     []byte    `json:"data,omitempty"`
}
