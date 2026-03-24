# Alignement CDC Master Lynki ↔ Implémentation

**Fichier canonique :** `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` — la **version du contenu** est portée dans l’en-tête ci-dessous (pas de suffixe `_v1.0` dans le nom de fichier).

**Plan d’exécution (lots, DoD, dépendances, gates) :** [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** — document-pont entre *ce* alignement et les chantiers de dev. **Backlog Phase 2 :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.4**. **Sprints :** [PLAN_SPRINT_01_LYNKI.md](PLAN_SPRINT_01_LYNKI.md) · [PLAN_SPRINT_02_LYNKI.md](PLAN_SPRINT_02_LYNKI.md) · [PLAN_SPRINT_03_LYNKI.md](PLAN_SPRINT_03_LYNKI.md) · [PLAN_SPRINT_04_LYNKI.md](PLAN_SPRINT_04_LYNKI.md) · [PLAN_SPRINT_05_LYNKI.md](PLAN_SPRINT_05_LYNKI.md) · [PLAN_SPRINT_06_LYNKI.md](PLAN_SPRINT_06_LYNKI.md) · [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) **v1.0** · [PLAN_SPRINT_08_LYNKI.md](PLAN_SPRINT_08_LYNKI.md) **v1.0** · [PLAN_SPRINT_09_LYNKI.md](PLAN_SPRINT_09_LYNKI.md) **v1.0** · [PLAN_SPRINT_10_LYNKI.md](PLAN_SPRINT_10_LYNKI.md) **v1.0** · [PLAN_SPRINT_11_LYNKI.md](PLAN_SPRINT_11_LYNKI.md) **v1.0** · [PLAN_SPRINT_12_LYNKI.md](PLAN_SPRINT_12_LYNKI.md) **v1.0** — rapports [RAPPORT_SPRINT_01_LYNKI.md](RAPPORT_SPRINT_01_LYNKI.md), [RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md) **v1.1**, [RAPPORT_SPRINT_03_LYNKI.md](RAPPORT_SPRINT_03_LYNKI.md) **v1.0**, [RAPPORT_SPRINT_04_LYNKI.md](RAPPORT_SPRINT_04_LYNKI.md) **v1.1**, [RAPPORT_SPRINT_05_LYNKI.md](RAPPORT_SPRINT_05_LYNKI.md) **v1.1**, [RAPPORT_SPRINT_06_LYNKI.md](RAPPORT_SPRINT_06_LYNKI.md) **v1.3**, [RAPPORT_SPRINT_07_LYNKI.md](RAPPORT_SPRINT_07_LYNKI.md) **v1.1**, [RAPPORT_SPRINT_08_LYNKI.md](RAPPORT_SPRINT_08_LYNKI.md) **v1.1**, [RAPPORT_SPRINT_09_LYNKI.md](RAPPORT_SPRINT_09_LYNKI.md) **v1.0**, [RAPPORT_SPRINT_10_LYNKI.md](RAPPORT_SPRINT_10_LYNKI.md) **v1.1**, [RAPPORT_SPRINT_11_LYNKI.md](RAPPORT_SPRINT_11_LYNKI.md) **v1.1**, [RAPPORT_SPRINT_12_LYNKI.md](RAPPORT_SPRINT_12_LYNKI.md) **v1.0**.

**Référentiel principal :** [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) **v2.2** — mars 2026  
**Documents satellites (même dossier) :** [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md), [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md), [AVIS_EXPERT_CDC_MASTER_LYNKI.md](AVIS_EXPERT_CDC_MASTER_LYNKI.md) — **UX / navigation :** [NOTE_DESIGN_MASTER_LYNKI.md](NOTE_DESIGN_MASTER_LYNKI.md), [INVENTAIRE_UX_EXISTANT_LYNKI.md](INVENTAIRE_UX_EXISTANT_LYNKI.md), [SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md), [WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md), [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) (**v0.5** — version portée par l’**en-tête** de *cette* spec ; ne pas confondre avec les **révisions futures** **v0.6** énoncées *dans* le corps de la spec)  
**Périmètre vérifié :** units/dorevia-linky (Lynki UI), units/diva (Diva/Mistral), sources/vault, tenants  
**Version :** 2.5 — mars 2026  
**Révisions v2.4 :** **Sprint 11 livré** — [RAPPORT_SPRINT_11_LYNKI.md](RAPPORT_SPRINT_11_LYNKI.md) **v1.1** : consolidation multi-sociétés `company_ids` Vault (T59), sélecteur multi-sociétés UI (T60), comparatifs enrichis trimestre/semestre/personnalisé (T61), exports comparatifs Bilan/CR (T62), migration schéma tiers V2 (T63), connecteur Odoo enrichi tiers V2 (T64), non-régression + doc (T65). **Gate C close**. **Sprint 12 livré** — [RAPPORT_SPRINT_12_LYNKI.md](RAPPORT_SPRINT_12_LYNKI.md) **v1.0** : balances tiers V2 COALESCE(date_maturity, line_date) + full_reconcile_id (T66), UI/exports balances tiers V2 avec aging_basis (T67), AccountingFactsPack comptable v1 (T68), insight comptable v1 template-first (T69), encart insight Synthèse (T70), non-régression + doc (T71). **Gate C consolidée** (fiabilisation tiers V2 + lecture interprétée). **Gate D substantiellement renforcée** (données V2 + Diva comptable). [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.4**.  
**Révisions v2.3 :** **Sprint 10 livré** — [RAPPORT_SPRINT_10_LYNKI.md](RAPPORT_SPRINT_10_LYNKI.md) **v1.1** : comparatif N/N-1 Vault (T54), SIG optionnels (T55), UI comparatif + SIG + sélecteur de période (T56), exports balances tiers CSV (T57), non-régression + doc (T58). **Gate C quasi-close** (lecture comparative décisionnelle). [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.3**.  
**Révisions v2.2 :** **Sprint 09 livré** — [RAPPORT_SPRINT_09_LYNKI.md](RAPPORT_SPRINT_09_LYNKI.md) **v1.0** : drill rubrique → BG filtrée via `account_prefixes` (T49), balance âgée clients et fournisseurs avec 6 tranches d'ancienneté (T50/T51), bloc UI Balances tiers en bloc 3 de la Synthèse conforme SPEC §3 (T52), réconciliation + doc (T53). **Gate C substantiellement avancée** (surface Synthèse complète — 4 blocs + drill). V1 balances tiers documentée avec limites (ancienneté approchée, pas de lettrage). [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.1**.  
**Révisions v2.1 :** **Sprint 08 livré** — [RAPPORT_SPRINT_08_LYNKI.md](RAPPORT_SPRINT_08_LYNKI.md) **v1.1** : mapping rubriques Bilan 13 rubriques `lynki.rubric.bs.*` (T43), mapping rubriques CR 13 rubriques `lynki.rubric.is.*` + formules calculées résultat net (T44), blocs UI Synthèse Bilan/CR structurés Actif/Passif/Exploitation/Résultats (T45/T46), exports CSV rubriques avec traçabilité (T47), réconciliation + backward compatibility + doc (T48). **Gate C significativement renforcée** (restitutions métier par rubriques). [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.0**.  
**Révisions v2.0 :** **Sprint 07 livré** — [RAPPORT_SPRINT_07_LYNKI.md](RAPPORT_SPRINT_07_LYNKI.md) **v1.1** : connecteur Odoo `partner_id` / `partner_name` (T37), GL filtre partenaire ILIKE + colonne systématique (T38), **`lynki.accounting.balance_sheet`** premier incrément classes 1–5 (T39), **`lynki.accounting.income_statement`** premier incrément classes 6–7 (T40), **habilitations fines `/accounting/*`** middleware Admin/Controller/Manager (T41), doc bumps (T42). **Gate C** renforcée (Bilan + CR + GL enrichi). **Gate D** renforcée (habilitations + connecteur). **Sprint 08** planifié : [PLAN_SPRINT_08_LYNKI.md](PLAN_SPRINT_08_LYNKI.md) **v1.0** (rubriques Bilan §9, rubriques CR §10, exports, réconciliation).  
**Révisions v1.9 :** **Clôture Gate B** — [RAPPORT_SPRINT_06_LYNKI.md](RAPPORT_SPRINT_06_LYNKI.md) **v1.3** : **Gate B pleine et close** (§8, texte canonique C5 / doctrine Vault) ; **§5.1** = trace opérateur à compléter au terrain pour audit nominatif. **Sprint 07** ouvert : [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) **v1.0** (connecteur `partner_id` / `partner_name`, Bilan / Compte de résultat, habilitations `/accounting/*`, GL).  
**Révisions v1.8 :** **Sprint 06** — T31 code prêt (terrain à constater) ; **T32** rôles Admin/Controller/Manager + protection `/admin/*` (middleware + cookie httpOnly + page `/login`) ; **T33** GL filtres `journal_code` + `partner_id` (migration 048 + Vault UNION ALL conditionnel) ; **T34** GL pagination + solde d'ouverture (LIMIT/OFFSET Vault + composant `Pagination` UI) ; **T35** export GL enrichi (colonnes `journal_code`, `partner_id`, `partner_name`, header `X-Lynki-Export-Journal`) ; **Gate B** conditionnelle (C5 terrain en attente) ; **Gate C** renforcée ; **Gate D** amorcée. Rapport [RAPPORT_SPRINT_06_LYNKI.md](RAPPORT_SPRINT_06_LYNKI.md) **v1.0**.  
**Révisions v1.7 :** **Sprint 05** — T26–T30 livrés : `LINKY_ACCOUNTING_STRICT` normalisé (C5 code prêt), GL promu en route dédiée (`/accounting/gl/[account_code]`), navigation BG→GL via `router.push` + breadcrumbs, export GL CSV, `.env.example` ; Gate B **conditionnelle** (C5 à constater en env de référence). Rapport [RAPPORT_SPRINT_05_LYNKI.md](RAPPORT_SPRINT_05_LYNKI.md) **v1.0**.  
**Révisions v1.6 :** **Sprint 04** — **T21–T25** livrés : migration `account_move_lines` + connecteur Odoo, `TrialBalanceAggregation` étendue (`complete=true` si C4 satisfait), export CSV BG (`GET /api/accounting/trial-balance/export` + bouton Linky), `referentiel_version` homogène ; **Gate B prononcée conditionnellement** (C5 en env de référence à valider). Rapport [RAPPORT_SPRINT_04_LYNKI.md](RAPPORT_SPRINT_04_LYNKI.md) **v1.1**.  
**Révisions v1.5 :** **Sprint 03** — **T16–T18** livrés (, drill BG→GL, panneau écritures) ; **T19** décision documentée ([ADR_T19_TRIAL_BALANCE_EXTENSION.md](ADR_T19_TRIAL_BALANCE_EXTENSION.md)) : source  confirmée unique, extension  Sprint 04+ ; **Gate C amorcée** (chaîne BG→GL) ; **Gate B** reste partielle (couverture inchangée).  
**Révisions v1.4.3 :** **Sprint 02** — **T11–T13** livrés (Vault `GET /api/accounting/trial-balance`, Linky `data_source` / stub explicite, `referentiel_version` sur la restitution) ; **T14** (BG→GL) **reporté** ; **Gate B** = **partiel** (Synthèse : **BG pilote — périmètre partiel (OD paie)**, pas « BG métier complète » — voir [RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md) §1.1) ; **Gate C** non atteint (sans GL). Mise à jour §2.1a / §2.1b / conclusion.  
**Révisions v1.4.2 :** renvoi au **[PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) v1.1.1** (lots, DoD, dépendances, gates) et au **[BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md)** en tête de document et en §1.  
**Révisions v1.4.1 :** **gel des références de version** — [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) citée en **v0.5** uniquement (alignée sur l’en-tête) ; **v0.6** = itérations *prévues dans* la spec, pas une version « fantôme » du fichier d’alignement. **Règle d’implémentation Vault** durcie en §1 (Synthèse comptable = données servies via Vault pour affichage de référence et preuve). **Priorité 1 ter** scindée : chantier **navigation** (`appView`, `?view=`) vs chantier **surface comptable** (`AccountingSummaryView`, BG, GL).  
**Révisions v1.4.0 :** intégration du **socle UX / navigation** (NOTE, inventaire, SPEC navigation, wireframes BF, **spec écran Synthèse comptable**), de la **doctrine Vault vs amont** (restitution + preuve Lynki via Vault ; pas d’affichage de référence basé sur lecture directe des amont — cf. [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) §2.1), et d’une **ligne d’alignement** dédiée **navigation Pilotage / Synthèse** + surface Synthèse (§2.1b). Mise à jour de la conclusion et des renvois vers [AVIS_EXPERT_CDC_MASTER_LYNKI.md](AVIS_EXPERT_CDC_MASTER_LYNKI.md) **v1.2**.  
**Révisions v1.3.1 :** renvois au [référentiel comptable v1.1](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) par **titres de sections** (*Preuve de version du référentiel*, *Exigence produit — exposition ou journalisation de la version*) plutôt que par numéros § — gel documentaire sans ambiguïté de numérotation.  
**Révisions v1.3 :** retrait du **runbook Odoo** du corps du document (référence unique vers `RUNBOOK_ODOO_…`), harmonisation **bloc insights**, précision des préfixes **`lynki.accounting.*` / `lynki.rubric.*`**, rappel de **version** du référentiel comptable (**v1.1**, cf. en-tête du fichier).  
**Révisions v1.2 :** prise en compte du **CDC v2.2** (restitutions §4.1.1, §6.5), du **triptyque documentaire** web57 (dictionnaire + référentiel comptable v1.1 + avis d’expert), et d’une **ligne d’alignement** dédiée aux six restitutions comptables structurantes.  
**Date :** 20 mars 2026  

---

## 1. Synthèse

Pour l’**ordre de réalisation** des chantiers (lots 0–6, DoD, priorités), utiliser **[PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md)** — complément opérationnel à la matrice ci-dessous.

**Deux niveaux d’alignement** sont distingués dans ce document :

- **Alignement au CDC cible complet** : ce qui est prévu à terme dans le CDC (tous filtres, rejouabilité, export, rôles formalisés, chaîne de preuve comptable complète, etc.).
- **Alignement au périmètre MVP / Phase 1-2** : ce qui devait être livré pour le cœur produit (cockpit, **bloc insights**, filtres de base, drill-down, multi-tenant).

**Socle documentaire `ZeDocs/web57` :** le CDC est désormais **complété** par un **dictionnaire des restitutions comptables**, un **référentiel comptable de restitution** (PCG FR de base, surcharges tenant) et un **avis d’expert** sur le CDC. Ces artefacts **ne remplacent pas** le CDC mais **cadrent** l’implémentation comptable structurante (§4.1.1, §6.5) et la recette associée. *Ordre de priorité documentaire (hors arbitrage client) : référentiel comptable → dictionnaire des restitutions → CDC.*

**UX / navigation (web57) :** la **navigation unique** Pilotage / Synthèse comptable, les **wireframes BF**, la **spec d’écran Synthèse** ([SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md)) et l’**inventaire** de l’existant fixent le cadrage produit pour la **surface Synthèse** et la **chaîne de preuve** (bilan / rubriques / comptes / **balance générale** / **grand livre**) — voir §2.1b.

**Règle d’implémentation — Synthèse comptable :** toute surface **Synthèse comptable** livrée dans Lynki doit reposer, pour l’**affichage de référence** et la **preuve**, sur des **données servies via le Vault** (et les connecteurs qui alimentent le Vault). Les **sources amont** (ex. ERP) restent les **systèmes d’origine** ; elles ne constituent pas la base d’affichage « à la volée » pour la Synthèse au sens [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) §2.1. Toute **dérogation** à cette règle doit être **explicitement arbitrée** et **tracée** (gouvernance §6).

L’implémentation est **alignée avec le CDC sur le périmètre MVP et Phase 1-2** pour le **cockpit 12 KPIs** et le **bloc insights**. Les écarts restants portent sur les fonctions **phasées en Phase 3/4**, sur les **livrables de formalisation** (notamment **dictionnaire des indicateurs (KPIs)**, distinct des restitutions comptables), sur les **rôles explicites**, sur l’**exposition produit complète** des six restitutions comptables sous leurs **identifiants canoniques** du dictionnaire, et sur la **chaîne de preuve BG → GL** (non livrée — Sprint 03). La **navigation Pilotage / Synthèse** et l’**écran Synthèse** avec bloc **balance générale pilote** (`lynki.accounting.trial_balance` via Vault) sont **partiellement livrés** (voir §2.1b) ; la **promesse produit** sur la balance est **« périmètre partiel (OD paie) »** tant que la couverture n’est pas étendue ([RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md) §1.1). En d’autres termes : *le cœur « cartes + **bloc insights** » est là ; le volet restitutions comptables progresse (**trial_balance** réel, partiel) ; la **Synthèse** n’est pas encore la cible complète du CDC pour les six restitutions.*

| Dimension CDC | Alignement | Commentaire |
|---------------|------------|-------------|
| §4.1 Grille 12 KPIs | ✅ Aligné | 12 cartes présentes et nommées comme au CDC |
| §4.2 Restitution KPIs | ✅ Aligné | Libellé, valeur, variation, couleur, fraîcheur, détail, tooltip |
| §4.3 Bloc insights | ✅ Aligné MVP | Diva + Mistral, stockage + fraîcheur ; écran historique dédié non livré |
| §4.4 Explicabilité | ⚠️ Partiel | Niveau métrique en place ; niveau preuve unitaire (chiffre → document vaulté) à renforcer |
| F1 Visualisation | ✅ Aligné | Cartes, sémantique couleur, formatage, fraîcheur |
| F2 Navigation / filtres | ✅ Aligné MVP / ⚠️ Partiel | MVP : mois, YTD, année, tenant, société, drill-down. Cible CDC : manquent jour, semaine, plage personnalisée, établissement/POS dédié. **Navigation** `?view=` + **Synthèse** : **impl. partielle** (Sprint 01–03) — **BG pilote** + **drill GL** (panneau) ; **Gate C amorcée** |
| F3 Rejouabilité | ❌ Non livré | Prévu Phase 4 ; préparation technique possible (clés période/périmètre) |
| F4 Alertes | ⚠️ Partiel | Vigilances Diva + statuts cartes (ok/watch/alert) ; seuils non configurables par utilisateur |
| F5 Personnalisation | ⚠️ Partiel | Vue par “mode” (tout / cash / business / corrections / POS) ; pas de préférences persistées ni ordre cartes par profil |
| F6 Rôles et accès | ⚠️ Partiel | Multi-tenant, permissions dans config ; pas de profils Admin/Controller/Manager formalisés ni audit trail dédié |
| F7 Export | ❌ Non livré | Pas d’export PDF de synthèse ni export tableur des données visibles |
| §4.1.1 Restitutions comptables (6) | ⚠️ Doc ✅ / impl. partielle | **DICTIONNAIRE** + **REFERENTIEL** web57 à jour ; **`lynki.accounting.trial_balance`** : Vault `GET /api/accounting/trial-balance` + route Linky — BG pilote partiel (OD paie), `complete: false` ; **`lynki.accounting.general_ledger`** : Vault `GET /api/accounting/general-ledger` + route Linky + drill UI panneau (Sprint 03) — partiel même source ; **Gate C amorcée** ; autres restitutions = en cours |
| §6.5 Référentiel comptable de restitution | ⚠️ Doc ✅ / impl. partielle | Règles figées dans [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** ; **`referentiel_version`** sur `trial_balance` (amorce) ; **généraliser** aux autres restitutions / exports |
| §6 Gouvernance donnée | ⚠️ Partiel | Fraîcheur, sources (Vault/Odoo), statuts rapprochement ; **dictionnaire des indicateurs (KPIs)** non formalisé (distinct du dictionnaire des **restitutions** comptables) |
| §8 Performance | ✅ Aligné | Cache, restitution fluide, UX P95 mesurée (footer) |
| §9 Sécurité / habilitations | ⚠️ Partiel | HTTPS, auth selon infra ; rôles non formalisés, pages admin non verrouillées, pas d’audit trail dédié |
| §10 UI / design | ✅ Aligné | Dark mode, grille cartes, bloc insights, responsive |

---

## 2. Détail par chapitre CDC

### 2.1 §4.1 Vue principale — Cockpit 12 indicateurs

**CDC :** Grille de 12 indicateurs (Trésorerie, Activité/Flux business, Flux net, Paiements, BFR, Encours, Taxes, EBE, Notes de crédit, Remboursements, Points de vente, Z de caisse).

**Implémentation :**  
Les 12 cartes sont définies dans `app/types/linky-tiles.ts` (CardId) et `app/lib/tile-help.ts` (libellés et tooltips). L’API `dashboard-metrics` expose les métriques correspondantes (treasury, business, cash “Flux net”, treasury_position “Paiements”, working_capital, encours, taxes, ebitda, credit_notes, refunds, pos_shops, pos_z).  
**Verdict : ✅ Aligné.**

---

### 2.1a §4.1.1 Restitutions comptables structurantes (bilan, compte de résultat, balances tiers, balance générale, grand livre)

**CDC :** Six restitutions identifiées (cf. §4.1.1) avec chaîne de preuve cible (synthèse → rubrique → compte → balance générale → grand livre).

**Documents :**  
- [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md) — fiches métier, identifiants canoniques, réconciliation attendue.  
- [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) — mapping PCG FR → rubriques, éligibilité, signes, netting, journaux, recette (**version documentaire 1.1**, mars 2026 — cf. en-tête du fichier).

**Préfixes attendus en convergence code ↔ docs :**

- **`lynki.accounting.*`** — restitutions comptables structurantes (ex. `lynki.accounting.balance_sheet`, `lynki.accounting.trial_balance`, …) ;
- **`lynki.rubric.*`** — rubriques de bilan / compte de résultat (agrégats métier), telles que définies dans le référentiel.

**Implémentation (aperçu) :**  
- Données et agrégats **Vault / connecteurs** (trésorerie, encours, taxes, paie, stock, etc.) et routes API métier (`dashboard-metrics`, `treasury`, évolutions, `stock-valuation`, partenaires, DLP…) en place ou en extension.  
- **`lynki.accounting.trial_balance`** : **Vault** `sources/vault` — `GET /api/accounting/trial-balance` ; agrégation **réelle** depuis **`payroll_od_lines`** (couverture **partielle** — ne pas présenter comme BG métier **complète** ; voir [RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md) §1.1) ; Linky `/api/accounting/trial-balance` avec **`data_source`** / **`referentiel_version`**.  
- **Diva** : explicabilité (`diva/explain`, activité), pas encore une **surface produit unique** par restitution avec les seuls identifiants `lynki.accounting.*` du dictionnaire.  
- **Traçabilité de version** du référentiel / mapping sur **chaque** restitution exposée : à renforcer côté API et exports (aligné [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) v1.1 — *Preuve de version du référentiel*, *Exigence produit — exposition ou journalisation de la version*).

**Verdict : ⚠️ Partiel** — **trial_balance** amorcé (**Vault réel**, **partiel**) ; **GL** et autres restitutions : **à livrer** ; priorité : **identifiants canoniques**, jeux de réconciliation, preuve de version, **chaîne BG → GL** ([PLAN_SPRINT_03_LYNKI.md](PLAN_SPRINT_03_LYNKI.md)).

---

### 2.1b Navigation UX — Pilotage / Synthèse comptable et surface Synthèse

**CDC / design :** Distinction **Pilotage** (grille KPIs, insights) et **Synthèse comptable** (restitutions, chaîne de preuve, charnière BG/GL) ; navigation cohérente desktop / mobile.

**Documents :**  
- [SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md) — états globaux (`appView`, `kpiMode`), URL `?view=pilotage|synthese`, fallbacks, historique navigateur.  
- [WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md) — chrome, onglets / sélecteur de vue, drill-down.  
- [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) — **v0.5** (cf. en-tête du fichier) : blocs d’écran, états vides / chargement / erreur, **§2.1** Vault / amont, **§11.2** période / périmètre / version référentiel·mapping. Les **évolutions prévues en v0.6** (colonnes BG/GL, insights, détail fraîcheur, etc.) sont **décrites dans la même spec** comme révision ultérieure — **pas** une version « avancée » déjà stabilisée hors en-tête.

**Implémentation :**  
- **Navigation** `?view=pilotage|synthese` et **surface Synthèse** : **livré** (Sprint 01) — `DashboardWithFilters`, `AccountingSummaryView`, bloc **balance générale pilote** (`lynki.accounting.trial_balance` via `/api/accounting/trial-balance` → Vault — Sprint 02). **Gate B** : **partiel** (données réelles **partielles** — §1.1 [RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md)).  
- **Drill BG → GL** : **non livré** (Gate **C** non atteint) — Sprint 03.  
- **Doctrine Vault** : appliquée sur le flux trial balance (§1, spec §2.1).

**Verdict : ⚠️ Partiel** — Navigation + Synthèse **amorcées** ; **BG** = **réelle** mais **périmètre partiel (OD paie)** ; **GL** et autres blocs spec **à venir**.

---

### 2.2 §4.2 Principes de restitution des KPIs

**CDC :** Libellé clair, valeur principale, variation, couleur sémantique, fraîcheur, accès au détail, explication de calcul, timestamp.

**Implémentation :**  
- Libellés : `TILE_HELP` + labels dans les composants (ex. Trésorerie, Business, Flux net, Paiements, BFR, Encours, Taxes, EBE, Notes de crédit, Remboursements, Points de vente, Z de caisse).  
- Valeur / variation : `DashboardMetricsResponse`, `KpiMetric`, formatage dans les cartes.  
- Couleur : `ValueKind`, `CardStatusValue` (ok/watch/alert), classes Tailwind (positive, negative, accent, etc.).  
- Fraîcheur : `data_freshness`, `generated_at`, `linky_data_available_at`, badge “Calculé il y a X min” sur le **bloc insights**.  
- Accès au détail : drill-down vers vue “Instrument” par carte (InstrumentCardChrome, ex. WorkingCapitalCard, TresoreriePositionCard).  
- Explication : tooltips `TILE_HELP`, statut de gouvernance (ex. “X % des flux non couverts”).  
- Timestamp : présent dans l’API et le footer (preuves, UX P95).  

**Verdict : ✅ Aligné.**

---

### 2.3 §4.3 Bloc insights (« Insights principaux » au CDC)

**CDC :** Zone de synthèse narrative, commentaires lisibles, variations significatives, ratios, alertes contextualisées, tonalité contrôle de gestion, historique consultable ; renvoi aux docs Comportement insight et normalisation langue.

**Implémentation :**  
- Composant `DivaFlashBlock`, API `diva/insight`, `diva/explain`, `diva/refresh`, `diva/jobs/[contextHash]`.  
- Headline + what_i_see + to_check, formulation “conserve une avance”, vigilances reformulées (rapprochement, fiscal, client nominatif).  
- Références CDC vers **ZeDocs/web56** (comportement insight, langue) et **web57** (restitutions comptables structurantes — voir §2.1a).  
- Historique : insight stocké en base (Vault/diva_insights), fraîcheur affichée ; pas d’écran “historique des insights” dédié.  

**Verdict : ✅ Aligné MVP** — stockage + fraîcheur en place ; écran historique dédié non livré.

---

### 2.4 §4.4 Explicabilité

**CDC :** Rattacher chaque insight à période, périmètre, KPIs, règle d’interprétation, sources.

**Implémentation :**  
- Période et périmètre : passés à Diva (tenant, company_id, period), affichés dans l’UI (filtres, en-tête).  
- KPIs : `FactsPack.Metrics` (manifeste des montants), traçabilité des chiffres dans l’insight.  
- Règles : moteur de faits Diva (engine.go), prompt Mistral contraint.  
- Sources : Vault/Odoo/connecteurs ; pas de lien explicite “clic → preuve document” par ligne d’insight.  

Aujourd’hui l’explicabilité est surtout de **niveau métrique** (chiffre, règle, période, périmètre). L’**explicabilité de niveau preuve unitaire** — chiffre → règle → source → preuve → document / événement vaulté — reste à renforcer ; c’est là que Lynki peut devenir très fort (drill-down jusqu’à la preuve).

**Verdict : ⚠️ Partiel** — Explicabilité métrique en place ; niveau preuve unitaire à développer.

---

### 2.5 F1 — Visualisation

**CDC :** Cartes, vue synthèse lisible, sémantique couleur, icônes/libellés, formatage montants/%, variations, fraîcheur.

**Implémentation :** IconGrid, InstrumentCardChrome, cartes avec valeur/variation/statut, formatage EUR, tooltips.  
**Verdict : ✅ Aligné.**

---

### 2.6 F2 — Navigation et interaction

**CDC :** Filtres période (jour, semaine, mois, trimestre, année, personnalisé), périmètre (tenant, société, établissement, POS), drill-down, infobulles, actualisation manuelle/auto, navigation synthèse ↔ détail.

**Implémentation :**  
- Période : `period-utils.ts` (YTD, mois 1–12, T1–T4, all), sélecteur période + année. Pas de “jour” ni “semaine” ni plage personnalisée libre en UI.  
- Périmètre : TenantSelector, sélecteur société (companies), pas d’établissement ni POS séparés dans les filtres.  
- Drill-down : clic carte → vue Instrument (détail par indicateur).  
- Infobulles : TILE_HELP sur chaque tuile.  
- Actualisation : polling métriques, bouton “Reformuler” (cycle headlines), pas de “rafraîchir tout” explicite.  
- Navigation : synthèse (IconGrid) ↔ détail (InstrumentCard) via onSelect/onNavigateToCard.  

**Verdict : ✅ Aligné MVP** (mois, YTD, année, tenant, société, drill-down, infobulles, navigation synthèse ↔ détail). **⚠️ Partiel** au regard du CDC cible : manquent jour, semaine, plage personnalisée, filtre établissement / POS dédié.

---

### 2.7 F3 — Lecture à date / rejouabilité

**CDC :** Consultation “à date”, comparaison deux périodes, historisation, contexte de génération des insights. Phase 4.

**Implémentation :** Non livré. Les filtres de période permettent de changer la période courante ; pas de “lecture à la date D” ni de comparaison A vs B ni d’historique des recalculs.  
**Verdict : ❌ Non livré** — Conforme au phasage CDC (Phase 4).

---

### 2.8 F4 — Alertes

**CDC :** Seuils par indicateur, alertes visuelles, catégorisation, historique alertes, notifications externes, gestion faux positifs.

**Implémentation :**  
- Statuts cartes : ok / watch / alert (gouvernance trésorerie, Paiements, etc.) avec libellés (ex. “X % à rapprocher”).  
- Vigilances Diva : what_i_see / to_check (rapprochement, fiscal, client).  
- Pas de paramétrage utilisateur des seuils, pas d’historique d’alertes dédié, pas de notifications externes.  

**Verdict : ⚠️ Partiel** — Alertes visuelles et contextualisées présentes ; “alertes configurables” et historique = Phase 3.

---

### 2.9 F5 — Personnalisation

**CDC :** Vues par rôle, affichage sélectif KPIs, préférences sauvegardées, composition personnalisée, ordre des cartes par profil.

**Implémentation :** Modes d’affichage (tout / cash / business / corrections / POS) dans ReportHeader ; pas de préférences persistées (localStorage/serveur), pas d’ordre de cartes configurable par profil.  
**Verdict : ⚠️ Partiel** — Vues par “mode” ; reste à faire : préférences, ordre cartes, lien rôle ↔ vue (F6).

---

### 2.10 F6 — Gestion des rôles et accès

**CDC :** Profils Admin, Controller/RAF/DAF, Manager, Consultant ; habilitations par périmètre, audit trail, journalisation.

**Implémentation :**  
- Multi-tenant et liste de tenants (TenantSelector) ; `TenantPermissions` dans la config (objet générique).  
- Page `/admin/dlp-config` accessible sans contrôle de rôle explicite dans le code.  
- Pas de profils Admin/Controller/Manager différenciés ni d’audit trail dédié des consultations.  

**Verdict : ⚠️ Partiel** — Périmètre (tenant/société) et permissions présents ; formalisation des rôles et audit = à renforcer (Phase 2/3).

---

### 2.11 F7 — Export et diffusion

**CDC :** Export PDF synthèse, export tableur, reporting périodique, partage contrôlé, envoi programmé.

**Implémentation :** Aucun endpoint ni bouton d’export PDF ou tableur identifié dans dorevia-linky.  
**Verdict : ❌ Non livré** — À prévoir (Phase 2/3).

---

### 2.12 §6 Gouvernance de la donnée

**CDC :** Origine, fréquence, fiabilité, date de valeur, règles de transformation, **dictionnaire des indicateurs (KPIs)** ; le CDC v2.2 exige en outre un **référentiel comptable de restitution** (§6.5).

**Implémentation :**  
- Fraîcheur et sources : `generated_at`, `linky_data_available_at`, statuts de rapprochement, sealed_count.  
- **Dictionnaire des indicateurs (KPIs)** : non formalisé comme livrable unique (définitions dispersées dans le code et les specs) — **distinct** du dictionnaire des **restitutions comptables** (déjà rédigé dans web57).  
- **Référentiel comptable** : **documenté** ([REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md)) ; application dans le code (mapping versionné, surcharges tenant) = **partielle** / à suivre par chantier.

**Verdict : ⚠️ Partiel** — Gouvernance opérationnelle en place ; **dictionnaire des indicateurs (KPIs)** = préalable recette MVP (CDC Phase 1) ; **référentiel comptable** = formalisé côté doc, à **porter** dans l’implémentation (version affichée / journalisée par restitution).

---

### 2.13 §8 Performance, §9 Sécurité, §10 UI

**Implémentation :**  
- **§8 Performance :** Cache métriques (localStorage), restitution fluide, UX P95 dans le footer.  
- **§9 Sécurité / habilitations :** HTTPS et auth selon infra ; pas de rôles formalisés, page `/admin/dlp-config` sans contrôle de rôle explicite, pas d’audit trail dédié des consultations.  
- **§10 UI / design :** Dark mode, grille cartes, bloc insights, responsive.  

**Verdicts :** §8 Performance **✅ Aligné** ; §9 Sécurité **⚠️ Partiel** ; §10 UI **✅ Aligné**.

---

## 3. Écarts à traiter (priorisation suggérée)

### Priorité 1 — Dictionnaire des indicateurs

Le dictionnaire des indicateurs n’est pas un “plus documentaire” ; c’est un **artefact produit central** pour verrouiller Lynki. Sans lui : recette fragile, explicabilité partielle, Diva sans référentiel canonique consolidé, comparaison CDC ↔ code ↔ UX dispersée.

**Contenu minimum par KPI :**

- identifiant canonique ;
- libellé métier ;
- définition métier ;
- formule ;
- source(s) ;
- niveau de fraîcheur attendu ;
- périmètre applicable ;
- règles d’interprétation ;
- limites / cas ambigus ;
- composants UI consommateurs ;
- endpoint / API associé.

**Action :** Rédiger le livrable Phase 1 et le lier au CDC.

---

### Priorité 1 bis — Restitutions comptables : convergence doc ↔ code

Le **dictionnaire** et le **référentiel** ([REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1**) fixent les règles ; l’implémentation doit **converger** vers :

- exposition des restitutions sous les **identifiants canoniques** : préfixe **`lynki.accounting.*`** pour les six restitutions (bilan, compte de résultat, balances âgées, balance générale, grand livre) ;
- rubriques agrégées selon le **référentiel** sous **`lynki.rubric.*`** (bilan / compte de résultat) ;
- **jeux de réconciliation** (bilan ↔ balance, etc.) et métadonnées de **période / périmètre / version de référentiel** sur les réponses API et exports.

**Action :** Tracer dans le code et l’UI les écarts restants par rapport au dictionnaire ; prioriser les endpoints « preuve » (balance générale, grand livre) pour la chaîne §14 CDC. S’appuyer sur [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) pour la **composition** de l’écran Synthèse et la **doctrine Vault** (§2.1).

### Priorité 1 ter — Navigation Pilotage / Synthèse et surface Synthèse comptable

Deux chantiers **liés mais de nature différente** :

1. **Navigation** — Mettre en œuvre [SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md) : `appView` / `kpiMode`, URL `?view=pilotage|synthese`, fallbacks, historique navigateur ; cohérence avec [WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md).

2. **Surface comptable** — Livrer la vue **Synthèse** et ses blocs selon [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) **v0.5** (en-tête) : composition d’écran, `AccountingSummaryView`, charnière **balance générale** / **grand livre**, restitutions sous **`lynki.accounting.*`**. Les **affinements** prévus pour une **révision ultérieure de la spec** (**v0.6** — colonnes BG/GL, insights, détail fraîcheur : cf. fin de la spec) peuvent suivre un **premier incrément** conforme à la **v0.5**.

**Doctrine :** règle Vault du §1 et spec §2.1 (données servies via Vault pour affichage de référence et preuve).

---

### Priorité 2 — Rôles / habilitations minimum

Pas forcément audit trail complet tout de suite, mais au moins : verrouillage des pages admin, premiers profils explicites, séparation consultation / administration. Un cockpit de gestion sans cadrage d’accès devient vite sensible.

**Action :** Protéger `/admin/*`, définir profils (ex. Admin, Controller, Manager), lier permissions à la config tenant.

---

### Priorité 3 — Export basique

Très utile commercialement et pour la recette : PDF synthèse, export tableur (CSV).

**Action :** Spécifier et implémenter export synthèse (PDF) et export données (CSV) pour Phase 2.

---

### Priorité 4 — Filtres période manquants

Jour, semaine, plage personnalisée.

**Action :** Ajouter les options dans period-utils + UI.

---

### Priorité 5 — Alertes configurables

Phase 3. Permettre la définition de seuils par indicateur.

---

### Priorité 6 — Rejouabilité

À garder en Phase 4. Structurant mais pas prioritaire avant d’avoir verrouillé les fondamentaux. S’appuyer sur la préparation technique (modèle, clés) prévue en Phase 2.

---

## 4. Conclusion

**Mise à jour (v2.0 — mars 2026)** — **Sprint 07 livré** ([RAPPORT_SPRINT_07_LYNKI.md](RAPPORT_SPRINT_07_LYNKI.md) **v1.1**) : connecteur Odoo enrichi `partner_id` / `partner_name` ; GL filtre partenaire (ILIKE) + colonne systématique + export ; **`lynki.accounting.balance_sheet`** et **`lynki.accounting.income_statement`** (premier incrément, agrégation par classe PCG) ; **habilitations fines `/accounting/*`** (middleware Admin/Controller/Manager). **Gate C renforcée** (Bilan + CR + GL enrichi). **Gate D renforcée** (habilitations + connecteur). **Suite logique :** Sprint 08 — rubriques Bilan/CR, exports, consolidation recette.

**Mise à jour (v1.9 — mars 2026)** — **Gate B** est **pleine et close** au sens [RAPPORT_SPRINT_06_LYNKI.md](RAPPORT_SPRINT_06_LYNKI.md) **v1.3** (§8 — doctrine Vault, `data_source=vault`, pas de stub silencieux avec `LINKY_ACCOUNTING_STRICT=1`) ; la **trace opérateur** attendue en audit figure au **§5.1** du même rapport. **Suite logique :** [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) **v1.0** (connecteur `partner_id` / `partner_name`, Bilan / Compte de résultat, habilitations fines `/accounting/*`, enrichissements GL).

---

**Conclusion révisée (v1.4.3)** — *historique Sprint 01–02 ; conservée pour traçabilité.*

L’implémentation actuelle de Lynki est globalement alignée avec le **CDC v2.2** sur le périmètre **MVP / Phase 1-2** pour le **cockpit 12 KPIs** : restitution des indicateurs, bloc insights Diva, filtres période/périmètre, drill-down, multi-tenant, gouvernance opérationnelle et performance UX.

Le **socle documentaire** (dictionnaire des **restitutions** comptables, [référentiel comptable **v1.1**](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md), [avis d’expert **v1.2**](AVIS_EXPERT_CDC_MASTER_LYNKI.md)) **cadre** le volet **§4.1.1 / §6.5** ; le **cadrage UX** fixe la **navigation Pilotage / Synthèse** et l’**écran Synthèse** avec la **doctrine Vault**. **Sprint 01–02 :** **navigation** `?view=` et **Synthèse** avec bloc **balance générale pilote** (**`lynki.accounting.trial_balance`**, réponse **Vault** — couverture **partielle** OD paie, **Gate B partiel** — voir [RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md) §1.1) ; **Gate C** non atteint (sans **GL**). L’alignement **code ↔ documents** progresse sur les restitutions ; il reste à **étendre la couverture BG**, **livrer le GL** et les **autres** restitutions sous **`lynki.accounting.*`** et **`lynki.rubric.*`**.

Les principaux écarts portent sur :

- la **formalisation** du **dictionnaire des indicateurs (KPIs)** — livrable distinct du dictionnaire des restitutions comptables ;
- la **convergence produit** des six restitutions sous les identifiants et règles des docs web57 — **trial_balance** amorcé (**partiel**) ;
- **Grand livre / drill BG → GL** et **complétude** balance — **Sprint 03** ([PLAN_SPRINT_03_LYNKI.md](PLAN_SPRINT_03_LYNKI.md)) ;
- les **habilitations et rôles** encore partiellement implémentés ;
- les **exports** ;
- certaines options de **filtrage avancé** (jour, semaine, personnalisé) ;
- les fonctions volontairement phasées plus tard (**alertes configurables, rejouabilité**).

En creux, ce document montre que **Lynki n’est plus une idée de cockpit** : c’est déjà un produit avec un modèle d’indicateurs, une couche narrative, un système de filtres, une logique multi-tenant, une gouvernance opérationnelle minimale, une **documentation comptable structurante** exploitable, une **première mécanique probante** sur la **balance** (Vault, traçabilité `data_source` / stub), et une architecture assez mûre pour être auditée par rapport à un CDC.

**Recommandation :** Utiliser ce document comme **référentiel officiel de recette MVP et de cadrage Phase 2**, puis enchaîner sur **[PLAN_SPRINT_03_LYNKI.md](PLAN_SPRINT_03_LYNKI.md)** (GL + extension BG) et :

1. **Dictionnaire des indicateurs (KPIs)** — livrable unique lié au CDC §6.3 ;
2. **Convergence restitutions comptables** — préfixes **`lynki.accounting.*`** / **`lynki.rubric.*`**, réconciliation, preuve de version (**[REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) v1.1**) ;
3. **Synthèse comptable** — compléter [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) **v0.5** (`AccountingSummaryView`, BG **complète** cible, **GL**) ; doctrine Vault §1 ;
4. **Rôles / habilitations minimum** ;
5. **Export synthèse basique** (PDF + CSV).

---

## 5. Exploitation — incident source Odoo (référence hors périmètre alignement)

Ce document vise l’**alignement CDC ↔ implémentation**. Il **ne duplique pas** les procédures d’exploitation détaillées (symptômes, diagnostic shell, remédiation) pour l’erreur OwlError liée à `stock.picking.invoice_ids`.

**Runbook à utiliser :** [RUNBOOK_ODOO_OWLERROR_STOCK_PICKING_INVOICE_IDS.md](RUNBOOK_ODOO_OWLERROR_STOCK_PICKING_INVOICE_IDS.md) — également référencé depuis le [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) (§13, artefacts web57).
