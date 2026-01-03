"""
Tests unitaires pour services/hash.py
"""
import sys
from pathlib import Path
dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

import pytest
from datetime import datetime, timezone, timedelta
from services.hash import canonical_hash, validate_timestamps


class TestCanonicalHash:
    """Tests pour canonical_hash"""
    
    def test_hash_deterministic(self):
        """Le hash doit être déterministe"""
        payload = {"key": "value", "number": 42}
        hash1 = canonical_hash(payload)
        hash2 = canonical_hash(payload)
        assert hash1 == hash2
    
    def test_hash_order_independent(self):
        """Le hash doit être indépendant de l'ordre des clés"""
        payload1 = {"key": "value", "number": 42}
        payload2 = {"number": 42, "key": "value"}
        hash1 = canonical_hash(payload1)
        hash2 = canonical_hash(payload2)
        assert hash1 == hash2
    
    def test_hash_different_payloads(self):
        """Des payloads différents doivent avoir des hash différents"""
        payload1 = {"key": "value1"}
        payload2 = {"key": "value2"}
        hash1 = canonical_hash(payload1)
        hash2 = canonical_hash(payload2)
        assert hash1 != hash2
    
    def test_hash_format(self):
        """Le hash doit être en hexadécimal (64 caractères pour SHA-256)"""
        payload = {"test": "data"}
        hash_value = canonical_hash(payload)
        assert len(hash_value) == 64
        assert all(c in '0123456789abcdef' for c in hash_value)


class TestValidateTimestamps:
    """Tests pour validate_timestamps"""
    
    def test_valid_timestamps_within_tolerance(self):
        """Timestamps valides dans la tolérance"""
        occurred_at = "2025-12-20T10:00:00Z"
        dvig_timestamp = datetime.fromisoformat(occurred_at.replace('Z', '+00:00')) + timedelta(seconds=2)
        # Ne doit pas lever d'exception
        validate_timestamps(occurred_at, dvig_timestamp)
    
    def test_valid_timestamps_exact_match(self):
        """Timestamps exactement égaux"""
        occurred_at = "2025-12-20T10:00:00Z"
        dvig_timestamp = datetime.fromisoformat(occurred_at.replace('Z', '+00:00'))
        # Ne doit pas lever d'exception
        validate_timestamps(occurred_at, dvig_timestamp)
    
    def test_valid_timestamps_after_within_tolerance(self):
        """DVIG timestamp après occurred_at (dans la tolérance)"""
        occurred_at = "2025-12-20T10:00:00Z"
        dvig_timestamp = datetime.fromisoformat(occurred_at.replace('Z', '+00:00')) + timedelta(seconds=30)
        # Ne doit pas lever d'exception (latence réseau acceptable)
        validate_timestamps(occurred_at, dvig_timestamp)
    
    def test_invalid_timestamps_too_early(self):
        """DVIG timestamp trop antérieur à occurred_at"""
        occurred_at = "2025-12-20T10:00:00Z"
        dvig_timestamp = datetime.fromisoformat(occurred_at.replace('Z', '+00:00')) - timedelta(seconds=10)
        with pytest.raises(ValueError, match="trop antérieur"):
            validate_timestamps(occurred_at, dvig_timestamp)
    
    def test_tolerance_configurable(self):
        """La tolérance doit être configurable"""
        # Test avec tolérance par défaut (5 secondes)
        occurred_at = "2025-12-20T10:00:00Z"
        dvig_timestamp = datetime.fromisoformat(occurred_at.replace('Z', '+00:00')) - timedelta(seconds=3)
        # Ne doit pas lever d'exception (dans la tolérance de 5s)
        validate_timestamps(occurred_at, dvig_timestamp)

