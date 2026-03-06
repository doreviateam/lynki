# 🚨 Runbook Production — DVIG → Vault Forwarding

**SPEC** : DVIG → Vault Forwarding v1.1  
**Sprint** : D — Hardening  
**Date** : 2026-01-11  
**Mise à jour** : 2026-01-12 (Addendum v1.1.1-add1 — Interdictions explicites)

---

## 🎯 Objectif

Guide opérationnel pour gérer les incidents en production liés au forwarding DVIG → Vault.

---

## ⚠️ Interdictions Explicites (PROD)

**SPEC v1.1.1 — Addendum "No Human In The Loop"** : Le vaulting est **100% automatisé**. Aucune intervention humaine ne doit être nécessaire pour le processus normal de vaulting.

### FORB-1 : Boutons d'action manuelle (Odoo)

Les boutons "Trigger DVIG Worker Now" et "Refresh Proof Now" dans Odoo sont des **outils de diagnostic** uniquement.

**Caractéristiques** :
- ✅ **Outils de diagnostic uniquement** : Permettent de tester et diagnostiquer le système
- ✅ **Réservés à l'administrateur** : Visible uniquement pour le groupe `base.group_system`
- ✅ **Désactivés en PROD** : Protégés par un flag (`dorevia.debug.actions = 0` en PROD)
- ✅ **N'interviennent jamais dans le processus de vaulting** : Le vaulting reste 100% automatisé

**Configuration** :
- **PROD** : `dorevia.debug.actions = 0` (défaut) → Boutons masqués et désactivés
- **DEV/STAGING** : `dorevia.debug.actions = 1` → Boutons visibles pour diagnostic

**Important** : Ces boutons sont **purement diagnostiques** et n'interviennent **jamais** dans le processus de vaulting automatisé. Le vaulting reste **100% autonome** même si ces boutons sont utilisés en DEV.

### FORB-2 : Scripts SQL/curl pour corriger factures

**Interdit en PROD** :
- ❌ **Patch SQL de `dorevia_vault_status`** : Ne jamais modifier manuellement le statut d'une facture
- ❌ **Curl pour "forcer" un vaulting** : Ne jamais forcer un vaulting via API
- ❌ **Correction manuelle de statuts** : Ne jamais corriger manuellement une facture bloquée
- ❌ **Modification de `dorevia_vault_attempt_count`** : Ne jamais réinitialiser manuellement les tentatives
- ❌ **Modification de `dorevia_vault_next_retry_at`** : Ne jamais forcer un retry manuellement

**Autorisé (maintenance infrastructure uniquement)** :
- ✅ **Redémarrage service** : Redémarrer Odoo, DVIG, Vault si nécessaire
- ✅ **Vérification métriques** : Consulter Prometheus, logs, métriques Odoo
- ✅ **Rotation token** : Rotation des tokens d'authentification (DVIG, Vault)
- ✅ **Consultation logs** : Analyser les logs pour diagnostiquer les problèmes
- ✅ **Vérification configuration** : Vérifier les paramètres système Odoo

**Procédure si facture bloquée** :
1. **Diagnostiquer la cause** :
   - Consulter les logs Odoo pour la facture concernée
   - Vérifier les métriques Prometheus
   - Vérifier les logs DVIG et Vault
   - Identifier la cause racine (erreur réseau, timeout, erreur Vault, etc.)

2. **Corriger la cause racine** :
   - Si problème réseau : Vérifier connectivité
   - Si problème Vault : Vérifier santé Vault
   - Si problème configuration : Corriger configuration
   - Si problème token : Rotation token

3. **Laisser le système se réparer automatiquement** :
   - Le système retentera automatiquement via les filets de sécurité
   - CRON Reconciler rattrapera les factures bloquées
   - DVIG Scheduler traitera l'outbox automatiquement

4. **Si problème persiste après correction** :
   - Vérifier les seuils d'abandon (MAX_ATTEMPTS, MAX_AGE)
   - Si seuil dépassé → facture en `failed_hard` (incident déclaré)
   - Analyser l'incident via les logs structurés
   - Escalader si nécessaire

**Exemple de diagnostic (autorisé)** :
```sql
-- ✅ AUTORISÉ : Consultation pour diagnostic
SELECT 
  name,
  dorevia_vault_status,
  dorevia_vault_attempt_count,
  dorevia_vault_last_try_at,
  dorevia_vault_last_error
FROM account_move
WHERE dorevia_vault_status IN ('pending_proof', 'failed_soft', 'failed_hard')
ORDER BY dorevia_vault_last_try_at DESC
LIMIT 10;
```

**Exemple interdit** :
```sql
-- ❌ INTERDIT : Correction manuelle
UPDATE account_move
SET dorevia_vault_status = 'vaulted'
WHERE id = 1905;
```

---

---

## 📊 Scénarios d'Incidents

### 🔴 Incident 1 : Backlog Explose

**Symptômes** :
- Métrique `dvig_outbox_backlog` > 1000
- Worker ne traite plus assez vite
- Latence d'ingestion élevée

**Diagnostic** :
```bash
# Vérifier le backlog actuel
curl http://localhost:8080/metrics | grep dvig_outbox_backlog

# Compter les événements en attente (SQL)
sqlite3 /path/to/dvig.db "
  SELECT COUNT(*) 
  FROM outbox_events 
  WHERE status IN ('accepted', 'failed_soft') 
    AND (next_retry_at IS NULL OR next_retry_at <= datetime('now'))
"

# Ou PostgreSQL
psql $DATABASE_URL -c "
  SELECT COUNT(*) 
  FROM outbox_events 
  WHERE status IN ('accepted', 'failed_soft') 
    AND (next_retry_at IS NULL OR next_retry_at <= NOW())
"
```

**Actions Correctives** :

1. **Augmenter le nombre de workers** :
   ```bash
   # Lancer plusieurs workers en parallèle
   python -m dvig.cli.outbox_worker --limit 100 &
   python -m dvig.cli.outbox_worker --limit 100 &
   python -m dvig.cli.outbox_worker --limit 100 &
   ```

2. **Augmenter la limite par batch** :
   ```bash
   # Traiter plus d'événements par batch
   python -m dvig.cli.outbox_worker --limit 200
   ```

3. **Vérifier la santé de Vault** :
   ```bash
   curl http://vault:8080/health
   curl http://vault:8080/metrics | grep vault_events
   ```

4. **Si Vault est lent** :
   - Vérifier les métriques Vault (CPU, mémoire, disque)
   - Vérifier les logs Vault pour erreurs
   - Augmenter les ressources Vault si nécessaire

5. **Si backlog persiste** :
   - Augmenter la fréquence d'exécution du worker (cron plus fréquent)
   - Vérifier les erreurs soft (peut indiquer un problème réseau)
   - Considérer un scale-out horizontal (plusieurs instances DVIG)

**Prévention** :
- Monitorer `dvig_outbox_backlog` avec alerte si > 100
- Monitorer le taux de traitement (succès / minute)
- Ajuster automatiquement le nombre de workers selon le backlog

---

### 🔴 Incident 2 : Worker Ne Traite Plus

**Symptômes** :
- Backlog augmente continuellement
- Métrique `dvig_forward_success_total` ne s'incrémente plus
- Logs worker montrent des erreurs

**Diagnostic** :
```bash
# Vérifier si le worker est en cours d'exécution
ps aux | grep outbox_worker

# Vérifier les logs du worker
tail -f /var/log/dvig/worker.log

# Tester manuellement le worker
python -m dvig.cli.outbox_worker --limit 10 -v
```

**Actions Correctives** :

1. **Redémarrer le worker** :
   ```bash
   # Arrêter le worker actuel
   pkill -f "outbox_worker"
   
   # Redémarrer
   python -m dvig.cli.outbox_worker --limit 50 &
   ```

2. **Vérifier la connexion à la base de données** :
   ```bash
   # Tester la connexion
   python -c "
   from storage.database import get_db
   db = next(get_db())
   print('DB OK')
   "
   ```

3. **Vérifier la connexion à Vault** :
   ```bash
   curl $VAULT_URL/health
   curl $VAULT_URL/api/v1/events -X POST -H "Content-Type: application/json" -d '{"test":"data"}'
   ```

4. **Vérifier les erreurs dans outbox_events** :
   ```sql
   SELECT status, COUNT(*), MAX(last_error) 
   FROM outbox_events 
   GROUP BY status;
   ```

5. **Si erreurs hard détectées** :
   - Vérifier les événements en `failed_hard`
   - Analyser `last_error` pour identifier la cause
   - Corriger le problème (payload invalide, authentification, etc.)

**Prévention** :
- Monitorer le worker avec healthcheck
- Alertes si backlog augmente sans traitement
- Redémarrage automatique du worker en cas de crash

---

### 🔴 Incident 3 : Vault Ne Répond Plus

**Symptômes** :
- Métrique `dvig_forward_failed_soft_total{error_type="timeout"}` augmente
- Métrique `dvig_forward_failed_soft_total{error_type="network_error"}` augmente
- Backlog augmente avec statut `failed_soft`

**Diagnostic** :
```bash
# Vérifier la santé de Vault
curl http://vault:8080/health
curl http://vault:8080/health/detailed

# Vérifier les métriques Vault
curl http://vault:8080/metrics

# Vérifier la connectivité réseau
ping vault
telnet vault 8080
```

**Actions Correctives** :

1. **Vérifier l'état de Vault** :
   ```bash
   # Health check
   curl http://vault:8080/health
   
   # Health check détaillé
   curl http://vault:8080/health/detailed
   ```

2. **Vérifier les logs Vault** :
   ```bash
   tail -f /var/log/vault/vault.log
   ```

3. **Vérifier les ressources Vault** :
   ```bash
   # CPU, mémoire, disque
   curl http://vault:8080/metrics | grep system_
   ```

4. **Si Vault est down** :
   - Redémarrer Vault
   - Vérifier les dépendances (PostgreSQL, storage)
   - Vérifier les logs pour erreurs critiques

5. **Si Vault est lent** :
   - Vérifier les métriques de performance
   - Vérifier les requêtes lentes dans PostgreSQL
   - Augmenter les ressources si nécessaire

6. **Une fois Vault restauré** :
   - Le worker retentera automatiquement (backoff exponentiel)
   - Vérifier que le backlog diminue
   - Monitorer les métriques de succès

**Prévention** :
- Healthcheck Vault avec alertes
- Monitorer les timeouts et erreurs réseau
- Redondance Vault (load balancer, plusieurs instances)

---

### 🔴 Incident 4 : Dead Letters Augmentent

**Symptômes** :
- Métrique `dvig_dead_letters_total` augmente
- Événements en statut `failed_hard` dans outbox_events
- Erreurs 400, 401, 403, 404, 422 depuis Vault

**Diagnostic** :
```sql
-- Lister les événements en failed_hard
SELECT 
  event_id,
  idempotency_key,
  tenant,
  env,
  attempt_count,
  last_error,
  created_at
FROM outbox_events
WHERE status = 'failed_hard'
ORDER BY created_at DESC
LIMIT 20;
```

**Actions Correctives** :

1. **Analyser les erreurs** :
   ```sql
   -- Erreurs les plus fréquentes
   SELECT 
     last_error,
     COUNT(*) as count
   FROM outbox_events
   WHERE status = 'failed_hard'
   GROUP BY last_error
   ORDER BY count DESC;
   ```

2. **Corriger selon le type d'erreur** :

   **Erreur 400 (Bad Request)** :
   - Vérifier le format du payload
   - Vérifier les champs obligatoires
   - Corriger le payload dans Odoo si nécessaire

   **Erreur 401 (Unauthorized)** :
   - Vérifier le token d'authentification DVIG → Vault
   - Régénérer le token si nécessaire
   - Mettre à jour `VAULT_API_KEY` dans DVIG

   **Erreur 403 (Forbidden)** :
   - Vérifier les permissions du token
   - Vérifier l'isolation tenant

   **Erreur 404 (Not Found)** :
   - Vérifier que l'endpoint `/api/v1/events` existe
   - Vérifier l'URL de Vault (`VAULT_URL`)

   **Erreur 422 (Unprocessable Entity)** :
   - Vérifier la validation du payload
   - Vérifier les contraintes de la base de données

3. **Réessayer les événements** (si corrigé) :
   ```sql
   -- ⚠️ ATTENTION : Cette opération doit être exceptionnelle et justifiée
   -- Ne pas utiliser pour "corriger" des factures Odoo
   -- Utiliser uniquement pour réessayer des événements DVIG après correction de la cause racine
   -- Réinitialiser le statut pour réessayer
   UPDATE outbox_events
   SET status = 'accepted',
       attempt_count = 0,
       last_error = NULL,
       next_retry_at = NULL
   WHERE status = 'failed_hard'
     AND last_error LIKE '%400%'  -- Exemple : réessayer les 400
   ```
   
   **Note** : Cette opération concerne uniquement les événements DVIG (table `outbox_events`), **pas** les factures Odoo (table `account_move`). Pour les factures Odoo, voir section "Interdictions Explicites (PROD)" ci-dessus.

4. **Exporter les dead letters pour analyse** :
   ```sql
   -- Exporter en CSV
   COPY (
     SELECT * FROM outbox_events WHERE status = 'failed_hard'
   ) TO '/tmp/dead_letters.csv' WITH CSV HEADER;
   ```

**Prévention** :
- Monitorer `dvig_dead_letters_total` avec alertes
- Alertes si erreurs hard détectées
- Validation du payload côté Odoo avant envoi

---

## 🔧 Commandes Utiles

### CLI Worker

```bash
# Exécuter le worker manuellement
python -m dvig.cli.outbox_worker --limit 50

# Exécuter avec verbose
python -m dvig.cli.outbox_worker --limit 50 -v

# Exécuter en mode one-shot (pas de boucle)
python -m dvig.cli.outbox_worker --limit 50 --once
```

### Requêtes SQL

```sql
-- Backlog actuel
SELECT COUNT(*) FROM outbox_events 
WHERE status IN ('accepted', 'failed_soft') 
  AND (next_retry_at IS NULL OR next_retry_at <= NOW());

-- Événements par statut
SELECT status, COUNT(*) FROM outbox_events GROUP BY status;

-- Événements en attente de retry
SELECT COUNT(*) FROM outbox_events 
WHERE status = 'failed_soft' AND next_retry_at <= NOW();

-- Dead letters
SELECT COUNT(*) FROM outbox_events WHERE status = 'failed_hard';

-- Top erreurs
SELECT last_error, COUNT(*) as count
FROM outbox_events
WHERE last_error IS NOT NULL
GROUP BY last_error
ORDER BY count DESC
LIMIT 10;
```

### Métriques Prometheus

```bash
# Backlog actuel
curl http://localhost:8080/metrics | grep dvig_outbox_backlog

# Taux de succès
curl http://localhost:8080/metrics | grep dvig_forward_success_total

# Erreurs
curl http://localhost:8080/metrics | grep dvig_forward_failed

# Dead letters
curl http://localhost:8080/metrics | grep dvig_dead_letters_total
```

---

## 📝 Procédures de Récupération

### Récupération après Panne Vault

1. Vérifier que Vault est restauré
2. Le worker retentera automatiquement (backoff exponentiel)
3. Monitorer le backlog pour vérifier qu'il diminue
4. Si backlog ne diminue pas, augmenter le nombre de workers temporairement

### Récupération après Panne DVIG

1. Redémarrer DVIG
2. Vérifier que le worker redémarre automatiquement
3. Vérifier que les événements en attente sont traités
4. Monitorer les métriques pour vérifier la reprise normale

### Récupération Dead Letters

1. Analyser les erreurs dans `outbox_events` (colonne `last_error`)
2. Corriger le problème à la source (Odoo, payload, etc.)
3. Réinitialiser le statut des événements corrigés :
   ```sql
   UPDATE outbox_events
   SET status = 'accepted',
       attempt_count = 0,
       last_error = NULL,
       next_retry_at = NULL
   WHERE status = 'failed_hard'
     AND idempotency_key IN ('key1', 'key2', ...)
   ```
4. Le worker traitera automatiquement les événements réinitialisés

---

## 🚨 Escalade

Si les actions correctives ne résolvent pas le problème :

1. **Backlog > 10 000** : Escalade immédiate
2. **Dead letters > 100** : Escalade immédiate
3. **Vault down > 30 min** : Escalade immédiate
4. **Worker ne démarre plus** : Escalade immédiate

**Contacts** :
- Équipe DVIG : [contact]
- Équipe Vault : [contact]
- On-call : [contact]

---

**Runbook créé** ✅
