"""
Modèles Pydantic pour le payload d'ingestion
"""
from pydantic import BaseModel, Field


class SourceModel(BaseModel):
    """Modèle pour le champ source (identification applicative)"""
    unit: str = Field(..., min_length=3, max_length=50, description="Identifiant de l'unit émettrice (ex: odoo, sylius, pdp) - SPEC v1.5.1")
    tenant: str = Field(..., description="Identifiant du tenant")
    env: str = Field(..., description="Environnement (lab, stinger, prod)")
    component: str | None = Field(None, description="Composant applicatif (ex: account.move)")
    connector: str | None = Field(None, description="Connecteur utilisé (ex: dorevia-vault-connector)")
    version: str | None = Field(None, description="Version du connecteur")


class EventModel(BaseModel):
    """Modèle pour le champ event"""
    type: str = Field(..., description="Type d'événement (ex: pos.transaction, invoice.posted)")
    id: str = Field(..., description="Identifiant unique de l'événement (clé d'idempotence)")
    occurred_at: str = Field(..., description="Timestamp de l'événement (ISO 8601 UTC)")


class IngestPayload(BaseModel):
    """Payload complet pour l'endpoint /ingest"""
    source: SourceModel = Field(..., description="Identification applicative (obligatoire)")
    event: EventModel = Field(..., description="Événement financier (obligatoire)")
    data: dict = Field(..., description="Données métier normalisées (obligatoire)")

