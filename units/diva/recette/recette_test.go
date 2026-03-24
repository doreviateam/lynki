package recette_test

import (
	"fmt"
	"regexp"
	"strings"
	"testing"
	"github.com/doreviateam/diva/internal/facts"
	"github.com/doreviateam/diva/internal/models"
)

func ptr(v float64) *float64 { return &v }

var forbidden = regexp.MustCompile(`(?i)\b(business|AR à risque|watch|issue|payload|runner|cache hit|fallback|prompt|headline|stale|refresh job|debug)\b`)

func TestRecetteEditoriale(t *testing.T) {
	laPlatineCards := []models.Card{
		{Key: "treasury_validated_pct", Label: "Trésorerie validée", Value: ptr(0), Status: "watch", StatusReason: "Trésorerie non validée (0 %)"},
		{Key: "cash", Label: "Cash", Value: ptr(94663.78), Status: "watch", StatusReason: "Cash non validé"},
		{Key: "business", Label: "Business", Value: ptr(94663.78), Status: "ok", StatusReason: "Facturation active"},
		{Key: "taxes", Label: "Taxes", Value: ptr(604.48), Status: "watch", StatusReason: "Poids fiscal à surveiller"},
		{Key: "refunds", Label: "Remboursements", Value: ptr(-227.10), Status: "ok"},
		{Key: "encours", Label: "Encours", Value: ptr(50200.89), Status: "ok"},
	}
	govCards := []models.Card{
		{Key: "cash", Label: "Cash", Value: ptr(10000), Status: "alert", StatusReason: "Cash en alerte critique"},
		{Key: "business", Label: "Business", Value: ptr(5000), Status: "watch", StatusReason: "Business à surveiller"},
		{Key: "taxes", Label: "Taxes", Value: ptr(200), Status: "ok"},
	}

	samples := map[string][]models.Card{
		"La Platine": laPlatineCards,
		"Gouvernance watch/alert": govCards,
	}

	for label, cards := range samples {
		fp := facts.BuildFactsPack(cards, nil, nil, facts.ContextMeta{Tenant: label})
		msgs := fp.Messages()
		for _, m := range msgs {
			if forbidden.MatchString(m) {
				t.Errorf("[%s] terme interdit dans fait: %q (match: %q)", label, m, forbidden.FindString(m))
			}
		}
		hc := fp.HeadlineCandidate()
		if forbidden.MatchString(hc) {
			t.Errorf("[%s] terme interdit dans headline_candidate: %q", label, hc)
		}
		t.Logf("[%s] %d faits OK", label, len(msgs))
	}

	// Vérification termes préférés présents (trésorerie / flux net / activité commerciale)
	fp1 := facts.BuildFactsPack(laPlatineCards, nil, nil, facts.ContextMeta{})
	hasPreferredTerm := false
	for _, m := range fp1.Messages() {
		low := strings.ToLower(m)
		if strings.Contains(low, "trésorerie") || strings.Contains(low, "flux net") || strings.Contains(low, "activité commerciale") {
			hasPreferredTerm = true
		}
	}
	if !hasPreferredTerm {
		t.Error("Recette: aucun terme préféré ('trésorerie', 'flux net' ou 'activité commerciale') dans les faits La Platine")
	} else {
		fmt.Println("✅ Termes préférés présents dans les faits")
	}
}
