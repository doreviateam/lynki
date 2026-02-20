package mistral

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/doreviateam/diva/internal/models"
)

func isTimeout(err error) bool {
	if err == nil {
		return false
	}
	type timeout interface {
		Timeout() bool
	}
	if t, ok := err.(timeout); ok && t.Timeout() {
		return true
	}
	return false
}

const (
	defaultBaseURL = "http://mistral-llamacpp:8000/v1"
	modelName      = "mistral-7b-instruct-v0.2.Q4_K_M"
)

// forbiddenTerms — niveau 1 : rejet automatique (injonctions + prescriptions + anglicismes).
// Les qualificatifs (niveau 2) sont découragés dans le prompt mais pas rejetés ici.
var forbiddenTerms = regexp.MustCompile(`(?i)(vous devez|il faut|obligatoire de|obligatoirement|devraient être|il conviendrait|nécessite une action|sanction|assessment|framework|overview|compliance|hinge on|strategic overview)`)

// englishDetect — cible les mots structurels anglais (articles, pronoms, modaux).
// Les termes métier tolérés en français (cash, business, POS, KPI) ne sont PAS dans ce regex.
var englishDetect = regexp.MustCompile(`(?i)\b(the |\.the | of the | and the | is | are | has been| have been| this | that | which | their | should | could | would | monitor | investigate | determine | ensure | remains | turnover)\b`)

// dateRangePatterns : supprime les plages de dates du headline (redondant avec le header).
var dateRangePatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)\s*from\s+[A-Za-zéû]+\s+\d{1,2},?\s+\d{4}\s+to\s+[A-Za-zéû]+\s+\d{1,2},?\s+\d{4}\s*,?\s*`),
	regexp.MustCompile(`(?i)(?:pour|sur) la période\s+du\s+\d{4}-\d{2}-\d{2}\s+au\s+\d{4}-\d{2}-\d{2}\s*,?\s*`),
	regexp.MustCompile(`(?i)(?:pour|sur) la période\s+entre\s+le\s+\d{4}-\d{2}-\d{2}\s+et\s+\d{4}-\d{2}-\d{2}\s*,?\s*`),
	regexp.MustCompile(`(?i)\s+entre\s+le\s+\d{4}-\d{2}-\d{2}\s+et\s+\d{4}-\d{2}-\d{2}\s*,?\s*`),
	regexp.MustCompile(`(?i)\s+du\s+\d{4}-\d{2}-\d{2}\s+au\s+\d{4}-\d{2}-\d{2}\s*,?\s*`),
	regexp.MustCompile(`\s*\(?\d{4}-\d{2}-\d{2}\s*[à\-/]\s*\d{4}-\d{2}-\d{2}\)?\s*,?\s*`),
}

type Client struct {
	baseURL string
	client  *http.Client
}

func NewClient() *Client {
	base := os.Getenv("MISTRAL_BASE_URL")
	if base == "" {
		base = defaultBaseURL
	}
	return &Client{
		baseURL: strings.TrimSuffix(base, "/"),
		client: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

// systemPrompt — DIVA v3.0 (spec v1.3.1 — mode neutre contrôlé)
const systemPrompt = `Tu es un expert-comptable senior analysant les données financières de PME.

LANGUE : français uniquement. Jamais d'anglais.

FORMAT : réponds uniquement par un objet JSON valide, sans balises markdown, sans texte avant ni après :
{
  "headline": "Synthèse en 1-2 phrases de l'élément dominant",
  "what_i_see": ["Analyse 1", "Analyse 2", "Analyse 3"],
  "to_check": ["Point à vérifier 1", "Point à vérifier 2"],
  "confidence": "low|medium|high"
}

RÈGLES :
1. headline : reformule l'insight "POINT DOMINANT" s'il existe. Synthèse experte, pas de listing.
2. what_i_see : 3-5 phrases analytiques. Reformule les insights pré-calculés avec des ratios. Ne recopie pas.
3. to_check : max 2. Signale uniquement des écarts, absences ou incohérences factuelles. Jamais de conseil ni prescription.
4. Ne déduis rien au-delà des données transmises. Ne calcule AUCUN ratio toi-même. Utilise UNIQUEMENT les ratios fournis dans le champ "insights".
5. Évite les qualificatifs non chiffrés ("élevé", "faible", "important", "significatif"). Préfère les ratios.
6. Vocabulaire : "représente", "s'élève à", "soit X % du CA", "dépasse", "écart de", "non rapproché", "absence de".
7. Ton : factuel, sobre, analytique. Aucun conseil, aucune recommandation, aucune injonction.
8. La trésorerie est l'indicateur central. Les autres cartes (business, taxes, remboursements, POS) sont des inducteurs qui expliquent la position de trésorerie. Structure ton analyse autour de cette hiérarchie.
9. Points de vente (POS) : si les insights POS détaillent sessions, panier moyen, mix paiements ou écarts de caisse, intègre-les comme inducteur de trésorerie. Signale les écarts de caisse et les sessions non scellées comme points à vérifier.`

func (c *Client) Chat(ctx models.Context, cards []models.Card, focusCard string, focusCardDetails map[string]interface{}, dashboardDetails map[string]interface{}) (models.Flash, error) {
	effective := cards
	if focusCard != "" {
		for _, card := range cards {
			if card.Key == focusCard {
				effective = []models.Card{card}
				break
			}
		}
	}
	if focusCard == "" {
		biz, hasBiz := cardVal(cards, "business")
		cash, hasCash := cardVal(cards, "cash")
		taxes, hasTaxes := cardVal(cards, "taxes")
		if (!hasBiz || biz == 0) && (!hasCash || cash == 0) && (!hasTaxes || taxes == 0) {
			return noDataFlash(), nil
		}
	}

	userPrompt := c.buildUserPrompt(ctx, effective, focusCard, focusCardDetails, dashboardDetails)

	payload := map[string]interface{}{
		"model": "mistral",
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
		"temperature":       0.45,
		"max_tokens":        650,
		"top_p":             0.9,
		"frequency_penalty": 0.3,
		"presence_penalty":  0.1,
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", c.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return models.Flash{}, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		if isTimeout(err) {
			return models.Flash{}, ErrMistralTimeout
		}
		return models.Flash{}, ErrMistralUnavailable
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusRequestTimeout || resp.StatusCode == http.StatusGatewayTimeout {
		return models.Flash{}, ErrMistralTimeout
	}
	if resp.StatusCode != http.StatusOK {
		return models.Flash{}, ErrMistralUnavailable
	}

	var chatResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return fallbackFlash(), err
	}
	if len(chatResp.Choices) == 0 {
		return fallbackFlash(), nil
	}

	return parseFlash(chatResp.Choices[0].Message.Content, effective)
}

// userPromptPayload — structure JSON envoyée à l'IA (mode cockpit ou card).
type userPromptPayload struct {
	Mode     string                   `json:"mode"`
	Context  map[string]interface{}   `json:"context"`
	Cards    []map[string]interface{} `json:"cards"`
	Insights []string                 `json:"insights,omitempty"`
	Details  map[string]interface{}   `json:"details,omitempty"`
}

func cardVal(cards []models.Card, key string) (float64, bool) {
	for _, c := range cards {
		if c.Key == key && c.Value != nil {
			return *c.Value, true
		}
	}
	return 0, false
}

func fmtPct(v float64) string  { return fmt.Sprintf("%.1f%%", v) }
func fmtEUR(v float64) string  { return fmt.Sprintf("%.0f €", v) }
func absVal(v float64) float64 { return math.Abs(v) }

func computeInsights(cards []models.Card, details map[string]interface{}) []string {
	var insights []string

	cash, hasCash := cardVal(cards, "cash")
	biz, hasBiz := cardVal(cards, "business")
	taxes, hasTaxes := cardVal(cards, "taxes")
	treasury, hasTreasury := cardVal(cards, "treasury_validated_pct")
	refunds, hasRefunds := cardVal(cards, "refunds")
	creditNotes, hasCreditNotes := cardVal(cards, "credit_notes")
	pos, hasPOS := cardVal(cards, "pos_shops")

	if hasTreasury && treasury == 0 && hasCash && cash > 0 {
		insights = append(insights, fmt.Sprintf(
			"POINT DOMINANT: trésorerie validée à 0%% alors que le cash s'élève à %s — absence de rapprochement bancaire ou de validation comptable sur la période",
			fmtEUR(cash)))
	}

	if hasCash && hasTaxes {
		net := cash - taxes
		if hasRefunds {
			net += refunds
		}
		insights = append(insights, fmt.Sprintf("Position nette de trésorerie post-taxes: %s", fmtEUR(net)))
	}

	if hasTaxes && hasBiz && biz != 0 {
		ratio := (taxes / absVal(biz)) * 100
		insights = append(insights, fmt.Sprintf(
			"Inducteur fiscal: les taxes (%s) représentent %s du CA et pèsent sur la trésorerie",
			fmtEUR(taxes), fmtPct(ratio)))
	}

	if hasCash && hasBiz {
		spread := cash - biz
		if spread > 0 {
			insights = append(insights, fmt.Sprintf(
				"Écart trésorerie/activité: le solde de trésorerie (%s) dépasse l'activité commerciale (%s) de %s",
				fmtEUR(cash), fmtEUR(biz), fmtEUR(spread)))
		} else if spread < 0 {
			insights = append(insights, fmt.Sprintf(
				"Écart trésorerie/activité: l'activité commerciale (%s) dépasse le solde de trésorerie (%s) de %s",
				fmtEUR(biz), fmtEUR(cash), fmtEUR(absVal(spread))))
		}
	}

	if hasRefunds && hasBiz && biz != 0 {
		ratio := (absVal(refunds) / absVal(biz)) * 100
		if ratio < 1.0 {
			insights = append(insights, fmt.Sprintf("Remboursements: %s soit %s du CA, part marginale", fmtEUR(absVal(refunds)), fmtPct(ratio)))
		} else {
			insights = append(insights, fmt.Sprintf("Remboursements: %s soit %s du CA", fmtEUR(absVal(refunds)), fmtPct(ratio)))
		}
	}

	// --- POS sessions enrichis ---
	posDetails := extractPosDetails(details)
	if posDetails != nil && posDetails.totalSessions > 0 {
		if hasBiz && biz != 0 {
			ratio := (pos / absVal(biz)) * 100
			insights = append(insights, fmt.Sprintf(
				"Inducteur POS: %d sessions, %d tickets, %s de ventes soit %s du CA",
				posDetails.totalSessions, posDetails.totalTickets, fmtEUR(pos), fmtPct(ratio)))
		} else if hasPOS && pos > 0 {
			insights = append(insights, fmt.Sprintf(
				"Inducteur POS: %d sessions, %d tickets, %s de ventes",
				posDetails.totalSessions, posDetails.totalTickets, fmtEUR(pos)))
		}

		if posDetails.totalSessions > 0 && posDetails.totalTickets > 0 {
			avgBasket := pos / float64(posDetails.totalTickets)
			insights = append(insights, fmt.Sprintf("POS panier moyen: %s (%d tickets sur %d sessions)",
				fmtEUR(avgBasket), posDetails.totalTickets, posDetails.totalSessions))
		}

		totalPayments := posDetails.cashTotal + posDetails.cardTotal
		if totalPayments > 0 {
			cashPct := (posDetails.cashTotal / totalPayments) * 100
			cardPct := (posDetails.cardTotal / totalPayments) * 100
			insights = append(insights, fmt.Sprintf("POS mix paiements: espèces %s (%s), carte %s (%s)",
				fmtEUR(posDetails.cashTotal), fmtPct(cashPct), fmtEUR(posDetails.cardTotal), fmtPct(cardPct)))
		}

		if posDetails.anomalySessions > 0 {
			insights = append(insights, fmt.Sprintf(
				"POS ALERTE: %d session(s) avec écart de caisse, écart cumulé %s",
				posDetails.anomalySessions, fmtEUR(absVal(posDetails.totalDifference))))
		}

		sealingRate := float64(posDetails.sealedSessions) / float64(posDetails.totalSessions) * 100
		if sealingRate < 100 {
			insights = append(insights, fmt.Sprintf(
				"POS conformité: %d/%d sessions scellées (%s) — %d en attente",
				posDetails.sealedSessions, posDetails.totalSessions, fmtPct(sealingRate), posDetails.pendingSessions))
		}

		if len(posDetails.shops) > 1 {
			var parts []string
			for _, shop := range posDetails.shops {
				parts = append(parts, fmt.Sprintf("%s: %s (%d sessions)", shop.shopID, fmtEUR(shop.totalSales), shop.sessionsCount))
			}
			insights = append(insights, fmt.Sprintf("POS répartition: %s", strings.Join(parts, " | ")))
		}
	} else if hasPOS && hasBiz && biz != 0 {
		ratio := (pos / absVal(biz)) * 100
		insights = append(insights, fmt.Sprintf("POS: %s soit %s du CA", fmtEUR(pos), fmtPct(ratio)))
	}

	if (!hasCreditNotes || creditNotes == 0) && hasBiz && biz > 100000 {
		insights = append(insights, fmt.Sprintf("Aucune note de crédit émise sur la période malgré un volume d'activité de %s", fmtEUR(biz)))
	}

	return insights
}

type posDetailsData struct {
	totalSessions   int
	sealedSessions  int
	pendingSessions int
	totalTickets    int
	cashTotal       float64
	cardTotal       float64
	totalDifference float64
	anomalySessions int
	shops           []posShopData
}

type posShopData struct {
	shopID        string
	sessionsCount int
	totalSales    float64
}

func extractPosDetails(details map[string]interface{}) *posDetailsData {
	if details == nil {
		return nil
	}
	raw, ok := details["pos_shops"]
	if !ok || raw == nil {
		return nil
	}
	m, ok := raw.(map[string]interface{})
	if !ok {
		return nil
	}

	d := &posDetailsData{}
	d.totalSessions = toInt(m["total_sessions"])
	d.sealedSessions = toInt(m["sealed_sessions"])
	d.pendingSessions = toInt(m["pending_sessions"])
	d.totalTickets = toInt(m["total_tickets"])
	d.cashTotal = toFloat(m["cash_total"])
	d.cardTotal = toFloat(m["card_total"])
	d.totalDifference = toFloat(m["total_difference"])
	d.anomalySessions = toInt(m["anomaly_sessions"])

	if shopsRaw, ok := m["shops"]; ok {
		if shops, ok := shopsRaw.([]interface{}); ok {
			for _, s := range shops {
				if sm, ok := s.(map[string]interface{}); ok {
					d.shops = append(d.shops, posShopData{
						shopID:        toString(sm["shop_id"]),
						sessionsCount: toInt(sm["sessions_count"]),
						totalSales:    toFloat(sm["total_sales"]),
					})
				}
			}
		}
	}
	return d
}

func toInt(v interface{}) int {
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	case json.Number:
		i, _ := n.Int64()
		return int(i)
	}
	return 0
}

func toFloat(v interface{}) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case int:
		return float64(n)
	case json.Number:
		f, _ := n.Float64()
		return f
	}
	return 0
}

func toString(v interface{}) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}

func (c *Client) buildUserPrompt(ctx models.Context, cards []models.Card, focusCard string, focusCardDetails map[string]interface{}, dashboardDetails map[string]interface{}) string {
	mode := "cockpit"
	if focusCard != "" {
		mode = "card"
	}

	scope := "analyse globale toutes sociétés du tenant"
	if ctx.CompanyID > 0 {
		scope = fmt.Sprintf("analyse société spécifique (id=%d)", ctx.CompanyID)
	}

	payload := userPromptPayload{
		Mode: mode,
		Context: map[string]interface{}{
			"tenant":     ctx.Tenant,
			"scope":      scope,
			"date_start": ctx.DateStart,
			"date_end":   ctx.DateEnd,
			"currency":   ctx.Currency,
		},
		Cards: make([]map[string]interface{}, 0, len(cards)),
	}

	for _, card := range cards {
		m := map[string]interface{}{
			"key":       card.Key,
			"label":     card.Label,
			"unit":      card.Unit,
			"formatted": card.Formatted,
		}
		if card.Value != nil {
			m["value"] = *card.Value
		} else {
			m["value"] = nil
		}
		payload.Cards = append(payload.Cards, m)
	}

	if mode == "cockpit" {
		payload.Insights = computeInsights(cards, dashboardDetails)
	}

	if mode == "card" && len(focusCardDetails) > 0 {
		payload.Details = focusCardDetails
	}

	raw, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return fmt.Sprintf(`{"mode":"%s","error":"marshal failed"}`, mode)
	}

	instruction := c.buildInstruction(mode, focusCard)
	return instruction + "\n\n" + string(raw)
}

func (c *Client) buildInstruction(mode, focusCard string) string {
	if mode == "card" {
		return "Mode: card. Analyse la carte ciblée. JSON strict."
	}
	return "Mode: cockpit. Analyse globale à partir des données et insights pré-calculés. JSON strict."
}

func parseFlash(content string, cards []models.Card) (models.Flash, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return fallbackFlash(), nil
	}

	jsonStr := extractJSON(content)
	var raw flashRaw
	if jsonStr != "" {
		if err := json.Unmarshal([]byte(jsonStr), &raw); err == nil && raw.Headline != "" {
			return validateAndBuildFlash(raw, cards)
		}
	}

	headline := strings.TrimSpace(content)
	if len(headline) > 1200 {
		headline = headline[:1197] + "..."
	}
	if headline != "" && !forbiddenTerms.MatchString(headline) && !englishDetect.MatchString(headline) {
		return models.Flash{
			Headline:   sanitizeHeadline(headline),
			WhatISee:   []string{},
			ToCheck:    []string{},
			Confidence: computeConfidence(cards),
		}, nil
	}

	return fallbackFlash(), nil
}

func extractJSON(s string) string {
	if i := strings.Index(s, "```"); i >= 0 {
		s = strings.TrimSpace(s[i+3:])
		if len(s) >= 4 && strings.ToLower(s[:4]) == "json" {
			s = strings.TrimSpace(s[4:])
		}
		if j := strings.Index(s, "```"); j >= 0 {
			s = s[:j]
		}
	}
	start := strings.Index(s, "{")
	end := strings.LastIndex(s, "}")
	if start < 0 || end <= start {
		return ""
	}
	return s[start : end+1]
}

type flashRaw struct {
	Headline   string   `json:"headline"`
	WhatISee   []string `json:"what_i_see"`
	ToCheck    []string `json:"to_check"`
	Confidence string   `json:"confidence"`
}

// keyCards — cartes clés pour le calcul de confidence.
// confidence = qualité du bloc DIVA, pas exhaustivité financière.
var keyCards = []string{"business", "cash", "taxes", "refunds", "treasury_validated_pct"}

func noDataFlash() models.Flash {
	return models.Flash{
		Headline:   "Les données disponibles ne permettent pas d'établir une analyse significative sur cette période.",
		WhatISee:   []string{},
		ToCheck:    []string{},
		Confidence: "low",
	}
}

func dynamicMinLength(cards []models.Card) int {
	count := 0
	for _, c := range cards {
		if c.Value != nil && *c.Value != 0 {
			count++
		}
	}
	if count == 0 {
		return 0
	}
	n := count * 35
	if n < 80 {
		return 80
	}
	return n
}

func computeConfidence(cards []models.Card) string {
	present := make(map[string]bool)
	var treasuryVal float64
	for _, c := range cards {
		for _, key := range keyCards {
			if c.Key == key && c.Value != nil {
				present[key] = true
				if key == "treasury_validated_pct" {
					treasuryVal = *c.Value
				}
			}
		}
	}
	if len(present) < len(keyCards) {
		return "low"
	}
	if treasuryVal > 0 {
		return "high"
	}
	return "medium"
}

func textLength(raw flashRaw) int {
	n := utf8.RuneCountInString(raw.Headline)
	for _, s := range raw.WhatISee {
		n += utf8.RuneCountInString(s)
	}
	for _, s := range raw.ToCheck {
		n += utf8.RuneCountInString(s)
	}
	return n
}

func validateAndBuildFlash(raw flashRaw, cards []models.Card) (models.Flash, error) {
	conf := computeConfidence(cards)
	if textLength(raw) < dynamicMinLength(cards) {
		return fallbackFlash(), nil
	}
	allText := raw.Headline
	for _, s := range raw.WhatISee {
		allText += " " + s
	}
	for _, s := range raw.ToCheck {
		allText += " " + s
	}
	if forbiddenTerms.MatchString(allText) || englishDetect.MatchString(allText) {
		return fallbackFlash(), nil
	}
	if len(raw.WhatISee) > len(cards)+2 {
		raw.WhatISee = raw.WhatISee[:len(cards)+2]
	}
	if len(raw.ToCheck) > 2 {
		raw.ToCheck = raw.ToCheck[:2]
	}
	return models.Flash{
		Headline:   sanitizeHeadline(raw.Headline),
		WhatISee:   raw.WhatISee,
		ToCheck:    raw.ToCheck,
		Confidence: conf,
	}, nil
}

var leadingOrphanPunct = regexp.MustCompile(`^\s*[,;]\s*`)

var metaNotePattern = regexp.MustCompile(`(?i)\s*\([^)]*(?:note\s*:|accordance|given rules|did not mention|instruction|constraint)[^)]*\)\s*`)

func sanitizeHeadline(s string) string {
	s = metaNotePattern.ReplaceAllString(s, " ")
	for _, re := range dateRangePatterns {
		s = re.ReplaceAllString(s, " ")
	}
	s = strings.TrimSpace(s)
	s = leadingOrphanPunct.ReplaceAllString(s, "")
	return strings.TrimSpace(strings.TrimSuffix(s, ","))
}

func fallbackFlash() models.Flash {
	return models.Flash{
		Headline:   "Lecture DIVA temporairement indisponible.",
		WhatISee:   []string{},
		ToCheck:    []string{},
		Confidence: "low",
	}
}
