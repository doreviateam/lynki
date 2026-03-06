package utils

import "math"

// RoundMoney2 arrondit un montant à 2 décimales (SPEC Trésorerie v4.1 §4.2).
// À appliquer après agrégation, jamais dans les requêtes SQL (évite artefacts sur sous-agrégats).
func RoundMoney2(v float64) float64 {
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return 0
	}
	return math.Round(v*100) / 100
}
