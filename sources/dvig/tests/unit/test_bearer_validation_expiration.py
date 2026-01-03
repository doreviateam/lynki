"""
Tests unitaires pour la validation des tokens avec expiration et grace period (Phase 4)
"""
import pytest
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Ajouter sources/dvig au PYTHONPATH
dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

from storage.database import Base
from storage.tokens import DVIGToken, generate_and_store_token
from auth.bearer import _validate_token_and_get_record
import hashlib


@pytest.fixture
def db_session():
    """Créer une session de base de données en mémoire pour les tests"""
    engine = create_engine("sqlite:///:memory:", echo=False)
    
    # Créer la table de base
    Base.metadata.create_all(engine)
    
    # Appliquer les migrations précédentes
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE dvig_tokens ADD COLUMN accept_until TIMESTAMP NULL"))
            conn.execute(text("ALTER TABLE dvig_tokens ADD COLUMN scope_unit VARCHAR(50) NULL"))
            conn.execute(text("UPDATE dvig_tokens SET scope_unit = 'odoo' WHERE scope_unit IS NULL"))
        except Exception:
            pass
        conn.commit()
    
    # Appliquer la migration 005
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE dvig_tokens ADD COLUMN expires_at TIMESTAMP NULL"))
            conn.execute(text("ALTER TABLE dvig_tokens ADD COLUMN status TEXT NOT NULL DEFAULT 'legacy'"))
            conn.execute(text("ALTER TABLE dvig_tokens ADD COLUMN grace_until TIMESTAMP NULL"))
            conn.execute(text("ALTER TABLE dvig_tokens ADD COLUMN replaces_token_id INTEGER NULL"))
            conn.execute(text("UPDATE dvig_tokens SET status = 'legacy' WHERE expires_at IS NULL AND status = 'legacy'"))
        except Exception:
            pass
        conn.commit()
    
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


class TestBearerValidationExpiration:
    """Tests pour la validation des tokens avec expiration et grace period"""
    
    def test_validate_token_revoked_status(self, db_session):
        """Test qu'un token avec status='revoked' est refusé"""
        # Créer un token révoqué
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # Marquer comme révoqué
        token_record.status = 'revoked'
        db_session.commit()
        
        # Tester la validation (doit échouer)
        with pytest.raises(Exception):  # HTTPException
            import asyncio
            asyncio.run(_validate_token_and_get_record(token, db_session))
    
    def test_validate_token_expired(self, db_session):
        """Test qu'un token expiré est refusé"""
        # Créer un token avec expiration passée
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # Définir expiration passée
        token_record.expires_at = datetime.now(timezone.utc) - timedelta(days=1)
        token_record.status = 'active'
        db_session.commit()
        
        # Tester la validation (doit échouer)
        with pytest.raises(Exception):  # HTTPException
            import asyncio
            asyncio.run(_validate_token_and_get_record(token, db_session))
    
    def test_validate_token_grace_valid(self, db_session):
        """Test qu'un token en grace period valide est accepté"""
        # Créer un token en grace period
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # Définir grace period valide
        token_record.status = 'grace'
        token_record.grace_until = datetime.now(timezone.utc) + timedelta(days=7)
        db_session.commit()
        
        # Tester la validation (doit réussir)
        import asyncio
        result = asyncio.run(_validate_token_and_get_record(token, db_session))
        assert result is not None
        assert result.status == 'grace'
    
    def test_validate_token_grace_ended(self, db_session):
        """Test qu'un token en grace period expiré est refusé"""
        # Créer un token en grace period expiré
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # Définir grace period expirée
        token_record.status = 'grace'
        token_record.grace_until = datetime.now(timezone.utc) - timedelta(days=1)
        db_session.commit()
        
        # Tester la validation (doit échouer)
        with pytest.raises(Exception):  # HTTPException
            import asyncio
            asyncio.run(_validate_token_and_get_record(token, db_session))
    
    def test_validate_token_grace_incoherent(self, db_session):
        """Test qu'un token en grace sans grace_until est refusé"""
        # Créer un token en grace sans grace_until
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # Définir grace sans grace_until
        token_record.status = 'grace'
        token_record.grace_until = None
        db_session.commit()
        
        # Tester la validation (doit échouer)
        with pytest.raises(Exception):  # HTTPException
            import asyncio
            asyncio.run(_validate_token_and_get_record(token, db_session))
    
    def test_validate_token_legacy_accepted(self, db_session):
        """Test qu'un token legacy (sans expiration) est accepté"""
        # Créer un token legacy
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # S'assurer que c'est un token legacy
        token_record.status = 'legacy'
        token_record.expires_at = None
        db_session.commit()
        
        # Tester la validation (doit réussir)
        import asyncio
        result = asyncio.run(_validate_token_and_get_record(token, db_session))
        assert result is not None
        assert result.status == 'legacy' or result.status is None
    
    def test_validate_token_active_with_expiration(self, db_session):
        """Test qu'un token actif avec expiration future est accepté"""
        # Créer un token actif avec expiration future
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # Définir expiration future
        token_record.status = 'active'
        token_record.expires_at = datetime.now(timezone.utc) + timedelta(days=365)
        db_session.commit()
        
        # Tester la validation (doit réussir)
        import asyncio
        result = asyncio.run(_validate_token_and_get_record(token, db_session))
        assert result is not None
        assert result.status == 'active'
        assert result.expires_at is not None

