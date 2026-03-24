package facts

import (
	"strings"
)

// FactsPackVersion — version du format FactsPack pour l'archéologie (comparer hashes v1 vs v2).
const FactsPackVersion = "2.0.0"

// FactsPack — pack de faits déterministes pour le LLM (SPEC v1.2.1).
type FactsPack struct {
	Version          string             `json:"version"`
	Mode             string             `json:"mode"`
	Context          ContextMeta        `json:"context"`
	// Metrics — manifest de traçabilité : chaque montant de l'insight doit matcher une de ces valeurs (±0,01 €).
	// Clés = noms des cards cockpit ou métriques dérivées documentées.
	Metrics          map[string]float64 `json:"metrics,omitempty"`
	// ZeroCards — cards présentes dans le cockpit mais dont la valeur est 0 confirmée (non manquante).
	// Mistral doit les ignorer pour la narration mais savoir qu'elles existent.
	ZeroCards        []string           `json:"zero_cards,omitempty"`
	Facts            []Fact             `json:"facts"`
	DataCompleteness *DataCompleteness  `json:"data_completeness,omitempty"`
}

// Fact — un fait financier avec priorité et catégorie pour tri stable.
type Fact struct {
	Priority int    `json:"priority"` // 1=treasury, 2=governance, 3=tax/pos/ar, 4=complémentaire
	Category string `json:"category"`  // governance | treasury | tax | pos | ar
	Message  string `json:"message"`
}

// ContextMeta — métadonnées de contexte (tenant, dates).
type ContextMeta struct {
	Tenant     string `json:"tenant"`
	CompanyID  int    `json:"company_id"`
	DateStart  string `json:"date_start"`
	DateEnd    string `json:"date_end"`
	Currency   string `json:"currency,omitempty"`
}

// DataCompleteness — complétude des données (axe discipline).
type DataCompleteness struct {
	BankHealthMetrics string `json:"bank_health_metrics"` // "absent" | "partial" | "complete"
}

// Messages retourne les messages des faits (ordre préservé) pour compatibilité transition.
func (fp *FactsPack) Messages() []string {
	if fp == nil {
		return nil
	}
	msgs := make([]string, len(fp.Facts))
	for i := range fp.Facts {
		msgs[i] = fp.Facts[i].Message
	}
	return msgs
}

// HeadlineCandidate retourne le signal dominant pour le LLM.
// Règle : retourner le premier fait tel quel (après nettoyage du préfixe technique),
// sans recréer d'alias ni changer les noms de métriques.
// Cela garantit que tous les montants du headline_candidate sont traçables au manifest Metrics.
func (fp *FactsPack) HeadlineCandidate() string {
	if fp == nil || len(fp.Facts) == 0 {
		return ""
	}
	msg := fp.Facts[0].Message
	msg = strings.TrimPrefix(msg, "POINT DOMINANT: ")
	msg = strings.TrimSpace(msg)
	// Pour les messages de gouvernance, supprimer après " — " (contexte technique)
	if idx := strings.Index(msg, " — "); idx > 0 {
		msg = strings.TrimSpace(msg[:idx])
	}
	if len([]rune(msg)) > 120 {
		msg = truncateToRunes(msg, 110) + "…"
	}
	return msg
}


func truncateToRunes(s string, max int) string {
	var n int
	for i := range s {
		if n == max {
			return s[:i]
		}
		n++
	}
	return s
}

// TopFacts retourne les N premiers faits non-gouvernance (pour le corps de l'analyse).
// Le headline candidate (premier fait) est exclu si non-governance, pour éviter la redondance.
func (fp *FactsPack) TopFacts(n int) []Fact {
	if fp == nil || n <= 0 {
		return nil
	}
	// Déterminer si le premier fait est déjà le headline (non-governance)
	startIdx := 0
	if len(fp.Facts) > 0 && fp.Facts[0].Priority != PriorityGovernance {
		startIdx = 1
	}
	var result []Fact
	for i := startIdx; i < len(fp.Facts) && len(result) < n; i++ {
		if fp.Facts[i].Priority != PriorityGovernance {
			result = append(result, fp.Facts[i])
		}
	}
	return result
}

// TopAlerts retourne les N premiers faits de gouvernance (vigilances et alertes critiques).
func (fp *FactsPack) TopAlerts(n int) []Fact {
	if fp == nil || n <= 0 {
		return nil
	}
	var result []Fact
	for _, f := range fp.Facts {
		if len(result) >= n {
			break
		}
		if f.Priority == PriorityGovernance {
			result = append(result, f)
		}
	}
	return result
}
