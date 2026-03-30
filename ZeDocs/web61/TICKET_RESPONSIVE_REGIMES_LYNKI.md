# Ticket — Régimes responsive exclusifs Lynki (mobile / tablette / desktop)

**Canon d’exécution :** [`EXECUTION_TICKETS_TACTILE_LINKY.md`](./EXECUTION_TICKETS_TACTILE_LINKY.md) — **T-TB-003** (v0.8+).

**Type :** implémentation / refonte chrome  
**Priorité :** haute (sortie du régime hybride actuel) — **P0** dans le fichier d’exécution.  
**Référence conceptuelle :** doctrine responsive § breakpoints 768 / 1024, navigation primaire unique.

---

## 1. Objectif

Stabiliser le comportement responsive de Lynki de façon **exclusive et non hybride** : à un instant donné et pour un viewport donné, **un seul régime** (mobile, tablette ou desktop) et **un seul système de navigation primaire** — sans cumul de sidebar, burger, bottom nav et variantes de header concurrentes.

**Formulation produit :**

> Lynki adopte trois régimes responsive exclusifs : mobile, tablette et desktop. Sous 1024 px, l’application assume un mode tablette/mobile sans sidebar visible, avec header dédié, navigation embarquée et footer compact. À partir de 1024 px, l’application bascule en mode desktop avec sidebar visible, header desktop et footer desktop, sans burger ni navigation basse. Aucun chrome hybride ne doit subsister entre ces régimes.

---

## 2. Périmètre

### Inclus

- Breakpoints et **choix de régime** centralisé (`mobile` | `tablet` | `desktop`).
- **Visibilité** : sidebar, burger, drawer, bottom nav, variantes de header (mobile / tablette / desktop), footer compact vs footer desktop.
- **Header tablette** : deux lignes (chrome cockpit + filtres métier), ordre et contraintes de largeur.
- **Drawer tablette** : équivalent fonctionnel complet de la sidebar desktop (navigation + outils + session).
- **Bottom navigation** : sous 1024 px uniquement ; rôle « vues » (Pilotage / Synthèse), distinct du footer métadonnées.
- **Footer compact** : sous 1024 px (mobile + tablette) — preuves cumulées, sources, version, UX si possible ; cohabitation avec bottom nav sans masquage.
- **Desktop** : `≥ 1024 px` — sidebar + header + footer desktop, sans burger ni bottom nav.

### Hors périmètre (à trancher explicitement si besoin)

- Refonte métier des cartes cockpit (hors layout / grille par régime).
- Changements API ou données tenant.

---

## 3. Règles normatives

### 3.1 Constantes de breakpoints

| Constante | Valeur (px) | Usage |
|-----------|---------------|--------|
| `MOBILE_MAX_PX` | 767 | strictement au-dessus → plus « mobile seul » |
| `TABLET_MIN_PX` | 768 | début tablette |
| `DESKTOP_MIN_PX` | 1024 | début desktop |
| `TABLET_COMFORT_MIN_PX` | 900 | largeurs minimales filtres confort (spec détail) |

Helpers logiques :

```ts
const isMobile = width < 768;
const isTablet = width >= 768 && width < 1024;
const isDesktop = width >= 1024;
```

### 3.2 Interdictions absolues

| Contexte | Interdit |
|----------|----------|
| **`< 1024 px`** | Sidebar visible en permanence |
| **`≥ 1024 px`** | Burger, bottom nav « mobile/tablette » |
| **Globalement** | Sidebar + burger ; sidebar + bottom nav ; cumul de chromes primaires concurrents |

### 3.3 Matrice de visibilité (cible)

| Élément | Mobile `< 768` | Tablette `768–1023` | Desktop `≥ 1024` |
|---------|----------------|---------------------|------------------|
| Sidebar visible | Non | Non | Oui |
| Burger | Oui | Oui | Non |
| Drawer (navigation embarquée) | Oui | Oui | Non |
| Bottom nav (Pilotage / Synthèse) | Oui | Oui | Non |
| Header mobile | Oui | Non | Non |
| Header tablette | Non | Oui | Non |
| Header desktop | Non | Non | Oui |
| Footer compact | Oui | Oui | Non |
| Footer desktop | Non | Non | Oui |

### 3.4 Rôles distincts (ne pas confondre)

- **Bottom nav** : navigation **primaire de vues** (Pilotage / Synthèse), fixée en bas, **uniquement `< 1024 px`**.
- **Footer compact** : **métadonnées globales** du cockpit (preuves cumulées, sources, version, UX) — **pas** un doublon de navigation principale.

### 3.5 Header tablette — rappel d’ordre

**Ligne 1 :**  
`Marque | séparateur | vue active | spacer | cloche | preuves de la vue | entité active | burger`  
(`flex-nowrap`, pas de wrap sur la vue active.)

**Ligne 2 :**  
`Tenant | Société | Période | Année | spacer | badge technique`  
(grammaire visuelle homogène ; scroll horizontal si besoin ; priorités métier : Société > Période > Tenant > Année.)

Largeurs minimales filtres : Tenant 120px (132px à partir de 900px) ; Société 180px (200px ≥ 900px) ; Période 140px (152px ≥ 900px) ; Année 84px (88px ≥ 900px).

### 3.6 Drawer tablette

- Reprend **l’intégralité** de la sidebar desktop : Dashboard (Pilotage, Synthèse), Outils (Lexique, Aide), Session (Thème, Déconnexion).
- Rendu **viewport** : overlay `fixed inset-0` ; panneau `fixed left-0 top-0 h-[100dvh]` ; **z-index** au-dessus du header et du contenu ; scroll interne sur le corps du drawer ; **Déconnexion** accessible.

### 3.7 Footer tablette / mobile compact

- Exemples :  
  `1 309 preuves cumulées · Sources : Odoo / POS / Vault · v1.0`  
  ou avec UX :  
  `1 309 preuves cumulées · UX 114 ms · … · v1.0`
- Compact, une ligne si possible ; wrap seulement sous forte contrainte.
- **Remplacé** par le footer desktop **`≥ 1024 px`**.

---

## 4. Stratégie d’implémentation recommandée

1. **Point d’orchestration unique** dans le layout / parent chrome : calculer `regime: "mobile" | "tablet" | "desktop"` **une fois** (largeur viewport ou media équivalent).
2. **Trois branches de rendu nettes** (éviter les empilements de classes ambiguës sur un seul composant « tout-en-un » sans critère clair).
3. **Étapes séquencées** (aligné plan conseil spec) :
   - figer breakpoints et régime ;
   - masquer sidebar `< 1024 px` ;
   - masquer burger + bottom nav `≥ 1024 px` ;
   - stabiliser header tablette ;
   - stabiliser drawer complet ;
   - stabiliser bottom nav (sous 1024) ;
   - stabiliser footer compact + cohabitation avec bottom nav ;
   - recette croisée.

Pseudo-structure de référence (spec §13) :

- **Tablet** : `TabletHeader` + `main` (padding bas pour bottom nav) + `TabletFooterCompact` + `TabletBottomNav` + `TabletDrawer`.
- **Desktop** : `DesktopSidebar` + colonne `DesktopHeader` + `main` + `DesktopFooter`.

---

## 5. Definition of Done (DoD)

La demande est **terminée** lorsque **tous** les points suivants sont vrais :

1. Les **trois régimes** sont **mutuellement exclusifs** (pas de mix sidebar + burger, sidebar + bottom nav, etc.).
2. La **navigation primaire** ne se **duplique** pas à l’écran (une seule voie principaire par viewport).
3. Le **drawer tablette** reprend la **sidebar complète** (y compris Session / Déconnexion).
4. Le **header tablette** est **stable** (deux lignes, ordre et contraintes respectés).
5. Le **footer compact** est **visible** en mobile/tablette (métadonnées non masquées par la bottom nav ; stratégie fixe + offset ou flux documenté).
6. Le **desktop** (`≥ 1024 px`) **n’affiche** ni burger, ni bottom nav, ni chrome « tablette » résiduel.
7. Les largeurs de **recette** (§6) sont passées sans régression bloquante.

---

## 6. Recette de validation

### Viewports

- **Tablette portrait :** 768, 820, 834, 900  
- **Tablette paysage / limite :** 1023  
- **Desktop :** 1024, 1280+  
- **Mobile :** &lt; 768 (ex. 390)

### Cas à vérifier

- Aucun **mix** sidebar / burger / bottom nav hors matrice.
- **Drawer** complet et **Déconnexion** utilisable.
- **Preuves de la vue** visibles header tablette (badge compact).
- **Footer compact** visible (preuves cumulées, sources, version, UX si dispo).
- **Bottom nav** uniquement **&lt; 1024 px** ; disparition nette à **1024 px**.
- Bascule **1023 → 1024** : disparition chrome tablette / mobile et apparition sidebar + footer desktop sans artefact.

---

## 7. Anti-patterns (échec recette si observé)

- Sidebar visible sous 1024 px (hors comportement transitoire non livré).
- Burger ou bottom nav visibles à partir de 1024 px.
- Drawer **sans** section Session complète.
- Footer **desktop** + bottom nav **tablette** simultanés.
- Header **tablette** + **sidebar desktop** simultanés.
- Badge preuves **trop verbeux** en ligne 1 tablette.
- Filtres métier **mélangés** aux actions globales (ligne 1 vs ligne 2).

---

## 8. Références code (point de départ — à mettre à jour lors de l’implémentation)

- Layout cockpit / reporting : `units/dorevia-linky/app/(cockpit)/layout.tsx`, `(reporting)/layout.tsx`
- Bottom nav : `units/dorevia-linky/components/layout/BottomNav.tsx` (ex. `lg:hidden` pour &lt; 1024)
- Sidebar : `units/dorevia-linky/components/layout/Sidebar.tsx`
- Header / bandeau : `ReportHeader.tsx`, `ReportHeaderContentBody.tsx`
- Footer : `LinkyFooter.tsx`
- Mode layout cockpit : `useCockpitLayoutMode` / `cockpit-layout`

---

## 9. Livrables attendus

- [ ] Constantes + helper `regime` (ou équivalent) partagés.
- [ ] Comportement chrome aligné sur la **matrice §3.3**.
- [ ] Drawer tablette **complet** et **z-index** documentés.
- [ ] Jeu de tests manuels ou checklist **Recette §6** cochée.
- [ ] Mise à jour courte du **CHANGELOG** ou note de release interne si applicable.

---

*Document généré à partir de la spec doctrine responsive Lynki — format ticket implémentation.*
