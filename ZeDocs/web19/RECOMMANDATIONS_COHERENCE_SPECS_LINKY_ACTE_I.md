# RECOMMANDATIONS — Cohérence Specs Linky (Acte I)

**Date :** 15 février 2026  
**Objet :** Décisions formelles suite au Rapport de cohérence  
**Périmètre :** Logo, Typographie, Découpage graphiques, Direction artistique  
**Statut :** Décisions validées — Implémenté et déployé v1.59 (15 février 2026)

---

## 1. Principes directeurs

Dorevia Linky suit désormais une doctrine claire :

- Rigueur structurelle
- Modernité maîtrisée
- Stabilité cognitive
- Pédagogie progressive
- Aucune dérive esthétique non justifiée

Toute divergence entre spec et implémentation doit être tranchée rapidement pour préserver la cohérence système.

---

## 2. Décisions officielles

### 2.1 SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE — §1 Logo

**Problème :** Mention obsolète « dégradé, lueur » contradictoire avec BRAND_LOCK v1.0.

**Décision :** Remplacer par :  
« Le logo permet le retour à l'accueil (hover : brightness 1.04, conforme BRAND_LOCK v1.0). »

**Priorité :** P0 — correction immédiate (appliquée).

---

### 2.2 Libellé Mode : « % » vs « Répartition % »

**Constat :** SPEC_DECOUPAGE v1.1 → « Répartition % » ; SPEC_CARD / Impl → « % ».

**Décision :** Uniformisation sur `Montants | Répartition %`.

**Justification :** Réduction ambiguïté CFO, cohérence pédagogique, alignement spec v1.1.

**Priorité :** P1

---

### 2.3 Bloc Granularité — Une seule option disponible

**Constat :** Spec v1.1 : bloc désactivé (visible) ; Impl : bloc masqué.

**Décision :** Afficher le bloc Granularité même si une seule option, en état désactivé (grisé, non cliquable).

**Priorité :** P1

---

### 2.4 Pédagogie (SPEC_DECOUPAGE v1.1)

| Élément | Décision | Priorité |
|---------|----------|----------|
| Ligne résumé dynamique | Implémenter | P1 |
| Bouton « Pourquoi ? » (popover) | Implémenter (socle DLP) | P1 |
| Tooltips enrichis | Implémenter | P2 |
| Toast first-time | Backlog | P3 |

---

### 2.5 DIRECTION_ARTISTIQUE vs SPEC_TYPOGRAPHY

**Décision :** Alignement strict sur SPEC_TYPOGRAPHY — maximum 700, suppression de toute utilisation 800+.

**Priorité :** P1

---

## 3. Synthèse des décisions

| Sujet | Décision |
|-------|----------|
| Phrase logo obsolète | Correction immédiate ✓ |
| Mode | « Répartition % » partout |
| Granularité unique | Bloc visible mais désactivé |
| Ligne résumé | Implémentation prioritaire |
| Bouton « Pourquoi ? » | Implémentation prioritaire |
| Poids 800 | Suppression, max 700 |

---

## 4. Vision consolidée

Linky devient :

- Un cockpit financier structuré
- Une interface stable et prédictible
- Une application moderne mais non décorative
- Un produit pédagogique sans surcharge
- Une base prête pour DLP

---

## 5. Implémentation (v1.59)

Éléments P1 intégrés et déployés (lab + stinger) :

1. ✓ Ligne résumé dynamique — positionnée **en bas à gauche du graphique**
2. ✓ Bloc granularité désactivé si une seule option
3. ✓ Bouton « Pourquoi ? » avec popover (whyContent sur carte Cash)
4. ✓ Harmonisation « Répartition % »
5. ✓ Correction typo 800 → 700 (DIRECTION_ARTISTIQUE)

---

## 6. Prochaine étape

Nouvelle revue de cohérence (Acte II) — tooltips enrichis, toast first-time (backlog P2–P3).

---

**Fin du document — Acte I**
