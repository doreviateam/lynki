"""
Tests de concurrence pour l'endpoint POST /ingest
Validation de l'idempotence sous charge

⚠️ NOTE : SQLite en mémoire n'est pas thread-safe.
Ces tests utilisent des requêtes séquentielles rapides pour valider l'idempotence.
Pour une vraie concurrence, utiliser PostgreSQL.
"""
import sys
from pathlib import Path
import copy
import time

dvig_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(dvig_path))

import pytest
from datetime import datetime, timezone
from unittest.mock import patch, AsyncMock
from storage.tokens import generate_and_store_token
from storage.proofs import Proof


class TestIngestConcurrency:
    """Tests de concurrence pour l'endpoint /ingest"""
    
    @pytest.mark.slow
    def test_ingest_concurrent_same_event_id(self, client, db_session, sample_payload):
        """
        Test : 10 requêtes rapides avec même event.id
        Attendu : Une seule preuve créée, toutes les réponses identiques
        
        ⚠️ NOTE : SQLite en mémoire n'est pas thread-safe.
        On utilise des requêtes séquentielles rapides pour valider l'idempotence.
        """
        # Créer un token avec scope_unit
        token = generate_and_store_token("test_tenant", "lab", "odoo", db_session)
        db_session.commit()
        db_session.expire_all()
        
        # Mock de send_to_vault
        mock_vault_response = {
            "status": "vaulted",
            "proof_id": "vault_proof_123"
        }
        
        # Copie défensive du payload pour chaque requête
        payloads = [copy.deepcopy(sample_payload) for _ in range(10)]
        
        with patch("api.ingest.send_to_vault", new_callable=AsyncMock) as mock_vault:
            mock_vault.return_value = mock_vault_response
            
            # 10 requêtes rapides (séquentielles mais très rapides)
            start_time = time.time()
            responses = []
            for payload in payloads:
                response = client.post(
                    "/api/v1/ingest",
                    json=payload,
                    headers={"Authorization": f"Bearer {token}"}
                )
                responses.append(response)
            elapsed_time = time.time() - start_time
            
            # Vérifications
            # 1. Toutes les réponses sont 200
            assert all(r.status_code == 200 for r in responses), \
                f"Certaines requêtes ont échoué : {[r.status_code for r in responses]}"
            
            # 2. Tous les proof_id sont identiques
            proof_ids = [r.json()["proof_id"] for r in responses]
            unique_proof_ids = set(proof_ids)
            assert len(unique_proof_ids) == 1, \
                f"Plusieurs proof_id différents : {unique_proof_ids}"
            
            # 3. Vérifier BDD : une seule preuve créée
            db_session.expire_all()
            proofs = db_session.query(Proof).filter_by(
                tenant="test_tenant",
                env="lab",
                event_id=sample_payload["event"]["id"]
            ).all()
            assert len(proofs) == 1, \
                f"Plusieurs preuves créées : {len(proofs)} au lieu de 1"
            
            # 4. Vérifier que la preuve correspond aux réponses
            assert proofs[0].proof_id == proof_ids[0], \
                "Le proof_id en BDD ne correspond pas aux réponses"
            
            # 5. Temps de réponse acceptable (< 2s total)
            assert elapsed_time < 2.0, \
                f"Temps de réponse trop long : {elapsed_time:.2f}s"
            
            # 6. Vérifier que toutes les réponses ont le même hash
            hashes = [r.json()["hash"] for r in responses]
            unique_hashes = set(hashes)
            assert len(unique_hashes) == 1, \
                f"Plusieurs hash différents : {unique_hashes}"
    
    @pytest.mark.slow
    def test_ingest_concurrent_different_event_ids(self, client, db_session, sample_payload):
        """
        Test : 10 requêtes rapides avec même (tenant, env, unit) mais event.id différents
        Attendu : 10 preuves distinctes créées, aucun collision
        
        ⚠️ NOTE : SQLite en mémoire n'est pas thread-safe.
        On utilise des requêtes séquentielles rapides.
        """
        # Utiliser un tenant différent pour éviter les conflits de proof_id avec les autres tests
        # ⚠️ Pas d'underscore dans le tenant_id (casse le parsing du proof_id dans create_proof)
        tenant_id = "testtenantconcurrentevents"
        token = generate_and_store_token(tenant_id, "lab", "odoo", db_session)
        db_session.commit()
        db_session.expire_all()
        
        # Mock de send_to_vault
        mock_vault_response = {
            "status": "vaulted",
            "proof_id": "vault_proof_123"
        }
        
        # Créer 10 payloads avec des event.id différents
        payloads = []
        for i in range(10):
            payload = copy.deepcopy(sample_payload)
            payload["source"]["tenant"] = tenant_id  # Utiliser le même tenant
            payload["event"]["id"] = f"EVT-CONCURRENT-{i:03d}"
            payloads.append(payload)
        
        with patch("api.ingest.send_to_vault", new_callable=AsyncMock) as mock_vault:
            mock_vault.return_value = mock_vault_response
            
            # 10 requêtes rapides (séquentielles)
            responses = []
            for payload in payloads:
                response = client.post(
                    "/api/v1/ingest",
                    json=payload,
                    headers={"Authorization": f"Bearer {token}"}
                )
                responses.append(response)
            
            # Vérifications
            # 1. Toutes les réponses sont 200
            assert all(r.status_code == 200 for r in responses), \
                f"Certaines requêtes ont échoué : {[r.status_code for r in responses]}"
            
            # 2. Tous les proof_id sont différents
            proof_ids = [r.json()["proof_id"] for r in responses]
            unique_proof_ids = set(proof_ids)
            assert len(unique_proof_ids) == 10, \
                f"Pas assez de proof_id uniques : {len(unique_proof_ids)} au lieu de 10"
            
            # 3. Vérifier BDD : 10 preuves créées
            db_session.expire_all()
            proofs = db_session.query(Proof).filter_by(
                tenant=tenant_id,
                env="lab"
            ).all()
            # Filtrer par les event_id attendus
            expected_event_ids = {f"EVT-CONCURRENT-{i:03d}" for i in range(10)}
            actual_event_ids = {p.event_id for p in proofs}
            # On vérifie qu'on a au moins les 10 event_id attendus
            assert len(expected_event_ids.intersection(actual_event_ids)) == 10, \
                f"Pas toutes les preuves créées : {actual_event_ids}"
            
            # 4. Vérifier que tous les hash sont différents (événements différents)
            hashes = [r.json()["hash"] for r in responses]
            unique_hashes = set(hashes)
            assert len(unique_hashes) == 10, \
                f"Pas assez de hash uniques : {len(unique_hashes)} au lieu de 10"
    
    @pytest.mark.slow
    def test_ingest_concurrent_different_tenants(self, client, db_session, sample_payload):
        """
        Test : 10 requêtes rapides avec tenant différents
        Attendu : Isolation complète entre tenants, aucune collision
        
        ⚠️ NOTE : SQLite en mémoire n'est pas thread-safe.
        On utilise des requêtes séquentielles rapides.
        """
        # Créer 10 tokens pour 10 tenants différents
        tokens = []
        for i in range(10):
            tenant_id = f"tenant_{i:03d}"
            token = generate_and_store_token(tenant_id, "lab", "odoo", db_session)
            tokens.append((tenant_id, token))
        
        db_session.commit()
        db_session.expire_all()
        
        # Mock de send_to_vault
        mock_vault_response = {
            "status": "vaulted",
            "proof_id": "vault_proof_123"
        }
        
        # Créer 10 payloads avec des tenant différents
        payloads = []
        for i, (tenant_id, _) in enumerate(tokens):
            payload = copy.deepcopy(sample_payload)
            payload["source"]["tenant"] = tenant_id
            payload["event"]["id"] = f"EVT-TENANT-{i:03d}"
            payloads.append(payload)
        
        with patch("api.ingest.send_to_vault", new_callable=AsyncMock) as mock_vault:
            mock_vault.return_value = mock_vault_response
            
            # 10 requêtes rapides (séquentielles)
            responses = []
            for (tenant_id, token), payload in zip(tokens, payloads):
                response = client.post(
                    "/api/v1/ingest",
                    json=payload,
                    headers={"Authorization": f"Bearer {token}"}
                )
                responses.append(response)
            
            # Vérifications
            # 1. Toutes les réponses sont 200
            assert all(r.status_code == 200 for r in responses), \
                f"Certaines requêtes ont échoué : {[r.status_code for r in responses]}"
            
            # 2. Tous les proof_id sont différents
            proof_ids = [r.json()["proof_id"] for r in responses]
            unique_proof_ids = set(proof_ids)
            assert len(unique_proof_ids) == 10, \
                f"Pas assez de proof_id uniques : {len(unique_proof_ids)} au lieu de 10"
            
            # 3. Vérifier BDD : 10 preuves créées, une par tenant
            db_session.expire_all()
            for tenant_id, _ in tokens:
                proofs = db_session.query(Proof).filter_by(
                    tenant=tenant_id,
                    env="lab"
                ).all()
                assert len(proofs) >= 1, \
                    f"Aucune preuve créée pour tenant {tenant_id}"
            
            # 4. Vérifier isolation : pas de collision entre tenants
            all_proofs = db_session.query(Proof).filter_by(env="lab").all()
            tenant_proofs = {}
            for proof in all_proofs:
                if proof.tenant.startswith("tenant_"):
                    if proof.tenant not in tenant_proofs:
                        tenant_proofs[proof.tenant] = []
                    tenant_proofs[proof.tenant].append(proof)
            
            # Chaque tenant doit avoir au moins une preuve
            for tenant_id, _ in tokens:
                assert tenant_id in tenant_proofs, \
                    f"Tenant {tenant_id} n'a pas de preuve"
                assert len(tenant_proofs[tenant_id]) >= 1, \
                    f"Tenant {tenant_id} n'a pas assez de preuves"

