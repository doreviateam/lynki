package models

// AccountingInsightRequest — POST /diva/accounting/generate body (Sprint 12 T68/T69).
type AccountingInsightRequest struct {
	Context         AccountingContext        `json:"context"`
	BalanceSheet    *AccountingRubricsData   `json:"balance_sheet,omitempty"`
	IncomeStatement *AccountingRubricsData   `json:"income_statement,omitempty"`
	AgedReceivables *AgedBalanceData         `json:"aged_receivables,omitempty"`
	AgedPayables    *AgedBalanceData         `json:"aged_payables,omitempty"`
	Options         AccountingInsightOptions `json:"options"`
}

type AccountingContext struct {
	Tenant             string  `json:"tenant"`
	CompanyIDs         []int32 `json:"company_ids,omitempty"`
	DateStart          string  `json:"date_start"`
	DateEnd            string  `json:"date_end"`
	CompareStart       string  `json:"compare_start,omitempty"`
	CompareEnd         string  `json:"compare_end,omitempty"`
	ReferentielVersion string  `json:"referentiel_version"`
	Currency           string  `json:"currency,omitempty"`
}

type AccountingRubricsData struct {
	Lines    []AccountingRubricLineData `json:"lines"`
	Total    float64                    `json:"total"`
	TotalN1  *float64                   `json:"total_n1,omitempty"`
	Complete bool                       `json:"complete"`
}

type AccountingRubricLineData struct {
	Code     string   `json:"code"`
	Label    string   `json:"label"`
	Amount   float64  `json:"amount"`
	Previous *float64 `json:"previous,omitempty"`
}

type AgedBalanceData struct {
	Lines      []AgedBalanceLineData `json:"lines"`
	AgingBasis string                `json:"aging_basis"`
	Complete   bool                  `json:"complete"`
}

type AgedBalanceLineData struct {
	PartnerID    int32   `json:"partner_id"`
	PartnerName  string  `json:"partner_name"`
	NotDue       float64 `json:"not_due"`
	Range0_30    float64 `json:"range_0_30"`
	Range31_60   float64 `json:"range_31_60"`
	Range61_90   float64 `json:"range_61_90"`
	Range91_180  float64 `json:"range_91_180"`
	RangeOver180 float64 `json:"range_over_180"`
	Total        float64 `json:"total"`
}

type AccountingInsightOptions struct {
	ForceRefresh bool `json:"force_refresh"`
	UseMistral   bool `json:"use_mistral"`
}

// AccountingInsightResponse — sortie structurée (Sprint 12 T69).
type AccountingInsightResponse struct {
	Headline   string `json:"headline"`
	WhatISee   string `json:"what_i_see"`
	ToCheck    string `json:"to_check"`
	ScopeNote  string `json:"scope_note"`
	FactsHash  string `json:"facts_hash"`
	GeneratedAt string `json:"generated_at"`
}
