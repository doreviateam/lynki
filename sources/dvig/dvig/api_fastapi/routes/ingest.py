from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from datetime import datetime, timezone
import logging
import uuid
import os
import structlog
from sqlalchemy.orm import Session

from ..auth.auth import get_auth_info, AuthInfo
from ..auth.validation import validate_source_univers
from storage.database import get_db
from storage.outbox import get_by_idempotency_key, create_outbox_event

# CORRECTION I4 : Configurer structlog selon environnement
log_level = os.getenv("DVIG_LOG_LEVEL", "info").upper()

# Configuration structlog
if os.getenv("DVIG_LOG_FORMAT", "json") == "json":
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer()
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, log_level)
        ),
    )
else:
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer()
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, log_level)
        ),
    )

log = structlog.get_logger("dvig.ingest")
router = APIRouter()

class IngestEvent(BaseModel):
    event_type: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)
    timestamp: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    idempotency_key: Optional[str] = Field(None, max_length=64, description="Clé d'idempotence SHA256 transmise par Odoo (SPEC DVIG → Vault Forwarding v1.1)")

def normalize_timestamp(ts_str: Optional[str]) -> str:
    """
    Normalise un timestamp ISO8601 ou génère un nouveau.
    
    Si le timestamp est fourni mais invalide, génère un nouveau timestamp.
    """
    if ts_str:
        try:
            # Tenter de parser le timestamp
            dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
            # S'assurer qu'il a un timezone
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat()
        except (ValueError, AttributeError):
            # Si invalide, générer un nouveau
            log.warning("Invalid timestamp format, generating new one")
            return datetime.now(timezone.utc).isoformat()
    return datetime.now(timezone.utc).isoformat()

@router.post("/ingest", status_code=201)
def ingest(
    evt: IngestEvent,
    auth_info: AuthInfo = Depends(get_auth_info),  # AJOUTÉ : Auth obligatoire
    db: Session = Depends(get_db)  # AJOUTÉ : Session DB pour outbox
):
    """
    Endpoint d'ingestion d'événements (P1 avec auth).
    
    SPEC DVIG → Vault Forwarding v1.1 :
    - Accepte l'événement avec idempotency_key optionnel
    - Vérifie l'idempotence via UNIQUE(tenant, idempotency_key)
    - Persiste dans outbox_events avec status='accepted'
    - Retourne immédiatement ACK
    - Le worker asynchrone transférera vers Vault
    """
    try:
        # 1. Validation source/univers (UNE SEULE IMPLÉMENTATION)
        validate_source_univers(evt.source, auth_info)
        
        # 2. Normalisation du timestamp
        ts = normalize_timestamp(evt.timestamp)
        
        # 3. Génération de l'event_id (UUID) pour traçabilité
        event_id = str(uuid.uuid4())
        
        # 4. Récupération ou génération de l'idempotency_key
        idempotency_key = evt.idempotency_key
        if not idempotency_key:
            # Fallback : générer depuis event_id (compatibilité avec anciens clients)
            idempotency_key = str(uuid.uuid4())
            log.warning(
                "idempotency_key_missing",
                event_id=event_id,
                tenant=auth_info.tenant,
                message="idempotency_key absent du payload, génération depuis event_id"
            )
        
        # 5. Vérification de l'idempotence
        existing_event = get_by_idempotency_key(db, auth_info.tenant, idempotency_key)
        if existing_event:
            # Idempotence détectée : retourner l'event_id existant
            log.info(
                "ingest_event_idempotent",
                event_id=existing_event.event_id,
                idempotency_key=idempotency_key,
                tenant=auth_info.tenant,
                message="Événement déjà accepté (idempotence)"
            )
            return {
                "status": "accepted",
                "event_id": existing_event.event_id,
                "ts": existing_event.created_at.isoformat() if existing_event.created_at else ts
            }
        
        # 6. Construction du payload pour stockage
        payload = {
            "event_type": evt.event_type,
            "source": evt.source,
            "timestamp": ts,
            "data": evt.data,
            "idempotency_key": idempotency_key
        }
        
        # 7. Persistance dans outbox_events
        outbox_event = create_outbox_event(
            db=db,
            idempotency_key=idempotency_key,
            tenant=auth_info.tenant,
            env=auth_info.univers,  # univers = env dans DVIG
            payload=payload,
            event_id=event_id
        )
        
        # 8. Log structuré avec tenant/univers (CORRECTION I4)
        log.info(
            "ingest_event_accepted",
            event_id=event_id,
            idempotency_key=idempotency_key,
            tenant=auth_info.tenant,
            univers=auth_info.univers,
            token_id=auth_info.token_id,
            source=evt.source,
            event_type=evt.event_type,
            timestamp=ts,
            data_keys=list(evt.data.keys()),
            outbox_id=outbox_event.id
        )
        
        # 9. Réponse conforme à la spécification
        return {
            "status": "accepted",
            "event_id": event_id,
            "ts": ts
        }
        
    except HTTPException:
        # Ne pas masquer 403 (TENANT_MISMATCH, etc.) en 500
        raise
    except Exception as e:
        # Erreur lors de la persistance
        log.error(
            "ingest_event_error",
            tenant=auth_info.tenant,
            error=str(e),
            message="Erreur lors de la persistance dans outbox"
        )
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "error": {
                    "code": "OUTBOX_ERROR",
                    "message": f"Erreur lors de la persistance: {str(e)}"
                }
            }
        )
