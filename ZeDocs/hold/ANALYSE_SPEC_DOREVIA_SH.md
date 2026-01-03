# 🔍 Analyse SPEC `dorevia.sh` - Orchestrateur de Plateforme

**Date** : 2025-01-28  
**SPEC Analysée** : SPEC — `dorevia.sh` — Orchestrateur de Plateforme (tenant / univers / env) v1.0  
**Statut** : Analyse complète des impacts et plan d'implémentation

---

## 📋 Résumé Exécutif

### Objectif de `dorevia.sh`

`dorevia.sh` est un **orchestrateur CLI** qui rend exécutable la logique contractuelle définie dans :
- SPEC Plateforme CORE + Odoo LAB/STINGER/PROD v1.0
- Clarification Contractuelle Tenant / Univers / Source v1.0

**Rôle principal** : Prévenir les erreurs humaines en :
- Générant automatiquement les identités (`source`), DB names, volumes, compose project names
- Appliquant les invariants de conformité
- Orchestrant les déploiements de façon reproductible
- Gérant la génération/rotation des tokens DVIG

### Changements Majeurs Requis

1. **Structure de répertoires** : Nouvelle arborescence `tenants/<tenant>/`
2. **Orchestration centralisée** : CLI unique pour platform + apps
3. **Génération déterministe** : Identifiants calculés automatiquement
4. **Gestion tokens** : Intégration dans CLI (au lieu de script séparé)
5. **Validation invariants** : Refus automatique des violations

---

## 1. Analyse de l'Architecture Actuelle vs Cible

### 1.1 Structure de Répertoires

#### Actuel

```
dorevia-platform/
  sources/
    dvig/
      docker/
        docker-compose.yml
        docker-compose.prod.yml
      conf/
        tokens.yml
    vault/
  units/
    odoo/
      docker-compose.lab.yml
      docker-compose.prod.yml
      conf/
        odoo.lab.conf
    gateway/
      docker-compose.yml
      Caddyfile
  ZeDocs/
```

**Problèmes** :
- ❌ Pas de structure par tenant
- ❌ Configuration dispersée
- ❌ Pas de gestion centralisée des secrets
- ❌ Pas de validation automatique des invariants

#### Cible (SPEC)

```
dorevia-platform/
  bin/
    dorevia.sh                    # ⚠️ NOUVEAU
  tenants/
    <tenant>/                     # ⚠️ NOUVEAU
      platform/                   # compose + conf services partagés
      apps/
        odoo/
          lab/
          stinger/
          prod/
      secrets/
        dvig.tokens.yml           # ⚠️ Déplacé ici
      state/
        manifest.json             # état calculé
  sources/                        # ✅ Conservé
  units/                          # ✅ Conservé (références)
  ZeDocs/                         # ✅ Conservé
```

**Bénéfices** :
- ✅ Structure claire par tenant
- ✅ Secrets isolés par tenant
- ✅ Configuration centralisée
- ✅ État calculé traçable

---

### 1.2 Orchestration Actuelle vs Cible

#### Actuel

**Commandes manuelles** :
```bash
# DVIG LAB
cd sources/dvig/docker
docker compose -f docker-compose.yml up -d

# Odoo LAB
cd units/odoo
docker compose -f docker-compose.lab.yml up -d

# Tokens
python -m dvig.cli.token_gen --tenant rehtse --univers odoo
```

**Problèmes** :
- ❌ Pas de validation des invariants
- ❌ Pas de génération automatique des identifiants
- ❌ Risque d'erreurs humaines (mauvais tenant, source incorrecte)
- ❌ Pas de vérification des dépendances (platform up avant app)

#### Cible (SPEC)

**Commandes unifiées** :
```bash
# Platform (services partagés)
dorevia.sh platform up core
dorevia.sh platform status core

# Apps (applications)
dorevia.sh app up odoo lab core
dorevia.sh app up odoo stinger core
dorevia.sh app up odoo prod core

# Tokens
dorevia.sh token issue odoo lab core
dorevia.sh token list core
dorevia.sh token revoke core tok_lab_core_001
```

**Bénéfices** :
- ✅ Validation automatique des invariants
- ✅ Génération déterministe des identifiants
- ✅ Vérification des dépendances
- ✅ Interface unifiée et cohérente

---

## 2. Analyse des Invariants

### 2.1 Invariants Contractuels

#### Actuel

**Validation manuelle** :
- ❌ Pas de validation automatique du format `source`
- ❌ Pas de vérification `tenant` source = `tenant` token
- ❌ Risque d'utiliser un env non autorisé

#### Cible (SPEC)

**Validation automatique** :
```bash
# ✅ Accepté
dorevia.sh app up odoo lab core    # source = odoo.lab.core

# ❌ Rejeté (E01)
dorevia.sh app up odoo prd core    # env invalide

# ❌ Rejeté (E02)
dorevia.sh token issue odoo lab rehtse  # tenant mismatch (doit être core)
```

**Codes d'erreur** :
- `E01` : paramètre invalide (env/univers/tenant)
- `E02` : invariant violé (source/token mismatch)
- `E03` : dépendance manquante (docker/compose)
- `E04` : platform down (tentative app up)
- `E05` : ressource occupée (collision noms/volumes)
- `E06` : opération destructive sans flag `--purge`

---

### 2.2 Invariants d'Isolation Odoo

#### Actuel

**Bases de données** :
- LAB : `core_lab` ✅
- STINGER : ❌ (supprimé)
- PROD : ⚠️ (configuré, non déployé)

**Volumes** :
- LAB : `odoo_db_lab_data`, `odoo_odoo_lab_data` ✅
- STINGER : ❌
- PROD : ⚠️

**Problèmes** :
- ❌ Nommage non déterministe (`core_lab` vs `odoo_lab_core`)
- ❌ Pas de garantie d'isolation

#### Cible (SPEC)

**Bases de données déterministes** :
- LAB : `odoo_lab_core` ✅
- STINGER : `odoo_stinger_core` ✅
- PROD : `odoo_prod_core` ✅

**Volumes déterministes** :
- LAB : `odoo_lab_core_data`, `odoo_lab_core_db` ✅
- STINGER : `odoo_stinger_core_data`, `odoo_stinger_core_db` ✅
- PROD : `odoo_prod_core_data`, `odoo_prod_core_db` ✅

**Compose project names déterministes** :
- Platform : `dorevia_platform_core` ✅
- App LAB : `dorevia_odoo_lab_core` ✅
- App STINGER : `dorevia_odoo_stinger_core` ✅
- App PROD : `dorevia_odoo_prod_core` ✅

**Garanties** :
- ✅ Zéro collision
- ✅ Isolation complète
- ✅ Nommage lisible et diffable

---

### 2.3 Invariants de Sécurité

#### Actuel

**Versions d'images** :
- LAB : `dorevia/dvig:0.1.0` (tag OK) ✅
- STINGER : ❌ (supprimé)
- PROD : ⚠️ (non déployé)

**Problèmes** :
- ❌ Pas de validation automatique des tags
- ❌ Risque d'utiliser `latest` en STINGER/PROD

#### Cible (SPEC)

**Règles par environnement** :
- **LAB** : autorise `dev`/`edge` (mais recommandé de tagger)
- **STINGER** : uniquement tags (ex: `dvig:0.1.2-auth`)
- **PROD** : uniquement tags + rollback possible

**Validation automatique** :
```bash
# ❌ Rejeté (E02)
dorevia.sh app up odoo stinger core --image odoo:latest

# ✅ Accepté
dorevia.sh app up odoo stinger core --image odoo:18.0
```

---

## 3. Analyse des Commandes CLI

### 3.1 Commandes Platform

#### `platform up <tenant>`

**Fonctionnalités** :
- Démarre Caddy + DVIG + Vault
- Dépendances (DB vault, volumes, networks)
- `COMPOSE_PROJECT_NAME` : `dorevia_platform_<tenant>`

**Impact** :
- ⚠️ Créer `tenants/<tenant>/platform/docker-compose.yml`
- ⚠️ Générer configuration Caddy dynamique
- ⚠️ Vérifier dépendances (docker, compose)

**Fichiers à créer** :
- `tenants/core/platform/docker-compose.yml`
- `tenants/core/platform/caddy/Caddyfile` (généré)

---

#### `platform status <tenant>`

**Fonctionnalités** :
- Affiche conteneurs up/down
- Health checks
- Versions (tags) des images
- Chemins volumes

**Impact** :
- ⚠️ Parser `docker compose ps`
- ⚠️ Extraire tags d'images
- ⚠️ Vérifier health checks

---

#### `platform down <tenant>`

**Fonctionnalités** :
- Stoppe services partagés
- Sans destruction données par défaut

**Impact** :
- ✅ Simple wrapper `docker compose down`

---

#### `platform destroy <tenant>`

**Fonctionnalités** :
- Destruction contrôlée
- Suppression volumes (flag `--purge`)
- Suppression secrets (flag `--purge-secrets`)

**Impact** :
- ⚠️ Validation flag `--purge` (E06 si absent)
- ⚠️ Suppression sécurisée des secrets

---

### 3.2 Commandes App

#### `app up <univers> <env> <tenant>`

**Fonctionnalités** :
- Pré-conditions : `platform status <tenant>` OK
- Génère/valide `source` = `<univers>.<env>.<tenant>`
- Assure existence secrets/config (`.env`, odoo.conf)
- Démarre Postgres Odoo + Odoo + volumes dédiés

**Invariants** :
- DB name : `odoo_<env>_<tenant>`
- Volumes : `odoo_<env>_<tenant>_data`, `odoo_<env>_<tenant>_db`
- Compose project name : `dorevia_<univers>_<env>_<tenant>`

**Impact** :
- ⚠️ Validation env ∈ `{lab, stinger, prod}` (E01 si invalide)
- ⚠️ Validation univers (E01 si invalide)
- ⚠️ Vérification platform up (E04 si down)
- ⚠️ Génération automatique `source`
- ⚠️ Création secrets/config si absents
- ⚠️ Génération `docker-compose.yml` avec identifiants déterministes

**Fichiers à créer** :
- `tenants/core/apps/odoo/lab/docker-compose.yml` (généré)
- `tenants/core/apps/odoo/lab/.env` (généré)
- `tenants/core/apps/odoo/lab/odoo.conf` (généré)

---

#### `app status <univers> <env> <tenant>`

**Fonctionnalités** :
- Affiche containers + ports internes
- DB name / volumes
- Source attendue
- URL attendue `https://<univers>.<env>.<tenant>.doreviateam.com`

**Impact** :
- ⚠️ Parser `docker compose ps`
- ⚠️ Extraire DB name depuis config
- ⚠️ Générer URL attendue

---

#### `app down <univers> <env> <tenant>`

**Fonctionnalités** :
- Stoppe l'app (sans purge données)

**Impact** :
- ✅ Simple wrapper `docker compose down`

---

#### `app reset <univers> <env> <tenant>`

**Fonctionnalités** :
- Reset contrôlé (démo/dev)
- Stop app
- Drop DB + filestore (flag `--purge`)
- Import dataset démo `--demo <profile>` (optionnel)

**Impact** :
- ⚠️ Validation flag `--purge` (E06 si absent)
- ⚠️ Drop DB PostgreSQL
- ⚠️ Suppression filestore
- ⚠️ Import dataset (si `--demo`)

---

#### `app destroy <univers> <env> <tenant>`

**Fonctionnalités** :
- Suppression containers/networks
- Purge volumes si flag `--purge`

**Impact** :
- ⚠️ Validation flag `--purge` (E06 si absent)
- ⚠️ Suppression volumes

---

### 3.3 Commandes Token

#### `token issue <univers> <env> <tenant>`

**Fonctionnalités** :
- Crée token DVIG compatible avec invariants
- `tenant=<tenant>`
- `univers=<univers>`
- `source` attendue : `<univers>.<env>.<tenant>`

**Stockage** :
- Écrit dans `tenants/<tenant>/secrets/dvig.tokens.yml`

**Sorties** :
- Token clair (affiché une seule fois) + token_id
- Rappel de la source associée

**Impact** :
- ⚠️ Réutiliser `dvig.cli.token_gen` (existant)
- ⚠️ Validation invariants (tenant, univers)
- ⚠️ Génération `source` automatique
- ⚠️ Écriture dans `tenants/<tenant>/secrets/dvig.tokens.yml`
- ⚠️ Affichage sécurisé (une seule fois)

**Fichiers à créer** :
- `tenants/core/secrets/dvig.tokens.yml` (généré)

---

#### `token list <tenant>`

**Fonctionnalités** :
- Liste tokens (id, univers, status, created_at, last_used_at si dispo)

**Impact** :
- ⚠️ Parser `tenants/<tenant>/secrets/dvig.tokens.yml`
- ⚠️ Afficher tableau formaté

---

#### `token revoke <tenant> <token_id>`

**Fonctionnalités** :
- Désactive token (status=revoked)
- Déclenche reload DVIG si supporté

**Impact** :
- ⚠️ Modifier `dvig.tokens.yml` (status=revoked)
- ⚠️ Envoyer SIGHUP à DVIG (si supporté)

---

#### `token rotate <univers> <env> <tenant>`

**Fonctionnalités** :
- Alias sécurisé
- Issue nouveau token
- Revoke ancien (optionnel `--revoke-old`)

**Impact** :
- ⚠️ Appeler `token issue`
- ⚠️ Appeler `token revoke` (si `--revoke-old`)

---

## 4. Génération des Identifiants (Déterministe)

### 4.1 Compose Project Names

#### Actuel

**Non déterministe** :
- DVIG : `dvig-dev` (container name)
- Odoo LAB : `odoo-odoo-1` (auto-généré par compose)

**Problèmes** :
- ❌ Pas de contrôle sur les noms
- ❌ Risque de collision

#### Cible (SPEC)

**Déterministe** :
- Platform : `dorevia_platform_<tenant>`
- App : `dorevia_<univers>_<env>_<tenant>`

**Exemples** :
- Platform : `dorevia_platform_core`
- Odoo LAB : `dorevia_odoo_lab_core`
- Odoo STINGER : `dorevia_odoo_stinger_core`
- Odoo PROD : `dorevia_odoo_prod_core`

**Implémentation** :
```bash
# Dans docker-compose.yml
services:
  odoo:
    container_name: "odoo_${ENV}_${TENANT}"
    # ...
```

---

### 4.2 DB Names

#### Actuel

**Non déterministe** :
- LAB : `core_lab` ✅ (mais pas conforme pattern)

#### Cible (SPEC)

**Déterministe** :
- Odoo : `odoo_<env>_<tenant>`

**Exemples** :
- LAB : `odoo_lab_core`
- STINGER : `odoo_stinger_core`
- PROD : `odoo_prod_core`

**Impact** :
- ⚠️ Migration LAB : `core_lab` → `odoo_lab_core` (optionnel)
- ⚠️ Mettre à jour `dbfilter` dans `odoo.conf`

---

### 4.3 Volumes

#### Actuel

**Non déterministe** :
- LAB : `odoo_db_lab_data`, `odoo_odoo_lab_data` ✅ (proche)

#### Cible (SPEC)

**Déterministe** :
- Odoo data : `odoo_<env>_<tenant>_data`
- Odoo db : `odoo_<env>_<tenant>_db`

**Exemples** :
- LAB : `odoo_lab_core_data`, `odoo_lab_core_db`
- STINGER : `odoo_stinger_core_data`, `odoo_stinger_core_db`
- PROD : `odoo_prod_core_data`, `odoo_prod_core_db`

**Impact** :
- ⚠️ Migration LAB : renommer volumes (optionnel)
- ⚠️ Générer volumes dans `docker-compose.yml`

---

## 5. Gestion des Ports

### 5.1 Principe Normatif

#### Actuel

**Ports exposés** :
- DVIG LAB : `18120:8080` ✅
- Odoo LAB : `18069:8069` ✅
- Odoo PROD : `38069:8069` ⚠️ (configuré, non déployé)

**Problèmes** :
- ❌ Ports exposés sur hôte (sécurité)
- ❌ Pas de routage via Caddy uniquement

#### Cible (SPEC)

**STINGER/PROD** :
- ❌ Aucun port hôte exposé
- ✅ DNS via Caddy uniquement

**LAB** :
- ⚠️ Mode "dev" peut exposer ports (flag `--dev-ports`)
- ✅ Par défaut : pas de ports exposés

**Impact** :
- ⚠️ Supprimer ports exposés dans `docker-compose.yml` (STINGER/PROD)
- ⚠️ Option `--dev-ports` pour LAB
- ⚠️ Calcul déterministe ports (si `--dev-ports`)

---

## 6. Gestion des Versions (Images/Tagging)

### 6.1 Règles par Environnement

#### Actuel

**Pas de validation** :
- ❌ Risque d'utiliser `latest` en STINGER/PROD

#### Cible (SPEC)

**Validation automatique** :
- **LAB** : autorise `dev`/`edge` (mais recommandé de tagger)
- **STINGER** : uniquement tags (rejet `latest`)
- **PROD** : uniquement tags + rollback possible

**Implémentation** :
```bash
# Validation dans dorevia.sh
if [[ "$env" == "stinger" || "$env" == "prod" ]]; then
  if [[ "$image" == *":latest" ]]; then
    echo "E02: STINGER/PROD ne peut pas utiliser 'latest'" >&2
    exit 2
  fi
fi
```

---

## 7. Plan d'Implémentation

### Phase 1 : Structure de Répertoires (1-2h)

#### 1.1 Créer Arborescence

```bash
mkdir -p bin
mkdir -p tenants/core/{platform,apps/odoo/{lab,stinger,prod},secrets,state}
```

#### 1.2 Déplacer/Adapter Fichiers

- [ ] Créer `bin/dorevia.sh` (squelette)
- [ ] Créer `tenants/core/platform/` (compose services partagés)
- [ ] Créer `tenants/core/apps/odoo/lab/` (compose Odoo LAB)
- [ ] Créer `tenants/core/secrets/` (tokens)
- [ ] Créer `.gitignore` pour `tenants/*/secrets/`

---

### Phase 2 : Commandes Platform (3-4h)

#### 2.1 `platform up <tenant>`

- [ ] Validation tenant (slug DNS)
- [ ] Génération `docker-compose.yml` (Caddy + DVIG + Vault)
- [ ] Génération `Caddyfile` dynamique
- [ ] Vérification dépendances (docker, compose)
- [ ] Démarrage services
- [ ] Affichage status + URLs

#### 2.2 `platform status <tenant>`

- [ ] Parser `docker compose ps`
- [ ] Extraire tags d'images
- [ ] Vérifier health checks
- [ ] Afficher tableau formaté

#### 2.3 `platform down <tenant>`

- [ ] Wrapper `docker compose down`

#### 2.4 `platform destroy <tenant>`

- [ ] Validation flag `--purge`
- [ ] Suppression volumes (si `--purge`)
- [ ] Suppression secrets (si `--purge-secrets`)

---

### Phase 3 : Commandes App (4-5h)

#### 3.1 `app up <univers> <env> <tenant>`

- [ ] Validation env ∈ `{lab, stinger, prod}` (E01)
- [ ] Validation univers (E01)
- [ ] Vérification platform up (E04)
- [ ] Génération `source` = `<univers>.<env>.<tenant>`
- [ ] Génération identifiants déterministes :
  - DB name : `odoo_<env>_<tenant>`
  - Volumes : `odoo_<env>_<tenant>_data`, `odoo_<env>_<tenant>_db`
  - Compose project : `dorevia_<univers>_<env>_<tenant>`
- [ ] Génération `docker-compose.yml` avec identifiants
- [ ] Génération `.env` (si absent)
- [ ] Génération `odoo.conf` (si absent)
- [ ] Validation version image (E02 si `latest` en STINGER/PROD)
- [ ] Démarrage services

#### 3.2 `app status <univers> <env> <tenant>`

- [ ] Parser `docker compose ps`
- [ ] Extraire DB name depuis config
- [ ] Générer URL attendue
- [ ] Afficher tableau formaté

#### 3.3 `app down <univers> <env> <tenant>`

- [ ] Wrapper `docker compose down`

#### 3.4 `app reset <univers> <env> <tenant>`

- [ ] Validation flag `--purge` (E06)
- [ ] Stop app
- [ ] Drop DB PostgreSQL
- [ ] Suppression filestore
- [ ] Import dataset (si `--demo`)

#### 3.5 `app destroy <univers> <env> <tenant>`

- [ ] Validation flag `--purge` (E06)
- [ ] Suppression containers/networks
- [ ] Suppression volumes (si `--purge`)

---

### Phase 4 : Commandes Token (2-3h)

#### 4.1 `token issue <univers> <env> <tenant>`

- [ ] Validation invariants (tenant, univers)
- [ ] Génération `source` automatique
- [ ] Réutiliser `dvig.cli.token_gen`
- [ ] Écriture dans `tenants/<tenant>/secrets/dvig.tokens.yml`
- [ ] Affichage sécurisé (une seule fois)

#### 4.2 `token list <tenant>`

- [ ] Parser `tenants/<tenant>/secrets/dvig.tokens.yml`
- [ ] Afficher tableau formaté

#### 4.3 `token revoke <tenant> <token_id>`

- [ ] Modifier `dvig.tokens.yml` (status=revoked)
- [ ] Envoyer SIGHUP à DVIG (si supporté)

#### 4.4 `token rotate <univers> <env> <tenant>`

- [ ] Appeler `token issue`
- [ ] Appeler `token revoke` (si `--revoke-old`)

---

### Phase 5 : Commandes Utilitaires (1-2h)

#### 5.1 `help`

- [ ] Afficher aide complète

#### 5.2 `version`

- [ ] Afficher version `dorevia.sh`

#### 5.3 `doctor`

- [ ] Vérifier docker installé
- [ ] Vérifier compose installé
- [ ] Vérifier droits
- [ ] Vérifier fichiers essentiels
- [ ] Vérifier DNS local (optionnel)

---

### Phase 6 : Tests & Validation (2-3h)

#### 6.1 Tests Unitaires

- [ ] Tests validation env/univers/tenant
- [ ] Tests génération identifiants
- [ ] Tests validation invariants

#### 6.2 Tests d'Intégration

- [ ] `platform up core` → OK
- [ ] `app up odoo lab core` → OK
- [ ] `app up odoo stinger core` → OK
- [ ] `app up odoo prod core` → OK
- [ ] `token issue odoo lab core` → OK
- [ ] Validation rejet env invalide (E01)
- [ ] Validation rejet `latest` en STINGER (E02)
- [ ] Validation rejet app up si platform down (E04)

---

## 8. Fichiers à Créer/Modifier

### 8.1 Nouveaux Fichiers

1. **`bin/dorevia.sh`** (NOUVEAU)
   - Script principal CLI
   - Commandes platform/app/token
   - Validation invariants

2. **`tenants/core/platform/docker-compose.yml`** (NOUVEAU)
   - Services partagés (Caddy + DVIG + Vault)
   - Compose project : `dorevia_platform_core`

3. **`tenants/core/platform/caddy/Caddyfile`** (GÉNÉRÉ)
   - Configuration Caddy dynamique
   - Routage vers services

4. **`tenants/core/apps/odoo/lab/docker-compose.yml`** (GÉNÉRÉ)
   - Odoo LAB avec identifiants déterministes
   - Compose project : `dorevia_odoo_lab_core`

5. **`tenants/core/apps/odoo/lab/.env`** (GÉNÉRÉ)
   - Variables d'environnement Odoo LAB

6. **`tenants/core/apps/odoo/lab/odoo.conf`** (GÉNÉRÉ)
   - Configuration Odoo LAB
   - `dbfilter = ^odoo_lab_core$`

7. **`tenants/core/secrets/dvig.tokens.yml`** (GÉNÉRÉ)
   - Tokens DVIG (déplacé depuis `sources/dvig/conf/`)

8. **`tenants/core/state/manifest.json`** (GÉNÉRÉ)
   - État calculé (ports internes, versions, etc.)

9. **`.gitignore`** (MODIFIÉ)
   - Ajouter `tenants/*/secrets/`
   - Ajouter `tenants/*/state/` (optionnel)

---

### 8.2 Fichiers à Modifier

1. **`sources/dvig/dvig/cli/token_gen.py`** (MODIFIÉ)
   - Adapter pour accepter `source` en paramètre
   - Adapter pour écrire dans `tenants/<tenant>/secrets/dvig.tokens.yml`

2. **`units/gateway/Caddyfile`** (MODIFIÉ)
   - Peut être généré dynamiquement par `dorevia.sh`

---

### 8.3 Fichiers à Supprimer (Optionnel)

1. **`sources/dvig/docker/docker-compose.yml`** (Remplacé)
   - Remplacé par `tenants/core/platform/docker-compose.yml`

2. **`units/odoo/docker-compose.lab.yml`** (Remplacé)
   - Remplacé par `tenants/core/apps/odoo/lab/docker-compose.yml`

---

## 9. Estimation Globale

| Phase | Effort | Priorité |
|-------|--------|----------|
| **Phase 1 : Structure** | 1-2h | 🟡 Important |
| **Phase 2 : Platform** | 3-4h | 🔴 Critique |
| **Phase 3 : App** | 4-5h | 🔴 Critique |
| **Phase 4 : Token** | 2-3h | 🟡 Important |
| **Phase 5 : Utilitaires** | 1-2h | 🟢 Faible |
| **Phase 6 : Tests** | 2-3h | 🟡 Important |
| **TOTAL** | **13-19h** | - |

---

## 10. Critères d'Acceptation (SPEC)

### 10.1 Checklist

- [ ] `platform up core` démarre Caddy + DVIG + Vault, et `platform status core` est OK
- [ ] `app up odoo lab core` démarre Odoo LAB avec DB+filestore dédiés
- [ ] `app up odoo stinger core` démarre Odoo STINGER avec DB+filestore dédiés
- [ ] `app up odoo prod core` démarre Odoo PROD avec DB+filestore dédiés
- [ ] `token issue odoo stinger core` produit un token et écrit dans `tenants/core/secrets/dvig.tokens.yml`
- [ ] `token issue odoo prod core` produit un token différent; un token lab ne passe pas sur une requête source prod (validation DVIG)
- [ ] Toute tentative d'utiliser un env non autorisé (ex: `prd`) échoue avec `E01`
- [ ] Toute tentative de déployer STINGER/PROD avec image `latest` échoue avec `E02`

---

## 11. Risques & Mitigation

### 11.1 Risques

1. **Migration Données** :
   - ⚠️ Migration LAB : `core_lab` → `odoo_lab_core` (optionnel)
   - ⚠️ Migration volumes : renommer volumes existants

2. **Breaking Changes** :
   - ⚠️ Structure de répertoires change
   - ⚠️ Commandes manuelles remplacées par CLI

3. **Complexité** :
   - ⚠️ Script bash peut devenir complexe
   - ⚠️ Gestion erreurs et codes d'erreur

### 11.2 Mitigation

1. **Migration Progressive** :
   - Phase 1 : Créer structure sans casser existant
   - Phase 2 : Migrer progressivement
   - Phase 3 : Supprimer ancien (optionnel)

2. **Tests Exhaustifs** :
   - Tests unitaires validation
   - Tests d'intégration
   - Tests de non-régression

3. **Documentation** :
   - Guide migration
   - Guide utilisateur CLI
   - Exemples d'utilisation

---

## 12. Conclusion

### État Actuel vs Cible

| Aspect | Actuel | Cible |
|--------|--------|-------|
| **Structure** | Dispersée | Centralisée par tenant |
| **Orchestration** | Manuelle | CLI unifiée |
| **Validation** | Manuelle | Automatique |
| **Identifiants** | Non déterministes | Déterministes |
| **Tokens** | Script séparé | Intégré CLI |
| **Sécurité** | Risque erreurs | Invariants garantis |

### Bénéfices Attendus

1. ✅ **Réduction erreurs humaines** : Validation automatique invariants
2. ✅ **Reproductibilité** : Génération déterministe identifiants
3. ✅ **Maintenabilité** : Structure claire et centralisée
4. ✅ **Sécurité** : Validation versions, isolation garantie
5. ✅ **Productivité** : Interface unifiée et cohérente

### Prochaines Étapes

1. **Valider approche** avec équipe
2. **Créer structure** de répertoires
3. **Implémenter commandes** platform (Phase 2)
4. **Implémenter commandes** app (Phase 3)
5. **Implémenter commandes** token (Phase 4)
6. **Tests & validation** (Phase 6)

---

**Dernière mise à jour** : 2025-01-28

