"""
Endpoint POST /ingest
Ingestion d'événements financiers vers Dorevia Vault
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from models.payload import IngestPayload
from auth.bearer import get_tenant_from_token, get_env_from_token, get_scope_unit_from_token
from storage.database import get_db
from storage.proofs import get_proof_by_event_id, create_proof
from services.hash import canonical_hash, validate_timestamps
from services.proof_id import generate_proof_id
from services.vault import send_to_vault
from config import get_settings
from datetime import datetime, timezone
import re

router = APIRouter()
settings = get_settings()


def validate_source(source, token_tenant: str, token_env: str, token_scope_unit: str):
    """
    Valide la cohérence du champ source avec le token
    
    Raises:
        HTTPException: 403 si incohérence
    """
    errors = []
    
    if source.tenant != token_tenant:
        errors.append(f"source.tenant ({source.tenant}) ne correspond pas au token ({token_tenant})")
    
    if source.env != token_env:
        errors.append(f"source.env ({source.env}) ne correspond pas au token ({token_env})")
    
    if not re.match(r'^[a-z0-9-]{3,50}$', source.unit):
        errors.append(f"source.unit ({source.unit}) invalide (format: ^[a-z0-9-]{{3,50}}$)")
    
    if source.unit != token_scope_unit:
        errors.append(f"source.unit ({source.unit}) ne correspond pas au scope du token ({token_scope_unit})")
    
    if errors:
        raise HTTPException(
            status_code=403,
            detail={
                "status": "error",
                "error": {
                    "code": "INVALID_SOURCE",
                    "message": "; ".join(errors)
                }
            }
        )


def error_response(code: str, message: str, details: str | None = None, status_code: int = 400) -> JSONResponse:
    """Génère une réponse d'erreur standardisée"""
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "error",
            "error": {
                "code": code,
                "message": message,
                "details": details
            }
        }
    )


@router.post("/ingest")
async def ingest_event(
    payload: IngestPayload,
    tenant: str = Depends(get_tenant_from_token),
    env: str = Depends(get_env_from_token),
    scope_unit: str = Depends(get_scope_unit_from_token),
    db: Session = Depends(get_db)
):
    """
    Endpoint d'ingestion d'événements financiers
    
    - Vérifie le token (via dependency)
    - Valide le payload (via Pydantic)
    - Vérifie l'idempotence (event.id)
    - Génère le proof_id
    - Calcule le hash
    - Transmet à Vault
    - Retourne la preuve
    """
    try:
        # 1. Validation du champ source (inclut validation scope_unit)
        validate_source(payload.source, tenant, env, scope_unit)
        
        # 2. Vérification de l'idempotence
        existing_proof = get_proof_by_event_id(db, tenant, env, payload.event.id)
        if existing_proof:
            # Retourner la preuve existante
            return {
                "status": "vaulted",
                "proof_id": existing_proof.proof_id,
                "hash": existing_proof.hash,
                "timestamp": existing_proof.timestamp.isoformat()
            }
        
        # 3. Horodatage DVIG
        dvig_timestamp = datetime.now(timezone.utc)
        
        # 4. Validation des timestamps (tolérance temporelle)
        validate_timestamps(payload.event.occurred_at, dvig_timestamp)
        
        # 5. Génération du proof_id
        proof_id = generate_proof_id(tenant, db)
        
        # 6. Calcul du hash canonique
        payload_dict = payload.model_dump()
        canonical_hash_value = canonical_hash(payload_dict)
        
        # 7. Transmission à Vault
        vault_payload = {
            "proof_id": proof_id,
            "hash": canonical_hash_value,
            "timestamp": dvig_timestamp.isoformat(),
            "source": payload.source.model_dump(),
            "event": payload.event.model_dump(),
            "data": payload.data
        }
        
        try:
            vault_response = await send_to_vault(vault_payload, tenant, env)
        except Exception as vault_error:
            # Erreur lors de l'appel à Vault
            return error_response(
                "VAULT_ERROR",
                f"Erreur lors du vaultage: {str(vault_error)}",
                status_code=500
            )
        
        # 8. Stockage de la preuve en BDD
        proof = create_proof(
            db,
            proof_id=proof_id,
            hash=canonical_hash_value,
            timestamp=dvig_timestamp,
            event_id=payload.event.id,
            tenant=tenant,
            env=env
        )
        
        # 9. Réponse
        return {
            "status": "vaulted",
            "proof_id": proof_id,
            "hash": canonical_hash_value,
            "timestamp": dvig_timestamp.isoformat()
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        # Erreur de validation (timestamps, etc.)
        return error_response("INVALID_PAYLOAD", str(e), status_code=400)
    except Exception as e:
        # Erreur serveur
        return error_response("VAULT_ERROR", f"Erreur lors du vaultage: {str(e)}", status_code=500)

