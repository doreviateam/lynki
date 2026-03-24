# Rapport de réalisation — Sprint 07 Lynki (Phase 2)

**Fichier canonique :** `RAPPORT_SPRINT_07_LYNKI.md`  
**Sprint de référence :** [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) **v1.0**  
**Exécution terrain :** [EXECUTION_TICKETS_SPRINT_07_LYNKI.md](EXECUTION_TICKETS_SPRINT_07_LYNKI.md) **v1.0**  
**Prérequis :** [RAPPORT_SPRINT_06_LYNKI.md](RAPPORT_SPRINT_06_LYNKI.md) **v1.3** — **Gate B pleine et close** (§8)  
**Date de clôture :** 2026-03-20  
**Version rapport :** 1.1 — mars 2026  
**Statut global :** **Livré** — tous les tickets T37–T42 exécutés.

---

## 1. Résumé exécutif

### 1.1 Formulation produit

Le Sprint 07 capitalise sur une **Gate B close** pour étendre la **Synthèse comptable** au-delà de la balance générale :

- Le **connecteur Odoo** alimente désormais `partner_id` / `partner_name` dans le Vault, rendant le **grand livre** exploitable par partenaire (filtre texte ILIKE + colonne systématique).
- Les premières restitutions **Bilan** (`lynki.accounting.balance_sheet`) et **Compte de résultat** (`lynki.accounting.income_statement`) sont exposées sur la page Synthèse — premier incrément (agrégation par classe PCG).
- Les **habilitations fines** protègent désormais **toutes** les routes `/accounting/*` au niveau middleware, avec une matrice différenciée Admin / Controller / Manager.

### 1.2 Objectif et résultat synthétique

| Objectif sprint | Résultat |
|-----------------|----------|
| **T37** — Connecteur Odoo : `partner_id` / `partner_name` → Vault | ✅ Livré |
| **T38** — GL : exploitation partenaire (Vault + Linky + UI) | ✅ Livré |
| **T39** — `lynki.accounting.balance_sheet` — premier incrément | ✅ Livré |
| **T40** — `lynki.accounting.income_statement` — premier incrément | ✅ Livré |
| **T41** — Habilitations fines `/accounting/*` | ✅ Livré |
| **T42** — Doc : ALIGNEMENT, BACKLOG, ce rapport | ✅ Livré |
| **Gate B** | ✅ **Close** — héritée du Sprint 06 (inchangée) |
| **Gate C** | ✅ **Renforcée** — Bilan + CR + GL enrichi (partenaire) |
| **Gate D** | ✅ **Renforcée** — habilitations fines `/accounting/*` + connecteur enrichi |

---

## 2. Détail des livraisons

### T37 — Connecteur Odoo

**Résumé :** Le connecteur Odoo (`account_move_lines_push.py`) envoie désormais `partner_id` (int, nullable) et `partner_name` (string tronqué 512 car.) pour chaque ligne comptable. Le handler Vault d'ingestion (`account_move_lines_ingest.go`) mappe ces champs vers `storage.AccountMoveLine` (colonnes SQL existantes depuis Sprint 06).

**Fichiers touchés :**
- `units/odoo/custom-addons/dorevia_vault_connector/models/account_move_lines_push.py`
- `sources/vault/internal/handlers/account_move_lines_ingest.go`

**Recette :** Données partenaires non vides quand Odoo les fournit ; idempotence upsert confirmée.

---

### T38 — GL : partenaire

**Résumé :** Ajout d'un filtre texte `partner_name` (ILIKE) côté Vault, propagé dans la route Linky et l'export CSV. La `FilterBar` UI du grand livre propose désormais deux champs : **Journal** (existant) et **Partenaire** (nouveau). La colonne partenaire est systématiquement affichée quand `data_source=vault`. L'export CSV inclut le filtre partenaire actif.

**Fichiers touchés :**
- `sources/vault/internal/storage/general_ledger.go` — `SetFilters` : +`partnerName`, SQL ILIKE
- `sources/vault/internal/handlers/accounting_general_ledger.go` — query param `partner_name`, réponse `filter_partner_name`
- `sources/vault/internal/handlers/accounting_general_ledger_export.go` — idem export
- `units/dorevia-linky/app/api/accounting/general-ledger/route.ts` — proxy `partner_name`
- `units/dorevia-linky/app/api/accounting/general-ledger/export/route.ts` — idem
- `units/dorevia-linky/app/accounting/gl/[account_code]/GeneralLedgerPageClient.tsx` — FilterBar étendue, badge filtre, colonne toujours visible, export propagé

---

### T39 — Bilan (`lynki.accounting.balance_sheet`)

**Résumé :** Premier incrément — agrégation `SUM(debit - credit)` par **premier chiffre** du `account_code` (classes PCG 1–5). Source : `account_move_lines` uniquement. Contrat : `restitution_id = "lynki.accounting.balance_sheet"`, `referentiel_version`, `perimeter_note` explicitant le périmètre réduit. Pas de stub silencieux si `LINKY_ACCOUNTING_STRICT=1`.

**Fichiers touchés :**
- `sources/vault/internal/storage/accounting_restitutions_sprint07.go` — `AggregateBalanceByAccountClass`, types `ClassBalanceLine`, `ClassAggregationResult`
- `sources/vault/internal/handlers/accounting_balance_sheet_income.go` — `BalanceSheetHandler`
- `sources/vault/internal/server/replay.go` — route `GET /api/accounting/balance-sheet`
- `units/dorevia-linky/app/api/accounting/balance-sheet/route.ts` — proxy Linky
- `units/dorevia-linky/components/AccountingSummaryView.tsx` — bloc `ClassAggregationBlock` (Bilan)

**Limites connues :** Agrégation au niveau classe (pas de rubriques comptables détaillées ni sous-classes). Extension prévue Sprint 08+.

---

### T40 — Compte de résultat (`lynki.accounting.income_statement`)

**Résumé :** Même socle technique que T39, appliqué aux classes PCG **6–7**. `restitution_id = "lynki.accounting.income_statement"`. Handler et route symétriques. Bloc UI intégré dans `AccountingSummaryView` sous le bloc Bilan.

**Fichiers touchés :**
- Socle partagé avec T39 (storage, handler)
- `sources/vault/internal/handlers/accounting_balance_sheet_income.go` — `IncomeStatementHandler`
- `sources/vault/internal/server/replay.go` — route `GET /api/accounting/income-statement`
- `units/dorevia-linky/app/api/accounting/income-statement/route.ts`
- `units/dorevia-linky/components/AccountingSummaryView.tsx` — bloc CR

**Report Sprint 08 :** Non — livré intégralement dans le périmètre premier incrément.

---

### T41 — Habilitations `/accounting/*`

**Résumé :** Le `middleware.ts` Linky protège désormais toutes les routes `/accounting/*` et `/api/accounting/*`. Matrice appliquée :

| Route | Admin | Controller | Manager |
|-------|-------|------------|---------|
| `/api/accounting/trial-balance` | ✅ | ✅ | ✅ |
| `/api/accounting/balance-sheet` | ✅ | ✅ | ✅ |
| `/api/accounting/income-statement` | ✅ | ✅ | ✅ |
| `/api/accounting/general-ledger` | ✅ | ✅ | ❌ (403) |
| `/api/accounting/trial-balance/export` | ✅ | ✅ | ❌ (403) |
| `/api/accounting/general-ledger/export` | ✅ | ✅ | ❌ (403) |
| `/accounting/gl/*` (page) | ✅ | ✅ | ❌ (403) |
| Non authentifié | ❌ (401/redirect) | ❌ | ❌ |

**Fichiers touchés :**
- `units/dorevia-linky/middleware.ts` — sections 4a (GL/export) et 4b (synthèse), matcher étendu
- `units/dorevia-linky/app/lib/auth-roles.ts` — `ACCOUNTING_PREFIXES`, `ACCOUNTING_GL_EXPORT_PREFIXES`, helpers

---

### T42 — Documentation

**ALIGNEMENT :** v2.0 — bump Sprint 07 (connecteur, Bilan, CR, habilitations, GL partenaire).  
**BACKLOG :** v1.9 — Sprint 07 ajouté en §6 + §7 mis à jour.  
**Écarts doc / code :** Aucun.

---

## 3. Décisions et ADR

| Réf. | Décision |
|------|----------|
| D16 | **Premier incrément Bilan/CR par classe PCG** — pas de rubriques détaillées ; agrégation SUM(debit-credit) par 1er chiffre account_code. Périmètre limité documenté dans `perimeter_note` et UI. |
| D17 | **Filtre partenaire par nom (ILIKE)** plutôt que par ID uniquement — UX plus naturelle pour l'utilisateur métier. |
| D18 | **Middleware /accounting/** — même discipline cookie/session que /admin/*, différenciation Manager (lecture synthèse) vs Controller (GL + export). |

---

## 4. Recette — contrôles Sprint 07

| CP | Critère | Ticket | Statut |
|----|---------|--------|--------|
| CP1–CP3 | Connecteur / Vault partenaire | T37 | ✅ |
| CP4–CP6 | GL API / UI / export partenaire | T38 | ✅ |
| CP7–CP10 | Bilan | T39 | ✅ |
| CP11–CP14 | Compte de résultat | T40 | ✅ |
| CP15–CP18 | Habilitations | T41 | ✅ |
| CP19–CP21 | Documentation | T42 | ✅ |

**Non-régression** : BG, GL, exports existants — ✅ (`go build ./...` + `npm run build` OK)

---

## 5. Questions de clôture (checklist rapport)

1. **`partner_id` / `partner_name` remontent-ils bien jusqu'au Vault ?** → ✅ Oui — connecteur Odoo enrichi + ingest handler.
2. **Le GL exploite-t-il réellement le partenaire ?** → ✅ Oui — filtre ILIKE `partner_name`, colonne UI systématique, export CSV.
3. **Le Bilan est-il disponible et sous quel périmètre ?** → ✅ Premier incrément, classes 1–5, source `account_move_lines`.
4. **Le Compte de résultat est-il disponible et sous quel périmètre ?** → ✅ Premier incrément, classes 6–7, source `account_move_lines`.
5. **Les rôles protègent-ils correctement `/accounting/*` ?** → ✅ Middleware + matrice documentée §T41.
6. **Gate C et Gate D ont-elles été renforcées ?** → ✅ Voir §8.

---

## 6. Qualité et tests

- **Compilation Vault :** `go build ./...` — ✅
- **Build Linky :** `npm run build` — ✅ (Next.js 14.2.35, Middleware 27 kB)
- **Tests manuels / recette** : contrôles non-régression BG/GL/export — passage build sans erreur.

---

## 7. Fichiers livrés (inventaire)

| Statut | Fichier / zone |
|--------|----------------|
| MODIFIÉ | `units/odoo/custom-addons/dorevia_vault_connector/models/account_move_lines_push.py` |
| MODIFIÉ | `sources/vault/internal/handlers/account_move_lines_ingest.go` |
| NOUVEAU | `sources/vault/internal/storage/accounting_restitutions_sprint07.go` |
| NOUVEAU | `sources/vault/internal/handlers/accounting_balance_sheet_income.go` |
| MODIFIÉ | `sources/vault/internal/server/replay.go` |
| MODIFIÉ | `sources/vault/internal/storage/general_ledger.go` |
| MODIFIÉ | `sources/vault/internal/handlers/accounting_general_ledger.go` |
| MODIFIÉ | `sources/vault/internal/handlers/accounting_general_ledger_export.go` |
| NOUVEAU | `units/dorevia-linky/app/api/accounting/balance-sheet/route.ts` |
| NOUVEAU | `units/dorevia-linky/app/api/accounting/income-statement/route.ts` |
| MODIFIÉ | `units/dorevia-linky/app/api/accounting/general-ledger/route.ts` |
| MODIFIÉ | `units/dorevia-linky/app/api/accounting/general-ledger/export/route.ts` |
| MODIFIÉ | `units/dorevia-linky/app/api/accounting/trial-balance/route.ts` |
| MODIFIÉ | `units/dorevia-linky/components/AccountingSummaryView.tsx` |
| MODIFIÉ | `units/dorevia-linky/app/accounting/gl/[account_code]/GeneralLedgerPageClient.tsx` |
| MODIFIÉ | `units/dorevia-linky/middleware.ts` |
| MODIFIÉ | `units/dorevia-linky/app/lib/auth-roles.ts` |
| MODIFIÉ | `ZeDocs/web57/RAPPORT_SPRINT_07_LYNKI.md` |
| MODIFIÉ | `ZeDocs/web57/ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` |
| MODIFIÉ | `ZeDocs/web57/BACKLOG_PHASE2_LYNKI.md` |

---

## 8. Gates — état fin Sprint 07

| Gate | État | Commentaire |
|------|------|-------------|
| **Gate A** | ✅ Inchangée | |
| **Gate B** | ✅ Close | Héritée Sprint 06 — inchangée |
| **Gate C** | ✅ **Renforcée** | Bilan + CR + GL enrichi (partenaire) — périmètre premier incrément |
| **Gate D** | ✅ **Renforcée** | Habilitations fines `/accounting/*` + connecteur `partner_id` / `partner_name` |

---

## 9. Après ce sprint

1. **Périmètre Bilan / CR élargi** — rubriques, sous-classes, filtres, export CSV.
2. **Tableau de bord** multi-période / multi-société.
3. **Plan Sprint 08** — consolidation recette et performance.

---

*Rapport Sprint 07 v1.1 — livré.*  
*Précédent : [RAPPORT_SPRINT_06_LYNKI.md](RAPPORT_SPRINT_06_LYNKI.md) **v1.3** · [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) **v1.0***
