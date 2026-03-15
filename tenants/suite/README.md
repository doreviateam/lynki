# Tenant Suite — Landing Dorevia

Site marketing **suite.doreviateam.com** (landing + page contact).

## Déploiement

1. **Construire l’image** (depuis la racine du dépôt) :
   ```bash
   docker build -t dorevia/suite:latest -f units/dorevia-suite/Dockerfile units/dorevia-suite
   ```

2. **Lancer le service** (réseau `dorevia-network` doit exister, ex. via `tenants/core-stinger/platform/docker-compose.yml`) :
   ```bash
   cd tenants/suite/apps/suite/lab
   docker compose up -d
   ```

3. **Configurer le reverse proxy** (Caddy ou équivalent) pour que `suite.doreviateam.com` pointe vers `suite_lab:3000`.

## Références

- Spec éditoriale : `ZeDocs/web41/spec_dorevia_landing_page.md`
- Spec implémentation : `ZeDocs/web41/spec_dorevia_landing_implementation.md`
- Code source : `units/dorevia-suite/`
