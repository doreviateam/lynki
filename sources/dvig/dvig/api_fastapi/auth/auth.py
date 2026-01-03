"""
Authentification Bearer Token pour DVIG FastAPI
"""
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import hashlib
import secrets
import logging
from typing import Optional
from dataclasses import dataclass

from .token_store import TokenStore, TokenInfo

log = logging.getLogger("dvig.auth")

# CORRECTION B3 : auto_error=False pour gérer 401 manuellement
security = HTTPBearer(auto_error=False)


@dataclass
class AuthInfo:
    """Information d'authentification injectée dans le contexte"""
    tenant: str
    univers: str
    token_id: str


def constant_time_compare(hash1: str, hash2: str) -> bool:
    """Comparaison constant-time pour éviter timing attacks"""
    return secrets.compare_digest(hash1, hash2)


# Dependency pour obtenir le TokenStore (à injecter depuis app.py)
_token_store: Optional[TokenStore] = None


def get_token_store() -> TokenStore:
    """Dependency pour obtenir le TokenStore"""
    if _token_store is None:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "error",
                "error": {
                    "code": "AUTH_BACKEND_UNAVAILABLE",
                    "message": "Token store non initialisé"
                }
            }
        )
    return _token_store


def init_token_store(store: TokenStore):
    """Initialise le token store (appelé depuis app.py)"""
    global _token_store
    _token_store = store


async def get_auth_info(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    token_store: TokenStore = Depends(get_token_store)
) -> AuthInfo:
    """
    Valide le token Bearer et retourne les informations d'authentification.
    
    Raises:
        HTTPException: 401 si token invalide, 503 si backend indisponible
    """
    # CORRECTION B3 : Gérer absence de header manuellement
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail={
                "status": "error",
                "error": {
                    "code": "AUTH_MISSING",
                    "message": "Header Authorization manquant"
                }
            }
        )
    
    # Vérifier disponibilité du store
    if not token_store.is_available():
        log.error("Token store indisponible")
        raise HTTPException(
            status_code=503,
            detail={
                "status": "error",
                "error": {
                    "code": "AUTH_BACKEND_UNAVAILABLE",
                    "message": "Service d'authentification indisponible"
                }
            }
        )
    
    # Extraire le token
    token = credentials.credentials
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail={
                "status": "error",
                "error": {
                    "code": "AUTH_MISSING",
                    "message": "Token manquant"
                }
            }
        )
    
    # Calculer le hash
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Rechercher le token
    token_info = token_store.get_token_info(token_hash)
    
    if not token_info:
        log.warning("Token invalide ou non trouvé")
        raise HTTPException(
            status_code=401,
            detail={
                "status": "error",
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": "Token invalide ou expiré"
                }
            }
        )
    
    # CORRECTION I1 : Une seule source de vérité - get_token_info renvoie tous les tokens
    # On vérifie le statut ici pour distinguer INVALID_TOKEN vs TOKEN_REVOKED
    if token_info.status != 'active':
        log.warning(f"Token {token_info.id} non actif (status: {token_info.status})")
        raise HTTPException(
            status_code=401,
            detail={
                "status": "error",
                "error": {
                    "code": "TOKEN_REVOKED",
                    "message": "Token révoqué ou désactivé"
                }
            }
        )
    
    # Retourner les informations d'authentification
    return AuthInfo(
        tenant=token_info.tenant,
        univers=token_info.univers,
        token_id=token_info.id
    )

