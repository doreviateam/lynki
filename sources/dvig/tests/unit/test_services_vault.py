"""
Tests unitaires pour services/vault.py
"""
import sys
from pathlib import Path
dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

import pytest
from unittest.mock import AsyncMock, patch
from services.vault import send_to_vault


class TestVaultClient:
    """Tests pour le client Vault"""
    
    @pytest.mark.asyncio
    async def test_send_to_vault_success(self):
        """Test envoi réussi à Vault"""
        mock_response = {
            "status": "vaulted",
            "proof_id": "vault_proof_123"
        }
        
        # Créer un mock de réponse httpx
        # Note: httpx.Response.json() et raise_for_status() sont synchrones, pas asynchrones
        from unittest.mock import Mock
        mock_response_obj = Mock()
        mock_response_obj.json.return_value = mock_response  # ✅ Méthode synchrone
        mock_response_obj.raise_for_status = Mock()  # ✅ Méthode synchrone
        
        # Créer une fonction async pour mock_post
        async def mock_post(*args, **kwargs):
            return mock_response_obj
        
        with patch("services.vault.httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
            mock_client_instance.__aexit__ = AsyncMock(return_value=None)
            mock_client_instance.post = mock_post
            mock_client.return_value = mock_client_instance
            
            result = await send_to_vault(
                {"test": "data"},
                "test_tenant",
                "lab"
            )
            
            assert result == mock_response
    
    @pytest.mark.asyncio
    async def test_send_to_vault_error(self):
        """Test erreur lors de l'envoi à Vault"""
        import httpx
        from unittest.mock import Mock
        
        # Créer un mock de réponse httpx
        # Note: httpx.Response.raise_for_status() est synchrone, pas asynchrone
        mock_response_obj = Mock()
        mock_response_obj.raise_for_status = Mock(
            side_effect=httpx.HTTPError("Vault error")  # ✅ Lève l'erreur directement (synchrone)
        )
        
        # Créer une fonction async pour mock_post
        async def mock_post(*args, **kwargs):
            return mock_response_obj
        
        with patch("services.vault.httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
            mock_client_instance.__aexit__ = AsyncMock(return_value=None)
            mock_client_instance.post = mock_post
            mock_client.return_value = mock_client_instance
            
            with pytest.raises(httpx.HTTPError):
                await send_to_vault(
                    {"test": "data"},
                    "test_tenant",
                    "lab"
                )
    
    @pytest.mark.asyncio
    async def test_send_to_vault_uses_internal_service(self):
        """Test que le client utilise le service Docker interne (pas DNS public)"""
        with patch("services.vault.httpx.AsyncClient") as mock_client:
            mock_response_obj = AsyncMock()
            mock_response_obj.json.return_value = {"status": "ok"}
            mock_response_obj.raise_for_status = AsyncMock()
            
            mock_post = AsyncMock(return_value=mock_response_obj)
            mock_client.return_value.__aenter__.return_value.post = mock_post
            
            await send_to_vault(
                {"test": "data"},
                "test_tenant",
                "lab"
            )
            
            # Vérifier que l'URL ne contient pas de DNS public
            call_args = mock_post.call_args
            url = call_args[0][0]
            assert "doreviateam.com" not in url
            assert "vault" in url  # Service Docker interne

