"""
Tests unitaires pour TokenStore et YamlTokenStore
"""
import pytest
import tempfile
import os
import yaml
import hashlib
from datetime import datetime, timezone
from dvig.api_fastapi.auth.token_store import YamlTokenStore, TokenInfo


@pytest.fixture
def temp_tokens_file():
    """Crée un fichier tokens.yml temporaire"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
        yield f.name
    os.unlink(f.name)


@pytest.fixture
def valid_tokens_yaml(temp_tokens_file):
    """Crée un fichier YAML valide avec tokens"""
    token_hash = "a" * 64  # Hash valide (64 hex)
    data = {
        "version": 1,
        "tokens": [
            {
                "id": "tok_001",
                "token_hash": f"sha256:{token_hash}",
                "tenant": "rehtse",
                "univers": "odoo",
                "status": "active",
                "created_at": "2025-01-28T00:00:00Z",
                "comment": "Test token"
            },
            {
                "id": "tok_002",
                "token_hash": f"sha256:{'b' * 64}",
                "tenant": "rehtse",
                "univers": "odoo",
                "status": "disabled",
                "created_at": "2025-01-28T00:00:00Z"
            },
            {
                "id": "tok_003",
                "token_hash": f"sha256:{'c' * 64}",
                "tenant": "rehtse",
                "univers": "odoo",
                "status": "revoked",
                "created_at": "2025-01-28T00:00:00Z"
            }
        ]
    }
    with open(temp_tokens_file, 'w') as f:
        yaml.dump(data, f)
    return temp_tokens_file, token_hash


def test_yaml_load_success(valid_tokens_yaml):
    """Test chargement YAML valide"""
    file_path, token_hash = valid_tokens_yaml
    store = YamlTokenStore(file_path)
    
    assert store.is_available()
    token_info = store.get_token_info(token_hash)
    assert token_info is not None
    assert token_info.id == "tok_001"
    assert token_info.tenant == "rehtse"
    assert token_info.univers == "odoo"
    assert token_info.status == "active"


def test_yaml_load_file_not_found():
    """Test chargement fichier inexistant"""
    store = YamlTokenStore("/nonexistent/tokens.yml")
    
    assert not store.is_available()
    assert store.get_token_info("any_hash") is None


def test_yaml_load_invalid_yaml(temp_tokens_file):
    """Test chargement YAML invalide"""
    with open(temp_tokens_file, 'w') as f:
        f.write("invalid: yaml: content: [")
    
    store = YamlTokenStore(temp_tokens_file)
    assert not store.is_available()


def test_yaml_load_invalid_token(temp_tokens_file):
    """Test chargement token avec hash invalide"""
    data = {
        "version": 1,
        "tokens": [
            {
                "id": "tok_invalid",
                "token_hash": "invalid_hash",  # Pas 64 hex
                "tenant": "rehtse",
                "univers": "odoo",
                "status": "active"
            }
        ]
    }
    with open(temp_tokens_file, 'w') as f:
        yaml.dump(data, f)
    
    store = YamlTokenStore(temp_tokens_file)
    # Token invalide ignoré, mais store disponible si YAML valide
    assert store.is_available()
    assert store.get_token_info("any_hash") is None


def test_get_token_info_active(valid_tokens_yaml):
    """Test récupération token actif"""
    file_path, token_hash = valid_tokens_yaml
    store = YamlTokenStore(file_path)
    
    token_info = store.get_token_info(token_hash)
    assert token_info is not None
    assert token_info.status == "active"


def test_get_token_info_disabled(valid_tokens_yaml):
    """Test récupération token disabled (CORRECTION I1)"""
    file_path, _ = valid_tokens_yaml
    store = YamlTokenStore(file_path)
    
    # Token disabled doit être retourné (pas filtré dans get_token_info)
    disabled_hash = 'b' * 64
    token_info = store.get_token_info(disabled_hash)
    assert token_info is not None
    assert token_info.status == "disabled"


def test_get_token_info_revoked(valid_tokens_yaml):
    """Test récupération token revoked (CORRECTION I1)"""
    file_path, _ = valid_tokens_yaml
    store = YamlTokenStore(file_path)
    
    # Token revoked doit être retourné (pas filtré dans get_token_info)
    revoked_hash = 'c' * 64
    token_info = store.get_token_info(revoked_hash)
    assert token_info is not None
    assert token_info.status == "revoked"


def test_get_token_info_not_found(valid_tokens_yaml):
    """Test récupération token non trouvé"""
    file_path, _ = valid_tokens_yaml
    store = YamlTokenStore(file_path)
    
    unknown_hash = 'z' * 64
    token_info = store.get_token_info(unknown_hash)
    assert token_info is None


def test_reload_atomic(valid_tokens_yaml):
    """Test reload atomique"""
    file_path, token_hash = valid_tokens_yaml
    store = YamlTokenStore(file_path)
    
    # Modifier le fichier
    new_hash = 'd' * 64
    data = {
        "version": 1,
        "tokens": [
            {
                "id": "tok_new",
                "token_hash": f"sha256:{new_hash}",
                "tenant": "rehtse",
                "univers": "odoo",
                "status": "active"
            }
        ]
    }
    with open(file_path, 'w') as f:
        yaml.dump(data, f)
    
    # Reload
    result = store.reload()
    assert result is True
    
    # Vérifier nouveau token
    token_info = store.get_token_info(new_hash)
    assert token_info is not None
    assert token_info.id == "tok_new"
    
    # Ancien token ne doit plus être présent
    assert store.get_token_info(token_hash) is None


def test_reload_invalid_yaml_keeps_old(valid_tokens_yaml):
    """Test reload avec YAML invalide conserve ancien store"""
    file_path, token_hash = valid_tokens_yaml
    store = YamlTokenStore(file_path)
    
    # Vérifier token initial présent
    assert store.get_token_info(token_hash) is not None
    
    # Corrompre le fichier
    with open(file_path, 'w') as f:
        f.write("invalid: yaml: [")
    
    # Reload doit échouer mais conserver ancien
    result = store.reload()
    assert result is False
    
    # Token initial doit toujours être présent
    assert store.get_token_info(token_hash) is not None


def test_is_available_with_zero_tokens(temp_tokens_file):
    """Test is_available avec 0 tokens (CORRECTION B5)"""
    # YAML valide mais liste tokens vide
    data = {
        "version": 1,
        "tokens": []
    }
    with open(temp_tokens_file, 'w') as f:
        yaml.dump(data, f)
    
    store = YamlTokenStore(temp_tokens_file)
    
    # Store doit être disponible même avec 0 tokens
    assert store.is_available()
    
    # Mais aucun token ne doit être trouvé
    assert store.get_token_info("any_hash") is None

