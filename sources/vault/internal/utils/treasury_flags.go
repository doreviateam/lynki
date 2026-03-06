package utils

import "math"

// ComputeLargeDeltaThreshold retourne le seuil pour le flag large_delta (SPEC Trésorerie v4.1 §9.4).
// threshold = MAX(500, 0.05 × ABS(erp_balance))
// Seuil absolu 500€ évite faux positifs sur petits soldes ; relatif 5% sur gros comptes.
func ComputeLargeDeltaThreshold(erpBalance float64) float64 {
	if math.IsNaN(erpBalance) || math.IsInf(erpBalance, 0) {
		return 500
	}
	abs := math.Abs(erpBalance)
	rel := 0.05 * abs
	if rel > 500 {
		return RoundMoney2(rel)
	}
	return 500
}
