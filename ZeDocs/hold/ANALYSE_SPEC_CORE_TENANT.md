# 🔍 Analyse SPEC CORE Tenant - Conséquences sur l'Implémentation

**Date** : 2025-01-28  
**SPEC Analysée** : SPEC — Plateforme Dorevia — CORE (tenant) + Environnements Odoo LAB/STINGER/PROD v1.0  
**Statut** : Analyse complète des impacts

---

## 📋 Résumé Exécutif

### Changements Majeurs

La nouvelle SPEC introduit un **modèle d'architecture centralisé** avec :

1. **Tenant unique `core`** : Remplace les multiples tenants actuels
2. **Services partagés** : DVIG + Vault communs à tous les environnements
3. **3 instances Odoo isolées** : LAB, STINGER, PROD avec données séparées
4. **Convention DNS** : `<application>.<environnement>.<tenant>.doreviateam.com`
5. **Sources DVIG** : Format `odoo.<environnement>.core` (au lieu de `odoo.lab.core` actuel)

### Impacts Critiques

- ⚠️ **BREAKING CHANGE** : Format des sources DVIG change
- ⚠️ **BREAKING CHANGE** : Convention DNS change
- ⚠️ **ARCHITECTURE** : Services partagés (DVIG/Vault) au lieu d'instances par environnement
- ⚠️ **ISOLATION** : STINGER doit être recréé avec isolation complète
- ⚠️ **TOKENS** : Nouveaux tokens nécessaires pour chaque environnement

---

## 1. Analyse des Différences

### 1.1 Architecture Actuelle vs Cible

#### Architecture Actuelle

```
┌──────────────┐
│  DVIG LAB    │  (instance séparée, port 18120)
├──────────────┤
│  Odoo LAB    │  (base core_lab, port 18069)
└──────────────┘

┌──────────────┐
│  DVIG PROD   │  (configuration présente, non déployée)
├──────────────┤
│  Odoo PROD   │  (configuration présente, non déployée)
└──────────────┘

STINGER : ❌ Supprimé
```

#### Architecture Cible (SPEC)

```
┌──────────────────────┐
│  DVIG (partagé)      │  (une seule instance)
├──────────────────────┤
│  Vault (partagé)     │  (une seule instance)
└──────────┬───────────┘
           │
   ┌───────┼───────┐
   │       │       │
┌──▼──┐ ┌──▼──┐ ┌──▼──┐
│LAB  │ │STG  │ │PROD │  (3 Odoo isolés)
└─────┘ └─────┘ └─────┘
```

**Différences clés** :
- ✅ **Services partagés** : DVIG/Vault communs (au lieu d'instances séparées)
- ✅ **STINGER recréé** : Instance Odoo dédiée avec isolation complète
- ✅ **DNS centralisé** : Convention `<app>.<env>.<tenant>.doreviateam.com`

---

### 1.2 Convention DNS

#### Actuel

```
odoo.lab.core.doreviateam.com     ✅ (existe)
odoo.stinger.core.doreviateam.com ❌ (supprimé)
odoo.prod.core.doreviateam.com    ⚠️ (configuré, non déployé)
```

#### Cible (SPEC)

```
odoo.lab.core.doreviateam.com     ✅ (conforme)
odoo.stinger.core.doreviateam.com ✅ (à recréer)
odoo.prod.core.doreviateam.com    ✅ (à déployer)

dvig.core.doreviateam.com         ⚠️ (nouveau)
vault.core.doreviateam.com        ⚠️ (nouveau)
```

**Impact** : ✅ **Compatible** (convention déjà en place)

---

### 1.3 Sources DVIG

#### Clarification Contractuelle (Document fourni)

**Format normatif** :
```
<univers>.<environnement>.<tenant>
```

**Exemples valides** :
- `odoo.lab.core` ✅
- `odoo.stinger.core` ✅
- `odoo.prod.core` ✅

**Exemples invalides** :
- `core.odoo.lab` ❌
- `odoo.core` ❌
- `odoo.lab` ❌
- `odoo.prod.rehtse` ❌ (tenant incorrect)

#### Actuel

Format actuel dans `validation.py` :
```python
def validate_source_univers(source: str, auth_info: AuthInfo) -> None:
    """
    Valide que source correspond à univers du token.
    Règle: source MUST start with "<univers>."
    """
    if not source.startswith(f"{auth_info.univers}."):
        raise HTTPException(status_code=403, ...)
```

**Problème** : Validation actuelle **trop permissive**
- ✅ Accepte `odoo.lab.core` (correct)
- ⚠️ Accepte aussi `odoo.xxx` (incorrect selon clarification)
- ❌ N'accepte pas le format strict `univers.env.tenant`

#### Cible (Clarification Contractuelle)

**Règles de validation** :
1. Format exact : `univers.env.tenant`
2. `univers` du source = `univers` du token
3. `tenant` du source = `tenant` du token
4. `env` doit être dans `{lab, stinger, prod}`

**Politique par environnement** :
- **LAB** : Validation stricte recommandée (tolérance possible temporaire)
- **STINGER** : Validation stricte obligatoire
- **PROD** : Validation stricte obligatoire

**Impact** : 🔴 **BREAKING CHANGE** - Validation doit être renforcée

---

### 1.4 Tokens DVIG

#### Clarification Contractuelle (Document fourni)

**Structure minimale d'un token** :
```yaml
id: "tok_prod_core_001"
token_hash: "sha256:…"
tenant: "core"  # ⚠️ DOIT correspondre au tenant DNS
univers: "odoo"
status: "active"
```

**Règles contractuelles** :
- Le tenant DVIG **DOIT correspondre exactement** au tenant DNS
- Un token est scopé à **un univers unique**
- Les tokens LAB / STINGER / PROD sont **distincts** et **non interchangeables**
- Un token ≠ un environnement, mais un environnement = une source

#### Actuel

**Structure tokens.yml** :
```yaml
tokens:
  - id: "tok_001"
    token_hash: "sha256:..."
    tenant: "rehtse"  # ⚠️ Tenant métier (INCORRECT)
    univers: "odoo"
    status: "active"
```

**Problème** : Le champ `tenant` contient un tenant métier (`rehtse`), pas le tenant DNS `core`.  
**Violation** : Le tenant DVIG ne correspond pas au tenant DNS.

#### Cible (Clarification Contractuelle)

**Tokens attendus** :
- Token LAB : `tenant: "core"`, `univers: "odoo"`, source `odoo.lab.core`
- Token STINGER : `tenant: "core"`, `univers: "odoo"`, source `odoo.stinger.core`
- Token PROD : `tenant: "core"`, `univers: "odoo"`, source `odoo.prod.core`

**Impact** : 🔴 **BREAKING CHANGE CRITIQUE** - Tous les tokens actuels doivent être régénérés avec `tenant: "core"` pour respecter le contrat.

---

### 1.5 Isolation des Données

#### Actuel

**LAB** :
- ✅ Base : `core_lab` (isolée)
- ✅ Filestore : `odoo_lab_data` (isolé)
- ✅ Volumes : `odoo_db_lab_data`, `odoo_odoo_lab_data`

**STINGER** :
- ❌ Supprimé (problèmes d'architecture)

**PROD** :
- ⚠️ Configuration présente mais non déployée

#### Cible (SPEC)

**LAB** :
- ✅ Base : `odoo_lab` (recommandé) ou `core_lab` (actuel)
- ✅ Filestore : `odoo_lab_data`
- ✅ Volumes : `odoo_lab_data`, `odoo_db_lab_data`

**STINGER** :
- ⚠️ **À CRÉER** : Base `odoo_stinger`, Filestore `odoo_stinger_data`
- ⚠️ **ISOLATION COMPLÈTE** : Aucun partage avec LAB/PROD

**PROD** :
- ⚠️ **À DÉPLOYER** : Base `odoo_prod`, Filestore `odoo_prod_data`
- ⚠️ **ISOLATION COMPLÈTE** : Aucun partage avec LAB/STINGER

**Impact** : ⚠️ **CHANGEMENTS NÉCESSAIRES**
- STINGER doit être recréé avec isolation complète
- PROD doit être déployé avec isolation complète
- Noms de bases de données à aligner (optionnel)

---

### 1.6 Services Partagés

#### Actuel

**DVIG** :
- LAB : Instance séparée (`dvig-lab-new`, port 18120)
- PROD : Configuration présente, non déployée

**Vault** :
- Instance unique (probablement partagée déjà)

#### Cible (SPEC)

**DVIG** :
- ✅ **UNE SEULE INSTANCE** partagée pour LAB/STINGER/PROD
- ✅ Accessible via `dvig.core.doreviateam.com`
- ✅ Port interne (pas de port exposé sur hôte)

**Vault** :
- ✅ **UNE SEULE INSTANCE** partagée pour LAB/STINGER/PROD
- ✅ Accessible via `vault.core.doreviateam.com`
- ✅ Port interne (pas de port exposé sur hôte)

**Impact** : ⚠️ **CHANGEMENT MAJEUR**
- DVIG LAB actuel doit être migré vers instance partagée
- Configuration DVIG doit supporter multi-environnements
- Tokens DVIG doivent distinguer les environnements

---

### 1.7 Routage Caddy

#### Actuel

```caddy
odoo.lab.core.doreviateam.com {
  reverse_proxy host.docker.internal:18069
}

odoo.prod.core.doreviateam.com {
  reverse_proxy host.docker.internal:38069
}
```

**Problème** : Utilise `host.docker.internal` avec ports exposés sur l'hôte.

#### Cible (SPEC)

```caddy
odoo.lab.core.doreviateam.com {
  reverse_proxy odoo_lab:8069
}

odoo.stinger.core.doreviateam.com {
  reverse_proxy odoo_stinger:8069
}

odoo.prod.core.doreviateam.com {
  reverse_proxy odoo_prod:8069
}

dvig.core.doreviateam.com {
  reverse_proxy dvig:8080
}

vault.core.doreviateam.com {
  reverse_proxy vault:8080
}
```

**Impact** : ⚠️ **CHANGEMENT NÉCESSAIRE**
- Caddy doit être sur le même réseau Docker que les services
- Plus de ports exposés sur l'hôte (sécurité améliorée)
- Routage par nom de service Docker

---

## 2. Impacts par Composant

### 2.1 DVIG

#### Changements Requis

1. **Architecture** :
   - ❌ Supprimer instances séparées (LAB, PROD)
   - ✅ Créer instance partagée unique
   - ✅ Support multi-environnements via tokens

2. **Tokens** :
   - ⚠️ Régénérer tous les tokens avec `tenant: "core"`
   - ⚠️ Créer tokens distincts : LAB, STINGER, PROD
   - ⚠️ Format source : `odoo.lab.core`, `odoo.stinger.core`, `odoo.prod.core`

3. **Validation** :
   - ⚠️ Renforcer validation source pour exiger format `odoo.<env>.core`
   - ✅ Validation actuelle compatible mais moins stricte

4. **Configuration** :
   - ⚠️ Variables d'environnement pour instance partagée
   - ⚠️ Tokens YAML avec tokens pour les 3 environnements

5. **Docker** :
   - ⚠️ Nouveau `docker-compose.yml` pour services partagés
   - ⚠️ Supprimer `docker-compose.lab.yml`, `docker-compose.prod.yml` (DVIG)

**Fichiers Impactés** :
- `sources/dvig/dvig/api_fastapi/auth/validation.py` (renforcer validation)
- `sources/dvig/conf/tokens.yml` (régénérer avec tenant `core`)
- `sources/dvig/docker/docker-compose.yml` (nouveau pour services partagés)
- `sources/dvig/docker/docker-compose.lab.yml` (à supprimer)
- `sources/dvig/docker/docker-compose.prod.yml` (à supprimer)

**Effort Estimé** : 🟡 **MOYEN** (2-3h)

---

### 2.2 Vault

#### Changements Requis

1. **Architecture** :
   - ✅ Instance unique (probablement déjà le cas)
   - ✅ Support multi-environnements via `source` dans payloads

2. **Configuration** :
   - ⚠️ Vérifier que Vault supporte bien les sources `odoo.lab.core`, `odoo.stinger.core`, `odoo.prod.core`
   - ✅ Vault est déjà multi-tenant via `tenant` header

3. **Docker** :
   - ⚠️ Intégrer dans `docker-compose.yml` services partagés
   - ⚠️ Port interne (pas d'exposition sur hôte)

**Fichiers Impactés** :
- Configuration Vault (si nécessaire)
- `docker-compose.yml` services partagés

**Effort Estimé** : 🟢 **FAIBLE** (1h)

---

### 2.3 Odoo

#### Changements Requis

1. **Architecture** :
   - ✅ LAB : Maintenir (isolation déjà OK)
   - ⚠️ STINGER : **RECRÉER** avec isolation complète
   - ⚠️ PROD : **DÉPLOYER** avec isolation complète

2. **Bases de Données** :
   - ⚠️ LAB : `core_lab` → Optionnel : renommer en `odoo_lab` (recommandation SPEC)
   - ⚠️ STINGER : Créer `odoo_stinger` (nouveau)
   - ⚠️ PROD : Créer `odoo_prod` (nouveau)

3. **Volumes** :
   - ✅ LAB : `odoo_lab_data`, `odoo_db_lab_data` (OK)
   - ⚠️ STINGER : Créer `odoo_stinger_data`, `odoo_db_stinger_data`
   - ⚠️ PROD : Créer `odoo_prod_data`, `odoo_db_prod_data`

4. **Configuration** :
   - ⚠️ `dbfilter` : `^odoo_lab$`, `^odoo_stinger$`, `^odoo_prod$` (si renommage)
   - ⚠️ Ou garder `^core_lab$` (actuel) si pas de renommage

5. **Docker Compose** :
   - ✅ `docker-compose.lab.yml` (maintenir)
   - ⚠️ `docker-compose.stinger.yml` (à recréer avec isolation complète)
   - ⚠️ `docker-compose.prod.yml` (à finaliser et déployer)

**Fichiers Impactés** :
- `units/odoo/docker-compose.stinger.yml` (à recréer)
- `units/odoo/docker-compose.prod.yml` (à finaliser)
- `units/odoo/conf/odoo.stinger.conf` (à recréer)
- `units/odoo/conf/odoo.prod.conf` (à vérifier)

**Effort Estimé** : 🔴 **ÉLEVÉ** (4-6h)
- STINGER : 2-3h (recréation complète)
- PROD : 2-3h (déploiement)

---

### 2.4 Gateway (Caddy)

#### Changements Requis

1. **Routage** :
   - ⚠️ Ajouter `odoo.stinger.core.doreviateam.com`
   - ⚠️ Ajouter `dvig.core.doreviateam.com`
   - ⚠️ Ajouter `vault.core.doreviateam.com`
   - ⚠️ Changer routage : `host.docker.internal:port` → `service_name:port`

2. **Réseau Docker** :
   - ⚠️ Caddy doit être sur le même réseau que les services
   - ⚠️ Plus de ports exposés sur l'hôte (sécurité)

**Fichiers Impactés** :
- `units/gateway/Caddyfile` (routage complet)

**Effort Estimé** : 🟡 **MOYEN** (1-2h)

---

## 3. Plan d'Action Recommandé

### Phase 1 : Préparation (1-2h)

1. **Analyse complète** :
   - ✅ Documenter état actuel
   - ✅ Identifier tous les changements nécessaires

2. **Régénération tokens DVIG** :
   - Générer tokens pour LAB, STINGER, PROD avec `tenant: "core"`
   - Format sources : `odoo.lab.core`, `odoo.stinger.core`, `odoo.prod.core`

3. **Renforcement validation DVIG** :
   - Valider format strict `odoo.<env>.core`
   - Tester avec nouveaux tokens

### Phase 2 : Services Partagés (2-3h)

1. **DVIG partagé** :
   - Créer `docker-compose.yml` services partagés
   - Configurer instance unique
   - Migrer tokens (tenant `core`)
   - Tester avec LAB

2. **Vault partagé** :
   - Vérifier configuration
   - Intégrer dans `docker-compose.yml` services partagés

3. **Caddy** :
   - Mettre à jour `Caddyfile` avec nouveaux routages
   - Configurer réseau Docker partagé

### Phase 3 : Odoo STINGER (2-3h)

1. **Recréation complète** :
   - Créer `docker-compose.stinger.yml` avec isolation complète
   - Créer base `odoo_stinger`
   - Créer volumes dédiés
   - Configurer `odoo.stinger.conf`

2. **Validation** :
   - Tester isolation (pas de partage avec LAB)
   - Tester accès via `odoo.stinger.core.doreviateam.com`
   - Tester intégration DVIG (token STINGER)

### Phase 4 : Odoo PROD (2-3h)

1. **Déploiement** :
   - Finaliser `docker-compose.prod.yml`
   - Créer base `odoo_prod`
   - Créer volumes dédiés
   - Configurer `odoo.prod.conf`

2. **Validation** :
   - Tester isolation complète
   - Tester accès via `odoo.prod.core.doreviateam.com`
   - Tester intégration DVIG (token PROD)

### Phase 5 : Migration LAB (1-2h)

1. **Migration DVIG** :
   - Arrêter DVIG LAB actuel
   - Migrer vers instance partagée
   - Tester intégration

2. **Optionnel - Renommage base** :
   - `core_lab` → `odoo_lab` (si souhaité)
   - Mettre à jour `dbfilter`

---

## 4. Risques & Points d'Attention

### 4.1 Risques Critiques

1. **BREAKING CHANGE Tokens** :
   - ⚠️ Tous les tokens actuels deviennent invalides
   - ⚠️ Régénération nécessaire avant migration
   - ⚠️ Coordination avec équipes utilisatrices

2. **BREAKING CHANGE Sources** :
   - ⚠️ Format source change (si validation renforcée)
   - ⚠️ Tests nécessaires pour compatibilité

3. **Services Partagés** :
   - ⚠️ Un changement DVIG/Vault impacte tous les environnements
   - ⚠️ Déploiements doivent être très prudents
   - ⚠️ Tests exhaustifs avant déploiement

4. **STINGER Recréation** :
   - ⚠️ Données STINGER perdues (si existantes)
   - ⚠️ Isolation complète à vérifier
   - ⚠️ Pas de partage accidentel avec LAB/PROD

### 4.2 Points d'Attention

1. **Validation Source** :
   - Validation actuelle accepte `odoo.xxx` (moins strict)
   - SPEC exige `odoo.<env>.core` (plus strict)
   - **Recommandation** : Renforcer validation progressivement

2. **Nommage Bases** :
   - SPEC recommande `odoo_lab`, `odoo_stinger`, `odoo_prod`
   - Actuel : `core_lab` (LAB)
   - **Recommandation** : Optionnel, peut garder `core_lab` si stable

3. **Ports Exposés** :
   - SPEC : Pas de ports sur hôte (sécurité)
   - Actuel : Ports exposés (18069, 18120, etc.)
   - **Recommandation** : Migration progressive, garder ports temporairement pour transition

4. **Réseau Docker** :
   - Caddy doit être sur même réseau que services
   - **Recommandation** : Créer réseau `dorevia-network` partagé

---

## 5. Checklist de Migration

### Pré-Migration

- [ ] Analyser tous les tokens DVIG actuels
- [ ] Régénérer tokens avec `tenant: "core"`
- [ ] Documenter état actuel (backup)
- [ ] Créer plan de rollback

### Migration Services Partagés

- [ ] Créer `docker-compose.yml` services partagés
- [ ] Configurer DVIG partagé
- [ ] Configurer Vault partagé
- [ ] Mettre à jour Caddyfile
- [ ] Tester routage Caddy

### Migration Odoo

- [ ] Recréer STINGER (isolation complète)
- [ ] Déployer PROD (isolation complète)
- [ ] Vérifier isolation (pas de partage)
- [ ] Tester accès DNS

### Post-Migration

- [ ] Valider tous les critères d'acceptation SPEC
- [ ] Tests end-to-end (LAB, STINGER, PROD)
- [ ] Documentation mise à jour
- [ ] Supprimer anciennes configurations

---

## 6. Estimation Globale

| Phase | Effort | Priorité |
|-------|--------|----------|
| **Phase 1 : Préparation** | 1-2h | 🔴 Critique |
| **Phase 2 : Services Partagés** | 2-3h | 🔴 Critique |
| **Phase 3 : Odoo STINGER** | 2-3h | 🟡 Important |
| **Phase 4 : Odoo PROD** | 2-3h | 🟡 Important |
| **Phase 5 : Migration LAB** | 1-2h | 🟢 Optionnel |
| **TOTAL** | **8-13h** | - |

---

## 7. Recommandations

### 7.1 Approche Progressive

**Recommandation** : Migration en plusieurs étapes pour minimiser les risques :

1. **Étape 1** : Services partagés (DVIG/Vault) + Caddy
2. **Étape 2** : Odoo STINGER (recréation)
3. **Étape 3** : Odoo PROD (déploiement)
4. **Étape 4** : Migration LAB (optionnel)

### 7.2 Validation Source

**Recommandation** : Renforcer validation progressivement :

1. **Phase 1** : Validation actuelle (compatible)
2. **Phase 2** : Validation stricte `odoo.<env>.core` avec warning
3. **Phase 3** : Validation stricte obligatoire

### 7.3 Ports Exposés

**Recommandation** : Migration progressive :

1. **Phase 1** : Garder ports exposés (transition)
2. **Phase 2** : Désactiver ports progressivement
3. **Phase 3** : Ports internes uniquement (conforme SPEC)

---

## 8. Matrice d'Impact Détaillée

### 8.1 Composants Impactés

| Composant | Impact | Changements | Effort | Priorité |
|-----------|--------|-------------|--------|----------|
| **DVIG** | 🔴 **CRITIQUE** | Instance partagée, tokens `core`, validation source | 2-3h | 🔴 Critique |
| **Vault** | 🟡 **MOYEN** | Vérification configuration, intégration compose | 1h | 🟡 Important |
| **Odoo LAB** | 🟢 **FAIBLE** | Optionnel : renommage base, migration DVIG | 1-2h | 🟢 Optionnel |
| **Odoo STINGER** | 🔴 **CRITIQUE** | Recréation complète avec isolation | 2-3h | 🔴 Critique |
| **Odoo PROD** | 🔴 **CRITIQUE** | Déploiement avec isolation | 2-3h | 🔴 Critique |
| **Caddy** | 🟡 **MOYEN** | Nouveau routage, réseau Docker | 1-2h | 🟡 Important |
| **Tokens DVIG** | 🔴 **CRITIQUE** | Régénération tous tokens (tenant `core`) | 1h | 🔴 Critique |

### 8.2 Breaking Changes

1. **Tokens DVIG** :
   - ❌ Tous les tokens actuels deviennent invalides
   - ✅ Nouveaux tokens avec `tenant: "core"` requis
   - ⚠️ Coordination nécessaire avec équipes utilisatrices

2. **Architecture Services** :
   - ❌ Instances DVIG séparées (LAB, PROD) supprimées
   - ✅ Instance DVIG unique partagée
   - ⚠️ Impact sur tous les environnements simultanément

3. **Routage Caddy :
   - ❌ `host.docker.internal:port` (ports exposés)
   - ✅ `service_name:port` (réseau Docker)
   - ⚠️ Caddy doit être sur même réseau

### 8.3 Compatibilités

1. **DNS** :
   - ✅ Convention `odoo.lab.core.doreviateam.com` déjà en place
   - ✅ Compatible avec SPEC

2. **Validation Source** :
   - ⚠️ **NON CONFORME** : Validation actuelle trop permissive
   - ❌ Accepte `odoo.xxx` (incorrect selon clarification)
   - ✅ Doit accepter uniquement `univers.env.tenant` (format strict)
   - ✅ Doit vérifier `tenant` du source = `tenant` du token
   - 🔴 **ACTION REQUISE** : Renforcer validation selon clarification contractuelle

3. **Tokens** :
   - ❌ **NON CONFORME** : Tokens actuels avec `tenant: "rehtse"` (ou autre)
   - ✅ Doit être `tenant: "core"` (conforme tenant DNS)
   - 🔴 **ACTION REQUISE** : Régénérer tous les tokens

4. **Isolation Données** :
   - ✅ LAB : Déjà isolé (`core_lab`, volumes dédiés)
   - ❌ STINGER : À recréer (supprimé précédemment)
   - ⚠️ PROD : Configuration présente, isolation à vérifier

---

## 9. Détails Techniques par Composant

### 9.1 DVIG - Changements Détaillés

#### Fichiers à Modifier

1. **`sources/dvig/dvig/api_fastapi/auth/validation.py`** :
   ```python
   # ACTUEL (trop permissif - NON CONFORME)
   if not source.startswith(f"{auth_info.univers}."):
       raise HTTPException(...)
   
   # CONFORME (selon Clarification Contractuelle)
   import re
   from typing import List
   
   # Environnements autorisés
   VALID_ENVIRONMENTS: List[str] = ["lab", "stinger", "prod"]
   
   # Pattern strict : univers.env.tenant
   SOURCE_PATTERN = re.compile(r'^([^.]+)\.([^.]+)\.([^.]+)$')
   
   def validate_source_univers(source: str, auth_info: AuthInfo) -> None:
       """
       Valide la source selon le contrat :
       - Format : univers.env.tenant
       - univers du source = univers du token
       - tenant du source = tenant du token
       - env dans {lab, stinger, prod}
       """
       # 1. Vérifier format univers.env.tenant
       match = SOURCE_PATTERN.match(source)
       if not match:
           raise HTTPException(
               status_code=403,
               detail={
                   "status": "error",
                   "error": {
                       "code": "INVALID_SOURCE_FORMAT",
                       "message": "Source doit être au format 'univers.env.tenant' (ex: odoo.lab.core)"
                   }
               }
           )
       
       source_univers, source_env, source_tenant = match.groups()
       
       # 2. Vérifier univers
       if source_univers != auth_info.univers:
           raise HTTPException(
               status_code=403,
               detail={
                   "status": "error",
                   "error": {
                       "code": "UNIVERSE_MISMATCH",
                       "message": f"Univers '{source_univers}' ne correspond pas à l'univers du token '{auth_info.univers}'"
                   }
               }
           )
       
       # 3. Vérifier tenant
       if source_tenant != auth_info.tenant:
           raise HTTPException(
               status_code=403,
               detail={
                   "status": "error",
                   "error": {
                       "code": "TENANT_MISMATCH",
                       "message": f"Tenant '{source_tenant}' ne correspond pas au tenant du token '{auth_info.tenant}'"
                   }
               }
           )
       
       # 4. Vérifier environnement (selon politique)
       if source_env not in VALID_ENVIRONMENTS:
           raise HTTPException(
               status_code=403,
               detail={
                   "status": "error",
                   "error": {
                       "code": "INVALID_ENVIRONMENT",
                       "message": f"Environnement '{source_env}' invalide. Valeurs autorisées: {VALID_ENVIRONMENTS}"
                   }
               }
           )
       
       # 5. Politique stricte pour STINGER/PROD (selon clarification)
       # LAB peut être tolérant temporairement, STINGER/PROD strict
       # (à implémenter selon politique)
   ```

2. **`sources/dvig/conf/tokens.yml`** :
   ```yaml
   version: 1
   # Tokens DVIG - Tenant CORE (conforme Clarification Contractuelle)
   # Règle : tenant DVIG DOIT correspondre exactement au tenant DNS
   # Format source : univers.env.tenant (ex: odoo.lab.core)
   
   tokens:
     # Token LAB
     - id: "tok_lab_core_001"
       token_hash: "sha256:..."
       tenant: "core"  # ⚠️ CHANGEMENT CRITIQUE : était "rehtse" ou autre (NON CONFORME)
       univers: "odoo"
       status: "active"
       comment: "LAB - odoo.lab.core (tenant DNS: core)"
     
     # Token STINGER
     - id: "tok_stinger_core_001"
       token_hash: "sha256:..."
       tenant: "core"  # ⚠️ CHANGEMENT CRITIQUE
       univers: "odoo"
       status: "active"
       comment: "STINGER - odoo.stinger.core (tenant DNS: core)"
     
     # Token PROD
     - id: "tok_prod_core_001"
       token_hash: "sha256:..."
       tenant: "core"  # ⚠️ CHANGEMENT CRITIQUE
       univers: "odoo"
       status: "active"
       comment: "PROD - odoo.prod.core (tenant DNS: core)"
   
   # Règles contractuelles :
   # - Les tokens LAB/STINGER/PROD sont distincts et non interchangeables
   # - Un token LAB ne doit jamais produire une preuve PROD
   # - Le tenant DVIG ≡ tenant DNS ≡ tenant Vault
   ```

3. **`sources/dvig/docker/docker-compose.yml`** (NOUVEAU - services partagés) :
   ```yaml
   services:
     dvig:
       image: dorevia/dvig:0.1.2
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
       # Pas de port exposé sur hôte (routage via Caddy)
   
   networks:
     dorevia-network:
       external: true
   ```

#### Fichiers à Supprimer

- `sources/dvig/docker/docker-compose.lab.yml` (remplacé par services partagés)
- `sources/dvig/docker/docker-compose.prod.yml` (remplacé par services partagés)

---

### 9.2 Vault - Changements Détaillés

#### Fichiers à Modifier

1. **`docker-compose.yml` services partagés** (à créer ou modifier) :
   ```yaml
   services:
     vault:
       image: dorevia/vault:latest
       container_name: vault-core
       restart: unless-stopped
       networks:
         - dorevia-network
       environment:
         - DATABASE_URL=postgres://vault:password@vault-db:5432/dorevia_vault
         - PORT=8080
       # Pas de port exposé sur hôte (routage via Caddy)
       depends_on:
         - vault-db
   
     vault-db:
       image: postgres:16
       container_name: vault-db-core
       volumes:
         - vault_db_data:/var/lib/postgresql/data
       networks:
         - dorevia-network
   
   networks:
     dorevia-network:
       external: true
   ```

#### Vérifications

- ✅ Vault supporte déjà multi-tenant via header `X-Tenant`
- ✅ Vault accepte sources `odoo.lab.core`, `odoo.stinger.core`, `odoo.prod.core`
- ⚠️ Vérifier que Vault route correctement par `source` dans payloads

---

### 9.3 Odoo - Changements Détaillés

#### STINGER - Fichiers à Créer

1. **`units/odoo/docker-compose.stinger.yml`** :
   ```yaml
   services:
     db:
       image: postgres:16
       environment:
         POSTGRES_DB: odoo
         POSTGRES_USER: odoo
         POSTGRES_PASSWORD: odoo
       volumes:
         - db_stinger_data:/var/lib/postgresql/data
       networks:
         - dorevia-network
   
     odoo:
       image: odoo:18.0
       container_name: odoo-stinger
       depends_on:
         - db
       networks:
         - dorevia-network
       volumes:
         - ./custom-addons:/mnt/custom-addons
         - ./conf/odoo.stinger.conf:/etc/odoo/odoo.conf:ro
         - ../../sources/oca:/mnt/extra-addons:ro
         - odoo_stinger_data:/var/lib/odoo
       command: ["odoo", "-c", "/etc/odoo/odoo.conf"]
       # Pas de port exposé (routage via Caddy)
   
   volumes:
     db_stinger_data:
     odoo_stinger_data:
   
   networks:
     dorevia-network:
       external: true
   ```

2. **`units/odoo/conf/odoo.stinger.conf`** :
   ```ini
   [options]
   db_host = db
   db_port = 5432
   db_user = odoo
   db_password = odoo
   dbfilter = ^odoo_stinger$  # ⚠️ Base dédiée
   
   addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons,/mnt/custom-addons
   data_dir = /var/lib/odoo
   ```

#### PROD - Fichiers à Finaliser

1. **`units/odoo/docker-compose.prod.yml`** :
   ```yaml
   services:
     db:
       image: postgres:16
       environment:
         POSTGRES_DB: odoo
         POSTGRES_USER: odoo
         POSTGRES_PASSWORD: odoo
       volumes:
         - db_prod_data:/var/lib/postgresql/data
       networks:
         - dorevia-network
   
     odoo:
       image: odoo:18.0-20250819  # ⚠️ SPEC : Version taggée, pas latest
       container_name: odoo-prod
       depends_on:
         - db
       networks:
         - dorevia-network
       volumes:
         - ./custom-addons:/mnt/custom-addons
         - ./conf/odoo.prod.conf:/etc/odoo/odoo.conf:ro
         - ../../sources/oca:/mnt/extra-addons:ro
         - odoo_prod_data:/var/lib/odoo
       command: ["odoo", "-c", "/etc/odoo/odoo.conf"]
       # Pas de port exposé (routage via Caddy)
   
   volumes:
     db_prod_data:
     odoo_prod_data:
   
   networks:
     dorevia-network:
       external: true
   ```

2. **`units/odoo/conf/odoo.prod.conf`** :
   ```ini
   [options]
   db_host = db
   db_port = 5432
   db_user = odoo
   db_password = odoo
   dbfilter = ^odoo_prod$  # ⚠️ Base dédiée
   
   addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons,/mnt/custom-addons
   data_dir = /var/lib/odoo
   ```

#### LAB - Optionnel

**Option 1 : Garder `core_lab`** (recommandé si stable) :
- Pas de changement nécessaire
- `dbfilter = ^core_lab$` reste valide

**Option 2 : Renommer en `odoo_lab`** (alignement SPEC) :
- Renommer base : `ALTER DATABASE core_lab RENAME TO odoo_lab;`
- Modifier `odoo.lab.conf` : `dbfilter = ^odoo_lab$`

---

### 9.4 Caddy - Changements Détaillés

#### Fichier à Modifier

**`units/gateway/Caddyfile`** :
```caddy
{
  email admin@doreviateam.com
}

# Odoo - Environnements
odoo.lab.core.doreviateam.com {
  reverse_proxy odoo_lab:8069  # ⚠️ CHANGEMENT : était host.docker.internal:18069
}

odoo.stinger.core.doreviateam.com {
  reverse_proxy odoo_stinger:8069  # ⚠️ NOUVEAU
}

odoo.prod.core.doreviateam.com {
  reverse_proxy odoo_prod:8069  # ⚠️ CHANGEMENT : était host.docker.internal:38069
}

# Services partagés
dvig.core.doreviateam.com {
  reverse_proxy dvig-core:8080  # ⚠️ NOUVEAU
}

vault.core.doreviateam.com {
  reverse_proxy vault-core:8080  # ⚠️ NOUVEAU
}
```

#### Configuration Docker Compose Caddy

**`units/gateway/docker-compose.yml`** :
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
      - dorevia-network
    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:

networks:
  dorevia-network:
    external: true
```

---

## 10. Plan de Migration Détaillé

### Phase 1 : Préparation (1-2h)

#### 1.1 Analyse & Documentation
- [ ] Documenter état actuel complet
- [ ] Identifier tous les tokens DVIG existants
- [ ] Lister toutes les configurations actuelles

#### 1.2 Régénération Tokens
```bash
# Token LAB
python -m dvig.cli.token_gen --tenant core --univers odoo --output yaml > tokens_lab.yml

# Token STINGER
python -m dvig.cli.token_gen --tenant core --univers odoo --output yaml > tokens_stinger.yml

# Token PROD
python -m dvig.cli.token_gen --tenant core --univers odoo --output yaml > tokens_prod.yml

# Fusionner dans tokens.yml
```

#### 1.3 Renforcement Validation (OBLIGATOIRE selon Clarification)
- [ ] Modifier `validation.py` pour format strict `univers.env.tenant`
- [ ] Vérifier `tenant` du source = `tenant` du token
- [ ] Vérifier `univers` du source = `univers` du token
- [ ] Vérifier `env` dans `{lab, stinger, prod}`
- [ ] Implémenter politique : LAB tolérant (temporaire), STINGER/PROD strict
- [ ] Tester avec nouveaux tokens
- [ ] Déployer progressivement (LAB d'abord, puis STINGER/PROD)

---

### Phase 2 : Services Partagés (2-3h)

#### 2.1 Créer Réseau Docker
```bash
docker network create dorevia-network
```

#### 2.2 DVIG Partagé
- [ ] Créer `sources/dvig/docker/docker-compose.yml` (services partagés)
- [ ] Configurer instance unique
- [ ] Copier `tokens.yml` avec tokens `core`
- [ ] Démarrer DVIG partagé
- [ ] Tester avec LAB

#### 2.3 Vault Partagé
- [ ] Vérifier configuration Vault
- [ ] Intégrer dans `docker-compose.yml` services partagés
- [ ] Démarrer Vault partagé
- [ ] Tester accès

#### 2.4 Caddy
- [ ] Mettre à jour `Caddyfile` avec nouveaux routages
- [ ] Configurer `docker-compose.yml` avec réseau `dorevia-network`
- [ ] Redémarrer Caddy
- [ ] Tester routage

---

### Phase 3 : Odoo STINGER (2-3h)

#### 3.1 Recréation Complète
- [ ] Créer `docker-compose.stinger.yml` avec isolation complète
- [ ] Créer `odoo.stinger.conf` avec `dbfilter = ^odoo_stinger$`
- [ ] Créer volumes dédiés
- [ ] Démarrer services STINGER

#### 3.2 Initialisation Base
- [ ] Initialiser base `odoo_stinger`
- [ ] Installer modules de base
- [ ] Configurer dataset de démo (si nécessaire)

#### 3.3 Validation
- [ ] Tester isolation (pas de partage avec LAB)
- [ ] Tester accès `odoo.stinger.core.doreviateam.com`
- [ ] Tester intégration DVIG (token STINGER)
- [ ] Vérifier source `odoo.stinger.core` dans logs

---

### Phase 4 : Odoo PROD (2-3h)

#### 4.1 Déploiement
- [ ] Finaliser `docker-compose.prod.yml` avec isolation complète
- [ ] Finaliser `odoo.prod.conf` avec `dbfilter = ^odoo_prod$`
- [ ] Créer volumes dédiés
- [ ] Démarrer services PROD

#### 4.2 Initialisation Base
- [ ] Initialiser base `odoo_prod`
- [ ] Installer modules de base
- [ ] Configurer données production

#### 4.3 Validation
- [ ] Tester isolation complète
- [ ] Tester accès `odoo.prod.core.doreviateam.com`
- [ ] Tester intégration DVIG (token PROD)
- [ ] Vérifier source `odoo.prod.core` dans logs

---

### Phase 5 : Migration LAB (1-2h) - Optionnel

#### 5.1 Migration DVIG
- [ ] Arrêter DVIG LAB actuel (`dvig-lab-new`)
- [ ] Vérifier que DVIG partagé fonctionne
- [ ] Tester intégration Odoo LAB → DVIG partagé

#### 5.2 Optionnel - Renommage Base
- [ ] Backup base `core_lab`
- [ ] Renommer `core_lab` → `odoo_lab`
- [ ] Modifier `odoo.lab.conf` : `dbfilter = ^odoo_lab$`
- [ ] Redémarrer Odoo LAB
- [ ] Tester

---

## 11. Critères de Validation SPEC

### 11.1 URLs HTTPS

- [ ] `https://odoo.lab.core.doreviateam.com` → ✅ Opérationnel
- [ ] `https://odoo.stinger.core.doreviateam.com` → ✅ Opérationnel
- [ ] `https://odoo.prod.core.doreviateam.com` → ✅ Opérationnel
- [ ] `https://dvig.core.doreviateam.com` → ✅ Opérationnel
- [ ] `https://vault.core.doreviateam.com` → ✅ Opérationnel

### 11.2 Isolation Données

- [ ] Odoo LAB : DB `odoo_lab` ou `core_lab` + volumes dédiés
- [ ] Odoo STINGER : DB `odoo_stinger` + volumes dédiés (aucun partage)
- [ ] Odoo PROD : DB `odoo_prod` + volumes dédiés (aucun partage)
- [ ] Vérifier : `docker volume ls | grep odoo` → 6 volumes distincts

### 11.3 Tokens DVIG

- [ ] Token LAB : `tenant: "core"`, source `odoo.lab.core` → ✅ Fonctionne
- [ ] Token STINGER : `tenant: "core"`, source `odoo.stinger.core` → ✅ Fonctionne
- [ ] Token PROD : `tenant: "core"`, source `odoo.prod.core` → ✅ Fonctionne
- [ ] Test : Token LAB sur `source=odoo.prod.core` → ❌ Refusé (403)

### 11.4 Versions Tagged

- [ ] STINGER : Image Odoo taggée (pas `latest`)
- [ ] PROD : Image Odoo taggée (pas `latest`)
- [ ] DVIG : Version taggée (ex: `0.1.2`)
- [ ] Vault : Version taggée

---

## 12. Conclusion

### Compatibilité Globale

- ✅ **DNS** : Convention déjà en place
- ❌ **Validation Source** : **NON CONFORME** (trop permissive, doit être renforcée)
- 🔴 **Tokens** : **NON CONFORME** (tenant ≠ tenant DNS, régénération CRITIQUE)
- ⚠️ **Architecture** : Changement majeur (services partagés)
- ⚠️ **STINGER** : Recréation complète nécessaire
- ⚠️ **PROD** : Déploiement nécessaire

### Conformité Clarification Contractuelle

| Élément | État Actuel | Conformité | Action Requise |
|---------|-------------|------------|----------------|
| **Format Source** | `odoo.xxx` accepté | ❌ NON CONFORME | Renforcer validation `univers.env.tenant` |
| **Tenant Tokens** | `tenant: "rehtse"` | ❌ NON CONFORME | Régénérer avec `tenant: "core"` |
| **Validation Tenant** | Non vérifiée | ❌ NON CONFORME | Ajouter vérification `tenant` source = `tenant` token |
| **Validation Univers** | Partielle | ⚠️ PARTIELLE | Renforcer vérification |
| **Environnements** | Non validés | ❌ NON CONFORME | Valider `env` dans `{lab, stinger, prod}` |

### Résumé des Impacts

| Catégorie | Impact | Action Requise |
|-----------|--------|----------------|
| **Breaking Changes** | 🔴 Critique | Régénération tokens, migration architecture |
| **Nouveaux Composants** | 🟡 Important | STINGER recréation, PROD déploiement |
| **Modifications** | 🟡 Important | Caddy routage, validation source (optionnel) |
| **Compatibilité** | 🟢 Faible | DNS, validation source (déjà compatible) |

### Prochaines Étapes

1. **Valider approche** avec équipe
2. **Régénérer tokens** avec tenant `core`
3. **Créer plan de migration détaillé** (ce document)
4. **Exécuter migration par phases** (Phase 1 → 5)
5. **Valider critères d'acceptation SPEC**

### Estimation Globale

- **Effort Total** : 8-13h
- **Risque** : 🟡 Moyen (breaking changes tokens, services partagés)
- **Recommandation** : Migration progressive par phases

---

---

## 13. Annexes

### 13.1 Clarification Contractuelle

**Document de référence** : `ZeDocs/CLARIFICATION_TENANT_UNIVERS_SOURCE.md`

**Points clés** :
- Format source : `univers.env.tenant` (strict)
- Tenant DVIG ≡ tenant DNS (invariant)
- Validation tenant obligatoire
- Environnements : `{lab, stinger, prod}`

### 13.2 Impact Clarification

**Document détaillé** : `ZeDocs/IMPACT_CLARIFICATION_CONTRACTUELLE.md`

**Résumé** :
- Validation source : NON CONFORME (à corriger)
- Tokens : NON CONFORME (à régénérer)
- Validation tenant : NON CONFORME (à ajouter)

---

**Dernière mise à jour** : 2025-01-28

