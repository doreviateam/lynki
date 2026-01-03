# 🔍 Impact Clarification Contractuelle - Tenant/Univers/Source

**Date** : 2025-01-28  
**Document Analysé** : Clarification Contractuelle — Tenant / Univers / Source v1.0  
**Statut** : Analyse des impacts sur l'implémentation actuelle

---

## 📋 Résumé Exécutif

### Conformité Actuelle

| Élément | État Actuel | Conformité | Priorité |
|---------|-------------|------------|----------|
| **Format Source** | `odoo.xxx` accepté | ❌ **NON CONFORME** | 🔴 Critique |
| **Tenant Tokens** | `tenant: "rehtse"` | ❌ **NON CONFORME** | 🔴 Critique |
| **Validation Tenant** | Non vérifiée | ❌ **NON CONFORME** | 🔴 Critique |
| **Validation Univers** | Partielle | ⚠️ **PARTIELLE** | 🟡 Important |
| **Environnements** | Non validés | ❌ **NON CONFORME** | 🟡 Important |

### Actions Critiques Requises

1. 🔴 **Régénérer tous les tokens** avec `tenant: "core"` (conforme tenant DNS)
2. 🔴 **Renforcer validation source** : format strict `univers.env.tenant`
3. 🔴 **Ajouter validation tenant** : `tenant` source = `tenant` token
4. 🟡 **Valider environnements** : `env` dans `{lab, stinger, prod}`

---

## 1. Analyse de Conformité

### 1.1 Format Source

#### Clarification Contractuelle

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
- `odoo.prod.rehtse` ❌

#### État Actuel

**Validation actuelle** :
```python
if not source.startswith(f"{auth_info.univers}."):
    raise HTTPException(...)
```

**Problèmes** :
- ✅ Accepte `odoo.lab.core` (correct)
- ❌ Accepte aussi `odoo.xxx` (incorrect)
- ❌ N'accepte pas le format strict `univers.env.tenant`
- ❌ Ne vérifie pas le `tenant` du source

**Impact** : 🔴 **NON CONFORME** - Validation trop permissive

---

### 1.2 Tenant Tokens

#### Clarification Contractuelle

**Règle absolue** :
> Le tenant DVIG **DOIT correspondre exactement** au tenant DNS.

**Structure minimale** :
```yaml
tenant: "core"  # DOIT correspondre au tenant DNS
univers: "odoo"
```

#### État Actuel

**Tokens actuels** :
```yaml
tenant: "rehtse"  # ❌ Tenant métier, pas tenant DNS
univers: "odoo"
```

**Problème** : Le tenant DVIG (`rehtse`) ne correspond pas au tenant DNS (`core`).

**Impact** : 🔴 **NON CONFORME** - Violation du contrat

---

### 1.3 Validation Tenant

#### Clarification Contractuelle

**Règle** :
> La source DOIT correspondre au `tenant` du token.

**Validation requise** :
- `tenant` du source = `tenant` du token

#### État Actuel

**Validation actuelle** :
- ❌ Ne vérifie **pas** le `tenant` du source
- ✅ Vérifie uniquement `univers` (partiel)

**Impact** : 🔴 **NON CONFORME** - Validation incomplète

---

### 1.4 Validation Environnements

#### Clarification Contractuelle

**Environnements autorisés** :
- `lab` → développement
- `stinger` → démonstration client
- `prod` → production

**Politique de validation** :
- **LAB** : Validation stricte recommandée (tolérance possible temporaire)
- **STINGER** : Validation stricte obligatoire
- **PROD** : Validation stricte obligatoire

#### État Actuel

**Validation actuelle** :
- ❌ Ne valide **pas** les environnements
- ❌ Accepte n'importe quelle valeur après `univers.`

**Impact** : 🔴 **NON CONFORME** - Environnements non validés

---

## 2. Corrections Requises

### 2.1 Validation Source (CRITIQUE)

#### Code Actuel (NON CONFORME)

```python
def validate_source_univers(source: str, auth_info: AuthInfo) -> None:
    """
    Valide que source correspond à univers du token.
    Règle: source MUST start with "<univers>."
    """
    if not source.startswith(f"{auth_info.univers}."):
        raise HTTPException(status_code=403, ...)
```

#### Code Conforme (À IMPLÉMENTER)

```python
import re
from typing import List

# Environnements autorisés
VALID_ENVIRONMENTS: List[str] = ["lab", "stinger", "prod"]

# Pattern strict : univers.env.tenant
SOURCE_PATTERN = re.compile(r'^([^.]+)\.([^.]+)\.([^.]+)$')

def validate_source_univers(source: str, auth_info: AuthInfo) -> None:
    """
    Valide la source selon le contrat contractuel :
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
    
    # 3. Vérifier tenant (CRITIQUE - actuellement manquant)
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
    
    # 4. Vérifier environnement
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
    
    # 5. Politique stricte pour STINGER/PROD
    # (À implémenter selon politique)
```

**Fichier** : `sources/dvig/dvig/api_fastapi/auth/validation.py`

**Effort** : 🟡 **MOYEN** (1-2h)

---

### 2.2 Tokens DVIG (CRITIQUE)

#### Tokens Actuels (NON CONFORMES)

```yaml
tokens:
  - id: "tok_001"
    tenant: "rehtse"  # ❌ NON CONFORME
    univers: "odoo"
```

#### Tokens Conformes (À CRÉER)

```yaml
tokens:
  # Token LAB
  - id: "tok_lab_core_001"
    token_hash: "sha256:..."
    tenant: "core"  # ✅ CONFORME (tenant DNS)
    univers: "odoo"
    status: "active"
    comment: "LAB - odoo.lab.core"
  
  # Token STINGER
  - id: "tok_stinger_core_001"
    token_hash: "sha256:..."
    tenant: "core"  # ✅ CONFORME
    univers: "odoo"
    status: "active"
    comment: "STINGER - odoo.stinger.core"
  
  # Token PROD
  - id: "tok_prod_core_001"
    token_hash: "sha256:..."
    tenant: "core"  # ✅ CONFORME
    univers: "odoo"
    status: "active"
    comment: "PROD - odoo.prod.core"
```

**Fichier** : `sources/dvig/conf/tokens.yml`

**Effort** : 🟢 **FAIBLE** (30min)

---

## 3. Plan d'Action Conformité

### Phase 1 : Corrections Critiques (2-3h)

1. **Régénérer tokens** (30min)
   - Générer tokens LAB, STINGER, PROD avec `tenant: "core"`
   - Mettre à jour `tokens.yml`

2. **Renforcer validation** (1-2h)
   - Implémenter validation format strict `univers.env.tenant`
   - Ajouter vérification `tenant` source = `tenant` token
   - Ajouter validation environnements
   - Tester avec nouveaux tokens

3. **Tests** (30min)
   - Tests unitaires validation
   - Tests d'intégration avec nouveaux tokens
   - Tests de non-conformité (rejet sources invalides)

### Phase 2 : Déploiement Progressif (1-2h)

1. **LAB** (tolérance temporaire possible)
   - Déployer validation renforcée
   - Tester avec token LAB
   - Valider conformité

2. **STINGER** (validation stricte obligatoire)
   - Déployer validation stricte
   - Tester avec token STINGER
   - Valider conformité

3. **PROD** (validation stricte obligatoire)
   - Déployer validation stricte
   - Tester avec token PROD
   - Valider conformité

---

## 4. Tests de Conformité

### 4.1 Tests Sources Valides

```python
# Test 1 : Source valide LAB
source = "odoo.lab.core"
token_tenant = "core"
token_univers = "odoo"
# → ✅ Accepté

# Test 2 : Source valide STINGER
source = "odoo.stinger.core"
token_tenant = "core"
token_univers = "odoo"
# → ✅ Accepté

# Test 3 : Source valide PROD
source = "odoo.prod.core"
token_tenant = "core"
token_univers = "odoo"
# → ✅ Accepté
```

### 4.2 Tests Sources Invalides (Doivent être rejetés)

```python
# Test 4 : Format incorrect
source = "odoo.core"
# → ❌ Rejeté (INVALID_SOURCE_FORMAT)

# Test 5 : Tenant mismatch
source = "odoo.lab.rehtse"
token_tenant = "core"
# → ❌ Rejeté (TENANT_MISMATCH)

# Test 6 : Univers mismatch
source = "sylius.lab.core"
token_univers = "odoo"
# → ❌ Rejeté (UNIVERSE_MISMATCH)

# Test 7 : Environnement invalide
source = "odoo.dev.core"
# → ❌ Rejeté (INVALID_ENVIRONMENT)

# Test 8 : Token LAB sur source PROD
token_id = "tok_lab_core_001"
source = "odoo.prod.core"
# → ❌ Rejeté (TENANT_MISMATCH ou logique métier)
```

---

## 5. Impact sur Tests Existants

### 5.1 Tests à Modifier

**Fichiers impactés** :
- `tests/unit/test_source_validation.py`
- `tests/integration/test_ingest_auth.py`

**Changements** :
- Ajouter tests format strict `univers.env.tenant`
- Ajouter tests validation `tenant`
- Ajouter tests validation environnements
- Ajouter tests sources invalides

### 5.2 Nouveaux Tests Requis

1. **Test validation tenant** :
   ```python
   def test_tenant_mismatch():
       # Token tenant="core", source="odoo.lab.rehtse"
       # → 403 TENANT_MISMATCH
   ```

2. **Test format strict** :
   ```python
   def test_invalid_source_format():
       # source="odoo.core"
       # → 403 INVALID_SOURCE_FORMAT
   ```

3. **Test environnement invalide** :
   ```python
   def test_invalid_environment():
       # source="odoo.dev.core"
       # → 403 INVALID_ENVIRONMENT
   ```

---

## 6. Risques & Mitigation

### 6.1 Risques

1. **Breaking Change Tokens** :
   - ⚠️ Tous les tokens actuels deviennent invalides
   - ⚠️ Coordination avec équipes utilisatrices nécessaire

2. **Breaking Change Validation** :
   - ⚠️ Sources invalides actuellement acceptées seront rejetées
   - ⚠️ Tests d'intégration existants peuvent échouer

3. **Migration Progressive** :
   - ⚠️ LAB peut être tolérant temporairement
   - ⚠️ STINGER/PROD doivent être stricts immédiatement

### 6.2 Mitigation

1. **Communication** :
   - Documenter breaking changes
   - Prévenir équipes utilisatrices
   - Fournir guide de migration

2. **Déploiement Progressif** :
   - LAB d'abord (tolérance possible)
   - STINGER ensuite (strict)
   - PROD enfin (strict)

3. **Tests Exhaustifs** :
   - Tests unitaires complets
   - Tests d'intégration
   - Tests de non-régression

---

## 7. Checklist Conformité

### Pré-Implémentation

- [ ] Analyser tous les tokens actuels
- [ ] Documenter breaking changes
- [ ] Communiquer avec équipes utilisatrices

### Implémentation

- [ ] Régénérer tokens avec `tenant: "core"`
- [ ] Implémenter validation format strict
- [ ] Ajouter validation `tenant`
- [ ] Ajouter validation environnements
- [ ] Implémenter politique par environnement

### Tests

- [ ] Tests sources valides
- [ ] Tests sources invalides
- [ ] Tests tenant mismatch
- [ ] Tests univers mismatch
- [ ] Tests environnement invalide
- [ ] Tests non-régression

### Déploiement

- [ ] Déployer en LAB (tolérance temporaire)
- [ ] Valider conformité LAB
- [ ] Déployer en STINGER (strict)
- [ ] Valider conformité STINGER
- [ ] Déployer en PROD (strict)
- [ ] Valider conformité PROD

---

## 8. Conclusion

### État de Conformité

- ❌ **Validation Source** : NON CONFORME (trop permissive)
- ❌ **Tokens** : NON CONFORME (tenant ≠ tenant DNS)
- ❌ **Validation Tenant** : NON CONFORME (manquante)
- ⚠️ **Validation Univers** : PARTIELLE (à renforcer)
- ❌ **Validation Environnements** : NON CONFORME (manquante)

### Actions Prioritaires

1. 🔴 **Régénérer tokens** avec `tenant: "core"`
2. 🔴 **Renforcer validation** format strict `univers.env.tenant`
3. 🔴 **Ajouter validation tenant** (critique)
4. 🟡 **Valider environnements** (important)

### Effort Estimé

- **Corrections** : 2-3h
- **Tests** : 1-2h
- **Déploiement** : 1-2h
- **TOTAL** : 4-7h

---

**Dernière mise à jour** : 2025-01-28

