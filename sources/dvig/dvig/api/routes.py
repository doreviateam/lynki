"""
Routes principales de l'API DVIG
Sprint 3 - US-3.1
"""

from flask import Flask
from dvig.api.health import health_bp


def register_routes(app: Flask):
    """
    Enregistre toutes les routes de l'API
    
    Args:
        app: Instance Flask
    """
    app.register_blueprint(health_bp)

