from fastapi import FastAPI
import os
import logging

from dvig.api_fastapi.routes.health import router as health_router
from dvig.api_fastapi.routes.ingest import router as ingest_router
from dvig.api_fastapi.routes.auth import router as auth_router
from dvig.api_fastapi.auth.token_store import YamlTokenStore
from dvig.api_fastapi.auth.manager import TokenStoreManager
from dvig.api_fastapi.auth.auth import init_token_store

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
        
        # CORRECTION B2 : Enregistrer SIGHUP au startup (thread principal)
        @app.on_event("startup")
        def startup_event():
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
        
        init_token_store(store)
        
        log.info(f"Auth activée (tokens: {tokens_file})")
    else:
        log.warning("Auth désactivée (DVIG_AUTH_ENABLED=0)")
    
    # Routes
    app.include_router(health_router, tags=["health"])
    app.include_router(ingest_router, tags=["ingest"])
    app.include_router(auth_router, tags=["auth"])
    
    return app

app = create_app()
