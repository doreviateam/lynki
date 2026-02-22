# SPEC --- LINKY Carte "Trésorerie Validée" v1.1

**Date :** 2026-02-22  
**Produit :** Dorevia Linky  
**Périmètre :** Carte Trésorerie (Cockpit)  
**Type :** Spécification fonctionnelle consolidée  
**Statut :** Implémenté

------------------------------------------------------------------------

# 1. Contexte

La carte Trésorerie Validée a évolué d'un affichage informatif (v1.0) vers un outil de pilotage opérationnel (v1.1).

Elle permet désormais :
- Visualisation de la trésorerie validée (certifiée)
- Indication des montants en attente de rapprochement
- Diagnostic de discipline bancaire
- Actions directes vers Odoo

Cette spécification consolide :
- L'architecture réelle (Linky → Vault → Odoo)
- La sémantique période (filtré vs global)
- Les choix UX effectivement implémentés

------------------------------------------------------------------------

# 2. Objectif stratégique

Transformer la carte en chaîne décisionnelle :

**État financier → Diagnostic → Action → Preuve**

Alignement :
- Pilotage CFO
- Discipline opérationnelle
- Conformité NF525 / LNE 2026
- Vision "vérité financière scellée"

------------------------------------------------------------------------

# 3. Définitions métier

## 3.1 Formules principales

fiabilite_bancaire = tresorerie_validee / tresorerie_totale

tresorerie_totale = tresorerie_validee + en_attente_rapprochement

## 3.2 Indicateurs secondaires

- nombre_lignes_non_rapprochees
- date_plus_ancienne_ligne_non_rapprochee (si exposée)
- nb_journaux_bancaires_concernes
- date_dernier_import_releve

------------------------------------------------------------------------

# 4. Sémantique des périodes (IMPORTANT)

## 4.1 Règle officielle

- Les **montants** (trésorerie validée, en attente, fiabilité) sont **filtrés par la période sélectionnée**.
- Les **métriques secondaires de rapprochement** reflètent l'**état global actuel du rapprochement bancaire**, indépendamment de la période sélectionnée.

Justification : Le rapprochement bancaire est une discipline structurelle, non limitée à une période comptable spécifique.

------------------------------------------------------------------------

# 5. Affichage UX

## 5.1 Bloc principal

- Trésorerie validée (montant dominant)
- Fiabilité bancaire (%)
- Montant en attente (secondaire)

## 5.2 Bloc diagnostic

Affiché sous le bloc principal :

- Lignes à rapprocher : X
- Plus ancien mouvement : JJ/MM/AAAA (ou "—" si absent)
- Journaux concernés : N
- Dernier relevé importé : JJ/MM/AAAA HH:MM

Placeholder officiel : "—" (tiret cadratin Unicode U+2014)

------------------------------------------------------------------------

# 6. Logique de verdict

| Situation        | Bordure      | Message |
|------------------|--------------|---------|
| 100% validé      | Vert         | Toutes les écritures sont rapprochées et validées. |
| 0% validé        | Orange       | Aucun rapprochement effectué sur la période sélectionnée. |
| Entre 0 et 100%  | Bleu neutre  | Rapprochement partiel. Montants non validés présents. |

------------------------------------------------------------------------

# 7. Actions (CTA)

Affichés uniquement si en_attente > 0 :

- "Rapprocher maintenant" → ouverture Odoo modèle `account.bank.statement.line`
- "Importer relevés" → ouverture Odoo modèle `account.bank.statement`

⚠️ Pas de filtre journal appliqué.

------------------------------------------------------------------------

# 8. Architecture technique réelle

## 8.1 Appels Linky

- GET /ui/aggregations/treasury
- GET /ui/system/bank-reconciliation-health

## 8.2 Vault

Route utilisée : `bank-reconciliation-health`

Extension possible future :

```go
OldestUnreconciledDate *string `json:"oldest_unreconciled_date"`
```

## 8.3 Configuration

Variable d'environnement Linky : `NEXT_PUBLIC_ODOO_URL` — injectée au build.

------------------------------------------------------------------------

# 9. Répartition graphique

Le donut actuel (Validé vs En attente) est conservé.

Les options suivantes sont reportées en v1.2 :
- Répartition par journal bancaire
- Répartition par ancienneté (0–7, 8–30, 31–90, 90+ jours)

------------------------------------------------------------------------

# 10. Références internes

- ZeDocs/web15/SPEC_INDICATEUR_CONFIANCE_RAPPROCHEMENT_BANCAIRE_LINKY_v1.0.md
- ZeDocs/web27/AUDIT_SOURCES_DONNEES_LINKY_CARDS.md

------------------------------------------------------------------------

# 11. Versioning

- v1.0 : Information passive
- v1.1 : Pilotage + action (version consolidée post-audit)
- v1.2 (future) : Segmentation avancée + preuve scellée workflows bancaires

------------------------------------------------------------------------

*Fin du document*
