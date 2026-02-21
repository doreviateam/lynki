# -*- coding: utf-8 -*-
"""
Helper centralisé pour la vérification JWS (JSON Web Signature)

Ce module gère de manière robuste la vérification JWS avec PyJWT,
en gérant gracieusement l'absence de PyJWT (mode non bloquant).

Pattern anti-crash : Tous les appels à PyJWT sont protégés.
"""

import logging

_logger = logging.getLogger(__name__)

# Import optionnel de PyJWT
try:
    import jwt
    from jwt import PyJWKClient
    JWT_AVAILABLE = True
except ImportError:
    jwt = None
    PyJWKClient = None
    JWT_AVAILABLE = False
    _logger.info("PyJWT non disponible : vérification JWS désactivée (mode non bloquant)")


def is_jws_available():
    """
    Vérifie si PyJWT est disponible pour la vérification JWS
    
    Returns:
        bool: True si PyJWT est installé, False sinon
    """
    return JWT_AVAILABLE


def verify_jws_with_jwks(jws_token, jwks_url, algorithms=None, options=None):
    """
    Vérifie un token JWS en récupérant les clés publiques depuis un JWKS
    
    Cette fonction est non bloquante :
    - Si PyJWT n'est pas disponible, retourne True (accepte le token)
    - Si la vérification échoue, retourne False (mais ne bloque pas le traitement)
    
    Args:
        jws_token (str): Token JWS à vérifier
        jwks_url (str): URL du JWKS (JSON Web Key Set)
        algorithms (list): Liste des algorithmes acceptés (défaut: ['RS256'])
        options (dict): Options de vérification PyJWT (défaut: vérification signature uniquement)
    
    Returns:
        bool: True si valide ou PyJWT non disponible, False si invalide
    """
    if not JWT_AVAILABLE:
        _logger.warning(
            "JWS désactivé : PyJWT non installé. "
            "Le constat sera accepté sans vérification cryptographique (mode non bloquant)."
        )
        return True  # Non bloquant : accepte le token si PyJWT absent
    
    if not jws_token:
        _logger.debug("JWS token vide, vérification ignorée")
        return True
    
    if not jwks_url:
        _logger.warning("JWKS URL non configurée, impossible de vérifier JWS")
        return False  # Échec si configuré mais URL manquante
    
    # Valeurs par défaut
    if algorithms is None:
        algorithms = ['RS256']  # Algorithme utilisé par le Vault
    
    if options is None:
        options = {
            'verify_signature': True,
            'verify_exp': False,  # Ne pas vérifier l'expiration (constat peut être ancien)
            'verify_nbf': False,
        }
    
    try:
        # Récupérer les clés publiques depuis JWKS
        jwks_client = PyJWKClient(jwks_url)
        
        # Récupérer la clé de signature depuis le token
        signing_key = jwks_client.get_signing_key_from_jwt(jws_token)
        
        # Vérifier la signature
        jwt.decode(
            jws_token,
            signing_key.key,
            algorithms=algorithms,
            options=options
        )
        
        _logger.info("JWS vérifié avec succès")
        return True
        
    except jwt.InvalidTokenError as e:
        _logger.warning("JWS invalide : %s", str(e))
        return False
    except Exception as e:
        _logger.error("Erreur lors de la vérification JWS : %s", str(e), exc_info=True)
        return False


def verify_jws_with_key(jws_token, public_key, algorithms=None, options=None):
    """
    Vérifie un token JWS avec une clé publique directe
    
    Args:
        jws_token (str): Token JWS à vérifier
        public_key: Clé publique (format dépendant de l'algorithme)
        algorithms (list): Liste des algorithmes acceptés (défaut: ['RS256'])
        options (dict): Options de vérification PyJWT
    
    Returns:
        bool: True si valide ou PyJWT non disponible, False si invalide
    """
    if not JWT_AVAILABLE:
        _logger.warning("JWS désactivé : PyJWT non installé (mode non bloquant)")
        return True
    
    if not jws_token:
        return True
    
    if algorithms is None:
        algorithms = ['RS256']
    
    if options is None:
        options = {
            'verify_signature': True,
            'verify_exp': False,
            'verify_nbf': False,
        }
    
    try:
        jwt.decode(jws_token, public_key, algorithms=algorithms, options=options)
        _logger.info("JWS vérifié avec succès (clé directe)")
        return True
    except jwt.InvalidTokenError as e:
        _logger.warning("JWS invalide : %s", str(e))
        return False
    except Exception as e:
        _logger.error("Erreur lors de la vérification JWS : %s", str(e), exc_info=True)
        return False

