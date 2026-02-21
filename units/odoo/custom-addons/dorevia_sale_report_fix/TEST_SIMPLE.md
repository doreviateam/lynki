# 🧪 Test simple du module

## Après redémarrage d'Odoo

1. **Ouvrir un devis** dans Odoo
2. **Cliquer sur "Imprimer"** → **"Devis / Commande"** (ou le rapport standard)
3. **Générer le PDF**
4. **Vérifier** :
   - ✅ **En-tête** : Logo de la société + adresse en haut
   - ✅ **Pied de page** : Informations de la société en bas
   - ❌ **Si le PDF est "brut"** (pas d'en-tête/pied) → le module ne fonctionne pas

## Si le problème persiste

### Vérification 1 : Le module est-il installé ?

1. **Apps** → Rechercher "Dorevia Sale Report Fix"
2. **Vérifier** : Statut = "Installé" (pas "Non installé")

### Vérification 2 : Quel rapport est utilisé ?

1. **Mode développeur activé**
2. **Paramètres → Technique → Rapports**
3. **Rechercher** "Devis / Commande"
4. **Noter le "Nom technique"** (ex: `sale.report_saleorder`)

### Vérification 3 : La vue QWeb contient-elle external_layout ?

1. **Paramètres → Technique → Interface utilisateur → Vues QWeb**
2. **Rechercher** : `sale.report_saleorder_raw`
3. **Ouvrir la vue**
4. **Chercher** (`Ctrl+F`) : `external_layout`
5. **Vérifier** : La ligne `<t t-call="web.external_layout">` doit être présente

## Solution alternative si ça ne fonctionne toujours pas

Si le module ne fonctionne pas, il est possible qu'un autre module retire `external_layout` avec une priorité plus élevée, ou que le rapport utilisé ne soit pas celui que nous modifions.

Dans ce cas, il faudra :
1. Identifier le rapport exact utilisé
2. Identifier les modules qui modifient ce rapport
3. Ajuster la priorité ou modifier directement le bon template

