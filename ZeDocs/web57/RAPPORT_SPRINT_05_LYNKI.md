# Rapport de réalisation — Sprint 05 Lynki (Phase 2)

**Fichier canonique :** `RAPPORT_SPRINT_05_LYNKI.md`  
**Sprint de référence :** [PLAN_SPRINT_05_LYNKI.md](PLAN_SPRINT_05_LYNKI.md) **v1.0**  
**Exécution terrain :** [EXECUTION_TICKETS_SPRINT_05_LYNKI.md](EXECUTION_TICKETS_SPRINT_05_LYNKI.md) **v1.0**  
**Date de clôture :** 20 mars 2026  
**Version rapport :** 1.1 — mars 2026  
**Révision 1.0 :** sprint livré — code T26–T30 complet ; Gate B conditionnelle.  
**Révision 1.1 :** version préparée pour clôture de **T31 / C5** ; compléter le constat terrain en §5 puis prononcer **Gate B pleine et close** en §8.  
**Statut global :** Sprint livré — Gate B conditionnelle, **révision préparée pour clôture C5**.

---

## 1. Résumé exécutif

### 1.1 Formulation produit

Le grand livre est désormais une **surface dédiée** accessible via `/accounting/gl/[account_code]`, avec contexte de navigation (breadcrumb, retour BG, conservation période/périmètre). Le drill depuis la balance générale utilise `router.push` — l'URL est partageable.

### 1.2 Objectif et résultat synthétique

| Objectif sprint | Résultat terrain |
|-----------------|-----------------|
| T26 — Normaliser `LINKY_ACCOUNTING_STRICT` sur toutes les routes accounting | ✅ `LYNKI` → `LINKY` corrigé sur `trial-balance/route.ts` ; `.env.example` créé avec `LINKY_ACCOUNTING_STRICT=1` documenté |
| T27 — GL route / page dédiée | ✅ `/accounting/gl/[account_code]/page.tsx` + `GeneralLedgerPageClient.tsx` |
| T28 — Navigation BG → GL (breadcrumbs, retour) | ✅ Breadcrumb `Cockpit › Balance générale › [compte]` ; lien retour BG avec paramètres conservés ; `router.push` dans `TrialBalanceBlock` |
| T29 — Export GL CSV | ✅ `GET /api/accounting/general-ledger/export` (Vault) + route Linky proxy + `GLExportButton` sur la page GL |
| T30 — Doc, ALIGNEMENT, BACKLOG, Gate B | ✅ Ce rapport v1.0 ; ALIGNEMENT v1.7 ; BACKLOG v1.6 |
| **Gate B** | 🟡 **Conditionnelle** — code complet ; C5 à constater en env de référence (`LINKY_ACCOUNTING_STRICT=1` actif + Vault UP) |

---

## 2. Tickets — état à la clôture

| # | Titre | Statut | Commentaire |
|---|-------|--------|-------------|
| **T26** | Normaliser C5 (`LINKY_ACCOUNTING_STRICT`) | ✅ **done** | Incohérence `LYNKI_` vs `LINKY_` corrigée. `.env.example` crée la trace nécessaire pour la vérification C5 en env de référence. |
| **T27** | GL route / page dédiée | ✅ **done** | Server component `page.tsx` + client `GeneralLedgerPageClient.tsx`. Route : `/accounting/gl/[account_code]?tenant=&date_debut=&date_fin=&company_id=&account_name=`. |
| **T28** | Navigation BG → GL | ✅ **done** | `TrialBalanceRow.onDrill` utilise `router.push`. Breadcrumb sur la page GL. Retour BG conserve `date_debut`, `date_fin`, `company_id`. Panneau latéral retiré. |
| **T29** | Export GL CSV | ✅ **done** | Handler Vault `GET /api/accounting/general-ledger/export` (max 10 000 lignes, solde cumulé) ; route Linky proxy (502 si Vault KO) ; `GLExportButton` sur la page GL. |
| **T30** | Doc + Gate B | ✅ **done** | Ce rapport ; ALIGNEMENT v1.7 ; BACKLOG v1.6. |

---

## 3. Fichiers créés ou modifiés

### Vault (backend Go)

| Fichier | Description |
|---------|-------------|
| `sources/vault/internal/handlers/accounting_general_ledger_export.go` | `GET /api/accounting/general-ledger/export` — CSV avec solde cumulé, headers traçabilité, max 10 000 lignes. |
| `sources/vault/internal/server/replay.go` | Enregistrement `GET /api/accounting/general-ledger/export`. |

### Linky (Next.js TypeScript)

| Fichier | Description |
|---------|-------------|
| `units/dorevia-linky/app/accounting/gl/[account_code]/page.tsx` | Server component — GL page dédiée (metadata, params → `GeneralLedgerPageClient`). |
| `units/dorevia-linky/app/accounting/gl/[account_code]/GeneralLedgerPageClient.tsx` | Client component — fetch GL, breadcrumb, tableau écritures avec solde cumulé, `GLExportButton`. |
| `units/dorevia-linky/app/api/accounting/general-ledger/export/route.ts` | Route proxy export GL CSV ; 502 si Vault KO. |
| `units/dorevia-linky/components/AccountingSummaryView.tsx` | `useRouter` importé ; `handleDrill` → `router.push` vers `/accounting/gl/[account_code]` ; panneau latéral retiré ; `account_name` passé en query param. |
| `units/dorevia-linky/app/api/accounting/trial-balance/route.ts` | `LYNKI_ACCOUNTING_STRICT` → `LINKY_ACCOUNTING_STRICT` (normalisation C5 T26). |
| `units/dorevia-linky/.env.example` | `LINKY_ACCOUNTING_STRICT=1` documenté comme variable de référence pour C5 / Gate B. |

---

## 4. Contrats et paramètres

### Vault — `GET /api/accounting/general-ledger/export`

Params : `tenant` (requis), `account_code` (requis), `date_debut` (requis), `date_fin` (requis), `company_id` (opt).  
Réponse : `text/csv` — colonnes : `date, move_id, line_id, debit, credit, solde_cumule, account_code, currency, referentiel_version, coverage, complete, tenant, period_from, period_to, generated_at`.  
Limite : 10 000 lignes (header `X-Lynki-Export-Truncated`).

### Route GL dédiée Linky

URL : `/accounting/gl/[account_code]?tenant=&date_debut=&date_fin=&company_id=&account_name=`  
Breadcrumb : `Cockpit › Balance générale › [account_code] — [account_name]`  
Retour BG : `/?date_debut=&date_fin=&tenant=&company_id=#balance-generale`

---

## 5. Constat C5 — Gate B

> ⚠️ **C5 n'a pas encore été constaté en environnement de référence actif.** Ce §5 est pré-rédigé en attente du constat terrain T31 (Sprint 06). Remplir le tableau ci-dessous, recopier la formulation de clôture dans §8, puis dater la révision.

**Ce qui est livré (code) :**
- `LINKY_ACCOUNTING_STRICT` est normalisé sur toutes les routes `lynki.accounting.*`.
- `.env.example` documente `LINKY_ACCOUNTING_STRICT=1` comme variable de référence.
- Comportement attendu vérifié statiquement : si `LINKY_ACCOUNTING_STRICT=1` et Vault KO → 502 (pas de stub silencieux).

**Ce qui reste (terrain — T31 Sprint 06) :**
- Activer `LINKY_ACCOUNTING_STRICT=1` sur l'environnement de référence avec Vault joignable.
- Constater `data_source=vault` + `X-Lynki-Accounting-Source: vault` + absence de fallback stub.
- Remplir le tableau ci-dessous et recopier la formulation de clôture dans §8.
- Mettre à jour `RAPPORT_SPRINT_04_LYNKI.md` **v1.2**.

---

### Bloc de constat C5 *(à remplir lors de T31 — Sprint 06)*

| Champ | Valeur |
|-------|--------|
| Environnement | … |
| Tenant | … |
| Company ID | … |
| Période | … |
| `LINKY_ACCOUNTING_STRICT` | 1 |
| Route BG (`trial_balance`) | ⬜ OK / NOK |
| Route GL (`general_ledger`) | ⬜ OK / NOK |
| `data_source` | ⬜ vault / autre |
| Header `X-Lynki-Accounting-Source` | ⬜ vault / autre |
| Stub silencieux | ⬜ absent / présent |
| Conclusion | ⬜ C5 validé / non validé |
| Date | … |
| Auteur | … |

### Formulation de clôture *(à recopier dans §8 Gate B dès C5 validé)*

> **C5 constaté en environnement de référence.**  
> Avec `LINKY_ACCOUNTING_STRICT=1`, les routes comptables Lynki testées répondent avec `data_source=vault` et le header `X-Lynki-Accounting-Source: vault`, sans fallback stub silencieux.  
> Le comportement observé est conforme à la doctrine Vault et à l'exigence de fermeture de Gate B.  
> **Gate B est prononcée pleine et close.**

### Ligne de tableau pour §8 *(remplacer la ligne Gate B dès C5 validé)*

> **Gate B** | ✅ **Pleine et close** — C5 constaté en environnement de référence ; `data_source=vault`, `X-Lynki-Accounting-Source: vault`, absence de fallback stub silencieux avec `LINKY_ACCOUNTING_STRICT=1`.

---

## 6. Décisions prises pendant le sprint

### D12 — Suppression du panneau latéral GL

Le panneau `GeneralLedgerPanel` était un composant overlay. Il est remplacé par la navigation `router.push` vers la route dédiée. Le composant est conservé dans le code mais n'est plus instancié depuis `TrialBalanceBlock`. Il peut être réutilisé si un contexte "aperçu rapide" est souhaité ultérieurement.

### D13 — `account_name` passé en query param

Le libellé du compte est passé encodé en URL pour éviter un re-fetch inutile depuis la page GL. Si absent, la page GL affiche `account_code` comme libellé.

### D14 — Solde cumulé dans l'export GL

L'export GL calcule le solde cumulé ligne par ligne (ordre `line_date, move_id, line_id`), cohérent avec l'affichage de la page. Cette colonne est absente de l'export BG (qui est un agrégat par compte) — les contrats restent distincts.

---

## 7. Écarts par rapport au plan

| Attendu fin sprint | Résultat |
|--------------------|----------|
| C5 constaté en env de référence | 🟡 Code complet, constat terrain à faire |
| Gate B pleine | 🟡 Conditionnelle — voir §5 et §8 |
| GL route dédiée | ✅ |
| Navigation BG→GL stabilisée | ✅ |
| Export GL | ✅ |

---

## 8. Gates — état

| Gate | Commentaire |
|------|-------------|
| **Gate A** | Inchangée. |
| **Gate B** | 🟡 **Prononcée conditionnellement** — C5 non constaté en env de référence actif. **Dès T31 clos (Sprint 06) :** compléter le bloc §5, mettre à jour ce tableau → Gate B pleine et close. *(Remplacer cette ligne par la formulation de clôture de §5.)* |
| **Gate C** | 🟡 **Renforcée significativement** : GL route dédiée, breadcrumb, export GL. Complétion : filtres journaux/partenaire, pagination, export enrichi. |

---

## 9. Recette — contrôles Sprint 05

| Contrôle | Attendu | Vérifié |
|----------|---------|---------|
| `LINKY_ACCOUNTING_STRICT` cohérent | même variable sur toutes les routes | ✅ code |
| Route GL `/accounting/gl/[account_code]` | accessible | ✅ code |
| Drill depuis BG → route GL | `router.push` avec params | ✅ code |
| Breadcrumb | `Cockpit › Balance générale › [compte]` | ✅ code |
| Retour BG depuis breadcrumb | `/?date_debut=...#balance-generale` | ✅ code |
| Export GL Vault | `GET /api/accounting/general-ledger/export` | ✅ code |
| Export GL Linky proxy | route proxy, 502 si Vault KO | ✅ code |
| C5 (env de référence) | `data_source=vault`, no stub | ⬜ à constater terrain |

---

## 10. Recommandations — Sprint 06

1. **Constater C5** en env de référence → révision v1.1 de ce rapport + `RAPPORT_SPRINT_04_LYNKI.md` v1.2 → **Gate B pleine et close**.
2. **Rôles / habilitations** (Lot 6) — Admin / Controller / Manager.
3. **GL enrichi** — filtres journal, partenaire ; pagination (> 10 000 lignes) ; solde d'ouverture.
4. **Extension Bilan / CR** (Lot 2) — seulement après Gate B pleine.

> 🔒 **Discipline Gate B** : Gate B pleine uniquement après que la révision v1.1 de ce rapport existe, datée, avec le constat de C5 en environnement de référence.

---

*Rapport Sprint 05 v1.1 — version préparée pour clôture C5. Finaliser §5 et §8 lors de T31 en environnement de référence.*  
*Suite : [PLAN_SPRINT_06_LYNKI.md](PLAN_SPRINT_06_LYNKI.md) v1.0 · [EXECUTION_TICKETS_SPRINT_06_LYNKI.md](EXECUTION_TICKETS_SPRINT_06_LYNKI.md) v1.0*

---

*(Remplacer ce footer lors de la finalisation T31 par :)*  
*Rapport Sprint 05 v1.1 — Gate B pleine et close après constat C5 en environnement de référence. Suite : [PLAN_SPRINT_06_LYNKI.md](PLAN_SPRINT_06_LYNKI.md) v1.0 · [EXECUTION_TICKETS_SPRINT_06_LYNKI.md](EXECUTION_TICKETS_SPRINT_06_LYNKI.md) v1.0*
