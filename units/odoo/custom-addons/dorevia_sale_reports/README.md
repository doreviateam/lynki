# Dorevia Sale Reports

## Description

Module de modèles d'impression commerciaux pour la plateforme Dorevia.

Ce module **ajoute** des rapports Dorevia (Devis, Commandes, Factures Pro Forma) avec un layout optimisé pour PDF. Les rapports standards Odoo **restent disponibles** pour comparaison et fallback.

## Pourquoi ce module ?

Dans certains environnements Odoo 18, les PDF des documents commerciaux présentent un rendu "étriqué" :
- bloc totaux en ~50% largeur
- grande zone blanche à droite
- lisibilité dégradée

**Cause** : Pattern HTML-first (Bootstrap grid) rendu PDF-second (wkhtmltopdf), notamment via l'usage de classes `col-6` / `ms-auto` appliquées en PDF.

**Solution** : Templates dédiés avec styles inline conditionnés pour forcer la pleine largeur en PDF.

## Caractéristiques

- **Layout optimisé PDF** : Totaux en pleine largeur (structure simple sans Bootstrap en PDF)
- **Templates QWeb personnalisés** : Basés sur les templates standards mais avec corrections de layout
- **External layout** : Utilise le layout standard Odoo (en-tête, pied de page, logo)
- **Standard conservé** : Les rapports standards Odoo restent disponibles
- **Compatibilité** : Compatible avec Odoo 18.0

## Documents inclus

1. **Devis Dorevia** (`dorevia_sale_reports.report_quotation_dorevia`)
   - Pour les devis (`sale.order` en état `draft` ou `sent`)

2. **Commande Dorevia** (`dorevia_sale_reports.report_saleorder_dorevia`)
   - Pour les commandes (`sale.order` en état `sale`)

3. **Facture Pro Forma Dorevia** (`dorevia_sale_reports.report_proforma_dorevia`)
   - Pour les factures pro forma

## Installation

1. Copier le module dans `custom-addons`
2. **Apps** → Mettre à jour la liste des apps
3. Rechercher "Dorevia Sale Reports"
4. Cliquer sur **Installer**

**Upgrade recommandé** :
```bash
odoo -d <db> -u dorevia_sale_reports --stop-after-init
```

## Utilisation

Les rapports Dorevia apparaissent dans le menu **"Imprimer"** sur `sale.order` :

- **Devis Dorevia** : pour les devis
- **Commande Dorevia** : pour les commandes
- **Facture Pro Forma Dorevia** : pour les pro forma

Les rapports standards Odoo restent disponibles pour comparaison.

## Différences avec les documents standards

- **Totaux pleine largeur en PDF** : Structure simple sans Bootstrap pour forcer la largeur
- **Meilleur rendu PDF** : Pas de zone blanche à droite, contenu mieux réparti
- **Rendu HTML identique** : La prévisualisation HTML conserve le layout Bootstrap standard
- **Même fonctionnalité** : Toutes les fonctionnalités des documents standards sont conservées

## Rollback

Pour désinstaller le module :
1. **Apps** → Rechercher "Dorevia Sale Reports"
2. Cliquer sur **Désinstaller**

Les rapports standards Odoo restent disponibles après désinstallation.

## Notes techniques

- Les templates QWeb sont basés sur `sale.report_saleorder_document` mais avec corrections de layout
- Utilisation de styles inline conditionnés sur `report_type != 'html'` pour le PDF
- Pas de dépendance CSS externe pour le PDF (wkhtmltopdf peut ne pas charger/appliquer correctement)
- Compatible avec tous les modules Odoo standards (multi-sociétés, multi-langues, etc.)
