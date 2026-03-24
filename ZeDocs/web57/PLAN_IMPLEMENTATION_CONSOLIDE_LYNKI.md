# Plan d’implémentation consolidé — Lynki

**Fichier canonique :** `PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md`  
**Mission :** transformer le socle documentaire (CDC, specs UX/comptables, alignement) en **ordre d’exécution**, **lots**, **dépendances**, **Definition of Done (DoD)** et **priorités** — pont entre intention produit et chantiers de développement.

**Version :** 1.1.1 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** gel documentaire — référence d’exécution Phase 2 ; évolutions = bump de version + révision en tête.  
**Révision 1.1.1 :** §7 — **ordre du tableau** aligné sur les **dépendances réelles** (**4A avant 2**) + intitulé explicite (*chevauchements possibles*) ; nom canonique figé **[DICO_INDICATEURS_KPI_LYNKI.md](DICO_INDICATEURS_KPI_LYNKI.md)** (plus d’« équivalent »).  
**Révision 1.1 :** spec Synthèse — **version chiffrée = en-tête du fichier** ; **entrées / sorties** par lot ; **Lots 4A / 4B** ; **§11 gating** (Gates A–D).  
**Révision 1.0 :** plan consolidé initial (lots 0–6, DoD, dépendances).

**Documents liés (même dossier `ZeDocs/web57`) :**

| Rôle | Document |
|------|----------|
| Pont CDC ↔ code | [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) |
| Vision produit | [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) **v2.2** |
| Restitutions (fiches) | [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md) |
| Mapping PCG / référentiel | [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** |
| Navigation | [SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md) |
| Wireframes BF | [WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md) |
| Écran Synthèse | [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) — **version courante : voir en-tête du fichier** |
| Existant UI | [INVENTAIRE_UX_EXISTANT_LYNKI.md](INVENTAIRE_UX_EXISTANT_LYNKI.md) |
| Avis CDC | [AVIS_EXPERT_CDC_MASTER_LYNKI.md](AVIS_EXPERT_CDC_MASTER_LYNKI.md) |
| Dictionnaire KPI cockpit | [DICO_INDICATEURS_KPI_LYNKI.md](DICO_INDICATEURS_KPI_LYNKI.md) |
| Backlog Phase 2 | [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.1** |
| Sprint 01 (exécutable) | [PLAN_SPRINT_01_LYNKI.md](PLAN_SPRINT_01_LYNKI.md) |
| Sprint 02 | [PLAN_SPRINT_02_LYNKI.md](PLAN_SPRINT_02_LYNKI.md) — rapport [RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md) |
| Sprint 03 | [PLAN_SPRINT_03_LYNKI.md](PLAN_SPRINT_03_LYNKI.md) |

**Périmètre technique de référence :** `units/dorevia-linky`, `units/diva`, `sources/vault`, connecteurs / tenants.

---

## 1. Objet du plan

Ce plan **ne remplace pas** le CDC ni les specs ; il **ordonne** le travail pour éviter :

* une UX **Pilotage / Synthèse** déconnectée du Vault ;
* des restitutions comptables **sans** identifiants canoniques ni traçabilité de référentiel ;
* des tickets **dispersés** sans critères de fin de lot.

**Public :** produit, lead technique, recette — pour découper les sprints et les critères de livraison.

---

## 2. Référentiels source

* **Produit / contrat fonctionnel :** [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) (§4.1.1 restitutions, §6 gouvernance, §6.5 référentiel).
* **Alignement état des lieux :** [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) — matrice **déjà / partiel / à faire**.
* **Comptable structurant :** dictionnaire des restitutions + référentiel **v1.1** (en-tête du fichier).
* **UX :** NOTE design, inventaire, SPEC navigation, wireframes BF, spec écran Synthèse — **version chiffrée toujours lue dans l’en-tête** de [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) (ce plan ne fige pas un numéro en dur pour éviter tout décalage).
* **KPI (à produire) :** **[DICO_INDICATEURS_KPI_LYNKI.md](DICO_INDICATEURS_KPI_LYNKI.md)** — livrable distinct du dictionnaire des **restitutions** comptables (fichier canonique : ce nom, sans variante).

---

## 3. Principes non négociables

### 3.1 Doctrine Vault

Toute surface **Synthèse comptable** livrée doit reposer, pour l’**affichage de référence** et la **preuve**, sur des **données servies via le Vault** (cf. [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) §1 et [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) §2.1).  
Les sources **amont** restent les systèmes d’origine ; toute dérogation = **arbitrage explicite** + **trace** (gouvernance CDC §6).

### 3.2 Identifiants canoniques

* **`lynki.accounting.*`** — six restitutions comptables structurantes (alignement [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md)).
* **`lynki.rubric.*`** — rubriques bilan / compte de résultat selon [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md).

### 3.3 Chaîne de preuve

Ordre cible : synthèse → rubrique → compte → **balance générale** → **grand livre** — cohérent CDC §4.1.1 et spec Synthèse.

### 3.4 Version du référentiel

Exposer ou journaliser l’**identifiant de version** du mapping / référentiel sur les restitutions et exports pertinents (cf. référentiel — sections *Preuve de version du référentiel* et *Exigence produit — exposition ou journalisation de la version*).

---

## 4. État de départ (rappel)

Synthèse issue de [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) :

* **Déjà solide :** cockpit **12 KPIs**, bloc **insights** Diva, filtres période / périmètre de base, multi-tenant, performance UX, doc comptable + UX **à jour**.
* **Partiel / manquant :** navigation unifiée **Pilotage / Synthèse** (`appView`, `?view=`), **écran Synthèse** dédié, convergence **complète** sous `lynki.accounting.*` / `lynki.rubric.*`, **version référentiel** généralisée sur API/exports, **dictionnaire KPI** formalisé, **rôles** explicites, **exports**, **rejouabilité** (Phase 4 ; préparation possible en amont).

---

## 5. Lots d’implémentation

Chaque lot précise des **entrées** (prérequis pour démarrer) et des **sorties** (livrabilité pour backlog / recette). Les numéros de version des specs **non figés dans ce plan** : **voir en-tête du fichier** concerné.

### Lot 0 — Gel documentaire et cohérence des versions

**But :** éviter les dérives de référence (version de spec, de référentiel, de fichiers renommés).

* **Entrées :** jeux de docs `ZeDocs/web57` existants ; [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) ; [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) ; [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) (en-tête + mentions **v0.6** *dans* le corps = roadmap interne à la spec, pas une version parallèle « fantôme »).
* **Sorties :** en-têtes et **renvois croisés** cohérents ; **aucune** ambiguïté « v0.5+ » ; référentiel comptable cité avec version **depuis son en-tête** ; cette **v1.1** du plan validée comme base d’exécution.

---

### Lot 1 — Navigation Pilotage / Synthèse

**But :** une seule navigation produit conforme à [SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md).

* **Entrées :** [SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md) ; [WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md) ; [INVENTAIRE_UX_EXISTANT_LYNKI.md](INVENTAIRE_UX_EXISTANT_LYNKI.md) ; **Lot 0** réalisé ou arbitré « assez bon ».
* **Sorties :** `appView`, `kpiMode`, URL `?view=pilotage|synthese`, **fallbacks**, **historique navigateur**, **chrome / header de bascule** alignés wireframes ; **non-régression** du cockpit **Pilotage** (grille KPIs + insights).

**Hors périmètre :** contenu métier détaillé de la Synthèse (Lot 2+).

---

### Lot 2 — Écran Synthèse comptable (structure — spec à jour)

**But :** surface **Synthèse** avec blocs, états (chargement / vide / erreur / partiel), ordre de lecture — conforme à la **version courante** de [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) (**en-tête du fichier**).

* **Entrées :** **Lot 1** ; spec Synthèse (en-tête + sections applicables) ; Vault et routes d’agrégation **alignés doctrine §3.1** ; **Lot 4A** amorcé ou **stubs** contrats convenus (sinon risque de refonte).
* **Sorties :** composition d’écran (ex. `AccountingSummaryView`), données **via Vault** pour référence/preuve, respect **§2.1** / **§11** de la spec (selon version en-tête).

**Itérations ultérieures de la spec** (ex. **v0.6** — colonnes BG/GL détaillées, insights, fraîcheur par bloc) : **après** premier incrément **stable** de la structure décrite au **moment** du sprint (cf. corps de la spec, pas ce plan).

---

### Lot 3 — Balance générale / Grand livre / drill-down

**But :** matérialiser la **charnière BG** et le parcours vers le **GL** dans l’UI, en cohérence avec la chaîne de preuve.

* **Entrées :** **Lot 2** (cadre écran) ; **Lot 4A** (payloads / identifiants stables) ; **Lot 4B** au minimum pour **version** / périmètre là où le drill l’exige.
* **Sorties :** parcours utilisateur BG → GL **opérationnel** ; pas de contournement Vault pour l’affichage de référence.

---

### Lot 4A — Contrats API et identifiants canoniques

**But :** contrats d’échange **stables** et **nommage canonique** avant / en parallèle des écrans.

* **Entrées :** [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md) ; [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) ; **Lot 0** ; accès code/API Vault.
* **Sorties :** payloads cohérents ; préfixes **`lynki.accounting.*`** et **`lynki.rubric.*`** appliqués aux restitutions et rubriques exposées ; erreurs / contrats documentés pour consommateurs (UI, exports futurs).

---

### Lot 4B — Versioning, réconciliation, traçabilité

**But :** ce qui transforme des « données affichées » en **preuve** et **rejouabilité métier** (sans confondre avec la rejouabilité UX Phase 4).

* **Entrées :** **Lot 4A** (identifiants et formes de réponses figés) ; référentiel — sections *Preuve de version du référentiel* et *Exigence produit — exposition ou journalisation de la version*.
* **Sorties :** **version du référentiel** / mapping exposée ou journalisée où exigé ; métadonnées **période** et **périmètre** systématiques sur les restitutions concernées ; **preuves de réconciliation** (jeux bilan ↔ balance, etc.) et **journalisation** alignés [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md).

**Peut chevaucher** les Lots 2–3 ; la **DoD globale** « preuve bout-en-bout » suppose **4A + 4B** pour les périmètres concernés.

---

### Lot 5 — Dictionnaire des indicateurs (KPIs)

**But :** livrable canonique **[DICO_INDICATEURS_KPI_LYNKI.md](DICO_INDICATEURS_KPI_LYNKI.md)** — **un** endroit pour définition, formule, sources, fraîcheur, endpoints, composants UI — lié au CDC §6.3.

* **Entrées :** CDC §6.3 ; code existant (`linky-tiles`, APIs) ; ALIGNEMENT §3.
* **Sorties :** document **publié** avec au minimum une entrée par **KPI cockpit** ; liens vers endpoints et composants.

**Nature :** **documentation produit** + **référence recette** ; peut **démarrer tôt** (dès Lot 0) mais doit être **suffisamment avancé** avant validation recette MVP élargie (cf. [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) §3).

---

### Lot 6 — Rôles / habilitations et exports

**But :**  
* **Rôles :** protection `/admin/*`, profils minimum (ex. Admin, Controller, Manager), lien avec config tenant — cf. CDC et ALIGNEMENT §F6.  
* **Exports :** PDF synthèse / CSV (ou équivalent) — cf. CDC F7 et priorités ALIGNEMENT.

* **Entrées :** modèle d’auth / infra existant ; **Lot 4B** pour métadonnées sur exports comptables si applicables ; périmètre export validé produit.
* **Sorties :** admin **non accessible** sans habilitation ; **export minimal** utilisable en recette (critères détaillés par ticket).

**Peut être découpé** en sous-lots (rôles d’abord, exports ensuite) selon risque métier.

---

## 6. Dépendances (schéma)

```
Lot 0 (gel doc)
    │
    ├──────────────────┬──────────────────────┐
    ▼                  ▼                      ▼
Lot 1 (navigation)   Lot 5 (dico KPI)      Lot 4A (contrats + ids)
    │                  │                      │
    ▼                  │                      ▼
Lot 2 (écran Synthèse)                      Lot 4B (version + reco + trace)
    │                  │                      │
    └────────┬─────────┴──────────┬─────────┘
             ▼                    ▼
         Lot 3 (BG/GL/drill)   (itérations 4B si besoin)
             │
             ▼
         Lot 6 (rôles + exports)

Préparation rejouabilité : transversal — modèle de données, clés période/périmètre (sans UX Phase 4) ; à caler avec **4B** et roadmap §10.
```

**Règle d’or :** ne pas **coder la Synthèse « au fil de l’eau »** sans Lot **1** (où aller) et **principes §3** (d’où viennent les données). **4A** avant de figer trop tôt l’UI ; **4B** pour la **preuve** et les **gates** C–D (§11).

---

## 7. Priorisation (vue exécution)

**Ordre principal** (avec **chevauchements possibles** — le **Lot 4A** est volontairement **avant** le **Lot 2** dans ce tableau, car l’écran Synthèse suppose des **contrats / identifiants** amorcés ou des **stubs** convenus ; cf. entrées du Lot 2, §5) :

| Rang | Lot | Intitulé court |
|------|-----|----------------|
| 0 | Lot 0 | Gel documentaire / versions |
| 1 | Lot 1 | Navigation `appView` / `?view=` |
| 2 | Lot 4A | Contrats API + identifiants canoniques *(démarrage en **parallèle** du Lot 1 dès Lot 0 passé — équipe données / back)* |
| 3 | Lot 2 | Écran Synthèse *(spec : en-tête)* |
| 4 | Lot 4B | Versioning + réconciliation + traçabilité *(souvent après / avec 4A)* |
| 5 | Lot 3 | BG / GL / drill-down |
| 6 | Lot 5 | **[DICO_INDICATEURS_KPI_LYNKI.md](DICO_INDICATEURS_KPI_LYNKI.md)** *(amorçage dès t0, consolidation continue)* |
| 7 | Lot 6 | Rôles + exports |

**Lecture « sprint 1 » typique :** Lots **0 + 1 + 4A** en parallèle raisonnable, puis **amorce Lot 2** — aligné [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md).

**Note :** [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) met le **dictionnaire KPI** en tête des *recommandations produit* ; ce plan le traite comme **Lot 5** (fichier **[DICO_INDICATEURS_KPI_LYNKI.md](DICO_INDICATEURS_KPI_LYNKI.md)**) car il est **surtout documentaire** et peut avancer **en parallèle** des autres lots. Si la recette bloque sur les définitions KPI, remonter le **minimum viable** du Lot 5 **avant** la clôture d’une release (voir **Gate D**, §11).

---

## 8. Definition of Done par lot

| Lot | DoD (minimum) |
|-----|----------------|
| **0** | En-têtes et renvois croisés cohérents ; spec Synthèse : **version = en-tête** ; pas d’ambiguïté « + » sur un numéro ; référentiel cité **v1.1** depuis son en-tête. |
| **1** | Bascule Pilotage ↔ Synthèse conforme SPEC UX + wireframes ; URL et historique OK ; régression cockpit Pilotage acceptable. |
| **2** | Écran Synthèse lisible avec blocs **selon spec** (version **en-tête**) ; données **via Vault** pour référence/preuve ; états §11 gérés (selon spec). |
| **3** | Parcours vers BG/GL opérationnel côté UX ; pas de contournement Vault pour l’affichage de référence. |
| **4A** | Contrats API / payloads portent **`lynki.accounting.*`** / **`lynki.rubric.*`** là où prévu ; consommateurs identifiés ; pas de naming ad hoc. |
| **4B** | **Version** référentiel exposée ou journalisée où exigé ; **période / périmètre** ; réconciliation et traces **recette** possibles (aligné référentiel). |
| **5** | Chaque KPI cockpit a une entrée (définition, source, endpoint, UI) ; lien explicite CDC §6.3. |
| **6** | Admin non accessible sans habilitation ; export minimal utilisable en recette (critères à fixer par ticket). |

---

## 9. Risques et points de vigilance

| Risque | Mitigation |
|--------|------------|
| UX et Vault divergent | Rappel §3.1 à chaque revue de maquette ; spec Synthèse §2.1 |
| Identifiants `lynki.*` dispersés dans le code | Revue d’architecture ; **Lot 4A** comme barrière nominale |
| Version référentiel oubliée en prod | DoD **4B** ; tests recette sur rejouabilité **métier** des exports |
| Scope creep sur la spec Synthèse (ex. itération **v0.6** dans le corps de la spec) | Livrer **structure stable** (Lot 2) avant d’étendre (colonnes BG/GL, insights — **cf. spec, en-tête**) |
| Dictionnaire KPI en retard | Lot 5 amorcé tôt ; critères « minimum par KPI » pour MVP |

---

## 10. Roadmap courte — Phase 2

* **Court terme :** Lots **0 → 1** en parallèle de **4A** (contrats + ids), puis **2** ; **4B** amorcé dès que les payloads sont stables.
* **Moyen terme :** **4B** complet sur le périmètre cible, Lot **3** (profondeur preuve), consolidation Lot **5**, puis Lot **6**.
* **Préparation rejouabilité (sans UX Phase 4) :** clés période/périmètre, traçabilité version, modèle prêt pour « lecture à date » — en lien Vault/Diva selon [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) Phase 4.
* **Hors plan immédiat (CDC) :** alertes configurables fines, filtres jour/semaine/plage, rejouabilité utilisateur complète — à replanifier après stabilisation Synthèse + KPI.

---

## 11. Gating de release (jalons produit / recette)

Jalons **lisibles** pour une release Phase 2 (à déclarer explicitement en recette ou go-live) :

| Gate | Condition (réf. lots / DoD) |
|------|-----------------------------|
| **Gate A** | **Lot 1** validé : navigation Pilotage / Synthèse **stable** (bascule, URL, historique, non-régression Pilotage). |
| **Gate B** | **Lot 2** validé : écran Synthèse **exploitable** (blocs, états, données Vault — spec **en-tête**). |
| **Gate C** | **Lot 3** + **4B** validés sur le périmètre cible : BG / GL / drill + **preuve** + **version référentiel** (et réconciliation où exigé). |
| **Gate D** | **Lot 5** (recette KPI minimum) + **Lot 6** (rôles minimum + **export** minimal) — critères détaillés par ticket. |

**Usage :** ne pas confondre **Gate B** (écran utilisable) et **Gate C** (preuve comptable bout-en-bout). **Gate D** peut être une release **ultérieure** si la Phase 2 est découpée en deux vagues.

---

*Document pont : à mettre à jour lors du gel du **`DICO_INDICATEURS_KPI_LYNKI.md`** et à chaque **bump** majeur de l’**en-tête** de [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) ou de [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md).*

**Suite logique d’exécution :** **[BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md)** (backlog actionnable Phase 2), puis plans **Sprint 01–03** (`PLAN_SPRINT_*_LYNKI.md`) selon le sprint courant.
