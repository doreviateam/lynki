"""
Tests d'intégration pour l'authentification
"""
import sys
from pathlib import Path
import re

dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

import pytest
from storage.tokens import generate_and_store_token, validate_token_from_db
from sqlalchemy import select
from storage.tokens import DVIGToken


class TestAuthentication:
    """Tests pour l'authentification Bearer token"""

    def test_token_generation_unique_bulk(self, db_session):
        """
        Les tokens générés doivent être uniques (bulk)
        
        Comportement attendu : generate_and_store_token crée toujours un nouveau token
        (rotation illimitée, pas d'upsert unique par tuple)
        """
        tokens = [
            generate_and_store_token("test_tenant", "lab", "odoo", db_session)
            for _ in range(50)
        ]
        # Tous les tokens doivent être différents
        assert len(tokens) == len(set(tokens))
        
        # Tous les tokens doivent être valides
        for token in tokens:
            record = validate_token_from_db(token, db_session)
            assert record is not None
            assert record.tenant == "test_tenant"
            assert record.env == "lab"
            assert record.scope_unit == "odoo"

    def test_token_format_minimum(self, db_session):
        """
        Sanity check format/longueur (Bearer token 'fort')
        
        Comportement attendu : secrets.token_urlsafe(32) génère un token URL-safe
        de ~43 caractères (32 octets en base64url)
        """
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)

        assert isinstance(token, str)
        assert len(token) >= 32  # Minimum 32 caractères (secrets.token_urlsafe(32) ≈ 43)
        # Format URL-safe : pas d'espaces, caractères alphanumériques + - _ . ~
        assert " " not in token
        assert re.match(r"^[A-Za-z0-9\-_\.~]+$", token)

    def test_token_validation_success(self, db_session):
        """
        Validation d'un token valide
        
        Comportement attendu : validate_token_from_db retourne le record si token actif
        """
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        token_record = validate_token_from_db(token, db_session)

        assert token_record is not None
        assert token_record.tenant == "test_tenant"
        assert token_record.env == "lab"
        assert token_record.scope_unit == "odoo"  # SPEC v1.5.1
        assert token_record.revoked_at is None  # Token actif

    def test_token_validation_failure(self, db_session):
        """
        Validation d'un token invalide
        
        Comportement attendu : validate_token_from_db retourne None si token inexistant
        """
        invalid_token = "invalid_token_123"
        token_record = validate_token_from_db(invalid_token, db_session)

        assert token_record is None

    def test_token_per_tenant_env_scope_unit(self, db_session):
        """
        Chaque tuple (tenant, env, scope_unit) peut avoir plusieurs tokens actifs
        
        Comportement attendu : generate_and_store_token crée toujours un nouveau token
        (pas d'upsert unique par tuple). Plusieurs tokens actifs peuvent coexister.
        """
        token1 = generate_and_store_token("tenant1", "lab", "odoo", db_session)
        token2 = generate_and_store_token("tenant1", "stinger", "odoo", db_session)
        token3 = generate_and_store_token("tenant2", "lab", "odoo", db_session)

        # Tous les tokens doivent être différents
        assert token1 != token2
        assert token1 != token3
        assert token2 != token3

        # Chaque token doit être valide et correspondre à son tuple
        record1 = validate_token_from_db(token1, db_session)
        record2 = validate_token_from_db(token2, db_session)
        record3 = validate_token_from_db(token3, db_session)

        assert (record1.tenant, record1.env, record1.scope_unit) == ("tenant1", "lab", "odoo")
        assert (record2.tenant, record2.env, record2.scope_unit) == ("tenant1", "stinger", "odoo")
        assert (record3.tenant, record3.env, record3.scope_unit) == ("tenant2", "lab", "odoo")

    def test_scope_unit_isolated(self, db_session):
        """
        Un token scope_unit=odoo ne doit pas être confondu avec pos (isolation par scope_unit)
        
        Comportement attendu : Les tokens avec des scope_unit différents sont distincts
        même pour le même (tenant, env)
        """
        token_odoo = generate_and_store_token("tenant1", "lab", "odoo", db_session)
        token_pos = generate_and_store_token("tenant1", "lab", "pos", db_session)

        rec_odoo = validate_token_from_db(token_odoo, db_session)
        rec_pos = validate_token_from_db(token_pos, db_session)

        assert rec_odoo.scope_unit == "odoo"
        assert rec_pos.scope_unit == "pos"
        assert token_odoo != token_pos
        
        # Vérifier que les deux tokens sont actifs et distincts
        assert rec_odoo.revoked_at is None
        assert rec_pos.revoked_at is None
        assert rec_odoo.token_hash != rec_pos.token_hash

    def test_multiple_active_tokens_same_tuple(self, db_session):
        """
        Plusieurs tokens actifs peuvent coexister pour le même (tenant, env, scope_unit)
        
        Comportement attendu : generate_and_store_token crée toujours un nouveau token
        sans révoquer les précédents (rotation illimitée)
        """
        # Créer 3 tokens pour le même tuple
        token1 = generate_and_store_token("tenant1", "lab", "odoo", db_session)
        token2 = generate_and_store_token("tenant1", "lab", "odoo", db_session)
        token3 = generate_and_store_token("tenant1", "lab", "odoo", db_session)

        # Tous les tokens doivent être différents
        assert token1 != token2
        assert token1 != token3
        assert token2 != token3

        # Tous les tokens doivent être valides
        rec1 = validate_token_from_db(token1, db_session)
        rec2 = validate_token_from_db(token2, db_session)
        rec3 = validate_token_from_db(token3, db_session)

        assert rec1 is not None
        assert rec2 is not None
        assert rec3 is not None

        # Tous doivent avoir le même tuple (tenant, env, scope_unit)
        assert (rec1.tenant, rec1.env, rec1.scope_unit) == ("tenant1", "lab", "odoo")
        assert (rec2.tenant, rec2.env, rec2.scope_unit) == ("tenant1", "lab", "odoo")
        assert (rec3.tenant, rec3.env, rec3.scope_unit) == ("tenant1", "lab", "odoo")

        # Tous doivent être actifs (non révoqués)
        assert rec1.revoked_at is None
        assert rec2.revoked_at is None
        assert rec3.revoked_at is None

        # Vérifier qu'il y a bien 3 tokens actifs en BDD
        active_tokens = db_session.execute(
            select(DVIGToken)
            .where(DVIGToken.tenant == "tenant1")
            .where(DVIGToken.env == "lab")
            .where(DVIGToken.scope_unit == "odoo")
            .where(DVIGToken.revoked_at.is_(None))
        ).scalars().all()

        assert len(active_tokens) == 3

    def test_token_hash_uniqueness(self, db_session):
        """
        Les hash de tokens doivent être uniques (contrainte BDD)
        
        Comportement attendu : L'index unique sur (tenant, env, scope_unit, token_hash)
        garantit qu'un même token_hash ne peut pas être dupliqué pour un tuple donné.
        """
        # Générer deux tokens différents
        token1 = generate_and_store_token("tenant1", "lab", "odoo", db_session)
        token2 = generate_and_store_token("tenant1", "lab", "odoo", db_session)

        # Les hash doivent être différents
        import hashlib
        hash1 = hashlib.sha256(token1.encode()).hexdigest()
        hash2 = hashlib.sha256(token2.encode()).hexdigest()

        assert hash1 != hash2

        # Vérifier en BDD
        rec1 = db_session.execute(
            select(DVIGToken)
            .where(DVIGToken.token_hash == hash1)
        ).scalar_one()

        rec2 = db_session.execute(
            select(DVIGToken)
            .where(DVIGToken.token_hash == hash2)
        ).scalar_one()

        assert rec1.id != rec2.id
        assert rec1.token_hash != rec2.token_hash
