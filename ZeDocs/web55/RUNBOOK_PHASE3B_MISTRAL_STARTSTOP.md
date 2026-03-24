# Runbook Phase 3B — Start/stop planifié Mistral

**Date** : 16 mars 2026  
**Artefact** : DM3B-1, DM3B-2, DM3B-3  
**Prérequis** : Phase 0 validée (store Postgres actif), Phase 2 validée (payload structuré)

---

## Architecture du start/stop planifié

### Principe

Mistral (llama.cpp) n'est **pas nécessaire en permanence**. Le produit repose sur un modèle *store-first* :

1. Le runner Diva pré-calcule les insights la nuit et les stocke dans `diva_insights` (Postgres).
2. L'UI lit depuis le store → **latence < 1 s**, indépendante de Mistral.
3. Mistral n'est allumé qu'en **fenêtre de calcul planifiée**.

Bénéfice : **4,3 GiB RAM libérés** hors fenêtre (mesuré le 16 mars 2026).

---

## Script : `scripts/mistral_window.sh`

### Fonctionnement

```
Démarrage Mistral
     │
     ▼
Attente healthcheck (port 8000 /health — max 40 × 5s)
     │
     ▼
Fenêtre ouverte (runner pré-calcule)
     │   ├─ Arrêt anticipé si idle > DIVA_LOG_IDLE_SECONDS (défaut 300s)
     │   └─ Timeout max MISTRAL_WINDOW_MINUTES (défaut 60 min)
     │
     ▼
Arrêt Mistral
```

### Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `MISTRAL_COMPOSE_DIR` | `units/mistral` | Répertoire docker-compose |
| `MISTRAL_WINDOW_MINUTES` | `60` | Durée max de la fenêtre |
| `MISTRAL_HEALTH_PORT` | `8000` | Port healthcheck llama.cpp |
| `MISTRAL_HEALTH_RETRIES` | `40` | Tentatives avant abandon |
| `MISTRAL_HEALTH_INTERVAL_S` | `5` | Intervalle entre tentatives (s) |
| `DIVA_LOG_IDLE_SECONDS` | `300` | Secondes idle avant arrêt anticipé |
| `MISTRAL_CONTAINER_NAME` | `mistral-llamacpp` | Nom du conteneur |

### Test dry-run

```bash
/opt/dorevia-plateform/scripts/mistral_window.sh --dry-run
```

---

## Cron installé

```cron
# Fenêtre Mistral — 6h, lundi au vendredi
0 6 * * 1-5 /opt/dorevia-plateform/scripts/mistral_window.sh >> /var/log/mistral_window.log 2>&1
```

Vérifier : `crontab -l`  
Logs : `tail -f /var/log/mistral_window.log`

**Recommandation** : ajuster l'heure et la durée selon le nombre de contextes à calculer. Pour N contextes avec ~25 s/contexte, prévoir `N × 25 / 60` minutes de fenêtre.

---

## DM3B-2 — Comportement des endpoints hors fenêtre Mistral

| Endpoint | Comportement hors fenêtre | Acceptable |
|----------|--------------------------|------------|
| `GET /diva/insights` | Store Postgres — retourne l'insight pré-calculé si non expiré, `state=pending` sinon | ✅ Toujours disponible |
| `POST /diva/explain` (cockpit) | Flash dégradé déterministe — `DegradedFlashFromFactsPack` (headline + facts sans LLM) ; `degraded=true` dans la réponse | ✅ Acceptable (pas de crash) |
| `POST /diva/explain` (card) | HTTP 503 `MISTRAL_UNAVAILABLE` — retour immédiat | ⚠️ Documenté — pas d'attente infinie |
| `POST /diva/explain/async` | Guard reject si en flight ; sinon tentative → 503 stocké en status=error | ⚠️ Documenté |
| `POST /diva/generate` | HTTP 503 `MISTRAL_UNAVAILABLE` (Guard + advisory lock échouent rapidement) | ⚠️ Documenté |

### Règle normative (SPEC §7B)

> Hors fenêtre de disponibilité Mistral, le chemin de lecture store (`GET /diva/insights`) reste toujours disponible. Le cockpit (`/explain` sans `focus_card`) retourne un flash dégradé déterministe basé sur le FactsPack. Les endpoints d'explication ciblée (`/explain` avec `focus_card`) et de génération (`/generate`) retournent HTTP 503 avec un code explicite — sans attente infinie, sans timeout opaque.

---

## DM3B-3 — RAM libérée mesurée

| Mesure | Valeur |
|--------|--------|
| RAM disponible **avant** arrêt Mistral | 3,3 GiB |
| RAM disponible **après** arrêt Mistral | 7,6 GiB |
| **RAM libérée** | **~4,3 GiB** |
| Consommation Mistral (docker stats) | 4,332 GiB / 6 GiB max |

Mesure effectuée le 16 mars 2026 avec `--ctx-size 4096`, `--parallel 1`, `--threads 8`, `mem_limit: 6g`.

---

## Rollback / restauration immédiate

En cas de besoin urgent d'inférence hors fenêtre :

```bash
# Démarrer Mistral manuellement
docker compose -f /opt/dorevia-plateform/units/mistral/docker-compose.yml up -d mistral-llamacpp

# Vérifier healthcheck
curl -s http://localhost:8000/health
```

Pour désactiver le cron temporairement :
```bash
crontab -l | grep -v mistral_window | crontab -
```

---

## Points de vigilance

1. **TTL insights** : vérifier `INSIGHTS_TTL_MINUTES` dans docker-compose Diva. Si TTL court (défaut 3 min en test), augmenter à 480 min (8h) ou plus en production pour que les insights calculés à 6h soient encore valides à 14h.
2. **Runner actif pendant la fenêtre** : le runner Diva doit être en cours (`diva-runner` healthy) pendant la fenêtre pour que les insights soient pré-calculés.
3. **Fenêtre vs volume** : ajuster `MISTRAL_WINDOW_MINUTES` selon le nombre de contextes. Surveiller `tail -f /var/log/mistral_window.log`.
4. **`restart: unless-stopped`** : Mistral redémarre automatiquement en cas de crash ou reboot — le cron ne vient que s'y **superposer** comme fenêtre planifiée ; il ne remplace pas la politique de redémarrage.
