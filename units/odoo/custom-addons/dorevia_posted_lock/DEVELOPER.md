# Dorevia Posted Lock — Documentation Technique

**Version** : 1.0.0  
**Public** : Développeurs Odoo / Dorevia

---

## 🏗️ Architecture

### Structure du module

```
dorevia_posted_lock/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   ├── account_move.py          # Verrouillage account.move
│   └── account_move_line.py      # Verrouillage account.move.line
├── views/
│   └── account_move_views.xml   # Vue formulaire (champ dorevia_vaulted)
├── security/
│   └── ir.model.access.csv      # Droits d'accès
├── data/
│   └── ir_config_parameter.xml  # Paramètres système
└── tests/
    ├── __init__.py
    ├── test_account_move_lock.py      # Tests unitaires moves
    ├── test_account_move_line_lock.py # Tests unitaires lignes
    └── test_integration.py            # Tests d'intégration
```

---

## 🔧 Implémentation technique

### Override de `write()`

**Fichier** : `models/account_move.py`

**Algorithme** :
1. Early exit si lock désactivé
2. Early exit si bypass migration (`skip_posted_lock` context)
3. Early exit si pas de champs protégés modifiés
4. Détection `Command.UPDATE/DELETE` sur One2many
5. Vérification `state == 'posted'` et `move_type` dans scope
6. Filtrage whitelist (chatter si activé, réconciliation)
7. `UserError` si champs protégés modifiés

**Code clé** :
```python
def write(self, vals):
    if not self._is_lock_enabled():
        return super().write(vals)
    
    if self.env.context.get('skip_posted_lock'):
        return super().write(vals)
    
    real_fields = {k for k in vals.keys() if k in self._fields}
    if not (real_fields & (self.PROTECTED_FIELDS | self.CHATTER_FIELDS)):
        return super().write(vals)
    
    for move in self:
        if not self._should_apply_lock(move):
            continue
        
        protected_commands = self._check_one2many_commands(vals)
        if protected_commands:
            raise UserError(...)
        
        allowed_fields = set()
        if self._is_chatter_allowed() and not move.dorevia_vaulted:
            allowed_fields |= self.CHATTER_FIELDS
        
        protected = (real_fields & self.PROTECTED_FIELDS) - allowed_fields
        if protected:
            raise UserError(self._get_lock_error_message(protected))
    
    return super().write(vals)
```

---

## 📋 Liste des champs protégés

### `account.move`

**Constante** : `PROTECTED_FIELDS`

```python
PROTECTED_FIELDS = {
    # Identité / contexte
    'move_type', 'company_id', 'journal_id', 'currency_id',
    # Partenaire / facturation
    'partner_id', 'commercial_partner_id', 'partner_shipping_id', 'partner_bank_id',
    # Dates
    'invoice_date', 'invoice_date_due', 'date',
    # Paiement
    'invoice_payment_term_id', 'payment_reference',
    # Références
    'ref', 'invoice_origin', 'name',
    # Taxes et lignes
    'line_ids', 'invoice_line_ids', 'fiscal_position_id', 'invoice_cash_rounding_id',
    'tax_totals',
    # Totaux indirects
    'amount_untaxed', 'amount_tax', 'amount_total', 'amount_residual',
}
```

### `account.move.line`

**Constante** : `PROTECTED_LINE_FIELDS`

```python
PROTECTED_LINE_FIELDS = {
    # Comptabilité
    'account_id', 'debit', 'credit', 'balance',
    # Quantité et prix
    'quantity', 'price_unit', 'discount',
    # Taxes
    'tax_ids', 'tax_line_id', 'tax_tag_ids',
    # Produit et analytique
    'product_id', 'analytic_distribution', 'analytic_precision',
    # Devise
    'currency_id', 'amount_currency',
    # Partenaire
    'partner_id',
}
```

---

## 🔓 Whitelist réconciliation

### Champs autorisés

**Constante** : `RECONCILIATION_FIELDS` (dans `account_move_line.py`)

```python
RECONCILIATION_FIELDS = {
    'matched_debit_ids', 'matched_credit_ids',
    'amount_residual', 'amount_residual_currency',
    'full_reconcile_id', 'reconciled',
}
```

**Raison** : Ces champs sont modifiés par Odoo lors de la réconciliation normale. Ils doivent rester modifiables pour permettre les paiements et réconciliations.

**Implémentation** : Les champs de réconciliation sont exclus de la vérification dans `account_move_line.write()` :

```python
protected = (real_fields & self.PROTECTED_LINE_FIELDS) - self.RECONCILIATION_FIELDS
```

---

## 🔓 Whitelist chatter

### Champs autorisés

**Constante** : `CHATTER_FIELDS` (dans `account_move.py`)

```python
CHATTER_FIELDS = {
    'message_follower_ids', 'message_ids', 'activity_ids', 'attachment_ids',
}
```

**Raison** : Permet l'ajout de messages et pièces jointes sur factures `posted` si `allow_chatter=True`.

**Exception** : Si `dorevia_vaulted=True`, même le chatter est interdit (verrouillage renforcé).

**Implémentation** :
```python
allowed_fields = set()
if self._is_chatter_allowed() and not move.dorevia_vaulted:
    allowed_fields |= self.CHATTER_FIELDS
```

---

## 🔧 Bypass migration

### Context flag

**Nom** : `skip_posted_lock`

**Usage** :
```python
# Migration de données
invoice.with_context(skip_posted_lock=True).write({
    'partner_id': new_partner.id,
})

# Import de données
moves.with_context(skip_posted_lock=True).write(vals)
```

**Implémentation** :
```python
if self.env.context.get('skip_posted_lock'):
    return super().write(vals)
```

**⚠️ ATTENTION** : 
- Utiliser uniquement pour migrations/imports
- Documenter chaque utilisation
- Ne jamais utiliser en production normale

---

## 🔒 Verrouillage renforcé (v1.1)

### Champ `dorevia_vaulted`

**Type** : `fields.Boolean`

**Comportement** :
- Si `dorevia_vaulted=True` et `posted` : **verrouillage renforcé**
- Même le chatter est interdit (même si `allow_chatter=True`)
- Préparation pour v1.1 (WORM total)

**Implémentation** :
```python
if self._is_chatter_allowed() and not move.dorevia_vaulted:
    # Chatter autorisé uniquement si pas vaulted
    allowed_fields |= self.CHATTER_FIELDS
```

---

## 🧪 Tests

### Structure des tests

**Tests unitaires** :
- `test_account_move_lock.py` : Tests pour `account.move`
- `test_account_move_line_lock.py` : Tests pour `account.move.line`

**Tests d'intégration** :
- `test_integration.py` : Tests de workflows Odoo (réconciliation, avoir, reverse)

### Exécution

```bash
# Tests unitaires
odoo -u dorevia_posted_lock -d test_db --test-tags=dorevia_posted_lock --stop-after-init

# Tests spécifiques
odoo -u dorevia_posted_lock -d test_db --test-tags=test_account_move_lock --stop-after-init
```

---

## 🔄 Extension pour v1.1

### Préparation

Le module prépare v1.1 avec :
- Champ `dorevia_vaulted` (déjà implémenté)
- Logique verrouillage renforcé (déjà implémentée)

### Évolutions prévues v1.1

1. **WORM total** : Si `dorevia_vaulted=True`, aucun `write()` autorisé (même chatter)
2. **Intégration Vault** : Champ `dorevia_vault_id` pour référence au Vault
3. **Audit trail** : Traçabilité complète des tentatives de modification

---

## 📝 Notes d'implémentation

### Performance

**Optimisations** :
- Early exit si lock désactivé
- Early exit si pas de champs protégés modifiés
- Vérification `state` uniquement si nécessaire

**Impact** : Minimal (vérifications uniquement si champs protégés modifiés)

### Compatibilité Odoo

**Version testée** : Odoo 18.0 CE

**Modules compatibles** :
- `account` (standard)
- `mail` (optionnel, pour chatter)

**Modules OCA testés** :
- À compléter selon retours

---

## 🐛 Dépannage technique

### Problème : Réconciliation bloquée

**Cause** : Champs de réconciliation non whitelistés

**Solution** : Vérifier que `RECONCILIATION_FIELDS` contient tous les champs nécessaires

### Problème : Chatter bloqué alors que `allow_chatter=True`

**Cause** : `dorevia_vaulted=True` (verrouillage renforcé)

**Solution** : Comportement attendu. Le verrouillage renforcé interdit même le chatter.

### Problème : Migration bloquée

**Cause** : Context flag `skip_posted_lock` non utilisé

**Solution** : Utiliser `with_context(skip_posted_lock=True)` pour les migrations

---

**Version** : 1.0.0  
**Date** : 2026-01-04

