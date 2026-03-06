# 🔍 Analyse Expert : SPEC Dorevia Posted Lock v1.0

**Analyste** : Lead Dev Dorevia / Odoo  
**Date** : 2026-01-04  
**Statut** : ✅ **VALIDÉ avec recommandations**

---

## 📋 Résumé exécutif

**Verdict global** : ✅ **SPEC solide et alignée avec les règles fondatrices Dorevia**

La SPEC est **cohérente** avec la doctrine Dorevia (Règle #2 : Immutabilité des documents comptables `POSTED`).  
Le design technique est **faisable** dans Odoo 18.0 avec quelques ajustements recommandés.

**Recommandations prioritaires** :
1. ⚠️ **CRITIQUE** : Gérer les cas de réconciliation/paiement (champs techniques modifiés après `posted`)
2. ⚠️ **IMPORTANT** : Prévoir un mécanisme de bypass pour les migrations/imports
3. ⚠️ **IMPORTANT** : Clarifier l'interaction avec `button_draft` (reset to draft)
4. ✅ **RECOMMANDÉ** : Ajouter un champ `dorevia_vaulted` pour verrouillage renforcé (v1.0)

---

## 1️⃣ Cohérence avec les Règles Fondatrices Dorevia

### ✅ Alignement parfait

**Règle Fondatrice #2** : *"Tout document comptable à l'état `POSTED` est définitif et immuable."*

La SPEC implémente exactement cette règle au niveau Odoo :
- ✅ Interdiction de modification après `posted`
- ✅ Correction uniquement via mécanismes comptables (annulation, avoir)
- ✅ Compatible avec la règle #3 (annulation → `out_refund`)

**Verdict** : ✅ **100% conforme aux règles fondatrices**

---

## 2️⃣ Faisabilité technique Odoo 18.0

### ✅ Design technique valide

**Points forts** :
- ✅ Override de `write()` et `unlink()` : approche standard Odoo
- ✅ Algorithme clair : vérification des champs modifiés vs whitelist
- ✅ Compatibilité avec workflows Odoo (annulation, reverse)

**Points d'attention techniques** :

#### 2.1 Gestion des `vals` dans `write()`

**Recommandation** : Utiliser `self._fields` pour détecter les champs réels vs computed/stored :

```python
def write(self, vals):
    # Filtrer les champs computed/stored qui ne sont pas modifiables directement
    real_fields = {k for k in vals.keys() if k in self._fields}
    protected_fields = real_fields & PROTECTED_FIELDS
```

**Raison** : Certains champs `amount_*` sont computed et peuvent apparaître dans `vals` sans être modifiables.

#### 2.2 Gestion des One2many (`invoice_line_ids`, `line_ids`)

**⚠️ CRITIQUE** : Les One2many sont modifiés via `Command` (create, update, delete).

**Recommandation** : Intercepter les `Command.UPDATE` et `Command.DELETE` :

```python
def write(self, vals):
    # Détecter les Command.UPDATE/DELETE sur invoice_line_ids
    if 'invoice_line_ids' in vals:
        for cmd in vals['invoice_line_ids']:
            if cmd[0] in (Command.UPDATE, Command.DELETE):
                # Vérifier si move est posted
                if self.state == 'posted':
                    raise UserError(...)
```

**Raison** : Sinon, les modifications de lignes passent inaperçues.

#### 2.3 Performance

**Recommandation** : Optimiser la vérification pour éviter des requêtes inutiles :

```python
def write(self, vals):
    # Early exit si pas de champs protégés
    if not (set(vals.keys()) & PROTECTED_FIELDS):
        return super().write(vals)
    
    # Vérifier state uniquement si nécessaire
    if any(move.state == 'posted' for move in self):
        # Vérifications...
```

**Raison** : Éviter de vérifier `state` pour chaque `write()` si aucun champ protégé n'est modifié.

---

## 3️⃣ Risques et Edge Cases

### ⚠️ RISQUE 1 : Réconciliation et paiements

**Problème** : Après `posted`, certains champs techniques sont modifiés par Odoo lors de la réconciliation :
- `line_ids.matched_debit_ids` / `matched_credit_ids`
- `line_ids.amount_residual`
- `line_ids.full_reconcile_id`

**Impact** : ⚠️ **ÉLEVÉ** — Le module pourrait bloquer la réconciliation normale.

**Solution recommandée** :

```python
# Whitelist pour champs de réconciliation
RECONCILIATION_FIELDS = {
    'line_ids.matched_debit_ids',
    'line_ids.matched_credit_ids',
    'line_ids.amount_residual',
    'line_ids.amount_residual_currency',
    'line_ids.full_reconcile_id',
}

# Dans write()
if self.state == 'posted':
    # Exclure les champs de réconciliation
    protected = (set(vals.keys()) & PROTECTED_FIELDS) - RECONCILIATION_FIELDS
    if protected:
        raise UserError(...)
```

**Action** : ⚠️ **OBLIGATOIRE** — Ajouter cette whitelist en v1.0.

---

### ⚠️ RISQUE 2 : `button_draft` (Reset to draft)

**Problème** : La SPEC dit "Reset to draft interdit", mais `button_draft()` est un workflow Odoo standard.

**Impact** : ⚠️ **MOYEN** — Conflit avec certains workflows clients.

**Solution recommandée** :

**Option A (recommandée)** : Bloquer `button_draft()` explicitement :

```python
def button_draft(self):
    if self.state == 'posted' and self.move_type in INVOICE_TYPES:
        raise UserError(_(
            "Impossible de remettre en brouillon une facture postée. "
            "Utilisez une annulation ou un avoir pour corriger."
        ))
    return super().button_draft()
```

**Option B** : Paramètre système `dorevia_posted_lock.allow_draft` (défaut: False).

**Action** : ⚠️ **RECOMMANDÉ** — Clarifier dans la SPEC et implémenter Option A.

---

### ⚠️ RISQUE 3 : Migrations et imports

**Problème** : Les migrations/imports peuvent modifier des factures `posted` pour corriger des données.

**Impact** : ⚠️ **MOYEN** — Bloque les migrations nécessaires.

**Solution recommandée** : Context flag pour bypass :

```python
def write(self, vals):
    # Bypass si flag de migration
    if self.env.context.get('skip_posted_lock'):
        return super().write(vals)
    
    # Vérifications normales...
```

**Action** : ⚠️ **RECOMMANDÉ** — Ajouter en v1.0 avec documentation stricte.

---

### ⚠️ RISQUE 4 : Modules OCA tiers

**Problème** : Certains modules OCA modifient des champs après `posted` (ex: `account_global_discount`).

**Impact** : ⚠️ **MOYEN** — Incompatibilités possibles.

**Solution recommandée** : 
- Whitelist extensible via paramètre système
- Documentation des modules compatibles/incompatibles

**Action** : ⚠️ **RECOMMANDÉ** — Prévoir en v1.0, documenter en v1.1.

---

## 4️⃣ Design technique — Améliorations recommandées

### 4.1 Structure de code recommandée

```python
# models/account_move.py
class AccountMove(models.Model):
    _inherit = 'account.move'
    
    # Constantes
    PROTECTED_FIELDS = {
        'partner_id', 'invoice_date', 'currency_id', 'journal_id',
        'move_type', 'invoice_line_ids', 'line_ids', ...
    }
    
    RECONCILIATION_FIELDS = {
        'line_ids.matched_debit_ids', 'line_ids.matched_credit_ids',
        'line_ids.amount_residual', ...
    }
    
    CHATTER_FIELDS = {
        'message_follower_ids', 'message_ids', 'activity_ids',
        'attachment_ids',
    }
    
    INVOICE_TYPES = {'out_invoice', 'in_invoice', 'out_refund', 'in_refund'}
    
    def write(self, vals):
        # Early exit si lock désactivé
        if not self._is_lock_enabled():
            return super().write(vals)
        
        # Early exit si pas de champs protégés
        if not (set(vals.keys()) & (PROTECTED_FIELDS | RECONCILIATION_FIELDS)):
            return super().write(vals)
        
        # Vérifier chaque move
        for move in self:
            if move.state != 'posted':
                continue
            if move.move_type not in INVOICE_TYPES:
                continue
            
            # Filtrer whitelist (chatter si activé)
            allowed_fields = set()
            if self._is_chatter_allowed():
                allowed_fields |= CHATTER_FIELDS
            
            # Vérifier champs protégés
            protected = (set(vals.keys()) & PROTECTED_FIELDS) - allowed_fields
            if protected:
                raise UserError(self._get_lock_error_message(protected))
        
        return super().write(vals)
    
    def unlink(self):
        if self._is_lock_enabled():
            for move in self:
                if move.state == 'posted' and move.move_type in INVOICE_TYPES:
                    raise UserError(self._get_unlink_error_message())
        return super().unlink()
    
    def _is_lock_enabled(self):
        return self.env['ir.config_parameter'].sudo().get_param(
            'dorevia_posted_lock.enabled', 'True'
        ).lower() == 'true'
    
    def _is_chatter_allowed(self):
        return self.env['ir.config_parameter'].sudo().get_param(
            'dorevia_posted_lock.allow_chatter', 'True'
        ).lower() == 'true'
    
    def _get_lock_error_message(self, fields):
        return _(
            "Facture postée : modification interdite.\n"
            "Champs concernés : %s\n\n"
            "Utilisez une annulation / avoir (ou une écriture de correction) "
            "pour ajuster la comptabilité."
        ) % ', '.join(fields)
```

---

### 4.2 Gestion des lignes (`account.move.line`)

**Recommandation** : Vérifier le parent move dans `write()` :

```python
class AccountMoveLine(models.Model):
    _inherit = 'account.move.line'
    
    PROTECTED_LINE_FIELDS = {
        'account_id', 'debit', 'credit', 'quantity', 'price_unit',
        'tax_ids', 'product_id', 'partner_id', ...
    }
    
    def write(self, vals):
        if not self._is_lock_enabled():
            return super().write(vals)
        
        # Vérifier si parent move est posted
        for line in self:
            if line.move_id.state == 'posted':
                if line.move_id.move_type in INVOICE_TYPES:
                    protected = set(vals.keys()) & PROTECTED_LINE_FIELDS
                    if protected:
                        raise UserError(...)
        
        return super().write(vals)
    
    def unlink(self):
        if self._is_lock_enabled():
            for line in self:
                if line.move_id.state == 'posted':
                    if line.move_id.move_type in INVOICE_TYPES:
                        raise UserError(...)
        return super().unlink()
```

---

## 5️⃣ Points d'attention spécifiques

### 5.1 Compatibilité avec `account.move` standard

**⚠️ ATTENTION** : Odoo 18.0 a des mécanismes internes qui modifient certains champs après `posted`.

**Exemples** :
- `name` peut être généré automatiquement après `posted`
- `ref` peut être mis à jour par des modules de séquence
- `invoice_payment_state` est computed et peut changer

**Recommandation** : Tester exhaustivement avec un environnement Odoo 18.0 standard avant validation.

---

### 5.2 Interaction avec `action_post()`

**Question** : Faut-il bloquer `action_post()` si des champs protégés ont été modifiés en `draft` ?

**Réponse** : ❌ **NON** — La SPEC vise à protéger après `posted`, pas avant.

**Recommandation** : Laisser `action_post()` libre, mais documenter que toute modification après `posted` sera bloquée.

---

### 5.3 Gestion des erreurs

**Recommandation** : Messages d'erreur contextuels :

```python
def _get_lock_error_message(self, fields):
    # Message différent selon le type de modification
    if 'invoice_line_ids' in fields:
        return _(
            "Impossible de modifier les lignes d'une facture postée.\n"
            "Pour corriger : créez un avoir ou une facture de correction."
        )
    elif 'partner_id' in fields:
        return _(
            "Impossible de modifier le partenaire d'une facture postée.\n"
            "Pour corriger : créez un avoir et une nouvelle facture."
        )
    # Message générique...
```

---

## 6️⃣ Tests — Recommandations renforcées

### 6.1 Tests unitaires obligatoires (à compléter)

**À ajouter** :
- ✅ Posted → modifier `invoice_line_ids` via `Command.UPDATE` → refus
- ✅ Posted → modifier `invoice_line_ids` via `Command.DELETE` → refus
- ✅ Posted → réconciliation (modifier `amount_residual`) → OK
- ✅ Posted → ajouter message chatter (si allow_chatter) → OK
- ✅ Posted → `button_draft()` → refus
- ✅ Posted → context `skip_posted_lock=True` → OK (bypass)

### 6.2 Tests d'intégration (à compléter)

**À ajouter** :
- ✅ Posted + paiement + réconciliation complète
- ✅ Posted + avoir généré automatiquement
- ✅ Posted + reverse entry
- ✅ Posted + migration avec `skip_posted_lock`
- ✅ Posted + module OCA `account_global_discount`

---

## 7️⃣ Roadmap v1.0 — Ajustements recommandés

### 7.1 Ajout immédiat (v1.0)

**Champ `dorevia_vaulted`** :

```python
class AccountMove(models.Model):
    _inherit = 'account.move'
    
    dorevia_vaulted = fields.Boolean(
        string='Vaulted',
        default=False,
        help='Indique si cette facture a été vaultée dans Dorevia Vault'
    )
    
    def write(self, vals):
        # Si vaulted, verrouillage renforcé (même chatter interdit)
        if self.dorevia_vaulted and self.state == 'posted':
            # Verrouillage total (Option B de la SPEC)
            ...
```

**Raison** : Permet de préparer v1.1 tout en gardant flexibilité v1.0.

---

### 7.2 Paramètres système (à compléter)

**À ajouter** :
- `dorevia_posted_lock.allow_draft` (bool, défaut: False) — Autoriser `button_draft()`
- `dorevia_posted_lock.bypass_context` (str, défaut: 'skip_posted_lock') — Nom du context flag

---

## 8️⃣ Critères d'acceptation — Compléments

**À ajouter** :
- [ ] Réconciliation fonctionne normalement (champs techniques modifiables)
- [ ] `button_draft()` est bloqué (ou configurable)
- [ ] Bypass migration fonctionne (`skip_posted_lock` context)
- [ ] Chatter/attachments fonctionnent si activés
- [ ] Messages d'erreur contextuels et prescriptifs
- [ ] Tests d'intégration avec modules OCA standards

---

## 9️⃣ Verdict final

### ✅ Points forts

1. ✅ **Alignement parfait** avec les règles fondatrices Dorevia
2. ✅ **Design technique solide** et faisable dans Odoo 18.0
3. ✅ **Périmètre clair** (v1.0 vs v1.1)
4. ✅ **Messages d'erreur prescriptifs**

### ⚠️ Points à corriger/ajouter

1. ⚠️ **CRITIQUE** : Gérer les champs de réconciliation (whitelist)
2. ⚠️ **IMPORTANT** : Bloquer/clarifier `button_draft()`
3. ⚠️ **IMPORTANT** : Prévoir bypass migration (`skip_posted_lock`)
4. ⚠️ **RECOMMANDÉ** : Ajouter champ `dorevia_vaulted` en v1.0
5. ⚠️ **RECOMMANDÉ** : Gérer les `Command.UPDATE/DELETE` sur One2many

### 📊 Score global

**Faisabilité** : ✅ **9/10** (excellent, ajustements mineurs)  
**Cohérence** : ✅ **10/10** (parfait alignement règles fondatrices)  
**Complétude** : ⚠️ **7/10** (manque gestion réconciliation, button_draft)  
**Sécurité** : ✅ **9/10** (solide, prévoir bypass contrôlé)

**Verdict** : ✅ **VALIDÉ avec ajustements recommandés**

---

## 🔧 Plan d'action recommandé

### Phase 1 : Ajustements SPEC (avant implémentation)

1. ✅ Ajouter section "Gestion réconciliation" (whitelist champs techniques)
2. ✅ Clarifier `button_draft()` (bloquer explicitement)
3. ✅ Ajouter section "Bypass migration" (context flag)
4. ✅ Ajouter champ `dorevia_vaulted` en v1.0 (préparation v1.1)

### Phase 2 : Implémentation

1. ✅ Créer structure module (`dorevia_posted_lock`)
2. ✅ Implémenter `write()` et `unlink()` sur `account.move`
3. ✅ Implémenter `write()` et `unlink()` sur `account.move.line`
4. ✅ Gérer `Command.UPDATE/DELETE` sur One2many
5. ✅ Ajouter whitelist réconciliation
6. ✅ Bloquer `button_draft()`
7. ✅ Tests unitaires complets
8. ✅ Tests d'intégration (réconciliation, avoir, reverse)

### Phase 3 : Validation

1. ✅ Tests avec modules OCA standards
2. ✅ Tests de performance (grands volumes)
3. ✅ Documentation utilisateur
4. ✅ Documentation technique (bypass, whitelist)

---

## 📝 Conclusion

La SPEC **Dorevia Posted Lock v1.0** est **solide et alignée** avec la doctrine Dorevia.

**Avec les ajustements recommandés** (réconciliation, button_draft, bypass), le module sera **production-ready** et **robuste**.

**Recommandation finale** : ✅ **APPROUVER avec ajustements** — Le module est une **excellente implémentation** de la Règle Fondatrice #2.

---

**Date de l'analyse** : 2026-01-04  
**Analyste** : Lead Dev Dorevia / Odoo  
**Statut** : ✅ **VALIDÉ avec recommandations**

