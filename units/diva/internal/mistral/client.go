package mistral

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
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
9. Activité commerciale totale = Business (facturation) + POS (ventes en magasin). Ne dis JAMAIS "aucune activité commerciale" si le POS affiche des ventes. Si Business = 0 et POS > 0, le CA provient exclusivement du canal POS.
10. Points de vente (POS) : si les insights POS détaillent sessions, panier moyen, mix paiements ou écarts de caisse, intègre-les comme inducteur de trésorerie. Signale les écarts de caisse et les sessions non scellées comme points à vérifier.
11. Chaque carte contient un champ "status" (neutral/ok/watch/alert) et "status_reason" calculés par le système de gouvernance. Priorise les cartes en "watch" ou "alert" dans ta synthèse. Le headline doit refléter le point de gouvernance le plus critique. Si un insight GOUVERNANCE est présent, intègre-le dans ton analyse. Ne contredis jamais un statut de gouvernance.`

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
		pos, hasPOS := cardVal(cards, "pos_shops")
		// Pas de données analysables si toutes les cartes métier clés sont absentes ou à zéro
		if (!hasBiz || biz == 0) && (!hasCash || cash == 0) && (!hasTaxes || taxes == 0) && (!hasPOS || pos == 0) {
			return noDataFlash(), nil
		}
	}

	userPrompt := c.buildUserPrompt(ctx, effective, focusCard, focusCardDetails, dashboardDetails)
	promptChars := utf8.RuneCountInString(userPrompt) + utf8.RuneCountInString(systemPrompt)
	genStart := time.Now()

	payload := map[string]interface{}{
		"model": "mistral",
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
		"temperature":       0.45,
		"max_tokens":        1024,
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

	isCockpit := focusCard == ""

	logDegraded := func(reason string) {
		slog.Warn("event=diva_gen", "gen", "degraded", "reason", reason,
			"prompt_chars", promptChars, "llm_latency_ms", time.Since(genStart).Milliseconds())
	}

	resp, err := c.client.Do(req)
	if err != nil {
		if isTimeout(err) {
			if isCockpit {
				logDegraded("mistral_timeout")
				return degradedFlash(cards, dashboardDetails), nil
			}
			return models.Flash{}, ErrMistralTimeout
		}
		if isCockpit {
			logDegraded("mistral_unavailable")
			return degradedFlash(cards, dashboardDetails), nil
		}
		return models.Flash{}, ErrMistralUnavailable
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusRequestTimeout || resp.StatusCode == http.StatusGatewayTimeout {
		if isCockpit {
			logDegraded("mistral_gateway_timeout")
			return degradedFlash(cards, dashboardDetails), nil
		}
		return models.Flash{}, ErrMistralTimeout
	}
	if resp.StatusCode != http.StatusOK {
		if isCockpit {
			logDegraded(fmt.Sprintf("mistral_http_%d", resp.StatusCode))
			return degradedFlash(cards, dashboardDetails), nil
		}
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
		if isCockpit {
			logDegraded("bad_json_decode")
			return degradedFlash(cards, dashboardDetails), nil
		}
		return fallbackFlash(), err
	}
	if len(chatResp.Choices) == 0 {
		if isCockpit {
			logDegraded("empty_choices")
			return degradedFlash(cards, dashboardDetails), nil
		}
		return fallbackFlash(), nil
	}

	outputContent := chatResp.Choices[0].Message.Content
	flash, parseErr := parseFlash(outputContent, effective)
	latencyMs := time.Since(genStart).Milliseconds()

	// Cockpit : enrichir le flash si Mistral a retourné un JSON tronqué (what_i_see/to_check vides)
	if isCockpit && (len(flash.WhatISee) == 0 || len(flash.ToCheck) == 0) && dashboardDetails != nil {
		flash = enrichFlashWithInsights(flash, effective, dashboardDetails)
	}

	if isCockpit && flash.Headline == "Lecture DIVA temporairement indisponible." {
		logDegraded("llm_output_rejected")
		return degradedFlash(cards, dashboardDetails), nil
	}

	slog.Info("event=diva_gen", "gen", "called",
		"prompt_chars", promptChars,
		"output_chars", utf8.RuneCountInString(outputContent),
		"llm_latency_ms", latencyMs,
		"degraded", flash.Degraded)

	return flash, parseErr
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

func cardStatus(cards []models.Card, key string) (status, reason string) {
	for _, c := range cards {
		if c.Key == key {
			return c.Status, c.StatusReason
		}
	}
	return "", ""
}

func fmtPct(v float64) string { return fmt.Sprintf("%.1f%%", v) }

func fmtEUR(v float64) string {
	abs := math.Abs(v)
	intPart := int64(math.Floor(abs))
	decPart := int64(math.Round((abs - float64(intPart)) * 100))
	s := fmt.Sprintf("%d", intPart)
	// Séparateur de milliers = espace (norme française)
	var b strings.Builder
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte(' ')
		}
		b.WriteRune(c)
	}
	formatted := b.String()
	if v < 0 {
		formatted = "-" + formatted
	}
	if decPart > 0 {
		return formatted + "," + fmt.Sprintf("%02d", decPart) + " €"
	}
	return formatted + " €"
}

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

	totalCA := biz
	if hasPOS && pos > 0 {
		totalCA += pos
	}
	hasTotalCA := hasBiz || (hasPOS && pos > 0)

	if hasBiz && biz == 0 && hasPOS && pos > 0 {
		insights = append(insights, fmt.Sprintf(
			"Activité commerciale: aucune facturation classique, le CA provient exclusivement du POS (%s)",
			fmtEUR(pos)))
	}

	if hasCash && hasTotalCA {
		spread := cash - totalCA
		if spread > 0 {
			insights = append(insights, fmt.Sprintf(
				"Écart trésorerie/activité: le solde de trésorerie (%s) dépasse l'activité commerciale totale (%s) de %s",
				fmtEUR(cash), fmtEUR(totalCA), fmtEUR(spread)))
		} else if spread < 0 {
			insights = append(insights, fmt.Sprintf(
				"Écart trésorerie/activité: l'activité commerciale totale (%s) dépasse le solde de trésorerie (%s) de %s",
				fmtEUR(totalCA), fmtEUR(cash), fmtEUR(absVal(spread))))
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

	// --- AR by Partner (Encours & Retard) — 1 insight max (SPEC S4.2) ---
	arDetails := extractARDetails(details)
	if arDetails != nil && arDetails.overdueAmount > 0 {
		msg := fmt.Sprintf("AR à risque: %s en retard sur %d partenaire(s)",
			fmtEUR(arDetails.overdueAmount), arDetails.overdueCount)
		if arDetails.topPartnerName != "" {
			msg += fmt.Sprintf(", principal débiteur %s (%s)", arDetails.topPartnerName, fmtEUR(arDetails.topOverdueAmount))
		}
		msg += "."
		insights = append(insights, msg)
	}

	// Synthèse de gouvernance — statuts déterministes transmis par Linky
	var watchCards []string
	var alertCards []string
	for _, c := range cards {
		switch c.Status {
		case "watch":
			watchCards = append(watchCards, fmt.Sprintf("%s (%s)", c.Label, c.StatusReason))
		case "alert":
			alertCards = append(alertCards, fmt.Sprintf("%s (%s)", c.Label, c.StatusReason))
		}
	}
	if len(alertCards) > 0 {
		insights = append(insights, fmt.Sprintf("GOUVERNANCE CRITIQUE: %s", strings.Join(alertCards, " | ")))
	}
	if len(watchCards) > 0 {
		insights = append(insights, fmt.Sprintf("GOUVERNANCE — points d'attention: %s", strings.Join(watchCards, " | ")))
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

type arDetailsData struct {
	openAmount       float64
	overdueAmount    float64
	overdueCount     int
	topPartnerName   string
	topOverdueAmount float64
}

func extractARDetails(details map[string]interface{}) *arDetailsData {
	if details == nil {
		return nil
	}
	bus, ok := details["business"].(map[string]interface{})
	if !ok || bus == nil {
		return nil
	}
	ar, ok := bus["ar_by_partner"].(map[string]interface{})
	if !ok || ar == nil {
		return nil
	}
	totals, ok := ar["totals"].(map[string]interface{})
	if !ok {
		return nil
	}
	d := &arDetailsData{}
	d.openAmount = toFloat(totals["open_amount"])
	d.overdueAmount = toFloat(totals["overdue_amount"])
	if d.overdueAmount <= 0 {
		return d
	}
	partnersRaw, ok := ar["partners"].([]interface{})
	if !ok {
		return d
	}
	// Compter partenaires en retard et garder le plus gros
	for _, p := range partnersRaw {
		pm, ok := p.(map[string]interface{})
		if !ok {
			continue
		}
		ov := toFloat(pm["overdue_amount"])
		if ov > 0 {
			d.overdueCount++
			if ov > d.topOverdueAmount {
				d.topOverdueAmount = ov
				d.topPartnerName = toString(pm["partner_name"])
				if d.topPartnerName == "" {
					d.topPartnerName = toString(pm["partner_id"])
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

	ctxMap := map[string]interface{}{
		"tenant":     ctx.Tenant,
		"scope":      scope,
		"date_start": ctx.DateStart,
		"date_end":   ctx.DateEnd,
		"currency":   ctx.Currency,
	}
	if ctx.PartnerName != "" {
		ctxMap["partner_name"] = ctx.PartnerName
	}
	payload := userPromptPayload{
		Mode: mode,
		Context: ctxMap,
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
		if card.Status != "" {
			m["status"] = card.Status
			m["status_reason"] = card.StatusReason
		}
		payload.Cards = append(payload.Cards, m)
	}

	if mode == "cockpit" {
		insights := computeInsights(cards, dashboardDetails)
		if len(insights) > 10 {
			insights = insights[:10]
		}
		payload.Insights = insights
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

// isHeadlineJSONGarbage — évite de renvoyer ou persister un headline contenant du JSON brut ({, ", etc.)
func isHeadlineJSONGarbage(s string) bool {
	s = strings.TrimSpace(s)
	if s == "" || s == "{" || s == "}" || s == `"` {
		return true
	}
	if strings.HasPrefix(s, "{") || strings.HasPrefix(s, `"`) {
		return true
	}
	return false
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

	// JSON tronqué : tenter de récupérer le headline via regex
	if strings.HasPrefix(strings.TrimSpace(content), "{") {
		if hl := extractHeadlineFromTruncatedJSON(content); hl != "" {
			san := sanitizeHeadline(hl)
			if isHeadlineJSONGarbage(san) {
				return fallbackFlash(), nil
			}
			return models.Flash{
				Headline:   san,
				WhatISee:   []string{},
				ToCheck:    []string{},
				Confidence: computeConfidence(cards),
			}, nil
		}
	}

	headline := strings.TrimSpace(content)
	if len(headline) > 1200 {
		headline = headline[:1197] + "..."
	}
	if headline != "" && !forbiddenTerms.MatchString(headline) && !englishDetect.MatchString(headline) {
		san := sanitizeHeadline(headline)
		if isHeadlineJSONGarbage(san) {
			return fallbackFlash(), nil
		}
		return models.Flash{
			Headline:   san,
			WhatISee:   []string{},
			ToCheck:    []string{},
			Confidence: computeConfidence(cards),
		}, nil
	}

	return fallbackFlash(), nil
}

var headlineExtract = regexp.MustCompile(`"headline"\s*:\s*"((?:[^"\\]|\\.)*)"`)

func extractHeadlineFromTruncatedJSON(s string) string {
	m := headlineExtract.FindStringSubmatch(s)
	if len(m) < 2 {
		return ""
	}
	hl := strings.ReplaceAll(m[1], `\"`, `"`)
	hl = strings.ReplaceAll(hl, `\\`, `\`)
	return strings.TrimSpace(hl)
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

const maxFlashTotalChars = 600

func validateAndBuildFlash(raw flashRaw, cards []models.Card) (models.Flash, error) {
	if isHeadlineJSONGarbage(raw.Headline) {
		return fallbackFlash(), nil
	}
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
	for textLength(raw) > maxFlashTotalChars && len(raw.WhatISee) > 1 {
		raw.WhatISee = raw.WhatISee[:len(raw.WhatISee)-1]
	}
	headline := sanitizeHeadline(raw.Headline)
	if headline == "" || isHeadlineJSONGarbage(headline) {
		return fallbackFlash(), nil
	}
	return models.Flash{
		Headline:   headline,
		WhatISee:   raw.WhatISee,
		ToCheck:    raw.ToCheck,
		Confidence: conf,
	}, nil
}

var leadingOrphanPunct = regexp.MustCompile(`^\s*[,;]\s*`)

var metaNotePattern = regexp.MustCompile(`(?i)\s*\([^)]*(?:note\s*:|accordance|given rules|did not mention|instruction|constraint)[^)]*\)\s*`)

const maxHeadlineChars = 140

func sanitizeHeadline(s string) string {
	s = metaNotePattern.ReplaceAllString(s, " ")
	for _, re := range dateRangePatterns {
		s = re.ReplaceAllString(s, " ")
	}
	s = strings.TrimSpace(s)
	s = leadingOrphanPunct.ReplaceAllString(s, "")
	s = strings.TrimSpace(strings.TrimSuffix(s, ","))
	if isHeadlineJSONGarbage(s) {
		return ""
	}
	if runes := []rune(s); len(runes) > maxHeadlineChars {
		cut := maxHeadlineChars - 3
		for cut > 0 && runes[cut] != ' ' {
			cut--
		}
		if cut == 0 {
			cut = maxHeadlineChars - 3
		}
		s = string(runes[:cut]) + "..."
	}
	return s
}

func fallbackFlash() models.Flash {
	return models.Flash{
		Headline:   "Lecture DIVA temporairement indisponible.",
		WhatISee:   []string{},
		ToCheck:    []string{},
		Confidence: "low",
	}
}

// enrichFlashWithInsights complète what_i_see et to_check à partir de computeInsights
// quand Mistral a retourné un JSON tronqué (headline seul). Ne modifie pas le headline.
func enrichFlashWithInsights(flash models.Flash, cards []models.Card, details map[string]interface{}) models.Flash {
	insights := computeInsights(cards, details)
	if len(insights) == 0 {
		return flash
	}
	if len(flash.WhatISee) == 0 {
		var items []string
		for _, ins := range insights {
			if strings.HasPrefix(ins, "POINT DOMINANT:") {
				continue
			}
			if strings.HasPrefix(ins, "GOUVERNANCE — points d'attention: ") {
				parts := strings.Split(strings.TrimPrefix(ins, "GOUVERNANCE — points d'attention: "), " | ")
				for _, p := range parts {
					p = strings.TrimSpace(p)
					if p != "" {
						items = append(items, "• "+p)
					}
				}
				continue
			}
			if strings.HasPrefix(ins, "GOUVERNANCE CRITIQUE:") {
				continue
			}
			items = append(items, ins)
			if len(items) >= 5 {
				break
			}
		}
		flash.WhatISee = items
	}
	if len(flash.ToCheck) == 0 {
		for _, ins := range insights {
			if len(flash.ToCheck) >= 2 {
				break
			}
			low := strings.ToLower(ins)
			if strings.Contains(low, "alerte") || strings.Contains(low, "conformité") || strings.Contains(low, "absence") || strings.Contains(low, "gouvernance") {
				flash.ToCheck = append(flash.ToCheck, ins)
			}
		}
	}
	return flash
}

func degradedFlash(cards []models.Card, details map[string]interface{}) models.Flash {
	insights := computeInsights(cards, details)
	if len(insights) == 0 {
		f := noDataFlash()
		f.Degraded = true
		return f
	}

	headline := insights[0]
	if strings.HasPrefix(headline, "POINT DOMINANT: ") {
		headline = strings.TrimPrefix(headline, "POINT DOMINANT: ")
	}
	headline = sanitizeHeadline(headline)

	maxBody := 3
	if len(insights) < maxBody {
		maxBody = len(insights)
	}
	whatISee := make([]string, maxBody)
	copy(whatISee, insights[:maxBody])

	var toCheck []string
	for _, ins := range insights {
		if len(toCheck) >= 2 {
			break
		}
		low := strings.ToLower(ins)
		if strings.Contains(low, "alerte") || strings.Contains(low, "conformité") || strings.Contains(low, "absence") {
			toCheck = append(toCheck, ins)
		}
	}

	return models.Flash{
		Headline:   headline,
		WhatISee:   whatISee,
		ToCheck:    toCheck,
		Confidence: computeConfidence(cards),
		Degraded:   true,
	}
}
