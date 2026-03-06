# Analyse des incohérences DOREVIA Linky — 2026-03-02

## Contexte

L'utilisateur signale des incohérences sur le dashboard Linky (tenant laplatine2026) :
- **2025** : Pareto clients, CA HT, Encours 1 116 €
- **2026** : Ventes HT = 0 €, Achats HT = 0 €, mais **Encours client = 1 116 €**

## 1. Pourquoi l'encours s'affiche en 2026 alors qu'il n'y a pas de ventes ?

**Cause** : L'agrégation AR (encours client) **étend automatiquement** la plage de dates pour inclure les factures anciennes encore ouvertes.

Dans `aggregations_ar_by_partner.go` (lignes 39-43) :
```go
// Extendre date_debut vers le passé pour inclure les factures anciennes encore ouvertes (encours/retard).
// Ex. : retard Export My Island depuis 2025 — si période = 2026, sans extension les factures 2025 sont exclues.
fromEffective := from
if fromEffective.After(asOf.AddDate(-2, 0, 0)) {
    fromEffective = time.Date(asOf.Year()-2, 1, 1, 0, 0, 0, 0, time.UTC)
}
```

Quand vous sélectionnez **Exercice à date 2026** (2026-01-01 → 2026-02-28), la requête AR étend `fromEffective` à **2024-01-01** pour ne pas exclure les factures 2025 encore impayées. Résultat : l'encours 1 116 € (2 factures EXPORT MY ISLAND de 2025) s'affiche.

**Incohérence perçue** : L'utilisateur voit "0 € ventes" et "1 116 € encours" pour 2026 → confusion légitime.

## 2. Données manquantes : amount_residual

**État actuel** :
- 67 factures clients (out_invoice) dans le Vault
- **Seulement 2** ont `amount_residual` renseigné
- Ces 2 factures = 305,48 € + 810,88 € = **1 116,36 €** (EXPORT MY ISLAND)

Les 65 autres factures ont `amount_residual = NULL`. L'agrégation AR les exclut (filtre `COALESCE(amount_residual, 0) > 0.01`). Donc :
- Soit elles sont payées (amount_residual = 0) et le champ n'a jamais été mis à jour
- Soit le payload initial `invoice.posted` n'incluait pas `amount_residual` au moment du vaulting

**Cause probable** : Les documents ont été créés via un backfill ou un flux qui ne renseigne pas `amount_residual`. L'événement `invoice.residual.changed` (mise à jour après paiement) n'est peut-être pas émis par Odoo.

## 3. Synthèse des incohérences

| Élément | 2025 | 2026 | Explication |
|--------|------|------|-------------|
| Ventes HT | 16 511 € (Business) | 0 € | Correct : pas de factures 2026 dans le Vault |
| Pareto clients | EMD, EXPORT MY ISLAND, etc. | — | Filtre strict sur invoice_date |
| Encours client | 1 116 € | 1 116 € | AR étend la plage → inclut factures 2025 ouvertes |
| Dont en retard | 1 116 € | 1 116 € | Même logique |

## 4. Pistes de correction

### A. Clarifier l'UX (recommandé)

Ajouter une mention explicite quand l'encours provient de factures hors période :

> "Encours client : 1 116 € (inclut factures antérieures encore ouvertes)"

Ou afficher une info-bulle sur la carte Encours.

### B. Aligner l'encours sur la période

Option plus stricte : ne pas étendre la plage pour l'encours. En 2026, encours = 0 €.  
**Risque** : perte d'information sur les retards réels (EXPORT MY ISLAND).

### C. Compléter amount_residual

- Vérifier que le connecteur Odoo envoie bien `amount_residual` dans `invoice.posted`
- Implémenter / activer `invoice.residual.changed` pour les mises à jour après paiement
- Script de backfill : mettre à jour les documents existants depuis Odoo (amount_residual, invoice_date_due)

## 5. Recommandation

**Court terme** : Documenter le comportement (extension de plage AR) et ajouter une indication visuelle sur la carte Encours.

**Moyen terme** : Auditer le flux Odoo → DVIG → Vault pour `amount_residual` et `invoice.residual.changed`.
