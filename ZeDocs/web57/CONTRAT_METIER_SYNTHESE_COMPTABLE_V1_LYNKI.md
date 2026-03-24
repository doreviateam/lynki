# Contrat métier — Synthèse comptable V1 (Lynki)

**Fichier canonique (unique) :** `CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md`  
**Version document :** 0.2.1 — mars 2026  
**Statut :** **Brouillon validable MOA** — base pour cadrage Sprint 15+ (pas encore gel implémentation)  
**Public cible MOA :** responsable comptable (ex. Esther) — lecture des restitutions et **niveau de confiance** associé aux chiffres affichés.

**Documents liés :**

- Navigation : [SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md)
- Restitutions comptables (vocabulaire) : [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md)
- Wireframes navigation : [WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md)
- Livraison ossature Sprint 14 : [RAPPORT_SPRINT_14_LYNKI.md](RAPPORT_SPRINT_14_LYNKI.md) v1.2

---

## 1. Objectif du contrat

Ce document fixe **ce que la vue « Synthèse comptable » doit garantir à la MOA** en V1.

Cette **version 0.2** fixe **en priorité** la dimension **« confiance des flux » / rapprochement bancaire** de la Synthèse comptable V1, tout en cadrant le statut des autres blocs structurants déjà présents ou attendus.

La Synthèse comptable V1 doit garantir :

1. **Lisibilité** — les restitutions structurantes (bilan, compte de résultat, balances, balance générale, etc.) sont présentes et cohérentes avec le périmètre filtré (société, période, exercice).
2. **Crédibilité** — la MOA voit **explicitement** l’état de **confiance** sur les flux financiers, en particulier le **rapprochement bancaire**, et non uniquement des montants « nus ».
3. **Continuité avec le Pilotage** — les indicateurs de confiance affichés en Synthèse **ne contredisent pas** ceux du Pilotage pour le même tenant / même période, sauf **écart de source ou de périmètre explicitement affiché**.
4. **Justification** — chaque bloc permet d’identifier d’où viennent les chiffres (source, référence d’agrégation, version, état partiel si applicable).

**Hors périmètre V1 (sauf décision explicite) :**
- maquette pixel-perfect « vision Esther » complète ;
- personnalisation avancée par tenant des rubriques ;
- automatisation métier au-delà de l’affichage, de la navigation et des exports existants ;
- simulation, recommandations prescriptives ou moteur expert d’analyse comptable.

---

## 2. Personas et besoins MOA

| Besoin | Formulation MOA | Exigence contrat V1 |
|--------|-----------------|---------------------|
| **Lecture synthétique** | « Je veux voir bilan / CdR / balances sur ma période. » | Blocs §3.2 présents et étiquetés (périmètre, source Vault/Odoo, partiel si applicable). |
| **Confiance** | « Si nous avons rapproché X % avec la banque, je dois le voir ici aussi. » | Bloc **§3.1 — État du rapprochement bancaire** obligatoire dès V1. |
| **Cohérence** | « Ce que je vois en Pilotage sur la trésorerie ne doit pas disparaître en Synthèse. » | Métriques alignées Pilotage (définitions §4) ou message explicite d’indisponibilité / non-alignement. |
| **Audit** | « Je dois pouvoir expliquer d’où viennent les chiffres. » | Chaque bloc expose une référence version / agrégation (pattern déjà présent : `Réf. v1.1 - …`). |
| **Prudence** | « Je préfère voir un état partiel explicite qu’un chiffre trompeur. » | États vides, partiels ou non alignés explicitement affichés. Aucun silence UI. |

---

## 3. Contenu minimal de la Synthèse comptable V1

### 3.1 Bloc « État du rapprochement bancaire » — **obligatoire V1**

**Libellé métier principal retenu pour l’écran :** **État du rapprochement bancaire**  
**Libellé secondaire autorisé :** **Confiance des flux**

Le terme principal à l’écran doit rester **stable** sur toute la V1 afin d’éviter les ambiguïtés de vocabulaire entre « confiance », « rapprochement », « taux rapproché » ou « part rapprochée ».

**Constat produit (mars 2026) :** les métriques de rapprochement existent déjà (Vault, agrégations trésorerie, santé Odoo) et sont visibles en **Pilotage**. Elles **n’étaient pas** surfacées en **Synthèse comptable**, créant une incohérence perçue pour la MOA : un travail réel de rapprochement peut exister sans être visible dans la vue comptable.

#### Exigences V1

| # | Exigence | Détail |
|---|----------|--------|
| C1 | **Visibilité** | Un bloc dédié apparaît **en tête de zone** de la Synthèse, avant les rubriques Bilan / CdR, sauf validation MOA contraire. |
| C2 | **Indicateurs minimum** | Afficher au moins : **taux ou part rapprochée** (selon définition figée §4.1), **montant ou solde restant à rapprocher** si disponible, **nombre d’écritures non rapprochées** et/ou **date la plus ancienne** si disponibles. |
| C3 | **Période** | Les indicateurs sont **calés sur les filtres** société / période / exercice de la Synthèse, ou le bloc affiche clairement son **périmètre réel** si la donnée est globale ou partiellement alignée. |
| C4 | **État vide / partiel** | Si les données sont absentes, incomplètes ou calculables sur un périmètre partiel uniquement, le bloc affiche un message explicite. |
| C5 | **Non-contradiction** | Pour un même tenant et un même périmètre, le bloc ne doit pas afficher une information incompatible avec le Pilotage, sauf mention explicite d’une différence de source ou de filtre. |
| C6 | **Non-alignement explicite** | Si les sources disponibles ne permettent pas d’aligner proprement Pilotage et Synthèse sur le périmètre courant, le bloc doit afficher un **état de non-alignement** plutôt qu’un chiffre trompeur. |
| C7 | **Référence** | Le bloc expose une référence d’agrégation / version / source comme les autres restitutions Lynki. |
| C8 | **Lien conceptuel** | Option V1.1 : lien « Voir le détail en Pilotage » (même URL + `view=pilotage` + ancre ou scroll). **Non bloquant** pour V1 stricte. |

#### États attendus

| État | Comportement attendu |
|------|----------------------|
| **Disponible et aligné** | Les indicateurs sont affichés normalement. |
| **Partiel** | Le bloc affiche les indicateurs disponibles + un badge ou message `Partiel`. |
| **Indisponible** | Le bloc affiche un message explicite, sans chiffre ambigu. |
| **Non aligné avec le périmètre courant** | Le bloc indique que la donnée existe mais ne correspond pas exactement au périmètre ou à la période affichés. |
| **Contradictoire / douteux** | Le bloc n’affiche pas un taux arbitraire ; il signale l’impossibilité de fournir une mesure fiable. |

**Référence technique (implémentation future) :** réutiliser prioritairement les mêmes agrégats que `dashboard-metrics`, `/ui/aggregations/treasury`, `bank-reconciliation-health`. Le composant `BankReconciliationIndicator` peut servir de base s’il est réactivé et intégré à `AccountingSummaryView`.

---

### 3.2 Blocs restitutions structurantes

Ces blocs constituent le **cœur de la Synthèse**. Le présent contrat distingue leur **statut V1** afin d’éviter toute ambiguïté entre ce qui est obligatoire, reconduit ou optionnel.

| Bloc | Rôle MOA | Statut V1 | Note contrat |
|------|----------|-----------|--------------|
| **Balance générale** (pilote / partielle) | Contrôle des comptes et soldes | **Obligatoire si données disponibles** | Le statut **PARTIEL** / source agrégation doit rester visible. |
| **Bilan** (rubriques) | Structure patrimoniale | **Obligatoire si données disponibles** | Message explicite si rubriques non peuplées. |
| **Compte de résultat** (rubriques, comparatif N/N-1 si activé) | Performance | **Obligatoire si données disponibles** | Cohérence des libellés avec le dictionnaire des restitutions. |
| **Insight comptable (Diva)** | Lecture interprétative | **Complémentaire** | Complète la lecture des chiffres ; ne remplace jamais le bloc §3.1. |
| **Agrégats par classes PCG** | Vue condensée | **Secondaire / optionnel** | Peut rester replié ou secondaire en V1. |
| **Balances âgées clients / fournisseurs** | Lecture des encours | **Recommandé si disponible** | Périmètre, fraîcheur et partiel clairement indiqués. |
| **Grand livre / navigation au détail** | Justification | **Exigence de continuité** | La Synthèse doit permettre de redescendre jusqu’au détail lorsqu’il existe déjà dans le produit. |

**Principe transverse :** aucun bloc ne doit afficher un montant sans indiquer, directement ou indirectement, s’il est **complet**, **partiel**, **indisponible** ou **non aligné** avec le périmètre courant.

---

## 4. Définitions métier à trancher (atelier MOA × produit)

Pour éviter les « 25 % » interprétés différemment selon l’écran, les définitions suivantes doivent être arbitrées avec la MOA.

| Sujet | Question pour Esther / MOA | Décision attendue |
|-------|---------------------------|-------------------|
| **Taux affiché** | Le % est-il calculé sur les **montants** (absolus), sur les **lignes**, sur les **factures vs banque**, ou aligné sur **Odoo bank reconciliation health** ? | Une définition **canonique** par tenant ou globale. |
| **Base de calcul** | « 25 % des montants facturés » — base = tout le journal ventes ? la trésorerie ? le périmètre banque uniquement ? | Documenter la formule en une phrase dans ce fichier. |
| **Période de calcul** | Rapprochement **à date**, **sur l’exercice**, **sur période filtrée**, ou **glissant** ? | Alignement sur les filtres Synthèse ou exception documentée. |
| **Multi-sociétés** | Agrégation groupe vs société active ? | Règle d’affichage et de consolidation. |
| **Montant restant** | Solde restant à rapprocher en brut, net, signé, absolu ? | Convention unique d’affichage. |
| **Écriture non rapprochée** | Qu’est-ce qu’on appelle exactement une « écriture non rapprochée » dans la restitution métier ? | Définition stable. |
| **Seuil de prudence** | À partir de quel niveau de couverture ou d’incertitude faut-il afficher `Partiel` ou `Non aligné` ? | Règle d’état métier. |

### 4.1 Décisions figées (source de vérité après atelier)

| Indicateur | Définition MOA | Source système | Validé le |
|------------|----------------|----------------|-----------|
| Taux de rapprochement | À définir | À définir | |
| Montant restant à rapprocher | À définir | À définir | |
| Nombre d’écritures non rapprochées | À définir | À définir | |
| Date la plus ancienne non rapprochée | À définir | À définir | |

**Note Sprint 16 (mars 2026) — arbitrage métier minimal :**  
En attendant un atelier MOA complet sur ce tableau, la **lecture haute** de la Synthèse (cartes KPI) et le **breadcrumb** sont livrés avec des définitions **provisoires** alignées sur les restitutions Vault existantes : total actif (rubriques bilan), résultat net (somme rubriques CdR), partenaires distincts (AR ∪ AP), comptes actifs (nombre de lignes BG). L'**ordre de lecture** retenu en produit est : bloc confiance (§3.1) → cartes KPI → balance générale et restitutions détaillées. Les cellules du tableau ci-dessus restent à compléter avec Esther pour le **sens canonique** du % de rapprochement et les seuils de prudence.

---

## 5. Règles métier transverses

### 5.1 Règle de cohérence produit

Pour un même tenant, une même société active et un même périmètre temporel, la Synthèse comptable ne doit pas afficher un état de confiance incompatible avec celui du Pilotage, sauf **mention explicite** d’une différence de source, de calcul ou de filtre.

### 5.2 Règle de prudence

En cas de doute sur la qualité, l’alignement ou l’exhaustivité de la donnée, la règle produit est :

**mieux vaut afficher un état explicite de partiel / indisponible / non aligné qu’un chiffre apparemment précis mais trompeur.**

### 5.3 Règle de vocabulaire

Le libellé principal du bloc de confiance est **État du rapprochement bancaire**.  
Le terme **Confiance des flux** peut être utilisé comme sous-libellé, aide à la lecture ou vocabulaire documentaire, mais ne doit pas concurrencer le libellé principal à l’écran.

### 5.4 Règle de traçabilité

Chaque bloc significatif de la Synthèse expose :
- une source ou référence d’agrégation ;
- un état (`OK`, `Partiel`, `Indisponible`, `Non aligné`, etc.) si nécessaire ;
- un rattachement clair au périmètre affiché.

---

## 6. Critères d’acceptation globaux (recette MOA)

1. En **Synthèse comptable**, avec les mêmes filtres qu’en Pilotage, la MOA **voit** le bloc §3.1 avec les indicateurs C2 ou un message C4 explicite.
2. Aucun écran ne laisse croire que « tout est bouclé » si le rapprochement est partiel — un **libellé**, **badge** ou **message** de confiance adapté est visible.
3. Pour un même tenant et un même périmètre, la Synthèse ne doit pas afficher un état de confiance incompatible avec celui du Pilotage, sauf mention explicite d’un écart de source ou de périmètre.
4. En cas de non-alignement des sources, la Synthèse affiche un **état explicite de non-alignement**, pas un chiffre arbitraire.
5. Les exports et blocs existants (CSV, rubriques, BG, comparatifs existants) **ne régressent pas**.
6. Le rapport documentaire (DOCX) peut, en **V1.1 ou V2**, reprendre un **résumé** des indicateurs §3.1 — **hors périmètre gel** du présent contrat tant que non acté.

---

## 7. Suite logique (produit / delivery)

| Étape | Action |
|-------|--------|
| 1 | **Atelier MOA** (Esther) : remplir §4.1 (définitions, source canonique du %, règles de prudence). |
| 2 | **Ticket unique ou épique** : intégration du bloc §3.1 dans `AccountingSummaryView` + tests e2e sur cohérence filtres / non-contradiction avec Pilotage. |
| 3 | **Mise à jour** du dictionnaire / SPEC UX si nouveaux libellés ou règles de navigation (lien Pilotage) sont retenus. |
| 4 | **PLAN_SPRINT_15_LYNKI.md** : rattacher explicitement ce contrat comme **référence métier** pour la brique Synthèse V1 — voir [PLAN_SPRINT_15_LYNKI.md](PLAN_SPRINT_15_LYNKI.md) v1.2. |
| 5 | **Version 0.3 du contrat** : extension aux 4 blocs canoniques complets (Bilan, CdR, Tiers, Grand livre) avec agrégats, états vides et règles transverses stabilisés. |

---

## 8. Historique des versions

| Version | Date | Changement |
|---------|------|------------|
| 0.1 | 2026-03 | Création : objectif, persona MOA, §3.1 rapprochement obligatoire V1, blocs existants, définitions à trancher, critères d’acceptation, suite delivery. |
| 0.2 | 2026-03 | Clarification du périmètre du contrat, stabilisation du vocabulaire du bloc de confiance, ajout des statuts V1 des autres blocs, règles de prudence / non-alignement / non-contradiction, critères d’acceptation renforcés. |
| 0.2.1 | 2026-03 | Note sous §4.1 : arbitrage minimal Sprint 16 (KPI + ordre de lecture) ; tableau des décisions figées toujours à compléter en atelier MOA. |

---

*Document rédigé pour donner une **assise métier** à la Synthèse comptable après le Sprint 14 (ossature + navigation + traçabilité), et lever l’incohérence « données de rapprochement visibles en Pilotage uniquement ».*
