"""
Endpoint de healthcheck pour DVIG
Sprint 3 - US-3.1
"""

from flask import Blueprint, jsonify
from datetime import datetime

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    """
    Endpoint de healthcheck (liveness/readiness)
    
    Returns:
        JSON avec statut et timestamp
    """
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "dvig",
        "version": "0.1.0"
    }), 200

