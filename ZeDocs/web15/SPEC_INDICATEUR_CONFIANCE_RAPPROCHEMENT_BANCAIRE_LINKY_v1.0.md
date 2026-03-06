# SPEC — Indicateur de Confiance Rapprochement Bancaire (Linky)

**Version** : 1.0  
**Date** : 11 février 2026  
**Produit** : Dorevia Linky  
**Objectif** : Afficher un indicateur global de santé du rapprochement bancaire, discret, informatif et orienté fiabilité comptable.

---

## 1. Objectif Fonctionnel

Afficher un indicateur global 🏦 dans le header permettant de visualiser l'état de rapprochement des comptes bancaires du tenant.

Cet indicateur :

- Est **global au tenant**
- Reflète la fiabilité comptable de la trésorerie affichée
- Ne surcharge pas l'interface
- Est **complémentaire** au 🔒 Vaultage

---

## 2. Position UX

### 2.1 Placement

- **Emplacement** : Header, à droite du 🔒 (Vaultage)
- **Ordre** : `[Badge tenant] [Icône vault 🔒] [Icône rapprochement 🏦] [Menu hamburger]`

### 2.2 Règles visuelles (Direction Artistique)

Référence : `DIRECTION_ARTISTIQUE_LINKY.md` v1.3

| Règle | Application |
|-------|-------------|
| Icône | Outline uniquement, stroke 1,5 px |
| Couleur | Sémantique selon statut |
| Interaction | Hover : tooltip ; Clic : popover détail |

---

## 3. Définition du Taux de Rapprochement

### 3.1 Principe

Le taux de rapprochement reflète la part des écritures bancaires comptables ayant été rapprochées avec un relevé bancaire réel.

### 3.2 Formule (niveau agrégé tenant)

```
Taux = (montant des écritures rapprochées / montant total des écritures bancaires) × 100
```

**Alternative acceptable** (si plus simple à implémenter, à documenter) :

```
Taux = (nombre d'écritures rapprochées / nombre total d'écritures bancaires) × 100
```

La méthode choisie doit être **stable et documentée** côté source (Odoo).

### 3.3 Périmètre

**Écritures bancaires** : lignes de relevé bancaire (`account.bank.statement.line`) :

- Toutes les lignes de relevé (postées)
- Montant : `amount` (montant signé selon sens)
- Rapprochées : `is_reconciled = True`

**Éventuels filtres** :

- Par `company_id` (si multi-société)
- Exclure les lignes de type « ouverture » / « clôture » si pertinent

---

## 4. Règles de Couleur

| Statut | Seuil | Couleur | Variable CSS | Signification |
|--------|-------|---------|--------------|---------------|
| 🟢 Vert | ≥ 95 % | Vert | `--positive` | Rapprochement à jour |
| 🟠 Orange | 80–95 % | Orange | `--warning` | Rapprochement partiel |
| 🔴 Rouge | &lt; 80 % | Rouge | `--negative` | Rapprochement insuffisant |

**Règles** :

- Contrairement au vaultage, le rapprochement n'est pas censé être à 100 % en permanence
- Un léger décalage est acceptable selon la fréquence de gestion bancaire
- Si **aucune donnée** disponible : icône en `--text-secondary` ou `--accent`, état neutre

---

## 5. Comportement UX

### 5.1 État Normal (Vert)

- Icône verte discrète
- Pas de texte affiché
- Opacité 80 %

### 5.2 État Orange

- Icône orange
- Tooltip : *« Rapprochement bancaire partiel »*
- Aucune alerte bloquante

### 5.3 État Rouge

- Icône rouge
- Tooltip : *« Rapprochement bancaire insuffisant — La trésorerie affichée peut ne pas être totalement alignée avec la banque »*

### 5.4 État Indisponible

- Icône grise ou bleue (`--text-secondary` / `--accent`)
- Tooltip : *« Indicateur temporairement indisponible »*
- Clic : popover avec message d'indisponibilité

---

## 6. Détail au Clic

### 6.1 Popover / Modal

Au clic sur l'icône, ouverture d'un popover affichant :

```
Rapprochement bancaire : 87 %
Dernier relevé traité : 05/02/2026
Écritures non rapprochées : 12
Montant non rapproché : 3 420 €
Comptes bancaires concernés : 2
```

### 6.2 Format des libellés

| Champ | Libellé UI | Source |
|-------|------------|--------|
| Taux | Rapprochement bancaire : X % | `reconciliation_rate` |
| Dernier relevé | Dernier relevé traité : JJ/MM/AAAA | `last_statement_date` |
| Non rapprochées | Écritures non rapprochées : N | `unreconciled_entries` |
| Montant | Montant non rapproché : X € | `unreconciled_amount` |
| Comptes | Comptes bancaires concernés : N | `bank_accounts_count` |

---

## 7. Contract API

### 7.1 Route Vault

**Méthode** : `GET`  
**Chemin** : `/ui/system/bank-reconciliation-health`  
**Paramètres** : `tenant` (requis), `company_id` (optionnel)

**Exemple** :
```
GET /ui/system/bank-reconciliation-health?tenant=sarl-la-platine
```

### 7.2 Réponse JSON attendue

```json
{
  "reconciliation_rate": 87.3,
  "last_statement_date": "2026-02-05",
  "unreconciled_entries": 12,
  "unreconciled_amount": 3420.00,
  "bank_accounts_count": 2
}
```

**Champs** :

| Champ | Type | Description |
|-------|------|-------------|
| `reconciliation_rate` | `number \| null` | Taux en % (0–100), ou `null` si indisponible |
| `last_statement_date` | `string \| null` | Date du dernier relevé traité (YYYY-MM-DD), ou `null` |
| `unreconciled_entries` | `number` | Nombre d'écritures non rapprochées |
| `unreconciled_amount` | `number` | Montant total non rapproché (signé ou valeur absolue, à documenter) |
| `bank_accounts_count` | `number` | Nombre de comptes bancaires/journaux concernés |

### 7.3 Codes HTTP

| Code | Signification |
|------|---------------|
| 200 | Données disponibles |
| 503 | Service indisponible (Odoo down, etc.) — client affiche état indisponible |

### 7.4 RBAC

- Permission : `PermissionReadDocuments` (alignement avec les autres routes `/ui/*`)

---

## 8. Architecture Technique

### 8.1 Chaîne de données

```
Odoo (account.bank.statement.line, account.bank.statement)
         ↑
         Source de vérité pour rapprochement bancaire
```

Les données de rapprochement bancaire sont dans **Odoo**, pas dans Vault.

### 8.2 Implémentation

**Option A (cible)** : Vault appelle Odoo

- Variable d'environnement : `ODOO_BANK_RECONCILIATION_URL` (ex. `http://odoo:8069/dorevia/vault/linky_bank_reconciliation`)
- Ou réutilisation de `ODOO_URL` + chemin fixe si Odoo expose la route
- Vault implémente `GET /ui/system/bank-reconciliation-health` et appelle Odoo (proxy)

**Option B (alternative)** : Linky appelle Odoo directement

- Variable Linky : `ODOO_BANK_RECONCILIATION_URL`
- Linky appelle Odoo sans passer par Vault (moins cohérent avec l'architecture « Linky → Vault »)

**Option C (fallback)** : Stub temporaire

- Si Odoo non configuré ou injoignable : Vault retourne `reconciliation_rate: null`, autres champs à 0 ou null
- Le client affiche l'état « indisponible »

### 8.3 Route Odoo à créer

**Chemin** : `GET /dorevia/vault/linky_bank_reconciliation`  
**Paramètres** : `tenant` (optionnel), `company_id` (optionnel)  

**Contrat** : retourne le même format JSON que la route Vault.

**Implémentation Odoo** (indicative) :

- Requête sur `account.bank.statement.line` joint à `account.bank.statement`
- Filtrer par `statement_id.state = 'posted'` (ou `posted` / `closed`)
- Agrégation : `SUM(amount)` où `is_reconciled`, `SUM(amount)` total
- `last_statement_date` = `MAX(statement_id.date)` des relevés postés
- `unreconciled_entries` = `COUNT(*)` où `is_reconciled = False`
- `unreconciled_amount` = `SUM(amount)` où `is_reconciled = False`
- `bank_accounts_count` = nombre de `journal_id` distincts

### 8.4 Route Linky

- **Chemin Linky** : `GET /api/bank-reconciliation-health?tenant={tenant}`
- **Proxy** : Forward vers `{VAULT_URL}/ui/system/bank-reconciliation-health?tenant={tenant}`
- **Cache** : `revalidate: 0`, `dynamic: "force-dynamic"` (pas de cache)

---

## 9. Règles Importantes

- Aucun affichage de pourcentage sur l'écran principal
- Le taux détaillé n'est visible qu'au clic (dans le popover)
- L'indicateur ne doit pas concurrencer la Trésorerie
- Il informe sur la **fiabilité comptable**, pas sur la performance

---

## 10. Philosophie Produit

Le rapprochement bancaire est un **indicateur de fiabilité comptable**, pas un KPI business.

Il indique :

- Jusqu'à quelle date la trésorerie est alignée avec la banque
- Le niveau de rigueur comptable actuel

Il ne doit pas :

- Générer d'anxiété inutile
- Remplacer la discipline comptable

---

## 11. Interaction avec Vaultage

Les deux indicateurs ont des rôles distincts :

| Indicateur | Rôle |
|------------|------|
| 🔒 Vaultage | Santé du système de preuve (données scellées) |
| 🏦 Rapprochement | Santé de la cohérence bancaire (fiabilité trésorerie) |

Ils doivent rester :

- Complémentaires
- Indépendants
- Visuellement équilibrés

---

## 12. Non-Objectifs

- Pas d'indicateur par card
- Pas d'affichage permanent du pourcentage
- Pas de monitoring DevOps visible
- Pas d'intégration dans les KPIs métier ou la Trésorerie

---

## 13. Références

| Document | Usage |
|----------|-------|
| `DIRECTION_ARTISTIQUE_LINKY.md` v1.3 | Couleurs, icônes, placement header |
| `SPEC_INDICATEUR_CONFIANCE_VAULTAGE_LINKY_v1.0.md` | Structure spec, pattern API |
| `nav_linky.md` | Philosophie produit |
| Odoo `account.bank.statement.line` | Champ `is_reconciled`, `amount` |

---

## 14. Statut attendu après implémentation

Linky affiche deux indicateurs globaux de confiance :

- 🔒 Santé des données scellées
- 🏦 Fiabilité bancaire

Sans surcharge visuelle, avec rigueur comptable assumée.
