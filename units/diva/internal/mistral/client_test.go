package mistral

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/doreviateam/diva/internal/facts"
	"github.com/doreviateam/diva/internal/models"
)

func ptr(v float64) *float64 { return &v }

// --- Fixtures ---

var laPlatineCards = []models.Card{
	{Key: "treasury_validated_pct", Label: "Trésorerie validée", Value: ptr(0), Unit: "%", Formatted: "0 %", Status: "watch", StatusReason: "Trésorerie non validée (0 %)"},
	{Key: "cash", Label: "Cash", Value: ptr(1400952.21), Unit: "EUR", Formatted: "+ 1 400 952,21 €", Status: "watch", StatusReason: "Cash non validé (trésorerie insuffisante)"},
	{Key: "business", Label: "Business", Value: ptr(1162748.10), Unit: "EUR", Formatted: "+ 1 162 748,10 €", Status: "ok", StatusReason: "Facturation active"},
	{Key: "taxes", Label: "Taxes", Value: ptr(231097.31), Unit: "EUR", Formatted: "+ 231 097,31 €", Status: "watch", StatusReason: "Poids fiscal à surveiller (trésorerie < 80 %)"},
	{Key: "credit_notes", Label: "Notes de crédit", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €", Status: "neutral", StatusReason: "Aucune note de crédit"},
	{Key: "refunds", Label: "Remboursements", Value: ptr(-1686.84), Unit: "EUR", Formatted: "− 1 686,84 €", Status: "watch", StatusReason: "Remboursements à surveiller (0.1 %)"},
	{Key: "pos_shops", Label: "POS magasins", Value: ptr(4213.20), Unit: "EUR", Formatted: "4 213,20 €", Status: "ok", StatusReason: "POS conforme (7 sessions scellées)"},
	{Key: "pos_z", Label: "Z de caisse", Value: nil, Unit: "EUR", Formatted: "—", Status: "neutral", StatusReason: "Z de caisse non renseigné"},
}

var sweetManihotCards = []models.Card{
	{Key: "treasury_validated_pct", Label: "Trésorerie validée", Value: ptr(0), Unit: "%", Formatted: "0 %", Status: "watch", StatusReason: "Trésorerie non validée (0 %)"},
	{Key: "cash", Label: "Cash", Value: ptr(1440), Unit: "EUR", Formatted: "+ 1 440,00 €", Status: "watch", StatusReason: "Cash non validé (trésorerie insuffisante)"},
	{Key: "business", Label: "Business", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €", Status: "neutral", StatusReason: "CA exclusivement POS"},
	{Key: "taxes", Label: "Taxes", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €", Status: "neutral", StatusReason: "Pas de charge fiscale"},
	{Key: "credit_notes", Label: "Notes de crédit", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €", Status: "neutral", StatusReason: "Aucune note de crédit"},
	{Key: "refunds", Label: "Remboursements", Value: ptr(0), Unit: "EUR", Formatted: "+ 0,00 €", Status: "neutral", StatusReason: "Aucun remboursement"},
	{Key: "pos_shops", Label: "POS magasins", Value: ptr(4213.20), Unit: "EUR", Formatted: "4 213,20 €", Status: "ok", StatusReason: "POS conforme (4 sessions scellées)"},
	{Key: "pos_z", Label: "Z de caisse", Value: nil, Unit: "EUR", Formatted: "—", Status: "neutral", StatusReason: "Z de caisse non renseigné"},
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

// --- Story 7: BuildFactsPack (ex-computeInsights) ---

func TestComputeInsights_LaPlatine(t *testing.T) {
	fp := facts.BuildFactsPack(laPlatineCards, nil, nil, facts.ContextMeta{})
	insights := fp.Messages()
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
		if strings.Contains(ins, "post-taxes") {
			hasNetPosition = true
		}
		if strings.Contains(ins, "taxes") && strings.Contains(ins, "chiffre d'affaires") {
			hasTax = true
		}
		if strings.Contains(ins, "activité commerciale") && (strings.Contains(ins, "trésorerie") || strings.Contains(ins, "flux net")) {
			hasCashVsBiz = true
		}
		if strings.HasPrefix(ins, "Remboursements:") {
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
		t.Error("Manque insight position nette post-taxes (trésorerie ou flux net)")
	}
	if !hasTax {
		t.Error("Manque insight inducteur fiscal")
	}
	if !hasCashVsBiz {
		t.Error("Manque insight écart trésorerie (ou flux net) / activité commerciale")
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
	fp := facts.BuildFactsPack(sweetManihotCards, nil, nil, facts.ContextMeta{})
	insights := fp.Messages()

	hasActiviteExclusivePOS := false
	hasEcartCA := false
	for _, ins := range insights {
		// POINT DOMINANT autorisé uniquement si flux net, trésorerie, activité commerciale ou POS > 0
		if strings.Contains(ins, "POINT DOMINANT") &&
			!strings.Contains(ins, "flux net") &&
			!strings.Contains(ins, "trésorerie") &&
			!strings.Contains(ins, "activité commerciale") &&
			!strings.Contains(ins, "POS") {
			t.Error("Sweet Manihot POINT DOMINANT doit mentionner flux net, trésorerie, activité commerciale ou POS")
		}
		if strings.Contains(ins, "note de crédit") {
			t.Error("credit_notes insight ne devrait pas apparaître (business=0, sous seuil 100k)")
		}
		if strings.Contains(ins, "exclusivement du POS") {
			hasActiviteExclusivePOS = true
		}
		if strings.Contains(ins, "activité commerciale totale") {
			hasEcartCA = true
		}
	}

	if !hasActiviteExclusivePOS {
		t.Error("Manque insight 'CA provient exclusivement du POS' quand business=0 et POS>0")
	}
	if !hasEcartCA {
		t.Error("Manque insight 'Écart trésorerie/activité' avec totalCA incluant POS")
	}
}

func TestComputeInsights_EmptyAssoc(t *testing.T) {
	fp := facts.BuildFactsPack(emptyAssocCards, nil, nil, facts.ContextMeta{})
	insights := fp.Messages()

	for _, ins := range insights {
		if strings.Contains(ins, "POINT DOMINANT") {
			t.Error("Association vide ne devrait pas avoir de POINT DOMINANT")
		}
	}
}

// --- Cockpit v1.1 — Règle 16 : discipline insight uniquement si flux opérationnels présents ---

func TestComputeInsights_Rule16_NoFlux(t *testing.T) {
	// Trésorerie 0 % mais aucun flux (cash=0, business=0, pos=0) → pas d'insight discipline
	cards := []models.Card{
		{Key: "treasury_validated_pct", Label: "Trésorerie validée", Value: ptr(0), Unit: "%", Formatted: "0 %"},
		{Key: "cash", Label: "Cash", Value: ptr(0), Unit: "EUR", Formatted: "0 €"},
		{Key: "business", Label: "Business", Value: ptr(0), Unit: "EUR", Formatted: "0 €"},
		{Key: "pos_shops", Label: "POS magasins", Value: ptr(0), Unit: "EUR", Formatted: "0 €"},
	}
	fp := facts.BuildFactsPack(cards, nil, nil, facts.ContextMeta{})
	insights := fp.Messages()
	for _, ins := range insights {
		if strings.Contains(ins, "trésorerie validée à 0%") && strings.Contains(ins, "flux") {
			t.Errorf("Règle 16 : pas d'insight discipline quand flux absents ; reçu: %q", ins)
		}
	}
}

func TestComputeInsights_Rule16_WithFlux(t *testing.T) {
	// Trésorerie 0 % + cash > 0 → insight discipline obligatoire
	cards := []models.Card{
		{Key: "treasury_validated_pct", Label: "Trésorerie validée", Value: ptr(0), Unit: "%", Formatted: "0 %"},
		{Key: "cash", Label: "Cash", Value: ptr(10000), Unit: "EUR", Formatted: "10 000 €"},
		{Key: "business", Label: "Business", Value: ptr(0), Unit: "EUR", Formatted: "0 €"},
		{Key: "pos_shops", Label: "POS magasins", Value: ptr(0), Unit: "EUR", Formatted: "0 €"},
	}
	fp := facts.BuildFactsPack(cards, nil, nil, facts.ContextMeta{})
	insights := fp.Messages()
	hasDiscipline := false
	for _, ins := range insights {
		if strings.Contains(ins, "POINT DOMINANT") && (strings.Contains(ins, "validation bancaire") || strings.Contains(ins, "discipline")) {
			hasDiscipline = true
			break
		}
	}
	if !hasDiscipline {
		t.Error("Règle 16 : insight discipline requis quand Tréso 0% et flux (cash) présent")
	}
}

// --- Facts Pack v1.2.1 — buildUserPromptFromFactsPack ---

func TestBuildUserPromptFromFactsPack(t *testing.T) {
	cli := NewClient()
	fp := facts.BuildFactsPack(laPlatineCards, nil, nil, facts.ContextMeta{})
	prompt := cli.buildUserPromptFromFactsPack(fp, "short")
	if prompt == "" {
		t.Fatal("prompt ne doit pas être vide")
	}
	if !strings.Contains(prompt, "output_mode") {
		t.Error("prompt doit contenir output_mode")
	}
	if !strings.Contains(prompt, "facts") {
		t.Error("prompt doit contenir facts")
	}
	// Pas de cards dans le payload Facts Pack
	if strings.Contains(prompt, `"cards"`) {
		t.Error("payload Facts Pack ne doit pas contenir cards")
	}
}

// --- Cockpit v1.1 — buildUserPrompt data_completeness ---

func TestBuildUserPrompt_DataCompleteness(t *testing.T) {
	cli := NewClient()
	ctx := models.Context{Tenant: "test", CompanyID: 0, DateStart: "2025-01-01", DateEnd: "2025-01-31", Currency: "EUR"}
	cards := []models.Card{
		{Key: "treasury_validated_pct", Label: "Trésorerie", Value: ptr(0), Unit: "%", Formatted: "0 %"},
		{Key: "cash", Label: "Cash", Value: ptr(1000), Unit: "EUR", Formatted: "1 000 €"},
	}

	extractPayload := func(prompt string) map[string]interface{} {
		parts := strings.SplitN(prompt, "\n\n", 2)
		if len(parts) < 2 {
			return nil
		}
		var out map[string]interface{}
		if err := json.Unmarshal([]byte(parts[1]), &out); err != nil {
			return nil
		}
		return out
	}

	t.Run("absent par défaut", func(t *testing.T) {
		prompt := cli.buildUserPrompt(ctx, cards, "", nil, nil)
		pl := extractPayload(prompt)
		if pl == nil {
			t.Fatal("buildUserPrompt: payload non parseable")
		}
		dc, ok := pl["data_completeness"].(map[string]interface{})
		if !ok || dc == nil {
			t.Fatal("data_completeness absent ou invalide quand dashboardDetails nil")
		}
		if bhm, _ := dc["bank_health_metrics"].(string); bhm != "absent" {
			t.Errorf("bank_health_metrics = %q, veut 'absent' (défaut)", bhm)
		}
	})

	t.Run("transmis via map", func(t *testing.T) {
		details := map[string]interface{}{
			"data_completeness": map[string]interface{}{"bank_health_metrics": "complete"},
		}
		prompt := cli.buildUserPrompt(ctx, cards, "", nil, details)
		pl := extractPayload(prompt)
		if pl == nil {
			t.Fatal("buildUserPrompt: payload non parseable")
		}
		dc, ok := pl["data_completeness"].(map[string]interface{})
		if !ok || dc == nil {
			t.Fatal("data_completeness absent")
		}
		if bhm, _ := dc["bank_health_metrics"].(string); bhm != "complete" {
			t.Errorf("bank_health_metrics = %q, veut 'complete'", bhm)
		}
	})

	t.Run("transmis via DataCompleteness", func(t *testing.T) {
		details := map[string]interface{}{
			"data_completeness": &models.DataCompleteness{BankHealthMetrics: "partial"},
		}
		prompt := cli.buildUserPrompt(ctx, cards, "", nil, details)
		pl := extractPayload(prompt)
		if pl == nil {
			t.Fatal("buildUserPrompt: payload non parseable")
		}
		dc, ok := pl["data_completeness"].(map[string]interface{})
		if !ok || dc == nil {
			t.Fatal("data_completeness absent")
		}
		if bhm, _ := dc["bank_health_metrics"].(string); bhm != "partial" {
			t.Errorf("bank_health_metrics = %q, veut 'partial'", bhm)
		}
	})
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

	flash, err := validateAndBuildFlash(raw, laPlatineCards, nil)
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

	flash, _ := validateAndBuildFlash(raw, laPlatineCards, nil)
	if flash.Headline != "Lecture DIVA temporairement indisponible." {
		t.Error("Forbidden term 'Vous devez' should trigger fallback")
	}
}

func TestValidateAndBuildFlash_JSONGarbage(t *testing.T) {
	for _, rawHeadline := range []string{`{`, `"`, `{"headline":`, `{ "headline"`} {
		raw := flashRaw{
			Headline:   rawHeadline,
			WhatISee:   []string{"Position nette: 100k €"},
			ToCheck:    []string{},
			Confidence: "medium",
		}
		flash, _ := validateAndBuildFlash(raw, laPlatineCards, nil)
		if flash.Headline != "Lecture DIVA temporairement indisponible." {
			t.Errorf("JSON garbage %q should trigger fallback, got headline %q", rawHeadline, flash.Headline)
		}
	}
}

func TestValidateAndBuildFlash_TooShort(t *testing.T) {
	raw := flashRaw{
		Headline:   "Ok.",
		WhatISee:   []string{},
		ToCheck:    []string{},
		Confidence: "medium",
	}

	flash, _ := validateAndBuildFlash(raw, laPlatineCards, nil)
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
	fp := facts.BuildFactsPack(laPlatineCards, laPlatinePosDetails, nil, facts.ContextMeta{})
	insights := fp.Messages()

	hasInducteurPOS := false
	hasPanierMoyen := false
	hasMixPaiements := false
	hasRepartition := false
	for _, ins := range insights {
		if (strings.Contains(ins, "Inducteur POS") || strings.Contains(ins, "Le POS affiche")) && strings.Contains(ins, "7 sessions") {
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
	// répartition peut être exclue par la limite de 10 faits (FactsPack v1.2.1)
	if !hasRepartition && len(insights) < 10 {
		t.Error("Manque insight répartition POS (attendu quand < 10 faits)")
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

	fp := facts.BuildFactsPack(cards, details, nil, facts.ContextMeta{})
	insights := fp.Messages()

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

func TestBuildFactsPack_WithNilDetails(t *testing.T) {
	fp := facts.BuildFactsPack(laPlatineCards, nil, nil, facts.ContextMeta{})
	if fp == nil {
		t.Fatal("BuildFactsPack ne doit pas retourner nil")
	}
	if len(fp.Facts) == 0 && len(laPlatineCards) > 0 {
		t.Error("BuildFactsPack avec cartes valides doit produire des faits")
	}
}

func TestBuildFactsPack_WithPOSDetails(t *testing.T) {
	fp := facts.BuildFactsPack(laPlatineCards, laPlatinePosDetails, nil, facts.ContextMeta{})
	if fp == nil {
		t.Fatal("BuildFactsPack ne doit pas retourner nil")
	}
	msgs := fp.Messages()
	hasSessions := false
	hasTickets := false
	for _, m := range msgs {
		if strings.Contains(m, "7") && strings.Contains(m, "sessions") {
			hasSessions = true
		}
		if strings.Contains(m, "8") && strings.Contains(m, "tickets") {
			hasTickets = true
		}
	}
	if !hasSessions {
		t.Error("BuildFactsPack avec POS details doit inclure les sessions (7)")
	}
	if !hasTickets {
		t.Error("BuildFactsPack avec POS details doit inclure les tickets (8)")
	}
}

// --- Story D: degraded mode ---

func TestDegradedFlash_LaPlatine(t *testing.T) {
	flash := degradedFlash(laPlatineCards, nil)
	if !flash.Degraded {
		t.Error("degradedFlash doit avoir Degraded=true")
	}
	if flash.Headline == "" {
		t.Error("headline ne doit pas être vide")
	}
	if flash.Headline == "Lecture DIVA temporairement indisponible." {
		t.Error("degradedFlash ne doit pas retourner le fallback vide")
	}
	if len(flash.WhatISee) == 0 || len(flash.WhatISee) > 3 {
		t.Errorf("what_i_see doit avoir 1-3 éléments, got %d", len(flash.WhatISee))
	}
	if len(flash.ToCheck) > 2 {
		t.Errorf("to_check max 2, got %d", len(flash.ToCheck))
	}
	if flash.Confidence != "medium" {
		t.Errorf("confidence = %q, want medium (La Platine treasury=0)", flash.Confidence)
	}
}

func TestDegradedFlash_SweetManihot(t *testing.T) {
	flash := degradedFlash(sweetManihotCards, laPlatinePosDetails)
	if !flash.Degraded {
		t.Error("degradedFlash doit avoir Degraded=true")
	}
	if flash.Headline == "" || flash.Headline == "Lecture DIVA temporairement indisponible." {
		t.Errorf("headline invalide: %q", flash.Headline)
	}
	// FactsPack v1.2.1 : tri priorité treasury > governance > inductors.
	// Sweet Manihot (cash+POS, biz=0) → POINT DOMINANT cash en tête ; POS peut être hors top-3.
	if len(flash.WhatISee) == 0 {
		t.Error("degradedFlash doit avoir au moins un élément dans what_i_see")
	}
}

func TestDegradedFlashFromFactsPack(t *testing.T) {
	fp := facts.BuildFactsPack(laPlatineCards, nil, nil, facts.ContextMeta{})
	flash := DegradedFlashFromFactsPack(fp, laPlatineCards)
	if !flash.Degraded {
		t.Error("DegradedFlashFromFactsPack doit avoir Degraded=true")
	}
	if flash.Headline == "" {
		t.Error("headline ne doit pas être vide")
	}
	if len(flash.WhatISee) > 3 {
		t.Errorf("what_i_see max 3, got %d", len(flash.WhatISee))
	}
	if len(flash.ToCheck) > 2 {
		t.Errorf("to_check max 2, got %d", len(flash.ToCheck))
	}
}

func TestDegradedFlash_Empty(t *testing.T) {
	flash := degradedFlash(emptyAssocCards, nil)
	if !flash.Degraded {
		t.Error("degradedFlash doit avoir Degraded=true")
	}
	if flash.Confidence != "medium" && flash.Confidence != "low" {
		t.Errorf("empty degraded confidence = %q, want medium ou low", flash.Confidence)
	}
}

func TestSanitizeHeadline_Truncation(t *testing.T) {
	long := strings.Repeat("Trésorerie ", 20)
	result := sanitizeHeadline(long)
	if len([]rune(result)) > 140 {
		t.Errorf("headline devrait être ≤ 140 runes, got %d", len([]rune(result)))
	}
	if !strings.HasSuffix(result, "...") {
		t.Error("headline tronqué devrait finir par ...")
	}
}

func TestValidateAndBuildFlash_MaxFlashLength(t *testing.T) {
	raw := flashRaw{
		Headline: "Synthèse financière détaillée pour cette période.",
		WhatISee: []string{
			"Les taxes représentent 18,9 % du CA sur la période en cours, ce qui pèse sur la trésorerie.",
			"Le solde de trésorerie dépasse l'activité commerciale de 238 204 €, ce qui indique un non rapprochement.",
			"Les remboursements représentent 0,1 % du CA, ce qui reste une part marginale à surveiller.",
			"Le volume de POS s'élève à 4 213 € soit 0,4 % du CA global de l'entreprise sur la période.",
			"La position nette de trésorerie post-taxes est de 1 192 570 € pour la période considérée.",
		},
		ToCheck:    []string{"Rapprochement bancaire non effectué.", "Z de caisse non renseigné."},
		Confidence: "medium",
	}
	flash, err := validateAndBuildFlash(raw, laPlatineCards, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	total := len([]rune(flash.Headline))
	for _, s := range flash.WhatISee {
		total += len([]rune(s))
	}
	for _, s := range flash.ToCheck {
		total += len([]rune(s))
	}
	if total > 600 {
		t.Errorf("flash total = %d chars, devrait être ≤ 600", total)
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

// --- Gouvernance insights ---

func TestComputeInsights_GovernanceLaPlatine(t *testing.T) {
	fp := facts.BuildFactsPack(laPlatineCards, nil, nil, facts.ContextMeta{})
	insights := fp.Messages()
	hasGovernance := false
	for _, ins := range insights {
		if strings.Contains(ins, "GOUVERNANCE") {
			hasGovernance = true
			if !strings.Contains(ins, "Trésorerie validée") {
				t.Error("L'insight de gouvernance La Platine doit mentionner Trésorerie validée")
			}
			if !strings.Contains(ins, "Cash") {
				t.Error("L'insight de gouvernance La Platine doit mentionner Cash")
			}
			break
		}
	}
	if !hasGovernance {
		t.Error("La Platine avec 4 cartes watch doit produire un insight GOUVERNANCE")
	}
}

func TestComputeInsights_GovernanceSweetManihot(t *testing.T) {
	fp := facts.BuildFactsPack(sweetManihotCards, nil, nil, facts.ContextMeta{})
	insights := fp.Messages()
	hasGovernance := false
	for _, ins := range insights {
		if strings.Contains(ins, "GOUVERNANCE") {
			hasGovernance = true
			if !strings.Contains(ins, "Trésorerie validée") {
				t.Error("L'insight de gouvernance Sweet Manihot doit mentionner Trésorerie validée")
			}
			break
		}
	}
	if !hasGovernance {
		t.Error("Sweet Manihot avec 2 cartes watch doit produire un insight GOUVERNANCE")
	}
}

func TestComputeInsights_NoGovernanceWhenAllOk(t *testing.T) {
	allOkCards := []models.Card{
		{Key: "treasury_validated_pct", Label: "Trésorerie validée", Value: ptr(95), Unit: "%", Status: "ok", StatusReason: "Trésorerie validée à 95 %"},
		{Key: "cash", Label: "Cash", Value: ptr(50000), Unit: "EUR", Status: "ok", StatusReason: "Cash validé"},
		{Key: "business", Label: "Business", Value: ptr(100000), Unit: "EUR", Status: "ok", StatusReason: "Facturation active"},
		{Key: "taxes", Label: "Taxes", Value: ptr(20000), Unit: "EUR", Status: "ok", StatusReason: "Charges fiscales couvertes"},
		{Key: "credit_notes", Label: "Notes de crédit", Value: ptr(0), Unit: "EUR", Status: "neutral", StatusReason: "Aucune note de crédit"},
		{Key: "refunds", Label: "Remboursements", Value: ptr(-500), Unit: "EUR", Status: "ok", StatusReason: "Remboursements marginaux (0.5 %)"},
		{Key: "pos_shops", Label: "POS magasins", Value: ptr(10000), Unit: "EUR", Status: "ok", StatusReason: "POS conforme"},
		{Key: "pos_z", Label: "Z de caisse", Value: nil, Unit: "EUR", Status: "neutral", StatusReason: "Z de caisse non renseigné"},
	}
	fp := facts.BuildFactsPack(allOkCards, nil, nil, facts.ContextMeta{})
	insights := fp.Messages()
	for _, ins := range insights {
		if strings.Contains(ins, "GOUVERNANCE") {
			t.Error("Aucun insight GOUVERNANCE ne doit apparaître quand toutes les cartes sont ok/neutral")
		}
	}
}

func TestCardStatus_Helper(t *testing.T) {
	status, reason := cardStatus(laPlatineCards, "treasury_validated_pct")
	if status != "watch" {
		t.Errorf("expected watch, got %s", status)
	}
	if reason == "" {
		t.Error("expected non-empty reason")
	}

	status, _ = cardStatus(laPlatineCards, "business")
	if status != "ok" {
		t.Errorf("expected ok, got %s", status)
	}

	status, _ = cardStatus(laPlatineCards, "nonexistent")
	if status != "" {
		t.Errorf("expected empty status for unknown card, got %s", status)
	}
}
