"""
Tests contractuels d'API pour l'endpoint GET /api/v1/auth/ping
Validation de token sans logique métier
"""
import sys
from pathlib import Path

dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

import pytest
from storage.tokens import generate_and_store_token, revoke_dvig_token
from datetime import datetime, timezone, timedelta


class TestAuthPingContract:
    """Tests contractuels pour l'endpoint /api/v1/auth/ping"""
    
    @pytest.mark.contract
    def test_auth_ping_without_token(self, client):
        """Test sans Authorization header"""
        response = client.get("/api/v1/auth/ping")
        
        # FastAPI HTTPBearer retourne 403 si le header Authorization est absent
        # Mais TestClient peut retourner 401 dans certains cas
        assert response.status_code in [401, 403], \
            f"Code attendu 401 ou 403, reçu {response.status_code}"
    
    @pytest.mark.contract
    def test_auth_ping_invalid_token(self, client):
        """Test avec token invalide"""
        response = client.get(
            "/api/v1/auth/ping",
            headers={"Authorization": "Bearer invalid_token_123456789012345678901234567890"}
        )
        
        assert response.status_code == 401
        # Vérifier le format d'erreur (peut être "detail" ou "error")
        error_data = response.json()
        if "detail" in error_data:
            # Format FastAPI standard
            detail = error_data["detail"]
            if isinstance(detail, dict):
                assert detail.get("status") == "error" or detail.get("error", {}).get("code") == "INVALID_TOKEN"
            else:
                # Format string
                assert "invalid" in detail.lower() or "token" in detail.lower()
        else:
            # Format personnalisé
            assert error_data.get("status") == "error"
            assert error_data.get("error", {}).get("code") == "INVALID_TOKEN"
    
    @pytest.mark.contract
    def test_auth_ping_revoked_token(self, client, db_session):
        """Test avec token révoqué"""
        # Créer un token
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        db_session.commit()
        
        # Révoquer le token (tous les tokens actifs pour ce tenant/env/scope_unit)
        revoke_dvig_token("test_tenant", "lab", "odoo", None, db_session)
        db_session.commit()
        db_session.expire_all()
        
        # Tester avec le token révoqué
        response = client.get(
            "/api/v1/auth/ping",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 401
        # Vérifier le format d'erreur (peut être "detail" ou "error")
        error_data = response.json()
        if "detail" in error_data:
            # Format FastAPI standard
            detail = error_data["detail"]
            if isinstance(detail, dict):
                assert detail.get("status") == "error" or detail.get("error", {}).get("code") == "INVALID_TOKEN"
            else:
                # Format string
                assert "invalid" in detail.lower() or "token" in detail.lower()
        else:
            # Format personnalisé
            assert error_data.get("status") == "error"
            assert error_data.get("error", {}).get("code") == "INVALID_TOKEN"
    
    @pytest.mark.contract
    def test_auth_ping_valid_token(self, client, db_session):
        """Test avec token valide"""
        # Créer un token
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        db_session.commit()
        db_session.expire_all()
        
        # Tester avec le token valide
        response = client.get(
            "/api/v1/auth/ping",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        json_response = response.json()
        
        # Vérifier le format JSON stable
        assert json_response == {
            "status": "ok",
            "tenant": "test_tenant",
            "env": "lab",
            "scope_unit": "odoo"
        }
    
    @pytest.mark.contract
    def test_auth_ping_response_format_stable(self, client, db_session):
        """
        Test que le format JSON est stable (pas de champs additionnels)
        """
        # Créer un token
        token = generate_and_store_token("test_tenant", "stinger", "sylius", db_session)
        db_session.commit()
        db_session.expire_all()
        
        # Tester avec le token valide
        response = client.get(
            "/api/v1/auth/ping",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        json_response = response.json()
        
        # Vérifier que seuls les champs attendus sont présents
        expected_keys = {"status", "tenant", "env", "scope_unit"}
        actual_keys = set(json_response.keys())
        assert actual_keys == expected_keys, \
            f"Champs additionnels inattendus : {actual_keys - expected_keys}"
        
        # Vérifier les valeurs
        assert json_response["status"] == "ok"
        assert json_response["tenant"] == "test_tenant"
        assert json_response["env"] == "stinger"
        assert json_response["scope_unit"] == "sylius"

