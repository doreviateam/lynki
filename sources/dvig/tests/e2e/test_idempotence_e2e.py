"""
Test idempotence bout en bout : Odoo → DVIG → Vault
SPEC DVIG → Vault Forwarding v1.1 - Sprint C - US-C.2

Valide que l'idempotence fonctionne bout en bout :
1. Odoo envoie facture avec idempotency_key
2. DVIG détecte idempotence (même idempotency_key)
3. Vault détecte idempotence (même idempotency_key)
4. Document ingéré une seule fois
"""
import pytest
import sys
import os
from pathlib import Path
from datetime import datetime, timezone
import httpx
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Ajouter sources/dvig au PYTHONPATH
dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

from storage.database import Base, get_db
from models.outbox import OutboxEvent
from dvig.api_fastapi.app import create_app
from fastapi.testclient import TestClient


@pytest.fixture
def db_session():
    """Créer une session de base de données en mémoire pour les tests"""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    
    # Appliquer la migration outbox_events
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS outbox_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT NOT NULL UNIQUE,
                idempotency_key TEXT NOT NULL,
                tenant TEXT NOT NULL,
                env TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'accepted',
                attempt_count INTEGER NOT NULL DEFAULT 0,
                last_try_at TIMESTAMP NULL,
                next_retry_at TIMESTAMP NULL,
                last_error TEXT NULL,
                vault_receipt_id TEXT NULL,
                payload TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_outbox_tenant_idempotency 
            ON outbox_events(tenant, idempotency_key)
        """))
        conn.commit()
    
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def dvig_client(db_session):
    """Créer un client de test pour DVIG"""
    app = create_app()
    
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    return TestClient(app)


@pytest.mark.e2e
def test_idempotence_dvig_level(dvig_client, db_session):
    """
    Test idempotence au niveau DVIG
    Même idempotency_key envoyé deux fois → Même event_id retourné
    """
    idempotency_key = "test_idempotence_key_sha256_64_chars_1234567890123456789012345678901234567890123456789012345678901234"
    tenant = "test-tenant-idempotence"
    env = "lab"
    
    payload = {
        "idempotency_key": idempotency_key,
        "tenant": tenant,
        "env": env,
        "source": {
            "unit": "odoo",
            "env": env,
            "tenant": tenant,
            "component": "dorevia_vault_connector",
            "version": "1.0.0"
        },
        "event_type": "invoice.posted",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "payload": {
            "move_id": 99999,
            "move_name": "FAC/2026/IDEMPOTENCE"
        }
    }
    
    # Premier envoi
    response1 = dvig_client.post("/ingest", json=payload)
    assert response1.status_code == 200
    result1 = response1.json()
    assert result1["status"] == "accepted"
    event_id_1 = result1["event_id"]
    
    # Deuxième envoi (identique)
    response2 = dvig_client.post("/ingest", json=payload)
    assert response2.status_code == 200
    result2 = response2.json()
    assert result2["status"] == "accepted"
    event_id_2 = result2["event_id"]
    
    # Vérifier idempotence
    assert event_id_1 == event_id_2, "Same idempotency_key should return same event_id"
    
    # Vérifier qu'un seul événement existe dans outbox_events
    events = db_session.query(OutboxEvent).filter(
        OutboxEvent.idempotency_key == idempotency_key,
        OutboxEvent.tenant == tenant
    ).all()
    
    assert len(events) == 1, f"Should have exactly 1 event in outbox, got {len(events)}"
    
    # Vérifier que l'événement a le bon idempotency_key
    event = events[0]
    assert event.idempotency_key == idempotency_key
    assert event.tenant == tenant
    assert event.status == "accepted"


@pytest.mark.e2e
@pytest.mark.slow
def test_idempotence_vault_level(vault_url):
    """
    Test idempotence au niveau Vault
    Nécessite Vault en cours d'exécution
    
    Scénario :
    1. Envoyer événement à Vault /api/v1/events avec idempotency_key
    2. Envoyer le même événement une deuxième fois
    3. Vérifier que Vault retourne status "idempotent" et le même vault_id
    """
    # Ce test nécessite Vault en cours d'exécution
    # Il peut être exécuté manuellement ou dans un environnement CI/CD
    
    if not os.getenv("VAULT_URL"):
        pytest.skip("VAULT_URL not set - skipping Vault-level idempotence test")
    
    idempotency_key = "test_vault_idempotence_key_sha256_64_chars_1234567890123456789012345678901234567890123456789012345678901234"
    tenant = "test-tenant-vault-idempotence"
    
    payload = {
        "tenant": tenant,
        "event_id": "test-event-id-1",
        "idempotency_key": idempotency_key,
        "source": {
            "unit": "odoo",
            "env": "lab",
            "tenant": tenant,
            "component": "dorevia_vault_connector",
            "version": "1.0.0"
        },
        "event_type": "invoice.posted",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "payload": {
            "move_id": 88888,
            "move_name": "FAC/2026/VAULT-IDEMPOTENCE"
        }
    }
    
    # Premier envoi à Vault
    async with httpx.AsyncClient() as client:
        response1 = await client.post(
            f"{vault_url}/api/v1/events",
            json=payload,
            timeout=10.0
        )
        assert response1.status_code in [200, 201], f"Expected 200/201, got {response1.status_code}: {response1.text}"
        result1 = response1.json()
        assert result1["status"] in ["vaulted", "idempotent"]
        vault_id_1 = result1["vault_id"]
        
        # Deuxième envoi (identique)
        payload["event_id"] = "test-event-id-2"  # Changer event_id mais garder idempotency_key
        response2 = await client.post(
            f"{vault_url}/api/v1/events",
            json=payload,
            timeout=10.0
        )
        assert response2.status_code == 200, f"Expected 200, got {response2.status_code}: {response2.text}"
        result2 = response2.json()
        assert result2["status"] == "idempotent", "Second request should be idempotent"
        assert result2["vault_id"] == vault_id_1, "Same idempotency_key should return same vault_id"
        assert "message" in result2, "Idempotent response should include message"


@pytest.mark.e2e
def test_idempotence_cross_tenant(dvig_client, db_session):
    """
    Test que l'idempotence est isolée par tenant
    Même idempotency_key mais tenant différent → Deux événements distincts
    """
    idempotency_key = "shared_idempotency_key_sha256_64_chars_1234567890123456789012345678901234567890123456789012345678901234"
    
    payload_tenant1 = {
        "idempotency_key": idempotency_key,
        "tenant": "tenant-1",
        "env": "lab",
        "source": {
            "unit": "odoo",
            "env": "lab",
            "tenant": "tenant-1",
            "component": "dorevia_vault_connector",
            "version": "1.0.0"
        },
        "event_type": "invoice.posted",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "payload": {"move_id": 11111}
    }
    
    payload_tenant2 = {
        "idempotency_key": idempotency_key,  # Même idempotency_key
        "tenant": "tenant-2",  # Mais tenant différent
        "env": "lab",
        "source": {
            "unit": "odoo",
            "env": "lab",
            "tenant": "tenant-2",
            "component": "dorevia_vault_connector",
            "version": "1.0.0"
        },
        "event_type": "invoice.posted",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "payload": {"move_id": 22222}
    }
    
    # Envoyer avec tenant-1
    response1 = dvig_client.post("/ingest", json=payload_tenant1)
    assert response1.status_code == 200
    event_id_1 = response1.json()["event_id"]
    
    # Envoyer avec tenant-2 (même idempotency_key)
    response2 = dvig_client.post("/ingest", json=payload_tenant2)
    assert response2.status_code == 200
    event_id_2 = response2.json()["event_id"]
    
    # Vérifier que les event_id sont différents (isolation par tenant)
    assert event_id_1 != event_id_2, "Different tenants should have different event_ids even with same idempotency_key"
    
    # Vérifier qu'il y a deux événements dans outbox_events
    events = db_session.query(OutboxEvent).filter(
        OutboxEvent.idempotency_key == idempotency_key
    ).all()
    
    assert len(events) == 2, f"Should have 2 events (one per tenant), got {len(events)}"
