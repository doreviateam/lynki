# Mise à jour du Vault (core-stinger)

Le tenant **laplatine2026** (et d’autres) utilisent le Vault déployé sur le plateau **core-stinger** (`vault-core-stinger:8080`).

## 1. Build de l’image Vault

Depuis la racine du dépôt :

```bash
cd /opt/dorevia-plateform/sources/vault
docker build -t dorevia/vault:AR-temporalite-2026-03-13 .
```

(Remplace `AR-temporalite-2026-03-13` par le tag souhaité.)

## 2. Mise à jour du docker-compose core-stinger

Éditer `tenants/core-stinger/platform/docker-compose.yml` et modifier la ligne du service `vault` :

```yaml
vault:
  image: dorevia/vault:AR-temporalite-2026-03-13   # nouveau tag
  ...
```

## 3. Redéploiement du Vault

Depuis le répertoire platform core-stinger :

```bash
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker compose up -d --force-recreate vault
```

Cela recrée uniquement le conteneur `vault-core-stinger` avec la nouvelle image. La base PostgreSQL (`vault-db`) et les volumes ne sont pas touchés.

## Vérification

- Health : `curl -s http://localhost:8080/health` (ou l’URL exposée par Caddy).
- AR by partner avec temporalité :  
  `GET /ui/aggregations/ar-by-partner?tenant=laplatine2026&date_debut=2026-01-01&date_fin=2026-12-31`  
  La réponse doit contenir `overdue_avg_days` et `overdue_max_days` dans `totals` et dans chaque élément de `partners`.
