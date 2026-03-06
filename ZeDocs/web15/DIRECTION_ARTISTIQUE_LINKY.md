# Direction artistique — Dorevia Linky

**Version** : 1.3  
**Date** : 11 février 2026  
**Objectif** : Définir un visuel moderne, élégant et informationnel pour Linky, orienté contrôle, lisibilité et sérénité.  
**Priorité affichage** : mobile (1) → tablette (2) → bureau (3).

---

## 1. Principes fondateurs

### 1.1 Ambiance générale

Le visuel doit communiquer :
- **Clarté** : lecture immédiate des chiffres
- **Stabilité émotionnelle** : pas d'agressivité visuelle
- **Confiance** : esthétique fintech sérieuse
- **Contrôle** : hiérarchie forte, montants dominants
- **Sémantique visuelle** : la couleur transmet une information métier, jamais une décoration

### 1.2 Émotion recherchée

Linky doit évoquer : **élégance**, **maîtrise**, **sérénité**, **stabilité**.

Pas gamifié. Pas décoratif. Pas crypto.

### 1.3 Synthèse

> Dorevia Linky est une application moderne et élégante qui permet de contrôler la trésorerie en temps réel et d'expliquer chaque variation avec sérénité.
>
> La forme est douce. Le fond est solide.

---

## 2. Philosophie couleur

**Règle centrale** : La couleur n'est jamais décorative. Elle est **informationnelle**.

- Le **montant principal** (chiffre brut) reste neutre (`--text`)
- La **variation** ou l'**interprétation** porte la couleur (vert / rouge / bleu / ambre)
- Les fonds ne deviennent jamais saturés
- Jamais de fond rouge saturé, même en erreur

### 2.1 Couleur contextuelle

La couleur dépend du **sens métier**, pas uniquement du signe mathématique.

| Contexte | Couleur |
|---|---|
| Hausse, positif, entrée | `--positive` |
| Baisse, négatif, sortie problématique | `--negative` |
| Attention douce, prévision | `--warning` |
| Information neutre, structure | `--accent` |
| Retard, alerte (URSSAF, etc.) | `--negative` |

---

## 3. Palette

### 3.1 Fonds

| Variable | Valeur | Usage |
|---|---|---|
| `--bg` | `#f8fafc` | Fond principal (body) |
| `--bg-page` | `#ffffff` | Fond écrans |
| `--bg-subtle` | `#f1f5f9` | Survols, zones secondaires |
| `--bg-card` | `#ffffff` | Fond des cartes |

### 3.2 Accents doux (pastels désaturés)

| Variable | Valeur | Usage |
|---|---|---|
| `--pastel-bleu` | `#eff6ff` | Header, zones info |
| `--pastel-vert` | `#ecfdf5` | Cash, positif |
| `--pastel-ambre` | `#fffbeb` | Taxes, alertes douces |
| `--pastel-violet` | `#f5f3ff` | Corrections, ajustements |

> ⚠️ Pas de rose : évite une perception trop lifestyle.

### 3.3 Couleurs sémantiques

| Variable | Usage | Valeur |
|---|---|---|
| `--accent` | Information neutre, titres, liens | `#1e40af` |
| `--accent-soft` | Badges, pills | `#dbeafe` |
| `--positive` | Performance positive, flux positif | `#16a34a` |
| `--positive-soft` | Fond badges positifs | `#dcfce7` |
| `--negative` | Contre-performance, flux négatif | `#dc2626` |
| `--negative-soft` | Fond erreur/alerte (jamais saturé) | `#fef2f2` |
| `--warning` | Attention douce, prévision | `#f59e0b` |

### 3.4 Texte

| Variable | Valeur |
|---|---|
| `--text` | `#0f172a` |
| `--text-secondary` | `#475569` |
| `--muted` | `#64748b` |
| `--muted-light` | `#94a3b8` |

### 3.5 Bordures et ombres

| Variable | Valeur | Usage |
|---|---|---|
| `--border` | `#e2e8f0` | Bordures par défaut |
| `--border-light` | `#f1f5f9` | Bordures subtiles |
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,0.04)` | Ombres légères |
| `--shadow-card` | `0 4px 16px rgba(15,23,42,0.04)` | Cartes — moderne, discret |

> Objectif : modernité discrète, pas effet template.

---

## 4. Typographie

### 4.1 Police

- **Police principale** : Inter (`next/font`).
- **Fallback** : `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.

### 4.2 Hiérarchie des montants

| Usage | Taille | Graisse | Couleur |
|---|---|---|---|
| **Montant principal** | 1.25rem (20px) | 700 | `--text` (neutre) |
| **Variation / flux** | 0.8125rem (13px) | 600 | Sémantique (vert/rouge) |
| **Montant détail** | 0.875rem (14px) | 600 | `--text` |

Exemple : *28 540 €* (neutre) + *+12% vs N-1* (vert).

### 4.3 Échelle globale

| Usage | Taille | Graisse |
|---|---|---|
| Titre écran | 1.25rem (20px) | 700 |
| Titre carte | 1.125rem (18px) | 700 |
| Label section | 0.6875rem (11px) | 700 |
| Corps | 0.875rem (14px) | 500 |
| Petit | 0.75rem (12px) | 500 |

### 4.4 Règles

- **Montants** : `tabular-nums` obligatoire
- **Labels section** : `uppercase` + `tracking-wider`
- **Lisibilité** : pas de texte &lt; 12px sur mobile

---

## 5. Espacement et mise en page

### 5.1 Grille mobile (priorité)

| Variable | Valeur | Usage |
|---|---|---|
| `--max-w-mobile` | 480px | Largeur max contenu |
| `--padding-x` | 1rem (16px) | Padding horizontal |
| `--space-card` | 1.25rem (20px) | Entre les cartes |
| `--space-inner` | 1.5rem (24px) | Padding intérieur cartes |
| `--radius-card` | 1.25rem (20px) | Coins des cartes |
| `--radius-control` | 0.75rem (12px) | Selects, boutons |

### 5.2 Breakpoints

| Breakpoint | Largeur | Usage |
|---|---|---|
| `sm` | 640px | Tablette portrait |
| `md` | 768px | Tablette paysage |
| `lg` | 1024px | Bureau |
| `xl` | 1280px | Bureau large |

### 5.3 Responsive

- **Mobile** : une colonne, cartes pleine largeur, header compact
- **Tablette** : même mise en page, max-width augmenté si besoin
- **Bureau** : contenu centré, max-width conservé (esprit app mobile)

---

## 6. Composants

### 6.1 Header

- **Fond** : dégradé blanc léger
- **Bordure basse** : `--border`
- **Pills** : `--accent-soft` + `--accent`
- **Sélecteurs** : fond blanc, bordure `--border`, focus `--accent`

### 6.2 Cartes

- **Fond** : blanc
- **Ombre** : `--shadow-card` (réduite, premium)
- **Coins** : 20px
- **Barre gauche** : 4px max, couleur **dynamique selon le flux** (voir §7.2)
- **Titre** : `--accent`, gras, uppercase
- **Montant flux** : Cash et Business → vert/rouge ; Taxes, Notes de crédit, Remboursements → bleu (voir §7.3)
- **Contraintes** : couleurs limitées à 2–3 teintes visibles simultanément ; jamais fond saturé

### 6.3 Skeleton loading

- **Shimmer** : gradient désaturé sur fond gris clair
- **Durée** : ~1,5 s

### 6.4 États d'erreur

- **Fond** : `--negative-soft` (jamais saturé)
- **Bordure** : rouge très clair
- **Texte** : `--negative`

### 6.5 Iconographie

- **Style** : outline uniquement
- **Stroke** : 1,5 px
- **Couleur** : toujours `--text-secondary`
- **Jamais colorée** : minimalisme strict

---

## 7. Application par écran

### 7.1 Header

| Élément | Règle |
|---|---|
| Logo / marque | `--accent`, gras |
| Badge tenant | `--accent-soft` + `--accent` |
| Ligne Société | label `--muted`, select blanc |
| Ligne Période | label `--muted`, selects blancs |
| Menu hamburger | icône `--text-secondary`, hover `--bg-subtle` |

### 7.2 Cartes (accents gauche)

La barre gauche reflète le sens du flux. **Deux règles distinctes** :

**Cash et Business** — vert/rouge selon performance :
| Carte | Flux positif | Flux négatif |
|---|---|---|
| Cash | `--positive` (vert) | `--negative` (rouge) |
| Business | `--positive` (vert) | `--negative` (rouge) |

**Taxes, Notes de crédit, Remboursements** — bleu selon flux :
| Carte | Flux = 0 | Flux ≠ 0 |
|---|---|---|
| Taxes | `--accent-soft` (bleu pâle) | `--accent` (bleu foncé) |
| Notes de crédit | `--accent-soft` | `--accent` |
| Remboursements | `--accent-soft` | `--accent` |

**Chargement** : bordure `--muted` (neutre). **Erreur** : bordure `--negative`.

### 7.3 Contenu carte

| Zone | Style |
|---|---|
| Ligne titre + montant flux | flex justify-between, bordure basse |
| Montant flux (Cash, Business) | `--positive` ou `--negative` selon signe |
| Montant flux (Taxes, Notes de crédit, Remboursements) | `--accent-soft` si flux = 0, `--accent` si flux ≠ 0 |
| Lignes détail | label `--text-secondary`, montant `--text` + tabular-nums |

---

## 8. Checklist avant implémentation

- [ ] Mise à jour des variables CSS dans `globals.css`
- [ ] Suppression du pastel-rose (si présent)
- [ ] Ombres réduites (`--shadow-card`)
- [ ] Vérification breakpoints (mobile, tablette, bureau)
- [ ] Tests de contraste (WCAG AA)
- [ ] Iconographie en `--text-secondary` uniquement
- [ ] États d'erreur : fond doux, jamais saturé
