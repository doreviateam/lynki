# Dockerfile pour Odoo avec dépendances Python (PyJWT, requests)
# Base: odoo:18.0-20250819
# Usage: Utilisé dans docker-compose.yml pour installer PyJWT et requests
#
# Approche validée : installation dans l'environnement Python d'Odoo
# Compatible PEP 668 (Python 3.12+) et Docker

FROM odoo:18.0-20250819

USER root

# Installer python3-venv si nécessaire (pour créer l'environnement virtuel)
# Puis créer un environnement virtuel pour isoler les dépendances
# (Approche recommandée pour PEP 668)
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3-venv \
 && python3 -m venv /opt/odoo-venv \
 && /opt/odoo-venv/bin/pip install --upgrade pip \
 && /opt/odoo-venv/bin/pip install --no-cache-dir PyJWT>=2.8.0 requests>=2.31.0 python-barcode \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Ajouter le venv au PATH pour que Odoo utilise ces packages
ENV PATH="/opt/odoo-venv/bin:${PATH}"

# Vérifier l'installation
RUN python3 -c "import jwt; import requests; import barcode; print('✅ PyJWT, requests et python-barcode installés avec succès')"

USER odoo

