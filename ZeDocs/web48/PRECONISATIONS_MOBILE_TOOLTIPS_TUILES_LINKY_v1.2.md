# Préconisations — Optimisation mobile des tooltips tuiles Linky (v1.2)

**Produit :** Dorevia Linky (vue Synthèse)  
**Date :** 13 mars 2026  
**Référence :** ZeDocs/web47 — NOTE_IMPLÉMENTATION_TOOLTIPS_TUILES_LINKY_SYNTHÈSE_v1.0  
**Objet :** Optimiser le comportement et le placement des tooltips d’aide sur la version mobile (grille 2 colonnes, viewport type 402×874). Document normatif et actionnable pour le front.

---

## 1. Contexte

La vue Synthèse Linky affiche une grille de tuiles KPI avec une icône « i » par tuile ouvrant un tooltip d’aide. Sur desktop (4 colonnes), le placement intelligent par colonne est en place et validé (col 1 → droite, col 4 → gauche, colonnes centrales → sous le « i » avec caret). Sur mobile, la grille passe en **2 colonnes** ; la logique actuelle reste basée sur l’index en 4 colonnes, ce qui provoque un empiètement plus marqué sur les tuiles voisines et une bulle qui peut déborder vers les filtres ou le bas de l’écran.

**Objectif de ce document :** définir les préconisations détaillées pour une version mobile optimale (placement, zones tactiles, limites d’écran).

---

## 2. Regard critique — affichage mobile (viewport type 402×874)

Lecture de l’écran tel qu’il se présente aujourd’hui sur mobile, sans tooltip ouvert.

### 2.1 Ce qui fonctionne

- **Grille 2×3 lisible :** deux colonnes, tuiles homogènes en taille, valeurs et libellés lisibles. La hiérarchie visuelle (icône → titre → montant) est claire.
- **Thème sombre cohérent :** fond, tuiles et texte restent alignés avec Linky ; pas de rupture entre header et contenu.
- **« i » discret :** l’icône d’aide ne concurrence pas les KPI ; on comprend qu’elle est secondaire.
- **Tuile BUSINESS mise en avant :** la bordure verte et le fond légèrement différencié signalent correctement un statut ou une priorité sans casser la grille.

### 2.2 Points de vigilance

- **Densité header + filtres :** logo, baseline, trois sélecteurs (SARL La Platine, Exercice à date, 2026) et menu burger tiennent dans un espace réduit. Sur 402 px de large, le risque est un sentiment de « tout en haut » et des cibles tactiles serrées pour les filtres. À vérifier : espacement entre les dropdowns, taille de zone de tap (idéalement ≥ 44 px).
- **Baseline trop proche des filtres :** « Décidez sur des données vérifiables. En temps réel. » peut se confondre avec la zone de filtres. Sur mobile, on pourrait envisager de raccourcir, de réduire la taille ou de la repousser (ex. sous les filtres) pour clarifier la frontière « identité » / « contexte de lecture ».
- **Tuile BUSINESS : cadenas + « i » :** deux icônes en coin supérieur droit (cadenas + « i ») occupent le même espace. Visuellement ça tient, mais au tap il faut que chaque cible soit bien séparée (le « i » pour l’aide, le cadenas pour son propre action) et que la zone du « i » reste confortable (voir § 4.5).
- **Scroll et dernière rangée :** avec 6 tuiles visibles (2×3), les tuiles 7 à 12 (Taxes, EBE, Notes de crédit, etc.) sont en dessous. Il n’y a pas d’indice visuel fort que la grille continue (pas de fade, pas de « suite »). Ce n’est pas bloquant mais peut donner l’impression que la synthèse s’arrête là ; un léger indicateur de scroll ou un rappel du nombre de tuiles pourrait rassurer.
- **Hauteur des tuiles (160 px) :** en 2 colonnes, chaque tuile est large ; 160 px de hauteur donne un bon équilibre. Sur des écrans plus courts, vérifier que 3 rangées restent visibles sans que la zone des filtres soit écrasée.

### 2.3 Synthèse du regard critique

L’affichage mobile est **structuré et lisible** ; la grille et la hiérarchie des tuiles sont solides. Les principaux gains à viser concernent : (1) la **clarté de la zone header/filtres** (séparation visuelle, cibles tactiles), (2) le **placement des tooltips** pour qu’ils n’empiètent pas sur les tuiles voisines ni sur les filtres, et (3) le **confort tactile** du « i » et des filtres. Les préconisations détaillées ci‑dessous traduisent ces axes en règles d’implémentation.

---

## 3. État actuel (mobile — technique)

- **Grille :** 2 colonnes (`grid-cols-2`), 6 rangées de 2 tuiles.
- **Tooltip :** ouverture au tap sur le « i » ; fermeture au tap hors zone (déjà en place).
- **Placement :** calcul basé sur `index % 4` (colonnes 1 à 4), donc non adapté au layout 2 colonnes. Une tuile en « colonne gauche » mobile (ex. FLUX NET, index 2) reçoit encore un traitement « centrale » (bulle dessous + caret), ce qui fait chevaucher BFR et PAIEMENTS.
- **Résultat :** ancrage au « i » et lisibilité du texte sont bons ; l’empiètement sur les tuiles adjacentes et les bords d’écran est le point à traiter.

---

## 4. Préconisations détaillées

### 4.0 Règles absolues (non négociables)

- **Le tooltip ouvert ne doit jamais masquer l’icône « i » qui l’a déclenché.**  
  Raisons : compréhension de l’origine, fermeture intuitive, ancrage visuel, cohérence tactile.

- **Fallback mobile :** lorsqu’aucune position idéale ne rentre proprement dans le viewport (texte long, zoom, clavier affiché, safe areas, scroll courant), **privilégier la visibilité complète de la bulle dans le viewport**, même si le placement préféré selon colonne n’est pas respecté. Mieux vaut une bulle décalée mais entièrement lisible qu’une bulle coupée.

- **Longueur de texte sur mobile :** **2 phrases courtes maximum** par tooltip. **Objectif : lecture en 2–3 secondes.** Une bulle trop haute devient un problème structurel de placement ; limiter le contenu évite ce piège.

- **Un seul tooltip ouvert à la fois :** sur mobile, **un seul tooltip peut être ouvert simultanément**. L’ouverture d’un nouveau tooltip ferme le précédent. Raisons : éviter l’encombrement, éviter les états incohérents, garder une expérience tactile simple.

### 4.1 Placement de la bulle selon le breakpoint (priorité haute)

Adapter la logique au **nombre réel de colonnes** (2, 3 ou 4) et à la **position réelle dans le viewport**, pas uniquement à l’index.

**Important :** le placement ne doit pas dépendre **uniquement** de `index % gridCols`. Il doit aussi tenir compte de la **position réelle** de la tuile à l’écran : partiellement scrollée, proche du haut, proche du bas, ou dans une zone où le tooltip n’a pas la place attendue. La logique idéale est donc : (1) placement préféré selon colonne, (2) correction selon rangée (première / dernière), (3) correction finale selon place disponible dans le viewport, (4) fallback si besoin (§ 4.0).

| Breakpoint   | Colonnes | Règle de placement |
|-------------|----------|--------------------|
| **Mobile**  | 2        | Col gauche (index % 2 === 0) → bulle **à droite** du « i » (ancrage gauche tuile, extension droite). Col droite (index % 2 === 1) → bulle **à gauche** du « i » (ancrage droite tuile, extension gauche). Pas de caret en 2 col (optionnel). |
| **Tablette**| 3        | Col 1 → droite ; col 3 → gauche ; col 2 → sous le « i » avec caret (ou même logique que 4 col en réindexant). |
| **Desktop**| 4         | Déjà en place : col 1 → droite, col 4 → gauche, col 2–3 → dessous + caret. |

**Implémentation suggérée :**  
- Utiliser un hook ou une media query / state pour connaître le breakpoint actuel (ou déduire le nombre de colonnes).  
- Exposer une variable du type `gridCols = 2 | 3 | 4` et calculer `col = index % gridCols`.  
- Appliquer les mêmes règles sémantiques : première colonne → ouvrir à droite, dernière colonne → ouvrir à gauche, colonnes du milieu → ouvrir dessous avec caret.

En 2 colonnes, « ouvrir à droite » pour la colonne gauche et « ouvrir à gauche » pour la colonne droite évite que la bulle traverse toute la largeur et réduit le chevauchement avec la tuile voisine.

**Hiérarchie avec la règle de rangée (§ 4.2) :** sur mobile, la règle générale suit la colonne. **Exception prioritaire :** pour la première rangée, l’ouverture ne doit jamais remonter vers les filtres ; si nécessaire, **la règle de rangée prime sur la règle de colonne**. Aucun doute sur qui gagne en cas de conflit.

---

### 4.2 Rangée du haut — ne pas remonter vers les filtres (priorité haute)

- **Problème :** Sur la première rangée (tuiles 0 et 1 : Trésorerie, Business), une bulle ouverte « dessous » ou « à droite / à gauche » peut remonter visuellement vers la zone des filtres (SARL La Platine, Exercice à date, 2026) et brouiller la hiérarchie.
- **Préconisation :**  
  - Pour les tuiles de la **première rangée** (index 0 et 1 en 2 col), privilégier une ouverture **strictement sous le « i »** (ou sous la tuile), avec un décalage vertical minimal (`top-8` ou équivalent), et **jamais** de positionnement qui placerait le bord supérieur de la bulle au-dessus du bas de la tuile.  
  - Si la hauteur de bulle est importante, accepter qu’elle descende sur la rangée du dessous plutôt que de la faire remonter.  
  - En cas de conflit avec la règle de colonne (§ 4.1), **la règle de rangée prime** : on ne remonte pas vers les filtres.

---

### 4.3 Rangées du bas — ne pas sortir de l’écran (priorité haute)

- **Problème :** Sur les dernières rangées (ex. index 10 et 11 en 2 col : Points de vente, Z de caisse), une bulle ouverte vers le bas peut dépasser le viewport (typ. 874 px de hauteur) et être coupée ou demander un scroll non évident.
- **Préconisation :**  
  - Détecter si la tuile est dans la **dernière rangée** (selon `gridCols` et nombre total de tuiles).  
  - Pour cette rangée : **ouvrir la bulle vers le haut** (au-dessus du « i ») plutôt que vers le bas, avec un caret inversé pointant vers le bas si besoin, ou ouvrir dessous mais avec `max-height` + scroll interne si la hauteur disponible est faible.  
  - Objectif : la bulle reste entièrement visible sans scroll de la page, ou avec un scroll minimal et prévisible.

---

### 4.4 Largeur, viewport et safe areas (priorité moyenne)

- **Déjà en place :** `max-w-[calc(100vw-2rem)]` limite la largeur pour éviter le débord horizontal.  
- **Préconisation :** conserver cette règle sur mobile ; éventuellement réduire un peu la largeur cible (`w-72` → `w-64` ou équivalent) sur petits viewports si les textes restent lisibles.

- **Viewport utile (définition) :** **viewport visible courant, diminué des safe areas système et des marges minimales de 8–12 px.** À utiliser pour tout calcul de placement et de clamp, afin d’éviter les ambiguïtés (viewport CSS brut, zone scrollable visible, conteneur parent, etc.).

- **Safe areas mobile :** sur iPhone (encoche, zones système, barre de gestes), respecter les **safe areas** et éviter les tooltips collés aux bords. Conserver une **marge minimale de 8 à 12 px** par rapport au viewport utile (haut, bas, gauche, droit). Cela évite les chevauchements avec l’UI système et donne un rendu « produit fini ».

---

### 4.5 Zones tactiles (priorité moyenne)

- **« i » :** zone cliquable actuelle (bouton 20×20 px environ). Vérifier que la cible tactile effective respecte au moins **44×44 px** (reco. accessibilité) : soit padding/zone de hit étendue, soit taille visuelle légèrement augmentée sur mobile sans changer le rendu « discret ».  
- **Tuile :** le tap sur la tuile ouvre la carte détaillée ; le tap sur le « i » ouvre le tooltip sans ouvrir la carte (stopPropagation déjà en place). S’assurer qu’en tactile le tap sur le « i » est bien distingué (pas de double ouverture).  
- **Filtres (SARL La Platine, Exercice à date, 2026) :** s’assurer que les cibles de tap sont suffisantes et que l’ouverture d’un tooltip à proximité (première rangée) ne capture pas les gestes destinés aux filtres.

---

### 4.6 Comportement tap et fermeture (priorité basse — déjà correct)

- Ouverture au tap sur le « i » (pas de hover sur mobile).  
- Fermeture au tap en dehors du tooltip et du « i ».  
- Pas de fermeture automatique après un délai court sur mobile, pour laisser le temps de lire.  
- Conserver le support clavier / focus pour les utilisateurs au clavier ou avec lecteur d’écran.

---

### 4.7 Empilement (z-index) et superposition (priorité moyenne)

- **La bulle doit apparaître au-dessus des tuiles voisines**, sans passer sous le header fixe ni sous les éléments système (barre de statut, barre de gestes).  
- Formulation équivalente : **la bulle doit rester lisible et non tronquée par les contextes d’empilement.**  
- À vérifier en implémentation : pas de `overflow: hidden` parent qui coupe la bulle ; pas de stacking context qui fait repasser le header ou un badge au-dessus du tooltip.

### 4.8 Tuile « BUSINESS » et icônes additionnelles (priorité basse)

- Sur la capture, la tuile BUSINESS affiche une bordure verte et des icônes (cadenas, autre) à côté du « i ». S’assurer que sur mobile :  
  - la zone du « i » reste prioritaire pour le tooltip et que les autres icônes ne réduisent pas la zone de tap utile ;  
  - l’ordre visuel et l’accessibilité (ordre de tabulation, libellés) restent cohérents.

---

## 5. Priorisation et ordre de mise en œuvre

| Priorité | Thème                          | Action |
|----------|--------------------------------|--------|
| **P0**   | Placement selon breakpoint     | Adapter la logique colonne à 2 (et 3) colonnes pour réduire l’empiètement. |
| **P0**   | Rangée du haut                 | Ne pas faire remonter la bulle vers les filtres ; forcer ouverture sous la tuile. |
| **P0**   | Rangées du bas                 | Détecter dernière rangée ; ouvrir la bulle vers le haut ou limiter la hauteur. |
| **P1**   | Largeur / viewport             | Conserver max-width ; optionnel : largeur réduite sur très petit écran. |
| **P1**   | Zones tactiles                 | Vérifier 44×44 px pour le « i » et pas d’interférence avec les filtres. |
| **P2**   | Comportement tap               | Déjà OK ; vérifier en régression. |
| **P2**   | Tuile BUSINESS                 | Vérifier zones de tap et accessibilité. |

### 5.1 Règle de décision simplifiée

Pour implémenter le placement sans relire tout le document, enchaîner dans l’ordre :

1. Déterminer le **nombre réel de colonnes** (2, 3 ou 4 selon breakpoint).
2. Calculer le **placement préféré** selon la colonne (gauche → droite, droite → gauche, centre → dessous).
3. **Corriger selon première / dernière rangée** (ne pas remonter vers les filtres ; ne pas sortir en bas).
4. **Vérifier la visibilité complète** dans le viewport (avec safe areas 8–12 px).
5. **Appliquer le fallback** si nécessaire (visibilité complète prioritaire sur placement idéal).
6. **Conserver l’ancrage visuel au « i »** : le tooltip ne masque jamais son déclencheur.

### 5.2 Algorithme de placement (forme normative)

| Étape | Nom | Description |
|-------|-----|-------------|
| 1 | **Preferred side** | Choisir le côté d’ouverture (droite / gauche / dessous) à partir de la colonne et du nombre de colonnes (voir tableau § 4.1). |
| 2 | **Vertical correction** | Ajuster selon la rangée : première rangée → pas au-dessus de la tuile ; dernière rangée → ouvrir vers le haut ou limiter la hauteur. |
| 3 | **Viewport clamp** | Contraindre la position finale de la bulle pour qu’elle reste entièrement dans le **viewport utile** (définition § 4.4), avec marges 8–12 px (safe areas). |
| 4 | **Fallback** | Si après clamp la bulle serait coupée ou masquerait le « i », recalculer une position de secours (ex. ouvrir dans l’autre sens, ou centrer) en garantissant : bulle entièrement visible, « i » jamais masqué. |

---

## 6. Références

- **Spéc. tooltips :** ZeDocs/web47 — NOTE_IMPLÉMENTATION_TOOLTIPS_TUILES_LINKY_SYNTHÈSE_v1.0 (§ 5.5 Placement de la bulle).  
- **Implémentation actuelle :** `units/dorevia-linky/components/IconGrid.tsx` (grille, tooltip, calcul `col = index % 4`).  
- **Données d’aide :** `units/dorevia-linky/app/lib/tile-help.ts` (TILE_HELP, textes compacts).  
- **Breakpoints Tailwind utilisés :** `grid-cols-2` (défaut), `sm:grid-cols-3`, `md:grid-cols-4`.

---

## 7. Version

- **v1.0** — 13 mars 2026 — Rédaction initiale des préconisations mobile (placement, rangées, zones tactiles, priorisation).
- **v1.1** — 13 mars 2026 — Règles absolues (ne jamais masquer le « i », fallback viewport, 2 phrases max mobile) ; placement basé sur position réelle dans le viewport, pas uniquement sur l’index ; safe areas 8–12 px ; règle de décision simplifiée en 6 étapes ; algorithme de placement normatif (preferred side → vertical correction → viewport clamp → fallback).
- **v1.2** — 13 mars 2026 — Hiérarchie explicite règle colonne / règle rangée (première rangée : rangée prime) ; définition du viewport utile ; règle « un seul tooltip ouvert à la fois » ; règle empilement / z-index (bulle au-dessus des tuiles, pas sous header ni UI système).
