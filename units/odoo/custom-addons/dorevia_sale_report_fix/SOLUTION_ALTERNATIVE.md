# 🔧 Solution alternative si le module ne fonctionne toujours pas

## Problème identifié

Notre module modifie `sale.report_saleorder_raw` pour envelopper l'appel à `sale.report_saleorder_document` dans `external_layout`, mais le PDF généré n'a toujours pas d'en-tête/pied de page.

## Causes possibles

1. **Le xpath ne trouve pas l'élément** : La structure du template peut être différente
2. **Le rapport utilisé n'est pas celui que nous modifions** : Peut-être qu'un autre rapport est utilisé
3. **Le cache Odoo n'est pas vidé** : Même après `-u all`, il peut y avoir un cache résiduel
4. **Un module tiers modifie les templates** : Même si nous n'en avons pas trouvé

## Solution alternative : Vérification manuelle dans l'interface Odoo

### Étape 1 : Vérifier la vue QWeb effective

1. **Activer le mode développeur**
2. **Paramètres → Technique → Interface utilisateur → Vues QWeb**
3. **Rechercher** : `sale.report_saleorder_raw`
4. **Ouvrir la vue**
5. **Vérifier** :
   - La structure du template
   - Si notre modification est présente (chercher `external_layout`)
   - Si un autre module a modifié cette vue

### Étape 2 : Vérifier quel rapport est utilisé

1. **Ouvrir un devis**
2. **Cliquer sur "Imprimer"**
3. **Noter le nom exact du rapport** utilisé
4. **Paramètres → Technique → Rapports**
5. **Rechercher** ce rapport
6. **Noter le "Nom technique"** (ex: `sale.report_saleorder`, `sale.report_saleorder_raw`, etc.)

### Étape 3 : Modifier directement la vue QWeb (solution manuelle)

Si notre module ne fonctionne pas, vous pouvez modifier directement la vue QWeb dans l'interface Odoo :

1. **Paramètres → Technique → Interface utilisateur → Vues QWeb**
2. **Rechercher** : `sale.report_saleorder_raw`
3. **Ouvrir la vue**
4. **Modifier** : Ajouter `<t t-call="web.external_layout">` autour de l'appel à `sale.report_saleorder_document`
5. **Sauvegarder**

**Exemple de modification** :
```xml
<!-- Avant -->
<t t-foreach="docs" t-as="doc">
    <t t-call="sale.report_saleorder_document" t-lang="doc.partner_id.lang"/>
</t>

<!-- Après -->
<t t-foreach="docs" t-as="doc">
    <t t-call="web.external_layout">
        <t t-call="sale.report_saleorder_document" t-lang="doc.partner_id.lang"/>
    </t>
</t>
```

## Solution alternative : Créer un nouveau template

Si la modification manuelle fonctionne, nous pouvons créer un nouveau template qui remplace complètement `report_saleorder_raw` :

```xml
<template id="report_saleorder_raw" inherit_id="sale.report_saleorder_raw" priority="99">
    <xpath expr="." position="replace">
        <t t-call="web.html_container">
            <t t-foreach="docs" t-as="doc">
                <t t-call="web.external_layout">
                    <t t-call="sale.report_saleorder_document" t-lang="doc.partner_id.lang"/>
                </t>
            </t>
        </t>
    </xpath>
</template>
```

## Diagnostic final

Pour identifier le problème exact, il faut :
1. **Vérifier la vue QWeb effective** dans l'interface Odoo
2. **Vérifier quel rapport est utilisé** lors de la génération du PDF
3. **Vérifier si notre modification est présente** dans la vue QWeb

Avec ces informations, nous pourrons corriger précisément le problème.

