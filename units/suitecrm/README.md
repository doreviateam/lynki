# Unit SuiteCRM — Dorevia Plateforme

**SPEC** : `ZeDocs/web11/SPEC_Units_SuiteCRM_N8n_Plateforme_v1.0.md`  
**Rôle** : CRM (pipeline commercial, contacts, activités). Chaîne : Site/Formulaires → SuiteCRM → n8n → Odoo → DVIG → Vault.

---

## Structure

```
units/suitecrm/
  docker-compose.yml   # Référence (aligné render) ; test local avec dorevia-network
  .env.example        # Variables à copier vers .env
  README.md            # Cette doc
```

- **Port app** : 80 (interne). Routage **uniquement via Caddy** (TLS, pas d’exposition host).
- **Conteneurs** : `suitecrm_<env>_<tenant>`, `suitecrm_db_<env>_<tenant>`.
- **Réseau** : `dorevia-network` (external).

---

## Prérequis

- Docker et Docker Compose.
- Réseau : `docker network create dorevia-network` si absent.
- **Image SuiteCRM** : Bitnami n’est plus gratuit sur Docker Hub ; définir `SUITECRM_IMAGE` (ou `images.suitecrm` dans le manifest) vers une image disponible (registry, AWS Public Gallery, ou image custom).

---

## Test local (sans dorevia.sh)

```bash
cd units/suitecrm
cp .env.example .env
# Éditer .env (SUITECRM_DOMAIN, mots de passe, optionnellement SUITECRM_IMAGE)
docker compose up -d
# Accès via Caddy uniquement (pas de port exposé sur l’hôte)
```

---

## Déploiement via plateforme

1. Manifest du tenant avec `universes: ["suitecrm"]`, `units.suitecrm: ["suitecrm", "mariadb"]`.
2. `bin/dorevia.sh render <tenant> --env <env>` → génère `tenants/<tenant>/rendered/<env>/suitecrm/docker-compose.yml`.
3. `bin/dorevia.sh app up suitecrm <env> <tenant>` → copie le rendu vers `tenants/<tenant>/apps/suitecrm/<env>/` et lance les conteneurs.

---

## Variables d’environnement (minimum)

| Variable | Description | Exemple |
|----------|-------------|---------|
| SUITECRM_DOMAIN | Hostname public | suitecrm.stinger.tenant.doreviateam.com |
| SUITECRM_DB_* | Connexion MariaDB | suitecrm / suitecrm / *** |
| SUITECRM_ADMIN_* | Admin CRM | admin / *** |
| TZ | Fuseau | Europe/Paris |

---

## Rollback / réinstall propre

- **Arrêt** : `dorevia.sh app down suitecrm <env> <tenant>`.
- **Destruction + purge volumes** : `dorevia.sh app destroy suitecrm <env> <tenant> --purge` (redeploy à zéro).  
Voir `ZeDocs/web11/RUNBOOK_SPRINT2_DEPLOY_CADDY_DESTROY.md` §4.

---

## Backup (v1.0 minimal)

- **DB** : `mysqldump` depuis le conteneur `suitecrm_db_<env>_<tenant>`.
- **Volumes** : au minimum `uploads/` (ou équivalent selon image).
