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
		Metrics:          buildMetrics(cards),
		ZeroCards:        buildZeroCards(cards),
		Facts:            facts,
		DataCompleteness: dc,
	}
}

// buildZeroCards retourne les labels des cards présentes (valeur non nil) mais nulles (= 0).
// Distinction donnée confirmée nulle vs donnée absente (nil).
func buildZeroCards(cards []models.Card) []string {
	var out []string
	for _, c := range cards {
		if c.Value != nil && *c.Value == 0 {
			out = append(out, c.Label)
		}
	}
	return out
}

// buildMetrics construit le manifest de traçabilité : chaque clé = nom de la card cockpit,
// valeur = montant exact. Tout montant dans l'insight doit matcher une de ces valeurs (±0,01 €).
// Métriques dérivées documentées : activité_commerciale_totale, trésorerie_nette_post_taxes, flux_net_post_taxes.
func buildMetrics(cards []models.Card) map[string]float64 {
	m := map[string]float64{}

	// Cards directes (noms = labels cockpit)
	if v, ok := cardVal(cards, "treasury_validated_pct"); ok && v > 0 {
		m["trésorerie"] = v
	}
	if v, ok := cardVal(cards, "cash"); ok {
		m["flux_net"] = v
	}
	if v, ok := cardVal(cards, "business"); ok {
		m["activité_commerciale"] = v
	}
	if v, ok := cardVal(cards, "taxes"); ok && v != 0 {
		m["taxes"] = v
	}
	if v, ok := cardVal(cards, "refunds"); ok && v != 0 {
		m["remboursements"] = v
	}
	if v, ok := cardVal(cards, "credit_notes"); ok && v != 0 {
		m["notes_de_crédit"] = v
	}
	if v, ok := cardVal(cards, "pos_shops"); ok && v > 0 {
		m["pos"] = v
	}
	if v, ok := cardVal(cards, "bfr"); ok && v != 0 {
		m["bfr"] = v
	}
	if v, ok := cardVal(cards, "ebe"); ok && v != 0 {
		m["ebe"] = v
	}
	if v, ok := cardVal(cards, "encours"); ok && v > 0 {
		m["encours"] = v
	}

	// Métriques dérivées (combinaisons documentées)
	biz, hasBiz := cardVal(cards, "business")
	pos, hasPOS := cardVal(cards, "pos_shops")
	if hasBiz || (hasPOS && pos > 0) {
		total := biz
		if hasPOS && pos > 0 {
			total += pos
		}
		m["activité_commerciale_totale"] = total
	}

	treas, hasTreas := cardVal(cards, "treasury_validated_pct")
	taxes, hasTaxes := cardVal(cards, "taxes")
	refunds, _ := cardVal(cards, "refunds")
	if hasTreas && treas > 0 && hasTaxes {
		net := treas - taxes + refunds
		m["trésorerie_nette_post_taxes"] = net
	}

	cash, hasCash := cardVal(cards, "cash")
	if hasCash && hasTaxes {
		net := cash - taxes + refunds
		m["flux_net_post_taxes"] = net
	}

	// Écart trésorerie (ou flux net) vs activité commerciale — pour validation des montants en what_i_see
	mainTreasury := treas
	if !(hasTreas && treas > 0) && hasCash {
		mainTreasury = cash
	}
	if (hasTreas && treas > 0 || hasCash) && (hasBiz || (hasPOS && pos > 0)) {
		totalCA := biz
		if hasPOS && pos > 0 {
			totalCA += pos
		}
		spread := mainTreasury - totalCA
		if spread < 0 {
			spread = -spread
		}
		m["écart_trésorerie_activité"] = spread
	}

	return m
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

	// cash = card "cash" → FLUX NET (encaissements − décaissements)
	cash, hasCash := cardVal(cards, "cash")
	biz, hasBiz := cardVal(cards, "business")
	taxes, hasTaxes := cardVal(cards, "taxes")
	// treasury = card "treasury_validated_pct" → TRÉSORERIE (solde validé en EUR)
	treasury, hasTreasury := cardVal(cards, "treasury_validated_pct")
	refunds, hasRefunds := cardVal(cards, "refunds")
	creditNotes, hasCreditNotes := cardVal(cards, "credit_notes")
	pos, hasPOS := cardVal(cards, "pos_shops")
	bfr, hasBFR := cardVal(cards, "bfr")
	ebe, hasEBE := cardVal(cards, "ebe")
	encours, hasEncours := cardVal(cards, "encours")

	// Trésorerie disponible : on préfère le solde validé (treasury) ; fallback sur flux net (cash)
	hasTreasuryPos := hasTreasury && treasury > 0
	mainTreasury := treasury
	if !hasTreasuryPos && hasCash {
		mainTreasury = cash
	}
	hasMainTreasury := hasTreasuryPos || hasCash

	hasOperationalFlux := (hasCash && cash != 0) || (hasBiz && biz != 0) || (hasPOS && pos > 0)
	totalFlux := absVal(mainTreasury)
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
				msg = fmt.Sprintf("POINT DOMINANT: flux net modeste (%s) sans validation bancaire — rapprochement à effectuer", fmtEUR(cash))
			} else if hasPOS && pos > 0 {
				msg = fmt.Sprintf("POINT DOMINANT: POS %s sans validation bancaire — flux modeste, rapprochement à effectuer", fmtEUR(pos))
			} else if hasBiz && biz != 0 {
				msg = fmt.Sprintf("POINT DOMINANT: activité commerciale %s sans validation bancaire — flux modeste", fmtEUR(absVal(biz)))
			}
		} else {
			msg = "POINT DOMINANT: flux opérationnels sans validation bancaire"
			if hasCash && cash > 0 {
				msg = fmt.Sprintf("POINT DOMINANT: flux net %s — flux opérationnels sans validation bancaire", fmtEUR(cash))
			} else if hasBiz && biz != 0 {
				msg = fmt.Sprintf("POINT DOMINANT: activité commerciale %s — flux opérationnels sans validation bancaire", fmtEUR(absVal(biz)))
			} else if hasPOS && pos > 0 {
				msg = fmt.Sprintf("POINT DOMINANT: POS %s — flux opérationnels sans validation bancaire", fmtEUR(pos))
			}
		}
		if msg != "" {
			facts = append(facts, Fact{Priority: PriorityTreasury, Category: "treasury", Message: msg})
		}
	}

	// Position nette post-taxes — trésorerie (solde) si disponible, sinon flux net
	if hasMainTreasury && hasTaxes {
		net := mainTreasury - taxes
		if hasRefunds {
			net += refunds
		}
		var msg string
		if hasTreasuryPos {
			msg = fmt.Sprintf("Trésorerie nette post-taxes: %s", fmtEUR(net))
		} else {
			msg = fmt.Sprintf("Flux net post-taxes: %s", fmtEUR(net))
		}
		facts = append(facts, Fact{Priority: PriorityTreasury, Category: "treasury", Message: msg})
	}

	if hasTaxes && hasBiz && biz != 0 {
		ratio := (taxes / absVal(biz)) * 100
		facts = append(facts, Fact{Priority: PriorityInductors, Category: "tax",
			Message: fmt.Sprintf("Les taxes (%s) représentent %s du chiffre d'affaires et pèsent sur la trésorerie.", fmtEUR(taxes), fmtPct(ratio))})
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

	// Comparaison principale : TRÉSORERIE (solde) vs activité commerciale totale
	// Utilise "trésorerie" si solde validé disponible, sinon "flux net" (fallback)
	if hasMainTreasury && hasTotalCA {
		spread := mainTreasury - totalCA
		treasuryLabel := "trésorerie"
		if !hasTreasuryPos {
			treasuryLabel = "flux net"
		}
		actLabel := "activité commerciale"
		if hasPOS && pos > 0 {
			actLabel = "activité commerciale totale"
		}
		if spread > 0 {
			// Formulation "contrôle de gestion" : stock vs flux — avance, pas dépassement.
			// Montants : trésorerie + écart dans la phrase principale ; activité en apposition courte.
			facts = append(facts, Fact{Priority: PriorityTreasury, Category: "treasury",
				Message: fmt.Sprintf("La %s (%s) conserve une avance de %s sur l'%s (%s) observée sur la période.", treasuryLabel, fmtEUR(mainTreasury), fmtEUR(spread), actLabel, fmtEUR(totalCA))})
		} else if spread < 0 {
			facts = append(facts, Fact{Priority: PriorityTreasury, Category: "treasury",
				Message: fmt.Sprintf("L'%s (%s) excède la %s (%s) de %s — tension de trésorerie.", actLabel, fmtEUR(totalCA), treasuryLabel, fmtEUR(mainTreasury), fmtEUR(absVal(spread)))})
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
	// Ne pas émettre de fait POS quand la valeur est nulle ou zéro
	if posDetails != nil && posDetails.totalSessions > 0 && hasPOS && pos > 0 {
		if hasBiz && biz != 0 {
			ratio := (pos / absVal(biz)) * 100
			facts = append(facts, Fact{Priority: PriorityInductors, Category: "pos",
				Message: fmt.Sprintf("Le POS affiche %d sessions, %d tickets, %s de ventes soit %s du CA.", posDetails.totalSessions, posDetails.totalTickets, fmtEUR(pos), fmtPct(ratio))})
		} else if hasPOS && pos > 0 {
			facts = append(facts, Fact{Priority: PriorityInductors, Category: "pos",
				Message: fmt.Sprintf("Le POS affiche %d sessions, %d tickets, %s de ventes.", posDetails.totalSessions, posDetails.totalTickets, fmtEUR(pos))})
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
	} else if hasPOS && pos > 0 && hasBiz && biz != 0 {
		// POS à zéro : fait non significatif — ne pas l'envoyer à Mistral
		ratio := (pos / absVal(biz)) * 100
		facts = append(facts, Fact{Priority: PriorityInductors, Category: "pos",
			Message: fmt.Sprintf("POS: %s soit %s du CA", fmtEUR(pos), fmtPct(ratio))})
	}

	if (!hasCreditNotes || creditNotes == 0) && hasBiz && biz > 100000 {
		facts = append(facts, Fact{Priority: PriorityComplementary, Category: "treasury",
			Message: fmt.Sprintf("Aucune note de crédit émise sur la période malgré un volume d'activité de %s", fmtEUR(biz))})
	}

	// BFR — Besoin en Fonds de Roulement
	if hasBFR && bfr != 0 {
		if hasBiz && biz != 0 {
			ratio := (absVal(bfr) / absVal(biz)) * 100
			if bfr > 0 {
				facts = append(facts, Fact{Priority: PriorityInductors, Category: "bfr",
					Message: fmt.Sprintf("BFR: besoin de %s soit %s du CA — financement du cycle d'exploitation à surveiller", fmtEUR(bfr), fmtPct(ratio))})
			} else {
				facts = append(facts, Fact{Priority: PriorityInductors, Category: "bfr",
					Message: fmt.Sprintf("BFR négatif: %s soit %s du CA — excédent de ressources d'exploitation", fmtEUR(bfr), fmtPct(ratio))})
			}
		} else {
			facts = append(facts, Fact{Priority: PriorityInductors, Category: "bfr",
				Message: fmt.Sprintf("BFR: %s", fmtEUR(bfr))})
		}
	}

	// EBE — Excédent Brut d'Exploitation
	if hasEBE && ebe != 0 {
		if hasBiz && biz != 0 {
			ratio := (ebe / absVal(biz)) * 100
			if ebe > 0 {
				facts = append(facts, Fact{Priority: PriorityInductors, Category: "ebe",
					Message: fmt.Sprintf("EBE: %s soit %s du CA — marge brute d'exploitation", fmtEUR(ebe), fmtPct(ratio))})
			} else {
				facts = append(facts, Fact{Priority: PriorityInductors, Category: "ebe",
					Message: fmt.Sprintf("EBE négatif: %s soit %s du CA — exploitation déficitaire", fmtEUR(ebe), fmtPct(ratio))})
			}
		} else {
			facts = append(facts, Fact{Priority: PriorityInductors, Category: "ebe",
				Message: fmt.Sprintf("EBE: %s", fmtEUR(ebe))})
		}
	}

	// Encours clients (créances ouvertes) — signal stratégique prioritaire (avant taxes dans what_i_see).
	// PriorityTreasury pour garantir sa visibilité dans le corps de l'insight.
	if hasEncours && encours != 0 {
		totalCARef := biz
		if hasPOS && pos > 0 {
			totalCARef += pos
		}
		if (hasBiz && biz != 0) || (hasPOS && pos > 0) {
			ratio := (encours / absVal(totalCARef)) * 100
			facts = append(facts, Fact{Priority: PriorityTreasury, Category: "ar",
				Message: fmt.Sprintf("Les créances clients ouvertes atteignent %s, soit %s de l'activité commerciale — recouvrement en cours.", fmtEUR(encours), fmtPct(ratio))})
		} else {
			facts = append(facts, Fact{Priority: PriorityTreasury, Category: "ar",
				Message: fmt.Sprintf("Créances clients ouvertes: %s", fmtEUR(encours))})
		}
	}

	// Écart encours / trésorerie nette post-taxes : utilise trésorerie (solde) si disponible, sinon flux net
	if hasEncours && encours > 0 && hasMainTreasury && hasTaxes {
		netPostTaxes := mainTreasury - taxes
		if hasRefunds {
			netPostTaxes += refunds
		}
		if encours > netPostTaxes {
			delta := encours - netPostTaxes
			var netLabel string
			if hasTreasuryPos {
				netLabel = "trésorerie nette post-taxes"
			} else {
				netLabel = "flux net post-taxes"
			}
			facts = append(facts, Fact{Priority: PriorityTreasury, Category: "ar",
				Message: fmt.Sprintf("Les créances ouvertes (%s) dépassent la %s (%s) de %s.", fmtEUR(encours), netLabel, fmtEUR(netPostTaxes), fmtEUR(delta))})
		}
	}

	arDetails := extractARDetails(details)
	if arDetails != nil && arDetails.overdueAmount > 0 {
		// Vigilance AR en PriorityGovernance → TopAlerts → to_check (une tension forte, pas diluée dans what_i_see)
		var vigilance string
		if arDetails.topPartnerName != "" && arDetails.topOverdueDays > 0 {
			vigilance = fmt.Sprintf("Une part significative des créances en retard est portée par %s, avec %s en retard depuis %d jours.", arDetails.topPartnerName, fmtEUR(arDetails.topOverdueAmount), arDetails.topOverdueDays)
		} else if arDetails.topPartnerName != "" {
			vigilance = fmt.Sprintf("Une part significative des créances en retard est portée par %s (%s).", arDetails.topPartnerName, fmtEUR(arDetails.topOverdueAmount))
		} else {
			vigilance = fmt.Sprintf("Créances en retard : %s sur %d partenaire(s) — concentration du risque à surveiller.", fmtEUR(arDetails.overdueAmount), arDetails.overdueCount)
		}
		facts = append(facts, Fact{Priority: PriorityGovernance, Category: "ar", Message: vigilance})
	}

	// Gouvernance : traduit chaque signal de statut en phrase métier actionnable.
	// Si la raison est trop vague pour être traduite, le fait est omis (règle 14 prompt).
	for _, c := range cards {
		msg := governanceToBusinessPhrase(c.Label, c.Status, c.StatusReason)
		if msg != "" {
			facts = append(facts, Fact{Priority: PriorityGovernance, Category: "governance",
				Message: msg})
		}
	}

	return facts
}

// governanceToBusinessPhrase traduit un signal de statut card en phrase métier actionnable.
// Retourne "" si la raison est trop vague pour être utile à un dirigeant PME (sera omise).
func governanceToBusinessPhrase(label, status, reason string) string {
	lbl := strings.ToLower(strings.TrimSpace(label))
	rsn := strings.ToLower(strings.TrimSpace(reason))

	// --- Signaux utiles : traduction en prose métier ---

	// Rapprochement bancaire partiel / trésorerie
	if strings.Contains(rsn, "non couverts") || strings.Contains(rsn, "rapprochement insuffisant") || strings.Contains(rsn, "flux non couverts") {
		return "Le rapprochement bancaire est partiel — une fraction des encaissements reste à confirmer, ce qui peut légèrement surestimer la trésorerie affichée."
	}
	if strings.Contains(rsn, "partiellement validé") && (strings.Contains(lbl, "cash") || strings.Contains(lbl, "flux") || strings.Contains(lbl, "trésorerie")) {
		return "Une partie des flux encaissés reste à confirmer dans le rapprochement bancaire."
	}

	// Taxes à surveiller
	if strings.Contains(rsn, "poids fiscal") || (strings.Contains(lbl, "taxes") && status == "watch") {
		return "Le poids fiscal mérite attention — vérifier l'échéance et le provisionnement."
	}

	// BFR / fonds de roulement
	if strings.Contains(lbl, "bfr") || strings.Contains(lbl, "fonds de roulement") {
		if status == "alert" {
			return "Le besoin en fonds de roulement est en tension — à surveiller dans le pilotage de la liquidité."
		}
		return "Le besoin en fonds de roulement est à suivre sur les prochaines semaines."
	}

	// --- Signaux trop vagues → omis ---
	// "Notes de crédit présentes", "Cash partiellement validé" seul, labels génériques
	if strings.Contains(rsn, "présentes") || strings.Contains(rsn, "present") {
		return "" // pas actionnable en l'état
	}
	if strings.Contains(rsn, "partiellement validé") {
		return "" // déjà couvert par cash/trésorerie ci-dessus ou trop vague
	}

	// Fallback : signal d'alerte critique uniquement (watch omis si non traduit)
	if status == "alert" {
		lbl2 := normalizeLabel(label)
		rsn2 := normalizeLabel(reason)
		return fmt.Sprintf("%s : %s.", lbl2, rsn2)
	}
	return "" // watch non traduit → omis
}

// normalizeLabel applique le glossaire Lynki aux libellés amont (Label, StatusReason)
// avant injection dans les faits de gouvernance.
// Source de vérité : GLOSSAIRE_LYNKI_DIVA.md §2 (termes interdits → termes préférés).
func normalizeLabel(s string) string {
	replacements := [][2]string{
		{"Cash non validé", "Trésorerie non validée"},
		{"cash non validé", "trésorerie non validée"},
		// Termes anglais génériques
		{"watch", "à surveiller"},
		{"Watch", "À surveiller"},
		{"alert", "vigilance"},
		{"Alert", "Vigilance"},
		{"issue", "point de vigilance"},
		{"Issue", "Point de vigilance"},
		{"business", "activité commerciale"},
		{"Business", "Activité commerciale"},
	}
	result := s
	for _, r := range replacements {
		result = strings.ReplaceAll(result, r[0], r[1])
	}
	return result
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
	openAmount    float64
	overdueAmount float64
	overdueCount  int
	// Partenaire dominant selon priorité Vault (Critique > Élevée > ancienneté > montant)
	topPartnerName   string
	topOverdueAmount float64
	topOverdueDays   int
	topPriorityLabel string // Critique | Élevée | Moyenne | Faible
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
	// Ordre de priorité : Critique > Élevée > ancienneté max > montant max
	// priority_label vient du score Vault (montant overdue + jours + historique paiement)
	priorityRank := map[string]int{"Critique": 4, "Élevée": 3, "Moyenne": 2, "Faible": 1}

	for _, p := range partnersRaw {
		pm, ok := p.(map[string]interface{})
		if !ok {
			continue
		}
		ov := toFloat(pm["overdue_amount"])
		if ov <= 0 {
			continue
		}
		d.overdueCount++
		days := toInt(pm["overdue_max_days"])
		label := toString(pm["priority_label"])
		name := toString(pm["partner_name"])
		if name == "" {
			name = toString(pm["partner_id"])
		}

		// Décider si ce partenaire est "plus inquiétant" que l'actuel top
		currentRank := priorityRank[d.topPriorityLabel]
		candidateRank := priorityRank[label]
		replaceTop := false
		if candidateRank > currentRank {
			replaceTop = true
		} else if candidateRank == currentRank {
			if days > d.topOverdueDays {
				replaceTop = true
			} else if days == d.topOverdueDays && ov > d.topOverdueAmount {
				replaceTop = true
			}
		}
		if replaceTop {
			d.topPartnerName = name
			d.topOverdueAmount = ov
			d.topOverdueDays = days
			d.topPriorityLabel = label
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
