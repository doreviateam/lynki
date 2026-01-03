"""
Tests d'intégration pour les endpoints d'authentification (Phase 4)
GET /auth/token-status et POST /auth/renew
"""
import pytest
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Ajouter sources/dvig au PYTHONPATH
dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

from storage.database import Base
from storage.tokens import DVIGToken, generate_and_store_token
from dvig.api_fastapi.app import create_app

# Engine partagé pour tous les tests (StaticPool pour SQLite multi-thread)
_test_engine = None

def get_test_engine():
    """Créer ou récupérer l'engine de test"""
    global _test_engine
    if _test_engine is None:
        _test_engine = create_engine(
            "sqlite:///:memory:",
            echo=False,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool
        )
        
        # Créer la table de base
        Base.metadata.create_all(_test_engine)
        
        # Appliquer les migrations précédentes
        with _test_engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE dvig_tokens ADD COLUMN accept_until TIMESTAMP NULL"))
                conn.execute(text("ALTER TABLE dvig_tokens ADD COLUMN scope_unit VARCHAR(50) NULL"))
                conn.execute(text("UPDATE dvig_tokens SET scope_unit = 'odoo' WHERE scope_unit IS NULL"))
            except Exception:
                pass
            conn.commit()
        
        # Appliquer la migration 005
        with _test_engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE dvig_tokens ADD COLUMN expires_at TIMESTAMP NULL"))
                conn.execute(text("ALTER TABLE dvig_tokens ADD COLUMN status TEXT NOT NULL DEFAULT 'legacy'"))
                conn.execute(text("ALTER TABLE dvig_tokens ADD COLUMN grace_until TIMESTAMP NULL"))
                conn.execute(text("ALTER TABLE dvig_tokens ADD COLUMN replaces_token_id INTEGER NULL"))
                conn.execute(text("UPDATE dvig_tokens SET status = 'legacy' WHERE expires_at IS NULL AND status = 'legacy'"))
            except Exception:
                pass
            conn.commit()
    
    return _test_engine


@pytest.fixture
def db_session():
    """Créer une session de base de données en mémoire pour les tests"""
    engine = get_test_engine()
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    # Nettoyer la table avant chaque test
    session.execute(text("DELETE FROM dvig_tokens"))
    session.commit()
    
    yield session
    session.close()


@pytest.fixture
def client(db_session):
    """Créer un client de test FastAPI avec DB en mémoire"""
    from dvig.api_fastapi.routes.auth import get_db
    
    app = create_app()
    
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield TestClient(app)
    
    # Nettoyer après chaque test
    app.dependency_overrides.clear()


class TestAuthEndpoints:
    """Tests pour les endpoints d'authentification"""
    
    def test_get_token_status_legacy(self, client, db_session):
        """Test GET /auth/token-status pour un token legacy"""
        # Créer un token legacy
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        
        # Appeler l'endpoint
        response = client.get(
            "/auth/token-status",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "legacy" or data["status"] is None
        assert data["tenant"] == "test_tenant"
        assert data["env"] == "lab"
        assert data["scope_unit"] == "odoo"
        assert data["expires_at"] is None
        assert data["grace_until"] is None
    
    def test_get_token_status_active(self, client, db_session):
        """Test GET /auth/token-status pour un token actif avec expiration"""
        # Créer un token actif avec expiration
        token = generate_and_store_token("test_tenant", "prod", "odoo", db_session)
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        token_record.status = 'active'
        token_record.expires_at = datetime.now(timezone.utc) + timedelta(days=365)
        db_session.commit()
        
        # Appeler l'endpoint
        response = client.get(
            "/auth/token-status",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "active"
        assert data["tenant"] == "test_tenant"
        assert data["env"] == "prod"
        assert data["expires_at"] is not None
        assert data["days_until_expiration"] is not None
        assert data["days_until_expiration"] > 0
    
    def test_get_token_status_grace(self, client, db_session):
        """Test GET /auth/token-status pour un token en grace period"""
        # Créer un token en grace period
        token = generate_and_store_token("test_tenant", "prod", "odoo", db_session)
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        token_record.status = 'grace'
        token_record.grace_until = datetime.now(timezone.utc) + timedelta(days=7)
        db_session.commit()
        
        # Appeler l'endpoint
        response = client.get(
            "/auth/token-status",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "grace"
        assert data["grace_until"] is not None
        assert data["days_until_grace_end"] is not None
        assert data["days_until_grace_end"] > 0
    
    def test_renew_token_legacy(self, client, db_session):
        """Test POST /auth/renew pour un token legacy"""
        # Créer un token legacy
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        
        # Appeler l'endpoint de renouvellement
        response = client.post(
            "/auth/renew",
            headers={"Authorization": f"Bearer {token}"},
            json={"pre_renew_days": 30, "grace_days": 7}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "renewed"
        assert "new_token" in data
        assert data["new_token"] != token  # Nouveau token différent
        assert data["old_token_id"] is not None
        assert data["new_token_id"] is not None
        assert data["expires_at"] is not None
        assert data["grace_until"] is not None
    
    def test_renew_token_active_soon_expiring(self, client, db_session):
        """Test POST /auth/renew pour un token actif proche de l'expiration"""
        # Créer un token actif qui expire bientôt
        token = generate_and_store_token("test_tenant", "prod", "odoo", db_session)
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        token_record.status = 'active'
        token_record.expires_at = datetime.now(timezone.utc) + timedelta(days=20)  # Expire dans 20 jours
        db_session.commit()
        
        # Appeler l'endpoint de renouvellement (seuil: 30 jours)
        response = client.post(
            "/auth/renew",
            headers={"Authorization": f"Bearer {token}"},
            json={"pre_renew_days": 30, "grace_days": 7}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "renewed"
        assert "new_token" in data
        assert data["new_token"] != token
    
    def test_renew_token_not_needed(self, client, db_session):
        """Test POST /auth/renew pour un token qui ne nécessite pas de renouvellement"""
        # Créer un token actif qui expire dans longtemps
        token = generate_and_store_token("test_tenant", "prod", "odoo", db_session)
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = db_session.query(DVIGToken).filter(
            DVIGToken.token_hash == token_hash
        ).first()
        
        token_record.status = 'active'
        token_record.expires_at = datetime.now(timezone.utc) + timedelta(days=100)  # Expire dans 100 jours
        db_session.commit()
        
        # Appeler l'endpoint de renouvellement (seuil: 30 jours)
        response = client.post(
            "/auth/renew",
            headers={"Authorization": f"Bearer {token}"},
            json={"pre_renew_days": 30, "grace_days": 7}
        )
        
        assert response.status_code == 400
        data = response.json()
        # Vérifier que la réponse contient le format d'erreur attendu
        assert "detail" in data or "status" in data
        if "detail" in data:
            # Format FastAPI standard
            assert isinstance(data["detail"], (str, dict))
            if isinstance(data["detail"], dict):
                assert data["detail"].get("status") == "error" or "error" in data["detail"]
        elif "status" in data:
            assert data["status"] == "error"
            assert data["error"]["code"] == "RENEW_NOT_NEEDED"
    
    def test_get_token_status_invalid_token(self, client, db_session):
        """Test GET /auth/token-status avec un token invalide"""
        # Appeler l'endpoint avec un token invalide
        response = client.get(
            "/auth/token-status",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        
        assert response.status_code == 401
    
    def test_renew_token_invalid_token(self, client, db_session):
        """Test POST /auth/renew avec un token invalide"""
        # Appeler l'endpoint avec un token invalide
        response = client.post(
            "/auth/renew",
            headers={"Authorization": "Bearer invalid_token_12345"},
            json={"pre_renew_days": 30, "grace_days": 7}
        )
        
        assert response.status_code == 401

