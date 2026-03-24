# Tickets d'exécution — Sprint 18 Lynki

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_18_LYNKI.md`  
**Version :** 1.1 — mars 2026 — **gel canonique** — *base d’exécution Sprint 18* (maturité visuelle contrôlée, honnêteté produit d’abord)  
**Référence plan :** [PLAN_SPRINT_18_LYNKI.md](PLAN_SPRINT_18_LYNKI.md) **v1.0**  
**Référence métier :** [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) **v0.2.1**  
**Sprint précédent :** [RAPPORT_SPRINT_17_LYNKI.md](RAPPORT_SPRINT_17_LYNKI.md) **v1.5**  
**Référence UI cible :** [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) **v0.3.1** — annexe [`ANNEXE_UI_CIBLE_SYNTHESE_LYNKI_S18.html`](ANNEXE_UI_CIBLE_SYNTHESE_LYNKI_S18.html) (*north star* ; **§3.1** libellés démo ; **matrice T99** §5.1 **source unique**)  
**Backlog :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md)

**Séquence d'exécution :** **T99 + T100 + T101** en parallèle (selon capacité) → **T102 + T103** → **T104**

---

## Rappels transversaux (plan v1.0)

- **La maquette HTML cible n'est pas un contrat de données** : c'est une **référence de composition visuelle**, pas un écran à cloner à l'identique (plan §3.0 ; [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) §2).
- **Règle d'honnêteté produit** : aucun libellé, badge ou wording plus fort que la réalité backend ne doit être introduit (plan §3.2).
- **Vocabulaire « preuve » fort** (`certifié`, `garanti`, `conforme`, etc.) : **adossé à une capacité backend explicite** ; sinon formulation neutre ou état partiel / non vérifiable (plan §3.3).
- **Périmètre Sprint 18** : design system **localisé à la Synthèse**, pas de refonte aveugle de toute l'application (plan §5).
- **Structure héritée Sprint 15–17** (plan §1.1) : bloc confiance → KPI → lecture visuelle / explicative (charts, Diva, etc.) → preuve → suites documentaires / points d’attention ; cette structure ne doit pas être cassée sans décision produit tracée.
- **États métier** : `Partiel`, `Indisponible`, `Proxy`, `Non vérifiable` restent visibles ; Sprint 18 améliore leur hiérarchie visuelle, pas leur disparition (plan §8.2).
- **États vides nobles** : vide utile, partiel, indisponible, proxy — obligatoire en recette, pas seulement les écrans « pleins » (plan §8.4).
- **Check produit** (par bloc repris de la maquette) : Lynki peut-il **vraiment** l'afficher ? Le **backend** le **porte**-t-il ? Le **wording** est-il **honnête** ? ([REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) §4).

---

## T99 — Synthèse — adaptation de la maquette cible (composition bloc par bloc)

**Objectif :** traduire la maquette HTML cible en **composition produit réelle Lynki**, bloc par bloc, sans recopier des promesses ou des surfaces non tenables.

### Prérequis

- [PLAN_SPRINT_18_LYNKI.md](PLAN_SPRINT_18_LYNKI.md) v1.0
- Référence UI cible figée ou accessible en atelier / dépôt ([REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md))
- Sprint 17 suffisamment stabilisé (charts, Diva, preuve, polish intermédiaire)
- Inventaire des blocs réellement présents dans la Synthèse actuelle

### Règle fondamentale

La maquette cible sert de **north star de composition**.  
Elle ne doit pas être interprétée comme :
- un contrat de backend,
- un engagement pixel-perfect,
- ni un droit à employer des libellés plus forts que la preuve réelle.

### Travaux attendus

#### 1. Traduire la maquette en blocs Lynki réels

Bloc par bloc, décider pour chacun :

- **repris en Sprint 18**
- **repris partiellement**
- **reporté**
- **interdit sans backend**

Blocs à traiter au minimum :
- vue d'ensemble / chaîne de lecture
- 4 cartes structurantes
- lecture graphique
- bloc Diva
- bloc preuve / intégrité
- points d’attention
- préparation CODIR / documentation
- nav mobile éventuelle

#### 2. Produire une matrice d'adaptation explicite

Pour chaque bloc, documenter :
- la version de la maquette cible
- l'équivalent Lynki réel
- les écarts assumés
- les reformulations nécessaires

*(Alignement avec la matrice plan §3.1 — à croiser.)*

#### 2bis. Sortie documentaire obligatoire (matrice)

La **matrice d'adaptation** produite en T99 ne doit pas rester implicite (PR seule, « dans la tête »). Elle doit être **archivée dans un artefact unique et référencé**, par exemple :

- une **section ou tableau** dans [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) *(emplacement prévu §5.1)* ; ou
- une **annexe** au futur `RAPPORT_SPRINT_18_LYNKI.md` ; ou
- une **note de mapping** `ZeDocs/web57/…` explicitement liée depuis le rapport S18 **et** depuis la référence UI.

**T104** vérifie que le lien vers cette matrice est **traçable** dans la doc du sprint.

**Source de vérité unique :** parmi les emplacements possibles (réf. UI §5.1, annexe rapport, note ZeDocs), **un seul** contient la matrice **à jour**. Les autres documents (rapport, PR, wiki) ne font que **y pointer** (chemin ou ancre) — **pas** de deuxième ou troisième copie « vivante » qui divergerait. Si la matrice est déplacée, **mettre à jour les pointeurs**, pas dupliquer le tableau.

#### 3. Préserver l'ossature de lecture

Vérifier que la composition cible reste compatible avec l'ordre suivant (plan §1.1) :
1. bloc confiance
2. KPI
3. lecture visuelle / explicative
4. preuve / suites documentaires

#### 4. Éliminer les promesses UI non tenables

Exemples à filtrer / reformuler :
- `Vault certifié`
- `Snapshot comptable certifié`
- `Base certifiée`
- tout badge ou wording supérieur au niveau de preuve réellement porté

### Checkpoint

- [ ] Matrice d'adaptation bloc par bloc produite **et publiée** (artefact §2bis — pas seulement en PR)
- [ ] **Une seule** source de vérité pour la matrice ; ailleurs uniquement **liens** (pas de matrices parallèles)
- [ ] Chaque bloc cible est classé : repris / partiel / reporté / interdit sans backend
- [ ] Aucun wording fort non porté par le backend n'est repris tel quel
- [ ] L'ossature de lecture héritée S15–S17 reste préservée
- [ ] Build Linky OK si implémentation entamée

### Fichiers concernés

- `PLAN_SPRINT_18_LYNKI.md` *(référence)*
- éventuelle annexe / note de mapping UI
- `units/dorevia-linky/components/AccountingSummaryView.tsx`
- composants Synthèse concernés

---

## T100 — Synthèse — design system V2 localisé

**Objectif :** harmoniser localement la zone Synthèse : cards, badges, titres, sous-textes, surfaces, blocs `Réf.`, sources, périmètre, horodatage.

### Prérequis

- T99 suffisamment avancé
- Inventaire des familles de composants présentes dans la Synthèse
- Plan Sprint 18 v1.0

### Règle fondamentale

Sprint 18 traite un **design system V2 localisé à la Synthèse**.  
Aucune modification structurelle globale de l’application ne doit être introduite sans arbitrage explicite.

**Tokens et variables :** toute création ou modification de **tokens / variables de thème** doit rester **scopée à la Synthèse** (namespace local, classes locales, variables locales, modules CSS limités au périmètre). **Aucune substitution implicite** des **tokens ou variables globaux** (racine, `globals.css`, thème app-wide) **n’est admise** en Sprint 18 sans arbitrage produit explicite et ticket dédié.

### Travaux attendus

#### 1. Harmoniser les familles de composants

Au minimum :
- cards principales
- cards secondaires
- badges d’état
- titres / sous-titres
- blocs `Réf.` / sources / périmètre / horodatage
- actions locales (boutons / liens utilitaires)

#### 2. Définir une hiérarchie visuelle locale

Pour la zone Synthèse :
- tailles de titres
- niveaux de sous-texte
- poids des badges
- surfaces principales / secondaires
- règles de respiration entre blocs

#### 3. Unifier les surfaces

Sans forcément reprendre tout le glassmorphism de la maquette, définir une logique stable pour :
- fond de bloc
- bordure
- accent léger
- hover / focus si pertinent
- lisibilité sur fond sombre ou thème retenu

#### 4. Limiter strictement le périmètre

Interdit dans ce ticket :
- refonte globale de tous les tokens racine
- rethéming massif de toute l’app
- modification structurelle large de `globals.css`
- animations ambitieuses

### Checkpoint

- [ ] Familles de composants harmonisées localement sur la Synthèse
- [ ] Hiérarchie typographique locale définie et visible
- [ ] Surfaces / cards cohérentes entre blocs
- [ ] Aucun débordement design system sur le reste de l'application sans arbitrage
- [ ] Aucun token / variable globale modifiée « par effet de bord » (respect règle tokens § ci-dessus)
- [ ] Build Linky OK

### Fichiers concernés

- composants Synthèse concernés
- styles locaux / modules / utilitaires visuels
- éventuels fichiers thème local si déjà présents

---

## T101 — Synthèse — états métier : partiel / indisponible / proxy / non vérifiable

**Objectif :** rendre les états métier **plus lisibles et moins envahissants**, sans les masquer.

### Prérequis

- Plan Sprint 18 v1.0
- Inventaire des états actuellement utilisés dans la Synthèse
- T100 en cours ou stabilisé

### Règle fondamentale

Sprint 18 ne cherche pas à supprimer les états métier.  
Il cherche à les **rendre plus justes visuellement** :
- visibles,
- compréhensibles,
- moins agressifs,
- plus cohérents entre blocs.

### Travaux attendus

#### 1. Uniformiser les libellés d'état

Raccorder autant que possible :
- `Partiel`
- `Indisponible`
- `Proxy`
- `Non vérifiable`

Éviter les variantes inutiles si elles n'apportent pas de sens métier supplémentaire.

#### 2. Travailler leur hiérarchie visuelle

Hypothèses autorisées :
- badge plus discret
- placement plus cohérent
- sous-ligne d'état plutôt qu'alerte dominante
- wording plus calme

#### 3. Traiter aussi les cas vides / absents

Prévoir une grammaire visuelle pour :
- état vide utile
- état partiel utile
- indisponible utile
- proxy assumé

*(Cohérent avec plan §8.4 — états vides nobles.)*

#### 4. Vérifier que le gain visuel ne ment pas

Un état ne doit jamais devenir décoratif ou quasi invisible au point de masquer une limite réelle de la donnée.

#### 5. Recette comparative avant / après

La subtilité visuelle doit être **démontrable** : prévoir au moins l’un des suivants —

- **captures d’écran** avant / après sur **un même scénario** (ex. `Partiel` sur un bloc clé) ; ou
- **checklist comparative** (lisibilité du libellé d’état, surface occupée, contraste, hiérarchie vs alerte) signée en recette ;

— pour prouver que l’état est **moins envahissant** **sans** être **moins visible** ni **moins compréhensible**.

**Piège d’exécution (T100 → T101) :** un design plus « propre » peut rendre les états **si discrets** qu’un utilisateur **ne les remarque plus** — ce qui **contredit** l’objectif (limite métier toujours perceptible). Le **avant / après** de §5 n’est pas optionnel : il sert de **garde-fou** contre la sur-discrétion. En recette, vérifier explicitement qu’un lecteur **repère encore** l’état en **moins de quelques secondes** sur un scénario donné (critère à fixer en atelier, ex. checklist ou test à froid).

### Checkpoint

- [ ] États métier harmonisés sur la Synthèse
- [ ] Les badges / sous-textes d’état sont plus lisibles et moins envahissants
- [ ] Les cas vides / absents ont une présentation utile
- [ ] Aucune limite métier réelle n’est masquée
- [ ] **Perceptibilité** : les états restent repérables rapidement (pas seulement « plus jolis »)
- [ ] Recette **avant / après** ou checklist comparative disponible (§5) — **faite**, pas théorique
- [ ] Build Linky OK

### Fichiers concernés

- composants Synthèse concernés
- composants badges / états si factorisés
- styles locaux associés

---

## T102 — Synthèse — responsive mature (desktop / tablette / mobile)

**Objectif :** assurer une lecture cohérente de la Synthèse sur desktop, tablette et mobile.

### Prérequis

- T99–T101 suffisamment avancés
- Co-placement charts et blocs principaux stabilisé

### Règle fondamentale

Le responsive Sprint 18 ne consiste pas à "faire rentrer".  
Il consiste à **préserver l’ordre de lecture et la respiration** sur chaque format (plan §1.1, §8.3).

### Travaux attendus

#### 1. Vérifier la composition sur 3 formats minimum

- desktop large
- laptop / tablette
- mobile

#### 2. Contrôler les points sensibles

- co-placement line + donut
- densité des KPI cards
- Diva + preuve en colonnes ou en pile
- points d’attention / documentation
- zone export / DOCX
- éventuelle nav mobile si retenue *(par défaut reportée — plan §3.1)*

#### 3. Définir les replis acceptables

- passage 4 KPI → 2×2 → pile
- passage charts côte à côte → pile
- simplification de certains sous-textes si nécessaire
- scroll horizontal contrôlé seulement si honnêtement préférable

#### 4. Éviter les dégradations silencieuses

Pas de :
- collision
- texte illisible
- hiérarchie cassée
- bloc central relégué en bas sans logique

### Checkpoint

- [ ] Desktop correct
- [ ] Tablette correcte
- [ ] Mobile correct
- [ ] Aucun bloc clé n’est relégué ou cassé sans logique
- [ ] Build Linky OK

### Fichiers concernés

- composants Synthèse
- layouts / wrappers
- classes responsive locales

---

## T103 — Synthèse — points d’attention + documentation / CODIR (V1 honnête)

**Objectif :** introduire ou consolider une zone **Points d’attention** et un bloc **documentation / préparation CODIR** dans une version V1 honnête et utile.

### Prérequis

- T99 avancé
- Matière réelle disponible pour les points d’attention, ou stratégie d’état vide utile
- Exports / DOCX existants déjà fonctionnels

### Règle fondamentale

Ces blocs ne doivent pas donner une impression de complétude artificielle.  
S’il manque de la matière, mieux vaut un état vide utile qu’un remplissage cosmétique (plan §8.4).

### Travaux attendus

#### 1. Points d’attention

Créer ou améliorer un bloc qui :
- valorise les faits récents ou écarts utiles
- reste lisible
- ne surcharge pas la page
- fonctionne aussi si peu d’éléments sont disponibles

#### 2. Documentation / préparation CODIR

Créer ou améliorer un bloc V1 qui :
- rappelle les capacités réelles d’export / DOCX
- propose éventuellement des options simples
- n’ouvre pas de promesse documentaire que Lynki ne tient pas encore

#### 3. Gérer les états pauvres

Si la matière est insuffisante :
- afficher un état vide utile
- ou un périmètre de disponibilité explicite
- pas un faux bloc “plein”

#### 4. Cas « aucun point d’attention »

Lorsqu’il n’y a **rien à signaler**, le bloc ne doit pas être un **faux vide** (silence ou zone grise sans sens). Prévoir explicitement :

- un **message utile** du type *« Aucun écart notable sur la période et le périmètre sélectionnés »* (formulation à valider MOA) ;
- un **rappel du périmètre** (période, sociétés, source de vérité) pour ancrer la lecture ;
- si pertinent : une **indication de fraîcheur** (*dernière analyse*, *dernière mise à jour*, horodatage déjà porté ailleurs — **sans inventer** une donnée que le backend ne fournit pas).

### Checkpoint

- [ ] Bloc points d’attention présent ou explicitement en état vide utile **y compris** scénario *aucun point d’attention* (§4)
- [ ] Bloc documentation / CODIR V1 présent et raccord aux exports réels
- [ ] Aucun wording non tenu sur les capacités documentaires (plan §3.3)
- [ ] Cohérence visuelle avec le reste de la Synthèse
- [ ] Build Linky OK

### Fichiers concernés

- composants Synthèse concernés
- éventuels composants export / DOCX / insights contextuels

---

## T104 — Transversal — clôture sprint, Gate D, non-régression, rapport

**Objectif :** fermer proprement le Sprint 18, documenter la **Gate D — Cohérence visuelle mature de la Synthèse**, et vérifier la non-régression fonctionnelle.

### Prérequis

- T99 à T103 traités
- Décisions d’adaptation de la maquette documentées (**matrice T99** — artefact unique, voir T99 §2bis)
- Responsive vérifié

### Travaux attendus

#### 1. Builds

- [ ] Build Linky : `npx next build`
- [ ] Autres builds si périmètre touché

#### 2. Vérification de la Gate D

Le rapport Sprint 18 doit expliciter :
- statut de l’adaptation de la maquette cible
- statut du design system local
- statut des états métier
- statut du responsive
- statut de l’honnêteté produit / vocabulaire preuve
- conclusion Gate D

#### 3. Non-régression

Vérifier que restent inchangés fonctionnellement :
- navigation Pilotage / Synthèse
- bloc confiance
- KPI
- charts déjà livrés
- Diva
- preuve
- drill-down
- exports / DOCX
- habilitations `/accounting/*`

#### 4. Mise à jour documentaire

- [ ] `RAPPORT_SPRINT_18_LYNKI.md`
- [ ] `BACKLOG_PHASE2_LYNKI.md`
- [ ] `PLAN_SPRINT_18_LYNKI.md` si écarts majeurs
- [ ] [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) §3 si maquette HTML versionnée ; **§5.1** si la matrice T99 y est hébergée — **pointeurs uniquement** ailleurs si la matrice est dans un autre artefact unique (T99 §2bis)
- [ ] contrat métier si arbitrages utiles

### Checkpoint

- [ ] Build OK
- [ ] Gate D documentée
- [ ] Non-régression validée
- [ ] Documentation à jour

### Fichiers concernés

- `ZeDocs/web57/RAPPORT_SPRINT_18_LYNKI.md`
- `ZeDocs/web57/BACKLOG_PHASE2_LYNKI.md`
- autres documents si mis à jour

---

## Vigilances spéciales

| Sujet | Point d'attention |
|-------|-------------------|
| **Maquette HTML** | Référence de composition, pas contrat backend ni pixel-perfect obligatoire |
| **Honnêteté produit** | Aucun mot plus fort que la preuve réellement portée |
| **Vocabulaire fort** | `certifié` / `garanti` / `conforme` → capacité backend explicite (plan §3.3) |
| **États métier** | Restent visibles, deviennent plus lisibles |
| **États vides nobles** | Vide / partiel / indisponible / proxy — recette obligatoire (plan §8.4) |
| **DS local** | Strictement limité à la Synthèse ; pas de substitution implicite des tokens globaux (T100) |
| **Matrice T99** | **Une seule** source de vérité ; les autres docs = **liens** vers elle — pas de copies parallèles |
| **T100 + T101** | DS plus sobre ≠ états **invisibles** ; avant/après T101 **obligatoire** comme garde-fou perceptibilité |
| **Responsive** | Préserver l’ordre de lecture, pas juste “faire rentrer” |
| **Documentation / CODIR** | V1 honnête, raccord aux exports existants |
| **Non-régression** | Ne pas casser l’ossature S15–S17 (plan §1.1) |

---

## Suite logique

1. **Sprint 19** — extension DS hors Synthèse  
2. **Sprint 19/20** — DOCX plus intégré et surfaces annexes raffinées  
3. **Contrat v0.3+** — consolidation plus large des blocs canoniques

---

## Gel documentaire

| Version | Contenu |
|---------|---------|
| **0.1** | Squelette T99–T104 aligné sur plan S18 v0.1. |
| **1.0** | Gel exécutable : tickets détaillés (checklists, travaux, vigilances), alignement **[PLAN_SPRINT_18_LYNKI.md](PLAN_SPRINT_18_LYNKI.md) v1.0**, [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) v0.1, rapport amont S17 v1.3. |
| **1.1** | **Gel canonique — base d’exécution Sprint 18** : matrice T99 avec **source de vérité unique** (pointeurs ailleurs uniquement) ; **tokens scopés Synthèse** (T100) ; **recette avant/après** états (T101) + vigilance **perceptibilité** (pas d’états trop discrets à rater) ; cas **aucun point d’attention** (T103) ; T104 + réf. UI **v0.3.1** + annexe **`ANNEXE_UI_CIBLE_SYNTHESE_LYNKI_S18.html`** (§3.1 libellés démo). *Validé pour lancement exécution.* |

---

*Fin des tickets d'exécution Sprint 18 — v1.1 gel canonique.*
