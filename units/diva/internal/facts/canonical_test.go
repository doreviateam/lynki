package facts

import (
	"testing"

	"github.com/doreviateam/diva/internal/models"
)

func ptr(v float64) *float64 { return &v }

func TestFactsPackCanonicalHashStable(t *testing.T) {
	fp := &FactsPack{
		Version: FactsPackVersion,
		Facts: []Fact{
			{Priority: 1, Category: "treasury", Message: "POINT DOMINANT: cash 1 440 € — flux sans validation"},
			{Priority: 3, Category: "pos", Message: "POS: 4 213,20 € soit 0,4 % du CA"},
		},
		DataCompleteness: &DataCompleteness{BankHealthMetrics: "partial"},
	}
	h1 := PayloadHash(fp)
	h2 := PayloadHash(fp)
	if h1 != h2 {
		t.Errorf("même FactsPack → hash instable: %q vs %q", h1, h2)
	}
	// Vérifier que le canonical est reproductible
	c1 := CanonicalJSON(fp)
	c2 := CanonicalJSON(fp)
	if string(c1) != string(c2) {
		t.Errorf("CanonicalJSON non reproductible")
	}
}

func TestFactsPackSortingDeterministic(t *testing.T) {
	// Même input (cards + details) → BuildFactsPack produit le même ordre de facts.
	cards := []models.Card{
		{Key: "cash", Value: ptr(1440), Unit: "EUR"},
		{Key: "treasury_validated_pct", Value: ptr(0), Unit: "%"},
		{Key: "business", Value: ptr(0), Unit: "EUR"},
		{Key: "pos_shops", Value: ptr(4213.20), Unit: "EUR"},
	}
	details := map[string]interface{}{}
	ctx := ContextMeta{Tenant: "test", DateStart: "2026-01-01", DateEnd: "2026-01-31"}

	fp1 := BuildFactsPack(cards, details, nil, ctx)
	fp2 := BuildFactsPack(cards, details, nil, ctx)

	h1 := PayloadHash(fp1)
	h2 := PayloadHash(fp2)
	if h1 != h2 {
		t.Errorf("même input → hash doit être identique: %q vs %q", h1, h2)
	}
	// Ordre des facts identique
	msgs1 := fp1.Messages()
	msgs2 := fp2.Messages()
	if len(msgs1) != len(msgs2) {
		t.Errorf("même input → même nombre de facts: %d vs %d", len(msgs1), len(msgs2))
	}
	for i := range msgs1 {
		if msgs1[i] != msgs2[i] {
			t.Errorf("fact[%d] diffère: %q vs %q", i, msgs1[i], msgs2[i])
		}
	}
}

func TestFactsPackVersionAffectsHash(t *testing.T) {
	base := &FactsPack{
		Version: FactsPackVersion,
		Facts: []Fact{
			{Priority: 1, Category: "treasury", Message: "Test"},
		},
		DataCompleteness: &DataCompleteness{BankHealthMetrics: "absent"},
	}
	alt := &FactsPack{
		Version: "1.2.0",
		Facts:   base.Facts,
		DataCompleteness: base.DataCompleteness,
	}
	hBase := PayloadHash(base)
	hAlt := PayloadHash(alt)
	if hBase == hAlt {
		t.Errorf("Version différente → hash doit différer: %q vs %q", hBase, hAlt)
	}
}
