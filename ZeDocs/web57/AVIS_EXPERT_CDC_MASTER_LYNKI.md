# Avis d’expert — CDC Master Lynki (Lynki by Dorevia)

**Document analysé :** `ZeDocs/web57/CDC_MASTER_LYNKI.md`  
**Version du CDC à l’avis :** 2.2 — mars 2026  
**Version avis :** 1.2  
**Date :** 20 mars 2026  
**Statut de l’avis :** favorable — avec recommandations mineures  
**Révisions v1.2 :** prise en compte du **socle UX / navigation** web57 (NOTE design, inventaire, **SPEC_UX_NAVIGATION**, **WIREFRAMES_BF**, **SPEC_ECRAN_SYNTHESE_COMPTABLE**) et de la **doctrine Vault vs sources amont** (restitution / preuve Lynki vs ERP en amont) — cohérent avec l’alignement CDC ↔ implémentation.  
**Révisions v1.1 :** prise en compte du **socle documentaire web57** (dictionnaire + référentiel comptable), mise à jour du tableau d’alignement plateforme, statut des recommandations v1.0 (nom Lynki, restitutions structurantes).

---

## 1. Synthèse

Le CDC Master reste **solide, cohérent et exploitable**. Il pose la vision (contrôle de gestion permanent, explicable, rejouable), le périmètre fonctionnel (12 KPIs, bloc insights, gouvernance de la donnée, **restitutions comptables structurantes** en §4.1.1) et un lotissement réaliste. La **v2.2** ancre explicitement la **chaîne de preuve** (bilan / compte de résultat / balances tiers / **balance générale** / **grand livre**) et le **référentiel §6.5**, en cohérence avec les artefacts `ZeDocs/web57`.

**Points forts majeurs :** vision métier claire, différenciation affirmée, grille KPI alignée avec l’existant, explicabilité et gouvernance, **triptyque documentaire** opérationnel : CDC ↔ **dictionnaire des restitutions comptables** ↔ **référentiel comptable de restitution** (PCG FR de base, surcharges tenant), et **cadrage UX / navigation** (Pilotage × Synthèse comptable, chaîne de preuve, doctrine **Vault** = restitution et preuve Lynki) documenté dans `ZeDocs/web57` (voir §2.6).

**Points à traiter en priorité (inchangés sur le fond) :** renvoi explicite aux spécifications comportementales de l’insight (hors périmètre strict du CDC), et **dictionnaire des indicateurs (KPIs)** comme livrable critique pour la cohérence des calculs — distinct du dictionnaire des **restitutions** comptables.

---

## 2. Ce qui fonctionne bien

### 2.1 Vision et positionnement

- **§1–2** : La distinction entre « tableau de bord » et « assistant au contrôle de gestion » est nette. Les quatre piliers (permanent, rejouable, explicable, actionnable) structurent bien le produit.
- **§2.2** : ERP agnostique, multi-source, multi-tenant, progressivité (MVP → simulation/consignation) sont en phase avec une plateforme évolutive.

### 2.2 Périmètre fonctionnel

- **§4.1** : La grille des 12 KPIs (Trésorerie, Business, Flux net, Paiements, BFR, Encours, Taxes, EBE, Notes de crédit, Remboursements, Points de vente, Z de caisse) reste **alignée avec l’implémentation actuelle** du cockpit Lynki. Le CDC sert de référence pour la recette fonctionnelle des cartes.
- **§4.1.1** : Le socle de **six restitutions comptables structurantes** (bilan, compte de résultat, balances âgées, balance générale, grand livre) est désormais **détaillé hors CDC** dans le **[DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md)** et les règles de mapping / réconciliation dans le **[REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md)** — ce qui **renforce la traçabilité** sans alourdir le CDC.
- **§4.2** : Libellé, valeur, variation, couleur sémantique, fraîcheur, détail, explication de calcul — couverture complète des besoins d’une carte KPI.
- **§4.3** : Bloc « Insights principaux » avec commentaires lisibles, variations significatives, alertes contextualisées, tonalité contrôle de gestion — en phase avec le bloc Diva actuel et le document `comportement_insight_Lynki_Diva.md` (web56).

### 2.3 Explicabilité et gouvernance

- **§4.4, §6** : Rattachement des insights à période, périmètre, KPIs, règles et sources ; gouvernance (origine, fréquence, fiabilité, date de valeur, transformations) — **indispensable** pour la crédibilité du cockpit et déjà partiellement mis en œuvre (manifeste de métriques, traçabilité des montants dans l’insight).

### 2.4 Lotissement et critères d’acceptation

- **§12** : Phasage (cadrage → MVP → V1 enrichie → évolutions structurantes) est réaliste. Le MVP centré sur « lecture fiable avant exhaustivité » évite le scope creep.
- **§14** : Critères d’acceptation fonctionnels, métier et techniques sont actionnables pour la recette.

### 2.5 Socle documentaire `ZeDocs/web57` (nouveau)

Le CDC v2.2 référence explicitement, dans le même dossier :

| Document | Rôle |
|----------|------|
| [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md) | Fiches métier des six restitutions (identifiants, rôles, réconciliation attendue). |
| [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) | Règles concrètes de mapping PCG FR → rubriques Lynki, éligibilité, signes, netting, journaux, réconciliation, recette. |
| [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) | Matrice CDC ↔ implémentation. |

**Appréciation :** ce dispositif répond à l’exigence de **référentiel §6.5** et clarifie l’ordre de priorité documentaire (arbitrage client → référentiel → dictionnaire des restitutions → CDC). C’est un **gain majeur** pour la recette comptable et l’onboarding métier.

### 2.6 Socle UX / navigation et doctrine de données (web57)

En complément du CDC et des artefacts comptables, un **jeu de documents** cadrage UX — sans remplacer le CDC — fixe la navigation (**Pilotage** / **Synthèse comptable**), les wireframes basse fidélité, la spec d’écran Synthèse, et la distinction **Vault** (source de **restitution Lynki** et de **preuve** pour l’UI) vs **systèmes amont** (sources **opérationnelles d’origine**). Références utiles pour l’alignement produit / dev :

| Document | Rôle |
|----------|------|
| [NOTE_DESIGN_MASTER_LYNKI.md](NOTE_DESIGN_MASTER_LYNKI.md) | Intention Pilotage / Synthèse comptable. |
| [INVENTAIRE_UX_EXISTANT_LYNKI.md](INVENTAIRE_UX_EXISTANT_LYNKI.md) | Constat code / header / routing / états globaux. |
| [SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md) | `appView` / `kpiMode`, URL `?view=`, fallback, historique. |
| [WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md) | Structure chrome, desktop / mobile, drill-down BG/GL. |
| [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) | Surface Synthèse : blocs, charnière BG, états, **§2.1 Vault / amont**, **§11.2** période / périmètre / version référentiel. |

**Appréciation :** la doctrine **« ce que Lynki affiche et prouve transite par le Vault »** (pas de lecture directe « à la volée » des amont pour l’affichage de référence) est **alignée** avec le rôle du Vault dans la plateforme et avec **[ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md)**. Elle doit être **maintenue** lors des arbitrages d’implémentation.

---

## 3. Points à corriger ou préciser

### 3.1 Nom du produit

**Statut (v1.1) :** le CDC v2.2 utilise **« Lynki by Dorevia »** et **« Lynki »** dans le titre et le corps — la recommandation v1.0 est **largement satisfaite**.

- **Recommandation résiduelle :** veiller à une **homogénéité** dans tous les documents satellites (runbooks, tickets, anciennes captures) qui pourraient encore porter « Linky ».

### 3.2 Référence aux spécifications comportementales de l’insight

Le bloc insight est décrit en §4.3 de façon générique. Les règles métier détaillées (stabilité narrative, priorisation des vigilances, formulation « conserve une avance », traduction des vigilances gouvernance, etc.) sont dans **`comportement_insight_Lynki_Diva.md`** (ZeDocs/web56).

- **Recommandation :** ajouter en §4.3 ou en note de bas de section une référence explicite, par exemple :  
  *« Les règles de génération, de formulation et de priorisation des vigilances sont détaillées dans le document Comportement insight Lynki / Diva (ZeDocs/web56). »*

### 3.3 Dictionnaire des indicateurs (KPIs)

Le CDC mentionne le **dictionnaire des indicateurs (KPIs)** en §6.3 et en livrables (§13). C’est **distinct** du **dictionnaire des restitutions comptables** (fiches §4.1.1).

- **Recommandation :** en §12 Phase 1, préciser que le **dictionnaire des indicateurs (KPIs)** est un préalable à la recette du MVP (Phase 2), et en §14 ajouter un critère du type : « Chaque KPI affiché est couvert par une entrée du dictionnaire validée. »

### 3.4 Rejouabilité

La rejouabilité est présentée comme structurante mais « à terme » (§4, F3, Phase 4). C’est cohérent avec un MVP centré sur la lecture actuelle.

- **Recommandation :** garder la formulation actuelle, mais en §12 Phase 2 ajouter une ligne du type : « Préparation technique pour rejouabilité (modèle de données, clés période/périmètre) sans exposition utilisateur en MVP. » pour éviter que la rejouabilité soit oubliée dans le modèle.

### 3.5 Restitutions comptables et référentiel (nouveau)

Le **[REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md)** porte en en-tête la **version documentaire 1.1** (mars 2026) — **référence à utiliser** pour toute citation de version ; elle succède à une base **v1.0** désormais intégrée dans cette version. Ce référentiel complète le CDC sur §6.5 : netting, journaux, preuve de version, tableau de recette synthétique.

- **Recommandation :** en recette, exiger **l’identifiant de version** du référentiel / mapping sur les exports et API de restitution (aligné sur le référentiel : **§3.5** *Preuve de version du référentiel (rejouabilité)* et **§18.5** *Exigence produit — exposition ou journalisation de la version*) pour garantir la **rejouabilité métier** des contrôles.

---

## 4. Cohérence avec l’existant

| Élément CDC | État actuel plateforme / documentation |
|------------|------------------------------------------|
| 12 KPIs cockpit | Implémenté (grille actuelle) |
| Bloc insights, commentaires lisibles | Implémenté (Diva + Mistral), règles dans comportement_insight_Lynki_Diva.md |
| Explicabilité (lien chiffres / sources) | Partiel : manifeste de métriques, traçabilité dans l’insight ; drill-down et « preuve » à renforcer |
| Filtres période / périmètre | Présents |
| Multi-tenant, multi-sociétés | Présent |
| Restitutions comptables structurantes (§4.1.1) | **Spécifiées** dans DICTIONNAIRE + REFERENTIEL web57 ; **surface Synthèse comptable** cadrée dans [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) ; implémentation à suivre via ALIGNEMENT_CDC_IMPLEMENTATION |
| Navigation Pilotage / Synthèse + chaîne preuve (UI) | **Documentée** (SPEC_UX, WIREFRAMES BF) ; **implémentation** `appView` / vue Synthèse **à venir** |
| Doctrine Vault = restitution + preuve Lynki | **Figée** spec écran §2.1 ; cohérente avec gouvernance §6 et alignement implémentation |
| Rejouabilité à date | Non livré (prévu Phase 4) ; référentiel impose traçabilité de **version** de mapping |
| Alertes configurables | Partiel (vigilances Diva) ; seuils configurables à préciser |
| Dictionnaire des indicateurs (KPIs) | À formaliser comme livrable unique (distinct des restitutions comptables) |

Le CDC décrit bien le produit cible ; les écarts concernent surtout la rejouabilité utilisateur (Phase 4) et le **dictionnaire des indicateurs (KPIs)** ; le volet **comptable structurant** est documenté de façon **nettement plus complète** qu’en version 1.0 de **ce** document d’avis.

---

## 5. Manques ou sujets à documenter ailleurs

- **Priorisation des vigilances** : la règle (client nominatif > qualité des données > fiscal) est dans `comportement_insight_Lynki_Diva.md` (§4.8). Le CDC pourrait en §4.3 renvoyer à ce document pour « règles de priorisation des alertes / vigilances ».
- **Normes de libellés** : la normalisation de la langue (activité commerciale vs CA, formulations CODIR, etc.) est dans la note de normalisation langue Lynki (ZeDocs/web56). Un renvoi en §4.2 ou §10.1 éviterait les écarts de libellés entre maquettes et livrables.
- **Design system (Lynki)** : le CDC évoque dark mode, contraste, hiérarchie (§10). Les choix de marque (Dorevia / Lynki, couleurs) sont implémentés ; ils pourraient être résumés dans une courte section « Identité visuelle Lynki » ou un doc dédié référencé par le CDC.
- **Référentiel comptable** : les surcharges **tenant / client** et les jeux de recette détaillés sont à **maintenir** dans le référentiel et à tracer dans l’alignement CDC ↔ implémentation.

---

## 6. Verdict

| Critère | Appréciation |
|--------|----------------|
| Complétude | Très bon — couvre contexte, fonctionnel, technique, organisation, livrables, critères d’acceptation ; **complété** par le dictionnaire + référentiel comptable pour le volet §4.1.1 / §6.5 ; **UX / navigation** et spec Synthèse dans web57 pour la surface comptable |
| Clarté | Bon — structuration en sections numérotées, tableaux utiles |
| Alignement avec l’existant | Bon — grille KPI et bloc insight alignés ; **documentation comptable structurante** et **cadrage UX** alignés avec web57 |
| Exploitabilité | Bon — utilisable pour cadrage, recette et arbitrages ; à renforcer sur **dictionnaire des indicateurs (KPIs)** et références croisées insight / langue |

**Conclusion :** Le CDC Master **v2.2** reste **validable comme référence produit** au regard de cet avis. Par rapport à la version 1.0 de **ce** document d’avis, les **évolutions majeures** sont : (1) **nom Lynki** cohérent dans le CDC, (2) **triptyque** CDC + dictionnaire des restitutions + référentiel comptable pour le socle comptable structurant, (3) **cadrage UX** (navigation, surface Synthèse, doctrine Vault) dans web57. Les ajustements encore utiles sont surtout des **renvois explicites** (insight, langue) et le **dictionnaire des indicateurs (KPIs)** comme prérequis de recette — pas un changement de fond du CDC.

**Décision :** le **CDC Master v2.2** peut être **retenu comme document de référence produit**, sous réserve d’**intégrer ou de suivre** les recommandations mineures listées au présent avis (§3 et §5).

---

**Contrôle des renvois (référentiel comptable v1.1) :** les paragraphes **§3.5** et **§18.5** de `REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md` existent et correspondent aux titres cités ci-dessus.

---

*Document rédigé à partir de l’analyse du CDC Master Lynki (v2.2) et de la connaissance du socle Lynki/Diva et des artefacts `ZeDocs/web57` (dont UX/navigation et spec écran Synthèse **v0.5** — cf. en-tête de [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md)).*
