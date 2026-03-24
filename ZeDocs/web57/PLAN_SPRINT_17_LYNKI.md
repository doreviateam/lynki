# Plan Sprint 17 — Lynki

**Fichier canonique :** `PLAN_SPRINT_17_LYNKI.md`  
**Version :** 1.3 — mars 2026  
**Révision 1.3 :** **§3.6** co-placement line + donut si les deux livrés ; **§10 carte des ancres** (audit tickets ↔ plan) ; obligation de **reprendre la Gate partielle dans le rapport** — [RAPPORT_SPRINT_17_LYNKI.md](RAPPORT_SPRINT_17_LYNKI.md) **v1.0** (clôture) ; tickets d’exécution **v1.3** (exécution + T98).  
**Révision 1.2 :** ancres explicites **§3.4.1** (titre de niveau plan) ; **§3.1.1** / **§3.2.1** / **§3.3.1** (charts + Diva) ; **règle Gate D canonique** (même formulation que les tickets) ; mode partiel bloc preuve ; tickets d’exécution **v1.1**.  
**Révision 1.1 :** Gate D — **clôture complète vs partielle** (un graphique livré + report justifié de l’autre) ; **minimum livrable V1** du bloc preuve ; **bornes du polish** (T97) ; **non-régression Sprint 16** explicite ; lien vers tickets d’exécution v1.0.  
**Révision 1.0 :** gel du plan à partir du **brouillon 0.1** MOA/produit ; ajouts : liens documentaires, **fiche minimale** par chart (doctrine S16), **clarification Gate** vs Sprint 16, tickets **T93+** numérotés, ticket **polish** explicite.  
**Sprint précédent (plan) :** [PLAN_SPRINT_16_LYNKI.md](PLAN_SPRINT_16_LYNKI.md) v1.1  
**Rapport amont :** [RAPPORT_SPRINT_16_LYNKI.md](RAPPORT_SPRINT_16_LYNKI.md) v1.0  
**Contrat métier :** [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) v0.2.1  
**Tickets d’exécution :** [EXECUTION_TICKETS_SPRINT_17_LYNKI.md](EXECUTION_TICKETS_SPRINT_17_LYNKI.md) v1.3  
**Rapport :** [RAPPORT_SPRINT_17_LYNKI.md](RAPPORT_SPRINT_17_LYNKI.md) v1.0  
**Backlog :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md)  

**En une phrase :** Sprint 17 = **commencer à expliquer visuellement la Synthèse**, avec des graphiques utiles, un bloc Diva renforcé et un premier bloc de preuve, **sans lancer encore la refonte design system globale**.

---

## 1. Intention

Après le Sprint 16 (lecture haute structurée par KPI cards + breadcrumb + arbitrage métier minimal), le Sprint 17 vise à **faire entrer la Synthèse dans une logique de lecture expliquée**.

L’objectif n’est plus seulement de montrer :
- des blocs,
- des KPI,
- une hiérarchie de lecture,

mais de permettre à l’utilisateur de :
1. **voir une tendance** sur la période,
2. **voir une répartition** intelligible,
3. **lire une interprétation guidée** (Diva),
4. **comprendre le statut de preuve** de la restitution,
5. tout cela **sans surcharger** l’écran ni ouvrir prématurément le chantier de refonte visuelle globale.

**Principe directeur :** *ajouter de l’explication visuelle sans perdre la sobriété métier.*

---

## 2. Objectifs (périmètre Sprint 17)

| # | Objectif | Critère de succès |
|---|----------|-------------------|
| A | **Graphique d’évolution** | Un **line chart** utile, adossé à une série métier claire, filtrée par société / période, sans ambiguïté de lecture. |
| B | **Graphique de répartition** | Un **donut** (ou équivalent) montrant une répartition métier compréhensible, sur une base d’agrégation explicitée. |
| C | **Bloc Diva renforcé** | L’insight devient un **bloc de lecture central** : texte principal, sources, périmètre, horodatage, actions. |
| D | **Bloc « statut de preuve / intégrité du dossier »** | Un bloc dédié rend visible l’état de preuve, de cohérence et de traçabilité de la restitution. |
| E | **Polish intermédiaire de la Synthèse** | Meilleure hiérarchie des cards / espacements / états vides, sans refonte design system globale (bornes §2.2). |

### 2.1 Non-régression Sprint 16 (structure de lecture)

Le Sprint 17 s’appuie sur la **structure** posée en Sprint 15–16. Toute livraison S17 doit **préserver** au minimum :

- le **bloc confiance** (**État du rapprochement bancaire**) reste **en tête** de la Synthèse et n’est pas relégué ni visuellement écrasé ;
- les **4 cartes KPI** restent **lisibles**, cohérentes avec leurs sources et leur ordre sous le bloc confiance ;
- le **breadcrumb** reste **aligné sur un état de navigation réel** (Synthèse → balance générale → GL selon le parcours).

*(Détail opérationnel : checkpoints dans [EXECUTION_TICKETS_SPRINT_17_LYNKI.md](EXECUTION_TICKETS_SPRINT_17_LYNKI.md) — T98.)*

### 2.2 Polish intermédiaire (T97) — dans / hors périmètre

**Autorisé en Sprint 17 uniquement :**

- **espacements** et marges locales sur la zone Synthèse concernée ;
- **hiérarchie** des cards (titres, sous-textes, ordre visuel léger) ;
- **états vides / indisponibles** plus explicites et homogènes ;
- **cohérence des sous-textes** (sources, références, mentions d’état) ;
- **petits ajustements de lisibilité** (contraste local, tailles ciblées) sans changer la charte globale.

**Exclu explicitement (réservé Sprint 18 ou chantier DS dédié) :**

- nouvelles **variables globales** ou refonte des tokens « racine » ;
- **rethéming massif** (couleurs / surfaces sur toute l’app) ;
- changement **généralisé** des **tokens visuels** ou du `globals.css` de manière structurelle ;
- micro-animations **ambitieuses** (cf. §5).

---

## 3. Hypothèses de travail

### 3.1 Graphique d’évolution — hypothèse cible

Le Sprint 17 vise **un seul line chart livré proprement**.  
Le choix exact de la série devra être validé métier avant exécution.

**Hypothèses cibles possibles :**
- évolution des **produits d’exploitation** sur la période ;
- évolution du **résultat** sur la période ;
- en alternatif : série issue de la **trésorerie** si elle s’avère plus robuste et plus lisible métier.

**Règle :** le sprint ne part pas sans une série, un libellé et une utilité de lecture clairement identifiés.

### 3.1.1 Hiérarchie visuelle et zone si le line chart est reporté

- Le **line chart** ne doit **pas** devenir le **centre visuel principal** au détriment du **bloc confiance**, des **KPI cards** et du **bloc Diva**.
- Si le line chart **n’est pas livré** : **aucun** grand **vide ambigu** — la zone est soit **absente** du layout, soit remplacée par un **message de report produit explicite** (pas un rectangle « muet »).

### 3.2 Graphique de répartition — hypothèse cible

Le Sprint 17 vise **un seul donut** (ou chart équivalent simple) montrant une répartition métier compréhensible.

**Hypothèses cibles possibles :**
- répartition des **charges** par grandes catégories ;
- répartition des **encours tiers** ;
- répartition de certaines **rubriques comptables** consolidées.

**Règle :** aucun donut ne doit être livré si la catégorisation est artificielle ou peu lisible métier.

### 3.2.1 Lisibilité du donut — nombre de catégories

- Le **nombre de catégories** affichées reste **limité** et lisible ; si nécessaire, regrouper le résiduel dans une catégorie **« Autres »**, à condition que ce regroupement soit **explicable** en une phrase.
- Le donut **ne repose pas sur la couleur seule** : **légende** et **libellés** sont **obligatoires** pour transmettre le sens.

### 3.3 Bloc Diva — rôle attendu

Le bloc Diva doit cesser d’être un simple encart secondaire.  
Il doit devenir :
- une **observation traçable**,
- fondée sur des **sources affichées**,
- reliée au **périmètre courant**,
- et potentiellement **actionnable** (ouvrir les comptes, inclure au rapport, etc.).

### 3.3.1 Fallback — insight Diva indisponible

- Le **bloc reste présent** avec un **état explicite** (indisponible, erreur, en cours), le **périmètre** rappelé, et si possible une indication de **dernière tentative** ou **dernière génération connue**.
- Si **aucune** action utile n’est réellement disponible en Sprint 17 : **zéro** action affichée vaut mieux qu’un **faux bouton** ou une action non tenue.

### 3.4 Bloc preuve / intégrité

Le Sprint 17 introduit un **premier niveau** de visibilité sur :
- la **cohérence synthèse ↔ balance**,
- le **statut de preuve**,
- l’**horodatage**,
- éventuellement un **hash court** / identifiant de snapshot si la donnée est disponible — **sans promesse UI** non tenable (stub honnête + roadmap si besoin).

### 3.4.1 Minimum livrable V1 (contrat de base — ticket T96)

En **V1**, le bloc preuve affiche **au minimum**, avec des **libellés compréhensibles pour la MOA** (privilégier par ex. *Cohérence vérifiée* / *Cohérence à contrôler*, *Horodatage*, *Statut de preuve*, plutôt qu’un jargon bas niveau seul) :

1. **Cohérence synthèse ↔ balance** — état explicite (aligné / partiel / indisponible / non vérifiable selon les données réelles).
2. **Horodatage** — de la restitution ou du jeu de faits affiché (selon ce que le système expose déjà).
3. **Statut de preuve** — formulation stable (ex. brouillon / consolidé / partiel) alignée sur les états déjà utilisés ailleurs dans Lynki si possible.
4. **Hash court** ou identifiant de snapshot — **uniquement si** la donnée est **réellement** disponible côté API / Vault ; sinon **absence assumée** + mention honnête ou report documenté, **pas** de badge « certifié » cosmétique.

**Mode partiel :** si **un** élément du minimum est indisponible (ex. hash court), le bloc l’**indique explicitement** **sans** dégrader l’affichage des **éléments encore disponibles** (pas de silence sur la ligne manquante).

### 3.5 Fiche minimale par chart (doctrine — alignée Sprint 16)

Avant implémentation, **chaque** chart (line ou donut) doit avoir une **fiche validée** :

- **Nom métier** de la série ou de la répartition  
- **Source** (route / agrégation Vault ou Linky)  
- **Période** et **filtres** (société, etc.)  
- **Phrase d’interprétation** autorisée (« ce graphique montre … »)  
- **Limites connues** (partiel, proxy, non comparabilité)

Sans cette fiche, le ticket chart est **reporté** plutôt que livré en mode décoratif.

### 3.6 Placement relatif — line + donut si **T93 et T94** sont tous deux livrés

Si les **deux** graphiques sont livrés sur la même vue Synthèse :

- les regrouper dans une **même bande** « lecture visuelle » ou un **enchaînement** clairement hiérarchisé (pas deux blocs « héros » de même poids qui se **concurrencent**) ;
- trancher en revue produit : **quel graphique porte la tendance principale** et lequel est en **support** (taille, titre, position) — décision **documentée** (fiche sprint, note de PR ou ADR court) ;
- respecter toujours **§3.1.1** (le duo ne domine pas confiance / KPI / Diva).

---

## 4. Gate D — Synthèse expliquée visuellement (périmètre Sprint 17)

**Gate D | Synthèse expliquée visuellement**

*Note : libellé **Gate D** volontairement réutilisé pour la **continuité produit** ; la **Gate D « lecture haute Synthèse »** du Sprint 16 est **clôturée** dans [RAPPORT_SPRINT_16_LYNKI.md](RAPPORT_SPRINT_16_LYNKI.md). En cas de confusion en atelier, renommer cette gate en clôture de sprint (ex. « Gate S17 »).*

| Critère | Attendu |
|---------|---------|
| Graphique d’évolution | **Livré** (fiche §3.5, série claire) **ou** **report explicite justifié** par absence de base métier — pas de chart décoratif. |
| Graphique de répartition | **Livré** (catégorisation compréhensible) **ou** **report explicite justifié** — pas de donut artificiel. |
| Bloc Diva | Renforcé, avec sources / périmètre / horodatage |
| Bloc preuve | Visible et compréhensible — minimum §3.4.1 respecté |
| Polish intermédiaire | Hiérarchie de lecture améliorée **dans les bornes §2.2** |

**Formulation canonique (plan = tickets — critère graphiques)** — à reprendre **mot pour mot** en clôture :

- **Deux graphiques** (line + donut) **livrés proprement**, chacun avec **fiche §3.5** validée ⇒ la Gate est **close complètement** **sur le critère graphiques**.
- **Un seul** graphique livré **et** **report justifié** de l’autre par **absence de base métier claire**, documenté au **rapport de sprint** (pas de trou silencieux) ⇒ la Gate est **close partiellement** **sur le critère graphiques**.

Les autres critères (Diva, preuve, polish, non-régression §2.1) ont leur propre statut dans le rapport ; la **partialité** de la gate peut **combiner** report chart + livraisons OK sur le reste.

**Rapport de clôture :** le [RAPPORT_SPRINT_17_LYNKI.md](RAPPORT_SPRINT_17_LYNKI.md) doit **explicitement** indiquer si la Gate D est **close complètement** ou **close partiellement** sur le **critère graphiques**, avec **reprise mot pour mot** ou renvoi à la **formulation canonique** ci-dessus (pas seulement dans les tickets).

---

## 5. Hors périmètre (explicitement)

- Refonte **design system V2** complète ;
- dark theme avancé / glassmorphism poussé ;
- micro-animations ambitieuses ;
- personnalisation avancée par tenant ;
- gel complet du contrat v0.3 sur les 4 blocs canoniques ;
- simulation / moteur prescriptif ;
- chantier `seed_erp`.

---

## 6. Dépendances

- Sprint 16 livré (KPI cards + breadcrumb + note §4.1) ;
- disponibilité de séries métier déjà exploitables côté Vault / Linky ;
- maintien de la règle de prudence sur les données partielles / provisoires ;
- arbitrage minimal MOA sur :
  - la série du line chart,
  - la catégorisation du donut,
  - la formulation du bloc Diva,
  - le contenu minimal du bloc preuve.

---

## 7. Risques

| Risque | Mitigation |
|--------|------------|
| Graphique techniquement faisable mais métier flou | Valider série + libellé + utilité avant implémentation ; reporter sinon. |
| Donut artificiel / purement décoratif | Refuser toute catégorisation non explicable en une phrase simple. |
| Bloc Diva trop bavard ou trop « IA gadget » | Encadrer le format : 1 observation principale + sources + périmètre + horodatage. |
| Bloc preuve trop technique pour la MOA | Garder des libellés lisibles, éviter le jargon bas niveau. |
| Glissement vers une refonte design system prématurée | Interdire explicitement la refonte CSS globale dans les tickets d’exécution. |

---

## 8. Suite logique (Sprint 18 — indicative)

| Sprint | Focus |
|--------|--------|
| **18** | Cohérence visuelle mature de la Synthèse — DS V2 **localisé**, maquette adaptée, états métier, responsive *(détail : [PLAN_SPRINT_18_LYNKI.md](PLAN_SPRINT_18_LYNKI.md) v1.0 ; tickets : [EXECUTION_TICKETS_SPRINT_18_LYNKI.md](EXECUTION_TICKETS_SPRINT_18_LYNKI.md) v1.1 ; réf. UI : [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) v0.3.1)* |

*Le Sprint 17 pose la lecture visuelle expliquée ; le Sprint 18 rapproche la **grammaire d’écran** d’une **maturité produit** sans trahir la preuve réelle.*

---

## 9. Tickets (placeholder — à découper en T93+)

Détail : [EXECUTION_TICKETS_SPRINT_17_LYNKI.md](EXECUTION_TICKETS_SPRINT_17_LYNKI.md) v1.3 (réf. plan **v1.3**) — résumé :

| ID | Thème |
|----|--------|
| **T93** | Graphique d’évolution (line chart) : série, libellé, fiche §3.5, états, responsive. |
| **T94** | Graphique de répartition (donut) : catégories, libellé, légende, prudence métier. |
| **T95** | Bloc Diva renforcé : texte principal, sources, périmètre, horodatage, actions. |
| **T96** | Bloc preuve / intégrité du dossier (niveau 1). |
| **T97** | Polish intermédiaire Synthèse (espacements, cards, états vides / indisponibles). |
| **T98** | Clôture sprint, rapport, non-régression, **statut Gate D** (complète ou partielle). |

---

## 10. Carte des ancres (plan ↔ tickets)

Vérification rapide : toutes les références des [EXECUTION_TICKETS_SPRINT_17_LYNKI.md](EXECUTION_TICKETS_SPRINT_17_LYNKI.md) v1.3 pointent vers des titres **existants** dans les §1–§4 (et **§3.6**) de ce document.

| Ancre | Objet |
|-------|--------|
| **§2.1** | Non-régression Sprint 16 (structure de lecture) |
| **§2.2** | Polish T97 — dans / hors périmètre |
| **§3.1** | Hypothèse line chart |
| **§3.1.1** | Hiérarchie visuelle line + zone si report |
| **§3.2** | Hypothèse donut |
| **§3.2.1** | Catégories limitées, Autres, légende |
| **§3.3** | Rôle Diva |
| **§3.3.1** | Fallback insight indisponible |
| **§3.4** | Bloc preuve / intégrité (intro) |
| **§3.4.1** | Minimum livrable V1 preuve |
| **§3.5** | Fiche minimale par chart |
| **§3.6** | Co-placement line + donut si les deux livrés |
| **§4** | Gate D — formulation canonique + tableau |

---

## 11. Historique des versions

| Version | Date | Changement |
|---------|------|------------|
| 0.1 | 2026-03 | Brouillon exécutable : charts utiles + Diva renforcé + bloc preuve + polish intermédiaire, sans refonte design system globale. |
| 1.0 | 2026-03 | Gel plan : intégration brouillon + renforts (fiche chart §3.5, clarification Gate vs S16, liens backlog/plan S16, tickets T93–T98, rapport S16 v1.0). |
| 1.1 | 2026-03 | Gate D : clôture complète vs partielle (un chart + report justifié) ; minimum livrable bloc preuve §3.4.1 ; bornes polish §2.2 ; non-régression S16 §2.1 ; tickets d’exécution v1.0. |
| 1.2 | 2026-03 | §3.4.1 titre explicite ; §3.1.1 hiérarchie line + zone report ; §3.2.1 donut catégories / légende ; §3.3.1 fallback Diva ; mode partiel preuve ; formulation Gate D canonique = tickets ; tickets v1.1. |
| 1.3 | 2026-03 | §3.6 co-placement T93+T94 ; §10 carte des ancres ; Gate dans rapport ([RAPPORT_SPRINT_17](RAPPORT_SPRINT_17_LYNKI.md) v1.0) ; tickets v1.3. |

---

*Document aligné sur la trajectoire Sprint 15 → 16 : après la crédibilité métier puis la lecture haute, le Sprint 17 commence la lecture visuelle expliquée de la Synthèse.*
