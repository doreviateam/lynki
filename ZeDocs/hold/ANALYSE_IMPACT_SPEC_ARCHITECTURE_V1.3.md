# 🔍 Analyse d'Impact — Spécification Architecture & Déploiement v1.3

**Version** : 1.0  
**Date** : 2025-01-29  
**SPEC Analysée** : DOREVIA — Spécification Architecture & Déploiement (v1.3)  
**Statut** : Analyse complète — Rapport pour formulation nouvelle spécification

---

## 📋 Résumé Exécutif

### Verdict Global

La spécification v1.3 introduit des **changements architecturaux majeurs** qui nécessitent une **refonte significative** de l'implémentation actuelle. Les principes directeurs (séparation intention/exécution, configuration déclarative, auditabilité) sont **non conformes** avec l'état actuel.

**Niveau d'impact** : 🔴 **CRITIQUE** — Refonte majeure requise

### Écarts Critiques Identifiés

| Principe v1.3 | État Actuel | Conformité | Impact |
|---------------|-------------|------------|--------|
| **Séparation intention/exécution** | CLI exécute directement | ❌ **NON CONFORME** | 🔴 Critique |
| **Configuration déclarative** | Partielle (templates) | ⚠️ **PARTIELLE** | 🟡 Important |
| **CLI d'intention (interactive)** | CLI d'exécution (non interactive) | ❌ **NON CONFORME** | 🔴 Critique |
| **Distinction Univers/Unit** | Confusion conceptuelle | ⚠️ **PARTIELLE** | 🟡 Important |
| **Hostnames canoniques/alias** | Non géré | ❌ **NON CONFORME** | 🟡 Important |
| **Auditabilité complète** | Partielle | ⚠️ **PARTIELLE** | 🟡 Important |

---

## 1. Analyse des Principes Directeurs

### 1.1 Principe 1 : Séparation stricte intention/exécution

#### Spécification v1.3

> La CLI capture l'intention, génère une configuration déclarative, **ne déclenche jamais le déploiement**.

#### État Actuel

**`bin/dorevia.sh`** :
- ✅ Capture des paramètres (tenant, univers, env)
- ❌ **Exécute directement** le déploiement (`docker compose up -d`)
- ❌ Pas de séparation entre intention et exécution
- ❌ Pas de génération de configuration déclarative complète

**Exemple actuel** :
```bash
# Commande actuelle : exécution directe
dorevia.sh app up odoo lab core
# → Lance immédiatement docker compose up -d
```

**Conformité** : ❌ **NON CONFORME**

**Impact** : 🔴 **CRITIQUE**
- Refonte complète de `dorevia.sh` requise
- Nouvelle architecture CLI nécessaire :
  - Phase A : CLI interactive → génère `manifest.json` complet
  - Phase B : Script d'exécution séparé (non interactif)

**Actions requises** :
1. Créer nouvelle CLI interactive (`dorevia-init.sh` ou mode `dorevia.sh init`)
2. Générer configuration déclarative complète (`manifest.json` enrichi)
3. Créer script d'exécution séparé (`dorevia-deploy.sh` ou mode `dorevia.sh deploy`)
4. Migrer commandes actuelles vers nouveau modèle

---

### 1.2 Principe 2 : Configuration déclarative comme source de vérité

#### Spécification v1.3

> La configuration décrit explicitement tenants, univers, environnements, domains, alias, units. **Toute exécution repose exclusivement sur cette configuration**.

#### État Actuel

**Configuration actuelle** :
- ✅ Templates Docker Compose (`docker-compose.yml.template`)
- ✅ `manifest.json` minimal (existe pour `core` uniquement)
- ❌ Configuration **partielle** : manque domains, alias, units explicites
- ❌ Logique implicite dans `dorevia.sh` (génération de noms, volumes)
- ❌ Caddyfile **manuellement édité** (pas de génération depuis config)

**Exemple `manifest.json` actuel** :
```json
{
  "tenant": "core",
  "created_at": "2025-01-28T00:00:00Z",
  "images": {...},
  "tokens_source": "..."
}
```

**Manque** :
- `univers` déclarés
- `environments` déclarés
- `domains` (default + client)
- `alias` (hostnames supplémentaires)
- `units` (briques techniques)
- `deployment` (serveur, localisation)

**Conformité** : ⚠️ **PARTIELLE**

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Enrichir `manifest.json` avec structure complète :
   ```json
   {
     "tenant": "core",
     "version": "1.0",
     "univers": ["odoo"],
     "environments": ["lab", "stinger", "prod"],
     "domains": {
       "default": "doreviateam.com",
       "prod": [],
       "lab": [],
       "stinger": []
     },
     "alias": {},
     "units": {
       "odoo": ["odoo", "postgres"],
       "platform": ["dvig", "vault", "postgres"]
     },
     "deployment": {
       "location": "dorevia_server",
       "server_ip": "..."
     }
   }
   ```
2. Générer Caddyfile depuis `manifest.json`
3. Générer docker-compose depuis `manifest.json`
4. Éliminer toute logique implicite dans scripts

---

### 1.3 Principe 3 : Standard SaaS par défaut, extensible sans rupture

#### Spécification v1.3

> Pattern normatif : `<univers>.<environnement>.<tenant>.doreviateam.com`  
> Extension PROD : `<univers>.<environnement>.<tenant>.<domain_client>`

#### État Actuel

**Conformité DNS** :
- ✅ Format standard respecté : `odoo.lab.core.doreviateam.com`
- ✅ Services partagés : `dvig.core.doreviateam.com` (⚠️ manque `<env>`)
- ❌ **Extension domaine client** : Non implémentée
- ❌ **Alias** : Non gérés
- ❌ **Hostnames canoniques** : Non distingués

**Problème identifié** :
- Services partagés (DVIG/Vault) : format `dvig.<tenant>.doreviateam.com` (pas d'env)
- Spéc v1.3 propose : `dvig.<env>.<tenant>.doreviateam.com` (avec env)

**Conformité** : ⚠️ **PARTIELLE**

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Aligner format services partagés avec spec (ajouter `<env>`)
2. Implémenter support domaines clients (PROD uniquement)
3. Implémenter gestion alias
4. Distinguer hostname canonique vs alias

---

### 1.4 Principe 4 : Auditabilité systématique

#### Spécification v1.3

> Tout déploiement doit permettre : reconstitution de l'intention, traçabilité complète, relecture à froid, reproduction à l'identique.

#### État Actuel

**Auditabilité actuelle** :
- ✅ `manifest.json` (partiel)
- ✅ Logs Docker
- ⚠️ Pas de journal des intentions (qui a demandé quoi, quand, pourquoi)
- ⚠️ Pas de journal des exécutions (quand, comment, résultat)
- ⚠️ Pas de relecture à froid (reconstitution historique)

**Conformité** : ⚠️ **PARTIELLE**

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Journal des intentions (`tenants/<tenant>/state/intentions.jsonl`)
2. Journal des exécutions (`tenants/<tenant>/state/executions.jsonl`)
3. Métadonnées de déploiement (qui, quand, pourquoi, comment)
4. Script de relecture historique

---

### 1.5 Principe 5 : Aucune décision implicite

#### Spécification v1.3

> Tout est explicite dans la configuration déclarative.

#### État Actuel

**Décisions implicites identifiées** :
- ❌ Génération de noms de containers (logique dans `dorevia.sh`)
- ❌ Génération de noms de volumes (logique dans `dorevia.sh`)
- ❌ Génération de noms de DB (logique dans `dorevia.sh`)
- ❌ Génération de `source` (logique dans `dorevia.sh`)
- ❌ Routage Caddy (Caddyfile manuel, pas généré)

**Exemple** :
```bash
# Logique implicite actuelle
local db_name="odoo_${env}_${tenant}"  # Généré dans script
local source="${univers}.${env}.${tenant}"  # Généré dans script
```

**Conformité** : ❌ **NON CONFORME**

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. Déplacer toute logique de génération vers `manifest.json`
2. Scripts d'exécution lisent uniquement `manifest.json`
3. Validation stricte : refuser exécution si config incomplète

---

### 1.6 Principe 6 : Distinction claire métier/technique

#### Spécification v1.3

> **Univers** = application fonctionnelle (métier)  
> **Unit** = brique technique (technique)  
> Orthogonaux : un univers peut être implémenté par plusieurs units.

#### État Actuel

**Confusion identifiée** :
- ⚠️ `odoo` utilisé à la fois comme univers ET comme unit
- ⚠️ Pas de distinction claire entre métier (univers) et technique (unit)
- ⚠️ Structure actuelle : `tenants/<tenant>/apps/odoo/` (mélange concepts)

**Conformité** : ⚠️ **PARTIELLE**

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Clarifier dans documentation : `odoo` = univers (métier)
2. Identifier units techniques : `odoo` (container), `postgres` (DB), `redis` (cache si applicable)
3. Structure recommandée (optionnelle) :
   ```
   tenants/<tenant>/
     apps/
       <univers>/  # odoo (métier)
         <env>/
           units/  # odoo, postgres (technique)
   ```
4. Documenter mapping univers → units dans `manifest.json`

---

## 2. Analyse des Définitions Normatives

### 2.1 Tenant

#### Spécification v1.3

> Un tenant est l'unité contractuelle, d'isolation logique et technique, de responsabilité des données.  
> L'identité d'un tenant est **immuable**, indépendamment des domaines, serveurs, environnements.

#### État Actuel

**Conformité** : ✅ **CONFORME**
- Tenant = identifiant DNS stable
- Isolation par tenant respectée
- Identité immuable respectée

**Impact** : ✅ Aucun changement requis

---

### 2.2 Univers

#### Spécification v1.3

> Un **univers** est une **application fonctionnelle exposée**, rattachée à un tenant.  
> Visible par les utilisateurs ou intégrations, structurant pour les URLs et les tokens.

#### État Actuel

**Conformité** : ✅ **CONFORME**
- Univers = `odoo` (fonctionnel)
- Structurant pour URLs : `odoo.lab.core.doreviateam.com`
- Structurant pour tokens : `odoo.lab.core`

**Impact** : ✅ Aucun changement requis (concept déjà respecté)

---

### 2.3 Unit

#### Spécification v1.3

> Une **unit** est une **brique technique déployable** de la plateforme.  
> Interne à la plateforme, orchestrée par Dorevia, non nécessairement exposée publiquement.

#### État Actuel

**Problème** : ⚠️ Concept **non explicite** dans l'implémentation

**Units identifiées** :
- `odoo` (container Odoo)
- `postgres` (DB Odoo)
- `dvig` (service platform)
- `vault` (service platform)
- `caddy` (gateway)
- `redis` (si applicable)

**Conformité** : ⚠️ **PARTIELLE** — Concept présent mais non formalisé

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Documenter units dans `manifest.json`
2. Clarifier distinction univers/unit dans documentation
3. (Optionnel) Restructurer répertoires pour refléter distinction

---

### 2.4 Relation Univers / Unit

#### Spécification v1.3

> Un univers est implémenté par **une ou plusieurs units**.  
> Une unit peut servir **plusieurs univers**.  
> Orthogonaux.

#### État Actuel

**Mapping actuel** (implicite) :
- Univers `odoo` → Units : `odoo` (container), `postgres` (DB)
- Univers `platform` → Units : `dvig`, `vault`, `postgres` (Vault DB)

**Conformité** : ✅ **CONFORME** (mapping correct, mais non explicite)

**Impact** : 🟡 **IMPORTANT** — Formaliser dans `manifest.json`

**Actions requises** :
1. Documenter mapping univers → units dans `manifest.json`
2. Validation : vérifier cohérence mapping avant déploiement

---

## 3. Analyse des Environnements

### Spécification v1.3

> `lab` | `stinger` | `prod`  
> Chaque environnement est isolé, déployable indépendamment, reproductible.

### État Actuel

**Conformité** : ✅ **CONFORME**
- Environnements : `lab`, `stinger`, `prod`
- Isolation respectée (DB, volumes, containers séparés)
- Déploiement indépendant respecté

**Impact** : ✅ Aucun changement requis

---

## 4. Analyse du Standard SaaS — Nommage des Domaines

### 4.1 Pattern normatif

#### Spécification v1.3

```
<univers>.<environnement>.<tenant>.doreviateam.com
```

#### État Actuel

**Conformité** : ✅ **CONFORME** pour apps
- ✅ `odoo.lab.core.doreviateam.com`
- ✅ `odoo.stinger.core.doreviateam.com`
- ✅ `odoo.prod.core.doreviateam.com`

**⚠️ Écart pour services partagés** :
- Actuel : `dvig.core.doreviateam.com` (pas d'env)
- Spec v1.3 : `dvig.<env>.<tenant>.doreviateam.com` (avec env)

**Impact** : 🟡 **IMPORTANT** — Aligner format services partagés

**Actions requises** :
1. Décision : services partagés avec ou sans `<env>` ?
   - Option A : `dvig.lab.core.doreviateam.com` (avec env)
   - Option B : `dvig.core.doreviateam.com` (sans env, partagé entre env)
2. Si Option A : Migrer tous les services partagés
3. Mettre à jour Caddyfile
4. Mettre à jour DNS

---

### 4.2 Extension Production — Domaine client

#### Spécification v1.3

```
<univers>.<environnement>.<tenant>.<domain_client>
```

#### État Actuel

**Conformité** : ❌ **NON CONFORME** — Non implémenté

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Implémenter support domaines clients (PROD uniquement)
2. Générer Caddyfile avec alias (domaine client + fallback)
3. Validation DNS avant déploiement
4. Documentation processus opérationnel

---

## 5. Analyse Hostnames Canoniques et Alias

### 5.1 Canonique

#### Spécification v1.3

> Chaque service exposé dispose d'un **hostname canonique unique** : stable, utilisé pour logs, métriques et audit, toujours fonctionnel.

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**
- Hostnames existent mais non distingués comme "canoniques"
- Pas de gestion explicite du canonique vs alias

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Définir hostname canonique dans `manifest.json`
2. Utiliser canonique pour logs/métriques/audit
3. Documenter dans spécification

---

### 5.2 Alias

#### Spécification v1.3

> Un **alias** est un hostname supplémentaire pointant vers le même service, accepté par le reverse-proxy, sans création de tenant.

#### État Actuel

**Conformité** : ❌ **NON CONFORME** — Non implémenté

**Exemples manquants** :
- `erp.client.com` → alias de `odoo.prod.tenant.client.com`
- `api.client.com` → alias de `dvig.prod.tenant.client.com`

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Implémenter gestion alias dans `manifest.json`
2. Générer Caddyfile avec alias
3. Validation : alias ne crée pas de tenant

---

## 6. Analyse Services Cœur (DVIG / Vault)

### Spécification v1.3

**Standard SaaS** :
```
dvig.<env>.<tenant>.doreviateam.com
vault.<env>.<tenant>.doreviateam.com
```

**Domaine client (prod)** :
```
dvig.prod.<tenant>.<domain_client>
vault.prod.<tenant>.<domain_client>
```

### État Actuel

**Format actuel** :
- `dvig.<tenant>.doreviateam.com` (⚠️ pas d'env)
- `vault.<tenant>.doreviateam.com` (⚠️ pas d'env)

**Conformité** : ⚠️ **PARTIELLE** — Format différent (pas d'env)

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Décision architecturale** : services partagés avec ou sans env ?
   - **Option A (avec env)** : `dvig.lab.core.doreviateam.com` → isolation complète par env
   - **Option B (sans env)** : `dvig.core.doreviateam.com` → service partagé entre env
2. Si Option A : Migrer tous les services (breaking change)
3. Si Option B : Adapter spec v1.3 pour services partagés

**Recommandation** : **Option B** (sans env) pour services partagés, car :
- DVIG/Vault sont **partagés** entre env d'un même tenant
- Isolation par tenant déjà assurée
- Simplicité opérationnelle

---

## 7. Analyse Modèle de Déploiement

### 7.1 CLI d'intention

#### Spécification v1.3

> La CLI capture l'intention opérateur, pose des questions structurées, génère une configuration déclarative.  
> **Elle ne déclenche jamais le déploiement.**

#### État Actuel

**Conformité** : ❌ **NON CONFORME**

**`bin/dorevia.sh` actuel** :
- ❌ Non interactive (pas de questions)
- ❌ Exécute directement (`docker compose up -d`)
- ❌ Ne génère pas configuration déclarative complète

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. **Refonte complète CLI** :
   ```bash
   # Phase A : Intention (interactive)
   dorevia.sh init <tenant>
   # → Questions structurées
   # → Génère manifest.json complet
   
   # Phase B : Exécution (non interactive)
   dorevia.sh deploy <tenant>
   # → Lit manifest.json
   # → Exécute déploiement
   ```
2. Créer mode interactif avec questions :
   - Univers à déployer ?
   - Environnements ?
   - Domaines clients (PROD) ?
   - Alias ?
   - Serveur de déploiement ?
3. Générer `manifest.json` complet depuis réponses
4. Script d'exécution séparé (non interactif)

---

### 7.2 Exécution

#### Spécification v1.3

> Non interactive, déterministe, reproductible, auditable, automatisable (CI/CD).

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**
- ✅ Déterministe (docker compose)
- ✅ Reproductible
- ⚠️ Auditabilité partielle
- ⚠️ Automatisable mais pas optimisé

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Améliorer auditabilité (journaux intentions/exécutions)
2. Optimiser pour CI/CD (mode non interactif strict)
3. Validation stricte : refuser exécution si config incomplète

---

## 8. Analyse Pré-requis — Vérification et Installation

### Spécification v1.3

> **Vérification** : OS, Docker, Docker Compose, réseau, DNS (aucune modification système).  
> **Installation contrôlée** : Docker, Docker Compose, dépendances minimales (si autorisée).  
> Jamais installés automatiquement : OS, sécurité réseau, DNS externe.

### État Actuel

**Conformité** : ✅ **CONFORME**
- `dorevia.sh doctor` vérifie prérequis
- Pas d'installation automatique OS/réseau/DNS
- Installation Docker/Compose contrôlée

**Impact** : ✅ Aucun changement requis

---

## 9. Analyse Configuration Déclarative

### Spécification v1.3

> La configuration est la **source de vérité**, versionnable, explicite, décrit tenants, univers, environments, domains, alias, units.

### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Manque dans `manifest.json`** :
- ❌ `univers` déclarés
- ❌ `environments` déclarés
- ❌ `domains` (default + client)
- ❌ `alias`
- ❌ `units` (briques techniques)
- ❌ `deployment` (serveur, localisation)

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. **Enrichir `manifest.json`** avec structure complète :
   ```json
   {
     "tenant": "core",
     "version": "1.0",
     "created_at": "2025-01-28T00:00:00Z",
     "univers": [
       {
         "name": "odoo",
         "environments": ["lab", "stinger", "prod"],
         "units": ["odoo", "postgres"]
       }
     ],
     "platform": {
       "units": ["dvig", "vault", "postgres"]
     },
     "domains": {
       "default": "doreviateam.com",
       "prod": [],
       "lab": [],
       "stinger": []
     },
     "alias": {},
     "deployment": {
       "location": "dorevia_server",
       "server_ip": "85.215.206.213"
     },
     "images": {...},
     "tokens_source": "..."
   }
   ```
2. **Générer tout depuis `manifest.json`** :
   - Caddyfile
   - docker-compose.yml
   - odoo.conf
   - Validation : refuser exécution si config incomplète

---

## 10. Analyse Auditabilité

### Spécification v1.3

> Tout déploiement doit permettre : reconstitution de l'intention, traçabilité complète, relecture à froid, reproduction à l'identique.

### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Manque** :
- ❌ Journal des intentions (qui a demandé quoi, quand, pourquoi)
- ❌ Journal des exécutions (quand, comment, résultat)
- ❌ Métadonnées de déploiement (qui, quand, pourquoi, comment)
- ❌ Script de relecture historique

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Journal des intentions** :
   ```jsonl
   # tenants/<tenant>/state/intentions.jsonl
   {"timestamp": "2025-01-29T10:00:00Z", "operator": "user@example.com", "action": "init", "tenant": "core", "config": {...}}
   ```
2. **Journal des exécutions** :
   ```jsonl
   # tenants/<tenant>/state/executions.jsonl
   {"timestamp": "2025-01-29T10:05:00Z", "intention_id": "...", "action": "deploy", "result": "success", "artifacts": [...]}
   ```
3. **Métadonnées de déploiement** :
   - Qui : opérateur
   - Quand : timestamp
   - Pourquoi : intention (référence intention)
   - Comment : commande exécutée, config utilisée
4. **Script de relecture** : `dorevia.sh audit <tenant>`

---

## 11. Analyse Invariants Globaux

### Spécification v1.3

> ❌ aucun déploiement interactif  
> ❌ aucune décision cachée  
> ❌ aucune dépendance implicite  
> ✔️ tout est explicable  
> ✔️ tout est rejouable  
> ✔️ tout est auditable  

### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Écarts** :
- ⚠️ Déploiement non interactif (mais pas de phase intention séparée)
- ❌ Décisions cachées (logique implicite dans scripts)
- ❌ Dépendances implicites (génération de noms)
- ⚠️ Explicable partiellement
- ✅ Rejouable (docker compose)
- ⚠️ Auditable partiellement

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. Séparer phase intention (interactive) et exécution (non interactive)
2. Éliminer toute logique implicite (tout dans `manifest.json`)
3. Documenter toutes les dépendances (dans `manifest.json`)
4. Améliorer auditabilité (journaux)

---

## 12. Synthèse des Impacts par Composant

### 12.1 `bin/dorevia.sh`

**Impact** : 🔴 **CRITIQUE** — Refonte majeure

**Changements requis** :
1. **Nouvelle architecture** :
   - Mode `init` (interactive) → génère `manifest.json`
   - Mode `deploy` (non interactive) → lit `manifest.json`, exécute
   - Mode `audit` → relecture historique
2. **Éliminer logique implicite** :
   - Génération de noms → dans `manifest.json`
   - Génération de volumes → dans `manifest.json`
   - Génération de DB → dans `manifest.json`
3. **Validation stricte** :
   - Refuser exécution si `manifest.json` incomplet
   - Refuser exécution si config invalide

**Estimation** : 3-5 jours de développement

---

### 12.2 `tenants/<tenant>/state/manifest.json`

**Impact** : 🔴 **CRITIQUE** — Enrichissement majeur

**Changements requis** :
1. **Structure complète** :
   - `univers` déclarés
   - `environments` déclarés
   - `domains` (default + client)
   - `alias`
   - `units` (briques techniques)
   - `deployment` (serveur, localisation)
2. **Migration** :
   - Migrer tenants existants (`core`, `dido`, `rozas`)
   - Générer `manifest.json` complet depuis état actuel

**Estimation** : 2-3 jours de développement

---

### 12.3 `units/gateway/Caddyfile`

**Impact** : 🟡 **IMPORTANT** — Génération automatique

**Changements requis** :
1. **Génération depuis `manifest.json`** :
   - Parcourir tous les tenants
   - Générer routes pour chaque univers/env/tenant
   - Générer alias
   - Générer domaines clients (PROD)
2. **Commandes** :
   - `dorevia.sh gateway render` → génère Caddyfile
   - `dorevia.sh gateway reload` → recharge Caddy

**Estimation** : 2 jours de développement

---

### 12.4 Templates Docker Compose

**Impact** : 🟡 **IMPORTANT** — Génération depuis config

**Changements requis** :
1. **Génération depuis `manifest.json`** :
   - Lire `units` depuis `manifest.json`
   - Générer `docker-compose.yml` depuis config
2. **Éliminer variables templates** :
   - Remplacer `{{TENANT}}` par lecture `manifest.json`
   - Remplacer toute logique par lecture config

**Estimation** : 2 jours de développement

---

### 12.5 Documentation

**Impact** : 🟡 **IMPORTANT** — Mise à jour complète

**Changements requis** :
1. **Mettre à jour guides** :
   - Guide création tenant (nouveau processus)
   - Guide utilisation CLI (nouveaux modes)
2. **Documenter concepts** :
   - Distinction Univers/Unit
   - Hostnames canoniques/alias
   - Processus intention/exécution
3. **Documenter migration** :
   - Comment migrer tenants existants
   - Comment utiliser nouvelle CLI

**Estimation** : 2 jours

---

## 13. Plan de Migration Recommandé

### Phase 1 : Préparation (1 semaine)

1. **Enrichir `manifest.json`** :
   - Définir structure complète
   - Migrer tenants existants (`core`, `dido`, `rozas`)
   - Validation : `manifest.json` complet pour tous

2. **Documentation** :
   - Documenter nouvelle structure `manifest.json`
   - Documenter processus intention/exécution

### Phase 2 : Refonte CLI (2 semaines)

1. **Nouvelle architecture CLI** :
   - Mode `init` (interactive)
   - Mode `deploy` (non interactive)
   - Mode `audit` (relecture)

2. **Génération automatique** :
   - Caddyfile depuis `manifest.json`
   - docker-compose depuis `manifest.json`
   - odoo.conf depuis `manifest.json`

3. **Tests** :
   - Tests unitaires nouveaux modes
   - Tests intégration (déploiement complet)

### Phase 3 : Migration Tenants (1 semaine)

1. **Migration progressive** :
   - Migrer `core` (tenant de test)
   - Valider fonctionnement
   - Migrer `dido`, `rozas`

2. **Validation** :
   - Vérifier isolation
   - Vérifier URLs
   - Vérifier tokens

### Phase 4 : Fonctionnalités Avancées (1 semaine)

1. **Domaines clients** :
   - Support domaines clients (PROD)
   - Génération Caddyfile avec alias

2. **Alias** :
   - Gestion alias dans `manifest.json`
   - Génération Caddyfile avec alias

3. **Auditabilité** :
   - Journaux intentions/exécutions
   - Script de relecture

---

## 14. Risques et Mitigation

### Risque 1 : Breaking Changes

**Risque** : Migration peut casser déploiements existants

**Mitigation** :
- Migration progressive (tenant par tenant)
- Mode compatibilité (ancien CLI disponible temporairement)
- Tests exhaustifs avant migration production

### Risque 2 : Complexité Accrue

**Risque** : Nouvelle architecture plus complexe

**Mitigation** :
- Documentation complète
- Formation équipe
- Scripts d'aide (validation, migration)

### Risque 3 : Temps de Développement

**Risque** : Refonte majeure = temps important

**Mitigation** :
- Plan de migration par phases
- Priorisation (fonctionnalités critiques d'abord)
- Tests incrémentaux

---

## 15. Recommandations

### 15.1 Décisions Architecturale Requises

1. **Services partagés avec ou sans `<env>` ?**
   - Recommandation : **Sans env** (`dvig.core.doreviateam.com`)
   - Justification : Services partagés entre env d'un même tenant

2. **Migration progressive ou big bang ?**
   - Recommandation : **Progressive** (tenant par tenant)
   - Justification : Réduction risques

3. **Compatibilité ancien CLI ?**
   - Recommandation : **Oui, temporairement** (3 mois)
   - Justification : Transition en douceur

### 15.2 Priorités

**Priorité 1 (Critique)** :
1. Refonte CLI (séparation intention/exécution)
2. Enrichissement `manifest.json`
3. Génération automatique depuis config

**Priorité 2 (Important)** :
1. Support domaines clients
2. Gestion alias
3. Auditabilité complète

**Priorité 3 (Souhaitable)** :
1. Distinction Univers/Unit (formalisation)
2. Restructuration répertoires (optionnel)

---

## 16. Conclusion

### Verdict Final

La spécification v1.3 introduit des **changements architecturaux majeurs** qui nécessitent une **refonte significative** de l'implémentation actuelle. Les principes directeurs (séparation intention/exécution, configuration déclarative, auditabilité) sont **non conformes** avec l'état actuel.

**Niveau d'impact** : 🔴 **CRITIQUE** — Refonte majeure requise

### Prochaines Étapes

1. **Valider spécification v1.3** avec équipe
2. **Prendre décisions architecturales** (services partagés, migration)
3. **Formuler nouvelle spécification** d'implémentation basée sur cette analyse
4. **Planifier migration** (phases, délais, ressources)

---

**Document généré le** : 2025-01-29  
**Auteur** : Analyse automatique  
**Version** : 1.0

