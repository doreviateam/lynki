# Plan d'implémentation — Carte Trésorerie Validée v1.1

**Version :** 1.1  
**Date :** 2026-02-22  
**Statut :** Implémenté (voir COMPTE_RENDU_Tresorerie_Validee_v1.1_2026-02-22.md)  
**Référence :** ZeDocs/web29/SPEC_LINKY_Tresorerie_Validee_v1.1.md  
**Durée estimée :** 1–1,5 jours (Linky + Vault + Odoo)  
**Stack :** Linky (Next.js), Vault (Go), Odoo (endpoint à exposer)

---

## 1. Vue d'ensemble

| Sprint | Périmètre | Estimation | Livrable |
|-------|-----------|------------|----------|
| **S1** | API treasury agrégée (deux sources) | 2–3 h | Route `/api/treasury` avec champs health |
| **S2** | Vault — route bank-reconciliation-health | 0,5–1 h | Enregistrement + proxy Odoo (si existant) |
| **S3** | Frontend verdict + bloc diagnostic | 2–3 h | Bordure, phrase, métriques secondaires |
| **S4** | CTAs + polish | 1 h | Boutons Odoo, format dates, edge cases |

**DoD global :** Critères SPEC §6 (verdict), §5 (bloc diagnostic), §7 (CTAs) validés. Chaîne Linky → Vault → Odoo opérationnelle.

---

## 2. État actuel vs cible

| Élément | Actuel (v1.0) | Cible (SPEC v1.1) |
|---------|---------------|-------------------|
| Données affichées | Trésorerie validée, en attente, fiabilité, donut | Idem + **bloc diagnostic** (lignes, journaux, dates) |
| Verdict visuel | Aucun (bordure neutre) | **Bordure** verte / orange / bleue selon fiabilité |
| Phrase explicative | Aucune | **Phrase déterministe** (0 %, partiel, 100 %) |
| Actions | Aucune | **CTAs** vers Odoo (Rapprocher, Importer) |
| Source données | treasury seul | treasury + **bank-reconciliation-health** |

---

## 3. Sprints détaillés

### Sprint 1 — API treasury agrégée (Linky)

**Objectif :** Faire de `/api/treasury` un agrégateur des deux sources (treasury + bank-reconciliation-health).

**Fichier :** `units/dorevia-linky/app/api/treasury/route.ts`

| Tâche | Action | Détail |
|-------|--------|--------|
| 1.1 | Appels parallèles | `Promise.all([treasury, bankReconciliationHealth])` — même `tenant`, `date_debut`, `date_fin`, `company_id` |
| 1.2 | Mapping treasury | Conserver `total`, `reconciled`, `unreconciled`, `reconciliation_rate`, `currency` |
| 1.3 | Mapping health | Ajouter : `unreconciled_lines_count` ← `unreconciled_entries`, `journals_count` ← `bank_accounts_count`, `last_statement_import_date` ← `last_statement_date`, `oldest_unreconciled_date` (si exposé) |
| 1.4 | Fallback | Si health en erreur ou timeout : champs secondaires à `null`, ne pas bloquer la réponse treasury |
| 1.5 | Timeout | Contrôleur AbortController (ex. 10 s) pour éviter blocage |

**Critères :** Réponse JSON enrichie. Pas de dégradation si health indisponible (stub null pour les champs secondaires).

---

### Sprint 2 — Vault : route bank-reconciliation-health

**Objectif :** S'assurer que la route Vault est enregistrée et appelle Odoo.

**Fichiers :** `sources/vault/internal/server/replay.go`, handler existant `bank_reconciliation_health.go`

| Tâche | Action | Détail |
|-------|--------|--------|
| 2.1 | Enregistrement | `app.Get("/ui/system/bank-reconciliation-health", handlers.BankReconciliationHealthHandler(cfg.OdooBankReconciliationURL))` dans `RegisterUiAggregations` |
| 2.2 | Vérifier handler | Handler existant (web15) : proxy vers `ODOO_BANK_RECONCILIATION_URL` ; retourne `unreconciled_entries`, `last_statement_date`, `bank_accounts_count` |
| 2.3 | Extension optionnelle | Si Odoo expose `oldest_unreconciled_date` : ajouter au struct `BankReconciliationHealthResponse` et au parsing |

**Critères :** GET `/ui/system/bank-reconciliation-health?tenant=X` retourne JSON conforme. Si Odoo down → stub (0, null).

---

### Sprint 3 — Frontend : verdict + bloc diagnostic

**Fichier :** `units/dorevia-linky/components/TreasuryCardWithPolling.tsx`

| Tâche | Action | Détail |
|-------|--------|--------|
| 3.1 | Bordure verdict | `rateRounded === 100` → `border-l-[var(--positive)]` ; `=== 0` → `border-l-[var(--warning)]` ; sinon → `border-l-[var(--accent)]` |
| 3.2 | Phrase déterministe | Trois branches selon `rateRounded` (100, 0, partiel) — SPEC §6 |
| 3.3 | Bloc métriques secondaires | 4 lignes : Lignes à rapprocher, Plus ancien mouvement, Journaux concernés, Dernier relevé importé |
| 3.4 | Helpers format | `formatDateOnly()` et `formatDateTime()` — retourner "—" si date invalide ou absente |
| 3.5 | Placeholder | "—" (U+2014) pour valeurs manquantes |

**Critères :** Verdict visible sans scroller. Bloc diagnostic toujours affiché (valeurs "—" si indisponible).

---

### Sprint 4 — CTAs + polish

**Fichier :** `units/dorevia-linky/components/TreasuryCardWithPolling.tsx`

| Tâche | Action | Détail |
|-------|--------|--------|
| 4.1 | Condition CTAs | `showCTAs = unreconciled > 0 && rateRounded !== 100` |
| 4.2 | URL base Odoo | `NEXT_PUBLIC_ODOO_URL` (build-arg), défaut si non défini |
| 4.3 | Bouton "Rapprocher" | `{ODOO_URL}/web#model=account.bank.statement.line` — `target="_blank" rel="noopener noreferrer"` |
| 4.4 | Bouton "Importer" | `{ODOO_URL}/web#model=account.bank.statement` |
| 4.5 | Style boutons | Discrets, cohérents design system (border, hover) |
| 4.6 | Format date dernier relevé | Si longueur <= 10 → `formatDateOnly` ; sinon → `formatDateTime` (JJ/MM/AAAA HH:MM) |

**Critères :** CTAs visibles uniquement si en_attente > 0 et fiabilité ≠ 100 %. Ouverture nouvel onglet.

---

## 4. Fichiers impactés

| Fichier | Modifications |
|---------|---------------|
| `units/dorevia-linky/app/api/treasury/route.ts` | Appels parallèles, mapping health |
| `units/dorevia-linky/components/TreasuryCardWithPolling.tsx` | Verdict, phrase, bloc diagnostic, CTAs |
| `sources/vault/internal/server/replay.go` | Enregistrement route bank-reconciliation-health |
| `sources/vault/internal/handlers/bank_reconciliation_health.go` | Optionnel : champ `oldest_unreconciled_date` |

---

## 5. Dépendances

| Dépendance | Rôle |
|------------|------|
| **Odoo** | Endpoint `GET /dorevia/vault/linky_bank_reconciliation` exposant `unreconciled_entries`, `last_statement_date`, `bank_accounts_count` (+ optionnel `oldest_unreconciled_date`) |
| **Vault** | Variable `ODOO_BANK_RECONCILIATION_URL` configurée (URL complète vers endpoint Odoo) |
| **Linky** | Build-arg `NEXT_PUBLIC_ODOO_URL` pour les CTAs |

---

## 6. Tests manuels

| Scénario | Attendu |
|----------|---------|
| Fiabilité 100 % | Bordure verte, phrase "Toutes les écritures…", pas de CTA |
| Fiabilité 0 % | Bordure orange, phrase "Aucun rapprochement…", CTAs visibles |
| Fiabilité partielle (ex. 67 %) | Bordure bleue, phrase "Rapprochement partiel…", CTAs visibles |
| Health indisponible | Montants OK, bloc diagnostic avec "—" partout |
| Clic "Rapprocher" | Ouverture nouvel onglet Odoo statement.line |
| Clic "Importer" | Ouverture nouvel onglet Odoo statement |
| Dates invalides | formatDateOnly/DateTime → "—" (pas d'Invalid Date) |
| Période filtrée | Montants filtrés ; métriques secondaires globales (documenté SPEC §4) |

---

## 7. Estimation détaillée

| Phase | Durée | Détail |
|-------|-------|--------|
| Sprint 1 (API) | 2–3 h | Appels parallèles, mapping, fallback |
| Sprint 2 (Vault) | 0,5–1 h | Enregistrement route (handler existant) |
| Sprint 3 (Frontend verdict + bloc) | 2–3 h | Bordure, phrase, métriques, format dates |
| Sprint 4 (CTAs) | 1 h | Boutons, URLs, style |
| Tests + intégration Odoo | 1–2 h | Vérifier chaîne complète si Odoo configuré |

**Total :** 1–1,5 jour développeur (hors implémentation endpoint Odoo).

---

## 8. Précisions Odoo (hors scope Linky/Vault)

Pour compléter la chaîne, l'endpoint Odoo doit :

- Accepter `tenant`, `company_id`, `date_debut`, `date_fin` (pour treasury ; health peut ignorer les dates)
- Retourner au minimum : `reconciled_balance`, `unreconciled_balance`, `reconciliation_rate`, `unreconciled_entries`, `last_statement_date`, `bank_accounts_count`
- Optionnel : `oldest_unreconciled_date` (YYYY-MM-DD)

Référence : ZeDocs/web15/SPEC_INDICATEUR_CONFIANCE_RAPPROCHEMENT_BANCAIRE_LINKY_v1.0.md

---

## 9. Points de vigilance

### 9.1 Double appel Odoo

Les routes `treasury` et `bank-reconciliation-health` appellent toutes deux Odoo (même URL si configuré). Si le même endpoint sert les deux :

- S'assurer que le traitement côté Odoo est **idempotent**
- Éviter 2 recalculs lourds successifs
- À surveiller si la volumétrie monte (latence cumulée)

*Rien d'urgent — à garder en tête pour évolution.*

### 9.2 Condition CTA

`unreconciled > 0` implique mathématiquement `rateRounded !== 100` (100 % = tout rapproché → unreconciled = 0). La condition `rateRounded !== 100` est donc redondante ; `showCTAs = unreconciled > 0` suffit. Simplification cosmétique pour clarté du code.

---

## 10. Références

- SPEC : ZeDocs/web29/SPEC_LINKY_Tresorerie_Validee_v1.1.md
- Avis expert : `ZeDocs/web29/AVIS_EXPERT_SPEC_LINKY_Tresorerie_Validee_v1.1.md`
- Compte rendu : `ZeDocs/web29/COMPTE_RENDU_Tresorerie_Validee_v1.1_2026-02-22.md`
- Indicateur confiance : `ZeDocs/web15/SPEC_INDICATEUR_CONFIANCE_RAPPROCHEMENT_BANCAIRE_LINKY_v1.0.md`
- Audit sources : `ZeDocs/web27/AUDIT_SOURCES_DONNEES_LINKY_CARDS.md`

---

*Fin du document*
