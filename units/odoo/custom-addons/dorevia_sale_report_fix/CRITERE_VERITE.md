# 🔒 Critère de vérité (non négociable)

## Principe absolu

Peu importe :
- le nom affiché dans le menu,
- le bouton cliqué,
- le paramétrage du modèle de document,
- les héritages de templates,
- les modules installés,

👉 **Le layout société est appliqué SI ET SEULEMENT SI**
la vue QWeb finale contient :

```xml
<t t-call="web.external_layout">
```

**En l'absence de cette ligne, le PDF sera forcément "brut".**

---

## Comment vérifier que le critère est respecté

### Méthode 1 : Via l'interface Odoo (Mode développeur)

1. **Activer le mode développeur**
2. **Paramètres → Technique → Interface utilisateur → Vues QWeb**
3. **Rechercher** : `sale.report_saleorder` ou `sale.report_saleorder_document`
4. **Ouvrir la vue** et chercher (`Ctrl+F`) : `external_layout`
5. **Vérifier** : La ligne `<t t-call="web.external_layout">` doit être présente

### Méthode 2 : Via la base de données

```sql
SELECT 
    v.name,
    v.arch
FROM ir_ui_view v
WHERE v.name IN ('sale.report_saleorder', 'sale.report_saleorder_document')
AND v.arch LIKE '%external_layout%';
```

Si aucun résultat → le critère n'est **PAS** respecté.

### Méthode 3 : Vérification directe du PDF généré

1. **Générer un PDF** de devis/commande
2. **Vérifier visuellement** :
   - ✅ En-tête avec logo société → critère respecté
   - ✅ Pied de page avec informations société → critère respecté
   - ❌ PDF "brut" sans en-tête/pied → critère **NON** respecté

---

## Solution du module

Le module `dorevia_sale_report_fix` garantit que :

1. **Le template `sale.report_saleorder`** enveloppe le contenu dans `external_layout`
2. **Le template `sale.report_saleorder_document`** commence par `external_layout` si ce n'est pas déjà le cas

**Résultat** : La vue QWeb finale contient **TOUJOURS** `<t t-call="web.external_layout">`, peu importe les héritages.

---

## Si le problème persiste après installation du module

1. **Vérifier que le module est installé** : Apps → "Dorevia Sale Report Fix" → Statut "Installé"
2. **Mettre à jour le module** : Apps → "Dorevia Sale Report Fix" → "Mettre à jour"
3. **Vérifier la vue QWeb finale** (Méthode 1 ci-dessus) : La ligne `external_layout` doit être présente
4. **Redémarrer Odoo** : `docker compose restart odoo`
5. **Vider le cache navigateur** : `Ctrl+Shift+R`

Si après ces étapes le critère n'est toujours pas respecté, il y a probablement :
- Un autre module qui surcharge le template **après** notre module
- Un problème de séquence d'héritage

Dans ce cas, il faut vérifier l'ordre des modules et potentiellement ajuster la séquence d'héritage.

