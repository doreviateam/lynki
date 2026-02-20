package hashinput

import "math"

// epsilon pour corriger la dérive des floats (ex. 1.005*100 ≠ 100.5 en binaire).
const floatEpsilon = 1e-12

// toMinor convertit une valeur float en centimes (minor) avec arrondi round_half_away_from_zero.
// Si value est nil, retourne nil.
// minorUnit = 2 pour EUR (centimes).
func toMinor(value *float64, minorUnit int) *int64 {
	if value == nil {
		return nil
	}
	v := *value
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return nil
	}
	scale := math.Pow(10, float64(minorUnit))
	scaled := v * scale
	// Compense la dérive binaire (1.005*100 peut donner 100.49999...)
	if scaled >= 0 {
		scaled += floatEpsilon
	} else {
		scaled -= floatEpsilon
	}
	result := roundHalfAwayFromZero(scaled)
	return &result
}

// toBasisPoints convertit un pourcentage (0-100) en basis points (1% = 100 bp).
// Si value est nil, retourne nil.
func toBasisPoints(value *float64) *int64 {
	if value == nil {
		return nil
	}
	v := *value
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return nil
	}
	scaled := v * 100
	if scaled >= 0 {
		scaled += floatEpsilon
	} else {
		scaled -= floatEpsilon
	}
	result := roundHalfAwayFromZero(scaled)
	return &result
}

// roundHalfAwayFromZero arrondit au plus proche entier, 0.5 s'éloigne de zéro.
// Exemples : 1.005→1.01→101, 1.004→100, -1.005→-101, -1.004→-100
func roundHalfAwayFromZero(x float64) int64 {
	if x >= 0 {
		return int64(math.Floor(x + 0.5))
	}
	return int64(math.Ceil(x - 0.5))
}
