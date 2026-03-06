# Documentation — docker-compose.lab.yml

## 🎯 Rôle de `units/odoo/docker-compose.lab.yml`

Ce fichier est un **docker-compose de développement local** pour tester Odoo et développer des modules rapidement.

### Différences avec `tenants/core/apps/odoo/lab/docker-compose.yml`

| Aspect | `units/odoo/docker-compose.lab.yml` | `tenants/core/apps/odoo/lab/docker-compose.yml` |
|:-------|:-----------------------------------|:-------------------------------------------------|
| **Usage** | Développement local / Tests rapides | Environnement Lab réel (production-like) |
| **Port** | `18069:8069` (exposé directement) | Pas de port (routage via Caddy) |
| **Réseau** | Réseau Docker par défaut | `dorevia-network` (externe) |
| **Volumes** | Chemins relatifs (`./custom-addons`) | Chemins absolus (`/opt/dorevia-plateform/...`) |
| **Restart** | Pas de politique de restart | `restart: unless-stopped` |
| **Healthcheck** | Pas de healthcheck | Healthcheck PostgreSQL |
| **Container names** | Génériques | Nommés (`odoo_lab_core`, etc.) |
| **Command** | Simple (`odoo -c ...`) | Avec `oca_flatten.sh` |

---

## 📋 Utilisation

### Lancer l'environnement de développement

```bash
cd /opt/dorevia-plateform/units/odoo

# Lancer avec docker-compose.lab.yml
docker-compose -f docker-compose.lab.yml up -d

# Accéder à Odoo
# URL: http://localhost:18069
```

### Arrêter l'environnement

```bash
docker-compose -f docker-compose.lab.yml down
```

---

## 🔧 Modifier pour inclure PyJWT

Si vous voulez utiliser ce fichier pour tester le module `dorevia_billing_core` avec PyJWT :

**Modifier le service `odoo`** :

```yaml
odoo:
  build:
    context: .
    dockerfile: Dockerfile
  image: odoo:18.0-dorevia
  # ... reste de la configuration
```

**Avant** :
```yaml
odoo:
  image: odoo:18.0
```

**Après** :
```yaml
odoo:
  build:
    context: .
    dockerfile: Dockerfile
  image: odoo:18.0-dorevia
```

---

## ✅ Quand utiliser ce fichier ?

### ✅ Utiliser `units/odoo/docker-compose.lab.yml` pour :
- Développement local de modules
- Tests rapides sans configuration complexe
- Débogage avec accès direct au port
- Développement hors infrastructure Dorevia

### ❌ Ne pas utiliser pour :
- Environnements de production
- Tests d'intégration avec l'infrastructure complète
- Déploiements réels

---

## 📚 Fichiers docker-compose dans `units/odoo/`

- **`docker-compose.yml`** : Configuration de base (générique)
- **`docker-compose.lab.yml`** : Configuration Lab (développement local)
- **`docker-compose.prod.yml`** : Configuration Production (si nécessaire)

---

**Date de création** : 2026-01-04

