# Rapport d'ensemble — Choix de design Dorevia Linky

**Date :** 15 février 2026  
**Objectif :** Synthèse et justification des choix de design retenus pour Dorevia Linky  
**Public :** Décideurs, équipes produit, auditeurs  
**Version déployée :** v1.59 (lab + stinger, tenant sarl-la-platine)

---

## Table des matières

1. [Positionnement global](#1-positionnement-global)
2. [Référentiels et specs normatives](#2-référentiels-et-specs-normatives)
3. [Logo et identité visuelle](#3-logo-et-identité-visuelle)
4. [Typographie](#4-typographie)
5. [Couleurs et palette](#5-couleurs-et-palette)
6. [Graphiques et cartes](#6-graphiques-et-cartes)
7. [Synthèse des interdictions](#7-synthèse-des-interdictions)
8. [Index des documents sources](#8-index-des-documents-sources)

---

<a id="1-positionnement-global"></a>
## 1. Positionnement global

### 1.1 Ambiance recherchée

| Valeur | Description |
|--------|--------------|
| **Clarté** | Lecture immédiate des chiffres, hiérarchie visuelle forte |
| **Confiance** | Esthétique fintech sérieuse, pas de perception amateur |
| **Sérénité** | Pas d'agressivité visuelle, pas de gamification |
| **Contrôle** | Montants dominants, données au centre |
| **Modernité maîtrisée** | Élégant sans être décoratif, instrument de pilotage |

### 1.2 Ce que Linky n'est pas

- Pas gamifié
- Pas décoratif
- Pas crypto
- Pas startup gadget
- Pas site marketing

### 1.3 Formule synthétique

> Dorevia Linky est une application moderne et élégante qui permet de contrôler la trésorerie en temps réel et d'expliquer chaque variation avec sérénité.
>
> La forme est douce. Le fond est solide.

---

<a id="2-référentiels-et-specs-normatives"></a>
## 2. Référentiels et specs normatives

| Domaine | Document | Statut |
|---------|----------|--------|
| **Logo** | [BRAND_LOCK_DOREVIA_LINKY_LOGO_v1.0.md](BRAND_LOCK_DOREVIA_LINKY_LOGO_v1.0.md) | Version figée |
| **Typographie** | [SPEC_TYPOGRAPHY_LINKY_v1.0.md](SPEC_TYPOGRAPHY_LINKY_v1.0.md) | Spec officielle |
| **Direction artistique** | [DIRECTION_ARTISTIQUE_LINKY.md](../web15/DIRECTION_ARTISTIQUE_LINKY.md) | Principes, palette, composants |
| **Graphiques** | [SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE.md](../web19/SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE.md) | v1.4 — cartes, accordéon, tooltips |
| **Découpage graphiques** | [SPEC_LINKY_DECOUPAGE_GRAPHIQUES_v1.0.md](../web19/SPEC_LINKY_DECOUPAGE_GRAPHIQUES_v1.0.md) v1.1 | Type / Granularité / Mode, pédagogie progressive, ligne en bas à gauche |

Toute évolution nécessite un versionnement explicite des specs concernées.

---

<a id="3-logo-et-identité-visuelle"></a>
## 3. Logo et identité visuelle

### 3.1 Structure officielle

```
DOREVIA Linky
BUILT ON SEALED FINANCIAL TRUTH
```

- **DOREVIA** : uppercase, Slate-400 (#94A3B8), 90 % de la taille de Linky, poids 500
- **Linky** : casse normale, blanc (#FFFFFF), poids 600
- **Tagline** : uppercase, 50 % de Linky, Emerald désaturé 90 % ; masquée si viewport &lt; 768px

### 3.2 Justification des choix

| Choix | Raison |
|-------|--------|
| DOREVIA en Slate-400 | Hiérarchie claire : marque (atténuée) vs produit (dominant) |
| Pas de gradient | Cohérence « infrastructure financière », pas d'effet gadget |
| Pas de glow / scale | Modernité maîtrisée, sérénité visuelle |
| Tagline « BUILT ON SEALED FINANCIAL TRUTH » | Alignement avec Vault, NF525, LNE 2026 |
| Hover brightness(1.04) uniquement | Feedback discret, sans exagération |

### 3.3 Interdictions logo

- Gradient, glow, effet néon
- Scale, underline animé, bounce, 3D
- Icône ou pictogramme ajouté
- Déformation ou variation colorimétrique non documentée

---

<a id="4-typographie"></a>
## 4. Typographie

### 4.1 Police retenue

**Inter** (variable font), chargée via `next/font/google`, subsets latin, poids 400 / 500 / 600 / 700.

### 4.2 Justification

| Critère | Inter |
|---------|-------|
| Lisibilité des chiffres | Bonne, chiffres tabulaires natifs |
| Ton | Moderne, neutre, adapté au cockpit financier |
| Licence | Open Font License |
| Intégration Next.js | next/font optimise le chargement |

Le rapport didactique (RAPPORT_TYPOGRAPHIE_DOREVIA_LINKY.md) avait classé Source Sans 3 en priorité 1 et Inter en priorité 3 ; le choix final Inter répond à un positionnement « produit tech » cohérent avec la stack Next.js et une identité plus contemporaine.

### 4.3 Règles obligatoires

| Règle | Application |
|-------|-------------|
| `tabular-nums` | Tous les montants (cartes, POS, trésorerie, rapprochement bancaire) |
| Poids limités | 400, 500, 600, 700 uniquement — pas de 800+ |
| Hiérarchie | Maximum 3 poids visibles par écran |

### 4.4 Hiérarchie typographique

| Niveau | Usage | Poids | Taille |
|--------|-------|-------|--------|
| Titres principaux | Trésorerie, Flux POS, etc. | 600 | 1.125rem – 1.25rem |
| Titres de cartes | Cash, Business, etc. | 600 | 1rem – 1.125rem |
| Labels / métadonnées | Exercice à date, Partenaire | 500 | 0.875rem |
| Corps | Texte courant | 400 | 0.875rem |
| Montants | Chiffres principaux | 600–700 | Variable |

---

<a id="5-couleurs-et-palette"></a>
## 5. Couleurs et palette

### 5.1 Philosophie

**La couleur n'est jamais décorative. Elle est informationnelle.**

- Le montant principal reste neutre (`--text`)
- La variation ou l'interprétation porte la couleur (vert / rouge / bleu / ambre)
- Les fonds ne deviennent jamais saturés
- Jamais de fond rouge saturé, même en erreur

### 5.2 Couleurs sémantiques

| Contexte | Variable | Valeur |
|----------|----------|--------|
| Positif, entrée | `--positive` | #16a34a |
| Négatif, sortie problématique | `--negative` | #dc2626 |
| Attention douce | `--warning` | #f59e0b |
| Information neutre | `--accent` | #1e40af |
| Texte principal | `--text` | #0f172a |
| Texte secondaire | `--text-secondary` | #475569 |

### 5.3 Fonds et accents

| Zone | Variable | Valeur |
|------|----------|--------|
| Body | `--bg` | #f8fafc |
| Cartes | `--bg-card` | #ffffff |
| Survol | `--bg-subtle` | #f1f5f9 |
| Pastel vert (Cash) | `--pastel-vert` | #ecfdf5 |
| Pastel bleu (header) | `--pastel-bleu` | #eff6ff |
| Pastel ambre (Taxes) | `--pastel-ambre` | #fffbeb |
| Pastel violet (Corrections) | `--pastel-violet` | #f5f3ff |

> Pas de rose : évite une perception trop lifestyle.

### 5.4 Règles cartes (accents gauche)

- **Cash et Business** : vert si flux positif, rouge si flux négatif
- **Taxes, Notes de crédit, Remboursements** : bleu pâle si flux = 0, bleu accent si flux ≠ 0

---

<a id="6-graphiques-et-cartes"></a>
## 6. Graphiques et cartes

### 6.1 Cartes concernées

| Carte | Série 1 | Série 2 | Type graphique |
|-------|---------|---------|----------------|
| Business | Ventes TTC | Achats TTC | Barres, courbe, camembert |
| Cash | Encaissements | Décaissements | Barres, courbe, camembert |
| Trésorerie validée | Rapproché | En attente | Camembert (donut) |
| Taxes | Taxes collectées | Taxes déductibles | Barres, courbe, camembert |
| Notes de crédit | Avoirs clients | Avoirs fournisseurs | Barres, courbe, camembert |
| Remboursements | Remb. clients | Remb. fournisseurs | Barres, courbe, camembert |

### 6.2 Choix de conception

| Élément | Décision |
|---------|----------|
| **Ligne d'interprétation** | « Lecture : volumes mensuels en € » etc., positionnée **en bas à gauche du graphique** (v1.59) |
| **Accordéon par défaut** | Trésorerie validée (Répartition) dépliée ; autres cartes repliées |
| **Ordre des cartes** | Trésorerie validée en première position (vue Tout / Cash) |
| Accordéon | Une seule section graphique dépliée à la fois |
| Mode Montants / % | Toggle — % = répartition à 100 % par période |
| Granularité | Jour / Semaine / Mois selon longueur de période |
| Tooltips | Libellés explicites (Encaissements, Décaissements, etc.) — jamais serie1/serie2 |
| Filtres période | Années et mois affichés uniquement s'ils contiennent des données |
| Polling | 10 minutes pour les cartes WithPolling |

---

<a id="7-synthèse-des-interdictions"></a>
## 7. Synthèse des interdictions

### Logo
- Gradient, glow, scale, bounce, underline animé
- Icône ou pictogramme
- Déformation, effet 3D

### Typographie
- Poids 300, 800+
- Montants sans `tabular-nums`
- Texte &lt; 12px sur mobile

### Couleurs
- Fond rouge saturé
- Rose dans la palette (perception lifestyle)
- Couleur décorative sans sens métier

### Composants
- Iconographie colorée (stroke `--text-secondary` uniquement)
- Ombres lourdes
- États d'erreur avec fond saturé

---

<a id="8-index-des-documents-sources"></a>
## 8. Index des documents sources

| Document | Chemin | Rôle |
|----------|--------|------|
| BRAND_LOCK logo | `ZeDocs/web20/BRAND_LOCK_DOREVIA_LINKY_LOGO_v1.0.md` | Spec figée logo |
| Spec typographie | `ZeDocs/web20/SPEC_TYPOGRAPHY_LINKY_v1.0.md` | Typographie normative |
| Rapport typographie | `ZeDocs/web20/RAPPORT_TYPOGRAPHIE_DOREVIA_LINKY.md` | Analyse et recommandations |
| Rapport logo | `ZeDocs/web20/RAPPORT_ANALYSE_SPEC_LOGO_DOREVIA_LINKY_v2.0.md` | Conformité logo |
| Direction artistique | `ZeDocs/web15/DIRECTION_ARTISTIQUE_LINKY.md` | Principes, palette, composants |
| Spec graphiques | `ZeDocs/web19/SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE.md` | Graphiques, accordéon, logo |
| Spec découpage | `ZeDocs/web19/SPEC_LINKY_DECOUPAGE_GRAPHIQUES_v1.0.md` | Options Type/Granularité/Mode par carte |
| Changelog | `ZeDocs/web19/CHANGELOG_GRAPHIQUES_COMPTABILITE.md` | Historique implémentation v1.51–1.58 |
| Analyse plans | `ZeDocs/web19/ANALYSE_PLANS_IMPLEMENTATION_LINKY_REMISE_EN_ETAT.md` | Synthèse plans et specs |

---

**Rapport d'ensemble créé le 15 février 2026.**  
Mise à jour recommandée lors de chaque évolution majeure des specs (logo, typographie, direction artistique, graphiques).
