package facts

import (
	"fmt"
	"math"
	"sort"
)

// ReportTemplateVersion — Sprint 14 T79.
const ReportTemplateVersion = "2.0"

// AccountingReport — rapport structuré complet (template-first, zéro LLM).
type AccountingReport struct {
	Header               ReportHeader               `json:"header"`
	ExecutiveSummary     ReportExecutiveSummary      `json:"executive_summary"`
	Vigilance            ReportVigilance             `json:"vigilance"`
	BalanceSheetTable    *ReportTable                `json:"balance_sheet_table,omitempty"`
	IncomeStatementTable *ReportTable                `json:"income_statement_table,omitempty"`
	AgedBalancesSummary  *ReportAgedBalancesSummary  `json:"aged_balances_summary,omitempty"`
	Scope                ReportScope                 `json:"scope"`
}

type ReportHeader struct {
	Tenant          string   `json:"tenant"`
	Companies       []int32  `json:"companies,omitempty"`
	PeriodStart     string   `json:"period_start"`
	PeriodEnd       string   `json:"period_end"`
	GeneratedAt     string   `json:"generated_at"`
	FactsHash       string   `json:"facts_hash"`
	TemplateVersion string   `json:"template_version"`
	Currency        string   `json:"currency"`
}

type ReportExecutiveSummary struct {
	Headline string `json:"headline"`
	WhatISee string `json:"what_i_see"`
}

type ReportVigilance struct {
	ToCheck string `json:"to_check"`
}

type ReportTable struct {
	Title string            `json:"title"`
	Lines []ReportTableLine `json:"lines"`
	Total ReportTableLine   `json:"total"`
}

type ReportTableLine struct {
	Code      string   `json:"code"`
	Label     string   `json:"label"`
	AmountN   float64  `json:"amount_n"`
	AmountN1  *float64 `json:"amount_n1,omitempty"`
	Variation *float64 `json:"variation,omitempty"`
}

type ReportAgedBalancesSummary struct {
	TopReceivables []ReportAgedPartner `json:"top_receivables,omitempty"`
	TopPayables    []ReportAgedPartner `json:"top_payables,omitempty"`
}

type ReportAgedPartner struct {
	PartnerName string  `json:"partner_name"`
	Total       float64 `json:"total"`
	RangeOver90 float64 `json:"range_over_90"`
}

type ReportScope struct {
	Referentiel     string   `json:"referentiel"`
	CoverageBS      string   `json:"coverage_bs"`
	CoverageCR      string   `json:"coverage_cr"`
	CoverageAged    string   `json:"coverage_aged"`
	Limitations     []string `json:"limitations,omitempty"`
	FactsHash       string   `json:"facts_hash"`
	TemplateVersion string   `json:"template_version"`
}

// GenerateAccountingReport produit un rapport structuré à partir du FactsPack.
// Strictement template-first : aucun appel LLM.
func GenerateAccountingReport(pack *AccountingFactsPack, generatedAt string) (*AccountingReport, error) {
	if pack == nil {
		return nil, fmt.Errorf("accounting facts pack is nil")
	}

	insight := GenerateAccountingInsight(pack)

	currency := pack.Context.Currency
	if currency == "" {
		currency = "EUR"
	}

	report := &AccountingReport{
		Header: ReportHeader{
			Tenant:          pack.Context.Tenant,
			Companies:       pack.Context.CompanyIDs,
			PeriodStart:     pack.Context.DateStart,
			PeriodEnd:       pack.Context.DateEnd,
			GeneratedAt:     generatedAt,
			FactsHash:       pack.FactsHash,
			TemplateVersion: ReportTemplateVersion,
			Currency:        currency,
		},
		ExecutiveSummary: ReportExecutiveSummary{
			Headline: insight.Headline,
			WhatISee: insight.WhatISee,
		},
		Vigilance: ReportVigilance{
			ToCheck: insight.ToCheck,
		},
		Scope: ReportScope{
			Referentiel:     pack.Context.ReferentielVersion,
			CoverageBS:      pack.Quality.BalanceSheetCoverage,
			CoverageCR:      pack.Quality.IncomeStatementCoverage,
			CoverageAged:    pack.Quality.AgedBalancesCoverage,
			Limitations:     pack.Quality.Limitations,
			FactsHash:       pack.FactsHash,
			TemplateVersion: ReportTemplateVersion,
		},
	}

	if pack.BalanceSheet != nil {
		report.BalanceSheetTable = buildReportTable("Bilan", pack.BalanceSheet)
	}
	if pack.IncomeStatement != nil {
		report.IncomeStatementTable = buildReportTable("Compte de résultat", pack.IncomeStatement)
	}

	if pack.AgedReceivables != nil || pack.AgedPayables != nil {
		summary := &ReportAgedBalancesSummary{}
		if pack.AgedReceivables != nil {
			summary.TopReceivables = buildTopPartners(pack.AgedReceivables.TopPartners, 5)
		}
		if pack.AgedPayables != nil {
			summary.TopPayables = buildTopPartners(pack.AgedPayables.TopPartners, 5)
		}
		report.AgedBalancesSummary = summary
	}

	return report, nil
}

func buildReportTable(title string, rubrics *AccountingRubrics) *ReportTable {
	lines := make([]ReportTableLine, len(rubrics.Lines))
	for i, l := range rubrics.Lines {
		rl := ReportTableLine{
			Code:    l.Code,
			Label:   l.Label,
			AmountN: l.Amount,
		}
		if l.Previous != nil {
			prev := *l.Previous
			rl.AmountN1 = &prev
			if math.Abs(prev) > 0.01 {
				v := ((l.Amount - prev) / math.Abs(prev)) * 100
				rl.Variation = &v
			}
		}
		lines[i] = rl
	}

	total := ReportTableLine{
		Label:   "TOTAL",
		AmountN: rubrics.Total,
	}
	if rubrics.TotalPrevious != nil {
		prev := *rubrics.TotalPrevious
		total.AmountN1 = &prev
		if math.Abs(prev) > 0.01 {
			v := ((rubrics.Total - prev) / math.Abs(prev)) * 100
			total.Variation = &v
		}
	}

	return &ReportTable{
		Title: title,
		Lines: lines,
		Total: total,
	}
}

func buildTopPartners(partners []AgedPartnerHighlight, limit int) []ReportAgedPartner {
	sorted := make([]AgedPartnerHighlight, len(partners))
	copy(sorted, partners)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].RangeOver90 > sorted[j].RangeOver90
	})

	if limit > len(sorted) {
		limit = len(sorted)
	}

	result := make([]ReportAgedPartner, limit)
	for i, p := range sorted[:limit] {
		result[i] = ReportAgedPartner{
			PartnerName: p.PartnerName,
			Total:       p.Total,
			RangeOver90: p.RangeOver90,
		}
	}
	return result
}
