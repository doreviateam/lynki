package zreports

import "time"

// ZReportInput représente le payload d'entrée pour le service Z-Reports
// Sprint 7 - Phase 0 : Types de base pour Z-Reports
type ZReportInput struct {
	ZID           string                 `json:"z_id"`
	CompanyID     int                    `json:"company_id"`
	Sequence      int                    `json:"sequence"`
	DateOpen      time.Time              `json:"date_open"`
	DateClose     time.Time              `json:"date_close"`
	Totals        Totals                 `json:"totals"`
	Payments      []Payment              `json:"payments"`
	Tickets       []string               `json:"tickets"`
	TicketsCount  int                    `json:"tickets_count"`
	HashPrev      *string                `json:"hash_prev,omitempty"`
	LastTicketHash string                `json:"last_ticket_hash"`
	ChainLevel    string                 `json:"chain_level"` // "z-report"
	Tenant        string                 `json:"tenant"`
}

// Totals représente les totaux d'un Z-Report
type Totals struct {
	AmountTotal float64 `json:"amount_total"`
	AmountTax   float64 `json:"amount_tax"`
	AmountNet   float64 `json:"amount_net"`
}

// Payment représente un paiement dans un Z-Report
type Payment struct {
	Method string  `json:"method"`
	Amount float64 `json:"amount"`
}

// ZReportResult représente le résultat de l'ingestion d'un Z-Report
type ZReportResult struct {
	ZID         string    `json:"z_id"`
	Tenant      string    `json:"tenant"`
	HashCurrent string    `json:"hash_current"`
	HashPrev    *string   `json:"hash_prev,omitempty"`
	EvidenceJWS string    `json:"evidence_jws"`
	Timestamp   time.Time `json:"timestamp"`
	ProofURL    string    `json:"proof_url"`
}

// ZReport représente un Z-Report stocké dans le ledger filesystem
type ZReport struct {
	Payload     ZReportInput `json:"payload"`
	HashCurrent string       `json:"hash_current"`
	HashPrev    *string      `json:"hash_prev,omitempty"`
	Timestamp   time.Time    `json:"timestamp"`
	ProofURL    string       `json:"proof_url"`
}

// ZReportIndex représente l'index mensuel des Z-Reports
type ZReportIndex struct {
	LastZID   string   `json:"last_z_id"`
	LastHash  string   `json:"last_hash"`
	Count     int      `json:"count"`
	ZReports  []string `json:"z_reports"`
}

// ZReportLast représente le dernier Z-Report d'un mois
type ZReportLast struct {
	ZID  string `json:"z_id"`
	Hash string `json:"hash"`
}

