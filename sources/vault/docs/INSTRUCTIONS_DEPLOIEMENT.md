# 🚀 Instructions de Déploiement - Sprint 6 v1.4.0

**Date** : 2025-01-14  
**Version** : v1.4.0

---

## ⚠️ État Actuel

- ✅ Code compilé avec succès (version 1.4.0)
- ✅ Binaire créé : `bin/vault`
- ⚠️ Service non redémarré (version 0.0.1 toujours active)
- ⚠️ Migration DB à appliquer

---

## 🔧 Déploiement Manuel

### Étape 1 : Appliquer la Migration DB

```bash
# Si vous avez accès à psql
psql $DATABASE_URL -f migrations/005_add_pos_fields.sql

# OU via docker-compose (si utilisé)
docker compose exec postgres psql -U vault -d dorevia_vault -f /path/to/migrations/005_add_pos_fields.sql
```

### Étape 2 : Redémarrer le Service

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
# Devrait retourner : {"version":"1.4.0",...}

# Vérifier les logs
sudo journalctl -u dorevia-vault -n 50 | grep -i "pos\|endpoint"
# Devrait afficher : "POS tickets endpoint enabled: /api/v1/pos-tickets"

# Tester l'endpoint
curl -X POST http://localhost:8080/api/v1/pos-tickets \
  -H "Content-Type: application/json" \
  -d '{"tenant":"test","source_model":"pos.order","source_id":"POS/001","ticket":{}}'
```

---

## 🚀 Déploiement Automatique

Un script de déploiement est disponible :

```bash
# Exécuter le script de déploiement
sudo ./scripts/deploy_sprint6.sh
```

Le script fait automatiquement :
1. Application de la migration DB (si psql disponible)
2. Compilation de la version 1.4.0
3. Redémarrage du service
4. Vérification de la version et des logs

---

## 📋 Checklist

- [ ] Migration DB appliquée (`005_add_pos_fields.sql`)
- [ ] Binaire compilé (`bin/vault` avec version 1.4.0)
- [ ] Service redémarré (`sudo systemctl restart dorevia-vault`)
- [ ] Version vérifiée (`curl http://localhost:8080/version`)
- [ ] Logs vérifiés (endpoint POS activé)
- [ ] Endpoint testé (POST `/api/v1/pos-tickets`)

---

## 🔍 Vérifications Post-Déploiement

### 1. Version

```bash
curl http://localhost:8080/version
# Attendu : {"version":"1.4.0",...}
```

### 2. Endpoint POS

```bash
# Test GET (405 Method Not Allowed)
curl -X GET http://localhost:8080/api/v1/pos-tickets
# Attendu : {"error":"Method Not Allowed",...}

# Test POST (201 Created ou 400 Bad Request selon payload)
curl -X POST http://localhost:8080/api/v1/pos-tickets \
  -H "Content-Type: application/json" \
  -d '{"tenant":"test","source_model":"pos.order","source_id":"POS/001","ticket":{}}'
```

### 3. Logs

```bash
sudo journalctl -u dorevia-vault -n 100 | grep -i "pos"
# Devrait afficher : "POS tickets endpoint enabled: /api/v1/pos-tickets"
```

---

## ⚠️ Si l'Endpoint est Toujours 404

1. **Vérifier que le service a bien redémarré** :
   ```bash
   sudo systemctl status dorevia-vault
   ```

2. **Vérifier les logs d'erreur** :
   ```bash
   sudo journalctl -u dorevia-vault -n 100 | grep -i "error\|warn"
   ```

3. **Vérifier la configuration** :
   - `DATABASE_URL` configuré ?
   - `JWS_ENABLED=true` ?
   - Clés JWS valides ?

4. **Vérifier que le binaire est bien utilisé** :
   ```bash
   ls -lh /opt/dorevia-vault/bin/vault
   # Devrait être récent (juste compilé)
   ```

---

**Auteur** : Instructions de déploiement Dorevia Vault  
**Date** : 2025-01-14  
**Version** : 1.0

