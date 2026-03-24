# Tickets d'exécution — Sprint 17 Lynki

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_17_LYNKI.md`  
**Version :** 1.3 — mars 2026  
**Rapport sprint :** [RAPPORT_SPRINT_17_LYNKI.md](RAPPORT_SPRINT_17_LYNKI.md) v1.0  
**Référence plan :** [PLAN_SPRINT_17_LYNKI.md](PLAN_SPRINT_17_LYNKI.md) **v1.3**  
**Référence métier :** [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) **v0.2.1**  
**Sprint précédent :** [RAPPORT_SPRINT_16_LYNKI.md](RAPPORT_SPRINT_16_LYNKI.md) **v1.0**  
**Backlog :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md)

**Séquence d'exécution :** **T93 + T94 + T95 + T96** en parallèle (selon capacité) → **T97** (polish après stabilisation des blocs) → **T98** (clôture)

---

## Rappels transversaux (plan v1.3)

- **Non-régression Sprint 16** : [PLAN_SPRINT_17_LYNKI.md](PLAN_SPRINT_17_LYNKI.md) **§2.1** — bloc confiance **en tête** et **premier dans l’ordre de lecture** sous le bandeau contexte, KPI lisibles, breadcrumb réel.
- **Fiche minimale par chart** : plan **§3.5** — obligatoire avant merge d'un line ou donut.
- **Minimum bloc preuve** : plan **§3.4.1** *(titre explicite dans le plan ; ne pas confondre avec §3.4 seul)*.
- **Gate D (S17)** — **même formulation que le plan §4** :
  - **2 graphiques** livrés proprement (fiche §3.5 chacun) ⇒ Gate **close complètement** **sur le critère graphiques** ;
  - **1 graphique** livré + **report justifié** de l’autre (absence de base métier claire, **documenté au rapport**) ⇒ Gate **close partiellement** **sur le critère graphiques** — **pas** de trou silencieux.
- **Polish T97** : bornes plan **§2.2** — pas de refonte tokens / globals structurelle.
- **Line chart** : hiérarchie + zone si report — plan **§3.1.1** ; **donut** : catégories + légende — plan **§3.2.1** ; **Diva dégradé** — plan **§3.3.1**.
- **T93 + T94 tous deux livrés** : **co-placement** — plan **§3.6** (une bande hiérarchisée, pas deux héros concurrents).
- **Carte des ancres** (audit) : plan **§10**.

---

## T93 — Linky — Graphique d'évolution (line chart)

**Objectif :** livrer **un** line chart **utile** sur la Synthèse comptable, adossé à une **série métier claire**, filtrée société / période, avec états explicites.

### Prérequis

- [PLAN_SPRINT_17_LYNKI.md](PLAN_SPRINT_17_LYNKI.md) v1.3
- **Fiche §3.5** validée (nom métier, source, période/filtres, phrase d'interprétation, limites)
- Données exploitables côté Vault / Linky pour la série retenue (ou charge pour l'exposer proprement)

### Travaux attendus

1. **Choisir et figer la série** (hypothèses plan §3.1 : produits d'exploitation, résultat, ou trésorerie si plus robuste).
2. **Implémenter** le chart dans la zone Synthèse (emplacement cohérent avec la hiérarchie : après KPI / avant ou parmi les blocs « lecture expliquée » — à trancher en revue sans violer §2.1).
3. **Hiérarchie visuelle** (plan §3.1.1) : le line chart **ne** doit **pas** devenir le **centre visuel principal** au détriment du **bloc confiance**, des **KPI cards** et du **bloc Diva**.
4. **Libellés** : axe, période, unité, légende si besoin ; **aucune** ambiguïté de lecture.
5. **États** : chargement, vide, partiel, erreur — messages honnêtes.
6. **Responsive** : lisible mobile / tablette (scroll horizontal contrôlé ou variante simplifiée acceptable).
7. Si **aucune** série n'est validable : **ne pas** livrer de chart décoratif — **report** documenté (rapport sprint + note dans ce fichier ou lien ADR court).
8. **Si le line chart n’est pas livré** (plan §3.1.1) : **aucune** zone vide ambiguë — le slot est **retiré du layout** **ou** remplacé par un **message de report produit explicite** (pas un rectangle muet).

### Checkpoint

- [ ] Fiche §3.5 présente et archivée (doc sprint ou commentaire ticket)
- [ ] Line chart livré **ou** report explicite justifié + **pas** de vide ambigu (§3.1.1)
- [ ] Hiérarchie visuelle : pas de domination du chart sur confiance / KPI / Diva
- [ ] Si **T94** est aussi livré : co-placement conforme plan **§3.6** (décision documentée)
- [ ] Filtres société / période cohérents avec le reste de la Synthèse
- [ ] Non-régression §2.1 (bloc confiance, KPI, breadcrumb)
- [ ] Build Linky OK

### Fichiers concernés

- `units/dorevia-linky/components/AccountingSummaryView.tsx` *(ou équivalent)*
- Composant chart dédié *(nouveau ou réutilisation lib existante)*
- Routes / clients API existants ou extension minimale

---

## T94 — Linky — Graphique de répartition (donut)

**Objectif :** livrer **un** donut (ou équivalent simple) montrant une **répartition métier compréhensible**, avec agrégation et légende explicites.

### Prérequis

- Plan v1.3
- **Fiche §3.5** validée pour ce chart (répartition = « nom métier » + source des catégories)
- Catégorisations **explicables en une phrase** (plan §3.2)

### Travaux attendus

1. **Choisir** la répartition cible (charges, encours tiers, rubriques consolidées — plan §3.2).
2. **Implémenter** le donut + **légende** et **libellés obligatoires** ; le sens **ne repose pas sur la couleur seule** (plan §3.2.1).
3. **Nombre de catégories** limité et lisible ; regrouper le résiduel en **« Autres »** si le regroupement est **explicable** (plan §3.2.1).
4. **Référence source** visible (ligne `Réf.` ou pattern Lynki existant).
5. **États** : vide, partiel, erreur — comme T93 ; si donut non livré, appliquer la même logique de **zone absente ou message de report** que T93 §3.1.1.
6. Si catégorisation **artificielle** ou non validée MOA : **report** explicite, pas de donut décoratif.

### Checkpoint

- [ ] Fiche §3.5 pour le donut
- [ ] Donut livré **ou** report justifié
- [ ] Catégories compréhensibles, **peu nombreuses** ou **Autres** explicable ; légende + libellés (pas couleur seule)
- [ ] Agrégation explicitée
- [ ] Si **T93** est aussi livré : co-placement conforme plan **§3.6** (décision documentée)
- [ ] Non-régression §2.1
- [ ] Build Linky OK

### Fichiers concernés

- Zone Synthèse Linky (même famille que T93)
- Composant chart dédié

---

## T95 — Linky — Bloc Diva renforcé

**Objectif :** faire du bloc insight Diva un **bloc de lecture central** : observation traçable, sources, périmètre, horodatage, actions utiles — **pas** un gadget IA.

### Prérequis

- APIs Diva / insight existantes fonctionnelles
- Arbitrage minimal MOA ou produit sur le **format** (1 observation principale + métadonnées)

### Travaux attendus

1. **Repositionner** visuellement le bloc dans la hiérarchie Synthèse (central / lisible, sans écraser bloc confiance ni KPI — cohérent §2.1).
2. **Structurer** le contenu :
   - **texte principal** (observation) ;
   - **sources** affichées ;
   - **périmètre** (société, période, filtres actifs) ;
   - **horodatage** ;
   - **actions** utiles (ex. rafraîchir, lien vers GL / rubrique / export — selon l'existant, sans sur-promesse).
3. Limiter le **bavardage** : format encadré plan §7 (risque Diva).
4. États : indisponible, chargement, erreur — explicites.
5. **Mode dégradé** (plan §3.3.1) : si l’insight est indisponible, le **bloc reste présent** avec état explicite, **périmètre rappelé**, et si possible **dernière tentative** / **dernière génération connue**.
6. **Actions** : si aucune action utile n’est réellement disponible en S17, **n’en afficher aucune** — **zéro** faux bouton ni action non tenue.

### Checkpoint

- [ ] Bloc Diva renforcé visible sur Synthèse
- [ ] Sources + périmètre + horodatage présents (y compris en mode dégradé §3.3.1)
- [ ] Au moins une action utile **ou** **aucune** action affichée + justification documentée si report à sprint ultérieur
- [ ] Non-régression §2.1
- [ ] Build Linky OK

### Fichiers concernés

- Composants Diva / Synthèse existants (`DivaFlashBlock`, `AccountingSummaryView`, routes `/api/diva/...` selon code actuel)

---

## T96 — Linky — Bloc preuve / intégrité du dossier (V1)

**Objectif :** introduire le **premier niveau** de visibilité sur la preuve et l'intégrité de la restitution Synthèse, selon le **minimum livrable** plan **§3.4.1**.

### Prérequis

- Lecture du plan **§3.4** et **§3.4.1** (titre explicite dans le plan)
- Inventaire des **données réellement** exposables (cohérence, horodatage, statut, hash éventuel)

### Travaux attendus

1. **Implémenter** un bloc dédié (ou section clairement identifiée) affichant **au minimum** :
   - **cohérence synthèse ↔ balance** (état explicite) ;
   - **horodatage** ;
   - **statut de preuve** (libellés MOA) ;
   - **hash court** uniquement si donnée **réelle** — sinon absence assumée / mention honnête.
2. **Pas** de badge « certifié » ou équivalent **sans** backend qui le porte.
3. Cohérence avec les **états** déjà utilisés ailleurs (OK / Partiel / Indisponible / non vérifiable) si applicable.
4. **Mode partiel** (plan §3.4.1) : si un élément du minimum est indisponible (ex. hash), **l’indiquer explicitement** **sans** masquer les lignes encore disponibles.
5. **Libellés MOA** : privilégier des formulations du type *Cohérence vérifiée* / *À contrôler*, *Horodatage*, *Statut de preuve*, plutôt que du jargon technique seul.

### Checkpoint

- [ ] Les 4 points du §3.4.1 sont couverts ou **chaque absence** est **explicite** (ex. hash absent mais ligne « non disponible »)
- [ ] Libellés compréhensibles pour la MOA
- [ ] Non-régression §2.1
- [ ] Build Linky OK

### Fichiers concernés

- `AccountingSummaryView.tsx` et/ou nouveau composant `AccountingSummaryProofBlock.tsx` *(nom indicatif)*
- Appels API / agrégations existants (Vault, métadonnées facts pack, etc. — selon réalité du code)

---

## T97 — Linky — Polish intermédiaire Synthèse (bornes Sprint 17)

**Objectif :** améliorer **localement** la lisibilité de la Synthèse **sans** ouvrir une refonte design system, **strictement** dans les bornes [PLAN_SPRINT_17_LYNKI.md](PLAN_SPRINT_17_LYNKI.md) **§2.2** *(section **« Polish intermédiaire (T97) — dans / hors périmètre »** dans le plan)*.

### Prérequis

- T93–T96 stabilisés ou en fin de course (éviter le polish sur du UI encore volatile)

### Autorisé (checklist recette — sous-ensemble de §2.2)

- [ ] Espacements **verticaux** / marges locales
- [ ] **Alignements** entre blocs de la zone Synthèse concernée
- [ ] **Hiérarchie des titres** (niveaux typographiques locaux)
- [ ] **Lisibilité des sous-textes** (sources, références)
- [ ] **États vides / indisponibles** homogènes
- [ ] **Cohérence des badges** d’état avec le reste de Lynki

### Interdit (hors ticket — escalade Sprint 18)

- Variables globales / tokens racine / rethéming massif / refonte `globals.css` structurelle / micro-animations ambitieuses.

### Checkpoint

- [ ] Améliorations visibles sur la zone Synthèse (checklist recette courte)
- [ ] Aucun changement hors §2.2 (revue explicite)
- [ ] Non-régression §2.1
- [ ] Build Linky OK

### Fichiers concernés

- Composants Synthèse concernés, styles modules ou classes locales

---

## T98 — Transversal — clôture sprint, Gate D (S17), non-régression, rapport

**Objectif :** fermer le Sprint 17, documenter le statut de la **Gate D — Synthèse expliquée visuellement** (complète ou partielle), mettre à jour la doc et valider la **non-régression Sprint 16**.

### Prérequis

- T93–T97 traités (livré ou report explicite pour chaque périmètre concerné)

### Travaux attendus

#### 1. Builds

- [ ] Build Linky : `npx next build`
- [ ] Autres builds si périmètre touché

#### 2. Non-régression Sprint 16 (plan §2.1)

Vérifier :

- [ ] Bloc **État du rapprochement bancaire** toujours **visible**, **en tête** de la zone métier Synthèse et **premier dans l’ordre de lecture** (sous bandeau / filtres si présents) — pas seulement « présent » ailleurs sur l’écran
- [ ] **4 cartes KPI** toujours lisibles et cohérentes (ordre sous le bloc confiance)
- [ ] **Breadcrumb** toujours aligné sur la navigation réelle

#### 3. Gate D (S17)

Le rapport Sprint 17 doit expliciter :

- [ ] Line chart : **livré** ou **report justifié**
- [ ] Donut : **livré** ou **report justifié**
- [ ] **Clôture gate complète vs partielle** sur le **critère graphiques** — **même formulation que le plan §4** (2 charts vs 1 + report justifié)
- [ ] Bloc Diva : statut (**forme cible** vs **forme minimale** / dégradée §3.3.1 si applicable)
- [ ] Bloc preuve : statut (**forme cible** vs **minimum §3.4.1** avec lignes partielles explicites si applicable)
- [ ] Polish T97 : statut
- [ ] Conclusion Gate D

#### 4. Mise à jour documentaire

- [ ] `RAPPORT_SPRINT_17_LYNKI.md` — compléter le squelette **v0.1** → version de clôture ; y inclure **obligatoirement** le statut Gate D **complète vs partielle** sur le critère graphiques (reprise ou renvoi explicite au plan **§4**), **pas seulement** dans ce fichier tickets
- [ ] `BACKLOG_PHASE2_LYNKI.md`
- [ ] `CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md` si arbitrages MOA

#### 5. Non-régression élargie (smoke)

- [ ] Pilotage / Synthèse, BG, Bilan, CdR, Tiers, exports existants, habilitations `/accounting/*` — selon périmètre habituel Lynki

### Checkpoint

- [ ] Build OK
- [ ] Gate D documentée (complète ou partielle, avec justification des reports chart)
- [ ] Non-régression §2.1 OK
- [ ] Backlog à jour

### Fichiers concernés

- `ZeDocs/web57/RAPPORT_SPRINT_17_LYNKI.md` *(création)*
- `ZeDocs/web57/BACKLOG_PHASE2_LYNKI.md`
- Contrat métier si évolutions

---

## Vigilances spéciales

| Sujet | Point d'attention |
|-------|-------------------|
| **Charts** | Fiche §3.5 obligatoire ; report préférable au décoratif. |
| **Gate D** | 2 charts = close complète ; 1 chart + report justifié de l'autre = **close partielle assumée**. |
| **Bloc preuve** | Respecter §3.4.1 ; pas de promesse « certifié » sans donnée. |
| **Diva** | Observation traçable, pas gadget. |
| **Polish T97** | Bornes §2.2 ; tout le reste = Sprint 18. |
| **Sprint 16** | §2.1 — structure de lecture inviolable. |

---

## Suite logique

1. **Sprint 18** — design system V2, thème sombre si retenu, polish visuel global  
2. **Contrat v0.3** — 4 blocs canoniques (hors Sprint 17 sauf arbitrage ponctuel)

---

## Gel documentaire

| Version | Contenu |
|---------|---------|
| **1.0** | Première rédaction alignée sur `PLAN_SPRINT_17_LYNKI.md` v1.1 (T93–T98). |
| **1.1** | Gel : ancres plan v1.2 (§3.4.1 titrée, §3.1.1–3.3.1) ; Gate D = formulation plan ; T93–T94 fallback zone + hiérarchie / catégories ; T95 dégradé + zéro faux bouton ; T96 partiel + libellés MOA ; T97 checklist §2.2 ; T98 ordre lecture + Diva/preuve cible vs minimale. |
| **1.2** | Alignement plan **v1.3** : §3.6 co-placement T93+T94 ; §10 carte des ancres ; Gate partielle **obligatoire dans le rapport** (T98 + squelette RAPPORT v0.1). |
| **1.3** | **Exécution mars 2026** : T93–T97 code Linky livré ; `npx next build` OK ; [RAPPORT_SPRINT_17_LYNKI.md](RAPPORT_SPRINT_17_LYNKI.md) **v1.0** ; backlog **v2.7**. |

---

*Fin des tickets d'exécution Sprint 17.*
