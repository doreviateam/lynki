# 🔐 Guide d'Activation de l'Authentification - Vault STINGER

**Date** : 2026-01-11  
**Objectif** : Activer l'authentification JWT sur le vault STINGER et configurer Odoo pour l'utiliser

---

## 🎯 Vue d'Ensemble

Actuellement, le vault STINGER fonctionne **sans authentification** (`AUTH_ENABLED=false` par défaut). Ce guide explique comment activer l'authentification JWT pour sécuriser l'accès.

---

## 📋 Prérequis

- ✅ Vault STINGER opérationnel
- ✅ Accès au container `vault-core-stinger`
- ✅ Accès à la configuration Docker Compose
- ✅ Outil `token-gen` disponible (ou génération manuelle de JWT)

---

## 🔧 Plan d'Activation

### Option 1 : Utiliser les clés JWS existantes (Recommandé)

Si le vault utilise déjà JWS, on peut réutiliser les mêmes clés RSA pour JWT.

### Option 2 : Générer de nouvelles clés JWT dédiées

Créer une paire de clés RSA spécifique pour l'authentification JWT.

---

## 📝 Étapes d'Activation

### Étape 1 : Vérifier les clés existantes

```bash
# Vérifier si des clés JWS existent déjà
docker exec vault-core-stinger ls -la /opt/dorevia-vault/keys/ 2>/dev/null
```

**Si des clés existent** : On peut les réutiliser pour JWT  
**Si aucune clé** : Il faut générer une nouvelle paire

### Étape 2 : Générer les clés JWT (si nécessaire)

#### Option A : Utiliser les clés JWS existantes

Si `/opt/dorevia-vault/keys/public.pem` existe, on peut l'utiliser pour JWT.

#### Option B : Générer de nouvelles clés

```bash
# Générer une paire de clés RSA 2048 bits
docker exec vault-core-stinger sh -c "
  mkdir -p /opt/dorevia-vault/keys && \
  openssl genrsa -out /opt/dorevia-vault/keys/jwt-private.pem 2048 && \
  openssl rsa -in /opt/dorevia-vault/keys/jwt-private.pem -pubout -out /opt/dorevia-vault/keys/jwt-public.pem && \
  chmod 600 /opt/dorevia-vault/keys/jwt-private.pem && \
  chmod 644 /opt/dorevia-vault/keys/jwt-public.pem
"
```

### Étape 3 : Modifier docker-compose.yml

Modifier `tenants/core-stinger/platform/docker-compose.yml` :

```yaml
  vault:
    image: dorevia/vault:v1.3.0
    container_name: vault-core-stinger
    restart: unless-stopped
    networks:
      - dorevia-network
    environment:
      - DATABASE_URL=postgres://vault:${VAULT_DB_PASSWORD:-vault_password}@vault-db-core-stinger:5432/dorevia_vault
      - PORT=8080
      # Authentification (NOUVEAU)
      - AUTH_ENABLED=true
      - AUTH_JWT_ENABLED=true
      - AUTH_JWT_PUBLIC_KEY_PATH=/opt/dorevia-vault/keys/jwt-public.pem
      # Ou utiliser la clé JWS existante :
      # - AUTH_JWT_PUBLIC_KEY_PATH=/opt/dorevia-vault/keys/public.pem
    volumes:
      - vault_storage_core-stinger:/opt/dorevia-vault/storage
      - vault_ledger_core-stinger:/opt/dorevia-vault/ledger
      - vault_audit_core-stinger:/opt/dorevia-vault/audit
      # Ajouter le volume pour les clés (si générées dans le container)
      # - ./keys:/opt/dorevia-vault/keys:ro
```

### Étape 4 : Générer un token JWT pour Odoo

#### Option A : Utiliser l'outil token-gen (si disponible)

```bash
# Compiler l'outil
cd sources/vault
go build -o /tmp/token-gen ./cmd/token-gen/main.go

# Générer un token pour Odoo sarl-la-platine
/tmp/token-gen \
  -key /opt/dorevia-vault/keys/jwt-private.pem \
  -sub odoo.stinger.sarl-la-platine \
  -role operator \
  -exp 365
```

#### Option B : Génération manuelle avec openssl et jwt-cli

```bash
# Installer jwt-cli si nécessaire
# npm install -g jwt-cli

# Générer le token
jwt encode \
  --alg RS256 \
  --secret @/opt/dorevia-vault/keys/jwt-private.pem \
  --exp +365d \
  '{"sub":"odoo.stinger.sarl-la-platine","role":"operator"}'
```

### Étape 5 : Configurer le token dans Odoo

```bash
# Configurer le token dans Odoo sarl-la-platine
docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c \
  "INSERT INTO ir_config_parameter (key, value, create_date, write_date) \
   VALUES ('dorevia.vault.token', '<TOKEN_GENERE>', NOW(), NOW()) \
   ON CONFLICT (key) DO UPDATE SET value = '<TOKEN_GENERE>', write_date = NOW();"
```

### Étape 6 : Redémarrer le vault

```bash
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker compose restart vault
```

### Étape 7 : Vérifier l'authentification

```bash
# Test sans token (devrait retourner 401)
curl -s -o /dev/null -w "%{http_code}" https://vault.core-stinger.doreviateam.com/api/v1/proof/account_move/3
# Attendu : 401

# Test avec token valide (devrait fonctionner)
curl -s -H "Authorization: Bearer <TOKEN>" https://vault.core-stinger.doreviateam.com/api/v1/proof/account_move/3
# Attendu : 200 ou 404 (selon si document existe)
```

---

## ⚠️ Points d'Attention

### Sécurité

1. **Clé privée** : Ne JAMAIS exposer la clé privée. Elle doit rester sur le serveur.
2. **Token** : Stocker le token de manière sécurisée dans Odoo (chiffré si possible).
3. **Expiration** : Définir une expiration raisonnable pour les tokens (ex: 1 an).

### Compatibilité

1. **JWS existant** : Si JWS est déjà configuré, on peut réutiliser les mêmes clés.
2. **Rétrocompatibilité** : Les documents déjà vaultés continueront de fonctionner.
3. **Tests** : Tester sur une facture de test avant de mettre en production.

### Rollback

Si problème, désactiver l'authentification :

```yaml
# Dans docker-compose.yml
- AUTH_ENABLED=false
```

Puis redémarrer le vault.

---

## 📝 Checklist

- [ ] Clés JWT générées ou clés JWS existantes identifiées
- [ ] docker-compose.yml modifié avec variables AUTH_*
- [ ] Token JWT généré pour Odoo
- [ ] Token configuré dans Odoo (`dorevia.vault.token`)
- [ ] Vault redémarré
- [ ] Tests d'authentification réussis
- [ ] Test de récupération infos vault depuis Odoo

---

## 🔄 Après Activation

Une fois l'authentification activée :

1. ✅ Tous les appels API nécessiteront un token valide
2. ✅ Le code Odoo utilisera automatiquement le token configuré
3. ✅ Les erreurs 401 indiqueront un problème d'authentification
4. ✅ Le document d'état pourra être mis à jour : `✅ Configuré`

---

**Version** : 1.0  
**Date** : 2026-01-11
