# 🔒 Critère de vérité (non négociable)

## Principe absolu

👉 **Le PDF pro forma utilise toute la largeur SI ET SEULEMENT SI**
le bloc des totaux utilise `col-12` en PDF (au lieu de `col-6`).

**En présence de `col-6`, le bloc des totaux n'occupe que 50% de la largeur,**
**créant une zone blanche à droite et un rendu "tassé à gauche".**

---

## Diagnostic v1.1 (corrigé)

### v1.0 - Diagnostic initial (incorrect)
- ❌ Hypothèse : `external_layout` manquant
- ❌ Solution : Envelopper `sale.report_saleorder_document` dans `external_layout`

### v1.1 - Diagnostic réel (prouvé)
- ✅ `external_layout` est **déjà présent** dans `sale.report_saleorder_document`
- ✅ Cause réelle : Largeur du bloc des totaux (`col-6` = 50% au lieu de `col-12` = 100%)
- ✅ Solution : Modifier la classe CSS conditionnellement pour les pro forma PDF

---

## Comment vérifier que le critère est respecté

### Méthode 1 : Vérification visuelle du PDF

1. **Générer un PDF** de facture pro forma
2. **Vérifier visuellement** :
   - ✅ Bloc des totaux occupe toute la largeur → critère respecté
   - ✅ Pas de zone blanche à droite → critère respecté
   - ✅ Contenu bien aligné → critère respecté
   - ❌ Bloc des totaux à 50% de la largeur → critère **NON** respecté
   - ❌ Zone blanche à droite → critère **NON** respecté

### Méthode 2 : Via l'interface Odoo (Mode développeur)

1. **Activer le mode développeur**
2. **Paramètres → Technique → Interface utilisateur → Vues QWeb**
3. **Rechercher** : `sale.report_saleorder_document`
4. **Ouvrir la vue**
5. **Chercher** (`Ctrl+F`) : `name="total"`
6. **Vérifier** : La classe CSS doit être `col-12` pour les pro forma PDF

### Méthode 3 : Via la base de données

```sql
SELECT 
    v.name,
    v.arch
FROM ir_ui_view v
WHERE v.name = 'sale.report_saleorder_document'
AND v.arch LIKE '%name="total"%';
```

Vérifier que la classe CSS contient la condition pour `col-12` si `is_pro_forma` est vrai.

---

## Solution du module

Le module `dorevia_sale_proforma_report_fix` garantit que :

1. **Le bloc des totaux** utilise `col-12` en PDF **uniquement pour les pro forma**
2. **Les devis/commandes** continuent d'utiliser `col-6` (inchangé)
3. **Les vues HTML** continuent d'utiliser `col-sm-7 col-md-6` (inchangé)

**Résultat** : Le PDF pro forma utilise toute la largeur, sans impact sur les autres rapports.

---

## Structure du template standard

Le template standard `sale.report_saleorder_document` contient :

```xml
<div id="total" class="row mt-n3" name="total">
    <div t-attf-class="#{'col-6' if report_type != 'html' else 'col-sm-7 col-md-6'} ms-auto">
        <!-- Totaux -->
    </div>
</div>
```

**Problème** : En PDF, le bloc utilise `col-6` (50% de la largeur) pour tous les rapports, y compris les pro forma.

**Solution** : Notre module modifie la classe CSS conditionnellement :

```xml
<div t-attf-class="#{'col-12' if (report_type != 'html' and is_pro_forma)
                      else ('col-6' if report_type != 'html' else 'col-sm-7 col-md-6')} ms-auto">
```

**Résultat** :
- Pro forma PDF : `col-12` (100% de la largeur) ✅
- Devis/Commandes PDF : `col-6` (50% de la largeur, inchangé) ✅
- HTML : `col-sm-7 col-md-6` (inchangé) ✅

---

## Si le problème persiste après installation du module

1. **Vérifier que le module est installé** : Apps → "Dorevia Sale Proforma Report Fix" → Statut "Installé"
2. **Mettre à jour le module** : Apps → "Dorevia Sale Proforma Report Fix" → "Mettre à jour"
3. **Vérifier la vue QWeb finale** (Méthode 2 ci-dessus) : La classe CSS doit contenir la condition pour `col-12`
4. **Redémarrer Odoo** : `docker compose restart odoo`
5. **Vider le cache navigateur** : `Ctrl+Shift+R`

Si après ces étapes le critère n'est toujours pas respecté, il y a probablement :
- Un autre module qui surcharge le template **après** notre module
- Un problème de séquence d'héritage

Dans ce cas, il faut vérifier l'ordre des modules et potentiellement ajuster la séquence d'héritage.

---

## Historique des versions

### v1.0
- Diagnostic initial : problème d'`external_layout` manquant
- Solution : envelopper dans `external_layout` (incorrect)

### v1.1
- Diagnostic corrigé : largeur du bloc des totaux
- Solution : modifier la classe CSS conditionnellement (correct)
