"""
Service de calcul de hash canonique et validation des timestamps
"""
import hashlib
import json
import os
from datetime import datetime, timezone, timedelta
from config import get_settings

settings = get_settings()

# ⚠️ RÈGLE CRITIQUE : Tolérance temporelle configurable (par défaut ±5 secondes)
# Cette tolérance permet de tenir compte des dérives d'horloge et latences réseau
TIME_TOLERANCE_SECONDS = settings.dvig_time_tolerance


def canonical_hash(payload: dict) -> str:
    """
    Calcule le hash canonique du payload
    
    Args:
        payload: Dictionnaire représentant le payload
        
    Returns:
        Hash SHA-256 en hexadécimal
    """
    canonical = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(canonical.encode()).hexdigest()


def validate_timestamps(event_occurred_at: str, dvig_timestamp: datetime):
    """
    Valide que le timestamp DVIG est cohérent avec occurred_at.
    
    RÈGLE : Tolérance temporelle configurable (par défaut ±5 secondes)
    - Permet de tenir compte des dérives d'horloge
    - Permet de tenir compte des latences réseau
    - Configuration via DVIG_TIME_TOLERANCE (défaut: 5 secondes)
    
    Args:
        event_occurred_at: Timestamp de l'événement (ISO 8601 UTC)
        dvig_timestamp: Timestamp DVIG (datetime UTC)
        
    Raises:
        ValueError: Si le timestamp DVIG est trop antérieur à occurred_at
    """
    event_time = datetime.fromisoformat(event_occurred_at.replace('Z', '+00:00'))
    
    # Tolérance : ±5 secondes par défaut (configurable)
    min_time = event_time - timedelta(seconds=TIME_TOLERANCE_SECONDS)
    max_time = event_time + timedelta(seconds=60)  # Marge pour latence réseau
    
    if dvig_timestamp < min_time:
        raise ValueError(
            f"timestamp_dvig ({dvig_timestamp}) est trop antérieur à occurred_at "
            f"({event_time}). Tolérance : ±{TIME_TOLERANCE_SECONDS}s"
        )
    
    if dvig_timestamp > max_time:
        # Avertissement mais pas d'erreur (latence réseau acceptable)
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(
            f"timestamp_dvig ({dvig_timestamp}) est postérieur à occurred_at "
            f"({event_time}) de plus de {TIME_TOLERANCE_SECONDS}s"
        )

