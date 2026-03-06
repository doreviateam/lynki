# DLP — Decision Link Performance

**Référence :** `ZeDocs/web31/SPEC_DLP_v0.3.md`  
**Plan :** `ZeDocs/web31/PLAN_IMPLEMENTATION_DLP_v0.3_SCRUM.md`

## Vue d'ensemble

Le service DLP structure les décisions stratégiques à partir des données consolidées dans Linky. Il mesure la répartition de l'énergie organisationnelle (temps validé), sans mesure de performance individuelle.

## Prérequis

- Go 1.24+
- PostgreSQL 16 (base dédiée)

## Démarrage local

```bash
# 1. Démarrer PostgreSQL (ex. via docker-compose ou existant)
docker compose up -d dlp-db

# 2. Configurer .env (copier .env.example)
cp .env.example .env
# Adapter DATABASE_URL si besoin (ex. localhost:5433)

# 3. Lancer le service
go run ./cmd/dlp
```

## Build Docker

```bash
docker compose build
docker compose up -d
```

## Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/health` | Liveness |
| GET | `/ready` | Readiness (DB connectée) |
| GET | `/api/v1/companies?tenant=...` | Liste companies |
| POST | `/api/v1/companies` | Création company |
| GET | `/api/v1/perimeters?tenant=...` | Liste perimeters |
| POST | `/api/v1/perimeters` | Création perimeter |
| PATCH | `/api/v1/perimeters/:id` | Modification perimeter |
| GET | `/api/v1/dlps?tenant=...&status=active` | Liste DLP |
| POST | `/api/v1/dlps` | Création DLP |
| GET | `/api/v1/dlps/:id` | Détail DLP |
| PATCH | `/api/v1/dlps/:id` | Modification/archivage DLP |
| GET | `/api/v1/project-perimeter-map?tenant=...` | Liste mapping |
| POST | `/api/v1/project-perimeter-map` | Upsert mapping |
| DELETE | `/api/v1/project-perimeter-map/:id` | Suppression mapping |
| POST | `/api/v1/timesheet-validated` | Événement validation timesheet |
| GET | `/api/v1/dlp/energy-summary?tenant=...&period_days=90` | Résumé énergie |

## Structure

```
units/dlp/
├── cmd/dlp/main.go          # Point d'entrée
├── internal/
│   ├── config/              # Configuration
│   ├── db/                  # Connexion + migrations
│   ├── handlers/            # Handlers HTTP
│   └── server/              # Serveur Fiber
├── migrations/              # SQL (001, 002, 003)
├── docker-compose.yml       # DLP + Postgres dédié
└── Dockerfile
```
