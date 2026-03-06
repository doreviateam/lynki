"""
Routes internes DVIG - Endpoints sécurisés pour orchestration
SPEC : Orchestration temps réel DVIG via queue_job Odoo v1.0
SPEC : Indicateur Confiance Vaultage Linky v1.0 — GET /internal/vault-health
SPEC : Complétude avant affichage v1.1 — POST /internal/expected-counts (Phase DVIG)
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional
import os
import time
import structlog
import logging
import asyncio

import sys
from pathlib import Path

import httpx

# Ajouter sources/dvig au PYTHONPATH pour les imports
dvig_path = Path(__file__).parent.parent.parent.parent
if str(dvig_path) not in sys.path:
    sys.path.insert(0, str(dvig_path))

from storage.database import get_db
from storage.outbox import get_vault_health_stats, reset_event_for_retry
from sqlalchemy.orm import Session
from config import get_settings

# Importer les métriques
try:
    from metrics import record_internal_trigger, record_internal_trigger_duration
    METRICS_AVAILABLE = True
except ImportError:
    METRICS_AVAILABLE = False
    def record_internal_trigger(*args, **kwargs): pass
    def record_internal_trigger_duration(*args, **kwargs): pass

# Configuration structlog
log_level = os.getenv("DVIG_LOG_LEVEL", "info").upper()
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

log = structlog.get_logger("dvig.internal")
router = APIRouter()
security = HTTPBearer()


class WorkerPayload(BaseModel):
    """Payload pour déclencher le worker"""
    limit: int = Field(default=50, ge=1, le=1000, description="Nombre maximum d'événements à traiter")


class ExpectedCountItem(BaseModel):
    """Un comptage attendu pour une source (Phase DVIG)."""
    source: str = Field(..., description="sales|purchases|paymentsIn|paymentsOut|pos")
    expected_count: int = Field(..., ge=0)


class ExpectedCountsPayload(BaseModel):
    """Payload POST /internal/expected-counts — déclaration comptages attendus par scope."""
    tenant: str = Field(..., min_length=1)
    company_id: str = Field(default="")
    period_from: str = Field(default="2000-01-01")
    period_to: str = Field(default="2030-12-31")
    generated_at: Optional[str] = Field(default=None, description="ISO 8601 — traçabilité, audit, Dernière synchronisation")
    counts: list[ExpectedCountItem] = Field(..., min_length=1)


class OutboxRetryPayload(BaseModel):
    """Payload pour réinitialiser un événement en échec (retry manuel)."""
    tenant: str = Field(..., min_length=1)
    idempotency_key: str = Field(..., min_length=1)


class WorkerResponse(BaseModel):
    """Réponse du worker"""
    processed: int
    succeeded: int
    failed_soft: int
    failed_hard: int
    duration_ms: int
    forwarded_source_ids: Optional[list[str]] = Field(
        default=None,
        description="Liste des source_ids des événements traités avec succès (format: 'model:id')"
    )


def check_internal_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> bool:
    """
    Vérifie le token interne pour l'authentification des endpoints internes.
    
    Le token est lu depuis la variable d'environnement DVIG_INTERNAL_TOKEN.
    
    Args:
        credentials: Credentials HTTP Bearer
        
    Returns:
        True si authentifié
        
    Raises:
        HTTPException: 401 si token invalide
    """
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail={
                "status": "error",
                "error": {
                    "code": "AUTH_MISSING",
                    "message": "Header Authorization manquant"
                }
            }
        )
    
    # Récupérer le token depuis l'environnement
    expected_token = os.getenv("DVIG_INTERNAL_TOKEN")
    if not expected_token:
        log.error("DVIG_INTERNAL_TOKEN non configuré")
        raise HTTPException(
            status_code=503,
            detail={
                "status": "error",
                "error": {
                    "code": "CONFIG_ERROR",
                    "message": "Token interne non configuré"
                }
            }
        )
    
    # Comparaison constant-time pour éviter timing attacks
    provided_token = credentials.credentials
    if not provided_token or not _constant_time_compare(provided_token, expected_token):
        # Recommandation Architecture v1.1.0 : Logger le hash du token (pas le token brut)
        import hashlib
        token_hash = hashlib.sha256(provided_token.encode()).hexdigest()[:6] if provided_token else "N/A"
        log.warning(
            "internal_token_invalid",
            token_hash=token_hash,
            message="Token interne invalide"
        )
        raise HTTPException(
            status_code=401,
            detail={
                "status": "error",
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": "Token interne invalide"
                }
            }
        )
    
    # Logger le hash du token pour audit (recommandation Architecture v1.1.0)
    import hashlib
    token_hash = hashlib.sha256(provided_token.encode()).hexdigest()[:6]
    log.info(
        "internal_trigger_authenticated",
        token_hash=token_hash
    )
    
    return True


@router.get("/internal/vault-health")
def vault_health(
    tenant: str = Query(..., description="Tenant ID"),
    db: Session = Depends(get_db),
    authenticated: bool = Depends(check_internal_token),
):
    """
    Retourne les statistiques de vault health pour Linky (SPEC Indicateur Confiance Vaultage v1.0).
    Appelé par Vault pour afficher l'indicateur dans le header Linky.
    """
    stats = get_vault_health_stats(db, tenant)
    result = {
        "vault_rate": stats["vault_rate"],
        "pending_events": stats["pending_events"],
        "failed_events": stats["failed_events"],
        "last_sync_at": stats["last_sync_at"].isoformat() + "Z" if stats["last_sync_at"] else None,
    }
    return result


def _constant_time_compare(a: str, b: str) -> bool:
    """
    Comparaison constant-time pour éviter les timing attacks.
    
    Args:
        a: Première chaîne
        b: Deuxième chaîne
        
    Returns:
        True si les chaînes sont identiques
    """
    if len(a) != len(b):
        return False
    
    result = 0
    for x, y in zip(a.encode(), b.encode()):
        result |= x ^ y
    
    return result == 0


@router.post("/internal/expected-counts")
async def expected_counts_forward(
    payload: ExpectedCountsPayload,
    authenticated: bool = Depends(check_internal_token),
):
    """
    Transfère les comptages attendus vers le Vault (Phase DVIG — complétude probante).
    Appelé par Odoo (CRON ou connecteur) pour déclarer les comptages par scope.
    Forward vers POST /api/v1/expected-counts sur le Vault.
    """
    settings = get_settings()
    vault_url = f"http://{settings.vault_host}:{settings.vault_port}/api/v1/expected-counts"
    body = {
        "tenant": payload.tenant,
        "company_id": payload.company_id,
        "period_from": payload.period_from,
        "period_to": payload.period_to,
        "counts": [{"source": c.source, "expected_count": c.expected_count} for c in payload.counts],
    }
    if payload.generated_at:
        body["generated_at"] = payload.generated_at
    required_sources = {"sales", "purchases", "paymentsIn", "paymentsOut", "pos"}
    if len(payload.counts) != len(required_sources):
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "error": {
                    "code": "INVALID_COUNTS",
                    "message": "counts doit contenir exactement 5 sources",
                    "got": len(payload.counts),
                    "required": 5,
                    "sources": list(required_sources),
                },
            },
        )
    seen = set()
    for c in payload.counts:
        if c.source not in required_sources:
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "error",
                    "error": {
                        "code": "INVALID_SOURCE",
                        "message": f"Source invalide: {c.source}",
                        "valid": list(required_sources),
                    },
                },
            )
        if c.source in seen:
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "error",
                    "error": {
                        "code": "DUPLICATE_SOURCE",
                        "message": f"Source en double: {c.source}",
                    },
                },
            )
        seen.add(c.source)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(vault_url, json=body)
        if resp.status_code in (200, 204):
            return {"status": "ok", "message": "Expected counts envoyés au Vault"}
        log.error(
            "expected_counts_vault_error",
            status_code=resp.status_code,
            body=resp.text[:500],
        )
        raise HTTPException(
            status_code=502,
            detail={
                "status": "error",
                "error": {
                    "code": "VAULT_ERROR",
                    "message": f"Vault a répondu {resp.status_code}",
                },
            },
        )
    except httpx.RequestError as e:
        log.error("expected_counts_forward_error", error=str(e))
        raise HTTPException(
            status_code=503,
            detail={
                "status": "error",
                "error": {
                    "code": "VAULT_UNREACHABLE",
                    "message": f"Vault injoignable: {e!s}",
                },
            },
        )


@router.post("/internal/outbox/retry")
def retry_outbox_event(
    payload: OutboxRetryPayload,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(check_internal_token),
):
    """
    Réinitialise un événement failed_hard/failed_soft pour retraitement.
    Appelé par Odoo quand l'utilisateur clique sur « Rafraîchir la preuve » et que
    la preuve n'existe pas (ex: route Vault manquante au moment du premier forward).
    """
    event = reset_event_for_retry(db, payload.tenant, payload.idempotency_key)
    if not event:
        raise HTTPException(
            status_code=404,
            detail={"status": "error", "error": {"code": "EVENT_NOT_FOUND", "message": "Événement non trouvé"}},
        )
    return {
        "status": "ok",
        "event_id": event.event_id,
        "idempotency_key": payload.idempotency_key,
        "message": "Événement réinitialisé pour retraitement",
    }


@router.post("/internal/outbox/process", response_model=WorkerResponse)
async def trigger_worker(
    payload: WorkerPayload,
    authenticated: bool = Depends(check_internal_token)
):
    """
    Déclenche le traitement de l'outbox DVIG.
    
    Endpoint interne sécurisé pour l'orchestration depuis Odoo via queue_job.
    
    Args:
        payload: Paramètres du worker (limit)
        authenticated: Résultat de l'authentification
        
    Returns:
        Statistiques de traitement
    """
    start_time = time.time()
    
    try:
        # Logger avec hash du token pour audit (recommandation Architecture v1.1.0)
        import hashlib
        token_hash = "N/A"
        if authenticated:
            # Le token a déjà été validé, on peut logger son hash
            # Note: On ne peut pas récupérer le token depuis authenticated (c'est un bool)
            # On loggera le hash dans check_internal_token
            pass
        
        log.info(
            "internal_trigger_start",
            limit=payload.limit
        )
        
        # Enregistrer le trigger (métrique)
        if METRICS_AVAILABLE:
            record_internal_trigger()
        
        # Appeler process_outbox_events (async) — import différé pour éviter erreur si workers manquant
        from workers.outbox_worker import process_outbox_events
        stats = await process_outbox_events(limit=payload.limit)
        
        # Calculer la durée
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Enregistrer la durée (métrique)
        if METRICS_AVAILABLE:
            record_internal_trigger_duration(duration_ms)
        
        # Récupérer forwarded_source_ids si disponible (SPEC v1.1.0)
        forwarded_source_ids = stats.get("forwarded_source_ids")
        
        log.info(
            "internal_trigger_complete",
            limit=payload.limit,
            processed=stats.get("processed", 0),
            succeeded=stats.get("succeeded", 0),
            failed_soft=stats.get("failed_soft", 0),
            failed_hard=stats.get("failed_hard", 0),
            duration_ms=duration_ms,
            forwarded_count=len(forwarded_source_ids) if forwarded_source_ids else 0
        )
        
        return WorkerResponse(
            processed=stats.get("processed", 0),
            succeeded=stats.get("succeeded", 0),
            failed_soft=stats.get("failed_soft", 0),
            failed_hard=stats.get("failed_hard", 0),
            duration_ms=duration_ms,
            forwarded_source_ids=forwarded_source_ids
        )
        
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        
        log.error(
            "internal_trigger_error",
            limit=payload.limit,
            error=str(e),
            duration_ms=duration_ms
        )
        
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "error": {
                    "code": "WORKER_ERROR",
                    "message": f"Erreur lors du traitement: {str(e)}"
                }
            }
        )
