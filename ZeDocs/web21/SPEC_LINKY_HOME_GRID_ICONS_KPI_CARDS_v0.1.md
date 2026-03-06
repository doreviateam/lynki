# SPEC — LINKY HOME GRID (ICONS + KPI CARDS)

Version: v1.2  
Date: 2026-02-16 — Mise à jour: 2026-02-16 (alignement doc ↔ code : §2.3 positionnement, §3.4 icônes, sources métriques)  
Scope: UI uniquement (aucune modification métier)  
Impact: Layout + Interaction uniquement  
**État : Implémentée (2026-02-16) — Grille d'icônes, mode focus, footer fixe**

---

# 1. OBJECTIF

Structurer la page d’accueil Linky autour :

- **Grille d'icônes** (style Odoo) : page d'accueil affichée lorsque le menu "Tout" (1er groupe COMPTABILITÉ) est sélectionné
- **8 icônes** : une par card KPI (Trésorerie, Cash, Business, Taxes, Notes de crédit, Remboursements, Points de vente, Z de caisse)
- **Clic sur une icône** → ouvre la card correspondante en mode focus
- **Bouton "← Retour au cockpit"** → retour à la grille d'icônes
- Hiérarchie visuelle sobre et institutionnelle

Cette vue constitue le cockpit principal.

---

# 2. STRUCTURE GLOBALE

## 2.0 Page d'accueil — Grille d'icônes

**Contexte** : Le menu burger est organisé en groupes (COMPTABILITÉ, POINT DE VENTE). L'élément "Tout" du 1er groupe (COMPTABILITÉ) mène à la **page d'accueil**.

**Page d'accueil** = grille d'icônes style Odoo (référence : page d'accueil Odoo avec Discussion, Calendrier, Ventes, Facturation, etc.).

- **Affichage** : grille 2–4 colonnes (responsive), **centrée horizontalement** avec décalage vertical 12vh
- **Contenu** : 8 tuiles — chacune : icône + libellé + valeur (métrique)
- **Comportement** : clic sur icône → affiche la card en mode focus ; bouton "Retour" → revient à la grille
- **Implémentation** : composant `IconGrid.tsx`

Ordre des icônes (aligné sur le code) :

1. Trésorerie validée
2. Cash (Encaissements / Décaissements)
3. Business (Ventes certifiées / Achats certifiés)
4. Taxes (TVA collectée / déductible)
5. Notes de crédit (clients + fournisseurs)
6. Remboursements
7. Points de vente
8. Z de caisse (à venir)

*Note* : « À encaisser » et « Rapprochements » sont intégrés respectivement dans Cash et Trésorerie validée. « Exports » est hors scope V1.

---

## 2.1 Layout Desktop — Grille d'icônes

- 2–3 colonnes (responsive)
- Espacement régulier entre icônes
- Chaque tuile : symbole SVG + libellé + valeur (formattée selon le KPI)
- Référence visuelle : Odoo home (grille de modules)

---

## 2.2 Layout Mobile — Grille d'icônes

- 2 colonnes
- Icônes et libellés lisibles
- Pas de scroll horizontal

---

## 2.3 Positionnement vertical

La grille d'icônes est **positionnée** dans l'espace entre le header et le footer fixe. Le conteneur utilise `flex flex-1 min-h-0 items-start justify-center pt-[12vh]` : alignement horizontal centré, décalage vertical de 12vh depuis le haut (évite la collision avec le header en mode compact).

---

# 3. STRUCTURE D'UNE CARD KPI

## 3.1 Composition

Chaque card contient :

- Icône métier (ligne fine, neutre) — *à généraliser* — voir §3.4
- Titre (ex: Trésorerie validée, Cash)
- Métrique principale (montant ou quantité)
- Optionnel : variation ou sous-indicateur discret
- Section graphique (Répartition ou Évolution : barres / courbe / camembert) — *implémenté*

---

## 3.2 Hiérarchie visuelle

Ordre d’importance :

1. Métrique principale
2. Titre
3. Icône

Règles :

- L’icône ne doit pas dominer le chiffre
- Le chiffre doit être immédiatement lisible
- Pas d’effet flashy
- Couleurs limitées (vert / neutre / bleu / rouge léger)

---

## 3.3 Couleurs

- Valeur positive : vert maîtrisé
- Valeur négative : rouge discret
- Valeur neutre : blanc / gris clair
- Fond : cohérent avec thème dark actuel

Pas de dégradé.
Pas d’ombre excessive.
Pas de glass effect.

---

## 3.4 Icônes par card

**Format** : créées en SVG (vectoriel, scalable, intégrables en composant React ou inline).

**Style de référence** : ligne fine (stroke), blanc (#FFF) sur fond sombre, neutre, ne dominant pas le chiffre.

| Card | Icône (référence) | Description |
|------|-------------------|-------------|
| Trésorerie validée | Fronton / temple | Symbole institutionnel — colonnes et fronton (M3 9L12 4L21 9...) |
| Cash | Billet | Billet stylisé avec lignes — encaissements / décaissements |
| Business | Barres | Histogramme 5 barres + ligne de base — ventes / achats |
| Taxes | Symbole % | Diagonale avec deux cercles — pourcentage / TVA |
| Notes de crédit | Document avec trait | Document avec ligne horizontale — avoir |
| Remboursements | Flèche retour | Flèche circulaire retour — remboursement |
| Points de vente | Façade magasin | Toit + façade + porte — point de vente |
| Z de caisse | Reçu / ticket | Document avec lignes — ticket Z |

**Contraintes** :
- Taille raisonnable (icône ne dépasse pas ~24–28px)
- Couleur : `#FFF` en dark mode, ou `currentColor` pour s'adapter au thème
- Trait : `strokeWidth` 1.5–2, `strokeLinecap: round`
- Fichiers SVG réutilisables (composants React ou assets)

---

# 4. INTERACTION

## 4.1 Clic sur une icône (page d'accueil)

Comportement (implémenté) :

- **Page d'accueil** (viewMode "all") : affiche la grille d'icônes (centrée verticalement)
- **Clic sur une icône** → activation du "Mode Focus"
- La card correspondante s'affiche (toute la largeur)
- La grille d'icônes disparaît
- Apparition d'un bouton "← Retour au cockpit"
- Clic sur "Retour" → retour à la grille d'icônes
- Pas de changement d'URL (V1)

*Implémentation* : `IconGrid` + `focusedCardId` dans `DashboardWithFilters.tsx`. Chaque icône appelle `onFocusRequest(cardId)`.

---

## 4.2 Mode Focus

La card peut afficher :

- Sous-sections verticales
- Graphiques détaillés
- Détail analytique
- Historique temporel

Structure recommandée :

--------------------------------
← Retour au cockpit
--------------------------------
[ Icône ]  Titre

Métrique principale

--------------------------------
SECTION 1
--------------------------------

--------------------------------
SECTION 2
--------------------------------

--------------------------------
SECTION 3
--------------------------------

Scroll vertical uniquement.

---

## 4.3 Retour

- Bouton sticky en haut (mobile)
- Bouton visible immédiatement (desktop)
- Restaure la grille complète
- Conserve société et période sélectionnées

---

# 5. RÈGLES DE DESIGN

## 5.1 Tonalité

- Institutionnel
- Sobre
- Stable
- Aucun effet startup
- Aucun micro-animé agressif

---

## 5.2 Animation

Optionnelle :

- Transition douce (fade ou expand léger)
- 150–250ms max
- Pas d’effet spectaculaire

---

# 6. ACCESSIBILITÉ

- **Grille d'icônes** : chaque icône cliquable (bouton ou zone cliquable)
- Focus clavier possible
- Libellés aria-label pour chaque icône (ex. "Ouvrir la card Trésorerie")
- Contraste WCAG acceptable

---

# 7. NON-OBJECTIFS

- Pas de refonte UX complète
- Pas de navigation multi-pages
- Pas d’intégration IA
- Pas de deep linking (V1)
- Pas de mode personnalisable par utilisateur

---

# 8. EXTENSIONS FUTURES (HORS SCOPE V1)

- Deep linking (URL /focus/cash)
- Personnalisation de l’ordre des cards
- Mode compact / détaillé
- Badges d’alerte
- Intégration DIVA dans le mode focus

---

# 9. CRITÈRE DE VALIDATION

La page doit :

- Être lisible en 2 secondes
- Permettre un accès rapide à chaque indicateur
- Conserver une impression institutionnelle
- Éviter la surcharge cognitive
- Maintenir la cohérence cockpit

---

# 10. PHILOSOPHIE PRODUIT

Cette grille n’est pas un dashboard marketing.

C’est un panneau de contrôle financier fondé sur des données scellées.

Elle doit inspirer :

- Confiance
- Stabilité
- Maîtrise
- Clarté

---

# ANNEXE A — État d’implémentation (2026-02-16)

## Mapping SPEC → Composants Linky

| Card SPEC | Composant | viewMode | Implémenté |
|-----------|-----------|----------|------------|
| Trésorerie validée | `TreasuryCardWithPolling` | all, cash | Oui |
| Cash (Encaissements / Décaissements) | `FluxCashCardWithPolling` | all, cash | Oui |
| Business (Ventes / Achats) | `BusinessCardWithPolling` | all, business | Oui |
| Taxes | `TaxesCardWithPolling` | all, business | Oui |
| Avoirs (Notes de crédit) | `CreditNotesCardWithPolling` | all, corrections | Oui |
| Remboursements | `RefundsCardWithPolling` | all, cash, corrections | Oui |
| Points de vente | `PosShopsView` | all, pos_shops | Oui |
| Z de caisse | `PosComingSoonView` | all, pos_z | Placeholder « à venir » |
| Exports | — | — | Non (hors scope V1) |

## Composants disponibles non utilisés (réservés)

- `SalesCardWithPolling` — Ventes seules
- `PurchasesCardWithPolling` — Achats seuls
- `PaymentsCardWithPolling` — Paiements (encaissés / décaissés)
- `AdjustmentsCardWithPolling` — Corrections / ajustements

## Fichiers implémentation (units/dorevia-linky)

| Composant | Fichier |
|-----------|---------|
| Grille + page d'accueil | `components/IconGrid.tsx` |
| Dashboard parent | `components/DashboardWithFilters.tsx` |
| Icônes SVG | `components/CardIcons.tsx` |
| API métriques | `app/api/dashboard-metrics/route.ts` |

## Implémenté

- **Page d'accueil = grille d'icônes** : `IconGrid` affiché quand viewMode=all
- **Grille 2–4 colonnes** : responsive (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4`)
- **Positionnement** : grille centrée horizontalement, `pt-[12vh]` (décalage vertical)
- **Mode Focus** : clic icône → affiche la card ; bouton Retour → grille
- **Icônes dédiées** : `CardIcons.tsx` (8 icônes SVG)

## Référence visuelle icônes

- **Format** : SVG (stroke), composants React (`CardIcons.tsx`)
- **Style** : `stroke="currentColor"`, `strokeWidth: 1.8–2`, `strokeLinecap/Linejoin: round`
- **Taille** : `h-6 w-6` (24px) sur les cards ; grille : icône `h-10 w-10` (40px) dans conteneur `h-16 w-16` (64px)
- **Couleur** : `text-[var(--accent)]` sur la grille (conteneur `bg-[var(--accent-soft)]/30`)
- **Référence page d'accueil** : grille Odoo (Discussion, Calendrier, Ventes, Facturation, etc.)

## Sources des métriques (grille)

Chaque tuile appelle `GET /api/dashboard-metrics` (polling 10 min). L’API agrège les routes Vault suivantes :

| Tuile | Route(s) Vault | Champ / logique |
|-------|----------------|-----------------|
| Trésorerie validée | `GET /ui/aggregations/treasury` | `reliability_rate` ou `reconciliation_rate` → `X %` |
| Cash | `payments-in`, `payments-out` | encaissements − décaissements → montant signé |
| Business | `sales`, `purchases` | `total_ht` ventes − achats → montant signé |
| Taxes | `sales`, `purchases` | TVA collectée − déductible → montant signé |
| Notes de crédit | `adjustments` (event_type credit_note.*) | avoirs fournisseurs − clients → montant signé |
| Remboursements | `adjustments` (event_type refund.*) | remboursements fournisseurs − clients → montant signé |
| Points de vente | `pos-sessions` | total ventes sessions scellées (`vault_status=sealed`) |
| Z de caisse | — | Placeholder `—` (à venir) |

- **ValueKind** : `positive`, `negative`, `zero`, `accent`, `accent_soft`, `neutral`, `placeholder` — utilisé pour la couleur du libellé.
