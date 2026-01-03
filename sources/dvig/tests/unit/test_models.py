"""
Tests unitaires pour les modèles Pydantic
"""
import sys
from pathlib import Path
dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

import pytest
from datetime import datetime
from models.payload import SourceModel, EventModel, IngestPayload
from models.proof import ProofModel


class TestSourceModel:
    """Tests pour SourceModel"""
    
    def test_valid_source(self):
        """Test avec un source valide"""
        source = SourceModel(
            unit="odoo",  # SPEC v1.5.1 : unit au lieu de application
            tenant="test_tenant",
            env="lab"
        )
        assert source.unit == "odoo"
        assert source.tenant == "test_tenant"
        assert source.env == "lab"
    
    def test_source_with_optional_fields(self):
        """Test avec champs optionnels"""
        source = SourceModel(
            unit="odoo",  # SPEC v1.5.1 : unit au lieu de application
            tenant="test_tenant",
            env="lab",
            component="account.move",
            connector="dorevia-vault-connector",
            version="1.0.0"
        )
        assert source.component == "account.move"
        assert source.connector == "dorevia-vault-connector"
        assert source.version == "1.0.0"
    
    def test_source_unit_too_short(self):
        """Test avec unit trop courte"""
        with pytest.raises(Exception):  # ValidationError de Pydantic
            SourceModel(
                unit="ab",  # < 3 caractères
                tenant="test_tenant",
                env="lab"
            )
    
    def test_source_missing_required_fields(self):
        """Test avec champs obligatoires manquants"""
        with pytest.raises(Exception):
            SourceModel(
                unit="odoo"
                # tenant et env manquants
            )


class TestEventModel:
    """Tests pour EventModel"""
    
    def test_valid_event(self):
        """Test avec un event valide"""
        event = EventModel(
            type="invoice.posted",
            id="EVT-001",
            occurred_at="2025-12-20T10:00:00Z"
        )
        assert event.type == "invoice.posted"
        assert event.id == "EVT-001"
        assert event.occurred_at == "2025-12-20T10:00:00Z"
    
    def test_event_missing_fields(self):
        """Test avec champs manquants"""
        with pytest.raises(Exception):
            EventModel(
                type="invoice.posted"
                # id et occurred_at manquants
            )


class TestIngestPayload:
    """Tests pour IngestPayload"""
    
    def test_valid_payload(self):
        """Test avec un payload valide"""
        payload = IngestPayload(
            source=SourceModel(
                unit="odoo",  # SPEC v1.5.1 : unit au lieu de application
                tenant="test_tenant",
                env="lab"
            ),
            event=EventModel(
                type="invoice.posted",
                id="EVT-001",
                occurred_at="2025-12-20T10:00:00Z"
            ),
            data={"key": "value"}
        )
        assert payload.source.unit == "odoo"
        assert payload.event.id == "EVT-001"
        assert payload.data == {"key": "value"}
    
    def test_payload_missing_source(self):
        """Test avec source manquant"""
        with pytest.raises(Exception):
            IngestPayload(
                event=EventModel(
                    type="invoice.posted",
                    id="EVT-001",
                    occurred_at="2025-12-20T10:00:00Z"
                ),
                data={}
            )


class TestProofModel:
    """Tests pour ProofModel"""
    
    def test_valid_proof(self):
        """Test avec une preuve valide"""
        proof = ProofModel(
            proof_id="dvlt_test_20251220_000001",
            hash="abc123",
            timestamp=datetime.now(),
            event_id="EVT-001",
            tenant="test_tenant",
            env="lab"
        )
        assert proof.proof_id == "dvlt_test_20251220_000001"
        assert proof.hash == "abc123"

