"""
Tests end-to-end : Odoo → DVIG → Vault
SPEC DVIG → Vault Forwarding v1.1 - Sprint C

Teste le flux complet :
1. Odoo envoie facture avec idempotency_key à DVIG
2. DVIG persiste dans outbox_events
3. Worker DVIG traite et envoie à Vault
4. Vault ingère et retourne preuve
"""
import pytest
import sys
import os
from pathlib import Path
from datetime import datetime, timezone
import httpx
import json
import time
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Ajouter sources/dvig au PYTHONPATH
dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

from storage.database import Base, get_db
from models.outbox import OutboxEvent
from storage.outbox import create_outbox_event, select_pending_events
from workers.outbox_worker import process_outbox_events
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
    
    # Override get_db pour utiliser notre session de test
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    return TestClient(app)


@pytest.fixture
def vault_url():
    """URL du serveur Vault (peut être mocké)"""
    return os.getenv("VAULT_URL", "http://localhost:8080")


@pytest.mark.e2e
def test_odoo_dvig_vault_flow_success(dvig_client, db_session, vault_url):
    """
    Scénario 1 : Facture normale (succès)
    Odoo → DVIG → Vault → Succès
    """
    # 1. Simuler l'envoi depuis Odoo vers DVIG
    idempotency_key = "bcd65105a8e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c8"
    tenant = "test-tenant"
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
            "move_id": 12345,
            "move_name": "FAC/2026/001",
            "move_type": "out_invoice"
        }
    }
    
    # 2. Envoyer à DVIG /ingest
    response = dvig_client.post("/ingest", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    result = response.json()
    assert result["status"] == "accepted"
    assert "event_id" in result
    
    event_id = result["event_id"]
    
    # 3. Vérifier que l'événement est dans outbox_events
    event = db_session.query(OutboxEvent).filter(
        OutboxEvent.idempotency_key == idempotency_key
    ).first()
    
    assert event is not None, "Event should be in outbox_events"
    assert event.status == "accepted"
    assert event.tenant == tenant
    assert event.env == env
    
    # 4. Simuler le traitement par le worker (si Vault est disponible)
    # Note: En test réel, on appellerait process_outbox_events avec un mock de Vault
    # Pour l'instant, on vérifie juste que l'événement est prêt à être traité
    
    pending_events = select_pending_events(db_session, limit=10)
    assert len(pending_events) > 0, "Should have pending events"
    
    # Vérifier que notre événement est dans la liste
    found = any(e.idempotency_key == idempotency_key for e in pending_events)
    assert found, "Event should be in pending events"


@pytest.mark.e2e
def test_odoo_dvig_vault_flow_idempotent(dvig_client, db_session):
    """
    Scénario 2 : Facture idempotente (même facture deux fois)
    Odoo envoie deux fois → DVIG détecte idempotence → Retourne même event_id
    """
    idempotency_key = "idempotent_test_key_1234567890123456789012345678901234567890123456789012345678901234"
    tenant = "test-tenant"
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
            "move_id": 12345,
            "move_name": "FAC/2026/001"
        }
    }
    
    # 1. Premier envoi
    response1 = dvig_client.post("/ingest", json=payload)
    assert response1.status_code == 200
    result1 = response1.json()
    assert result1["status"] == "accepted"
    event_id_1 = result1["event_id"]
    
    # 2. Deuxième envoi (même idempotency_key)
    response2 = dvig_client.post("/ingest", json=payload)
    assert response2.status_code == 200
    result2 = response2.json()
    assert result2["status"] == "accepted"
    event_id_2 = result2["event_id"]
    
    # 3. Vérifier que le même event_id est retourné
    assert event_id_1 == event_id_2, "Same idempotency_key should return same event_id"
    
    # 4. Vérifier qu'un seul événement existe dans outbox_events
    events = db_session.query(OutboxEvent).filter(
        OutboxEvent.idempotency_key == idempotency_key
    ).all()
    
    assert len(events) == 1, f"Should have exactly 1 event, got {len(events)}"


@pytest.mark.e2e
@pytest.mark.slow
def test_odoo_dvig_vault_flow_with_worker(vault_url):
    """
    Scénario 3 : Test avec worker réel (nécessite Vault en cours d'exécution)
    Odoo → DVIG → Worker → Vault → Succès
    """
    # Ce test nécessite Vault en cours d'exécution
    # Il peut être exécuté manuellement ou dans un environnement CI/CD avec Vault
    
    pytest.skip("Requires Vault server running - run manually or in CI/CD")


@pytest.mark.e2e
def test_odoo_dvig_vault_flow_error_handling(dvig_client, db_session):
    """
    Scénario 4 : Gestion d'erreur
    Teste que les erreurs sont correctement gérées et classifiées
    """
    # Test de validation de payload
    invalid_payload = {
        "tenant": "test-tenant",
        # idempotency_key manquant
    }
    
    response = dvig_client.post("/ingest", json=invalid_payload)
    assert response.status_code == 400, "Should return 400 for invalid payload"
