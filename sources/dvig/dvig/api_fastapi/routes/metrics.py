"""
Route /metrics pour exposer les métriques Prometheus
SPEC DVIG → Vault Forwarding v1.1 - Sprint C - US-C.3
"""
from fastapi import APIRouter
from fastapi.responses import Response

router = APIRouter()

try:
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False


@router.get("/metrics")
async def metrics():
    """
    Endpoint Prometheus /metrics
    Expose les métriques DVIG pour monitoring
    """
    if not PROMETHEUS_AVAILABLE:
        return Response(
            content="# Prometheus client not installed\n",
            media_type="text/plain",
            status_code=503
        )
    
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
