package models

import (
	"time"

	"github.com/google/uuid"
)

// EconomicEvent représente un événement économique dans le registre Vault (SPEC ERP Reconnect v1.2)
type EconomicEvent struct {
	EventID             uuid.UUID  `json:"event_id"`
	Tenant             string     `json:"tenant"`
	EventType          string     `json:"event_type"`
	Sequence           int64      `json:"sequence"`
	Timestamp          time.Time  `json:"timestamp"`
	PayloadJSON        []byte     `json:"payload_json"`
	Hash               string     `json:"hash"`
	PrevHash           *string    `json:"prev_hash,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	SourcePayloadJSON  []byte     `json:"source_payload_json,omitempty"`
	SchemaVersion      string     `json:"schema_version"`
	IngestSource       string     `json:"ingest_source"`
	IngestIdempotencyKey *string `json:"ingest_idempotency_key,omitempty"`
	EventKey           *string    `json:"event_key,omitempty"`
	CompanyID          *int       `json:"company_id,omitempty"`
}
