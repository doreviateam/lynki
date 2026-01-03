# 🔧 Instructions Correction Permissions - STINGER

**Date** : 2025-01-28  
**Problème** : Container ne peut pas lire `/etc/dvig/tokens.yml`

---

## ⚠️ Problème Détecté

Le script de validation a détecté :
```
Erreur chargement tokens: Permission denied: '/etc/dvig/tokens.yml'
```

**Cause** : Permissions `0400` (lecture root uniquement), container tourne sous utilisateur `dvig` (uid=1000).

---

## ✅ Solution Immédiate

**Exécutez ces commandes dans un terminal** :

```bash
# Corriger permissions
sudo chmod 0440 /etc/dvig/tokens.yml
sudo chgrp docker /etc/dvig/tokens.yml
sudo chown root:docker /etc/dvig/tokens.yml

# Vérifier
ls -la /etc/dvig/tokens.yml
# Devrait afficher : -r--r----- 1 root docker ...

# Redémarrer service
docker restart dvig-stinger

# Attendre démarrage
sleep 5

# Vérifier logs (ne plus avoir d'erreur Permission denied)
docker logs dvig-stinger | grep -i "tokens rechargés"
# Devrait afficher : "Tokens rechargés: 1 tokens chargés"
```

---

## 🚀 Après Correction

**Ré-exécuter le script de validation** :

```bash
cd /opt/dorevia-plateform/sources/dvig
./scripts/validate_stinger.sh
```

Le script devrait maintenant :
- ✅ Détecter les tokens chargés
- ✅ Exécuter tous les smoke tests
- ✅ Valider logs, reload, robustesse

---

## 📋 Vérification Rapide

```bash
# 1. Permissions correctes
ls -la /etc/dvig/tokens.yml
# Attendu : -r--r----- 1 root docker

# 2. Service actif
docker ps | grep dvig-stinger

# 3. Tokens chargés (pas d'erreur Permission denied)
docker logs dvig-stinger | tail -5 | grep -i "tokens\|permission"

# 4. Health check
curl http://localhost:8082/health
```

---

**Dernière mise à jour** : 2025-01-28

