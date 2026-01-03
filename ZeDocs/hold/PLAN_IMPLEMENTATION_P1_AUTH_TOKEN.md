# 🚀 Plan d'Implémentation Détaillé - P1 Auth/Token DVIG

**Version** : v1.0  
**Date** : 2025-01-28  
**Statut** : Ready-to-implement  
**Base** : `SPEC_DVIG_FastAPI_P1_Auth_Token_v1.0.md` + Note d'Architecture v1.1

---

## 📋 Vue d'Ensemble

Ce plan détaille l'implémentation complète de l'authentification par token pour DVIG FastAPI (P1), en suivant la spécification et les préconisations d'architecture validées.

**Durée estimée** : 5-7 jours ouvrés  
**Complexité** : Moyenne  
**Dépendances** : P0 complété ✅

---

## 🎯 Objectifs d'Implémentation

- ✅ Authentification Bearer Token sur `/ingest`
- ✅ Backend YAML pour stockage tokens (défaut)
- ✅ Validation source/univers
- ✅ Format erreurs standardisé
- ✅ Reload tokens (SIGHUP + intervalle)
- ✅ Logs structurés
- ✅ CLI génération tokens
- ✅ Tests complets

---

## 📁 Structure de Fichiers Cible

```
sources/dvig/
├── dvig/
│   └── api_fastapi/
│       ├── auth/                    # NOUVEAU
│       │   ├── __init__.py
│       │   ├── token_store.py      # Interface + YamlTokenStore
│       │   ├── auth.py              # Dependency FastAPI
│       │   └── manager.py          # TokenStoreManager (reload)
│       ├── routes/
│       │   ├── ingest.py            # MODIFIER (ajout auth)
│       │   └── health.py            # MODIFIER (option protégé)
│       └── app.py                   # MODIFIER (config auth)
├── cli/                              # NOUVEAU
│   ├── __init__.py
│   └── token_gen.py                 # CLI génération tokens
├── config/
│   └── tokens.example.yml           # NOUVEAU (exemple)
├── tests/
│   ├── unit/
│   │   ├── test_token_store.py     # NOUVEAU
│   │   ├── test_auth.py            # NOUVEAU
│   │   └── test_source_validation.py  # NOUVEAU
│   └── integration/
│       ├── test_ingest_auth.py     # NOUVEAU
│       └── test_token_reload.py    # NOUVEAU
└── requirements.txt                  # MODIFIER (ajout pyyaml, structlog)
```

---

## 🔧 Phase 1 : Infrastructure de Base (2 jours)

### Étape 1.1 : Interface TokenStore

**Fichier** : `dvig/api_fastapi/auth/token_store.py`

**Objectif** : Créer l'interface abstraite et l'implémentation YAML

**Code** :

```python
"""
Token Store - Interface abstraite et implémentation YAML
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict
from dataclasses import dataclass
from datetime import datetime
import yaml
import hashlib
import threading
import logging

log = logging.getLogger("dvig.auth.store")

@dataclass
class TokenInfo:
    """Information d'un token"""
    id: str
    tenant: str
    univers: str
    status: str  # active|disabled|revoked
    created_at: Optional[datetime] = None
    rotated_at: Optional[datetime] = None
    comment: Optional[str] = None


class TokenStore(ABC):
    """Interface abstraite pour le stockage de tokens"""
    
    @abstractmethod
    def get_token_info(self, token_hash: str) -> Optional[TokenInfo]:
        """
        Recherche un token par son hash.
        
        Args:
            token_hash: Hash SHA-256 du token (format: hex sans préfixe)
        
        Returns:
            TokenInfo si trouvé et actif, None sinon
        """
        pass
    
    @abstractmethod
    def reload(self) -> bool:
        """
        Recharge le store (atomique).
        
        Returns:
            True si reload réussi, False sinon
        """
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Vérifie si le store est disponible"""
        pass


class YamlTokenStore(TokenStore):
    """Implémentation YAML (défaut P1)"""
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self._tokens: Dict[str, TokenInfo] = {}  # token_hash -> TokenInfo
        self._lock = threading.RLock()
        self._available = False
        
        # Chargement initial
        self.reload()
    
    def _load_yaml(self) -> Dict[str, TokenInfo]:
        """Charge et parse le fichier YAML"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            if not data or 'tokens' not in data:
                log.warning("YAML invalide: pas de clé 'tokens'")
                return {}
            
            tokens = {}
            for token_data in data['tokens']:
                try:
                    # Extraire le hash (format: sha256:hex ou hex)
                    token_hash_str = token_data.get('token_hash', '')
                    if token_hash_str.startswith('sha256:'):
                        token_hash = token_hash_str[7:]  # Enlever préfixe
                    else:
                        token_hash = token_hash_str
                    
                    # Valider format hash (64 caractères hex)
                    if len(token_hash) != 64:
                        log.warning(f"Token {token_data.get('id')} hash invalide, ignoré")
                        continue
                    
                    # Créer TokenInfo
                    token_info = TokenInfo(
                        id=token_data.get('id', ''),
                        tenant=token_data.get('tenant', ''),
                        univers=token_data.get('univers', ''),
                        status=token_data.get('status', 'disabled'),
                        created_at=self._parse_datetime(token_data.get('created_at')),
                        rotated_at=self._parse_datetime(token_data.get('rotated_at')),
                        comment=token_data.get('comment')
                    )
                    
                    # Validation champs obligatoires
                    if not token_info.id or not token_info.tenant or not token_info.univers:
                        log.warning(f"Token {token_data.get('id')} champs manquants, ignoré")
                        continue
                    
                    tokens[token_hash] = token_info
                    
                except Exception as e:
                    log.warning(f"Erreur parsing token {token_data.get('id')}: {e}")
                    continue
            
            return tokens
            
        except FileNotFoundError:
            log.error(f"Fichier tokens non trouvé: {self.file_path}")
            return {}
        except yaml.YAMLError as e:
            log.error(f"Erreur parsing YAML: {e}")
            return {}
        except Exception as e:
            log.error(f"Erreur chargement YAML: {e}")
            return {}
    
    def _parse_datetime(self, dt_str: Optional[str]) -> Optional[datetime]:
        """Parse datetime ISO8601"""
        if not dt_str:
            return None
        try:
            return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return None
    
    def get_token_info(self, token_hash: str) -> Optional[TokenInfo]:
        """Recherche un token par son hash"""
        with self._lock:
            token_info = self._tokens.get(token_hash)
            
            if not token_info:
                return None
            
            # Vérifier statut
            if token_info.status != 'active':
                return None
            
            return token_info
    
    def reload(self) -> bool:
        """Recharge le store (atomique)"""
        new_tokens = self._load_yaml()
        
        with self._lock:
            if new_tokens:
                self._tokens = new_tokens
                self._available = True
                log.info(f"Tokens rechargés: {len(new_tokens)} tokens actifs")
                return True
            else:
                # Si erreur mais store existant, garder l'ancien
                if self._tokens:
                    log.warning("Reload échoué, conservation tokens existants")
                    return False
                else:
                    # Premier chargement échoué
                    self._available = False
                    log.error("Impossible de charger les tokens")
                    return False
    
    def is_available(self) -> bool:
        """Vérifie si le store est disponible"""
        with self._lock:
            return self._available and len(self._tokens) > 0
```

---

### Étape 1.2 : TokenStoreManager (Reload)

**Fichier** : `dvig/api_fastapi/auth/manager.py`

**Objectif** : Gérer le reload automatique (SIGHUP + intervalle)

**Code** :

```python
"""
Token Store Manager - Gestion du reload automatique
"""
import signal
import threading
import time
import logging
from typing import Optional
from .token_store import TokenStore

log = logging.getLogger("dvig.auth.manager")


class TokenStoreManager:
    """Gère le reload automatique du TokenStore"""
    
    def __init__(self, store: TokenStore, reload_interval: int = 60):
        self.store = store
        self.reload_interval = reload_interval
        self._reload_thread: Optional[threading.Thread] = None
        self._running = False
        
        # SIGHUP handler
        signal.signal(signal.SIGHUP, self._handle_sighup)
    
    def _handle_sighup(self, signum, frame):
        """Reload immédiat sur SIGHUP"""
        log.info("SIGHUP reçu, reload immédiat")
        self._reload()
    
    def _reload(self) -> bool:
        """Reload atomique"""
        return self.store.reload()
    
    def start_auto_reload(self):
        """Démarre le reload périodique"""
        if self.reload_interval > 0:
            self._running = True
            self._reload_thread = threading.Thread(
                target=self._reload_loop,
                daemon=True,
                name="TokenStoreReload"
            )
            self._reload_thread.start()
            log.info(f"Auto-reload démarré (intervalle: {self.reload_interval}s)")
    
    def _reload_loop(self):
        """Boucle de reload périodique"""
        while self._running:
            time.sleep(self.reload_interval)
            if self._running:
                self._reload()
    
    def stop_auto_reload(self):
        """Arrête le reload périodique"""
        self._running = False
        if self._reload_thread:
            self._reload_thread.join(timeout=5)
            log.info("Auto-reload arrêté")
```

---

### Étape 1.3 : Dependency FastAPI Auth

**Fichier** : `dvig/api_fastapi/auth/auth.py`

**Objectif** : Créer la dépendance FastAPI pour validation token

**Code** :

```python
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
security = HTTPBearer()


@dataclass
class AuthInfo:
    """Information d'authentification injectée dans le contexte"""
    tenant: str
    univers: str
    token_id: str


def constant_time_compare(hash1: str, hash2: str) -> bool:
    """Comparaison constant-time pour éviter timing attacks"""
    return secrets.compare_digest(hash1, hash2)


def validate_source_univers(source: str, univers: str) -> bool:
    """
    Valide que source correspond à univers.
    
    Règle: source MUST start with "<univers>."
    """
    if not source.startswith(f"{univers}."):
        return False
    return True


async def get_auth_info(
    credentials: HTTPAuthorizationCredentials = Security(security),
    token_store: TokenStore = Depends(get_token_store)
) -> AuthInfo:
    """
    Valide le token Bearer et retourne les informations d'authentification.
    
    Raises:
        HTTPException: 401 si token invalide, 503 si backend indisponible
    """
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


# Dependency pour obtenir le TokenStore (à injecter depuis app.py)
_token_store: Optional[TokenStore] = None
_token_store_manager: Optional[TokenStoreManager] = None


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


def init_token_store(store: TokenStore, manager: TokenStoreManager):
    """Initialise le token store (appelé depuis app.py)"""
    global _token_store, _token_store_manager
    _token_store = store
    _token_store_manager = manager
```

---

### Étape 1.4 : Validation Source/Univers

**Fichier** : `dvig/api_fastapi/auth/validation.py`

**Objectif** : Fonction de validation source/univers

**Code** :

```python
"""
Validation métier - Source vs Univers
"""
from fastapi import HTTPException
from .auth import AuthInfo


def validate_source_univers(source: str, auth_info: AuthInfo) -> None:
    """
    Valide que source correspond à univers du token.
    
    Règle: source MUST start with "<univers>."
    
    Raises:
        HTTPException: 403 si mismatch
    """
    if not source.startswith(f"{auth_info.univers}."):
        raise HTTPException(
            status_code=403,
            detail={
                "status": "error",
                "error": {
                    "code": "UNIVERSE_MISMATCH",
                    "message": f"Source '{source}' ne correspond pas à l'univers '{auth_info.univers}'"
                }
            }
        )
```

---

## 🔧 Phase 2 : Intégration Routes (1 jour)

### Étape 2.1 : Modifier routes/ingest.py

**Fichier** : `dvig/api_fastapi/routes/ingest.py`

**Modifications** :

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from datetime import datetime, timezone
import logging
import uuid
import structlog

from ..auth.auth import get_auth_info, AuthInfo
from ..auth.validation import validate_source_univers

log = structlog.get_logger("dvig.ingest")
router = APIRouter()

class IngestEvent(BaseModel):
    event_type: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)
    timestamp: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)

def normalize_timestamp(ts_str: Optional[str]) -> str:
    """Normalise un timestamp ISO8601 ou génère un nouveau."""
    if ts_str:
        try:
            dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat()
        except (ValueError, AttributeError):
            log.warning("Invalid timestamp format, generating new one")
            return datetime.now(timezone.utc).isoformat()
    return datetime.now(timezone.utc).isoformat()

@router.post("/ingest", status_code=201)
def ingest(
    evt: IngestEvent,
    auth_info: AuthInfo = Depends(get_auth_info)  # ✅ AJOUTÉ
):
    """
    Endpoint d'ingestion d'événements (P1 avec auth).
    
    Accepte l'événement, le log, et retourne immédiatement.
    Le branchement vers Vault sera fait dans une phase ultérieure.
    """
    # ✅ Validation source/univers
    validate_source_univers(evt.source, auth_info)
    
    # Normalisation du timestamp
    ts = normalize_timestamp(evt.timestamp)
    
    # Génération de l'event_id (UUID)
    event_id = str(uuid.uuid4())
    
    # ✅ Log structuré avec tenant/univers
    log.info(
        "ingest_event_accepted",
        event_id=event_id,
        tenant=auth_info.tenant,
        univers=auth_info.univers,
        source=evt.source,
        event_type=evt.event_type,
        timestamp=ts,
        data_keys=list(evt.data.keys())
    )
    
    # Réponse conforme à la spécification
    return {
        "status": "accepted",
        "event_id": event_id,
        "ts": ts
    }
```

---

### Étape 2.2 : Modifier routes/health.py

**Fichier** : `dvig/api_fastapi/routes/health.py`

**Modifications** :

```python
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import os
from ..auth.auth import get_auth_info, AuthInfo

router = APIRouter()

# Variable d'environnement pour protéger /health
HEALTH_PROTECTED = os.getenv("DVIG_HEALTH_PROTECTED", "0") == "1"

@router.get("/health")
def health(
    auth_info: AuthInfo = Depends(get_auth_info) if HEALTH_PROTECTED else None
):
    """
    Health check endpoint.
    
    Public par défaut, protégé si DVIG_HEALTH_PROTECTED=1
    """
    return {
        "service": "dvig",
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "0.1.1",
    }
```

---

### Étape 2.3 : Modifier app.py

**Fichier** : `dvig/api_fastapi/app.py`

**Modifications** :

```python
from fastapi import FastAPI
import os
import logging

from dvig.api_fastapi.routes.health import router as health_router
from dvig.api_fastapi.routes.ingest import router as ingest_router
from dvig.api_fastapi.auth.token_store import YamlTokenStore
from dvig.api_fastapi.auth.manager import TokenStoreManager
from dvig.api_fastapi.auth.auth import init_token_store

log = logging.getLogger("dvig.app")

def create_app() -> FastAPI:
    app = FastAPI(
        title="DVIG - Dorevia Vault Integration Gateway",
        version="0.1.1",
    )
    
    # Configuration auth
    auth_enabled = os.getenv("DVIG_AUTH_ENABLED", "1") == "1"
    
    if auth_enabled:
        # Initialiser TokenStore
        tokens_file = (
            os.getenv("DVIG_TOKENS_FILE") or
            "/etc/dvig/tokens.yml" or
            "./conf/tokens.yml"
        )
        
        reload_interval = int(os.getenv("DVIG_TOKENS_RELOAD_INTERVAL", "60"))
        
        store = YamlTokenStore(tokens_file)
        manager = TokenStoreManager(store, reload_interval)
        manager.start_auto_reload()
        
        init_token_store(store, manager)
        
        log.info(f"Auth activée (tokens: {tokens_file})")
    else:
        log.warning("Auth désactivée (DVIG_AUTH_ENABLED=0)")
    
    # Routes
    app.include_router(health_router, tags=["health"])
    app.include_router(ingest_router, tags=["ingest"])
    
    # Configuration docs/openapi
    docs_enabled = os.getenv("DVIG_DOCS_ENABLED", "1") == "1"
    openapi_enabled = os.getenv("DVIG_OPENAPI_ENABLED", "1") == "1"
    
    if not docs_enabled:
        # Désactiver /docs
        @app.get("/docs")
        def docs_disabled():
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=404,
                content={"detail": "Not Found"}
            )
    
    if not openapi_enabled:
        # Désactiver /openapi.json
        @app.get("/openapi.json")
        def openapi_disabled():
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=404,
                content={"detail": "Not Found"}
            )
    
    return app

app = create_app()
```

---

## 🔧 Phase 3 : CLI Token Generation (0.5 jour)

### Étape 3.1 : Créer cli/token_gen.py

**Fichier** : `dvig/cli/token_gen.py`

**Code** :

```python
"""
CLI de génération de tokens DVIG
"""
import click
import secrets
import base64
import hashlib
from datetime import datetime

@click.command()
@click.option('--tenant', required=True, help='Tenant ID (ex: rehtse)')
@click.option('--univers', required=True, help='Univers (ex: odoo, sylius)')
@click.option('--output', type=click.Choice(['token', 'hash', 'yaml']), default='token',
              help='Format de sortie')
def generate(tenant: str, univers: str, output: str):
    """Génère un token DVIG"""
    # Générer token
    raw = secrets.token_bytes(32)
    token = "dvig_" + base64.urlsafe_b64encode(raw).rstrip(b"=").decode()
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    token_id = f"tok_{secrets.token_hex(4)}"
    
    if output == 'token':
        click.echo(f"TOKEN={token}")
        click.echo(f"HASH=sha256:{token_hash}")
    elif output == 'hash':
        click.echo(f"sha256:{token_hash}")
    elif output == 'yaml':
        click.echo(f"""
- id: "{token_id}"
  token_hash: "sha256:{token_hash}"
  tenant: "{tenant}"
  univers: "{univers}"
  status: "active"
  created_at: "{datetime.now(timezone.utc).isoformat()}"
  comment: "Generated {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
""")

if __name__ == '__main__':
    generate()
```

---

### Étape 3.2 : Ajouter entry point setup.py

**Fichier** : `setup.py` (modifier)

**Ajout** :

```python
entry_points={
    'console_scripts': [
        'dvig-token-gen=dvig.cli.token_gen:generate',
    ],
}
```

---

## 🧪 Phase 4 : Tests (2 jours)

### Étape 4.1 : Tests Unitaires TokenStore

**Fichier** : `tests/unit/test_token_store.py`

**Tests à créer** :
- `test_yaml_load_success`
- `test_yaml_load_file_not_found`
- `test_yaml_load_invalid_yaml`
- `test_yaml_load_invalid_token`
- `test_get_token_info_active`
- `test_get_token_info_disabled`
- `test_get_token_info_not_found`
- `test_reload_atomic`
- `test_reload_invalid_yaml_keeps_old`

---

### Étape 4.2 : Tests Unitaires Auth

**Fichier** : `tests/unit/test_auth.py`

**Tests à créer** :
- `test_get_auth_info_success`
- `test_get_auth_info_missing_header`
- `test_get_auth_info_invalid_token`
- `test_get_auth_info_revoked_token`
- `test_get_auth_info_backend_unavailable`
- `test_constant_time_compare`

---

### Étape 4.3 : Tests Validation Source/Univers

**Fichier** : `tests/unit/test_source_validation.py`

**Tests à créer** :
- `test_validate_source_univers_success`
- `test_validate_source_univers_mismatch`
- `test_validate_source_univers_empty`

---

### Étape 4.4 : Tests Intégration

**Fichier** : `tests/integration/test_ingest_auth.py`

**Tests à créer** :
- `test_ingest_with_valid_token`
- `test_ingest_without_token_401`
- `test_ingest_with_invalid_token_401`
- `test_ingest_source_univers_mismatch_403`
- `test_ingest_revoked_token_401`
- `test_ingest_backend_unavailable_503`

---

### Étape 4.5 : Tests Reload

**Fichier** : `tests/integration/test_token_reload.py`

**Tests à créer** :
- `test_reload_sighup`
- `test_reload_interval`
- `test_reload_invalid_yaml_keeps_old`
- `test_reload_atomic_swap`

---

## 📝 Phase 5 : Configuration & Documentation (0.5 jour)

### Étape 5.1 : Créer tokens.example.yml

**Fichier** : `config/tokens.example.yml`

**Contenu** :

```yaml
version: 1
# Tokens DVIG - Ne jamais commiter les tokens bruts
# Format: token_hash = SHA-256(token_brut)
# Générer avec: dvig-token-gen --tenant <tenant> --univers <univers> --output yaml

tokens:
  - id: "tok_001"
    token_hash: "sha256:3b6c8f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8"
    tenant: "rehtse"
    univers: "odoo"
    status: "active"
    created_at: "2025-01-28T00:00:00Z"
    comment: "Odoo LAB rehtse"
  
  - id: "tok_002"
    token_hash: "sha256:9a10b11c12d13e14f15a16b17c18d19e20f21a22b23c24d25e26f27a28b29c"
    tenant: "rehtse"
    univers: "odoo"
    status: "active"
    created_at: "2025-01-28T10:00:00Z"
    rotated_at: "2025-01-28T10:00:00Z"
    comment: "Rotation token (new)"
```

---

### Étape 5.2 : Mettre à jour requirements.txt

**Fichier** : `requirements.txt`

**Ajouts** :

```
pyyaml>=6.0
structlog>=23.1.0
click>=8.0.0
```

---

### Étape 5.3 : Mettre à jour README

**Fichier** : `README_FASTAPI_P0.md` → `README_FASTAPI_P1.md`

**Ajouts** :
- Section Authentification
- Section Configuration Tokens
- Section CLI token-gen
- Exemples avec auth

---

## ✅ Checklist de Validation

### Code
- [ ] Interface TokenStore créée
- [ ] YamlTokenStore implémenté
- [ ] TokenStoreManager implémenté
- [ ] Dependency FastAPI auth créée
- [ ] Validation source/univers implémentée
- [ ] Routes modifiées (ingest, health)
- [ ] app.py configuré
- [ ] CLI token-gen créé

### Tests
- [ ] Tests unitaires TokenStore (9+ tests)
- [ ] Tests unitaires Auth (6+ tests)
- [ ] Tests validation source/univers (3+ tests)
- [ ] Tests intégration ingest (6+ tests)
- [ ] Tests reload (4+ tests)
- [ ] Couverture > 80%

### Configuration
- [ ] tokens.example.yml créé
- [ ] requirements.txt mis à jour
- [ ] Variables d'environnement documentées
- [ ] README mis à jour

### Documentation
- [ ] README P1 créé
- [ ] Guide d'intégration Odoo
- [ ] Guide de génération tokens
- [ ] Guide de déploiement

---

## 🚀 Déploiement

### Étape 1 : Préparation

```bash
# Générer tokens
dvig-token-gen --tenant rehtse --univers odoo --output yaml >> config/tokens.yml

# Vérifier format
cat config/tokens.yml
```

### Étape 2 : Configuration

```bash
# Variables d'environnement
export DVIG_AUTH_ENABLED=1
export DVIG_TOKENS_FILE=/etc/dvig/tokens.yml
export DVIG_TOKENS_RELOAD_INTERVAL=60
export DVIG_HEALTH_PROTECTED=0
export DVIG_DOCS_ENABLED=1
export DVIG_OPENAPI_ENABLED=1
```

### Étape 3 : Déploiement

```bash
# Build Docker
docker build -f docker/Dockerfile -t dorevia/dvig:0.1.2-auth .

# Test local
docker run -p 18120:8080 \
  -v $(pwd)/config/tokens.yml:/etc/dvig/tokens.yml:ro \
  -e DVIG_AUTH_ENABLED=1 \
  dorevia/dvig:0.1.2-auth
```

### Étape 4 : Validation

```bash
# Test avec token valide
TOKEN="dvig_xxxxx"
curl -X POST http://localhost:18120/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.lab.core","data":{}}'

# Test sans token (401)
curl -X POST http://localhost:18120/ingest \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.lab.core","data":{}}'
```

---

## 📊 Estimation

| Phase | Durée | Complexité |
|-------|-------|------------|
| Phase 1 : Infrastructure | 2 jours | Moyenne |
| Phase 2 : Intégration | 1 jour | Faible |
| Phase 3 : CLI | 0.5 jour | Faible |
| Phase 4 : Tests | 2 jours | Moyenne |
| Phase 5 : Config/Doc | 0.5 jour | Faible |
| **Total** | **6 jours** | **Moyenne** |

---

## 🎯 Critères d'Acceptation (DoD)

### Fonctionnel
- [ ] `POST /ingest` avec token valide → 201
- [ ] `POST /ingest` sans token → 401
- [ ] `POST /ingest` token invalide → 401
- [ ] `POST /ingest` source/univers mismatch → 403
- [ ] Logs contiennent tenant + univers + event_id
- [ ] Reload tokens fonctionne (SIGHUP + intervalle)

### Non-fonctionnel
- [ ] Aucun token brut dans les logs
- [ ] Constant-time comparison implémenté
- [ ] Reload atomique (pas de downtime)
- [ ] Tests couverture > 80%
- [ ] Documentation complète

---

**Fin du plan d'implémentation**  
*Document créé le 2025-01-28*

