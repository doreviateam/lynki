"""
Tests d'intégration pour l'endpoint /ingest avec authentification
"""
import pytest
import tempfile
import os
import yaml
import hashlib
from fastapi.testclient import TestClient
from dvig.api_fastapi.app import create_app
from dvig.api_fastapi.auth.auth import init_token_store
from dvig.api_fastapi.auth.token_store import YamlTokenStore


@pytest.fixture
def temp_tokens_file():
    """Crée un fichier tokens.yml temporaire"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
        yield f.name
    os.unlink(f.name)


@pytest.fixture
def valid_token_and_hash():
    """Génère un token valide et son hash"""
    token = "dvig_test_token_12345678901234567890"
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, token_hash


@pytest.fixture
def tokens_file_with_token(temp_tokens_file, valid_token_and_hash):
    """Crée un fichier tokens.yml avec un token actif"""
    _, token_hash = valid_token_and_hash
    data = {
        "version": 1,
        "tokens": [
            {
                "id": "tok_test",
                "token_hash": f"sha256:{token_hash}",
                "tenant": "rehtse",
                "univers": "odoo",
                "status": "active",
                "created_at": "2025-01-28T00:00:00Z"
            }
        ]
    }
    with open(temp_tokens_file, 'w') as f:
        yaml.dump(data, f)
    return temp_tokens_file


@pytest.fixture
def tokens_file_with_revoked_token(temp_tokens_file, valid_token_and_hash):
    """Crée un fichier tokens.yml avec un token révoqué"""
    _, token_hash = valid_token_and_hash
    data = {
        "version": 1,
        "tokens": [
            {
                "id": "tok_revoked",
                "token_hash": f"sha256:{token_hash}",
                "tenant": "rehtse",
                "univers": "odoo",
                "status": "revoked",
                "created_at": "2025-01-28T00:00:00Z"
            }
        ]
    }
    with open(temp_tokens_file, 'w') as f:
        yaml.dump(data, f)
    return temp_tokens_file


@pytest.fixture
def client_with_auth(tokens_file_with_token, monkeypatch):
    """Client FastAPI avec auth activée"""
    monkeypatch.setenv("DVIG_AUTH_ENABLED", "1")
    monkeypatch.setenv("DVIG_TOKENS_FILE", tokens_file_with_token)
    monkeypatch.setenv("DVIG_DOCS_ENABLED", "1")
    monkeypatch.setenv("DVIG_OPENAPI_ENABLED", "1")
    
    app = create_app()
    return TestClient(app)


@pytest.fixture
def client_without_auth(monkeypatch):
    """Client FastAPI sans auth"""
    monkeypatch.setenv("DVIG_AUTH_ENABLED", "0")
    monkeypatch.setenv("DVIG_DOCS_ENABLED", "1")
    monkeypatch.setenv("DVIG_OPENAPI_ENABLED", "1")
    
    app = create_app()
    return TestClient(app)


def test_ingest_with_valid_token(client_with_auth, valid_token_and_hash):
    """Test ingestion avec token valide"""
    token, _ = valid_token_and_hash
    
    response = client_with_auth.post(
        "/ingest",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "event_type": "test.event",
            "source": "odoo.lab.core",
            "data": {"msg": "hello"}
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "accepted"
    assert "event_id" in data
    assert "ts" in data


def test_ingest_without_token_401(client_with_auth):
    """Test ingestion sans token (CORRECTION B3)"""
    response = client_with_auth.post(
        "/ingest",
        json={
            "event_type": "test.event",
            "source": "odoo.lab.core",
            "data": {}
        }
    )
    
    assert response.status_code == 401
    data = response.json()
    # FastAPI retourne {"detail": {...}}
    assert data["detail"]["status"] == "error"
    assert data["detail"]["error"]["code"] == "AUTH_MISSING"


def test_ingest_with_invalid_token_401(client_with_auth):
    """Test ingestion avec token invalide"""
    response = client_with_auth.post(
        "/ingest",
        headers={"Authorization": "Bearer invalid_token_xyz"},
        json={
            "event_type": "test.event",
            "source": "odoo.lab.core",
            "data": {}
        }
    )
    
    assert response.status_code == 401
    data = response.json()
    assert data["detail"]["status"] == "error"
    assert data["detail"]["error"]["code"] == "INVALID_TOKEN"


def test_ingest_source_univers_mismatch_403(client_with_auth, valid_token_and_hash):
    """Test ingestion avec source/univers mismatch"""
    token, _ = valid_token_and_hash
    
    response = client_with_auth.post(
        "/ingest",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "event_type": "test.event",
            "source": "sylius.prod",  # Univers différent
            "data": {}
        }
    )
    
    assert response.status_code == 403
    data = response.json()
    assert data["detail"]["status"] == "error"
    assert data["detail"]["error"]["code"] == "UNIVERSE_MISMATCH"


def test_ingest_revoked_token_401(client_with_auth, tokens_file_with_revoked_token, valid_token_and_hash, monkeypatch):
    """Test ingestion avec token révoqué (CORRECTION I1)"""
    token, _ = valid_token_and_hash
    
    # Recréer client avec token révoqué
    monkeypatch.setenv("DVIG_TOKENS_FILE", tokens_file_with_revoked_token)
    app = create_app()
    client = TestClient(app)
    
    response = client.post(
        "/ingest",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "event_type": "test.event",
            "source": "odoo.lab.core",
            "data": {}
        }
    )
    
    assert response.status_code == 401
    data = response.json()
    assert data["detail"]["status"] == "error"
    assert data["detail"]["error"]["code"] == "TOKEN_REVOKED"


def test_ingest_backend_unavailable_503(temp_tokens_file, monkeypatch):
    """Test ingestion avec backend indisponible"""
    # Fichier tokens inexistant
    monkeypatch.setenv("DVIG_AUTH_ENABLED", "1")
    monkeypatch.setenv("DVIG_TOKENS_FILE", "/nonexistent/tokens.yml")
    monkeypatch.setenv("DVIG_DOCS_ENABLED", "1")
    monkeypatch.setenv("DVIG_OPENAPI_ENABLED", "1")
    
    app = create_app()
    client = TestClient(app)
    
    response = client.post(
        "/ingest",
        headers={"Authorization": "Bearer any_token"},
        json={
            "event_type": "test.event",
            "source": "odoo.lab.core",
            "data": {}
        }
    )
    
    assert response.status_code == 503
    data = response.json()
    assert data["detail"]["status"] == "error"
    assert data["detail"]["error"]["code"] == "AUTH_BACKEND_UNAVAILABLE"

