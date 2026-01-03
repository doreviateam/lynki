"""
Modèles pour les preuves (Proof)
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ProofModel(BaseModel):
    """Modèle pour une preuve vaultée"""
    proof_id: str
    hash: str
    timestamp: datetime
    event_id: str
    tenant: str
    env: str
    
    class Config:
        from_attributes = True

