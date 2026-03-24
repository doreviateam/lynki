# Rapport Sprint 12 — Lynki (Phase 2)

**Fichier canonique :** `RAPPORT_SPRINT_12_LYNKI.md`  
**Version :** 1.1 — mars 2026  
**Date :** 20 mars 2026  
**Sprint :** 12 (T66–T71)  
**Plan :** [PLAN_SPRINT_12_LYNKI.md](PLAN_SPRINT_12_LYNKI.md) **v1.0**  
**Exécution :** [EXECUTION_TICKETS_SPRINT_12_LYNKI.md](EXECUTION_TICKETS_SPRINT_12_LYNKI.md) **v1.0**  
**Référence précédente :** [RAPPORT_SPRINT_11_LYNKI.md](RAPPORT_SPRINT_11_LYNKI.md) **v1.1** (consolidation multi-sociétés, comparatifs enrichis, schéma tiers V2)

---

## 1. Résumé exécutif

Le Sprint 12 apporte deux avancées majeures :

1. **Balances tiers V2** — les balances âgées clients et fournisseurs utilisent désormais `date_maturity` (échéance) quand disponible, excluent les lignes totalement lettrées (`full_reconcile_id`), et documentent explicitement les limitations V2 (lettrage partiel sans résiduel).

2. **Diva comptable v1** — introduction d'une première couche d'interprétation comptable sur la Synthèse, selon une approche **template-first, souveraineté locale first**. Le texte est toujours adossé à un `AccountingFactsPack` structuré et hashé. Mistral interne est disponible en reformulation optionnelle, jamais en source de calcul.

Le Sprint 11 avait rendu la Synthèse **complète et consolidée** ; le Sprint 12 la rend **plus fiable sur les tiers** et **plus lisible pour un humain qui veut commenter la situation comptable**.

---

## 2. Tickets livrés

| # | Titre | Statut |
|---|-------|--------|
| **T66** | Vault — balances tiers V2 (`date_maturity`, `full_reconcile_id`) | ✅ Livré |
| **T67** | Linky/UI — balances tiers V2 + exports CSV | ✅ Livré |
| **T68** | Diva — AccountingFactsPack comptable v1 | ✅ Livré |
| **T69** | Diva — insight comptable v1 (template-first, Mistral local optionnel) | ✅ Livré |
| **T70** | Linky/UI — encart insight Synthèse | ✅ Livré |
| **T71** | Non-régression + doc Sprint 12 | ✅ Livré |

---

## 3. Détail technique

### 3.1 Balances tiers V2 (T66)

**Vault — `aged_balance.go`** :
- Formule d'ancienneté : `age_days = as_of_date - COALESCE(date_maturity, line_date)`
- Exclusion des lignes totalement lettrées : `WHERE full_reconcile_id IS NULL`
- Détection automatique de l'`aging_basis` : `date_maturity` | `line_date_fallback` | `mixed`
- Réponse API enrichie : `aging_basis`, `v2_limitations[]` (remplace `v1_limitations`)
- Limitation V2 documentée : lignes avec `matching_number` sans résiduel fiable restent dans le périmètre

**Handler — `accounting_aged_balance.go`** :
- `company_ids` exposé dans la réponse JSON
- `aging_basis` typé `AgingBasis`

**Export CSV — `accounting_aged_balance_export.go`** :
- Colonne `aging_basis` ajoutée entre `total` et `as_of_date`

### 3.2 Linky/UI balances tiers V2 (T67)

- Interfaces TypeScript mises à jour (`aging_basis`, `v2_limitations`, `company_ids`) pour aged-receivables et aged-payables
- Routes API proxy passent les nouveaux champs
- `AgedBalanceBlock` affiche un badge coloré indiquant la source d'ancienneté (Échéance / Mixte / Date écriture)
- Bannière de limitations V2 (liste) remplace l'ancienne ligne V1

### 3.3 AccountingFactsPack (T68)

Nouveau pack structuré `facts/accounting_types.go` + `facts/accounting_engine.go` :
- **Types** : `AccountingFactsPack`, `AccountingContextMeta`, `AccountingRubrics`, `AccountingDelta`, `AgedBalanceSummary`, `AccountingSignal`, `AccountingQuality`
- **Engine** : `BuildAccountingFactsPack(input)` → détection automatique des deltas (>15 %, >500 €), agrégation des balances tiers (top 5 partenaires par montant > 90j), détection de 5 types de signaux (variation CR, tension clients, dette fournisseurs, variation bilan, couverture partielle)
- **Hash** : `AccountingPayloadHash()` → SHA256 canonique pour traçabilité

### 3.4 Insight comptable v1 (T69)

**Template engine** — `facts/accounting_template.go` :
- `GenerateAccountingInsight(pack)` → `headline`, `what_i_see`, `to_check`, `scope_note`
- Headline : priorité alert > variation résultat > bilan > fallback
- What I see : résultat net, bilan, top 3 deltas, créances clients, dettes fournisseurs
- To check : signaux watch/alert, top partenaire > 90j, couverture partielle, absence N-1
- Scope note : période, tenant, sociétés, référentiel, couverture par bloc

**Règle d'exécution :** le contenu comptable est d'abord produit par le moteur template-first à partir du `AccountingFactsPack` ; Mistral interne, s'il est activé, n'intervient qu'en reformulation et ne modifie ni les faits, ni les signaux, ni la logique métier.

**Reformulation Mistral** — `mistral/client.go` :
- Nouvelle méthode `RawChat(prompt)` pour reformulation libre
- Utilisée dans `handlers/accounting_insight.go` si `use_mistral=true`
- Fallback transparent : si Mistral échoue → template brut

**Handler** — `POST /diva/accounting/insight` :
- Accepte `AccountingInsightRequest` (context + blocs comptables + options)
- Journalise le pack complet en debug (`event=accounting_facts_pack`)

### 3.5 Encart insight Synthèse (T70)

**Route API** — `POST /api/diva/accounting-insight` :
- Proxy Linky → Diva avec timeout 15 s

**Composant** — `AccountingInsightBlock.tsx` :
- Autonome : charge ses propres données (rubriques + balances) en parallèle, puis appelle Diva
- 5 états : idle, loading, ready, error, no_data
- UI sobre : badge Diva, headline, what_i_see, bloc vigilance conditionnel, scope note, facts_hash (8 premiers hex), bouton refresh, horodatage
- Position dans la Synthèse : entre Bilan/CR et les blocs classes PCG (non concurrent avec le cockpit 12 cards)

---

## 4. Non-régression (T71)

| Contrôle | Résultat |
|----------|----------|
| Build Vault | ✅ OK |
| Build Diva | ✅ OK |
| Build Linky | ✅ OK |
| Balances tiers V2 (formule COALESCE) | ✅ Implémenté |
| Exclusion `full_reconcile_id` | ✅ Implémenté |
| Export CSV colonne `aging_basis` | ✅ Ajouté |
| AccountingFactsPack hash | ✅ SHA256 canonique |
| Insight template-first | ✅ Aucune IA externe |
| Mistral local optionnel | ✅ Fallback transparent |
| Encart insight UI | ✅ Sobre, non concurrent |
| Surface 4 blocs Synthèse | ✅ Inchangée |
| Comparatif N/N-1 | ✅ Inchangé |
| Multi-sociétés | ✅ Inchangé |
| Drill rubrique → BG → GL | ✅ Inchangé |
| Exports existants | ✅ Inchangés |
| Habilitations `/accounting/*` | ✅ Inchangées |

---

## 5. Gates — état fin Sprint 12

| Gate | Statut |
|------|--------|
| **Gate A** | ✅ Inchangée |
| **Gate B** | ✅ Close — inchangée |
| **Gate C** | ✅ **Close — consolidée** par fiabilisation tiers V2 et première lecture interprétée |
| **Gate D** | ✅ **Substantiellement renforcée** — données V2 (date_maturity, full_reconcile_id) + première couche d'insight comptable Diva |

---

## 6. Fichiers modifiés / créés

### Vault
- `sources/vault/internal/storage/aged_balance.go` — V2 : COALESCE, full_reconcile_id, aging_basis, v2_limitations
- `sources/vault/internal/handlers/accounting_aged_balance.go` — aging_basis, company_ids, v2_limitations
- `sources/vault/internal/handlers/accounting_aged_balance_export.go` — colonne aging_basis CSV

### Diva
- `units/diva/internal/facts/accounting_types.go` — **NOUVEAU** : types AccountingFactsPack
- `units/diva/internal/facts/accounting_engine.go` — **NOUVEAU** : BuildAccountingFactsPack, detectDeltas, detectSignals, AccountingPayloadHash
- `units/diva/internal/facts/accounting_template.go` — **NOUVEAU** : GenerateAccountingInsight (template-first)
- `units/diva/internal/models/accounting.go` — **NOUVEAU** : AccountingInsightRequest/Response
- `units/diva/internal/handlers/accounting_insight.go` — **NOUVEAU** : POST /diva/accounting/insight
- `units/diva/internal/mistral/client.go` — RawChat() pour reformulation
- `units/diva/internal/server/server.go` — route /diva/accounting/insight

### Linky
- `app/api/accounting/aged-receivables/route.ts` — aging_basis, v2_limitations, company_ids
- `app/api/accounting/aged-payables/route.ts` — idem
- `app/api/diva/accounting-insight/route.ts` — **NOUVEAU** : proxy POST
- `components/AccountingInsightBlock.tsx` — **NOUVEAU** : encart insight
- `components/AccountingSummaryView.tsx` — intégration AccountingInsightBlock

---

## 7. Après ce sprint

Suite logique :
- **Balances tiers V2+** avec meilleure prise en compte du résiduel / lettrage partiel
- **Insights comptables Diva** plus riches, toujours local-first
- **Consolidation avancée** si besoin métier
- **Rejouabilité formelle** — premiers jalons documentaires et techniques à cadrer en Sprint 13+
- **Rapport structuré DOCX** généré à partir du FactsPack — template-first, local-first
