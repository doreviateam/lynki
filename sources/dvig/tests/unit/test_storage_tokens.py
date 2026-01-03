"""
Tests unitaires pour storage/tokens.py
"""
import sys
from pathlib import Path
dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

import pytest
import hashlib
from storage.tokens import DVIGToken, generate_and_store_token, validate_token_from_db


class TestDVIGToken:
    """Tests pour le modèle DVIGToken"""
    
    def test_token_model_creation(self, db_session):
        """Test création d'un token en BDD"""
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        
        assert token is not None
        assert len(token) > 32  # Token URL-safe de 32 octets
        
        # Vérifier que le token est stocké en hash
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        stored_token = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        assert stored_token is not None
        assert stored_token.tenant == "test_tenant"
        assert stored_token.env == "lab"
        assert stored_token.scope_unit == "odoo"  # SPEC v1.5.1
        assert stored_token.revoked_at is None
    
    def test_validate_token_valid(self, db_session):
        """Test validation d'un token valide"""
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        token_record = validate_token_from_db(token, db_session)
        
        assert token_record is not None
        assert token_record.tenant == "test_tenant"
        assert token_record.env == "lab"
        assert token_record.scope_unit == "odoo"  # SPEC v1.5.1
    
    def test_validate_token_invalid(self, db_session):
        """Test validation d'un token invalide"""
        invalid_token = "invalid_token_123"
        token_record = validate_token_from_db(invalid_token, db_session)
        
        assert token_record is None
    
    def test_validate_token_revoked(self, db_session):
        """Test validation d'un token révoqué"""
        from datetime import datetime, timezone
        
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # Révoquer le token
        token_record.revoked_at = datetime.now(timezone.utc)
        db_session.commit()
        
        # Le token ne doit plus être valide
        token_record = validate_token_from_db(token, db_session)
        assert token_record is None
    
    def test_token_hash_not_plaintext(self, db_session):
        """Le token ne doit pas être stocké en clair"""
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        stored_token = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # Le token stocké doit être le hash, pas le token en clair
        assert stored_token.token_hash == token_hash
        assert stored_token.token_hash != token
    
    def test_token_scope_unit_different_units(self, db_session):
        """Test que deux tokens avec le même tenant/env mais des scope_unit différents sont distincts"""
        token1 = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        token2 = generate_and_store_token("test_tenant", "lab", "sylius", db_session)
        
        assert token1 != token2
        
        # Vérifier que les deux tokens sont stockés
        token1_hash = hashlib.sha256(token1.encode()).hexdigest()
        token2_hash = hashlib.sha256(token2.encode()).hexdigest()
        
        stored_token1 = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token1_hash
        ).first()
        stored_token2 = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token2_hash
        ).first()
        
        assert stored_token1 is not None
        assert stored_token2 is not None
        assert stored_token1.scope_unit == "odoo"
        assert stored_token2.scope_unit == "sylius"

