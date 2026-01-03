from fastapi import APIRouter, Depends
from datetime import datetime, timezone
import os
from ..auth.auth import get_auth_info, AuthInfo

router = APIRouter()

# Variable d'environnement pour protéger /health
HEALTH_PROTECTED = os.getenv("DVIG_HEALTH_PROTECTED", "0") == "1"

@router.get("/health")
def health(
    auth_info: AuthInfo = Depends(get_auth_info) if HEALTH_PROTECTED else None
):
    """
    Health check endpoint.
    
    Public par défaut, protégé si DVIG_HEALTH_PROTECTED=1
    """
    return {
        "service": "dvig",
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "0.1.2",
    }
