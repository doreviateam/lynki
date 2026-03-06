# Rapport d'analyse — SPEC_UX_CELEBRATION_LINKY_v1.0

**Document analysé :** SPEC_UX_CELEBRATION_LINKY_v1.0.md  
**Date du rapport :** 15 février 2026  
**Objectif :** Analyse de conformité, cohérence et faisabilité — avis et recommandations

---

## 1. Synthèse exécutive

La spécification définit une célébration **sobre et professionnelle** lors du passage à 100 % de fiabilité bancaire sur la carte Trésorerie validée. L'intention est **parfaitement alignée** avec le positionnement Linky (cockpit financier, modernité maîtrisée, pas de gamification). La spec est claire, les interdictions sont explicites. Quelques **précisions techniques** et **clarifications de périmètre** sont recommandées avant implémentation.

**Verdict :** Spec validée, avec recommandations mineures.

---

## 2. Analyse de cohérence

### 2.1 Alignement avec les référentiels Linky

| Référentiel | Cohérence |
|-------------|-----------|
| **RAPPORT_ENSEMBLE** (positionnement global) | ✅ « Pas gamifié », « Sérénité », « Modernité maîtrisée » — la célébration respecte ces principes |
| **DIRECTION_ARTISTIQUE** (couleur informationnelle) | ✅ Transition orange→vert sémantique (attention→validé) ; pas de couleur décorative |
| **SPEC_TYPOGRAPHY** | ✅ Poids 500/600, pas d'emoji — conforme |
| **BRAND_LOCK** | ✅ Pas de glow, gradient — interdits rappelés dans la spec |
| **SPEC_LINKY_DECOUPAGE** | ✅ « Pédagogie progressive », « Rigueur » — célébration = confirmation cognitive sobre |

### 2.2 Points forts

- **Intention claire** : « Un signal de maîtrise », « Une preuve » — formulation cohérente avec la promesse Dorevia
- **Déclencheur précis** : `fiabilite_bancaire === 100%` ET `etat_precedent < 100%` — évite les re-déclenchements intempestifs
- **Interdictions explicites** : Confettis, glow, shake, emoji — réduit les dérives
- **Son OFF par défaut** : Choix prudent

---

## 3. Clarifications et recommandations

### 3.1 Déclencheur — Mapping données

La spec utilise `fiabilite_bancaire`. Dans l'implémentation actuelle :

- **API** : `reconciliation_rate` (ou `reliability_rate` côté Vault)
- **Cas limites** : Si `total === 0`, `reconciliation_rate` peut être `null` — que faire ? La spec devrait préciser : **ne pas déclencher** si `total === 0`.

**Recommandation :** Ajouter en §2 :

```
ET total > 0 (éviter célébration sur structure vide)
```

### 3.2 Texte contextualisé — Périmètre exact

La spec dit « Remplacer : En attente 100 % » par « 100 % rapproché ». Actuellement :

- Le donut affiche des labels dynamiques (« Rapproché X% », « En attente Y% »)
- Quand 100 % rapproché : un seul secteur vert, ou « Rapproché 100 % » + « En attente 0 % »

**Recommandation :** Préciser où s'affiche le message :

- **Option A** : Sous le donut (ligne de résumé d'interprétation, adaptée au cas 100 %)
- **Option B** : Au centre du donut (texte centré)
- **Option C** : Remplacement du libellé dans la légende / tooltip

L'option **A** (ligne sous le donut) est la plus cohérente avec la ligne « Lecture : répartition sur la période sélectionnée » déjà en place — on l'adapte dynamiquement au cas 100 %.

### 3.3 Transition « Orange → Vert »

Le donut actuel utilise `--positive` (vert) et `--warning` (orange). Quand 100 % rapproché :

- Un seul secteur (tout vert) — pas de « transition » orange→vert sur le donut lui-même
- La transition pourrait s'appliquer au **stroke** du secteur unique (si on part d'un état précédent orange)

**Recommandation :** Clarifier :

- Si le donut affiche **deux secteurs** (Rapproché + En attente) et que le secteur « En attente » disparaît au passage à 100 %, la « transition » pourrait être l'animation de disparition du segment orange (fade-out 350 ms).
- Si le donut affiche **un seul secteur** quand 100 %, la transition s'appliquerait au fill/stroke de ce secteur (ex. départ orange→vert en 350 ms).

### 3.4 Micro-luminosité — Cible

La spec indique `filter: brightness(1.08)` sur le donut. Avec Recharts, le `Pie` est un SVG — on peut appliquer un filtre sur le parent ou sur le `Cell`. Attention : le filtre affecte tout le sous-arbre (texte, tooltip si imbriqué).

**Recommandation :** Cibler uniquement le `<g>` ou le conteneur du `Pie`, pas la section entière (éviter d'éclaircir la ligne « Lecture : … »).

### 3.5 Persistance de l'état précédent

Pour `etat_precedent < 100%`, il faut stocker la valeur avant le re-render. Avec un polling toutes les 10 minutes, le risque de « rater » le passage est faible. Une `useRef` ou un `useState` précédent suffit.

**Recommandation :** Documenter en annexe technique :

```ts
// Exemple : prevRateRef.current stocke la valeur avant setData
if (rate === 100 && prevRateRef.current < 100) → déclencher célébration
```

---

## 4. Points d'attention implémentation

| Élément | Difficulté | Note |
|---------|-------------|------|
| Détection passage à 100 % | Faible | `useRef` pour état précédent |
| Transition stroke/fill Recharts | Moyenne | `Cell` peut avoir `stroke` animé via CSS transition |
| Micro-luminosité 800 ms | Faible | `transition` sur le conteneur |
| Texte « 100 % rapproché » | Faible | Adapter la ligne d'interprétation ou ajouter un bloc conditionnel |
| Une seule fois par passage | Faible | Flag `celebrationShownRef` pour ne pas rejouer |

### 4.1 Composants concernés

- `TreasuryCardWithPolling.tsx` — Détection du passage, état précédent
- `DualSeriesChart.tsx` — Option : prop `celebrating100` pour appliquer style/transition sur le Pie
- Ou wrapper spécifique `TreasuryDonutCelebration` si la logique devient trop lourde dans DualSeriesChart

---

## 5. Recommandations prioritaires

### P0 (avant implémentation)

1. **Préciser le cas `total === 0`** — Ne pas déclencher.
2. **Préciser l'emplacement du texte** « 100 % rapproché » — Recommandation : ligne sous le donut (comme la ligne d'interprétation actuelle).

### P1 (clarifications utiles)

3. **Décrire la transition concrète** — Quel élément exact anime (secteur orange qui disparaît ? secteur unique qui passe orange→vert ?).
4. **Annexe technique** — Exemple de gestion `prevRate` / `celebrationShown`.

### P2 (optionnel)

5. **Accessibilité** — Si micro-luminosité : vérifier que le contraste reste suffisant (WCAG AA).
6. **Réduction de mouvement** — Respecter `prefers-reduced-motion` : désactiver l'impulsion luminosity si l'utilisateur a activé cette préférence.

---

## 6. Verdict final

| Critère | Note |
|---------|------|
| Alignement positionnement Linky | ⭐⭐⭐⭐⭐ |
| Clarté de la spec | ⭐⭐⭐⭐ (quelques flous) |
| Faisabilité technique | ⭐⭐⭐⭐ |
| Risque de dérive UX | Faible (interdictions claires) |

**Conclusion :** La spec est **solide** et prête pour l'implémentation après intégration des clarifications P0. L'intention « sobre, pro, stable » est parfaitement incarnée. Recommandation : **valider la spec** avec un addendum court (§2 + §4) intégrant les précisions ci-dessus, puis planifier l'implémentation.

---

## 7. Références

| Document | Chemin |
|----------|--------|
| Spec analysée | `ZeDocs/web20/SPEC_UX_CELEBRATION_LINKY_v1.0.md` |
| Rapport ensemble | `ZeDocs/web20/RAPPORT_ENSEMBLE_CHOIX_DESIGN_LINKY.md` |
| Direction artistique | `ZeDocs/web15/DIRECTION_ARTISTIQUE_LINKY.md` |
| Implémentation Treasury | `units/dorevia-linky/components/TreasuryCardWithPolling.tsx` |
| DualSeriesChart | `units/dorevia-linky/components/DualSeriesChart.tsx` |

---

**Fin du rapport**
