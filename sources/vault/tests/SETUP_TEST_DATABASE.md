# 🔧 Configuration de la Base de Données de Test

**Date** : 2026-01-03  
**Objectif** : Configurer `TEST_DATABASE_URL` pour exécuter les tests d'intégration SPEC 2

---

## 📋 Étape 1 : Vérifier et Démarrer PostgreSQL

### Vérifier si PostgreSQL est installé

```bash
psql --version
# Doit afficher : psql (PostgreSQL) X.X.X
```

### Démarrer PostgreSQL

```bash
# Sur Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Pour démarrer au boot

# Vérifier le statut
sudo systemctl status postgresql
```

### Vérifier que PostgreSQL écoute

```bash
# Vérifier les processus
ps aux | grep postgres

# Vérifier le port
sudo netstat -tlnp | grep 5432
# ou
sudo ss -tlnp | grep 5432
```

---

## 📋 Étape 2 : Créer la Base de Données de Test

### Se connecter à PostgreSQL

```bash
# Option A : En tant qu'utilisateur postgres
sudo -u postgres psql

# Option B : Si vous avez un utilisateur PostgreSQL configuré
psql -U votre_utilisateur -d postgres
```

### Créer la base de données

```sql
-- Dans psql
CREATE DATABASE dorevia_vault_test;

-- Vérifier qu'elle existe
\l

-- Quitter psql
\q
```

### Alternative : Créer depuis la ligne de commande

```bash
# En une commande
sudo -u postgres psql -c "CREATE DATABASE dorevia_vault_test;"

# Vérifier
sudo -u postgres psql -l | grep dorevia_vault_test
```

---

## 📋 Étape 3 : Configurer TEST_DATABASE_URL

### Option A : Variable d'environnement (session actuelle)

```bash
# Sans mot de passe (si authentification peer/trust configurée)
export TEST_DATABASE_URL='postgresql://postgres@localhost:5432/dorevia_vault_test?sslmode=disable'

# Avec mot de passe
export TEST_DATABASE_URL='postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/dorevia_vault_test?sslmode=disable'

# Avec un utilisateur spécifique
export TEST_DATABASE_URL='postgresql://votre_user:votre_password@localhost:5432/dorevia_vault_test?sslmode=disable'
```

### Option B : Fichier `.env.test` (recommandé)

```bash
# Créer le fichier à la racine du projet
cd /opt/dorevia-plateform
cat > .env.test << 'EOF'
TEST_DATABASE_URL=postgresql://postgres@localhost:5432/dorevia_vault_test?sslmode=disable
EOF

# Charger dans la session
source .env.test

# Vérifier
echo $TEST_DATABASE_URL
```

### Option C : Ajouter au `.bashrc` ou `.zshrc` (permanent)

```bash
# Ajouter à la fin de ~/.bashrc ou ~/.zshrc
echo 'export TEST_DATABASE_URL="postgresql://postgres@localhost:5432/dorevia_vault_test?sslmode=disable"' >> ~/.bashrc

# Recharger
source ~/.bashrc
```

---

## 📋 Étape 4 : Vérifier la Configuration

### Test de connexion

```bash
# Vérifier que la variable est définie
echo $TEST_DATABASE_URL

# Tester la connexion
psql "$TEST_DATABASE_URL" -c "SELECT version();"

# Vérifier que les tables peuvent être créées (migrations automatiques)
psql "$TEST_DATABASE_URL" -c "\dt"
```

### Vérifier les migrations

Les migrations sont appliquées automatiquement lors de la connexion via `storage.NewDB()`. 

Vérifier que la table `constats` existe :

```bash
psql "$TEST_DATABASE_URL" -c "\d constats"
```

Si la table n'existe pas, elle sera créée automatiquement lors du premier test.

---

## 📋 Étape 5 : Exécuter les Tests

```bash
cd /opt/dorevia-plateform/sources/vault

# Tous les tests d'intégration constats
go test -v ./tests/integration -run "TestConstatIntegration"

# Test spécifique
go test -v ./tests/integration -run "TestConstatIntegration_GenerateAndGet"

# Avec couverture
go test -v ./tests/integration -run "TestConstatIntegration" -coverprofile=coverage_constats.out
```

---

## 🔍 Dépannage

### Erreur : "connection refused"

**Cause** : PostgreSQL n'est pas démarré ou n'écoute pas sur le port 5432.

**Solution** :
```bash
# Démarrer PostgreSQL
sudo systemctl start postgresql

# Vérifier qu'il écoute
sudo ss -tlnp | grep 5432
```

### Erreur : "authentication failed"

**Cause** : Identifiants incorrects ou méthode d'authentification.

**Solution** :
1. Vérifier le fichier `pg_hba.conf` :
   ```bash
   sudo cat /etc/postgresql/*/main/pg_hba.conf | grep -v "^#"
   ```

2. Pour les tests, utiliser `peer` ou `trust` pour localhost :
   ```
   local   all             all                                     peer
   host    all             all             127.0.0.1/32            trust
   ```

3. Recharger PostgreSQL après modification :
   ```bash
   sudo systemctl reload postgresql
   ```

### Erreur : "database does not exist"

**Cause** : La base de données n'a pas été créée.

**Solution** :
```bash
sudo -u postgres psql -c "CREATE DATABASE dorevia_vault_test;"
```

### Erreur : "permission denied"

**Cause** : L'utilisateur n'a pas les permissions nécessaires.

**Solution** :
```bash
# Donner les permissions à l'utilisateur
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dorevia_vault_test TO votre_utilisateur;"
```

---

## 📝 Exemple Complet

```bash
# 1. Démarrer PostgreSQL
sudo systemctl start postgresql

# 2. Créer la base de test
sudo -u postgres psql -c "CREATE DATABASE dorevia_vault_test;"

# 3. Configurer TEST_DATABASE_URL
export TEST_DATABASE_URL='postgresql://postgres@localhost:5432/dorevia_vault_test?sslmode=disable'

# 4. Vérifier la connexion
psql "$TEST_DATABASE_URL" -c "SELECT version();"

# 5. Exécuter les tests
cd /opt/dorevia-plateform/sources/vault
go test -v ./tests/integration -run "TestConstatIntegration"
```

---

## 🔐 Sécurité

⚠️ **Important** :
- Ne jamais commiter les fichiers `.env.test` contenant des mots de passe
- Utiliser des variables d'environnement sécurisées en production/CI
- Pour les tests locaux, utiliser `sslmode=disable` est acceptable

---

**Pour plus d'informations** : Voir `README_CONSTAT_TESTS.md`

