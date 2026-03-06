# Guide d’installation ERPNext pour tester Dorevia-Vault avec un autre ERP

Ce document décrit **en détail** comment installer **ERPNext** (stack Frappe) dans la plateforme Dorevia, sur le même modèle qu’Odoo et Sylius, afin de **tester Dorevia-Vault** (DVIG + Vault) avec un second ERP. Il couvre l’installation Docker, l’exposition via la gateway (Caddy), et le **branchement futur** au Vault (token DVIG, format des événements).

**Public** : équipe technique (déploiement, intégration).  
**Prérequis** : Docker, Docker Compose, accès au dépôt et à la gateway (Caddy).

---

## 1. Objectif et périmètre

- **Objectif** : avoir une instance ERPNext (lab ou stinger) dans la plateforme pour tester le scellement de factures via Dorevia-Vault, comme avec Odoo.
- **Périmètre** :
  - Installation de la stack ERPNext (Frappe + MariaDB + Redis) dans `units/erpnext` et/ou dans un tenant dédié.
  - Exposition de l’instance via la gateway (Caddy) avec un hostname du type `erpnext.<env>.<tenant>.doreviateam.com`.
  - Configuration du **token DVIG** et de la **source** pour permettre à un futur connecteur ERPNext d’envoyer des événements `invoice.posted` à DVIG.
- **Hors périmètre** (pour ce guide) : développement du connecteur Frappe/ERPNext → DVIG (app ou hooks) ; il s’agit d’une phase ultérieure, dont les prérequis (API DVIG, format payload) sont décrits ici.

---

## 2. Prérequis

- **Docker** et **Docker Compose v2** installés sur la machine de déploiement.
- **Réseau Docker** : le réseau **`dorevia-network`** doit exister (créé par la plateforme pour Odoo, Sylius, Caddy, etc.). Vérification :
  ```bash
  docker network ls | grep dorevia-network
  ```
  Si absent : `docker network create dorevia-network`.
- **Gateway** : Caddy doit être démarré et le fichier `units/gateway/Caddyfile` doit pouvoir être modifié puis rechargé (agrégation + `caddy reload`).
- **DVIG et Vault** : une instance DVIG et Vault opérationnelles (ex. `dvig.core-stinger.doreviateam.com`, `vault.core-stinger.doreviateam.com`) pour créer un token et tester l’ingest.

---

## 3. Approche recommandée : installation « manuelle » (comme Sylius)

Comme pour Sylius, on **ne modifie pas** pour l’instant le moteur de rendu (manifest, `render_app_compose.sh`, `render_caddyfile.sh`, `dorevia.sh`). On :

1. Crée une **unité** `units/erpnext` avec un `docker-compose.yml` dédié (basé sur [frappe_docker](https://github.com/frappe/frappe_docker)).
2. Crée un **répertoire tenant** (ou réutilise un tenant existant) pour héberger le compose et les volumes ERPNext (ex. `tenants/erpnext-lab/apps/erpnext/lab/` ou `tenants/core/apps/erpnext/lab/`).
3. Ajoute **manuellement** une entrée dans le Caddyfile global pour exposer ERPNext (puis agrégation + rechargement Caddy).

Cela permet de tester rapidement sans toucher au schéma de manifest ni aux scripts de rendu. Une **intégration complète** (ERPNext comme univers dans le manifest, rendu automatique du compose et du Caddyfile) pourra être faite ensuite (voir section 9).

---

## 4. Structure des répertoires

Proposition de structure (à adapter selon votre choix de tenant) :

```
dorevia-plateform/
├── units/
│   ├── odoo/           # existant
│   ├── sylius/         # existant
│   └── erpnext/       # nouveau
│       ├── docker-compose.yml   # template ou compose de référence
│       ├── .env.example
│       └── README.md
├── tenants/
│   └── erpnext-lab/   # tenant dédié « test ERPNext » (ou utiliser core, etc.)
│       ├── state/
│       │   └── manifest.json    # optionnel si pas d’intégration render
│       └── apps/
│           └── erpnext/
│               └── lab/
│                   ├── docker-compose.yml   # compose réel (copie adaptée de units/erpnext)
│                   ├── .env
│                   └── volumes/             # optionnel, si on veut persister sites/logs
└── units/gateway/
    └── Caddyfile      # on y ajoute une entrée pour erpnext.lab.erpnext-lab.doreviateam.com
```

Convention de nommage des conteneurs (pour Caddy et lisibilité) :

- **ERPNext frontend** : `erpnext_lab_erpnext-lab` (ou `erpnext_<env>_<tenant_id>`).
- **MariaDB** : `erpnext_db_lab_erpnext-lab`.
- **Redis** : `erpnext_redis_cache_lab_erpnext-lab`, `erpnext_redis_queue_lab_erpnext-lab`.

---

## 5. Installation pas à pas

### 5.1 Créer l’unité ERPNext et le tenant

```bash
cd /opt/dorevia-plateform

# Unité ERPNext
mkdir -p units/erpnext

# Tenant dédié (ex. erpnext-lab)
mkdir -p tenants/erpnext-lab/apps/erpnext/lab
mkdir -p tenants/erpnext-lab/state
```

### 5.2 Fichier docker-compose ERPNext (tenant lab)

Le stack Frappe/ERPNext officiel utilise [frappe_docker](https://github.com/frappe/frappe_docker). On s’inspire de `pwd.yml` en adaptant :

- **Réseau** : `dorevia-network` au lieu de `frappe_network`.
- **Noms de conteneurs** : préfixe `erpnext_lab_erpnext-lab` (ou votre `<env>_<tenant_id>`).
- **Ports** : ne pas exposer `8080` sur l’hôte si l’accès se fait uniquement via Caddy (reverse proxy vers le conteneur frontend sur 8080).

Créer le fichier **`tenants/erpnext-lab/apps/erpnext/lab/docker-compose.yml`** avec le contenu ci-dessous (version simplifiée pour un test ; vous pouvez partir du `pwd.yml` complet et adapter les noms/réseau).

**Exemple de compose minimal** (à ajuster selon la version Frappe/ERPNext souhaitée) :

```yaml
# Docker Compose - ERPNext lab erpnext-lab
# Réseau: dorevia-network (gateway Caddy)
# Hostname attendu: erpnext.lab.erpnext-lab.doreviateam.com

services:
  db:
    image: mariadb:10.6
    container_name: erpnext_db_lab_erpnext-lab
    restart: unless-stopped
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    environment:
      MYSQL_ROOT_PASSWORD: admin
      MARIADB_ROOT_PASSWORD: admin
    volumes:
      - erpnext_lab_erpnext-lab_db:/var/lib/mysql
    networks:
      - dorevia-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-padmin"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis-cache:
    image: redis:6.2-alpine
    container_name: erpnext_redis_cache_lab_erpnext-lab
    restart: unless-stopped
    networks:
      - dorevia-network

  redis-queue:
    image: redis:6.2-alpine
    container_name: erpnext_redis_queue_lab_erpnext-lab
    restart: unless-stopped
    networks:
      - dorevia-network

  configurator:
    image: frappe/erpnext:v15.95.2
    container_name: erpnext_configurator_lab_erpnext-lab
    restart: on-failure
    entrypoint: ["bash", "-c"]
    command:
      - |
        ls -1 apps > sites/apps.txt
        bench set-config -g db_host db
        bench set-config -gp db_port 3306
        bench set-config -g redis_cache "redis://redis-cache:6379"
        bench set-config -g redis_queue "redis://redis-queue:6379"
        bench set-config -g redis_socketio "redis://redis-queue:6379"
        bench set-config -gp socketio_port 9000
    environment:
      DB_HOST: db
      DB_PORT: "3306"
      REDIS_CACHE: redis-cache:6379
      REDIS_QUEUE: redis-queue:6379
      SOCKETIO_PORT: "9000"
    volumes:
      - erpnext_lab_erpnext-lab_sites:/home/frappe/frappe-bench/sites
      - erpnext_lab_erpnext-lab_logs:/home/frappe/frappe-bench/logs
    networks:
      - dorevia-network
    depends_on:
      db: { condition: service_healthy }
      redis-cache: { condition: service_started }
      redis-queue: { condition: service_started }

  create-site:
    image: frappe/erpnext:v15.95.2
    container_name: erpnext_create_site_lab_erpnext-lab
    restart: "no"
    entrypoint: ["bash", "-c"]
    command:
      - |
        wait-for-it -t 120 db:3306
        wait-for-it -t 120 redis-cache:6379
        wait-for-it -t 120 redis-queue:6379
        until grep -qs "db_host" sites/common_site_config.json 2>/dev/null; do echo "Waiting for configurator..."; sleep 5; done
        bench new-site --mariadb-user-host-login-scope='%' --admin-password=admin --db-root-username=root --db-root-password=admin --install-app erpnext --set-default frontend
    volumes:
      - erpnext_lab_erpnext-lab_sites:/home/frappe/frappe-bench/sites
      - erpnext_lab_erpnext-lab_logs:/home/frappe/frappe-bench/logs
    networks:
      - dorevia-network
    depends_on:
      configurator: { condition: service_completed_successfully }
      db: { condition: service_healthy }

  backend:
    image: frappe/erpnext:v15.95.2
    container_name: erpnext_backend_lab_erpnext-lab
    restart: unless-stopped
    volumes:
      - erpnext_lab_erpnext-lab_sites:/home/frappe/frappe-bench/sites
      - erpnext_lab_erpnext-lab_logs:/home/frappe/frappe-bench/logs
    networks:
      - dorevia-network
    depends_on:
      configurator: { condition: service_completed_successfully }
      db: { condition: service_healthy }
      redis-cache: { condition: service_started }
      redis-queue: { condition: service_started }

  websocket:
    image: frappe/erpnext:v15.95.2
    container_name: erpnext_websocket_lab_erpnext-lab
    restart: unless-stopped
    command: ["node", "/home/frappe/frappe-bench/apps/frappe/socketio.js"]
    environment:
      FRAPPE_REDIS_CACHE: redis://redis-cache:6379
      FRAPPE_REDIS_QUEUE: redis://redis-queue:6379
    volumes:
      - erpnext_lab_erpnext-lab_sites:/home/frappe/frappe-bench/sites
      - erpnext_lab_erpnext-lab_logs:/home/frappe/frappe-bench/logs
    networks:
      - dorevia-network
    depends_on:
      configurator: { condition: service_completed_successfully }

  frontend:
    image: frappe/erpnext:v15.95.2
    container_name: erpnext_lab_erpnext-lab
    restart: unless-stopped
    command: nginx-entrypoint.sh
    environment:
      BACKEND: backend:8000
      SOCKETIO: websocket:9000
      FRAPPE_SITE_NAME_HEADER: frontend
      UPSTREAM_REAL_IP_ADDRESS: 127.0.0.1
      UPSTREAM_REAL_IP_HEADER: X-Forwarded-For
      PROXY_READ_TIMEOUT: 120
      CLIENT_MAX_BODY_SIZE: 50m
    volumes:
      - erpnext_lab_erpnext-lab_sites:/home/frappe/frappe-bench/sites
      - erpnext_lab_erpnext-lab_logs:/home/frappe/frappe-bench/logs
    networks:
      - dorevia-network
    depends_on:
      backend: { condition: service_started }
      websocket: { condition: service_started }
    # Pas de ports: exposé uniquement via Caddy (reverse_proxy vers ce conteneur:8080)

  queue-short:
    image: frappe/erpnext:v15.95.2
    container_name: erpnext_queue_short_lab_erpnext-lab
    restart: unless-stopped
    command: ["bench", "worker", "--queue", "short,default"]
    environment:
      FRAPPE_REDIS_CACHE: redis://redis-cache:6379
      FRAPPE_REDIS_QUEUE: redis://redis-queue:6379
    volumes:
      - erpnext_lab_erpnext-lab_sites:/home/frappe/frappe-bench/sites
      - erpnext_lab_erpnext-lab_logs:/home/frappe/frappe-bench/logs
    networks:
      - dorevia-network
    depends_on:
      configurator: { condition: service_completed_successfully }

  queue-long:
    image: frappe/erpnext:v15.95.2
    container_name: erpnext_queue_long_lab_erpnext-lab
    restart: unless-stopped
    command: ["bench", "worker", "--queue", "long,default,short"]
    environment:
      FRAPPE_REDIS_CACHE: redis://redis-cache:6379
      FRAPPE_REDIS_QUEUE: redis://redis-queue:6379
    volumes:
      - erpnext_lab_erpnext-lab_sites:/home/frappe/frappe-bench/sites
      - erpnext_lab_erpnext-lab_logs:/home/frappe/frappe-bench/logs
    networks:
      - dorevia-network
    depends_on:
      configurator: { condition: service_completed_successfully }

  scheduler:
    image: frappe/erpnext:v15.95.2
    container_name: erpnext_scheduler_lab_erpnext-lab
    restart: unless-stopped
    command: ["bench", "schedule"]
    volumes:
      - erpnext_lab_erpnext-lab_sites:/home/frappe/frappe-bench/sites
      - erpnext_lab_erpnext-lab_logs:/home/frappe/frappe-bench/logs
    networks:
      - dorevia-network
    depends_on:
      configurator: { condition: service_completed_successfully }

volumes:
  erpnext_lab_erpnext-lab_db:
  erpnext_lab_erpnext-lab_sites:
  erpnext_lab_erpnext-lab_logs:

networks:
  dorevia-network:
    external: true
```

**Note** : le nom du site créé par `create-site` est `frontend`. Si vous voulez un autre nom (ex. `erpnext.doreviateam.com`), adaptez `--set-default` et la variable `FRAPPE_SITE_NAME_HEADER` du frontend (ex. `erpnext.lab.erpnext-lab.doreviateam.com` pour que Frappe route par hostname).

### 5.3 Ordre de démarrage

1. **Premier démarrage** (création du site Frappe une seule fois) :
   ```bash
   cd /opt/dorevia-plateform/tenants/erpnext-lab/apps/erpnext/lab
   docker compose up -d db redis-cache redis-queue
   docker compose up -d configurator
   # Attendre que le configurator ait écrit sites/common_site_config.json (quelques secondes)
   sleep 15
   docker compose run --rm create-site
   docker compose up -d backend websocket frontend queue-short queue-long scheduler
   ```
   **Important** : `create-site` est un one-shot (il crée le site et quitte). Ne pas lancer `docker compose up -d` seul la première fois sans avoir exécuté `docker compose run --rm create-site`, sinon le site ne sera pas créé.

2. **Démarrages suivants** (site déjà créé) :
   ```bash
   docker compose up -d
   ```
   Le service `create-site` peut rester en état « exited » ; c’est normal.

2. **Vérifier** que le conteneur frontend écoute sur le port 8080 :
   ```bash
   docker exec erpnext_lab_erpnext-lab curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
   ```

### 5.4 Exposition via Caddy

1. **Éditer le Caddyfile global** (ou le fichier rendu du tenant si vous l’utilisez puis agrégation) :
   ```bash
   nano /opt/dorevia-plateform/units/gateway/Caddyfile
   ```
   Ajouter un bloc (en remplaçant le hostname si vous utilisez un autre tenant/env) :
   ```caddy
   # Tenant: erpnext-lab - Environment: lab
   # ERPNext (test Dorevia-Vault)
   erpnext.lab.erpnext-lab.doreviateam.com {
     reverse_proxy erpnext_lab_erpnext-lab:8080
     encode gzip zstd
   }
   ```

2. **Recharger Caddy** :
   ```bash
   docker exec gateway-caddy caddy reload --config /etc/caddy/Caddyfile
   ```
   Si vous utilisez `bin/dorevia.sh gateway aggregate` pour reconstruire le Caddyfile global, ajoutez d’abord l’entrée ERPNext dans le bon fichier source (ex. tenant rendered) puis relancez l’agrégation et le reload.

3. **DNS** : s’assurer que `erpnext.lab.erpnext-lab.doreviateam.com` pointe vers l’hôte où tourne Caddy (ou tester en local via `/etc/hosts`).

4. **Accès** : ouvrir `https://erpnext.lab.erpnext-lab.doreviateam.com`. Connexion par défaut (après `create-site` avec les paramètres ci-dessus) : utilisateur **Administrator**, mot de passe **admin** (à changer en production).

---

## 6. Branchement Dorevia-Vault (DVIG + token)

Pour que ERPNext puisse un jour envoyer des événements de facture à DVIG (puis au Vault), il faut :

1. **Créer un token DVIG** pour la source **erpnext** et le tenant (ex. `erpnext-lab`).
2. **Documenter** le format d’événement attendu par DVIG pour qu’un futur connecteur Frappe l’implémente.

### 6.1 Créer le token DVIG (côté serveur DVIG)

Sur le serveur où tourne DVIG (ex. core-stinger) :

```bash
cd /opt/dorevia-plateform/sources/dvig
python -m dvig.cli.token_gen --tenant erpnext-lab --univers erpnext --output token
```

Noter la valeur **TOKEN=...**. Puis ajouter l’entrée dans le fichier de tokens DVIG (ex. `conf/tokens.yml` ou `/etc/dvig/tokens.yml`) :

```bash
python -m dvig.cli.token_gen --tenant erpnext-lab --univers erpnext --output yaml
```

Copier le bloc YAML dans la section `tokens:` du fichier, puis redémarrer ou recharger DVIG.

### 6.2 Source à utiliser côté ERPNext (futur connecteur)

La **source** envoyée dans chaque requête vers DVIG doit être au format **`univers.env.tenant_id`** :

- **univers** : `erpnext`
- **env** : `lab` ou `stinger` ou `prod`
- **tenant_id** : identifiant du tenant (ex. `erpnext-lab`)

Exemple : **`erpnext.lab.erpnext-lab`**.

Le token créé ci-dessus doit correspondre à ce tenant (ex. `erpnext-lab`) et à l’univers `erpnext` pour que DVIG accepte les requêtes.

### 6.3 Format de l’API DVIG (ingest)

Le futur connecteur ERPNext (app Frappe ou script) devra envoyer des **POST** vers :

- **URL** : `https://dvig.core-stinger.doreviateam.com/api/v1/ingest` (ou l’URL de votre instance DVIG).
- **En-têtes** : `Authorization: Bearer <TOKEN>` (le token généré en 6.1), `Content-Type: application/json`.
- **Corps** (exemple pour une facture postée) :
  ```json
  {
    "event_type": "invoice.posted",
    "source": "erpnext.lab.erpnext-lab",
    "timestamp": "2026-01-29T20:00:00Z",
    "data": {
      "invoice_id": "SINV-2026-00001",
      "invoice_name": "SINV-2026-00001",
      "posting_date": "2026-01-29",
      "grand_total": 1200.00,
      "currency": "EUR",
      "customer": "Client X",
      "customer_tax_id": "FR123456789"
    },
    "idempotency_key": "<sha256_unique_par_facture>"
  }
  ```

L’**idempotency_key** doit être une clé stable (ex. SHA256 du couple site + type + id facture) pour éviter les doublons. DVIG renverra **201** si l’événement est accepté ; le Vault créera ensuite la preuve (JWS, ledger) selon le flux existant (DVIG → Vault).

La **SPEC Canonical Payload CFO** (`ZeDocs/web11/SPEC_Canonical_Payload_CFO_Invoice_Posted_v1.0.md`) décrit le payload canonique côté attestation ; le connecteur ERPNext devra fournir dans `data` les champs nécessaires pour que le Vault (ou un service en aval) puisse produire ce payload.

---

## 7. Récapitulatif des commandes (copier-coller)

```bash
# 1. Réseau
docker network ls | grep dorevia-network || docker network create dorevia-network

# 2. Répertoires
cd /opt/dorevia-plateform
mkdir -p units/erpnext
mkdir -p tenants/erpnext-lab/apps/erpnext/lab

# 3. Créer le docker-compose.yml dans tenants/erpnext-lab/apps/erpnext/lab/
# (voir section 5.2)

# 4. Démarrer la stack
cd tenants/erpnext-lab/apps/erpnext/lab
docker compose up -d
# Attendre create-site (logs: docker compose logs -f create-site)
# Puis si besoin: docker compose up -d backend websocket frontend queue-short queue-long scheduler

# 5. Caddy : ajouter le bloc erpnext.lab.erpnext-lab.doreviateam.com dans units/gateway/Caddyfile
# 6. Recharger Caddy
docker exec gateway-caddy caddy reload --config /etc/caddy/Caddyfile

# 7. Token DVIG (sur le serveur DVIG)
cd /opt/dorevia-plateform/sources/dvig
python -m dvig.cli.token_gen --tenant erpnext-lab --univers erpnext --output yaml
# Ajouter le bloc dans tokens.yml, recharger DVIG
```

---

## 8. Dépannage

- **create-site échoue** : vérifier que `configurator` a bien écrit `sites/common_site_config.json` (logs du configurator). Augmenter les délais `wait-for-it` si la machine est lente.
- **502 Bad Gateway** : le frontend doit écouter sur 8080 ; vérifier `docker exec erpnext_lab_erpnext-lab curl -s http://localhost:8080`. Vérifier aussi que Caddy pointe vers le bon nom de conteneur (`erpnext_lab_erpnext-lab`) et le bon port (8080).
- **Site non trouvé (Frappe)** : le nom de site par défaut est `frontend`. Si vous accédez par hostname `erpnext.lab.erpnext-lab.doreviateam.com`, il faut soit créer un site avec ce nom, soit configurer `FRAPPE_SITE_NAME_HEADER` pour que Frappe utilise l’en-tête Host pour router (déjà mis à `frontend` dans l’exemple ; pour multi-site, voir la doc Frappe).
- **Token DVIG 403** : vérifier que la **source** dans le body (ex. `erpnext.lab.erpnext-lab`) correspond au tenant et à l’univers du token dans `tokens.yml`.

---

## 9. Évolution : intégrer ERPNext comme univers dans la plateforme

Pour aligner ERPNext sur le modèle Odoo (manifest → render → dorevia.sh) :

1. **Schéma manifest** : ajouter `erpnext` dans `universes` (enum) et définir `units.erpnext` (ex. `["erpnext", "mariadb", "redis-cache", "redis-queue"]` ou un seul service « erpnext » si on garde un compose monolithique).
2. **render_app_compose.sh** : pour l’univers `erpnext`, générer un bloc de services (db MariaDB, redis, configurator, create-site, backend, websocket, frontend, workers, scheduler) avec les noms de conteneurs `erpnext_<env>_<tenant_id>`, etc., et le réseau `dorevia-network`.
3. **render_caddyfile.sh** : pour l’univers `erpnext`, générer une entrée `erpnext.<env>.<tenant_id>.<domain>` avec `reverse_proxy` vers `erpnext_<env>_<tenant_id>:8080`.
4. **dorevia.sh** : dans `validate_univers`, accepter `erpnext` ; adapter les noms de conteneurs / projets compose si nécessaire.

Cela permettra de créer un tenant avec `"universes": ["odoo", "erpnext"]` et d’avoir le compose et le Caddyfile générés automatiquement. Ce travail peut être décrit dans un second document (spec d’intégration ERPNext).

---

## 10. Références

- **Frappe Docker** : https://github.com/frappe/frappe_docker (compose, images, docs).
- **Procédure Odoo ↔ Dorevia-Vault** : `ZeDocs/web11/PROCEDURE_BRANCHEMENT_ODOO_DOREVIA_VAULT.md`.
- **SPEC Canonical Payload CFO** : `ZeDocs/web11/SPEC_Canonical_Payload_CFO_Invoice_Posted_v1.0.md`.
- **API DVIG** : `sources/dvig` (endpoint POST `/api/v1/ingest`, auth Bearer, champs `event_type`, `source`, `data`, `idempotency_key`).
