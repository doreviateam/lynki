# ✅ Solution : Worker DVIG Outbox Automatique

**Date** : 2026-01-11  
**Problème** : Le worker outbox DVIG nécessitait une intervention manuelle  
**Solution** : Configuration automatique du worker dans docker-compose.yml

---

## 🔧 Modification Appliquée

### Docker Compose - Service DVIG

Le service `dvig` a été modifié pour démarrer automatiquement :
1. **L'API FastAPI** (endpoint `/ingest`)
2. **Le worker outbox** (toutes les 30 secondes)

### Configuration

```yaml
services:
  dvig:
    # ... configuration existante ...
    command: ["sh", "-c", "python -m dvig.api_fastapi & while true; do python3 -m workers.outbox_worker --limit 50 || true; sleep 30; done & wait"]
```

**Fonctionnement** :
- L'API démarre en arrière-plan (`&`)
- Le worker s'exécute en boucle toutes les 30 secondes
- `wait` maintient le conteneur actif

---

## ✅ Résultat

### Avant
- ❌ Worker non démarré automatiquement
- ❌ Intervention manuelle nécessaire : `docker exec dvig-core-stinger python3 -m workers.outbox_worker`
- ❌ Événements bloqués dans l'outbox

### Après
- ✅ Worker démarre automatiquement avec le conteneur
- ✅ Traitement automatique toutes les 30 secondes
- ✅ Aucune intervention manuelle nécessaire
- ✅ Redémarrage automatique si le conteneur redémarre (`restart: unless-stopped`)

---

## 📊 Validation

### Test de Fonctionnement

1. **Créer une nouvelle facture** dans Odoo
2. **Valider la facture** (statut `posted`)
3. **Attendre 1-2 minutes** (CRON Odoo + Worker DVIG)
4. **Vérifier dans Vault** que le document est présent avec toutes les données

### Vérification du Worker

```bash
# Vérifier les logs du worker
docker logs dvig-core-stinger --tail 50 | grep outbox_worker

# Vérifier les événements traités
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c \
  "SELECT COUNT(*) FROM outbox_events WHERE status = 'forwarded';"
```

---

## 🔄 Fréquence du Worker

**Actuellement** : Toutes les **30 secondes**

**Avantages** :
- ✅ Traitement rapide des événements
- ✅ Délai total réduit (Odoo CRON 1 min + Worker 30s = ~1-2 minutes)

**Si nécessaire**, on peut ajuster la fréquence :
- **Plus rapide** : `sleep 10` (toutes les 10 secondes)
- **Plus lent** : `sleep 60` (toutes les 60 secondes)

---

## 📝 Notes

- Le worker s'exécute en **boucle continue** dans le conteneur
- En cas d'erreur, le worker continue (`|| true`)
- Les logs sont disponibles via `docker logs dvig-core-stinger`
- Le worker traite jusqu'à **50 événements** par exécution

---

## 🔗 Références

- **Docker Compose** : `tenants/core-stinger/platform/docker-compose.yml`
- **Code Worker** : `sources/dvig/workers/outbox_worker.py`
- **Documentation** : `ZeDocs/TestV3/RAPPORT_DETAILLE_IMPLEMENTATION_WORKER_DVIG_20260111.md`
