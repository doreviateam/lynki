package utils

import (
	"math"
	"testing"
)

func TestComputeLargeDeltaThreshold(t *testing.T) {
	tests := []struct {
		name       string
		erpBalance float64
		wantMin    float64 // seuil >= 500 pour petits soldes
	}{
		{"zero", 0, 500},
		{"petit solde 100", 100, 500},
		{"seuil exact 10000", 10000, 500},   // 5% = 500
		{"gros solde 20000", 20000, 1000},  // 5% = 1000
		{"très gros 100000", 100000, 5000}, // 5% = 5000
		{"négatif 50000", -50000, 2500},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ComputeLargeDeltaThreshold(tt.erpBalance)
			if got < 500 {
				t.Errorf("ComputeLargeDeltaThreshold(%v) = %v, want >= 500", tt.erpBalance, got)
			}
			rel := 0.05 * math.Abs(tt.erpBalance)
			if rel > 500 && got < rel*0.99 {
				t.Errorf("ComputeLargeDeltaThreshold(%v) = %v, want ~%.2f (5%% of abs)", tt.erpBalance, got, rel)
			}
		})
	}
}
