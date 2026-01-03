"""
Tests unitaires pour la validation des tokens avec support de l'overlap
"""
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys
from pathlib import Path

# Ajouter sources/dvig au PYTHONPATH
project_root = Path(__file__).parent.parent.parent.parent
dvig_path = project_root / "sources" / "dvig"
sys.path.insert(0, str(dvig_path))

from storage.database import Base
from storage.tokens import DVIGToken, validate_token_with_overlap, rotate_dvig_token, revoke_dvig_token


@pytest.fixture
def db_session():
    """Créer une session de base de données en mémoire pour les tests"""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def sample_token():
    """Token de test"""
    return "test_token_123456789012345678901234567890"


def test_validate_token_active(db_session, sample_token):
    """Test validation d'un token actif"""
    import hashlib
    from storage.tokens import generate_and_store_token
    
    # Créer un token actif
    token = generate_and_store_token("test_tenant", "lab", db_session)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Valider le token
    token_record = validate_token_with_overlap(token, "test_tenant", "lab", db_session)
    
    assert token_record is not None
    assert token_record.tenant == "test_tenant"
    assert token_record.env == "lab"
    assert token_record.revoked_at is None


def test_validate_token_overlap(db_session):
    """Test validation d'un token en overlap"""
    import hashlib
    from storage.tokens import generate_and_store_token
    
    # Créer un token
    token = generate_and_store_token("test_tenant", "lab", db_session)
    token_record = db_session.query(DVIGToken).filter(
        DVIGToken.tenant == "test_tenant",
        DVIGToken.env == "lab"
    ).first()
    
    # Marquer comme révoqué mais avec overlap
    now = datetime.now(timezone.utc)
    token_record.revoked_at = now
    token_record.accept_until = now + timedelta(hours=48)
    db_session.commit()
    
    # Valider le token (doit être accepté car en overlap)
    result = validate_token_with_overlap(token, "test_tenant", "lab", db_session)
    
    assert result is not None
    assert result.revoked_at is not None
    assert result.accept_until > datetime.now(timezone.utc)


def test_validate_token_revoked(db_session):
    """Test validation d'un token révoqué (pas d'overlap)"""
    import hashlib
    from storage.tokens import generate_and_store_token
    
    # Créer un token
    token = generate_and_store_token("test_tenant", "lab", db_session)
    token_record = db_session.query(DVIGToken).filter(
        DVIGToken.tenant == "test_tenant",
        DVIGToken.env == "lab"
    ).first()
    
    # Marquer comme révoqué sans overlap
    now = datetime.now(timezone.utc)
    token_record.revoked_at = now
    token_record.accept_until = None
    db_session.commit()
    
    # Valider le token (doit être rejeté)
    result = validate_token_with_overlap(token, "test_tenant", "lab", db_session)
    
    assert result is None


def test_validate_token_expired_overlap(db_session):
    """Test validation d'un token avec overlap expiré"""
    import hashlib
    from storage.tokens import generate_and_store_token
    
    # Créer un token
    token = generate_and_store_token("test_tenant", "lab", db_session)
    token_record = db_session.query(DVIGToken).filter(
        DVIGToken.tenant == "test_tenant",
        DVIGToken.env == "lab"
    ).first()
    
    # Marquer comme révoqué avec overlap expiré
    now = datetime.now(timezone.utc)
    token_record.revoked_at = now - timedelta(hours=50)
    token_record.accept_until = now - timedelta(hours=2)  # Expiré
    db_session.commit()
    
    # Valider le token (doit être rejeté car overlap expiré)
    result = validate_token_with_overlap(token, "test_tenant", "lab", db_session)
    
    assert result is None


def test_validate_token_wrong_tenant(db_session):
    """Test validation avec mauvais tenant"""
    import hashlib
    from storage.tokens import generate_and_store_token
    
    # Créer un token
    token = generate_and_store_token("test_tenant", "lab", db_session)
    
    # Valider avec un autre tenant (doit être rejeté)
    result = validate_token_with_overlap(token, "other_tenant", "lab", db_session)
    
    assert result is None


def test_validate_token_wrong_env(db_session):
    """Test validation avec mauvais environnement"""
    import hashlib
    from storage.tokens import generate_and_store_token
    
    # Créer un token
    token = generate_and_store_token("test_tenant", "lab", db_session)
    
    # Valider avec un autre environnement (doit être rejeté)
    result = validate_token_with_overlap(token, "test_tenant", "prod", db_session)
    
    assert result is None


def test_rotate_token_with_overlap(db_session):
    """Test rotation d'un token avec overlap"""
    import hashlib
    from storage.tokens import generate_and_store_token
    
    # Créer un token initial
    old_token = generate_and_store_token("test_tenant", "lab", db_session)
    old_token_record = db_session.query(DVIGToken).filter(
        DVIGToken.tenant == "test_tenant",
        DVIGToken.env == "lab",
        DVIGToken.revoked_at.is_(None)
    ).first()
    old_token_id = old_token_record.id
    
    # Rotation avec overlap de 48h
    new_token, returned_old_id, new_token_id = rotate_dvig_token(
        "test_tenant", "lab", 48, db_session
    )
    
    # Vérifications
    assert new_token is not None
    assert returned_old_id == old_token_id
    assert new_token_id != old_token_id
    
    # Vérifier que l'ancien token est en overlap
    old_token_record = db_session.get(DVIGToken, old_token_id)
    assert old_token_record.revoked_at is not None
    assert old_token_record.accept_until is not None
    assert old_token_record.accept_until > datetime.now(timezone.utc)
    
    # Vérifier que le nouveau token est actif
    new_token_record = db_session.get(DVIGToken, new_token_id)
    assert new_token_record.revoked_at is None
    assert new_token_record.tenant == "test_tenant"
    assert new_token_record.env == "lab"
    
    # Vérifier que l'ancien token est encore valide (overlap)
    result = validate_token_with_overlap(old_token, "test_tenant", "lab", db_session)
    assert result is not None
    
    # Vérifier que le nouveau token est valide
    result = validate_token_with_overlap(new_token, "test_tenant", "lab", db_session)
    assert result is not None


def test_revoke_token_all(db_session):
    """Test révocation de tous les tokens actifs"""
    import hashlib
    from storage.tokens import generate_and_store_token
    
    # Créer plusieurs tokens actifs
    token1 = generate_and_store_token("test_tenant", "lab", db_session)
    token2 = generate_and_store_token("test_tenant", "lab", db_session)
    
    # Révocation de tous les tokens
    count = revoke_dvig_token("test_tenant", "lab", None, db_session)
    
    assert count == 2
    
    # Vérifier que les tokens sont révoqués
    tokens = db_session.query(DVIGToken).filter(
        DVIGToken.tenant == "test_tenant",
        DVIGToken.env == "lab",
        DVIGToken.revoked_at.isnot(None)
    ).all()
    
    assert len(tokens) == 2
    for token in tokens:
        assert token.accept_until is None  # Pas d'overlap pour révocation


def test_revoke_token_specific(db_session):
    """Test révocation d'un token spécifique"""
    import hashlib
    from storage.tokens import generate_and_store_token
    
    # Créer deux tokens
    token1 = generate_and_store_token("test_tenant", "lab", db_session)
    token2 = generate_and_store_token("test_tenant", "lab", db_session)
    
    token1_record = db_session.query(DVIGToken).filter(
        DVIGToken.tenant == "test_tenant",
        DVIGToken.env == "lab"
    ).order_by(DVIGToken.created_at).first()
    token1_id = token1_record.id
    
    # Révocation du token spécifique
    count = revoke_dvig_token("test_tenant", "lab", token1_id, db_session)
    
    assert count == 1
    
    # Vérifier que seul token1 est révoqué
    token1_record = db_session.get(DVIGToken, token1_id)
    assert token1_record.revoked_at is not None
    
    token2_record = db_session.query(DVIGToken).filter(
        DVIGToken.tenant == "test_tenant",
        DVIGToken.env == "lab",
        DVIGToken.id != token1_id
    ).first()
    assert token2_record.revoked_at is None

