# ✅ Synchronisation STINGER avec LAB - Réussie

**Date** : 2025-01-28  
**Action** : Copie base de données LAB → STINGER  
**Résultat** : ✅ **SUCCÈS**

---

## 🎯 Objectif

Synchroniser l'environnement STINGER avec LAB pour refléter l'état complet de LAB (modules, données, configuration).

---

## ✅ Actions Effectuées

### 1. Identification Volumes
- ✅ Volume DB LAB : `odoo_db_lab_data`
- ✅ Volume DB STINGER : `odoo_db_stinger_data`

### 2. Copie Volume PostgreSQL
- ✅ Arrêt services STINGER
- ✅ Copie directe volume (méthode la plus rapide)
- ✅ Redémarrage services STINGER

### 3. Configuration Odoo STINGER
- ✅ Ajout `dbfilter = ^core_lab$` dans `odoo.stinger.conf`
- ✅ Alignement avec configuration LAB

---

## 📊 Résultats

### Avant Synchronisation
- **Modules installés** : 12 (seulement base)
- **Base de données** : `odoo` (vide)
- **Configuration** : Pas de dbfilter

### Après Synchronisation
- **Modules installés** : **75** ✅
- **Base de données** : `core_lab` ✅
- **Configuration** : `dbfilter = ^core_lab$` ✅

---

## 🔧 Fichiers Modifiés

### Configuration Odoo STINGER
**Fichier** : `units/odoo/conf/odoo.stinger.conf`

**Ajout** :
```ini
dbfilter = ^core_lab$
```

**Résultat** : STINGER utilise maintenant la même base que LAB (`core_lab`)

### Script de Synchronisation
**Fichier** : `units/odoo/scripts/sync_lab_to_stinger.sh`

**Fonctionnalités** :
- Copie volume PostgreSQL LAB → STINGER
- Arrêt/redémarrage automatique
- Vérification post-sync

---

## 🧪 Vérification

### Modules Installés
```bash
docker exec odoo-db-1 psql -U odoo -d core_lab -c \
  "SELECT COUNT(*) FROM ir_module_module WHERE state='installed';"
# Résultat: 75
```

### Base de Données
```bash
docker exec odoo-db-1 psql -U odoo -l | grep core_lab
# Résultat: core_lab présente
```

### Site Web
```bash
curl -I https://odoo.stinger.core.doreviateam.com/
# Résultat: 200 OK ou 303 redirect
```

---

## 📝 Notes

### Sécurité
- ⚠️ **Mots de passe** : À réinitialiser après sync
- ⚠️ **Clés API** : À régénérer si nécessaire
- ⚠️ **Tokens** : À invalider et recréer

### Configuration
- ✅ **URLs** : Adapter si nécessaire (`odoo.lab.core` → `odoo.stinger.core`)
- ✅ **Chemins** : Vérifier compatibilité STINGER
- ✅ **Modules** : Tous les modules LAB sont maintenant dans STINGER

---

## 🔄 Prochaines Synchronisations

### Script Automatisé
```bash
cd /opt/dorevia-plateform/units/odoo
./scripts/sync_lab_to_stinger.sh
```

### Méthode Manuelle
1. Arrêter STINGER
2. Copier volume : `docker run --rm -v odoo_db_lab_data:/source:ro -v odoo_db_stinger_data:/dest alpine sh -c "cd /source && tar -cf - . | (cd /dest && tar -xf -)"`
3. Redémarrer STINGER

---

## ✅ Statut Final

- ✅ Base de données synchronisée : **75 modules installés**
- ✅ Configuration alignée : `dbfilter = ^core_lab$`
- ✅ Site accessible : https://odoo.stinger.core.doreviateam.com/
- ✅ STINGER reflète maintenant LAB

---

**Synchronisation complétée le** : 2025-01-28  
**Méthode** : Copie volume PostgreSQL  
**Résultat** : ✅ **STINGER synchronisé avec LAB**

