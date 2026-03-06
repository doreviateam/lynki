"""
Modèle SQLAlchemy pour la table outbox_events
SPEC DVIG → Vault Forwarding v1.1
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from storage.database import Base


class OutboxEvent(Base):
    """Modèle SQLAlchemy pour les événements dans l'outbox"""
    __tablename__ = "outbox_events"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(UUID(as_uuid=False), unique=True, nullable=False, index=True)  # UUID string
    idempotency_key = Column(String(64), nullable=False, index=True)
    tenant = Column(String(50), nullable=False, index=True)
    env = Column(String(50), nullable=False, index=True)
    status = Column(String(20), nullable=False, default='accepted', index=True)
    attempt_count = Column(Integer, nullable=False, default=0)
    last_try_at = Column(DateTime, nullable=True)
    next_retry_at = Column(DateTime, nullable=True, index=True)
    last_error = Column(Text, nullable=True)
    vault_receipt_id = Column(String(100), nullable=True)
    payload = Column(JSONB, nullable=False)  # PostgreSQL JSONB
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Contrainte UNIQUE gérée au niveau SQL (tenant, idempotency_key)
    __table_args__ = (
        {'schema': 'public'} if hasattr(Base, 'metadata') else {}
    )
