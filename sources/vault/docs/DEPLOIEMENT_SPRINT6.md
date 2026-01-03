# 🚀 Guide de Déploiement - Sprint 6 v1.4.0

**Date** : 2025-01-14  
**Version** : v1.4.0  
**Sprint** : Sprint 6 - Ingestion Native Tickets POS

---

## 📋 Prérequis

### 1. Vérifications Avant Déploiement

- [ ] Code commité et poussé sur GitHub (commit `374add5`)
- [ ] Base de données PostgreSQL accessible
- [ ] Clés JWS configurées (`keys/private.pem`, `keys/public.pem`)
- [ ] Variables d'environnement configurées

### 2. Variables d'Environnement Requises

```bash
# Base de données (obligatoire pour endpoint POS)
DATABASE_URL="postgres://user:pass@localhost:5432/dorevia_vault?sslmode=disable"

# JWS (obligatoire pour endpoint POS)
JWS_ENABLED=true
JWS_REQUIRED=true
JWS_PRIVATE_KEY_PATH="/opt/dorevia-vault/keys/private.pem"
JWS_PUBLIC_KEY_PATH="/opt/dorevia-vault/keys/public.pem"
JWS_KID="key-2025-Q1"

# POS (optionnel)
POS_TICKET_MAX_SIZE_BYTES=65536  # 64 KB par défaut
```

---

## 🔧 Étapes de Déploiement

### Étape 1 : Appliquer la Migration DB

**⚠️ Important** : Cette étape doit être effectuée **avant** de redémarrer le service.

```bash
# Se connecter à la base de données
psql $DATABASE_URL -f migrations/005_add_pos_fields.sql
```

**Vérification** :
```sql
-- Vérifier que les colonnes existent
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'documents' 
  AND column_name IN ('payload_json', 'source_id_text', 'pos_session', 'cashier', 'location');
-- Devrait retourner 5 colonnes
```

### Étape 2 : Compiler la Nouvelle Version

```bash
cd /opt/dorevia-vault

# Option 1 : Utiliser le script de build (recommandé)
./scripts/build.sh

# Option 2 : Build manuel avec métadonnées
go build -ldflags "-X main.Version=1.4.0 -X main.Commit=$(git rev-parse --short HEAD) -X main.BuiltAt=$(date -u +%Y-%m-%dT%H:%M:%SZ)" -o vault cmd/vault/main.go
```

**Vérification** :
```bash
./vault --version
# Devrait afficher : v1.4.0
```

### Étape 3 : Redémarrer le Service

```bash
# Redémarrer le service systemd
sudo systemctl restart dorevia-vault

# Vérifier le statut
sudo systemctl status dorevia-vault
```

### Étape 4 : Vérifier les Logs

```bash
# Vérifier que l'endpoint est activé
journalctl -u dorevia-vault -f | grep -i "pos\|endpoint"
```

**Logs attendus** :
```
POS tickets endpoint enabled: /api/v1/pos-tickets
```

**OU si problème** :
```
POS tickets endpoint disabled (requires DB and JWS)
```

### Étape 5 : Tester l'Endpoint

```bash
# Test avec curl (sans authentification si AUTH_ENABLED=false)
curl -X POST http://localhost:8080/api/v1/pos-tickets \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": "test",
    "source_model": "pos.order",
    "source_id": "POS/001",
    "ticket": {"lines": []}
  }'
```

**Résultat attendu** :
- `201 Created` : Succès (nouveau document)
- `200 OK` : Succès (idempotence)
- `400 Bad Request` : Erreur de validation (normal si payload incomplet)
- `401 Unauthorized` : Authentification requise (si `AUTH_ENABLED=true`)

---

## 🔍 Vérifications Post-Déploiement

### 1. Vérifier la Version

```bash
curl http://localhost:8080/version
# Devrait retourner : {"version":"1.4.0",...}
```

### 2. Vérifier l'Endpoint POS

```bash
# Test GET (devrait retourner 405 Method Not Allowed)
curl -X GET http://localhost:8080/api/v1/pos-tickets
# Devrait retourner : {"error":"Method Not Allowed","message":"Only POST method is allowed..."}

# Test POST (devrait fonctionner si DB et JWS configurés)
curl -X POST http://localhost:8080/api/v1/pos-tickets \
  -H "Content-Type: application/json" \
  -d '{"tenant":"test","source_model":"pos.order","source_id":"POS/001","ticket":{}}'
```

### 3. Vérifier les Métriques

```bash
curl http://localhost:8080/metrics | grep documents_vaulted_total
# Devrait afficher les métriques avec source="pos"
```

### 4. Vérifier la Base de Données

```sql
-- Vérifier qu'un document POS peut être créé
SELECT id, source, odoo_model, source_id_text, pos_session 
FROM documents 
WHERE source = 'pos' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## ⚠️ Dépannage

### Problème : Endpoint toujours 404

**Causes possibles** :
1. Service non redémarré → Redémarrer : `sudo systemctl restart dorevia-vault`
2. DB non configurée → Vérifier `DATABASE_URL`
3. JWS non configuré → Vérifier `JWS_ENABLED` et clés
4. Code non compilé → Recompiler avec `./scripts/build.sh`

**Vérification** :
```bash
# Vérifier les logs
journalctl -u dorevia-vault -n 100 | grep -i "pos\|error\|warn"
```

### Problème : Erreur de Migration

**Si la migration échoue** :
```sql
-- Vérifier si les colonnes existent déjà
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'documents' AND column_name = 'payload_json';

-- Si elles existent, la migration peut être ignorée (IF NOT EXISTS)
```

### Problème : Service ne démarre pas

**Vérifier** :
```bash
# Vérifier les erreurs
sudo systemctl status dorevia-vault
journalctl -u dorevia-vault -n 50

# Vérifier la configuration
sudo systemctl cat dorevia-vault
```

---

## 📊 Checklist de Déploiement

- [ ] Migration DB `005_add_pos_fields.sql` appliquée
- [ ] Code compilé avec version 1.4.0
- [ ] Service redémarré
- [ ] Logs vérifiés (endpoint activé)
- [ ] Version vérifiée (`/version` retourne 1.4.0)
- [ ] Endpoint testé (POST `/api/v1/pos-tickets`)
- [ ] Métriques vérifiées
- [ ] Base de données vérifiée

---

## 🚀 Déploiement Automatique

Pour un déploiement automatique, utiliser le script :

```bash
# 1. Appliquer la migration (manuel, une seule fois)
psql $DATABASE_URL -f migrations/005_add_pos_fields.sql

# 2. Déployer (automatique)
./scripts/deploy.sh
```

Le script `deploy.sh` fait :
1. `git pull` (récupère les dernières modifications)
2. `./scripts/build.sh` (compile avec métadonnées)
3. `sudo systemctl restart dorevia-vault` (redémarre le service)

---

## 📝 Notes

- **Migration DB** : Non-destructive (ajout de colonnes avec `IF NOT EXISTS`)
- **Rétrocompatibilité** : Aucun changement breaking, endpoints existants fonctionnent
- **Rollback** : Si problème, redémarrer avec l'ancienne version (git checkout + rebuild)

---

**Auteur** : Guide de déploiement Dorevia Vault  
**Date** : 2025-01-14  
**Version** : 1.0

