# Analyse — Plans d'implémentation pour remise en état Linky

**Date** : 11 février 2026  
**Dernière mise à jour** : 15 février 2026 (logo v2.1, tagline 1 ligne, v1.56)  
**Objectif** : Synthétiser **l'ensemble** des plans et specs ZeDocs retenus pour remettre l'application Dorevia Linky en état conforme.

**Révision** : Analyse complète après consultation exhaustive de web12 à web18.

---

## 1. Inventaire des documents liés à Linky (consultés)

### web12
- SPEC_DOREVIA_VAULTING_PAYMENTS_v1.0.md — Spec fondatrice paiements (v1.1 dans web14)
- ANALYSE_SPEC_VAULTING_PAYMENTS_v1.0.md
- GUIDE_VAULTER_FACTURES_PAYEES, GUIDE_OPERATIONS_QUOTIDIEN
- RELEASE_NOTE_PROOF_FORMAT_v1.1, AMENDEMENTS_FORMAT_PREUVE

### web13
- PLAN_IMPLEMENTATION_SPEC_DOREVIA_UI_CARD_SALES_v1.0.md
- PLAN_IMPLEMENTATION_DOREVIA_UI_AGGREGATIONS_v1.0.md
- SPEC_DOREVIA_UI_CARD_SALES_v1.0.md, SPEC_DOREVIA_UI_AGGREGATIONS_v1.0.md
- DEPLOI_CARD_SALES_v1.0.md, STATUT_IMPLEMENTATION_CARD_SALES_v1.0.md
- CHECKLIST_APPSMITH_CARD_VENTES_CERTIFIEES_v1.0.md
- PHASE_0_DOREVIA_UI_PREREQUIS_v1.0.md
- RUNBOOK_FIX_502_UI_LAB_APPSMITH, RUNBOOK_FIX_SSL_UI_LAB

### web14
- **PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md** — Plan filtres
- **PLAN_IMPLEMENTATION_ADJUSTMENTS_SCRUM.md** — Plan Avoirs/Remboursements
- **PLAN_IMPLEMENTATION_HOOK_WRITE_POSTED_SCRUM.md**
- **FILTRE_LINKY.md**, FILTRE_LINKY_AVIS_ET_AMENDEMENTS.md
- **SPEC_VAULT_LINKY_COMPANY_v1.0.md**, ANNEXE_NORMATIVE_CONTRAINTES_ARCHITECTURALES_COMPANY_v1.2.md
- **RESUME_FILTRE_COMPANY_LINKY_VAULT.md**
- **VERIFICATION_CODE_VS_DOC_2026-02-08.md** — Écart code vs doc (référence)
- BROUILLON_UX_PERIODE_ANNEE_LINKY.md
- **SPEC_DOREVIA_LINKY_UI_v2.0.md** — Vision Linky Next.js
- **SPEC_DOREVIA_PAYMENTS_v1.1.md**, AMENDEMENTS, RAPPORT_CONSEQUENCES
- **SPEC_DOREVIA_ADJUSTMENTS_v1.0.md**, ADDENDUM_IMPL_PHASES_ADJUSTMENTS_v1.0.md
- **CHECKLIST_PROD_READY_ADJUSTMENTS_v1.0.md**
- **INDICATEUR_CERTIFIE_LINKY.md** — Ratio Certifié
- **COMPTE_RENDU_SPEC_PAYMENTS_VAULT_LINKY_2026-02-09.md**
- reco_ui_laplatine.md — Migration Appsmith → Linky
- COMPTE_RENDU_LINKY_HTTPS_INTEGRATION, RUNBOOK_LINKY_HTTPS_UI_LAB
- DIAGNOSTIC, RAPPORT_DIAGNOSTIC, RESUME_VENTES_CERTIFIEES_914K

### web15
- **COMPTE_RENDU_LINKY_2026-02-10.md** — État cible
- **DIRECTION_ARTISTIQUE_LINKY.md** — Design
- **nav_linky.md** — Navigation (Tout, Cash, Business, Corrections)
- **SPEC_INDICATEUR_CONFIANCE_VAULTAGE_LINKY_v1.0.md** — Indicateur 🔒
- **SPEC_INDICATEUR_CONFIANCE_RAPPROCHEMENT_BANCAIRE_LINKY_v1.0.md** — Indicateur 🏦

### web16
- **RECONCIL.md** — Card Trésorerie (impact Linky §6)

### web17
- PLAN_INSTANCE_ODOO_18_LGLZ44, RAPPORT_IMPLEMENTATION_LGLZ44, CHECKLIST_PREALABLES_LGLZ44, RUNBOOK_FIX_SSL_LGLZ44  
  → **Non lié à Linky** (déploiement Odoo tenant lglz44)

### web18
- **sessions.md** — SPEC Dorevia POS Sessions (Linky)
- **RECO_DOREVIA_POS_VAULTING_v1.0.md** — Recommandations stratégiques Linky (§5)

### web19
- **SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE.md** — Spec graphiques (étendue à toutes cartes comptabilité, v1.1)
- **ANALYSE_PLANS_IMPLEMENTATION_LINKY_REMISE_EN_ETAT.md** — Ce document

### web20
- **RAPPORT_ENSEMBLE_CHOIX_DESIGN_LINKY.md** — Synthèse et justification des choix design (logo, typo, couleurs, graphiques)

---

## 2. Documents de référence prioritaires

| Document | Rôle | Priorité |
|----------|------|----------|
| **web15/COMPTE_RENDU_LINKY_2026-02-10.md** | État cible implémenté au 10/02 | **P0** |
| **web14/VERIFICATION_CODE_VS_DOC_2026-02-08.md** | Alignement code vs doc — référentiel fiable | **P0** |
| **web14/PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md** | Plan filtres (User Stories) | **P0** |
| **web14/FILTRE_LINKY.md** | Spec filtres — principes (attention : §4.3 « Toutes périodes » désaligné avec code) | **P0** |
| **web14/RESUME_FILTRE_COMPANY_LINKY_VAULT.md** | État filtre Company Vault + Linky | **P0** |
| **web19/SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE.md** | Spec graphiques comptabilité (accordéon, Montants/%, tooltips) | **P1** |
| **web20/RAPPORT_ENSEMBLE_CHOIX_DESIGN_LINKY.md** | Synthèse choix design (logo, typo, couleurs, graphiques) | **P2** |

---

## 3. Plans d'implémentation détaillés

### 3.1 Plan Filtres Linky (web14)

**Fichier** : `ZeDocs/web14/PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md`

| Epic | Contenu | État |
|------|---------|------|
| **E1** | En-tête de contexte (Tenant + zone filtres) | Livré |
| **E2** | Filtre Période (Mois/Trimestre/Semaine + Année) | Livré |
| **E3** | Filtre Company (sélecteur « Tout » par défaut) | Livré |

**Éléments clés pour remise en état :**
- ReportHeader : bloc Tenant + bloc Filtres (période, company)
- Deux selects : (1) Mois/Trimestre/Semaine, (2) Année
- Défaut : Mois en cours / Année en cours
- GET /ui/companies avec timeout 5 s
- Passage `company_id` à toutes les cartes
- `formatPeriodLabel(from, to)` pour libellé période

**Références croisées :** FILTRE_LINKY.md, SPEC_VAULT_LINKY_COMPANY_v1.0.md, BROUILLON_UX_PERIODE_ANNEE_LINKY.md

---

### 3.2 Plan Adjustments (web14)

**Fichier** : `ZeDocs/web14/PLAN_IMPLEMENTATION_ADJUSTMENTS_SCRUM.md`

| Epic | Contenu | État |
|------|---------|------|
| **E1** | Vault GET /ui/aggregations/adjustments | Livré |
| **E2** | Connecteur Odoo is_refund inbound | Livré |
| **E3** | Linky proxy /api/adjustments + 4 cards | Livré |

**Éléments clés pour remise en état :**
- 4 cards : Avoirs accordés clients, Avoirs fournisseurs, Remboursements clients, Remboursements fournisseurs
- Event types : `credit_note.customer.issued`, `credit_note.supplier.received`, `refund.customer.paid`, `refund.supplier.received`
- Même période et company_id que le reste du dashboard
- AdjustmentsCard : montant, nombre d'événements, période, badge certifié

**Références :** SPEC_DOREVIA_ADJUSTMENTS_v1.0.md, ADDENDUM_IMPL_PHASES_ADJUSTMENTS_v1.0

---

### 3.3 Plan Card Sales (web13)

**Fichier** : `ZeDocs/web13/PLAN_IMPLEMENTATION_SPEC_DOREVIA_UI_CARD_SALES_v1.0.md`

**Contexte** : Plan initial Appsmith. Aujourd'hui dépassé par SPEC_DOREVIA_LINKY_UI_v2.0 (Next.js).

**Contenu réutilisable :**
- Endpoint Vault GET /ui/aggregations/sales
- Paramètres : date_debut, date_fin, granularity, tenant
- Réponse : total, currency, from, to, verifiable, last_seal_at

**Note** : Le plan parle d'Appsmith ; l'implémentation actuelle est Next.js. Les cartes SalesCard/PurchasesCard existent et sont conformes.

---

### 3.4 Plan Agrégations UI (web13)

**Fichier** : `ZeDocs/web13/PLAN_IMPLEMENTATION_DOREVIA_UI_AGGREGATIONS_v1.0.md`

**Contexte** : Plan Phase 0–4 pour Appsmith. La décision a évolué vers Next.js (SPEC_DOREVIA_LINKY_UI_v2.0).

**Contenu réutilisable :**
- Scopes : invoice.posted (ventes), invoice.posted.achats, payment.posted
- Filtres globaux : période, granularité
- Principe : une seule période pour tout le rapport

---

### 3.5 Compte rendu Linky (web15) — Référence état cible

**Fichier** : `ZeDocs/web15/COMPTE_RENDU_LINKY_2026-02-10.md`

**Contenu : état attendu**

| Composant | Détail |
|-----------|--------|
| ReportHeader | Brand + badge tenant ; Sélecteur Société ; Sélecteur Période (Exercice à date / Janvier…Décembre + Année) ; Menu hamburger |
| Navigation | Tout, Cash, Business, Corrections ; Point de vente (à venir) |
| 5 cartes | Cash ; Business (Ventes + Achats) ; Taxes ; Notes de crédit ; Remboursements |
| Couleurs | Cash/Business : vert/rouge flux ; Taxes/Notes/Remboursements : bleu |
| API | /api/sales, purchases, payments-in, payments-out, adjustments, companies |

**Référence visuelle :** DIRECTION_ARTISTIQUE_LINKY.md v1.3

---

### 3.6 RECONCIL — Card Trésorerie (web16)

**Fichier** : `ZeDocs/web16/RECONCIL.md`

**Impact Linky (section 6) :**

| Élément | Description |
|---------|-------------|
| Card Trésorerie (Stock) | Solde comptable 512 |
| Trésorerie validée | Somme projection reconciled |
| En attente de rapprochement | Somme projection unreconciled |
| Fiabilité bancaire (%) | reconciled / total |

**Route Vault** : GET /ui/aggregations/treasury (event-sourced, projection)

**État** : TreasuryCardWithPolling intégrée (v1.16) ; placeholder si route Vault absente. BankReconciliationIndicator dans ReportHeader.

---

### 3.7 SPEC Sessions POS (web18)

**Fichier** : `ZeDocs/web18/sessions.md`

**Impact Linky :**

| Élément | Description |
|---------|-------------|
| Vue Sessions | En-tête (total, scellées, en attente) |
| Liste sessions | Tri closed_at DESC ; pour chaque : date clôture, période, total ventes, écart caisse, statut Vault |
| Route Vault | GET /ui/aggregations/pos-sessions |
| Activation | viewMode === "pos_sessions" |

**Menu** : POINT DE VENTE → Sessions

**État** : PosSessionsView intégré (v1.16), viewMode pos, menu actif.

---

### 3.8 Indicateur Certifié (INDICATEUR_CERTIFIE_LINKY, web14)

**Contenu :** Ratio (ventes certifiées / ventes totales) × 100. Badge + tooltip sur les cartes Sales/Purchases ou global. Seuils couleur selon niveau de certification.

**État** : Implémenté dans SalesCard/PurchasesCard (badge + tooltip).

---

### 3.9 Indicateur Confiance Vaultage (web15)

**Fichier** : `ZeDocs/web15/SPEC_INDICATEUR_CONFIANCE_VAULTAGE_LINKY_v1.0.md`

**Contenu :** Badge 🔒 dans le header. Taux = (événements scellés / événements éligibles). Règles couleur, tooltip, popover. Indique le niveau de certification Vault des données.

**État** : VaultageIndicator intégré (v1.16), placeholder gris tant que l'API DVIG outbox n'existe pas.

---

### 3.10 Indicateur Confiance Rapprochement (web15)

**Fichier** : `ZeDocs/web15/SPEC_INDICATEUR_CONFIANCE_RAPPROCHEMENT_BANCAIRE_LINKY_v1.0.md`

**Contenu :**
- Badge 🏦 dans le header (à droite du 🔒 Vaultage)
- Taux = (écritures rapprochées / écritures bancaires) × 100
- Règles couleur selon seuils
- Hover : tooltip ; Clic : popover détail

**État** : BankReconciliationIndicator intégré dans ReportHeader (v1.16).

---

### 3.11 Spécification graphiques comptabilité (web19)

**Fichier** : `ZeDocs/web19/SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE.md`

**Contenu :**
- Spec graphique étendue à **toutes** les cartes comptabilité (Business, Cash, Trésorerie, Taxes, Notes de crédit, Remboursements) + **Points de vente**
- Types : barres, courbe, camembert (Recharts)
- Granularité : jour, semaine, mois (selon période)
- Mode **Montants** | **%** : représentation relative à 100 % par période
- Section repliable avec **comportement accordéon** : une seule section dépliée à la fois
- Tooltips lisibles (libellés explicites, pas serie1/serie2 ; PieTooltipContent personnalisé pour camembert)
- Polling : **10 minutes**
- **Filtres période intelligents** : API `GET /api/years-with-data` — seules les années et mois contenant des données (sales, purchases) sont proposés ; Exercice à date toujours affiché
- **Logo** : SPEC_LOGO_DOREVIA_LINKY_v2.1 — DOREVIA+Linky+tagline ; tagline stricte 1 ligne (masquée &lt;768px) ; harmonisation header

**Composants clés** : CardChartSection, DualSeriesChart, ChartExpandedContext, PieTooltipContent, TaxesChart, ReportHeader, PosShopsView.

**État** : Implémenté (v1.56). Référence : SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE.md v1.4 ; SPEC_LOGO_DOREVIA_LINKY_v2.1.

---

## 4. Synthèse — Ordre de priorité pour remise en état

| Priorité | Plan / Spec | Éléments à restaurer |
|----------|-------------|------------------------|
| **P0** | COMPTE_RENDU + PLAN_FILTRES | ReportHeader complet ; DashboardWithFilters ; viewMode ; 5 cartes |
| **P1** | PLAN_ADJUSTMENTS | 4 cards Avoirs/Remboursements (CreditNotesCard, RefundsCard) ; proxy /api/adjustments |
| **P2** | nav_linky.md + DIRECTION_ARTISTIQUE | Règles couleurs ; ordre cartes selon viewMode |
| **P3** | web16 RECONCIL | Card Trésorerie ; BankReconciliationIndicator dans header |
| **P4** | web18 sessions | Vue Sessions POS ; PosSessionsCard ; viewMode pos_sessions |

---

## 5. Écarts majeurs — Specs vs implémentation actuelle

**Références croisées** : COMPTE_RENDU (état cible 10/02), nav_linky, DIRECTION_ARTISTIQUE, PLAN_FILTRES, VERIFICATION_CODE_VS_DOC.

### 5.1 Conflits entre documents (priorité à clarifier)

| Sujet | COMPTE_RENDU §2.1, §5.9 | PLAN_FILTRES US-3.1, RESUME_FILTRE | Impl. actuelle |
|-------|--------------------------|-------------------------------------|-----------------|
| **Société par défaut** | **Auto-sélection première société** ; option « Toutes les sociétés » **supprimée** | Défaut « Tout » | Défaut « Tout » → **écart COMPTE_RENDU** |
| **Sélecteur Période** | Exercice à date / Janvier…Décembre + Année (2 selects) | Mois/Trimestre/Semaine + Année | YTD + Mois + T1-T4 + S1-S53 → aligné PLAN, différent COMPTE_RENDU |

### 5.2 Écarts critiques (specs non respectées)

| Élément | Spec (réf.) | Implémentation | Action |
|---------|-------------|----------------|--------|
| **Ordre des cartes (Tout)** | nav_linky : 1.Cash 2.Business 3.Taxes 4.Notes de crédit 5.Remboursements | 1.Business 2.Cash 3.Taxes 4.CreditNotes 5.Refunds | **Inverser** : Cash avant Business |
| **Vue Cash — Remboursements** | nav_linky §2 : Cash **inclut** Remboursements clients + fournisseurs | showRefunds = all \|\| corrections ; Cash n'affiche **pas** Refunds | **Corriger** : ajouter RefundsCard en vue Cash |
| **DIRECTION_ARTISTIQUE** | DA §5.1 : --radius-card 1.25rem, --max-w-mobile 480px ; §3 : pastels, --warning | --radius-xl 0.75rem ; pas de pastels, pas de --warning | Aligner globals.css |
| **Indicateur Certifié — données** | INDICATEUR_CERTIFIE : ratio **global** (postedSalesCount dénominateur) | BusinessCardWithPolling ne récupère pas postedCount depuis Odoo | Vérifier si API sales/purchases fournit global_invoices_count et appel Odoo |
| **4 cards Adjustments** | PLAN US-3.2 : 4 cards ou 2+2 | CreditNotesCard + RefundsCard (2 regroupées) | OK si détail client/fournisseur dans chaque carte |
| **Carte Business** | COMPTE_RENDU, DIRECTION_ARTISTIQUE §7.2-7.3 : **une seule** carte (Ventes HT / Achats HT → Flux net), même layout que Cash | BusinessCard = grille de 2 cartes (SalesCard + PurchasesCard) | **Refondre** : une carte Business unique (titre + flux net vert/rouge + lignes Ventes HT, Achats HT) |

### 5.3 Écarts déjà partiellement traités (v1.16)

| Élément | Spec | État |
|---------|------|------|
| Indicateur 🔒 Vaultage | ReportHeader, couleur sémantique | Placeholder gris (API DVIG manquante) |
| Indicateur 🏦 Rapprochement | ReportHeader, tooltip | Intégré, proxy /api/bank-reconciliation-health |
| Card Trésorerie | RECONCIL, vue Cash | Intégrée, placeholder si route Vault absente |
| Sessions POS | Menu Point de vente → Sessions | Intégré, viewMode pos, PosSessionsView |

### 5.4 Non-conformités restantes

| Élément | Spec | Manque |
|---------|------|--------|
| PWA / offline | SPEC_LINKY_UI §3 | Service worker, cache read-only |
| Temps chargement < 1 s | SPEC_LINKY_UI §3 | À mesurer, optimiser |
| Composants obsolètes | COMPTE_RENDU §6 | SalesCard, PurchasesCard, PaymentsCard, AdjustmentsCard, BottomNav non importés — à nettoyer |
| Message legacy company | US-3.1 optionnel | « Pièces historiques non associées » si company active + docs sans company_id |

---

## 6. Références techniques (fichiers Linky)

D'après PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md §9 :

- `app/page.tsx`
- `app/api/years-with-data/route.ts` — API filtres période (années + mois par année)
- `app/lib/period-utils.ts` (ou vault.ts)
- `app/lib/odoo-metrics.ts`
- `app/api/sales|purchases|companies|adjustments|payments-in|payments-out|tenant/route.ts`
- `components/ReportHeader.tsx`
- `components/DashboardWithFilters.tsx`
- `components/*Card*.tsx`, `*CardWithPolling.tsx`

---

## 7. Annexes — Documents complémentaires

| Document | Rôle |
|----------|------|
| CHECKLIST_PROD_READY_ADJUSTMENTS_v1.0 | Critères Go/No-Go avant prod Adjustments (event_date, is_refund, perf &lt; 300 ms) |
| COMPTE_RENDU_SPEC_PAYMENTS_VAULT_LINKY | Découpage Payments-in / Payments-out, cohérence cartes Cash |
| reco_ui_laplatine | Migration Appsmith → Linky (sarl-la-platine) |
| RECO_DOREVIA_POS_VAULTING §5 | Linky Product Discipline : cartes lisibles &lt; 10 s, sans graphiques, sans drill-down |

---

## 8. Synthèse — Priorités de correction (alignement specs)

**Ordre de priorité** pour rattraper les écarts identifiés :

| P0 | Auto-sélection première société (COMPTE_RENDU) **ou** confirmer défaut « Tout » (PLAN) |
| P0 | **Carte Business** : une seule carte (Ventes HT / Achats HT → Flux net), même layout que Cash (COMPTE_RENDU, DIRECTION_ARTISTIQUE §7.2-7.3) — actuellement 2 cartes séparées |
| P0 | **Ordre cartes** : Cash avant Business (nav_linky) |
| P0 | **Vue Cash** : inclure Remboursements (nav_linky §2) |
| P1 | DIRECTION_ARTISTIQUE : variables CSS (radius, pastels, --warning, shadow-card) |
| P1 | Indicateur Certifié : vérifier passage de postedSalesCount/postedPurchasesCount depuis Odoo |
| P2 | Message legacy company (optionnel) |
| P2 | Nettoyage composants obsolètes |
| P3 | PWA / offline (SPEC_LINKY_UI) |

---

## 9. Conclusion

Pour une remise en état complète de Linky, les plans à suivre dans l'ordre sont :

1. **COMPTE_RENDU_LINKY_2026-02-10** — état cible
2. **PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM** — filtres et header
3. **nav_linky.md** — structure de navigation (viewMode)
4. **PLAN_IMPLEMENTATION_ADJUSTMENTS_SCRUM** — cards Avoirs/Remboursements
5. **DIRECTION_ARTISTIQUE_LINKY** — design et couleurs
6. **web16 RECONCIL** — Card Trésorerie (impact majeur Linky, périmètre Cash)
7. **web18 SPEC Sessions POS** — Vue Sessions Point de vente (menu déjà prévu « à venir »)

**RECONCIL** et **Sessions POS** font partie du périmètre de remise en état de Linky, au même titre que Comptabilité : RECONCIL complète la vue Cash (Trésorerie, rapprochement bancaire) ; Sessions POS est la première brique du domaine Point de vente (structure menu déjà en place).
