# 🚀 Guide de Déploiement - Sprint 8 : Endpoints Proof

**Date** : 2025-11-24  
**Version** : 1.6.0  
**Sprint** : Sprint 8 - Endpoints Proof pour dorevia_vault_report

---

## ⚠️ État Actuel

- ✅ **Code implémenté** : Tous les endpoints proof sont codés
- ✅ **Migration intégrée** : Migration 008 intégrée dans le système automatique
- ✅ **Script de déploiement** : `scripts/deploy_sprint8.sh` créé
- ⚠️ **Déploiement** : **NON DÉPLOYÉ** - Action requise

---

## 📋 Prérequis

### 1. Vérifications Avant Déploiement

- [ ] Code commité et poussé sur le dépôt
- [ ] Base de données PostgreSQL accessible
- [ ] Service `dorevia-vault` actif
- [ ] Variables d'environnement configurées

### 2. Variables d'Environnement Requises

```bash
# Base de données (obligatoire)
DATABASE_URL="postgres://user:pass@localhost:5432/dorevia_vault?sslmode=disable"

# JWS (obligatoire pour preuves)
JWS_ENABLED=true
JWS_REQUIRED=true
JWS_PRIVATE_KEY_PATH="/opt/dorevia-vault/keys/private.pem"
JWS_PUBLIC_KEY_PATH="/opt/dorevia-vault/keys/public.pem"
JWS_KID="key-2025-Q1"
```

---

## 🔧 Déploiement Automatique (Recommandé)

### Option 1 : Script de Déploiement

```bash
cd /opt/dorevia-vault
sudo ./scripts/deploy_sprint8.sh
```

Le script fait automatiquement :
1. ✅ Compilation de la version 1.6.0
2. ✅ Redémarrage du service
3. ✅ Application automatique de la migration DB (au démarrage)
4. ✅ Vérification de la version et des logs

---

## 🔧 Déploiement Manuel

### Étape 1 : Compiler la Nouvelle Version

```bash
cd /opt/dorevia-vault

# Option 1 : Utiliser le script de build
./scripts/build.sh 1.6.0

# Option 2 : Build manuel
go build -ldflags "-X main.Version=1.6.0 -X main.Commit=$(git rev-parse --short HEAD) -X main.BuiltAt=$(date -u +%Y-%m-%dT%H:%M:%SZ)" -o bin/vault cmd/vault/main.go
```

**Vérification** :
```bash
./bin/vault --version
# Devrait afficher : v1.6.0
```

### Étape 2 : Redémarrer le Service

**⚠️ Important** : La migration DB sera appliquée **automatiquement** au démarrage du service.

```bash
# Redémarrer le service systemd
sudo systemctl restart dorevia-vault

# Vérifier le statut
sudo systemctl status dorevia-vault
```

### Étape 3 : Vérifier le Déploiement

```bash
# Vérifier la version
curl http://localhost:8080/version
# Devrait retourner : {"version":"1.6.0",...}

# Vérifier les logs
sudo journalctl -u dorevia-vault -n 50 | grep -i "proof\|sprint 8"
# Devrait afficher : "Proof endpoints enabled: /api/v1/proof/*"
# Devrait afficher : "Sprint 8 migration applied successfully"

# Tester un endpoint (avec token)
curl -X GET http://localhost:8080/api/v1/proof/account_move/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Vérification de la Migration DB

La migration 008 sera appliquée automatiquement au démarrage. Pour vérifier manuellement :

```sql
-- Vérifier que les index existent
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'documents' 
  AND indexname IN (
    'idx_documents_source_lookup',
    'idx_documents_source_text_lookup',
    'idx_documents_source_model_lookup'
  );
-- Devrait retourner 3 index
```

---

## 🧪 Tests des Endpoints

### Test 1 : Preuve Facture

```bash
curl -X GET http://localhost:8080/api/v1/proof/account_move/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue** :
```json
{
  "id": "uuid-vault",
  "hash": "sha256_hash",
  "ledger": "ledger_id",
  "timestamp": "2025-01-15T10:30:00Z",
  "jws": "jws_token",
  "status": "verified",
  "source_model": "account.move",
  "source_id": "123"
}
```

### Test 2 : Bulk Fetch

```bash
curl -X POST http://localhost:8080/api/v1/proof/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {"type": "account_move", "id": "123"},
      {"type": "account_move", "id": "124"}
    ]
  }'
```

### Test 3 : Preuve Non Trouvée

```bash
curl -X GET http://localhost:8080/api/v1/proof/account_move/99999 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue** : `404 Not Found`

---

## ⚠️ Dépannage

### Problème : Endpoints toujours 404

**Causes possibles** :
1. Service non redémarré → Redémarrer : `sudo systemctl restart dorevia-vault`
2. DB non configurée → Vérifier `DATABASE_URL`
3. Code non compilé → Recompiler avec `./scripts/build.sh 1.6.0`

**Vérification** :
```bash
# Vérifier les logs
journalctl -u dorevia-vault -n 100 | grep -i "proof\|error\|warn"
```

### Problème : Migration DB Échoue

**Si la migration échoue** :
```sql
-- Vérifier si les index existent déjà
SELECT indexname FROM pg_indexes 
WHERE tablename = 'documents' 
  AND indexname LIKE '%source%lookup%';

-- Si certains existent, la migration peut être partiellement appliquée
-- Les index utilisent IF NOT EXISTS, donc pas de problème
```

### Problème : Service ne Démarre pas

**Vérifier** :
```bash
# Vérifier les erreurs
sudo systemctl status dorevia-vault
journalctl -u dorevia-vault -n 50

# Vérifier la configuration
sudo systemctl cat dorevia-vault
```

---

## 📋 Checklist de Déploiement

- [ ] Code compilé avec version 1.6.0
- [ ] Service redémarré (`sudo systemctl restart dorevia-vault`)
- [ ] Migration DB appliquée automatiquement (vérifier les logs)
- [ ] Logs vérifiés (endpoint activé : "Proof endpoints enabled")
- [ ] Version vérifiée (`/version` retourne 1.6.0)
- [ ] Endpoint testé (GET `/api/v1/proof/account_move/:id`)
- [ ] Endpoint bulk testé (POST `/api/v1/proof/bulk`)
- [ ] Index DB vérifiés (3 index créés)

---

## 🚀 Déploiement en Production

### Environnement de Test

```bash
# Sur vault-test.doreviateam.com
cd /opt/dorevia-vault
sudo ./scripts/deploy_sprint8.sh
```

### Environnement de Production

```bash
# Sur vault.doreviateam.com
cd /opt/dorevia-vault
sudo ./scripts/deploy_sprint8.sh
```

**⚠️ Important** : Tester d'abord en environnement de test avant production.

---

## 📝 Notes

- **Migration DB** : Non-destructive (création d'index avec `IF NOT EXISTS`)
- **Compatibilité** : Les nouveaux endpoints sont additifs, n'affectent pas les endpoints existants
- **Performance** : Les index permettent des recherches rapides (< 10ms)
- **Rollback** : Pour revenir en arrière, simplement redémarrer avec l'ancienne version

---

## 📚 Documentation

- [Documentation API Proof](../docs/PROOF_API.md)
- [Plan d'implémentation](../docs/PLAN_EVOLUTIONS_SPRINT8_PROOF_ENDPOINTS.md)
- [Rapport d'implémentation](../docs/IMPLEMENTATION_SPRINT8_PROOF_ENDPOINTS.md)

---

**Document créé le** : 2025-11-24  
**Dernière mise à jour** : 2025-11-24  
**Statut** : ⚠️ Déploiement requis

