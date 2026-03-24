package facts

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"sort"
)

const (
	deltaThresholdPct = 15.0  // variation > 15 % → signal
	deltaThresholdAbs = 500.0 // variation > 500 € en absolu pour éviter le bruit
	topPartnersLimit  = 5
)

// AccountingFactsInput — données brutes envoyées par Linky pour construire le pack.
type AccountingFactsInput struct {
	Context         AccountingContextMeta    `json:"context"`
	BalanceSheet    *AccountingRubricsInput  `json:"balance_sheet,omitempty"`
	IncomeStatement *AccountingRubricsInput  `json:"income_statement,omitempty"`
	AgedReceivables *AgedBalanceInput        `json:"aged_receivables,omitempty"`
	AgedPayables    *AgedBalanceInput        `json:"aged_payables,omitempty"`
}

// AccountingRubricsInput — rubriques telles que reçues de Vault.
type AccountingRubricsInput struct {
	Lines    []AccountingRubricLine `json:"lines"`
	Total    float64                `json:"total"`
	TotalN1  *float64               `json:"total_n1,omitempty"`
	Complete bool                   `json:"complete"`
}

// AgedBalanceInput — balance âgée telle que reçue de Vault.
type AgedBalanceInput struct {
	Lines      []AgedBalanceLineInput `json:"lines"`
	AgingBasis string                 `json:"aging_basis"`
	Complete   bool                   `json:"complete"`
}

// AgedBalanceLineInput — une ligne de balance âgée.
type AgedBalanceLineInput struct {
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

// BuildAccountingFactsPack construit un AccountingFactsPack à partir des données brutes.
func BuildAccountingFactsPack(input *AccountingFactsInput) *AccountingFactsPack {
	if input == nil {
		return nil
	}

	pack := &AccountingFactsPack{
		Version: AccountingFactsPackVersion,
		Mode:    "accounting",
		Context: input.Context,
		Quality: buildQuality(input),
	}

	if input.BalanceSheet != nil {
		pack.BalanceSheet = &AccountingRubrics{
			Lines:         input.BalanceSheet.Lines,
			Total:         input.BalanceSheet.Total,
			TotalPrevious: input.BalanceSheet.TotalN1,
		}
	}

	if input.IncomeStatement != nil {
		pack.IncomeStatement = &AccountingRubrics{
			Lines:         input.IncomeStatement.Lines,
			Total:         input.IncomeStatement.Total,
			TotalPrevious: input.IncomeStatement.TotalN1,
		}
	}

	pack.Deltas = detectDeltas(input)

	if input.AgedReceivables != nil {
		pack.AgedReceivables = summarizeAgedBalance(input.AgedReceivables)
	}
	if input.AgedPayables != nil {
		pack.AgedPayables = summarizeAgedBalance(input.AgedPayables)
	}

	pack.Signals = detectSignals(pack)

	pack.FactsHash = AccountingPayloadHash(pack)

	return pack
}

func buildQuality(input *AccountingFactsInput) AccountingQuality {
	q := AccountingQuality{
		BalanceSheetCoverage:    "absent",
		IncomeStatementCoverage: "absent",
		AgedBalancesCoverage:    "absent",
	}

	if input.BalanceSheet != nil {
		if input.BalanceSheet.Complete {
			q.BalanceSheetCoverage = "complete"
		} else {
			q.BalanceSheetCoverage = "partial"
		}
	}
	if input.IncomeStatement != nil {
		if input.IncomeStatement.Complete {
			q.IncomeStatementCoverage = "complete"
		} else {
			q.IncomeStatementCoverage = "partial"
		}
	}
	if input.AgedReceivables != nil || input.AgedPayables != nil {
		arComplete := input.AgedReceivables != nil && input.AgedReceivables.Complete
		apComplete := input.AgedPayables != nil && input.AgedPayables.Complete
		if arComplete && apComplete {
			q.AgedBalancesCoverage = "complete"
		} else {
			q.AgedBalancesCoverage = "partial"
		}
	}

	hasComparison := false
	if input.BalanceSheet != nil {
		for _, l := range input.BalanceSheet.Lines {
			if l.Previous != nil {
				hasComparison = true
				break
			}
		}
	}
	if !hasComparison && input.IncomeStatement != nil {
		for _, l := range input.IncomeStatement.Lines {
			if l.Previous != nil {
				hasComparison = true
				break
			}
		}
	}
	q.ComparisonAvailable = hasComparison

	return q
}

func detectDeltas(input *AccountingFactsInput) []AccountingDelta {
	var deltas []AccountingDelta
	if input.BalanceSheet != nil {
		deltas = append(deltas, detectRubricDeltas("balance_sheet", input.BalanceSheet.Lines)...)
	}
	if input.IncomeStatement != nil {
		deltas = append(deltas, detectRubricDeltas("income_statement", input.IncomeStatement.Lines)...)
	}

	sort.Slice(deltas, func(i, j int) bool {
		return math.Abs(deltas[i].DeltaPct) > math.Abs(deltas[j].DeltaPct)
	})
	if len(deltas) > 10 {
		deltas = deltas[:10]
	}
	return deltas
}

func detectRubricDeltas(category string, lines []AccountingRubricLine) []AccountingDelta {
	var deltas []AccountingDelta
	for _, l := range lines {
		if l.Previous == nil {
			continue
		}
		prev := *l.Previous
		if prev == 0 && l.Amount == 0 {
			continue
		}
		deltaAbs := l.Amount - prev
		if math.Abs(deltaAbs) < deltaThresholdAbs {
			continue
		}
		var deltaPct float64
		if prev != 0 {
			deltaPct = (deltaAbs / math.Abs(prev)) * 100
		} else {
			deltaPct = 100.0
			if l.Amount < 0 {
				deltaPct = -100.0
			}
		}
		if math.Abs(deltaPct) < deltaThresholdPct {
			continue
		}
		dir := "up"
		if deltaAbs < 0 {
			dir = "down"
		}
		deltas = append(deltas, AccountingDelta{
			Category:  category,
			Code:      l.Code,
			Label:     l.Label,
			AmountN:   l.Amount,
			AmountN1:  prev,
			DeltaAbs:  deltaAbs,
			DeltaPct:  deltaPct,
			Direction: dir,
		})
	}
	return deltas
}

func summarizeAgedBalance(input *AgedBalanceInput) *AgedBalanceSummary {
	if input == nil || len(input.Lines) == 0 {
		return nil
	}

	summary := &AgedBalanceSummary{
		PartnerCount: len(input.Lines),
		AgingBasis:   input.AgingBasis,
	}

	for _, l := range input.Lines {
		summary.TotalAmount += l.Total
		summary.Ranges.NotDue += l.NotDue
		summary.Ranges.Range0_30 += l.Range0_30
		summary.Ranges.Range31_60 += l.Range31_60
		summary.Ranges.Range61_90 += l.Range61_90
		summary.Ranges.Range91_180 += l.Range91_180
		summary.Ranges.RangeOver180 += l.RangeOver180
	}

	sorted := make([]AgedBalanceLineInput, len(input.Lines))
	copy(sorted, input.Lines)
	sort.Slice(sorted, func(i, j int) bool {
		overI := sorted[i].Range91_180 + sorted[i].RangeOver180
		overJ := sorted[j].Range91_180 + sorted[j].RangeOver180
		return overI > overJ
	})
	limit := topPartnersLimit
	if limit > len(sorted) {
		limit = len(sorted)
	}
	for _, l := range sorted[:limit] {
		over90 := l.Range91_180 + l.RangeOver180
		if over90 <= 0 && l.Total <= 0 {
			continue
		}
		summary.TopPartners = append(summary.TopPartners, AgedPartnerHighlight{
			PartnerID:   l.PartnerID,
			PartnerName: l.PartnerName,
			Total:       l.Total,
			RangeOver90: over90,
		})
	}

	return summary
}

func detectSignals(pack *AccountingFactsPack) []AccountingSignal {
	var signals []AccountingSignal

	// Signal 1 : variation marquée du résultat net
	for _, d := range pack.Deltas {
		if d.Category == "income_statement" && math.Abs(d.DeltaPct) >= 25 {
			sev := "watch"
			if d.Direction == "down" && math.Abs(d.DeltaPct) >= 50 {
				sev = "alert"
			}
			signals = append(signals, AccountingSignal{
				Code:     "income_variation_" + d.Code,
				Severity: sev,
				Message:  fmt.Sprintf("%s : variation de %.1f%% (%s → %s)", d.Label, d.DeltaPct, fmtEUR(d.AmountN1), fmtEUR(d.AmountN)),
			})
		}
	}

	// Signal 2 : tension créances clients
	if pack.AgedReceivables != nil {
		sensible := pack.AgedReceivables.Ranges.Range91_180 + pack.AgedReceivables.Ranges.RangeOver180
		if pack.AgedReceivables.TotalAmount > 0 && sensible > 0 {
			ratio := (sensible / pack.AgedReceivables.TotalAmount) * 100
			if ratio >= 30 {
				signals = append(signals, AccountingSignal{
					Code:     "receivables_aging_concentration",
					Severity: "alert",
					Message:  fmt.Sprintf("%.1f%% des créances clients sont âgées de plus de 90 jours (%s sur %s)", ratio, fmtEUR(sensible), fmtEUR(pack.AgedReceivables.TotalAmount)),
				})
			} else if ratio >= 15 {
				signals = append(signals, AccountingSignal{
					Code:     "receivables_aging_watch",
					Severity: "watch",
					Message:  fmt.Sprintf("%.1f%% des créances clients sont âgées de plus de 90 jours", ratio),
				})
			}
		}
	}

	// Signal 3 : dette fournisseur concentrée
	if pack.AgedPayables != nil {
		sensible := pack.AgedPayables.Ranges.Range91_180 + pack.AgedPayables.Ranges.RangeOver180
		if pack.AgedPayables.TotalAmount > 0 && sensible > 0 {
			ratio := (sensible / pack.AgedPayables.TotalAmount) * 100
			if ratio >= 30 {
				signals = append(signals, AccountingSignal{
					Code:     "payables_aging_concentration",
					Severity: "alert",
					Message:  fmt.Sprintf("%.1f%% des dettes fournisseurs sont âgées de plus de 90 jours (%s sur %s)", ratio, fmtEUR(sensible), fmtEUR(pack.AgedPayables.TotalAmount)),
				})
			} else if ratio >= 15 {
				signals = append(signals, AccountingSignal{
					Code:     "payables_aging_watch",
					Severity: "watch",
					Message:  fmt.Sprintf("%.1f%% des dettes fournisseurs sont âgées de plus de 90 jours", ratio),
				})
			}
		}
	}

	// Signal 4 : amélioration ou dégradation du bilan
	if pack.BalanceSheet != nil && pack.BalanceSheet.TotalPrevious != nil {
		prev := *pack.BalanceSheet.TotalPrevious
		cur := pack.BalanceSheet.Total
		if prev != 0 {
			deltaPct := ((cur - prev) / math.Abs(prev)) * 100
			if deltaPct >= 20 {
				signals = append(signals, AccountingSignal{
					Code:     "balance_sheet_improvement",
					Severity: "info",
					Message:  fmt.Sprintf("Total bilan en hausse de %.1f%% par rapport à N-1", deltaPct),
				})
			} else if deltaPct <= -20 {
				signals = append(signals, AccountingSignal{
					Code:     "balance_sheet_degradation",
					Severity: "watch",
					Message:  fmt.Sprintf("Total bilan en baisse de %.1f%% par rapport à N-1", math.Abs(deltaPct)),
				})
			}
		}
	}

	// Signal 5 : couverture partielle
	if pack.Quality.BalanceSheetCoverage == "partial" || pack.Quality.IncomeStatementCoverage == "partial" {
		signals = append(signals, AccountingSignal{
			Code:     "partial_coverage",
			Severity: "info",
			Message:  "Couverture comptable partielle — l'analyse porte sur les données disponibles",
		})
	}

	return signals
}

// AccountingPayloadHash retourne SHA256 du pack canonique pour traçabilité.
func AccountingPayloadHash(pack *AccountingFactsPack) string {
	if pack == nil {
		return ""
	}
	type canonical struct {
		Version string                 `json:"version"`
		Mode    string                 `json:"mode"`
		Context AccountingContextMeta  `json:"context"`
		Signals []string               `json:"signals"`
		Quality AccountingQuality      `json:"quality"`
	}
	var sigMsgs []string
	for _, s := range pack.Signals {
		sigMsgs = append(sigMsgs, s.Message)
	}
	c := canonical{
		Version: pack.Version,
		Mode:    pack.Mode,
		Context: pack.Context,
		Signals: sigMsgs,
		Quality: pack.Quality,
	}
	b, _ := json.Marshal(c)
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}
