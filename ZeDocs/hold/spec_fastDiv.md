# SPEC — Migration DVIG v0.1.x : Flask → FastAPI (Gateway officielle)

**Version :** v1.0
**Date :** 2025-12-27
**Statut :** Ready-to-implement (LAB first)
**Scope :** DVIG en tant que **Gateway HTTP** (OpenAPI + `/ingest`) — sans branchement Vault complet (P0 = ingestion acceptée)

---

## 1) Objectif

### Objectif principal (P0)

Mettre DVIG en **FastAPI** afin qu’il expose :

* `GET /health`
* `POST /ingest`
* `GET /openapi.json` (et `/docs`)

DVIG devient **la gateway officielle** de l’architecture :

```
Odoo → DVIG (FastAPI) → Vault
```

### Objectifs secondaires (P1)

* Ajouter la base `/api/v1/*` (endpoints métiers)
* Intégrer auth (Bearer token / scopes)
* Forward DVIG → Vault (preuve, hash, ledger)

---

## 2) Contexte actuel (factuel)

* L’image `dorevia/dvig:0.1.0` lance : `python -m dvig.api`
* Le code `/app/dvig/api/__main__.py` montre que c’est **Flask**
* Flask expose au moins `/health`
* `/ingest` n’existe pas
* `/openapi.json` n’existe pas (normal en Flask)

Conclusion : la PJ décrit la **cible**, le runtime actuel est une **implémentation intermédiaire**.

---

## 3) Décision d’architecture

### Décision

DVIG doit être **FastAPI** et exposer l’API publique d’ingestion.

### Conséquences

* Flask est considéré **legacy** (peut rester temporairement dans le code)
* Le runtime Docker bascule vers FastAPI via `uvicorn`

---

## 4) Stratégie de migration (sans se perdre)

### Phase 1 — Parallel app (recommandée)

* Ajouter une app FastAPI **sans supprimer Flask**
* Aucun risque, rollback immédiat possible

### Phase 2 — Bascule runtime

* Modifier le `CMD` Docker pour lancer FastAPI

### Phase 3 — Dépréciation Flask

* Optionnelle, plus tard

---

## 5) Structure de code cible

Dans le repo DVIG :

```
dvig/
  api/                 # Flask legacy (existant)
  api_fastapi/         # Nouveau
    __init__.py
    __main__.py
    app.py
    routes/
      __init__.py
      health.py
      ingest.py
```

---

## 6) Spécification des endpoints (FastAPI)

### 6.1 GET /health

**Réponse 200 :**

```json
{
  "service": "dvig",
  "status": "healthy",
  "timestamp": "ISO8601 UTC",
  "version": "0.1.1"
}
```

---

### 6.2 POST /ingest

**Request (P0 minimal)**

```json
{
  "event_type": "manual.test",
  "source": "odoo.lab.core",
  "timestamp": "ISO8601 UTC (optionnel)",
  "data": { "msg": "hello" }
}
```

**Réponse 201 :**

```json
{
  "status": "accepted",
  "event_id": "uuid-or-hash",
  "ts": "ISO8601 UTC"
}
```

**Comportement P0**

* Validation du schéma
* Normalisation du timestamp
* Log de l’événement
* Retour immédiat `accepted`

---

## 7) Dépendances

Ajouter au packaging DVIG :

* `fastapi`
* `uvicorn[standard]`
* `pydantic`

---

## 8) Runtime & Docker

### Variables d’environnement

* `DVIG_HOST` (défaut : `0.0.0.0`)
* `DVIG_PORT` (défaut : `8080`)
* `DVIG_LOG_LEVEL` (défaut : `info`)

### Commande cible

```bash
uvicorn dvig.api_fastapi.app:app --host 0.0.0.0 --port 8080
```

---

## 9) Déploiement LAB

### Exemple docker-compose

```yaml
services:
  dvig:
    image: dorevia/dvig:0.1.1-fastapi
    ports:
      - "18120:8080"
    environment:
      DVIG_HOST: "0.0.0.0"
      DVIG_PORT: "8080"
      DVIG_LOG_LEVEL: "info"
```

---

## 10) Critères d’acceptation (DoD)

### P0

* [ ] `GET /health` → 200
* [ ] `GET /openapi.json` → 200
* [ ] `POST /ingest` → 201
* [ ] Appel depuis Odoo OK
* [ ] Logs DVIG confirment réception

---

## 11) Plan d’implémentation

1. Créer l’arbo `api_fastapi`
2. Ajouter les dépendances
3. Implémenter `/health` et `/ingest`
4. Ajouter `__main__.py`
5. Construire l’image `0.1.1-fastapi`
6. Déployer en LAB
7. Tester depuis Odoo

---

## 12) Rollback

Retour immédiat possible vers `dorevia/dvig:0.1.0` (Flask) si blocage.

---

## 13) Notes importantes

* `units/gateway` = **Caddy uniquement**
* DVIG = **Gateway HTTP**
* Ne brancher Vault qu’après validation P0
* Ne pas mélanger refactor et validation fonctionnelle

---

## Annexes — Commandes de test

```bash
curl http://127.0.0.1:18120/health
curl http://127.0.0.1:18120/openapi.json
curl -X POST http://127.0.0.1:18120/ingest \
  -H 'Content-Type: application/json' \
  -d '{"event_type":"manual.test","source":"odoo.lab.core","data":{"msg":"hello"}}'
```
