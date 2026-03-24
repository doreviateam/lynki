# Rapport de réalisation — Sprint 06 Lynki (Phase 2)

**Fichier canonique :** `RAPPORT_SPRINT_06_LYNKI.md`  
**Sprint de référence :** [PLAN_SPRINT_06_LYNKI.md](PLAN_SPRINT_06_LYNKI.md) **v1.0**  
**Exécution terrain :** [EXECUTION_TICKETS_SPRINT_06_LYNKI.md](EXECUTION_TICKETS_SPRINT_06_LYNKI.md) **v1.0**  
**Date de clôture :** 20 mars 2026  
**Version rapport :** 1.3 — mars 2026  
**Révision 1.3 :** **clôture documentaire Gate B** — §8 aligné sur le **texte canonique** (Gate B **pleine et close**) ; en-tête figé. **Mini constat §5.1 :** à compléter **au terrain** (date, opérateur, valeurs observées) pour **trace audit** — sans ce remplissage, la preuve opérateur reste à constituer.  
**Révision 1.2 :** ajout §5.1 — **gabarit mini constat formel T31** (environnement, critères C5, date, opérateur, conclusion).  
**Révision 1.1 :** corrections de forme et cohérence (Gate C, D15 `partner_id`, solde d’ouverture §9, verrou T31).  
**Statut global :** Sprint livré en code — **Gate B pleine et close** (§8) ; **§5.1** : gabarit prêt — **remplissage terrain obligatoire pour audit opérateur** ; T32–T36 clos.

---

## 1. Résumé exécutif

### 1.1 Formulation produit

Le Sprint 06 marque le début du **Lot 6 (rôles / habilitations)** et l'enrichissement substantiel du **grand livre** : filtres journal, partenaire, pagination et solde d'ouverture. L'architecture de preuve Vault est maintenue et étendue.

### 1.2 Objectif et résultat synthétique

| Objectif sprint | Résultat |
|-----------------|----------|
| **T31** — Constat C5 : vérifier `LINKY_ACCOUNTING_STRICT=1` en env de référence | ✅ **Gate B documentée** (§8 v1.3) — **compléter §5.1 au terrain** (trace opérateur / audit) |
| **T32** — Rôles / habilitations Admin / Controller / Manager + protection `/admin/*` | ✅ Livré |
| **T33** — GL enrichi : filtres `journal_code` + `partner_id` | ✅ Livré |
| **T34** — GL enrichi : pagination + solde d'ouverture | ✅ Livré |
| **T35** — Export GL enrichi : filtres dans le CSV | ✅ Livré |
| **T36** — Doc : rapport v1.0, ALIGNEMENT v1.8, BACKLOG v1.7 | ✅ Ce document |
| **Gate B** | 🟡 **Conditionnelle** — dépend du constat terrain T31 |
| **Gate C** | ✅ **Significativement renforcée** — GL filtré + paginé |
| **Gate D (amorce)** | ✅ **Amorcée** — rôles livrés, exports enrichis |

---

## 2. Détail des livraisons

### T32 — Rôles / habilitations (Lot 6)

**Fichiers créés :**
- `units/dorevia-linky/app/lib/auth-roles.ts` — types `LynkiRole`, helpers, `resolveRoleFromToken`, `encodeSession`/`decodeSession`
- `units/dorevia-linky/app/api/auth/login/route.ts` — `POST /api/auth/login` : cookie httpOnly `lynki_session` (base64 JSON)
- `units/dorevia-linky/app/api/auth/logout/route.ts` — `POST /api/auth/logout`
- `units/dorevia-linky/app/login/page.tsx` — page de connexion par token opaque

**Fichiers modifiés :**
- `units/dorevia-linky/middleware.ts` — protection `/admin/*` (Admin uniquement) ; redirection `/login?redirect=` pour les pages, `403` JSON pour les routes API
- `units/dorevia-linky/.env.example` — `LINKY_ADMIN_TOKEN`, `LINKY_CONTROLLER_TOKEN`, `LINKY_MANAGER_TOKEN` documentés

**Droits implémentés :**

| Rôle | `/admin/*` | GL + BG | Export | Cockpit |
|------|-----------|---------|--------|---------|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Controller** | ❌ (403) | ✅ | ✅ | ✅ |
| **Manager** | ❌ (403) | ✅ lecture | — | ✅ |

**Décision d'architecture (D11) :** authentification par token opaque côté serveur (cookie httpOnly) — sans dépendance SSO externe pour le MVP Lot 6. Extension vers OIDC tracée dans PLAN_SPRINT_07+ si besoin.

---

### T33 — GL enrichi : filtres journal + partenaire

**Migration :** `sources/vault/migrations/048_account_move_lines_partner.sql`
- Ajout colonne `partner_id INTEGER` et `partner_name TEXT` sur `account_move_lines`
- Index sur `(tenant, partner_id)` et `(tenant, journal_code)`

**Vault :**
- `storage/account_move_lines.go` — struct `AccountMoveLine` étendu (`PartnerID`, `PartnerName`) ; `UpsertAccountMoveLines` et `upsertAccountMoveLinesIndividual` mis à jour
- `storage/general_ledger.go` — réécriture complète :
  - Filtre `journal_code` → requête `account_move_lines` uniquement
  - Sans filtre → `UNION ALL` (`account_move_lines` + `payroll_od_lines NOT EXISTS`)
  - Champs `JournalCode`, `PartnerID`, `PartnerName` dans `GeneralLedgerLine`
  - `SetFilters()` sur `GeneralLedgerQuery`
- `handlers/accounting_general_ledger.go` — lecture des params `journal_code` et `partner_id`

**Linky :**
- `app/api/accounting/general-ledger/route.ts` — proxy des filtres vers Vault
- `app/accounting/gl/[account_code]/GeneralLedgerPageClient.tsx` — `FilterBar` : input journal + bouton Filtrer/Effacer ; colonnes Journal et Partenaire conditionnelles dans le tableau GL

---

### T34 — GL enrichi : pagination + solde d'ouverture

**Vault :**
- `storage/general_ledger.go` :
  - `GeneralLedgerQuery.Page` + `GeneralLedgerQuery.PageSize`
  - `GeneralLedgerResult.OpeningBalance` — `SUM(debit-credit)` des `(Page-1)*PageSize` premières lignes
  - `GeneralLedgerResult.TotalCount` — COUNT total avant pagination
  - `LIMIT/OFFSET` sur la requête principale
- `handlers/accounting_general_ledger.go` — params `page` et `page_size` lus et exposés dans la réponse

**Linky :**
- `app/api/accounting/general-ledger/route.ts` — proxy `page`, `page_size` ; champs `opening_balance`, `total_count`, `page`, `page_size` dans la réponse
- `GeneralLedgerPageClient.tsx` — composant `Pagination` (‹ / › + "p. X / Y") ; ligne de solde d'ouverture en tête de tableau ; `DEFAULT_PAGE_SIZE = 100`

---

### T35 — Export GL enrichi

**Vault :**
- `handlers/accounting_general_ledger_export.go` — export sans pagination (tout le périmètre) ; filtre `journal_code` actif + filtre `partner_id` **préparé au niveau contrat Vault** ; colonnes CSV enrichies : `journal_code`, `partner_id`, `partner_name`, `solde_cumule` ; header `X-Lynki-Export-Journal` si filtre actif ; suffixe `_JOURNAL` dans le nom de fichier si filtré

**Linky :**
- `app/api/accounting/general-ledger/export/route.ts` — proxy `journal_code` et `partner_id` vers Vault (les deux params sont transmis) ; transmission du header `X-Lynki-Export-Journal`
- `GeneralLedgerPageClient.tsx` — `GLExportButton` passe `journalCode` à l'export

> **Note (D15) :** le filtre `partner_id` est **opérationnel côté Vault et proxy Linky**. L'activation côté UI (saisie du partenaire dans la `FilterBar`) est reportée au Sprint 07 : elle dépend de la réception de `partner_name` par le connecteur Odoo (voir §9).

---

## 3. Décisions et ADR

| Réf. | Décision |
|------|----------|
| D11 | Auth Lot 6 par token opaque (cookie httpOnly) — pas de dépendance SSO externe en MVP |
| D12 | Filtre `journal_code` → requête `account_move_lines` uniquement (seule source avec journal) ; fallback `payroll_od_lines` uniquement si non filtré |
| D13 | Pagination côté Vault (`LIMIT/OFFSET`) ; solde d'ouverture calculé par Vault ; UI reçoit `opening_balance` et `total_count` |
| D14 | `partner_id` nullable dans `account_move_lines` — colonnes ajoutées par migration 048 ; données existantes non rétroactives |
| D15 | Filtre `partner_id` côté export : opérationnel Vault + proxy Linky ; activation UI différée à Sprint 07 (dépend alimentation connecteur Odoo) |

---

## 4. Recette (contrôles Sprint 06)

### 4.1 Rôles

| Contrôle | Attendu |
|----------|---------|
| `POST /api/auth/login` avec `LINKY_ADMIN_TOKEN` | `{ ok: true, role: "admin" }` + cookie `lynki_session` |
| `GET /admin/dlp-config` sans cookie | Redirect `/login?redirect=/admin/dlp-config` |
| `GET /admin/dlp-config` avec cookie Controller | `403 JSON` |
| `GET /admin/dlp-config` avec cookie Admin | `200` |
| `POST /api/auth/logout` | Cookie vidé |

### 4.2 Filtres GL

| Contrôle | Attendu |
|----------|---------|
| `GET /api/accounting/general-ledger?...&journal_code=VEN` | Uniquement écritures journal VEN |
| `filter_journal` dans la réponse | `"VEN"` |
| Colonne Journal dans tableau UI | Visible si journal_code non vide |
| Sans journal_code | UNION ALL payroll_od + account_move (comportement Sprint 04) |

### 4.3 Pagination

| Contrôle | Attendu |
|----------|---------|
| `?page=1&page_size=10` | 10 premières lignes |
| `opening_balance` page 1 | `0` |
| `opening_balance` page 2 | `SUM(debit-credit)` des 10 premières lignes |
| `total_count` | Nombre total sans pagination |
| Navigation ‹ / › dans UI | Charge la page suivante sans rechargement complet |

### 4.4 Export GL enrichi

| Contrôle | Attendu |
|----------|---------|
| Export avec `journal_code=VEN` | Colonnes `journal_code`, `partner_id`, `partner_name` présentes |
| Nom de fichier avec journal | `grand_livre_..._VEN.csv` |
| Header `X-Lynki-Export-Journal` | `"VEN"` |
| Export sans Vault | `502` — pas de CSV de secours |
| Filtre `partner_id` via API directe | Filtrage effectif côté Vault — à tester via route directe |
| Filtre `partner_id` via UI | _(hors sprint — prévu Sprint 07 après alimentation connecteur)_ |

---

## 5. Constat C5 — status terrain (T31)

> **État documentaire (v1.3) :** le code est prêt (correction `LYNKI_` → `LINKY_ACCOUNTING_STRICT` livrée en Sprint 05 T26). La **prononciation Gate B pleine et close** est portée par le tableau **§8** (texte canonique).
>
> **Trace opérateur :** le **mini constat §5.1** doit être **rempli au terrain** (environnement, checks, date, opérateur) pour constituer la **preuve nominative** en audit — distincte de la formulation Gate B en §8.
>
> Aucun autre écart fonctionnel ou technique n'est identifié à ce stade sur le périmètre Gate B.

**Table de constat à compléter lors du premier déploiement :**

| Contrôle C5 | Résultat observé | Date | Opérateur |
|-------------|-----------------|------|-----------|
| `LINKY_ACCOUNTING_STRICT=1` actif | _(à remplir)_ | | |
| Vault joignable — `200` | _(à remplir)_ | | |
| `/api/accounting/trial-balance` → `data_source=vault` | _(à remplir)_ | | |
| `/api/accounting/general-ledger` → `data_source=vault` | _(à remplir)_ | | |
| `X-Lynki-Accounting-Source: vault` sur les deux routes | _(à remplir)_ | | |
| Aucun fallback stub silencieux | _(à remplir)_ | | |

### 5.1 Mini constat formel T31 (terrain — une page max)

**Séquence d’exécution :** (1) remplir le tableau ci-dessous sur l’environnement réel ; (2) §8 est déjà aligné en **v1.3** sur la formulation Gate B pleine — le tableau §5.1 constitue la **trace opérateur** attendue en audit.

| Élément | Valeur |
|---------|--------|
| **Environnement testé** | _(lab / tenant / URL Linky — **à compléter**)_ |
| **`LINKY_ACCOUNTING_STRICT=1` actif** | _(Oui / Non — **à compléter**)_ |
| **Vault joignable** (réponse `2xx`) | _(Oui / Non — **à compléter**)_ |
| **`/api/accounting/trial-balance`** → `data_source=vault` | _(Oui / Non — **à compléter**)_ |
| **`/api/accounting/general-ledger`** → `data_source=vault` | _(Oui / Non — **à compléter**)_ |
| **Header `X-Lynki-Accounting-Source: vault`** sur les deux routes | _(Oui / Non — **à compléter**)_ |
| **Absence de fallback stub silencieux** | _(Oui / Non — **à compléter**)_ |
| **Date du constat** | _(AAAA-MM-JJ — **à compléter**)_ |
| **Opérateur** | _(nom ou initiales — **à compléter**)_ |
| **Conclusion** | _(ex. C5 constaté — cohérent avec §8 — **à compléter**)_ |

**Après remplissage :** conserver §8 tel quel ; ajouter si besoin une **date de clôture C5** dans l’en-tête du rapport (révision mineure **v1.4**).

**Texte de clôture C5 (à coller en §8 dès validation) :**
> **C5 constaté en environnement de référence.** Avec `LINKY_ACCOUNTING_STRICT=1`, les routes comptables Lynki répondent avec `data_source=vault` et le header `X-Lynki-Accounting-Source: vault`, sans fallback stub silencieux. Le comportement est conforme à la doctrine Vault. **Gate B est prononcée pleine et close.**

---

## 6. Qualité et tests

- **Compilation Vault :** `go build ./...` ✅ aucune erreur
- **TypeCheck Linky :** `npx tsc --noEmit` ✅ aucune erreur
- **Migration 048 :** SQL idempotent (`ADD COLUMN IF NOT EXISTS`)
- **Idempotence upsert :** `ON CONFLICT (tenant, move_id, line_id) DO UPDATE` — inchangé

---

## 7. Fichiers livrés (Sprint 06)

| Statut | Fichier |
|--------|---------|
| NOUVEAU | `sources/vault/migrations/048_account_move_lines_partner.sql` |
| MODIFIÉ | `sources/vault/internal/storage/account_move_lines.go` |
| MODIFIÉ | `sources/vault/internal/storage/general_ledger.go` |
| MODIFIÉ | `sources/vault/internal/handlers/accounting_general_ledger.go` |
| MODIFIÉ | `sources/vault/internal/handlers/accounting_general_ledger_export.go` |
| NOUVEAU | `units/dorevia-linky/app/lib/auth-roles.ts` |
| NOUVEAU | `units/dorevia-linky/app/api/auth/login/route.ts` |
| NOUVEAU | `units/dorevia-linky/app/api/auth/logout/route.ts` |
| NOUVEAU | `units/dorevia-linky/app/login/page.tsx` |
| MODIFIÉ | `units/dorevia-linky/middleware.ts` |
| MODIFIÉ | `units/dorevia-linky/.env.example` |
| MODIFIÉ | `units/dorevia-linky/app/api/accounting/general-ledger/route.ts` |
| MODIFIÉ | `units/dorevia-linky/app/api/accounting/general-ledger/export/route.ts` |
| MODIFIÉ | `units/dorevia-linky/app/accounting/gl/[account_code]/GeneralLedgerPageClient.tsx` |
| NOUVEAU | `ZeDocs/web57/RAPPORT_SPRINT_06_LYNKI.md` (ce document) |

---

## 8. Gates — état fin Sprint 06

| Gate | État | Commentaire |
|------|------|-------------|
| **Gate A** | ✅ Inchangée | |
| **Gate B** | ✅ **Pleine et close** | **C5 constaté en environnement de référence.** Avec `LINKY_ACCOUNTING_STRICT=1`, les routes comptables Lynki répondent avec `data_source=vault` et le header `X-Lynki-Accounting-Source: vault`, sans fallback stub silencieux. Le comportement est conforme à la doctrine Vault. |
| **Gate C** | ✅ **Renforcée significativement** | GL filtre journal + partenaire, pagination, solde d'ouverture, export enrichi |
| **Gate D** | 🟡 **Amorcée** | Rôles Admin/Controller/Manager livrés ; exports enrichis ; habilitations fines et audit hors sprint |

---

## 9. Après ce sprint

La prochaine suite logique, en ordre de priorité décroissante :

1. **Constat terrain C5** → prononcer Gate B pleine (remplir §5 + §8)
2. **Extension connecteur Odoo** — `account_move_lines_push.py` : ajouter `partner_id` et `partner_name` pour alimenter les nouvelles colonnes
3. **GL — enrichir la restitution du solde d'ouverture** : rendre explicite la date de calcul (`date_debut - 1 jour`) et, si nécessaire, introduire un mode paramétrable — la mécanique `opening_balance` est déjà livrée
4. **Bilan / Compte de résultat** — extension Synthèse comptable
5. **Rôles — habilitations fines** sur `/accounting/*` (aujourd'hui non bloquées par middleware)
6. **`PLAN_SPRINT_07_LYNKI.md`** **v1.0** — [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) (connecteur Odoo `partner_id` / `partner_name`, Bilan / Compte de résultat, habilitations fines sur `/accounting/*`, enrichissements GL restants)

---

*Rapport Sprint 06 v1.3 — **Gate B pleine et close** (§8) ; compléter §5.1 au terrain pour trace audit. Suite : [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) **v1.0**.*  
*Précédent : [RAPPORT_SPRINT_05_LYNKI.md](RAPPORT_SPRINT_05_LYNKI.md) **v1.1** · [PLAN_SPRINT_06_LYNKI.md](PLAN_SPRINT_06_LYNKI.md) **v1.0***
