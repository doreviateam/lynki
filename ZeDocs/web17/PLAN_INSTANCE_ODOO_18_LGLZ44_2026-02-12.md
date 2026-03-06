# Plan d'implémentation : Instance Odoo 18 pour le tenant lglz44

**Date** : 2026-02-12  
**Tenant** : lglz44  
**URL** : https://odoo.lab.lglz44.doreviateam.com  
**Sans Dorevia Vault**

→ **Checklist préalables et vérifications** : [CHECKLIST_PREALABLES_LGLZ44.md](./CHECKLIST_PREALABLES_LGLZ44.md)

---

## 1. Préalables avant implémentation

Valider les 11 points de la [checklist](./CHECKLIST_PREALABLES_LGLZ44.md) avant de commencer :

- Docker, réseau `dorevia-network`, Gateway Caddy démarrée
- DNS configuré pour `odoo.lab.lglz44.doreviateam.com`
- Sources projet, accès dépôt, image Odoo pullée
- Volume data dédié, ports 8069 libres, mot de passe admin Odoo défini

Commandes de vérification rapide : voir section « Vérifications rapides » de la checklist.

---

## 2. Contexte et structure existante

Le projet suit une architecture multi-tenant où chaque tenant possède :
- Un `manifest.json` qui décrit ses univers (odoo, n8n, etc.), environnements (lab, stinger, prod) et units (services platform comme DVIG/Vault, ou apps)
- Des fichiers rendus automatiquement par `dorevia.sh render`
- Une intégration Caddy pour le routage HTTPS

```
tenants/<tenant_id>/
├── apps/
│   └── odoo/
│       └── lab/
│           ├── docker-compose.yml
│           └── odoo.conf
├── platform/
│   └── docker-compose.yml   (optionnel si units.platform = [])
└── state/
    └── manifest.json
```

Le Caddyfile global (`units/gateway/Caddyfile`) est agrégé à partir des Caddyfile rendus de chaque tenant.

---

## 3. Étapes d'implémentation

### Étape 1 : Créer le manifest du tenant lglz44

**Fichier** : `tenants/lglz44/state/manifest.json`

```json
{
  "version": "1.0",
  "tenant_id": "lglz44",
  "created_at": "2026-02-12T00:00:00Z",
  "universes": ["odoo"],
  "environments": ["lab"],
  "domain_mode": "saas",
  "units": {
    "platform": [],
    "odoo": ["odoo", "postgres"]
  },
  "images": {
    "odoo": "odoo:18.0-20250819",
    "postgres": "postgres:16"
  }
}
```

**Points clés :**
- `units.platform: []` → pas de DVIG ni Vault pour ce tenant
- `universes: ["odoo"]` et `environments: ["lab"]`
- `units.odoo: ["odoo", "postgres"]` → Odoo + PostgreSQL

---

### Étape 2 : Générer les artefacts

```bash
./bin/dorevia.sh render lglz44 --env lab
```

Cela génère :
- `tenants/lglz44/rendered/lab/odoo/docker-compose.yml`
- `tenants/lglz44/rendered/lab/platform/docker-compose.yml` → non généré (units.platform vide)
- `tenants/lglz44/rendered/lab/caddy/Caddyfile` → blocs pour `odoo.lab.lglz44` + dvig/vault

---

### Étape 3 : Créer manuellement la configuration Odoo

Le render ne génère pas `odoo.conf`. Il faut le créer manuellement :

**Fichier** : `tenants/lglz44/apps/odoo/lab/odoo.conf`

Exemple (basé sur lglz) :

```ini
# Configuration Odoo odoo lab lglz44
# Source attendue: odoo.lab.lglz44
# DB name: odoo_lab_lglz44

[options]
# Base de données
db_host = odoo_db_lab_lglz44
db_port = 5432
db_user = odoo
db_password = odoo
dbfilter = ^odoo_lab_lglz44$

# Mot de passe maître pour le gestionnaire de base de données
admin_passwd = doreviateam@2026

# Addons
addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons,/mnt/custom-addons

# Data
data_dir = /var/lib/odoo

# Langue par défaut
lang = fr_FR

# Reverse proxy (Caddy)
proxy_mode = True

# Sans Vault : pas de queue_job obligatoire (optionnel)
# server_wide_modules = web,queue_job
# workers = 2

# Logs (optionnel)
# logfile = /var/log/odoo/odoo.log
# log_level = info
```

**Pour rester sans Vault :**
- Ne pas inclure `queue_job` dans `server_wide_modules` (ou garder si autres usages)
- Ne pas configurer `dorevia.dvig.url`, `dorevia.vault.url`, etc.
- Ne pas installer le module `dorevia_vault_connector` si on veut rester totalement isolé

---

### Étape 4 : Déployer l'application Odoo

**Avant apply** : s'assurer que l'image est pullée (évite délai surprise) :

```bash
docker image inspect odoo:18.0-20250819 >/dev/null 2>&1 || docker pull odoo:18.0-20250819
```

```bash
# Option A : apply global (render + déploiement)
./bin/dorevia.sh apply lglz44 --env lab

# Option B : déploiement manuel
# 1. Copier le docker-compose rendu vers apps
cp tenants/lglz44/rendered/lab/odoo/docker-compose.yml tenants/lglz44/apps/odoo/lab/

# 2. Démarrer Odoo
cd tenants/lglz44/apps/odoo/lab
docker compose up -d
```

---

### Étape 5 : Routage et gateway

```bash
./bin/dorevia.sh gateway aggregate
```

**Important** : Après `gateway aggregate`, penser **toujours** à reload Caddy, sinon l’URL ne répondra pas :

```bash
docker compose -f units/gateway/docker-compose.yml exec caddy caddy reload
```

**Note** : `render_caddyfile.sh` génère actuellement des blocs dvig/vault même si `units.platform` est vide. Les URLs `vault.lglz44.doreviateam.com` et `dvig.lglz44.doreviateam.com` existeraient alors mais renverraient un 502 (services non démarrés). Ce n’est pas bloquant pour Odoo.

---

### Étape 6 : DNS et réseau

S’assurer que le hostname `odoo.lab.lglz44.doreviateam.com` résout vers l’IP du serveur où tourne Caddy (ou du load balancer devant Caddy).

---

### Étape 7 : Vérifications post-déploiement et test HTTPS

Après `docker compose up -d` :

```bash
# Conteneur attaché au réseau dorevia-network
docker inspect odoo_lab_lglz44 | grep dorevia-network
```

Après gateway aggregate + caddy reload + conteneurs up :

```bash
curl -I https://odoo.lab.lglz44.doreviateam.com
```

| Réponse | Signification |
|---------|---------------|
| `HTTP/2 200` ou `HTTP/2 303` | OK |
| `502` | Caddy route OK mais backend (Odoo) KO |
| `NXDOMAIN` | Problème DNS |
| `timeout` | Firewall / réseau |

---

## 4. Résumé des commandes

| Ordre | Action | Commande |
|-------|--------|----------|
| 1 | Créer manifest.json | Création manuelle du fichier |
| 2 | Créer odoo.conf | Création manuelle |
| 3 | Générer artefacts | `./bin/dorevia.sh render lglz44 --env lab` |
| 4 | Déployer | `./bin/dorevia.sh apply lglz44 --env lab` |
| 5 | Mettre à jour gateway | `./bin/dorevia.sh gateway aggregate` + reload Caddy |
| 6 | Vérifier DNS | `odoo.lab.lglz44.doreviateam.com` → IP serveur |
| 7 | Test HTTPS | `curl -I https://odoo.lab.lglz44.doreviateam.com` |

**Rappel** : après `gateway aggregate`, toujours exécuter `docker compose -f units/gateway/docker-compose.yml exec caddy caddy reload`.

---

## 5. Points d'attention

1. **Pas de platform** : `units.platform: []` → pas de DVIG/Vault, donc pas de tokens ni de base Vault à gérer.
2. **Odoo sans Vault** : Ne pas installer `dorevia_vault_connector` ou ne pas configurer `dorevia.dvig.url` / `dorevia.vault.url` pour éviter toute logique vault.
3. **Caddyfile** : Les blocs dvig/vault peuvent rester en place (502 si accédés) ou on adapterait `render_caddyfile.sh` pour ne les générer que si `units.platform` les contient.
4. **Réseau Docker** : Le conteneur Odoo doit être sur le réseau externe `dorevia-network`.

---

## 6. Branchement Dorevia Vault (ultérieur)

L’instance est prévue sans Vault au départ, avec branchement ultérieur. Pour activer Dorevia Vault plus tard :

1. **Mettre à jour le manifest** : passer `units.platform` à `["dvig", "vault"]` dans `tenants/lglz44/state/manifest.json`.

2. **Régénérer et déployer la platform** :
   ```bash
   ./bin/dorevia.sh render lglz44 --env lab
   ./bin/dorevia.sh platform up lglz44
   ```
   (Créer les tokens DVIG et configurer les secrets si nécessaire.)

3. **Configurer Odoo** : installer le module `dorevia_vault_connector` et définir dans les paramètres système :
   - `dorevia.dvig.url` (ex. `https://dvig.lglz44.doreviateam.com`)
   - `dorevia.dvig.token`, `dorevia.dvig.source` (`odoo.lab.lglz44`)
   - `dorevia.vault.url` (ex. `https://vault.lglz44.doreviateam.com`)

4. **Optionnel** : ajouter `queue_job` à `server_wide_modules` et configurer les workers dans `odoo.conf` pour le vaulting en temps réel.

5. **Gateway** : `./bin/dorevia.sh gateway aggregate` + reload Caddy (les blocs dvig/vault sont déjà générés par le render).
