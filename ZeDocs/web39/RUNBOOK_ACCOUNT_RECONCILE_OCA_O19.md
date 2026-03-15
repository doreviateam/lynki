# Runbook — account_reconcile_oca pour Odoo 19 (o19)

**Date :** 2026-03-07  
**Statut :** 🔄 **Port en cours** — spécification validée, budget accordé par la comptable. Voir `SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md`.  
**OCA 19.0 :** ❌ account_reconcile_oca absent de la branche OCA 19.0 (seul account_statement_base disponible).

---

## 1. Contexte

Le module OCA `account_reconcile_oca` fournit :
- API `reconcile_bank_line()` / `unreconcile_bank_line()` pour le lettrage programmatique
- Widget de lettrage bancaire avancé
- Dépendances : `account_statement_base`, `account_reconcile_model_oca`, `base_sparse_field`

Le connecteur `dorevia_vault_connector` a été adapté pour fonctionner **sans** ce module (fallback sur `write()` + backfill).

---

## 2. État OCA 19.0 (vérification 2026-03-07)

| Module | Branche 19.0 | Disponible |
|--------|--------------|------------|
| **account_statement_base** | ✅ OCA/account-reconcile | Oui (19.0.1.0.0) |
| **account_reconcile_model_oca** | ❌ Absent | Non |
| **account_reconcile_oca** | ❌ Absent | Non |
| **base_sparse_field** | ✅ OCA/server-tools | Oui |

La branche 19.0 de [OCA/account-reconcile](https://github.com/OCA/account-reconcile) ne contient actuellement que **account_statement_base**. Les modules `account_reconcile_model_oca` et `account_reconcile_oca` n'ont **pas encore été migrés** vers Odoo 19.

---

## 3. Conséquences pour o19

| Avec account_reconcile_oca | Sans (situation actuelle) |
|---------------------------|---------------------------|
| API `reconcile_bank_line()` / `unreconcile_bank_line()` | Pas d'API programmatique |
| Lettrage automatisable par script | Lettrage **manuel** uniquement dans l'UI Odoo |
| Widget OCA de lettrage | Interface standard Odoo |

Le connecteur `dorevia_vault_connector` fonctionne sans OCA grâce au fallback :
- Détection des changements `is_reconciled` via `write()`
- Backfill des lignes déjà rapprochées vers DVIG
- Émission des événements `bank.move.reconciled` / `bank.move.unreconciled`

---

## 4. Options

### 4.1 Attendre la migration OCA

Surveiller les dépôts OCA :
- https://github.com/OCA/account-reconcile (branche 19.0)
- Issues/PR : recherche "account_reconcile_oca 19.0"

### 4.2 account_statement_base (installé)

Le module `account_statement_base` (19.0) est **disponible et installé** sur o19. Il étend les vues des relevés bancaires. Il ne fournit **pas** l'API de lettrage OCA (`reconcile_bank_line`), mais prépare le terrain pour une future migration de `account_reconcile_oca`.

- **Emplacement :** `units/odoo/addons-o19/account_statement_base/`
- **Installation :** inclus dans `reinstall_o19.sh` (étape 7)

### 4.3 Contribuer à OCA

Contribuer à la migration de `account_reconcile_oca` vers 19.0 (fork, PR).

---

## 5. Références

- **Stratégie :** `RECOMMANDATION_STRATEGIE_RAPPROCHEMENT_BANCAIRE_O19.md` — Option D validée (attente OCA)
- OCA account-reconcile : https://github.com/OCA/account-reconcile
- OCA server-tools (base_sparse_field) : https://github.com/OCA/server-tools
- Connecteur Vault : `units/odoo/custom-addons/dorevia_vault_connector/models/account_bank_statement_line.py`
- Rapport MOA : `ZeDocs/web39/RAPPORT_MOA_INSTALLATION_O19_2026-03-07.md`
