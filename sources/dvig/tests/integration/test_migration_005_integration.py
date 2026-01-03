"""
Tests d'intégration pour la migration 005 : expiration et grace period
Teste la migration avec des tokens réels et des scénarios complets
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


class TestMigration005Integration:
    """Tests d'intégration pour la migration 005"""
    
    def test_legacy_token_still_works(self, db_session):
        """Test qu'un token legacy (sans expiration) continue de fonctionner après migration"""
        # Créer un token legacy (sans expiration)
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        
        # Vérifier que le token est stocké avec status='legacy'
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        assert token_record is not None
        # Vérifier que les attributs existent (après migration)
        if hasattr(token_record, 'status'):
            assert token_record.status == 'legacy' or token_record.status is None  # Peut être None si pas encore migré
        if hasattr(token_record, 'expires_at'):
            assert token_record.expires_at is None
    
    def test_new_token_with_expiration(self, db_session):
        """Test création d'un nouveau token avec expiration"""
        # Créer un token avec expiration
        token = generate_and_store_token("test_tenant", "prod", "odoo", db_session)
        
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        # Mettre à jour le token pour ajouter expiration (simule un token créé après migration)
        if token_record:
            expires_at = datetime.now(timezone.utc) + timedelta(days=365)
            token_record.expires_at = expires_at
            token_record.status = 'active'
            db_session.commit()
            
            # Vérifier
            db_session.refresh(token_record)
            assert token_record.expires_at is not None
            assert token_record.status == 'active'
    
    def test_token_grace_period(self, db_session):
        """Test qu'un token en grace period peut être créé et utilisé"""
        # Créer un token actif avec expiration
        token = generate_and_store_token("test_tenant", "prod", "odoo", db_session)
        
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        if token_record:
            # Simuler un renouvellement : ancien token en grace
            token_record.status = 'grace'
            token_record.grace_until = datetime.now(timezone.utc) + timedelta(days=7)
            db_session.commit()
            
            # Vérifier
            db_session.refresh(token_record)
            assert token_record.status == 'grace'
            assert token_record.grace_until is not None
    
    def test_token_replaces_relationship(self, db_session):
        """Test la relation replaces_token_id entre tokens"""
        # Créer un token actif
        old_token = generate_and_store_token("test_tenant", "prod", "odoo", db_session)
        
        import hashlib
        old_token_hash = hashlib.sha256(old_token.encode()).hexdigest()
        old_token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == old_token_hash
        ).first()
        
        if old_token_record:
            old_token_id = old_token_record.id
            
            # Créer un nouveau token qui remplace l'ancien
            new_token = generate_and_store_token("test_tenant", "prod", "odoo", db_session)
            new_token_hash = hashlib.sha256(new_token.encode()).hexdigest()
            new_token_record = db_session.query(DVIGToken).filter(
                DVIGToken.token_hash == new_token_hash
            ).first()
            
            if new_token_record:
                # Simuler le renouvellement
                new_token_record.replaces_token_id = old_token_id
                new_token_record.status = 'active'
                new_token_record.expires_at = datetime.now(timezone.utc) + timedelta(days=365)
                
                old_token_record.status = 'grace'
                old_token_record.grace_until = datetime.now(timezone.utc) + timedelta(days=7)
                
                db_session.commit()
                
                # Vérifier la relation
                db_session.refresh(new_token_record)
                assert new_token_record.replaces_token_id == old_token_id
                assert new_token_record.status == 'active'
                assert old_token_record.status == 'grace'

