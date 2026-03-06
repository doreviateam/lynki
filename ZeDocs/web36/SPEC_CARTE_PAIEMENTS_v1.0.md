# SPEC — Carte Paiements (Rapprochement bancaire)

**Version :** 1.0  
**Date :** 2026-03-03  
**Statut :** Projeté  
**Référence :** Avis expert AVIS_EXPERT_SPEC_CARTE_PAIEMENTS_v1.0.md

---

## 1. Intention produit

Répondre à une seule question :

> **Quelle part de mes paiements ERP est confirmée par la banque ?**

---

## 2. Objet mesuré

**Paiement ERP vaulté** — chaque paiement (account.payment) validé dans l’ERP, ingéré dans le Vault et ayant un document associé.

---

## 3. Invariants

### 3.0 Données affichées dans Linky

**Toute donnée affichée dans Linky vient du Vault.**

Linky ne consomme jamais directement les données de l'ERP ou d'une autre source. Les agrégats, KPI et messages passent par des endpoints exposés par le Vault. Même le contrôle de complétude (§3.2) est effectué par le Vault (qui peut interroger Odoo en interne) ; Linky ne reçoit que le résultat (ex. `is_complete`, `badge`, `message`).

### 3.1 Paiements exhaustivement vaultés

**Tous les paiements enregistrés et validés dans l'ERP doivent être vaultés.**

Cette règle est un invariant de l'approche Dorevia. Aucun paiement en état `posted`, `paid` ou équivalent ne doit rester hors du Vault. Le connecteur Odoo, les CRON de rattrapage et les scripts de backfill garantissent cette exhaustivité. En cas d'écart (config manquante, échec persistant), un rattrapage manuel ou automatisé est requis.

### 3.2 Contrôle de complétude

Avant tout calcul de la carte, vérifier :

```
count(erp.payments_posted) == count(vault.payments_documents)
AND
abs(sum_erp_amount_signed - sum_vault_amount_signed) <= 0.01
```

La tolérance de 0,01 € sur la somme évite un faux blocage dû aux différences de centimes / arrondis. Le count reste en égalité stricte. Le contrôle par count seul est insuffisant : 10 paiements ERP et 10 documents Vault peuvent masquer un paiement de 5 000 € manquant remplacé par un autre — le count passe, la somme est fausse. La vérification des montants verrouille réellement.

**Périmètre du contrôle :** Le contrôle de complétude est évalué par tenant, par société (si applicable) et par période sélectionnée. Sans cela, un filtre sur une période donnée pourrait provoquer un faux blocage (badge « Données incomplètes ») lié à un paiement hors période non inclus dans les agrégats du filtre. **Date de référence unique :** le filtre période est appliqué sur `payment_date` côté Odoo et sur `documents.date_value` côté Vault — ces deux champs doivent représenter la même date (même sémantique).

Si l'une des deux conditions n'est pas vraie (ou si Odoo est inaccessible pour le contrôle) :

| Élément | Valeur |
|---------|--------|
| **Couverture probante** | — |
| **Badge** | « Données incomplètes » |
| **Message (écart count/sum)** | « Certains paiements ERP validés ne sont pas encore enregistrés dans le Vault. » |
| **Message (Odoo inaccessible)** | « Contrôle de complétude indisponible (Odoo inaccessible) » |

Le message distinct évite une panique en prod : Odoo down ≠ données corrompues.

Aucun KPI (A, B, couverture) n'est affiché tant que l'invariant n'est pas respecté. Cette règle protège le modèle contre les indicateurs trompeurs.

---

## 4. Définitions

### 4.1 Statut d’un paiement

Chaque paiement vaulté a un statut :

| Statut | Valeur | Signification |
|--------|--------|----------------|
| **À traiter** | `reconciled = false` | Non encore rapproché avec une ligne de relevé bancaire |
| **Traité** | `reconciled = true` | Rapproché (confirmé par la banque) |

Le **rapprochement bancaire** est l’événement qui fait passer un paiement de `false` à `true`.

### 4.2 Alignement terminologique

| Terme | Signification |
|-------|----------------|
| **Validé** | Dans le contexte de la carte Paiements **uniquement**, « Validé » = rapproché (lettrage avec relevé bancaire). À ne pas confondre avec la carte Trésorerie où « validé » peut signifier autre chose. |
| **Rapproché** | Ligne de relevé bancaire lettrée avec une écriture comptable (paiement). |

---

## 5. KPI et formules

### 5.1 Indicateurs

| Indicateur | Formule | Libellé UI |
|------------|---------|------------|
| **A** | Somme des montants des paiements vaultés avec `reconciled = false` | À traiter |
| **B** | Somme des montants des paiements vaultés avec `reconciled = true` | Traité |
| **Couverture probante** | `B / (A + B)` | Taux de rapprochement (ou équivalent) |

### 5.2 Règles d’affichage

| Condition | Affichage Couverture probante |
|-----------|------------------------------|
| `A + B = 0` | **—** (pas 100 %, pas 0 %) |
| `A + B > 0` | Pourcentage (ex. 100 %, 73 %) |

**Montants :** Valeur absolue par défaut (option CFO). Si option comptable : montants signés, avec cohérence partout.

### 5.3 Messages contextuels

| Condition | Message |
|-----------|---------|
| `A = 0` et `B > 0` | « Tous les paiements sont rapprochés » |
| `A > 0` | « Des paiements restent à rapprocher » |
| `A + B = 0` | « Aucun paiement vaulté sur la période » (ou équivalent) |

---

## 6. Source de vérité du statut `reconciled`

Le statut ne peut pas être « deviné ». Il doit être **stocké** dans le Vault (ou dans une table dérivée) pour chaque paiement.

### 6.1 À l’ingestion d’un paiement ERP

**Événement :** `payment.posted`

- `reconciled = false` par défaut
- Paiement créé/vaulté dans le Vault

### 6.2 Lors d’un rapprochement bancaire dans Odoo

Quand Odoo rapproche une ligne de relevé avec un paiement :

**Événement :** `payment.reconciled`

- `reconciled = true`
- `reconciled_at` = date du rapprochement
- `bank_statement_line_ref` (optionnel mais recommandé)

### 6.3 En cas de dé-rapprochement

**Événement :** `payment.unreconciled`

- `reconciled = false`

**Immutabilité :** on n’édite pas l’événement `payment.posted`, on ajoute un événement d’état.

### 6.4 Paiement partiellement rapproché

Si un paiement est rapproché en plusieurs fois :

- `reconciled = true` uniquement lorsque le montant total rapproché ≥ montant du paiement (confirmation complète)
- Sinon : statut intermédiaire (ex. `partial`) ou `reconciled = false` selon la règle métier retenue

---

## 7. Contenu de la carte

### 7.1 Indicateurs affichés

| Libellé | Donnée | Unité |
|---------|--------|-------|
| Exposition non validée | A | € |
| À traiter | A | € |
| Traité | B | € |
| Couverture probante | B / (A + B) | % ou — |

**Note :** « Exposition non validée » et « À traiter » désignent la même valeur (A). Un seul libellé suffit en UI si redondant.

### 7.2 Métadonnées optionnelles

- Journaux concernés
- Dernier relevé importé
- Dernière mise à jour des données

---

## 8. Périmètre et filtres

- **Tenant** : obligatoire
- **Société (company_id)** : optionnel (filtre par société)
- **Période** : optionnel selon implémentation (snapshot vs flux daté)

---

## 9. API backend

### 9.1 Endpoint (à définir)

Proposition : extension de `GET /ui/aggregations/treasury` ou nouvel endpoint dédié `GET /ui/aggregations/payments-reconciliation`.

### 9.2 Payload attendu (exemple)

```json
{
  "tenant": "laplatine2026",
  "company_id": "odoo:1",
  "unreconciled_amount": 15000.00,
  "reconciled_amount": 21500.00,
  "total_amount": 36500.00,
  "coverage_rate": 0.589,
  "currency": "EUR",
  "generated_at": "2026-03-03T12:00:00Z"
}
```

### 9.3 Règles de calcul

- `unreconciled_amount` = A
- `reconciled_amount` = B
- `total_amount` = A + B
- `coverage_rate` = `B / (A + B)` si `A + B > 0`, sinon `null`

---

## 10. Definition of Done

| Critère | Statut |
|---------|--------|
| Contrôle de complétude (§3.2) : si count ou sum(amount_signed) ERP ≠ Vault → badge « Données incomplètes », couverture = — | ☐ |
| Tous les paiements ERP « posted » sont vaultés | ☐ |
| Chaque paiement a un état `reconciled` exploitable | ☐ |
| Le rapprochement bancaire met à jour cet état via événements immuables | ☐ |
| A et B sont non ambigus et cohérents avec Odoo | ☐ |
| La carte ne peut pas afficher 100 % si des paiements non rapprochés existent dans le Vault | ☐ |

---

## 11. Diagnostic — « On n’a pas A » (A = 0 alors qu’il devrait y avoir des paiements non rapprochés)

Si A semble absent ou incorrect, vérifier l’une des trois causes suivantes :

| Cause | Vérification |
|-------|--------------|
| **1. Événements** | `payment.reconciled` / `payment.unreconciled` ne sont plus émis ou plus ingérés |
| **2. Périmètre** | Les paiements « non rapprochés » ne sont pas vaultés (univers incomplet) |
| **3. Filtres** | Le calcul filtre trop (période, tenant, journal) et exclut les non-réconciliés |

---

## 12. Roadmap logique (figée)

| Ordre | Étape | Priorité |
|-------|-------|----------|
| **1** | Implémenter contrôle de complétude (§3.2) | Haute |
| **2** | Garantir ingestion exhaustive des paiements `posted` | Haute |
| **3** | Implémenter Option A temporairement | Haute |
| **4** | Planifier Option B comme évolution structurante | Moyen terme |

---

## 13. Stratégies d'implémentation

### Option A — Dérivation (temporaire, étape 3)

Réutiliser `financial_recon_deltas` et `impacted_documents` existants :

- A = `unconfirmed_amount_abs`
- B = `confirmed_amount_abs`
- Périmètre : documents `source=payment` avec `amount_signed` renseigné

### Option B — Nouveau flux (évolution structurante, étape 4)

- Odoo émet `payment.reconciled` / `payment.unreconciled`
- Vault stocke le statut par paiement (table dédiée ou champ sur `documents`)
- Agrégation : A = Σ paiements `reconciled=false`, B = Σ paiements `reconciled=true`

---

## 14. Annexes

### 14.1 Relation avec la carte Trésorerie

La carte **Trésorerie** et la carte **Paiements** répondent à des questions différentes :

- **Trésorerie** : « Où en est ma position réelle ? » (solde, position validée, taux global)
- **Paiements** : « Quelle part de mes paiements est confirmée par la banque ? » (focus sur les paiements ERP)

Les deux peuvent coexister ; les sources de données peuvent diverger (projection BSL vs statut paiement).

### 14.2 Références

- AVIS_EXPERT_SPEC_CARTE_PAIEMENTS_v1.0.md
- SPEC_Confirmation_Bancaire_Stricte_v1.3.md (financial_recon_deltas)
- SPEC_CARD_TRESO.md (carte Trésorerie)

---

**Fin de la spécification v1.0**
