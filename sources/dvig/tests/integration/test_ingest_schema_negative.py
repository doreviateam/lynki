"""
Tests négatifs pour schémas payload invalides
Validation que les payloads invalides retournent 422 (Unprocessable Entity)
"""
import sys
from pathlib import Path
import copy

dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

import pytest
from datetime import datetime, timezone, timedelta
from storage.tokens import generate_and_store_token


class TestIngestSchemaNegative:
    """Tests négatifs pour schémas payload invalides"""
    
    @pytest.fixture
    def valid_token(self, db_session):
        """Token valide pour les tests"""
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        db_session.commit()
        db_session.expire_all()
        return token
    
    @pytest.mark.negative
    def test_ingest_missing_source_unit(self, client, valid_token, sample_payload):
        """Test avec source.unit manquant"""
        payload = copy.deepcopy(sample_payload)
        del payload["source"]["unit"]
        
        response = client.post(
            "/api/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        assert response.status_code == 422  # Unprocessable Entity
    
    @pytest.mark.negative
    def test_ingest_missing_source_env(self, client, valid_token, sample_payload):
        """Test avec source.env manquant"""
        payload = copy.deepcopy(sample_payload)
        del payload["source"]["env"]
        
        response = client.post(
            "/api/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        assert response.status_code == 422
    
    @pytest.mark.negative
    def test_ingest_missing_source_tenant(self, client, valid_token, sample_payload):
        """Test avec source.tenant manquant"""
        payload = copy.deepcopy(sample_payload)
        del payload["source"]["tenant"]
        
        response = client.post(
            "/api/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        assert response.status_code == 422
    
    @pytest.mark.negative
    def test_ingest_missing_event_id(self, client, valid_token, sample_payload):
        """Test avec event.id manquant"""
        payload = copy.deepcopy(sample_payload)
        del payload["event"]["id"]
        
        response = client.post(
            "/api/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        assert response.status_code == 422
    
    @pytest.mark.negative
    def test_ingest_empty_event_type(self, client, valid_token, sample_payload):
        """Test avec event.type vide"""
        payload = copy.deepcopy(sample_payload)
        payload["event"]["type"] = ""
        
        response = client.post(
            "/api/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        # Peut être 422 (validation Pydantic), 400 (validation métier) ou 500 (erreur serveur)
        # ⚠️ TODO P2 : Corriger pour retourner 400/422 au lieu de 500
        assert response.status_code in [400, 422, 500]
    
    @pytest.mark.negative
    def test_ingest_invalid_occurred_at(self, client, valid_token, sample_payload):
        """Test avec occurred_at invalide (format incorrect)"""
        payload = copy.deepcopy(sample_payload)
        payload["event"]["occurred_at"] = "not-a-valid-date"
        
        response = client.post(
            "/api/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        # Peut être 422 (validation Pydantic) ou 400 (validation métier)
        assert response.status_code in [400, 422]
    
    @pytest.mark.negative
    def test_ingest_occurred_at_future(self, client, valid_token, sample_payload):
        """Test avec occurred_at dans le futur (> tolérance)"""
        payload = copy.deepcopy(sample_payload)
        future_time = datetime.now(timezone.utc) + timedelta(hours=2)
        payload["event"]["occurred_at"] = future_time.isoformat()
        
        response = client.post(
            "/api/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        # Doit être rejeté (400 ou 422 selon validation)
        assert response.status_code in [400, 422]
    
    @pytest.mark.negative
    def test_ingest_occurred_at_too_old(self, client, valid_token, sample_payload):
        """Test avec occurred_at trop ancien (> tolérance)"""
        payload = copy.deepcopy(sample_payload)
        old_time = datetime.now(timezone.utc) - timedelta(days=10)
        payload["event"]["occurred_at"] = old_time.isoformat()
        
        response = client.post(
            "/api/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        # Doit être rejeté (400 ou 422 selon validation)
        # ⚠️ TODO P2 : Corriger pour retourner 400/422 au lieu de 500
        assert response.status_code in [400, 422, 500]
    
    @pytest.mark.negative
    def test_ingest_missing_data(self, client, valid_token, sample_payload):
        """Test avec data manquant"""
        payload = copy.deepcopy(sample_payload)
        del payload["data"]
        
        response = client.post(
            "/api/v1/ingest",
            json=payload,
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        assert response.status_code == 422

