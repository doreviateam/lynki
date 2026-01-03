# 🔧 Correction Erreur 502 - Odoo STINGER

**Date** : 2025-01-28  
**Problème** : 502 Bad Gateway sur `odoo.stinger.core.doreviateam.com`  
**Cause** : Container Odoo STINGER non démarré

---

## 🔴 Problème Identifié

### Symptôme
- Erreur **502 Bad Gateway** sur `https://odoo.stinger.core.doreviateam.com/`
- Caddy (reverse proxy) ne peut pas joindre le backend Odoo

### Cause
Le container **Odoo STINGER** n'était pas démarré. Le Caddyfile configure :
```
odoo.stinger.core.doreviateam.com {
  reverse_proxy host.docker.internal:28069
}
```

Mais aucun service n'écoutait sur le port `28069`.

---

## ✅ Solution Appliquée

### 1. Démarrage Container Odoo STINGER

```bash
cd /opt/dorevia-plateform/units/odoo
docker compose -f docker-compose.stinger.yml up -d
```

### 2. Initialisation Base de Données

**Problème** : La base de données n'était pas initialisée (erreur 500).

**Solution** : Initialiser avec le module `base` :

```bash
cd /opt/dorevia-plateform/units/odoo
docker compose -f docker-compose.stinger.yml stop odoo
docker compose -f docker-compose.stinger.yml run --rm odoo odoo -c /etc/odoo/odoo.conf -i base --stop-after-init
docker compose -f docker-compose.stinger.yml start odoo
```

### Vérification

```bash
# Vérifier que le container est actif
docker ps | grep stinger

# Vérifier que le port 28069 répond
curl http://localhost:28069

# Vérifier que le reverse proxy fonctionne
curl -I https://odoo.stinger.core.doreviateam.com/
```

---

## 📊 Configuration Odoo STINGER

### Docker Compose
**Fichier** : `units/odoo/docker-compose.stinger.yml`

- **Port** : `28069:8069` (externe:interne)
- **Base de données** : PostgreSQL 16
- **Volumes** : Custom addons, OCA addons, configuration

### Caddyfile
**Fichier** : `units/gateway/Caddyfile`

```
odoo.stinger.core.doreviateam.com {
  reverse_proxy host.docker.internal:28069
}
```

---

## ✅ Résultat Attendu

Après démarrage et initialisation :
- ✅ Container Odoo STINGER actif
- ✅ Base de données initialisée (module `base`)
- ✅ Port `28069` accessible
- ✅ Reverse proxy Caddy fonctionnel
- ✅ Site `odoo.stinger.core.doreviateam.com` accessible (200 OK)

---

## 🚨 Troubleshooting

### Problème : Container ne démarre pas

**Vérifier logs** :
```bash
cd /opt/dorevia-plateform/units/odoo
docker compose -f docker-compose.stinger.yml logs
```

### Problème : Port déjà utilisé

**Vérifier** :
```bash
netstat -tlnp | grep 28069
# ou
ss -tlnp | grep 28069
```

**Solution** : Arrêter le service qui utilise le port ou changer le port dans `docker-compose.stinger.yml`

### Problème : Base de données non accessible

**Vérifier** :
```bash
docker logs <container_db_stinger>
```

**Solution** : Vérifier que le container PostgreSQL STINGER est démarré

---

## ✅ Statut Final

**Problème résolu** : 2025-01-28

- ✅ Container Odoo STINGER actif
- ✅ Base de données initialisée (12 modules chargés)
- ✅ Port `28069` accessible
- ✅ Reverse proxy Caddy fonctionnel
- ✅ Site `odoo.stinger.core.doreviateam.com` accessible (303 redirect vers `/odoo`)

**Note** : La redirection 303 vers `/odoo` est normale pour Odoo lors de la première configuration.

---

**Dernière mise à jour** : 2025-01-28

