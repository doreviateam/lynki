# Makefile pour DVIG
# Sprint 3 - US-3.1, US-3.3

.PHONY: help install test lint format clean docker-build docker-run docker-push

help:
	@echo "Commandes disponibles :"
	@echo "  make install      - Installer les dépendances"
	@echo "  make test         - Lancer les tests"
	@echo "  make lint         - Lancer le linting"
	@echo "  make format       - Formater le code"
	@echo "  make clean        - Nettoyer les fichiers générés"
	@echo "  make docker-build - Build l'image Docker"
	@echo "  make docker-run   - Lancer le conteneur Docker"
	@echo "  make docker-push  - Push l'image vers le registry"

install:
	pip install -r requirements.txt

test:
	pytest tests/unit/ -v --cov=dvig --cov-report=html

lint:
	flake8 dvig/ tests/
	mypy dvig/

format:
	black dvig/ tests/

clean:
	rm -rf __pycache__ .pytest_cache .coverage htmlcov/
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type f -name "*.pyc" -delete

docker-build:
	@echo "🏗️  Build de l'image Docker..."
	docker build -f docker/Dockerfile -t dorevia/dvig:latest .
	@echo "✅ Image buildée : dorevia/dvig:latest"

docker-run:
	@echo "🚀 Lancement du conteneur Docker..."
	docker run -d \
		-p 8080:8080 \
		-e VAULT_URL=http://vault:9090 \
		-e VAULT_API_KEY=test-key \
		-e DVIG_LOG_LEVEL=debug \
		--name dvig-test \
		dorevia/dvig:latest
	@echo "✅ Conteneur lancé. Healthcheck : curl http://localhost:8080/health"

docker-push:
	@echo "📦 Push de l'image vers le registry..."
	@echo "⚠️  Assurez-vous d'être authentifié : docker login registry.gitlab.example.com"
	docker tag dorevia/dvig:latest registry.gitlab.example.com/dorevia/dvig:latest
	docker push registry.gitlab.example.com/dorevia/dvig:latest
	@echo "✅ Image pushée"
