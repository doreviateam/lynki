# 📋 Plan d'Implémentation Unifié — SPEC CORE Tenant + dorevia.sh

**Date** : 2025-01-28  
**Spécifications** :
- SPEC — Plateforme Dorevia — CORE (tenant) + Environnements Odoo LAB/STINGER/PROD v1.0
- SPEC — `dorevia.sh` — Orchestrateur de Plateforme v1.0
- Clarification Contractuelle — Tenant / Univers / Source v1.0

**Statut** : Plan d'implémentation unifié et priorisé

---

## 📊 Résumé Exécutif

### Objectif

Créer un **plan d'implémentation unique** qui intègre :
1. **Architecture CORE Tenant** : Services partagés (DVIG/Vault) + 3 Odoo isolés
2. **Orchestrateur `dorevia.sh`** : CLI unifiée pour gérer la plateforme
3. **Conformité contractuelle** : Validation automatique des invariants

### Principe d'Organisation

**Approche progressive** : Construire l'infrastructure de base, puis l'orchestrateur, puis les applications.

**Ordre logique** :
1. **Fondations** : Corrections critiques (tokens, validation)
2. **Infrastructure** : Services partagés (DVIG/Vault/Caddy)
3. **Orchestrateur** : CLI `dorevia.sh` (réutilise infrastructure)
4. **Applications** : Odoo LAB/STINGER/PROD (via orchestrateur)
5. **Finalisation** : Tests, documentation, migration

---

## 🎯 Vue d'Ensemble — 7 Phases

| Phase | Objectif | Effort | Priorité | Dépendances |
|-------|----------|--------|----------|-------------|
| **Phase 0** | Corrections critiques (tokens, validation) | 2-3h | 🔴 Critique | Aucune |
| **Phase 1** | Infrastructure services partagés | 3-4h | 🔴 Critique | Phase 0 |
| **Phase 2** | Structure orchestrateur `dorevia.sh` | 1-2h | 🟡 Important | Phase 1 |
| **Phase 3** | Commandes `platform` (dorevia.sh) | 3-4h | 🔴 Critique | Phase 2 |
| **Phase 4** | Commandes `app` (dorevia.sh) | 4-5h | 🔴 Critique | Phase 3 |
| **Phase 5** | Commandes `token` (dorevia.sh) | 2-3h | 🟡 Important | Phase 4 |
| **Phase 6** | Finalisation & validation | 2-3h | 🟡 Important | Phase 5 |

**Effort Total** : **17-24h**

---

## Phase 0 : Corrections Critiques (2-3h)

### 🎯 Objectif

Corriger les **non-conformités critiques** identifiées avant toute migration :
- Tokens DVIG avec `tenant: "core"` (au lieu de `rehtse`)
- Validation source renforcée (format strict `univers.env.tenant`)
- Validation tenant (source tenant = token tenant)

### 📋 Tâches

#### 0.1 Régénération Tokens DVIG (30min)

**Action** : Régénérer tous les tokens avec `tenant: "core"`

```bash
# Token LAB
python -m dvig.cli.token_gen --tenant core --univers odoo --output yaml > tokens_lab.yml

# Token STINGER
python -m dvig.cli.token_gen --tenant core --univers odoo --output yaml > tokens_stinger.yml

# Token PROD
python -m dvig.cli.token_gen --tenant core --univers odoo --output yaml > tokens_prod.yml

# Fusionner dans tokens.yml
```

**Fichiers** :
- `sources/dvig/conf/tokens.yml` (mis à jour)

**Validation** :
- [ ] Tokens avec `tenant: "core"`
- [ ] Sources : `odoo.lab.core`, `odoo.stinger.core`, `odoo.prod.core`

---

#### 0.2 Renforcement Validation Source (1-2h)

**Action** : Implémenter validation stricte selon clarification contractuelle

**Fichier** : `sources/dvig/dvig/api_fastapi/auth/validation.py`

**Changements** :
- Format strict : `univers.env.tenant`
- Vérification `tenant` source = `tenant` token
- Vérification `univers` source = `univers` token
- Validation environnements : `{lab, stinger, prod}`

**Code** : (voir `ANALYSE_SPEC_CORE_TENANT.md` §9.1)

**Validation** :
- [ ] Test : `odoo.lab.core` → ✅ Accepté
- [ ] Test : `odoo.xxx` → ❌ Rejeté (INVALID_SOURCE_FORMAT)
- [ ] Test : `odoo.lab.rehtse` → ❌ Rejeté (TENANT_MISMATCH)
- [ ] Test : `sylius.lab.core` → ❌ Rejeté (UNIVERSE_MISMATCH)

---

#### 0.3 Tests Validation (30min)

**Action** : Tests unitaires + intégration

**Fichiers** :
- `tests/unit/test_source_validation.py` (mis à jour)
- `tests/integration/test_ingest_auth.py` (mis à jour)

**Validation** :
- [ ] Tests sources valides
- [ ] Tests sources invalides
- [ ] Tests tenant mismatch
- [ ] Tests univers mismatch

---

### ✅ Critères d'Acceptation Phase 0

- [ ] Tous les tokens ont `tenant: "core"`
- [ ] Validation source accepte uniquement `univers.env.tenant`
- [ ] Validation tenant fonctionne
- [ ] Tests passent (100%)

---

## Phase 1 : Infrastructure Services Partagés (3-4h)

### 🎯 Objectif

Créer l'**infrastructure de base** (services partagés) selon SPEC CORE Tenant :
- Réseau Docker `dorevia-network`
- DVIG partagé (instance unique)
- Vault partagé (instance unique)
- Caddy (routage mis à jour)

### 📋 Tâches

#### 1.1 Créer Réseau Docker (5min)

```bash
docker network create dorevia-network
```

**Validation** :
- [ ] Réseau `dorevia-network` créé
- [ ] Vérifier : `docker network ls | grep dorevia-network`

---

#### 1.2 DVIG Partagé (1-2h)

**Action** : Créer instance DVIG unique partagée

**Fichier** : `sources/dvig/docker/docker-compose.yml` (NOUVEAU)

**Configuration** :
```yaml
services:
  dvig:
    image: dorevia/dvig:0.1.2-auth
    container_name: dvig-core
    restart: unless-stopped
    networks:
      - dorevia-network
    environment:
      - DVIG_AUTH_ENABLED=1
      - DVIG_TOKENS_FILE=/etc/dvig/tokens.yml
      - DVIG_DOCS_ENABLED=0
      - DVIG_OPENAPI_ENABLED=0
      - DVIG_LOG_FORMAT=json
    volumes:
      - /etc/dvig/tokens.yml:/etc/dvig/tokens.yml:ro
    # Pas de port exposé (routage via Caddy)

networks:
  dorevia-network:
    external: true
```

**Actions** :
- [ ] Créer `docker-compose.yml`
- [ ] Copier `tokens.yml` (Phase 0) vers `/etc/dvig/tokens.yml`
- [ ] Démarrer : `docker compose up -d`
- [ ] Tester : `curl http://localhost:8080/health` (si port temporaire)

**Validation** :
- [ ] Container `dvig-core` running
- [ ] Health check OK
- [ ] Tokens chargés (logs)

---

#### 1.3 Vault Partagé (1h)

**Action** : Intégrer Vault dans services partagés

**Fichier** : `sources/dvig/docker/docker-compose.yml` (ajout service vault)

**Configuration** :
```yaml
services:
  vault:
    image: dorevia/vault:latest  # ⚠️ Utiliser version taggée
    container_name: vault-core
    restart: unless-stopped
    networks:
      - dorevia-network
    environment:
      - DATABASE_URL=postgres://vault:password@vault-db:5432/dorevia_vault
      - PORT=8080
    depends_on:
      - vault-db
    # Pas de port exposé (routage via Caddy)

  vault-db:
    image: postgres:16
    container_name: vault-db-core
    volumes:
      - vault_db_data:/var/lib/postgresql/data
    networks:
      - dorevia-network
```

**Actions** :
- [ ] Ajouter service `vault` dans `docker-compose.yml`
- [ ] Démarrer : `docker compose up -d vault`
- [ ] Tester accès Vault

**Validation** :
- [ ] Container `vault-core` running
- [ ] Health check OK
- [ ] Base de données accessible

---

#### 1.4 Caddy Routage (1h)

**Action** : Mettre à jour Caddyfile avec routage services partagés

**Fichier** : `units/gateway/Caddyfile`

**Configuration** :
```caddy
{
  email admin@doreviateam.com
}

# Odoo - Environnements
odoo.lab.core.doreviateam.com {
  reverse_proxy odoo_lab:8069
}

odoo.stinger.core.doreviateam.com {
  reverse_proxy odoo_stinger:8069
}

odoo.prod.core.doreviateam.com {
  reverse_proxy odoo_prod:8069
}

# Services partagés
dvig.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}

vault.core.doreviateam.com {
  reverse_proxy vault-core:8080
}
```

**Fichier** : `units/gateway/docker-compose.yml` (ajout réseau)

```yaml
services:
  caddy:
    image: caddy:2
    container_name: gateway-caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - dorevia-network  # ⚠️ AJOUT
    restart: unless-stopped
```

**Actions** :
- [ ] Mettre à jour `Caddyfile`
- [ ] Ajouter réseau dans `docker-compose.yml`
- [ ] Redémarrer Caddy : `docker compose restart caddy`

**Validation** :
- [ ] Caddy sur réseau `dorevia-network`
- [ ] Routage testé (si services disponibles)

---

### ✅ Critères d'Acceptation Phase 1

- [ ] Réseau `dorevia-network` créé
- [ ] DVIG partagé running (`dvig-core`)
- [ ] Vault partagé running (`vault-core`)
- [ ] Caddy mis à jour et sur réseau
- [ ] Services accessibles via DNS (si configuré)

---

## Phase 2 : Structure Orchestrateur `dorevia.sh` (1-2h)

### 🎯 Objectif

Créer la **structure de base** de l'orchestrateur `dorevia.sh` :
- Arborescence `tenants/`
- Script `bin/dorevia.sh` (squelette)
- Templates de configuration

### 📋 Tâches

#### 2.1 Créer Arborescence (15min)

```bash
mkdir -p bin
mkdir -p tenants/core/{platform,apps/odoo/{lab,stinger,prod},secrets,state}
```

**Structure** :
```
dorevia-platform/
  bin/
    dorevia.sh                    # ⚠️ NOUVEAU
  tenants/
    core/
      platform/                   # compose + conf services partagés
      apps/
        odoo/
          lab/
          stinger/
          prod/
      secrets/
        dvig.tokens.yml           # ⚠️ Déplacé depuis sources/dvig/conf/
      state/
        manifest.json             # état calculé
```

**Actions** :
- [ ] Créer arborescence complète
- [ ] Créer `.gitignore` pour `tenants/*/secrets/`

---

#### 2.2 Script Squelette `dorevia.sh` (30min)

**Fichier** : `bin/dorevia.sh`

**Structure de base** :
```bash
#!/bin/bash
# dorevia.sh - Orchestrateur de Plateforme Dorevia
# Version: 1.0

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TENANTS_DIR="$ROOT_DIR/tenants"

# Codes d'erreur
E01=1  # paramètre invalide
E02=2  # invariant violé
E03=3  # dépendance manquante
E04=4  # platform down
E05=5  # ressource occupée
E06=6  # opération destructive sans flag --purge

# Fonctions utilitaires
error() {
  echo "ERROR: $1" >&2
  exit "${2:-1}"
}

# Validation tenant
validate_tenant() {
  local tenant="$1"
  # Slug DNS: [a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?
  if [[ ! "$tenant" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]]; then
    error "Tenant invalide: $tenant (E01)" "$E01"
  fi
}

# Validation env
validate_env() {
  local env="$1"
  case "$env" in
    lab|stinger|prod) ;;
    *) error "Environnement invalide: $env (doit être lab, stinger ou prod) (E01)" "$E01" ;;
  esac
}

# Validation univers
validate_univers() {
  local univers="$1"
  case "$univers" in
    odoo) ;;
    *) error "Univers invalide: $univers (v1.0: odoo uniquement) (E01)" "$E01" ;;
  esac
}

# Commande help
cmd_help() {
  cat <<EOF
dorevia.sh - Orchestrateur de Plateforme Dorevia

Usage:
  dorevia.sh <command> <subcommand> [args...] [--flags]

Commands:
  platform up <tenant>          Démarre services partagés
  platform status <tenant>       Affiche statut services partagés
  platform down <tenant>         Stoppe services partagés
  platform destroy <tenant>      Détruit services partagés (--purge requis)
  
  app up <univers> <env> <tenant>     Démarre application
  app status <univers> <env> <tenant> Affiche statut application
  app down <univers> <env> <tenant>    Stoppe application
  app reset <univers> <env> <tenant>  Reset application (--purge requis)
  app destroy <univers> <env> <tenant> Détruit application (--purge requis)
  
  token issue <univers> <env> <tenant>  Crée token DVIG
  token list <tenant>                   Liste tokens
  token revoke <tenant> <token_id>     Révoque token
  token rotate <univers> <env> <tenant> Rotation token
  
  help                                Affiche cette aide
  version                             Affiche version
  doctor                              Vérifie prérequis

EOF
}

# Commande version
cmd_version() {
  echo "dorevia.sh version 1.0"
}

# Commande doctor
cmd_doctor() {
  echo "🔍 Vérification prérequis..."
  
  # Docker
  if ! command -v docker &> /dev/null; then
    error "Docker non installé (E03)" "$E03"
  fi
  echo "✅ Docker installé"
  
  # Docker Compose
  if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose non installé (E03)" "$E03"
  fi
  echo "✅ Docker Compose installé"
  
  # Réseau Docker
  if ! docker network inspect dorevia-network &> /dev/null; then
    echo "⚠️  Réseau dorevia-network non créé (créer avec: docker network create dorevia-network)"
  else
    echo "✅ Réseau dorevia-network existe"
  fi
  
  echo "✅ Prérequis OK"
}

# Main
main() {
  local command="${1:-help}"
  shift || true
  
  case "$command" in
    help) cmd_help ;;
    version) cmd_version ;;
    doctor) cmd_doctor ;;
    platform) cmd_platform "$@" ;;
    app) cmd_app "$@" ;;
    token) cmd_token "$@" ;;
    *) error "Commande inconnue: $command (utilisez 'help')" "$E01" ;;
  esac
}

# Stubs pour commandes (à implémenter)
cmd_platform() {
  echo "⚠️  Commande platform non implémentée (Phase 3)"
}

cmd_app() {
  echo "⚠️  Commande app non implémentée (Phase 4)"
}

cmd_token() {
  echo "⚠️  Commande token non implémentée (Phase 5)"
}

# Exécution
main "$@"
```

**Actions** :
- [ ] Créer `bin/dorevia.sh`
- [ ] Rendre exécutable : `chmod +x bin/dorevia.sh`
- [ ] Tester : `./bin/dorevia.sh help`
- [ ] Tester : `./bin/dorevia.sh doctor`

---

#### 2.3 Déplacer Tokens (15min)

**Action** : Déplacer tokens vers structure `tenants/`

```bash
# Copier tokens depuis Phase 0
cp sources/dvig/conf/tokens.yml tenants/core/secrets/dvig.tokens.yml

# Mettre à jour .gitignore
echo "tenants/*/secrets/" >> .gitignore
```

**Actions** :
- [ ] Copier `tokens.yml` vers `tenants/core/secrets/dvig.tokens.yml`
- [ ] Mettre à jour `.gitignore`
- [ ] Vérifier : `git status` (secrets ignorés)

---

#### 2.4 Templates Configuration (30min)

**Action** : Créer templates pour génération automatique

**Fichiers** :
- `tenants/core/platform/docker-compose.yml.template`
- `tenants/core/apps/odoo/lab/docker-compose.yml.template`
- `tenants/core/apps/odoo/lab/odoo.conf.template`

**Actions** :
- [ ] Créer templates (réutiliser configs Phase 1)
- [ ] Documenter variables à remplacer

---

### ✅ Critères d'Acceptation Phase 2

- [ ] Arborescence `tenants/` créée
- [ ] Script `bin/dorevia.sh` fonctionnel (help, version, doctor)
- [ ] Tokens déplacés vers `tenants/core/secrets/`
- [ ] Templates créés

---

## Phase 3 : Commandes `platform` (dorevia.sh) (3-4h)

### 🎯 Objectif

Implémenter les commandes `platform` de `dorevia.sh` qui utilisent l'infrastructure Phase 1.

### 📋 Tâches

#### 3.1 `platform up <tenant>` (1-2h)

**Fonctionnalités** :
- Validation tenant
- Génération `docker-compose.yml` depuis template
- Démarrage services (Caddy + DVIG + Vault)
- Vérification dépendances

**Implémentation** :
```bash
cmd_platform_up() {
  local tenant="$1"
  validate_tenant "$tenant"
  
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  
  # Générer docker-compose.yml si absent
  if [[ ! -f "$platform_dir/docker-compose.yml" ]]; then
    generate_platform_compose "$tenant"
  fi
  
  # Démarrer services
  cd "$platform_dir"
  docker compose up -d
  
  echo "✅ Platform $tenant démarrée"
  echo "📊 URLs:"
  echo "  - DVIG: https://dvig.$tenant.doreviateam.com"
  echo "  - Vault: https://vault.$tenant.doreviateam.com"
}
```

**Actions** :
- [ ] Implémenter `cmd_platform_up`
- [ ] Fonction `generate_platform_compose`
- [ ] Tester : `dorevia.sh platform up core`

---

#### 3.2 `platform status <tenant>` (30min)

**Fonctionnalités** :
- Afficher conteneurs up/down
- Health checks
- Versions images
- Chemins volumes

**Implémentation** :
```bash
cmd_platform_status() {
  local tenant="$1"
  validate_tenant "$tenant"
  
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  cd "$platform_dir"
  
  echo "📊 Platform $tenant:"
  docker compose ps
  # Extraire versions, health checks, etc.
}
```

**Actions** :
- [ ] Implémenter `cmd_platform_status`
- [ ] Parser `docker compose ps`
- [ ] Extraire tags d'images
- [ ] Tester : `dorevia.sh platform status core`

---

#### 3.3 `platform down <tenant>` (15min)

**Fonctionnalités** :
- Stoppe services partagés
- Sans destruction données

**Implémentation** :
```bash
cmd_platform_down() {
  local tenant="$1"
  validate_tenant "$tenant"
  
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  cd "$platform_dir"
  docker compose down
}
```

**Actions** :
- [ ] Implémenter `cmd_platform_down`
- [ ] Tester : `dorevia.sh platform down core`

---

#### 3.4 `platform destroy <tenant>` (30min)

**Fonctionnalités** :
- Destruction contrôlée
- Flag `--purge` requis pour volumes
- Flag `--purge-secrets` requis pour secrets

**Implémentation** :
```bash
cmd_platform_destroy() {
  local tenant="$1"
  validate_tenant "$tenant"
  
  local purge_volumes=false
  local purge_secrets=false
  
  # Parser flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --purge) purge_volumes=true ;;
      --purge-secrets) purge_secrets=true ;;
      *) error "Flag inconnu: $1" "$E01" ;;
    esac
    shift
  done
  
  if [[ "$purge_volumes" == "true" || "$purge_secrets" == "true" ]]; then
    if [[ "$purge_volumes" != "true" ]]; then
      error "Flag --purge requis pour supprimer volumes (E06)" "$E06"
    fi
    # Supprimer volumes
  fi
  
  # Supprimer containers/networks
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  cd "$platform_dir"
  docker compose down -v
}
```

**Actions** :
- [ ] Implémenter `cmd_platform_destroy`
- [ ] Validation flags `--purge`
- [ ] Tester : `dorevia.sh platform destroy core --purge`

---

### ✅ Critères d'Acceptation Phase 3

- [ ] `platform up core` démarre Caddy + DVIG + Vault
- [ ] `platform status core` affiche statut correct
- [ ] `platform down core` stoppe services
- [ ] `platform destroy core --purge` supprime volumes (avec flag)

---

## Phase 4 : Commandes `app` (dorevia.sh) (4-5h)

### 🎯 Objectif

Implémenter les commandes `app` de `dorevia.sh` pour gérer Odoo LAB/STINGER/PROD.

### 📋 Tâches

#### 4.1 `app up <univers> <env> <tenant>` (2-3h)

**Fonctionnalités** :
- Validation env/univers/tenant
- Vérification platform up (E04 si down)
- Génération `source` = `<univers>.<env>.<tenant>`
- Génération identifiants déterministes :
  - DB name : `odoo_<env>_<tenant>`
  - Volumes : `odoo_<env>_<tenant>_data`, `odoo_<env>_<tenant>_db`
  - Compose project : `dorevia_<univers>_<env>_<tenant>`
- Génération `docker-compose.yml`, `.env`, `odoo.conf`
- Validation version image (E02 si `latest` en STINGER/PROD)
- Démarrage services

**Implémentation** :
```bash
cmd_app_up() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  
  validate_univers "$univers"
  validate_env "$env"
  validate_tenant "$tenant"
  
  # Vérifier platform up
  if ! platform_is_up "$tenant"; then
    error "Platform $tenant n'est pas démarrée (E04)" "$E04"
  fi
  
  # Générer source
  local source="${univers}.${env}.${tenant}"
  
  # Générer identifiants
  local db_name="odoo_${env}_${tenant}"
  local volume_data="odoo_${env}_${tenant}_data"
  local volume_db="odoo_${env}_${tenant}_db"
  local compose_project="dorevia_${univers}_${env}_${tenant}"
  
  # Générer configurations
  local app_dir="$TENANTS_DIR/$tenant/apps/$univers/$env"
  mkdir -p "$app_dir"
  
  generate_app_compose "$univers" "$env" "$tenant" "$db_name" "$volume_data" "$volume_db"
  generate_app_env "$univers" "$env" "$tenant"
  generate_app_odoo_conf "$univers" "$env" "$tenant" "$db_name"
  
  # Démarrer
  cd "$app_dir"
  export COMPOSE_PROJECT_NAME="$compose_project"
  docker compose up -d
  
  echo "✅ App $univers $env $tenant démarrée"
  echo "📊 Source: $source"
  echo "📊 URL: https://$univers.$env.$tenant.doreviateam.com"
}
```

**Actions** :
- [ ] Implémenter `cmd_app_up`
- [ ] Fonctions génération (compose, env, odoo.conf)
- [ ] Validation version image
- [ ] Tester : `dorevia.sh app up odoo lab core`

---

#### 4.2 `app status <univers> <env> <tenant>` (30min)

**Fonctionnalités** :
- Afficher containers + ports internes
- DB name / volumes
- Source attendue
- URL attendue

**Actions** :
- [ ] Implémenter `cmd_app_status`
- [ ] Tester : `dorevia.sh app status odoo lab core`

---

#### 4.3 `app down <univers> <env> <tenant>` (15min)

**Fonctionnalités** :
- Stoppe l'app (sans purge données)

**Actions** :
- [ ] Implémenter `cmd_app_down`
- [ ] Tester : `dorevia.sh app down odoo lab core`

---

#### 4.4 `app reset <univers> <env> <tenant>` (1h)

**Fonctionnalités** :
- Reset contrôlé (démo/dev)
- Flag `--purge` requis
- Drop DB + filestore
- Import dataset démo `--demo <profile>` (optionnel)

**Actions** :
- [ ] Implémenter `cmd_app_reset`
- [ ] Validation flag `--purge` (E06)
- [ ] Drop DB PostgreSQL
- [ ] Suppression filestore
- [ ] Tester : `dorevia.sh app reset odoo stinger core --purge`

---

#### 4.5 `app destroy <univers> <env> <tenant>` (30min)

**Fonctionnalités** :
- Suppression containers/networks
- Purge volumes si flag `--purge`

**Actions** :
- [ ] Implémenter `cmd_app_destroy`
- [ ] Validation flag `--purge` (E06)
- [ ] Tester : `dorevia.sh app destroy odoo lab core --purge`

---

### ✅ Critères d'Acceptation Phase 4

- [ ] `app up odoo lab core` démarre Odoo LAB avec DB+filestore dédiés
- [ ] `app up odoo stinger core` démarre Odoo STINGER avec DB+filestore dédiés
- [ ] `app up odoo prod core` démarre Odoo PROD avec DB+filestore dédiés
- [ ] Rejet env invalide (E01)
- [ ] Rejet `latest` en STINGER/PROD (E02)
- [ ] Rejet app up si platform down (E04)

---

## Phase 5 : Commandes `token` (dorevia.sh) (2-3h)

### 🎯 Objectif

Implémenter les commandes `token` de `dorevia.sh` pour gérer les tokens DVIG.

### 📋 Tâches

#### 5.1 `token issue <univers> <env> <tenant>` (1h)

**Fonctionnalités** :
- Validation invariants (tenant, univers)
- Génération `source` automatique
- Réutiliser `dvig.cli.token_gen`
- Écriture dans `tenants/<tenant>/secrets/dvig.tokens.yml`
- Affichage sécurisé (une seule fois)

**Implémentation** :
```bash
cmd_token_issue() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  
  validate_univers "$univers"
  validate_env "$env"
  validate_tenant "$tenant"
  
  # Générer source
  local source="${univers}.${env}.${tenant}"
  
  # Générer token via CLI Python
  local token_output
  token_output=$(python -m dvig.cli.token_gen \
    --tenant "$tenant" \
    --univers "$univers" \
    --output yaml)
  
  # Extraire token brut et hash
  local token_id token_hash token_raw
  # ... parsing ...
  
  # Ajouter à tokens.yml
  local tokens_file="$TENANTS_DIR/$tenant/secrets/dvig.tokens.yml"
  # ... ajout token ...
  
  # Afficher (une seule fois)
  echo "✅ Token créé: $token_id"
  echo "📋 Source: $source"
  echo "🔑 Token (affiché une seule fois):"
  echo "$token_raw"
  echo "⚠️  Sauvegardez ce token, il ne sera plus affiché"
}
```

**Actions** :
- [ ] Implémenter `cmd_token_issue`
- [ ] Intégration `dvig.cli.token_gen`
- [ ] Écriture YAML
- [ ] Tester : `dorevia.sh token issue odoo lab core`

---

#### 5.2 `token list <tenant>` (30min)

**Fonctionnalités** :
- Liste tokens (id, univers, status, created_at)

**Actions** :
- [ ] Implémenter `cmd_token_list`
- [ ] Parser YAML
- [ ] Afficher tableau formaté
- [ ] Tester : `dorevia.sh token list core`

---

#### 5.3 `token revoke <tenant> <token_id>` (30min)

**Fonctionnalités** :
- Désactive token (status=revoked)
- Déclenche reload DVIG si supporté

**Actions** :
- [ ] Implémenter `cmd_token_revoke`
- [ ] Modifier YAML (status=revoked)
- [ ] Envoyer SIGHUP à DVIG
- [ ] Tester : `dorevia.sh token revoke core tok_lab_core_001`

---

#### 5.4 `token rotate <univers> <env> <tenant>` (30min)

**Fonctionnalités** :
- Alias sécurisé
- Issue nouveau token
- Revoke ancien (optionnel `--revoke-old`)

**Actions** :
- [ ] Implémenter `cmd_token_rotate`
- [ ] Tester : `dorevia.sh token rotate odoo lab core --revoke-old`

---

### ✅ Critères d'Acceptation Phase 5

- [ ] `token issue odoo stinger core` produit token dans `tenants/core/secrets/dvig.tokens.yml`
- [ ] `token issue odoo prod core` produit token différent
- [ ] `token list core` affiche tous les tokens
- [ ] `token revoke core tok_xxx` révoque token
- [ ] Token lab ne passe pas sur source prod (validation DVIG)

---

## Phase 6 : Finalisation & Validation (2-3h)

### 🎯 Objectif

Finaliser l'implémentation, tester, documenter.

### 📋 Tâches

#### 6.1 Tests Exhaustifs (1h)

**Tests unitaires** :
- [ ] Tests validation env/univers/tenant
- [ ] Tests génération identifiants
- [ ] Tests validation invariants

**Tests d'intégration** :
- [ ] `platform up core` → OK
- [ ] `app up odoo lab core` → OK
- [ ] `app up odoo stinger core` → OK
- [ ] `app up odoo prod core` → OK
- [ ] `token issue odoo lab core` → OK
- [ ] Validation rejet env invalide (E01)
- [ ] Validation rejet `latest` en STINGER (E02)
- [ ] Validation rejet app up si platform down (E04)

---

#### 6.2 Migration LAB (1h)

**Action** : Migrer Odoo LAB existant vers orchestrateur

**Actions** :
- [ ] Arrêter Odoo LAB actuel (docker-compose.lab.yml)
- [ ] Utiliser `dorevia.sh app up odoo lab core`
- [ ] Vérifier migration données (volumes)
- [ ] Tester intégration

---

#### 6.3 Documentation (30min)

**Documents à créer/mettre à jour** :
- [ ] Guide utilisateur `dorevia.sh`
- [ ] Guide migration
- [ ] Exemples d'utilisation
- [ ] Mise à jour README principal

---

#### 6.4 Validation Critères d'Acceptation (30min)

**SPEC CORE Tenant** :
- [ ] URLs HTTPS opérationnelles (LAB, STINGER, PROD)
- [ ] Isolation données complète
- [ ] Tokens DVIG conformes
- [ ] Versions taggées

**SPEC dorevia.sh** :
- [ ] `platform up core` → OK
- [ ] `app up odoo lab core` → OK
- [ ] `app up odoo stinger core` → OK
- [ ] `app up odoo prod core` → OK
- [ ] `token issue odoo stinger core` → OK
- [ ] Rejet env invalide (E01)
- [ ] Rejet `latest` en STINGER/PROD (E02)

---

### ✅ Critères d'Acceptation Phase 6

- [ ] Tous les tests passent (100%)
- [ ] Migration LAB réussie
- [ ] Documentation complète
- [ ] Critères d'acceptation SPEC validés

---

## 📊 Matrice de Dépendances

```
Phase 0 (Corrections)
  ↓
Phase 1 (Infrastructure)
  ↓
Phase 2 (Structure orchestrateur)
  ↓
Phase 3 (Commandes platform)
  ↓
Phase 4 (Commandes app)
  ↓
Phase 5 (Commandes token)
  ↓
Phase 6 (Finalisation)
```

**Règles** :
- Phase N dépend de Phase N-1
- Phase 3, 4, 5 peuvent être développées en parallèle (après Phase 2)
- Phase 6 nécessite toutes les phases précédentes

---

## 🎯 Priorisation & Parallélisation

### Ordre Séquentiel (Recommandé)

1. **Phase 0** → **Phase 1** → **Phase 2** (fondations)
2. **Phase 3** → **Phase 4** → **Phase 5** (orchestrateur)
3. **Phase 6** (finalisation)

### Parallélisation Possible

**Après Phase 2** :
- Phase 3 (`platform`) et Phase 4 (`app`) peuvent être développées en parallèle
- Phase 5 (`token`) peut être développée en parallèle de Phase 4

**Contraintes** :
- Phase 4 nécessite Phase 3 (vérification platform up)
- Phase 6 nécessite toutes les phases

---

## ⚠️ Risques & Mitigation

### Risques Identifiés

1. **Breaking Changes Tokens** :
   - ⚠️ Tous les tokens actuels deviennent invalides
   - **Mitigation** : Phase 0 régénère tokens avant migration

2. **Services Partagés** :
   - ⚠️ Un changement DVIG/Vault impacte tous les environnements
   - **Mitigation** : Tests exhaustifs Phase 1, validation Phase 6

3. **Complexité Orchestrateur** :
   - ⚠️ Script bash peut devenir complexe
   - **Mitigation** : Structure modulaire, tests unitaires

4. **Migration Données** :
   - ⚠️ Migration LAB : volumes existants
   - **Mitigation** : Phase 6 migration progressive

---

## 📝 Checklist Globale

### Pré-Implémentation

- [ ] Valider approche avec équipe
- [ ] Créer plan de rollback
- [ ] Backup données existantes

### Implémentation

- [ ] Phase 0 : Corrections critiques
- [ ] Phase 1 : Infrastructure services partagés
- [ ] Phase 2 : Structure orchestrateur
- [ ] Phase 3 : Commandes platform
- [ ] Phase 4 : Commandes app
- [ ] Phase 5 : Commandes token
- [ ] Phase 6 : Finalisation

### Post-Implémentation

- [ ] Validation critères d'acceptation
- [ ] Documentation complète
- [ ] Formation équipe
- [ ] Suppression anciennes configurations

---

## 🎯 Conclusion

### Bénéfices du Plan Unifié

1. ✅ **Cohérence** : Une seule source de vérité
2. ✅ **Progression logique** : Fondations → Infrastructure → Orchestrateur → Applications
3. ✅ **Réutilisation** : Orchestrateur utilise infrastructure existante
4. ✅ **Validation** : Critères d'acceptation des deux SPEC intégrés

### Prochaines Étapes

1. **Valider plan** avec équipe
2. **Démarrer Phase 0** (corrections critiques)
3. **Exécuter phases séquentiellement**
4. **Valider critères d'acceptation** à chaque phase

---

**Dernière mise à jour** : 2025-01-28

