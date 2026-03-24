# Spec UX normative v1.1 — Linky, instrument adaptatif

**Date** : mars 2026  
**Contexte** : Linky n’est pas un site responsive classique mais un **instrument adaptatif** avec 3 modes d’usage distincts. Le comportement à l’écran contribue autant à la qualité perçue que le design visuel.

**v1.0** : base verrouillable (breakpoints, états, timers, desktop/tablette/mobile).  
**v1.1** : robustesse produit et implémentation — mode d’entrée (viewport + pointeur), machine d’états, préférence utilisateur, modes démo/kiosque, contraintes mobile, anti–layout-shift, clarifications (chrome-lock, condition de scroll).  
**v1.1.1** : voir `SPEC_UX_LINKY_INSTRUMENT_ADAPTATIF_v1.1.1.md` (scrollRoot, hystérésis, état initial, persistance chromePinned, télémétrie).

---

## 1. Principe directeur

| Device   | Mode                    | Objectif principal                          |
|----------|-------------------------|---------------------------------------------|
| **Desktop** | Pilotage / lecture analytique longue | Interface qui s’efface au profit de la lecture |
| **Tablette** | Consultation active / démo / réunion | Éviter les comportements “malins” qui surprennent |
| **Mobile** | Contrôle rapide / vérification / réassurance | **Stabilité** et **lisibilité immédiate** |

**Règle normative :**

> **Desktop : disparition**  
> **Tablette : contraction**  
> **Mobile : persistance compacte**

Le comportement ne doit pas être “le même en plus petit”.

---

## 2. Breakpoints et modes

| Zone                      | Largeur viewport | Mode UX        | Libellé court   |
|---------------------------|------------------|----------------|------------------|
| Desktop                   | ≥ 1280 px        | Immersif       | Mode lecture     |
| Tablette / petit laptop   | 768 px – 1279 px | Compact pilotage | Mode consultation |
| Mobile                    | &lt; 768 px       | Contrôle rapide | Mode vérification |

**Référence d’implémentation :**  
- `sm`: 640 px, `md`: 768 px, `lg`: 1024 px, `xl`: 1280 px (Tailwind par défaut).  
- Seuils décisionnels : **1280 px** (desktop) et **768 px** (mobile / tablette).  
- La largeur seule ne suffit pas : voir **§ 7bis** (mode d’entrée : hover, pointer).

---

## 3. États UX globaux

Trois états formels à nommer dans le produit et la doc :

| État              | Description |
|-------------------|-------------|
| **Mode navigation** | Header complet, tous les filtres et actions visibles. |
| **Mode lecture**    | Header réduit ou masqué selon device ; contenu prioritaire. |
| **Mode confiance**  | Footer (barre de confiance) toujours accessible, détail possible au tap (mobile). |

---

## 4. Comportement par zone d’écran

### 4.1 Desktop (≥ 1280 px, avec hover + pointer fine — cf. § 7bis)

**Objectif :** cockpit immersif, interface qui se tait pendant la lecture.

#### Header
- **Auto-masquage : oui** (sauf si `chromePinned` ou état `frozen` — cf. § 7ter, § 7quater).
- **Délai avant masquage : 4500 ms** (configurable, ex. `NEXT_PUBLIC_LINKY_CHROME_HIDE_AFTER_MS`).
- **Réapparition déclenchée par :**
  - scroll vers le haut (cf. § 5 pour la condition précise : direction haut, delta cumulé &gt; 24 px, position top ≤ 100 px),
  - souris dans la zone haute (bandeau / trigger zone),
  - focus clavier (focus dans la page ou raccourci dédié si présent).
- **Ne jamais masquer si :** état **frozen** (filtre ouvert, menu/overlay ouvert, champ focus, ou composant avec `data-chrome-lock="true"` — cf. § 7ter).
- Quand masqué : **fine ligne interactive** en haut (zone de réapparition au survol).

#### Footer
- **Toujours visible**, barre fine permanente.
- Contenu minimal : Source Vault, total scellé, P95, sources actives (Odoo, POS, etc.).
- Bruit visuel réduit au strict nécessaire.

#### Main content
- Quand le header disparaît : contenu remonte **franchement** (pas de place réservée).
- Transition : **250–300 ms**, douce, sans rebond ni effet flashy.
- Sensation visée : passage en **mode lecture**, pas simple “saut” du header.
- **Aucun layout shift perceptible** (cf. § 7septies).

---

### 4.2 Tablette (768 px – 1279 px, ou desktop sans hover/pointer fine)

**Objectif :** équilibre présentation / manipulation tactile. Pas de disparition complète du header.

#### Header
- **Pas de masquage total.** Comportement : **contraction** après inactivité (état `compact`).
- **Délai avant contraction : 5000 ms** (sauf si `chromePinned` ou `frozen`).
- État normal : header présent, **plus fin** que desktop.
- Après inactivité : header **se contracte** (logo/titre réduit, filtres secondaires masqués, badge période conservé, nav condensée).
- Pas de logique fondée sur le **hover** : déclencheurs = scroll retour vers le haut, tap sur bandeau / zone haute sticky, changement de vue ou filtre.

#### Footer
- Toujours visible, **version compacte**.
- Priorité : total scellé, source, état des connecteurs. P95 optionnel selon place.

#### Charts / cards
- Éviter zones trop hautes et **double scroll**.
- Priorité au contenu métier ; actions secondaires en haut de card ou dans un menu discret.

---

### 4.3 Mobile (&lt; 768 px)

**Objectif :** vérification rapide, pas pilotage exhaustif. Stabilité et lisibilité immédiate.

#### Header
- **Pas de disparition totale.**
- **Header sticky compact.**
- Comportement :
  - en haut de page : header **complet** ;
  - dès qu’on scroll vers le bas : header **condensé** ;
  - au retour vers le haut : header **complet**.
- **Condensation : oui. Disparition complète : non.**
- 100 % utilisable au doigt, sans dépendre du hover.
- **Safe areas** : respect de `env(safe-area-inset-top)` (cf. § 7quinquies).

#### Footer
- **Version mobile simplifiée** : une ligne très compacte.
- Exemple : `Vault ✓ 1307 | Odoo ✓ | POS ✓`.
- Au **tap** : ouverture d’un panneau détaillé ou mini drawer “confiance système”.
- **Safe areas** : respect de `env(safe-area-inset-bottom)` (cf. § 7quinquies).

#### Cards
- **Mono-intention** : une idée forte par écran.
- Moins de densité visible à la fois.
- Priorité aux KPI synthétiques avant le détail.
- Graphes : conservés, contrôles visibles réduits ; onglets **très lisibles au doigt**.

---

## 5. Règles de scroll et déclencheurs

### 5.1 Desktop
- **Réapparition header :** scroll near top (condition ci-dessous), `mousemove` zone haute, focus clavier (et raccourci si défini).
- **Pas de réapparition** sur scroll “en cours” dans le contenu (éviter reset du timer en lecture longue / grande card).

### 5.2 Condition précise “scroll retour vers le haut” (éviter oscillations)
- **Réapparition** du header seulement si **toutes** les conditions suivantes sont réunies :
  - **direction du scroll = haut** ;
  - **delta cumulé de scroll &gt; 24 px** ;
  - **position top ≤ 100 px** (desktop / tablette) ; sur mobile (sticky compact), pas de contrainte de position pour le passage expanded ↔ compact.
- En cas de doute, ne pas déclencher la réapparition.

### 5.3 Tablette / mobile
- **Déclencheurs valides :** scroll retour vers le haut (condition ci-dessus), tap sur bandeau / poignée visible, tap sur zone haute sticky, changement de vue ou filtre.
- **Aucune logique fondée sur le hover.**

### 5.4 Piège à éviter
- Header qui apparaît/disparaît trop souvent.
- Transitions qui bougent pendant la lecture.
- Scroll interne qui relance trop d’états UI.

**Règle :** *L’interface doit se taire pendant que l’utilisateur lit.*

**Recommandation d’implémentation :** s’appuyer sur largeur viewport, `matchMedia("(hover: hover)")`, `matchMedia("(pointer: fine)")`, direction et vélocité minimale du scroll, état global `chromeLocked` (cf. § 7ter).

---

## 6. Timers et constantes recommandées

| Paramètre              | Desktop   | Tablette | Mobile   |
|------------------------|-----------|----------|----------|
| Délai avant masquage   | 4500 ms   | 5000 ms (contraction) | N/A (pas de masquage) |
| Seuil scroll “en haut” | 100 px    | 100 px   | 100 px   |
| Delta scroll min. réapparition | 24 px | 24 px    | 24 px    |
| Hauteur zone trigger (haut) | 72 px (desktop hover) | N/A hover | N/A hover |
| Transition header      | 250–300 ms | 250–300 ms | 250–300 ms |

Variables d’environnement proposées (ex.) :
- `NEXT_PUBLIC_LINKY_CHROME_HIDE_AFTER_MS` (desktop).
- Breakpoint desktop/tablette/mobile cohérent avec le design system (ex. 1280 / 768).

---

## 7. Exceptions et accessibilité

- **Ne pas masquer / ne pas contracter le header** si l’état **frozen** est actif (cf. § 7ter) : filtre ouvert, menu/overlay ouvert, champ focus, ou **tout composant overlay marqué `data-chrome-lock="true"`** (menu, popover, select, datepicker, drawer, modal). Convention unique pour le front.
- **Focus clavier** : réapparition du header possible à la prise de focus (ou via raccourci dédié).
- **Réduction de mouvement :** respecter `prefers-reduced-motion` (optionnel v1) : désactiver ou réduire les transitions / auto-masquage si l’utilisateur a demandé moins d’animation.
- **Zone de réapparition** : quand le header est masqué (desktop), la fine ligne en haut doit être **focusable et activable au clavier** (libellé accessible, ex. “Afficher le bandeau”).

---

## 7bis. Détermination du mode d’interaction

La **largeur seule** ne suffit pas à déterminer le comportement UX.  
Le moteur d’adaptation doit tenir compte de :
- la largeur viewport ;
- la capacité de survol (`hover`) ;
- la précision du pointeur (`pointer`).

### Règles
- **Desktop immersif** (auto-hide, disparition) **uniquement** si :
  - largeur **≥ 1280 px**
  - **ET** `(hover: hover)` (media query)
  - **ET** `(pointer: fine)` (media query)

- **Tablette / consultation** (contraction, pas de disparition) si :
  - largeur entre **768 px** et **1279 px**,  
  - **ou** largeur ≥ 1280 px mais **sans** `(hover: hover)`,  
  - **ou** avec `(pointer: coarse)` (ex. iPad Pro 1366 px, tablette hybride).

- **Mobile / vérification** si :
  - largeur **&lt; 768 px**.

**En cas de doute, préférer le mode le plus stable** (tablette ou mobile) au mode immersif.

---

## 7ter. Machine d’états du chrome

Le chrome écran (header) doit être implémenté comme une **machine d’états explicite** :

| État       | Description |
|------------|-------------|
| **expanded** | Header complet. |
| **compact**  | Header contracté (tablette/mobile). |
| **hidden**   | Header masqué (desktop uniquement). |
| **frozen**   | État prioritaire : aucun timer ne s’exécute. |

### Règles
- **`frozen` est prioritaire** sur tous les autres états.
- **Tant que `frozen = true`**, aucun timer de masquage ou de contraction ne s’exécute.
- **`frozen = true`** si :
  - filtre ouvert,
  - menu / overlay ouvert,
  - champ avec focus,
  - **ou** un composant marqué **`data-chrome-lock="true"`** est actif (menu, popover, select, datepicker, drawer, modal).

### Transitions par mode
- **Desktop** (immersif) : `expanded` → `hidden`.
- **Tablette** : `expanded` → `compact`.
- **Mobile** : `expanded` → `compact`.

---

## 7quater. Préférence utilisateur “pinned”

Une préférence locale facultative **`chromePinned`** peut être proposée (ex. “Garder le bandeau visible”, ou “Ne pas masquer le header pendant cette session”).

### Règle
- Si **`chromePinned = true`** :
  - **aucun** auto-hide sur desktop,
  - **aucune** contraction automatique sur tablette/mobile.
- Le footer reste inchangé.

Utile en démo, en formation, et pour les utilisateurs qui préfèrent des repères fixes.

---

## 7quinquies. Modes démo et kiosque

### Mode présentation (`presentationMode`)
- Optionnel, **desktop uniquement**.
- Comportement : header auto-hide plus rapide ou plus sobre, footer permanent, densité visuelle optimisée, interactions secondaires limitées.
- Usage : démonstration client, grand écran, réunion.

### Mode kiosque (`kioskMode`)
- Optionnel, plus radical.
- Header absent par défaut, trust bar minimale, navigation contrôlée.
- Usage : borne, affichage dédié.

À prévoir dès la conception pour les usages bureau / démo.

---

## 7sexies. Contraintes mobile (clavier, safe areas)

### Clavier virtuel
- **Quand un champ reçoit le focus sur mobile :**
  - **suspendre** les transitions header/footer ;
  - **éviter** tout recalcul de hauteur qui perturbe la saisie.

### Safe areas
- Le **header sticky** et le **footer mobile** doivent respecter :
  - **`env(safe-area-inset-top)`** ;
  - **`env(safe-area-inset-bottom)`**.
- Évite les recouvrements sur iPhone (encoche, barre d’accueil).

---

## 7septies. Absence de layout shift (CLS)

- **Quand le header change d’état**, il faut éviter :
  - saut visuel brutal ;
  - reflow excessif ;
  - déplacement inattendu du contenu pendant la lecture.

**Règle normative :**
- Transition **sans CLS perceptible** (Cumulative Layout Shift).
- **Pas de réorganisation horizontale**.
- **Pas de double recalcul visible** de hauteur.

En pratique : wrappers et transitions propres, réservation / libération d’espace prévisible.

---

## 8. Synthèse normative par device

| Élément      | Desktop (≥ 1280 + hover + fine) | Tablette (768–1279 ou sans hover) | Mobile (&lt; 768)        |
|-------------|----------------------------------|------------------------------------|---------------------------|
| Header      | Auto-hide 4,5 s                  | Contraction 5 s                   | Sticky compact au scroll |
| Footer      | Permanent complet                | Permanent compact                  | Mini trust bar, expansible au tap |
| Réapparition| Hover top, scroll top, focus     | Scroll top, tap bandeau/vue       | Scroll top, tap bandeau |
| Densité     | Élevée                           | Moyenne                           | Faible, mono-intention par écran |
| Grandes cards | Autorisées                     | Oui, sans double scroll           | Simplifiées, contrôles gros |

---

## 9. Référence avec l’implémentation actuelle

- **Déjà en place (voir NOTE_LINKY_HEADER_FOOTER_PREUVES_ET_AUTOHIDE.md) :**
  - Desktop : header masqué après 3 s, réapparition au scroll near top + zone haute, footer toujours visible, contenu qui prend la place du header.
- **À aligner avec la spec v1.1 :**
  - Délai desktop **4500 ms**.
  - **Mode d’entrée** : `matchMedia("(hover: hover)")`, `matchMedia("(pointer: fine)")` + largeur (desktop immersif seulement si 1280 + hover + fine).
  - **Machine d’états** : expanded / compact / hidden / frozen ; état `frozen` et convention `data-chrome-lock="true"`.
  - **Préférence** `chromePinned`.
  - **Condition de scroll** : direction haut, delta &gt; 24 px, position ≤ 100 px.
  - **Tablette / mobile** : contraction sans disparition ; footer mobile condensé + drawer au tap.
  - **Mobile** : clavier (suspendre transitions), safe areas.
  - **Anti–layout-shift** : transitions sans CLS.
  - **Modes** présentation / kiosque (optionnel).
  - **Accessibilité** : prefers-reduced-motion, zone de réapparition focusable.

---

## 10. Version et statut

- **Version :** 1.1  
- **Statut :** Normatif pour les évolutions Linky (header, footer, modes, robustesse multi-device et implémentation).  
- **v1.0** : base verrouillable (breakpoints, timers, comportements par device).  
- **v1.1** : détermination du mode (viewport + pointeur), machine d’états, pinned, démo/kiosque, contraintes mobile, anti-CLS, clarifications chrome-lock et scroll.  
- **v1.1.1** : addendum robustesse technique — **référence pour l’implémentation** : voir `SPEC_UX_LINKY_INSTRUMENT_ADAPTATIF_v1.1.1.md` (scrollRoot, hystérésis/cooldown, état initial, persistance chromePinned, télémétrie ; formulations `nearTopThresholdPx` et mobile).

**Prochaine étape :** Implémentation selon v1.1 + v1.1.1 (scrollRoot unique, constantes, media queries, états, `data-chrome-lock`, préférence session/localStorage, safe areas, cooldown, télémétrie).
