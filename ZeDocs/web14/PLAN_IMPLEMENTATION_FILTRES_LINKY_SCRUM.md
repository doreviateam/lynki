# Plan d’implémentation — Filtres Linky (Scrum-like)

**Réf. spec** : FILTRE_LINKY.md v1.0  
**Périmètre** : v1 (Tenant affiché, Période sélectionnable, Filtre Company sélecteur « Tout » par défaut)  
**Objectif** : Livrer l’en-tête de contexte, le filtre Période et le filtre Company (spec SPEC_VAULT_LINKY_COMPANY v1.1) applicables à toutes les cartes.

**Dernière mise à jour** : 2026-02-08 — Alignement doc/code : filtre Période = Mois/Trimestre/Semaine + Année (défaut mois en cours), Company display_name, Vault cmd/vault/main.go.

---

## 1. Vue d’ensemble

| Epic | Résumé | Priorité |
|------|--------|----------|
| **E1** | En-tête de contexte (Tenant + zone filtres) | P0 |
| **E2** | Filtre Période (Mois/Trimestre/Semaine + Année, état global, application aux cartes) | P0 |
| **E3** | Filtre Company (sélecteur « Tout » par défaut, spec Vault v1.1) | P1 |

**Ordre recommandé** : E1 → E2 → E3. E3 (Company) s’appuie sur la spec ZeDocs/web14/SPEC_VAULT_LINKY_COMPANY_v1.0.md (v1.1) : évolution Vault puis Linky.

---

## 2. Epic 1 — En-tête de contexte (Tenant + zone filtres)

**Valeur** : Le contexte (tenant, période, company) est visible avant toute carte.

### US-1.1 — Affichage du Tenant en en-tête

**En tant que** utilisateur Linky,  
**je veux** voir le tenant courant (organisation) en haut du rapport,  
**afin que** je sache immédiatement sur quel périmètre portent les chiffres.

**Critères d’acceptation**
- [x] Le tenant est affiché en en-tête du dashboard, avant les cartes.
- [x] La valeur affichée provient de `TENANT_ID` (env) ; pas de sélecteur en v1.
- [x] Affichage lisible (ex. identifiant `sarl-la-platine` ou libellé si mapping fourni).

**Tâches techniques**
- Créer un composant ou une zone « En-tête de rapport » (ex. `ReportHeader` ou intégration dans le layout existant).
- Lire `TENANT_ID` côté serveur (déjà disponible) et l’afficher (et le passer au client si besoin pour cohérence).
- Aucune modification des API existantes.

**Estimation** : 1 point (petit)

---

### US-1.2 — Zone dédiée aux filtres (emplacement)

**En tant que** utilisateur Linky,  
**je veux** que les filtres (période, company) soient regroupés dans une zone claire en haut,  
**afin que** le cadre de lecture soit explicite et stable.

**Critères d’acceptation**
- [x] Une zone « Filtres » ou « Contexte » est visible en en-tête, avant les cartes.
- [x] Les filtres ne sont pas dans un menu secondaire ou un tiroir caché.
- [x] La zone peut accueillir Période (et Company plus tard) sans refonte.

**Tâches techniques**
- Définir la structure HTML/JSX de l’en-tête : bloc Tenant + bloc Filtres (période, company).
- Styles (Tailwind ou existants) pour lisibilité et cohérence avec les cartes.

**Estimation** : 1 point (petit)

---

## 3. Epic 2 — Filtre Période

**Valeur** : L’utilisateur peut restreindre la lecture à une période (mois, trimestre ou semaine + année) ; toutes les cartes utilisent la même période.

### US-2.1 — Période unique et affichée

**En tant que** utilisateur Linky,  
**je veux** voir la période effective utilisée pour tous les indicateurs,  
**afin que** je sache sur quelle fenêtre temporelle portent les chiffres.

**Critères d’acceptation**
- [x] La période est choisie en en-tête via deux listes déroulantes (Mois/Trimestre/Semaine + Année) ; le libellé explicite est affiché dans les cartes (ex. « 01/01/2026 – 31/12/2026 » ou « Toutes périodes »).
- [x] La même période s’applique à toutes les cartes (Ventes, Achats) ; aucune carte n’a de période propre.
- [x] Valeur par défaut : **Mois en cours / Année en cours** (1er–dernier jour du mois civil).

**Tâches techniques**
- Introduire un état global « période » (ex. React context ou state remonté dans le layout/page).
- Calculer les bornes `date_debut` / `date_fin` à partir de la période (défaut = mois en cours / année en cours).
- Passer `date_debut` et `date_fin` à tous les appels `/api/sales` et `/api/purchases` (et aux fetches initiaux serveur).
- Afficher la période dans la zone Filtres via deux selects (Mois ou Trimestre ou Semaine + Année).

**Estimation** : 2 points

---

### US-2.2 — Sélection de la période (Mois/Trimestre/Semaine + Année)

**En tant que** utilisateur Linky,  
**je veux** choisir une période via Mois, Trimestre ou Semaine et une Année,  
**afin que** je puisse restreindre la lecture au mois, trimestre ou semaine de mon choix.

**Critères d’acceptation**
- [x] Deux champs : (1) Mois (Janvier–Décembre), Trimestre (T1–T4) ou Semaine ISO (S1–S53), (2) Année (année courante + 5 passées).
- [x] Pas de preset « Toutes périodes » ni de période personnalisée (date pickers) en en-tête en v1.
- [x] Après sélection, la période affichée et les données des cartes se mettent à jour (même période pour Ventes et Achats).
- [x] Pas de rechargement complet de la page si possible (état client + refetch des API).

**Tâches techniques**
- Composant de sélection : deux `<select>` (Mois/Trimestre/Semaine + Année), voir `period-utils.ts` et `ReportHeader.tsx`.
- Mise à jour de l’état période global et refetch des données (sales, purchases) avec les nouvelles `date_debut` / `date_fin`.
- Les composants avec polling utilisent la période du contexte (props), pas une période en dur.

**Estimation** : 3 points

---

### US-2.3 — Format d’affichage de la période

**En tant que** utilisateur Linky,  
**je veux** que la période soit affichée dans un format lisible et sans ambiguïté,  
**afin que** je puisse la citer ou la partager (opposabilité).

**Critères d’acceptation**
- [x] « Toutes périodes » pour la plage large par défaut.
- [x] Pour une plage bornée : format explicite type « 01/01/2026 – 31/12/2026 » ou équivalent (locale FR).
- [x] Le libellé affiché reflète exactement la période utilisée pour les appels API.

**Tâches techniques**
- Helper `formatPeriodLabel(from: string, to: string): string` (ou équivalent) : si plage = défaut → « Toutes périodes », sinon « DD/MM/YYYY – DD/MM/YYYY ».
- Utiliser ce libellé dans la zone Filtres et, optionnellement, dans le sous-titre ou une infobulle.

**Estimation** : 1 point (petit)

---

## 4. Epic 3 — Filtre Company

**Réf. spec** : ZeDocs/web14/SPEC_VAULT_LINKY_COMPANY_v1.0.md (v1.1)

**Valeur** : L’utilisateur voit et peut filtrer par entité légale (company). Par défaut « Tout » = toutes les sociétés du tenant. Un tenant a toujours au moins une company.

### US-3.1 — Filtre Company (sélecteur, défaut « Tout »)

**En tant que** utilisateur Linky,  
**je veux** voir et sélectionner la société (company) concernée par les données, avec « Tout » par défaut,  
**afin que** le contexte juridique soit explicite et que je puisse restreindre la lecture à une company.

**Critères d’acceptation**
- [x] Le filtre Company est affiché en en-tête à côté de Tenant et Période.
- [x] Valeur par défaut : **« Tout »** (toutes les sociétés du tenant) ; aucun `company_id` envoyé aux API.
- [x] **Company sélectionnée = invariant de session UI** : la valeur (Tout ou une company) reste effective pour toute la session jusqu’à changement explicite ; tous les appels (sales, purchases, polling) utilisent la même company.
- [x] Sélecteur alimenté par **GET /ui/companies?tenant=...** (company_id + documents_count). Option « Tout » + une entrée par company.
- [x] **Timeout fallback GET /ui/companies** : appel avec timeout (ex. 5 s) ; en cas de timeout ou erreur : fallback « Company : Non applicable » ou sélecteur réduit à « Tout » uniquement, sans bloquer le dashboard.
- [x] Si l’utilisateur choisit une company : passage de `company_id` aux appels /api/sales et /api/purchases ; cartes filtrées sur cette company.
- [x] En cas d’indisponibilité de l’endpoint companies : affichage « Company : Non applicable » ou masquage temporaire.
- [x] Aucune carte n’a de filtre company propre ; toutes héritent du contexte global (tenant + company + période).
- [ ] Si filtre company actif et présence de documents legacy (sans company_id) : message non bloquant « Certaines pièces historiques ne sont pas encore associées à une société et sont exclues du périmètre. »
- [x] Affichage : `display_name` si fourni (ex. via env COMPANY_DISPLAY_NAMES), sinon `company_id` (format normatif `<source_system>:<source_company_id>`).

**Tâches techniques (ordre spec + annexe normative v1.2)**
- **Vault** : migration `company_id` (TEXT, nullable), format normatif ; ingest **exige** `company_id` pour tout nouvel event (annexe v1.2, invariant #4) ; agrégations acceptent paramètre `company_id` ; GET /ui/companies (contrat minimal, liste triée par `company_id`).
- **Odoo / DVIG** : envoi **obligatoire** de `company_id` au format normatif pour chaque event ; clé d’idempotence incluant tenant + source_system + source_document_id + company_id (annexe v1.2).
- **Linky** : composant filtre Company (sélecteur « Tout » par défaut) ; **invariant de session** : company sélectionnée conservée jusqu’à changement explicite ; appel GET /ui/companies avec **timeout** (ex. 5 s) et fallback (Non applicable / « Tout » seul) en cas de timeout ou erreur ; passage de `company_id` aux routes /api/sales et /api/purchases (proxy vers Vault) ; message UI legacy si besoin.

**Estimation** : 3 points (Vault + connecteur + Linky)

---

## 5. Indicateur Certifié (implémenté)

**Réf. détail** : ZeDocs/web14/INDICATEUR_CERTIFIE_LINKY.md

Règles livrées :

- **Ratio Certifié** : toujours **global** (toutes périodes). Il n’est pas recalculé selon la période affichée. Ratio = (factures vaultées global) / (factures postées global).
- **« X factures concernées »** : nombre de factures vaultées **sur la période affichée** dans la carte (varie avec le filtre période).
- **Badge** : en **haut à droite** de chaque carte (Ventes, Achats). Badge visuel uniquement (icône coche verte, pas de texte dans le badge).
- **Tooltip** : au survol du badge, affichage de « Certifié : X % » (ou « Certifié : X / Y », « Données certifiées » selon les cas).

**Technique** : API `/api/sales` et `/api/purchases` appellent Odoo sans période (dénominateur global) ; si période ≠ défaut, un second appel Vault « toutes périodes » fournit `global_invoices_count` pour le % ; cartes avec `SalesCard` / `PurchasesCard` (badge + `title={certifiedLabel}`).

---

## 6. Backlog ordonné (sprints suggérés)

| Sprint | Objectif | US / tâches | État |
|--------|----------|-------------|------|
| **S1** | En-tête de contexte + Tenant visible | US-1.1, US-1.2 | Livré |
| **S2** | Période unique, affichée, appliquée aux cartes | US-2.1, US-2.3 | Livré |
| **S3** | Sélection de la période (Mois/Trimestre/Semaine + Année) | US-2.2 | Livré |
| **S4** | Filtre Company (Vault company_id + GET /ui/companies + Linky sélecteur « Tout ») | US-3.1 | Livré |

**Ordre S4** (spec Company v1.1) : 1) Vault (migration, ingest, agrégations, GET /ui/companies) ; 2) Odoo/DVIG (company_id format normatif, idempotence) ; 3) Linky (sélecteur, proxy company_id, message legacy).  
**Reste à faire côté Vault** : voir §6.1 ci-dessous et ZeDocs/web14/RESUME_FILTRE_COMPANY_LINKY_VAULT.md (US-V1, US-V2).

### 6.1 Reste à faire (post-S4, Vault)

| Id | Objectif | Priorité | État |
|----|----------|----------|------|
| **US-V1** | Exposer GET /ui/companies dans le binaire Vault (enregistrer la route dans le main Fiber) | P0 | Implémenté (cmd/vault/main.go) |
| **US-V2** | Données company_id (ingest / connecteur) pour que le sélecteur affiche des options | P1 | À faire |
| **Optionnel** | Message legacy « pièces historiques non associées » (US-3.1) | P2 | Phase 2 |
| **Optionnel** | Vérif. Odoo/DVIG : company_id + idempotence (annexe v1.2) | P2 | À valider |

Spécification détaillée (critères d’acceptation, tâches techniques, fichiers) : **ZeDocs/web14/RESUME_FILTRE_COMPANY_LINKY_VAULT.md** (§2).

---

## 7. Dépendances et risques

- **Vault** : Les API agrégations acceptent déjà `date_debut`, `date_fin`, `tenant`. Pour E3 (Company), évolution Vault décrite dans SPEC_VAULT_LINKY_COMPANY v1.1 : colonne `company_id`, paramètre `company_id` aux agrégations, GET /ui/companies.
- **Company** : Spec v1.1 figée (ZeDocs/web14/SPEC_VAULT_LINKY_COMPANY_v1.0.md) ; annexe normative v1.2 (company_id obligatoire nouveaux events, immutabilité, idempotence, tri GET /ui/companies). Implémentation dans l’ordre Vault → Odoo/DVIG → Linky.
- **URL / traçabilité** : Filtres reproductibles (ex. query params `?from=...&to=...&company_id=...`) : tâche optionnelle ou phase 2.

---

## 8. Definition of Done (indicateurs)

- [x] En-tête visible au chargement, avant les cartes.
- [x] Tenant affiché et non modifiable.
- [x] Période choisie via deux selects (Mois/Trimestre/Semaine + Année) ; défaut Mois en cours / Année en cours.
- [x] Période sélectionnable (Mois/Trimestre/Semaine + Année) ; une seule période pour tout le rapport.
- [x] Ventes et Achats utilisent la période sélectionnée (données cohérentes).
- [x] Filtre Company : sélecteur en-tête, défaut « Tout », invariant de session UI, timeout fallback GET /ui/companies ; passage de `company_id` aux agrégations ; message legacy optionnel (US-3.1).
- [x] Indicateur Certifié : badge global en haut à droite, tooltip au survol (voir §5).
- [x] Spec FILTRE_LINKY.md §4.1, §4.3, §5, §6 respectés pour le périmètre v1 (Company selon SPEC_VAULT_LINKY_COMPANY v1.1).

---

## 9. Références

- **Spec filtres** : ZeDocs/web14/FILTRE_LINKY.md  
- **Spec Company (Vault + Linky)** : ZeDocs/web14/SPEC_VAULT_LINKY_COMPANY_v1.0.md (v1.1)  
- **Annexe normative Company (contraintes obligatoires)** : ZeDocs/web14/ANNEXE_NORMATIVE_CONTRAINTES_ARCHITECTURALES_COMPANY_v1.2.md  
- **Résumé filtre Company + reste à faire** : ZeDocs/web14/RESUME_FILTRE_COMPANY_LINKY_VAULT.md  
- **Évaluation amendements Company** : ZeDocs/web14/EVALUATION_AMENDEMENTS_SPEC_COMPANY_v1.1.md  
- **Avis / amendements filtres** : ZeDocs/web14/FILTRE_LINKY_AVIS_ET_AMENDEMENTS.md  
- **Indicateur Certifié** : ZeDocs/web14/INDICATEUR_CERTIFIE_LINKY.md  
- **Linky** : `units/dorevia-linky` (page.tsx, app/lib/vault.ts, app/lib/odoo-metrics.ts, app/api/sales|purchases|companies/route.ts, components/*Card*.tsx, DashboardWithFilters, ReportHeader)
