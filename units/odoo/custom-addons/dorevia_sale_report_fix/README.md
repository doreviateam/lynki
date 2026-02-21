# Dorevia Sale Report Fix

## Problème

Les PDF générés pour les devis et commandes de vente n'utilisent pas le `external_layout` standard d'Odoo (en-tête avec logo, pied de page, etc.).

## Solution

Ce module **force la présence** de `<t t-call="web.external_layout">` dans la vue QWeb finale, peu importe les héritages ou surcharges existants.

**Critère de vérité** : Le layout société est appliqué **SI ET SEULEMENT SI** la vue QWeb finale contient `<t t-call="web.external_layout">`.

Le module garantit que ce critère est **toujours respecté** avec une priorité 99 (s'applique après les autres héritages).

## Installation (solution directe)

1. **Installer le module** :
   - Aller dans **Apps**
   - Rechercher "Dorevia Sale Report Fix"
   - Cliquer sur **Installer**

2. **Mettre à jour le module** :
   - Apps → "Dorevia Sale Report Fix" → **Mettre à jour**

3. **Redémarrer Odoo** :
   ```bash
   cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
   docker compose restart odoo
   ```

4. **Vérifier** :
   - Générer un PDF de devis/commande
   - Vérifier que l'en-tête et le pied de page apparaissent correctement

## Désinstallation

Si vous souhaitez désinstaller le module :
- **Apps** → Rechercher "Dorevia Sale Report Fix" → **Désinstaller**

## Notes techniques

- Le module hérite du template `sale.report_saleorder_document`
- Force l'utilisation de `web.external_layout` pour garantir l'affichage du layout standard
- Compatible avec Odoo 18.0

