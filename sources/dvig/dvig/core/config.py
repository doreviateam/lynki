"""
Configuration DVIG
Sprint 3 - US-3.1
"""

import os
from typing import Optional
from dataclasses import dataclass


@dataclass
class DvigConfig:
    """Configuration DVIG chargée depuis les variables d'environnement"""
    
    # Configuration Vault
    vault_url: str = "http://vault:9090"
    vault_api_key: Optional[str] = None
    
    # Configuration DVIG
    dvig_port: int = 8080
    dvig_host: str = "0.0.0.0"
    dvig_log_level: str = "info"
    
    # Multi-Tenant (US-3.4)
    tenant_validation: bool = True
    tenant_header: str = "X-Tenant-ID"
    
    @classmethod
    def from_env(cls) -> "DvigConfig":
        """Charge la configuration depuis les variables d'environnement"""
        return cls(
            vault_url=os.getenv("VAULT_URL", "http://vault:9090"),
            vault_api_key=os.getenv("VAULT_API_KEY"),
            dvig_port=int(os.getenv("DVIG_PORT", "8080")),
            dvig_host=os.getenv("DVIG_HOST", "0.0.0.0"),
            dvig_log_level=os.getenv("DVIG_LOG_LEVEL", "info"),
            tenant_validation=os.getenv("DVIG_TENANT_VALIDATION", "true").lower() == "true",
            tenant_header=os.getenv("DVIG_TENANT_HEADER", "X-Tenant-ID"),
        )

