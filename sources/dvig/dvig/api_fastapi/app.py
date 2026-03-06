from fastapi import FastAPI
import os
import logging
import asyncio

from dvig.api_fastapi.routes.health import router as health_router
from dvig.api_fastapi.routes.ingest import router as ingest_router
from dvig.api_fastapi.routes.auth import router as auth_router
from dvig.api_fastapi.routes.metrics import router as metrics_router
from dvig.api_fastapi.routes.internal import router as internal_router
from dvig.api_fastapi.auth.token_store import YamlTokenStore
from dvig.api_fastapi.auth.manager import TokenStoreManager
from dvig.api_fastapi.auth.auth import init_token_store
from dvig.api_fastapi.scheduler import create_scheduler, get_scheduler

log = logging.getLogger("dvig.app")

def create_app() -> FastAPI:
    # Configuration docs/openapi (CORRECTION B6 : au constructeur)
    docs_enabled = os.getenv("DVIG_DOCS_ENABLED", "1") == "1"
    openapi_enabled = os.getenv("DVIG_OPENAPI_ENABLED", "1") == "1"
    
    app = FastAPI(
        title="DVIG - Dorevia Vault Integration Gateway",
        version="0.1.2",
        docs_url="/docs" if docs_enabled else None,  # CORRECTION B6
        openapi_url="/openapi.json" if openapi_enabled else None,  # CORRECTION B6
        redoc_url=None,  # Désactivé par défaut
    )
    
    # Configuration auth
    auth_enabled = os.getenv("DVIG_AUTH_ENABLED", "1") == "1"
    
    if auth_enabled:
        # CORRECTION B1 : Fallback tokens_file correct
        tokens_file = os.getenv("DVIG_TOKENS_FILE")
        if not tokens_file:
            # Fallback intelligent
            if os.path.exists("/etc/dvig/tokens.yml"):
                tokens_file = "/etc/dvig/tokens.yml"
            else:
                tokens_file = "./conf/tokens.yml"
        
        reload_interval = int(os.getenv("DVIG_TOKENS_RELOAD_INTERVAL", "60"))
        reload_on_sighup = os.getenv("DVIG_TOKENS_RELOAD_ON_SIGHUP", "1") == "1"
        
        store = YamlTokenStore(tokens_file)
        manager = TokenStoreManager(store, reload_interval, reload_on_sighup)
        
        init_token_store(store)
        
        log.info(f"Auth activée (tokens: {tokens_file})")
    else:
        log.warning("Auth désactivée (DVIG_AUTH_ENABLED=0)")
    
    # Scheduler pour traitement automatique de l'outbox
    # Complément de l'orchestration queue_job pour garantir qu'aucun événement ne reste bloqué
    scheduler = create_scheduler()
    
    @app.on_event("startup")
    async def startup_event():
        """Événement de démarrage de l'application"""
        # Auth manager (si activé)
        if auth_enabled:
            manager.register_sighup_handler()
            manager.start_auto_reload()
            # Vérifier l'état du store après le startup
            if store.is_available():
                log.info(f"Store disponible: {len(store._tokens)} tokens chargés")
            else:
                log.warning("Store non disponible au démarrage, tentative de reload...")
                if store.reload():
                    log.info(f"Reload réussi: {len(store._tokens)} tokens chargés")
                else:
                    log.error("Reload échoué, store toujours indisponible")
        
        # Scheduler (si activé)
        if scheduler:
            # Utiliser la boucle d'événements actuelle (FastAPI)
            loop = asyncio.get_event_loop()
            scheduler._running = True
            scheduler._task = loop.create_task(scheduler._process_loop())
            log.info("Scheduler outbox démarré")
    
    @app.on_event("shutdown")
    async def shutdown_event():
        """Événement d'arrêt de l'application"""
        # Arrêter le scheduler proprement
        if scheduler:
            scheduler.stop()
            await scheduler.wait_stopped()
            log.info("Scheduler outbox arrêté")
    
    # Routes
    app.include_router(health_router, tags=["health"])
    app.include_router(ingest_router, tags=["ingest"])
    app.include_router(auth_router, tags=["auth"])
    app.include_router(metrics_router, tags=["metrics"])
    app.include_router(internal_router, tags=["internal"])
    
    return app

app = create_app()
