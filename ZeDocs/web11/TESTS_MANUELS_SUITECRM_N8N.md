# Tests manuels — SuiteCRM et n8n (Sprint 0 / Sprint 2)

**Runbook déploiement, Caddy, destroy, smoke test** : `ZeDocs/web11/RUNBOOK_SPRINT2_DEPLOY_CADDY_DESTROY.md`  
**Sprint 3 — SuiteCRM admin + backup** : `ZeDocs/web11/PROCEDURE_SUITECRM_ADMIN_BACKUP.md`  
**Sprint 3 — n8n auth + workflows** : `ZeDocs/web11/PROCEDURE_N8N_AUTH_WORKFLOWS.md`  
**Tests webhook n8n (import + exécution)** : `ZeDocs/web11/TESTS_WEBHOOK_N8N.md`  
**DNS OVH — n8n.lab.core** : `ZeDocs/web11/DNS_OVH_N8N_LAB_CORE.md`  
**Dépannage SSL n8n.lab.core** : `ZeDocs/web11/TROUBLESHOOTING_SSL_N8N_LAB_CORE.md`

**Date** : 2026-02-01  
**Contexte** : Après implémentation Sprint 0 (manifest, render, Caddy, dorevia.sh).

---

## Prérequis

- Réseau Docker **`dorevia-network`** existant :  
  `docker network inspect dorevia-network` (ou créer avec `docker network create dorevia-network`).
- Tenant **lab** avec manifest incluant `universes: ["odoo", "suitecrm", "n8n"]` et `units.suitecrm` / `units.n8n` (voir `tenants/lab/state/manifest.json` ou `ZeDocs/web11/manifest.example-odoo-suitecrm-n8n.json`).

---

## 1. Render

```bash
cd /opt/dorevia-plateform
bin/dorevia.sh render lab --env lab
```

**Attendu** : Caddyfile et docker-compose générés pour odoo, suitecrm, n8n dans `tenants/lab/rendered/lab/`.

**Vérification** :  
- `tenants/lab/rendered/lab/caddy/Caddyfile` : `reverse_proxy odoo_lab_lab:8069`, `suitecrm_lab_lab:80`, `n8n_lab_lab:5678`.  
- `tenants/lab/rendered/lab/n8n/docker-compose.yml` et `tenants/lab/rendered/lab/suitecrm/docker-compose.yml` présents.

---

## 2. n8n — app up / status / down

### 2.1 Démarrer

```bash
bin/dorevia.sh app up n8n lab lab
```

**Attendu** : Conteneurs `n8n_db_lab_lab` et `n8n_lab_lab` créés et démarrés, sur `dorevia-network`. Message « App n8n lab lab démarrée ».

### 2.2 Statut

```bash
bin/dorevia.sh app status n8n lab lab
```

**Attendu** : Liste des conteneurs (db + n8n), statut Up, URL ex. `https://n8n.lab.core.doreviateam.com` (tenant core) ou `https://n8n.lab.lab.doreviateam.com` (tenant lab). DNS OVH : voir `DNS_OVH_N8N_LAB_CORE.md`.

### 2.3 Arrêter

```bash
bin/dorevia.sh app down n8n lab lab
```

**Attendu** : Conteneurs arrêtés et supprimés. Message « App n8n lab lab arrêtée ».

### 2.4 Redémarrage

Relancer `app up n8n lab lab` : les volumes sont conservés, la base n8n est réutilisée.

**Résultat observé (2026-02-01)** : OK. Image utilisée : `n8nio/n8n:latest` (tag `1.0` absent sur Docker Hub, manifest/schema/render mis à jour en `latest`).

---

## 3. SuiteCRM — image à configurer

L’image **Bitnami SuiteCRM** n’est plus disponible gratuitement sur Docker Hub (tags vides / accès commercial). Pour tester SuiteCRM :

1. **Option A** : Définir dans le manifest une image accessible (registry privé, AWS Public Gallery, ou image custom) :
   ```json
   "images": {
     "suitecrm": "votre-registry/suitecrm:tag",
     "mariadb": "mariadb:11"
   }
   ```
2. **Option B** : Utiliser une image community ou un Dockerfile (ex. `jontitmus-code/SuiteCRM8_docker`).
3. Puis : `bin/dorevia.sh render lab --env lab` et `bin/dorevia.sh app up suitecrm lab lab`.

**Healthcheck MariaDB** : Le compose généré utilise `$$MARIADB_ROOT_PASSWORD` dans le healthcheck pour que la variable soit lue dans le conteneur (échappement docker-compose).

---

## 4. Validation compose générés

```bash
cd tenants/lab/rendered/lab/n8n && docker compose config -q
cd tenants/lab/rendered/lab/suitecrm && docker compose config -q
```

**Attendu** : Exit 0 pour les deux (warning éventuel sur variable non définie en local, sans impact au runtime).

---

## 5. Checklist rapide

| Action | n8n | SuiteCRM |
|--------|-----|----------|
| render lab lab | ✅ | ✅ |
| app up lab lab | ✅ | ⚠️ Image à fournir |
| app status lab lab | ✅ | — |
| app down lab lab | ✅ | — |
| Caddyfile ports 5678 / 80 | ✅ | ✅ |

---

## 6. Alignement render ↔ units (Sprint 1 US-1.3)

- **Images par défaut** : lues depuis le manifest (`images.suitecrm`, `images.mariadb`, `images.n8n`, `images.postgres`) ; valeurs par défaut dans `render_app_compose.sh` si absentes (ex. `n8nio/n8n:latest`, `mariadb:11`).
- **Units de référence** : `units/suitecrm/` et `units/n8n/` contiennent un docker-compose de référence (noms fixés lab/lab pour validation) ; le **compose déployé** est celui **généré par render** (`tenants/<tenant>/rendered/<env>/<univers>/docker-compose.yml`) puis copié vers `tenants/<tenant>/apps/<univers>/<env>/`.
- **Conventions** : conteneurs `<univers>_<env>_<tenant>`, `<univers>_db_<env>_<tenant>` ; volumes `<univers>_<env>_<tenant>_db`, `<univers>_<env>_<tenant>_data` ; réseau `dorevia-network`. Pas de conflit entre tenants/univers.

---

## 7. Fichiers modifiés pour les tests

- **Units Sprint 1** : `units/suitecrm/` et `units/n8n/` (docker-compose, .env.example, README, workflows/).
- **Image n8n** : défaut passé de `n8nio/n8n:1.0` à `n8nio/n8n:latest` (schema, render, manifest exemple, tenant lab).
- **Healthcheck MariaDB** : `$MARIADB_ROOT_PASSWORD` → `$$MARIADB_ROOT_PASSWORD` dans le compose généré pour éviter substitution par l’hôte.
