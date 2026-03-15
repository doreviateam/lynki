# Spécification de refonte — Cockpit Dorevia Linky

**Document de référence MOA / Équipe projet**

Version : 1.1  
Date : Mars 2026  
Statut : Spécification — Implémentation en cours

---

## État d'avancement (Mars 2026)

| Bloc | Statut | Route |
|------|--------|------|
| Header | ✅ Implémenté | `/cockpit` |
| Insight | ✅ Implémenté | `/cockpit` |
| KPI | ✅ Implémenté | `/cockpit` |
| Couverture probante | ✅ Implémenté | `/cockpit` |
| Flux économiques | ✅ Implémenté (mock) | `/cockpit` |
| Exposition clients | ✅ Implémenté (mock) | `/cockpit` |
| Position trésorerie | ✅ Implémenté (mock) | `/cockpit` |
| Alertes | ✅ Implémenté (mock) | `/cockpit` |

**Prochaine étape :** Connexion APIs réelles (Sprint 3). Voir `RAPPORT_AVANCEMENT_COCKPIT_LINKY.md`.

---

## 1. Résumé exécutif

### 1.1 Objet

La présente spécification définit le périmètre, les exigences et les livrables de la **refonte du cockpit Dorevia Linky**, interface de pilotage financier destinée aux dirigeants et CFO.

### 1.2 Objectifs stratégiques

| Objectif | Description |
|----------|-------------|
| Crédibilité | Interface perçue comme professionnelle par les CFO |
| Différenciation | Mise en avant des **données vérifiables** (Vault, preuves) |
| Lisibilité | Densité maîtrisée, hiérarchie claire, chiffres dominants |
| Cohérence | Design system unifié, implémentation rapide |

### 1.3 Documents de référence

| Document | Rôle |
|----------|------|
| `direction_artistique_linky.md` | Direction visuelle, palette, typographie, anti-patterns |
| `LINKY_UI_DESIGN_SYSTEM_v1.0.md` | Tokens, composants, règles techniques |
| `linky-cockpit-demo.html` | Maquette layout simple |
| `linky-cockpit-demo2.html` | Maquette layout avancé (référence) |
| `AVIS_EXPERT_REFONTE_COCKPIT_LINKY.md` | Avis d'expert MOA |

---

## 2. Périmètre fonctionnel

### 2.1 Phase 1 (v1) — Cockpit financier

| Bloc | Description | Priorité |
|------|-------------|----------|
| **Header** | Tenant, périmètre, période, statut données, badges fiabilité | P0 |
| **Insight** | Phrase narrative prioritaire + badge statut | P0 |
| **KPI** | 4 cartes max (Trésorerie, Marge, Encours, Retard) + deltas | P0 |
| **Couverture probante** | Widget signature (jauge radiale + sources) | P0 |
| **Flux économiques** | Graphique ventes vs achats + statut | P0 |
| **Exposition clients** | Table avec Partenaire, Encours, Retard, **Preuve** | P0 |
| **Position trésorerie** | Graphique projection + statut | P1 |
| **Alertes financières** | Liste alertes + badges criticité | P0 |

### 2.2 Phase 2 (v2) — Évolutions

- Analytics avancées
- Alerting configurable
- Intégration DIVA insights

### 2.3 Hors périmètre v1

- Mode clair (impression) — à prévoir en v1.1
- Navigation multi-écrans — à définir
- Export PDF — à définir

---

## 3. Exigences fonctionnelles détaillées

### 3.1 Header

| Élément | Obligatoire | Format |
|---------|-------------|--------|
| Nom application | Oui | « Linky — Cockpit financier » |
| Tenant | Oui | Texte |
| Période | Oui | Mois Année (ex. Mars 2026) |
| Badge flux | Oui | Validé / Partiel / À vérifier |
| Badge source | Oui | Vault / Odoo / POS |

### 3.2 Insight

| Attribut | Spécification |
|----------|----------------|
| Contenu | Une phrase narrative (max 2 lignes) |
| Badge | Statut (Surveillance, Couverture partielle, etc.) |
| Style | Bordure gauche 4px couleur fonctionnelle (warning par défaut) |

### 3.3 KPI Cards

| Attribut | Spécification |
|----------|---------------|
| Nombre max | 4 par ligne |
| Structure | Titre, Valeur principale, Delta (optionnel) |
| Delta | Variation vs période précédente, couleur selon sens (success/danger) |
| Hover | Background #1F3653, transition 150ms |

### 3.4 Widget Couverture probante

| Attribut | Spécification |
|----------|---------------|
| Jauge | Radiale SVG, 0–100 % |
| Affichage | Pourcentage centré |
| Sources | Liste : nom + badge (Validé, Sync, Partiel, Confirmé) |
| Couleurs | Vert = validé, Orange = partiel |

### 3.5 Table décisionnelle

| Colonne | Alignement | Contenu |
|---------|-------------|---------|
| Partenaire | Gauche | Texte |
| Encours | Droite | Montant € |
| Retard | Droite | Badge % (warning/danger) |
| Preuve | Gauche | Source (Vault ✓, Odoo + POS, etc.) |

| Comportement | Spécification |
|--------------|---------------|
| Hover ligne | Background #14243A |
| Hauteur ligne | 40px |

### 3.6 Alertes

| Attribut | Spécification |
|----------|---------------|
| Structure | Texte + badge (Alerte, À vérifier, Monitoring) |
| Alignement | Texte gauche, badge droite |

---

## 4. Exigences techniques

### 4.1 Stack

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js |
| Styles | Tailwind CSS |
| Composants | shadcn/ui (adapté) |
| Graphiques | Recharts |
| Icônes | Lucide |

### 4.2 Design tokens (implémentation)

Les tokens du Design System doivent être exposés en :

- **Tailwind** : `theme.extend.colors`, `theme.extend.spacing`
- **CSS variables** : pour les thèmes (dark/light futur)

### 4.3 Responsive

| Breakpoint | Comportement |
|------------|--------------|
| ≥ 900px | Layout 2 colonnes (section-grid) |
| 600–900px | KPI 2 colonnes, section-grid 1 colonne |
| < 600px | Tout en 1 colonne, proof-widget empilé |

### 4.4 Accessibilité

- Contraste WCAG AA (4,5:1)
- Focus visible (outline #3B82F6)
- Navigation clavier
- Sémantique HTML (main, header, section)

### 4.5 États à gérer

| État | Comportement |
|------|--------------|
| Loading | Skeleton (background #14243A, animation pulse) |
| Erreur | Message + possibilité de retry |
| Vide | Message « Aucune donnée » |

---

## 5. Spécifications visuelles

### 5.1 Palette (référence)

```
Fond principal    #0F1B2D
Fond secondaire   #14243A
Surface carte     #1A2E47
Bordure           #223B5B
Texte principal   #E6EEF8
Texte secondaire  #9FB3C8

Success           #22C55E
Warning           #F59E0B
Danger            #EF4444
Info              #3B82F6
```

### 5.2 Typographie

- Police : IBM Plex Sans
- KPI : 44px, semibold
- Titre bloc : 16–18px
- Label : 12–14px
- Table : 14px

### 5.3 Espacements

- Base : 8px
- Container max : 1200px (ou 1440px selon validation)
- Gap cartes : 16px
- Gap blocs : 24px
- Padding cartes : 16px

---

## 6. Livrables et jalons

### 6.1 Livrables

| Livrable | Description |
|----------|-------------|
| Design tokens | Fichier Tailwind/CSS variables |
| Composants base | KPI Card, Insight Card, Badge, Table, Proof Widget |
| Page cockpit | Écran principal conforme à demo2 |
| États | Loading, erreur, vide pour chaque bloc |

### 6.2 Jalons suggérés

| Jalon | Contenu |
|-------|---------|
| J1 | Tokens + composants base (cards, badges) |
| J2 | Layout complet (header, insight, KPI, proof widget) |
| J3 | Graphiques + table + alertes |
| J4 | États (loading, erreur, vide) + responsive |
| J5 | Recette fonctionnelle + accessibilité |

---

## 7. Critères d'acceptation

### 7.1 Critères globaux

- [ ] Conformité visuelle au Design System (palette, typo, espacements)
- [ ] Structure cockpit respectée (Header → Insight → KPI → Couverture → Analyse → Alertes)
- [ ] Widget Couverture probante présent et fonctionnel
- [ ] Colonne Preuve présente dans les tableaux clients
- [ ] Responsive opérationnel (900px, 600px)
- [ ] Accessibilité WCAG AA

### 7.2 Critères par bloc

- [ ] Header : tenant, période, badges affichés
- [ ] Insight : phrase narrative + badge
- [ ] KPI : 4 cartes avec valeurs et deltas
- [ ] Couverture probante : jauge + 4 sources
- [ ] Flux : graphique barres (ventes/achats)
- [ ] Exposition clients : table avec Preuve
- [ ] Alertes : liste avec badges

---

## 8. Risques et hypothèses

### 8.1 Hypothèses

- Les APIs (Vault, Odoo, etc.) fournissent les données nécessaires
- Le mode dark est le mode par défaut (mode clair en option)
- Un seul écran cockpit en v1 (pas de navigation complexe)

### 8.2 Risques

| Risque | Mitigation |
|--------|------------|
| Dérive visuelle | Revue design sur chaque PR |
| Données manquantes | États vides/erreur documentés |
| Performance graphiques | Recharts optimisé, lazy load |

---

## 9. Annexes

### 9.1 Structure de page cible

```
┌─────────────────────────────────────────────────────────┐
│ HEADER (tenant, période, badges)                        │
├─────────────────────────────────────────────────────────┤
│ INSIGHT (phrase + badge)                                 │
├─────────────────────────────────────────────────────────┤
│ KPI    │ KPI    │ KPI    │ KPI                           │
├─────────────────────────────────────────────────────────┤
│ COUVERTURE PROBANTE (jauge + sources)                    │
├─────────────────────────────────────────────────────────┤
│ FLUX ÉCONOMIQUES     │ EXPOSITION CLIENTS               │
│ (graphique)          │ (table + Preuve)                  │
├─────────────────────┼───────────────────────────────────┤
│ POSITION TRÉSORERIE  │ ALERTES FINANCIÈRES               │
│ (graphique)          │ (liste)                          │
└─────────────────────┴───────────────────────────────────┘
```

### 9.2 Référence maquettes

- **demo1** : `ZeDocs/web43/linky-cockpit-demo.html`
- **demo2** : `ZeDocs/web43/linky-cockpit-demo2.html` (référence principale)

### 9.3 Implémentation

- **Code** : `units/dorevia-linky/`
- **Page cockpit** : `app/cockpit/page.tsx`
- **Composants** : `components/cockpit/`
- **Rapport d'avancement** : `ZeDocs/web43/RAPPORT_AVANCEMENT_COCKPIT_LINKY.md`

---

*Document de spécification — Refonte Cockpit Linky v1.1*
