# ⚠️ Explication — Worker DVIG Non Déployé

**Date** : 2026-01-11  
**Problème** : Le document n'arrive pas dans Vault car le worker DVIG n'est pas disponible

---

## 🔍 Diagnostic

### Problème identifié
Le **worker DVIG** (`outbox_worker`) n'est **pas inclus dans l'image Docker** `dorevia/dvig:0.1.2-auth`.

### Vérification
```bash
# Le code du worker existe dans les sources
ls sources/dvig/workers/outbox_worker.py  # ✅ Existe

# Mais n'est pas dans l'image Docker
docker exec dvig-core-stinger find /app -name "outbox_worker.py"  # ❌ Non trouvé
```

### Cause
Le `Dockerfile` de DVIG ne copie que :
- `dvig/` → `/app/dvig/`
- `config/` → `/app/config/`

Mais **ne copie pas** :
- `workers/` → Le répertoire contenant `outbox_worker.py`

---

## 📋 Flux Actuel (Bloqué)

### ✅ Étape 1 : Odoo → DVIG (FAIT)
```
Odoo CRON #1
  ↓
POST /ingest vers DVIG
  ↓
DVIG stocke dans outbox_events (status='accepted')
  ↓
Odoo : dorevia_vault_status = 'pending_proof'
```

### ⏳ Étape 2 : DVIG → Vault (BLOQUÉ)
```
Worker DVIG (process_outbox_events)
  ↓
❌ CODE NON DISPONIBLE DANS L'IMAGE
  ↓
Événement reste dans outbox_events
  ↓
Document jamais envoyé vers Vault
```

### ⏳ Étape 3 : Odoo → Vault (EN ATTENTE)
```
Odoo CRON #2
  ↓
GET /api/v1/proof/account_move/1896
  ↓
404 (document n'existe pas dans Vault)
  ↓
Retry automatique avec backoff exponentiel
```

---

## 🔧 Solutions

### Solution 1 : Rebuild l'image DVIG avec le worker (Recommandé)

**Modifier le Dockerfile** :
```dockerfile
# Dans sources/dvig/docker/Dockerfile
# Ajouter après la ligne 31 :
COPY workers/ ./workers/
```

**Rebuild et redéployer** :
```bash
cd /opt/dorevia-plateform/sources/dvig
docker build -f docker/Dockerfile -t dorevia/dvig:0.1.3 .
# Mettre à jour docker-compose.yml avec la nouvelle version
# Redémarrer le conteneur
```

### Solution 2 : Monter le code en volume (Temporaire pour test)

**Modifier docker-compose.yml** :
```yaml
services:
  dvig:
    volumes:
      # ... volumes existants ...
      - /opt/dorevia-plateform/sources/dvig/workers:/app/workers:ro
```

**Redémarrer** :
```bash
docker compose up -d dvig
```

### Solution 3 : Lancer le worker depuis les sources (Test local)

Si vous avez accès au code source sur la machine hôte :
```bash
cd /opt/dorevia-plateform/sources/dvig
python3 -m workers.outbox_worker --limit 50
```

---

## 📊 Impact

### État actuel
- ✅ **CRON #1** : Fonctionne (événements dans outbox)
- ❌ **Worker DVIG** : Non disponible (code non déployé)
- ⏳ **CRON #2** : Attend indéfiniment (document jamais dans Vault)

### Conséquence
Les événements s'accumulent dans `outbox_events` avec `status='accepted'` mais ne sont jamais traités pour être envoyés vers Vault.

---

## 🎯 Action Requise

**Pour que le flux fonctionne complètement** :

1. **Rebuild l'image DVIG** avec le code du worker inclus
2. **Redéployer** le conteneur DVIG
3. **Configurer le worker** pour s'exécuter automatiquement (CRON ou service)

**Alternative temporaire** :
- Monter le code du worker en volume pour tester immédiatement

---

## 📝 Fichiers à Modifier

1. **`sources/dvig/docker/Dockerfile`**
   - Ajouter : `COPY workers/ ./workers/`

2. **`tenants/core-stinger/platform/docker-compose.yml`** (si solution volume)
   - Ajouter volume : `- /opt/dorevia-plateform/sources/dvig/workers:/app/workers:ro`

3. **Configuration CRON/Service** (pour automatisation)
   - Ajouter un CRON ou service pour lancer le worker périodiquement

---

**Auteur** : Assistant IA (Auto)  
**Date** : 2026-01-11
