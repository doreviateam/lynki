package mistral

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/doreviateam/diva/internal/models"
)

func ptr(v float64) *float64 { return &v }

// --- Fixtures ---

var laPlatineCards = []models.Card{
	{Key: "treasury_validated_pct", Label: "Trésorerie validée", Value: ptr(0), Unit: "%", Formatted: "0 %"},
	{Key: "cash", Label: "Cash", Value: ptr(1400952.21), Unit: "EUR", Formatted: "+ 1 400 952,21 €"},
	{Key: "business", Label: "Business", Value: ptr(1162748.10), Unit: "EUR", Formatted: "+ 1 162 748,10 €"},
	{Key: "taxes", Label: "Taxes", Value: ptr(231097.31), Unit: "EUR", Formatted: "+ 231 097,31 €"},
	{Key: "credit_notes", Label: "Notes de crédit", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €"},
	{Key: "refunds", Label: "Remboursements", Value: ptr(-1686.84), Unit: "EUR", Formatted: "− 1 686,84 €"},
	{Key: "pos_shops", Label: "POS magasins", Value: ptr(4213.20), Unit: "EUR", Formatted: "4 213,20 €"},
	{Key: "pos_z", Label: "Z de caisse", Value: nil, Unit: "EUR", Formatted: "—"},
}

var sweetManihotCards = []models.Card{
	{Key: "treasury_validated_pct", Label: "Trésorerie validée", Value: ptr(0), Unit: "%", Formatted: "0 %"},
	{Key: "cash", Label: "Cash", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €"},
	{Key: "business", Label: "Business", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €"},
	{Key: "taxes", Label: "Taxes", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €"},
	{Key: "credit_notes", Label: "Notes de crédit", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €"},
	{Key: "refunds", Label: "Remboursements", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €"},
	{Key: "pos_shops", Label: "POS magasins", Value: ptr(4213.20), Unit: "EUR", Formatted: "4 213,20 €"},
	{Key: "pos_z", Label: "Z de caisse", Value: nil, Unit: "EUR", Formatted: "—"},
}

var emptyAssocCards = []models.Card{
	{Key: "treasury_validated_pct", Label: "Trésorerie validée", Value: ptr(0), Unit: "%", Formatted: "0 %"},
	{Key: "cash", Label: "Cash", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €"},
	{Key: "business", Label: "Business", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €"},
	{Key: "taxes", Label: "Taxes", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €"},
	{Key: "credit_notes", Label: "Notes de crédit", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €"},
	{Key: "refunds", Label: "Remboursements", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €"},
	{Key: "pos_shops", Label: "POS magasins", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €"},
	{Key: "pos_z", Label: "Z de caisse", Value: nil, Unit: "EUR", Formatted: "—"},
}

// --- Story 7: computeInsights ---

func TestComputeInsights_LaPlatine(t *testing.T) {
	insights := computeInsights(laPlatineCards, nil)
	if len(insights) == 0 {
		t.Fatal("La Platine doit produire des insights")
	}

	hasDominant := false
	hasNetPosition := false
	hasTax := false
	hasCashVsBiz := false
	hasRefunds := false
	hasCreditNotes := false
	for _, ins := range insights {
		if strings.Contains(ins, "POINT DOMINANT") {
			hasDominant = true
		}
		if strings.Contains(ins, "Position nette de trésorerie") {
			hasNetPosition = true
		}
		if strings.Contains(ins, "Inducteur fiscal") {
			hasTax = true
		}
		if strings.Contains(ins, "Écart trésorerie/activité") {
			hasCashVsBiz = true
		}
		if strings.Contains(ins, "Remboursements") {
			hasRefunds = true
			if !strings.Contains(ins, "part marginale") {
				t.Error("Refunds 0.1% du CA devrait être 'part marginale'")
			}
		}
		if strings.Contains(ins, "note de crédit") {
			hasCreditNotes = true
		}
	}

	if !hasDominant {
		t.Error("Manque POINT DOMINANT (treasury=0, cash>0)")
	}
	if !hasNetPosition {
		t.Error("Manque Position nette de trésorerie post-taxes")
	}
	if !hasTax {
		t.Error("Manque insight inducteur fiscal")
	}
	if !hasCashVsBiz {
		t.Error("Manque insight écart trésorerie/activité")
	}
	if !hasRefunds {
		t.Error("Manque insight remboursements")
	}
	if !hasCreditNotes {
		t.Error("Manque insight absence credit_notes (business > 100k)")
	}

	for _, ins := range insights {
		if strings.Contains(ins, "marge de trésorerie ou encaissements anticipés") {
			t.Error("Interprétation causale non supprimée dans cash vs business (spread > 0)")
		}
		if strings.Contains(ins, "créances non encaissées") {
			t.Error("Interprétation causale non supprimée dans cash vs business (spread < 0)")
		}
		if strings.Contains(ins, "significatif") {
			t.Error("Qualificatif 'significatif' non supprimé dans insight credit_notes")
		}
	}
}

func TestComputeInsights_SweetManihot(t *testing.T) {
	insights := computeInsights(sweetManihotCards, nil)

	for _, ins := range insights {
		if strings.Contains(ins, "POINT DOMINANT") {
			t.Error("Sweet Manihot (cash=0) ne devrait pas avoir de POINT DOMINANT")
		}
		if strings.Contains(ins, "note de crédit") {
			t.Error("credit_notes insight ne devrait pas apparaître (business=0, sous seuil 100k)")
		}
	}
}

func TestComputeInsights_EmptyAssoc(t *testing.T) {
	insights := computeInsights(emptyAssocCards, nil)

	for _, ins := range insights {
		if strings.Contains(ins, "POINT DOMINANT") {
			t.Error("Association vide ne devrait pas avoir de POINT DOMINANT")
		}
	}
}

// --- Story 7: dynamicMinLength ---

func TestDynamicMinLength(t *testing.T) {
	tests := []struct {
		name     string
		cards    []models.Card
		expected int
	}{
		{"La Platine (5 non-zero)", laPlatineCards, 175},
		{"Sweet Manihot (1 non-zero: pos)", sweetManihotCards, 80},
		{"Association vide (0 non-zero)", emptyAssocCards, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := dynamicMinLength(tt.cards)
			if got != tt.expected {
				t.Errorf("dynamicMinLength = %d, want %d", got, tt.expected)
			}
		})
	}
}

// --- Story 7: computeConfidence ---

func TestComputeConfidence(t *testing.T) {
	tests := []struct {
		name     string
		cards    []models.Card
		expected string
	}{
		{"La Platine (5/5 clés, treasury=0)", laPlatineCards, "medium"},
		{"Sweet Manihot (5/5 clés présentes, treasury=0)", sweetManihotCards, "medium"},
		{"Association vide (5/5 clés présentes, treasury=0)", emptyAssocCards, "medium"},
		{"Toutes clés + treasury>0", []models.Card{
			{Key: "business", Value: ptr(100000)},
			{Key: "cash", Value: ptr(80000)},
			{Key: "taxes", Value: ptr(15000)},
			{Key: "refunds", Value: ptr(-500)},
			{Key: "treasury_validated_pct", Value: ptr(75)},
		}, "high"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := computeConfidence(tt.cards)
			if got != tt.expected {
				t.Errorf("computeConfidence = %q, want %q", got, tt.expected)
			}
		})
	}
}

// --- Story 7: validateAndBuildFlash ---

func TestValidateAndBuildFlash_LaPlatine(t *testing.T) {
	raw := flashRaw{
		Headline: "La trésorerie validée reste à 0 % malgré un solde de trésorerie de 1,4 M€, indiquant une absence de rapprochement bancaire sur la période.",
		WhatISee: []string{
			"Les taxes représentent 18,9 % du chiffre d'affaires sur la période.",
			"Le solde de trésorerie dépasse l'activité commerciale de 238 204 €.",
			"Les remboursements représentent 0,1 % du CA, part marginale.",
		},
		ToCheck: []string{
			"Cohérence à vérifier entre le cash et la trésorerie validée (0 %).",
			"Donnée Z de caisse non renseignée sur la période.",
		},
		Confidence: "medium",
	}

	flash, err := validateAndBuildFlash(raw, laPlatineCards)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if flash.Headline == "Lecture DIVA temporairement indisponible." {
		t.Fatal("La Platine valid response should not fallback")
	}

	assertFlashStructure(t, flash, laPlatineCards)
}

func TestValidateAndBuildFlash_ForbiddenTerms(t *testing.T) {
	raw := flashRaw{
		Headline: "Vous devez optimiser la gestion des taxes pour réduire la pression fiscale.",
		WhatISee: []string{"Les taxes représentent 18,9 % du CA."},
		ToCheck:  []string{"Écart à vérifier."},
		Confidence: "medium",
	}

	flash, _ := validateAndBuildFlash(raw, laPlatineCards)
	if flash.Headline != "Lecture DIVA temporairement indisponible." {
		t.Error("Forbidden term 'Vous devez' should trigger fallback")
	}
}

func TestValidateAndBuildFlash_TooShort(t *testing.T) {
	raw := flashRaw{
		Headline:   "Ok.",
		WhatISee:   []string{},
		ToCheck:    []string{},
		Confidence: "medium",
	}

	flash, _ := validateAndBuildFlash(raw, laPlatineCards)
	if flash.Headline != "Lecture DIVA temporairement indisponible." {
		t.Error("Response too short for La Platine should fallback")
	}
}

// --- Story 7: englishDetect faux positifs ---

func TestEnglishDetect_NoFalsePositives(t *testing.T) {
	frenchSentences := []string{
		"Le cash dépasse le business de 238 204 €.",
		"POS: 4 213 € soit 0,4 % du CA.",
		"Les KPI montrent une trésorerie stable.",
		"Le solde de trésorerie s'élève à 1 400 952 €.",
		"Remboursements: 1 687 € soit 0,1 % du CA, part marginale.",
		"Absence de rapprochement bancaire sur la période.",
	}

	for _, s := range frenchSentences {
		if englishDetect.MatchString(s) {
			t.Errorf("Faux positif englishDetect sur phrase française: %q", s)
		}
	}
}

func TestEnglishDetect_CatchesEnglish(t *testing.T) {
	englishSentences := []string{
		"The cash flow is positive for this period.",
		"This assessment should be monitored.",
		"There has been a decrease in turnover.",
	}

	for _, s := range englishSentences {
		if !englishDetect.MatchString(s) {
			t.Errorf("englishDetect devrait matcher phrase anglaise: %q", s)
		}
	}
}

// --- Story 7: forbiddenTerms niveaux ---

func TestForbiddenTerms_Level1Rejected(t *testing.T) {
	level1 := []string{
		"Vous devez vérifier les comptes.",
		"Il faut surveiller les taxes.",
		"Il est obligatoire de rapprocher.",
		"Les taxes devraient être réduites.",
		"Il conviendrait de vérifier.",
		"Cela nécessite une action immédiate.",
	}

	for _, s := range level1 {
		if !forbiddenTerms.MatchString(s) {
			t.Errorf("Niveau 1 devrait être rejeté: %q", s)
		}
	}
}

func TestForbiddenTerms_Level2Tolerated(t *testing.T) {
	level2 := []string{
		"La pression fiscale est élevée à 18,9 %.",
		"Le montant est faible par rapport au CA.",
		"Un important écart est constaté.",
		"Le volume est significatif.",
	}

	for _, s := range level2 {
		if forbiddenTerms.MatchString(s) {
			t.Errorf("Niveau 2 ne devrait PAS être rejeté: %q", s)
		}
	}
}

func TestForbiddenTerms_ObligationLegaleTolerated(t *testing.T) {
	factual := "L'obligation légale de déclaration s'applique à cette période."
	if forbiddenTerms.MatchString(factual) {
		t.Errorf("'obligation légale' ne devrait PAS être rejeté (faux positif 'obligat')")
	}
}

// --- Story 7: noDataFlash ---

func TestNoDataFlash(t *testing.T) {
	flash := noDataFlash()
	if flash.Confidence != "low" {
		t.Errorf("noDataFlash confidence = %q, want 'low'", flash.Confidence)
	}
	if !strings.Contains(flash.Headline, "données disponibles") {
		t.Error("noDataFlash headline devrait contenir 'données disponibles'")
	}
}

// --- Story 10: isolation cache scope ---

func TestContextHashScopeIsolation(t *testing.T) {
	// Simule le calcul de hash comme dans explain.go
	cards := laPlatineCards

	type hashPayload struct {
		Tenant    string      `json:"tenant"`
		CompanyID int         `json:"company_id"`
		DateStart string      `json:"date_start"`
		DateEnd   string      `json:"date_end"`
		Cards     interface{} `json:"cards"`
		FocusCard string      `json:"focus_card,omitempty"`
	}

	type sortedCard struct {
		Key   string   `json:"key"`
		Value *float64 `json:"value"`
		Unit  string   `json:"unit"`
	}

	sorted := make([]sortedCard, len(cards))
	for i, c := range cards {
		sorted[i] = sortedCard{Key: c.Key, Value: c.Value, Unit: c.Unit}
	}

	globalPayload := hashPayload{
		Tenant: "sarl-la-platine", CompanyID: 0,
		DateStart: "2026-01-01", DateEnd: "2026-02-20",
		Cards: sorted,
	}
	companyPayload := hashPayload{
		Tenant: "sarl-la-platine", CompanyID: 1,
		DateStart: "2026-01-01", DateEnd: "2026-02-20",
		Cards: sorted,
	}

	globalJSON, _ := json.Marshal(globalPayload)
	companyJSON, _ := json.Marshal(companyPayload)

	if string(globalJSON) == string(companyJSON) {
		t.Error("Hash payloads scope global (company_id=0) et société (company_id=1) ne doivent PAS être identiques")
	}
}

// --- POS sessions enrichis ---

var laPlatinePosDetails = map[string]interface{}{
	"pos_shops": map[string]interface{}{
		"total_sessions":   float64(7),
		"sealed_sessions":  float64(7),
		"pending_sessions": float64(0),
		"total_tickets":    float64(8),
		"cash_total":       float64(0),
		"card_total":       float64(4213.20),
		"total_difference": float64(0),
		"anomaly_sessions": float64(0),
		"shops": []interface{}{
			map[string]interface{}{"shop_id": "Comptoir La Platine", "sessions_count": float64(3), "total_sales": float64(2668.80)},
			map[string]interface{}{"shop_id": "Sweet Manihot", "sessions_count": float64(4), "total_sales": float64(1544.40)},
		},
	},
}

func TestComputeInsights_LaPlatineWithPOS(t *testing.T) {
	insights := computeInsights(laPlatineCards, laPlatinePosDetails)

	hasInducteurPOS := false
	hasPanierMoyen := false
	hasMixPaiements := false
	hasRepartition := false
	for _, ins := range insights {
		if strings.Contains(ins, "Inducteur POS") && strings.Contains(ins, "7 sessions") {
			hasInducteurPOS = true
		}
		if strings.Contains(ins, "panier moyen") {
			hasPanierMoyen = true
		}
		if strings.Contains(ins, "mix paiements") {
			hasMixPaiements = true
		}
		if strings.Contains(ins, "répartition") && strings.Contains(ins, "Comptoir La Platine") {
			hasRepartition = true
		}
	}

	if !hasInducteurPOS {
		t.Error("Manque insight 'Inducteur POS' avec sessions")
	}
	if !hasPanierMoyen {
		t.Error("Manque insight panier moyen POS")
	}
	if !hasMixPaiements {
		t.Error("Manque insight mix paiements POS")
	}
	if !hasRepartition {
		t.Error("Manque insight répartition POS par point de vente")
	}
}

func TestComputeInsights_POS_AnomalyAlert(t *testing.T) {
	details := map[string]interface{}{
		"pos_shops": map[string]interface{}{
			"total_sessions":   float64(5),
			"sealed_sessions":  float64(4),
			"pending_sessions": float64(1),
			"total_tickets":    float64(10),
			"cash_total":       float64(500),
			"card_total":       float64(1500),
			"total_difference": float64(-15.30),
			"anomaly_sessions": float64(2),
			"shops":            []interface{}{},
		},
	}
	cards := []models.Card{
		{Key: "pos_shops", Value: ptr(2000), Unit: "EUR"},
		{Key: "business", Value: ptr(10000), Unit: "EUR"},
		{Key: "cash", Value: ptr(5000), Unit: "EUR"},
		{Key: "taxes", Value: ptr(1000), Unit: "EUR"},
		{Key: "refunds", Value: ptr(0), Unit: "EUR"},
		{Key: "treasury_validated_pct", Value: ptr(50), Unit: "%"},
	}

	insights := computeInsights(cards, details)

	hasAlerte := false
	hasConformite := false
	for _, ins := range insights {
		if strings.Contains(ins, "ALERTE") && strings.Contains(ins, "écart de caisse") {
			hasAlerte = true
		}
		if strings.Contains(ins, "conformité") && strings.Contains(ins, "4/5") {
			hasConformite = true
		}
	}

	if !hasAlerte {
		t.Error("Manque alerte écart de caisse POS")
	}
	if !hasConformite {
		t.Error("Manque insight conformité POS (4/5 scellées)")
	}
}

func TestExtractPosDetails_Nil(t *testing.T) {
	if extractPosDetails(nil) != nil {
		t.Error("extractPosDetails(nil) devrait retourner nil")
	}
	if extractPosDetails(map[string]interface{}{}) != nil {
		t.Error("extractPosDetails({}) devrait retourner nil")
	}
}

func TestExtractPosDetails_Valid(t *testing.T) {
	d := extractPosDetails(laPlatinePosDetails)
	if d == nil {
		t.Fatal("extractPosDetails devrait retourner des données")
	}
	if d.totalSessions != 7 {
		t.Errorf("totalSessions = %d, want 7", d.totalSessions)
	}
	if d.sealedSessions != 7 {
		t.Errorf("sealedSessions = %d, want 7", d.sealedSessions)
	}
	if d.totalTickets != 8 {
		t.Errorf("totalTickets = %d, want 8", d.totalTickets)
	}
	if len(d.shops) != 2 {
		t.Errorf("shops count = %d, want 2", len(d.shops))
	}
}

// --- helpers ---

func assertFlashStructure(t *testing.T, flash models.Flash, cards []models.Card) {
	t.Helper()

	if flash.Headline == "" {
		t.Error("headline ne doit pas être vide")
	}

	if flash.Confidence != "low" && flash.Confidence != "medium" && flash.Confidence != "high" {
		t.Errorf("confidence invalide: %q", flash.Confidence)
	}

	if len(flash.ToCheck) > 2 {
		t.Errorf("to_check max 2, got %d", len(flash.ToCheck))
	}

	if len(flash.WhatISee) > len(cards)+2 {
		t.Errorf("what_i_see max cards+2 (%d), got %d", len(cards)+2, len(flash.WhatISee))
	}

	allText := flash.Headline
	for _, s := range flash.WhatISee {
		allText += " " + s
	}
	for _, s := range flash.ToCheck {
		allText += " " + s
	}

	if forbiddenTerms.MatchString(allText) {
		t.Error("Flash contient des termes interdits (niveau 1)")
	}

	if englishDetect.MatchString(allText) {
		t.Error("Flash contient du texte détecté comme anglais")
	}
}
