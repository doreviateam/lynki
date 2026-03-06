# 🧪 Script d'exécution des tests — dorevia_vault_connector

## 📋 Description

Script pour exécuter automatiquement les tests unitaires du module `dorevia_vault_connector` dans un container Docker Odoo.

## 🚀 Utilisation

### Syntaxe de base

```bash
./scripts/run_vault_tests.sh [TENANT] [ENV] [TEST_TAGS]
```

### Paramètres

- **TENANT** (optionnel, défaut: `core`) : Nom du tenant
- **ENV** (optionnel, défaut: `lab`) : Environnement (`lab`, `stinger`, `prod`)
- **TEST_TAGS** (optionnel, défaut: `dorevia_vault_connector`) : Tags de tests Odoo

### Exemples

```bash
# Tests par défaut (core, lab, tous les tests du module)
./scripts/run_vault_tests.sh

# Tests pour un tenant spécifique
./scripts/run_vault_tests.sh sarl-la-platine stinger

# Tests spécifiques (un seul fichier)
./scripts/run_vault_tests.sh core lab test_vault_status

# Tous les tests avec tag spécifique
./scripts/run_vault_tests.sh core lab post_install
```

## 📊 Tests disponibles

Le module contient des tests unitaires répartis dans plusieurs fichiers, dont :

1. **test_vault_status.py** : Machine d'état
2. **test_idempotence.py** : Idempotence
3. **test_backoff.py** : Backoff exponentiel
4. **test_classification.py** : Classification erreurs
5. **test_cron.py** : CRON #1 et #2
6. **test_spec_v1_1_1.py** : Spec v1.1.1 (boutons, masques)
7. **test_hook_write_posted.py** : Hook write() — init vault sur transition vers posted (SPEC v1.1)

## 🔍 Exécution de tests spécifiques

```bash
# Tests de machine d'état uniquement
./scripts/run_vault_tests.sh core lab test_vault_status

# Tests de backoff uniquement
./scripts/run_vault_tests.sh core lab test_backoff

# Tests de classification uniquement
./scripts/run_vault_tests.sh core lab test_classification

# Tests du hook write() (transition posted)
./scripts/run_vault_tests.sh core lab test_hook_write_posted
```

## ⚙️ Prérequis

- Docker installé et configuré
- Container Odoo existant pour le tenant/env spécifié
- Base de données Odoo initialisée

## 📝 Notes

- Le script démarre automatiquement le container s'il n'est pas en cours d'exécution
- Les tests s'exécutent avec `--stop-after-init` (Odoo s'arrête après les tests)
- Le niveau de log est défini sur `test` pour une sortie claire

## 🐛 Dépannage

### Container introuvable

```bash
# Lister les containers disponibles
docker ps -a | grep odoo
```

### Erreurs de tests

Vérifier les logs Odoo dans le container :
```bash
docker logs odoo_lab_core
```

### Base de données non initialisée

Initialiser la base de données d'abord :
```bash
docker exec odoo_lab_core odoo -d odoo_lab_core --stop-after-init
```
