# Plan d’implémentation — Odoo 19 production Doreviateam

**Document** : ZeDocs/web42/PLAN_IMPLEMENTATION_ODOO19_PROD.md  
**Spec de référence** : [odoo-doreviateam.md](./odoo-doreviateam.md)  
**Objectif** : Déployer Odoo 19 en production sur `odoo.doreviateam.com` (base `doreviateam`), phase 1 sans Vault/DVIG.

---

## État d’avancement (résumé)

| Bloc | Statut | Détail |
|------|--------|--------|
| **Prérequis** | 🟡 Partiel | DNS ✅ validé. Serveur / dépôt / Caddy à confirmer sur l’hôte cible. |
| **Phase 1 — Fichiers** | 🟢 Fait | Répertoire `tenants/doreviateam/apps/odoo/prod/` créé avec `docker-compose.prod-o19.yml`, `odoo.prod-o19.conf`, `.env.example`, `.gitignore`. |
| **Phase 2 — Premier lancement** | ⚪ En attente | Dépend de la Phase 1. |
| **Phase 3 — Caddy** | ⚪ En attente | Dépend du lancement de la stack. |
| **Phase 4 — Validation** | ⚪ En attente | Dépend de Caddy + Odoo accessible en HTTPS. |
| **Phase 5 — Après mise en service** | ⚪ En attente | Retrait du port 38069, backups. |

**Prochaine étape recommandée** : sur le serveur cible, copier `.env.example` en `.env`, renseigner `POSTGRES_PASSWORD` et remplacer dans `odoo.prod-o19.conf` les placeholders `<MOT_DE_PASSE_MAITRE>` et `<MDP>`, puis exécuter la Phase 2 (premier lancement).

---

## Prérequis

- [x] DNS : `odoo.doreviateam.com` → `85.215.206.213` (A, TTL 360) — **validé**
- [ ] Serveur cible : IP `85.215.206.213`, Docker et Docker Compose installés, réseau `dorevia-network` créé
- [ ] Dépôt plateforme cloné sur le serveur (ex. `/opt/dorevia-plateform`) avec `units/odoo/addons-o19`, `units/odoo/custom-addons`, `sources/oca` disponibles
- [ ] Caddy (ou autre reverse proxy) installé sur le serveur, capable de joindre les conteneurs via `dorevia-network`

---

## Phase 1 — Fichiers et répertoire

### 1.1 Créer le répertoire de déploiement prod O19

Emplacement recommandé : **`tenants/doreviateam/apps/odoo/prod/`** (ou, si vous préférez tout dans units/odoo : `units/odoo/prod-o19/`).

```bash
mkdir -p tenants/doreviateam/apps/odoo/prod
cd tenants/doreviateam/apps/odoo/prod
```

### 1.2 Créer le fichier `.env` (secrets, hors dépôt)

Créer un fichier `.env` **à la racine du répertoire de déploiement** (ex. `tenants/doreviateam/apps/odoo/prod/.env`), **sans le committer** :

```env
POSTGRES_PASSWORD=<mot_de_passe_fort_db>
```

Les autres secrets (notamment `admin_passwd` Odoo) sont dans `odoo.conf` ; s’il est généré depuis un template, utiliser des variables d’environnement ou un gestionnaire de secrets pour ne jamais committer les mots de passe.

### 1.3 Créer `odoo.prod-o19.conf`

Créer dans le même répertoire un fichier `odoo.prod-o19.conf` (ou `odoo.conf`) avec le contenu décrit dans la spec § 3.2, en remplaçant :

- `admin_passwd` = mot de passe maître Odoo (fort, stocké de façon sécurisée)
- `db_password` = même valeur que `POSTGRES_PASSWORD` dans `.env` (ou référence à une variable)

**Si la base n’existe pas encore** : mettre temporairement `list_db = True`, à remettre à `False` après création de la base.

### 1.4 Créer `docker-compose.prod-o19.yml` (ou `docker-compose.yml`)

Créer le fichier Compose complet avec :

- **db** : image `postgres:16`, `restart: unless-stopped`, healthcheck `pg_isready -U dorevia`, variables `POSTGRES_DB=doreviateam`, `POSTGRES_USER=dorevia`, `POSTGRES_PASSWORD` depuis `.env`, volume dédié, réseau `dorevia-network`. Optionnel : `command` avec `max_connections=100` et `shared_buffers=256MB`.
- **odoo** : image `odoo:19.0`, `init: true`, `tty: true` (optionnel), `depends_on: db condition: service_healthy`, `restart: unless-stopped`, `stop_grace_period: 60s`, healthcheck `curl -f http://localhost:8069/web/health`, port temporaire `38069:8069` pour install/debug.
- **Volumes Odoo** :
  - `<CHEMIN_PLATEFORME>/sources/oca` → `/mnt/oca:ro`
  - `<CHEMIN_PLATEFORME>/units/odoo/addons-o19` → `/mnt/addons-o19:ro`
  - Volume nommé `oca_extra_addons` → `/mnt/extra-addons`
  - `<CHEMIN_PLATEFORME>/units/odoo/custom-addons` → `/mnt/custom-addons`
  - Fichier local `odoo.prod-o19.conf` → `/etc/odoo/odoo.conf:ro`
  - Volume nommé `odoo_prod_o19_data` → `/var/lib/odoo`
- **Commande Odoo** : `sh -c "/mnt/custom-addons/bin/oca_flatten.sh && odoo -c /etc/odoo/odoo.conf"`
- **Réseau** : `dorevia-network`

Exemple de chemins si la plateforme est dans `/opt/dorevia-plateform` :

```yaml
volumes:
  - /opt/dorevia-plateform/sources/oca:/mnt/oca:ro
  - /opt/dorevia-plateform/units/odoo/addons-o19:/mnt/addons-o19:ro
  - oca_extra_addons:/mnt/extra-addons
  - /opt/dorevia-plateform/units/odoo/custom-addons:/mnt/custom-addons
  - ./odoo.prod-o19.conf:/etc/odoo/odoo.conf:ro
  - odoo_prod_o19_data:/var/lib/odoo
```

S’assurer que le script `oca_flatten.sh` utilise bien `OCA_ROOT=/mnt/oca` et `DEST=/mnt/extra-addons` (valeurs par défaut du script).

---

## Phase 2 — Premier lancement

**Option rapide** : depuis `tenants/doreviateam/apps/odoo/prod/`, exécuter `./deploy.sh`. Le script vérifie `.env`, les placeholders dans la config, crée le réseau si besoin, puis lance la stack.

### 2.1 Vérifier le réseau Docker

```bash
docker network ls | grep dorevia-network
```

Si absent : `docker network create dorevia-network`.

### 2.2 Lancer la stack

Depuis le répertoire contenant `docker-compose.prod-o19.yml` et `.env` :

```bash
docker compose -f docker-compose.prod-o19.yml up -d
```

### 2.3 Vérifier les logs

```bash
docker compose -f docker-compose.prod-o19.yml logs -f odoo
```

À contrôler :

- Pas d’erreur Python ou d’import de module.
- Ligne **`database: doreviateam`** (et non `database: False`).

Si la base n’existe pas encore (greenfield) et que `list_db = True` a été mis temporairement : aller sur l’URL de création de base (via port 38069 ou après config Caddy), créer la base `doreviateam`, puis remettre `list_db = False` dans `odoo.prod-o19.conf` et redémarrer :

```bash
docker compose -f docker-compose.prod-o19.yml restart odoo
```

---

## Phase 3 — Reverse proxy (Caddy)

### 3.1 Configurer le bloc Caddy pour `odoo.doreviateam.com`

Un extrait prêt à l’emploi est versionné dans **`tenants/doreviateam/apps/odoo/prod/caddy-snippet.conf`**. Sur l’hôte `85.215.206.213`, inclure ce bloc dans la Caddyfile (ou l’équivalent) :

```caddy
odoo.doreviateam.com {

    reverse_proxy odoo_prod_o19:8069 {
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-For {remote_host}
    }

}
```

**Important** : le nom du service (ex. `odoo_prod_o19`) et le réseau doivent permettre à Caddy d’atteindre le conteneur. Si Caddy tourne sur le même host avec accès à `dorevia-network`, utiliser le **nom du service** comme hostname (ex. `odoo_prod_o19`). Si Caddy est dans un autre compose, s’assurer que les deux stacks partagent le même réseau `dorevia-network` et que le nom de service est résolvable.

Recharger Caddy (ex. `caddy reload` ou redémarrage du conteneur Caddy).

### 3.2 Vérifier HTTPS

Ouvrir **https://odoo.doreviateam.com** dans un navigateur. Le certificat (Let’s Encrypt ou autre) doit être valide. Si Odoo est joignable en HTTP en interne, Caddy gère HTTPS vers le client.

---

## Phase 4 — Validation

- [ ] **Interface** : connexion à https://odoo.doreviateam.com (écran de login Odoo, pas de sélection de base).
- [ ] **Logs** : `database: doreviateam` dans les logs Odoo.
- [ ] **Test prod rapide** :  
  `curl -I https://odoo.doreviateam.com/web/login`  
  Attendu : **HTTP/2 200** (ou HTTP/1.1 200 selon le serveur).
- [ ] **Modules** : dans Odoo (Mode développeur si besoin), vérifier que les modules attendus (queue_job, addons métier, OCA) sont installables / installés.
- [ ] **Aucun test Vault/DVIG** en phase 1.

---

## Phase 5 — Après mise en service (optionnel)

- [ ] **Retirer le port exposé** : dans `docker-compose.prod-o19.yml`, commenter ou supprimer `ports: - "38069:8069"` pour l’accès uniquement via Caddy. Puis `docker compose -f docker-compose.prod-o19.yml up -d` pour recréer le conteneur.
- [ ] **Backup** : mettre en place un cron (ou équivalent) pour :
  - Dump PostgreSQL : `pg_dump -U dorevia -h <host_db> doreviateam > /backups/db_$(date +%F).sql` (adapter `host_db` si accès depuis l’hôte : ex. `localhost` avec port mappé temporaire ou nom du service).
  - Copie/snapshot du volume filestore (ex. `odoo_prod_o19_data`) vers un stockage dédié, avec rotation et rétention.

---

## Rollback

En cas de problème critique :

1. Arrêter la stack O19 :  
   `docker compose -f docker-compose.prod-o19.yml down`
2. Si une ancienne stack Odoo 18 (prod) est encore disponible : la réactiver et rediriger Caddy vers elle si besoin.
3. Conserver tout dump PostgreSQL effectué avant migration pour restauration éventuelle.

---

## Résumé des commandes (ordre recommandé)

| Étape | Commande / action |
|-------|-------------------|
| 1 | Créer le répertoire `tenants/doreviateam/apps/odoo/prod` (ou équivalent) |
| 2 | Créer `.env` avec `POSTGRES_PASSWORD` (ne pas committer) |
| 3 | Créer `odoo.prod-o19.conf` (secrets renseignés de façon sécurisée) |
| 4 | Créer `docker-compose.prod-o19.yml` (chemins adaptés au serveur) |
| 5 | `docker network inspect dorevia-network` (ou créer le réseau si besoin), ou lancer **`./deploy.sh`** depuis `tenants/doreviateam/apps/odoo/prod/` |
| 6 | `docker compose -f docker-compose.prod-o19.yml up -d` (ou via `deploy.sh`) |
| 7 | Vérifier les logs : `database: doreviateam` |
| 8 | Configurer Caddy pour `odoo.doreviateam.com` → `odoo_prod_o19:8069` |
| 9 | Tester : `curl -I https://odoo.doreviateam.com/web/login` → HTTP/2 200 |
| 10 | (Optionnel) Retirer le port 38069 et mettre en place les backups |

---

## Référence

- **Spec complète** : [odoo-doreviateam.md](./odoo-doreviateam.md)  
- **Référence lab O19** : `tenants/o19/apps/odoo/lab/docker-compose.yml` et `odoo.conf`
