"""
Tests d'intégration pour l'endpoint POST /ingest
"""
import sys
from pathlib import Path
import copy

dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

import pytest
from datetime import datetime, timezone
from storage.tokens import generate_and_store_token
from storage.proofs import create_proof


class TestIngestEndpoint:
    """Tests pour l'endpoint /ingest"""
    
    def test_ingest_without_token(self, client):
        """Test sans token (doit retourner 401)"""
        response = client.post(
            "/api/v1/ingest",
            json={
                "source": {
                    "unit": "odoo",  # SPEC v1.5.1 : unit au lieu de application
                    "tenant": "test_tenant",
                    "env": "lab"
                },
                "event": {
                    "type": "invoice.posted",
                    "id": "EVT-001",
                    "occurred_at": "2025-12-20T10:00:00Z"
                },
                "data": {}
            }
        )
        assert response.status_code == 401
    
    def test_ingest_with_invalid_token(self, client):
        """Test avec token invalide (doit retourner 401)"""
        response = client.post(
            "/api/v1/ingest",
            json={
                "source": {
                    "unit": "odoo",  # SPEC v1.5.1 : unit au lieu de application
                    "tenant": "test_tenant",
                    "env": "lab"
                },
                "event": {
                    "type": "invoice.posted",
                    "id": "EVT-001",
                    "occurred_at": "2025-12-20T10:00:00Z"
                },
                "data": {}
            },
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
    
    def test_ingest_with_valid_token(self, client, db_session, sample_payload):
        """Test avec token valide"""
        from unittest.mock import patch, AsyncMock
        
        # Créer un token avec scope_unit
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        
        # Commit la transaction pour que le token soit disponible
        db_session.commit()
        
        # Expirer tous les objets de la session pour forcer un refresh depuis la BDD
        # (Évite les problèmes de transaction)
        db_session.expire_all()
        
        # Mock de send_to_vault
        mock_vault_response = {
            "status": "vaulted",
            "proof_id": "vault_proof_123"
        }
        
        with patch("api.ingest.send_to_vault", new_callable=AsyncMock) as mock_vault:
            mock_vault.return_value = mock_vault_response
            
            response = client.post(
                "/api/v1/ingest",
                json=sample_payload,
                headers={"Authorization": f"Bearer {token}"}
            )
            
            # Le endpoint devrait réussir
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert response.json()["status"] == "vaulted"
            assert "proof_id" in response.json()
    
    def test_ingest_source_tenant_mismatch(self, client, db_session, sample_payload):
        """Test avec source.tenant ne correspondant pas au token"""
        # Copie défensive du payload (bonne pratique 5.1)
        payload = copy.deepcopy(sample_payload)
        
        # Créer un token pour tenant1
        token = generate_and_store_token("tenant1", "lab", "odoo", db_session)
        
        # Envoyer un payload avec tenant2
        payload["source"]["tenant"] = "tenant2"
        
        response = client.post(
            "/api/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 403
        response_data = response.json()
        # Adapter selon le format réel de FastAPI
        if "error" in response_data:
            assert "source.tenant" in response_data["error"].get("message", "")
        elif "detail" in response_data:
            assert "source.tenant" in str(response_data["detail"])
        else:
            assert "source.tenant" in str(response_data)
    
    def test_ingest_source_env_mismatch(self, client, db_session, sample_payload):
        """Test avec source.env ne correspondant pas au token"""
        # Copie défensive du payload (bonne pratique 5.1)
        payload = copy.deepcopy(sample_payload)
        
        # Créer un token pour lab
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        
        # Envoyer un payload avec stinger
        payload["source"]["env"] = "stinger"
        
        response = client.post(
            "/api/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 403
        response_data = response.json()
        # Adapter selon le format réel de FastAPI
        if "error" in response_data:
            assert "source.env" in response_data["error"].get("message", "")
        elif "detail" in response_data:
            assert "source.env" in str(response_data["detail"])
        else:
            assert "source.env" in str(response_data)
    
    def test_ingest_idempotence(self, client, db_session, sample_payload):
        """Test idempotence : même event.id doit retourner la même preuve"""
        from unittest.mock import patch, AsyncMock
        
        # Créer un token avec scope_unit
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        
        # Créer une preuve existante
        create_proof(
            db_session,
            proof_id="dvlt_test_tenant_20251220_000001",
            hash="existing_hash",
            timestamp=datetime.now(timezone.utc),
            event_id="EVT-TEST-001",
            tenant="test_tenant",
            env="lab"
        )
        
        # Mock de send_to_vault (ne sera pas appelé car preuve existe)
        with patch("api.ingest.send_to_vault", new_callable=AsyncMock):
            # Première requête
            response1 = client.post(
                "/api/v1/ingest",
                json=sample_payload,
                headers={"Authorization": f"Bearer {token}"}
            )
            
            # Deuxième requête avec le même event.id
            response2 = client.post(
                "/api/v1/ingest",
                json=sample_payload,
                headers={"Authorization": f"Bearer {token}"}
            )
            
            # Les deux doivent retourner la même preuve (idempotence)
            assert response1.status_code == 200
            assert response2.status_code == 200
            assert response1.json()["proof_id"] == response2.json()["proof_id"]
            assert response1.json()["proof_id"] == "dvlt_test_tenant_20251220_000001"
    
    def test_ingest_source_unit_mismatch(self, client, db_session, sample_payload):
        """Test avec source.unit ne correspondant pas au token.scope_unit (SPEC v1.5.1)"""
        # Copie défensive du payload (bonne pratique 5.1)
        payload = copy.deepcopy(sample_payload)
        
        # Créer un token avec scope_unit=odoo
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        
        # Envoyer un payload avec unit=sylius
        payload["source"]["unit"] = "sylius"
        
        response = client.post(
            "/api/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Doit retourner 403 Forbidden (cohérence token ↔ payload)
        assert response.status_code == 403
        response_data = response.json()
        # Adapter selon le format réel de FastAPI
        if "error" in response_data:
            assert "source.unit" in response_data["error"].get("message", "")
        elif "detail" in response_data:
            assert "source.unit" in str(response_data["detail"])
        else:
            assert "source.unit" in str(response_data)

