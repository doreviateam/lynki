package models

import "time"

// SeriesPoint point de série temporelle (agrégations)
type SeriesPoint struct {
	Period string  `json:"period"`
	Amount float64 `json:"amount"`
}

// AdjustmentsAggregationResponse réponse agrégation adjustments (avoirs, remboursements)
type AdjustmentsAggregationResponse struct {
	TotalAmount float64              `json:"total_amount"`
	EventCount  int                  `json:"event_count"`
	Currency    string               `json:"currency"`
	Series      []SeriesPoint        `json:"series"`
	Events      []AdjustmentsEventItem `json:"events,omitempty"`
}

// AdjustmentsEventItem événement adjustment (ligne list=1)
type AdjustmentsEventItem struct {
	DocumentID string  `json:"document_id"`
	SourceModel string `json:"source_model"`
	SourceID   string  `json:"source_id"`
	EventType  string  `json:"event_type"`
	Amount     float64 `json:"amount"`
	EventDate  string  `json:"event_date"`
	CreatedAt  string  `json:"created_at"`
	PartnerID  string  `json:"partner_id"`
}

// SalesAggregationResponse réponse agrégation ventes (SPEC_DOREVIA_UI_CARD_SALES_v1.0)
// posted_sales_count : dénominateur du ratio Certifié (single-source Vault = invoices_count)
type SalesAggregationResponse struct {
	Tenant            string        `json:"tenant"`
	Scope             string        `json:"scope"`
	Currency          string        `json:"currency"`
	Total             float64       `json:"total"`
	TotalHT           float64       `json:"total_ht"`
	TotalTax          float64       `json:"total_tax"`
	InvoicesCount     int           `json:"invoices_count"`
	PostedSalesCount    *int         `json:"posted_sales_count,omitempty"`   // Ratio certifié (single-source Vault)
	PostedPurchasesCount *int        `json:"posted_purchases_count,omitempty"` // Ratio certifié achats (single-source Vault)
	From              string        `json:"from"`
	To                string        `json:"to"`
	EffectiveFrom     string        `json:"effective_from,omitempty"`
	EffectiveTo       string        `json:"effective_to,omitempty"`
	Granularity       string        `json:"granularity"`
	Series            []SeriesPoint `json:"series"`
	LastSealAt        *time.Time    `json:"last_seal_at,omitempty"`
	Verifiable        bool          `json:"verifiable"`
}

// PaymentsAggregationResponse réponse agrégation paiements (SPEC_DOREVIA_PAYMENTS_v1.1)
type PaymentsAggregationResponse struct {
	Tenant        string               `json:"tenant"`
	Scope         string               `json:"scope"`
	Direction     string               `json:"direction"`
	Currency      string               `json:"currency"`
	Total         float64              `json:"total"`
	PaymentCount  int                  `json:"payment_count"`
	From          string               `json:"from"`
	To            string               `json:"to"`
	EffectiveFrom string               `json:"effective_from,omitempty"`
	EffectiveTo   string               `json:"effective_to,omitempty"`
	Granularity   string               `json:"granularity"`
	Series        []SeriesPoint        `json:"series"`
	Events        []PaymentEventItem   `json:"events,omitempty"`
	LastSealAt    *time.Time           `json:"last_seal_at,omitempty"`
	Verifiable    bool                 `json:"verifiable"`
	// ByMethod ventilation espèces vs banque (cash, transfer, card, etc.)
	ByMethod map[string]float64 `json:"by_method,omitempty"`
}

// PaymentEventItem événement paiement (ligne list=1)
type PaymentEventItem struct {
	DocumentID  string    `json:"document_id"`
	SourceID    string    `json:"source_id"`
	Amount      float64   `json:"amount"`
	PaymentDate string    `json:"payment_date"`
	CreatedAt   time.Time `json:"created_at"`
}

// PosSessionsAggregationResponse réponse agrégation sessions POS (SPEC sessions.md, ZeDocs/web18)
// Source: pos.session.closed ou dérivation depuis pos.order (interim)
type PosSessionsAggregationResponse struct {
	TotalSessions   int             `json:"total_sessions"`
	SealedSessions  int             `json:"sealed_sessions"`
	PendingSessions int             `json:"pending_sessions"`
	Items           []PosSessionItem `json:"items"`
}

// PosSessionItem une session POS
type PosSessionItem struct {
	SessionID   string  `json:"session_id"`
	ShopID      string  `json:"shop_id"`
	OpenedAt    string  `json:"opened_at,omitempty"`
	ClosedAt    string  `json:"closed_at,omitempty"`
	TotalSales  float64 `json:"total_sales"`
	TotalTickets int    `json:"total_tickets"`
	CashTotal   float64 `json:"cash_total"`
	CardTotal   float64 `json:"card_total"`
	Difference  float64 `json:"difference"`
	VaultStatus string  `json:"vault_status"` // sealed | pending | failed | missing
}

// SalesByPartnerResponse réponse agrégation ventes par partenaire (Pareto 80/20)
type SalesByPartnerResponse struct {
	TotalHT         float64              `json:"total_ht"`
	PartnersCount   int                  `json:"partners_count"`
	Items           []SalesByPartnerItem `json:"items"`
	Pareto80Cutoff  int                  `json:"pareto_80_cutoff"`
	Pareto80Partners []string            `json:"pareto_80_partners"`
}

// SalesByPartnerItem un partenaire avec son CA
type SalesByPartnerItem struct {
	PartnerName    string  `json:"partner_name"`
	TotalHT        float64 `json:"total_ht"`
	InvoicesCount  int     `json:"invoices_count"`
	PctOfTotal     float64 `json:"pct_of_total"`
	CumulativePct  float64 `json:"cumulative_pct"`
}

// ArByPartnerResponse réponse GET /ui/aggregations/ar-by-partner (SPEC AR by Partner v1.0.3)
type ArByPartnerResponse struct {
	Totals   ArByPartnerTotals   `json:"totals"`
	Partners []ArByPartnerItem   `json:"partners"`
	Meta     ArByPartnerMeta     `json:"meta"`
}

// ArByPartnerTotals totaux encours / retard
type ArByPartnerTotals struct {
	OpenAmount            float64 `json:"open_amount"`
	OverdueAmount         float64 `json:"overdue_amount"`
	OpenCountInvoices     int     `json:"open_count_invoices"`
	OverdueCountInvoices  int     `json:"overdue_count_invoices"`
	MissingDueDateCount   int     `json:"missing_due_date_count"`
}

// ArByPartnerItem partenaire avec encours et retard
type ArByPartnerItem struct {
	PartnerID       string  `json:"partner_id"`
	PartnerName     string  `json:"partner_name,omitempty"`
	OpenAmount      float64 `json:"open_amount"`
	OverdueAmount   float64 `json:"overdue_amount"`
	OpenCount       int     `json:"open_count_invoices"`
	OverdueCount    int     `json:"overdue_count_invoices"`
	SharePercent    float64 `json:"share_percent"`
}

// ArByPartnerMeta métadonnées (freshness, warnings)
type ArByPartnerMeta struct {
	Freshness      string   `json:"freshness"`       // event_driven | snapshot | unknown
	Warnings       []string `json:"warnings,omitempty"`
	DataQuality    string   `json:"data_quality,omitempty"` // low | medium | high
}
