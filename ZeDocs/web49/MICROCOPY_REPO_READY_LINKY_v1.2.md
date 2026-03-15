# Microcopy repo-ready — Repositionnement Linky (v1.2)

**Référence :** SPEC_DOREVIA_SUITE_REPOSITIONNEMENT_LINKY_v1.0  
**Document :** MICROCOPY_REPO_READY_LINKY_v1.2  
**Date :** 14 mars 2026  
**Usage :** Copier-coller bloc par bloc dans `units/dorevia-suite` pour implémentation.

**v1.2 — Ajustements post-validation :** texte d'appui hero (« piloter plus sereinement »), bandeau desktop/mobile, promesse « données dispersées », bénéfice « BFR et encours », How it works « fiabilisées », CTA « Voir Linky en action » → ancre visuelle (voir §1 et §3, §11).

---

## Mapping composants → blocs

| Bloc spec | Composant actuel | Fichier |
|-----------|------------------|---------|
| Navigation | Navbar | `src/components/blocks/navbar.tsx` |
| Hero | Hero | `src/components/blocks/hero.tsx` |
| Bandeau preuve | ReassuranceStrip | `src/components/blocks/reassurance-strip.tsx` |
| Tension / problème | ProblemSection | `src/components/blocks/problem-section.tsx` |
| Promesse produit | — | À créer ou insérer après ProblemSection |
| Bénéfices métier | BenefitsSection | `src/components/blocks/benefits-section.tsx` |
| Différenciation | — | À créer ou fusionner |
| Comment ça marche | HowItWorks | `src/components/blocks/how-it-works.tsx` |
| Cibles / cas d'usage | — | À créer ou intégrer dans CTA final |
| Crédibilité | — | À créer (court bloc) |
| CTA final | VoyezDoreviaSection | `src/components/blocks/voyez-dorevia-section.tsx` |

---

## 1. Navigation

**Fichier :** `navbar.tsx` — constante `NAV_LINKS` + CTA.

### Libellés à utiliser

| Clé | Texte final |
|-----|-------------|
| Logo / marque | Dorevia Suite |
| Lien 1 | Comment ça marche |
| Lien 2 | **Voir Linky en action** *(remplacer "Voyez Dorevia en action")* |
| CTA principal | Demander une démo |
| CTA mobile court | Démo *(ou "Demander une démo")* |

### Règle

Le mot **Linky** doit apparaître dans la navigation (lien "Voir Linky en action").

### Ancres

- Comment ça marche → `/#comment-ca-marche`
- **Voir Linky en action** → **`/#linky-en-action`** *(recommandé)* ou vers la première section où le cockpit / mockup Linky est montré. Ne pas envoyer vers `#comment-ca-marche` : ce CTA promet « voir » une démo visuelle, pas une explication « comment ça marche ». Créer une ancre `id="linky-en-action"` sur le bloc hero (aperçu cockpit) ou sur un bloc dédié screenshots/démo.

---

## 2. Hero

**Fichier :** `hero.tsx`

### Contenu à intégrer

| Élément | Texte final |
|---------|-------------|
| **Eyebrow** (au-dessus du H1) | Dorevia Linky |
| **H1** | L'assistant de contrôle de gestion des PME |
| **Sous-titre** | Pilotez la marge, la trésorerie, le BFR et le risque client à partir de données fiables. |
| **Texte d'appui** | Linky aide les dirigeants et équipes finance à voir plus clairement, décider plus vite et piloter plus sereinement. |
| **CTA principal** | Demander une démo |
| **CTA secondaire** | Voir Linky en action *(remplacer "Voir le cockpit")* |
| **Lien CTA secondaire** | `/#linky-en-action` *(voir §1 Ancres — ne pas utiliser `#comment-ca-marche`)* |

### Chrome de l'aperçu cockpit (optionnel)

- Conserver "Dorevia · Linky" dans la barre du mockup.
- Conserver "Aperçu cockpit" ou court équivalent.

---

## 3. Bandeau de preuve (réassurance)

**Fichier :** `reassurance-strip.tsx`

### Contenu à utiliser — deux variantes (responsive)

**Version desktop** (séparateur · entre chaque) :

**Marge · Trésorerie · BFR · Encours clients · Retards · Concentrations**

**Version mobile** (plus courte, lisibilité) :

**Marge · Trésorerie · BFR · Risque client**

Implémentation : afficher la version desktop au-dessus d'un breakpoint (ex. `md:`), la version mobile en dessous.

---

## 4. Bloc tension / problème

**Fichier :** `problem-section.tsx`

### Titre H2

```
Les chiffres existent déjà. La lecture de pilotage, beaucoup moins.
```

*(Remplacer "La vérité financière" par "La lecture de pilotage".)*

### Paragraphe principal

```
Entre l'ERP, la banque, les paiements, les documents et les opérations, la réalité financière se fragmente.

On voit des données.
On voit moins vite :
```

### Points (liste ou cartes, 4 items)

| Texte |
|-------|
| où la marge se forme, |
| où le cash se tend, |
| quels clients concentrent le risque, |
| quelles priorités exigent une action. |

### Encadré de clôture (optionnel, à adapter)

Exemple : *Un cockpit financier rafraîchi et lisible en moins de 5 secondes. Linky s'appuie sur des données fiables pour restituer une lecture unique et exploitable.*

*(Réduire la place de "Dorevia fiabilise" dans cette phrase pour garder Linky en premier plan.)*

---

## 5. Bloc promesse produit (nouveau)

**À créer** (nouveau composant ou section dans la page) — à placer après le bloc tension.

### Titre H2

```
Linky transforme des données dispersées en lecture financière claire.
```

*(« Données » plutôt que « flux » pour la landing : plus universel, moins technique.)*

### Texte

```
Pas un dashboard de plus.
Pas un simple reporting.

Un assistant de contrôle de gestion qui aide les PME à :

• lire plus vite,
• hiérarchiser les signaux utiles,
• sécuriser les décisions,
• piloter avec plus de sérénité.
```

---

## 6. Bloc bénéfices métier

**Fichier :** `benefits-section.tsx`

### Titre H2

```
Ce que Linky vous aide à voir immédiatement
```

*(Remplacer "Ce que Dorevia change au quotidien".)*

### Sous-titre / intro (optionnel)

Supprimer ou raccourcir l'intro actuelle ; privilégier une phrase du type :  
*Marge, trésorerie, BFR, risque client : une lecture structurée pour piloter.*

### Sous-blocs (4 cartes)

| Titre | Description |
|-------|-------------|
| **Marge** | Où elle se crée, où elle se dégrade, où elle mérite votre attention. |
| **Trésorerie** | Les tensions, les écarts et les signaux faibles à traiter avant qu'ils deviennent critiques. |
| **BFR et encours** | Les encours, les retards, les concentrations et leur impact sur votre équilibre financier. |
| **Risque client** | Les dépendances, anomalies de portefeuille et priorités de recouvrement. |

*(« BFR et encours » pour une entrée plus accessible pour les dirigeants PME.)*

### Ligne de preuve sous les cartes (optionnel)

Exemple : *Données fiables · Lecture structurée · Pilotage actionnable*

*(Remplacer "Traçabilité · Flux à la source · Cockpit lisible" si souhaité.)*

---

## 7. Bloc différenciation (nouveau)

**À créer** — court bloc entre bénéfices et "Comment ça marche".

### Titre H2

```
Voir des chiffres ne suffit pas. Il faut pouvoir les lire.
```

### Texte

```
Linky ne se contente pas d'afficher des indicateurs.

Il aide à comprendre :

• ce qui se passe,
• pourquoi cela compte,
• où agir en priorité.
```

### Baseline de clôture

```
Moins de lecture brute. Plus de pilotage.
```

---

## 8. Comment ça marche

**Fichier :** `how-it-works.tsx`

### Titre H2

```
Une lecture plus claire commence par une base plus fiable.
```

*(Remplacer "Comment ça marche".)*

### Phrase d'intro (sous le titre)

```
Les données sont connectées, fiabilisées, puis restituées dans Linky pour une lecture exploitable.
```

*(Remplacer la phrase actuelle sur "coffre-fort numérique".)*

### Étapes (3 cartes)

| Numéro | Titre | Description |
|--------|-------|-------------|
| 01 | **Connecter** | ERP, paiements, banque, POS, documents, comptabilité. |
| 02 | **Fiabiliser** | Les données utiles au pilotage sont consolidées, fiabilisées et préparées. |
| 03 | **Piloter** | Linky restitue une lecture exploitable de la marge, du cash, du BFR et du risque client. |

### Rôle / sous-titre des étapes (optionnel)

- 01 — *Source* ou laisser tel quel  
- 02 — *Preuve* ou *Fiabilité*  
- 03 — *Cockpit* ou *Pilotage*

### Phrase de preuve (sous les 3 étapes, discrète)

```
En arrière-plan, l'infrastructure Dorevia renforce la cohérence des données avant leur restitution dans Linky.
```

### Bloc DIVA (conserver)

- Titre : **DIVA**
- Texte : *Assiste la lecture avec analyse et alertes.*

---

## 9. Bloc cibles / cas d'usage (optionnel)

**À créer** si besoin d'une section dédiée — sinon intégrer dans le CTA final.

### Titre H2

```
Pensé pour les PME qui veulent mieux piloter
```

### Sous-blocs (3)

| Titre | Texte court |
|-------|-------------|
| **Dirigeants** | Pour décider avec une vision plus claire de la performance et des tensions. |
| **RAF / DAF** | Pour structurer la lecture de gestion sans multiplier les retraitements. |
| **PME en croissance** | Pour garder la maîtrise malgré la complexité croissante des flux. |

---

## 10. Bloc crédibilité (optionnel)

**À créer** — court, avant le CTA final.

### Titre H2

```
Des décisions plus solides reposent sur des données plus fiables.
```

### Texte

```
La valeur de Linky ne vient pas seulement de ce qu'il montre.
Elle vient de la qualité de la lecture qu'il rend possible.

Quand la donnée est plus cohérente, le pilotage devient :

• plus lisible,
• plus réactif,
• plus crédible.
```

---

## 11. CTA final

**Fichier :** `voyez-dorevia-section.tsx`

### Titre H2

```
Voyez ce que Linky peut changer dans votre pilotage
```

*(Remplacer "Voyez comment Dorevia peut s'appliquer à votre activité".)*

### Sous-titre

```
Découvrez comment Dorevia Linky peut aider votre entreprise à piloter plus clairement la marge, la trésorerie, le BFR et le risque client.
```

### Option A — 2 CTAs (spec)

Réduire à 2 cartes ou 2 boutons principaux :

| CTA | Lien |
|-----|------|
| **Demander une démo** (principal) | `/contact` |
| **Voir Linky en action** (secondaire) | `/#linky-en-action` *(pas `#comment-ca-marche` : ce CTA doit mener au visuel cockpit/démo, pas à l'explication)* |

### Option B — Garder 3 cartes en adaptant les libellés

| Titre carte | Description | CTA | Lien |
|-------------|-------------|-----|------|
| Voir Linky en action | Aperçu du cockpit financier Linky. | Voir Linky en action | `/#linky-en-action` |
| Explorer des cas d'usage | Trésorerie, BFR, risque client, lecture multi-flux. | Découvrir les cas d'usage | `/#benefices` |
| Parler de votre contexte | Échangeons sur vos outils, vos flux et vos points de friction. | Demander une démo | `/contact` |

### Réassurance (sous les CTAs)

```
Démonstration sur cas réel ou simulé, selon votre contexte.
```

*(Remplacer "Choisissez selon votre niveau de maturité" si souhaité.)*

---

## 12. SEO et métadonnées

**Fichier :** `app/layout.tsx` ou balises dans `page.tsx` / metadata export.

| Élément | Texte |
|---------|-------|
| **Title** | Dorevia Linky — L'assistant de contrôle de gestion des PME |
| **Meta description** | Pilotez la marge, la trésorerie, le BFR et le risque client avec Dorevia Linky, l'assistant de contrôle de gestion des PME, fondé sur des données fiables. |
| **H1** (page) | L'assistant de contrôle de gestion des PME |

### H2 prioritaires (pour structure SEO)

- Les chiffres existent déjà. La lecture de pilotage, beaucoup moins.
- Linky transforme des données dispersées en lecture financière claire.
- Ce que Linky vous aide à voir immédiatement.
- Une lecture plus claire commence par une base plus fiable.

---

## 13. Checklist de remplacements rapides

| Emplacement | Ancien | Nouveau |
|-------------|--------|---------|
| Hero H1 | Pilotez votre entreprise sur des données financières fiables | L'assistant de contrôle de gestion des PME |
| Hero sous-titre | Dorevia relie vos flux ERP, POS… | Pilotez la marge, la trésorerie, le BFR et le risque client à partir de données fiables. |
| Hero texte d'appui | …agir plus tôt | …piloter plus sereinement |
| Hero CTA secondaire | Voir le cockpit | Voir Linky en action (lien `/#linky-en-action`) |
| Nav lien 2 | Voyez Dorevia en action | Voir Linky en action (lien `/#linky-en-action`) |
| ProblemSection H2 | La vérité financière, beaucoup moins | La lecture de pilotage, beaucoup moins |
| BenefitsSection H2 | Ce que Dorevia change au quotidien | Ce que Linky vous aide à voir immédiatement |
| HowItWorks H2 | Comment ça marche | Une lecture plus claire commence par une base plus fiable. |
| VoyezDoreviaSection H2 | Voyez comment Dorevia peut s'appliquer… | Voyez ce que Linky peut changer dans votre pilotage |
| ReassuranceStrip | Flux multi-sources, Données traçables… | Desktop : 6 items (Marge · … · Concentrations) ; mobile : Marge · Trésorerie · BFR · Risque client |
| Bloc promesse H2 | (nouveau) | Linky transforme des **données** dispersées… |
| Bénéfice 3 titre | BFR | BFR et encours |
| HowItWorks étape 2 | …consolidés, tracés et préparés | …consolidées, fiabilisées et préparées |

---

## 14. Ordre des sections recommandé (page)

1. Hero  
2. Bandeau réassurance (preuve courte)  
3. Bloc tension / problème  
4. Bloc promesse produit *(nouveau)*  
5. Bloc bénéfices métier (Marge, Trésorerie, BFR et encours, Risque client)  
6. Bloc différenciation *(nouveau)*  
7. Comment ça marche (Connecter / Fiabiliser / Piloter)  
8. Bloc cibles *(optionnel)*  
9. Bloc crédibilité *(optionnel)*  
10. CTA final  

---

## 15. Version finale validée (v1.2) — copier-coller

Blocs verrouillés après validation produit. Utiliser tel quel en implémentation.

### Hero

**Eyebrow** — Dorevia Linky  

**H1** — L'assistant de contrôle de gestion des PME  

**Sous-titre** — Pilotez la marge, la trésorerie, le BFR et le risque client à partir de données fiables.  

**Texte d'appui** — Linky aide les dirigeants et équipes finance à voir plus clairement, décider plus vite et piloter plus sereinement.

---

### Problem section

**H2** — Les chiffres existent déjà. La lecture de pilotage, beaucoup moins.

Entre l'ERP, la banque, les paiements, les documents et les opérations, la réalité financière se fragmente.

On voit des données.  
On voit moins vite :

* où la marge se forme,
* où le cash se tend,
* quels clients concentrent le risque,
* quelles priorités exigent une action.

---

### Promesse produit

**H2** — Linky transforme des données dispersées en lecture financière claire.

Pas un dashboard de plus.  
Pas un simple reporting.

Un assistant de contrôle de gestion qui aide les PME à :

* lire plus vite,
* hiérarchiser les signaux utiles,
* sécuriser les décisions,
* piloter avec plus de sérénité.

---

### Benefits

**H2** — Ce que Linky vous aide à voir immédiatement

**Marge** — Où elle se crée, où elle se dégrade, où elle mérite votre attention.

**Trésorerie** — Les tensions, les écarts et les signaux faibles à traiter avant qu'ils deviennent critiques.

**BFR et encours** — Les encours, les retards, les concentrations et leur impact sur votre équilibre financier.

**Risque client** — Les dépendances, anomalies de portefeuille et priorités de recouvrement.

---

### How it works

**H2** — Une lecture plus claire commence par une base plus fiable.

**Intro** — Les données sont connectées, fiabilisées, puis restituées dans Linky pour une lecture exploitable.

**01 — Connecter** — ERP, paiements, banque, POS, documents, comptabilité.

**02 — Fiabiliser** — Les données utiles au pilotage sont consolidées, fiabilisées et préparées.

**03 — Piloter** — Linky restitue une lecture exploitable de la marge, du cash, du BFR et du risque client.

**Phrase discrète** — En arrière-plan, l'infrastructure Dorevia renforce la cohérence des données avant leur restitution dans Linky.

---

### CTA « Voir Linky en action »

**Règle UX** — Le lien doit pointer vers une ancre où l'utilisateur **voit** Linky (cockpit, mockup, démo), pas vers « Comment ça marche ». Utiliser `/#linky-en-action` (id sur le hero ou bloc visuel dédié).

---

## 16. Notes d'implémentation (post-freeze)

Points à verrouiller en implémentation, sans rouvrir la copy.

| # | Point | Action |
|---|--------|--------|
| 1 | **Ancre `#linky-en-action`** | Créer un vrai point d'arrivée visuel : soit sur le mockup hero (wrapper du bloc cockpit), soit sur un bloc dédié screenshots / aperçu cockpit. Ne pas laisser théorique. |
| 2 | **Ancre `#benefices`** | Poser `id="benefices"` sur la section bénéfices (cité dans l'option B du CTA final). Déjà présent dans le code actuel ; vérifier qu'il est bien exposé. |
| 3 | **Apostrophes / typo** | Uniformiser en typographie française : **L'assistant** (apostrophe courbe U+2019), pas L'assistant (straight quote). Vérifier tous les textes affichés (H1, meta, etc.). |
| 4 | **Blocs optionnels** | Garder la landing tendue. Ordre recommandé : Hero → Reassurance → Problem → Promesse → Benefits → Différenciation → How it works → CTA final. Ajouter **Cibles** ou **Crédibilité** seulement si un étage visuel manque. |
| 5 | **Visibilité « Linky »** | Garder le mot **Linky** très visible dans les zones scrollées (hero, bénéfices, how it works, CTA) pour ancrer le nom produit. |

---

*Document v1.2 — prêt pour implémentation. Référence : SPEC_DOREVIA_SUITE_REPOSITIONNEMENT_LINKY_v1.0. Ajustements post-validation intégrés. Voir SPEC_IMPLEMENTATION_FRONT_LINKY_v1.0 pour la spec front composant par composant.*
