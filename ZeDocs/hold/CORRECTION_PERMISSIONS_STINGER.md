# 🔧 Correction Permissions STINGER - tokens.yml

**Date** : 2025-01-28  
**Problème** : Permission denied sur `/etc/dvig/tokens.yml`

---

## 🔴 Problème Identifié

Le container Docker `dvig-stinger` tourne sous l'utilisateur `dvig` (uid=1000) et ne peut pas lire `/etc/dvig/tokens.yml` avec les permissions `0400` (lecture seule root).

**Erreur dans les logs** :
```
Erreur chargement YAML: [Errno 13] Permission denied: '/etc/dvig/tokens.yml'
Impossible de charger les tokens
```

---

## ✅ Solution

### Option 1 : Permissions Groupe (Recommandé)

Permettre la lecture par le groupe `docker` :

```bash
sudo chmod 0440 /etc/dvig/tokens.yml
sudo chgrp docker /etc/dvig/tokens.yml
sudo chown root:docker /etc/dvig/tokens.yml
```

**Vérification** :
```bash
ls -la /etc/dvig/tokens.yml
# Devrait afficher : -r--r----- 1 root docker ...
```

### Option 2 : Permissions Lecture Tous (Moins sécurisé)

```bash
sudo chmod 0444 /etc/dvig/tokens.yml
```

**Note** : Moins sécurisé, mais fonctionne si le groupe docker n'est pas configuré.

---

## 🔄 Redémarrer Service

Après correction des permissions :

```bash
docker restart dvig-stinger
sleep 5
docker logs dvig-stinger | tail -10
```

**Vérifier** :
```bash
# Ne devrait plus avoir d'erreur "Permission denied"
docker logs dvig-stinger | grep -i "tokens rechargés"
# Devrait afficher : "Tokens rechargés: X tokens chargés"
```

---

## ✅ Vérification Complète

```bash
# 1. Vérifier permissions
ls -la /etc/dvig/tokens.yml

# 2. Vérifier logs (pas d'erreur)
docker logs dvig-stinger | grep -i "permission\|erreur\|tokens"

# 3. Health check
curl http://localhost:8082/health

# 4. Tester avec token
TOKEN="dvig_..."  # Token brut STINGER
curl -X POST http://localhost:8082/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test.stinger","source":"odoo.stinger.core","data":{}}'
```

---

## 📝 Note

Le fichier `tokens.yml` doit être lisible par le container Docker, mais reste sécurisé :
- ✅ Permissions `0440` : lecture root et groupe docker uniquement
- ✅ Propriétaire `root:docker` : contrôle strict
- ✅ Volume monté read-only dans Docker

---

**Dernière mise à jour** : 2025-01-28

