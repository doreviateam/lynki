# Dictionnaire des restitutions comptables — Lynki

**Fichier de référence unique** dans `ZeDocs/web57/` — les évolutions se suivent via le **numéro de version** ci-dessous (pas de suffixe `_v1.x` dans le nom de fichier).

**Version :** 1.2 — mars 2026  
*(Micro-robustesse : terminologie des écritures, exclusion des brouillons, devises, tolérance de réconciliation, solde balance générale explicite — aligné produit / API / recette.)*  
**Référence CDC :** [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) v2.2 (§4.1.1, §4.5, §6.3, §6.5, §7.3.1, F8, §14)

---

## 1. Objet et périmètre

Ce document formalise les **six restitutions comptables structurantes** du socle Lynki :

| # | Identifiant canonique | Restitution Lynki | Rôle |
|---|------------------------|-------------------|------|
| 1 | `lynki.accounting.balance_sheet` | Structure financière / Bilan | Synthèse patrimoniale |
| 2 | `lynki.accounting.income_statement` | Performance comptable / Compte de résultat | Synthèse de période |
| 3 | `lynki.accounting.ar_aging` | Balance âgée clients | Auxiliaire créances |
| 4 | `lynki.accounting.ap_aging` | Balance âgée fournisseurs | Auxiliaire dettes |
| 5 | `lynki.accounting.trial_balance` | Balance générale | **Pivot** comptes / soldes → grand livre |
| 6 | `lynki.accounting.general_ledger` | Grand livre comptable | **Preuve détaillée** |

**Hors périmètre :** KPIs du noyau §4.1.2 du CDC — voir dictionnaire des indicateurs (§6.3 CDC).

**Chaîne de preuve cible (CDC §14) :**  
*restitution synthétique → rubrique → compte → balance générale → écriture (grand livre)*.

---

## 2. Source de vérité, statut des écritures et périmètre des données

### 2.1 Terminologie harmonisée (référence unique)

Pour éviter les ambiguïtés **validée / postée** selon les ERP :

> **Toutes les restitutions comptables Lynki s’appuient sur des écritures *postées / validées selon la terminologie du système source*.**

La couche d’**ingestion** et l’**API** normalisent en interne vers un **statut canonique** documenté (ex. jeu de valeurs `posted` | `draft_excluded` | …) — à figer dans les specs connecteur / OpenAPI.

### 2.2 Exclusion des écritures brouillon (principe transverse)

**Les écritures au statut brouillon sont exclues de toutes les restitutions comptables Lynki**, sauf mention **explicite contraire** dans un **environnement de simulation** ou de **prévisualisation** paramétré et documenté à part (hors périmètre « dossier » de production).

### 2.3 Source de vérité vs source de calcul

| Notion | Définition | Exemple |
|--------|------------|---------|
| **Source de vérité** | Système ou référentiel **faisant foi** pour l’audit métier (le « dossier » comptable). | *Comptabilité générale du dossier* après application des règles §2.1–2.2. |
| **Source de calcul** | **Objets techniques** et règles effectivement lus par Lynki pour produire l’écran. | *Lignes exposées par l’API connecteur*, *agrégations par compte*, *soldes auxiliaires tiers*. |

En cas de divergence entre systèmes, le **CDC §6.2** (priorité des sources) prévaut.

### 2.4 Devise (règle transverse pour le modèle de fiche)

Pour tout dossier **multi-devises**, chaque fiche doit préciser la **devise de restitution** :

| Sous-champ | Rôle |
|------------|------|
| **Devise des lignes source** | Telle qu’enregistrée sur l’écriture / le compte dans l’ERP. |
| **Devise société / dossier** | Devise de tenue des comptes si différente. |
| **Devise de présentation Lynki** | Celle affichée à l’écran (souvent = société ou préférence utilisateur). |
| **Règle de conversion** | Taux, date de conversion, arrondis — **documentés** dans le référentiel comptable de restitution si l’affichage n’est pas en devise source. |

Sans ces précisions, les tests de réconciliation multi-devises deviennent **non objectifs**.

### 2.5 Tolérance de réconciliation (recette)

Les critères du type « écart = 0 ou documenté » sont complétés par un champ explicite dans chaque fiche :

| Mode | Usage |
|------|--------|
| **Zéro strict** | Écart interdit entre restitutions liées (sauf bug ou données source). |
| **Tolérance paramétrée** | Écart maximal numérique (ex. arrondi monétaire) — valeur et justification dans le référentiel. |
| **Écart autorisé si règle documentée** | Ex. reclassement, retraitement consolidation — **référence** à la règle métier ou à la note d’écart. |

La recette doit **citer** le mode applicable par restitution et par environnement (lab / prod).

---

## 3. Logique période / date d’arrêté par restitution

| Restitution | Logique temporelle | Précision implémentation |
|-------------|--------------------|----------------------------|
| **Bilan** (`balance_sheet`) | Lecture **à date d’arrêté** | Snapshot patrimonial à la date comptable choisie (fin d’exercice, fin de mois, etc.). |
| **Compte de résultat** (`income_statement`) | Lecture **sur période** | Agrégation des mouvements entre date de début et date de fin (incluses selon règles du dossier). |
| **Balances clients / fournisseurs** (`ar_aging`, `ap_aging`) | Lecture **à date** | Encours et tranches d’ancienneté **à une date d’observation** (souvent fin de période sélectionnée). |
| **Balance générale** (`trial_balance`) | Lecture **sur période avec solde d’ouverture** | Colonnes : ouverture, débit période, crédit période, solde clôture (ou équivalent paramétré). |
| **Grand livre** (`general_ledger`) | Lecture **sur période** | Lignes d’écritures filtrées ; **tri** : date comptable croissante, puis identifiant d’écriture (ou clé stable) pour ordre déterministe. |

---

## 4. Conventions de signe (référence Lynki)

| Restitution | Convention |
|-------------|------------|
| **Bilan / structure financière** | Affichage en **valeurs positives métier** par rubrique (actif, passif, capitaux propres selon présentation retenue) ; le **sens économique** prime sur le signe brut compte. |
| **Compte de résultat** | **Produits** et **charges** en **positif** en affichage métier ; le **résultat** est obtenu par **somme algébrique** (produits − charges selon rubriques), documentée dans la fiche. |
| **Balance générale** | Conserver **débit / crédit natifs** ; **solde** : par défaut **solde = somme des débits cumulés − somme des crédits cumulés** sur le périmètre considéré (ou définition équivalente des colonnes « mouvement » / « solde clôture »), **sauf convention de dossier explicitement documentée** dans le référentiel. |
| **Grand livre** | Conserver le **natif comptable** (débit / crédit tels qu’en source). |
| **Balances tiers** | Montants d’**encours** affichés en **positifs** (montant dû / à payer) ; le sens « créance / dette » est porté par le contexte (client vs fournisseur), pas par un signe ambigu sans légende. |

Toute dérogation client doit être **explicitement documentée** dans le référentiel §6.5 CDC et dans la **version de mapping** (voir fiches).

---

## 5. Modèle de fiche (champs obligatoires avant recette)

Pour chaque restitution, les champs suivants doivent être **validés métier et technique** :

- **Identifiant canonique** — clé stable API / front / tests (cf. §1).
- **Libellé utilisateur** — tel qu’affiché dans Lynki.
- **Type** — synthèse / auxiliaire / pivot / preuve.
- **Référence métier** — nom usuel comptable.
- **Source de vérité** — référentiel faisant foi pour le dossier (cf. §2.1–2.2).
- **Source de calcul** — objets et règles techniques exploités (connecteur, agrégation).
- **Période / date d’arrêté** — cf. §3.
- **Périmètre** — société, établissement, consolidation.
- **Devise de restitution** — cf. §2.4 (source, société, présentation, conversion).
- **Mapping / rubriques** — renvoi au **[référentiel comptable de restitution](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md)** (CDC §6.5).
- **Conventions de signe** — cf. §4 et précisions par fiche.
- **Drill-down autorisé** — chaîne vers les autres vues (droits appliqués).
- **Réconciliation attendue** — avec quelles restitutions.
- **Tolérance de réconciliation** — cf. §2.5 (zéro strict / paramétrée / écart documenté).
- **Cas limites** — multi-devises, extournes, à-nouveaux, tiers partiellement lettrés, **brouillons exclus** (§2.2).
- **Droits** — profils CDC F6 autorisés en lecture / export.
- **Version de référentiel** — identifiant et version du **mapping comptable** (ex. `lynki.mapping.accounting@1.2.0` ou hash du référentiel client).
- **Statut documentaire** — brouillon / validé / gelé.

---

## 6. Fiche 1 — Structure financière / Bilan

| Champ | Valeur |
|--------|--------|
| **Identifiant canonique** | `lynki.accounting.balance_sheet` |
| **Libellé utilisateur** | Structure financière (Bilan) |
| **Type** | Synthèse patrimoniale |
| **Référence métier** | Bilan |
| **Source de vérité** | Comptabilité générale du dossier, **écritures postées / validées selon le système source** (§2.1), **hors brouillons** (§2.2). |
| **Source de calcul** | Écritures retenues après normalisation statut, agrégées par **classes / groupes** selon mapping Lynki → rubriques bilan. |
| **Période / date d’arrêté** | **À date d’arrêté** (§3). |
| **Périmètre** | Société, établissement(s), option consolidation si applicable. |
| **Devise de restitution** | §2.4 — à renseigner par déploiement. |
| **Mapping / rubriques** | Référentiel §6.5 — actifs circulants, trésorerie, créances, stocks, dettes d’exploitation, dettes financières, capitaux propres, etc. |
| **Conventions de signe** | §4 — **valeurs positives métier** par rubrique. |
| **Drill-down** | Rubrique → compte(s) → **balance générale** → **grand livre**. |
| **Réconciliation attendue** | Somme des comptes inclus = montants rubrique ; alignement avec **trial balance** à la même date. |
| **Tolérance de réconciliation** | §2.5 — en général **zéro strict** ; écart seulement si **documenté** (reclassement, consolidation). |
| **Cas limites** | Clôture, consolidation, multi-devises, comptes de régularisation. |
| **Droits** | **Controller / RAF / DAF** : lecture complète ; **Manager** : synthèse selon périmètre ; **Admin** : config ; **Consultant** : selon mandat. |
| **Version de référentiel** | À renseigner (mapping + date de validité). |
| **Statut** | 📝 Brouillon |

---

## 7. Fiche 2 — Performance comptable / Compte de résultat

| Champ | Valeur |
|--------|--------|
| **Identifiant canonique** | `lynki.accounting.income_statement` |
| **Libellé utilisateur** | Performance comptable (Compte de résultat) |
| **Type** | Synthèse de période |
| **Référence métier** | Compte de résultat |
| **Source de vérité** | Comptabilité générale, **écritures postées / validées selon le système source** (§2.1), **hors brouillons** (§2.2). |
| **Source de calcul** | Mouvements produits/charges sur **[date début ; date fin]** selon mapping rubriques CdR. |
| **Période / date d’arrêté** | **Sur période** (§3). |
| **Périmètre** | Idem fiche 1. |
| **Devise de restitution** | §2.4. |
| **Mapping / rubriques** | §6.5 — CA, charges, marges / SIG, résultats. |
| **Conventions de signe** | §4 — produits/charges en **positif** métier ; résultat = agrégation **explicite**. |
| **Drill-down** | Rubrique → compte(s) → **balance générale** (mouvements période) → **grand livre**. |
| **Réconciliation attendue** | Cohérence avec sommes des comptes par nature ; lien **résultat ↔ bilan** si méthode du dossier l’impose. |
| **Tolérance de réconciliation** | §2.5 — zéro strict ou écart **documenté**. |
| **Cas limites** | Extraordinaire, reclassements, cut-off. |
| **Droits** | Idem fiche 1. |
| **Version de référentiel** | À renseigner. |
| **Statut** | 📝 Brouillon |

---

## 8. Fiche 3 — Balance âgée clients

| Champ | Valeur |
|--------|--------|
| **Identifiant canonique** | `lynki.accounting.ar_aging` |
| **Libellé utilisateur** | Balance âgée clients |
| **Type** | Auxiliaire tiers |
| **Référence métier** | Balance âgée clients |
| **Source de vérité** | **Postes tiers clients ouverts** faisant foi (auxiliaire + lettrage), **hors écritures brouillon** (§2.2). |
| **Source de calcul** | Soldes / lignes auxiliaires + règles d’**ancienneté** (CDC §6.5). |
| **Période / date d’arrêté** | **À date** d’observation (§3). |
| **Périmètre** | Société, secteur client. |
| **Devise de restitution** | §2.4 — attention aux créances multi-devises. |
| **Mapping / rubriques** | Tranches d’âge, non échu / échu, top débiteurs. |
| **Conventions de signe** | §4 — encours en **positif**. |
| **Drill-down** | **Partenaire → poste ouvert / échéance → écritures associées → grand livre filtré**. |
| **Réconciliation attendue** | Total encours **aligné** avec créances bilan si même périmètre ; écarts lettrage / provisions **documentés**. |
| **Tolérance de réconciliation** | §2.5 — souvent zéro strict sur total ; sous-totaux avec **tolérance d’arrondi** si multi-devises. |
| **Cas limites** | Contentieux, avoirs, douteux, multi-devises. |
| **Droits** | Idem fiche 1 ; masquage partenaire selon politique. |
| **Version de référentiel** | À renseigner (règles d’âge + mapping tiers). |
| **Statut** | 📝 Brouillon |

---

## 9. Fiche 4 — Balance âgée fournisseurs

| Champ | Valeur |
|--------|--------|
| **Identifiant canonique** | `lynki.accounting.ap_aging` |
| **Libellé utilisateur** | Balance âgée fournisseurs |
| **Type** | Auxiliaire tiers |
| **Référence métier** | Balance âgée fournisseurs |
| **Source de vérité** | **Postes tiers fournisseurs ouverts**, **hors brouillons** (§2.2). |
| **Source de calcul** | Idem fiche 3 (nature fournisseur). |
| **Période / date d’arrêté** | **À date** (§3). |
| **Périmètre** | Société. |
| **Devise de restitution** | §2.4. |
| **Mapping / rubriques** | Tranches, échéances proches, pression trésorerie. |
| **Conventions de signe** | §4 — encours **positifs** « à payer ». |
| **Drill-down** | **Partenaire → poste ouvert / échéance → écritures associées → grand livre filtré**. |
| **Réconciliation attendue** | Total **aligné** dettes fournisseurs au bilan si périmètre identique. |
| **Tolérance de réconciliation** | §2.5. |
| **Cas limites** | Acomptes, avoirs, litiges. |
| **Droits** | Idem fiche 3. |
| **Version de référentiel** | À renseigner. |
| **Statut** | 📝 Brouillon |

---

## 10. Fiche 5 — Balance générale

| Champ | Valeur |
|--------|--------|
| **Identifiant canonique** | `lynki.accounting.trial_balance` |
| **Libellé utilisateur** | Balance générale |
| **Type** | **Pivot** |
| **Référence métier** | Balance comptable |
| **Source de vérité** | Comptabilité générale, **écritures postées / validées selon le système source** (§2.1), **hors brouillons** (§2.2). |
| **Source de calcul** | Agrégation par **compte** : solde d’ouverture, débits période, crédits période, solde clôture (ou équivalent). |
| **Période / date d’arrêté** | **Sur période avec solde d’ouverture** (§3). |
| **Périmètre** | Société, plan comptable affiché. |
| **Devise de restitution** | §2.4 — par compte ou consolidée selon règle dossier. |
| **Mapping / rubriques** | Liste des comptes ; lien bilan/CdR via mapping. |
| **Conventions de signe** | §4 — **D / C natifs** ; **solde = Σ débits − Σ crédits** (sur la définition de période / cumul retenue pour chaque colonne), **sauf convention de dossier documentée**. |
| **Drill-down** | Compte → **grand livre** filtré (compte + période). |
| **Réconciliation attendue** | Pour chaque compte : solde cohérent avec Σ lignes **grand livre** ; équilibre débit/crédit si règle du dossier ; agrégats **réconciliables** avec bilan/CdR. |
| **Tolérance de réconciliation** | §2.5 — arrondis monétaires paramétrables ; sinon zéro strict. |
| **Cas limites** | Subdivisions de comptes, comptes de passage, multi-devises. |
| **Droits** | Idem fiche 1. |
| **Version de référentiel** | À renseigner. |
| **Statut** | 📝 Brouillon |

---

## 11. Fiche 6 — Grand livre

| Champ | Valeur |
|--------|--------|
| **Identifiant canonique** | `lynki.accounting.general_ledger` |
| **Libellé utilisateur** | Grand livre comptable |
| **Type** | **Preuve** |
| **Référence métier** | Grand livre |
| **Source de vérité** | **Écritures postées / validées selon le système source** (§2.1) ; **brouillons exclus** sauf env. simulation (§2.2). |
| **Source de calcul** | Lignes d’écriture (compte, date, journal, pièce, montants, tiers, lettrage…). |
| **Période / date d’arrêté** | **Sur période** ; tri : **date comptable**, puis **identifiant d’écriture** stable (§3). |
| **Périmètre** | Société, journaux inclus/exclus. |
| **Devise de restitution** | §2.4 — souvent devise de la ligne. |
| **Mapping / rubriques** | Filtres compte, tiers, journal. |
| **Conventions de signe** | §4 — **natif comptable** sur chaque ligne. |
| **Drill-down** | Lien vers **pièce / document** selon connecteur. |
| **Réconciliation attendue** | Σ lignes par compte = soldes **trial balance** ; explique agrégats **synthétiques**. |
| **Tolérance de réconciliation** | §2.5 — aligné arrondis avec balance générale. |
| **Cas limites** | Extournes, verrouillage de période, écritures d’ajustement. |
| **Droits** | **Controller / RAF / DAF** prioritaire ; **Consultant** sur mandat. |
| **Version de référentiel** | Mapping + règles d’inclusion d’écritures. |
| **Statut** | 📝 Brouillon |

---

## 12. Prochaines étapes

1. Valider les **identifiants** avec l’équipe API (routes, OpenAPI, statuts canoniques §2.1).
2. Renseigner **version de référentiel** et **devises** par environnement.
3. Jeux de **tests de réconciliation** avec **tolérances** explicites (§2.5).
4. **Référentiel comptable de restitution** : [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) (v1.0) — à **valider métier** par dossier / tenant et enrichir (mappings, recette §17).
5. Lier au **dictionnaire KPIs** (§4.1.2 CDC) sans doublon.

---

*Document vivant — versionner avec le CDC et le référentiel comptable §6.5.*
