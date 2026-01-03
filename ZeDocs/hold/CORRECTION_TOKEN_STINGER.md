# 🔧 Correction Token STINGER - Hash Mismatch

**Date** : 2025-01-28  
**Problème** : Hash du token ne correspond pas au hash stocké  
**Solution** : Régénération du token STINGER

---

## 🔴 Problème Identifié

### Symptôme
- Authentification échoue avec "INVALID_TOKEN"
- Le hash calculé ne correspond pas au hash stocké

### Cause
Le token brut dans `conf/token_stinger_brut.txt` ne correspond pas au hash stocké dans `conf/tokens.stinger.yml`.

**Hash calculé** : `a06ee89fdac77832aa11be10e6ee14d7ed37d6e6f6f6815e9bb12d1fcf99267d`  
**Hash attendu** : `10f2b639ecf0e96df50adf3ec3358a0a815214396051e2eb87a4403889081340`

---

## ✅ Solution Appliquée

### 1. Régénération du token STINGER

**Nouveau token généré** :
- Token ID : `tok_stinger_odoo_02`
- Tenant : `stinger`
- Univers : `odoo`
- Status : `active`

### 2. Mise à jour des fichiers

**Fichiers mis à jour** :
- `conf/tokens.stinger.yml` : Hash corrigé
- `conf/token_stinger_brut.txt` : Token brut mis à jour
- `/etc/dvig/tokens.yml` : Copié sur le serveur STINGER

### 3. Redémarrage du container

```bash
docker restart dvig-stinger
```

---

## 🧪 Vérification

### Test 1 : Vérifier le hash
```bash
TOKEN=$(cat conf/token_stinger_brut.txt | grep "^TOKEN_BRUT=" | cut -d= -f2)
python3 << 'PYEOF'
import hashlib
token = "$TOKEN"
hash_calc = hashlib.sha256(token.encode()).hexdigest()
print(f"Hash calculé: {hash_calc}")
# Vérifier dans tokens.stinger.yml
PYEOF
```

### Test 2 : Authentification
```bash
TOKEN=$(cat conf/token_stinger_brut.txt | grep "^TOKEN_BRUT=" | cut -d= -f2)
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

## 📝 Notes

- ⚠️ **Ancien token révoqué** : `tok_stinger_odoo_01` (hash mismatch)
- ✅ **Nouveau token actif** : `tok_stinger_odoo_02`
- 🔐 **Sécurité** : Le token brut est stocké localement uniquement

---

**Dernière mise à jour** : 2025-01-28

