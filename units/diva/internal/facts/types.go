package facts

// FactsPackVersion — version du format FactsPack pour l'archéologie (comparer hashes v1 vs v2).
const FactsPackVersion = "1.2.1"

// FactsPack — pack de faits déterministes pour le LLM (SPEC v1.2.1).
type FactsPack struct {
	Version          string             `json:"version"`
	Mode             string             `json:"mode"`
	Context          ContextMeta        `json:"context"`
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
