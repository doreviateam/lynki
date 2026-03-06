# Plan d'implémentation — Carte Paiements (Rapprochement bancaire)

**Date :** 2026-03-03  
**Version :** v1.1 (patch)  
**Patch v1.1 :** Tolérance somme, date de référence unique, message Odoo inaccessible, cache, périmètre P0, test anti-vert-trompeur  
**Référence :** `SPEC_CARTE_PAIEMENTS_v1.0.md`  
**Roadmap :** §12 de la SPEC (4 étapes figées)  
**Durée estimée :** 3–5 jours (étapes 1–3)

---

## 1. Vue d'ensemble

| Étape | Tâche | Priorité | Estimation |
|-------|-------|----------|------------|
| **1** | Implémenter contrôle de complétude (§3.2) | Haute | 1,5 j |
| **2** | Garantir ingestion exhaustive des paiements `posted` | Haute | 0,5 j |
| **3** | Implémenter Option A temporairement | Haute | 1,5 j |
| **4** | Planifier Option B (évolution structurante) | Moyen terme | Spécification |

---

## 2. Étape 1 — Contrôle de complétude

### 2.1 Objectif

Avant tout affichage des KPI (A, B, couverture), vérifier :

```
count(erp.payments_posted) == count(vault.payments_documents)
AND
abs(sum_erp_amount_signed - sum_vault_amount_signed) <= 0.01
```

La tolérance de 0,01 € sur la somme évite un faux blocage (badge « Données incomplètes ») dû aux différences de centimes / arrondis. Le count reste en égalité stricte.

Si l'une des deux conditions est fausse : badge « Données incomplètes », couverture = —, message explicatif.

### 2.2 Composants à développer

#### 2.2.1 Odoo — Exposition count + sum

**Fichier :** `units/odoo/custom-addons/dorevia_vault_connector/controllers/linky_bank_reconciliation.py`

**Action :** Étendre la réponse JSON pour inclure (ou créer un endpoint dédié) :

```json
{
  "payments_posted_count": 42,
  "payments_posted_sum_amount_signed": -125000.00
}
```

**Requêtes Odoo :**
- `account.payment` : `state in ('posted','paid','in_process','sent','reconciled')`, filtre `company_id`, filtre **`payment_date`** selon `date_from` / `date_to`
- `amount_signed` = montant signé (décaissement négatif, encaissement positif) — dériver de `amount` et `payment_type`

**Règle P0 (date de référence unique) :** Le filtre période est appliqué sur `payment_date` côté Odoo et sur `documents.date_value` côté Vault. Le champ `date_value` doit représenter exactement `payment_date` (même sémantique). Pas de mélange `date` / `payment_date` / `create_date` — une seule colonne de référence.

**Alternative :** Créer un nouvel endpoint `/dorevia/vault/payments_completeness` pour éviter de surcharger `linky_bank_reconciliation`.

#### 2.2.2 Vault — Exposition count + sum

**Fichier :** `sources/vault/internal/storage/` (nouvelle requête ou handler)

**Requête SQL :**
```sql
SELECT COUNT(*), COALESCE(SUM(amount_signed), 0)
FROM documents
WHERE tenant = $1
  AND (odoo_model = 'account.payment' OR source = 'payment')
  AND ($2::text IS NULL OR $2 = '' OR company_id = $2)
  AND ($3::timestamp IS NULL OR date_value >= $3)
  AND ($4::timestamp IS NULL OR date_value <= $4)
```
(Paramètres $3/$4 : `date_from` / `date_to` si période sélectionnée.)

**Endpoint :** Nouveau `GET /ui/aggregations/payments-completeness?tenant=X&company_id=Y&date_from=&date_to=` ou extension de treasury. Le contrôle est évalué par tenant, par société et par période (SPEC §3.2) pour éviter faux blocages liés à des paiements hors période.

**Cache :** TTL 30–60 s par clé `(tenant, company_id, date_from, date_to)`. Évite de spammer Odoo à chaque refresh / poll Linky.

**Réponse :**
```json
{
  "payments_count": 42,
  "payments_sum_amount_signed": -125000.00
}
```

#### 2.2.3 Vault — Routage Odoo et messages distincts

Le Vault doit appeler Odoo pour récupérer `payments_posted_count` et `payments_posted_sum_amount_signed`. Réutiliser le routage existant (`ODOO_BANK_RECONCILIATION_URL`, `ODOO_BANK_RECONCILIATION_URL_LAPLATINE2026`).

**Option :** L'endpoint Odoo `linky_bank_reconciliation` (ou nouveau) retourne les deux métriques ; le Vault les compare à ses propres agrégats.

**Messages distincts (cas Odoo inaccessible) :**

| Situation | Message |
|-----------|---------|
| Odoo répond et count/sum diffèrent | « Certains paiements ERP validés ne sont pas encore enregistrés dans le Vault. » |
| Odoo ne répond pas (timeout, 5xx) | « Contrôle de complétude indisponible (Odoo inaccessible) » |

Dans les deux cas : couverture = —, badge « Données incomplètes ». Mais le message permet d'éviter une panique en prod (Odoo down ≠ données corrompues).

#### 2.2.4 Linky — Affichage conditionnel

**Invariant SPEC §3.0 :** Linky ne consomme que des données issues du Vault (pas d'appel direct à Odoo).

**Fichier :** `units/dorevia-linky/app/api/` — Nouvelle route ou extension `dashboard-metrics` / `treasury`

**Logique :**
1. Appeler Vault (ou endpoint agrégé) qui exécute le contrôle
2. Si `is_complete == false` : retourner `completeness_check: { ok: false, badge: "Données incomplètes", message: "..." }`
3. Carte Paiements : n'afficher A, B, couverture que si `is_complete == true` ; sinon badge + message

**Composant carte :** Créer ou adapter `PaymentsReconciliationCard` qui :
- Affiche le badge « Données incomplètes » si le contrôle échoue
- Sinon affiche À traiter, Traité, Couverture probante

### 2.3 Tâches détaillées (Étape 1)

| ID | Tâche | Fichier | Estimation |
|----|-------|---------|------------|
| 1.1 | Endpoint Odoo count + sum paiements posted | `linky_bank_reconciliation.py` ou nouveau contrôleur | 0,25 j |
| 1.2 | Requête Vault count + sum documents payment | `storage/` + handler | 0,25 j |
| 1.3 | Endpoint Vault payments-completeness (compare Odoo vs Vault + cache TTL) | `handlers/aggregations_*.go` | 0,25 j |
| 1.4 | Route Linky /api/payments-reconciliation (appel Vault + contrôle) | `app/api/` | 0,25 j |
| 1.5 | Composant carte avec branchement « Données incomplètes » | `components/` | 0,25 j |
| 1.6 | Tests manuels (écart count, écart sum, tolérance 0,01 €) | — | 0,25 j |

---

## 3. Étape 2 — Ingestion exhaustive des paiements posted

### 3.1 Objectif

Garantir que tout paiement `posted` dans l'ERP est vaulté. Renforcer le connecteur et le monitoring.

### 3.2 Vérifications

| Vérification | Action |
|--------------|--------|
| CRON `cron_vault_send_payments` | Actif, intervalle ≤ 2 min |
| CRON `cron_vault_fetch_proof_payments` | Actif, intervalle ≤ 1 min |
| Config DVIG | `dorevia.dvig.url`, `dorevia.dvig.token` présents sur chaque tenant |
| Queue job | Si utilisé, vérifier workers actifs |
| failed_soft | Script ou CRON pour retenter (backoff existe déjà) |
| failed_hard | Procédure manuelle de résolution documentée |
| Backfill | Script `backfill_all_payments_to_vault.py` disponible et documenté |

### 3.3 Tâches détaillées (Étape 2)

| ID | Tâche | Action | Estimation |
|----|-------|--------|------------|
| 2.1 | Audit CRON | Vérifier `ir_cron` actifs pour vault send/fetch payments | 0,1 j |
| 2.2 | Documentation runbook | Procédure « Paiements non vaultés : diagnostic et résolution » | 0,2 j |
| 2.3 | (Optionnel) Dashboard ou alerte | Compteur paiements todo/failed_soft par tenant | 0,2 j |

---

## 4. Étape 3 — Option A (dérivation temporaire)

### 4.1 Objectif

Réutiliser `financial_recon_deltas` et `impacted_documents` pour calculer A et B sans nouveau flux Odoo.

**Formules :**
- A = `unconfirmed_amount_abs` (documents payment dont confirmed_abs < amount_signed)
- B = `confirmed_amount_abs` (somme des confirmed_abs sur documents payment)

### 4.2 Prérequis

1. **Impacted_documents** : Odoo doit envoyer `impacted_documents` dans les événements `bank.move.reconciled` (déjà en place si addon à jour).
2. **Confirmation Bancaire** : La table `financial_recon_deltas` est alimentée par le handler `POST /api/v1/bank-reconciliation/confirmation-events` (suspension Décision Produit 2026-02-25 à lever).
3. **amount_signed** : Les documents payment doivent avoir `amount_signed` renseigné (backfill si nécessaire).

### 4.3 Composants à modifier

#### 4.3.1 Vault — Réactiver agrégation confirmation

**Fichier :** `sources/vault/internal/handlers/aggregations_treasury.go`

La réponse treasury inclut déjà un bloc `confirmation` (calculé depuis `financial_recon_deltas`). Vérifier qu'il est exposé et consommable (la « suspension » peut être une non-exposition côté Linky, pas une désactivation du calcul).

**Action :** S'assurer que `GetConfirmationAggregation` est appelé et que `confirmed_amount_abs`, `unconfirmed_amount_abs`, `confirmation_rate` sont retournés lorsque des données existent.

#### 4.3.2 Linky — Consommer confirmation pour carte Paiements

**Fichier :** `units/dorevia-linky/app/api/` — route dédiée ou extension

**Mapping :**
- A = `confirmation.unconfirmed_amount_abs` (ou `total_amount_abs - confirmed_amount_abs`)
- B = `confirmation.confirmed_amount_abs`
- Couverture = `B / (A + B)` si `A + B > 0`

**Périmètre P0 :** `account.payment` **uniquement**. `pos.payment` est exclu du calcul A/B en Option A (à reconsidérer en Option B). Cela évite qu'un Z/POS fasse varier la carte « Paiements » alors qu'elle vise banque ↔ paiements ERP.

#### 4.3.3 Test canonique anti-vert-trompeur

Ce test garantit que Véréna ne verra jamais « tout vert » sans rapprochement effectif :

1. **Créer un paiement posted non rapproché**
   - Vérifier : A > 0, B = 0 (ou B inchangé), couverture < 100 %
2. **Rapprocher ce paiement** (lettrage avec relevé bancaire)
   - Vérifier : A diminue, B augmente, couverture progresse

#### 4.3.4 Backfill confirmation

Si des rapprochements existent en Odoo sans événements envoyés :

- Exécuter `backfill_reconciliation_confirmation_events` (lignes BSL rapprochées)
- Déclencher le worker DVIG pour transmettre au Vault
- Vérifier que `financial_recon_deltas` est peuplé

### 4.4 Tâches détaillées (Étape 3)

| ID | Tâche | Fichier | Estimation |
|----|-------|---------|------------|
| 3.1 | Vérifier exposition confirmation dans réponse treasury | `aggregations_treasury.go` | 0,2 j |
| 3.2 | Route API Linky payments-reconciliation (A, B, couverture) | `app/api/` | 0,25 j |
| 3.3 | Composant carte Paiements (Affichage A, B, couverture, messages) | `components/` | 0,5 j |
| 3.4 | Intégration dans DashboardWithFilters | `DashboardWithFilters.tsx` | 0,25 j |
| 3.5 | Backfill confirmation si nécessaire | Script Odoo + runbook | 0,15 j |
| 3.6 | Tests manuels (laplatine2026, données complètes vs incomplètes) | — | 0,15 j |
| 3.7 | **Test anti-vert-trompeur** (voir §4.3.3) | — | inclus 3.6 |

---

## 5. Étape 4 — Planifier Option B (évolution structurante)

### 5.1 Objectif

Documenter l'évolution vers le modèle payment-centric avec events `payment.reconciled` / `payment.unreconciled`.

### 5.2 Livrables (spécification, pas implémentation)

| Livrable | Contenu |
|----------|---------|
| SPEC Option B | Flux `payment.reconciled` / `payment.unreconciled`, schéma Vault (table ou champ documents) |
| Plan de migration | Passage Option A → Option B (backfill statut reconciled depuis financial_recon_deltas) |
| Estimation charge | Jours/homme pour Odoo + Vault + Linky |

### 5.3 Tâches (Étape 4 — planification)

| ID | Tâche | Estimation |
|----|-------|------------|
| 4.1 | Rédiger SPEC Option B détaillée | 0,5 j |
| 4.2 | Plan de migration A → B | 0,25 j |
| 4.3 | Estimation et priorisation backlog | 0,25 j |

---

## 6. Ordre d'exécution recommandé

```
Étape 1 (Contrôle complétude)  →  Étape 2 (Ingestion)  →  Étape 3 (Option A)
        │                                │                        │
        └────────────────────────────────┴────────────────────────┘
                    Peuvent se chevaucher partiellement
                    (1.4–1.5 après 1.1–1.3 ; 2.x en parallèle)
```

**Bloquant :** L'étape 3 peut démarrer dès que l'étape 1 est en place (contrôle protège les indicateurs). L'étape 2 est indépendante (renforcement opérationnel).

---

## 7. Fichiers impactés (résumé)

| Composant | Fichiers |
|-----------|----------|
| **Odoo** | `linky_bank_reconciliation.py` ou nouveau contrôleur `payments_completeness.py` |
| **Vault** | `storage/` (nouvelle requête), `handlers/` (nouvel endpoint ou extension treasury) |
| **Linky** | `app/api/payments-reconciliation/route.ts`, `components/PaymentsReconciliationCard.tsx`, `DashboardWithFilters.tsx` |
| **Documentation** | Runbook ingestion paiements, SPEC Option B (étape 4) |

---

## 8. Definition of Done (par étape)

### Étape 1
- [ ] Endpoint Odoo expose `payments_posted_count` et `payments_posted_sum_amount_signed`
- [ ] Endpoint Vault expose `payments_count` et `payments_sum_amount_signed` (documents)
- [ ] Contrôle count (strict) + sum (tolérance ≤ 0,01 €) exécuté avant affichage KPI
- [ ] Badge « Données incomplètes » affiché si écart ; message distinct si Odoo inaccessible
- [ ] Cache Vault TTL 30–60 s
- [ ] Test : créer paiement Odoo non vaulté → badge affiché

### Étape 2
- [ ] CRON vérifiés actifs
- [ ] Runbook rédigé
- [ ] Aucun paiement posted en todo > 1 h (sauf config manquante connue)

### Étape 3
- [ ] A, B, Couverture affichés quand complétude OK
- [ ] Messages contextuels (« Tous rapprochés », « Des paiements restent à rapprocher »)
- [ ] Carte intégrée au dashboard
- [ ] Test laplatine2026 avec données réelles
- [ ] Test anti-vert-trompeur : paiement posted non rapproché → A > 0, couverture < 100 % ; rapprocher → A diminue, B augmente

### Étape 4
- [x] SPEC Option B rédigée → SPEC_CARTE_PAIEMENTS_OPTION_B_v1.0.md
- [x] Plan de migration documenté (inclus dans SPEC Option B §8)
- [x] Estimation validée (~5 j)

---

## 9. Risques et mitigations

| Risque | Mitigation |
|-------|------------|
| Odoo inaccessible pour contrôle | Timeout court ; si échec → badge « Données incomplètes », message « Contrôle de complétude indisponible (Odoo inaccessible) » (distinct de l'écart count/sum) |
| amount_signed NULL sur documents anciens | Backfill migration 036 ; exclure du sum ou traiter comme 0 |
| Confirmation vide (pas d'impacted_documents) | Option A limitée ; documenter que Option B lève cette limite |
| Multi-société | Filtre company_id cohérent Odoo/Vault |
| Période | Filtre date identique Odoo/Vault — contrôle par période (SPEC §3.2) évite faux blocages |

---

## 10. Références

- SPEC_CARTE_PAIEMENTS_v1.0.md
- SPEC_CARTE_PAIEMENTS_OPTION_B_v1.0.md (Étape 4)
- AVIS_EXPERT_SPEC_CARTE_PAIEMENTS_v1.0.md
- SPEC_Confirmation_Bancaire_Stricte_v1.3.md
- RUNBOOK_BACKFILL_VAULT.md (backfill payments)
- RUNBOOK_PAIEMENTS_NON_VAULTES.md (Étape 2)

---

**Fin du plan d'implémentation v1.1**
