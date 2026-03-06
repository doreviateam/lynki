# 🔍 Analyse d'Impact — DVIG/Vault par Environnement (Tenant `core`)

**Date** : 2026-01-08  
**Décision** : Modifier la plateforme pour supporter DVIG/Vault par environnement pour le tenant `core`  
**Impact** : 🔴 **MAJEUR** — Changement architectural fondamental  
**Statut** : 📋 **À valider**

---

## 📌 Résumé Exécutif

**Décision** : Implémenter des instances DVIG/Vault séparées par environnement (LAB, STINGER, PROD) pour le tenant **`core`** uniquement.

**Impact sur l'architecture actuelle** : 
- **Changement fondamental** : Passage de 1 instance partagée à 3 instances séparées (tenant `core`)
- **Modifications code** : Scripts de génération, CLI, gateway
- **Migration données** : Bases de données, volumes, tokens
- **Changements DNS** : 6 nouveaux enregistrements (au lieu de 2)
- **Ressources** : 3x plus de containers, volumes, bases de données (tenant `core`)

**Périmètre** : 
- **Tenant concerné** : `core` uniquement
- **Autres tenants** : Conservent l'architecture v2.0 (DVIG/Vault partagés)

---

## 🎯 Contexte et Motivation

### Pourquoi cette modification ?

**Besoin métier** :
- Les clients PROD vontulteront vers `dvig.prod.core.doreviateam.com`
- Les clients STINGER doivent allerulter vers `dvig.stinger.core.doreviateam.com` (isolation complète)
- Les tests STINGER ne doivent **jamais** affecter les données PROD

**Isolation requise** :
- Données Vault complètement séparées entre LAB/STINGER/PROD
- Tokens DVIG séparés par environnement
- Hostnames explicites avec environnement

---

## 📊 Impact sur l'Architecture Actuelle

### Vue d'ensemble : AVANT vs APRÈS

#### Architecture Actuelle (v2.0) — Tenant `core`

```
┌─────────────────────────────────────────────────┐
│ Tenant: core                                     │
│                                                  │
│ Platform (partagé entre LAB/STINGER/PROD) :    │
│   ┌─────────────┐                               │
│   │ dvig-core   │ ← Partagé par tous les envs  │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault-core  │ ← Partagé par tous les envs  │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault-db-   │ ← Base: dorevia_vault         │
│   │   core      │    (partagée)                 │
│   └─────────────┘                               │
│                                                  │
│ Hostnames :                                      │
│   - dvig.core.doreviateam.com                    │
│   - vault.core.doreviateam.com                   │
│                                                  │
│ Containers :                                     │
│   - dvig-core (1 seul)                           │
│   - vault-core (1 seul)                          │
│   - vault-db-core (1 seul)                       │
│                                                  │
│ Volumes :                                        │
│   - vault_db_core_data (1 seul, partagé)         │
│   - vault_storage_core (1 seul, partagé)        │
│                                                  │
│ Tokens :                                         │
│   - tenants/core/secrets/dvig.tokens.yml         │
│     (contient tokens LAB + STINGER + PROD)       │
└─────────────────────────────────────────────────┘
```

#### Architecture Cible — Tenant `core`

```
┌─────────────────────────────────────────────────┐
│ Tenant: core                                     │
│                                                  │
│ Platform LAB :                                   │
│   ┌─────────────┐                               │
│   │ dvig_lab_   │ ← Instance dédiée LAB         │
│   │   core      │                               │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault_lab_  │ ← Instance dédiée LAB          │
│   │   core      │                               │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault_db_   │ ← Base: dorevia_vault_lab     │
│   │   lab_core  │                               │
│   └─────────────┘                               │
│                                                  │
│ Platform STINGER :                               │
│   ┌─────────────┐                               │
│   │ dvig_stinger│ ← Instance dédiée STINGER     │
│   │   _core     │                               │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault_stinger│ ← Instance dédiée STINGER    │
│   │   _core     │                               │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault_db_   │ ← Base: dorevia_vault_stinger  │
│   │   stinger_ │                               │
│   │   core      │                               │
│   └─────────────┘                               │
│                                                  │
│ Platform PROD :                                  │
│   ┌─────────────┐                               │
│   │ dvig_prod_  │ ← Instance dédiée PROD        │
│   │   core      │                               │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault_prod_ │ ← Instance dédiée PROD         │
│   │   core      │                               │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault_db_   │ ← Base: dorevia_vault_prod    │
│   │   prod_core │                               │
│   └─────────────┘                               │
│                                                  │
│ Hostnames :                                      │
│   - dvig.lab.core.doreviateam.com                │
│   - dvig.stinger.core.doreviateam.com            │
│   - dvig.prod.core.doreviateam.com                │
│   - vault.lab.core.doreviateam.com               │
│   - vault.stinger.core.doreviateam.com           │
│   - vault.prod.core.doreviateam.com               │
│                                                  │
│ Containers :                                     │
│   - dvig_lab_core, dvig_stinger_core,            │
│     dvig_prod_core (3 containers)                │
│   - vault_lab_core, vault_stinger_core,          │
│     vault_prod_core (3 containers)               │
│   - vault_db_lab_core, vault_db_stinger_core,    │
│     vault_db_prod_core (3 containers)            │
│                                                  │
│ Volumes :                                        │
│   - vault_db_lab_core_data                       │
│   - vault_db_stinger_core_data                   │
│   - vault_db_prod_core_data                      │
│   - vault_storage_lab_core                       │
│   - vault_storage_stinger_core                   │
│   - vault_storage_prod_core                      │
│   - ... (3x plus de volumes)                     │
│                                                  │
│ Tokens :                                         │
│   - tenants/core/secrets/dvig.lab.tokens.yml     │
│   - tenants/core/secrets/dvig.stinger.tokens.yml │
│   - tenants/core/secrets/dvig.prod.tokens.yml    │
└─────────────────────────────────────────────────┘
```

### Comparaison quantitative

| Aspect | AVANT (v2.0) | APRÈS (cible) | Impact |
|--------|--------------|----------------|--------|
| **Containers DVIG** | 1 (`dvig-core`) | 3 (`dvig_lab_core`, `dvig_stinger_core`, `dvig_prod_core`) | **+200%** |
| **Containers Vault** | 1 (`vault-core`) | 3 (`vault_lab_core`, `vault_stinger_core`, `vault_prod_core`) | **+200%** |
| **Containers Vault DB** | 1 (`vault-db-core`) | 3 (`vault_db_lab_core`, `vault_db_stinger_core`, `vault_db_prod_core`) | **+200%** |
| **Bases de données Vault** | 1 (`dorevia_vault`) | 3 (`dorevia_vault_lab`, `dorevia_vault_stinger`, `dorevia_vault_prod`) | **+200%** |
| **Volumes Docker** | 5 volumes | 15 volumes | **+200%** |
| **Hostnames DNS** | 2 (`dvig.core`, `vault.core`) | 6 (`dvig.lab.core`, `dvig.stinger.core`, `dvig.prod.core`, etc.) | **+200%** |
| **Fichiers tokens** | 1 (`dvig.tokens.yml`) | 3 (`dvig.lab.tokens.yml`, `dvig.stinger.tokens.yml`, `dvig.prod.tokens.yml`) | **+200%** |
| **Ressources système** | 1x (RAM, CPU, disque) | 3x (RAM, CPU, disque) | **+200%** |

---

## 🔧 Impact Technique Détaillé

### 1. Scripts de Génération

#### 1.1 `lib/render/render_platform_compose.sh`

**État actuel** :
- Génère `docker-compose.yml` pour platform
- **Ne prend PAS** de paramètre `ENV`
- Génère dans `tenants/<tenant>/platform/docker-compose.yml`
- Containers : `dvig-<tenant>`, `vault-<tenant>` (sans environnement)

**Changements requis** :

```bash
# AVANT (signature actuelle)
render_platform_compose.sh <tenant>

# APRÈS (nouvelle signature)
render_platform_compose.sh <tenant> <env>
```

**Modifications code** :

```bash
# AVANT (ligne ~101)
container_name: dvig-$TENANT_ID

# APRÈS (pour tenant "core" uniquement)
if [[ "$TENANT_ID" == "core" ]]; then
  container_name: dvig_${ENV}_${TENANT_ID}
else
  container_name: dvig-${TENANT_ID}  # Autres tenants inchangés
fi
```

**Impact** :
- Ajout paramètre `ENV` dans la signature
- Logique conditionnelle pour tenant `core`
- Génération dans `tenants/<tenant>/rendered/<env>/platform/docker-compose.yml`
- Noms de containers, volumes, bases de données dépendent de l'environnement (tenant `core`)

**Fichier** : `lib/render/render_platform_compose.sh`

---

#### 1.2 `lib/render/render_caddyfile.sh`

**État actuel** :
- Génère Caddyfile avec hostnames DVIG/Vault **sans environnement**
- Hostnames : `dvig.<tenant>.doreviateam.com`
- Reverse proxy : `dvig-<tenant>:8080`

**Changements requis** :

```bash
# AVANT (ligne ~282)
canonical_dvig="dvig.${TENANT_ID}.${CANONICAL_DOMAIN}"

# APRÈS (pour tenant "core" uniquement)
if [[ "$TENANT_ID" == "core" ]]; then
  canonical_dvig="dvig.${ENV}.${TENANT_ID}.${CANONICAL_DOMAIN}"
else
  canonical_dvig="dvig.${TENANT_ID}.${CANONICAL_DOMAIN}"  # Autres tenants inchangés
fi
```

**Impact** :
- Hostnames DVIG/Vault incluent l'environnement (tenant `core`)
- Reverse proxy pointe vers containers avec environnement
- Chaque environnement génère ses propres blocs Caddyfile (tenant `core`)

**Fichier** : `lib/render/render_caddyfile.sh`

---

#### 1.3 `bin/dorevia.sh` — Commande `platform up`

**État actuel** :
```bash
# Signature actuelle
dorevia.sh platform up <tenant>

# Processus actuel
cmd_platform_up() {
  local tenant=$1
  # ...
  render_platform_compose.sh "$tenant"  # Pas de paramètre ENV
  # Génère dans tenants/<tenant>/platform/
}
```

**Changements requis** :

```bash
# Nouvelle signature
dorevia.sh platform up <tenant> <env>

# Nouveau processus
cmd_platform_up() {
  local tenant=$1
  local env=$2  # Nouveau paramètre obligatoire
  # ...
  render_platform_compose.sh "$tenant" "$env"
  # Génère dans tenants/<tenant>/rendered/<env>/platform/
}
```

**Impact** :
- **Breaking change** : Signature de commande modifiée
- Paramètre `env` devient obligatoire
- Génération dans répertoire différent (`rendered/<env>/platform/`)
- Compose project : `dorevia_<env>_<tenant>_platform` (au lieu de `dorevia_<tenant>_platform`)

**Fichier** : `bin/dorevia.sh` (fonction `cmd_platform_up`)

---

### 2. Gateway (Caddy)

#### 2.1 `bin/dorevia.sh` — Commande `gateway aggregate`

**État actuel** :
- Déduplique les hostnames DVIG/Vault (sans env)
- 1 seul bloc DVIG/Vault par tenant dans le Caddyfile global
- Logique : Si hostname déjà vu, ignorer

**Changements requis** :

**AVANT** :
```bash
# Ligne ~1288-1292 : Déduplication
declare -A hostnames_seen  # Pour déduplication hostnames DVIG/Vault (sans env)

# Pour chaque Caddyfile :
if [[ -n "${hostnames_seen[$hostname]}" ]]; then
  continue  # Ignorer si déjà vu
fi
hostnames_seen[$hostname]=1
```

**APRÈS** :
```bash
# Déduplication conditionnelle
declare -A hostnames_seen

# Pour chaque Caddyfile :
if [[ "$TENANT_ID" == "core" ]]; then
  # Pas de déduplication pour tenant "core" (hostnames différents par env)
  # Ajouter tous les blocs
else
  # Déduplication pour autres tenants (architecture v2.0)
  if [[ -n "${hostnames_seen[$hostname]}" ]]; then
    continue  # Ignorer si déjà vu
  fi
  hostnames_seen[$hostname]=1
fi
```

**Impact** :
- Le Caddyfile global contiendra :
  - **3 blocs DVIG/Vault pour `core`** (LAB, STINGER, PROD)
  - **1 bloc DVIG/Vault par autre tenant** (partagé, architecture v2.0)
- Logique de déduplication conditionnelle

**Fichier** : `bin/dorevia.sh` (fonction `cmd_gateway_aggregate`)

---

### 3. Volumes Docker

**État actuel (tenant `core`)** :
```
vault_db_core_data          (partagé entre LAB/STINGER/PROD)
vault_storage_core          (partagé)
vault_ledger_core           (partagé)
vault_audit_core            (partagé)
dvig_logs_core              (partagé)
```

**Après modification (tenant `core`)** :
```
vault_db_lab_core_data      (dédié LAB)
vault_db_stinger_core_data  (dédié STINGER)
vault_db_prod_core_data     (dédié PROD)
vault_storage_lab_core      (dédié LAB)
vault_storage_stinger_core  (dédié STINGER)
vault_storage_prod_core     (dédié PROD)
vault_ledger_lab_core       (dédié LAB)
vault_ledger_stinger_core   (dédié STINGER)
vault_ledger_prod_core      (dédié PROD)
vault_audit_lab_core        (dédié LAB)
vault_audit_stinger_core    (dédié STINGER)
vault_audit_prod_core       (dédié PROD)
dvig_logs_lab_core          (dédié LAB)
dvig_logs_stinger_core      (dédié STINGER)
dvig_logs_prod_core         (dédié PROD)
```

**Impact** :
- **Migration nécessaire** : Données existantes à migrer vers nouveaux volumes
- **3x plus de volumes** : 15 volumes au lieu de 5 (tenant `core`)
- **Isolation complète** : Aucun partage de données entre environnements
- **Autres tenants** : Aucun changement (conservent architecture v2.0)

---

### 4. Bases de Données

**État actuel (tenant `core`)** :
- Base Vault : `dorevia_vault` (1 seule, partagée entre LAB/STINGER/PROD)
- Container : `vault-db-core` (1 seul)

**Après modification (tenant `core`)** :
- Base Vault LAB : `dorevia_vault_lab` (container `vault_db_lab_core`)
- Base Vault STINGER : `dorevia_vault_stinger` (container `vault_db_stinger_core`)
- Base Vault PROD : `dorevia_vault_prod` (container `vault_db_prod_core`)

**Impact** :
- **Migration nécessaire** : Données existantes à migrer vers nouvelles bases
- **3x plus de bases de données** : 3 bases au lieu de 1 (tenant `core`)
- **3x plus de containers DB** : 3 containers au lieu de 1 (tenant `core`)
- **Isolation complète** : Aucun partage de données entre environnements
- **Autres tenants** : Aucun changement (conservent `dorevia_vault` partagée)

---

### 5. Tokens DVIG

**État actuel (tenant `core`)** :
- 1 fichier : `tenants/core/secrets/dvig.tokens.yml`
- Contient tokens pour LAB, STINGER, PROD (tous mélangés)
- Instance DVIG charge tous les tokens

**Après modification (tenant `core`)** :
- 3 fichiers :
  - `tenants/core/secrets/dvig.lab.tokens.yml` (tokens LAB uniquement)
  - `tenants/core/secrets/dvig.stinger.tokens.yml` (tokens STINGER uniquement)
  - `tenants/core/secrets/dvig.prod.tokens.yml` (tokens PROD uniquement)
- Chaque instance DVIG charge uniquement les tokens de son environnement

**Impact** :
- **Séparation nécessaire** : Extraire tokens par environnement depuis fichier actuel
- **Modification commande `token issue`** : Doit générer dans le bon fichier selon environnement
- **Isolation** : Tokens STINGER ne fonctionnent pas en PROD (et vice versa)
- **Autres tenants** : Aucun changement (conservent `dvig.tokens.yml` unique)

---

### 6. DNS

**État actuel (tenant `core`)** :
```
dvig.core.doreviateam.com        → IP serveur (85.215.206.213)
vault.core.doreviateam.com       → IP serveur (85.215.206.213)
```

**Après modification (tenant `core`)** :
```
dvig.lab.core.doreviateam.com    → IP serveur (85.215.206.213)
dvig.stinger.core.doreviateam.com → IP serveur (85.215.206.213)
dvig.prod.core.doreviateam.com   → IP serveur (85.215.206.213)
vault.lab.core.doreviateam.com   → IP serveur (85.215.206.213)
vault.stinger.core.doreviateam.com → IP serveur (85.215.206.213)
vault.prod.core.doreviateam.com  → IP serveur (85.215.206.213)
```

**Impact** :
- **Création** : 6 nouveaux enregistrements DNS (tenant `core`)
- **Suppression** : 2 anciens enregistrements (`dvig.core`, `vault.core`)
- **Migration DNS** : Fenêtre de maintenance nécessaire
- **Autres tenants** : Aucun changement DNS (conservent `dvig.<tenant>`, `vault.<tenant>`)

---

## 📋 Plan d'Implémentation

### Phase 1 : Préparation

1. **Valider décision architecturale**
2. **Créer branche de développement**
   ```bash
   git checkout -b feature/dvig-vault-per-env-core
   ```
3. **Planifier migration**
   - Identifier données à migrer
   - Prévoir fenêtre de maintenance
   - Prévoir rollback si nécessaire

---

### Phase 2 : Modifications Code

#### Étape 2.1 : Scripts de génération

1. **Modifier `render_platform_compose.sh`** :
   - Ajouter paramètre `ENV`
   - Ajouter logique conditionnelle pour tenant `core`
   - Modifier noms de containers, volumes, bases de données

2. **Modifier `render_caddyfile.sh`** :
   - Ajouter logique conditionnelle pour tenant `core`
   - Modifier hostnames DVIG/Vault (inclure `${ENV}`)
   - Modifier reverse_proxy vers nouveaux containers

3. **Modifier `bin/dorevia.sh`** :
   - Modifier `cmd_platform_up()` : Ajouter paramètre `env`
   - Modifier `cmd_gateway_aggregate()` : Déduplication conditionnelle
   - Mettre à jour messages CLI

#### Étape 2.2 : Tests

1. **Tests unitaires** : Vérifier génération correcte
2. **Tests d'intégration** : Vérifier déploiement complet

---

### Phase 3 : Migration Données

#### Étape 3.1 : Sauvegarde

```bash
# Dump base Vault existante
docker exec vault-db-core pg_dump -U vault dorevia_vault > vault_backup.sql

# Sauvegarder volumes
docker run --rm -v vault_storage_core:/data -v $(pwd):/backup \
  alpine tar czf /backup/vault_storage_backup.tar.gz /data
```

#### Étape 3.2 : Migration bases de données

1. **Créer nouvelles bases** :
   - `dorevia_vault_lab`
   - `dorevia_vault_stinger`
   - `dorevia_vault_prod`

2. **Migrer données** :
   - Copier données vers chaque environnement
   - Ou créer bases vides selon stratégie

#### Étape 3.3 : Séparation tokens

```bash
# Extraire tokens par environnement
jq '.tokens[] | select(.source | contains(".lab."))' \
  tenants/core/secrets/dvig.tokens.yml > tenants/core/secrets/dvig.lab.tokens.yml

jq '.tokens[] | select(.source | contains(".stinger."))' \
  tenants/core/secrets/dvig.tokens.yml > tenants/core/secrets/dvig.stinger.tokens.yml

jq '.tokens[] | select(.source | contains(".prod."))' \
  tenants/core/secrets/dvig.tokens.yml > tenants/core/secrets/dvig.prod.tokens.yml
```

---

### Phase 4 : Déploiement

#### Étape 4.1 : Arrêt services existants

```bash
# Arrêter DVIG/Vault existants (tenant core)
dorevia.sh platform down core
```

#### Étape 4.2 : Génération nouvelles configs

```bash
# Générer configs pour chaque environnement (tenant core uniquement)
for env in lab stinger prod; do
  dorevia.sh render core --env $env
  dorevia.sh platform up core $env
done
```

#### Étape 4.3 : DNS

```bash
# Créer nouveaux enregistrements DNS (tenant core uniquement)
# dvig.lab.core.doreviateam.com → 85.215.206.213
# dvig.stinger.core.doreviateam.com → 85.215.206.213
# dvig.prod.core.doreviateam.com → 85.215.206.213
# vault.lab.core.doreviateam.com → 85.215.206.213
# vault.stinger.core.doreviateam.com → 85.215.206.213
# vault.prod.core.doreviateam.com → 85.215.206.213

# Supprimer anciens enregistrements (tenant core)
# dvig.core.doreviateam.com → Supprimer
# vault.core.doreviateam.com → Supprimer
```

#### Étape 4.4 : Gateway

```bash
# Régénérer et recharger Caddyfile
dorevia.sh gateway aggregate --reload
```

---

### Phase 5 : Validation

1. **Tests smoke** :
   ```bash
   curl https://dvig.lab.core.doreviateam.com/health
   curl https://dvig.stinger.core.doreviateam.com/health
   curl https://dvig.prod.core.doreviateam.com/health
   curl https://vault.lab.core.doreviateam.com/health
   curl https://vault.stinger.core.doreviateam.com/health
   curl https://vault.prod.core.doreviateam.com/health
   ```

2. **Tests fonctionnels** :
   - Ingest depuis Odoo LAB → DVIG LAB → Vault LAB
   - Ingest depuis Odoo STINGER → DVIG STINGER → Vault STINGER
   - Vérifier isolation des données entre environnements

3. **Tests de régression** :
   - Vérifier que PROD `core` fonctionne toujours
   - Vérifier que LAB `core` fonctionne toujours
   - Vérifier que autres tenants (`dido`, `rozas`) fonctionnent toujours (architecture v2.0)

---

## ⚠️ Risques et Considérations

### Risques techniques

1. **Migration des données** :
   - Risque de perte de données si migration mal effectuée
   - **Mitigation** : Sauvegardes complètes avant migration, tests sur environnement de test

2. **Downtime** :
   - Arrêt des services DVIG/Vault pendant migration
   - **Mitigation** : Planifier fenêtre de maintenance, communication aux utilisateurs

3. **Complexité accrue** :
   - 3x plus de containers, volumes, bases de données
   - **Mitigation** : Documentation complète, scripts automatisés, monitoring

4. **Tokens** :
   - Risque de confusion entre environnements
   - **Mitigation** : Nomenclature claire, validation stricte, tests automatisés

5. **Breaking change CLI** :
   - Signature `platform up` modifiée
   - **Mitigation** : Documentation mise à jour, messages d'erreur clairs

### Considérations opérationnelles

1. **Ressources système** :
   - 3x plus de ressources nécessaires (RAM, CPU, disque)
   - **Impact** : Vérifier capacité serveur, monitoring des ressources

2. **Maintenance** :
   - 3x plus de services à maintenir
   - **Impact** : Automatiser au maximum, scripts de maintenance

3. **Sauvegardes** :
   - 3x plus de bases de données à sauvegarder
   - **Impact** : Adapter stratégie de sauvegarde, automatiser

4. **Monitoring** :
   - 3x plus de services à monitorer
   - **Impact** : Dashboard unifié, alertes configurées

---

## 📊 Estimation

**Complexité** : 🔴 **ÉLEVÉE**

**Temps estimé** :
- Phase 2 (Code) : 2-3 jours
- Phase 3 (Migration) : 1 jour
- Phase 4 (Déploiement) : 0.5 jour
- Phase 5 (Validation) : 1 jour

**Total** : ~5 jours de développement + fenêtre de maintenance

**Ressources** :
- 1 développeur
- Fenêtre de maintenance : 2-4 heures (migration données + DNS)

---

## 🎯 Alternatives

### Alternative 1 : Garder architecture actuelle

**Avantages** :
- Pas de migration nécessaire
- Moins de ressources
- Architecture plus simple
- Isolation déjà assurée par tokens (source contient `<env>`)

**Inconvénients** :
- Hostnames sans `<env>` (mais conforme v2.0)
- Données Vault partagées (mais isolées par tenant)
- Pas d'isolation complète des données entre environnements

### Alternative 2 : Isolation partielle

**Compromis** :
- DVIG partagé (tokens isolés par source)
- Vault séparé par environnement (données critiques)

**Avantages** :
- Isolation des données Vault
- Moins de ressources que solution complète

**Inconvénients** :
- Complexité intermédiaire
- Pas d'isolation complète DVIG

---

## 📎 Références

- `ZeDocs/TestV2/SPEC_STINGER_v1.0.md` — Spécification STINGER
- `ZeDocs/V2/BREAKING_CHANGE_HOSTNAMES_DVIG_VAULT.md` — Migration inverse (à annuler)
- `ZeDocs/SPEC_Dorevia_Reference_v2.0.md` — Architecture de référence
- `lib/render/render_platform_compose.sh` — Script à modifier
- `lib/render/render_caddyfile.sh` — Script à modifier
- `bin/dorevia.sh` — CLI à modifier

---

## ✅ Conclusion

Cette modification est **techniquement faisable** mais représente un **changement architectural significatif** pour le tenant `core` uniquement.

**Impact résumé** :
- **3x plus de ressources** (containers, volumes, bases de données)
- **Modifications code** : Scripts de génération, CLI, gateway
- **Migration nécessaire** : Données, volumes, tokens, DNS
- **Breaking change** : Signature commande `platform up`

**Recommandation** : Valider le besoin métier réel d'isolation complète pour le tenant `core` avant de procéder. Si l'isolation complète des données Vault est requise pour STINGER (simulation PROD-like), cette modification est justifiée.

**Note importante** : Cette modification est **spécifique au tenant `core`** et n'affecte pas les autres tenants (`dido`, `rozas`, etc.) qui conservent l'architecture v2.0 standard (DVIG/Vault partagés).

---

**Version** : 1.1  
**Date** : 2026-01-08  
**Statut** : 📋 **À valider**
