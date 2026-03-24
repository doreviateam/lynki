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
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/doreviateam/diva/internal/facts"
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

// forbiddenTerms — niveau 1 : rejet automatique (injonctions + prescriptions + anglicismes structurels).
// Les qualificatifs (niveau 2) sont découragés dans le prompt mais pas rejetés ici.
var forbiddenTerms = regexp.MustCompile(`(?i)(vous devez|il faut|obligatoire de|obligatoirement|devraient être|il conviendrait|nécessite une action|sanction|assessment|framework|overview|compliance|hinge on|strategic overview)`)

// englishDetect — cible les mots structurels anglais (articles, pronoms, modaux).
// Les termes métier tolérés en français (cash, business, POS, KPI) ne sont PAS dans ce regex.
var englishDetect = regexp.MustCompile(`(?i)\b(the |\.the | of the | and the | is | are | has been| have been| this | that | which | their | should | could | would | monitor | investigate | determine | ensure | remains | turnover| need to | based on | due to | in order to | it is | there is | there are | as well as | for further | recommend | suggest | review | however | therefore | furthermore | additionally)\b`)

// lynkiForbiddenUserTerms — niveau 3 : termes interdits en sortie user (GLOSSAIRE_LYNKI_DIVA §2).
// Appliqué au headline (rejet) et aux champs what_i_see / to_check (substitution ciblée).
var lynkiForbiddenUserTerms = regexp.MustCompile(`(?i)\b(business|AR à risque|watch|issue|payload|runner|cache hit|fallback|prompt|headline|stale|refresh job|debug)\b`)

// lynkiSubstitutions — remplacements ciblés pour what_i_see / to_check (LANG-06).
// Politique : remplacement simple si possible, sinon le champ est omis (fallback par omission).
var lynkiSubstitutions = [][2]string{
	{"business", "activité commerciale"},
	{"Business", "Activité commerciale"},
	{"AR à risque", "créances à risque"},
	{"watch", "à surveiller"},
	{"Watch", "À surveiller"},
	{"issue", "point de vigilance"},
	{"Issue", "Point de vigilance"},
	{"fallback", "mode dégradé"},
	{"stale", "périmé"},
	{"refresh job", "actualisation"},
	{"cache hit", "lecture en cache"},
	{"payload", "données transmises"},
	{"runner", "moteur de calcul"},
	{"prompt", "consigne"},
	{"headline", "phrase d'ouverture"},
	{"debug", "diagnostic"},
}

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
	timeoutMs := 180000
	if s := os.Getenv("MISTRAL_TIMEOUT_MS"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			timeoutMs = n
		}
	}
	return &Client{
		baseURL: strings.TrimSuffix(base, "/"),
		client: &http.Client{
			Timeout: time.Duration(timeoutMs) * time.Millisecond,
		},
	}
}

// systemPrompt — mode card (analyse ciblée d'une carte unique). Phase 2.
const systemPrompt = `LANGUE : français exclusivement. Aucun anglais dans les champs JSON.

Tu es contrôleur de gestion senior. Tu analyses une carte financière spécifique d'une PME.

FORMAT STRICT — JSON valide uniquement, sans balise markdown :
{
  "headline": "1 phrase factuelle sur la carte analysée",
  "what_i_see": ["Inducteur 1", "Inducteur 2", "Inducteur 3"],
  "to_check": ["Vigilance 1", "Vigilance 2"],
  "confidence": "low|medium|high"
}

RÈGLES :
1. headline : 1 phrase, élément dominant de la carte. Pas de listing.
2. what_i_see : 3–4 lignes. Reformule les données fournies avec ratios. Aucune répétition du headline.
3. to_check : max 2. Écarts, absences ou incohérences factuelles uniquement. Jamais de conseil.
4. Ne calcule AUCUN ratio non fourni. Utilise UNIQUEMENT les données de la carte transmise.
5. Vocabulaire : "représente", "s'élève à", "soit X % du CA", "dépasse", "écart de", "non rapproché", "absence de".
6. Aucun conseil, prescription ni injonction ("il faut", "vous devez", "devrait", "obligatoire").
7. La trésorerie est l'indicateur central. Les autres cartes (activité commerciale, taxes, remboursements, POS, EBE, encours, BFR) sont des inducteurs. Structure ton analyse autour de cette hiérarchie.
8. Activité totale = activité commerciale (facturation) + POS. Si activité commerciale = 0 et POS > 0, signaler canal POS exclusif.
9. Statuts de gouvernance (à surveiller / vigilance) : prioritiser dans le headline. Ne jamais contredire un statut.
10. Si data_completeness.bank_health_metrics = "absent", mentionner dans what_i_see ou to_check.`

// systemPromptFactsPack — Phase 2 : persona contrôleur de gestion, style rédigé (prose naturelle).
const systemPromptFactsPack = `LANGUE : français uniquement.
Tu es contrôleur de gestion senior. JSON valide uniquement, sans markdown.

FORMAT :
{"headlines":["A","B","C"],"headline":"=headlines[0]","what_i_see":["Ph1.","Ph2.","Ph3."],"to_check":["V1."],"confidence":"low|medium|high"}

RÈGLES IMPÉRATIVES :
H. headlines = 3 reformulations du headline_candidate (angle avance / angle écart / angle position). INTERDIT "dépasse l'activité" dans le headline — écrire "conserve une avance de Z €" ou "reste supérieure au niveau d'activité". Tout montant du headline doit figurer dans metrics.
W. what_i_see : 2–3 phrases. Ordre : (1) créances clients si présentes, (2) trésorerie nette/taxes, (3) autre fait utile. Chaque montant tracé dans facts ou metrics. Jamais d'étiquette seule.
T. to_check : max 2 vigilances métier. Reprendre les alerts tels quels. Vide si alerts vide.
G. Vigilances gouvernance (faits "Vigilance X" ou "Alerte X") : reformuler en phrase utile OU omettre. JAMAIS copier verbatim. Ex correct : "Une partie des encaissements reste à confirmer." Ex interdit : "Vigilance Cash : Cash partiellement validé."
Z. zero_cards = cards présentes à valeur zéro — ne pas commenter sauf si signal utile.
X. Interdit : conseils, anglicismes, "CA" seul, calculs inventés, "trésorerie disponible", "...".`

var maxTokensByOutputMode = map[string]int{
	"short":        650, // JSON compact : 3 headlines + 3 what_i_see + 2 to_check
	"professional": 750,
	"deep":         900,
}

// RawChat envoie un prompt au LLM et retourne la réponse brute (texte).
// Utilisé pour la reformulation optionnelle (Sprint 12 T69).
func (c *Client) RawChat(prompt string) (string, error) {
	payload := map[string]interface{}{
		"model": "mistral",
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"temperature": 0.3,
		"max_tokens":  500,
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", c.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("mistral raw chat: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("mistral raw chat status %d", resp.StatusCode)
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("mistral raw chat decode: %w", err)
	}
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("mistral raw chat: no choices")
	}
	return strings.TrimSpace(result.Choices[0].Message.Content), nil
}

func (c *Client) Chat(ctx models.Context, cards []models.Card, focusCard string, focusCardDetails map[string]interface{}, dashboardDetails map[string]interface{}, outputMode string, fp *facts.FactsPack, contextHash string, generationReason string) (models.Flash, error) {
	if outputMode == "" {
		outputMode = "short"
	}
	maxTokens := maxTokensByOutputMode[outputMode]
	if maxTokens == 0 {
		maxTokens = 450
	}
	effective := cards
	if focusCard != "" {
		for _, card := range cards {
			if card.Key == focusCard {
				effective = []models.Card{card}
				break
			}
		}
	}
	isCockpit := focusCard == ""
	if isCockpit {
		biz, hasBiz := cardVal(cards, "business")
		cash, hasCash := cardVal(cards, "cash")
		taxes, hasTaxes := cardVal(cards, "taxes")
		pos, hasPOS := cardVal(cards, "pos_shops")
		// Pas de données analysables si toutes les cartes métier clés sont absentes ou à zéro
		if (!hasBiz || biz == 0) && (!hasCash || cash == 0) && (!hasTaxes || taxes == 0) && (!hasPOS || pos == 0) {
			return noDataFlash(), nil
		}
	}

	var userPrompt string
	var sysPrompt string
	if isCockpit && fp != nil {
		userPrompt = c.buildUserPromptFromFactsPack(fp, outputMode)
		sysPrompt = systemPromptFactsPack
	} else {
		userPrompt = c.buildUserPrompt(ctx, effective, focusCard, focusCardDetails, dashboardDetails)
		sysPrompt = systemPrompt
	}
	promptChars := utf8.RuneCountInString(userPrompt) + utf8.RuneCountInString(sysPrompt)
	genStart := time.Now()

	payload := map[string]interface{}{
		"model": "mistral",
		"messages": []map[string]string{
			{"role": "system", "content": sysPrompt},
			{"role": "user", "content": userPrompt},
		},
		"temperature":       0.45,
		"max_tokens":        maxTokens,
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

	logDegraded := func(reason string) {
		slog.Warn("event=diva_gen", "gen", "degraded", "reason", reason,
			"context_hash", contextHash, "generation_reason", generationReason,
			"prompt_chars", promptChars, "llm_latency_ms", time.Since(genStart).Milliseconds(),
			"fallback_level", reason)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		if isTimeout(err) {
			if isCockpit {
				logDegraded("mistral_timeout")
				return c.degradedFlashForCockpit(fp, cards, dashboardDetails), nil
			}
			return models.Flash{}, ErrMistralTimeout
		}
		if isCockpit {
			logDegraded("mistral_unavailable")
			return c.degradedFlashForCockpit(fp, cards, dashboardDetails), nil
		}
		return models.Flash{}, ErrMistralUnavailable
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusRequestTimeout || resp.StatusCode == http.StatusGatewayTimeout {
		if isCockpit {
			logDegraded("mistral_gateway_timeout")
			return c.degradedFlashForCockpit(fp, cards, dashboardDetails), nil
		}
		return models.Flash{}, ErrMistralTimeout
	}
	if resp.StatusCode != http.StatusOK {
		if isCockpit {
			logDegraded(fmt.Sprintf("mistral_http_%d", resp.StatusCode))
			return c.degradedFlashForCockpit(fp, cards, dashboardDetails), nil
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
			return c.degradedFlashForCockpit(fp, cards, dashboardDetails), nil
		}
		return fallbackFlash(), err
	}
	if len(chatResp.Choices) == 0 {
		if isCockpit {
			logDegraded("empty_choices")
			return c.degradedFlashForCockpit(fp, cards, dashboardDetails), nil
		}
		return fallbackFlash(), nil
	}

	outputContent := chatResp.Choices[0].Message.Content
	var metricsManifest map[string]float64
	if fp != nil {
		metricsManifest = fp.Metrics
	}
	flash, parseErr := parseFlash(outputContent, effective, metricsManifest)
	latencyMs := time.Since(genStart).Milliseconds()

	// Cockpit : enrichir le flash si Mistral a retourné un JSON tronqué (what_i_see/to_check vides)
	if isCockpit && (len(flash.WhatISee) == 0 || len(flash.ToCheck) == 0) && dashboardDetails != nil {
		flash = enrichFlashWithInsights(flash, effective, dashboardDetails)
	}

	if isCockpit && flash.Headline == "Lecture DIVA temporairement indisponible." {
		logDegraded("llm_output_rejected")
		return c.degradedFlashForCockpit(fp, cards, dashboardDetails), nil
	}

	slog.Info("event=diva_gen", "gen", "called",
		"context_hash", contextHash, "generation_reason", generationReason,
		"prompt_chars", promptChars,
		"output_chars", utf8.RuneCountInString(outputContent),
		"llm_latency_ms", latencyMs,
		"degraded", flash.Degraded,
		"fallback_level", "none")

	return flash, parseErr
}

// userPromptPayload — structure JSON envoyée à l'IA (mode cockpit ou card).
type userPromptPayload struct {
	Mode             string                   `json:"mode"`
	Context          map[string]interface{}   `json:"context"`
	Cards            []map[string]interface{} `json:"cards"`
	Insights         []string                 `json:"insights,omitempty"`
	Details          map[string]interface{}   `json:"details,omitempty"`
	DataCompleteness map[string]interface{}   `json:"data_completeness,omitempty"` // Cockpit v1.1 — bank_health_metrics
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

func extractDataCompleteness(details map[string]interface{}) *facts.DataCompleteness {
	if details == nil {
		return nil
	}
	if dc, ok := details["data_completeness"].(map[string]interface{}); ok && dc != nil {
		bhm := "absent"
		if s, ok := dc["bank_health_metrics"].(string); ok && s != "" {
			bhm = s
		}
		return &facts.DataCompleteness{BankHealthMetrics: bhm}
	}
	if dc, ok := details["data_completeness"].(*models.DataCompleteness); ok && dc != nil {
		bhm := dc.BankHealthMetrics
		if bhm == "" {
			bhm = "absent"
		}
		return &facts.DataCompleteness{BankHealthMetrics: bhm}
	}
	return nil
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
		ctxMeta := facts.ContextMeta{
			Tenant:    ctx.Tenant,
			CompanyID: ctx.CompanyID,
			DateStart: ctx.DateStart,
			DateEnd:   ctx.DateEnd,
			Currency:  ctx.Currency,
		}
		dc := extractDataCompleteness(dashboardDetails)
		fp := facts.BuildFactsPack(cards, dashboardDetails, dc, ctxMeta)
		payload.Insights = fp.Messages()
		// data_completeness — Cockpit v1.1 (bank_health_metrics: absent/partial/complete)
		if dc, ok := dashboardDetails["data_completeness"].(map[string]interface{}); ok && dc != nil {
			payload.DataCompleteness = dc
		} else if dc, ok := dashboardDetails["data_completeness"].(*models.DataCompleteness); ok && dc != nil {
			payload.DataCompleteness = map[string]interface{}{"bank_health_metrics": dc.BankHealthMetrics}
		} else if payload.DataCompleteness == nil {
			payload.DataCompleteness = map[string]interface{}{"bank_health_metrics": "absent"}
		}
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
		return "Mode: card. Analyse la carte ciblée. Réponds UNIQUEMENT en français. JSON strict."
	}
	return "Mode: cockpit. Analyse globale à partir des données et insights pré-calculés. Réponds UNIQUEMENT en français. JSON strict."
}

// factsPackPayloadV2 — payload structuré Niveau 1 pour Mistral (SPEC Phase 2).
// headline_candidate = fait dominant pré-calculé côté Go.
// metrics = manifest de traçabilité : TOUS les montants de l'insight doivent matcher une entrée (±0,01 €).
// facts = top 3 inducteurs/trésorerie.
// alerts = top 2 vigilances gouvernance.
type factsPackPayloadV2 struct {
	OutputMode        string                 `json:"output_mode"`
	HeadlineCandidate string                 `json:"headline_candidate,omitempty"`
	Metrics           map[string]float64     `json:"metrics,omitempty"`
	ZeroCards         []string               `json:"zero_cards,omitempty"`
	Facts             []string               `json:"facts"`
	Alerts            []string               `json:"alerts,omitempty"`
	DataCompleteness  map[string]interface{} `json:"data_completeness"`
}

// buildUserPromptFromFactsPack construit le prompt user structuré Niveau 1 depuis FactsPack.
// Mistral reçoit un headline_candidate, top 3 faits, top 2 alertes — pas toute la soupe.
func (c *Client) buildUserPromptFromFactsPack(fp *facts.FactsPack, outputMode string) string {
	if fp == nil {
		return `{"output_mode":"short","facts":[],"error":"no facts"}`
	}
	if outputMode == "" {
		outputMode = "short"
	}
	dc := map[string]interface{}{"bank_health_metrics": "absent"}
	if fp.DataCompleteness != nil && fp.DataCompleteness.BankHealthMetrics != "" {
		dc["bank_health_metrics"] = fp.DataCompleteness.BankHealthMetrics
	}

	// Ranking côté Go : top 3 faits inducteurs + top 2 vigilances gouvernance
	topFacts := fp.TopFacts(5)
	topAlerts := fp.TopAlerts(2)

	factsStr := make([]string, len(topFacts))
	for i, f := range topFacts {
		factsStr[i] = f.Message
	}
	alertsStr := make([]string, len(topAlerts))
	for i, a := range topAlerts {
		alertsStr[i] = a.Message
	}

	payload := factsPackPayloadV2{
		OutputMode:        outputMode,
		HeadlineCandidate: fp.HeadlineCandidate(),
		Metrics:           fp.Metrics,
		ZeroCards:         fp.ZeroCards,
		Facts:             factsStr,
		Alerts:            alertsStr,
		DataCompleteness:  dc,
	}
	instruction := c.buildInstructionFactsPack(outputMode)
	raw, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return `{"output_mode":"` + outputMode + `","error":"marshal failed"}`
	}
	return instruction + "\n\n" + string(raw)
}

func (c *Client) buildInstructionFactsPack(outputMode string) string {
	switch outputMode {
	case "professional":
		return "Reformule en contrôleur de gestion senior. headline = headline_candidate reformulé. what_i_see : 3–4 inducteurs depuis facts. to_check : alerts fournis (max 2). JSON strict, français uniquement."
	case "deep":
		return "Synthèse contrôleur de gestion étendue. headline = headline_candidate. what_i_see : tous les facts (max 5). to_check : alerts (max 2). JSON strict, français uniquement."
	default:
		return "Reformule en contrôleur de gestion. headline = headline_candidate reformulé. what_i_see : 3 inducteurs depuis facts. to_check : alerts (max 2). JSON strict, français uniquement."
	}
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

func parseFlash(content string, cards []models.Card, metrics map[string]float64) (models.Flash, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return fallbackFlash(), nil
	}

	jsonStr := extractJSON(content)
	var raw flashRaw
	if jsonStr != "" {
		if err := json.Unmarshal([]byte(jsonStr), &raw); err == nil && raw.Headline != "" {
			return validateAndBuildFlash(raw, cards, metrics)
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
	Headlines  []string `json:"headlines"`
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

func validateAndBuildFlash(raw flashRaw, cards []models.Card, metrics map[string]float64) (models.Flash, error) {
	// Si headlines[] est présent et non vide, utiliser headlines[0] comme headline principal.
	if len(raw.Headlines) > 0 && strings.TrimSpace(raw.Headlines[0]) != "" {
		raw.Headline = strings.TrimSpace(raw.Headlines[0])
	}
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
	// LANG-06 — politique par champ :
	// headline : rejet immédiat si terme interdit Lynki détecté.
	if lynkiForbiddenUserTerms.MatchString(headline) {
		slog.Warn("LANG-06 headline rejeté: terme interdit Lynki", "match", lynkiForbiddenUserTerms.FindString(headline))
		return fallbackFlash(), nil
	}
	// METRIC — validation des montants du headline contre le manifest de traçabilité.
	// Tout montant en euros dans le headline doit figurer dans metrics (±0,02 €).
	if len(metrics) > 0 {
		amounts := extractEuroAmounts(headline)
		for _, amt := range amounts {
			if !isAmountInManifest(amt, metrics) {
				slog.Warn("METRIC headline rejeté: montant non traçable", "amount", amt, "headline", headline)
				return fallbackFlash(), nil
			}
		}
		// what_i_see / to_check : omettre toute phrase contenant un montant non traçable (évite écarts faux type 23 814,68 au lieu de 23 515,64).
		raw.WhatISee = filterItemsWithTraceableAmounts(raw.WhatISee, metrics)
		raw.ToCheck = filterItemsWithTraceableAmounts(raw.ToCheck, metrics)
	}
	// what_i_see / to_check : substitution ciblée, puis omission si terme interdit résiduel.
	raw.WhatISee = applyLynkiSubstitutions(raw.WhatISee)
	raw.ToCheck = applyLynkiSubstitutions(raw.ToCheck)

	// Valider et nettoyer les headlines alternatives.
	var validHeadlines []string
	for _, hl := range raw.Headlines {
		hl = sanitizeHeadline(hl)
		if hl == "" || isHeadlineJSONGarbage(hl) || lynkiForbiddenUserTerms.MatchString(hl) {
			continue
		}
		if len(metrics) > 0 {
			amounts := extractEuroAmounts(hl)
			valid := true
			for _, amt := range amounts {
				if !isAmountInManifest(amt, metrics) {
					valid = false
					break
				}
			}
			if !valid {
				continue
			}
		}
		validHeadlines = append(validHeadlines, hl)
	}

	return models.Flash{
		Headline:   headline,
		Headlines:  validHeadlines,
		WhatISee:   raw.WhatISee,
		ToCheck:    raw.ToCheck,
		Confidence: conf,
	}, nil
}

// filterItemsWithTraceableAmounts ne garde que les items dont tous les montants en €
// figurent dans le manifest (±0,02 €). Sinon l'item est omis et loggé (évite écarts faux en what_i_see).
func filterItemsWithTraceableAmounts(items []string, metrics map[string]float64) []string {
	if len(metrics) == 0 {
		return items
	}
	result := make([]string, 0, len(items))
	for _, item := range items {
		amounts := extractEuroAmounts(item)
		allOK := true
		for _, amt := range amounts {
			if !isAmountInManifest(amt, metrics) {
				slog.Warn("METRIC item omis: montant non traçable", "amount", amt, "item", item)
				allOK = false
				break
			}
		}
		if allOK {
			result = append(result, item)
		}
	}
	return result
}

// applyLynkiSubstitutions applique les remplacements du glossaire Lynki (LANG-06),
// puis filtre les items qui contiendraient encore un terme interdit après substitution.
func applyLynkiSubstitutions(items []string) []string {
	result := make([]string, 0, len(items))
	for _, item := range items {
		cleaned := item
		for _, sub := range lynkiSubstitutions {
			cleaned = strings.ReplaceAll(cleaned, sub[0], sub[1])
		}
		if lynkiForbiddenUserTerms.MatchString(cleaned) {
			slog.Warn("LANG-06 item omis: terme interdit résiduel après substitution", "item", cleaned)
			continue
		}
		result = append(result, cleaned)
	}
	return result
}

// euroAmountPattern extrait les montants en euros (format français : "1 234,56 €" ou "1234,56 €" ou "1 234 €")
var euroAmountPattern = regexp.MustCompile(`([\d][\d\s]*[\d],\d{2})\s*€|([\d]+)\s*€`)

// extractEuroAmounts retourne tous les montants en euros d'un texte (float64, abs value).
func extractEuroAmounts(s string) []float64 {
	matches := euroAmountPattern.FindAllStringSubmatch(s, -1)
	var result []float64
	for _, m := range matches {
		raw := m[1]
		if raw == "" {
			raw = m[2]
		}
		// Supprimer espaces (séparateurs de milliers), remplacer virgule par point
		raw = strings.ReplaceAll(raw, " ", "")
		raw = strings.ReplaceAll(raw, "\u00a0", "")
		raw = strings.ReplaceAll(raw, ",", ".")
		if v, err := strconv.ParseFloat(raw, 64); err == nil {
			result = append(result, math.Abs(v))
		}
	}
	return result
}

// isAmountInManifest vérifie qu'un montant figure dans le manifest Metrics (±0,02 €).
func isAmountInManifest(amount float64, metrics map[string]float64) bool {
	if amount < 0.01 {
		return true // ignorer les montants nuls ou quasi-nuls
	}
	for _, v := range metrics {
		if math.Abs(math.Abs(v)-amount) < 0.02 {
			return true
		}
	}
	return false
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

// enrichFlashWithInsights complète what_i_see et to_check à partir des facts
// quand Mistral a retourné un JSON tronqué (headline seul). Ne modifie pas le headline.
func enrichFlashWithInsights(flash models.Flash, cards []models.Card, details map[string]interface{}) models.Flash {
	fp := facts.BuildFactsPack(cards, details, extractDataCompleteness(details), facts.ContextMeta{})
	insights := fp.Messages()
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

// degradedFlashForCockpit : utilise DegradedFlashFromFactsPack si fp disponible, sinon degradedFlash.
func (c *Client) degradedFlashForCockpit(fp *facts.FactsPack, cards []models.Card, details map[string]interface{}) models.Flash {
	if fp != nil && len(fp.Facts) > 0 {
		return DegradedFlashFromFactsPack(fp, cards)
	}
	return degradedFlash(cards, details)
}

// DegradedFlashFromFactsPack produit une synthèse sans LLM à partir du FactsPack (SPEC v1.2.1).
// headline = premier fait "POINT DOMINANT:" (sans préfixe), sinon Facts[0].Message
// what_i_see = Facts[1:4] (max 3)
// to_check = Facts Category==governance avec alerte/conformité/absence (max 2)
func DegradedFlashFromFactsPack(fp *facts.FactsPack, cards []models.Card) models.Flash {
	if fp == nil || len(fp.Facts) == 0 {
		f := noDataFlash()
		f.Degraded = true
		return f
	}
	msgs := fp.Messages()
	headline := msgs[0]
	if strings.HasPrefix(headline, "POINT DOMINANT: ") {
		headline = strings.TrimPrefix(headline, "POINT DOMINANT: ")
	}
	headline = sanitizeHeadline(headline)

	maxBody := 3
	if len(msgs) < 2 {
		maxBody = 0
	} else if len(msgs) < 4 {
		maxBody = len(msgs) - 1
	}
	whatISee := make([]string, 0, maxBody)
	for i := 1; i < len(msgs) && len(whatISee) < maxBody; i++ {
		whatISee = append(whatISee, msgs[i])
	}

	var toCheck []string
	for _, f := range fp.Facts {
		if len(toCheck) >= 2 {
			break
		}
		if f.Category != "governance" {
			continue
		}
		low := strings.ToLower(f.Message)
		if strings.Contains(low, "alerte") || strings.Contains(low, "conformité") || strings.Contains(low, "absence") {
			toCheck = append(toCheck, f.Message)
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

func degradedFlash(cards []models.Card, details map[string]interface{}) models.Flash {
	fp := facts.BuildFactsPack(cards, details, extractDataCompleteness(details), facts.ContextMeta{})
	return DegradedFlashFromFactsPack(fp, cards)
}
