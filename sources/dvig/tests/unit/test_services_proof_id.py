"""
Tests unitaires pour services/proof_id.py
"""
import sys
from pathlib import Path
dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

import pytest
from datetime import datetime, timezone
from storage.proofs import Proof
from services.proof_id import generate_proof_id


class TestGenerateProofId:
    """Tests pour generate_proof_id"""
    
    def test_proof_id_format(self, db_session):
        """Le proof_id doit respecter le format canonique"""
        proof_id = generate_proof_id("testtenant", db_session)  # Pas d'underscore dans tenant
        assert proof_id.startswith("dvlt_")
        assert "testtenant" in proof_id
        # Format: dvlt_<tenant>_<YYYYMMDD>_<sequence>
        # Le tenant peut contenir des underscores, donc on split différemment
        assert proof_id.count("_") >= 3  # Au moins 3 underscores
        parts = proof_id.split("_")
        # Les 3 dernières parties sont: tenant (peut avoir _), date, sequence
        date_part = parts[-2]  # Avant-dernière partie
        sequence_part = parts[-1]  # Dernière partie
        assert len(date_part) == 8  # YYYYMMDD
        assert len(sequence_part) == 6  # sequence (000001-999999)
    
    def test_proof_id_sequential(self, db_session):
        """Les proof_id doivent être séquentiels"""
        from storage.proofs import create_proof
        from datetime import datetime, timezone
        
        # Générer le premier proof_id et créer le Proof en DB
        proof_id1 = generate_proof_id("testtenant", db_session)
        # Extraire date et séquence pour créer le Proof
        parts1 = proof_id1.split("_")
        date1 = parts1[-2]
        seq1 = int(parts1[-1])
        create_proof(
            db_session,
            proof_id=proof_id1,
            hash="hash1",
            timestamp=datetime.now(timezone.utc),
            event_id="EVT-001",
            tenant="testtenant",
            env="lab"
        )
        db_session.commit()
        
        # Générer le deuxième proof_id (doit être séquentiel)
        proof_id2 = generate_proof_id("testtenant", db_session)
        seq2 = int(proof_id2.split("_")[-1])
        assert seq2 == seq1 + 1
    
    def test_proof_id_different_tenants(self, db_session):
        """Les proof_id doivent être indépendants par tenant"""
        proof_id1 = generate_proof_id("tenant1", db_session)
        proof_id2 = generate_proof_id("tenant2", db_session)
        
        # Les séquences doivent être indépendantes
        seq1 = int(proof_id1.split("_")[3])
        seq2 = int(proof_id2.split("_")[3])
        # Les deux doivent commencer à 000001
        assert seq1 == 1
        assert seq2 == 1
    
    def test_proof_id_date_format(self, db_session):
        """Le proof_id doit contenir la date au format YYYYMMDD"""
        proof_id = generate_proof_id("testtenant", db_session)
        parts = proof_id.split("_")
        # La date est l'avant-dernière partie
        date_str = parts[-2]
        
        # Vérifier que c'est une date valide
        assert len(date_str) == 8
        datetime.strptime(date_str, "%Y%m%d")  # Ne doit pas lever d'exception
    
    def test_proof_id_sequence_padding(self, db_session):
        """La séquence doit être paddée à 6 chiffres"""
        proof_id = generate_proof_id("testtenant", db_session)
        parts = proof_id.split("_")
        sequence = parts[-1]  # Dernière partie
        assert len(sequence) == 6
        assert sequence == "000001"  # Premier de la journée

