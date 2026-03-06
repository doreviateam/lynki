# Plan d'implémentation Scrum — Carte Trésorerie v4.1 (Hybride)

**Date :** 2026-02-25 (v4.1.1 micro-patch)  
**Référence :** `ZeDocs/web32/Carte_Trésorerie_Validée_v4.1_Hybride.md`  
**Durée estimée :** 4 sprints (6–8 jours)  
**Stack :** Vault (Go), Odoo (Python), Linky (Next.js / React)

---

## 0. Vue d'ensemble

| Sprint | Périmètre | Estimation | Statut | Dépendance |
|--------|-----------|------------|--------|------------|
| **Sprint 1** | Vault — Projection + last_event + RoundMoney2 (post-aggregation) | 2 j | À faire | — |
| **Sprint 2** | Vault — Handler Treasury unifié + mode dégradé Odoo down + helpers flags | 1,5 j | À faire | Sprint 1 |
| **Sprint 3** | Odoo — erp_balance + périmètre bancaire doc + test manuel | 0,5 j | À faire | — |
| **Sprint 4** | Linky — 4.0 sanity + proxy + UI 2 blocs + badges + timestamps | 2 j | À faire | Sprint 2, Sprint 3 |

**Principe :** Linky appelle uniquement le Vault. Le Vault agrège projection RECONCIL + proxy Odoo.

---

## Sprint 1 — Vault : Projection + structure + last_event + RoundMoney2

**Objectif :** Enrichir la projection RECONCIL (position net + volume), normaliser le naming Balance vs Volume, helper arrondi post-aggregation.

### User Story 1.1 — Structure projection (Balance vs Volume)

> En tant que handler Treasury, je veux une struct `BankReconciliationProjectionSums` claire : Balance = net signé, Volume = ABS.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 1.1.1 | Étendre `BankReconciliationProjectionSums` : `ValidatedBalance`, `UnreconciledBalance` (sommes signées) ; `ReconciledVolume`, `UnreconciledVolume` (ABS) | `bank_reconciliation.go` | 0,5 j |
| 1.1.2 | Modifier `GetBankReconciliationProjectionSums` : une requête SQL avec 4 colonnes (SUM amount vs SUM ABS(amount) selon is_reconciled) | `bank_reconciliation.go` | 0,5 j |
| 1.1.3 | **Normaliser naming (Balance vs Volume)** : renommer champs existants Reconciled/Unreconciled en ReconciledVolume/UnreconciledVolume ; vérifier usages (compilation + grep) | — | 0,25 j |

**Formules (SQL brut — pas d'arrondi dans la requête) :**
```
ValidatedBalance = Σ amount WHERE is_reconciled
UnreconciledBalance = Σ amount WHERE NOT is_reconciled
ReconciledVolume = Σ ABS(amount) WHERE is_reconciled
UnreconciledVolume = Σ ABS(amount) WHERE NOT is_reconciled
```

### User Story 1.2 — Helper RoundMoney2 (post-aggregation)

> En tant que développeur, j'arrondis les montants **après** les calculs, pas dans la requête SQL (évite artefacts sur sous-agrégats).

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 1.2.1 | Créer helper `RoundMoney2(v float64) float64` — arrondi 2 décimales ; usage unique pour tous les champs de sortie Treasury | `sources/vault/internal/utils/` ou inline | 0,1 j |
| 1.2.2 | Appliquer RoundMoney2 au moment de fabriquer la réponse/struct Go, jamais dans SUM SQL | — | — |

### User Story 1.3 — last_reconcil_event_at (optionnel)

> En tant que consommateurs, je veux savoir la fraîcheur de la donnée RECONCIL.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 1.3.1 | Ajouter `GetLastReconcilEventAt(ctx, tenant, companyID)` | `bank_reconciliation.go` | 0,25 j |
| 1.3.2 | **Choix timestamp :** `bank_reconciliation_events` a `created_at` (ingestion Vault) et `occurred_at` (métier Odoo). Pour "âge donnée vaultée" → `MAX(created_at)` recommandé. Si on utilise `occurred_at` → renommer en `last_reconcil_occurred_at` (sinon risque confusion : événement hier ingéré maintenant afficherait "il y a 1 j") | — | — |
| 1.3.3 | Requête : `SELECT MAX(created_at) FROM bank_reconciliation_events WHERE tenant = $1` (+ company_id si filtre) | — | — |

**DoD Sprint 1 :**
- [ ] `BankReconciliationProjectionSums` : champs explicites `ValidatedBalance`, `UnreconciledBalance`, `ReconciledVolume`, `UnreconciledVolume` (naming Balance vs Volume)
- [ ] Aucun arrondi dans la requête SQL ; RoundMoney2 appliqué à la sortie
- [ ] `GetLastReconcilEventAt` retourne timestamp ou nil
- [ ] Compilation OK ; grep confirme usages migrés

---

## Sprint 2 — Vault : Handler Treasury unifié + mode dégradé + helpers

**Objectif :** Agrégation projection + Odoo ; réponse v4.1 ; mode dégradé si Odoo down ; helpers (RoundMoney2, ComputeLargeDeltaThreshold).

### User Story 2.1 — Appel Odoo pour erp_balance

> En tant que Vault, je veux récupérer `erp_balance` depuis Odoo pour le propager dans la réponse Treasury.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 2.1.1 | Appeler `linky_bank_reconciliation` (Odoo) depuis le handler Treasury ; extraire `erp_balance` | `aggregations_treasury.go` | 0,5 j |
| 2.1.2 | Fusionner logique : ne plus dépendre de bank-reconciliation-health pour Treasury (optionnel : garder pour autres usages) | — | — |
| 2.1.3 | **Mode dégradé Odoo down :** si timeout/erreur → `erp_balance: null` ; `reliability_position: null`, `unvalidated_exposure: null` ; flags dépendants d'erp (`sign_mismatch`, `large_delta`, `structural_delta`) = `false` ou `null` (pas calculés) — éviter d'afficher "100%" alors que la donnée est manquante | — | 0,25 j |

### User Story 2.2 — Réponse Treasury conforme v4.1

> En tant que Linky, je reçois une réponse JSON conforme au contrat v4.1 (position, process, flags, generated_at).

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 2.2.1 | Construire `position` : validated_balance, erp_balance, unvalidated_exposure, reliability_position (LEAST(1, ...), clamp) | `aggregations_treasury.go` | 0,5 j |
| 2.2.2 | Construire `process` : reconciled_volume, unreconciled_volume, reliability_volume | `aggregations_treasury.go` | 0,25 j |
| 2.2.3 | **Helper `ComputeLargeDeltaThreshold(erpBalance float64) float64`** : `MAX(500, 0.05×ABS(erp_balance))` ; test unitaire ; puis calculer `large_delta` via ce helper | `aggregations_treasury.go` ou `internal/utils/` | 0,25 j |
| 2.2.4 | Calculer flags : sign_mismatch, large_delta, structural_delta (via helpers si réutilisés ailleurs) | — | — |
| 2.2.5 | Ajouter `generated_at` (time.Now().UTC()), `last_reconcil_event_at` / `last_reconcil_occurred_at` (optionnel) | — | 0,1 j |
| 2.2.6 | Champs legacy : si conservés, les identifier comme legacy (commentaires / doc ZeDocs) ; Linky n'utilise que `position`/`process` si présents | — | 0,1 j |

**Cas limites à couvrir :**
- erp_balance = 0 → reliability_position = 1
- total_volume = 0 → reliability_volume = 1
- ABS(validated_balance) > ABS(erp_balance) → structural_delta = true, reliability_position = 1
- erp_balance = null (Odoo down) → mode dégradé (champs dérivés null, flags neutralisés)

**DoD Sprint 2 :**
- [ ] `GET /ui/aggregations/treasury` renvoie `position`, `process`, `flags`, `generated_at`, `last_reconcil_event_at`
- [ ] Mode dégradé Odoo down : erp_balance null → reliability_position, unvalidated_exposure null ; flags neutralisés
- [ ] Helper `ComputeLargeDeltaThreshold` + test unitaire
- [ ] RoundMoney2 appliqué à tous les montants de sortie
- [ ] **No silent semantic change :** champs legacy identifiés et documentés ; Linky consomme uniquement `position`/`process` si présents

---

## Sprint 3 — Odoo : erp_balance et périmètre bancaire

**Objectif :** Exposer `erp_balance` dans la réponse standard de `linky_bank_reconciliation` ; verrouiller le périmètre bancaire (SPEC 5.2.1).

### User Story 3.1 — erp_balance dans la réponse standard

> En tant que Vault, je reçois `erp_balance` (= bank_balance) dans la réponse JSON de linky_bank_reconciliation sans passer par debug=1.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 3.1.1 | Ajouter `erp_balance` dans la réponse principale (hors `_debug`) | `linky_bank_reconciliation.py` | 0,25 j |
| 3.1.2 | Utiliser `_get_bank_balance` (déjà existant) ; round(bank_balance, 2) | — | — |
| 3.1.3 | Si bank_balance = None (erreur), retourner `erp_balance: null` ou 0 selon convention | — | — |

### User Story 3.2 — Périmètre bancaire verrouillé

> En tant que product owner, je veux un périmètre bancaire documenté et conforme (journaux actifs, default_account_id, posted).

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 3.2.1 | Vérifier que `_get_bank_balance` filtre journaux actifs (Odoo search exclut archived par défaut) | `linky_bank_reconciliation.py` | 0,1 j |
| 3.2.2 | Documenter dans le code : "Périmètre = default_account_id des journaux bank actifs, posted uniquement (SPEC Trésorerie v4.1 §5.2.1)" | — | 0,1 j |
| 3.2.3 | Si besoin : ajouter filtre explicite `("active", "=", True)` sur journals | — | 0,05 j |

**DoD Sprint 3 :**
- [ ] `erp_balance` présent dans la réponse standard (non debug)
- [ ] Périmètre bancaire conforme SPEC 5.2.1
- [ ] Tests manuels : GET /dorevia/vault/linky_bank_reconciliation?tenant=sarl-la-platine → erp_balance présent

---

## Sprint 4 — Linky : Sanity + Proxy + UI 2 blocs + Badges + Timestamps

**Objectif :** Avant l'UI, vérifier dashboard-metrics ; puis proxy unique, UI 2 blocs, badges, timestamps.

### User Story 4.0 — Integration sanity checks (avant UI)

> En tant que développeur, je m'assure que dashboard-metrics et les tuiles qui consomment Treasury ne cassent pas.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 4.0.1 | **Compile & smoke** sur dashboard-metrics + toutes les tuiles qui lisent treasury | — | 0,25 j |
| 4.0.2 | Route `/api/dashboard-metrics` : adapter le mapping pour la nouvelle structure Vault (position, process) | `app/api/dashboard-metrics/route.ts` | 0,25 j |
| 4.0.3 | Tuile "Trésorerie validée" : **décision explicite** — `treasury_validated_pct` = `reliability_volume` (qualité traitement) OU `reliability_position` (couverture probante) ; pas de mélange implicite | — | 0,1 j |
| 4.0.4 | Documenter le choix dans le code (commentaire) ou ZeDocs | — | — |

### User Story 4.1 — Proxy unique vers Vault

> En tant que Linky, j'appelle uniquement le Vault pour la carte Trésorerie (pas de bank-reconciliation-health pour les données Treasury).

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 4.1.1 | Modifier `GET /api/treasury` : un seul fetch vers `/ui/aggregations/treasury` | `app/api/treasury/route.ts` | 0,25 j |
| 4.1.2 | Supprimer l'appel à `/ui/system/bank-reconciliation-health` pour les données Treasury (optionnel : garder pour oldest_unreconciled_date, last_statement si nécessaire ailleurs) | — | — |
| 4.1.3 | Adapter le mapping : `raw.position`, `raw.process`, `raw.flags`, `raw.generated_at` → structure interne | — | 0,25 j |
| 4.1.4 | Rétrocompat : si Vault renvoie ancien format, fallback sur champs legacy | — | 0,1 j |

### User Story 4.2 — UI 2 blocs (Position + Process)

> En tant qu'utilisateur, je vois clairement deux blocs : Position (financier probant) et Process (rapprochement).

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 4.2.1 | Refactorer `TreasuryCardWithPolling` : Bloc A (Position) et Bloc B (Process) | `TreasuryCardWithPolling.tsx` | 0,5 j |
| 4.2.2 | Bloc A : Trésorerie validée, Exposition non validée, Solde ERP, Couverture probante (barre) | — | — |
| 4.2.3 | Bloc B : Volume rapproché, Volume en attente, Taux de traitement (barre) | — | — |
| 4.2.4 | Libellés : "Couverture probante", "Taux de traitement (rapprochement)" | — | 0,1 j |

### User Story 4.3 — Badges et tooltips

> En tant qu'utilisateur, je suis alerté par des badges en cas d'anomalie (sign_mismatch, large_delta, structural_delta).

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 4.3.1 | Badge "Signes incohérents" si `flags.sign_mismatch` | `TreasuryCardWithPolling.tsx` | 0,2 j |
| 4.3.2 | Badge "Écart important" si `flags.large_delta` | — | 0,2 j |
| 4.3.3 | Badge "Écart structurel" si `flags.structural_delta` (sur Couverture probante) | — | 0,2 j |
| 4.3.4 | Tooltips explicatifs pour chaque badge (SPEC §6.1.4, §9.3, §9.4) | — | 0,2 j |

### User Story 4.4 — Timestamps ("actualisé il y a…")

> En tant qu'utilisateur, je vois "Données actualisées il y a Xs" pour renforcer la perception temps réel.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 4.4.1 | Afficher "Données actualisées il y a Xs" via `generated_at` | `TreasuryCardWithPolling.tsx` | 0,2 j |
| 4.4.2 | Optionnel : "Dernière mise à jour rapprochement : il y a Ys" via `last_reconcil_event_at` / `last_reconcil_occurred_at` | — | 0,1 j |

**DoD Sprint 4 :**
- [ ] 4.0 : dashboard-metrics adapté ; tuile Trésorerie validée pointe explicitement vers reliability_volume ou reliability_position (décision documentée)
- [ ] `/api/treasury` appelle uniquement le Vault
- [ ] UI affiche 2 blocs (Position / Process) avec libellés corrects
- [ ] Badges sign_mismatch, large_delta, structural_delta affichés
- [ ] "Données actualisées il y a Xs" visible
- [ ] Tests manuels E2E : rapprochement Odoo → refresh Linky → données à jour

---

## 5. Dépendances transverses

### dashboard-metrics et cockpit

→ Traité en **Sprint 4.0** (Integration sanity checks). Décision explicite : tuile "Trésorerie validée" = `reliability_volume` (qualité traitement) OU `reliability_position` (couverture probante).

### Rétrocompatibilité

- Phase de transition : Vault peut renvoyer les deux formats (legacy + v4.1) pendant 1 sprint
- Linky : détection du format (présence de `position`?) → utiliser v4.1 ou legacy

---

## 6. Risques et parades

| Risque | Parade |
|--------|--------|
| Odoo linky_bank_reconciliation lent (> 5s) | Timeout Vault→Odoo 5s ; mode dégradé (erp_balance null, flags neutralisés) |
| Périmètre bancaire Odoo différent du tenant | Documenter ; paramètre company_id obligatoire pour multi-société |
| Graphiques existants (pie, etc.) cassés | Conserver reconciled_volume/unreconciled_volume pour chart ; ajouter position en plus |
| last_reconcil timestamp ambigu | `occurred_at` = métier Odoo ; `created_at` = ingestion Vault. Pour "âge donnée vaultée" → préférer `created_at` si dispo ; sinon documenter `last_reconcil_occurred_at` |

---

## 7. Références

- **SPEC :** `ZeDocs/web32/Carte_Trésorerie_Validée_v4.1_Hybride.md`
- **Analyse :** `ZeDocs/web32/RAPPORT_ANALYSE_SPEC_TRESO_V4_VS_EXISTANT.md`
- **Fichiers impactés :**
  - `sources/vault/internal/storage/bank_reconciliation.go`
  - `sources/vault/internal/handlers/aggregations_treasury.go`
  - `units/odoo/custom-addons/dorevia_vault_connector/controllers/linky_bank_reconciliation.py`
  - `units/dorevia-linky/app/api/treasury/route.ts`
  - `units/dorevia-linky/components/TreasuryCardWithPolling.tsx`
  - `units/dorevia-linky/app/api/dashboard-metrics/route.ts`
