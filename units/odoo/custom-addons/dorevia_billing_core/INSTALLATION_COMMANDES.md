# Commandes d'Installation — Dorevia Billing CORE

## 🐳 Commandes Docker

### Syntaxe moderne : `docker compose` (sans tiret)

Docker Compose V2 utilise la syntaxe **`docker compose`** (sans tiret).

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

# Reconstruire l'image
docker compose build odoo

# Redémarrer le service
docker compose up -d odoo

# Vérifier les logs
docker compose logs odoo

# Vérifier que PyJWT est installé
docker compose exec odoo python3 -c "import jwt; print('✅ PyJWT OK')"
```

### Syntaxe ancienne : `docker-compose` (avec tiret)

Si vous avez l'ancienne version de docker-compose installée :

```bash
# Installer docker-compose (si nécessaire)
sudo apt install docker-compose

# Utiliser avec tiret
docker-compose build odoo
docker-compose up -d odoo
```

---

## 🔍 Vérifier quelle syntaxe utiliser

```bash
# Tester la syntaxe moderne
docker compose version

# Si ça fonctionne → utiliser "docker compose"
# Si erreur → utiliser "docker-compose" ou installer
```

---

## 🚀 Installation complète (exemple)

```bash
# 1. Aller dans le répertoire
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

# 2. Reconstruire l'image avec PyJWT
docker compose build odoo

# 3. Redémarrer le service
docker compose up -d odoo

# 4. Vérifier que le conteneur tourne
docker compose ps

# 5. Vérifier PyJWT
docker compose exec odoo python3 -c "import jwt; print('✅ PyJWT version:', jwt.__version__)"

# 6. Vérifier les logs
docker compose logs odoo | tail -20
```

---

## 📝 Notes

- **Docker Compose V2** : Utilise `docker compose` (sans tiret)
- **Docker Compose V1** : Utilise `docker-compose` (avec tiret)
- La plupart des installations récentes utilisent V2

---

**Date de création** : 2026-01-04

