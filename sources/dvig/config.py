"""
Configuration DVIG
Settings depuis variables d'environnement
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuration DVIG chargée depuis les variables d'environnement"""
    
    # Configuration DVIG
    dvig_host: str = "0.0.0.0"
    dvig_port: int = 8080
    dvig_log_level: str = "info"
    debug: bool = False
    
    # Configuration Base de données
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://dvig_user:dvig_pass@localhost:5432/dvig_db"
    )
    
    # Configuration Vault
    vault_host: str = "vault"  # Service Docker interne
    vault_port: int = 8080
    vault_timeout: int = 10
    
    # Tolérance temporelle (P0)
    dvig_time_tolerance: int = int(os.getenv("DVIG_TIME_TOLERANCE", "5"))
    
    class Config:
        env_file = ".env"
        case_sensitive = False


_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Singleton pour les settings"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

