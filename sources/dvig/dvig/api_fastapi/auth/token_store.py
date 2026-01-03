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
import time
import logging
import re

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
            TokenInfo si trouvé (peut être disabled/revoked), None si non trouvé
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
        """
        Vérifie si le store est disponible (fichier lisible, parse OK).
        
        Note: Ne dépend PAS du nombre de tokens actifs.
        """
        pass


class YamlTokenStore(TokenStore):
    """Implémentation YAML (défaut P1)"""
    
    # Regex pour valider format hash (64 caractères hex)
    HASH_REGEX = re.compile(r'^[0-9a-f]{64}$', re.IGNORECASE)
    
    def __init__(self, file_path: str, retry_count: int = 3, retry_delay: float = 1.0):
        """
        Initialise le store YAML avec retry pour gérer le timing du montage Docker.
        
        Args:
            file_path: Chemin vers le fichier YAML
            retry_count: Nombre de tentatives de chargement
            retry_delay: Délai entre les tentatives (secondes)
        """
        self.file_path = file_path
        self._tokens: Dict[str, TokenInfo] = {}  # token_hash -> TokenInfo
        self._lock = threading.RLock()
        self._available = False
        
        # Chargement initial avec retry
        for attempt in range(retry_count):
            if self.reload():
                # Succès
                break
            elif attempt < retry_count - 1:
                # Échec, mais on peut réessayer
                log.warning(f"Tentative {attempt + 1}/{retry_count} échouée, retry dans {retry_delay}s...")
                time.sleep(retry_delay)
            else:
                # Dernière tentative échouée
                log.error(f"Échec chargement initial après {retry_count} tentatives")
    
    def _normalize_hash(self, hash_str: str) -> Optional[str]:
        """
        Normalise le hash (enlève préfixe sha256:, valide format).
        
        Returns:
            Hash normalisé (64 hex) ou None si invalide
        """
        # Enlever préfixe sha256: si présent
        if hash_str.startswith('sha256:'):
            hash_str = hash_str[7:]
        
        # Valider format (64 caractères hex)
        if not self.HASH_REGEX.match(hash_str):
            return None
        
        return hash_str.lower()  # Normaliser en minuscules
    
    def _load_yaml(self) -> Optional[Dict[str, TokenInfo]]:
        """
        Charge et parse le fichier YAML.
        
        Returns:
            Dict[token_hash, TokenInfo] si succès, None si erreur
        """
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            if not data or 'tokens' not in data:
                log.warning("YAML invalide: pas de clé 'tokens'")
                return {}  # YAML valide mais vide
            
            tokens = {}
            for token_data in data['tokens']:
                try:
                    # Extraire et normaliser le hash
                    token_hash_str = token_data.get('token_hash', '')
                    token_hash = self._normalize_hash(token_hash_str)
                    
                    if not token_hash:
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
            return None  # Erreur critique
        except yaml.YAMLError as e:
            log.error(f"Erreur parsing YAML: {e}")
            return None  # Erreur critique
        except Exception as e:
            log.error(f"Erreur chargement YAML: {e}")
            return None  # Erreur critique
    
    def _parse_datetime(self, dt_str: Optional[str]) -> Optional[datetime]:
        """Parse datetime ISO8601"""
        if not dt_str:
            return None
        try:
            return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return None
    
    def get_token_info(self, token_hash: str) -> Optional[TokenInfo]:
        """
        Recherche un token par son hash.
        
        Returns:
            TokenInfo si trouvé (peut être disabled/revoked), None si non trouvé
        """
        with self._lock:
            return self._tokens.get(token_hash)
    
    def reload(self) -> bool:
        """Recharge le store (atomique)"""
        new_tokens = self._load_yaml()
        
        with self._lock:
            # available = True si fichier lisible + parse OK (même si 0 token)
            if new_tokens is not None:  # new_tokens peut être {} (vide mais valide)
                self._tokens = new_tokens
                self._available = True
                log.info(f"Tokens rechargés: {len(new_tokens)} tokens chargés")
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
        """
        Vérifie si le store est disponible (fichier lisible, parse OK).
        
        Note: Ne dépend PAS du nombre de tokens actifs.
        """
        with self._lock:
            return self._available

