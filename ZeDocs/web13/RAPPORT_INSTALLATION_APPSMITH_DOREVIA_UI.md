# Rapport d’installation — Appsmith CE (Dorevia-UI)

**Référence** : `ZeDocs/web13/unit_appSmith.md`  
**Date** : février 2026  
**Objectif** : unit Appsmith CE pour Dorevia-UI (tableau de bord mobile-first sur événements certifiés).

---

## 1. État de l’installation (déjà fait)

| Élément | Statut | Détail |
|--------|--------|--------|
| **Unit Appsmith** | ✅ | Dossier `units/appsmith/` créé |
| **Docker Compose** | ✅ | `units/appsmith/docker-compose.yml` — image CE, volume persistant, réseau `dorevia-network` |
| **Variables d’environnement** | ✅ | `.env.example` — encryption password/salt, domaine, tenant/env |
| **Documentation unit** | ✅ | `units/appsmith/README.md` — run, upgrade, backup volume |
| **Reverse-proxy Caddy** | ✅ | Blocs `ui.lab.<tenant>.doreviateam.com` dans `units/gateway/Caddyfile` (core + sarl-la-platine) |
| **Volumes nommés** | ✅ | `appsmith_lab_core_stacks`, `appsmith_lab_sarl-la-platine_stacks` |
| **Sécurité (spec)** | ✅ | Pas d’accès DB Vault ; Appsmith consomme uniquement l’API Dorevia-UI read-only (tenant-scoped) |

### URLs par tenant (convention `ui.lab.<tenant>.doreviateam.com`)

| Tenant | URL Dorevia-UI (Appsmith) | Conteneur | Volume |
|--------|---------------------------|-----------|--------|
| **core** | https://ui.lab.core.doreviateam.com | `appsmith_lab_core:80` | `appsmith_lab_core_stacks` |
| **sarl-la-platine** | https://ui.lab.sarl-la-platine.doreviateam.com | `appsmith_lab_sarl-la-platine:80` | `appsmith_lab_sarl-la-platine_stacks` |

**Exemple tenant sarl-la-platine** : Odoo en stinger (`odoo.stinger.sarl-la-platine.doreviateam.com`), UI en lab (`ui.lab.sarl-la-platine.doreviateam.com`).

---

## 2. Ce que vous avez à faire

### Étape 1 — Prérequis

- [ ] **Docker et Docker Compose** installés sur la machine cible.
- [ ] **Réseau Docker** : si besoin, créer le réseau partagé :
  ```bash
  docker network create dorevia-network
  ```
- [ ] **Caddy** (gateway) doit être en cours d’exécution pour que les URLs `ui.lab.<tenant>.doreviateam.com` soient servies (après rechargement de la config).

### Étape 2 — Configurer le fichier `.env`

- [ ] Aller dans l’unité Appsmith :
  ```bash
  cd /opt/dorevia-plateform/units/appsmith
  ```
- [ ] Copier l’exemple et éditer :
  ```bash
  cp .env.example .env
  nano .env   # ou vim, code, etc.
  ```
- [ ] **Modifier obligatoirement** (ne pas laisser les valeurs par défaut) :
  - **`APPSMITH_ENCRYPTION_PASSWORD`** : mot de passe fort, stable, **à conserver** (ex. 32+ caractères).
  - **`APPSMITH_ENCRYPTION_SALT`** : sel fort, stable, **à conserver**.
  - Exemple de génération :
    ```bash
    openssl rand -base64 32   # à utiliser pour PASSWORD
    openssl rand -base64 32   # à utiliser pour SALT
    ```
- [ ] Vérifier le reste (optionnel) :
  - **Pour core** : `DEPLOY_ENV=lab`, `TENANT_ID=core`, `APPSMITH_DOMAIN=ui.lab.core.doreviateam.com`.
  - **Pour sarl-la-platine** : `DEPLOY_ENV=lab`, `TENANT_ID=sarl-la-platine`, `APPSMITH_DOMAIN=ui.lab.sarl-la-platine.doreviateam.com`.
  - `APPSMITH_INSTANCE_NAME=Dorevia-UI` si vous voulez ce nom dans l’UI.

### Étape 3 — Démarrer Appsmith

- [ ] Depuis `units/appsmith/` :
  ```bash
  docker compose up -d
  ```
- [ ] Vérifier que le conteneur tourne :
  ```bash
  docker compose ps
  docker compose logs -f appsmith   # pour voir les logs (Ctrl+C pour quitter)
  ```

### Étape 4 — Recharger Caddy (si nécessaire)

- [ ] Si Caddy tourne déjà : recharger la config pour prendre en compte les blocs `ui.lab.<tenant>.doreviateam.com` (selon votre procédure : `docker compose exec caddy caddy reload`, ou redémarrage du conteneur gateway).
- [ ] Si vous déployez tout depuis zéro : démarrer d’abord Appsmith, puis la gateway (Caddy).

### Étape 5 — Accéder à l’UI et créer la page « Hello Dorevia-UI »

- [ ] Ouvrir dans un navigateur selon le tenant :
  - **core** : **https://ui.lab.core.doreviateam.com**
  - **sarl-la-platine** : **https://ui.lab.sarl-la-platine.doreviateam.com**
- [ ] Première visite : suivre l’assistant Appsmith (création du premier utilisateur admin si demandé).
- [ ] Créer une **application** (ex. « Dorevia-UI »).
- [ ] Dans cette application, créer une **page** et y mettre un texte **« Hello Dorevia-UI »** (widget Text ou Label) — c’est la base de travail demandée dans la Definition of Done.

### Étape 6 — Vérifier la persistance

- [ ] Redémarrer le conteneur concerné :
  ```bash
  cd /opt/dorevia-plateform/units/appsmith
  docker compose restart
  ```
- [ ] Revenir sur l’URL du tenant (ui.lab.core ou ui.lab.sarl-la-platine) : l’application et la page « Hello Dorevia-UI » doivent toujours être là (volume persistant OK).

---

## 3. Definition of Done (rappel)

| Critère | Comment vérifier |
|--------|-------------------|
| **`unit up` démarre Appsmith** | `docker compose up -d` dans `units/appsmith` sans erreur ; `docker compose ps` affiche le conteneur `appsmith_lab_<tenant>` en état « Up ». |
| **UI accessible via le domaine** | https://ui.lab.core.doreviateam.com ou https://ui.lab.sarl-la-platine.doreviateam.com s’ouvre et affiche l’interface Appsmith. |
| **Redémarrage serveur OK (persistance)** | Après `docker compose restart`, les apps et pages créées dans Appsmith sont toujours présentes. |
| **Une page « Hello Dorevia-UI » existe** | Dans Appsmith : une page contenant le texte « Hello Dorevia-UI » (créée manuellement après première connexion). |

---

## 4. En cas de problème

- **Le conteneur ne démarre pas** : vérifier les logs (`docker compose logs appsmith`), et que `APPSMITH_ENCRYPTION_PASSWORD` et `APPSMITH_ENCRYPTION_SALT` sont bien définis dans `.env` (pas vides, pas les valeurs d’exemple).
- **Page blanche ou 502 sur l’URL** : vérifier que Caddy pointe bien vers `appsmith_lab_<tenant>:80` (ex. `appsmith_lab_core` ou `appsmith_lab_sarl-la-platine`), que le conteneur est sur le réseau `dorevia-network`, et que Caddy a bien rechargé sa config.
- **Données perdues après redémarrage** : vérifier que le volume `appsmith_lab_<tenant>_stacks` existe (`docker volume ls`) et est bien monté dans le compose.

---

## 5. Références

- **Spec / demande** : `ZeDocs/web13/unit_appSmith.md`
- **Doc unit** : `units/appsmith/README.md`
- **Compose** : `units/appsmith/docker-compose.yml`
- **Exemple d’env** : `units/appsmith/.env.example`
- **Caddy** : `units/gateway/Caddyfile` (blocs `ui.lab.core.doreviateam.com`, `ui.lab.sarl-la-platine.doreviateam.com`)

---

## 6. Récapitulatif des commandes

**Tenant core :**
```bash
docker network create dorevia-network   # une fois si besoin
cd /opt/dorevia-plateform/units/appsmith
cp .env.example .env
# Éditer .env : DEPLOY_ENV=lab, TENANT_ID=core, APPSMITH_DOMAIN=ui.lab.core.doreviateam.com, APPSMITH_ENCRYPTION_* 
docker compose up -d
# Accès : https://ui.lab.core.doreviateam.com
```

**Tenant sarl-la-platine :**
```bash
cd /opt/dorevia-plateform/units/appsmith
cp .env.example .env
# Éditer .env : DEPLOY_ENV=lab, TENANT_ID=sarl-la-platine, APPSMITH_DOMAIN=ui.lab.sarl-la-platine.doreviateam.com, APPSMITH_ENCRYPTION_*
docker compose up -d
# Accès : https://ui.lab.sarl-la-platine.doreviateam.com
```

*(Une seule instance à la fois par répertoire si vous utilisez le même `.env` ; pour deux instances en parallèle, utiliser deux répertoires ou deux fichiers `.env` avec `docker compose --env-file .env.sarl-la-platine up -d`.)*

**Vérifier :** `docker compose ps` — `docker compose logs -f appsmith`

Après première connexion : créer une app + une page « Hello Dorevia-UI » dans l’interface Appsmith.

### DNS (rappel)

| Tenant | Enregistrement à créer |
|--------|------------------------|
| **core** | `ui.lab.core` → même cible que les autres services lab.core |
| **sarl-la-platine** | `ui.lab.sarl-la-platine` → même cible que `odoo.stinger.sarl-la-platine` (ou autre service du tenant) |
