"""
Gestionnaire de tenant-id pour DVIG
Sprint 3 - US-3.4
"""

import re
from typing import Optional
from flask import request


class TenantManager:
    """Gestionnaire pour l'isolation multi-tenant"""
    
    # Format UUID ou alphanumérique avec tirets
    TENANT_ID_PATTERN = re.compile(r'^[a-zA-Z0-9\-_]+$')
    
    @staticmethod
    def extract_tenant_id() -> Optional[str]:
        """
        Extrait le tenant-id depuis les headers HTTP
        
        Returns:
            tenant-id si présent et valide, None sinon
        """
        tenant_id = request.headers.get("X-Tenant-ID")
        
        if not tenant_id:
            return None
        
        # Validation du format
        if TenantManager.TENANT_ID_PATTERN.match(tenant_id):
            return tenant_id
        
        return None
    
    @staticmethod
    def validate_tenant_id(tenant_id: str) -> bool:
        """
        Valide le format d'un tenant-id
        
        Args:
            tenant_id: Identifiant du tenant
            
        Returns:
            True si valide, False sinon
        """
        if not tenant_id:
            return False
        
        return bool(TenantManager.TENANT_ID_PATTERN.match(tenant_id))

