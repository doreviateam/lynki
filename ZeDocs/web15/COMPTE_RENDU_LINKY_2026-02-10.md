# Compte rendu — État du projet Dorevia Linky

**Date** : 10–11 février 2026  
**Branche** : `feature/landing-v2-refonte`  
**Environnement** : lab (tenant `sarl-la-platine`)  
**Référence visuelle** : [DIRECTION_ARTISTIQUE_LINKY.md](DIRECTION_ARTISTIQUE_LINKY.md) v1.3

---

## 1. Architecture déployée

| Service | Image | Conteneur | Rôle |
|---|---|---|---|
| **Linky** | `dorevia/linky:v1.2-adjustments` | `linky_lab_sarl-la-platine` | Dashboard financier Next.js |
| **Vault** | `dorevia/vault:v1.7.0-adjustments` | `vault-core-stinger` | Store de preuves + agrégations |
| **Vault DB** | `postgres:16` | `vault-db-core-stinger` | Base PostgreSQL |
| **DVIG** | `dorevia/dvig:0.1.6` | `dvig-core-stinger` | Ingestion Odoo → Vault |

Tous les services communiquent via le réseau Docker `dorevia-network`. Linky est exposé via Caddy (reverse proxy).

---

## 2. Linky — Fonctionnalités implémentées

### Header (`ReportHeader.tsx`)

- Brand « Dorevia Linky » + badge tenant
- **Sélecteur Société** : dropdown avec auto-sélection de la première société (alimenté par Vault `/ui/companies`)
- **Sélecteur Période** : deux dropdowns côte à côte (Exercice à date / Janvier…Décembre + Année)
- **Menu hamburger** : navigation Comptabilité (Tout, Cash, Business, Corrections) + section « Point de vente » (à venir)

### Cards agrégées (5 cartes)

| Carte | Vue(s) | Données |
|---|---|---|
| **Cash** | Tout, Cash | Encaissements / Décaissements → Flux net |
| **Business** | Tout, Business | Ventes HT / Achats HT → Flux net |
| **Taxes** | Tout, Business | Taxes collectées / Taxes déductibles → Flux net |
| **Notes de crédit** | Tout, Corrections | Avoirs clients / Avoirs fournisseurs → Flux net |
| **Remboursements** | Tout, Corrections | Remb. clients / Remb. fournisseurs → Flux net |

### Règles couleurs (bordure + montant flux)

**Cash et Business** — vert/rouge selon performance :
- Bordure gauche : vert si flux > 0, rouge si flux < 0
- Montant flux : vert (`--positive`) ou rouge (`--negative`)

**Taxes, Notes de crédit, Remboursements** — bleu selon flux :
- Bordure gauche : bleu pâle (`--accent-soft`) si flux = 0, bleu foncé (`--accent`) si flux ≠ 0
- Montant flux : bleu pâle si flux = 0, bleu foncé si flux ≠ 0

**Chargement** : bordure `--muted`. **Erreur** : bordure + fond `--negative-soft`, texte `--negative`.

### UX / Design

- **Police** : Inter (Google Fonts, optimisée via `next/font`)
- **Palette** : DA v1.3 — accent `#1e40af`, pastels désaturés, ombres réduites
- **Barre gauche** : 4px, dynamique selon flux (voir règles ci-dessus)
- **Skeleton loading** : animation shimmer pendant le chargement
- **Header gradient** : dégradé subtil pour la profondeur
- **Layout carte** : titre + montant flux en haut, détails en dessous
- **Mobile-first** : largeur max 480px, sticky header

### API Routes Linky (proxy vers Vault)

| Route Linky | Endpoint Vault |
|---|---|
| `/api/sales` | `/ui/aggregations/sales` |
| `/api/purchases` | `/ui/aggregations/purchases` |
| `/api/payments-in` | `/ui/aggregations/payments-in` |
| `/api/payments-out` | `/ui/aggregations/payments-out` |
| `/api/adjustments` | `/ui/aggregations/adjustments` |
| `/api/companies` | `/ui/companies` |

---

## 3. Vault — Routes enregistrées (`main.go`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Page d'accueil |
| GET | `/health` | Health check |
| GET | `/version` | Version |
| GET | `/dbhealth` | Santé base de données |
| GET | `/ui/companies` | Liste des sociétés par tenant |
| GET | `/ui/aggregations/sales` | Agrégation ventes |
| GET | `/ui/aggregations/purchases` | Agrégation achats |
| GET | `/ui/aggregations/payments-in` | Agrégation encaissements |
| GET | `/ui/aggregations/payments-out` | Agrégation décaissements |
| GET | `/ui/aggregations/adjustments` | Agrégation ajustements |

> **Note** : De nombreux handlers existent dans le code source (invoices, events, payments, constats, proof, ledger, etc.) mais ne sont **pas enregistrés** dans `main.go`. Ils sont disponibles pour activation future.

---

## 4. Tenant `sarl-la-platine`

- **2 sociétés** détectées : `odoo:1` (SARL La Platine, 37 documents) et `odoo_account:1` (15 documents)
- **Environnement** : lab
- **Mode domaine** : SaaS
- **Univers** : odoo, ui
- **Noms affichés** : configurés via `COMPANY_DISPLAY_NAMES` dans le docker-compose Linky

---

## 5. Modifications effectuées

### 10/02/2026

1. Sélecteur de période refactoré → 2 dropdowns (mois/YTD + année)
2. « Exercice à date » placé en premier dans la liste
3. Barre « Board Performance » supprimée
4. 5 améliorations visuelles : flux coloré vert/rouge, barre d'accent par carte, skeleton shimmer, police Inter, gradient header
5. Layout cartes : montant flux déplacé en haut à droite du titre, suppression du préfixe « Flux : »
6. Badge « Cash » redondant supprimé du header
7. Sélecteur société déplacé du drawer vers le header (toujours visible)
8. Route `/ui/companies` branchée dans Vault `main.go` (handler existant, non enregistré)
9. Option « Toutes les sociétés » supprimée, auto-sélection de la première société

### 11/02/2026 — Direction artistique v1.2/v1.3

1. **Palette** : `globals.css` aligné sur la DA (accent `#1e40af`, pastels, ombres réduites, `--warning`, `--accent-violet`)
2. **Bordure dynamique Cash & Business** : vert si flux positif, rouge si flux négatif (au lieu de fixe)
3. **Bordure + montant bleu** pour Taxes, Notes de crédit, Remboursements : bleu pâle si flux = 0, bleu foncé si flux ≠ 0
4. **États d'erreur** : fond `--negative-soft`, bordure `--border-error`, texte `--negative`
5. **Iconographie** : stroke 1,5 px, `--text-secondary` pour hamburger et chevrons

---

## 6. Points d'attention / Prochaines étapes possibles

| Sujet | Détail | Priorité |
|---|---|---|
| Routes Vault non enregistrées | Handlers invoices, events, constats, proof, ledger export… existent mais inactifs dans `main.go` | Moyenne |
| Noms de sociétés | Actuellement via env var `COMPANY_DISPLAY_NAMES` — pourrait être automatisé depuis Odoo | Faible |
| Police Inter | Téléchargement Google Fonts échoue au build Docker (pas de réseau) — fonctionne en fallback système, pourrait être bundlée localement | Faible |
| Composants non utilisés | `SalesCard`, `PurchasesCard`, `PaymentsCard`, `AdjustmentsCard`, `BottomNav` sont encore dans le repo mais plus importés — à nettoyer | Faible |
| Point de vente | Section « Bientôt disponible » dans le menu hamburger — à implémenter quand les données POS seront prêtes | Future |
