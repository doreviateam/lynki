# 🔍 Investigation STINGER - Problème Authentification

**Date** : 2025-01-28  
**Problème** : Authentification échoue avec "INVALID_TOKEN" même avec token valide

---

## 🔴 Symptômes

1. ✅ Le store peut charger les tokens **manuellement** (test direct)
2. ❌ L'**authentification échoue** avec "INVALID_TOKEN" même avec un token valide
3. ⚠️ Les logs ne montrent pas "tokens rechargés" au démarrage
4. ⚠️ Le test "Univers Mismatch" retourne 401 au lieu de 403

---

## 🔍 Hypothèses

### Hypothèse 1 : Store non initialisé dans l'application
- Le store est créé dans `app.py` mais n'est pas correctement initialisé
- Le `_token_store` global est `None` ou vide

### Hypothèse 2 : Timing du montage Docker
- Le volume n'est pas monté au moment du `__init__()`
- Le retry ne fonctionne pas (pas de logs)

### Hypothèse 3 : Hash mismatch
- Le hash calculé ne correspond pas au hash stocké
- Problème de normalisation (minuscules/majuscules)

---

## ✅ Actions Correctives Appliquées

1. ✅ **Retry dans `__init__()`** : 3 tentatives avec délai de 1s
2. ✅ **Import `time` ajouté** : Correction manquante
3. ✅ **Logs améliorés** : Vérification état store au startup
4. ✅ **Permissions corrigées** : `0444` sur `/etc/dvig/tokens.yml`

---

## 📊 Tests à Effectuer

### Test 1 : Vérifier hash du token
```bash
python3 << 'PYEOF'
import hashlib
token = "dvig_UD83JwIcjHBnm7QhHHcaklBkFEghrE6RhbrQGM7EEFk"
token_hash = hashlib.sha256(token.encode()).hexdigest()
print(f"Hash calculé: {token_hash}")
print(f"Hash attendu: 10f2b639ecf0e96df50adf3ec3358a0a815214396051e2eb87a4403889081340")
PYEOF
```

### Test 2 : Vérifier store dans l'application
```bash
docker exec dvig-stinger python3 << 'PYEOF'
from dvig.api_fastapi.auth.auth import _token_store
print(f"Store: {_token_store}")
print(f"Available: {_token_store.is_available() if _token_store else None}")
print(f"Tokens: {len(_token_store._tokens) if _token_store else 0}")
PYEOF
```

### Test 3 : Vérifier logs retry
```bash
docker logs dvig-stinger | grep -E "(Tentative|tokens rechargés|Échec)"
```

---

## 🎯 Prochaines Étapes

1. **Vérifier les logs** : Confirmer si le retry fonctionne
2. **Vérifier le hash** : Confirmer que le hash calculé correspond
3. **Vérifier le store global** : Confirmer que `_token_store` est initialisé
4. **Solution alternative** : Si le retry ne fonctionne pas, utiliser un healthcheck qui force le reload

---

**Dernière mise à jour** : 2025-01-28

