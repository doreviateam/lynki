# Checklist préalables — Instance Odoo 18 lglz44

**Date** : 2026-02-12  
**Référence** : [PLAN_INSTANCE_ODOO_18_LGLZ44_2026-02-12.md](./PLAN_INSTANCE_ODOO_18_LGLZ44_2026-02-12.md)

---

## Étapes préalables à réaliser avant implémentation

| # | Étape | Vérification / action |
|---|-------|------------------------|
| 1 | **Docker et Docker Compose** | Installés et fonctionnels (`docker --version`, `docker compose version`). |
| 2 | **Réseau `dorevia-network`** | Réseau Docker externe existant : `docker network create dorevia-network` (si besoin). |
| 3 | **Gateway Caddy démarrée** | La gateway tourne (ex. `units/gateway`) pour servir les tenants existants. |
| 4 | **DNS configuré** | Le hostname `odoo.lab.lglz44.doreviateam.com` résout vers l'IP du serveur où tourne Caddy. |
| 5 | **Sources du projet** | Les dossiers `sources/oca/`, `units/odoo/custom-addons/`, `units/odoo/custom-addons/bin/oca_flatten.sh` sont présents. |
| 6 | **Accès au dépôt** | Vous pouvez créer des fichiers et exécuter `dorevia.sh` (droits en écriture). |
| 7 | **Image Odoo 18** | L'image `odoo:18.0-20250819` (ou équivalent) est disponible ou peut être téléchargée. |
| 8 | **Mot de passe admin Odoo** | Choisir le mot de passe maître (`admin_passwd`) pour le gestionnaire de bases dans `odoo.conf`. |
| 9 | **Volume data propre** | Vérifier que le volume Odoo est dédié (ex. `/var/lib/docker/volumes/odoo_lab_lglz44_data` ou équivalent). Ne pas partager de filestore avec un autre tenant. |
| 10 | **Ports 8069 libres** | Éviter les collisions : aucun autre tenant ne doit écouter sur le binding 8069 si un mapping local est utilisé. |
| 11 | **Image Odoo pullée** | Avant `apply`, s'assurer que l'image est présente (évite le délai surprise pendant le déploiement). |

---

## Vérifications rapides

```bash
# Réseau
docker network inspect dorevia-network

# Gateway
docker ps | grep -i caddy

# DNS
dig +short odoo.lab.lglz44.doreviateam.com

# Sources
ls -la /opt/dorevia-plateform/sources/oca
ls -la /opt/dorevia-plateform/units/odoo/custom-addons/bin/oca_flatten.sh

# Volume data Odoo dédié (ne doit pas être partagé avec un autre tenant)
docker volume inspect odoo_lab_lglz44_data 2>/dev/null || echo "Volume pas encore créé (normal avant 1er up)"

# Ports 8069 — éviter collisions silencieuses (mapping local)
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep 8069

# Image Odoo pullée avant apply (évite délai surprise pendant déploiement)
docker image inspect odoo:18.0-20250819 >/dev/null 2>&1 || docker pull odoo:18.0-20250819
```

---

## Vérifications post-déploiement (après docker compose up -d)

```bash
# Conteneur bien attaché au réseau externe dorevia-network
docker inspect odoo_lab_lglz44 | grep dorevia-network
```

---

## Test HTTPS réel après reload

Après tout (gateway aggregate + caddy reload + conteneurs up) :

```bash
curl -I https://odoo.lab.lglz44.doreviateam.com
```

**Interprétation :**

| Réponse | Signification |
|---------|---------------|
| `HTTP/2 200` ou `HTTP/2 303` | OK |
| `502` | Caddy route OK mais backend (Odoo) KO |
| `NXDOMAIN` | Problème DNS |
| `timeout` | Firewall / réseau |

Diagnostic immédiat pour localiser la panne.

---

## Rappel opérationnel : gateway aggregate + reload

Après `gateway aggregate`, **penser toujours** à recharger Caddy :

```bash
docker compose -f units/gateway/docker-compose.yml exec caddy caddy reload
```

Sans ce `reload`, l'URL ne répondra pas — le Caddyfile a été mis à jour mais Caddy n'a pas rechargé sa configuration.

---

Une fois ces préalables validés, vous pouvez enchaîner avec les étapes du plan d'implémentation.
