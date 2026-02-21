# 🔍 Vérification du rapport utilisé

## Problème
Le PDF généré n'a pas d'en-tête/pied de page (`external_layout` non appliqué).

## Diagnostic nécessaire

### Étape 1 : Identifier le rapport réellement utilisé

1. **Ouvrir un devis/commande dans Odoo**
2. **Cliquer sur "Imprimer"**
3. **Noter précisément le nom du rapport sélectionné** :
   - "Devis / Commande" ?
   - "Devis en PDF" ?
   - Autre nom ?

### Étape 2 : Vérifier le nom technique du rapport

1. **Activer le mode développeur** (Paramètres → Activer le mode développeur)
2. **Aller dans** : Paramètres → Technique → Rapports
3. **Rechercher** le rapport utilisé (ex: "Devis / Commande")
4. **Noter le "Nom technique"** (ex: `sale.report_saleorder`, `sale.report_saleorder_raw`, etc.)

### Étape 3 : Vérifier la vue QWeb effective

1. **Aller dans** : Paramètres → Technique → Interface utilisateur → Vues QWeb
2. **Rechercher** : `sale.report_saleorder_document`
3. **Ouvrir la vue** et chercher (`Ctrl+F`) : `external_layout`
4. **Vérifier** : La ligne `<t t-call="web.external_layout">` est-elle présente ?

### Étape 4 : Vérifier les modules qui héritent la vue

1. **Dans la vue QWeb** `sale.report_saleorder_document`, vérifier les "Vues héritées"
2. **Noter tous les modules** qui modifient cette vue
3. **Vérifier si un module** retire `external_layout`

## Résultat attendu

Avec ces informations, on pourra :
- Confirmer quel rapport est utilisé
- Vérifier si notre modification s'applique
- Identifier si un autre module interfère

