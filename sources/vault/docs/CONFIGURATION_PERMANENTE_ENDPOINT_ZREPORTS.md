# ⚙️ Configuration Permanente — Endpoint Z-Reports

**Date** : 2025-11-16  
**Version** : 1.5.0  
**Statut** : ✅ Endpoint activé

---

## ✅ Configuration Actuelle

L'endpoint `/api/v1/pos/zreports` est **activé et fonctionnel**. Pour rendre la configuration permanente, un fichier `.env` a été créé.

---

## 📝 Fichier .env Créé

Le fichier `.env` contient :

```bash
# Ledger Filesystem
LEDGER_FILESYSTEM_PATH=/opt/dorevia-vault/ledger
ZREPORT_MAX_SIZE_BYTES=1048576
ZREPORT_FSYNC_ENABLED=true

# JWS
JWS_ENABLED=true
JWS_PRIVATE_KEY_PATH=/opt/dorevia-vault/keys/private.pem
JWS_PUBLIC_KEY_PATH=/opt/dorevia-vault/keys/public.pem
JWS_KID=zreports-kid-2025

# Authentification
AUTH_ENABLED=true
AUTH_JWT_ENABLED=true
AUTH_JWT_PUBLIC_KEY_PATH=/opt/dorevia-vault/keys/jwt_public.pem
```

---

## ⚠️ DATABASE_URL

**Important** : Le `DATABASE_URL` n'a pas été ajouté au `.env` pour des raisons de sécurité (mot de passe en clair).

### Option 1 : Ajouter au .env (Simple)

```bash
cd /opt/dorevia-vault
echo 'DATABASE_URL=postgresql://user:password@host:5432/dorevia_vault' >> .env
```

### Option 2 : Garder dans l'environnement (Sécurisé)

Le `DATABASE_URL` peut rester dans l'environnement système ou être chargé depuis un fichier séparé.

---

## 🔄 Démarrage avec .env

### Méthode 1 : Source .env

```bash
cd /opt/dorevia-vault
source .env
./bin/vault
```

### Méthode 2 : Script avec .env

```bash
cd /opt/dorevia-vault
./scripts/start_sprint7.sh
```

Le script charge automatiquement le `.env` s'il existe.

### Méthode 3 : systemd (Production)

Pour un démarrage permanent via systemd, configurez le service :

```bash
sudo systemctl edit dorevia-vault
```

Ajouter :

```ini
[Service]
EnvironmentFile=/opt/dorevia-vault/.env
```

Puis :

```bash
sudo systemctl daemon-reload
sudo systemctl restart dorevia-vault
```

---

## ✅ Vérification

Après chaque redémarrage, vérifiez :

```bash
# Health check
curl http://localhost:8080/api/v1/health/zreports

# Test endpoint
curl -X POST http://localhost:8080/api/v1/pos/zreports \
  -H "Content-Type: application/json" \
  -H "X-Tenant: test" \
  -d '{}'
```

---

## 📋 Checklist

- [x] Fichier .env créé
- [x] Variables Z-Reports configurées
- [x] JWS configuré
- [ ] DATABASE_URL ajouté (optionnel, peut rester dans l'environnement)
- [ ] Service redémarré avec .env
- [ ] Vérification effectuée

---

**Configuration permanente prête** ✅

