# 🔧 Solution — Dépendance python-barcode non détectée par Odoo

**Date** : 2026-01-27  
**Problème** : Odoo affiche "External dependency python-barcode not installed" malgré l'installation

---

## ✅ Vérifications effectuées

### 1. Module installé et détectable
```bash
docker exec odoo_stinger_conceptsun97139 python3 -c "import barcode; print('OK')"
# ✅ Résultat: OK

docker exec odoo_stinger_conceptsun97139 python3 -c "import importlib.metadata; print(importlib.metadata.version('python-barcode'))"
# ✅ Résultat: 0.16.1
```

### 2. Emplacement d'installation
- **Location** : `/var/lib/odoo/.local/lib/python3.12/site-packages`
- **Dans PYTHONPATH** : ✅ Oui (`/var/lib/odoo/.local/lib/python3.12/site-packages`)

---

## 🔍 Cause probable

Odoo peut avoir mis en cache les métadonnées des modules. Il faut **mettre à jour la liste des apps** dans l'interface Odoo.

---

## ✅ Solution

### Étape 1 : Mettre à jour la liste des apps dans Odoo

1. Accéder à : `https://odoo.stinger.conceptsun97139.doreviateam.com`
2. Aller dans **Apps** (Applications)
3. Cliquer sur **"Mettre à jour la liste des Apps"** (en haut à droite)
4. Attendre la fin de la mise à jour

### Étape 2 : Réessayer l'installation

Après la mise à jour de la liste, réessayer d'installer le module `barcodes_generator_abstract`.

---

## 🔄 Alternative : Redémarrer Odoo

Si la mise à jour de la liste ne suffit pas :

```bash
cd /opt/dorevia-plateform/tenants/conceptsun97139/apps/odoo/stinger
docker compose restart odoo
```

Puis réessayer l'installation du module.

---

## 📝 Vérification manuelle

Pour vérifier que tout est en place :

```bash
# Vérifier l'installation
docker exec odoo_stinger_conceptsun97139 python3 -c "import barcode; print('✅ OK')"

# Vérifier la version
docker exec odoo_stinger_conceptsun97139 python3 -c "import importlib.metadata; print(importlib.metadata.version('python-barcode'))"
```

**Résultat attendu** : `0.16.1`

---

## ⚠️ Si le problème persiste

### Option 1 : Vérifier les logs Odoo
```bash
docker logs odoo_stinger_conceptsun97139 --tail 50 | grep -i "barcode\|dependency\|external"
```

### Option 2 : Installer dans un emplacement système
```bash
docker exec -u root odoo_stinger_conceptsun97139 pip3 install --break-system-packages python-barcode
docker compose restart odoo
```

### Option 3 : Vérifier le manifest du module
```bash
docker exec odoo_stinger_conceptsun97139 cat /mnt/oca/stock-logistics-barcode/barcodes_generator_abstract/__manifest__.py | grep -A 2 external_dependencies
```

---

## 📊 État actuel

- ✅ `python-barcode` installé (0.16.1)
- ✅ Module importable en Python
- ✅ Détectable par `importlib.metadata`
- ⏭️ **Action requise** : Mettre à jour la liste des apps dans Odoo

---

## 🎯 Résumé

Le module `python-barcode` est bien installé et fonctionnel. Le problème vient probablement du cache d'Odoo. **Mettre à jour la liste des apps** devrait résoudre le problème.
