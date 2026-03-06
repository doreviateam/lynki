# 🔀 Alternative 2 : Isolation Partielle (DVIG Partagé, Vault Séparé)

**Date** : 2026-01-08  
**Alternative à** : Séparation complète DVIG/Vault par environnement (tenant `core`)  
**Statut** : 📋 **À évaluer**

---

## 📌 Résumé Exécutif

**Décision** : Compromis entre simplicité et isolation :
- **DVIG partagé** : 1 instance DVIG par tenant (partagée entre LAB/STINGER/PROD)
- **Vault séparé** : 1 instance Vault par environnement (LAB, STINGER, PROD)

**Impact** : 🟡 **MODÉRÉ** — Modifications nécessaires uniquement pour Vault

**Isolation** : 
- **DVIG** : Isolation logique par tokens (source = `univers.env.tenant`)
- **Vault** : Isolation physique par environnement (bases de données séparées)

---

## 🎯 Architecture Proposée

### Vue d'ensemble

```
┌─────────────────────────────────────────────────┐
│ Tenant: core                                     │
│                                                  │
│ Platform DVIG (partagé entre LAB/STINGER/PROD) :│
│   ┌─────────────┐                               │
│   │ dvig-core   │ ← Utilisé par LAB, STINGER,   │
│   │             │   et PROD                     │
│   └─────────────┘                               │
│                                                  │
│ Platform Vault LAB :                             │
│   ┌─────────────┐                               │
│   │ vault_lab_  │ ← Instance dédiée LAB          │
│   │   core      │                               │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault_db_   │ ← Base: dorevia_vault_lab     │
│   │   lab_core  │                               │
│   └─────────────┘                               │
│                                                  │
│ Platform Vault STINGER :                        │
│   ┌─────────────┐                               │
│   │ vault_stinger│ ← Instance dédiée STINGER    │
│   │   _core     │                               │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault_db_   │ ← Base: dorevia_vault_stinger │
│   │   stinger_ │                               │
│   │   core      │                               │
│   └─────────────┘                               │
│                                                  │
│ Platform Vault PROD :                           │
│   ┌─────────────┐                               │
│   │ vault_prod_ │ ← Instance dédiée PROD          │
│   │   core      │                               │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault_db_   │ ← Base: dorevia_vault_prod    │
│   │   prod_core │                               │
│   └─────────────┘                               │
│                                                  │
│ Hostnames :                                      │
│   - dvig.core.doreviateam.com                    │
│     (partagé, sans env)                          │
│   - vault.lab.core.doreviateam.com               │
│   - vault.stinger.core.doreviateam.com          │
│   - vault.prod.core.doreviateam.com               │
│                                                  │
│ Containers :                                     │
│   - dvig-core (1 seul, partagé)                 │
│   - vault_lab_core, vault_stinger_core,         │
│     vault_prod_core (3 containers)               │
│   - vault_db_lab_core, vault_db_stinger_core,   │
│     vault_db_prod_core (3 containers)            │
│                                                  │
│ Volumes :                                        │
│   - vault_db_lab_core_data                       │
│   - vault_db_stinger_core_data                  │
│   - vault_db_prod_core_data                      │
│   - vault_storage_lab_core                      │
│   - vault_storage_stinger_core                  │
│   - vault_storage_prod_core                      │
│   - ... (volumes Vault séparés par env)         │
│   - dvig_logs_core (1 seul, partagé)            │
│                                                  │
│ Tokens :                                         │
│   - tenants/core/secrets/dvig.tokens.yml         │
│     (partagé, contient tokens LAB + STINGER +    │
│      PROD)                                       │
└─────────────────────────────────────────────────┘
```

### Caractéristiques

- **1 DVIG par tenant** : Instance unique partagée entre tous les environnements
- **3 Vault par tenant** : 1 instance par environnement (LAB, STINGER, PROD)
- **3 bases de données Vault par tenant** : `dorevia_vault_lab`, `dorevia_vault_stinger`, `dorevia_vault_prod`
- **Hostnames DVIG** : `dvig.core.doreviateam.com` (sans environnement)
- **Hostnames Vault** : `vault.lab.core.doreviateam.com`, `vault.stinger.core.doreviateam.com`, `vault.prod.core.doreviateam.com`
- **Tokens unifiés** : 1 fichier `dvig.tokens.yml` contenant tous les tokens

---

## 🔐 Mécanismes d'Isolation

### 1. DVIG : Isolation Logique (Partagé)

**Principe** : DVIG reste partagé, isolation assurée par tokens.

**Format source** : `<univers>.<env>.<tenant>`

**Exemples** :
- `odoo.lab.core` → Token pour Odoo LAB tenant core
- `odoo.stinger.core` → Token pour Odoo STINGER tenant core
- `odoo.prod.core` → Token pour Odoo PROD tenant core

**Validation DVIG** :
```python
# DVIG valide le token et extrait la source
source = token.source  # Ex: "odoo.stinger.core"
univers, env, tenant = source.split(".")

# DVIG route vers le bon Vault selon l'environnement
if env == "lab":
    vault_url = "http://vault_lab_core:8080"
elif env == "stinger":
    vault_url = "http://vault_stinger_core:8080"
elif env == "prod":
    vault_url = "http://vault_prod_core:8080"

# Forward vers le bon Vault
forward_to_vault(vault_url, request)
```

**Isolation** :
- ✅ Les tokens STINGER ne fonctionnent pas en PROD (source différente)
- ✅ DVIG route automatiquement vers le bon Vault selon l'environnement
- ✅ Audit possible par environnement (source contient `<env>`)

**Avantage** :
- ✅ Pas besoin de séparer les tokens (tous dans un fichier)
- ✅ DVIG reste simple (1 instance)

---

### 2. Vault : Isolation Physique (Séparé)

**Principe** : Vault séparé par environnement, bases de données physiquement isolées.

**Bases de données** :
- `dorevia_vault_lab` : Données LAB uniquement
- `dorevia_vault_stinger` : Données STINGER uniquement
- `dorevia_vault_prod` : Données PROD uniquement

**Isolation** :
- ✅ Données physiquement séparées (bases différentes)
- ✅ Aucun risque de confusion entre environnements
- ✅ Tests destructifs STINGER possibles (base isolée)
- ✅ Isolation complète des données critiques

**Avantage** :
- ✅ Isolation physique des données (critique pour Vault)
- ✅ Pas de risque de pollution entre environnements

---

## ✅ Avantages

### 1. Compromis Optimal

- **Isolation des données critiques** : Vault isolé physiquement (données importantes)
- **Simplicité DVIG** : DVIG reste simple (1 instance, tokens unifiés)
- **Meilleur des deux mondes** : Isolation où nécessaire, simplicité où possible

### 2. Modifications Limitées

- **Modifications uniquement pour Vault** : Pas besoin de modifier DVIG
- **Pas de séparation tokens** : Tokens restent dans un fichier unique
- **Moins de breaking changes** : Moins d'impact que séparation complète

### 3. Ressources Modérées

- **2x plus de ressources** (au lieu de 3x) : Seulement Vault séparé
- **1 DVIG au lieu de 3** : Économie de ressources
- **3 Vault au lieu de 1** : Isolation des données critiques

### 4. Maintenance Simplifiée

- **1 DVIG à maintenir** : Simplicité pour DVIG
- **3 Vault à maintenir** : Isolation pour données critiques
- **Moins complexe que séparation complète** : Compromis raisonnable

### 5. Isolation des Données Critiques

- **Données Vault isolées** : Bases de données séparées
- **Tests destructifs possibles** : STINGER peut tester sans risque
- **Pas de pollution** : Aucun risque de mélange entre environnements

---

## ⚠️ Inconvénients

### 1. Complexité Intermédiaire

- **Plus complexe que Alternative 1** : Modifications nécessaires
- **Moins simple que séparation complète** : Logique conditionnelle DVIG
- **Deux modèles différents** : DVIG partagé, Vault séparé

### 2. Logique de Routage DVIG

- **DVIG doit router** : Logique conditionnelle selon environnement
- **Dépendance environnement** : DVIG doit connaître l'environnement
- **Risque d'erreur** : Si routage incorrect, données dans mauvais Vault

### 3. Hostnames Mixtes

- **DVIG sans environnement** : `dvig.core.doreviateam.com` (pas de `<env>`)
- **Vault avec environnement** : `vault.stinger.core.doreviateam.com` (avec `<env>`)
- **Incohérence** : Deux conventions différentes

### 4. Migration Partielle

- **Migration Vault nécessaire** : Données Vault à migrer
- **Pas de migration DVIG** : DVIG reste inchangé
- **Migration partielle** : Plus complexe que "tout ou rien"

### 5. Conformité SPEC_STINGER

- **Partiellement conforme** : Vault séparé ✅, DVIG partagé ❌
- **Hostnames mixtes** : Pas complètement conforme
- **Vision partielle** : Ne correspond pas complètement à SPEC_STINGER

---

## 📊 Comparaison avec Autres Alternatives

| Aspect | Alternative 1 (Actuelle) | Alternative 2 (Partielle) | Alternative (Complète) |
|--------|--------------------------|---------------------------|------------------------|
| **Modifications code** | ✅ Aucune | 🟡 Modérées (Vault uniquement) | ❌ Majeures (DVIG + Vault) |
| **Migration données** | ✅ Aucune | 🟡 Partielle (Vault uniquement) | ❌ Complète (DVIG + Vault) |
| **Ressources** | ✅ 1x (moins) | 🟡 2x (modéré) | ❌ 3x (plus) |
| **Maintenance** | ✅ Simple | 🟡 Modérée | ❌ Complexe |
| **Isolation DVIG** | ❌ Logique (tokens) | ❌ Logique (tokens) | ✅ Physique |
| **Isolation Vault** | ❌ Logique (filtrage) | ✅ Physique | ✅ Physique |
| **Hostnames DVIG** | ❌ Sans env | ❌ Sans env | ✅ Avec env |
| **Hostnames Vault** | ❌ Sans env | ✅ Avec env | ✅ Avec env |
| **Tokens** | ✅ Unifiés | ✅ Unifiés | ❌ Séparés |
| **Risque pollution données** | ⚠️ Oui | ✅ Non (Vault) | ✅ Non |
| **Tests destructifs** | ❌ Non | ✅ Oui (Vault isolé) | ✅ Oui |
| **Conformité SPEC_STINGER** | ❌ Non | 🟡 Partielle | ✅ Oui |

---

## 🔧 Impact Technique

### Modifications Nécessaires

#### 1. Scripts de Génération

**`lib/render/render_platform_compose.sh`** :

```bash
# AVANT
container_name: vault-$TENANT_ID

# APRÈS (pour tenant "core" uniquement)
if [[ "$TENANT_ID" == "core" ]]; then
  container_name: vault_${ENV}_${TENANT_ID}
  # Base de données : dorevia_vault_${ENV}
else
  container_name: vault-${TENANT_ID}  # Autres tenants inchangés
fi
```

**Impact** :
- Modifier uniquement la génération Vault (pas DVIG)
- Logique conditionnelle pour tenant `core`
- Génération dans `tenants/<tenant>/rendered/<env>/platform/`

---

#### 2. Gateway (Caddy)

**`lib/render/render_caddyfile.sh`** :

```bash
# DVIG : Sans environnement (inchangé)
canonical_dvig="dvig.${TENANT_ID}.${CANONICAL_DOMAIN}"

# Vault : Avec environnement (pour tenant "core" uniquement)
if [[ "$TENANT_ID" == "core" ]]; then
  canonical_vault="vault.${ENV}.${TENANT_ID}.${CANONICAL_DOMAIN}"
else
  canonical_vault="vault.${TENANT_ID}.${CANONICAL_DOMAIN}"  # Autres tenants inchangés
fi
```

**Impact** :
- Hostnames DVIG inchangés (sans env)
- Hostnames Vault avec environnement (tenant `core`)
- Deux conventions différentes

---

#### 3. DVIG : Logique de Routage

**Modification DVIG** :

```python
# DVIG doit router vers le bon Vault selon l'environnement
def route_to_vault(source: str, request: Request):
    """Route vers le bon Vault selon l'environnement de la source"""
    univers, env, tenant = source.split(".")
    
    # Déterminer URL Vault selon environnement
    if env == "lab":
        vault_url = f"http://vault_lab_{tenant}:8080"
    elif env == "stinger":
        vault_url = f"http://vault_stinger_{tenant}:8080"
    elif env == "prod":
        vault_url = f"http://vault_prod_{tenant}:8080"
    else:
        raise ValueError(f"Environnement inconnu: {env}")
    
    # Forward vers le bon Vault
    return forward_to_vault(vault_url, request)
```

**Impact** :
- DVIG doit extraire l'environnement de la source
- Routage conditionnel vers le bon Vault
- Risque si routage incorrect

---

#### 4. CLI : Commande `platform up`

**Modification** :

```bash
# Signature modifiée (pour Vault uniquement)
dorevia.sh platform up <tenant> <env>

# Processus
cmd_platform_up() {
  local tenant=$1
  local env=$2  # Nouveau paramètre
  
  # Générer DVIG (partagé, sans env)
  render_dvig_compose.sh "$tenant"
  
  # Générer Vault (séparé, avec env)
  render_vault_compose.sh "$tenant" "$env"
}
```

**Impact** :
- Breaking change : Signature modifiée
- Génération séparée DVIG/Vault
- Plus complexe que Alternative 1

---

### Migration Données

**Étape 1 : Sauvegarde Vault** :
```bash
# Dump base Vault existante
docker exec vault-db-core pg_dump -U vault dorevia_vault > vault_backup.sql
```

**Étape 2 : Créer nouvelles bases** :
```bash
# Créer bases par environnement
docker exec vault-db-core psql -U vault -c "CREATE DATABASE dorevia_vault_lab;"
docker exec vault-db-core psql -U vault -c "CREATE DATABASE dorevia_vault_stinger;"
docker exec vault-db-core psql -U vault -c "CREATE DATABASE dorevia_vault_prod;"
```

**Étape 3 : Migrer données** :
```bash
# Copier données vers chaque environnement
# (ou créer bases vides selon stratégie)
```

**Impact** :
- Migration uniquement Vault (pas DVIG)
- Moins complexe que séparation complète
- Plus complexe que Alternative 1

---

## 🎯 Recommandations

### Quand choisir Alternative 2 (Isolation Partielle) ?

**Choisir si** :
- ✅ L'isolation des **données Vault** est critique
- ✅ Les tests STINGER sont **destructifs** (risque pour données)
- ✅ La **simplicité DVIG** est importante (tokens unifiés)
- ✅ Les ressources sont **limitées** (2x au lieu de 3x)
- ✅ Les hostnames mixtes sont **acceptables**
- ✅ La logique de routage DVIG est **faisable**

**Exemples de cas** :
- Tests destructifs STINGER (migration, charge)
- Données Vault critiques (factures, documents)
- Besoin d'isolation physique Vault
- Simplicité DVIG souhaitée

---

### Quand ne PAS choisir Alternative 2 ?

**Ne pas choisir si** :
- ❌ L'isolation **complète** est requise (DVIG + Vault)
- ❌ La conformité SPEC_STINGER est **obligatoire** (DVIG séparé)
- ❌ Les hostnames mixtes sont **inacceptables**
- ❌ La logique de routage DVIG est **trop complexe**
- ❌ L'isolation logique suffit (Alternative 1)

**Exemples de cas** :
- Conformité réglementaire (isolation complète)
- SPEC_STINGER obligatoire (DVIG séparé)
- Hostnames uniformes requis

---

## 📋 Plan d'Implémentation

### Phase 1 : Préparation

1. **Valider décision** : Isolation partielle appropriée
2. **Créer branche** : `feature/vault-per-env-core`
3. **Planifier migration** : Données Vault uniquement

---

### Phase 2 : Modifications Code

#### Étape 2.1 : Scripts de génération

1. **Modifier `render_platform_compose.sh`** :
   - Ajouter logique conditionnelle pour Vault (tenant `core`)
   - Conserver DVIG inchangé (partagé)

2. **Modifier `render_caddyfile.sh`** :
   - Hostnames Vault avec environnement (tenant `core`)
   - Hostnames DVIG sans environnement (inchangé)

3. **Modifier DVIG** :
   - Ajouter logique de routage vers Vault selon environnement
   - Extraire environnement de la source

#### Étape 2.2 : CLI

1. **Modifier `bin/dorevia.sh`** :
   - Modifier `cmd_platform_up()` : Paramètre `env` pour Vault
   - Génération séparée DVIG/Vault

---

### Phase 3 : Migration Données

1. **Sauvegarder Vault** : Dump base existante
2. **Créer nouvelles bases** : `dorevia_vault_lab`, `dorevia_vault_stinger`, `dorevia_vault_prod`
3. **Migrer données** : Copier ou créer bases vides

---

### Phase 4 : Déploiement

1. **Arrêter Vault existant** : `dorevia.sh platform down core`
2. **Générer nouvelles configs** : Vault par environnement
3. **Déployer** : Vault LAB, STINGER, PROD
4. **DNS** : Créer enregistrements Vault avec environnement
5. **Gateway** : Recharger Caddyfile

---

### Phase 5 : Validation

1. **Tests smoke** : Health checks Vault par environnement
2. **Tests fonctionnels** : Routage DVIG → Vault correct
3. **Tests isolation** : Données STINGER isolées de PROD

---

## ⚠️ Risques et Considérations

### Risques techniques

1. **Routage DVIG incorrect** :
   - Risque de routage vers mauvais Vault
   - **Mitigation** : Tests automatisés, validation stricte

2. **Migration données Vault** :
   - Risque de perte de données
   - **Mitigation** : Sauvegardes complètes

3. **Complexité intermédiaire** :
   - Deux modèles différents (DVIG partagé, Vault séparé)
   - **Mitigation** : Documentation claire

### Considérations opérationnelles

1. **Ressources** : 2x plus de ressources (Vault uniquement)
2. **Maintenance** : 3 Vault à maintenir (au lieu de 1)
3. **Hostnames mixtes** : Deux conventions différentes

---

## 📊 Estimation

**Complexité** : 🟡 **MODÉRÉE**

**Temps estimé** :
- Phase 2 (Code) : 1-2 jours
- Phase 3 (Migration) : 0.5 jour
- Phase 4 (Déploiement) : 0.5 jour
- Phase 5 (Validation) : 0.5 jour

**Total** : ~3 jours de développement + fenêtre de maintenance

**Ressources** :
- 1 développeur
- Fenêtre de maintenance : 1-2 heures (migration Vault + DNS)

---

## 📎 Références

- `ZeDocs/TestV2/ALTERNATIVE_1_ARCHITECTURE_ACTUELLE_v1.0.md` — Alternative 1
- `ZeDocs/TestV2/ANALYSE_IMPACT_DVIG_VAULT_PAR_ENV_v1.0.md` — Alternative (Séparation Complète)
- `ZeDocs/TestV2/SPEC_STINGER_v1.0.md` — Spécification STINGER

---

## ✅ Conclusion

**Alternative 2 (Isolation Partielle)** est un **compromis optimal** entre :
- **Simplicité** : DVIG reste simple (1 instance, tokens unifiés)
- **Isolation** : Vault isolé physiquement (données critiques)

**Appropriée si** :
- L'isolation des données Vault est critique
- La simplicité DVIG est importante
- Les ressources sont limitées (2x au lieu de 3x)
- Les hostnames mixtes sont acceptables

**Non appropriée si** :
- L'isolation complète est requise (DVIG + Vault)
- La conformité SPEC_STINGER est obligatoire
- Les hostnames uniformes sont requis

**Recommandation** : Alternative 2 est un bon compromis si l'isolation des données Vault est critique mais que la simplicité DVIG est souhaitée.

---

**Version** : 1.0  
**Date** : 2026-01-08  
**Statut** : 📋 **À évaluer**
