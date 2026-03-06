# Note corrective — Unicité `dorevia_dvig_event_id` (account.move)

**Date** : 2026-01-24  
**Module** : `dorevia_vault_connector`  
**Fichier concerné** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`  
**Statut** : Rédaction préalable à la correction (aucune modification de code à ce stade)

---

## 1. Contexte

Le module **dorevia_vault_connector** ajoute sur `account.move` un champ **`dorevia_dvig_event_id`** (identifiant d'événement DVIG/Vault). Ce champ est :

- Déclaré **sans** `copy=False`
- Soumis à un **index unique** en base : `idx_account_move_dvig_event_id_unique` (WHERE `dorevia_dvig_event_id IS NOT NULL`)

L'**event_id** est attribué exclusivement par le CRON #1 (`cron_vault_send_dvig`) après envoi réussi vers DVIG.

👉 Tant que l'événement n'a pas été envoyé et acquitté, le champ doit rester **NULL**.

---

## 2. Symptôme / Cause

### Symptôme

Lors d'une **extourne** ou d'une **duplication** d'une facture fournisseur :

```text
duplicate key value violates unique constraint
idx_account_move_dvig_event_id_unique
```

### Cause

Odoo recopie automatiquement les champs lors d'un `copy()`.

Comme `dorevia_dvig_event_id` n'a pas `copy=False` :

- l'avoir hérite de l'event_id de la facture d'origine
- deux événements distincts partagent le même identifiant Vault
- la contrainte unique SQL bloque l'enregistrement

---

## 3. Objectif du correctif

- **R-F1** : Un `account.move` correspond à **un événement Vault unique**
- **R-F2** : Toute duplication (extourne, avoir, copy) ne doit **jamais recopier** `dorevia_dvig_event_id`
- **R-F3** : `dorevia_dvig_event_id` n'est renseigné **que par DVIG**, jamais localement
- **R-F4** : Un avoir est un **nouvel événement financier** → preuve distincte

---

## 4. Règles fonctionnelles

| Id   | Règle |
|------|--------|
| R-F1 | Unicité de `dorevia_dvig_event_id` lorsqu'il est non NULL |
| R-F2 | Aucune copie de l'event_id lors d'un copy/extourne |
| R-F3 | Champ NULL jusqu'au retour DVIG |
| R-F4 | Chaque mouvement comptable = événement Vault distinct |

---

## 5. Spécification technique du correctif

### 5.1 Champ `dorevia_dvig_event_id`

#### T-1 — Empêcher la copie automatique

```python
dorevia_dvig_event_id = fields.Char(..., copy=False)
```

#### T-2 — Sécuriser la méthode `copy()`

```python
default['dorevia_dvig_event_id'] = False
```

#### T-3 — Conserver la contrainte unique

Aucune modification.

---

### 5.2 Champ `dorevia_vault_idempotency_key` (recommandé)

```python
dorevia_vault_idempotency_key = fields.Char(..., copy=False)
```

---

## 6. Cas de test

### Extourne / Avoir

- nouvel avoir sans erreur SQL
- `event_id` NULL puis rempli par DVIG

### Duplication manuelle

- champ event_id vide

### Contrainte unique

- collision bloquée en base

---

## 7. Migration

Aucune obligatoire. NULL autorisé.

---

## 8. Invariant produit

> event_id non NULL = événement envoyé et acquitté DVIG

---

## 9. Bénéfices

- Extournes fiables
- Preuves uniques
- Vaulting robuste
