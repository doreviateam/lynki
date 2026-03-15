# Odoo 19 production — Doreviateam

Déploiement Odoo 19 pour **odoo.doreviateam.com** (base `doreviateam`).  
Spec : [ZeDocs/web42/odoo-doreviateam.md](../../../../ZeDocs/web42/odoo-doreviateam.md)  
Plan : [ZeDocs/web42/PLAN_IMPLEMENTATION_ODOO19_PROD.md](../../../../ZeDocs/web42/PLAN_IMPLEMENTATION_ODOO19_PROD.md).

## Avant le premier lancement

1. **Créer `.env`** à partir de `.env.example` et renseigner `POSTGRES_PASSWORD` et `ADMIN_PASSWD` (injectés dans la config au démarrage).
2. **Fins de ligne du `.env`** : obligatoire en Unix (LF), sans `\r`. Sur le serveur, exécuter une seule fois :
   ```bash
   sed -i 's/\r$//' .env
   docker compose -f docker-compose.prod-o19.yml down
   docker volume rm odoo_prod_o19_db
   docker compose -f docker-compose.prod-o19.yml up -d
   ```
   (Sinon Postgres et Odoo peuvent avoir des mots de passe légèrement différents et l’auth échoue.)
3. La config est générée depuis `odoo.prod-o19.conf.template` ; ne pas mettre de secrets dans le template.
3. **Ancienne méthode** (si tu utilises encore `odoo.prod-o19.conf`) : remplacer les placeholders dans la config :
   - `<MOT_DE_PASSE_MAITRE>` → mot de passe maître Odoo (admin)
   - `<MDP>` → même valeur que `POSTGRES_PASSWORD` dans `.env`
3. Si la base n’existe pas encore : mettre `list_db = True` dans la config, créer la base via l’UI, puis remettre `list_db = False` et redémarrer.

## Lancement

**Recommandé** (pre-flight + démarrage) :

```bash
./deploy.sh
```

Ou manuellement :

```bash
docker compose -f docker-compose.prod-o19.yml up -d
```

Logs : `docker compose -f docker-compose.prod-o19.yml logs -f odoo`

## Caddy

Inclure le bloc de `caddy-snippet.conf` dans la Caddyfile du serveur, puis recharger Caddy. URL finale : **https://odoo.doreviateam.com**

## Chemins

Les volumes pointent vers `/opt/dorevia-plateform`. Si la plateforme est ailleurs, adapter les chemins dans `docker-compose.prod-o19.yml`.
