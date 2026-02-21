# 🔍 Analyse des interférences potentielles des modules dorevia_*

## Modules dorevia_* installés

1. **`dorevia_billing_core`** : Réception des constats et facturation MRR
2. **`dorevia_posted_lock`** : Verrouillage WORM-like des factures posted
3. **`dorevia_sale_report_fix`** : Correction du external_layout pour les rapports

## Comment les modules pourraient interférer ?

### 1. **Ordre de chargement des modules**

Les modules Odoo sont chargés dans un ordre spécifique basé sur :
- Les dépendances (`depends` dans `__manifest__.py`)
- L'ordre d'installation
- L'ordre alphabétique (si pas de dépendances)

**Impact** : Si un module charge **après** `dorevia_sale_report_fix` et modifie le même template avec une priorité ≥ 99, il pourrait écraser notre modification.

**Vérification** :
```bash
# Voir l'ordre de chargement
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose logs odoo 2>&1 | grep "Loading module" | grep dorevia
```

### 2. **Modifications directes des templates de rapports**

**`dorevia_billing_core`** :
- ✅ **Aucune modification** de templates de rapports détectée
- Vues : `dorevia_constat_views.xml`, `dorevia_contract_views.xml`, `dorevia_pricing_rule_views.xml`
- **Impact** : Aucun sur les rapports de vente

**`dorevia_posted_lock`** :
- ✅ **Aucune modification** de templates de rapports détectée
- Vues : `account_move_views.xml` (modifie le formulaire de facture, pas les rapports)
- **Impact** : Aucun sur les rapports de vente

**`dorevia_sale_report_fix`** :
- ✅ **Modifie** `sale.report_saleorder_raw` avec priorité 99
- **Impact** : Devrait garantir `external_layout`

### 3. **Modifications indirectes via les modèles**

**`dorevia_posted_lock`** modifie `account.move` :
- Ajoute des champs (`dorevia_vaulted`)
- Modifie les vues formulaire
- **Impact potentiel** : Si le template de rapport utilise `doc.dorevia_vaulted` et que ce champ n'existe pas, cela pourrait causer une erreur, mais ne devrait pas affecter `external_layout`

### 4. **Priorité des héritages**

Notre module utilise `priority="99"`. Si un autre module utilise :
- `priority="100"` ou plus → Il s'applique **après** notre module (risque d'écrasement)
- `priority="98"` ou moins → Il s'applique **avant** notre module (notre modification devrait rester)

**Vérification** :
```sql
-- Voir toutes les vues qui héritent de sale.report_saleorder_raw
SELECT 
    v.name,
    v.module,
    v.priority,
    v.inherit_id,
    v.arch
FROM ir_ui_view v
WHERE v.inherit_id IN (
    SELECT id FROM ir_ui_view WHERE name = 'sale.report_saleorder_raw'
)
ORDER BY v.priority DESC, v.module;
```

### 5. **Modifications via des modules tiers**

Il est possible qu'un module **non-dorevia** modifie les templates de rapports :
- Modules OCA (ex: `sale_pdf_quote_builder`)
- Modules personnalisés
- Modules de thème

**Vérification** :
```bash
# Chercher tous les modules qui modifient sale.report_saleorder_raw
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose exec -T odoo find /mnt/custom-addons /mnt/extra-addons -name "*.xml" -exec grep -l "sale.report_saleorder" {} \;
```

## Diagnostic recommandé

### Étape 1 : Vérifier l'ordre de chargement

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose logs odoo 2>&1 | grep "Loading module dorevia" | tail -10
```

### Étape 2 : Vérifier les vues qui héritent de `sale.report_saleorder_raw`

Via l'interface Odoo (Mode développeur) :
1. **Paramètres → Technique → Interface utilisateur → Vues QWeb**
2. **Rechercher** : `sale.report_saleorder_raw`
3. **Ouvrir la vue**
4. **Vérifier les "Vues héritées"** :
   - Noter tous les modules qui héritent cette vue
   - Vérifier leurs priorités
   - Vérifier si un module retire `external_layout`

### Étape 3 : Vérifier la vue QWeb effective

1. **Paramètres → Technique → Interface utilisateur → Vues QWeb**
2. **Rechercher** : `sale.report_saleorder_raw`
3. **Ouvrir la vue**
4. **Chercher** (`Ctrl+F`) : `external_layout`
5. **Vérifier** : La ligne `<t t-call="web.external_layout">` doit être présente

### Étape 4 : Vérifier les modules installés

1. **Apps** → Rechercher "dorevia"
2. **Noter tous les modules dorevia_* installés**
3. **Vérifier leurs dépendances** dans `__manifest__.py`

## Solution si interférence détectée

### Option 1 : Augmenter la priorité

Si un autre module utilise `priority="100"` ou plus, augmenter notre priorité :

```xml
<template id="report_saleorder_raw" inherit_id="sale.report_saleorder_raw" priority="150">
```

### Option 2 : Modifier directement le template utilisé

Si le rapport utilisé n'est pas `sale.report_saleorder_raw` mais un autre (ex: `sale.report_saleorder`), modifier le bon template.

### Option 3 : Désactiver temporairement les autres modules

Pour tester si un module interfère :
1. **Désinstaller temporairement** les autres modules dorevia_*
2. **Tester** la génération du PDF
3. **Réinstaller** les modules un par un pour identifier le coupable

## Conclusion

D'après l'analyse :
- ✅ **`dorevia_billing_core`** : Aucune interférence détectée
- ✅ **`dorevia_posted_lock`** : Aucune interférence détectée
- ✅ **`dorevia_sale_report_fix`** : C'est notre module de correction

**Hypothèse** : Le problème vient probablement d'un **module tiers** (non-dorevia) qui modifie les templates de rapports, ou d'un problème avec notre xpath qui ne trouve pas l'élément à modifier.

**Action recommandée** : Suivre le diagnostic ci-dessus pour identifier le module qui interfère.

