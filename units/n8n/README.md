# Unit n8n — Dorevia Plateforme

**SPEC** : `ZeDocs/web11/SPEC_Units_SuiteCRM_N8n_Plateforme_v1.0.md`  
**Rôle** : Orchestration de workflows (webhooks, sync, transformations, appels API). Chaîne : SuiteCRM → n8n → Odoo → DVIG → Vault.

---

## Structure

```
units/n8n/
  docker-compose.yml   # Référence (aligné render) ; test local avec dorevia-network
  .env.example        # Variables à copier vers .env
  README.md            # Cette doc
  workflows/           # Templates JSON (export n8n) — optionnel
```

- **Port app** : 5678 (interne). Routage **uniquement via Caddy** (TLS).
- **Conteneurs** : `n8n_<env>_<tenant>`, `n8n_db_<env>_<tenant>`.
- **Réseau** : `dorevia-network` (external).

---

## Prérequis

- Docker et Docker Compose.
- Réseau : `docker network create dorevia-network` si absent.
- **N8N_ENCRYPTION_KEY** : obligatoire, stable (ne jamais perdre, sinon perte des credentials chiffrés).

---

## Test local (sans dorevia.sh)

```bash
cd units/n8n
cp .env.example .env
# Définir N8N_ENCRYPTION_KEY (min. 32 caractères)
docker compose up -d
# Accès via Caddy : https://n8n.<env>.<tenant>.doreviateam.com
```

---

## Déploiement via plateforme

1. Manifest du tenant avec `universes: ["n8n"]`, `units.n8n: ["n8n", "postgres"]`.
2. `bin/dorevia.sh render <tenant> --env <env>` → génère `tenants/<tenant>/rendered/<env>/n8n/docker-compose.yml`.
3. `bin/dorevia.sh app up n8n <env> <tenant>` → copie le rendu et lance les conteneurs.  
   **Note** : le compose généré utilise une valeur par défaut pour `N8N_ENCRYPTION_KEY` ; en production, définir le secret dans `tenants/<tenant>/apps/n8n/<env>/.env` ou via secrets.

---

## Variables d’environnement (minimum)

| Variable | Description | Exemple |
|----------|-------------|---------|
| N8N_DOMAIN | Hostname public | n8n.stinger.tenant.doreviateam.com |
| N8N_ENCRYPTION_KEY | Clé chiffrement (obligatoire, stable — ne jamais perdre) | *** (32+ caractères) |
| N8N_BASIC_AUTH_* | Basic auth (optionnel) | Voir PROCEDURE_N8N_AUTH_WORKFLOWS.md |
| DB_POSTGRESDB_* | Connexion PostgreSQL | n8n / n8n / *** |
| TZ | Fuseau | Europe/Paris |

---

## Workflows templates (v1.0 — Sprint 3)

- **Template A** : Web-to-Lead (webhook → SuiteCRM Lead/Contact). Fichier minimal : `workflows/webhook-echo.json` (import + exécution OK).
- **Template B** : Opportunity Won → Odoo Partner + Quotation. Structure décrite dans `workflows/README.md`.
- **Import** : n8n → Import from File → choisir un JSON dans `workflows/` ; activer le workflow ; tester l’URL de production.
- **Procédure détaillée** : `ZeDocs/web11/PROCEDURE_N8N_AUTH_WORKFLOWS.md` (auth, N8N_ENCRYPTION_KEY, import, flows A/B).

---

## Rollback / réinstall propre

- **Arrêt** : `dorevia.sh app down n8n <env> <tenant>`.
- **Destruction + purge volumes** : `dorevia.sh app destroy n8n <env> <tenant> --purge` (redeploy à zéro).  
Voir `ZeDocs/web11/RUNBOOK_SPRINT2_DEPLOY_CADDY_DESTROY.md` §4.

---

## Backup (v1.0 minimal)

- **DB** : `pg_dump` depuis le conteneur `n8n_db_<env>_<tenant>`.
- **Volume** : `~/.n8n` (optionnel si l’essentiel est en DB).
