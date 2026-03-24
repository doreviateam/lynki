# Spec UX normative v1.0 — Linky, instrument adaptatif

**Date** : mars 2026  
**Contexte** : Linky n’est pas un site responsive classique mais un **instrument adaptatif** avec 3 modes d’usage distincts. Le comportement à l’écran contribue autant à la qualité perçue que le design visuel.

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

### 4.1 Desktop (≥ 1280 px)

**Objectif :** cockpit immersif, interface qui se tait pendant la lecture.

#### Header
- **Auto-masquage : oui.**
- **Délai avant masquage : 4500 ms** (configurable, ex. `NEXT_PUBLIC_LINKY_CHROME_HIDE_AFTER_MS`).
- **Réapparition déclenchée par :**
  - scroll vers le haut (position &lt; 100 px du top),
  - souris dans la zone haute (bandeau / trigger zone),
  - focus clavier (focus dans la page ou raccourci dédié si présent).
- **Ne jamais masquer si :**
  - un filtre (société, période, vue) est ouvert,
  - un menu déroulant ou overlay est ouvert,
  - un champ de formulaire a le focus,
  - un tooltip ou popover important est visible.
- Quand masqué : **fine ligne interactive** en haut (zone de réapparition au survol).

#### Footer
- **Toujours visible**, barre fine permanente.
- Contenu minimal : Source Vault, total scellé, P95, sources actives (Odoo, POS, etc.).
- Bruit visuel réduit au strict nécessaire.

#### Main content
- Quand le header disparaît : contenu remonte **franchement** (pas de place réservée).
- Transition : **250–300 ms**, douce, sans rebond ni effet flashy.
- Sensation visée : passage en **mode lecture**, pas simple “saut” du header.

---

### 4.2 Tablette (768 px – 1279 px)

**Objectif :** équilibre présentation / manipulation tactile. Pas de disparition complète du header.

#### Header
- **Pas de masquage total.** Comportement : **contraction** après inactivité.
- **Délai avant contraction : 5000 ms.**
- État normal : header présent, **plus fin** que desktop.
- Après inactivité : header **se contracte** (ex. logo/titre réduit, filtres secondaires masqués, badge période conservé, nav latérale condensée).
- Pas de logique basée sur le **hover** : déclencheurs = scroll retour vers le haut, tap sur bandeau / zone haute sticky, changement de vue ou filtre.

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

#### Footer
- **Version mobile simplifiée** : une ligne très compacte.
- Exemple : `Vault ✓ 1307 | Odoo ✓ | POS ✓`.
- Au **tap** : ouverture d’un panneau détaillé ou mini drawer “confiance système”.
- Desktop/tablette : footer explicite ; mobile : footer condensé **expansible**.

#### Cards
- **Mono-intention** : une idée forte par écran.
- Moins de densité visible à la fois.
- Priorité aux KPI synthétiques avant le détail.
- Graphes : conservés, contrôles visibles réduits ; onglets (Semaine / Mois / Montants / Répartition %) **très lisibles au doigt**.

---

## 5. Règles de scroll et déclencheurs

### 5.1 Desktop
- **Réapparition header :** scroll near top (≤ 100 px), `mousemove` zone haute, focus clavier (et raccourci si défini).
- **Pas de réapparition** sur scroll “en cours” dans le contenu (éviter reset du timer en lecture longue / grande card).

### 5.2 Tablette / mobile
- **Déclencheurs valides :** scroll retour vers le haut, tap sur bandeau / poignée visible, tap sur zone haute sticky, changement de vue ou filtre.
- **Aucune logique fondée sur le hover.**

### 5.3 Piège à éviter
- Header qui apparaît/disparaît trop souvent.
- Transitions qui bougent pendant la lecture.
- Scroll interne qui relance trop d’états UI.

**Règle :** *L’interface doit se taire pendant que l’utilisateur lit.*

---

## 6. Timers et constantes recommandées

| Paramètre              | Desktop   | Tablette | Mobile   |
|------------------------|-----------|----------|----------|
| Délai avant masquage   | 4500 ms   | 5000 ms (contraction) | N/A (pas de masquage) |
| Seuil scroll “en haut” | 100 px    | 100 px   | 100 px   |
| Hauteur zone trigger (haut) | 72 px (desktop hover) | N/A hover | N/A hover |
| Transition header      | 250–300 ms | 250–300 ms | 250–300 ms |

Variables d’environnement proposées (ex.) :
- `NEXT_PUBLIC_LINKY_CHROME_HIDE_AFTER_MS` (desktop).
- Breakpoint desktop/tablette/mobile cohérent avec le design system (ex. 1280 / 768).

---

## 7. Exceptions et accessibilité

- **Ne pas masquer le header** si :
  - filtre ouvert, menu ouvert, champ focus, tooltip/popover important visible.
- **Focus clavier** : réapparition du header possible à la prise de focus (ou via raccourci dédié).
- **Réduction de mouvement :** respecter `prefers-reduced-motion` (optionnel v1) : désactiver ou réduire les transitions / auto-masquage si l’utilisateur a demandé moins d’animation.
- **Zone de réapparition** : quand le header est masqué (desktop), la fine ligne en haut doit être **focusable et activable au clavier** (et avoir un libellé accessible, ex. “Afficher le bandeau”).

---

## 8. Synthèse normative par device

| Élément      | Desktop (≥ 1280)      | Tablette (768–1279)   | Mobile (&lt; 768)        |
|-------------|------------------------|------------------------|---------------------------|
| Header      | Auto-hide 4,5 s        | Contraction 5 s       | Sticky compact au scroll |
| Footer      | Permanent complet      | Permanent compact     | Mini trust bar, expansible au tap |
| Réapparition| Hover top, scroll top, focus | Scroll top, tap bandeau/vue | Scroll top, tap bandeau |
| Densité     | Élevée                 | Moyenne               | Faible, mono-intention par écran |
| Grandes cards | Autorisées           | Oui, sans double scroll | Simplifiées, contrôles gros |

---

## 9. Référence avec l’implémentation actuelle

- **Actuellement en place (voir NOTE_LINKY_HEADER_FOOTER_PREUVES_ET_AUTOHIDE.md) :**
  - Desktop : header masqué après 3 s, réapparition au scroll near top + zone haute, footer toujours visible, contenu qui prend la place du header.
- **À aligner avec la présente spec :**
  - Passer le délai desktop à **4500 ms**.
  - Introduire la **différenciation desktop / tablette / mobile** (pas de masquage total tablette/mobile ; contraction tablette, persistance compacte mobile).
  - Ajouter les **exceptions** (filtre ouvert, menu ouvert, focus, tooltip).
  - Footer mobile : version condensée + panneau/drawer au tap.
  - Option `prefers-reduced-motion` pour l’accessibilité.

---

## 10. Version et statut

- **Version :** 1.0  
- **Statut :** Normatif pour les évolutions Linky (header, footer, modes desktop/tablette/mobile).  
- **Prochaine étape :** Implémentation par breakpoint (constantes, conditions sur largeur viewport, comportements header/footer et footer mobile expansible).
