# 🔍 Diagnostic : Worker DVIG Outbox

**Date** : 2026-01-11  
**Problème** : La facture FAC/2026/00003 (ID: 1899) est en statut `pending_proof` mais n'apparaît pas dans Vault

---

## 📊 État Actuel

### Facture Odoo
- **Numéro** : `FAC/2026/00003`
- **ID Odoo** : `1899`
- **Statut Vault** : `pending_proof` (en attente de preuve)
- **Event ID DVIG** : `2929a285-161d-4b53-9030-0fbc65397f18`
- **Dernière tentative** : 12/01/2026 00:26:47

### Événement DVIG
- ✅ **Accepté par DVIG** : L'événement a été reçu et stocké dans l'outbox
- ✅ **Outbox ID** : 3
- ⚠️ **Statut** : Probablement `accepted` ou `forwarding` (à vérifier)

### Vault
- ❌ **Document non trouvé** : La facture n'est pas encore dans Vault

---

## 🔍 Diagnostic

### Problème Identifié

Le **worker outbox DVIG** n'est probablement **pas en cours d'exécution**.

**Preuve** :
1. Le docker-compose.yml indique : `# Workers (temporaire pour test - le code n'est pas dans l'image Docker)`
2. Aucun volume n'est monté pour les workers dans la configuration actuelle
3. L'événement est dans l'outbox mais n'est pas traité

### Flux Attendu

```
Odoo → DVIG /ingest → Outbox (accepted) → Worker Outbox → Vault /api/v1/events → Vault DB
```

**État actuel** : Le flux s'arrête à "Outbox (accepted)" car le worker ne traite pas les événements.

---

## 🔧 Solution

### Option 1 : Démarrer le Worker Outbox Manuellement

Le worker doit être exécuté dans le conteneur DVIG :

```bash
# Se connecter au conteneur DVIG
docker exec -it dvig-core-stinger bash

# Démarrer le worker (si le code est disponible)
python -m workers.outbox_worker
```

### Option 2 : Ajouter le Worker au Docker Compose

Modifier `tenants/core-stinger/platform/docker-compose.yml` pour ajouter un service worker :

```yaml
services:
  dvig-outbox-worker:
    image: dorevia/dvig:0.1.4
    container_name: dvig-outbox-worker-core-stinger
    restart: unless-stopped
    command: ["python", "-m", "workers.outbox_worker"]
    environment:
      - DATABASE_URL=postgresql://vault:${VAULT_DB_PASSWORD:-vault_password}@vault-db-core-stinger:5432/dorevia_vault
      - VAULT_URL=http://vault-core-stinger:8080
    depends_on:
      - vault-db
      - vault
    networks:
      - dorevia-network
```

### Option 3 : Vérifier si le Worker est Intégré dans l'Image

Vérifier si l'image `dorevia/dvig:0.1.4` contient le code du worker et s'il peut être démarré automatiquement.

---

## 📝 Actions Recommandées

1. ✅ **Vérifier l'état de l'outbox** dans la base de données Vault
2. ✅ **Vérifier si le worker est en cours d'exécution**
3. ⚠️ **Démarrer le worker si nécessaire**
4. ⚠️ **Vérifier les logs du worker** pour voir s'il traite les événements

---

## 🔗 Références

- **Code worker** : `sources/dvig/workers/outbox_worker.py`
- **Documentation** : `ZeDocs/TestV3/RAPPORT_DETAILLE_IMPLEMENTATION_WORKER_DVIG_20260111.md`
- **Docker Compose** : `tenants/core-stinger/platform/docker-compose.yml`
