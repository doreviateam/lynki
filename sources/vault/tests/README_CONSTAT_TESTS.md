# 🧪 Guide d'Exécution des Tests d'Intégration — Constats (SPEC 2)

**Date** : 2026-01-03  
**Fichiers de test** : `tests/integration/test_constat_integration.go`

---

## 📋 Prérequis

### 1. Base de données PostgreSQL

Les tests d'intégration nécessitent une base de données PostgreSQL accessible.

**Option A : Utiliser une base de données existante (recommandé pour développement)**

Si vous avez déjà une base de données PostgreSQL configurée pour le projet :

```bash
# Utiliser la même base que DATABASE_URL (avec un suffixe _test)
export TEST_DATABASE_URL="${DATABASE_URL}_test"
```

**Option B : Créer une base de données dédiée aux tests**

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données de test
CREATE DATABASE dorevia_vault_test;

# Quitter psql
\q
```

### 2. Clés JWS (optionnel mais recommandé)

Les tests utilisent les clés JWS pour signer les constats. Si les clés ne sont pas disponibles, certains tests seront skippés.

**Emplacements par défaut** :
- Clé privée : `/tmp/test_private_key.pem`
- Clé publique : `/tmp/test_public_key.pem`

**Pour générer des clés de test** :

```bash
# Utiliser le générateur de clés du projet
cd sources/vault
go run cmd/keygen/main.go -private-key /tmp/test_private_key.pem -public-key /tmp/test_public_key.pem -kid test-kid
```

---

## ⚙️ Configuration

### Méthode 1 : Variable d'environnement (session actuelle)

```bash
export TEST_DATABASE_URL='postgresql://user:password@localhost:5432/dorevia_vault_test?sslmode=disable'
```

**Format de l'URL** :
```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=[mode]
```

**Exemples** :
```bash
# Local avec authentification
export TEST_DATABASE_URL='postgresql://postgres:password@localhost:5432/dorevia_vault_test?sslmode=disable'

# Local sans mot de passe (utilisateur système)
export TEST_DATABASE_URL='postgresql://postgres@localhost:5432/dorevia_vault_test?sslmode=disable'

# Avec SSL
export TEST_DATABASE_URL='postgresql://user:password@localhost:5432/dorevia_vault_test?sslmode=require'
```

### Méthode 2 : Fichier `.env.test` (recommandé)

Créer un fichier `.env.test` à la racine du projet :

```bash
# .env.test
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/dorevia_vault_test?sslmode=disable
```

Puis charger avant les tests :

```bash
source .env.test
go test -v ./tests/integration -run "TestConstatIntegration"
```

### Méthode 3 : Script de test

Créer un script `test_constats.sh` :

```bash
#!/bin/bash
set -e

# Charger la configuration
export TEST_DATABASE_URL='postgresql://postgres:password@localhost:5432/dorevia_vault_test?sslmode=disable'

# Exécuter les tests
cd sources/vault
go test -v ./tests/integration -run "TestConstatIntegration"
```

Rendre exécutable et lancer :

```bash
chmod +x test_constats.sh
./test_constats.sh
```

---

## 🚀 Exécution des Tests

### Tous les tests d'intégration constats

```bash
cd sources/vault
export TEST_DATABASE_URL='postgresql://user:password@localhost:5432/dorevia_vault_test?sslmode=disable'
go test -v ./tests/integration -run "TestConstatIntegration"
```

### Test spécifique

```bash
# Test de génération et récupération
go test -v ./tests/integration -run "TestConstatIntegration_GenerateAndGet"

# Test de liste avec pagination
go test -v ./tests/integration -run "TestConstatIntegration_ListConstats"

# Test des endpoints API
go test -v ./tests/integration -run "TestConstatIntegration_APIEndpoints"

# Test d'idempotence
go test -v ./tests/integration -run "TestConstatIntegration_Idempotence"
```

### Avec couverture de code

```bash
go test -v ./tests/integration -run "TestConstatIntegration" -coverprofile=coverage_constats.out
go tool cover -html=coverage_constats.out -o coverage_constats.html
```

---

## 🔍 Vérification de la Configuration

### Vérifier que TEST_DATABASE_URL est configuré

```bash
echo $TEST_DATABASE_URL
```

### Tester la connexion à la base de données

```bash
psql "$TEST_DATABASE_URL" -c "SELECT version();"
```

### Vérifier que les tables existent

```bash
psql "$TEST_DATABASE_URL" -c "\dt"
```

Les tables suivantes doivent exister :
- `documents` (créée par les migrations précédentes)
- `constats` (créée par la migration `020_create_constats_table.sql`)

---

## 🐛 Dépannage

### Erreur : "connection refused"

**Cause** : PostgreSQL n'est pas démarré ou l'URL est incorrecte.

**Solution** :
```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql

# Démarrer PostgreSQL si nécessaire
sudo systemctl start postgresql
```

### Erreur : "database does not exist"

**Cause** : La base de données de test n'existe pas.

**Solution** :
```bash
# Créer la base de données
psql -U postgres -c "CREATE DATABASE dorevia_vault_test;"
```

### Erreur : "authentication failed"

**Cause** : Identifiants incorrects.

**Solution** :
- Vérifier le nom d'utilisateur et le mot de passe
- Vérifier les permissions PostgreSQL (fichier `pg_hba.conf`)

### Erreur : "relation does not exist"

**Cause** : Les migrations n'ont pas été appliquées.

**Solution** :
```bash
# Les migrations sont appliquées automatiquement lors de la connexion
# Vérifier que la table constats existe
psql "$TEST_DATABASE_URL" -c "\d constats"
```

### Tests skippés : "JWS keys not available"

**Cause** : Les clés JWS ne sont pas disponibles.

**Solution** :
```bash
# Générer les clés de test
cd sources/vault
go run cmd/keygen/main.go -private-key /tmp/test_private_key.pem -public-key /tmp/test_public_key.pem -kid test-kid
```

---

## 📊 Résultats Attendus

### Tests réussis

```
=== RUN   TestConstatIntegration_GenerateAndGet
--- PASS: TestConstatIntegration_GenerateAndGet (0.05s)
=== RUN   TestConstatIntegration_ListConstats
--- PASS: TestConstatIntegration_ListConstats (0.08s)
=== RUN   TestConstatIntegration_APIEndpoints
--- PASS: TestConstatIntegration_APIEndpoints (0.12s)
=== RUN   TestConstatIntegration_Idempotence
--- PASS: TestConstatIntegration_Idempotence (0.04s)
PASS
ok      github.com/doreviateam/dorevia-vault/tests/integration    0.290s
```

### Tests skippés (si TEST_DATABASE_URL non configuré)

```
=== RUN   TestConstatIntegration_GenerateAndGet
    test_constat_integration.go:28: TEST_DATABASE_URL not set, skipping integration test
--- SKIP: TestConstatIntegration_GenerateAndGet (0.00s)
...
```

---

## 🔐 Sécurité

⚠️ **Important** : Ne jamais commiter les fichiers `.env.test` contenant des mots de passe dans le dépôt Git.

Ajouter au `.gitignore` :
```
.env.test
.env.local
*.env.test
```

---

## 📝 Notes

- Les tests nettoient automatiquement les tables `constats` et `documents` avant chaque exécution
- Les tests créent des données de test temporaires qui sont supprimées après les tests
- La base de données de test peut être réutilisée entre les exécutions
- Pour un environnement CI/CD, utiliser des variables d'environnement sécurisées

---

**Pour plus d'informations** : Voir `ETAT_IMPLEMENTATION_SPEC2_SCRUM.md`

