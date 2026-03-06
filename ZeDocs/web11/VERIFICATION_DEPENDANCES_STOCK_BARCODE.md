# ✅ Vérification des dépendances — stock-logistics-barcode

**Date** : 2026-01-27  
**Collection** : `stock-logistics-barcode`  
**Version Odoo** : 18.0

---

## 📋 Modules de la collection

| Module | Dépendances Odoo | Dépendances Python | Statut |
|--------|------------------|---------------------|--------|
| `barcodes_generator_abstract` | `barcodes` (standard) | `python-barcode` | ⚠️ À vérifier |
| `barcodes_generator_product` | `barcodes_generator_abstract`, `product` (standard) | - | ✅ OK |
| `product_multi_barcode` | `product` (standard) | - | ✅ OK |
| `stock_picking_product_barcode_report` | `stock` (standard) | `python-barcode` | ⚠️ À vérifier |

---

## 🔍 Dépendances Odoo (modules standards)

### Modules standards requis
- ✅ `barcodes` : Module standard Odoo (toujours disponible)
- ✅ `product` : Module standard Odoo (toujours disponible)
- ✅ `stock` : Module standard Odoo (toujours disponible)

**Statut** : ✅ **Toutes les dépendances Odoo sont satisfaites**

---

## 🐍 Dépendances Python externes

### `python-barcode` requis par :
- `barcodes_generator_abstract`
- `stock_picking_product_barcode_report`

**Vérification** :
```bash
docker exec odoo_lab_lglz python3 -c "import barcode; print('OK')"
```

**Installation si manquante** :
```bash
docker exec odoo_lab_lglz pip3 install python-barcode
```

---

## 📦 Dépendances internes (entre modules OCA)

### `barcodes_generator_product`
- Dépend de : `barcodes_generator_abstract` ✅ (même collection)

**Statut** : ✅ **Dépendances internes satisfaites**

---

## ✅ Checklist de vérification

- [x] Collection clonée sur branche 18.0
- [x] Modules détectés par oca_flatten.sh
- [x] Modules standards Odoo disponibles (`barcodes`, `product`, `stock`)
- [ ] `python-barcode` installé dans le container
- [x] Dépendances internes satisfaites

---

## 🚀 Installation des modules

### Ordre d'installation recommandé

1. **`barcodes_generator_abstract`** (base)
   - Dépend de : `barcodes` (standard)
   - Nécessite : `python-barcode`

2. **`barcodes_generator_product`**
   - Dépend de : `barcodes_generator_abstract` + `product` (standard)

3. **`product_multi_barcode`** (indépendant)
   - Dépend de : `product` (standard)

4. **`stock_picking_product_barcode_report`** (indépendant)
   - Dépend de : `stock` (standard)
   - Nécessite : `python-barcode`

---

## 🔧 Installation de python-barcode (si nécessaire)

Si `python-barcode` n'est pas installé, deux options :

### Option 1 : Installation dans le container (temporaire)
```bash
docker exec odoo_lab_lglz pip3 install python-barcode
docker compose restart odoo
```

### Option 2 : Installation permanente (Dockerfile)
Modifier le Dockerfile Odoo pour inclure :
```dockerfile
RUN pip3 install python-barcode
```

---

## 📝 Notes

- Les modules standards Odoo (`barcodes`, `product`, `stock`) sont toujours disponibles
- `python-barcode` est une dépendance Python externe qui doit être installée séparément
- Les modules peuvent être installés dans n'importe quel ordre, Odoo gère automatiquement les dépendances
