"""
Tests négatifs pour headers Authorization
Validation de la robustesse face aux headers mal formés
"""
import sys
from pathlib import Path

dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

import pytest
from storage.tokens import generate_and_store_token


class TestAuthHeaderNegative:
    """Tests négatifs pour headers Authorization"""
    
    @pytest.mark.negative
    def test_auth_header_missing(self, client, sample_payload):
        """Test sans header Authorization"""
        response = client.post(
            "/api/v1/ingest",
            json=sample_payload
        )
        
        assert response.status_code in [401, 403], \
            f"Code attendu 401 ou 403, reçu {response.status_code}"
    
    @pytest.mark.negative
    def test_auth_header_bearer_no_token(self, client, sample_payload):
        """Test avec Authorization: Bearer (pas de token)"""
        response = client.post(
            "/api/v1/ingest",
            json=sample_payload,
            headers={"Authorization": "Bearer "}
        )
        
        assert response.status_code == 401
    
    @pytest.mark.negative
    def test_auth_header_basic_scheme(self, client, sample_payload):
        """Test avec Authorization: Basic (scheme non supporté)"""
        response = client.post(
            "/api/v1/ingest",
            json=sample_payload,
            headers={"Authorization": "Basic dXNlcjpwYXNz"}
        )
        
        assert response.status_code == 401
    
    @pytest.mark.negative
    def test_auth_header_bearer_multiple_spaces(self, client, db_session, sample_payload):
        """Test avec Authorization: Bearer    <token> (espaces multiples)"""
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        db_session.commit()
        db_session.expire_all()
        
        # Espaces multiples avant le token
        response = client.post(
            "/api/v1/ingest",
            json=sample_payload,
            headers={"Authorization": f"Bearer    {token}"}
        )
        
        # FastAPI HTTPBearer devrait normaliser les espaces ou rejeter
        # On accepte soit 200 (normalisation) soit 401 (rejet)
        assert response.status_code in [200, 401], \
            f"Code attendu 200 ou 401, reçu {response.status_code}"
    
    @pytest.mark.negative
    def test_auth_header_token_too_long(self, client, sample_payload):
        """Test avec token très long (DoS-ish, > 10KB)"""
        # Créer un token très long (simulation DoS)
        very_long_token = "A" * 20000  # 20KB
        
        response = client.post(
            "/api/v1/ingest",
            json=sample_payload,
            headers={"Authorization": f"Bearer {very_long_token}"}
        )
        
        # Doit rejeter rapidement (401) sans timeout
        assert response.status_code == 401
        # Vérifier que la réponse est rapide (pas de timeout)
        # Note : On ne peut pas vraiment mesurer le temps ici, mais on vérifie que ça ne bloque pas

