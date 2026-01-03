"""
Tests unitaires pour la validation source/univers/tenant
Conforme à la Clarification Contractuelle v1.0
"""
import pytest
from fastapi import HTTPException
from dvig.api_fastapi.auth.auth import AuthInfo
from dvig.api_fastapi.auth.validation import validate_source_univers


@pytest.fixture
def auth_info_odoo_core():
    """AuthInfo avec univers odoo et tenant core"""
    return AuthInfo(
        tenant="core",
        univers="odoo",
        token_id="tok_lab_core_001"
    )


@pytest.fixture
def auth_info_sylius_core():
    """AuthInfo avec univers sylius et tenant core"""
    return AuthInfo(
        tenant="core",
        univers="sylius",
        token_id="tok_002"
    )


# Tests sources valides
def test_validate_source_univers_success_lab(auth_info_odoo_core):
    """Test validation source/univers/tenant réussie - LAB"""
    validate_source_univers("odoo.lab.core", auth_info_odoo_core)
    # Pas d'exception = succès


def test_validate_source_univers_success_stinger(auth_info_odoo_core):
    """Test validation source/univers/tenant réussie - STINGER"""
    validate_source_univers("odoo.stinger.core", auth_info_odoo_core)
    # Pas d'exception = succès


def test_validate_source_univers_success_prod(auth_info_odoo_core):
    """Test validation source/univers/tenant réussie - PROD"""
    validate_source_univers("odoo.prod.core", auth_info_odoo_core)
    # Pas d'exception = succès


# Tests format invalide
def test_validate_source_invalid_format_missing_parts(auth_info_odoo_core):
    """Test validation avec format invalide (parties manquantes)"""
    with pytest.raises(HTTPException) as exc_info:
        validate_source_univers("odoo.core", auth_info_odoo_core)
    
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["error"]["code"] == "INVALID_SOURCE_FORMAT"


def test_validate_source_invalid_format_empty(auth_info_odoo_core):
    """Test validation avec source vide"""
    with pytest.raises(HTTPException) as exc_info:
        validate_source_univers("", auth_info_odoo_core)
    
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["error"]["code"] == "INVALID_SOURCE_FORMAT"


def test_validate_source_invalid_format_wrong_order(auth_info_odoo_core):
    """Test validation avec ordre incorrect"""
    # core.odoo.lab correspond au format mais échoue sur univers mismatch
    with pytest.raises(HTTPException) as exc_info:
        validate_source_univers("core.odoo.lab", auth_info_odoo_core)
    
    assert exc_info.value.status_code == 403
    # Le format est valide, mais l'univers ne correspond pas
    assert exc_info.value.detail["error"]["code"] == "UNIVERSE_MISMATCH"


# Tests univers mismatch
def test_validate_source_univers_mismatch(auth_info_odoo_core):
    """Test validation source/univers mismatch"""
    with pytest.raises(HTTPException) as exc_info:
        validate_source_univers("sylius.lab.core", auth_info_odoo_core)
    
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["error"]["code"] == "UNIVERSE_MISMATCH"
    assert "sylius" in exc_info.value.detail["error"]["message"]
    assert "odoo" in exc_info.value.detail["error"]["message"]


# Tests tenant mismatch
def test_validate_source_tenant_mismatch(auth_info_odoo_core):
    """Test validation tenant mismatch"""
    with pytest.raises(HTTPException) as exc_info:
        validate_source_univers("odoo.lab.rehtse", auth_info_odoo_core)
    
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["error"]["code"] == "TENANT_MISMATCH"
    assert "rehtse" in exc_info.value.detail["error"]["message"]
    assert "core" in exc_info.value.detail["error"]["message"]


# Tests environnement invalide
def test_validate_source_invalid_environment(auth_info_odoo_core):
    """Test validation avec environnement invalide"""
    with pytest.raises(HTTPException) as exc_info:
        validate_source_univers("odoo.dev.core", auth_info_odoo_core)
    
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["error"]["code"] == "INVALID_ENVIRONMENT"
    assert "dev" in exc_info.value.detail["error"]["message"]


def test_validate_source_invalid_environment_prd(auth_info_odoo_core):
    """Test validation avec environnement invalide (prd au lieu de prod)"""
    with pytest.raises(HTTPException) as exc_info:
        validate_source_univers("odoo.prd.core", auth_info_odoo_core)
    
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["error"]["code"] == "INVALID_ENVIRONMENT"

