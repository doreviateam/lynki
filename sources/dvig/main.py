"""
DVIG - Dorevia Vault Integration Gateway
FastAPI Application principale
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from api.ingest import router as ingest_router
from api.auth import router as auth_router

# Configuration
settings = get_settings()

# Application FastAPI
app = FastAPI(
    title="DVIG - Dorevia Vault Integration Gateway",
    description="Gateway d'intégration pour l'ingestion d'événements financiers vers Dorevia Vault",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configurer selon environnement
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(ingest_router, prefix="/api/v1", tags=["ingest"])
app.include_router(auth_router, prefix="/api/v1", tags=["auth"])


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "dvig"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.dvig_host,
        port=settings.dvig_port,
        reload=settings.debug
    )

