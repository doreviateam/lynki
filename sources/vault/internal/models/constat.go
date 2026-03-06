package models

import (
	"time"

	"github.com/google/uuid"
)

// Constat représente un constat mensuel généré par le Vault
// SPEC 2 - Vault → Constat Mensuel
type Constat struct {
	ID                uuid.UUID  `json:"id" db:"id"`
	ConstatID         string     `json:"constat_id" db:"constat_id"` // ID externe (10 caractères alphanumériques)
	Tenant            string     `json:"tenant" db:"tenant"`
	Period            string     `json:"period" db:"period"` // YYYY-MM
	GeneratedAt       time.Time  `json:"generated_at" db:"generated_at"`
	VaultID           *string    `json:"vault_id,omitempty" db:"vault_id"`
	Volumes           Volumes    `json:"volumes" db:"-"`
	Compliance        *Compliance `json:"compliance,omitempty" db:"-"`
	Proofs            Proofs     `json:"proofs" db:"-"`
	TransmittedAt     *time.Time `json:"transmitted_at,omitempty" db:"transmitted_at"`
	TransmissionStatus string     `json:"transmission_status" db:"transmission_status"`
	TransmissionError  *string   `json:"transmission_error,omitempty" db:"transmission_error"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
}

// Volumes représente les volumes agrégés par type de document
type Volumes struct {
	OutInvoice int `json:"out_invoice" db:"volumes_out_invoice"`
	InInvoice  int `json:"in_invoice" db:"volumes_in_invoice"`
	OutRefund  int `json:"out_refund" db:"volumes_out_refund"`
	InRefund   int `json:"in_refund" db:"volumes_in_refund"`
}

// Total retourne le nombre total de documents
func (v Volumes) Total() int {
	return v.OutInvoice + v.InInvoice + v.OutRefund + v.InRefund
}

// Compliance représente les statistiques de conformité Factur-X
type Compliance struct {
	Compliant          int `json:"compliant" db:"compliance_compliant"`
	NonCompliant2026   int `json:"non_compliant_2026" db:"compliance_non_compliant_2026"`
	OutOfScope         int `json:"out_of_scope" db:"compliance_out_of_scope"`
}

// Total retourne le nombre total de documents avec statistiques de conformité
func (c Compliance) Total() int {
	return c.Compliant + c.NonCompliant2026 + c.OutOfScope
}

// Proofs représente les preuves cryptographiques du constat
type Proofs struct {
	JWS             string   `json:"jws" db:"proofs_jws"`
	LedgerHash      *string  `json:"ledger_hash,omitempty" db:"proofs_ledger_hash"`
	DocumentsCount  int      `json:"documents_count" db:"proofs_documents_count"`
	DocumentsSHA256 []string `json:"documents_sha256_list,omitempty" db:"-"` // Optionnel, peut être limité
}

