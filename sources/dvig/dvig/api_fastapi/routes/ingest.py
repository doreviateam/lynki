from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from datetime import datetime, timezone
import logging
import uuid
import os
import structlog

from ..auth.auth import get_auth_info, AuthInfo
from ..auth.validation import validate_source_univers

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
    auth_info: AuthInfo = Depends(get_auth_info)  # AJOUTÉ : Auth obligatoire
):
    """
    Endpoint d'ingestion d'événements (P1 avec auth).
    
    Accepte l'événement, le log, et retourne immédiatement.
    Le branchement vers Vault sera fait dans une phase ultérieure.
    """
    # Validation source/univers (UNE SEULE IMPLÉMENTATION)
    validate_source_univers(evt.source, auth_info)
    
    # Normalisation du timestamp
    ts = normalize_timestamp(evt.timestamp)
    
    # Génération de l'event_id (UUID)
    event_id = str(uuid.uuid4())
    
    # Log structuré avec tenant/univers (CORRECTION I4)
    log.info(
        "ingest_event_accepted",
        event_id=event_id,
        tenant=auth_info.tenant,
        univers=auth_info.univers,
        token_id=auth_info.token_id,
        source=evt.source,
        event_type=evt.event_type,
        timestamp=ts,
        data_keys=list(evt.data.keys())
    )
    
    # Réponse conforme à la spécification
    return {
        "status": "accepted",
        "event_id": event_id,
        "ts": ts
    }
