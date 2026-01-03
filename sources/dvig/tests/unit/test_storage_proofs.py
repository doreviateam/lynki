"""
Tests unitaires pour storage/proofs.py
"""
import sys
from pathlib import Path
dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

import pytest
from datetime import datetime, timezone
from storage.proofs import Proof, get_proof_by_event_id, create_proof


class TestProofStorage:
    """Tests pour le stockage des preuves"""
    
    def test_create_proof(self, db_session):
        """Test création d'une preuve"""
        proof = create_proof(
            db_session,
            proof_id="dvlt_test_20251220_000001",
            hash="abc123",
            timestamp=datetime.now(timezone.utc),
            event_id="EVT-001",
            tenant="test_tenant",
            env="lab"
        )
        
        assert proof.proof_id == "dvlt_test_20251220_000001"
        assert proof.hash == "abc123"
        assert proof.event_id == "EVT-001"
        assert proof.tenant == "test_tenant"
        assert proof.env == "lab"
        assert proof.date == "20251220"
        assert proof.sequence == 1
    
    def test_get_proof_by_event_id_exists(self, db_session):
        """Test récupération d'une preuve existante par event_id"""
        # Créer une preuve
        create_proof(
            db_session,
            proof_id="dvlt_test_20251220_000001",
            hash="abc123",
            timestamp=datetime.now(timezone.utc),
            event_id="EVT-001",
            tenant="test_tenant",
            env="lab"
        )
        
        # Récupérer la preuve
        proof = get_proof_by_event_id(db_session, "test_tenant", "lab", "EVT-001")
        
        assert proof is not None
        assert proof.proof_id == "dvlt_test_20251220_000001"
        assert proof.event_id == "EVT-001"
    
    def test_get_proof_by_event_id_not_exists(self, db_session):
        """Test récupération d'une preuve inexistante"""
        proof = get_proof_by_event_id(db_session, "test_tenant", "lab", "EVT-999")
        assert proof is None
    
    def test_idempotence_same_event_id(self, db_session):
        """Test idempotence : même event_id doit retourner la même preuve"""
        # Créer une première preuve
        proof1 = create_proof(
            db_session,
            proof_id="dvlt_test_20251220_000001",
            hash="abc123",
            timestamp=datetime.now(timezone.utc),
            event_id="EVT-001",
            tenant="test_tenant",
            env="lab"
        )
        
        # Récupérer la preuve par event_id (idempotence)
        proof2 = get_proof_by_event_id(db_session, "test_tenant", "lab", "EVT-001")
        
        assert proof2 is not None
        assert proof2.proof_id == proof1.proof_id
        assert proof2.hash == proof1.hash
    
    def test_proof_different_tenants(self, db_session):
        """Les preuves doivent être isolées par tenant"""
        # Créer une preuve pour tenant1
        create_proof(
            db_session,
            proof_id="dvlt_tenant1_20251220_000001",
            hash="hash1",
            timestamp=datetime.now(timezone.utc),
            event_id="EVT-001",
            tenant="tenant1",
            env="lab"
        )
        
        # Créer une preuve pour tenant2 avec le même event_id
        create_proof(
            db_session,
            proof_id="dvlt_tenant2_20251220_000001",
            hash="hash2",
            timestamp=datetime.now(timezone.utc),
            event_id="EVT-001",
            tenant="tenant2",
            env="lab"
        )
        
        # Les deux preuves doivent exister indépendamment
        proof1 = get_proof_by_event_id(db_session, "tenant1", "lab", "EVT-001")
        proof2 = get_proof_by_event_id(db_session, "tenant2", "lab", "EVT-001")
        
        assert proof1 is not None
        assert proof2 is not None
        assert proof1.tenant == "tenant1"
        assert proof2.tenant == "tenant2"

