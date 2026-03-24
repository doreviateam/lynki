package facts

// AccountingFactsPackVersion — Sprint 12 T68.
const AccountingFactsPackVersion = "1.0.0"

// AccountingFactsPack — pack structuré de faits comptables pour insight Diva.
// Source de vérité : rubriques Bilan/CR, balances tiers V2, signaux de variation.
type AccountingFactsPack struct {
	Version         string                 `json:"version"`
	Mode            string                 `json:"mode"` // "accounting"
	Context         AccountingContextMeta  `json:"context"`
	BalanceSheet    *AccountingRubrics     `json:"balance_sheet,omitempty"`
	IncomeStatement *AccountingRubrics     `json:"income_statement,omitempty"`
	Deltas          []AccountingDelta      `json:"deltas,omitempty"`
	AgedReceivables *AgedBalanceSummary    `json:"aged_receivables,omitempty"`
	AgedPayables    *AgedBalanceSummary    `json:"aged_payables,omitempty"`
	Signals         []AccountingSignal     `json:"signals"`
	Quality         AccountingQuality      `json:"quality"`
	FactsHash       string                 `json:"facts_hash"`
}

// AccountingContextMeta — périmètre du pack.
type AccountingContextMeta struct {
	Tenant              string  `json:"tenant"`
	CompanyIDs          []int32 `json:"company_ids,omitempty"`
	DateStart           string  `json:"date_start"`
	DateEnd             string  `json:"date_end"`
	CompareStart        string  `json:"compare_start,omitempty"`
	CompareEnd          string  `json:"compare_end,omitempty"`
	ReferentielVersion  string  `json:"referentiel_version"`
	Currency            string  `json:"currency,omitempty"`
}

// AccountingRubrics — rubriques N et N-1 pour un bloc (Bilan ou CR).
type AccountingRubrics struct {
	Lines []AccountingRubricLine `json:"lines"`
	Total float64                `json:"total"`
	// TotalPrevious est le total N-1 si disponible.
	TotalPrevious *float64 `json:"total_previous,omitempty"`
}

// AccountingRubricLine — une ligne de rubrique.
type AccountingRubricLine struct {
	Code     string   `json:"code"`
	Label    string   `json:"label"`
	Amount   float64  `json:"amount"`
	Previous *float64 `json:"previous,omitempty"`
}

// AccountingDelta — variation significative détectée.
type AccountingDelta struct {
	Category    string  `json:"category"` // "balance_sheet" | "income_statement" | "sig"
	Code        string  `json:"code"`
	Label       string  `json:"label"`
	AmountN     float64 `json:"amount_n"`
	AmountN1    float64 `json:"amount_n1"`
	DeltaAbs    float64 `json:"delta_abs"`
	DeltaPct    float64 `json:"delta_pct"`
	Direction   string  `json:"direction"` // "up" | "down"
}

// AgedBalanceSummary — agrégat tiers pour le pack.
type AgedBalanceSummary struct {
	TotalAmount  float64                `json:"total_amount"`
	PartnerCount int                    `json:"partner_count"`
	AgingBasis   string                 `json:"aging_basis"` // "date_maturity" | "line_date_fallback" | "mixed"
	Ranges       AgedRanges             `json:"ranges"`
	TopPartners  []AgedPartnerHighlight `json:"top_partners,omitempty"`
}

// AgedRanges — tranches d'ancienneté agrégées.
type AgedRanges struct {
	NotDue       float64 `json:"not_due"`
	Range0_30    float64 `json:"range_0_30"`
	Range31_60   float64 `json:"range_31_60"`
	Range61_90   float64 `json:"range_61_90"`
	Range91_180  float64 `json:"range_91_180"`
	RangeOver180 float64 `json:"range_over_180"`
}

// AgedPartnerHighlight — partenaire remarquable.
type AgedPartnerHighlight struct {
	PartnerID   int32   `json:"partner_id"`
	PartnerName string  `json:"partner_name"`
	Total       float64 `json:"total"`
	RangeOver90 float64 `json:"range_over_90"`
}

// AccountingSignal — signal comptable détecté par le moteur déterministe.
type AccountingSignal struct {
	Code     string `json:"code"`
	Severity string `json:"severity"` // "info" | "watch" | "alert"
	Message  string `json:"message"`
}

// AccountingQuality — couverture et qualité des données.
type AccountingQuality struct {
	BalanceSheetCoverage    string   `json:"balance_sheet_coverage"`    // "complete" | "partial" | "absent"
	IncomeStatementCoverage string   `json:"income_statement_coverage"` // "complete" | "partial" | "absent"
	AgedBalancesCoverage    string   `json:"aged_balances_coverage"`    // "complete" | "partial" | "absent"
	ComparisonAvailable     bool     `json:"comparison_available"`
	Limitations             []string `json:"limitations,omitempty"`
}
