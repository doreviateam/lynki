"""
Point d'entrée principal pour DVIG
Sprint 3 - US-3.1
"""

import os
from flask import Flask
from flask_cors import CORS
from dvig.core.config import DvigConfig
from dvig.api.routes import register_routes


def create_app() -> Flask:
    """Crée et configure l'application Flask"""
    app = Flask(__name__)
    
    # Configuration CORS
    CORS(app)
    
    # Charger la configuration
    config = DvigConfig.from_env()
    app.config["DVIG_CONFIG"] = config
    
    # Enregistrer les routes
    register_routes(app)
    
    return app


def main():
    """Point d'entrée principal"""
    app = create_app()
    config = app.config["DVIG_CONFIG"]
    
    # Démarrer le serveur
    app.run(
        host=config.dvig_host,
        port=config.dvig_port,
        debug=config.dvig_log_level == "debug"
    )


if __name__ == "__main__":
    main()

