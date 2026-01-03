# 🔧 Correction : Retry dans TokenStore.__init__()

**Date** : 2025-01-28  
**Problème** : Store non initialisé au démarrage (timing Docker volume mount)  
**Solution** : Ajout d'un mécanisme de retry dans `YamlTokenStore.__init__()`

---

## 🔴 Problème Identifié

### Symptômes
- Le store peut charger les tokens **manuellement** (test direct)
- L'**authentification échoue** avec "INVALID_TOKEN" même avec un token valide
- Les logs montrent "Permission denied" au démarrage
- Le reload au startup ne fonctionne pas

### Cause Racine
Le volume Docker (`/etc/dvig/tokens.yml`) n'est **pas encore monté** au moment où `YamlTokenStore.__init__()` est appelé dans `app.py`. Le chargement initial échoue avec "Permission denied", et le store reste vide.

---

## ✅ Solution Implémentée

### 1. Retry dans `__init__()`

**Fichier** : `sources/dvig/dvig/api_fastapi/auth/token_store.py`

```python
def __init__(self, file_path: str, retry_count: int = 3, retry_delay: float = 1.0):
    """
    Initialise le store YAML avec retry pour gérer le timing du montage Docker.
    
    Args:
        file_path: Chemin vers le fichier YAML
        retry_count: Nombre de tentatives de chargement (défaut: 3)
        retry_delay: Délai entre les tentatives en secondes (défaut: 1.0)
    """
    self.file_path = file_path
    self._tokens: Dict[str, TokenInfo] = {}
    self._lock = threading.RLock()
    self._available = False
    
    # Chargement initial avec retry
    for attempt in range(retry_count):
        if self.reload():
            # Succès
            break
        elif attempt < retry_count - 1:
            # Échec, mais on peut réessayer
            log.warning(f"Tentative {attempt + 1}/{retry_count} échouée, retry dans {retry_delay}s...")
            time.sleep(retry_delay)
        else:
            # Dernière tentative échouée
            log.error(f"Échec chargement initial après {retry_count} tentatives")
```

### 2. Import `time` ajouté

```python
import time
```

### 3. Amélioration logs au startup

**Fichier** : `sources/dvig/dvig/api_fastapi/app.py`

```python
@app.on_event("startup")
def startup_event():
    manager.register_sighup_handler()
    manager.start_auto_reload()
    # Vérifier l'état du store après le startup
    if store.is_available():
        log.info(f"Store disponible: {len(store._tokens)} tokens chargés")
    else:
        log.warning("Store non disponible au démarrage, tentative de reload...")
        if store.reload():
            log.info(f"Reload réussi: {len(store._tokens)} tokens chargés")
        else:
            log.error("Reload échoué, store toujours indisponible")
```

---

## 📊 Comportement Attendu

### Scénario 1 : Volume monté rapidement
- Tentative 1 : ✅ Succès
- Log : `Tokens rechargés: 1 tokens chargés`

### Scénario 2 : Volume monté avec délai
- Tentative 1 : ❌ Échec (Permission denied)
- Log : `Tentative 1/3 échouée, retry dans 1.0s...`
- Tentative 2 : ✅ Succès
- Log : `Tokens rechargés: 1 tokens chargés`

### Scénario 3 : Volume jamais monté
- Tentative 1-3 : ❌ Échec
- Log : `Échec chargement initial après 3 tentatives`
- Store : `_available = False`, `_tokens = {}`

---

## 🧪 Tests

### Test 1 : Vérification retry
```bash
docker logs dvig-stinger | grep -E "(Tentative|tokens rechargés|Échec)"
```

### Test 2 : Authentification
```bash
TOKEN="dvig_UD83JwIcjHBnm7QhHHcaklBkFEghrE6RhbrQGM7EEFk"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8082/ingest \
  -X POST -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.test","data":{}}'
```

### Test 3 : Script de validation
```bash
cd /opt/dorevia-plateform/sources/dvig
./scripts/validate_stinger.sh
```

---

## 📝 Configuration

Les paramètres de retry peuvent être ajustés si nécessaire :

```python
# Dans app.py (si besoin)
store = YamlTokenStore(
    tokens_file,
    retry_count=5,      # Plus de tentatives
    retry_delay=0.5     # Délai plus court
)
```

**Valeurs par défaut** :
- `retry_count=3` : 3 tentatives
- `retry_delay=1.0` : 1 seconde entre chaque tentative
- **Total max** : ~3 secondes de délai

---

## ✅ Résultat Attendu

Après cette correction :
- ✅ Store correctement initialisé au démarrage
- ✅ Tokens chargés même si volume monté avec délai
- ✅ Authentification fonctionnelle
- ✅ Test 6 (Univers Mismatch) devrait passer (403 au lieu de 401)

---

**Dernière mise à jour** : 2025-01-28

