"""
Validation métier - Source vs Univers/Tenant
Conforme à la Clarification Contractuelle v1.0
"""
from fastapi import HTTPException
from typing import List
import re
from .auth import AuthInfo

# Environnements autorisés
VALID_ENVIRONMENTS: List[str] = ["lab", "stinger", "prod"]

# Pattern strict : univers.env.tenant
SOURCE_PATTERN = re.compile(r'^([^.]+)\.([^.]+)\.([^.]+)$')


def validate_source_univers(source: str, auth_info: AuthInfo) -> None:
    """
    Valide la source selon le contrat contractuel :
    - Format : univers.env.tenant
    - univers du source = univers du token
    - tenant du source = tenant du token
    - env dans {lab, stinger, prod}
    
    Raises:
        HTTPException: 403 si validation échoue
    """
    # 1. Vérifier format univers.env.tenant
    match = SOURCE_PATTERN.match(source)
    if not match:
        raise HTTPException(
            status_code=403,
            detail={
                "status": "error",
                "error": {
                    "code": "INVALID_SOURCE_FORMAT",
                    "message": "Source doit être au format 'univers.env.tenant' (ex: odoo.lab.core)"
                }
            }
        )
    
    source_univers, source_env, source_tenant = match.groups()
    
    # 2. Vérifier univers
    if source_univers != auth_info.univers:
        raise HTTPException(
            status_code=403,
            detail={
                "status": "error",
                "error": {
                    "code": "UNIVERSE_MISMATCH",
                    "message": f"Univers '{source_univers}' ne correspond pas à l'univers du token '{auth_info.univers}'"
                }
            }
        )
    
    # 3. Vérifier tenant (CRITIQUE - selon clarification contractuelle)
    if source_tenant != auth_info.tenant:
        raise HTTPException(
            status_code=403,
            detail={
                "status": "error",
                "error": {
                    "code": "TENANT_MISMATCH",
                    "message": f"Tenant '{source_tenant}' ne correspond pas au tenant du token '{auth_info.tenant}'"
                }
            }
        )
    
    # 4. Vérifier environnement
    if source_env not in VALID_ENVIRONMENTS:
        raise HTTPException(
            status_code=403,
            detail={
                "status": "error",
                "error": {
                    "code": "INVALID_ENVIRONMENT",
                    "message": f"Environnement '{source_env}' invalide. Valeurs autorisées: {VALID_ENVIRONMENTS}"
                }
            }
        )
    
    # 5. Politique stricte pour STINGER/PROD (selon clarification)
    # LAB peut être tolérant temporairement, STINGER/PROD strict
    # (à implémenter selon politique si nécessaire)

