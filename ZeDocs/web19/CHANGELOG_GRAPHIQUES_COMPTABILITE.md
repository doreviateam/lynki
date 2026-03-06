# Changelog — Graphiques des cartes comptabilité Linky

**Périmètre** : ZeDocs/web19  
**Implémentation** : v1.60 (15 février 2026)

---

## Résumé des modifications

Extension de la spécification graphique (initialement Business uniquement) à **toutes les cartes comptabilité** Linky, avec ajout du mode relatif, accordéon et amélioration des tooltips. Puis : Points de vente, filtres période intelligents (années/mois avec données), logo SPEC_LOGO_DOREVIA_LINKY_v2.1 (DOREVIA+Linky+tagline, modernité maîtrisée).

---

## Fonctionnalités implémentées

### 1. Cartes concernées

| Carte | Série 1 | Série 2 | Section |
|-------|---------|---------|---------|
| Business | Ventes TTC | Achats TTC | Évolution |
| Cash | Encaissements | Décaissements | Évolution |
| Trésorerie validée | Rapproché | En attente | Répartition |
| Taxes | Taxes collectées | Taxes déductibles | Évolution |
| Notes de crédit | Avoirs clients | Avoirs fournisseurs | Évolution |
| Remboursements | Remboursements clients | Remboursements fournisseurs | Évolution |

### 2. Types de graphique

- **Barres** : barres groupées (ou empilées en mode %)
- **Courbe** : deux lignes d'évolution
- **Camembert** : répartition proportionnelle (donut)

### 3. Granularité temporelle

- Jour, Semaine, Mois (selon longueur de période)
- ≤ 31 jours : les 3 ; 32–180 jours : Semaine + Mois ; > 180 jours : Mois

### 4. Mode Montants / Répartition %

- **Montants** : valeurs absolues en devise
- **Répartition %** : chaque période = 100 %, répartition entre les deux séries
- Barres empilées, axe Y 0–100 % en mode relatif

### 5. Comportement accordéon

- Une seule section graphique dépliée à la fois
- Ouverture d'une section → fermeture automatique des autres
- Persistance : `sessionStorage` clé `linky-chart-expanded-active`

### 6. Tooltips

- Libellés explicites (Encaissements, Décaissements, etc.) — jamais serie1/serie2
- Camembert : tooltip personnalisé (PieTooltipContent) pour lisibilité maximale

### 7. Polling

- Intervalle : **10 minutes** (toutes cartes WithPolling)

### 8. Filtres période intelligents (v1.51–1.52)

- **API** : `GET /api/years-with-data?tenant=…&company_id=…` — retourne `years` et `monthsWithDataByYear`
- **Années** : seules celles contenant des données (sales, purchases) ; année courante si sélectionnée
- **Mois** : Exercice à date toujours affiché ; seuls les mois avec données pour l'année sélectionnée
- **Fallback** : tous les mois si aucun donnée ; année courante seule si aucune donnée

### 9. Logo et header (BRAND_LOCK v1.0, v1.55–1.57)

- **Référence** : BRAND_LOCK_DOREVIA_LINKY_LOGO_v1.0 — version figée

### 10. Typographie (v1.58)

- **Référence** : [SPEC_TYPOGRAPHY_LINKY_v1.0.md](../web20/SPEC_TYPOGRAPHY_LINKY_v1.0.md)
- **Police** : Inter (next/font, subsets latin, weights 400/500/600/700)
- **Montants** : `tabular-nums` sur tous les montants (SalesCard, PurchasesCard, PosSessions, PosShops, BankReconciliation, Treasury, etc.)
- **Poids** : 400–700 (font-bold à la place de font-extrabold)
- **Structure** : DOREVIA (90 % de Linky) + Linky ; tagline 50 % de Linky, espacement 6px/5px
- **Tagline** : 1 ligne, masquée si &lt;768px ; opacité 100 %, Emerald désaturé 90 %
- **Hover** : brightness(1.04) uniquement ; aucun underline, scale ni glow

### 11. Découpage et pédagogie (v1.59 — Acte I)

- **Référence** : [RECOMMANDATIONS_COHERENCE_SPECS_LINKY_ACTE_I.md](RECOMMANDATIONS_COHERENCE_SPECS_LINKY_ACTE_I.md)
- **Libellé Mode** : « Répartition % » au lieu de « % »
- **Bloc Granularité** : affiché même si une seule option, en état désactivé (grisé)
- **Ligne résumé d'interprétation** : « Lecture : volumes mensuels en € » etc., positionnée **en bas à gauche du graphique**
- **Bouton « Pourquoi ? »** : popover (période, tenant, source, règle) — whyContent sur carte Cash
- **DIRECTION_ARTISTIQUE** : poids titres 800 → 700 (alignement SPEC_TYPOGRAPHY)
- **État par défaut accordéon** : Trésorerie validée (Répartition) dépliée ; autres cartes repliées
- **Ordre des cartes** : Trésorerie validée en première position (vue Cash / Tout)

### 12. Célébration 100 % Trésorerie validée (SPEC_UX_CELEBRATION_LINKY v1.1)

- **Déclencheur** : fiabilité bancaire === 100 %, état précédent < 100 %, total > 0
- **Texte contextualisé** : sous le donut — « 100 % rapproché » + « ✔ Cohérence bancaire confirmée » (couleur --positive)
- **Animation** : transition 350 ms ease-out sur le donut ; micro-luminosité (brightness 1.08) impulsion 800 ms
- **Accessibilité** : `prefers-reduced-motion` désactive animations et luminosité
- **Persistance** : confirmation affichée tant que fiabilité reste à 100 %

---

## Fichiers modifiés / ajoutés

| Fichier | Modification |
|---------|--------------|
| `components/DualSeriesChart.tsx` | Mode relatif 100 %, libellés tooltip, PieTooltipContent |
| `components/CardChartSection.tsx` | Sélecteur Montants/%, intégration ChartExpandedContext |
| `components/*Card*.tsx` | Ajout CardChartSection + graphique sur toutes cartes |
| `components/*CardWithPolling.tsx` | granularité, chartType, POLL_INTERVAL 10 min |
| `app/context/ChartExpandedContext.tsx` | Nouveau — contexte accordéon |
| `components/TaxesChart.tsx` | Nouveau — wrapper Taxes (prorata TVA) |
| `components/DashboardWithFilters.tsx` | ChartExpandedProvider |
| `app/api/years-with-data/route.ts` | Nouveau — années et mois avec données (sales, purchases) |
| `components/ReportHeader.tsx` | availableYears, monthsWithDataByYear ; periodOptionsToShow ; logo v2.1 (DOREVIA+Linky+tagline) ; tagline 1 ligne, masquée &lt;768px |
| `components/PosShopsView.tsx` | Section Évolution par shop (Ventes scellées / Ventes en attente) |
| `components/CardChartSection.tsx` (v1.59) | Répartition % ; bloc granularité désactivé si 1 option ; ligne interprétation en bas à gauche du graphique ; bouton Pourquoi ? ; whyContent |
| `app/context/ChartExpandedContext.tsx` | Trésorerie validée dépliée par défaut ; autres repliées |
| `components/DashboardWithFilters.tsx` | Trésorerie validée en première position (avant Cash) |
| `components/FluxCashCard.tsx` | whyContent passé à CardChartSection |
| `components/FluxCashCardWithPolling.tsx` | tenantId, whyContent |
| `components/TreasuryCardWithPolling.tsx` | prevRateRef, détection passage 100 %, isCelebrating100 |
| `components/CardChartSection.tsx` | interpretationOverride (texte 100 % rapproché) |
| `components/DualSeriesChart.tsx` | celebrating100, transition 350 ms, micro-luminosité, prefers-reduced-motion |
| `app/globals.css` | .dorevia-celebration-luminosity (SPEC_UX_CELEBRATION_LINKY) |

---

## Documents mis à jour

- **SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE.md** — v1.4 (logo v2.1, tagline 1 ligne, harmonisation)
- **ANALYSE_PLANS_IMPLEMENTATION_LINKY_REMISE_EN_ETAT.md** — §3.11, références API years-with-data
- **SPEC_TYPOGRAPHY_LINKY_v1.0.md** (ZeDocs/web20) — typographie normative ; référencé par RAPPORT_TYPOGRAPHIE_DOREVIA_LINKY.md
- **SPEC_LINKY_DECOUPAGE_GRAPHIQUES_v1.0.md** — découpage, pédagogie, ligne en bas à gauche du graphique
- **RECOMMANDATIONS_COHERENCE_SPECS_LINKY_ACTE_I.md** — décisions Acte I
