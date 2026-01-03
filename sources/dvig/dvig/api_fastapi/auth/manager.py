"""
Token Store Manager - Gestion du reload automatique
"""
import signal
import threading
import time
import logging
from typing import Optional
from .token_store import TokenStore

log = logging.getLogger("dvig.auth.manager")


class TokenStoreManager:
    """Gère le reload automatique du TokenStore"""
    
    def __init__(self, store: TokenStore, reload_interval: int = 60, reload_on_sighup: bool = True):
        self.store = store
        self.reload_interval = reload_interval
        self.reload_on_sighup = reload_on_sighup
        self._reload_thread: Optional[threading.Thread] = None
        self._running = False
        self._sighup_handler_registered = False
    
    def register_sighup_handler(self):
        """
        Enregistre le handler SIGHUP (doit être appelé depuis le thread principal).
        
        À appeler dans l'événement FastAPI startup.
        """
        if not self.reload_on_sighup:
            return
        
        try:
            signal.signal(signal.SIGHUP, self._handle_sighup)
            self._sighup_handler_registered = True
            log.info("Handler SIGHUP enregistré")
        except (ValueError, OSError) as e:
            # SIGHUP non disponible (ex: Windows)
            log.warning(f"SIGHUP non disponible: {e}")
    
    def _handle_sighup(self, signum, frame):
        """Reload immédiat sur SIGHUP"""
        log.info("SIGHUP reçu, reload immédiat")
        self._reload()
    
    def _reload(self) -> bool:
        """Reload atomique"""
        return self.store.reload()
    
    def start_auto_reload(self):
        """Démarre le reload périodique"""
        if self.reload_interval > 0:
            self._running = True
            self._reload_thread = threading.Thread(
                target=self._reload_loop,
                daemon=True,
                name="TokenStoreReload"
            )
            self._reload_thread.start()
            log.info(f"Auto-reload démarré (intervalle: {self.reload_interval}s)")
    
    def _reload_loop(self):
        """Boucle de reload périodique"""
        while self._running:
            time.sleep(self.reload_interval)
            if self._running:
                self._reload()
    
    def stop_auto_reload(self):
        """Arrête le reload périodique"""
        self._running = False
        if self._reload_thread:
            self._reload_thread.join(timeout=5)
            log.info("Auto-reload arrêté")

