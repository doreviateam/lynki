# Spécification détaillée — Odoo 19 en production pour Doreviateam

**Document** : ZeDocs/web42/odoo-doreviateam.md  
**Objectif** : Installer / migrer l’instance Odoo de production Doreviateam vers Odoo 19.  
**Référence lab** : tenant `o19` (Odoo 19 déjà en place en lab).

**Périmètre phase 1** : Connexion **Vault / DVIG / Linky** (rapprochement bancaire, pilotage) est **hors périmètre** pour cette première mise en production. Elle pourra être ajoutée ultérieurement.

**Configuration DNS validée** :
- **URL de production** : `odoo.doreviateam.com`
- **Enregistrement A** : `odoo.doreviateam.com` → `85.215.206.213`
- **TTL** : 360 s
- **Statut** : ✅ DNS validé (entrée A ajoutée à la zone DNS, étape 2/3 validée)

Le reverse proxy (Caddy) sur l’hôte `85.215.206.213` doit être configuré pour ce hostname.

---

## 1. Contexte et objectifs

### 1.1 Objectif

- Mettre en production **Odoo 19** pour la société **Doreviateam**.
- Remplacer ou faire coexister l’actuelle stack prod (Odoo 18, `units/odoo/docker-compose.prod.yml`) par une stack Odoo 19.
- **Sans** connecter l’instance au Vault ni à DVIG dans un premier temps (intégrations prévues en phase ultérieure).

### 1.2 État actuel

| Environnement | Version Odoo | Emplacement | Remarque |
|---------------|-------------|-------------|----------|
| **Prod (units/odoo)** | 18.0 (odoo:18.0-20250819) | `units/odoo/docker-compose.prod.yml` | Port 38069, PostgreSQL 16, custom-addons + OCA |
| **Lab o19** | 19.0 (odoo:19.0) | `tenants/o19/apps/odoo/lab/` | Référence pour addons O19, DVIG, queue_job, proxy_mode |
| **Lab autres tenants** | 18.0 | `tenants/*/apps/odoo/lab|stinger` | La Platine, sarl-la-platine, conceptsun, lglz, core |

### 1.3 Périmètre de l’opération

- **Cible** : une instance Odoo 19 en production dédiée à Doreviateam (usage interne / démos / premiers clients).
- **Contraintes** : compatibilité addons (addons-o19, custom-addons, OCA), reverse proxy (Caddy), secrets en production.
- **Hors périmètre phase 1** : Vault, DVIG, Linky (pas de variables `ODOO_DVIG_*`, pas de connexion au service Vault).

---

## 2. Prérequis techniques

### 2.1 Images Docker

- **Odoo** : `odoo:19.0` (image officielle Docker Hub).
- **PostgreSQL** : `postgres:16` (aligné lab o19 et prod actuelle).

### 2.2 Répertoires et addons (plateforme)

- `units/odoo/addons-o19` — addons OCA compatibles Odoo 19 (queue_job 19.0, account_reconcile_oca, account_statement_base, account_usability, etc.).
- `units/odoo/custom-addons` — addons métier Dorevia (dorevia_vault_connector, scripts `oca_flatten.sh`, etc.).
- `sources/oca` — dépôts OCA utilisés pour le “flatten” (symlinks vers les modules à charger).
- Pas de `sources/oca` monté en lecture seule en prod si on réutilise le même pattern que le lab (flatten vers un volume nommé `oca_extra_addons` ou équivalent).

### 2.3 Réseau et reverse proxy

- Réseau Docker : `dorevia-network` (existant).
- Accès Odoo : **uniquement via reverse proxy** (Caddy ou équivalent), pas d’exposition directe du port 8069 sur l’hôte en prod si possible.
- `proxy_mode = True` dans la configuration Odoo.

### 2.4 Intégrations

- **Phase 1** : Aucune connexion Vault / DVIG / Linky. Pas de variables `ODOO_DVIG_*` à configurer.
- **queue_job** : actif avec canaux dédiés (ex. `root`, éventuellement `dorevia_vault` pour plus tard) pour les jobs asynchrones.
- **Phase ultérieure** (optionnel) : DVIG (`ODOO_DVIG_URL`, `ODOO_DVIG_SOURCE`, `ODOO_DVIG_TENANT`, `ODOO_DVIG_TOKEN`), Vault, connecteur `dorevia_vault_connector` pour rapprochement bancaire Linky.

---

## 3. Spécification de la stack de production Odoo 19

### 3.1 Option A : Nouveau Compose prod O19 (recommandé)

Créer un fichier dédié (ex. `units/odoo/docker-compose.prod-o19.yml` ou tenant `tenants/doreviateam/apps/odoo/prod/`) avec :

**Services :**

1. **db**  
   - Image : `postgres:16`.  
   - **restart: unless-stopped** — si Postgres crash, il redémarre automatiquement ; sinon Odoo reste bloqué.  
   - Variables : `POSTGRES_DB=doreviateam`, `POSTGRES_USER=dorevia`, `POSTGRES_PASSWORD=<MDP>` (secret en `.env`).  
   - Volume persistant dédié (ex. `odoo_prod_o19_db`).  
   - **Healthcheck** : `pg_isready -U dorevia` (interval 10s, timeout 5s, retries 5) — indispensable pour que Odoo n’attaque pas Postgres avant qu’il soit prêt.  
   - **Optionnel** : `command: ["postgres", "-c", "max_connections=100", "-c", "shared_buffers=256MB"]` pour absorber les nombreuses connexions Odoo et limiter les blocages.  
   - Réseau : `dorevia-network`.

2. **odoo**  
   - Image : `odoo:19.0`.  
   - **depends_on : db avec condition: service_healthy** — Odoo ne démarre qu’une fois Postgres prêt ; sans ça, crash au boot.  
   - **Port** : en prod finale, ne pas exposer de port (accès via Caddy uniquement). **Pour l’installation et le debug**, exposer temporairement `38069:8069` (diagnostic, bypass du proxy) puis retirer après mise en service.  
   - **Healthcheck** (recommandé) : `curl -f http://localhost:8069/web/health` (endpoint santé Odoo 19) — interval 30s, timeout 10s, retries 5 ; permet monitoring Docker et redémarrage automatique si crash.  
   - **stop_grace_period: 60s** : laisse à Odoo le temps de terminer les requêtes en cours et d’éviter la corruption de jobs à l’arrêt.  
   - Volumes :
     - `units/odoo/addons-o19` → `/mnt/addons-o19` (ro).
     - `units/odoo/custom-addons` → `/mnt/custom-addons`.
     - Volume nommé pour OCA flatten (ex. `oca_extra_addons` → `/mnt/extra-addons`) **ou** montage `sources/oca` + script flatten au démarrage.
     - Fichier de config Odoo prod → `/etc/odoo/odoo.conf` (ro).
     - Filestore → volume nommé (ex. `odoo_prod_o19_data` → `/var/lib/odoo`).
   - Commande : `sh -c "/mnt/custom-addons/bin/oca_flatten.sh && odoo -c /etc/odoo/odoo.conf"` (comme en lab o19).  
   - Variables d’environnement : **aucune** `ODOO_DVIG_*` en phase 1 (Vault hors périmètre).  
   - **init: true** — évite les process zombies (Odoo lance des subprocess).  
   - **tty: true** (optionnel) — améliore la lisibilité des logs et rend `docker attach` plus pratique.  
   - Réseau : `dorevia-network`.  
   - Restart : `unless-stopped`.

**Exemple d’extrait compose (db + odoo, depends_on, restart, init, port, healthcheck, arrêt propre) :**

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dorevia"]
      interval: 10s
      timeout: 5s
      retries: 5
    # Optionnel : limiter blocages (Odoo ouvre beaucoup de connexions)
    # command: ["postgres", "-c", "max_connections=100", "-c", "shared_buffers=256MB"]
    # ... volumes, env, networks ...

  odoo:
    image: odoo:19.0
    init: true
    tty: true   # optionnel : logs + docker attach
    depends_on:
      db:
        condition: service_healthy
    # Temporaire pour install/debug ; retirer en prod finale
    ports:
      - "38069:8069"
    stop_grace_period: 60s
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8069/web/health"]
      interval: 30s
      timeout: 10s
      retries: 5
    # ... volumes, command, networks ...
```

### 3.2 Fichier de configuration Odoo (prod O19)

Créer un fichier `odoo.prod-o19.conf` avec la configuration suivante (base **`doreviateam`**, verrouillage mono-tenant) :

```ini
[options]
admin_passwd = <MOT_DE_PASSE_MAITRE_FORT>

db_host = db
db_port = 5432
db_user = dorevia
db_password = <MDP>
db_maxconn = 64

db_name = doreviateam
dbfilter = ^doreviateam$
list_db = False

lang = fr_FR

addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/addons-o19,/mnt/custom-addons,/mnt/extra-addons

data_dir = /var/lib/odoo

proxy_mode = True

workers = 3
max_cron_threads = 1

; Limites anti-boucles / jobs bloquants (recommandé prod)
limit_time_cpu = 60
limit_time_real = 120

server_wide_modules = web,queue_job

[queue_job]
channels = root:3
```

**Secrets à renseigner** (via `.env` ou gestionnaire de secrets, jamais en clair dans le dépôt) : `admin_passwd`, `db_password`.

#### Pourquoi cette config est propre

- **`db_name = doreviateam`** : Odoo démarre directement sur cette base.
- **`dbfilter = ^doreviateam$`** : empêche l’accès à d’autres bases, évite les scans automatiques, recommandé pour une prod mono-tenant.
- **`list_db = False`** : empêche l’écran `/web/database/manager` d’être accessible publiquement.
- **`workers = 3`** : valeur safe par défaut. Règle Odoo : `workers = (CPU × 2) + 1` — 1 vCPU → 3, 2 vCPU → 5, 4 vCPU → 9 (ex. serveur IONOS 2 vCPU : on peut monter à 5).  
- **`db_maxconn = 64`** : évite la saturation Postgres quand Odoo ouvre beaucoup de connexions (utile avec plusieurs workers).  
- **`max_cron_threads = 1`** : évite que plusieurs crons se lancent en parallèle ; particulièrement utile avec queue_job.

#### Vérification après démarrage

Dans les logs Odoo, vérifier la ligne :

```text
database: doreviateam
```

et **pas** `database: False`.

#### URL finale

Une fois tout en place, **https://odoo.doreviateam.com** pointe directement vers la base `doreviateam`, sans écran de sélection de base.

#### Création initiale de la base

Si la base **n’existe pas encore**, mettre temporairement :

```ini
list_db = True
```

le temps de créer la base via l’interface Odoo. Puis **remettre** `list_db = False` et redémarrer.

### 3.3 Variables d’environnement (prod)

**Phase 1** : Aucune variable DVIG/Vault à définir. Secrets limités à la base de données et à `admin_passwd` (voir § 6).

**Phase ultérieure** (quand la connexion Vault sera activée) : `ODOO_DVIG_URL`, `ODOO_DVIG_SOURCE`, `ODOO_DVIG_TENANT`, `ODOO_DVIG_TOKEN`.

### 3.4 Reverse proxy (Caddy)

- **Hostname** : `odoo.doreviateam.com` (DNS A record validé → `85.215.206.213`, TTL 360 s).
- HTTPS obligatoire en prod (certificat Let’s Encrypt ou équivalent).

**Configuration Caddy recommandée (production-grade)** : transmettre les headers pour éviter les bugs OAuth et redirections :

```caddy
odoo.doreviateam.com {

    reverse_proxy odoo_prod_o19:8069 {
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-For {remote_host}
    }

}
```

---

## 4. Addons et dépendances

### 4.1 Chemin des addons (ordre de priorité)

1. Addons core Odoo (`/usr/lib/python3/dist-packages/odoo/addons`).  
2. **addons-o19** : modules OCA pour Odoo 19 (queue_job, account_reconcile_oca, etc.).  
3. **custom-addons** : dorevia_vault_connector (peut rester installé mais non connecté au Vault en phase 1), scripts `oca_flatten.sh`, etc.  
4. **extra-addons** : sortie du script `oca_flatten.sh` (symlinks OCA).

### 4.2 Script oca_flatten.sh

- Présent dans `units/odoo/custom-addons/bin/oca_flatten.sh`.  
- Doit s’exécuter **avant** le démarrage d’Odoo pour peupler `/mnt/extra-addons` (volume nommé ou répertoire monté).  
- **Recommandation production** : faire commencer le script par `rm -rf /mnt/extra-addons/*` pour éviter anciens modules, symlinks obsolètes et conflits silencieux entre deux runs.  
- En prod, s’assurer que les sources OCA montées (ou copiées) correspondent aux versions compatibles Odoo 19.

### 4.3 Vérifications pré-déploiement

- Tous les modules dans `addons_path` sont compatibles Odoo 19.  
- `dorevia_vault_connector` : dépendances Python (PyJWT, requests, etc.) — si l’image officielle `odoo:19.0` ne les inclut pas, prévoir une image dérivée (Dockerfile) comme pour Odoo 18 dans `units/odoo/Dockerfile`, en base `odoo:19.0`.

---

## 5. Base de données

### 5.1 Nouvelle base (greenfield)

- Créer la base PostgreSQL dédiée (nom, user, mot de passe).  
- Au premier lancement, Odoo créera la base si `db_name` est défini (ou via interface de création de DB si `list_db = True` temporairement pour l’init).  
- En prod, garder `list_db = False` après création.

### 5.2 Migration depuis Odoo 18 (optionnel)

- Si la prod actuelle (Odoo 18) doit être migrée vers Odoo 19 :
  - Planifier un arrêt de l’instance 18.
  - Dump PostgreSQL de la base prod.
  - Restaurer sur la nouvelle instance PostgreSQL 16 (service `db` de la stack O19).
  - Lancer Odoo 19 avec la même `db_name` ; exécuter les mises à jour de modules si nécessaire (Odoo peut proposer des upgrades).
  - Tester exhaustivement (compatibilité des modules) avant bascule définitive. Connexion Vault/DVIG à valider en phase ultérieure si besoin.

---

## 6. Sécurité et secrets

- **PostgreSQL** : mot de passe fort, utilisateur dédié, pas de `odoo`/`odoo` en prod.  
- **admin_passwd** : mot de passe maître Odoo fort, stocké de façon sécurisée (.env ou secret manager).  
- **Phase 1** : pas de token DVIG à gérer.  
- **Réseau** : Odoo et DB uniquement sur `dorevia-network` ; pas d’exposition 8069/5432 sur l’hôte en prod finale (port 38069 temporaire pour install/debug uniquement).  
- **Limites Odoo** : `limit_time_cpu` et `limit_time_real` dans `odoo.conf` (voir § 3.2) pour protéger contre scripts bloquants et jobs mal configurés.

---

## 6bis. Sauvegarde (stratégie backup)

Souvent oubliée ; indispensable en production.

### Dump PostgreSQL quotidien

```bash
pg_dump -U dorevia doreviateam > /backups/db_$(date +%F).sql
```

À planifier (cron ou équivalent) et faire tourner vers un stockage dédié (rotation / rétention à définir).

### Backup filestore Odoo

- Répertoire à sauvegarder : **`/var/lib/odoo`** (côté conteneur) ou le volume Docker correspondant (ex. `odoo_prod_o19_data`).  
- Contient : pièces jointes, documents, exports, chatter.  
- À inclure dans la même stratégie de backup (snapshot ou copie régulière).

---

## 7. Étapes d’installation (résumé)

1. **Préparer les fichiers**  
   - Créer `docker-compose.prod-o19.yml` (ou équivalent) et `odoo.prod-o19.conf` avec les bons chemins et noms de services.  
   - Définir les secrets (DB, admin_passwd) dans un fichier `.env` ou équivalent (hors dépôt). Pas de token DVIG en phase 1.

2. **Build / images**  
   - Si image Odoo personnalisée (dépendances Python) : construire à partir de `odoo:19.0` (adapter le Dockerfile actuel en 18 vers 19).  
   - Sinon utiliser `odoo:19.0` tel quel.

3. **Volumes et OCA**  
   - S’assurer que le volume pour `oca_extra_addons` existe (ou que les sources OCA sont montées et que le script flatten cible le bon répertoire).  
   - Tester `oca_flatten.sh` localement si besoin.

4. **Lancement**  
   - `docker compose -f docker-compose.prod-o19.yml up -d`.  
   - Vérifier les logs Odoo (démarrage, chargement des modules, erreurs éventuelles).

5. **Reverse proxy**  
   - Configurer Caddy pour l’URL de prod et rediriger vers le conteneur Odoo 19.  
   - Tester l’accès HTTPS.

6. **Validation**  
   - Connexion à l’interface Odoo.  
   - Vérification des modules installés (queue_job, addons métier).  
   - **Test prod rapide** (à garder sous la main) : `curl -I https://odoo.doreviateam.com/web/login` → attendu **HTTP/2 200**.  
   - Aucun test Vault/DVIG en phase 1.

---

## 8. Rollback

- En cas de problème : arrêter la stack O19, réactiver l’ancienne stack Odoo 18 (docker-compose.prod.yml) si elle est conservée en parallèle.  
- Conserver un dump PostgreSQL de la base O18 avant toute migration de données.

---

## 9. Critères de succès

- Instance Odoo 19 accessible en production via l’URL prévue (HTTPS).  
- Base de données dédiée, persistante, avec identifiants sécurisés.  
- Addons addons-o19, custom-addons et OCA (flatten) chargés sans erreur.  
- queue_job actif avec le canal `root:3`.  
- Aucun secret en clair dans le dépôt.  
- **Phase 1** : pas de critère sur Vault/DVIG (connexion prévue ultérieurement).

---

## 10. Architecture globale

Après ce déploiement :

```text
suite.doreviateam.com     (marketing / landing)
        │
        ▼
odoo.doreviateam.com      (ERP opérationnel — base doreviateam)
        │
        ▼
PostgreSQL (doreviateam)
```

Phase ultérieure (Vault/DVIG/Linky) :

```text
Odoo
   │
   │ DVIG (ingestion)
   ▼
Vault (preuve)
   │
   ▼
Linky (pilotage)
```

Logique Dorevia : **ERP = source opérationnelle** → **DVIG = ingestion** → **Vault = preuve** → **Linky = pilotage**. C’est une vraie architecture fintech.

Quand `docker compose -f docker-compose.prod-o19.yml up -d` est lancé et que **https://odoo.doreviateam.com** répond, c’est officiellement le **premier ERP maître de la plateforme Dorevia** — une vraie étape dans le projet.

---

## 11. Références dans le dépôt

| Élément | Chemin |
|--------|--------|
| Compose prod actuel (O18) | `units/odoo/docker-compose.prod.yml` |
| Compose lab O19 (référence) | `tenants/o19/apps/odoo/lab/docker-compose.yml` |
| Config lab O19 | `tenants/o19/apps/odoo/lab/odoo.conf` |
| Config prod O18 | `units/odoo/conf/odoo.prod.conf` |
| Addons O19 | `units/odoo/addons-o19` |
| Custom addons | `units/odoo/custom-addons` |
| Script flatten OCA | `units/odoo/custom-addons/bin/oca_flatten.sh` |
| Dockerfile Odoo (dépendances Python) | `units/odoo/Dockerfile` (à adapter en 19.0 si besoin) |

---

**Déploiement** : les **6 commandes exactes** à lancer sur le serveur (ordre optimal DevOps) peuvent être documentées à part ou fournies par l’équipe en charge du déploiement.
