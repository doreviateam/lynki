# Rapport de refonte design premium — Landing Dorevia Suite

*Document motivant les choix d’implémentation suite à la revue design experte (mode produit / conversion / crédibilité fintech). Référence : échanges revue experte + `spec_dorevia_landing_page.md`, implémentation dans `units/dorevia-suite`.*

**Objectif** : faire passer la landing de « sérieuse et cohérente » à « produit financier premium qui inspire immédiatement confiance », sans changer le message ni la structure narrative.

---

## Contexte de la revue

La revue a identifié :

- **Points forts** : positionnement clair, structure narrative saine (promesse → problème → fonctionnement → bénéfices → CTA), vocabulaire métier, cockpit visible dans le hero.
- **Leviers** : hero pas encore « iconique », tension visuelle insuffisante, crédibilité bonne mais pas « institutionnelle », bloc « Comment ça marche » perfectible en mise en scène, CTA à hiérarchiser, page pas assez « scan-friendly », manque de micro-preuves.

Les **5 priorités** retenues ont été traduites en choix d’implémentation ci-dessous, avec motivation pour chaque décision.

---

## Non-objectifs

La refonte est **tenue et volontaire**. Elle exclut explicitement :

- **Toute refonte du message de fond** : les textes, la structure narrative et le parcours restent alignés sur la spec éditoriale.
- **Toute multiplication des animations** : les effets existants (motion, apparitions) sont conservés ou légèrement ajustés, pas généralisés.
- **Tout ajout de preuve sociale artificielle** : pas de logos clients fictifs, pas de témoignages non cadrés, pas de chiffres décoratifs.
- **Toute complexification du parcours** : un seul CTA primaire, ancres inchangées, pas de nouvelles étapes ni de tunnels supplémentaires.

L’objectif est d’**augmenter la valeur perçue** du socle existant, pas de le remplacer ni de le surcharger.

---

## Priorité 1 — Hero : faire du cockpit un moment visuel fort

### Problème identifié

Le hero dit les bonnes choses mais reste un peu « plat » ; la zone cockpit est utile sans être perçue comme une pièce maîtresse premium. Il manque une sensation de **produit désirable** et de **standing fintech**.

### Choix effectués et motivation

| Choix | Motivation |
|-------|------------|
| **Hiérarchie visuelle renforcée** | Séparation nette entre headline, sous-texte, CTA principal et aperçu produit (espacements différenciés, tailles de texte plus contrastées). Le lecteur doit capter en quelques secondes : promesse → explication courte → action principale → preuve visuelle. |
| **CTA principal unique et dominant dès l’entrée** | Un seul bouton primaire (Demander une démo) dans le hero, le secondaire (Voir le cockpit) en outline. Réduit la dilution de l’intention et renvoie à la priorité 4 (hiérarchie CTA). |
| **Carte cockpit plus raffinée** | Plus de respiration (padding généreux), typographie des métriques plus affirmée, micro-contrastes (bordures légères, ombre portée discrète), barre d’app et sidebar conservées pour le « produit vivant ». La carte doit donner l’impression d’un extrait d’outil réel, pas d’un bloc démo générique. |
| **Espacement vertical généreux** | `pt-28 / pb-20` et variantes desktop augmentent la respiration entre titre, sous-titre, CTAs et carte. Un hero trop serré sous-vend la valeur perçue ; un hero aéré renvoie à la maîtrise et à la confiance. |

### Résultat visé

Un hero qui communique immédiatement **confiance**, **netteté**, **maîtrise** et **standing logiciel de pilotage**, avec une lecture claire : promesse → court explicatif → action principale → preuve produit.

---

## Priorité 2 — Tension visuelle et rythme des sections

### Problème identifié

La page est rationnelle et sage mais un peu uniforme ; elle inspire la rigueur sans assez « valoriser » visuellement. Il manque une **variation de rythme** et des **signatures visuelles** entre les blocs.

### Choix effectués et motivation

| Choix | Motivation |
|-------|------------|
| **Alternance fonds / densité** | Sections avec fond léger (`bg-muted/20` ou équivalent) vs sections sur fond de page : problème, mécanisme (Comment ça marche), bénéfices, Voyez Dorevia ne sont plus visuellement identiques. Le lecteur distingue immédiatement les séquences du récit : promesse, réassurance, mécanisme, bénéfices, conversion. |
| **Séparations plus fines** | Bordures ou filets discrets entre sections au lieu d’empiler des blocs sans respiration. Renforce la sensation de structure maîtrisée et évite l’effet « mur de contenu ». |
| **Réassurance (strip) déjà en place** | Le bloc entre Hero et Problème (Flux multi-sources, Données traçables, Cockpit lisible, Démo) reste un premier palier de respiration et de crédibilité ; il participe au rythme « promesse → réassurance → problème ». |

### Résultat visé

Une page qui alterne clairement **sections aérées** et **sections plus denses**, avec une identité visuelle légèrement différente pour problème / mécanisme / bénéfices / CTA final, tout en restant sobre et à **présence premium** (crédibilité structurée, pas de surcharge).

---

## Priorité 3 — « Comment ça marche » en bloc signature

### Problème identifié

Le contenu (01 Capturer, 02 Sceller, 03 Piloter) est très bon, mais le bloc peut être lu comme une simple suite de cartes marketing. Il doit devenir **ultra pédagogique et ultra élégant**, avec une **logique de progression visuelle** et une lecture évidente en quelques secondes.

### Choix effectués et motivation

| Choix | Motivation |
|-------|------------|
| **Ligne de flux / trajectoire** | Relier les 3 étapes par une ligne ou un fil conducteur visuel (ligne horizontale, connecteurs) pour incarner le flux « source → preuve → cockpit ». Le bloc devient un **mini diagramme de confiance** plutôt que trois cartes côte à côte. |
| **Rôles visuels explicites** | Chaque étape a un rôle clair : **Capturer** = sources / ingestion, **Sceller** = preuve / traçabilité, **Piloter** = cockpit / décision. Numérotation (01, 02, 03) et icônes déjà présentes ; on renforce la grille et l’alignement pour une lecture scan rapide. |
| **Espacement et conteneur dédié** | Le bloc est dans un conteneur ou un fond légèrement distinct pour le faire ressortir comme « pièce maîtresse » du discours. Pas de surcharge graphique : sobriété et grille impeccable pour un **standing logiciel stratégique** (crédible sans être figé). |

### Résultat visé

Un bloc « Comment ça marche » **distinctif** : trois colonnes nettes, reliées par une trajectoire visuelle, lisibles en quelques secondes, et qui renvoient immédiatement à la chaîne de confiance Dorevia (capture → scellement → pilotage).

---

## Priorité 4 — Hiérarchie des CTA

### Problème identifié

Plusieurs formulations (Demander une démo, Voir le cockpit, Découvrir les cas d’usage, Parler de votre contexte) peuvent disperser l’intention. Il faut **un CTA primaire clair** et des secondaires explicites.

### Choix effectués et motivation

| Choix | Motivation |
|-------|------------|
| **Un seul CTA primaire sur toute la page** | **Demander une démo** est le seul bouton pleine couleur (orange) dans la navbar, le hero et le bloc « Voyez Dorevia » (carte bleue dédiée). Tous pointent vers `/contact`. Conversion principale = prise de contact / démo. |
| **CTA secondaires en outline ou lien** | « Voir le cockpit » et « Découvrir les cas d’usage » restent présents mais en style secondaire (outline, ou lien avec flèche) et mènent vers les ancres idoines (`#comment-ca-marche`, `#benefices`). Ils servent le prospect « curieux » ou « en exploration » sans rivaliser avec la démo. |
| **« Parler de votre contexte »** | Intégré comme libellé ou variante contextuelle sur la page contact ou dans la carte « Demander une démo » du bloc Voyez Dorevia, plutôt que comme un axe de même niveau partout. Évite la multiplication de boutons de même poids. |

### Résultat visé

Une hiérarchie de conversion **évidente** : un chemin principal (Demander une démo) et des chemins secondaires (découverte du cockpit et des cas d’usage) clairement différenciés visuellement et sémantiquement.

---

## Priorité 5 — Micro-preuves et lisibilité « scan »

### Problème identifié

Pour un décideur (DAF, direction), la page doit être compréhensible en une dizaine de secondes : ce que c’est, pourquoi c’est différent, en quoi c’est fiable, ce qu’on gagne, quoi faire ensuite. Paragraphes denses ou peu balisés nuisent à cette lecture rapide.

### Choix effectués et motivation

| Choix | Motivation |
|-------|------------|
| **Intertitres courts et phrases courtes** | Où c’est possible sans trahir la spec, privilégier des sous-titres en une ligne et des phrases de 1 à 2 lignes. Les mots-clés métier (traçabilité, flux, cockpit, rapprochements) restent saillants. |
| **Espace vertical généreux** | Marges et paddings entre sections et à l’intérieur des cartes augmentés si besoin. La lisibilité est elle-même un **signal de maîtrise** pour une offre B2B finance. |
| **Micro-preuves visuelles** | Dans le hero : badges « Actualisé », « 5 flux connectés ». Dans d’autres blocs : indicateurs ou mentions courtes (flux connectés, preuve de traçabilité, types d’environnements) pour ancrer la crédibilité sans surcharger. Pas de logos clients imposés ; l’accent est mis sur la **preuve produit** et la clarté des bénéfices. |

Les micro-preuves ne sont pas décoratives : elles répondent à **trois questions implicites du décideur** — *est-ce réel ?* (produit existant, cockpit visible), *est-ce fiable ?* (traçabilité, flux à la source, preuves scellées), *est-ce déjà structuré ?* (cockpit lisible, métriques claires). Chaque élément (badge, ligne de preuve, indicateur) sert au moins l’une de ces trois intentions.

### Résultat visé

Une page **scan-friendly** : balisage clair, respiration suffisante, micro-preuves (badges, chiffres, mentions) qui renforcent la crédibilité et permettent une compréhension rapide de la promesse et du passage à l’action.

---

## Synthèse des changements implémentés

| Priorité | Fichiers / zones impactés | Nature des changements |
|----------|---------------------------|-------------------------|
| 1. Hero | `hero.tsx` | Hiérarchie titre/sous-texte/CTA, espacements, raffinement carte cockpit (spacing, typo, micro-contrastes). |
| 2. Rythme | `page.tsx`, sections (problem, how-it-works, benefits, voyez-dorevia) | Fonds alternés (sections avec `bg-muted/20` ou équivalent), séparations discrètes. |
| 3. Comment ça marche | `how-it-works.tsx` | Ligne de flux entre les 3 étapes, conteneur/bloc mis en avant, grille et alignements renforcés. |
| 4. CTA | `hero.tsx`, `voyez-dorevia-section.tsx`, navbar | Un seul bouton primaire « Demander une démo » (orange), autres en outline/lien ; carte démo du bloc Voyez Dorevia en primaire. |
| 5. Scan & preuves | Tous les blocs concernés | Intertitres et phrases courts où pertinent, espacement vertical, conservation/renforcement des badges et micro-indicateurs (hero, réassurance). |

---

## Effet attendu après refonte

Après refonte, la landing vise :

- **Fond produit / message** : inchangé (déjà à 8/10).
- **Structure** : maintenue, avec rythme visuel amélioré.
- **Maturité design perçue** : montée vers 7,5–8/10 (présence premium, crédibilité structurée, scan-friendly).
- **Impact business** : meilleure perception de fiabilité dès l’arrivée, chemin de conversion clarifié (un CTA primaire), lecture rapide pour décideurs (DAF, direction).

---

## Détail technique des changements (implémenté)

- **Hero** (`hero.tsx`) : `pt-32 pb-24 md:pt-40 md:pb-32` ; `mt-8` titre→sous-texte, `mt-12` sous-texte→CTA, `mt-20` CTA→cockpit ; carte cockpit `rounded-2xl`, `p-8 md:p-12`, métriques en `text-xl font-bold`, cellules `rounded-xl p-5` ; ombre `shadow-black/5`, ring `ring-black/[0.04]`.
- **Rythme** : `ProblemSection` et `BenefitsSection` en `bg-muted/15` et `py-24 lg:py-32` ; `HowItWorks` et `VoyezDoreviaSection` en `py-24 md:py-32` / `py-24 lg:py-32`.
- **Comment ça marche** (`how-it-works.tsx`) : ligne horizontale de connexion entre les 3 colonnes (absolute, `bg-border`, masquée en mobile) ; conteneur `relative` pour le flux 01→02→03.
- **CTA** : inchangé — hero et navbar gardent un seul CTA primaire « Demander une démo » ; bloc Voyez Dorevia : carte bleue = CTA démo, deux autres en outline.
- **Micro-preuves / scan** : ligne de preuve sous les cartes bénéfices : « Traçabilité · Flux à la source · Cockpit lisible » ; espacements verticaux augmentés sur l’ensemble des sections.

---

## Conclusion

Cette refonte ne modifie ni le discours ni le parcours ; elle **augmente la perception de fiabilité**, **clarifie le chemin de conversion** et donne à Dorevia une **présence plus premium, plus lisible et plus crédible** dès les premières secondes. Le design y est traité comme un levier de confiance et de conversion, pas comme du vernis — en cohérence avec un produit qui parle de données financières fiables et de pilotage.

*Document rédigé pour motivation des choix ; les modifications concrètes sont appliquées dans le code de `units/dorevia-suite`. Annexe de décision produit / front — v2.*
