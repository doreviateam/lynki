"""
Métriques Prometheus pour DVIG
SPEC DVIG → Vault Forwarding v1.1 - Sprint C - US-C.3

Métriques exposées :
- dvig_outbox_backlog{tenant,env} : Nombre d'événements en attente dans outbox
- dvig_forward_success_total{tenant,env} : Nombre de forwardings réussis
- dvig_forward_failed_soft_total{tenant,env} : Nombre d'erreurs soft (retriable)
- dvig_forward_failed_hard_total{tenant,env} : Nombre d'erreurs hard (non-retriable)
- dvig_forward_duration_seconds{tenant,env} : Durée des forwardings (histogram)
- dvig_erp_to_vault_duration_seconds{tenant,env} : Durée bout en bout ERP->Vault (histogram)
- dvig_dead_letters_total{tenant,env} : Nombre d'événements en dead letter queue
"""
try:
    from prometheus_client import Counter, Histogram, Gauge
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    # Créer des stubs pour éviter les erreurs si prometheus_client n'est pas installé
    class Counter:
        def __init__(self, *args, **kwargs):
            pass
        def labels(self, *args, **kwargs):
            return self
        def inc(self, *args, **kwargs):
            pass
    class Histogram:
        def __init__(self, *args, **kwargs):
            pass
        def labels(self, *args, **kwargs):
            return self
        def observe(self, *args, **kwargs):
            pass
    class Gauge:
        def __init__(self, *args, **kwargs):
            pass
        def labels(self, *args, **kwargs):
            return self
        def set(self, *args, **kwargs):
            pass


# Métriques DVIG Outbox
if PROMETHEUS_AVAILABLE:
    # Backlog : Nombre d'événements en attente dans outbox
    outbox_backlog = Gauge(
        'dvig_outbox_backlog',
        'Number of pending events in outbox',
        ['tenant', 'env']
    )
    
    # Succès : Nombre de forwardings réussis vers Vault
    forward_success_total = Counter(
        'dvig_forward_success_total',
        'Total number of successful forwardings to Vault',
        ['tenant', 'env']
    )
    
    # Erreurs soft : Erreurs retriables (timeout, 502, 503, 429, etc.)
    forward_failed_soft_total = Counter(
        'dvig_forward_failed_soft_total',
        'Total number of soft failures (retriable errors)',
        ['tenant', 'env', 'error_type']
    )
    
    # Erreurs hard : Erreurs non-retriables (400, 401, 403, 404, 422, etc.)
    forward_failed_hard_total = Counter(
        'dvig_forward_failed_hard_total',
        'Total number of hard failures (non-retriable errors)',
        ['tenant', 'env', 'error_type']
    )
    
    # Durée : Histogramme des durées de forwarding
    forward_duration_seconds = Histogram(
        'dvig_forward_duration_seconds',
        'Duration of forwarding operations to Vault',
        ['tenant', 'env'],
        buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
    )
    # Durée bout en bout : ERP captured -> Vault sealed
    erp_to_vault_duration_seconds = Histogram(
        'dvig_erp_to_vault_duration_seconds',
        'End-to-end latency from ERP event capture to Vault sealing',
        ['tenant', 'env'],
        buckets=[0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0, 60.0]
    )
    
    # Dead letters : Événements en dead letter queue
    dead_letters_total = Counter(
        'dvig_dead_letters_total',
        'Total number of events moved to dead letter queue',
        ['tenant', 'env']
    )
    
    # Trigger interne : Nombre de déclenchements depuis Odoo
    internal_trigger_total = Counter(
        'dvig_internal_trigger_total',
        'Total number of internal worker triggers from Odoo',
        []
    )
    
    # Durée trigger interne : Histogramme des durées de traitement
    internal_trigger_duration_ms = Histogram(
        'dvig_internal_trigger_duration_ms',
        'Duration of internal worker trigger operations (milliseconds)',
        [],
        buckets=[10, 50, 100, 500, 1000, 2000, 5000, 10000]
    )
else:
    # Stubs si prometheus_client n'est pas disponible
    outbox_backlog = Counter()
    forward_success_total = Counter()
    forward_failed_soft_total = Counter()
    forward_failed_hard_total = Counter()
    forward_duration_seconds = Histogram()
    erp_to_vault_duration_seconds = Histogram()
    dead_letters_total = Counter()
    internal_trigger_total = Counter()
    internal_trigger_duration_ms = Histogram()


def record_forward_success(tenant: str, env: str):
    """Enregistrer un forwarding réussi"""
    if PROMETHEUS_AVAILABLE:
        forward_success_total.labels(tenant=tenant, env=env).inc()


def record_forward_failed_soft(tenant: str, env: str, error_type: str):
    """Enregistrer une erreur soft (retriable)"""
    if PROMETHEUS_AVAILABLE:
        forward_failed_soft_total.labels(tenant=tenant, env=env, error_type=error_type).inc()


def record_forward_failed_hard(tenant: str, env: str, error_type: str):
    """Enregistrer une erreur hard (non-retriable)"""
    if PROMETHEUS_AVAILABLE:
        forward_failed_hard_total.labels(tenant=tenant, env=env, error_type=error_type).inc()


def record_forward_duration(tenant: str, env: str, duration_seconds: float):
    """Enregistrer la durée d'un forwarding"""
    if PROMETHEUS_AVAILABLE:
        forward_duration_seconds.labels(tenant=tenant, env=env).observe(duration_seconds)


def record_erp_to_vault_duration(tenant: str, env: str, duration_seconds: float):
    """Enregistrer la latence bout en bout ERP -> Vault."""
    if PROMETHEUS_AVAILABLE:
        erp_to_vault_duration_seconds.labels(tenant=tenant, env=env).observe(duration_seconds)


def update_outbox_backlog(tenant: str, env: str, count: int):
    """Mettre à jour le backlog d'outbox"""
    if PROMETHEUS_AVAILABLE:
        outbox_backlog.labels(tenant=tenant, env=env).set(count)


def record_dead_letter(tenant: str, env: str):
    """Enregistrer un événement déplacé vers dead letter queue"""
    if PROMETHEUS_AVAILABLE:
        dead_letters_total.labels(tenant=tenant, env=env).inc()


def record_internal_trigger():
    """Enregistrer un déclenchement interne du worker"""
    if PROMETHEUS_AVAILABLE:
        internal_trigger_total.labels().inc()


def record_internal_trigger_duration(duration_ms: int):
    """Enregistrer la durée d'un déclenchement interne (en millisecondes)"""
    if PROMETHEUS_AVAILABLE:
        internal_trigger_duration_ms.labels().observe(duration_ms)
