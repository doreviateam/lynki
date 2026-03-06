package facts

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strings"

	"github.com/doreviateam/diva/internal/models"
)

const maxFacts = 10

// BuildFactsPack construit un FactsPack à partir des cartes et détails.
// Retourne un pack trié (Priority → CategoryRank → NormalizeMessage).
// Max 10 faits.
func BuildFactsPack(cards []models.Card, details map[string]interface{}, dataCompleteness *DataCompleteness, ctx ContextMeta) *FactsPack {
	facts := buildFacts(cards, details)
	SortFacts(facts)
	if len(facts) > maxFacts {
		facts = facts[:maxFacts]
	}
	dc := dataCompleteness
	if dc == nil {
		dc = &DataCompleteness{BankHealthMetrics: "absent"}
	}
	return &FactsPack{
		Version:          FactsPackVersion,
		Mode:             "cockpit",
		Context:          ctx,
		Facts:            facts,
		DataCompleteness: dc,
	}
}

// SortFacts trie les faits : Priority asc → CategoryRank asc → Message lexico (normalisé).
// Un seul endroit décide du tri (Règle 1).
func SortFacts(facts []Fact) {
	sort.Slice(facts, func(i, j int) bool {
		if facts[i].Priority != facts[j].Priority {
			return facts[i].Priority < facts[j].Priority
		}
		ri, rj := CategoryRank(facts[i].Category), CategoryRank(facts[j].Category)
		if ri != rj {
			return ri < rj
		}
		return NormalizeMessage(facts[i].Message) < NormalizeMessage(facts[j].Message)
	})
}

func buildFacts(cards []models.Card, details map[string]interface{}) []Fact {
	var facts []Fact

	cash, hasCash := cardVal(cards, "cash")
	biz, hasBiz := cardVal(cards, "business")
	taxes, hasTaxes := cardVal(cards, "taxes")
	treasury, hasTreasury := cardVal(cards, "treasury_validated_pct")
	refunds, hasRefunds := cardVal(cards, "refunds")
	creditNotes, hasCreditNotes := cardVal(cards, "credit_notes")
	pos, hasPOS := cardVal(cards, "pos_shops")

	hasOperationalFlux := (hasCash && cash != 0) || (hasBiz && biz != 0) || (hasPOS && pos > 0)
	totalFlux := absVal(cash)
	if hasBiz {
		totalFlux += absVal(biz)
	}
	if hasPOS && pos > 0 {
		totalFlux += pos
	}
	fluxModeste := totalFlux > 0 && totalFlux < 10000

	// Règle 16/17 — Trésorerie 0 % + flux opérationnels
	if hasTreasury && treasury == 0 && hasOperationalFlux {
		var msg string
		if fluxModeste {
			if hasCash && cash > 0 {
				msg = fmt.Sprintf("POINT DOMINANT: cash modeste (%s) sans validation bancaire — rapprochement à effectuer", fmtEUR(cash))
			} else if hasPOS && pos > 0 {
				msg = fmt.Sprintf("POINT DOMINANT: POS %s sans validation bancaire — flux modeste, rapprochement à effectuer", fmtEUR(pos))
			} else if hasBiz && biz != 0 {
				msg = fmt.Sprintf("POINT DOMINANT: CA %s sans validation bancaire — flux modeste", fmtEUR(absVal(biz)))
			}
		} else {
			msg = "POINT DOMINANT: flux opérationnels sans validation bancaire"
			if hasCash && cash > 0 {
				msg = fmt.Sprintf("POINT DOMINANT: cash %s — flux opérationnels sans validation bancaire", fmtEUR(cash))
			} else if hasBiz && biz != 0 {
				msg = fmt.Sprintf("POINT DOMINANT: CA %s — flux opérationnels sans validation bancaire", fmtEUR(absVal(biz)))
			} else if hasPOS && pos > 0 {
				msg = fmt.Sprintf("POINT DOMINANT: POS %s — flux opérationnels sans validation bancaire", fmtEUR(pos))
			}
		}
		if msg != "" {
			facts = append(facts, Fact{Priority: PriorityTreasury, Category: "treasury", Message: msg})
		}
	}

	if hasCash && hasTaxes {
		net := cash - taxes
		if hasRefunds {
			net += refunds
		}
		facts = append(facts, Fact{Priority: PriorityTreasury, Category: "treasury",
			Message: fmt.Sprintf("Position nette de trésorerie post-taxes: %s", fmtEUR(net))})
	}

	if hasTaxes && hasBiz && biz != 0 {
		ratio := (taxes / absVal(biz)) * 100
		facts = append(facts, Fact{Priority: PriorityInductors, Category: "tax",
			Message: fmt.Sprintf("Inducteur fiscal: les taxes (%s) représentent %s du CA et pèsent sur la trésorerie", fmtEUR(taxes), fmtPct(ratio))})
	}

	totalCA := biz
	if hasPOS && pos > 0 {
		totalCA += pos
	}
	hasTotalCA := hasBiz || (hasPOS && pos > 0)

	if hasBiz && biz == 0 && hasPOS && pos > 0 {
		facts = append(facts, Fact{Priority: PriorityInductors, Category: "pos",
			Message: fmt.Sprintf("Activité commerciale: aucune facturation classique, le CA provient exclusivement du POS (%s)", fmtEUR(pos))})
	}

	if hasCash && hasTotalCA {
		spread := cash - totalCA
		if spread > 0 {
			facts = append(facts, Fact{Priority: PriorityTreasury, Category: "treasury",
				Message: fmt.Sprintf("Écart trésorerie/activité: le solde de trésorerie (%s) dépasse l'activité commerciale totale (%s) de %s", fmtEUR(cash), fmtEUR(totalCA), fmtEUR(spread))})
		} else if spread < 0 {
			facts = append(facts, Fact{Priority: PriorityTreasury, Category: "treasury",
				Message: fmt.Sprintf("Écart trésorerie/activité: l'activité commerciale totale (%s) dépasse le solde de trésorerie (%s) de %s", fmtEUR(totalCA), fmtEUR(cash), fmtEUR(absVal(spread)))})
		}
	}

	if hasRefunds && hasBiz && biz != 0 {
		ratio := (absVal(refunds) / absVal(biz)) * 100
		msg := fmt.Sprintf("Remboursements: %s soit %s du CA", fmtEUR(absVal(refunds)), fmtPct(ratio))
		if ratio < 1.0 {
			msg += ", part marginale"
		}
		facts = append(facts, Fact{Priority: PriorityComplementary, Category: "treasury", Message: msg})
	}

	posDetails := extractPosDetails(details)
	if posDetails != nil && posDetails.totalSessions > 0 {
		if hasBiz && biz != 0 {
			ratio := (pos / absVal(biz)) * 100
			facts = append(facts, Fact{Priority: PriorityInductors, Category: "pos",
				Message: fmt.Sprintf("Inducteur POS: %d sessions, %d tickets, %s de ventes soit %s du CA", posDetails.totalSessions, posDetails.totalTickets, fmtEUR(pos), fmtPct(ratio))})
		} else if hasPOS && pos > 0 {
			facts = append(facts, Fact{Priority: PriorityInductors, Category: "pos",
				Message: fmt.Sprintf("Inducteur POS: %d sessions, %d tickets, %s de ventes", posDetails.totalSessions, posDetails.totalTickets, fmtEUR(pos))})
		}

		if posDetails.totalSessions > 0 && posDetails.totalTickets > 0 {
			avgBasket := pos / float64(posDetails.totalTickets)
			facts = append(facts, Fact{Priority: PriorityInductors, Category: "pos",
				Message: fmt.Sprintf("POS panier moyen: %s (%d tickets sur %d sessions)", fmtEUR(avgBasket), posDetails.totalTickets, posDetails.totalSessions)})
		}

		totalPayments := posDetails.cashTotal + posDetails.cardTotal
		if totalPayments > 0 {
			cashPct := (posDetails.cashTotal / totalPayments) * 100
			cardPct := (posDetails.cardTotal / totalPayments) * 100
			facts = append(facts, Fact{Priority: PriorityInductors, Category: "pos",
				Message: fmt.Sprintf("POS mix paiements: espèces %s (%s), carte %s (%s)", fmtEUR(posDetails.cashTotal), fmtPct(cashPct), fmtEUR(posDetails.cardTotal), fmtPct(cardPct))})
		}

		if posDetails.anomalySessions > 0 {
			facts = append(facts, Fact{Priority: PriorityGovernance, Category: "pos",
				Message: fmt.Sprintf("POS ALERTE: %d session(s) avec écart de caisse, écart cumulé %s", posDetails.anomalySessions, fmtEUR(absVal(posDetails.totalDifference)))})
		}

		sealingRate := float64(posDetails.sealedSessions) / float64(posDetails.totalSessions) * 100
		if sealingRate < 100 {
			facts = append(facts, Fact{Priority: PriorityGovernance, Category: "pos",
				Message: fmt.Sprintf("POS conformité: %d/%d sessions scellées (%s) — %d en attente", posDetails.sealedSessions, posDetails.totalSessions, fmtPct(sealingRate), posDetails.pendingSessions)})
		} else if posDetails.sealedSessions > 0 {
			facts = append(facts, Fact{Priority: PriorityInductors, Category: "pos",
				Message: fmt.Sprintf("POS conformité: %d sessions scellées (100 %%)", posDetails.sealedSessions)})
		}

		if len(posDetails.shops) > 1 {
			var parts []string
			for _, shop := range posDetails.shops {
				parts = append(parts, fmt.Sprintf("%s: %s (%d sessions)", shop.shopID, fmtEUR(shop.totalSales), shop.sessionsCount))
			}
			facts = append(facts, Fact{Priority: PriorityComplementary, Category: "pos",
				Message: fmt.Sprintf("POS répartition: %s", strings.Join(parts, " | "))})
		}
	} else if hasPOS && hasBiz && biz != 0 {
		ratio := (pos / absVal(biz)) * 100
		facts = append(facts, Fact{Priority: PriorityInductors, Category: "pos",
			Message: fmt.Sprintf("POS: %s soit %s du CA", fmtEUR(pos), fmtPct(ratio))})
	}

	if (!hasCreditNotes || creditNotes == 0) && hasBiz && biz > 100000 {
		facts = append(facts, Fact{Priority: PriorityComplementary, Category: "treasury",
			Message: fmt.Sprintf("Aucune note de crédit émise sur la période malgré un volume d'activité de %s", fmtEUR(biz))})
	}

	arDetails := extractARDetails(details)
	if arDetails != nil && arDetails.overdueAmount > 0 {
		msg := fmt.Sprintf("AR à risque: %s en retard sur %d partenaire(s)", fmtEUR(arDetails.overdueAmount), arDetails.overdueCount)
		if arDetails.topPartnerName != "" {
			msg += fmt.Sprintf(", principal débiteur %s (%s)", arDetails.topPartnerName, fmtEUR(arDetails.topOverdueAmount))
		}
		msg += "."
		facts = append(facts, Fact{Priority: PriorityInductors, Category: "ar", Message: msg})
	}

	var watchCards, alertCards []string
	for _, c := range cards {
		switch c.Status {
		case "watch":
			watchCards = append(watchCards, fmt.Sprintf("%s (%s)", c.Label, c.StatusReason))
		case "alert":
			alertCards = append(alertCards, fmt.Sprintf("%s (%s)", c.Label, c.StatusReason))
		}
	}
	if len(alertCards) > 0 {
		facts = append(facts, Fact{Priority: PriorityGovernance, Category: "governance",
			Message: fmt.Sprintf("GOUVERNANCE CRITIQUE: %s", strings.Join(alertCards, " | "))})
	}
	if len(watchCards) > 0 {
		facts = append(facts, Fact{Priority: PriorityGovernance, Category: "governance",
			Message: fmt.Sprintf("GOUVERNANCE — points d'attention: %s", strings.Join(watchCards, " | "))})
	}

	return facts
}

func cardVal(cards []models.Card, key string) (float64, bool) {
	for _, c := range cards {
		if c.Key == key && c.Value != nil {
			return *c.Value, true
		}
	}
	return 0, false
}

func fmtPct(v float64) string { return fmt.Sprintf("%.1f%%", v) }

func fmtEUR(v float64) string {
	abs := math.Abs(v)
	intPart := int64(math.Floor(abs))
	decPart := int64(math.Round((abs - float64(intPart)) * 100))
	s := fmt.Sprintf("%d", intPart)
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
	d.overdueAmount = toFloat(totals["overdue_amount"])
	if d.overdueAmount <= 0 {
		return d
	}
	partnersRaw, ok := ar["partners"].([]interface{})
	if !ok {
		return d
	}
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
