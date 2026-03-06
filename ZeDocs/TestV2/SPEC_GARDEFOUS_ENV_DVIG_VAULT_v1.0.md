# 🛡️ SPEC — Garde-fous Environnement DVIG/Vault

**Version** : v1.0  
**Date** : 2026-01-10  
**Statut** : 📋 **À implémenter**  
**Contexte** : Alternative 1.5 — Isolation opérationnelle sans séparation physique

---

## 📌 Résumé Exécutif

**Objectif** : Empêcher toute confusion STINGER/PROD lors des opérations Vault (écriture + lecture + constats), même en cas d'erreur humaine ou bug de filtre.

**Principe** : **Enforcement technique** (contrainte) plutôt que déduction logique.

**Approche** : Garde-fous au niveau DVIG et Vault pour garantir l'isolation opérationnelle sans nécessiter de séparation physique des instances.

---

## 🎯 Problème à Résoudre

### Problème réel

> **Empêcher toute confusion STINGER/PROD** lors des opérations Vault (écriture + lecture + constats), même en cas d'erreur humaine ou bug de filtre.

### Risques actuels (sans garde-fous)

1. **Token STINGER utilisé en PROD** :
   - Token valide techniquement (secret correct)
   - Source contient `stinger` mais aucune règle n'empêche l'utilisation en PROD
   - Risque de pollution données PROD

2. **Requête Vault sans filtre environnement** :
   - Requête mal formulée récupère toutes les données
   - Mélange STINGER/PROD dans les résultats
   - Risque de confusion opérationnelle

3. **Constats générés avec mauvais environnement** :
   - Constat STINGER généré avec données PROD
   - Facturation incorrecte
   - Risque financier

---

## 🔒 Règles Techniques Minimales

### 1. DVIG — Enforcement Environnement (Obligatoire)

#### 1.1 Principe

**DVIG doit valider que l'environnement du token correspond à l'environnement de la requête.**

#### 1.2 Implémentation

**Entrée** :
- Token avec `source = odoo.<env>.<tenant>` (ex: `odoo.stinger.core`)
- Requête avec `X-Dorevia-Env: <env>` (header HTTP) ou champ `env` dans payload

**Validation** :
```python
def validate_environment(token_source: str, request_env: str) -> bool:
    """
    Valide que l'environnement du token correspond à l'environnement de la requête.
    
    Args:
        token_source: Source du token (ex: "odoo.stinger.core")
        request_env: Environnement de la requête (ex: "stinger")
    
    Returns:
        True si correspondance, False sinon
    """
    # Extraire environnement du token
    parts = token_source.split(".")
    if len(parts) != 3:
        return False
    
    token_env = parts[1]  # Ex: "stinger"
    
    # Valider correspondance
    if token_env != request_env:
        return False
    
    return True
```

**Règle** :
- Si `token_env != request_env` → **403 Forbidden**
- Message d'erreur : `"Environment mismatch: token env is '{token_env}' but request env is '{request_env}'"`

#### 1.3 Endpoints concernés

- `POST /api/v1/ingest` : Validation obligatoire
- Tous les endpoints nécessitant authentification

#### 1.4 Exemples

**Cas valide** :
```
Token: source = "odoo.stinger.core"
Header: X-Dorevia-Env: stinger
→ ✅ 200 OK
```

**Cas invalide** :
```
Token: source = "odoo.stinger.core"
Header: X-Dorevia-Env: prod
→ ❌ 403 Forbidden
Message: "Environment mismatch: token env is 'stinger' but request env is 'prod'"
```

---

### 2. Vault — Namespace par Environnement (Obligatoire)

#### 2.1 Principe

**Vault doit stocker et lire les données dans un namespace par environnement.**

#### 2.2 Implémentation

**Écriture** :
```python
def store_document(env: str, document: dict) -> str:
    """
    Stocke un document dans le namespace de l'environnement.
    
    Args:
        env: Environnement (lab, stinger, prod)
        document: Document à stocker
    
    Returns:
        ID du document stocké
    """
    # Validation environnement
    if env not in ["lab", "stinger", "prod"]:
        raise ValueError(f"Invalid environment: {env}")
    
    # Stockage dans namespace
    namespace = f"env={env}"
    document_id = vault_storage.store(
        namespace=namespace,
        document=document,
        metadata={"env": env, "source": document.get("source")}
    )
    
    return document_id
```

**Lecture** :
```python
def get_documents(env: str, filters: dict = None) -> list:
    """
    Récupère les documents du namespace de l'environnement.
    
    Args:
        env: Environnement (lab, stinger, prod)
        filters: Filtres additionnels
    
    Returns:
        Liste des documents
    """
    # Validation environnement
    if env not in ["lab", "stinger", "prod"]:
        raise ValueError(f"Invalid environment: {env}")
    
    # Lecture depuis namespace
    namespace = f"env={env}"
    documents = vault_storage.get(
        namespace=namespace,
        filters=filters or {}
    )
    
    return documents
```

**Règle** :
- Toute écriture est stockée sous `env=<env>` (partition/namespace)
- Toute lecture/constats exigent `env` explicite
- Interdire les endpoints "global" sans env (ou les réserver à admin)

#### 2.3 Structure Base de Données

**Table `documents`** :
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    env VARCHAR(20) NOT NULL,  -- lab, stinger, prod
    namespace VARCHAR(50) NOT NULL,  -- env=<env>
    source VARCHAR(100) NOT NULL,  -- odoo.<env>.<tenant>
    tenant VARCHAR(50) NOT NULL,
    document_data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL,
    INDEX idx_env (env),
    INDEX idx_namespace (namespace),
    INDEX idx_source (source)
);
```

**Contrainte** :
```sql
-- Contrainte : namespace doit correspondre à env
ALTER TABLE documents 
ADD CONSTRAINT chk_namespace_env 
CHECK (namespace = CONCAT('env=', env));
```

#### 2.4 Endpoints Vault

**Endpoints avec `env` obligatoire** :
- `POST /api/v1/vault` : `env` dans payload ou header
- `GET /api/v1/vault` : `env` dans query parameter
- `GET /api/v1/constats` : `env` dans query parameter

**Endpoints admin (sans env)** :
- `GET /api/v1/admin/stats` : Réservé aux admins
- `POST /api/v1/admin/purge` : Réservé aux admins

---

### 3. Tests Automatisés (Obligatoire)

#### 3.1 Tests DVIG

**Test 1 : Token STINGER + env=PROD → 403**
```python
def test_token_stinger_with_env_prod_forbidden():
    """Test que token STINGER avec env=prod est rejeté"""
    token = generate_token(source="odoo.stinger.core")
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Dorevia-Env": "prod"
    }
    
    response = client.post("/api/v1/ingest", headers=headers, json={...})
    
    assert response.status_code == 403
    assert "Environment mismatch" in response.json()["error"]
```

**Test 2 : Token PROD + env=STINGER → 403**
```python
def test_token_prod_with_env_stinger_forbidden():
    """Test que token PROD avec env=stinger est rejeté"""
    token = generate_token(source="odoo.prod.core")
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Dorevia-Env": "stinger"
    }
    
    response = client.post("/api/v1/ingest", headers=headers, json={...})
    
    assert response.status_code == 403
    assert "Environment mismatch" in response.json()["error"]
```

**Test 3 : Token STINGER + env=STINGER → 200**
```python
def test_token_stinger_with_env_stinger_allowed():
    """Test que token STINGER avec env=stinger est accepté"""
    token = generate_token(source="odoo.stinger.core")
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Dorevia-Env": "stinger"
    }
    
    response = client.post("/api/v1/ingest", headers=headers, json={...})
    
    assert response.status_code == 200
```

---

#### 3.2 Tests Vault

**Test 1 : Constats STINGER ne voient jamais PROD**
```python
def test_constats_stinger_never_see_prod():
    """Test que constats stinger ne voient jamais les données prod"""
    # Créer document PROD
    create_document(env="prod", source="odoo.prod.core", data={...})
    
    # Récupérer constats STINGER
    constats = get_constats(env="stinger")
    
    # Vérifier qu'aucun document PROD n'est présent
    for constat in constats:
        assert constat["env"] == "stinger"
        assert "prod" not in constat["source"]
```

**Test 2 : Écriture STINGER dans namespace STINGER**
```python
def test_write_stinger_in_stinger_namespace():
    """Test que écriture stinger va dans namespace stinger"""
    document_id = store_document(
        env="stinger",
        source="odoo.stinger.core",
        data={...}
    )
    
    # Vérifier namespace
    document = get_document(document_id)
    assert document["namespace"] == "env=stinger"
    assert document["env"] == "stinger"
```

**Test 3 : Lecture PROD ne voit jamais STINGER**
```python
def test_read_prod_never_sees_stinger():
    """Test que lecture prod ne voit jamais les données stinger"""
    # Créer document STINGER
    create_document(env="stinger", source="odoo.stinger.core", data={...})
    
    # Lire documents PROD
    documents = get_documents(env="prod")
    
    # Vérifier qu'aucun document STINGER n'est présent
    for doc in documents:
        assert doc["env"] == "prod"
        assert "stinger" not in doc["source"]
```

---

## 🔧 Implémentation

### Phase 1 : DVIG — Enforcement Environnement

#### Étape 1.1 : Modifier validation token

**Fichier** : `sources/dvig/dvig/core/auth.py`

```python
def validate_token_and_env(token: str, request_env: str) -> TokenInfo:
    """
    Valide le token et vérifie la correspondance environnement.
    
    Args:
        token: Token JWT
        request_env: Environnement de la requête (header X-Dorevia-Env)
    
    Returns:
        TokenInfo si valide
    
    Raises:
        Unauthorized: Si token invalide
        Forbidden: Si environnement mismatch
    """
    # Valider token
    token_info = validate_token(token)
    
    # Extraire environnement du token
    token_env = extract_env_from_source(token_info.source)
    
    # Valider correspondance
    if token_env != request_env:
        raise Forbidden(
            f"Environment mismatch: token env is '{token_env}' but request env is '{request_env}'"
        )
    
    return token_info
```

#### Étape 1.2 : Modifier endpoint ingest

**Fichier** : `sources/dvig/dvig/api/v1/ingest.py`

```python
@router.post("/ingest")
async def ingest(
    request: Request,
    payload: IngestPayload,
    env: str = Header(..., alias="X-Dorevia-Env")
):
    """
    Endpoint d'ingestion avec validation environnement.
    
    Headers:
        Authorization: Bearer <token>
        X-Dorevia-Env: <env> (lab, stinger, prod)
    """
    # Extraire token
    token = extract_token_from_header(request.headers.get("Authorization"))
    
    # Valider token et environnement
    token_info = validate_token_and_env(token, env)
    
    # Forward vers Vault avec env
    vault_response = await forward_to_vault(
        vault_url=VAULT_URL,
        payload=payload,
        env=env,
        source=token_info.source
    )
    
    return vault_response
```

---

### Phase 2 : Vault — Namespace par Environnement

#### Étape 2.1 : Modifier stockage

**Fichier** : `sources/vault/vault/core/storage.py`

```python
def store_document(env: str, source: str, document_data: dict) -> str:
    """
    Stocke un document dans le namespace de l'environnement.
    """
    # Validation environnement
    if env not in ["lab", "stinger", "prod"]:
        raise ValueError(f"Invalid environment: {env}")
    
    # Créer namespace
    namespace = f"env={env}"
    
    # Stocker dans base de données
    document_id = str(uuid.uuid4())
    db.execute(
        """
        INSERT INTO documents (id, env, namespace, source, document_data, created_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        """,
        (document_id, env, namespace, source, json.dumps(document_data))
    )
    
    return document_id
```

#### Étape 2.2 : Modifier lecture

**Fichier** : `sources/vault/vault/core/storage.py`

```python
def get_documents(env: str, filters: dict = None) -> list:
    """
    Récupère les documents du namespace de l'environnement.
    """
    # Validation environnement
    if env not in ["lab", "stinger", "prod"]:
        raise ValueError(f"Invalid environment: {env}")
    
    # Construire requête avec namespace
    namespace = f"env={env}"
    query = "SELECT * FROM documents WHERE namespace = %s"
    params = [namespace]
    
    # Ajouter filtres additionnels
    if filters:
        for key, value in filters.items():
            query += f" AND {key} = %s"
            params.append(value)
    
    # Exécuter requête
    results = db.fetch_all(query, params)
    
    return results
```

#### Étape 2.3 : Modifier endpoint constats

**Fichier** : `sources/vault/vault/api/v1/constats.py`

```python
@router.get("/constats")
async def get_constats(env: str = Query(..., description="Environnement (lab, stinger, prod)")):
    """
    Récupère les constats de l'environnement.
    
    Query Parameters:
        env: Environnement (obligatoire)
    """
    # Validation environnement
    if env not in ["lab", "stinger", "prod"]:
        raise ValueError(f"Invalid environment: {env}")
    
    # Récupérer constats depuis namespace
    constats = get_documents(env=env, filters={"type": "constat"})
    
    return {"constats": constats, "env": env}
```

---

### Phase 3 : Tests Automatisés

#### Étape 3.1 : Tests DVIG

**Fichier** : `tests/dvig/test_env_enforcement.py`

```python
import pytest
from dvig.core.auth import validate_token_and_env, Forbidden

def test_token_stinger_with_env_prod_forbidden():
    """Test que token STINGER avec env=prod est rejeté"""
    token = generate_token(source="odoo.stinger.core")
    
    with pytest.raises(Forbidden) as exc_info:
        validate_token_and_env(token, "prod")
    
    assert "Environment mismatch" in str(exc_info.value)

def test_token_prod_with_env_stinger_forbidden():
    """Test que token PROD avec env=stinger est rejeté"""
    token = generate_token(source="odoo.prod.core")
    
    with pytest.raises(Forbidden) as exc_info:
        validate_token_and_env(token, "stinger")
    
    assert "Environment mismatch" in str(exc_info.value)

def test_token_stinger_with_env_stinger_allowed():
    """Test que token STINGER avec env=stinger est accepté"""
    token = generate_token(source="odoo.stinger.core")
    
    token_info = validate_token_and_env(token, "stinger")
    
    assert token_info.source == "odoo.stinger.core"
```

#### Étape 3.2 : Tests Vault

**Fichier** : `tests/vault/test_namespace_isolation.py`

```python
import pytest
from vault.core.storage import store_document, get_documents

def test_constats_stinger_never_see_prod():
    """Test que constats stinger ne voient jamais les données prod"""
    # Créer document PROD
    store_document(env="prod", source="odoo.prod.core", document_data={"test": "prod"})
    
    # Récupérer constats STINGER
    constats = get_documents(env="stinger", filters={"type": "constat"})
    
    # Vérifier qu'aucun document PROD n'est présent
    for constat in constats:
        assert constat["env"] == "stinger"
        assert "prod" not in constat["source"]

def test_write_stinger_in_stinger_namespace():
    """Test que écriture stinger va dans namespace stinger"""
    document_id = store_document(
        env="stinger",
        source="odoo.stinger.core",
        document_data={"test": "stinger"}
    )
    
    # Vérifier namespace
    document = get_document(document_id)
    assert document["namespace"] == "env=stinger"
    assert document["env"] == "stinger"

def test_read_prod_never_sees_stinger():
    """Test que lecture prod ne voit jamais les données stinger"""
    # Créer document STINGER
    store_document(env="stinger", source="odoo.stinger.core", document_data={"test": "stinger"})
    
    # Lire documents PROD
    documents = get_documents(env="prod")
    
    # Vérifier qu'aucun document STINGER n'est présent
    for doc in documents:
        assert doc["env"] == "prod"
        assert "stinger" not in doc["source"]
```

---

## 📋 Checklist d'Implémentation

### Phase 1 : DVIG

- [ ] Modifier validation token pour inclure environnement
- [ ] Ajouter header `X-Dorevia-Env` obligatoire
- [ ] Implémenter validation environnement mismatch
- [ ] Retourner 403 si mismatch
- [ ] Tests automatisés : token stinger + env prod → 403
- [ ] Tests automatisés : token prod + env stinger → 403
- [ ] Tests automatisés : token stinger + env stinger → 200

### Phase 2 : Vault

- [ ] Ajouter colonne `env` et `namespace` dans table `documents`
- [ ] Ajouter contrainte `namespace = env=<env>`
- [ ] Modifier stockage pour utiliser namespace
- [ ] Modifier lecture pour filtrer par namespace
- [ ] Modifier endpoint constats pour exiger `env`
- [ ] Interdire endpoints "global" sans env (ou réserver admin)
- [ ] Tests automatisés : constats stinger ne voient jamais prod
- [ ] Tests automatisés : écriture stinger dans namespace stinger
- [ ] Tests automatisés : lecture prod ne voit jamais stinger

### Phase 3 : Intégration

- [ ] Tests end-to-end : flux complet STINGER isolé
- [ ] Tests end-to-end : flux complet PROD isolé
- [ ] Documentation : Guide utilisation avec garde-fous
- [ ] Monitoring : Alertes si mismatch détecté

---

## 🎯 Résultat Attendu

### Isolation Opérationnelle Forte

- ✅ **Zéro mélange STINGER/PROD** : Même en cas d'erreur humaine
- ✅ **Enforcement technique** : Contraintes au niveau code
- ✅ **Tests automatisés** : Validation continue
- ✅ **Pas de migration lourde** : Architecture actuelle conservée

### Avantages

- ✅ Isolation opérationnelle sans x3 infra
- ✅ Pas de DNS supplémentaires
- ✅ Pas de DVIG routeur
- ✅ Pas de x3 DB/volumes
- ✅ Porte ouverte vers Alt 3 plus tard

---

## 📎 Références

- `ZeDocs/TestV2/COMPARAISON_ALTERNATIVES_DVIG_VAULT_v1.0.md` — Comparaison alternatives
- `ZeDocs/TestV2/ADR-0009_Stinger_Isolation_Strategy.md` — Décision architecturale
- `ZeDocs/TestV2/SPEC_STINGER_v1.0.md` — Spécification STINGER

---

**Version** : 1.0  
**Date** : 2026-01-10  
**Statut** : 📋 **À implémenter**
