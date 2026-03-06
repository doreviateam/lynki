package facts

// Échelle de priorité (Option A — treasury dominante) :
// 1 = treasury (trésorerie dominante)
// 2 = governance (alertes, conformité)
// 3 = tax/pos/ar (inducteurs)
// 4 = complémentaire

const (
	PriorityTreasury     = 1
	PriorityGovernance   = 2
	PriorityInductors    = 3
	PriorityComplementary = 4
)

// CategoryRank — ordre prédéfini des catégories pour tri stable.
// Pas lexicographique (sinon "ar" remonte avant "governance").
// Table explicite figée en code + doc.
var categoryRank = map[string]int{
	"governance": 0,
	"treasury":   1,
	"tax":        2,
	"pos":        3,
	"ar":         4,
}

// CategoryRank retourne le rang de la catégorie pour le tri.
// Catégorie inconnue → 99 (en fin).
func CategoryRank(category string) int {
	if r, ok := categoryRank[category]; ok {
		return r
	}
	return 99
}
