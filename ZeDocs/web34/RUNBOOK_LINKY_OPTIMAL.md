# Runbook — Linky fonctionnel de manière optimale

**Version** : 1.0  
**Date** : 2026-03-02

## 1. Prérequis (sans redéploiement)

### 1.1 DVIG → Vault

Le DVIG doit joindre le Vault via `VAULT_HOST` et `VAULT_PORT` (override sans rebuild) :

```yaml
# tenants/core-stinger/platform/docker-compose.yml (ou équivalent)
environment:
  - VAULT_HOST=vault-core-stinger   # ou vault-${TENANT_ID}
  - VAULT_PORT=8080
  - VAULT_URL=http://vault-core-stinger:8080
```

**Redémarrage** : `docker compose restart dvig` suffit (pas de rebuild).

### 1.2 Linky (UI)

Variables requises pour le dashboard :

| Variable | Valeur | Rôle |
|----------|--------|------|
| `VAULT_URL` | `http://vault-core-stinger:8080` | Appels API Vault (agrégations, preuves) |
| `DVIG_URL` | `http://dvig-core-stinger:8080` | Fallback vault-health |
| `DVIG_INTERNAL_TOKEN` | `dvig_internal_core-stinger_stinger` | Auth pour `/internal/vault-health` |
| `TENANT_ID` | `laplatine2026` | Tenant du dashboard |

Définies dans le manifest (`linky_vault_url`, `linky_dvig_url`, `linky_dvig_internal_token`) ou le compose.

### 1.3 Odoo → DVIG (vaultage)

Paramètres système Odoo (`ir_config_parameter`) :

| Clé | Valeur | Rôle |
|-----|--------|------|
| `dorevia.dvig.url` | `http://dvig-core-stinger:8080` | Ingest + base URL internal |
| `dorevia.dvig.token` | Token DVIG (ingest) | Auth /ingest |
| `dorevia.dvig.source` | `odoo.lab.laplatine2026` | Source au format unit.env.tenant |
| `dorevia.dvig.internal.token` | `dvig_internal_core-stinger_stinger` | Auth `/internal/outbox/process` |

**Script** : `tenants/laplatine2026/scripts/fix_dvig_internal_and_vault.py` pour configurer le token interne.

## 2. Vérifications rapides

```bash
# DVIG utilise bien le Vault
docker exec dvig-core-stinger env | grep VAULT

# Outbox vide ou forwarded
docker exec dvig-db-core-stinger psql -U dvig_user -d dvig_db -c \
  "SELECT status, COUNT(*) FROM outbox_events GROUP BY status;"

# Documents 2026 dans le Vault
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c \
  "SELECT EXTRACT(YEAR FROM created_at) as year, COUNT(*) FROM documents GROUP BY 1;"
```

## 3. En cas de 500 DVIG → Vault

1. Vérifier `VAULT_HOST` et `VAULT_PORT` dans l’env du conteneur DVIG.
2. Si absents : ajouter au compose et `docker compose restart dvig`.
3. Relancer le worker : `POST /internal/outbox/process` (via Odoo cron ou curl).

## 4. Références

- `lib/render/render_platform_compose.sh` — template DVIG (VAULT_HOST/PORT)
- `lib/render/render_app_compose.sh` — template Linky (DVIG_INTERNAL_TOKEN)
- `scripts/check_config_duree_vault_30s.sh` — vérif config Odoo
