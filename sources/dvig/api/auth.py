"""
Endpoint GET /api/v1/auth/ping
Validation contractuelle de token (sans logique métier)
"""
from fastapi import APIRouter, Depends
from auth.bearer import get_tenant_from_token, get_env_from_token, get_scope_unit_from_token

router = APIRouter()


@router.get("/auth/ping")
async def auth_ping(
    tenant: str = Depends(get_tenant_from_token),
    env: str = Depends(get_env_from_token),
    scope_unit: str = Depends(get_scope_unit_from_token),
):
    """
    Endpoint contractuel de validation de token
    
    Retourne les informations du token validé sans logique métier.
    Utilisé pour :
    - Validation de token (console, connecteurs)
    - Health check protégé
    - Tests contractuels d'API
    
    Returns:
        200: Token valide avec informations (tenant, env, scope_unit)
        401: Token invalide ou expiré (géré par dependencies)
    
    Raises:
        HTTPException: 401 si token invalide (via dependencies)
    """
    return {
        "status": "ok",
        "tenant": tenant,
        "env": env,
        "scope_unit": scope_unit
    }

