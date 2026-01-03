# 🔧 Solution Permissions STINGER - tokens.yml

**Date** : 2025-01-28  
**Problème** : Container ne peut pas lire `/etc/dvig/tokens.yml` même avec permissions `0440`

---

## 🔴 Problème Identifié

**Cause** : Le container Docker tourne sous l'utilisateur `dvig` (uid=1000) qui n'est **pas dans le groupe docker** (gid=988) de l'hôte.

**Permissions actuelles** : `0440` (root:docker)
- ✅ Root peut lire
- ✅ Groupe docker peut lire
- ❌ Utilisateur `dvig` (uid=1000) ne peut pas lire (n'est pas dans le groupe docker)

---

## ✅ Solution pour STINGER

### Option 1 : Permissions 0444 (Recommandé pour STINGER)

**Raison** : Environnement de pré-production, fichier contient seulement des hashes (pas de tokens bruts), volume monté en read-only.

```bash
sudo chmod 0444 /etc/dvig/tokens.yml
sudo chown root:root /etc/dvig/tokens.yml
```

**Vérification** :
```bash
ls -la /etc/dvig/tokens.yml
# Devrait afficher : -r--r--r-- 1 root root ...
```

**Redémarrer** :
```bash
docker restart dvig-stinger
sleep 5
docker logs dvig-stinger | grep -i "tokens rechargés"
# Devrait afficher : "Tokens rechargés: 1 tokens chargés"
```

### Option 2 : Modifier Docker Compose (Alternative)

Ajouter `user: "0:0"` dans docker-compose pour exécuter en root (non recommandé pour sécurité).

---

## 🔐 Sécurité

### Pourquoi 0444 est acceptable en STINGER

- ✅ **Fichier contient seulement des hashes** (pas de tokens bruts)
- ✅ **Volume monté en read-only** (`:ro`)
- ✅ **Environnement de pré-production** (pas PROD)
- ✅ **Accès limité** au serveur STINGER
- ⚠️ **Pour PROD** : Revoir permissions (peut-être utiliser un secret manager)

### Recommandation PROD

Pour PROD, considérer :
- Secret manager (HashiCorp Vault, AWS Secrets Manager, etc.)
- Ou permissions plus strictes avec mapping utilisateur/groupe

---

## ✅ Vérification

```bash
# 1. Permissions
ls -la /etc/dvig/tokens.yml
# Attendu : -r--r--r-- 1 root root

# 2. Container peut lire
docker exec dvig-stinger cat /etc/dvig/tokens.yml | head -3
# Devrait afficher le contenu (pas d'erreur Permission denied)

# 3. Service charge tokens
docker logs dvig-stinger | grep -i "tokens rechargés"
# Devrait afficher : "Tokens rechargés: 1 tokens chargés"

# 4. Pas d'erreur Permission denied
docker logs dvig-stinger | grep -i "permission denied" | wc -l
# Devrait afficher : 0
```

---

## 🚀 Après Correction

**Ré-exécuter le script de validation** :

```bash
cd /opt/dorevia-plateform/sources/dvig
./scripts/validate_stinger.sh
```

---

**Dernière mise à jour** : 2025-01-28

