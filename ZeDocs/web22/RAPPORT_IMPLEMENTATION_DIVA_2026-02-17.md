# Rapport détaillé — Implémentation DIVA (synthèse KPI Linky)

**Date** : 2026-02-17  
**Version** : 1.0  
**Statut** : Implémentation complète — DIVA opérationnel  
**Références** : `PLAN_IMPLEMENTATION_DIVA_SCRUM_v1.0.md`, `SPEC_DIVA_API_v1.0.md`, `RECOMMANDATION_PRODUIT_DIVA_AUTO_REFRESH_v1.0.md`

---

# 1. Synthèse exécutive

**DIVA** (lecture synthétique des KPI Linky) a été implémentée en une session. Le flux complet est **opérationnel** : service Go `units/diva/`, proxy Linky `/api/diva/explain`, bloc UI sous la grille avec debounce 5 s et bouton Rafraîchir.

| Critère | Résultat |
|---------|----------|
| **Service DIVA** | ✅ `units/diva/` — Go (Fiber v2), port 8010, réseau interne |
| **Endpoint** | ✅ `POST /diva/explain` — contrat SPEC conforme |
| **Cache** | ✅ `context_hash` (TTL 5 min), bypass si `force_refresh` |
| **Proxy Linky** | ✅ `/api/diva/explain` — mapping dashboard-metrics → cards |
| **Bloc UI** | ✅ DivaFlashBlock sous grille, debounce 5 s, bouton Rafraîchir, disclaimer |
| **Smoke test** | ✅ `scripts/smoke_test_diva_e2e.sh` |

---

# 2. Contexte

## 2.1 Objectif

Produire une **synthèse flash** des indicateurs financiers affichés dans la grille Linky, à l'aide de Mistral (LLM local). DIVA explique les chiffres sans interpréter les causes, sans donner d'avis juridique ou comptable.

## 2.2 Contraintes

- **Dépendance** : Mistral doit être up (`mistral-llamacpp:8000`)
- **Stack** : Go (Fiber v2) — aligné Vault
- **Réseau** : `dorevia-network` — aucun port exposé Internet
- **Objectif UX** : ≤ 10 s (latence Mistral ~3–15 s selon charge)

---

# 3. Choix techniques

## 3.1 Stack retenue

| Élément | Valeur |
|--------|--------|
| **Langage** | Go 1.22 |
| **Framework** | Fiber v2 |
| **Port** | 8010 (interne) |
| **Réseau** | `dorevia-network` |
| **Cache** | Mémoire, TTL 5 min |
| **Modèle Mistral** | mistral-7b-instruct-v0.2.Q4_K_M (via llama.cpp) |

## 3.2 Décisions produit

| Décision | Valeur |
|----------|--------|
| **Déclenchement** | Automatique (debounce 5 s) + bouton manuel Rafraîchir |
| **force_refresh** | Bypass du cache pour le bouton Rafraîchir |
| **Données insuffisantes** | 200 avec `confidence=low` (pas de 400) |
| **context_hash** | JSON canonicalisé, cards triées par key, sans formatted |

---

# 4. Structure implémentée

## 4.1 Arborescence

```
units/diva/
├── Dockerfile
├── docker-compose.yml
├── go.mod
├── go.sum
├── README.md
├── cmd/diva/main.go
└── internal/
    ├── cache/cache.go          # TTL 5 min, purge
    ├── handlers/
    │   ├── health.go
    │   └── explain.go          # POST /diva/explain
    ├── mistral/
    │   ├── client.go           # Chat completions, prompts annexe
    │   └── errors.go
    ├── models/models.go
    └── server/
        ├── server.go
        └── errors.go

units/dorevia-linky/
├── app/api/diva/explain/route.ts   # Proxy
└── components/
    └── DivaFlashBlock.tsx          # Bloc synthèse UI

scripts/
└── smoke_test_diva_e2e.sh
```

## 4.2 Fichiers créés ou modifiés

| Fichier | Action |
|---------|--------|
| `units/diva/Dockerfile` | Créé |
| `units/diva/docker-compose.yml` | Créé |
| `units/diva/go.mod` | Créé |
| `units/diva/cmd/diva/main.go` | Créé |
| `units/diva/internal/*` | Créé (cache, handlers, mistral, models, server) |
| `units/diva/README.md` | Créé |
| `units/dorevia-linky/app/api/diva/explain/route.ts` | Créé |
| `units/dorevia-linky/components/DivaFlashBlock.tsx` | Créé |
| `units/dorevia-linky/components/DashboardWithFilters.tsx` | Modifié (intégration DivaFlashBlock) |
| `lib/render/render_app_compose.sh` | Modifié (DIVA_URL pour Linky) |
| `scripts/smoke_test_diva_e2e.sh` | Créé |

---

# 5. Procédure déroulée

## 5.1 Ordre de démarrage

1. **Mistral** : `cd units/mistral && docker compose up -d`
2. **DIVA** : `cd units/diva && docker compose up -d`
3. **Linky** : selon déploiement tenant (avec DIVA_URL)

## 5.2 Commandes de validation

```bash
# Healthcheck DIVA
docker run --rm --network dorevia-network curlimages/curl:latest \
  curl -s http://diva:8010/health

# Smoke test e2e
./scripts/smoke_test_diva_e2e.sh
```

---

# 6. Résultats des tests

## 6.1 Smoke test e2e (2026-02-17)

| Étape | Résultat |
|-------|----------|
| Mistral | ✅ OK |
| DIVA health | ✅ OK |
| POST /diva/explain | ✅ Flash retourné |
| Latence mesurée | ~15 s (premier appel, chargement modèle) |

## 6.2 Latence

- **Cache hit** : ~0 ms
- **Cache miss** : 3–15 s selon charge Mistral (objectif technique 30 s)
- **Objectif UX** : ≤ 10 s — dépend de la charge serveur

## 6.3 Table de correspondance cards

| dashboard-metrics | specKey | Label |
|-------------------|---------|-------|
| treasury | treasury_validated_pct | Trésorerie validée |
| cash | cash | Cash |
| business | business | Business |
| taxes | taxes | Taxes |
| credit_notes | credit_notes | Notes de crédit |
| refunds | refunds | Remboursements |
| pos_shops | pos_shops | POS magasins |
| pos_z | pos_z | Z de caisse |

---

# 7. Configuration

## 7.1 Variables d'environnement DIVA

| Variable | Défaut | Description |
|----------|--------|-------------|
| `MISTRAL_BASE_URL` | `http://mistral-llamacpp:8000/v1` | URL base Mistral |
| `DIVA_PORT` | `8010` | Port d'écoute |
| `CACHE_TTL_SECONDS` | `300` | TTL cache (5 min) |

## 7.2 Variables Linky

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DIVA_URL` | `http://diva:8010` | URL du service DIVA (proxy) |

---

# 8. Sécurité et exposition

| Critère | Statut |
|---------|--------|
| Ports exposés sur Internet | Aucun ✅ |
| Accès réseau | Uniquement `dorevia-network` ✅ |
| Logs rotatifs | max-size 20m, max-file 5 ✅ |
| Payload en logs | Non (request_id uniquement) ✅ |

---

# 9. Checklist Definition of Done

| Critère | Statut |
|---------|--------|
| `units/diva/` créé avec docker-compose.yml, service opérationnel | ✅ |
| `POST /diva/explain` répond selon SPEC | ✅ |
| Cache `context_hash` actif (TTL 5 min) | ✅ |
| Proxy Linky `/api/diva/explain` transforme dashboard-metrics → cards | ✅ |
| Bloc synthèse affiché sous la grille, debounce 5 s | ✅ |
| Badge confidence + disclaimer | ✅ |
| Smoke test e2e exécuté | ✅ |
| Bouton Rafraîchir (force_refresh) | ✅ |

---

# 10. Livrables et références

## 10.1 Documentation mise à jour

- `ZeDocs/web22/INDEX.md` — Statut DIVA implémenté
- `ZeDocs/web22/PLAN_IMPLEMENTATION_DIVA_SCRUM_v1.0.md` — DoD cochées
- `ZeDocs/web22/RAPPORT_IMPLEMENTATION_DIVA_2026-02-17.md` — Ce rapport
- `units/diva/README.md` — Runbook unit DIVA

## 10.2 Références techniques

| Document | Rôle |
|----------|------|
| `units/diva/README.md` | Runbook unit DIVA |
| `ZeDocs/web22/SPEC_DIVA_API_v1.0.md` | Spécification API |
| `ZeDocs/web22/ANNEXE_PROMPT_DIVA_FLASH_v1.0.md` | Prompts Mistral |
| `ZeDocs/web22/PLAN_IMPLEMENTATION_DIVA_SCRUM_v1.0.md` | Plan Scrum |
| `ZeDocs/web22/RECOMMANDATION_PRODUIT_DIVA_AUTO_REFRESH_v1.0.md` | Décision Auto + Refresh |
| `ZeDocs/web22/RAPPORT_IMPLEMENTATION_MISTRAL_2026-02-17.md` | Prérequis Mistral |

---

**Fin du rapport.**
