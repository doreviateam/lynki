# SPEC — Linky Metric Engine

**Version :** 1.1  
**Date :** 13 mars 2026  
**Produit :** Dorevia Linky  
**Statut :** Spécification technique

---

## 1. Objectif

Définir le **moteur d'exécution des métriques** Linky : comment les métriques sont calculées, ordonnancées, mises en cache et exposées via API.

Ce document complète le **Metric Registry** (définitions) en précisant le **modèle d'exécution** : graphe de dépendances, stratégie de recalcul, politique de cache, et contrat API.

---

## 2. Références

| Document | Rôle |
|----------|------|
| `SPEC_LINKY_METRIC_REGISTRY_v1.0.md` | Définitions des métriques |
| `SPEC_LINKY_INSTRUMENT_MODEL_v1.0.md` | Modèle des instruments |
| `DIAGRAMME_ARCHITECTURE_LINKY_v1.0.md` | Vue d'ensemble architecture |

---

## 3. Architecture du Metric Engine

```
┌─────────────────────────────────────────────────────────────────┐
│                     METRIC ENGINE                                │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │ Config Loader │   │ Dependency   │   │ Execution Scheduler   │ │
│  │ (Registry)    │   │ Graph        │   │ (realtime / batch)    │ │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘ │
│         │                  │                       │              │
│         └──────────────────┼───────────────────────┘              │
│                            │                                       │
│                            ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Compute Layer                              │ │
│  │  Base: Vault API → sum/difference/balance                     │ │
│  │  Derived: dependencies → formula                              │ │
│  └────────────────────────────┬───────────────────────────────────┘ │
│                               │                                     │
│                               ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Cache Layer                                │ │
│  │  TTL par calculation_scope • Invalidation par événement       │ │
│  └────────────────────────────┬──────────────────────────────────┘ │
│                                │                                     │
│                                ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    API Layer                                  │ │
│  │  GET /metrics • GET /metrics/:id • GET /instruments            │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Graphe de dépendances

### 4.1 Principe

Le Metric Engine construit un **graphe orienté acyclique (DAG)** à partir du Metric Registry.

- **Nœuds** : métriques (base ou derived)
- **Arêtes** : `metric_a` dépend de `metric_b` → `metric_b` doit être calculée avant `metric_a`

### 4.2 Ordre d'exécution

1. **Base metrics** (metric_class: base) : calculées en premier, à partir des événements Vault
2. **Derived metrics** (metric_class: derived) : calculées après leurs dépendances, dans l'ordre topologique

### 4.3 Exemple de DAG

```
                    [Vault Events]
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  treasury_balance   payments_received  accounts_receivable
  net_cash_flow      pos_revenue       vat_collected
  credit_notes       refunds            vat_deductible
  pos_closure        sales_ht           purchases_ht
        │                  │                  │
        │                  └────────┬─────────┘
        │                           │
        │                           ▼
        │                    commercial_margin
        │                           │
        └─────────────┬─────────────┘
                      │
                      ▼
              working_capital_requirement
                      │
                      ▼
              operating_result (EBE)
```

### 4.4 Règles

- Une métrique **derived** n'est calculée que si toutes ses **dependencies** sont disponibles
- En cas de dépendance manquante : retourner `null` ou erreur explicite, ne pas bloquer les autres métriques
- Le graphe doit rester **acyclique** : une métrique ne peut pas dépendre d'elle-même (directement ou indirectement)

### 4.5 Compilation du graphe (Graph Compilation)

Le DAG est **compilé au démarrage** du Metric Engine. Pas de recalcul du graphe à chaque requête.

**Séquence au boot :**

```
startup
   ↓
load metric registry (YAML / config)
   ↓
build DAG (nœuds = métriques, arêtes = dependencies)
   ↓
topological sort (Kahn ou DFS)
   ↓
store execution_plan (ordre de calcul)
   ↓
ready
```

L'**execution_plan** est conservé en mémoire et réutilisé pour chaque calcul. Rechargement uniquement si le Registry est mis à jour (redémarrage ou hot-reload).

### 4.6 Détection de cycles

Avant de valider l'execution_plan, le moteur **vérifie l'acyclicité** du graphe.

- **Algorithme** : Kahn ou DFS (détection de back-edge)
- **Si cycle détecté** : **Metric Engine startup failure** — le service ne démarre pas
- **Log** : identifier les métriques impliquées dans le cycle pour correction du Registry

---

## 5. Stratégie de recalcul (Recompute Strategy)

### 5.1 Par calculation_scope

| calculation_scope | Stratégie | Déclencheur |
|-------------------|-----------|-------------|
| **realtime** | Calcul à la demande | Requête API, ouverture cockpit/card |
| **batch** | Calcul périodique ou à la demande | Cron (ex. fin de journée, début de mois), ou requête explicite |

### 5.2 Realtime

- Pas de pré-calcul systématique
- À chaque requête : vérifier le cache (TTL), sinon calculer
- Métriques concernées : `treasury_balance`, `net_cash_flow`, `payments_received`, `accounts_receivable`, `pos_revenue`, `pos_closure_total`

### 5.3 Batch

- Calcul déclenché par :
  - **Période** : fin de jour (J), fin de mois (M)
  - **Événement** : nouveau scellé Vault sur la période
  - **Manuel** : endpoint `POST /metrics/recompute`
- Métriques concernées : `commercial_margin`, `vat_due`, `working_capital_requirement`, `credit_notes_amount`, `refunds_amount`, `operating_result`

### 5.4 Invalidation

Le cache est invalidé lorsque :

- Un nouvel événement est scellé dans le Vault pour le tenant/période concerné
- La période demandée change (ex. passage au mois suivant)
- Un `POST /metrics/recompute` est exécuté

### 5.5 Invalidation granulaire

Pour éviter de vider tout le cache à chaque événement Vault, le moteur utilise un **mapping événement → métriques impactées**.

| Événement Vault      | Métriques impactées |
|----------------------|----------------------|
| `invoice.posted`     | sales_ht, vat_collected, accounts_receivable, commercial_margin, vat_due, working_capital_requirement, operating_result |
| `vendor.bill.posted` | purchases_ht, vat_deductible, commercial_margin, vat_due, working_capital_requirement, operating_result |
| `payment.received`   | treasury_balance, net_cash_flow, payments_received, accounts_receivable |
| `payment.sent`       | treasury_balance, net_cash_flow |
| `pos.order.closed`   | pos_revenue |
| `pos.session.closed` | pos_closure_total |
| `credit.note.issued` | credit_notes_amount, operating_result |
| `refund.issued`      | refunds_amount |
| `stock.valuation`    | working_capital_requirement |

Seules les **entrées de cache concernées** sont invalidées. Les autres restent valides.

---

## 6. Politique de cache (Cache Policy)

### 6.1 Clé de cache

```
{tenant_id}:{metric_id}:{period_from}:{period_to}:{company_id?}
```

Exemple : `o19:treasury_balance:2026-01-01:2026-01-31:odoo:1`

### 6.2 TTL par calculation_scope

| calculation_scope | TTL par défaut | Ajustable |
|-------------------|----------------|-----------|
| realtime | 60 s | Oui (config) |
| batch | 5 min | Oui (config) |

### 6.3 Stockage

- **In-memory** : pour la v1, cache en mémoire (perdu au redémarrage)
- **Redis** (évolution) : pour persistance et partage multi-instances

### 6.4 Cache par nœud (Dependency Caching)

Le cache ne porte pas uniquement sur la **réponse API finale**, mais sur **chaque nœud du DAG**.

- **Base metrics** : résultat mis en cache après calcul
- **Derived metrics** : si une derived dépend de 10 métriques, chaque dépendance peut être en cache
- **Effet** : recalcul partiel uniquement (ex. si `revenue` change, `operating_result` est recalculé mais `sales_ht` peut rester en cache si inchangé)

Clé par nœud : identique à la clé API (tenant, metric_id, period, company).

### 6.5 Comportement cache miss

1. Vérifier le cache pour la métrique demandée
2. Si miss : vérifier le cache des **dependencies** (si derived)
3. Calculer les dépendances manquantes dans l'ordre du DAG
4. Calculer la métrique
5. Stocker en cache (nœud + éventuellement API)
6. Retourner la valeur

---

## 7. API Métriques

### 7.1 Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/metrics` | Liste des métriques pour un contexte (tenant, période, société) |
| GET | `/api/metrics/:metric_id` | Valeur d'une métrique pour un contexte |
| GET | `/api/instruments` | Agrégation par instrument (tuile + valeur) |
| POST | `/api/metrics/recompute` | Déclencher un recalcul (batch metrics) |

### 7.2 Paramètres communs

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| tenant | string | Oui | Identifiant tenant |
| period_from | date | Oui | Début période (YYYY-MM-DD) |
| period_to | date | Oui | Fin période (YYYY-MM-DD) |
| company_id | string | Non | Filtre société (optionnel) |

### 7.3 Réponse GET /api/metrics/:metric_id

```json
{
  "metric_id": "treasury_balance",
  "value": 118179.50,
  "unit": "EUR",
  "period_from": "2026-01-01",
  "period_to": "2026-01-31",
  "computed_at": "2026-03-13T14:30:00Z",
  "data_freshness": "2026-03-13T14:29:41Z",
  "status": "ok",
  "cache_hit": true
}
```

| Champ | Description |
|-------|-------------|
| `data_freshness` | Timestamp du dernier événement Vault intégré dans le calcul. Répond à : *jusqu'à quand les données sont-elles à jour ?* |
| `status` | `ok` \| `stale` \| `partial` \| `error` — voir §7.6 |

### 7.4 Réponse GET /api/instruments

```json
{
  "instruments": [
    {
      "instrument_id": "treasury",
      "label": "TRÉSORERIE",
      "value": 118179.50,
      "formatted": "118 179 €",
      "metric_id": "treasury_balance",
      "status": "ok"
    },
    {
      "instrument_id": "business",
      "label": "BUSINESS",
      "value": 94663.00,
      "formatted": "+ 94 663 €",
      "metric_id": "commercial_margin",
      "status": "ok"
    }
  ],
  "period_from": "2026-01-01",
  "period_to": "2026-01-31",
  "computed_at": "2026-03-13T14:30:00Z",
  "data_freshness": "2026-03-13T14:29:41Z"
}
```

### 7.5 Gestion des erreurs

| Code | Situation |
|------|-----------|
| 200 | Succès, valeur disponible |
| 204 | Métrique non calculable (données insuffisantes) |
| 404 | metric_id inconnu |
| 503 | Vault indisponible ou timeout |

### 7.6 Status des métriques

| status | Description |
|--------|-------------|
| `ok` | Valeur calculée, données complètes |
| `stale` | Données potentiellement obsolètes (data_freshness > seuil) |
| `partial` | Données partielles (ex. certaines factures manquantes pour vat_due) |
| `error` | Erreur de calcul ou source indisponible |

---

## 8. Observabilité

### 8.1 Endpoint GET /api/metrics/engine

Métriques internes du Metric Engine pour le monitoring.

| Métrique | Description |
|----------|-------------|
| `cache_hit_rate` | Taux de hits cache (0–1) |
| `compute_latency_p95_ms` | Latence P95 de calcul (ms) |
| `dag_nodes` | Nombre de métriques dans le DAG |
| `recompute_count` | Nombre de recalculs (batch) depuis le démarrage |
| `cache_entries` | Nombre d'entrées en cache |

**Exemple de réponse :**

```json
{
  "cache_hit_rate": 0.82,
  "compute_latency_p95_ms": 145,
  "dag_nodes": 12,
  "recompute_count": 42,
  "cache_entries": 128
}
```

---

## 9. Intégration avec l'existant

### 9.1 État actuel

Linky utilise aujourd'hui :

- `GET /api/dashboard-metrics` : agrégation ad hoc, appel direct au Vault et aux APIs
- Pas de Metric Engine dédié
- Pas de graphe de dépendances explicite

### 9.2 Stratégie de migration

| Phase | Action |
|-------|--------|
| **Phase 1** | Implémenter le Metric Engine en parallèle, alimenté par les mêmes sources (Vault, APIs) |
| **Phase 2** | Faire consommer le cockpit par `GET /api/instruments` au lieu de `dashboard-metrics` |
| **Phase 3** | Déprécier `dashboard-metrics` ou le faire déléguer au Metric Engine |

### 9.3 Compatibilité

Le format de réponse `GET /api/instruments` doit rester compatible avec ce que consomme aujourd'hui `IconGrid` et les cards (structure `formatted`, `status`, etc.).

---

## 10. Évolutions futures

| Évolution | Description |
|-----------|-------------|
| **Redis cache** | Cache persistant, partagé multi-instances |
| **Streaming** | WebSocket pour mise à jour temps réel des tuiles |
| **Precomputation** | Jobs batch nocturnes pour métriques batch |
| **Metric versioning** | Historique des formules, A/B testing |
| **Observability** | Métriques sur le Metric Engine (latence, cache hit rate) |

---

## 11. Résumé

| Composant | Rôle |
|-----------|------|
| **Dependency Graph** | DAG construit depuis le Registry, ordre d'exécution |
| **Execution Scheduler** | Realtime à la demande, batch périodique ou manuel |
| **Cache Layer** | TTL par scope, invalidation par événement |
| **API** | GET metrics, GET instruments, POST recompute |
| **Observability** | GET /metrics/engine (cache_hit_rate, latency, dag_nodes) |

---

## Historique des versions

| Version | Date       | Modifications |
|---------|------------|---------------|
| 1.0     | 13 mars 26 | Version initiale |
| 1.1     | 13 mars 26 | Graph compilation, cycle detection, cache par nœud, invalidation granulaire, data_freshness, status, observabilité |

---

*Fin de la spécification*
