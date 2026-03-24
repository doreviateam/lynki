# Spec UX normative v1.1.1 — Addendum robustesse technique

**Date** : mars 2026  
**Référence** : La spec **v1.1** (`SPEC_UX_LINKY_INSTRUMENT_ADAPTATIF_v1.1.md`) reste la base. La **v1.1.1** ajoute les cinq précisions techniques ci-dessous et deux formulations à intégrer dans la lecture de la spec.

**Objectif v1.1.1 :** verrouiller l’implémentation (scrollRoot, anti-oscillation, hydratation, persistance, télémétrie) et clarifier le libellé (seuil scroll, mobile).

---

## Corrections de formulation à appliquer en lecture de la spec v1.1

### 1. Seuil “en haut” du viewport
- **Remplacer** toute mention du type “position top ≤ 100 px” par le nom de constante **`nearTopThresholdPx = 100`** dans la spec et dans le code.
- Usage : réapparition / expansion du header lorsque la position de scroll du `scrollRoot` est à une distance du top ≤ `nearTopThresholdPx`.

### 2. Mobile — passage expanded ↔ compact
- **Préciser** : sur mobile, le passage **expanded ↔ compact** est piloté par la **direction de scroll** et la **stabilité de lecture**, **sans disparition complète** du header.
- Éviter la formulation ambiguë “pas de contrainte de position”.

---

## 7octies. Scroll root officiel

Le comportement adaptatif du chrome (header/footer) doit dépendre d’un **unique `scrollRoot` officiel** défini par l’application.

### Règles
- Le `scrollRoot` peut être `window` ou un conteneur principal dédié.
- Les **scrolls internes de cards, panels ou tableaux** ne doivent **jamais** piloter directement les transitions du chrome.
- En cas d’architecture mixte, préférer un seul conteneur vertical principal pour éviter les réapparitions parasites.

**Objectif :** éviter les comportements divergents entre pages, grandes cards et vues imbriquées.

---

## 7nonies. Hystérésis et anti-oscillation

Pour éviter les effets de “pompage” du header :

- la **réapparition / expansion** ne doit se produire qu’après un **delta cumulé significatif** (ex. &gt; 24 px) ;
- après une transition du chrome, un **cooldown court** (ex. **300 à 500 ms**) peut être appliqué avant d’autoriser une nouvelle transition ;
- les micro-scrolls successifs ne doivent pas provoquer d’alternance rapide entre états.

**Objectif :** garantir une sensation de calme et de continuité pendant la lecture.

---

## 7decies. État initial et hydratation

Au chargement initial de l’écran :

- le header démarre en état **`expanded`** ;
- la détermination fine du mode adaptatif (viewport + hover + pointer) est évaluée **après montage client** ;
- toute transition vers `compact` ou `hidden` doit rester **douce et non brutale**.

**Objectif :** éviter les clignotements, incohérences SSR/client et effets de flash visuel.

---

## 7undecies. Persistance de la préférence `chromePinned`

La préférence utilisateur **`chromePinned`** peut être :

- limitée à la **session courante** **par défaut** ;
- ou persistée localement (ex. `localStorage`) si le produit le juge utile.

**En l’absence de choix explicite, préférer une portée session.**  
Cela évite qu’un utilisateur oublie qu’il a désactivé le comportement automatique il y a longtemps.

---

## 7duodecies. Télémétrie UX minimale

Pour évaluer la pertinence du comportement adaptatif, il est recommandé de mesurer :

- le **nombre de réouvertures manuelles** du header ;
- l’**activation de `chromePinned`** ;
- le **temps passé** dans les états `expanded`, `compact`, `hidden` ;
- l’**ouverture du drawer de trust bar** (mobile) ;
- la **fréquence des passages en état `frozen`** (overlays, filtres, focus).

**Objectif :** arbitrer les timers et comportements sur données réelles d’usage.

---

## Constantes à ajouter au tableau (§ 6 de la spec v1.1)

| Paramètre | Valeur | Note |
|-----------|--------|------|
| **nearTopThresholdPx** | 100 | Seuil de position “en haut” pour réapparition (nom explicite en spec et code). |
| **cooldown après transition** | 300–500 ms | Optionnel ; évite l’accordéon sur micro-scrolls. |

---

## Version et statut

- **Version :** 1.1.1  
- **Statut :** Addendum technique à la spec v1.1 ; **validable pour lancement de l’implémentation**.  
- **Prochaine étape :** Implémentation selon le **plan front consolidé** : `PLAN_IMPLEMENTATION_FRONT_LINKY_CHROME_v1.1.md`.
