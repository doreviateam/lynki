package models

// ExplainRequest — POST /diva/generate body (et legacy /diva/explain)
type ExplainRequest struct {
	Context      Context                `json:"context"`
	ContextScope string                 `json:"context_scope,omitempty"`
	Dashboard    Dashboard              `json:"dashboard"`
	Options      Options                `json:"options"`
	CardsSpec    map[string]interface{} `json:"cards_spec,omitempty"`
}

type Context struct {
	Tenant      string `json:"tenant"`
	CompanyID   int    `json:"company_id"`
	DateStart   string `json:"date_start"`
	DateEnd     string `json:"date_end"`
	Timezone    string `json:"timezone"`
	Currency    string `json:"currency"`
	Locale      string `json:"locale"`
	PartnerName string `json:"partner_name,omitempty"` // Filtre client/partenaire (optionnel)
}

type Dashboard struct {
	Cards            []Card                 `json:"cards"`
	Details          map[string]interface{} `json:"_details,omitempty"`
	DataCompleteness *DataCompleteness     `json:"data_completeness,omitempty"` // DIVA Cockpit v1.1 — complete = disponibles, pas qualité
}

// DataCompleteness — complétude des données pour le prompt (axe discipline)
type DataCompleteness struct {
	BankHealthMetrics string `json:"bank_health_metrics"` // "absent" | "partial" | "complete"
}

type Card struct {
	Key          string   `json:"key"`
	Label        string   `json:"label"`
	Value        *float64 `json:"value"`
	Formatted    string   `json:"formatted,omitempty"`
	Unit         string   `json:"unit"`
	Status       string   `json:"status,omitempty"`
	StatusReason string   `json:"status_reason,omitempty"`
}

type Options struct {
	Mode                 string                 `json:"mode"`
	OutputMode           string                 `json:"output_mode,omitempty"`   // short | professional | deep (défaut: short)
	ForceRefresh         bool                   `json:"force_refresh"`
	FocusCard            string                 `json:"focus_card,omitempty"`   // Clé de la carte à cibler
	FocusCardDetails     map[string]interface{} `json:"focus_card_details,omitempty"`
	GeneratedFromRunner  bool                   `json:"generated_from_runner,omitempty"`
}

// ExplainResponse — 200 body
type ExplainResponse struct {
	Meta  Meta  `json:"meta"`
	Flash Flash `json:"flash"`
}

type Meta struct {
	RequestID           string `json:"request_id"`
	ContextHash         string `json:"context_hash"`
	GeneratedAt         string `json:"generated_at"`
	Cached              bool   `json:"cached"`
	Model               string `json:"model"`
	LatencyMs           int64  `json:"latency_ms"`
	RefreshInProgress   bool   `json:"refresh_in_progress,omitempty"`
}

type Flash struct {
	Headline   string   `json:"headline"`
	WhatISee   []string `json:"what_i_see"`
	ToCheck    []string `json:"to_check"`
	Confidence string   `json:"confidence"`
	Degraded   bool     `json:"degraded,omitempty"`
}
