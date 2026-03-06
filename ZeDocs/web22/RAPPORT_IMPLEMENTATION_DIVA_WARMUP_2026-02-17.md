# Rapport d'implémentation — DIVA Warmup Runner CODIR

**Date** : 2026-02-17  
**Spec** : `ZeDocs/web22/SPEC_DIVA_Warmup_Runner_CODIR_v1.0.md` (v1.1)  
**Statut** : ✅ Implémenté

---

## 1. Résumé

Réduction de la latence perçue DIVA via :

1. **Warm-up opportuniste** : appel fire-and-forget à DIVA à chaque chargement dashboard-metrics
2. **Runner planifié CODIR** : pré-calcul des contextes (mois courant, YTD) toutes les 2 min

---

## 2. Implémentation

### 2.1 Linky prewarm (US-1)

| Fichier | Description |
|---------|-------------|
| `units/dorevia-linky/app/api/diva/prewarm/route.ts` | `POST /api/diva/prewarm` — timeout 700 ms, 204 No Content, logs `diva_prewarm` |
| `units/dorevia-linky/components/DivaFlashBlock.tsx` | Appel prewarm en parallèle après dashboard-metrics (fire-and-forget) |

**Variables** : `DIVA_PREWARM_TIMEOUT_MS` (défaut 700), `DIVA_PREWARM_ENABLED` (défaut true).

### 2.2 diva-runner (US-2)

| Fichier | Description |
|---------|-------------|
| `units/diva/cmd/diva-runner/main.go` | Point d'entrée, gestion signaux |
| `units/diva/internal/runner/config.go` | Config env (tenants, company_ids, mode, interval) |
| `units/diva/internal/runner/metrics.go` | Appel Linky dashboard-metrics → cards DIVA |
| `units/diva/internal/runner/diva_client.go` | Appel `POST /diva/explain/async` |
| `units/diva/internal/runner/periods.go` | Périodes CODIR (current_month, ytd) |
| `units/diva/internal/runner/runner.go` | Boucle, concurrence limitée, logs |

**Périodes CODIR** : mois courant (1er → today), YTD (1er jan → today).

**Source KPI** : Option B — appel Linky `/api/dashboard-metrics` (évite dupliquer la logique Vault).  
**Résilience** : recover + slog.Warn sur échecs. Pas de panic, retry au cycle suivant.

---

## 3. Docker

- `units/diva/Dockerfile` : build `diva` + `diva-runner`
- `units/diva/docker-compose.yml` : service `diva-runner` (désactivé par défaut via `RUNNER_ENABLED=false`)

---

## 4. Déploiement

### Prewarm (automatique)

Actif par défaut. Aucune config.

### Runner

```bash
# Activer pour sarl-la-platine (company 1 et 2)
RUNNER_ENABLED=true RUNNER_TENANT_CONFIG=sarl-la-platine:1,2 docker compose up -d diva diva-runner
```

Le runner doit pouvoir joindre Linky (`LINKY_URL`) et DIVA (`DIVA_URL`).

---

## 5. Tests d'acceptation

- [ ] Charger Linky → log `diva_prewarm` côté serveur
- [ ] Recharger page → bloc DIVA plus rapide (souvent instantané si préchauffé)
- [ ] Lancer runner 2 min → ouvrir Linky → 200 immédiat sur contextes calculés

---

**Fin du rapport.**
