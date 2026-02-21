# Dorevia Posted Lock — Module Odoo

**Version** : 1.0.0  
**Auteur** : Dorevia Team  
**Licence** : LGPL-3

---

## 📋 Description

Le module **Dorevia Posted Lock** verrouille les factures (`account.move`) à l'état `posted` pour garantir leur immutabilité, conformément à la **Règle Fondatrice Dorevia #2** :

> **"Tout document comptable à l'état `POSTED` est définitif et immuable. Toute correction passe par un nouveau document comptable (annulation, avoir, contre-passation)."**

### Fonctionnalités

- ✅ **Blocage des modifications** : Empêche toute modification de factures `posted`
- ✅ **Blocage de la suppression** : Empêche la suppression de factures `posted`
- ✅ **Blocage du reset to draft** : Empêche le retour en brouillon (configurable)
- ✅ **Protection des lignes** : Empêche les modifications directes des lignes de facture
- ✅ **Whitelist réconciliation** : Permet la réconciliation normale (champs techniques modifiables)
- ✅ **Whitelist chatter** : Permet l'ajout de messages/pièces jointes (configurable)
- ✅ **Bypass migration** : Permet le bypass pour migrations/imports (context flag)
- ✅ **Verrouillage renforcé** : Si `dorevia_vaulted=True`, même le chatter est interdit

---

## ⚙️ Configuration

### Paramètres système

Le module expose 4 paramètres système configurables via **Paramètres → Technique → Paramètres → Paramètres système** :

1. **`dorevia_posted_lock.enabled`** (bool, défaut: `True`)
   - Active/désactive le verrouillage globalement
   - Si `False`, le module n'applique aucune restriction

2. **`dorevia_posted_lock.allow_chatter`** (bool, défaut: `True`)
   - Autorise l'ajout de messages et pièces jointes sur factures `posted`
   - Si `False`, même le chatter est bloqué
   - **Note** : Si `dorevia_vaulted=True`, le chatter est toujours interdit (verrouillage renforcé)

3. **`dorevia_posted_lock.apply_to_entries`** (bool, défaut: `False`)
   - Applique le verrouillage aux écritures comptables (`move_type='entry'`)
   - Par défaut, seules les factures/avoirs sont verrouillés

4. **`dorevia_posted_lock.allow_draft`** (bool, défaut: `False`)
   - Autorise `button_draft()` sur factures `posted`
   - Si `True`, permet de remettre en brouillon (non recommandé)

---

## 🚫 Champs protégés

### `account.move` (facture)

Les champs suivants ne peuvent **pas** être modifiés sur une facture `posted` :

- **Identité** : `move_type`, `company_id`, `journal_id`, `currency_id`
- **Partenaire** : `partner_id`, `commercial_partner_id`, `partner_shipping_id`, `partner_bank_id`
- **Dates** : `invoice_date`, `invoice_date_due`, `date`
- **Paiement** : `invoice_payment_term_id`, `payment_reference`
- **Références** : `ref`, `invoice_origin`, `name`
- **Lignes et taxes** : `line_ids`, `invoice_line_ids`, `fiscal_position_id`, `invoice_cash_rounding_id`, `tax_totals`
- **Totaux** : `amount_untaxed`, `amount_tax`, `amount_total`, `amount_residual`

### `account.move.line` (ligne de facture)

Les champs suivants ne peuvent **pas** être modifiés sur une ligne de facture `posted` :

- **Comptabilité** : `account_id`, `debit`, `credit`, `balance`
- **Quantité et prix** : `quantity`, `price_unit`, `discount`
- **Taxes** : `tax_ids`, `tax_line_id`, `tax_tag_ids`
- **Produit** : `product_id`, `analytic_distribution`, `analytic_precision`
- **Devise** : `currency_id`, `amount_currency`
- **Partenaire** : `partner_id`

### Champs autorisés (whitelist)

**Réconciliation** (toujours autorisés) :
- `matched_debit_ids`, `matched_credit_ids`
- `amount_residual`, `amount_residual_currency`
- `full_reconcile_id`, `reconciled`

**Chatter** (si `allow_chatter=True` et `dorevia_vaulted=False`) :
- `message_follower_ids`, `message_ids`, `activity_ids`, `attachment_ids`

---

## 💬 Messages d'erreur

Le module génère des messages d'erreur **contextuels et prescriptifs** :

### Modification de facture

```
Facture postée : modification interdite.
Champs concernés : partner_id, invoice_date

Utilisez une annulation / avoir (ou une écriture de correction) 
pour ajuster la comptabilité.
```

### Modification de lignes

```
Facture postée : modification des lignes interdite.

Pour corriger : créez un avoir ou une facture de correction.
```

### Suppression

```
Facture postée : suppression interdite.

Pour corriger : créez un avoir ou une facture de correction.
```

### Reset to draft

```
Impossible de remettre en brouillon une facture postée.

Utilisez une annulation ou un avoir pour corriger.
```

---

## 🔧 Bypass pour migrations

Pour les migrations/imports, utilisez le context flag `skip_posted_lock` :

```python
# Exemple : Migration de données
invoice.with_context(skip_posted_lock=True).write({
    'partner_id': new_partner.id,
})
```

**⚠️ ATTENTION** : Utiliser uniquement pour migrations/imports, jamais en production normale.

---

## 🔒 Verrouillage renforcé (v1.1)

Le champ `dorevia_vaulted` permet d'identifier les factures vaultées dans Dorevia Vault.

**Comportement** :
- Si `dorevia_vaulted=True` et `posted` : **verrouillage renforcé**
- Même le chatter est interdit (même si `allow_chatter=True`)
- Préparation pour v1.1 (WORM total)

---

## ✅ Workflows Odoo compatibles

Le module **ne bloque pas** les workflows Odoo standards :

- ✅ **Annulation** : `button_cancel()` fonctionne normalement
- ✅ **Avoir** : `action_reverse()` fonctionne normalement
- ✅ **Réconciliation** : Les champs techniques sont modifiables
- ✅ **Paiements** : Les paiements et réconciliations fonctionnent normalement

---

## 🧪 Tests

### Tests unitaires

```bash
# Lancer les tests unitaires
odoo -u dorevia_posted_lock -d test_db --test-tags=dorevia_posted_lock --stop-after-init
```

### Tests d'intégration

Les tests d'intégration vérifient :
- Réconciliation complète
- Génération d'avoir
- Reverse entry
- Annulation

---

## 📚 Documentation technique

Voir `DEVELOPER.md` pour :
- Architecture du module
- Liste complète des champs protégés
- Whitelist réconciliation
- Bypass migration
- Extension pour v1.1

---

## 🐛 Dépannage

### Le module bloque une opération légitime

1. Vérifier les paramètres système (`dorevia_posted_lock.*`)
2. Vérifier si `dorevia_vaulted=True` (verrouillage renforcé)
3. Utiliser le bypass migration si nécessaire (`skip_posted_lock` context)

### La réconciliation ne fonctionne pas

1. Vérifier que les champs de réconciliation sont dans la whitelist
2. Vérifier que le module est à jour
3. Vérifier les logs Odoo pour les erreurs détaillées

---

## 📞 Support

Pour toute question ou problème :
- Consulter `DEVELOPER.md` pour les détails techniques
- Vérifier les logs Odoo pour les erreurs détaillées
- Contacter l'équipe Dorevia

---

**Version** : 1.0.0  
**Date** : 2026-01-04

