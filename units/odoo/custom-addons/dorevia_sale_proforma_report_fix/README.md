# Dorevia Sale Proforma Report Fix

## Problème

Les PDF générés pour les **factures pro forma** (rapport "PRO-FORMA Invoice") présentent :
- Contenu **tassé à gauche** du document
- Grande **zone blanche** à droite
- Bloc des totaux qui n'occupe que 50% de la largeur (`col-6` au lieu de `col-12`)

## Diagnostic

**v1.1 - Diagnostic corrigé** :
- ✅ `external_layout` est **déjà présent** dans `sale.report_saleorder_document`
- ❌ Le problème vient de la **largeur du bloc des totaux** : `col-6` (50%) au lieu de `col-12` (100%) en PDF
- ✅ Solution : Modifier la classe CSS conditionnellement pour les pro forma PDF uniquement

## Solution

Ce module corrige la largeur du bloc des totaux en PDF pour les factures pro forma :
- En PDF pro forma : `col-12` (100% de la largeur)
- En PDF devis/commandes : `col-6` (50% de la largeur, inchangé)
- En HTML : `col-sm-7 col-md-6` (inchangé)

**Critère de vérité** : Le PDF pro forma utilise toute la largeur **SI ET SEULEMENT SI** le bloc des totaux utilise `col-12` en PDF.

## Installation

1. **Installer le module** :
   - Aller dans **Apps**
   - Rechercher "Dorevia Sale Proforma Report Fix"
   - Cliquer sur **Installer**

2. **Mettre à jour le module** :
   - Apps → "Dorevia Sale Proforma Report Fix" → **Mettre à jour**

3. **Redémarrer Odoo** :
   ```bash
   cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
   docker compose restart odoo
   ```

4. **Vérifier** :
   - Générer un PDF de facture pro forma
   - Vérifier que le bloc des totaux occupe toute la largeur
   - Vérifier qu'il n'y a plus de zone blanche à droite

## Désinstallation

Si vous souhaitez désinstaller le module :
- **Apps** → Rechercher "Dorevia Sale Proforma Report Fix" → **Désinstaller**

## Notes techniques

- Le module hérite du template `sale.report_saleorder_document`
- Modifie uniquement la classe CSS du bloc des totaux pour les pro forma PDF
- Compatible avec Odoo 18.0
- Priorité 99 pour garantir l'application après les autres héritages
- N'impacte pas les devis, commandes ou vues HTML

## Tests de non-régression

- ✅ Devis PDF : Rendu inchangé (bloc totaux à 50%)
- ✅ Commandes PDF : Rendu inchangé (bloc totaux à 50%)
- ✅ Vues HTML : Classes Bootstrap inchangées
- ✅ Pro forma PDF : Bloc totaux à 100% (corrigé)

## Support

Pour plus d'informations, voir :
- `CRITERE_VERITE.md` : Explication du critère de vérité et méthodes de vérification
- `SPEC_Dorevia_Sale_Proforma_PDF_Layout_Fix_v1.1.md` : Spécification complète du module
