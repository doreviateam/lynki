# Spécification — Landing Page Dorevia

*Document à amender au fil des itérations. Source : mind map `landingPage.txt` (Freeplane). Dernière mise à jour : bloc « Voyez Dorevia en action », douleur 1.1.2.3 (ponctuation), structure Footer.*

---

## 1. Vue d’ensemble

### 1.1 Objectif

La landing page présente Dorevia aux PME et à leurs équipes (DAF, comptabilité, pilotage). Dorevia fiabilise les données financières avant le pilotage : la plateforme capture les flux à la source, les scelle dans un coffre-fort numérique (Vault), puis les restitue dans un cockpit lisible (Linky). L’objectif est d’inciter à **demander une démo**.

### 1.2 Cible

- **PME** ayant des flux financiers multi-sources (ERP, paiements, banque, documents, points de vente).
- **DAF, équipes comptables, experts-comptables** en quête d’une vision financière plus fiable, traçable et exploitable pour le pilotage.

### 1.3 Fil narratif (socle du discours)

1. **Valeur** : Dorevia aide à piloter sur des données financières prouvables (cockpit, fiabilisation, preuves, infrastructure de confiance).
2. **Douleur** : Les entreprises pilotent souvent avec des données dispersées, difficiles à rapprocher et pas toujours fiables. On pilote avec moins de confiance ; on perd du temps à vérifier ; on décide parfois sur une base incomplète ou difficile à justifier.
3. **Solution** : Dorevia capture les données à la source, les scelle dans un coffre-fort numérique, puis les restitue dans un cockpit clair, traçable et exploitable (Vault, Linky, DIVA).
4. **Bénéfices** : Voir plus clair, décider avec plus de confiance, gagner du temps sur la lecture financière. *Variante :* « gagner du temps sur les rapprochements et la lecture financière » (plus concret, renvoie à la douleur déjà posée).
5. **Passage à l’action** : Voyez si Dorevia peut ouvrir de nouvelles possibilités pour votre activité ou votre écosystème (explorer, découvrir, en parler).

### 1.4 URL de publication

**suite.doreviateam.com** — URL de publication de la landing page (et de la page contact). *DNS activé.*

### 1.5 Stack technique

**Next.js + Mainline** — duo retenu pour le site (landing + page contact).

- **Mainline** : template Next.js 15 + Tailwind 4 + shadcn/ui, pensé pour un **site marketing / landing page** plutôt que pour un back-office lourd.
- Cohérent avec l’objectif Dorevia (vitrine, formulaire contact → Odoo 19 CRM, expérience visiteur premium).

### 1.6 Look & feel — référence design

**Référence principale : [Akurateco](https://akurateco.com)**

**Intentions visuelles à reprendre**

- Hiérarchie typographique nette
- Fond clair et rendu premium
- Sections aérées
- CTAs visibles mais sobres
- Cartes bien séparées
- Visuels produit intégrés comme preuves d’interface
- Ton B2B sérieux, lisible, maîtrisé

**À éviter**

- Surcharge visuelle
- Effets « startup flashy »
- Jargon fintech inutile
- Trop grand nombre de sections secondaires
- Rendu trop générique de template

**Traduction pour Dorevia**

- Univers visuel centré sur la confiance, la lisibilité et le pilotage
- Écrans Linky utilisés comme preuves produit
- Palette sobre, compatible fintech / gouvernance
- Mise en avant de la structure Capturer / Sceller / Piloter

---

## 2. Structure de la page

**Cadre (toujours visibles ou en tête)** : **Header (navbar)** — logo, CTA « Demander une démo », navigation optionnelle vers les sections.

**Ordre des blocs de contenu :**

| Ordre | Bloc | Rôle |
|-------|------|------|
| 1 | **Hero** | Accroche, promesse, visuel produit, CTA principal |
| 2 | **Le problème** | Ancrage de la douleur, transition vers la solution |
| 3 | **Comment ça marche** | Mécanique en 3 étapes + DIVA |
| 4 | **Bénéfices** | Ce que Dorevia change au quotidien (3 bénéfices) |
| 5 | **Voyez Dorevia en action** | Inviter à explorer, découvrir et échanger sur son cas d’usage ; CTA démo |
| 6 | **Footer** | Phrase courte + CTA « Demander une démo » + « Nous contacter » |

---

## 3. Spécification des blocs

### 3.0 Header (navbar)

**Rôle** : Identifier la marque, donner un accès rapide au CTA principal et, optionnellement, à la navigation vers les sections. Rester sobre pour une landing : ne pas surcharger.

| Élément | Contenu / comportement |
|--------|------------------------|
| **Logo** | Dorevia — cliquable, renvoie vers le haut de page (ou accueil). |
| **Navigation (optionnelle)** | Liens d’ancrage vers les sections : Comment ça marche, Bénéfices, Voyez Dorevia en action. Ou absence de liens pour un header minimal (logo + CTA uniquement). |
| **CTA principal** | Demander une démo — visible et mis en avant (bouton). |
| **Comportement** | **Recommandation :** barre sticky discrète (CTA restant visible) si le design reste léger — éviter une barre lourde. Sur mobile : logo + CTA visibles ; menu hamburger uniquement si liens d’ancrage présents. |

**Recommandation par défaut (ne pas surcharger la navbar) :**

| Contexte | Composition |
|----------|-------------|
| **Desktop** | Logo à gauche · **2 liens d’ancrage max** au centre ou à droite : **Comment ça marche** + **Voyez Dorevia en action** (le premier rassure, le second active) · **CTA « Demander une démo »** à droite. |
| **Mobile** | Logo + CTA visible ; hamburger seulement si les 2 ancres sont conservées. |

*Alternatives :* 0 lien (header minimal logo + CTA) ou 2 liens différents à trancher. Pas plus de 2 liens pour une landing.

---

### 3.1 Bloc Hero

**Rôle** : Donner la promesse principale et inciter au CTA.

| Élément | Contenu |
|--------|---------|
| **Titre** | Pilotez votre entreprise sur des données financières fiables |
| **Sous-titre** | Dorevia relie vos flux ERP, POS, paiements et documents pour produire une vision financière traçable, exploitable et utile au pilotage. |
| **Visuel produit** | Aperçu du cockpit financier Dorevia (Linky) sur des flux réels ou simulés. À préciser : écran Linky (dashboard, filtre Exercice à date, carte Trésorerie, preuves scellées) ; option « données de démo » si tenant démo. |
| **CTA principal** | Demander une démo |
| **CTA secondaire (optionnel)** | Voir le cockpit (lien vers démo vidéo ou capture Linky) |

---

### 3.2 Bloc Le problème

**Rôle** : Formuler la douleur (données dispersées, peu fiables) et enchaîner sur la solution.

| Élément | Contenu |
|--------|---------|
| **Titre section** | **Voir les chiffres ne suffit pas pour bien piloter** *(variante interne :* « Vous pilotez avec des données dispersées et peu fiables ? » *)* |
| **Accroche** | Les données financières sont réparties entre l’ERP, le POS, les paiements, la banque, les documents et la comptabilité. Les rapprocher prend du temps, et la vision de l’activité reste souvent partielle, fragile et peu traçable. |
| **Point 1** | Données réparties entre plusieurs sources : ERP, POS, paiements, banque, comptabilité, terrain. |
| **Point 2** | Rapprochements longs et lecture de l’activité plus fragile. |
| **Point 3** | Décisions parfois prises sur une base incomplète ou difficile à justifier. |
| **Transition** | Un cockpit financier rafraîchi et lisible en moins de 5 secondes. Dorevia fiabilise vos flux avant le pilotage et restitue une vision unique, traçable et exploitable. |

---

### 3.3 Bloc Comment ça marche

**Rôle** : Expliquer la chaîne produit en 3 étapes (Capturer, Sceller, Piloter) + DIVA.

| Élément | Contenu |
|--------|---------|
| **Titre section** | Comment ça marche |
| **Accroche** | Dorevia capture les données à la source, les scelle dans un coffre-fort numérique, puis les restitue dans un cockpit financier clair, traçable et exploitable. |
| **Étape 1** | **Capturer** — L’activité naît de sources hétérogènes : ERP, POS, paiements, banque, comptabilité, points de vente. |
| **Étape 2** | **Sceller** — Dorevia Vault capture, horodate et scelle les événements financiers utiles pour en préserver la traçabilité. |
| **Étape 3** | **Piloter** — Linky restitue un cockpit clair pour le pilotage. |
| **Couche additionnelle** | DIVA assiste la lecture avec analyse et alertes. |

---

### 3.4 Bloc Bénéfices

**Rôle** : Traduire la valeur en bénéfices concrets au quotidien.

*Note design :* prévoir **3 cartes bien séparées** (un bénéfice par carte) pour éviter un bloc trop textuel.

| Élément | Contenu |
|--------|---------|
| **Titre section** | Ce que Dorevia change au quotidien |
| **Accroche** | Dorevia ne se contente pas d’afficher des chiffres. La plateforme aide vos équipes à voir plus clair, à décider avec plus de confiance et à gagner du temps sur la lecture financière de l’activité. |
| **Bénéfice 1** | **Voir plus clair sur l’activité.** Une seule vision financière, plus lisible et plus cohérente, à partir de flux jusque-là dispersés entre ERP, POS, paiements, banque et documents. |
| **Bénéfice 2** | **Décider avec plus de confiance.** Les données sont capturées à la source, traçables et exploitables, ce qui renforce la fiabilité des indicateurs utilisés pour piloter. |
| **Bénéfice 3** | **Gagner du temps sur les rapprochements.** Moins de vérifications manuelles, moins de recoupements fragiles, et une lecture plus rapide des écarts, des paiements et de la trésorerie. |

---

### 3.5 Bloc Voyez Dorevia en action

**Rôle** : Clore le récit en invitant à explorer Dorevia sur son cas d’usage, à découvrir où la plateforme peut servir, et à en parler (démo, contact). Ancrage fil narratif 1.1.5.

**Version de travail par défaut (bloc codable) :**

| Élément | Contenu |
|--------|---------|
| **Titre section** | Voyez comment Dorevia peut s’appliquer à votre activité |
| **Accroche** | Découvrez le cockpit, explorez des cas d’usage concrets, ou échangeons sur votre contexte métier. |
| **Carte 1** | **Voir le cockpit** — Aperçu guidé du cockpit financier Dorevia. CTA : **Voir le cockpit** |
| **Carte 2** | **Explorer des cas d’usage** — Trésorerie, paiements, rapprochements, lecture multi-flux. CTA : **Découvrir les cas d’usage** |
| **Carte 3** | **Parler de votre contexte** — Échangeons sur vos outils, vos flux et vos points de friction. CTA : **Demander une démo** |

*Variantes éditoriales (titres plus compacts) :* « Voyez où Dorevia peut vous servir », « Voyez Dorevia en action sur votre cas d’usage ». À trancher en design.

---

### 3.6 Footer

**Rôle** : Rester très simple — rappel de la promesse, CTA, contact. Ne pas surcharger. Cohérent avec le Hero (phrase courte) et la navbar (CTA).

| Élément | Contenu |
|--------|---------|
| **Phrase courte** | Pilotez votre entreprise sur des données financières plus fiables. |
| **CTA** | Demander une démo |
| **Contact** | Nous contacter — **pointe vers la page Contactez-nous** (page premium connectée Odoo 19 CRM). Voir `spec_dorevia_landing_contact.md`. |

**Structure / mise en page** : une seule zone ou deux lignes (ligne 1 : phrase + CTA ; ligne 2 : contact). À trancher en design. Liens légaux (mentions, confidentialité) et copyright : optionnels, à ajouter seulement si besoin (ex. une ligne discrète sous le contact).

---

## 4. Références et évolutions

- **Source des textes** : `ZeDocs/web41/landingPage.txt` (export mind map Freeplane).
- **Avis d’expert** : `ZeDocs/web41/AVIS_EXPERT_LANDING_PAGE.md` (recommandations, ajustements, coquilles).
- **Page Contact (Contactez-nous)** : `ZeDocs/web41/spec_dorevia_landing_contact.md` — page premium connectée Odoo 19 CRM (création lead uniquement), formulaire + blocs réassurance et projection.
- **Spec d’implémentation front** : `ZeDocs/web41/spec_dorevia_landing_implementation.md` — mapping Mainline → sections, composants, navigation, routes `/` et `/contact`, formulaire → Odoo CRM, règles UI.
- **URL de publication** : **suite.doreviateam.com** (landing + contact ; DNS activé).
- **Évolutions prévues** : **Header (3.0)** : recommandation par défaut en place (2 liens : Comment ça marche + Voyez Dorevia en action ; CTA à droite ; sticky discret). **Bloc 3.5** : version de travail par défaut en place (3 cartes : Voir le cockpit, Découvrir les cas d’usage, Demander une démo) ; à préciser en implémentation : destinations des liens (cockpit, cas d’usage, page contact / démo). **Hero** : visuel à définir. **CTA secondaire** et variantes éditoriales à trancher. **Footer (3.6)** : trois éléments en place. Pour le passage au build : voir **spec d’implémentation front** (`spec_dorevia_landing_implementation.md`).

---

*Document vivant — à amender au fil des itérations.*
