# 🔍 Analyse Détaillée : Blocage 5+ Heures et Résolution

**Date** : 2026-01-12  
**Facture** : FAC/2026/00004 (ID: 1900)  
**Durée du blocage** : Plus de 5 heures  
**Statut initial** : "En attente de preuve" (`pending_proof`)

---

## 🔴 Cause Racine du Blocage

### Problème Principal

**Le worker outbox DVIG n'était pas démarré automatiquement.**

### Chaîne de Causes

```
1. Facture validée dans Odoo (00:16:49)
   ↓
2. CRON #1 Odoo envoie vers DVIG ✅
   ↓
3. DVIG reçoit et stocke dans outbox ✅
   Event ID: b9e53686-920a-4493-9ab2-ae6b7654e78b
   Statut: accepted
   ↓
4. ❌ Worker outbox DVIG NON DÉMARRÉ
   ↓
5. Événement reste bloqué dans outbox (5+ heures)
   ↓
6. Document jamais créé dans Vault ❌
   ↓
7. CRON #2 Odoo ne trouve pas de preuve ❌
   ↓
8. Statut reste "pending_proof" indéfiniment
```

### Pourquoi le Worker n'Était Pas Démarré ?

**Configuration Docker Compose manquante** :

Le fichier `tenants/core-stinger/platform/docker-compose.yml` ne contenait **aucune commande** pour démarrer le worker. Le conteneur DVIG démarrait uniquement l'API FastAPI :

```yaml
# AVANT (configuration incomplète)
services:
  dvig:
    image: dorevia/dvig:0.1.4
    # ... pas de command pour démarrer le worker
    # Le conteneur démarre seulement l'API FastAPI
```

**Résultat** :
- ✅ API DVIG fonctionnelle (endpoint `/ingest` recevait les événements)
- ❌ Worker outbox non démarré (aucun processus pour traiter l'outbox)
- ❌ Événements accumulés dans `outbox_events` sans traitement

---

## 🔍 Diagnostic Effectué

### 1. Vérification de l'État dans Odoo

```sql
-- Facture en statut "pending_proof"
dorevia_vault_status = 'pending_proof'
dorevia_dvig_event_id = 'b9e53686-920a-4493-9ab2-ae6b7654e78b'
```

**Interprétation** : L'événement a été envoyé à DVIG, mais la preuve n'a jamais été récupérée.

### 2. Vérification dans l'Outbox DVIG

```sql
SELECT * FROM outbox_events WHERE event_id = 'b9e53686-920a-4493-9ab2-ae6b7654e78b';

Résultat:
- status: 'accepted'
- attempt_count: 0
- last_try_at: NULL
- vault_receipt_id: NULL
```

**Interprétation** : L'événement est dans l'outbox mais **jamais traité** par le worker.

### 3. Vérification du Worker

```bash
docker exec dvig-core-stinger ps aux | grep worker
# Résultat: Aucun processus worker trouvé
```

**Interprétation** : Le worker n'est **pas en cours d'exécution**.

### 4. Vérification dans Vault

```sql
SELECT * FROM documents WHERE odoo_id = 1900;
-- Résultat: 0 rows
```

**Interprétation** : Le document n'a **jamais été créé** dans Vault.

---

## 🔧 Résolution Appliquée

### Solution Immédiate (Traitement du Blocage)

**Action** : Exécution manuelle du worker pour traiter l'événement bloqué

```bash
docker exec dvig-core-stinger python3 -c \
  "from workers.outbox_worker import run_worker_sync; \
   run_worker_sync(limit=50)"
```

**Résultat** :
- ✅ Événement traité : `status = accepted → forwarded`
- ✅ Document créé dans Vault : `d839a058-0309-47e8-aa54-3f3c2fd82f35`
- ✅ Toutes les données de facturation enregistrées

### Solution Permanente (Prévention)

**Modification** : `tenants/core-stinger/platform/docker-compose.yml`

**AVANT** :
```yaml
services:
  dvig:
    image: dorevia/dvig:0.1.4
    # Pas de command → démarre seulement l'API
```

**APRÈS** :
```yaml
services:
  dvig:
    image: dorevia/dvig:0.1.4
    # Démarrage automatique de l'API ET du worker
    command: ["sh", "-c", "python -m dvig.api_fastapi & while true; do python3 -m workers.outbox_worker --limit 50 || true; sleep 30; done & wait"]
```

**Fonctionnement** :
1. **API FastAPI** démarre en arrière-plan (`&`)
2. **Worker outbox** s'exécute en boucle toutes les 30 secondes
3. **`wait`** maintient le conteneur actif

**Avantages** :
- ✅ Démarrage automatique avec le conteneur
- ✅ Redémarrage automatique si le conteneur redémarre (`restart: unless-stopped`)
- ✅ Aucune intervention manuelle nécessaire
- ✅ Traitement rapide (toutes les 30 secondes)

---

## 📊 Comparaison : Avant / Après

### Avant (Configuration Incomplète)

| Étape | Statut | Délai |
|-------|--------|-------|
| Facture validée | ✅ | Immédiat |
| CRON #1 → DVIG | ✅ | 1 minute |
| Worker traite | ❌ | **JAMAIS** (blocage) |
| Document Vault | ❌ | **JAMAIS** |
| CRON #2 récupère preuve | ❌ | **JAMAIS** |
| **Résultat** | ❌ | **Blocage indéfini** |

### Après (Configuration Complète)

| Étape | Statut | Délai |
|-------|--------|-------|
| Facture validée | ✅ | Immédiat |
| CRON #1 → DVIG | ✅ | 1 minute |
| Worker traite | ✅ | **30 secondes** |
| Document Vault | ✅ | **30 secondes** |
| CRON #2 récupère preuve | ✅ | **1 minute** |
| **Résultat** | ✅ | **Total: 1-2 minutes** |

---

## 🎯 Pourquoi ce Problème n'a Pas Été Détecté Plus Tôt ?

### Facteurs Contributifs

1. **Tests initiaux réussis** :
   - Les premières factures (1896, 1898) ont été vaultées **avant** le déploiement du worker
   - Le worker a été exécuté manuellement pour les tests
   - Aucun problème détecté lors des tests

2. **Configuration progressive** :
   - Le worker a été ajouté progressivement
   - La configuration automatique n'a pas été complétée immédiatement
   - Le docker-compose.yml n'a pas été mis à jour

3. **Manque de monitoring** :
   - Aucun alerting sur les événements bloqués dans l'outbox
   - Pas de vérification automatique que le worker tourne

---

## 🛡️ Mesures Préventives Appliquées

### 1. Configuration Automatique

✅ **Worker démarre automatiquement** avec le conteneur DVIG  
✅ **Redémarrage automatique** si le conteneur redémarre  
✅ **Aucune intervention manuelle** requise

### 2. Fréquence de Traitement

✅ **Toutes les 30 secondes** (au lieu de 5 minutes avec CRON)  
✅ **Traitement rapide** des événements  
✅ **Délai total réduit** à 1-2 minutes

### 3. Documentation

✅ **Rapport de diagnostic** créé  
✅ **Solution documentée** pour référence future  
✅ **Procédures de vérification** documentées

---

## 📝 Recommandations Futures

### Monitoring

1. **Alerting sur backlog** :
   ```sql
   -- Alerte si > 10 événements en attente depuis > 5 minutes
   SELECT COUNT(*) FROM outbox_events 
   WHERE status = 'accepted' 
     AND created_at < NOW() - INTERVAL '5 minutes';
   ```

2. **Healthcheck worker** :
   - Vérifier que le processus worker tourne
   - Alerter si le worker s'arrête

3. **Métriques** :
   - Nombre d'événements traités par heure
   - Temps moyen de traitement
   - Taux d'échec

### Tests Automatisés

1. **Test end-to-end** :
   - Créer une facture de test
   - Vérifier qu'elle est vaultée dans les 2 minutes
   - Alerter si délai dépassé

2. **Test de résilience** :
   - Simuler un arrêt du worker
   - Vérifier le redémarrage automatique
   - Vérifier le traitement des événements en attente

---

## ✅ Résultat Final

### Facture FAC/2026/00004

- ✅ **Document créé dans Vault** : `d839a058-0309-47e8-aa54-3f3c2fd82f35`
- ✅ **Toutes les données enregistrées** : invoice_number, move_type, invoice_date, total_ht, total_ttc, currency
- ✅ **Événement traité** : `status = forwarded`
- ⏳ **Statut Odoo** : Sera mis à jour à `vaulted` par le CRON #2 dans 1-2 minutes

### Système

- ✅ **Worker automatique** : Configuration permanente appliquée
- ✅ **Plus de blocage** : Les événements sont traités toutes les 30 secondes
- ✅ **Délai total** : 1-2 minutes au lieu de 5+ heures

---

## 🔗 Références

- **Docker Compose** : `tenants/core-stinger/platform/docker-compose.yml`
- **Code Worker** : `sources/dvig/workers/outbox_worker.py`
- **Rapport diagnostic** : `ZeDocs/TestV3/RAPPORT_DIAGNOSTIC_WORKER_DVIG_20260111.md`
- **Solution automatique** : `ZeDocs/TestV3/SOLUTION_WORKER_AUTOMATIQUE_20260111.md`
