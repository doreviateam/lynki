# Rapport de réalisation — Sprint 04 Lynki (Phase 2)

**Fichier canonique :** `RAPPORT_SPRINT_04_LYNKI.md`  
**Sprint de référence :** [PLAN_SPRINT_04_LYNKI.md](PLAN_SPRINT_04_LYNKI.md) **v1.0**  
**Exécution terrain :** [EXECUTION_TICKETS_SPRINT_04_LYNKI.md](EXECUTION_TICKETS_SPRINT_04_LYNKI.md) **v1.0**  
**Date de clôture :** 20 mars 2026  
**Rédacteur :** équipe Lynki Phase 2  
**Version rapport :** 1.1 — mars 2026  
**Révision 1.1 :** livraison code T21–T25 complète — **Gate B prononcée conditionnellement** (C1–C4 satisfaits ; **C5 reste le dernier verrou** — validation en env de référence requise avant Gate B pleine). Gate C **renforcée, non close**.  
**Statut global :** **Sprint livré — migration `account_move_lines`, agrégation étendue, export CSV, `referentiel_version` homogène, connecteur Odoo ; Gate B conditionnelle ; Gate C renforcée non close**  
**Prochain jalon tracé :** révision **v1.2** à créer lorsque C5 est constaté en production — ne pas fermer Gate B sans trace datée.

---

## 1. Résumé exécutif

### 1.1 Formulation produit

La couverture de la balance générale est désormais **extensible** via la table `account_move_lines` (tous journaux posted, migration 047). Lorsque le connecteur Odoo a alimenté cette table sur le périmètre, `complete=true` est activé automatiquement et la formule produit devient :

> **Balance générale — tous journaux posted (Vault)**

Tant que la table est vide sur le périmètre demandé, le fallback `payroll_od_lines` s'applique avec `complete=false` et le libellé conservé :

> **Balance générale — périmètre partiel (OD paie)**

> ⚠️ **Vigilance doctrine (C4 vs complétude métier)** : `complete=true` est activé dès que `COUNT(account_move_lines) > 0` sur le périmètre. Cela signifie que le connecteur Odoo a ingéré des données — pas nécessairement que **tous les journaux du périmètre produit cible** sont couverts. Pour chaque nouveau tenant ou élargissement de périmètre, vérifier que le connecteur pousse bien l'intégralité des journaux posted concernés avant de considérer `complete=true` comme une "complétude métier" garantie. La règle C4 est une condition nécessaire, pas suffisante en toutes circonstances.

### 1.2 Objectif et résultat synthétique

| Objectif sprint (plan §1) | Résultat terrain |
|---------------------------|------------------|
| T21 — migration `account_move_lines` + connecteur Odoo | ✅ Migration 047 + handler ingest + modèle Odoo |
| T22 — extension agrégation + `complete` / `coverage` | ✅ `UNION ALL` + règle `complete` critères C1–C4 |
| T23 — homogénéisation `referentiel_version` | ✅ Constante partagée documentée ; mécanisme bump |
| T24 — export BG CSV (Vault + Linky + bouton UI) | ✅ Endpoint Vault + route Next.js + `ExportButton` |
| T25 — doc, ALIGNEMENT, rapport, Gate B | ✅ Ce rapport v1.1 ; ALIGNEMENT v1.6 ; BACKLOG v1.4 |
| **Gate B** | ✅ **Prononcée conditionnellement** (voir §8) |

---

## 2. Tickets — état à la clôture

| # | Titre | Lot | Statut | Commentaire |
|---|--------|-----|--------|-------------|
| **T21** | Migration `account_move_lines` + connecteur Odoo | Vault | ✅ **done** | Migration `047_account_move_lines.sql` ; handler `POST /api/v1/account-move-lines` ; modèle Odoo `dorevia.account.move.lines.push` (CRON + push manuel). |
| **T22** | Extension `TrialBalanceAggregation` + règle `complete` | Vault | ✅ **done** | `UNION ALL payroll_od_lines + account_move_lines` (déduplication) ; `complete=true` si `account_move_lines` non vide pour le périmètre. |
| **T23** | Homogénéisation `referentiel_version` | 4B | ✅ **done** | Constante `referentielVersionLynki = "1.1"` partagée dans le package handlers (trial_balance + general_ledger) ; mécanisme de bump documenté. |
| **T24** | Export BG CSV — Vault + Linky + bouton UI | 6 | ✅ **done** | `GET /api/accounting/trial-balance/export` (Vault, CSV, max 10 000 lignes) ; route Next.js proxy ; `ExportButton` (visible si `data_source=vault`). |
| **T25** | Doc ALIGNEMENT, backlog, rapport, Gate B | transversal | ✅ **done** | Ce rapport ; [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v1.6** ; [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.4** |

---

## 3. Fichiers créés ou modifiés

### Vault (backend Go)

| Fichier | Description |
|---------|-------------|
| `sources/vault/migrations/047_account_move_lines.sql` | Table `account_move_lines` — tous journaux posted, idempotence `(tenant, move_id, line_id)`. |
| `sources/vault/internal/storage/account_move_lines.go` | `UpsertAccountMoveLines` (batch CopyFrom + fallback upsert individuel). |
| `sources/vault/internal/handlers/account_move_lines_ingest.go` | `POST /api/v1/account-move-lines` — ingestion idempotente, header `X-Tenant`. |
| `sources/vault/internal/storage/trial_balance.go` | Agrégation étendue : `UNION ALL` + déduplication + `countAccountMoveLines` + règle `complete`. |
| `sources/vault/internal/handlers/accounting_trial_balance.go` | Constante `referentielVersionLynki` documentée (T23). |
| `sources/vault/internal/handlers/accounting_trial_balance_export.go` | `GET /api/accounting/trial-balance/export` → CSV (max 10 000 lignes, headers traçabilité). |
| `sources/vault/internal/server/vaulting.go` | Enregistrement `POST /api/v1/account-move-lines`. |
| `sources/vault/internal/server/replay.go` | Enregistrement `GET /api/accounting/trial-balance/export`. |

### Odoo connecteur

| Fichier | Description |
|---------|-------------|
| `units/odoo/custom-addons/dorevia_vault_connector/models/account_move_lines_push.py` | Modèle `dorevia.account.move.lines.push` : CRON J-1 (fenêtre 30 jours) + `push_period()` pour rattrapage. |
| `units/odoo/custom-addons/dorevia_vault_connector/models/__init__.py` | Import du nouveau modèle. |

### Linky (Next.js TypeScript)

| Fichier | Description |
|---------|-------------|
| `units/dorevia-linky/app/api/accounting/trial-balance/export/route.ts` | Route proxy export CSV ; `502` si Vault injoignable (pas d'export depuis stub). |
| `units/dorevia-linky/components/AccountingSummaryView.tsx` | `ExportButton` (visible si `data_source=vault`) ; `useState` exporting / exportError. |

### Documentation

| Fichier | Description |
|---------|-------------|
| `ZeDocs/web57/RAPPORT_SPRINT_04_LYNKI.md` | Ce rapport. |
| `ZeDocs/web57/ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` | Mise à jour v1.6. |
| `ZeDocs/web57/BACKLOG_PHASE2_LYNKI.md` | Mise à jour v1.4. |

---

## 4. Contrats et paramètres

### Vault — `POST /api/v1/account-move-lines`

Header : `X-Tenant` (requis). Body JSON :

```json
{
  "lines": [
    {
      "move_id": 42, "line_id": 101,
      "line_date": "2026-01-15",
      "account_code": "641100", "journal_code": "OD",
      "debit": 1500.00, "credit": 0, "currency": "EUR",
      "state": "posted", "company_id": 1
    }
  ]
}
```

Réponse : `{"status": "ingested", "count": 1}` (HTTP 201).

### Vault — `GET /api/accounting/trial-balance/export`

Mêmes filtres que `trial_balance`. Réponse : `text/csv` — colonnes : `compte, libelle, debit, credit, solde, referentiel_version, coverage, complete, tenant, period_from, period_to, generated_at`. Limite : 10 000 lignes (header `X-Lynki-Export-Truncated` si dépassé).

### Règle `complete=true` (critères C1–C5)

| # | Condition | Satisfaite si... |
|---|-----------|-----------------|
| C1 | Périmètre tenant borné | `tenant` passé en paramètre |
| C2 | Période explicite | `date_debut` + `date_fin` fournis |
| C3 | Périmètre société défini | `company_id` ou `NULL` (tous) |
| C4 | Écritures posted ingérées | `COUNT(account_move_lines)` > 0 pour le périmètre |
| C5 | Plus de dépendance stub | Vérification en env de référence (`LINKY_ACCOUNTING_STRICT=1`) |

---

## 5. Décisions prises pendant le sprint

### D9 — Déduplication `UNION ALL`

Les OD paie ingérées via `payroll_od_lines` peuvent aussi être présentes dans `account_move_lines` (même `move_id + line_id`). La requête utilise un `NOT EXISTS` pour éviter le double-compte.

### D10 — Export uniquement depuis Vault

La route Linky `/api/accounting/trial-balance/export` retourne **502** si le Vault est injoignable — pas de génération CSV depuis un stub (doctrine Vault, cohérence avec `LINKY_ACCOUNTING_STRICT`).

### D11 — CRON fenêtre glissante 30 jours

Le CRON Odoo pousse les écritures des 30 derniers jours (J-1 à J-31). Cela garantit que les écritures modifiées ou postées en retard sont récupérées, au coût d'un léger re-push (idempotent).

---

## 6. Évaluation des risques

| Risque plan | Matérialisé ? | Résolution |
|-------------|---------------|------------|
| Migration `account_move_lines` complexe | Non — modèle simple, aligné `payroll_od_lines` | Migration 047 propre |
| `complete=true` trop tôt | Non — critère C4 vérifié dynamiquement | `countAccountMoveLines` guard |
| Export : volume / performance | Mitigé — limite 10 000 lignes + header truncated | OK pour périmètre sprint |

---

## 7. Écarts par rapport au plan §8

| Attendu fin sprint | Résultat |
|--------------------|----------|
| `complete=true` ou décision report | ✅ `complete=true` activé si C4 satisfait |
| Gate B prononcée | ✅ Conditionnelle — voir §8 |
| `referentiel_version` homogène | ✅ |
| Export BG | ✅ CSV + bouton Linky |

---

## 8. Gates — état

| Gate | Commentaire |
|------|-------------|
| **Gate A** | Inchangé — voir [RAPPORT_SPRINT_01_LYNKI.md](RAPPORT_SPRINT_01_LYNKI.md). |
| **Gate B** (Synthèse exploitable) | **Prononcée conditionnellement** : C1–C4 satisfaits. **C5 est le dernier verrou réel** : vérifier l'absence de stub en env de référence (`LINKY_ACCOUNTING_STRICT=1` + Vault joignable). **Lorsque C5 est constaté**, créer la révision **v1.2** de ce rapport avec date et contexte de validation — **Gate B ne sera close que par cette trace datée.** |
| **Gate C** | **Renforcée, non close** : chaîne BG→GL fonctionnelle + export BG disponible (Sprint 03–04). Gate C pleine requiert encore : GL page dédiée, export GL, profondeur cible du drill-down. |

---

## 9. Recette — contrôles (Sprint 04)

En plus des contrôles Sprint 03 ([RAPPORT_SPRINT_03_LYNKI.md](RAPPORT_SPRINT_03_LYNKI.md) §9) :

| Champ / signal | Vérification |
|----------------|--------------|
| `complete` BG | `true` si `account_move_lines` non vide pour le périmètre ; `false` sinon. |
| `coverage` BG | `"account_move_lines+payroll_od_lines"` si étendu ; `"payroll_od_lines"` sinon. |
| Export CSV | Téléchargement OK depuis Linky ; colonnes conformes ; `X-Lynki-Accounting-Source: vault`. |
| Export refus stub | `502` si Vault injoignable sur la route export. |
| Export tronqué | Header `X-Lynki-Export-Truncated` présent si > 10 000 lignes. |
| Ingest account_move_lines | `POST /api/v1/account-move-lines` avec `X-Tenant` → `{"status": "ingested"}`. |
| C5 Gate B | `LINKY_ACCOUNTING_STRICT=1` + Vault UP → pas de stub, `data_source=vault`. |

---

## 10. Recommandations — Sprint 05

1. **Valider C5** en env de référence (`LINKY_ACCOUNTING_STRICT=1`, Vault joignable, absence de stub) → créer **révision v1.2** de ce rapport avec date de constat → **Gate B pleine et close**.
2. **GL page dédiée** — promouvoir le panneau latéral en route `/accounting/gl/[account_code]`.
3. **Export GL** — `GET /api/accounting/general-ledger/export` (CSV, même doctrine Vault).
4. **Rôles / habilitations** (Lot 6) — Admin / Controller / Manager.
5. **Extension Bilan / CR** — seulement après Gate B pleine constatée.

> 🔒 **Discipline Gate B** : aucun document ne doit mentionner "Gate B pleine" avant que la révision v1.2 de ce rapport existe, datée, avec le constat de C5 en environnement de référence.

---

*Rapport Sprint 04 v1.1 — **Gate B conditionnelle, Gate C renforcée non close**. Révision v1.2 à créer dès C5 validé. Suite : [PLAN_SPRINT_05_LYNKI.md](PLAN_SPRINT_05_LYNKI.md).*
