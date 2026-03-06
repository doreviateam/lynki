# 📦 Guide d'ajout d'une collection OCA — stock-logistics-barcode

**Date** : 2026-01-27  
**Collection** : `stock-logistics-barcode`  
**Version Odoo** : 18.0

---

## 🎯 Vue d'ensemble

Les collections OCA sont organisées dans `/opt/dorevia-plateform/sources/oca/`.  
Chaque collection est un dépôt Git cloné dans ce répertoire.

Le script `oca_flatten.sh` détecte automatiquement tous les modules et crée des symlinks dans `/mnt/extra-addons` pour qu'ils soient disponibles dans Odoo.

---

## 📋 Étapes pour ajouter `stock-logistics-barcode`

### 1. Cloner le dépôt OCA

```bash
cd /opt/dorevia-plateform/sources/oca
git clone https://github.com/OCA/stock-logistics-barcode.git
```

**Important** : Vérifier la branche correspondant à votre version Odoo :
- Pour Odoo 18.0 : `18.0`
- Pour Odoo 19.0 : `19.0`

```bash
cd stock-logistics-barcode
git checkout 18.0  # Pour Odoo 18
```

### 2. Vérifier la structure

La collection doit avoir cette structure :
```
sources/oca/stock-logistics-barcode/
├── README.md
├── setup/
└── [modules]/
    ├── module1/
    │   └── __manifest__.py
    └── module2/
        └── __manifest__.py
```

### 3. Redémarrer les instances Odoo

Le script `oca_flatten.sh` s'exécute automatiquement au démarrage de chaque container Odoo et détectera les nouveaux modules.

**Pour l'instance LAB LGLZ** :
```bash
cd /opt/dorevia-plateform/tenants/lglz/apps/odoo/lab
docker compose restart odoo
```

**Pour toutes les instances** (si nécessaire) :
```bash
# Instance stinger LGLZ
cd /opt/dorevia-plateform/tenants/lglz/apps/odoo/stinger
docker compose restart odoo

# Autres instances selon besoin
```

### 4. Vérifier que les modules sont disponibles

Après redémarrage, vérifier les logs :
```bash
docker logs odoo_lab_lglz | grep "oca_flatten"
```

Vous devriez voir :
```
[oca_flatten] OCA_ROOT=/mnt/oca
[oca_flatten] DEST=/mnt/extra-addons
[oca_flatten] linked: XXX modules
```

Le nombre de modules devrait avoir augmenté.

### 5. Installer les modules dans Odoo

1. Accéder à l'interface Odoo : `https://odoo.lab.lglz.doreviateam.com/web`
2. Aller dans **Apps** (Applications)
3. Activer le mode **Développeur** (si nécessaire)
4. Rechercher les modules de la collection `stock-logistics-barcode`
5. Installer les modules souhaités

---

## 🔍 Modules de la collection stock-logistics-barcode

Cette collection contient des modules pour la gestion des codes-barres dans la logistique :

- `stock_barcode` : Interface code-barres pour les opérations de stock
- `stock_barcode_mrp` : Intégration code-barres avec MRP
- `stock_barcode_picking_batch` : Code-barres pour les lots de picking
- Et d'autres modules liés aux codes-barres...

---

## 📝 Notes importantes

### Structure attendue

Le script `oca_flatten.sh` cherche les modules avec cette structure :
```
sources/oca/[collection]/
└── [module]/
    └── __manifest__.py
```

**Profondeur** : `-mindepth 2 -maxdepth 4`

### Gestion des conflits de noms

Si deux modules de collections différentes ont le même nom, le script ajoute un préfixe :
- Module normal : `module_name`
- En cas de conflit : `collection__module_name`

### Mise à jour d'une collection

Pour mettre à jour une collection existante :
```bash
cd /opt/dorevia-plateform/sources/oca/stock-logistics-barcode
git pull origin 18.0
```

Puis redémarrer les instances Odoo.

---

## ✅ Checklist

- [ ] Dépôt cloné dans `/opt/dorevia-plateform/sources/oca/stock-logistics-barcode`
- [ ] Branche correcte (18.0 pour Odoo 18)
- [ ] Instances Odoo redémarrées
- [ ] Modules visibles dans l'interface Odoo
- [ ] Modules installés et fonctionnels

---

## 🐛 Dépannage

### Les modules n'apparaissent pas

1. Vérifier que le dépôt est bien cloné :
   ```bash
   ls -la /opt/dorevia-plateform/sources/oca/stock-logistics-barcode
   ```

2. Vérifier les logs du script oca_flatten :
   ```bash
   docker logs odoo_lab_lglz | grep oca_flatten
   ```

3. Vérifier manuellement dans le container :
   ```bash
   docker exec odoo_lab_lglz ls -la /mnt/extra-addons | grep stock
   ```

### Erreur de dépendances

Certains modules peuvent nécessiter d'autres modules OCA. Vérifier les dépendances dans `__manifest__.py` de chaque module.
