# Odoo 19 production — Firmin Christelle

- **Base de données :** firmin_christelle
- **URL :** https://firmin.christelle.doreviateam.com

## Démarrage

1. Copier `.env.example` en `.env` et renseigner les secrets
2. Inclure le bloc de `caddy-snippet.conf` dans la Caddyfile du serveur
3. Lancer le bootstrap : `./bootstrap_db.sh`

## Commandes

- `./bootstrap_db.sh` — recrée la base et initialise Odoo (fr_FR)
- `docker compose -f docker-compose.prod-o19.yml up -d` — démarrer
- `docker compose -f docker-compose.prod-o19.yml logs -f odoo` — logs
