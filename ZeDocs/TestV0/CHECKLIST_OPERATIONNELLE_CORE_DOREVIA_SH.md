# ✅ Checklist Opérationnelle — Implémentation CORE + `dorevia.sh`

**Périmètre** : Tenant `core`, services partagés DVIG/Vault, Odoo LAB / STINGER / PROD  
**Référence** : SPEC Plateforme v1.0 • Clarification contractuelle v1.0 • SPEC dorevia.sh v1.0  
**Objectif** : Checklist exécutable, imprimable, à cocher

**Date de début** : _______________  
**Date de fin** : _______________  
**Responsable** : _______________

---

## 🟦 Phase 0 — Mise en conformité contractuelle (CRITIQUE)

**Objectif** : Corriger les non-conformités critiques avant toute migration  
**Effort estimé** : 2-3h  
**Prérequis** : Aucun

### 0.1 Clarification & gel sémantique

- [ ] Le tenant DNS cible est **`core`** (confirmé)
- [ ] Les environnements autorisés sont uniquement : `lab`, `stinger`, `prod`
- [ ] Le format de source est figé : `<univers>.<env>.<tenant>`
- [ ] Exemples valides : `odoo.lab.core`, `odoo.stinger.core`, `odoo.prod.core`
- [ ] Exemples invalides : `odoo.core`, `odoo.lab`, `core.odoo.lab`

### 0.2 Tokens DVIG

- [ ] Tous les anciens tokens DVIG sont listés et documentés
- [ ] Les tokens non conformes sont **révoqués** (status=revoked)
- [ ] Nouveaux tokens générés avec `tenant: "core"` :
  - [ ] Token LAB : `odoo.lab.core`
    - [ ] Token ID : `tok_lab_core_001`
    - [ ] Hash généré : `sha256:...`
    - [ ] Token brut sauvegardé (hors repo)
  - [ ] Token STINGER : `odoo.stinger.core`
    - [ ] Token ID : `tok_stinger_core_001`
    - [ ] Hash généré : `sha256:...`
    - [ ] Token brut sauvegardé (hors repo)
  - [ ] Token PROD : `odoo.prod.core`
    - [ ] Token ID : `tok_prod_core_001`
    - [ ] Hash généré : `sha256:...`
    - [ ] Token brut sauvegardé (hors repo)
- [ ] Les tokens sont stockés dans `tenants/core/secrets/dvig.tokens.yml`
- [ ] Fichier `tenants/core/secrets/` ajouté à `.gitignore`
- [ ] Tokens bruts stockés hors repo (gestionnaire de secrets ou fichier local protégé)

### 0.3 Validation DVIG

- [ ] Fichier `sources/dvig/dvig/api_fastapi/auth/validation.py` modifié
- [ ] Validation format strict `univers.env.tenant` implémentée
- [ ] Vérification `tenant` source = `tenant` token ajoutée
- [ ] Vérification `univers` source = `univers` token ajoutée
- [ ] Validation environnements `{lab, stinger, prod}` ajoutée
- [ ] Tests unitaires validation créés/mis à jour :
  - [ ] Test format strict `univers.env.tenant`
  - [ ] Test tenant mismatch
  - [ ] Test univers mismatch
  - [ ] Test environnement invalide
- [ ] Tests d'intégration mis à jour :
  - [ ] Test token LAB accepté sur `source=odoo.lab.core`
  - [ ] Test token LAB refusé sur `source=odoo.prod.core`
  - [ ] Test source mal formé rejeté
- [ ] Tous les tests passent (100%)

### 0.4 Validation Phase 0

- [ ] Tous les tokens ont `tenant: "core"`
- [ ] Validation source accepte uniquement `univers.env.tenant`
- [ ] Validation tenant fonctionne (source tenant = token tenant)
- [ ] Tests passent (100%)
- [ ] Documentation mise à jour

✅ **Sortie Phase 0 validée** : DVIG applique le contrat tenant/univers/env.

**Date de validation** : _______________  
**Validé par** : _______________

---

## 🟦 Phase 1 — Services partagés (Platform)

**Objectif** : Créer l'infrastructure de base (services partagés)  
**Effort estimé** : 3-4h  
**Prérequis** : Phase 0 validée

### 1.1 Pré-requis système

- [ ] Docker installé et fonctionnel (`docker --version`)
- [ ] Docker Compose disponible (`docker compose version` ou `docker-compose --version`)
- [ ] Droits suffisants pour créer volumes/réseaux
- [ ] Espace disque suffisant (vérifier avec `df -h`)
- [ ] Ports 80/443 disponibles (pour Caddy)

### 1.2 Réseau Docker

- [ ] Réseau `dorevia-network` créé : `docker network create dorevia-network`
- [ ] Vérification : `docker network ls | grep dorevia-network`
- [ ] Réseau configuré en `external: true` dans tous les compose

### 1.3 DVIG Partagé

- [ ] Fichier `sources/dvig/docker/docker-compose.yml` créé (services partagés)
- [ ] Image `dorevia/dvig:0.1.2-auth` disponible (pull ou build)
- [ ] Configuration DVIG :
  - [ ] `DVIG_AUTH_ENABLED=1`
  - [ ] `DVIG_TOKENS_FILE=/etc/dvig/tokens.yml`
  - [ ] `DVIG_DOCS_ENABLED=0`
  - [ ] `DVIG_OPENAPI_ENABLED=0`
  - [ ] `DVIG_LOG_FORMAT=json`
- [ ] Tokens copiés vers `/etc/dvig/tokens.yml` (depuis Phase 0)
- [ ] Permissions `/etc/dvig/tokens.yml` : `chmod 0444` et `chown root:root`
- [ ] Volume tokens monté en read-only (`:ro`)
- [ ] Réseau `dorevia-network` configuré
- [ ] Aucun port exposé sur hôte (routage via Caddy uniquement)
- [ ] Container `dvig-core` démarré : `docker compose up -d`
- [ ] Container running : `docker ps | grep dvig-core`
- [ ] Health check OK : `curl http://localhost:8080/health` (si port temporaire)
- [ ] Logs vérifiés : tokens chargés correctement

### 1.4 Vault Partagé

- [ ] Service `vault` ajouté dans `docker-compose.yml` (services partagés)
- [ ] Image Vault disponible (version taggée, pas `latest`)
- [ ] Configuration Vault :
  - [ ] Base de données PostgreSQL configurée
  - [ ] Variables d'environnement définies
  - [ ] Port interne : `8080`
- [ ] Service `vault-db` (PostgreSQL) configuré
- [ ] Volume `vault_db_data` créé
- [ ] Réseau `dorevia-network` configuré
- [ ] Aucun port exposé sur hôte (routage via Caddy uniquement)
- [ ] Container `vault-core` démarré : `docker compose up -d vault`
- [ ] Container running : `docker ps | grep vault-core`
- [ ] Health check OK : `curl http://localhost:8080/health` (si port temporaire)
- [ ] Base de données accessible

### 1.5 Caddy (Reverse Proxy)

- [ ] Fichier `units/gateway/Caddyfile` mis à jour avec :
  - [ ] Routage Odoo LAB : `odoo.lab.core.doreviateam.com` → `odoo_lab:8069`
  - [ ] Routage Odoo STINGER : `odoo.stinger.core.doreviateam.com` → `odoo_stinger:8069`
  - [ ] Routage Odoo PROD : `odoo.prod.core.doreviateam.com` → `odoo_prod:8069`
  - [ ] Routage DVIG : `dvig.core.doreviateam.com` → `dvig-core:8080`
  - [ ] Routage Vault : `vault.core.doreviateam.com` → `vault-core:8080`
- [ ] Fichier `units/gateway/docker-compose.yml` mis à jour :
  - [ ] Réseau `dorevia-network` ajouté
  - [ ] Ports 80/443 exposés
- [ ] Container Caddy redémarré : `docker compose restart caddy`
- [ ] Container running : `docker ps | grep caddy`
- [ ] Caddy sur réseau `dorevia-network` : `docker network inspect dorevia-network | grep caddy`

### 1.6 Vérifications Phase 1

- [ ] `docker network ls | grep dorevia-network` → OK
- [ ] `docker ps | grep dvig-core` → Running
- [ ] `docker ps | grep vault-core` → Running
- [ ] `docker ps | grep caddy` → Running
- [ ] Tous les services sur réseau `dorevia-network`
- [ ] Aucun port applicatif inutile exposé (hors validation temporaire)
- [ ] Logs vérifiés (pas d'erreurs critiques)

### 1.7 Tests d'accès (si DNS configuré)

- [ ] `https://dvig.core.doreviateam.com/health` répond (ou `http://localhost:8080/health`)
- [ ] `https://vault.core.doreviateam.com/health` répond (ou `http://localhost:8080/health`)
- [ ] Certificats SSL générés (Let's Encrypt)

✅ **Sortie Phase 1 validée** : Services partagés opérationnels.

**Date de validation** : _______________  
**Validé par** : _______________

---

## 🟦 Phase 2 — Orchestrateur `dorevia.sh` (socle)

**Objectif** : Créer la structure de base de l'orchestrateur  
**Effort estimé** : 1-2h  
**Prérequis** : Phase 1 validée

### 2.1 Structure de répertoires

- [ ] Arborescence `tenants/core/` créée :
  ```bash
  mkdir -p bin
  mkdir -p tenants/core/{platform,apps/odoo/{lab,stinger,prod},secrets,state}
  ```
- [ ] Dossiers créés :
  - [ ] `bin/`
  - [ ] `tenants/core/platform/`
  - [ ] `tenants/core/apps/odoo/lab/`
  - [ ] `tenants/core/apps/odoo/stinger/`
  - [ ] `tenants/core/apps/odoo/prod/`
  - [ ] `tenants/core/secrets/`
  - [ ] `tenants/core/state/`

### 2.2 Script `dorevia.sh`

- [ ] Fichier `bin/dorevia.sh` créé
- [ ] Script rendu exécutable : `chmod +x bin/dorevia.sh`
- [ ] Shebang `#!/bin/bash` présent
- [ ] Configuration de base (SCRIPT_DIR, ROOT_DIR, TENANTS_DIR)
- [ ] Codes d'erreur définis (E01-E06)
- [ ] Fonctions utilitaires :
  - [ ] `error()` : affichage erreur et exit
  - [ ] `validate_tenant()` : validation slug DNS
  - [ ] `validate_env()` : validation `{lab, stinger, prod}`
  - [ ] `validate_univers()` : validation `{odoo}` (v1.0)
- [ ] Commandes de base :
  - [ ] `help` : affiche aide complète
  - [ ] `version` : affiche version
  - [ ] `doctor` : vérifie prérequis
- [ ] Stubs pour commandes futures :
  - [ ] `platform` (stub)
  - [ ] `app` (stub)
  - [ ] `token` (stub)

### 2.3 Tests Script de base

- [ ] `./bin/dorevia.sh help` → Affiche aide
- [ ] `./bin/dorevia.sh version` → Affiche version
- [ ] `./bin/dorevia.sh doctor` → Vérifie prérequis :
  - [ ] Docker installé
  - [ ] Docker Compose installé
  - [ ] Réseau `dorevia-network` existe (ou warning)

### 2.4 Déplacement Tokens

- [ ] Tokens copiés vers `tenants/core/secrets/dvig.tokens.yml` (depuis Phase 0)
- [ ] Fichier `.gitignore` mis à jour : `tenants/*/secrets/` ajouté
- [ ] Vérification : `git status` (secrets ignorés)

### 2.5 Templates Configuration

- [ ] Template `tenants/core/platform/docker-compose.yml.template` créé
- [ ] Template `tenants/core/apps/odoo/lab/docker-compose.yml.template` créé
- [ ] Template `tenants/core/apps/odoo/lab/odoo.conf.template` créé
- [ ] Variables de template documentées

### 2.6 Invariants CLI (Tests)

- [ ] Test : `dorevia.sh app up odoo prd core` → Rejeté (E01 : env invalide)
- [ ] Test : `dorevia.sh app up odoo lab rehtse` → Rejeté (E01 : tenant invalide)
- [ ] Test : `dorevia.sh app up sylius lab core` → Rejeté (E01 : univers invalide v1.0)
- [ ] Test : `dorevia.sh app up odoo lab core` → Rejeté (E04 : platform down) - si platform non démarrée

✅ **Sortie Phase 2 validée** : Structure orchestrateur prête.

**Date de validation** : _______________  
**Validé par** : _______________

---

## 🟦 Phase 3 — Commandes `platform` (dorevia.sh)

**Objectif** : Implémenter les commandes `platform` de `dorevia.sh`  
**Effort estimé** : 3-4h  
**Prérequis** : Phase 2 validée

### 3.1 `platform up <tenant>`

- [ ] Fonction `cmd_platform_up()` implémentée
- [ ] Validation tenant (slug DNS)
- [ ] Génération `docker-compose.yml` depuis template (si absent)
- [ ] Fonction `generate_platform_compose()` implémentée
- [ ] Démarrage services : `docker compose up -d`
- [ ] Vérification dépendances (docker, compose, réseau)
- [ ] Affichage status + URLs recommandées
- [ ] Test : `dorevia.sh platform up core` → OK

### 3.2 `platform status <tenant>`

- [ ] Fonction `cmd_platform_status()` implémentée
- [ ] Validation tenant
- [ ] Parsing `docker compose ps`
- [ ] Extraction tags d'images
- [ ] Vérification health checks
- [ ] Affichage tableau formaté :
  - [ ] Containers up/down
  - [ ] Health checks
  - [ ] Versions (tags) images
  - [ ] Chemins volumes (optionnel)
- [ ] Test : `dorevia.sh platform status core` → Affiche statut

### 3.3 `platform down <tenant>`

- [ ] Fonction `cmd_platform_down()` implémentée
- [ ] Validation tenant
- [ ] Stop services : `docker compose down`
- [ ] Pas de destruction données (par défaut)
- [ ] Test : `dorevia.sh platform down core` → Services stoppés

### 3.4 `platform destroy <tenant>`

- [ ] Fonction `cmd_platform_destroy()` implémentée
- [ ] Validation tenant
- [ ] Parsing flags `--purge` et `--purge-secrets`
- [ ] Validation flag `--purge` requis (E06 si absent pour volumes)
- [ ] Suppression containers/networks
- [ ] Suppression volumes (si `--purge`)
- [ ] Suppression secrets (si `--purge-secrets`)
- [ ] Test : `dorevia.sh platform destroy core --purge` → Destruction complète

### 3.5 Validation Phase 3

- [ ] `platform up core` démarre Caddy + DVIG + Vault
- [ ] `platform status core` affiche statut correct
- [ ] `platform down core` stoppe services
- [ ] `platform destroy core --purge` supprime volumes (avec flag)
- [ ] Tous les tests passent

✅ **Sortie Phase 3 validée** : Commandes `platform` opérationnelles.

**Date de validation** : _______________  
**Validé par** : _______________

---

## 🟦 Phase 4 — Commandes `app` (dorevia.sh)

**Objectif** : Implémenter les commandes `app` pour gérer Odoo LAB/STINGER/PROD  
**Effort estimé** : 4-5h  
**Prérequis** : Phase 3 validée

### 4.1 `app up <univers> <env> <tenant>`

- [ ] Fonction `cmd_app_up()` implémentée
- [ ] Validation env/univers/tenant (E01 si invalide)
- [ ] Vérification platform up (E04 si down)
- [ ] Génération `source` = `<univers>.<env>.<tenant>`
- [ ] Génération identifiants déterministes :
  - [ ] DB name : `odoo_<env>_<tenant>`
  - [ ] Volumes : `odoo_<env>_<tenant>_data`, `odoo_<env>_<tenant>_db`
  - [ ] Compose project : `dorevia_<univers>_<env>_<tenant>`
- [ ] Fonctions génération :
  - [ ] `generate_app_compose()` : docker-compose.yml
  - [ ] `generate_app_env()` : .env
  - [ ] `generate_app_odoo_conf()` : odoo.conf
- [ ] Validation version image (E02 si `latest` en STINGER/PROD)
- [ ] Démarrage services : `docker compose up -d`
- [ ] Test : `dorevia.sh app up odoo lab core` → OK

### 4.2 `app status <univers> <env> <tenant>`

- [ ] Fonction `cmd_app_status()` implémentée
- [ ] Validation env/univers/tenant
- [ ] Parsing `docker compose ps`
- [ ] Extraction DB name depuis config
- [ ] Génération URL attendue : `https://<univers>.<env>.<tenant>.doreviateam.com`
- [ ] Affichage tableau formaté :
  - [ ] Containers + ports internes
  - [ ] DB name / volumes
  - [ ] Source attendue
  - [ ] URL attendue
- [ ] Test : `dorevia.sh app status odoo lab core` → Affiche statut

### 4.3 `app down <univers> <env> <tenant>`

- [ ] Fonction `cmd_app_down()` implémentée
- [ ] Validation env/univers/tenant
- [ ] Stop app : `docker compose down`
- [ ] Pas de purge données (par défaut)
- [ ] Test : `dorevia.sh app down odoo lab core` → App stoppée

### 4.4 `app reset <univers> <env> <tenant>`

- [ ] Fonction `cmd_app_reset()` implémentée
- [ ] Validation env/univers/tenant
- [ ] Parsing flag `--purge` (E06 si absent)
- [ ] Parsing flag `--demo <profile>` (optionnel)
- [ ] Stop app
- [ ] Drop DB PostgreSQL
- [ ] Suppression filestore
- [ ] Import dataset démo (si `--demo`)
- [ ] Test : `dorevia.sh app reset odoo stinger core --purge` → Reset complet

### 4.5 `app destroy <univers> <env> <tenant>`

- [ ] Fonction `cmd_app_destroy()` implémentée
- [ ] Validation env/univers/tenant
- [ ] Parsing flag `--purge` (E06 si absent)
- [ ] Suppression containers/networks
- [ ] Suppression volumes (si `--purge`)
- [ ] Test : `dorevia.sh app destroy odoo lab core --purge` → Destruction complète

### 4.6 Validation Phase 4

- [ ] `app up odoo lab core` démarre Odoo LAB avec DB+filestore dédiés
- [ ] `app up odoo stinger core` démarre Odoo STINGER avec DB+filestore dédiés
- [ ] `app up odoo prod core` démarre Odoo PROD avec DB+filestore dédiés
- [ ] Rejet env invalide (E01) : `app up odoo prd core` → Rejeté
- [ ] Rejet `latest` en STINGER/PROD (E02) : `app up odoo stinger core --image odoo:latest` → Rejeté
- [ ] Rejet app up si platform down (E04) : `platform down core` puis `app up odoo lab core` → Rejeté
- [ ] Tous les tests passent

✅ **Sortie Phase 4 validée** : Commandes `app` opérationnelles.

**Date de validation** : _______________  
**Validé par** : _______________

---

## 🟦 Phase 5 — Commandes `token` (dorevia.sh)

**Objectif** : Implémenter les commandes `token` pour gérer les tokens DVIG  
**Effort estimé** : 2-3h  
**Prérequis** : Phase 4 validée

### 5.1 `token issue <univers> <env> <tenant>`

- [ ] Fonction `cmd_token_issue()` implémentée
- [ ] Validation invariants (tenant, univers, env)
- [ ] Génération `source` automatique : `<univers>.<env>.<tenant>`
- [ ] Intégration `dvig.cli.token_gen` :
  - [ ] Appel Python : `python -m dvig.cli.token_gen --tenant <tenant> --univers <univers> --output yaml`
  - [ ] Parsing sortie YAML
  - [ ] Extraction token brut, hash, token_id
- [ ] Écriture dans `tenants/<tenant>/secrets/dvig.tokens.yml` :
  - [ ] Ajout token dans liste
  - [ ] Format YAML correct
  - [ ] Métadonnées complètes (id, hash, tenant, univers, status, created_at, comment)
- [ ] Affichage sécurisé (une seule fois) :
  - [ ] Token brut affiché
  - [ ] Token ID affiché
  - [ ] Source associée rappelée
  - [ ] Avertissement "affiché une seule fois"
- [ ] Test : `dorevia.sh token issue odoo lab core` → Token créé

### 5.2 `token list <tenant>`

- [ ] Fonction `cmd_token_list()` implémentée
- [ ] Validation tenant
- [ ] Parsing `tenants/<tenant>/secrets/dvig.tokens.yml`
- [ ] Extraction informations tokens :
  - [ ] ID
  - [ ] Univers
  - [ ] Status
  - [ ] Created_at
  - [ ] Last_used_at (si disponible)
- [ ] Affichage tableau formaté
- [ ] Test : `dorevia.sh token list core` → Liste tous les tokens

### 5.3 `token revoke <tenant> <token_id>`

- [ ] Fonction `cmd_token_revoke()` implémentée
- [ ] Validation tenant et token_id
- [ ] Recherche token dans `dvig.tokens.yml`
- [ ] Modification status : `status=revoked`
- [ ] Sauvegarde YAML
- [ ] Envoi SIGHUP à DVIG (si supporté) :
  - [ ] `docker kill --signal=HUP dvig-core`
- [ ] Test : `dorevia.sh token revoke core tok_lab_core_001` → Token révoqué

### 5.4 `token rotate <univers> <env> <tenant>`

- [ ] Fonction `cmd_token_rotate()` implémentée
- [ ] Validation invariants (tenant, univers, env)
- [ ] Parsing flag `--revoke-old` (optionnel)
- [ ] Appel `token issue` (nouveau token)
- [ ] Appel `token revoke` (ancien token, si `--revoke-old`)
- [ ] Test : `dorevia.sh token rotate odoo lab core --revoke-old` → Rotation complète

### 5.5 Validation Phase 5

- [ ] `token issue odoo stinger core` produit token dans `tenants/core/secrets/dvig.tokens.yml`
- [ ] `token issue odoo prod core` produit token différent
- [ ] `token list core` affiche tous les tokens
- [ ] `token revoke core tok_xxx` révoque token
- [ ] Token lab ne passe pas sur source prod (validation DVIG) :
  - [ ] Test : Token LAB sur `source=odoo.prod.core` → Rejeté (403)
- [ ] Tous les tests passent

✅ **Sortie Phase 5 validée** : Commandes `token` opérationnelles.

**Date de validation** : _______________  
**Validé par** : _______________

---

## 🟦 Phase 6 — Odoo LAB (développement)

**Objectif** : Déployer Odoo LAB via `dorevia.sh`  
**Effort estimé** : 1-2h  
**Prérequis** : Phase 5 validée

### 6.1 Déploiement

- [ ] Platform démarrée : `dorevia.sh platform up core` → OK
- [ ] App LAB démarrée : `dorevia.sh app up odoo lab core` → OK
- [ ] DB créée : `odoo_lab_core` (ou `core_lab` si migration)
- [ ] Volumes créés :
  - [ ] `odoo_lab_core_data` (filestore)
  - [ ] `odoo_lab_core_db` (PostgreSQL)
- [ ] Filestore dédié présent
- [ ] Container `odoo_lab` running : `docker ps | grep odoo_lab`

### 6.2 Vérifications

- [ ] URL accessible : `https://odoo.lab.core.doreviateam.com`
- [ ] Redirection HTTPS fonctionne
- [ ] Page de connexion Odoo accessible
- [ ] Addons OCA chargés :
  - [ ] Volume OCA monté
  - [ ] Addons visibles dans Odoo
- [ ] Addons custom chargés :
  - [ ] Volume custom-addons monté
  - [ ] Addons visibles dans Odoo
- [ ] Connexion Odoo OK :
  - [ ] Base de données accessible
  - [ ] Modules installables

### 6.3 Configuration Odoo LAB

- [ ] Fichier `odoo.conf` généré correctement :
  - [ ] `dbfilter = ^odoo_lab_core$` (ou `^core_lab$` si migration)
  - [ ] `addons_path` correct
  - [ ] `data_dir` correct
- [ ] Configuration testée

### 6.4 DVIG ↔ LAB

- [ ] Token LAB configuré dans Odoo (si module d'intégration)
- [ ] Événement test envoyé depuis Odoo vers DVIG :
  - [ ] POST `/ingest` avec `source=odoo.lab.core`
  - [ ] Headers : `Authorization: Bearer <token_lab>`
- [ ] DVIG accepte requête (200/201)
- [ ] Preuve Vault générée avec `source=odoo.lab.core`
- [ ] Logs DVIG vérifiés :
  - [ ] Source correcte dans logs
  - [ ] Pas de token brut dans logs
  - [ ] Logs structurés (JSON)

✅ **Sortie Phase 6 validée** : LAB opérationnel.

**Date de validation** : _______________  
**Validé par** : _______________

---

## 🟦 Phase 7 — Odoo STINGER (démo client)

**Objectif** : Déployer Odoo STINGER via `dorevia.sh`  
**Effort estimé** : 2-3h  
**Prérequis** : Phase 6 validée

### 7.1 Déploiement

- [ ] Platform démarrée : `dorevia.sh platform up core` → OK
- [ ] App STINGER démarrée : `dorevia.sh app up odoo stinger core` → OK
- [ ] DB créée : `odoo_stinger_core`
- [ ] Volumes créés :
  - [ ] `odoo_stinger_core_data` (filestore)
  - [ ] `odoo_stinger_core_db` (PostgreSQL)
- [ ] Filestore dédié présent
- [ ] Container `odoo_stinger` running : `docker ps | grep odoo_stinger`

### 7.2 Vérifications

- [ ] URL accessible : `https://odoo.stinger.core.doreviateam.com`
- [ ] Redirection HTTPS fonctionne
- [ ] Page de connexion Odoo accessible
- [ ] Dataset de démo importé :
  - [ ] Base initialisée avec données de démo
  - [ ] Modules de base installés
  - [ ] Données cohérentes
- [ ] Comptes admin limités :
  - [ ] Seulement comptes nécessaires
  - [ ] Mots de passe sécurisés

### 7.3 Sécurité & conformité

- [ ] Images **taggées** (pas `latest`) :
  - [ ] Odoo : `odoo:18.0-20250819` (ou version spécifique)
  - [ ] PostgreSQL : `postgres:16`
- [ ] `/docs` et `/openapi` désactivés :
  - [ ] DVIG : `DVIG_DOCS_ENABLED=0`, `DVIG_OPENAPI_ENABLED=0`
  - [ ] Vérification : `https://dvig.core.doreviateam.com/docs` → 404
- [ ] Token STINGER configuré :
  - [ ] Token présent dans `tenants/core/secrets/dvig.tokens.yml`
  - [ ] Token actif (status=active)

### 7.4 DVIG ↔ STINGER

- [ ] Événement démo envoyé depuis Odoo vers DVIG :
  - [ ] POST `/ingest` avec `source=odoo.stinger.core`
  - [ ] Headers : `Authorization: Bearer <token_stinger>`
- [ ] DVIG accepte requête (200/201)
- [ ] Preuve Vault générée avec `source=odoo.stinger.core`
- [ ] Logs DVIG vérifiés :
  - [ ] Source correcte dans logs
  - [ ] Pas de token brut dans logs
  - [ ] Logs structurés (JSON)

### 7.5 Isolation

- [ ] Isolation complète vérifiée :
  - [ ] Pas de partage DB avec LAB/PROD
  - [ ] Pas de partage volumes avec LAB/PROD
  - [ ] Vérification : `docker volume ls | grep odoo_stinger` → Volumes dédiés

✅ **Sortie Phase 7 validée** : STINGER présentable client.

**Date de validation** : _______________  
**Validé par** : _______________

---

## 🟦 Phase 8 — Odoo PROD (production)

**Objectif** : Déployer Odoo PROD via `dorevia.sh`  
**Effort estimé** : 2-3h  
**Prérequis** : Phase 7 validée

### 8.1 Pré-déploiement

- [ ] Fenêtre de déploiement définie (date/heure)
- [ ] Images taggées validées :
  - [ ] Odoo : version spécifique (ex: `odoo:18.0-20250819`)
  - [ ] PostgreSQL : version spécifique (ex: `postgres:16`)
  - [ ] DVIG : version spécifique (ex: `dorevia/dvig:0.1.2-auth`)
  - [ ] Vault : version spécifique
- [ ] Plan de rollback préparé :
  - [ ] Procédure de rollback documentée
  - [ ] Images N-1 conservées
  - [ ] Backup pré-déploiement prévu

### 8.2 Déploiement

- [ ] Platform démarrée : `dorevia.sh platform up core` → OK
- [ ] App PROD démarrée : `dorevia.sh app up odoo prod core` → OK
- [ ] DB créée : `odoo_prod_core`
- [ ] Volumes créés :
  - [ ] `odoo_prod_core_data` (filestore)
  - [ ] `odoo_prod_core_db` (PostgreSQL)
- [ ] Filestore dédié présent
- [ ] Container `odoo_prod` running : `docker ps | grep odoo_prod`

### 8.3 Sécurité

- [ ] Token PROD configuré :
  - [ ] Token présent dans `tenants/core/secrets/dvig.tokens.yml`
  - [ ] Token actif (status=active)
  - [ ] Token brut stocké de manière sécurisée (hors repo)
- [ ] Comptes admin restreints :
  - [ ] Seulement comptes nécessaires
  - [ ] Mots de passe sécurisés (complexité)
  - [ ] 2FA activé (si disponible)
- [ ] Accès HTTPS uniquement :
  - [ ] HTTP redirigé vers HTTPS
  - [ ] Certificats SSL valides
- [ ] `/docs` et `/openapi` désactivés :
  - [ ] DVIG : `DVIG_DOCS_ENABLED=0`, `DVIG_OPENAPI_ENABLED=0`
  - [ ] Vérification : `https://dvig.core.doreviateam.com/docs` → 404

### 8.4 Sauvegardes

- [ ] Backup DB quotidien configuré :
  - [ ] Script de backup créé
  - [ ] Cron job configuré (ou équivalent)
  - [ ] Rétention définie (ex: 30 jours)
- [ ] Backup filestore configuré :
  - [ ] Script de backup créé
  - [ ] Cron job configuré (ou équivalent)
  - [ ] Rétention définie
- [ ] Test de restauration effectué :
  - [ ] Backup test restauré
  - [ ] Vérification intégrité données
  - [ ] Temps de restauration mesuré

### 8.5 DVIG ↔ PROD

- [ ] Événement réel envoyé depuis Odoo vers DVIG :
  - [ ] POST `/ingest` avec `source=odoo.prod.core`
  - [ ] Headers : `Authorization: Bearer <token_prod>`
- [ ] DVIG accepte requête (200/201)
- [ ] Preuve Vault générée avec `source=odoo.prod.core`
- [ ] Tentative token LAB sur PROD rejetée :
  - [ ] Test : Token LAB sur `source=odoo.prod.core` → Rejeté (403)
- [ ] Logs DVIG vérifiés :
  - [ ] Source correcte dans logs
  - [ ] Pas de token brut dans logs
  - [ ] Logs structurés (JSON)
  - [ ] Logs archivés (si requis)

### 8.6 Isolation

- [ ] Isolation complète vérifiée :
  - [ ] Pas de partage DB avec LAB/STINGER
  - [ ] Pas de partage volumes avec LAB/STINGER
  - [ ] Vérification : `docker volume ls | grep odoo_prod` → Volumes dédiés

✅ **Sortie Phase 8 validée** : PROD exploitable.

**Date de validation** : _______________  
**Validé par** : _______________

---

## 🟦 Phase 9 — Migration & nettoyage

**Objectif** : Migrer LAB existant et nettoyer anciennes configurations  
**Effort estimé** : 1-2h  
**Prérequis** : Phase 8 validée

### 9.1 Migration LAB existant

- [ ] Snapshot volumes LAB existants :
  - [ ] `odoo_db_lab_data` sauvegardé
  - [ ] `odoo_odoo_lab_data` sauvegardé
- [ ] Sauvegarde DB LAB existante :
  - [ ] Dump PostgreSQL : `pg_dump core_lab > backup_lab_$(date +%Y%m%d).sql`
  - [ ] Vérification intégrité dump
- [ ] Arrêt ancien LAB :
  - [ ] `docker compose -f units/odoo/docker-compose.lab.yml down`
  - [ ] Containers arrêtés
- [ ] Recréation via `dorevia.sh` :
  - [ ] `dorevia.sh app up odoo lab core`
  - [ ] Nouveau LAB démarré
- [ ] Migration données (si nécessaire) :
  - [ ] Restauration dump dans nouvelle DB
  - [ ] Copie filestore
  - [ ] Vérification données

### 9.2 Nettoyage

- [ ] Suppression anciens réseaux Docker :
  - [ ] Réseaux obsolètes identifiés
  - [ ] Réseaux supprimés (si non utilisés)
- [ ] Suppression anciens conteneurs obsolètes :
  - [ ] Containers arrêtés identifiés
  - [ ] Containers supprimés (si non utilisés)
- [ ] Vérification absence de collision ports/volumes :
  - [ ] `docker ps -a` : pas de containers orphelins
  - [ ] `docker volume ls` : pas de volumes orphelins
  - [ ] `docker network ls` : pas de réseaux orphelins
- [ ] Suppression anciennes configurations :
  - [ ] `sources/dvig/docker/docker-compose.lab.yml` (si remplacé)
  - [ ] `sources/dvig/docker/docker-compose.prod.yml` (si remplacé)
  - [ ] Autres fichiers obsolètes

### 9.3 Validation finale

- [ ] LAB / STINGER / PROD accessibles :
  - [ ] `https://odoo.lab.core.doreviateam.com` → OK
  - [ ] `https://odoo.stinger.core.doreviateam.com` → OK
  - [ ] `https://odoo.prod.core.doreviateam.com` → OK
- [ ] DVIG/Vault uniques et stables :
  - [ ] `https://dvig.core.doreviateam.com` → OK
  - [ ] `https://vault.core.doreviateam.com` → OK
  - [ ] Une seule instance de chaque service
- [ ] Logs propres :
  - [ ] Pas d'erreurs critiques
  - [ ] Logs structurés (JSON)
  - [ ] Rotation logs configurée
- [ ] Architecture conforme aux SPECs :
  - [ ] Services partagés (DVIG/Vault) uniques
  - [ ] Odoo isolés par environnement
  - [ ] Tokens conformes (tenant=core)
  - [ ] Validation source stricte
  - [ ] Orchestrateur `dorevia.sh` opérationnel

✅ **Sortie Phase 9 validée** : Migration et nettoyage terminés.

**Date de validation** : _______________  
**Validé par** : _______________

---

## ✅ Checklist complète — Validation finale

### Critères d'acceptation SPEC CORE Tenant

- [ ] URLs HTTPS opérationnelles :
  - [ ] `https://odoo.lab.core.doreviateam.com` → OK
  - [ ] `https://odoo.stinger.core.doreviateam.com` → OK
  - [ ] `https://odoo.prod.core.doreviateam.com` → OK
  - [ ] `https://dvig.core.doreviateam.com` → OK
  - [ ] `https://vault.core.doreviateam.com` → OK
- [ ] Isolation données complète :
  - [ ] Odoo LAB : DB `odoo_lab_core` + volumes dédiés
  - [ ] Odoo STINGER : DB `odoo_stinger_core` + volumes dédiés
  - [ ] Odoo PROD : DB `odoo_prod_core` + volumes dédiés
  - [ ] Aucun partage entre environnements
- [ ] Tokens DVIG conformes :
  - [ ] Token LAB : `tenant: "core"`, source `odoo.lab.core` → Fonctionne
  - [ ] Token STINGER : `tenant: "core"`, source `odoo.stinger.core` → Fonctionne
  - [ ] Token PROD : `tenant: "core"`, source `odoo.prod.core` → Fonctionne
  - [ ] Token LAB sur `source=odoo.prod.core` → Refusé (403)
- [ ] Versions taggées :
  - [ ] STINGER : Images taggées (pas `latest`)
  - [ ] PROD : Images taggées (pas `latest`)
  - [ ] DVIG : Version taggée
  - [ ] Vault : Version taggée

### Critères d'acceptation SPEC dorevia.sh

- [ ] `platform up core` démarre Caddy + DVIG + Vault → OK
- [ ] `app up odoo lab core` démarre Odoo LAB avec DB+filestore dédiés → OK
- [ ] `app up odoo stinger core` démarre Odoo STINGER avec DB+filestore dédiés → OK
- [ ] `app up odoo prod core` démarre Odoo PROD avec DB+filestore dédiés → OK
- [ ] `token issue odoo stinger core` produit token dans `tenants/core/secrets/dvig.tokens.yml` → OK
- [ ] `token issue odoo prod core` produit token différent → OK
- [ ] Rejet env invalide (E01) : `app up odoo prd core` → Rejeté
- [ ] Rejet `latest` en STINGER/PROD (E02) : `app up odoo stinger core --image odoo:latest` → Rejeté

### Documentation

- [ ] Guide utilisateur `dorevia.sh` créé
- [ ] Guide migration créé
- [ ] Exemples d'utilisation documentés
- [ ] README principal mis à jour
- [ ] Architecture documentée

### Formation équipe

- [ ] Équipe formée à `dorevia.sh`
- [ ] Procédures documentées
- [ ] Support disponible

---

## 📊 Résumé d'exécution

**Date de début** : _______________  
**Date de fin** : _______________  
**Durée totale** : _______________ heures

**Phases complétées** :
- [ ] Phase 0 : Mise en conformité contractuelle
- [ ] Phase 1 : Services partagés
- [ ] Phase 2 : Orchestrateur `dorevia.sh` (socle)
- [ ] Phase 3 : Commandes `platform`
- [ ] Phase 4 : Commandes `app`
- [ ] Phase 5 : Commandes `token`
- [ ] Phase 6 : Odoo LAB
- [ ] Phase 7 : Odoo STINGER
- [ ] Phase 8 : Odoo PROD
- [ ] Phase 9 : Migration & nettoyage

**Statut global** : ☐ En cours  ☐ Terminé  ☐ Bloqué

**Blocages identifiés** :
_________________________________________________
_________________________________________________
_________________________________________________

**Notes finales** :
_________________________________________________
_________________________________________________
_________________________________________________

**Validé par** : _______________  
**Date de validation** : _______________

---

**Fin de checklist**

