# Spécification — Graphiques des cartes comptabilité (Linky)

**Version :** 1.4  
**Date :** 2026-02  
**Périmètre :** Cartes comptabilité (Business, Cash, Trésorerie, Taxes, Notes de crédit, Remboursements) + Points de vente (POS) + Filtres période intelligents + Header (logo v2.1)  
**Addendum découpage :** [SPEC_LINKY_DECOUPAGE_GRAPHIQUES_v1.0.md](SPEC_LINKY_DECOUPAGE_GRAPHIQUES_v1.0.md) v1.1 — options Type / Granularité / Mode, pédagogie intégrée

---

## 1. Vue d’ensemble

Chaque carte affiche un graphique dans une section repliable (Évolution ou Répartition). L'utilisateur peut choisir le type (barres, courbe, camembert), la granularité (jour, semaine, mois) pour barres/courbe, et le mode Montants (absolu) ou Répartition % (relatif à 100 % par période). Cartes concernées : Business, Cash, Trésorerie validée, Taxes, Notes de crédit, Remboursements ; Points de vente (une section Évolution par shop : Ventes scellées vs Ventes en attente). Les sélecteurs Période et Année n'affichent que les valeurs contenant des données (sales, purchases). Le logo permet le retour à l'accueil (BRAND_LOCK v1.0, hover brightness 1.04).

---

## 2. Données

### 2.1 Sources

| Donnée | API | Paramètre |
|--------|-----|-----------|
| Ventes TTC (série) | `GET /api/sales` | `granularity`, `date_debut`, `date_fin`, `company_id` |
| Achats TTC (série) | `GET /api/purchases` | `granularity`, `date_debut`, `date_fin`, `company_id` |

Les APIs sont des proxys vers le Vault (`/ui/aggregations/sales`, `/ui/aggregations/purchases`).

### 2.2 Structure de réponse (extrait)

```json
{
  "total": 1962976.70,
  "total_ht": 1562862.40,
  "series": [
    { "period": "2025-01", "amount": 750000 },
    { "period": "2025-02", "amount": 1100000 }
  ]
}
```

- **period** : chaîne `YYYY-MM` (mois), `YYYY-MM-DD` (jour ou début de semaine)
- **amount** : montant TTC pour la période

### 2.3 Totaux utilisés

- **Barres / Courbe** : séries mensuelles/hebdomadaires/journalières (TTC)
- **Camembert** : totaux HT de la période (`total_ht` ou `total` des agrégations)

---

## 3. Types de graphique

| Type | Libellé | Description |
|------|---------|-------------|
| **bar** | Barres | Barres groupées par période : Ventes TTC (vert) et Achats TTC (orange) |
| **line** | Courbe | Courbes d’évolution : deux lignes (Ventes, Achats) sur les périodes |
| **pie** | Camembert | Proportion Ventes HT vs Achats HT sur la période totale |

### 3.1 Représentation par type

- **Barres** : deux barres par abscisse (Ventes, Achats), valeurs TTC
- **Courbe** : deux lignes (Ventes, Achats), valeurs TTC
- **Camembert** : donut, deux secteurs (Ventes HT, Achats HT), pas de granularité temporelle

### 3.2 Icônes du sélecteur de type

| Type | Icône |
|------|-------|
| bar | Graphique en barres verticales (3 barres) |
| line | Courbe ascendante |
| pie | Graphique circulaire type camembert |

Le type sélectionné est mis en évidence (accent bleu).

### 3.3 Mode d'affichage (barres / courbe)

Sélecteur **Montants** | **Répartition %** :
- **Montants** : valeurs absolues en devise
- **%** : représentation relative à 100 % par période (chaque période totalise 100 %, répartition entre série 1 et série 2)
- En mode % : barres empilées, axe Y 0–100 %, tooltip en pourcentage

---

## 4. Granularité temporelle

### 4.1 Valeurs possibles

| Valeur | Libellé | Format `period` |
|--------|---------|-----------------|
| `day` | Jour | `YYYY-MM-DD` |
| `week` | Semaine | `YYYY-MM-DD` (début de semaine) |
| `month` | Mois | `YYYY-MM` |

### 4.2 Disponibilité selon la période

| Longueur de la période | Granularités proposées |
|------------------------|------------------------|
| ≤ 31 jours | Jour, Semaine, Mois |
| 32–180 jours | Semaine, Mois |
| > 180 jours | Mois |

### 4.3 Granularité par défaut

- Période ≤ 31 jours : **Jour**
- Période > 31 jours : **Mois**

### 4.4 Affichage du sélecteur

Le sélecteur de granularité est visible uniquement pour les types **Barres** et **Courbe**. Il est masqué pour **Camembert** (pas de dimension temporelle).

### 4.5 Libellés des abscisses

- **Mois** : « Janv », « Fév », « Mars », etc.
- **Jour / Semaine** : `jj/mm` (ex. `15/01`)

---

## 5. Section repliable

### 5.1 Comportement

- Titre de la section : **Évolution**
- Flèche chevron à gauche : rotation de 90° lorsque la section est dépliée
- Texte à droite : « Afficher » ou « Réduire »

### 5.2 État par défaut et ordre

- **Trésorerie validée (Répartition)** : dépliée au chargement initial
- **Autres cartes (Évolution)** : repliées au chargement initial
- **Ordre** (vue Tout / Cash) : Trésorerie validée en première position, puis Cash, Remboursements, Business, Taxes, Notes de crédit

### 5.3 Comportement accordéon

- **Une seule section dépliée à la fois** : quand l'utilisateur déplie une section Évolution/Répartition, toutes les autres se replient automatiquement
- **Chargement initial** : Trésorerie validée (Répartition) dépliée ; autres sections repliées
- Persistance durant la session : clé `linky-chart-expanded-active` stocke l'identifiant tant qu'une section est dépliée

---

## 6. Style et accessibilité

### 6.1 Couleurs

| Élément | Variable CSS |
|---------|--------------|
| Ventes / positif | `var(--positive)` (vert) |
| Achats | `var(--warning)` (orange) |
| Grille / axes | `var(--border)` |
| Texte secondaire | `var(--text-secondary)` |
| Sélecteur actif | `var(--accent)` |

### 6.2 Dimensions

- Hauteur du graphique : **220 px**
- Responsive : largeur 100 % du conteneur

### 6.3 Accessibilité

- Boutons avec `aria-label` et `title` (libellés Barres, Courbe, Camembert)
- Chevron avec `aria-expanded` sur le bouton de pliage
- Tooltip : libellés explicites (ex. « Encaissements », « Décaissements ») — jamais les clés techniques serie1/serie2
- Tooltip camembert : contenu personnalisé (PieTooltipContent) pour lisibilité maximale (libellé + montant en évidence)

---

## 7. Cas sans données

- Message affiché : **« Aucune donnée sur la période »**
- Bloc avec bordure et fond `var(--muted-soft)`
- Hauteur minimale d’environ 192 px (12 rem)

---

## 8. Intégration technique

### 8.1 Composants partagés

| Composant | Rôle |
|-----------|------|
| `CardChartSection` | Section repliable, sélecteurs (type, granularité, Montants/%), accordéon |
| `DualSeriesChart` | Graphique Recharts (bar/line/pie), mode relatif 100 % |
| `ChartExpandedProvider` | Contexte accordéon — une seule section dépliée à la fois |
| `PieTooltipContent` | Tooltip personnalisé camembert (lisibilité) |

### 8.2 Cartes et wrappers

| Carte | Composant | Wrapper |
|-------|-----------|---------|
| Business | BusinessCard | BusinessCardWithPolling |
| Cash | FluxCashCard | FluxCashCardWithPolling |
| Trésorerie | TreasuryCardWithPolling (inline) | — |
| Taxes | TaxesCard | TaxesCardWithPolling |
| Notes de crédit | CreditNotesCard | CreditNotesCardWithPolling |
| Remboursements | RefundsCard | RefundsCardWithPolling |
| Points de vente | PosShopsView | — (sessions dérivées de /api/pos-sessions) |

### 8.3 Filtres période intelligents

| Élément | Description |
|---------|-------------|
| **API** | `GET /api/years-with-data?tenant=…&company_id=…` — années et mois (1..12) ayant des données (sales, purchases) |
| **Années** | Seules les années avec au moins une donnée sont proposées ; année courante ajoutée si sélectionnée |
| **Mois** | Exercice à date toujours affiché ; seuls les mois contenant des données pour l'année sélectionnée |
| **Fallback** | Si aucun mois avec donnée : tous les mois affichés ; si aucune année : année courante seule |

### 8.4 Logo et header (BRAND_LOCK_DOREVIA_LINKY_LOGO_v1.0)

| Élément | Description |
|--------|-------------|
| **Référence** | `ZeDocs/web20/BRAND_LOCK_DOREVIA_LINKY_LOGO_v1.0.md` — version figée |
| **Structure** | DOREVIA (90 % de Linky, Slate-400) + Linky (blanc, semibold) ; tagline 50 % de Linky, espacement 6px / 5px |
| **Tagline** | 1 ligne (`whitespace-nowrap`) ; masquée si viewport &lt;768px ; opacité 100 %, Emerald désaturé 90 % |
| **Hover** | brightness(1.04), transition 160ms — aucun underline, scale ni glow |
| **Harmonisation** | Logo shrink-0 ; badge tenant whitespace-nowrap |
| **Navbar** | Fond #0F172A ; border-bottom rgba(255,255,255,0.04) |

### 8.5 Fichiers clés

| Fichier | Rôle |
|---------|------|
| `app/api/years-with-data/route.ts` | API filtres période (années + mois par année) |
| `app/lib/chart-granularity.ts` | Règles granularité et disponibilité |
| `app/lib/chart-type.ts` | Types et libellés |
| `app/context/ChartExpandedContext.tsx` | Contexte accordéon |
| `components/CardChartSection.tsx` | Section repliable générique |
| `components/DualSeriesChart.tsx` | Graphique bar/line/pie |
| `components/BusinessChart.tsx` | Wrapper Business (Ventes/Achats) |
| `components/TaxesChart.tsx` | Wrapper Taxes (prorata TVA) |
| `components/ReportHeader.tsx` | Header, logo, filtres période (yearsToShow, periodOptionsToShow) |

### 8.6 Dépendance

- **Recharts** (^2.15.0) pour les graphiques

---

## 9. Polling

- Intervalle : **10 minutes**
- Les appels `/api/sales` et `/api/purchases` utilisent la granularité courante
- L’état replié/déplié ne doit pas se réinitialiser à chaque mise à jour des données

---

## 10. Historique des versions

| Version | Date | Modification |
|---------|------|--------------|
| 1.0 | 2025-02 | Spécification initiale (Barres, Courbe, Camembert, granularité, repliable, sessionStorage) |
| 1.1 | 2026-02 | Étendue à toutes cartes comptabilité ; mode Montants/%; accordéon (une section dépliée) ; tooltips lisibles ; polling 10 min |
| 1.2 | 2026-02 | Points de vente : section Évolution par shop (Ventes scellées / Ventes en attente), séries dérivées des sessions POS |
| 1.3 | 2026-02 | Filtres période : années et mois filtrés selon données (API years-with-data) ; logo SPEC v2.1 (DOREVIA+Linky+tagline) ; lien accueil |
| 1.4 | 2026-02 | Logo : tagline stricte 1 ligne (masquée si &lt;768px) ; harmonisation header (shrink, whitespace-nowrap tenant) |
