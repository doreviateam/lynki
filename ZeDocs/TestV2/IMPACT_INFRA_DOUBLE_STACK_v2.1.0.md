# 🔍 Impact Infrastructure — Approche Double Stack (v2.1.0)

**Date** : 2026-01-10  
**Document analysé** : SPEC_DVIG_VAULT_STINGER_v2.1.0 (Double Stack)  
**Référence** : Infrastructure Dorevia actuelle

---

## 🎯 Résumé Exécutif

L'approche "Double Stack" (créer tenant `core-stinger` comme nouveau tenant) a un **impact minimal** sur l'infrastructure actuelle car elle utilise l'architecture multi-tenant existante sans modification de code.

**Statut global** : ✅ **IMPACT MINIMAL** — Aucune modification code, utilisation infrastructure existante

**Avantage principal** : Traite STINGER comme un nouveau tenant, donc utilise tous les mécanismes existants.

---

## 📊 Impact par Composant Infrastructure

### 1. Scripts de Génération

#### 1.1 `lib/render/render_platform_compose.sh`

**État actuel** :
- Génère `docker-compose.yml` pour platform
- Signature : `render_platform_compose.sh <tenant> <env>`
- Génère dans : `tenants/<tenant>/rendered/<env>/platform/docker-compose.yml`
- Containers : `dvig-<tenant>`, `vault-<tenant>` (sans environnement)

**Impact avec Double Stack** :
- ✅ **AUCUN CHANGEMENT** nécessaire
- Créer tenant `core-stinger` → Génération automatique
- Containers : `dvig-core-stinger`, `vault-core-stinger` (conforme)
- Génération dans : `tenants/core-stinger/rendered/lab/platform/docker-compose.yml`

**Évaluation** : ✅ **Aucun impact** — Utilise infrastructure existante

---

#### 1.2 `lib/render/render_caddyfile.sh`

**État actuel** :
- Génère Caddyfile avec hostnames DVIG/Vault **sans environnement**
- Hostnames : `dvig.<tenant>.doreviateam.com`
- Reverse proxy : `dvig-<tenant>:8080`

**Impact avec Double Stack** :

**Option A : Hostnames conformes v2.0** :
- Hostnames : `dvig.core-stinger.doreviateam.com` (conforme)
- Reverse proxy : `dvig-core-stinger:8080` (conforme)
- ✅ **AUCUN CHANGEMENT** nécessaire
- Génération automatique via `render_caddyfile.sh`

**Option B : Hostnames explicites (document v2.1.0)** :
- Hostnames : `dvig.stinger.core.doreviateam.com` (non conforme)
- Reverse proxy : `dvig-core-stinger:8080`
- ⚠️ **MODIFICATION CADDYFILE MANUELLE** nécessaire
- Ou script personnalisé pour générer hostnames avec `<env>`

**Évaluation** :
- Option A : ✅ **Aucun impact** (conforme v2.0)
- Option B : 🟡 **Modification manuelle Caddyfile** (non conforme)

---

#### 1.3 `lib/render/render_app_compose.sh`

**État actuel** :
- Génère `docker-compose.yml` pour apps (Odoo)
- Signature : `render_app_compose.sh <tenant> <env> <univers>`
- Containers : `odoo_<env>_<tenant>`

**Impact avec Double Stack** :
- ✅ **AUCUN CHANGEMENT** nécessaire
- Créer tenant `core-stinger` → Génération automatique
- Containers : `odoo_stinger_core-stinger` (si besoin)
- Mais document propose : `odoo.stinger.sarl-la-platine.doreviateam.com` (tenant `sarl-la-platine`)

**Clarification nécessaire** :
- Les clients STINGER (`sarl-la-platine`, `sweet-manihot`) sont-ils des tenants séparés ou des apps du tenant `core-stinger` ?

**Évaluation** : ✅ **Aucun impact** — Utilise infrastructure existante

---

### 2. CLI (`bin/dorevia.sh`)

#### 2.1 Commande `platform up`

**État actuel** :
```bash
dorevia.sh platform up <tenant>
```

**Impact avec Double Stack** :
- ✅ **AUCUN CHANGEMENT** nécessaire
- Commande : `dorevia.sh platform up core-stinger`
- Utilise signature existante
- Fonctionne immédiatement

**Évaluation** : ✅ **Aucun impact** — Pas de breaking change

---

#### 2.2 Commande `token issue`

**État actuel** :
```bash
dorevia.sh token issue <univers> <env> <tenant>
```

**Impact avec Double Stack** :
- ✅ **AUCUN CHANGEMENT** nécessaire
- Commande : `dorevia.sh token issue odoo stinger core-stinger`
- Utilise signature existante
- Génère token avec source : `odoo.stinger.core-stinger`

**Note** : Document propose source `odoo.stinger.<tenant>` (ex: `odoo.stinger.sarl-la-platine`)
- Si `sarl-la-platine` est un tenant séparé : ✅ Conforme
- Si `sarl-la-platine` est une app de `core-stinger` : ⚠️ Source devrait être `odoo.stinger.core-stinger`

**Évaluation** : ✅ **Aucun impact** — Utilise infrastructure existante

---

#### 2.3 Validation Tenant

**État actuel** :
```bash
validate_tenant() {
  # Validation slug DNS
  # Vérifie format tenant
}
```

**Impact avec Double Stack** :
- ✅ **AUCUN CHANGEMENT** nécessaire
- `core-stinger` est un tenant valide (slug DNS)
- Validation existante fonctionne

**Évaluation** : ✅ **Aucun impact** — Validation existante suffit

---

### 3. Structure Répertoires

#### 3.1 Arborescence Actuelle

**État actuel** :
```
tenants/
├── core/
│   ├── platform/
│   ├── apps/
│   ├── secrets/
│   └── state/
├── dido/
└── rozas/
```

**Impact avec Double Stack** :
- ✅ **CRÉATION NOUVEAU RÉPERTOIRE** nécessaire
- Créer : `tenants/core-stinger/`
- Structure identique aux autres tenants :
  ```
  tenants/
  ├── core/
  ├── core-stinger/  ← NOUVEAU
  │   ├── platform/
  │   ├── apps/
  │   ├── secrets/
  │   └── state/
  ├── dido/
  └── rozas/
  ```

**Évaluation** : ✅ **Impact minimal** — Création répertoire standard

---

#### 3.2 Manifest

**État actuel** :
- Fichier : `tenants/<tenant>/state/manifest.json`
- Contient : `tenant_id`, `universes`, `environments`, `units`, `images`

**Impact avec Double Stack** :
- ✅ **CRÉATION NOUVEAU MANIFEST** nécessaire
- Créer : `tenants/core-stinger/state/manifest.json`
- Contenu similaire à `core` mais `tenant_id: "core-stinger"`

**Exemple** :
```json
{
  "version": "1.0",
  "tenant_id": "core-stinger",
  "universes": ["odoo"],
  "environments": ["stinger"],  // Uniquement STINGER
  "units": {
    "platform": ["dvig", "vault", "postgres"],
    "odoo": ["odoo", "postgres"]
  },
  "images": {
    "dvig": "dorevia/dvig:0.1.2-auth",
    "vault": "dorevia/vault:v1.3.0",
    "odoo": "odoo:18.0-20250819",
    "postgres": "postgres:16"
  }
}
```

**Évaluation** : ✅ **Impact minimal** — Création manifest standard

---

### 4. Gateway (Caddy)

#### 4.1 Caddyfile Global

**État actuel** :
- Fichier : `units/gateway/Caddyfile`
- Généré via : `dorevia.sh gateway aggregate`
- Contient hostnames pour tous les tenants

**Impact avec Double Stack** :

**Option A : Hostnames conformes v2.0** :
- Hostnames : `dvig.core-stinger.doreviateam.com`, `vault.core-stinger.doreviateam.com`
- ✅ **GÉNÉRATION AUTOMATIQUE** via `render_caddyfile.sh`
- ✅ **AUCUN CHANGEMENT** nécessaire
- Ajout automatique lors de `gateway aggregate`

**Option B : Hostnames explicites (document v2.1.0)** :
- Hostnames : `dvig.stinger.core.doreviateam.com`, `vault.stinger.core.doreviateam.com`
- ⚠️ **MODIFICATION MANUELLE** Caddyfile nécessaire
- Ou modification `render_caddyfile.sh` pour générer hostnames avec `<env>`

**Évaluation** :
- Option A : ✅ **Aucun impact** (génération automatique)
- Option B : 🟡 **Modification manuelle ou script** (non conforme)

---

#### 4.2 Script `gateway aggregate`

**État actuel** :
- Agrège tous les Caddyfiles générés
- Déduplique hostnames DVIG/Vault (sans env)
- Génère Caddyfile global

**Impact avec Double Stack** :
- ✅ **AUCUN CHANGEMENT** nécessaire
- Tenant `core-stinger` génère son Caddyfile
- Agrégation automatique lors de `gateway aggregate`
- Hostnames `dvig.core-stinger.doreviateam.com` ajoutés automatiquement

**Évaluation** : ✅ **Aucun impact** — Utilise infrastructure existante

---

### 5. DNS

#### 5.1 Enregistrements Actuels

**État actuel** :
- `dvig.core.doreviateam.com` → IP serveur
- `vault.core.doreviateam.com` → IP serveur
- `dvig.dido.doreviateam.com` → IP serveur
- `vault.dido.doreviateam.com` → IP serveur
- etc.

**Impact avec Double Stack** :

**Option A : Hostnames conformes v2.0** :
- Créer : `dvig.core-stinger.doreviateam.com` → IP serveur
- Créer : `vault.core-stinger.doreviateam.com` → IP serveur
- ✅ **NOUVEAUX ENREGISTREMENTS** (standard)

**Option B : Hostnames explicites (document v2.1.0)** :
- Créer : `dvig.stinger.core.doreviateam.com` → IP serveur
- Créer : `vault.stinger.core.doreviateam.com` → IP serveur
- ⚠️ **NOUVEAUX ENREGISTREMENTS** (non conformes v2.0)

**Évaluation** :
- Option A : ✅ **Impact minimal** (enregistrements standard)
- Option B : 🟡 **Impact minimal** (enregistrements non conformes)

---

### 6. Containers Docker

#### 6.1 Containers Actuels

**État actuel** :
- `dvig-core` (tenant `core`)
- `vault-core` (tenant `core`)
- `vault-db-core` (tenant `core`)
- `dvig-dido` (tenant `dido`)
- `vault-dido` (tenant `dido`)
- etc.

**Impact avec Double Stack** :
- ✅ **NOUVEAUX CONTAINERS** créés automatiquement
- `dvig-core-stinger` (tenant `core-stinger`)
- `vault-core-stinger` (tenant `core-stinger`)
- `vault-db-core-stinger` (tenant `core-stinger`)
- Génération automatique via `render_platform_compose.sh`

**Ressources** :
- +3 containers (DVIG + Vault + Vault DB)
- RAM : ~500MB-1GB supplémentaires
- CPU : Impact minimal
- Disque : Volumes dédiés

**Évaluation** : ✅ **Impact minimal** — Containers standard, génération automatique

---

### 7. Volumes Docker

#### 7.1 Volumes Actuels

**État actuel** :
- `vault_db_core_data`
- `vault_storage_core`
- `vault_ledger_core`
- `vault_audit_core`
- `dvig_logs_core`
- etc.

**Impact avec Double Stack** :
- ✅ **NOUVEAUX VOLUMES** créés automatiquement
- `vault_db_core_stinger_data`
- `vault_storage_core_stinger`
- `vault_ledger_core_stinger`
- `vault_audit_core_stinger`
- `dvig_logs_core_stinger`
- Génération automatique via `render_platform_compose.sh`

**Ressources** :
- +5 volumes
- Disque : Taille selon utilisation (initialement vide)

**Évaluation** : ✅ **Impact minimal** — Volumes standard, génération automatique

---

### 8. Bases de Données PostgreSQL

#### 8.1 Bases Actuelles

**État actuel** :
- `dorevia_vault` (tenant `core`, container `vault-db-core`)
- `dorevia_vault` (tenant `dido`, container `vault-db-dido`)
- `odoo_lab_core`, `odoo_stinger_core`, `odoo_prod_core` (apps)

**Impact avec Double Stack** :

**Option A : Conforme v2.0** :
- Nouvelle base : `dorevia_vault` (tenant `core-stinger`, container `vault-db-core-stinger`)
- ✅ **NOUVELLE BASE** créée automatiquement
- Nom conforme : 1 base par tenant

**Option B : Explicite (document v2.1.0)** :
- Nouvelle base : `dorevia_vault_stinger` (non conforme)
- ⚠️ **MODIFICATION** nécessaire pour nommer base différemment

**Évaluation** :
- Option A : ✅ **Impact minimal** (base standard)
- Option B : 🟡 **Modification nécessaire** (nom non conforme)

---

### 9. Tokens DVIG

#### 9.1 Fichiers Actuels

**État actuel** :
- `tenants/core/secrets/dvig.tokens.yml` (tous les tokens core)
- `tenants/dido/secrets/dvig.tokens.yml` (tous les tokens dido)
- etc.

**Impact avec Double Stack** :

**Option A : Nouveau tenant** :
- Nouveau fichier : `tenants/core-stinger/secrets/dvig.tokens.yml`
- ✅ **NOUVEAU FICHIER** créé
- Tokens avec source : `odoo.stinger.core-stinger`

**Option B : Document v2.1.0** :
- Fichier : `tenants/core/secrets/dvig.stinger.tokens.yml`
- ⚠️ **FICHIER DANS MAUVAIS RÉPERTOIRE** (devrait être dans `core-stinger/`)

**Évaluation** :
- Option A : ✅ **Impact minimal** (fichier standard)
- Option B : ⚠️ **Incohérence** (fichier dans mauvais répertoire)

---

### 10. Réseau Docker

#### 10.1 Réseau Actuel

**État actuel** :
- Réseau : `dorevia-network` (externe, partagé)
- Tous les containers connectés à ce réseau

**Impact avec Double Stack** :
- ✅ **AUCUN CHANGEMENT** nécessaire
- Nouveaux containers (`dvig-core-stinger`, etc.) connectés au même réseau
- Isolation par nom de container, pas par réseau

**Évaluation** : ✅ **Aucun impact** — Utilise réseau existant

---

## 📊 Impact Ressources Système

### Containers

| Composant | Actuel | Après Double Stack | Impact |
|-----------|--------|-------------------|--------|
| **DVIG** | 3 (`core`, `dido`, `rozas`) | 4 (+ `core-stinger`) | +1 container |
| **Vault** | 3 (`core`, `dido`, `rozas`) | 4 (+ `core-stinger`) | +1 container |
| **Vault DB** | 3 (`core`, `dido`, `rozas`) | 4 (+ `core-stinger`) | +1 container |
| **Total** | 9 containers | 12 containers | **+3 containers** |

### Volumes

| Composant | Actuel | Après Double Stack | Impact |
|-----------|--------|-------------------|--------|
| **Vault DB** | 3 volumes | 4 volumes | +1 volume |
| **Vault Storage** | 3 volumes | 4 volumes | +1 volume |
| **Vault Ledger** | 3 volumes | 4 volumes | +1 volume |
| **Vault Audit** | 3 volumes | 4 volumes | +1 volume |
| **DVIG Logs** | 3 volumes | 4 volumes | +1 volume |
| **Total** | 15 volumes | 20 volumes | **+5 volumes** |

### Bases de Données

| Composant | Actuel | Après Double Stack | Impact |
|-----------|--------|-------------------|--------|
| **Vault** | 3 bases (`dorevia_vault` × 3 tenants) | 4 bases (+ `dorevia_vault` pour `core-stinger`) | +1 base |
| **Odoo** | 9 bases (3 env × 3 tenants) | 9 bases (inchangé) | Aucun |

### RAM

**Estimation** :
- DVIG : ~200-300MB par instance
- Vault : ~300-500MB par instance
- Vault DB : ~100-200MB par instance
- **Total supplémentaire** : ~600MB-1GB

### CPU

**Estimation** :
- Impact minimal (services peu CPU-intensive)
- +10-20% CPU selon charge

### Disque

**Estimation** :
- Volumes initialement vides
- Croissance selon utilisation
- Base de données : ~100MB-1GB initialement

---

## 🔧 Actions Nécessaires

### Actions Automatiques (via infrastructure existante)

1. ✅ **Créer répertoire tenant** : `tenants/core-stinger/`
2. ✅ **Créer manifest** : `tenants/core-stinger/state/manifest.json`
3. ✅ **Générer docker-compose** : Via `render_platform_compose.sh`
4. ✅ **Générer Caddyfile** : Via `render_caddyfile.sh` (si hostnames conformes)
5. ✅ **Déployer containers** : Via `dorevia.sh platform up core-stinger`

### Actions Manuelles

1. ⚠️ **Créer enregistrements DNS** :
   - `dvig.core-stinger.doreviateam.com` (Option A)
   - OU `dvig.stinger.core.doreviateam.com` (Option B, non conforme)

2. ⚠️ **Modifier Caddyfile** (si Option B) :
   - Ajouter hostnames avec `<env>` manuellement
   - OU créer script personnalisé

3. ⚠️ **Créer fichier tokens** :
   - `tenants/core-stinger/secrets/dvig.tokens.yml` (Option A)
   - OU `tenants/core/secrets/dvig.stinger.tokens.yml` (Option B)

4. ⚠️ **Nommer base de données** (si Option B) :
   - Modifier pour utiliser `dorevia_vault_stinger` au lieu de `dorevia_vault`

---

## ✅ Avantages de l'Approche Double Stack

1. **Aucune modification code** : Utilise infrastructure existante
2. **Aucun breaking change** : Pas de modification signature CLI
3. **Isolation complète** : Deux stacks totalement indépendantes
4. **PROD préservée** : Aucun impact sur production
5. **Génération automatique** : Scripts existants fonctionnent
6. **Maintenance simple** : Même processus que autres tenants
7. **Migration future possible** : Peut évoluer vers multi-env plus tard

---

## ⚠️ Points d'Attention

1. **Hostnames** : Choisir entre conformité v2.0 ou explicité
2. **Fichiers tokens** : Répertoire correct (`core-stinger/` ou `core/`)
3. **Base de données** : Nom conforme (`dorevia_vault`) ou explicite (`dorevia_vault_stinger`)
4. **Ressources** : +3 containers, +5 volumes, +1 base de données
5. **DNS** : Créer nouveaux enregistrements

---

## 📋 Checklist d'Implémentation

### Préparation

- [ ] Décider hostnames : Conformes v2.0 ou explicites ?
- [ ] Décider répertoire tokens : `core-stinger/` ou `core/` ?
- [ ] Décider nom base : `dorevia_vault` ou `dorevia_vault_stinger` ?

### Création Tenant

- [ ] Créer répertoire : `tenants/core-stinger/`
- [ ] Créer manifest : `tenants/core-stinger/state/manifest.json`
- [ ] Créer répertoire secrets : `tenants/core-stinger/secrets/`

### Génération Configs

- [ ] Générer docker-compose : `dorevia.sh render core-stinger --env lab`
- [ ] Générer Caddyfile : Automatique (si hostnames conformes)
- [ ] Vérifier configs générées

### DNS

- [ ] Créer enregistrements DNS (selon option choisie)
- [ ] Vérifier propagation DNS

### Déploiement

- [ ] Déployer platform : `dorevia.sh platform up core-stinger`
- [ ] Vérifier containers : `docker ps | grep core-stinger`
- [ ] Vérifier health : `curl https://dvig.core-stinger.doreviateam.com/health`

### Tokens

- [ ] Créer fichier tokens : `tenants/core-stinger/secrets/dvig.tokens.yml`
- [ ] Générer tokens : `dorevia.sh token issue odoo stinger core-stinger`
- [ ] Vérifier tokens chargés

### Gateway

- [ ] Agréger Caddyfile : `dorevia.sh gateway aggregate --reload`
- [ ] Vérifier hostnames dans Caddyfile
- [ ] Vérifier certificats SSL

### Tests

- [ ] Tests smoke : Health checks
- [ ] Tests fonctionnels : Flux E2E
- [ ] Tests isolation : PROD inchangée

---

## 📊 Comparaison Impact : v2.0.0 vs v2.1.0

| Aspect | v2.0.0 (Séparation core) | v2.1.0 (Double Stack) |
|--------|--------------------------|------------------------|
| **Modifications code** | ❌ Majeures (scripts, CLI) | ✅ Aucune |
| **Breaking changes** | ❌ Oui (signature CLI) | ✅ Non |
| **Migration PROD** | ❌ Nécessaire (base Vault) | ✅ Aucune |
| **Création tenant** | ❌ Non (modification core) | ✅ Oui (nouveau tenant) |
| **Génération auto** | ❌ Modifications nécessaires | ✅ Automatique |
| **Ressources** | +3 containers | +3 containers |
| **Complexité** | ❌ Élevée | ✅ Faible |
| **Risque** | 🔴 Élevé (migration PROD) | 🟢 Faible (nouveau tenant) |

---

## ✅ Conclusion

L'approche **Double Stack (v2.1.0)** a un **impact minimal** sur l'infrastructure actuelle car elle utilise l'architecture multi-tenant existante sans modification de code.

**Points clés** :
- ✅ **Aucune modification code** : Scripts existants fonctionnent
- ✅ **Aucun breaking change** : Pas de modification signature CLI
- ✅ **Génération automatique** : Configs générées automatiquement
- ✅ **Isolation complète** : Deux stacks indépendantes
- ✅ **PROD préservée** : Aucun impact sur production

**Points à clarifier** :
- ⚠️ Hostnames : Conformes v2.0 ou explicites ?
- ⚠️ Fichiers tokens : Répertoire correct ?
- ⚠️ Base de données : Nom conforme ou explicite ?

**Recommandation** : Approche **excellente** avec impact minimal. Une fois les points de clarification résolus, l'implémentation est **immédiate** sans modification de code.

**Statut recommandé** : ✅ **Prêt pour implémentation** (après clarifications)

---

**Version** : 1.0  
**Date** : 2026-01-10  
**Statut** : 📋 **Analyse complétée**
