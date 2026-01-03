"""
Tests unitaires pour l'endpoint /health
FastAPI
"""
import pytest


def test_health_endpoint(client):
    """Test de l'endpoint /health"""
    response = client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "ok"
    assert data["service"] == "dvig"

