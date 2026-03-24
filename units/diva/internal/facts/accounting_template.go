package facts

import (
	"fmt"
	"math"
	"strings"
)

// AccountingInsight — sortie structurée du moteur template-first.
type AccountingInsight struct {
	Headline    string `json:"headline"`
	WhatISee    string `json:"what_i_see"`
	ToCheck     string `json:"to_check"`
	ScopeNote   string `json:"scope_note"`
	FactsHash   string `json:"facts_hash"`
}

// GenerateAccountingInsight produit un insight comptable déterministe (template-first).
// Aucune IA n'est utilisée ici — Mistral intervient uniquement en reformulation optionnelle.
func GenerateAccountingInsight(pack *AccountingFactsPack) *AccountingInsight {
	if pack == nil {
		return nil
	}

	headline := buildHeadline(pack)
	whatISee := buildWhatISee(pack)
	toCheck := buildToCheck(pack)
	scopeNote := buildScopeNote(pack)

	return &AccountingInsight{
		Headline:  headline,
		WhatISee:  whatISee,
		ToCheck:   toCheck,
		ScopeNote: scopeNote,
		FactsHash: pack.FactsHash,
	}
}

func buildHeadline(pack *AccountingFactsPack) string {
	// Priorité 1 : signal d'alerte fort
	for _, s := range pack.Signals {
		if s.Severity == "alert" {
			return s.Message
		}
	}

	// Priorité 2 : résultat net avec variation
	if pack.IncomeStatement != nil && pack.IncomeStatement.TotalPrevious != nil {
		prev := *pack.IncomeStatement.TotalPrevious
		cur := pack.IncomeStatement.Total
		if prev != 0 {
			deltaPct := ((cur - prev) / math.Abs(prev)) * 100
			if cur >= 0 && deltaPct > 0 {
				return fmt.Sprintf("Résultat en progression de %.0f%% sur la période", deltaPct)
			} else if cur >= 0 && deltaPct < 0 {
				return fmt.Sprintf("Résultat en recul de %.0f%% sur la période", math.Abs(deltaPct))
			} else if cur < 0 {
				return fmt.Sprintf("Résultat déficitaire de %s sur la période", fmtEUR(math.Abs(cur)))
			}
		}
		if cur > 0 {
			return fmt.Sprintf("Résultat net positif de %s sur la période", fmtEUR(cur))
		} else if cur < 0 {
			return fmt.Sprintf("Résultat net déficitaire de %s", fmtEUR(math.Abs(cur)))
		}
	}

	// Priorité 3 : fallback sur bilan
	if pack.BalanceSheet != nil && pack.BalanceSheet.Total > 0 {
		return fmt.Sprintf("Total bilan : %s", fmtEUR(pack.BalanceSheet.Total))
	}

	return "Synthèse comptable disponible"
}

func buildWhatISee(pack *AccountingFactsPack) string {
	var parts []string

	if pack.IncomeStatement != nil {
		cur := pack.IncomeStatement.Total
		parts = append(parts, fmt.Sprintf("Résultat net : %s", fmtEUR(cur)))
	}

	if pack.BalanceSheet != nil {
		parts = append(parts, fmt.Sprintf("Total bilan : %s", fmtEUR(pack.BalanceSheet.Total)))
	}

	// Top deltas
	limit := 3
	if limit > len(pack.Deltas) {
		limit = len(pack.Deltas)
	}
	for _, d := range pack.Deltas[:limit] {
		arrow := "↑"
		if d.Direction == "down" {
			arrow = "↓"
		}
		parts = append(parts, fmt.Sprintf("%s %s %.0f%% (%s → %s)", d.Label, arrow, math.Abs(d.DeltaPct), fmtEUR(d.AmountN1), fmtEUR(d.AmountN)))
	}

	// Aged balances
	if pack.AgedReceivables != nil {
		parts = append(parts, fmt.Sprintf("Créances clients : %s (%d partenaires)", fmtEUR(pack.AgedReceivables.TotalAmount), pack.AgedReceivables.PartnerCount))
	}
	if pack.AgedPayables != nil {
		parts = append(parts, fmt.Sprintf("Dettes fournisseurs : %s (%d partenaires)", fmtEUR(pack.AgedPayables.TotalAmount), pack.AgedPayables.PartnerCount))
	}

	if len(parts) == 0 {
		return "Données comptables disponibles sans variation notable"
	}
	return strings.Join(parts, ". ") + "."
}

func buildToCheck(pack *AccountingFactsPack) string {
	var checks []string

	for _, s := range pack.Signals {
		if s.Severity == "watch" || s.Severity == "alert" {
			checks = append(checks, s.Message)
		}
	}

	if pack.AgedReceivables != nil {
		for _, p := range pack.AgedReceivables.TopPartners {
			if p.RangeOver90 > 0 {
				checks = append(checks, fmt.Sprintf("Créances > 90j pour %s : %s", p.PartnerName, fmtEUR(p.RangeOver90)))
				break
			}
		}
	}

	if pack.Quality.BalanceSheetCoverage == "partial" || pack.Quality.IncomeStatementCoverage == "partial" {
		checks = append(checks, "Couverture comptable partielle — certaines rubriques peuvent manquer")
	}

	if !pack.Quality.ComparisonAvailable {
		checks = append(checks, "Pas de comparatif N-1 disponible — variations non calculables")
	}

	if len(checks) == 0 {
		return "Aucun point de vigilance particulier détecté"
	}
	return strings.Join(checks, ". ") + "."
}

func buildScopeNote(pack *AccountingFactsPack) string {
	parts := []string{
		fmt.Sprintf("Période : %s → %s", pack.Context.DateStart, pack.Context.DateEnd),
		fmt.Sprintf("Tenant : %s", pack.Context.Tenant),
	}

	if len(pack.Context.CompanyIDs) > 0 {
		ids := make([]string, len(pack.Context.CompanyIDs))
		for i, id := range pack.Context.CompanyIDs {
			ids[i] = fmt.Sprintf("%d", id)
		}
		parts = append(parts, fmt.Sprintf("Sociétés : %s", strings.Join(ids, ", ")))
	}

	parts = append(parts, fmt.Sprintf("Réf. : %s", pack.Context.ReferentielVersion))

	bsCov := pack.Quality.BalanceSheetCoverage
	isCov := pack.Quality.IncomeStatementCoverage
	abCov := pack.Quality.AgedBalancesCoverage
	parts = append(parts, fmt.Sprintf("Couverture : bilan=%s, CR=%s, tiers=%s", bsCov, isCov, abCov))

	return strings.Join(parts, ". ") + "."
}
