# Unit Appsmith CE — Dorevia Plateforme

**SPEC** : `ZeDocs/web13/unit_appSmith.md`  
**Rôle** : UI mobile-first (Dorevia-UI) pour visualiser indicateurs certifiés : factures ventes/achats validées et vaultées, trésorerie brute, etc. Appsmith consomme **uniquement** l’API Dorevia-UI read-only (tenant-scoped) — pas d’accès direct à la DB Vault.

---

## Structure

```
units/appsmith/
  docker-compose.yml   # Référence ; test local avec dorevia-network
  .env.example        # Variables à copier vers .env
  README.md            # Cette doc
```

- **Port app** : 80 (interne). Routage **uniquement via Caddy** (TLS).
- **Convention URL** : `ui.<env>.<tenant>.doreviateam.com` (ex. ui.lab.core.doreviateam.com).
- **Conteneur** : `appsmith_<env>_<tenant>`.
- **Réseau** : `dorevia-network` (external).
- **Volume persistant** : `appsmith_<env>_<tenant>_stacks` → `/appsmith-stacks` (apps, config, données).

---

## Prérequis

- Docker et Docker Compose.
- Réseau : `docker network create dorevia-network` si absent.
- **APPSMITH_ENCRYPTION_PASSWORD** et **APPSMITH_ENCRYPTION_SALT** : obligatoires, stables (ne jamais perdre — sinon perte des credentials chiffrés dans Appsmith).

---

## Run (test local)

```bash
cd units/appsmith
cp .env.example .env
# Éditer .env : définir APPSMITH_ENCRYPTION_PASSWORD et APPSMITH_ENCRYPTION_SALT (ex: openssl rand -base64 32)
docker compose up -d
# Accès via Caddy : https://ui.<env>.<tenant>.doreviateam.com
```

Pour le tenant **core** en **lab** avec Caddy configuré : https://ui.lab.core.doreviateam.com

---

## Unit up (Definition of Done)

- `unit up` (ou `docker compose up -d` dans `units/appsmith`) démarre Appsmith.
- UI accessible via le domaine configuré dans Caddy.
- Redémarrage serveur OK : le volume persistant conserve apps et config.
- Créer une page « Hello Dorevia-UI » dans Appsmith comme base de travail (premier écran après setup).

---

## Variables d’environnement (minimum)

| Variable | Description | Exemple |
|----------|-------------|---------|
| APPSMITH_DOMAIN | Hostname public (Caddy) | ui.lab.core.doreviateam.com |
| APPSMITH_ENCRYPTION_PASSWORD | Mot de passe chiffrement (obligatoire, stable) | *** (32+ caractères) |
| APPSMITH_ENCRYPTION_SALT | Sel chiffrement (obligatoire, stable) | *** (32+ caractères) |
| APPSMITH_INSTANCE_NAME | Nom affiché dans l’interface | Dorevia-UI |
| DEPLOY_ENV / TENANT_ID | Contexte déploiement (pour container_name / volume) | lab / core |
| TZ | Fuseau | Europe/Paris |

---

## Upgrade

- Mettre à jour l’image : définir `APPSMITH_IMAGE` (ex. `appsmith/appsmith-ce:v1.x`) ou éditer `docker-compose.yml`.
- `docker compose pull && docker compose up -d` dans `units/appsmith` (ou dans le répertoire rendu du tenant).
- Consulter les [release notes Appsmith](https://github.com/appsmithorg/appsmith/releases) pour éventuelles migrations.

---

## Backup volume

- **Volume** : `appsmith_<env>_<tenant>_stacks` (ex. `appsmith_lab_core_stacks`).
- **Sauvegarde** : copie du volume (ex. `docker run --rm -v appsmith_lab_core_stacks:/data -v $(pwd):/backup alpine tar czf /backup/appsmith-stacks-$(date +%Y%m%d).tar.gz -C /data .`).
- **Restauration** : arrêt du conteneur, restauration du tar dans le volume, puis `docker compose up -d`.

---

## Sécurité / architecture (non négociable)

- Appsmith consomme **uniquement** une **API Dorevia-UI read-only** (tenant-scoped).
- **Pas d’accès direct** Appsmith → DB Vault.
- Chiffrement : conserver **APPSMITH_ENCRYPTION_PASSWORD** et **APPSMITH_ENCRYPTION_SALT** de manière sécurisée (secrets, vault).
