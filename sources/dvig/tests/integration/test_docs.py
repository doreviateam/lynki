"""
Tests d'intégration pour /docs et /openapi.json
"""
import pytest
from fastapi.testclient import TestClient
from dvig.api_fastapi.app import create_app


def test_docs_enabled_200(monkeypatch):
    """Test /docs activé"""
    monkeypatch.setenv("DVIG_DOCS_ENABLED", "1")
    monkeypatch.setenv("DVIG_AUTH_ENABLED", "0")
    
    app = create_app()
    client = TestClient(app)
    
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")


def test_docs_disabled_404(monkeypatch):
    """Test /docs désactivé (CORRECTION B6)"""
    monkeypatch.setenv("DVIG_DOCS_ENABLED", "0")
    monkeypatch.setenv("DVIG_AUTH_ENABLED", "0")
    
    app = create_app()
    client = TestClient(app)
    
    response = client.get("/docs")
    assert response.status_code == 404


def test_openapi_enabled_200(monkeypatch):
    """Test /openapi.json activé"""
    monkeypatch.setenv("DVIG_OPENAPI_ENABLED", "1")
    monkeypatch.setenv("DVIG_AUTH_ENABLED", "0")
    
    app = create_app()
    client = TestClient(app)
    
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert "info" in data
    assert data["info"]["title"] == "DVIG - Dorevia Vault Integration Gateway"


def test_openapi_disabled_404(monkeypatch):
    """Test /openapi.json désactivé (CORRECTION B6)"""
    monkeypatch.setenv("DVIG_OPENAPI_ENABLED", "0")
    monkeypatch.setenv("DVIG_AUTH_ENABLED", "0")
    
    app = create_app()
    client = TestClient(app)
    
    response = client.get("/openapi.json")
    assert response.status_code == 404

