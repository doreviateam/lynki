# 🔧 Résolution Simple : Erreur de dépendance dupliquée

## ❌ Erreur

```
duplicate key value violates unique constraint "ir_module_module_dependency_pkey"
DETAIL: Key (id)=(1640) already exists.
```

## ✅ Solution : Mode Développeur dans Odoo

### Étape 1 : Activer le Mode Développeur

1. **Connectez-vous à Odoo** : https://odoo.lab.core.doreviateam.com
2. **Allez dans** : `Paramètres` → `Activer le mode développeur`
3. **Cochez** : `Mode développeur`
4. **Cliquez sur** : `Enregistrer`

### Étape 2 : Accéder aux Données Techniques

1. **Menu** : `Paramètres` → `Technique` → `Base de données` → `Structure`
2. **Recherchez** : `ir.module.module.dependency` (ou `Module Dependency`)
3. **Ouvrez** la table

### Étape 3 : Supprimer l'enregistrement dupliqué

1. **Recherchez** l'enregistrement avec `id = 1640`
2. **Sélectionnez-le** et **Supprimez-le**
3. **Confirmez** la suppression

### Étape 4 : Réessayer la mise à jour

1. **Retournez dans** `Apps`
2. **Recherchez** `Dorevia Billing CORE`
3. **Cliquez sur** `Mettre à jour`

---

## ✅ Solution Alternative : Réinitialiser le module

Si la solution ci-dessus ne fonctionne pas :

### Option A : Via l'interface (Recommandé)

1. **Mode Développeur activé**
2. **Apps** → `Dorevia Billing CORE`
3. **Cliquez sur** `Désinstaller` (si disponible)
4. **Puis** `Installer`

### Option B : Supprimer et recréer

1. **Mode Développeur activé**
2. **Paramètres** → `Technique` → `Base de données` → `Structure`
3. **Recherchez** `ir.module.module`
4. **Trouvez** l'enregistrement `dorevia_billing_core`
5. **Supprimez-le** (⚠️ Cela supprimera aussi toutes les données du module)
6. **Réinstallez** le module depuis `Apps`

---

## 🔄 Après le nettoyage

1. **Désactivez le mode développeur** (si vous le souhaitez)
2. **Vérifiez** que le module fonctionne
3. **L'icône** devrait être visible dans la liste des modules

---

## ⚠️ Note importante

- **Sauvegardez** la base de données avant de supprimer des enregistrements
- Le **mode développeur** donne accès à des fonctionnalités avancées
- La suppression d'enregistrements peut affecter d'autres modules

---

## 📝 Si rien ne fonctionne

Si aucune des solutions ne fonctionne, il peut être nécessaire de :

1. **Sauvegarder** la base de données
2. **Réinitialiser** complètement Odoo
3. **Réinstaller** tous les modules nécessaires

Mais essayez d'abord les solutions ci-dessus, elles devraient résoudre le problème dans la plupart des cas.

