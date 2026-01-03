"""
Authentification Bearer Token pour DVIG
FastAPI dependencies pour validation des tokens avec support de l'overlap (SPEC v2.0)
et expiration/grace period (SPEC Phase 4)
"""
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from storage.tokens import validate_token_with_overlap
from storage.database import get_db
from sqlalchemy import select
from storage.tokens import DVIGToken
import hashlib
import structlog
import os

security = HTTPBearer()

# Configuration structlog pour les logs
log_level = os.getenv("DVIG_LOG_LEVEL", "info").upper()
if os.getenv("DVIG_LOG_FORMAT", "json") == "json":
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer()
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(__import__("logging"), log_level)
        ),
    )
else:
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer()
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(__import__("logging"), log_level)
        ),
    )

log = structlog.get_logger("dvig.auth.bearer")


async def _validate_token_and_get_record(
    token: str,
    db: Session
) -> DVIGToken:
    """
    Valide le token avec support de l'overlap (SPEC v2.0) et expiration/grace (Phase 4)
    
    Règles de validation (ordre de priorité) :
    1. Si status == 'revoked' → refuser (même si en overlap)
    2. Si expires_at IS NOT NULL et now >= expires_at → refuser (token_expired)
    3. Si status == 'grace' :
       - si grace_until IS NULL → refuser (token incohérent)
       - si now >= grace_until → refuser (grace_ended)
       - sinon → accepter
    4. Sinon (active/legacy) → accepter (avec vérification overlap si nécessaire)
    
    Raises:
        HTTPException: 401 si token invalide, expiré, révoqué ou grace terminée
    """
    from datetime import datetime, timezone
    from sqlalchemy import or_, and_
    
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    now = datetime.now(timezone.utc)
    
    # Rechercher le token (sans filtre initial pour vérifier tous les cas)
    token_record = db.execute(
        select(DVIGToken)
        .where(DVIGToken.token_hash == token_hash)
    ).scalar_one_or_none()
    
    if not token_record:
        log.warning(
            "token_validation_failed",
            reason="token_not_found",
            token_hash_prefix=token_hash[:8] + "..."
        )
        raise HTTPException(
            status_code=401,
            detail={
                "status": "error",
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": "Token invalide ou expiré"
                }
            }
        )
    
    # Phase 4 : Vérification status et expiration
    # 1. Vérifier si token est révoqué (priorité absolue)
    if hasattr(token_record, 'status') and token_record.status == 'revoked':
        log.warning(
            "token_validation_failed",
            token_event="token_revoked",
            tenant=token_record.tenant,
            env=token_record.env,
            scope_unit=getattr(token_record, 'scope_unit', None),
            token_id=token_record.id
        )
        raise HTTPException(
            status_code=401,
            detail={
                "status": "error",
                "error": {
                    "code": "TOKEN_REVOKED",
                    "message": "Token révoqué"
                }
            }
        )
    
    # 2. Vérifier expiration (si expires_at est défini)
    if hasattr(token_record, 'expires_at') and token_record.expires_at is not None:
        # Normaliser expires_at en UTC si nécessaire (SQLite peut stocker sans timezone)
        expires_at = token_record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if now >= expires_at:
            log.warning(
                "token_validation_failed",
                token_event="token_expired",
                tenant=token_record.tenant,
                env=token_record.env,
                scope_unit=getattr(token_record, 'scope_unit', None),
                token_id=token_record.id,
                expires_at=expires_at.isoformat()
            )
            raise HTTPException(
                status_code=401,
                detail={
                    "status": "error",
                    "error": {
                        "code": "TOKEN_EXPIRED",
                        "message": "Token expiré"
                    }
                }
            )
    
    # 3. Vérifier grace period (si status == 'grace')
    if hasattr(token_record, 'status') and token_record.status == 'grace':
        if not hasattr(token_record, 'grace_until') or token_record.grace_until is None:
            log.warning(
                "token_validation_failed",
                token_event="token_grace_incoherent",
                tenant=token_record.tenant,
                env=token_record.env,
                scope_unit=getattr(token_record, 'scope_unit', None),
                token_id=token_record.id,
                reason="grace_until_is_null"
            )
            raise HTTPException(
                status_code=401,
                detail={
                    "status": "error",
                    "error": {
                        "code": "TOKEN_INVALID",
                        "message": "Token en grace period mais grace_until manquant"
                    }
                }
            )
        
        # Normaliser grace_until en UTC si nécessaire (SQLite peut stocker sans timezone)
        grace_until = token_record.grace_until
        if grace_until.tzinfo is None:
            grace_until = grace_until.replace(tzinfo=timezone.utc)
        
        if now >= grace_until:
            log.warning(
                "token_validation_failed",
                token_event="token_grace_ended",
                tenant=token_record.tenant,
                env=token_record.env,
                scope_unit=getattr(token_record, 'scope_unit', None),
                token_id=token_record.id,
                grace_until=grace_until.isoformat()
            )
            raise HTTPException(
                status_code=401,
                detail={
                    "status": "error",
                    "error": {
                        "code": "TOKEN_GRACE_ENDED",
                        "message": "Période de grâce terminée"
                    }
                }
            )
        
        # Token en grace period et valide
        log.info(
            "token_validation_success",
            token_event="token_accepted",
            tenant=token_record.tenant,
            env=token_record.env,
            scope_unit=getattr(token_record, 'scope_unit', None),
            token_id=token_record.id,
            status="grace",
            grace_until=grace_until.isoformat()
        )
        return token_record
    
    # 4. Tokens active/legacy : vérifier overlap (SPEC v2.0) si nécessaire
    # Si revoked_at est défini, vérifier accept_until (overlap)
    if token_record.revoked_at is not None:
        if not hasattr(token_record, 'accept_until') or token_record.accept_until is None:
            # Token révoqué sans overlap → refuser
            log.warning(
                "token_validation_failed",
                token_event="token_revoked_no_overlap",
                tenant=token_record.tenant,
                env=token_record.env,
                scope_unit=getattr(token_record, 'scope_unit', None),
                token_id=token_record.id
            )
            raise HTTPException(
                status_code=401,
                detail={
                    "status": "error",
                    "error": {
                        "code": "TOKEN_REVOKED",
                        "message": "Token révoqué"
                    }
                }
            )
        
        # Normaliser accept_until en UTC si nécessaire (SQLite peut stocker sans timezone)
        accept_until = token_record.accept_until
        if accept_until.tzinfo is None:
            accept_until = accept_until.replace(tzinfo=timezone.utc)
        
        if now >= accept_until:
            # Overlap terminé → refuser
            log.warning(
                "token_validation_failed",
                token_event="token_overlap_ended",
                tenant=token_record.tenant,
                env=token_record.env,
                scope_unit=getattr(token_record, 'scope_unit', None),
                token_id=token_record.id,
                accept_until=accept_until.isoformat()
            )
            raise HTTPException(
                status_code=401,
                detail={
                    "status": "error",
                    "error": {
                        "code": "TOKEN_OVERLAP_ENDED",
                        "message": "Période d'overlap terminée"
                    }
                }
            )
    
    # Token valide (active ou legacy)
    expires_at_iso = None
    if hasattr(token_record, 'expires_at') and token_record.expires_at:
        expires_at_val = token_record.expires_at
        if expires_at_val.tzinfo is None:
            expires_at_val = expires_at_val.replace(tzinfo=timezone.utc)
        expires_at_iso = expires_at_val.isoformat()
    
    log.info(
        "token_validation_success",
        token_event="token_accepted",
        tenant=token_record.tenant,
        env=token_record.env,
        scope_unit=getattr(token_record, 'scope_unit', None),
        token_id=token_record.id,
        status=getattr(token_record, 'status', 'legacy'),
        expires_at=expires_at_iso
    )
    return token_record


async def get_tenant_from_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
) -> str:
    """
    Extrait et valide le token avec support de l'overlap, retourne le tenant
    
    Raises:
        HTTPException: 401 si token invalide ou manquant
    """
    token = credentials.credentials
    
    # Validation depuis BDD avec support de l'overlap (source de vérité)
    token_record = await _validate_token_and_get_record(token, db)
    
    return token_record.tenant


async def get_env_from_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
) -> str:
    """
    Extrait et valide le token avec support de l'overlap, retourne l'environnement
    
    Raises:
        HTTPException: 401 si token invalide ou manquant
    """
    token = credentials.credentials
    
    # Validation depuis BDD avec support de l'overlap (source de vérité)
    token_record = await _validate_token_and_get_record(token, db)
    
    return token_record.env


async def get_scope_unit_from_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
) -> str:
    """
    Extrait et valide le token avec support de l'overlap, retourne le scope_unit
    
    Raises:
        HTTPException: 401 si token invalide ou manquant
    """
    token = credentials.credentials
    
    # Validation depuis BDD avec support de l'overlap (source de vérité)
    token_record = await _validate_token_and_get_record(token, db)
    
    return token_record.scope_unit

