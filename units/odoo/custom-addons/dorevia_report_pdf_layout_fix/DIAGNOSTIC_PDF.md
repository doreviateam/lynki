# 🔍 Diagnostic PDF - Dorevia Report PDF Layout Fix

## Vérification que le module fonctionne

### Étape 1 : Vérifier que le module est installé

1. **Apps** → Rechercher "Dorevia Report PDF Layout Fix"
2. **Vérifier** : Statut = "Installé" (pas "Non installé")

### Étape 2 : Vérifier la vue QWeb effective

1. **Activer le mode développeur** (Paramètres → Activer le mode développeur)
2. **Paramètres → Technique → Interface utilisateur → Vues QWeb**
3. **Rechercher** : `sale.report_saleorder_document`
4. **Ouvrir la vue**
5. **Chercher** (`Ctrl+F`) : `col-12`
6. **Vérifier** : La ligne doit contenir `col-12` pour les PDF

**Résultat attendu** :
```xml
<div t-attf-class="#{'col-12' if report_type != 'html' else 'col-sm-7 col-md-6'} ms-auto">
```

### Étape 3 : Vérifier quel rapport est utilisé

1. **Ouvrir un devis/pro forma**
2. **Cliquer sur "Imprimer"**
3. **Noter le nom exact du rapport** utilisé
4. **Vérifier** : Le rapport doit être `sale.report_saleorder` ou `sale.report_saleorder_raw`

### Étape 4 : Tester la génération PDF

1. **Générer un PDF** de devis/pro forma
2. **Vérifier visuellement** :
   - ✅ Bloc des totaux occupe toute la largeur (100%)
   - ✅ Pas de zone blanche à droite
   - ✅ Contenu bien aligné
   - ❌ Bloc des totaux à 50% → problème

## Si le problème persiste

### Problème 1 : L'xpath ne trouve pas l'élément

**Symptôme** : La vue QWeb ne contient pas `col-12`

**Solution** : Vérifier la structure exacte du template et ajuster l'xpath

### Problème 2 : Un autre module interfère

**Symptôme** : La vue QWeb contient `col-12` mais le PDF est toujours incorrect

**Solution** : Vérifier les modules qui héritent de `sale.report_saleorder_document` avec une priorité ≥ 99

### Problème 3 : Le rapport utilisé n'est pas celui modifié

**Symptôme** : Le PDF est incorrect mais la vue QWeb est correcte

**Solution** : Vérifier quel rapport est réellement utilisé lors de la génération du PDF

## Informations à fournir pour le diagnostic

1. **Type de document** : Devis / Pro Forma / Commande / Autre ?
2. **Problème observé** : Bloc totaux à 50% / Zone blanche à droite / Autre ?
3. **Vue QWeb** : Contient-elle `col-12` ou `col-6` ?
4. **Rapport utilisé** : Quel est le nom technique du rapport ?

