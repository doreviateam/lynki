# Runbook — Déploiement DLP (Decision Link Performance)

**Référence :** SPEC_DLP_v0.3.md  
**Date :** 2026-02-24

---

## 1. Prérequis

- Docker et Docker Compose
- Réseau Docker `dorevia-network` existant
- PostgreSQL 16 (pour la base DLP)

---

## 2. Démarrage du service DLP

```bash
cd /opt/dorevia-plateform/units/dlp
docker compose up -d
```

Vérification :
```bash
docker ps --filter name=dlp
curl -s http://localhost:8020/health
# Depuis un conteneur sur dorevia-network : curl http://dlp:8020/health
```

---

## 3. Build DLP (après modification du code)

```bash
cd /opt/dorevia-plateform/units/dlp
docker compose build --no-cache
docker compose up -d --force-recreate
```

---

## 4. Configuration Odoo (connecteur)

1. Installer les modules **project** et **hr_timesheet** si absent :
   ```bash
   ./scripts/install_odoo_modules_dlp.sh <tenant> <env>
   ```

2. Installer le module **dorevia_dlp_connector** :
   ```bash
   docker exec odoo_<env>_<tenant> odoo -c /etc/odoo/odoo.conf -d odoo_<env>_<tenant> -i dorevia_dlp_connector --stop-after-init
   docker compose -f tenants/<tenant>/apps/odoo/<env>/docker-compose.yml start odoo
   ```

3. Paramètres système (Paramètres > Technique > Paramètres système) :
   - `dorevia.dlp.service.url` = `http://dlp:8020`
   - `dorevia.dlp.tenant.id` = `<tenant_slug>` (ex : `sarl-la-platine`)

---

## 5. Configuration Linky

Linky reçoit `DLP_URL` via le manifest (`linky_dlp_url` ou défaut `http://dlp:8020`).  
Le tenant est transmis automatiquement via `TENANT_ID` d'environnement.

### Synchronisation des sociétés depuis la config

Les sociétés du tenant (ex : SARL La Platine, Sweet Manihot) sont définies dans le manifest (`linky_company_display_names`) et exposées via `COMPANY_DISPLAY_NAMES` dans Linky.

Sur la page **Gestion des DLP** (`/dlp`), cliquer sur **« Synchroniser depuis la config »** dans la section Sociétés pour créer en DLP les sociétés manquantes sans recréer les existantes.

---

## 6. Arrêt / redémarrage

```bash
cd units/dlp
docker compose stop
docker compose start
```

---

## 7. Dépannage

| Problème | Vérification |
|----------|--------------|
| DLP inaccessible depuis Linky | Vérifier que Linky et DLP sont sur `dorevia-network` |
| "Cannot GET /api/v1/dlp/energy-summary" | Rebuild de l'image DLP (route peut être absente d'une ancienne image) |
| "invalid tenant uuid" | Utiliser le slug (ex. `sarl-la-platine`) — DLP résout automatiquement |
| Odoo ne notifie pas DLP | Vérifier `dorevia.dlp.service.url` et `dorevia.dlp.tenant.id` ; logs Odoo `grep dlp` |
| Aucun hit dans Énergie stratégique | Vérifier companies, périmètres, DLP, mapping projet→périmètre dans /dlp |

---

## 8. Références

- SPEC : `ZeDocs/web31/SPEC_DLP_v0.3.md`
- Checklist activation tenant : `ZeDocs/web31/CHECKLIST_ACTIVATION_DLP_TENANT.md`
- Checklist Phase 0 Odoo : `ZeDocs/web31/CHECKLIST_PHASE0_ODOO_DLP.md`
