"""
Client HTTP pour communiquer avec Dorevia Vault
Communication via réseau Docker interne
"""
import httpx
from config import get_settings

settings = get_settings()


async def send_to_vault(payload: dict, tenant: str, env: str) -> dict:
    """
    Envoie l'événement à Dorevia Vault via réseau interne Docker
    
    ⚠️ Préconisation P0.2 : Utiliser un nom de service Docker interne
    au lieu du DNS public pour sécuriser l'accès Vault.
    
    Args:
        payload: Payload à transmettre à Vault
        tenant: Identifiant du tenant
        env: Environnement (lab, stinger, prod)
        
    Returns:
        Réponse JSON de Vault
        
    Raises:
        httpx.HTTPError: Si la requête échoue
    """
    # Utiliser le nom de service Docker (même réseau Docker)
    vault_host = settings.vault_host  # Service Docker, pas DNS public
    vault_port = settings.vault_port   # Port interne
    
    vault_url = f"http://{vault_host}:{vault_port}/api/v1/ingest"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            vault_url,
            json=payload,
            timeout=settings.vault_timeout
        )
        response.raise_for_status()
        return response.json()

