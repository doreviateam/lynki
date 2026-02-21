# Dorevia Report PDF Layout Fix

## Problème

Les PDF générés pour les **devis, commandes, pro forma et factures** présentent :
- Contenu **tassé à gauche** du document
- Grande **zone blanche** à droite
- Bloc des totaux qui n'occupe que 50% de la largeur (`col-6` au lieu de `col-12`)

## Diagnostic

**Cause racine identifiée** :
- ✅ `external_layout` est **déjà présent** dans les templates standards
- ❌ Le problème vient de la **largeur du bloc des totaux** : `col-6` (50%) au lieu de `col-12` (100%) en PDF
- ✅ Solution : Modifier la classe CSS conditionnellement pour les PDF uniquement

## Solution

Ce module corrige la largeur du bloc des totaux en PDF pour **tous les rapports** :
- **En PDF** : `col-12` (100% de la largeur) ✅
- **En HTML** : `col-sm-7 col-md-6` (inchangé) ✅

**Rapports corrigés** :
- ✅ Devis (`sale.report_saleorder_document`)
- ✅ Commandes (`sale.report_saleorder_document`)
- ✅ Pro Forma (`sale.report_saleorder_document`)
- ✅ Factures (`account.report_invoice_document`)

**Critère de vérité** : Le PDF utilise toute la largeur **SI ET SEULEMENT SI** le bloc des totaux utilise `col-12` en PDF.

## Installation

1. **Installer le module** :
   - Aller dans **Apps**
   - Rechercher "Dorevia Report PDF Layout Fix"
   - Cliquer sur **Installer**

2. **Mettre à jour le module** :
   - Apps → "Dorevia Report PDF Layout Fix" → **Mettre à jour**

3. **Redémarrer Odoo** :
   ```bash
   cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
   docker compose restart odoo
   ```

4. **Vérifier** :
   - Générer un PDF de devis, pro forma ou facture
   - Vérifier que le bloc des totaux occupe toute la largeur
   - Vérifier qu'il n'y a plus de zone blanche à droite

## Désinstallation

Si vous souhaitez désinstaller le module :
- **Apps** → Rechercher "Dorevia Report PDF Layout Fix" → **Désinstaller**

## Notes techniques

- Module **transversal** : corrige tous les rapports PDF en une seule fois
- Modifie uniquement la classe CSS du bloc des totaux pour les PDF
- Compatible avec Odoo 18.0
- Priorité 99 pour garantir l'application après les autres héritages
- N'impacte pas les vues HTML (preview, email, web)

## Tests de non-régression

- ✅ Devis PDF : Bloc totaux à 100% (corrigé)
- ✅ Commandes PDF : Bloc totaux à 100% (corrigé)
- ✅ Pro Forma PDF : Bloc totaux à 100% (corrigé)
- ✅ Factures PDF : Bloc totaux à 100% (corrigé)
- ✅ Vues HTML : Classes Bootstrap inchangées

## Relation avec dorevia_sale_proforma_report_fix

Si vous avez installé `dorevia_sale_proforma_report_fix`, vous pouvez le **désinstaller** après avoir installé ce module :
- Ce module corrige le même problème de manière plus complète
- Ce module est transversal et couvre tous les rapports

## Support

Pour plus d'informations, voir :
- `CRITERE_VERITE.md` : Explication du critère de vérité et méthodes de vérification
- `SPEC_Dorevia_Report_PDF_Layout_Fix_v1.0.md` : Spécification complète du module

