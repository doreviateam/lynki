"""
Scheduler pour traitement automatique de l'outbox DVIG
SPEC : Orchestration temps réel DVIG via queue_job Odoo v1.0 + CRON automatique
"""
import asyncio
import logging
import os
from typing import Optional
from workers.outbox_worker import process_outbox_events

log = logging.getLogger("dvig.scheduler")


class OutboxScheduler:
    """
    Scheduler pour traiter automatiquement l'outbox DVIG
    
    Fonctionne en complément de l'orchestration queue_job :
    - queue_job : Déclenchement immédiat lors de action_post() (priorité)
    - scheduler : Traitement périodique pour garantir qu'aucun événement ne reste bloqué
    """
    
    def __init__(self, interval_seconds: int = 30, limit: int = 50):
        """
        Args:
            interval_seconds: Intervalle entre chaque traitement (défaut: 30s)
            limit: Nombre maximum d'événements à traiter par batch (défaut: 50)
        """
        self.interval_seconds = interval_seconds
        self.limit = limit
        self._task: Optional[asyncio.Task] = None
        self._running = False
    
    async def _process_loop(self):
        """Boucle principale de traitement"""
        log.info(
            f"Scheduler démarré (intervalle: {self.interval_seconds}s, limit: {self.limit})"
        )
        
        while self._running:
            try:
                # Traiter l'outbox
                stats = await process_outbox_events(limit=self.limit)
                
                # Log uniquement si des événements ont été traités
                if stats.get("processed", 0) > 0:
                    log.info(
                        f"Scheduler: processed={stats.get('processed', 0)}, "
                        f"succeeded={stats.get('succeeded', 0)}, "
                        f"failed_soft={stats.get('failed_soft', 0)}, "
                        f"failed_hard={stats.get('failed_hard', 0)}"
                    )
                else:
                    log.debug("Scheduler: aucun événement à traiter")
                
            except Exception as e:
                # Ne pas arrêter le scheduler en cas d'erreur
                log.error(f"Erreur dans le scheduler: {str(e)}", exc_info=True)
            
            # Attendre avant la prochaine itération
            await asyncio.sleep(self.interval_seconds)
    
    def start(self):
        """
        Démarre le scheduler
        
        Note: Cette méthode ne doit pas être appelée directement.
        Utiliser plutôt la boucle d'événements FastAPI dans app.py.
        """
        if self._running:
            log.warning("Scheduler déjà démarré")
            return
        
        self._running = True
        # La tâche sera créée dans app.py via asyncio.create_task()
        log.info("Scheduler prêt à démarrer")
    
    def stop(self):
        """Arrête le scheduler"""
        if not self._running:
            return
        
        self._running = False
        if self._task:
            self._task.cancel()
        log.info("Scheduler arrêté")
    
    async def wait_stopped(self):
        """Attend que le scheduler soit complètement arrêté"""
        if self._task:
            try:
                await self._task
            except asyncio.CancelledError:
                pass


# Instance globale (sera initialisée dans app.py)
_scheduler: Optional[OutboxScheduler] = None


def get_scheduler() -> Optional[OutboxScheduler]:
    """Récupère l'instance du scheduler"""
    return _scheduler


def create_scheduler() -> Optional[OutboxScheduler]:
    """
    Crée et configure le scheduler depuis les variables d'environnement
    
    Variables d'environnement:
    - DVIG_SCHEDULER_ENABLED: Activer le scheduler (défaut: 1)
    - DVIG_SCHEDULER_INTERVAL: Intervalle en secondes (défaut: 30)
    - DVIG_SCHEDULER_LIMIT: Nombre max d'événements par batch (défaut: 50)
    
    Returns:
        OutboxScheduler si activé, None sinon
    """
    enabled = os.getenv("DVIG_SCHEDULER_ENABLED", "1") == "1"
    
    if not enabled:
        log.info("Scheduler désactivé (DVIG_SCHEDULER_ENABLED=0)")
        return None
    
    interval = int(os.getenv("DVIG_SCHEDULER_INTERVAL", "30"))
    limit = int(os.getenv("DVIG_SCHEDULER_LIMIT", "50"))
    
    scheduler = OutboxScheduler(interval_seconds=interval, limit=limit)
    log.info(f"Scheduler créé (intervalle: {interval}s, limit: {limit})")
    
    return scheduler
