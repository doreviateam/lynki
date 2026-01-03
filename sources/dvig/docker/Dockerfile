# Dockerfile pour DVIG
# Sprint 3 - US-3.3
# Version : 1.0

FROM python:3.11-slim

# Métadonnées
LABEL maintainer="Dorevia Team"
LABEL description="Dorevia Vault Integration Gateway"
LABEL version="0.1.2"

# Variables d'environnement
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Répertoire de travail
WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements et installer dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY dvig/ ./dvig/
COPY config/ ./config/

# Créer l'utilisateur non-root
RUN useradd -m -u 1000 dvig && \
    chown -R dvig:dvig /app

# Passer à l'utilisateur non-root
USER dvig

# Exposer le port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD curl -f http://localhost:8080/health || exit 1

# Commande par défaut (FastAPI)
CMD ["python", "-m", "dvig.api_fastapi"]

