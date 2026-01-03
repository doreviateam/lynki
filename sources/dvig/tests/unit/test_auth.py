"""
Tests unitaires pour l'authentification
"""
import pytest
import hashlib
from unittest.mock import Mock, patch, MagicMock
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from dvig.api_fastapi.auth.auth import (
    get_auth_info,
    AuthInfo,
    get_token_store,
    init_token_store,
    constant_time_compare
)
from dvig.api_fastapi.auth.token_store import TokenStore, TokenInfo
from datetime import datetime, timezone


@pytest.fixture
def mock_token_store():
    """Mock TokenStore"""
    store = Mock(spec=TokenStore)
    return store


@pytest.fixture
def active_token_info():
    """TokenInfo actif"""
    return TokenInfo(
        id="tok_001",
        tenant="rehtse",
        univers="odoo",
        status="active",
        created_at=datetime.now(timezone.utc)
    )


@pytest.fixture
def revoked_token_info():
    """TokenInfo révoqué"""
    return TokenInfo(
        id="tok_002",
        tenant="rehtse",
        univers="odoo",
        status="revoked",
        created_at=datetime.now(timezone.utc)
    )


@pytest.fixture
def sample_token():
    """Token de test"""
    return "dvig_test_token_12345678901234567890"


@pytest.fixture
def sample_token_hash(sample_token):
    """Hash du token de test"""
    return hashlib.sha256(sample_token.encode()).hexdigest()


@pytest.mark.asyncio
async def test_get_auth_info_success(mock_token_store, active_token_info, sample_token, sample_token_hash):
    """Test authentification réussie"""
    mock_token_store.is_available.return_value = True
    mock_token_store.get_token_info.return_value = active_token_info
    
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=sample_token
    )
    
    # Mock dependency
    with patch('dvig.api_fastapi.auth.auth.get_token_store', return_value=mock_token_store):
        auth_info = await get_auth_info(credentials=credentials, token_store=mock_token_store)
    
    assert isinstance(auth_info, AuthInfo)
    assert auth_info.tenant == "rehtse"
    assert auth_info.univers == "odoo"
    assert auth_info.token_id == "tok_001"
    
    # Vérifier que get_token_info a été appelé avec le bon hash
    mock_token_store.get_token_info.assert_called_once_with(sample_token_hash)


@pytest.mark.asyncio
async def test_get_auth_info_missing_header_401(mock_token_store):
    """Test absence header Authorization (CORRECTION B3)"""
    mock_token_store.is_available.return_value = True
    
    # credentials = None (pas de header)
    with patch('dvig.api_fastapi.auth.auth.get_token_store', return_value=mock_token_store):
        with pytest.raises(HTTPException) as exc_info:
            await get_auth_info(credentials=None, token_store=mock_token_store)
    
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail["error"]["code"] == "AUTH_MISSING"


@pytest.mark.asyncio
async def test_get_auth_info_invalid_token_401(mock_token_store, sample_token, sample_token_hash):
    """Test token invalide"""
    mock_token_store.is_available.return_value = True
    mock_token_store.get_token_info.return_value = None  # Token non trouvé
    
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=sample_token
    )
    
    with patch('dvig.api_fastapi.auth.auth.get_token_store', return_value=mock_token_store):
        with pytest.raises(HTTPException) as exc_info:
            await get_auth_info(credentials=credentials, token_store=mock_token_store)
    
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail["error"]["code"] == "INVALID_TOKEN"


@pytest.mark.asyncio
async def test_get_auth_info_revoked_token_401(mock_token_store, revoked_token_info, sample_token, sample_token_hash):
    """Test token révoqué (CORRECTION I1)"""
    mock_token_store.is_available.return_value = True
    mock_token_store.get_token_info.return_value = revoked_token_info  # Token trouvé mais revoked
    
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=sample_token
    )
    
    with patch('dvig.api_fastapi.auth.auth.get_token_store', return_value=mock_token_store):
        with pytest.raises(HTTPException) as exc_info:
            await get_auth_info(credentials=credentials, token_store=mock_token_store)
    
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail["error"]["code"] == "TOKEN_REVOKED"


@pytest.mark.asyncio
async def test_get_auth_info_backend_unavailable_503(mock_token_store, sample_token):
    """Test backend indisponible"""
    mock_token_store.is_available.return_value = False
    
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=sample_token
    )
    
    with patch('dvig.api_fastapi.auth.auth.get_token_store', return_value=mock_token_store):
        with pytest.raises(HTTPException) as exc_info:
            await get_auth_info(credentials=credentials, token_store=mock_token_store)
    
    assert exc_info.value.status_code == 503
    assert exc_info.value.detail["error"]["code"] == "AUTH_BACKEND_UNAVAILABLE"


def test_constant_time_compare():
    """Test comparaison constant-time"""
    hash1 = "a" * 64
    hash2 = "a" * 64
    hash3 = "b" * 64
    
    # Même hash
    assert constant_time_compare(hash1, hash2) is True
    
    # Hashs différents
    assert constant_time_compare(hash1, hash3) is False
    
    # Hashs de longueurs différentes
    assert constant_time_compare(hash1, "short") is False

