# 📊 Métriques Prometheus — Vault (Événements DVIG)

**SPEC** : DVIG → Vault Forwarding v1.1  
**Sprint** : C — Monitoring et Observabilité  
**Date** : 2026-01-11

---

## 🎯 Objectif

Documenter les métriques Prometheus spécifiques aux événements DVIG dans Vault.

---

## 📡 Endpoint Métriques

**URL** : `GET /metrics`  
**Format** : Prometheus text format  
**Exemple** : `curl http://localhost:8080/metrics`

---

## 📊 Métriques Événements DVIG

### Counter : Événements Ingérés

**Nom** : `vault_events_ingested_total`  
**Type** : Counter  
**Labels** :
- `tenant` : ID du tenant
- `event_type` : Type d'événement (invoice.posted, invoice.refund.posted, etc.)

**Description** : Nombre total d'événements ingérés via `/api/v1/events`

**Exemple** :
```
vault_events_ingested_total{tenant="test-tenant",event_type="invoice.posted"} 567
```

**Requête Prometheus** :
```promql
# Taux d'ingestion par minute
rate(vault_events_ingested_total[1m])
```

---

### Counter : Événements Idempotents

**Nom** : `vault_events_idempotent_total`  
**Type** : Counter  
**Labels** :
- `tenant` : ID du tenant

**Description** : Nombre total d'événements idempotents (déjà vaultés, même `idempotency_key`)

**Exemple** :
```
vault_events_idempotent_total{tenant="test-tenant"} 12
```

**Requête Prometheus** :
```promql
# Taux d'idempotence
rate(vault_events_idempotent_total[5m]) / 
rate(vault_events_ingested_total[5m] + vault_events_idempotent_total[5m])
```

**Note** : Un taux d'idempotence élevé peut indiquer des retries depuis DVIG ou des doublons.

---

### Counter : Événements Échoués

**Nom** : `vault_events_failed_total`  
**Type** : Counter  
**Labels** :
- `tenant` : ID du tenant
- `error_type` : Type d'erreur (validation_error, storage_error, etc.)

**Description** : Nombre total d'événements échoués lors de l'ingestion

**Exemple** :
```
vault_events_failed_total{tenant="test-tenant",error_type="validation_error"} 3
vault_events_failed_total{tenant="test-tenant",error_type="storage_error"} 1
```

**Alerte recommandée** :
```yaml
- alert: VaultEventsFailed
  expr: rate(vault_events_failed_total[5m]) > 0
  for: 1m
  annotations:
    summary: "Événements échoués détectés (investigation requise)"
```

---

## 📈 Requêtes Prometheus Utiles

### Taux de Succès

```promql
# Taux de succès (ingérés / total)
rate(vault_events_ingested_total[5m]) / 
(rate(vault_events_ingested_total[5m]) + 
 rate(vault_events_idempotent_total[5m]) + 
 rate(vault_events_failed_total[5m]))
```

### Événements par Type

```promql
# Événements ingérés par type
sum by (event_type) (rate(vault_events_ingested_total[5m]))
```

### Taux d'Idempotence

```promql
# Taux d'idempotence par tenant
rate(vault_events_idempotent_total[5m]) / 
(rate(vault_events_ingested_total[5m]) + rate(vault_events_idempotent_total[5m]))
```

### Erreurs par Type

```promql
# Erreurs par type
sum by (error_type) (rate(vault_events_failed_total[5m]))
```

---

## 🚨 Alertes Recommandées

### Dashboard Grafana

Créer un dashboard avec :
- **Ingestion** : Graphique `vault_events_ingested_total` par tenant et event_type
- **Idempotence** : Graphique `vault_events_idempotent_total` par tenant
- **Erreurs** : Graphique `vault_events_failed_total` par tenant et error_type
- **Taux de succès** : Graphique taux de succès (ingérés / total)

### Alertes Critiques

1. **Erreurs détectées** : `rate(vault_events_failed_total[5m]) > 0`
2. **Taux d'idempotence élevé** : `rate(vault_events_idempotent_total[5m]) / rate(vault_events_ingested_total[5m]) > 0.5` (peut indiquer des retries excessifs)

---

## 📝 Notes

- Les métriques sont enregistrées dans `handlers/events.go`
- Les métriques sont exposées via l'endpoint `/metrics` (déjà existant)
- Les métriques sont compatibles avec les métriques existantes de Vault

---

**Documentation créée** ✅
