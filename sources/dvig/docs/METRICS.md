# 📊 Métriques Prometheus — DVIG

**SPEC** : DVIG → Vault Forwarding v1.1  
**Sprint** : C — Monitoring et Observabilité  
**Date** : 2026-01-11

---

## 🎯 Objectif

Documenter toutes les métriques Prometheus exposées par DVIG pour le monitoring en production.

---

## 📡 Endpoint Métriques

**URL** : `GET /metrics  
**Format** : Prometheus text format  
**Exemple** : `curl http://localhost:8080/metrics`

---

## 📊 Liste des Métriques

### Gauge : Backlog Outbox

**Nom** : `dvig_outbox_backlog`  
**Type** : Gauge  
**Labels** :
- `tenant` : ID du tenant
- `env` : Environnement (lab, prod, etc.)

**Description** : Nombre d'événements en attente dans l'outbox (statut `accepted` ou `failed_soft` avec `next_retry_at` passé)

**Exemple** :
```
dvig_outbox_backlog{tenant="test-tenant",env="lab"} 5
```

**Alerte recommandée** :
```yaml
- alert: DVIGOutboxBacklogHigh
  expr: dvig_outbox_backlog > 100
  for: 5m
  annotations:
    summary: "Backlog DVIG élevé (> 100 événements)"
```

---

### Counter : Forwardings Réussis

**Nom** : `dvig_forward_success_total`  
**Type** : Counter  
**Labels** :
- `tenant` : ID du tenant
- `env` : Environnement

**Description** : Nombre total de forwardings réussis vers Vault

**Exemple** :
```
dvig_forward_success_total{tenant="test-tenant",env="lab"} 1234
```

**Requête Prometheus** :
```promql
# Taux de succès par minute
rate(dvig_forward_success_total[1m])
```

---

### Counter : Erreurs Soft (Retriable)

**Nom** : `dvig_forward_failed_soft_total`  
**Type** : Counter  
**Labels** :
- `tenant` : ID du tenant
- `env` : Environnement
- `error_type` : Type d'erreur (timeout, http_502, http_503, http_429, network_error)

**Description** : Nombre total d'erreurs soft (retriable) lors des forwardings

**Exemple** :
```
dvig_forward_failed_soft_total{tenant="test-tenant",env="lab",error_type="timeout"} 12
dvig_forward_failed_soft_total{tenant="test-tenant",env="lab",error_type="http_503"} 5
```

**Alerte recommandée** :
```yaml
- alert: DVIGForwardSoftErrorsHigh
  expr: rate(dvig_forward_failed_soft_total[5m]) > 10
  for: 5m
  annotations:
    summary: "Taux d'erreurs soft élevé (> 10/min)"
```

---

### Counter : Erreurs Hard (Non Retriable)

**Nom** : `dvig_forward_failed_hard_total`  
**Type** : Counter  
**Labels** :
- `tenant` : ID du tenant
- `env` : Environnement
- `error_type` : Type d'erreur (http_400, http_401, http_403, http_404, http_422, etc.)

**Description** : Nombre total d'erreurs hard (non retriable) lors des forwardings

**Exemple** :
```
dvig_forward_failed_hard_total{tenant="test-tenant",env="lab",error_type="http_400"} 2
```

**Alerte recommandée** :
```yaml
- alert: DVIGForwardHardErrors
  expr: rate(dvig_forward_failed_hard_total[5m]) > 0
  for: 1m
  annotations:
    summary: "Erreurs hard détectées (investigation requise)"
```

---

### Histogram : Durée des Forwardings

**Nom** : `dvig_forward_duration_seconds`  
**Type** : Histogram  
**Labels** :
- `tenant` : ID du tenant
- `env` : Environnement

**Buckets** : `0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0`

**Description** : Durée des opérations de forwarding vers Vault (en secondes)

**Exemple** :
```
dvig_forward_duration_seconds_bucket{tenant="test-tenant",env="lab",le="1.0"} 100
dvig_forward_duration_seconds_bucket{tenant="test-tenant",env="lab",le="5.0"} 150
dvig_forward_duration_seconds_sum{tenant="test-tenant",env="lab"} 250.5
dvig_forward_duration_seconds_count{tenant="test-tenant",env="lab"} 200
```

**Requêtes Prometheus** :
```promql
# P50 (médiane)
histogram_quantile(0.5, rate(dvig_forward_duration_seconds_bucket[5m]))

# P95
histogram_quantile(0.95, rate(dvig_forward_duration_seconds_bucket[5m]))

# P99
histogram_quantile(0.99, rate(dvig_forward_duration_seconds_bucket[5m]))
```

**Alerte recommandée** :
```yaml
- alert: DVIGForwardDurationHigh
  expr: histogram_quantile(0.95, rate(dvig_forward_duration_seconds_bucket[5m])) > 5
  for: 5m
  annotations:
    summary: "P95 durée forwarding élevée (> 5s)"
```

---

### Counter : Dead Letters

**Nom** : `dvig_dead_letters_total`  
**Type** : Counter  
**Labels** :
- `tenant` : ID du tenant
- `env` : Environnement

**Description** : Nombre total d'événements déplacés vers la Dead Letter Queue (erreurs hard)

**Exemple** :
```
dvig_dead_letters_total{tenant="test-tenant",env="lab"} 3
```

**Alerte recommandée** :
```yaml
- alert: DVIGDeadLetters
  expr: increase(dvig_dead_letters_total[1h]) > 0
  for: 1m
  annotations:
    summary: "Événements en Dead Letter Queue (investigation requise)"
```

---

## 📈 Requêtes Prometheus Utiles

### Taux de Succès

```promql
# Taux de succès (succès / total)
rate(dvig_forward_success_total[5m]) / 
(rate(dvig_forward_success_total[5m]) + 
 rate(dvig_forward_failed_soft_total[5m]) + 
 rate(dvig_forward_failed_hard_total[5m]))
```

### Backlog par Tenant

```promql
# Backlog total
sum(dvig_outbox_backlog) by (tenant)

# Backlog par environnement
sum(dvig_outbox_backlog) by (env)
```

### Taux d'Erreurs

```promql
# Taux d'erreurs soft
rate(dvig_forward_failed_soft_total[5m])

# Taux d'erreurs hard
rate(dvig_forward_failed_hard_total[5m])
```

### Durée P95

```promql
# P95 durée forwarding
histogram_quantile(0.95, rate(dvig_forward_duration_seconds_bucket[5m]))
```

---

## 🚨 Alertes Recommandées

### Dashboard Grafana

Créer un dashboard avec :
- **Backlog** : Graphique `dvig_outbox_backlog` par tenant
- **Taux de succès** : Graphique taux de succès (succès / total)
- **Erreurs** : Graphique `dvig_forward_failed_soft_total` et `dvig_forward_failed_hard_total`
- **Durée** : Graphique P50, P95, P99 de `dvig_forward_duration_seconds`
- **Dead Letters** : Graphique `dvig_dead_letters_total`

### Alertes Critiques

1. **Backlog élevé** : `dvig_outbox_backlog > 100` pendant 5 minutes
2. **Erreurs hard** : `rate(dvig_forward_failed_hard_total[5m]) > 0`
3. **Dead letters** : `increase(dvig_dead_letters_total[1h]) > 0`
4. **Durée élevée** : `histogram_quantile(0.95, rate(dvig_forward_duration_seconds_bucket[5m])) > 5`

---

## 📝 Notes

- Les métriques nécessitent `prometheus_client` (optionnel, fallback si non installé)
- Les métriques sont mises à jour lors du traitement des événements par le worker
- Le backlog est mis à jour à chaque exécution du worker

---

**Documentation créée** ✅
