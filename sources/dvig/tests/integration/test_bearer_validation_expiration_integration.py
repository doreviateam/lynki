"""
Tests d'intégration pour la validation des tokens avec expiration et grace period (Phase 4)
Teste le comportement end-to-end avec des scénarios réels
"""
import pytest
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Ajouter sources/dvig au PYTHONPATH
dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

from storage.database import Base
from storage.tokens import DVIGToken, generate_and_store_token
from auth.bearer import get_tenant_from_token, get_env_from_token
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


class TestBearerValidationExpirationIntegration:
    """Tests d'intégration pour la validation des tokens avec expiration"""
    
    def test_legacy_token_workflow(self, db_session):
        """Test qu'un token legacy fonctionne dans un workflow complet"""
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
        
        # Tester extraction tenant/env (utilise la validation)
        import asyncio
        tenant = asyncio.run(get_tenant_from_token(
            type('Credentials', (), {'credentials': token})(),
            db_session
        ))
        env = asyncio.run(get_env_from_token(
            type('Credentials', (), {'credentials': token})(),
            db_session
        ))
        
        assert tenant == "test_tenant"
        assert env == "lab"
    
    def test_active_token_with_expiration_workflow(self, db_session):
        """Test qu'un token actif avec expiration fonctionne"""
        # Créer un token actif avec expiration future
        token = generate_and_store_token("test_tenant", "prod", "odoo", db_session)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # Définir expiration future
        token_record.status = 'active'
        token_record.expires_at = datetime.now(timezone.utc) + timedelta(days=365)
        db_session.commit()
        
        # Tester extraction tenant/env
        import asyncio
        tenant = asyncio.run(get_tenant_from_token(
            type('Credentials', (), {'credentials': token})(),
            db_session
        ))
        env = asyncio.run(get_env_from_token(
            type('Credentials', (), {'credentials': token})(),
            db_session
        ))
        
        assert tenant == "test_tenant"
        assert env == "prod"
    
    def test_grace_token_workflow(self, db_session):
        """Test qu'un token en grace period fonctionne"""
        # Créer un token en grace period
        token = generate_and_store_token("test_tenant", "prod", "odoo", db_session)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # Définir grace period valide
        token_record.status = 'grace'
        token_record.grace_until = datetime.now(timezone.utc) + timedelta(days=7)
        db_session.commit()
        
        # Tester extraction tenant/env
        import asyncio
        tenant = asyncio.run(get_tenant_from_token(
            type('Credentials', (), {'credentials': token})(),
            db_session
        ))
        env = asyncio.run(get_env_from_token(
            type('Credentials', (), {'credentials': token})(),
            db_session
        ))
        
        assert tenant == "test_tenant"
        assert env == "prod"
    
    def test_expired_token_rejected(self, db_session):
        """Test qu'un token expiré est rejeté dans un workflow complet"""
        # Créer un token expiré
        token = generate_and_store_token("test_tenant", "prod", "odoo", db_session)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # Définir expiration passée
        token_record.status = 'active'
        token_record.expires_at = datetime.now(timezone.utc) - timedelta(days=1)
        db_session.commit()
        
        # Tester extraction tenant/env (doit échouer)
        import asyncio
        from fastapi import HTTPException
        
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(get_tenant_from_token(
                type('Credentials', (), {'credentials': token})(),
                db_session
            ))
        
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail['error']['code'] == 'TOKEN_EXPIRED'

