"""
Tests d'intégration pour le reload des tokens
"""
import pytest
import tempfile
import os
import yaml
import signal
import time
import threading
from dvig.api_fastapi.auth.token_store import YamlTokenStore
from dvig.api_fastapi.auth.manager import TokenStoreManager


@pytest.fixture
def temp_tokens_file():
    """Crée un fichier tokens.yml temporaire"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
        yield f.name
    os.unlink(f.name)


@pytest.fixture
def initial_tokens_file(temp_tokens_file):
    """Crée un fichier tokens.yml initial"""
    data = {
        "version": 1,
        "tokens": [
            {
                "id": "tok_001",
                "token_hash": f"sha256:{'a' * 64}",
                "tenant": "rehtse",
                "univers": "odoo",
                "status": "active"
            }
        ]
    }
    with open(temp_tokens_file, 'w') as f:
        yaml.dump(data, f)
    return temp_tokens_file


def test_reload_atomic_swap(initial_tokens_file):
    """Test reload atomique (swap)"""
    store = YamlTokenStore(initial_tokens_file)
    
    # Vérifier token initial
    assert store.get_token_info('a' * 64) is not None
    
    # Modifier le fichier
    new_hash = 'b' * 64
    data = {
        "version": 1,
        "tokens": [
            {
                "id": "tok_002",
                "token_hash": f"sha256:{new_hash}",
                "tenant": "rehtse",
                "univers": "odoo",
                "status": "active"
            }
        ]
    }
    with open(initial_tokens_file, 'w') as f:
        yaml.dump(data, f)
    
    # Reload
    result = store.reload()
    assert result is True
    
    # Nouveau token présent
    assert store.get_token_info(new_hash) is not None
    # Ancien token absent
    assert store.get_token_info('a' * 64) is None


def test_reload_invalid_yaml_keeps_old(initial_tokens_file):
    """Test reload avec YAML invalide conserve ancien"""
    store = YamlTokenStore(initial_tokens_file)
    
    # Vérifier token initial
    assert store.get_token_info('a' * 64) is not None
    
    # Corrompre le fichier
    with open(initial_tokens_file, 'w') as f:
        f.write("invalid: yaml: [")
    
    # Reload doit échouer
    result = store.reload()
    assert result is False
    
    # Token initial doit toujours être présent
    assert store.get_token_info('a' * 64) is not None


def test_reload_interval(temp_tokens_file):
    """Test reload périodique (intervalle)"""
    # Créer fichier initial
    data = {
        "version": 1,
        "tokens": [
            {
                "id": "tok_001",
                "token_hash": f"sha256:{'a' * 64}",
                "tenant": "rehtse",
                "univers": "odoo",
                "status": "active"
            }
        ]
    }
    with open(temp_tokens_file, 'w') as f:
        yaml.dump(data, f)
    
    store = YamlTokenStore(temp_tokens_file)
    manager = TokenStoreManager(store, reload_interval=1, reload_on_sighup=False)
    
    # Démarrer auto-reload
    manager.start_auto_reload()
    
    # Attendre un peu
    time.sleep(0.5)
    
    # Modifier le fichier
    new_hash = 'b' * 64
    data["tokens"][0]["token_hash"] = f"sha256:{new_hash}"
    with open(temp_tokens_file, 'w') as f:
        yaml.dump(data, f)
    
    # Attendre reload (intervalle 1s)
    time.sleep(1.5)
    
    # Vérifier nouveau token chargé
    assert store.get_token_info(new_hash) is not None
    
    # Arrêter
    manager.stop_auto_reload()


def test_reload_sighup(temp_tokens_file):
    """Test reload sur SIGHUP (CORRECTION B2)"""
    # Note: Test SIGHUP nécessite processus séparé, test simplifié ici
    data = {
        "version": 1,
        "tokens": [
            {
                "id": "tok_001",
                "token_hash": f"sha256:{'a' * 64}",
                "tenant": "rehtse",
                "univers": "odoo",
                "status": "active"
            }
        ]
    }
    with open(temp_tokens_file, 'w') as f:
        yaml.dump(data, f)
    
    store = YamlTokenStore(temp_tokens_file)
    manager = TokenStoreManager(store, reload_interval=0, reload_on_sighup=True)
    
    # Enregistrer handler (simule startup)
    manager.register_sighup_handler()
    
    # Modifier fichier
    new_hash = 'b' * 64
    data["tokens"][0]["token_hash"] = f"sha256:{new_hash}"
    with open(temp_tokens_file, 'w') as f:
        yaml.dump(data, f)
    
    # Simuler SIGHUP (si disponible)
    try:
        # Note: En test, on peut appeler directement _handle_sighup
        manager._handle_sighup(signal.SIGHUP, None)
        
        # Vérifier reload
        assert store.get_token_info(new_hash) is not None
    except (ValueError, OSError):
        # SIGHUP non disponible (Windows)
        pytest.skip("SIGHUP non disponible sur cette plateforme")

