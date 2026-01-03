"""
Routes d'authentification DVIG - Phase 4
Endpoints pour le statut et le renouvellement des tokens
"""
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
import os
import structlog
import logging

import sys
from pathlib import Path

# Ajouter sources/dvig au PYTHONPATH pour les imports
dvig_path = Path(__file__).parent.parent.parent.parent
if str(dvig_path) not in sys.path:
    sys.path.insert(0, str(dvig_path))

from auth.bearer import _validate_token_and_get_record
from storage.database import get_db
from storage.tokens import DVIGToken, generate_and_store_token
from sqlalchemy import select
import hashlib

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

log = structlog.get_logger("dvig.auth.routes")
router = APIRouter()
security = HTTPBearer()


class TokenStatusResponse(BaseModel):
    """Réponse pour GET /auth/token-status"""
    status: str = Field(..., description="Statut du token (active, grace, legacy, revoked)")
    tenant: str = Field(..., description="Tenant du token")
    env: str = Field(..., description="Environnement du token")
    scope_unit: Optional[str] = Field(None, description="Unit du token")
    expires_at: Optional[str] = Field(None, description="Date d'expiration (ISO8601)")
    grace_until: Optional[str] = Field(None, description="Fin de la période de grâce (ISO8601)")
    created_at: str = Field(..., description="Date de création (ISO8601)")
    days_until_expiration: Optional[int] = Field(None, description="Jours jusqu'à expiration")
    days_until_grace_end: Optional[int] = Field(None, description="Jours jusqu'à fin de grace")


class RenewTokenRequest(BaseModel):
    """Requête pour POST /auth/renew"""
    pre_renew_days: Optional[int] = Field(30, ge=1, le=90, description="Jours avant expiration pour pré-renouvellement")
    grace_days: Optional[int] = Field(7, ge=1, le=30, description="Jours de période de grâce")


class RenewTokenResponse(BaseModel):
    """Réponse pour POST /auth/renew"""
    status: str = Field(..., description="Statut du renouvellement")
    new_token: str = Field(..., description="Nouveau token (à stocker)")
    old_token_id: Optional[int] = Field(None, description="ID du token précédent")
    new_token_id: int = Field(..., description="ID du nouveau token")
    expires_at: str = Field(..., description="Date d'expiration du nouveau token (ISO8601)")
    grace_until: Optional[str] = Field(None, description="Fin de la période de grâce de l'ancien token (ISO8601)")


@router.get("/auth/token-status", response_model=TokenStatusResponse)
async def get_token_status(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    """
    Endpoint GET /auth/token-status
    
    Retourne le statut détaillé du token authentifié :
    - status (active, grace, legacy, revoked)
    - expires_at, grace_until
    - jours jusqu'à expiration/fin de grace
    
    Returns:
        200: Statut du token
        401: Token invalide ou expiré
    """
    token = credentials.credentials
    
    # Valider le token et récupérer le record
    token_record = await _validate_token_and_get_record(token, db)
    
    # Calculer jours jusqu'à expiration
    days_until_expiration = None
    if hasattr(token_record, 'expires_at') and token_record.expires_at:
        expires_at = token_record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        if expires_at > now:
            delta = expires_at - now
            days_until_expiration = delta.days
    
    # Calculer jours jusqu'à fin de grace
    days_until_grace_end = None
    if hasattr(token_record, 'grace_until') and token_record.grace_until:
        grace_until = token_record.grace_until
        if grace_until.tzinfo is None:
            grace_until = grace_until.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        if grace_until > now:
            delta = grace_until - now
            days_until_grace_end = delta.days
    
    # Normaliser les dates pour la réponse
    expires_at_iso = None
    if hasattr(token_record, 'expires_at') and token_record.expires_at:
        expires_at_val = token_record.expires_at
        if expires_at_val.tzinfo is None:
            expires_at_val = expires_at_val.replace(tzinfo=timezone.utc)
        expires_at_iso = expires_at_val.isoformat()
    
    grace_until_iso = None
    if hasattr(token_record, 'grace_until') and token_record.grace_until:
        grace_until_val = token_record.grace_until
        if grace_until_val.tzinfo is None:
            grace_until_val = grace_until_val.replace(tzinfo=timezone.utc)
        grace_until_iso = grace_until_val.isoformat()
    
    created_at_iso = token_record.created_at.isoformat()
    if token_record.created_at.tzinfo is None:
        created_at_iso = token_record.created_at.replace(tzinfo=timezone.utc).isoformat()
    
    status = getattr(token_record, 'status', 'legacy')
    if status is None:
        status = 'legacy'
    
    log.info(
        "token_status_retrieved",
        tenant=token_record.tenant,
        env=token_record.env,
        scope_unit=getattr(token_record, 'scope_unit', None),
        token_id=token_record.id,
        status=status
    )
    
    return TokenStatusResponse(
        status=status,
        tenant=token_record.tenant,
        env=token_record.env,
        scope_unit=getattr(token_record, 'scope_unit', None),
        expires_at=expires_at_iso,
        grace_until=grace_until_iso,
        created_at=created_at_iso,
        days_until_expiration=days_until_expiration,
        days_until_grace_end=days_until_grace_end
    )


@router.post("/auth/renew", response_model=RenewTokenResponse)
async def renew_token(
    request: RenewTokenRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    """
    Endpoint POST /auth/renew
    
    Renouvelle le token authentifié avec :
    - Pre-renew period (renouvellement avant expiration)
    - Grace period (période de grâce pour l'ancien token)
    
    Algorithme (inspiré de Caddy) :
    1. Vérifier que le token actuel est valide
    2. Si expires_at IS NULL (legacy) → créer nouveau token avec expiration
    3. Si expires_at - now <= pre_renew_days → créer nouveau token
    4. Marquer ancien token en grace period (grace_until = now + grace_days)
    5. Retourner nouveau token
    
    Returns:
        200: Token renouvelé avec succès
        401: Token invalide ou expiré
        400: Token ne nécessite pas de renouvellement
    """
    token = credentials.credentials
    
    # Valider le token et récupérer le record
    token_record = await _validate_token_and_get_record(token, db)
    
    # Vérifier si le token peut être renouvelé
    now = datetime.now(timezone.utc)
    pre_renew_days = request.pre_renew_days or 30
    grace_days = request.grace_days or 7
    
    # Si token legacy (sans expiration), créer nouveau token avec expiration
    expires_at = getattr(token_record, 'expires_at', None)
    if expires_at is None:
        # Token legacy → créer nouveau token avec expiration (365 jours par défaut)
        new_expires_at = now + timedelta(days=365)
        
        # Générer nouveau token
        new_token = generate_and_store_token(
            token_record.tenant,
            token_record.env,
            getattr(token_record, 'scope_unit', 'odoo'),
            db
        )
        
        # Mettre à jour le nouveau token avec expiration
        new_token_hash = hashlib.sha256(new_token.encode()).hexdigest()
        new_token_record = db.execute(
            select(DVIGToken)
            .where(DVIGToken.token_hash == new_token_hash)
        ).scalar_one_or_none()
        
        if new_token_record:
            new_token_record.expires_at = new_expires_at
            new_token_record.status = 'active'
            new_token_record.replaces_token_id = token_record.id
            
            # Marquer ancien token en grace period
            token_record.status = 'grace'
            token_record.grace_until = now + timedelta(days=grace_days)
            
            db.commit()
            db.refresh(new_token_record)
            
            log.info(
                "token_renewed",
                tenant=token_record.tenant,
                env=token_record.env,
                scope_unit=getattr(token_record, 'scope_unit', None),
                old_token_id=token_record.id,
                new_token_id=new_token_record.id,
                reason="legacy_token"
            )
            
            return RenewTokenResponse(
                status="renewed",
                new_token=new_token,
                old_token_id=token_record.id,
                new_token_id=new_token_record.id,
                expires_at=new_expires_at.isoformat(),
                grace_until=token_record.grace_until.isoformat() if token_record.grace_until else None
            )
    
    # Si token avec expiration, vérifier si renouvellement nécessaire
    expires_at_val = expires_at
    if expires_at_val.tzinfo is None:
        expires_at_val = expires_at_val.replace(tzinfo=timezone.utc)
    
    days_until_expiration = (expires_at_val - now).days
    
    if days_until_expiration > pre_renew_days:
        # Token ne nécessite pas encore de renouvellement
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "error": {
                    "code": "RENEW_NOT_NEEDED",
                    "message": f"Token ne nécessite pas de renouvellement (expire dans {days_until_expiration} jours, seuil: {pre_renew_days} jours)"
                }
            }
        )
    
    # Renouveler le token
    # Générer nouveau token
    new_token = generate_and_store_token(
        token_record.tenant,
        token_record.env,
        getattr(token_record, 'scope_unit', 'odoo'),
        db
    )
    
    # Mettre à jour le nouveau token avec expiration
    new_token_hash = hashlib.sha256(new_token.encode()).hexdigest()
    new_token_record = db.execute(
        select(DVIGToken)
        .where(DVIGToken.token_hash == new_token_hash)
    ).scalar_one_or_none()
    
    if not new_token_record:
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "error": {
                    "code": "RENEW_FAILED",
                    "message": "Échec de la création du nouveau token"
                }
            }
        )
    
    # Calculer nouvelle expiration (365 jours à partir de maintenant)
    new_expires_at = now + timedelta(days=365)
    new_token_record.expires_at = new_expires_at
    new_token_record.status = 'active'
    new_token_record.replaces_token_id = token_record.id
    
    # Marquer ancien token en grace period
    token_record.status = 'grace'
    token_record.grace_until = now + timedelta(days=grace_days)
    
    db.commit()
    db.refresh(new_token_record)
    
    log.info(
        "token_renewed",
        tenant=token_record.tenant,
        env=token_record.env,
        scope_unit=getattr(token_record, 'scope_unit', None),
        old_token_id=token_record.id,
        new_token_id=new_token_record.id,
        reason="pre_renew",
        days_until_expiration=days_until_expiration
    )
    
    return RenewTokenResponse(
        status="renewed",
        new_token=new_token,
        old_token_id=token_record.id,
        new_token_id=new_token_record.id,
        expires_at=new_expires_at.isoformat(),
        grace_until=token_record.grace_until.isoformat() if token_record.grace_until else None
    )

