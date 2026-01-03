# 📐 Spécification Technique — Finition "Premium" Vue POS Vault Z-Report (Odoo 18)

**Date** : 2025-12-13  
**Version** : 1.0  
**Cible** : Module Odoo `dorevia_vault_pos_z_connector` → Vue `pos.session` → Onglet "Vault Z-Report"  
**Conformité** : Charte UX Dorevia Vault Views v1.0

---

## 📋 Vue d'ensemble

Ce document détaille l'implémentation technique des **3 micro-ajustements UX** pour obtenir une expérience "premium" sur la vue POS Vault Z-Report, tout en restant conforme à la Charte UX Dorevia Vault Views v1.0.

### Modifications à appliquer

1. **P1** : Limiter la répétition "Scellé" (header + Conformité)
2. **P2** : Bouton "copier" : tooltip explicite + feedback "Copié"
3. **P3** : Tentatives : visibles seulement quand c'est utile

---

## 🔧 P1 — Limiter la répétition "Scellé"

### Objectif

Éviter la répétition visuelle du terme "Scellé" entre le header et la section Conformité, tout en conservant l'information importante.

### Solution technique

**Header** : Conserver le badge `✅ Scellé`  
**Section Conformité** : Afficher un badge générique sans répéter le mot "Scellé"

### Implémentation

#### 1. Modifier le champ "État" dans la section Conformité

**Fichier** : `views/pos_session_vault_z_report_views.xml` (ou équivalent)

**Avant** :
```xml
<field name="vault_evidence_state" widget="badge" 
       decoration-success="vault_evidence_state == 'sealed'"
       decoration-info="vault_evidence_state == 'pending'"
       decoration-warning="vault_evidence_state == 'processing'"
       decoration-danger="vault_evidence_state == 'error'"/>
```

**Après** :
```xml
<!-- Option recommandée : Badge générique "Conforme" -->
<field name="vault_evidence_state" widget="badge" 
       decoration-success="vault_evidence_state == 'sealed'"
       decoration-info="vault_evidence_state == 'pending'"
       decoration-warning="vault_evidence_state == 'processing'"
       decoration-danger="vault_evidence_state == 'error'"
       options="{'text_map': {'sealed': 'Conforme', 'pending': 'En attente', 'processing': 'En cours', 'error': 'Erreur'}}"/>
```

**Alternative (plus minimaliste)** :
```xml
<!-- Option alternative : Badge avec icône uniquement -->
<field name="vault_evidence_state" widget="badge" 
       decoration-success="vault_evidence_state == 'sealed'"
       decoration-info="vault_evidence_state == 'pending'"
       decoration-warning="vault_evidence_state == 'processing'"
       decoration-danger="vault_evidence_state == 'error'"
       options="{'text_map': {'sealed': '✅', 'pending': '⏳', 'processing': '🔄', 'error': '❌'}}"/>
```

#### 2. Modifier le label du champ

**Avant** :
```xml
<label for="vault_evidence_state" string="État"/>
```

**Après** :
```xml
<label for="vault_evidence_state" string="État : Conforme"/>
```

**OU** (si vous utilisez un computed field) :
```xml
<field name="vault_evidence_state_display" 
       widget="badge" 
       decoration-success="vault_evidence_state == 'sealed'"
       string="État"/>
```

Avec dans le modèle Python :
```python
@api.depends('vault_evidence_state')
def _compute_vault_evidence_state_display(self):
    for record in self:
        if record.vault_evidence_state == 'sealed':
            record.vault_evidence_state_display = 'Conforme'
        elif record.vault_evidence_state == 'pending':
            record.vault_evidence_state_display = 'En attente'
        elif record.vault_evidence_state == 'processing':
            record.vault_evidence_state_display = 'En cours'
        elif record.vault_evidence_state == 'error':
            record.vault_evidence_state_display = 'Erreur'
        else:
            record.vault_evidence_state_display = record.vault_evidence_state or ''
```

### Résultat attendu

- **Header** : `✅ Scellé` (inchangé)
- **Conformité → État** : `✅ Conforme` (ou `✅` seul) au lieu de `✅ Scellé`

---

## 🔧 P2 — Bouton "copier" : tooltip explicite + feedback "Copié"

### Objectif

Améliorer la compréhension et l'expérience utilisateur du bouton de copie du lien de preuve.

### Solution technique

1. Ajouter un tooltip explicite : `Copier le lien de preuve`
2. Ajouter un feedback visuel après le clic : notification toast `Lien copié`

### Implémentation

#### 1. Ajouter le bouton avec tooltip

**Fichier** : `views/pos_session_vault_z_report_views.xml`

**Avant** :
```xml
<button name="copy_proof_link" 
        type="object" 
        icon="fa-copy" 
        class="btn-secondary"/>
```

**Après** :
```xml
<button name="copy_proof_link" 
        type="object" 
        icon="fa-copy" 
        class="btn-secondary"
        title="Copier le lien de preuve"
        attrs="{'invisible': [('vault_proof_url', '=', False)]}"/>
```

#### 2. Implémenter la méthode Python avec feedback

**Fichier** : `models/pos_session.py` (ou équivalent)

**Avant** :
```python
def copy_proof_link(self):
    self.ensure_one()
    if self.vault_proof_url:
        return {
            'type': 'ir.actions.clipboard',
            'value': self.vault_proof_url,
        }
    return False
```

**Après** :
```python
def copy_proof_link(self):
    self.ensure_one()
    if not self.vault_proof_url:
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Erreur'),
                'message': _('Aucun lien de preuve disponible.'),
                'type': 'danger',
                'sticky': False,
            }
        }
    
    # Copier dans le presse-papiers
    action = {
        'type': 'ir.actions.clipboard',
        'value': self.vault_proof_url,
    }
    
    # Afficher une notification de confirmation
    return {
        'type': 'ir.actions.client',
        'tag': 'display_notification',
        'params': {
            'title': _('Lien copié'),
            'message': _('Le lien de preuve a été copié dans le presse-papiers.'),
            'type': 'success',
            'sticky': False,
        },
        'context': {'clipboard_action': action},
    }
```

**Alternative (méthode plus simple avec JavaScript)** :

Si vous préférez utiliser JavaScript côté client :

**Fichier** : `static/src/js/vault_z_report.js`

```javascript
odoo.define('dorevia_vault_pos_z_connector.copy_proof_link', function (require) {
    'use strict';
    
    var FormController = require('web.FormController');
    var core = require('web.core');
    var _t = core._t;
    
    FormController.include({
        _onButtonClicked: function (event) {
            if (event.data.attrs && event.data.attrs.name === 'copy_proof_link') {
                var self = this;
                var record = this.model.get(event.data.record.id);
                var proofUrl = record.data.vault_proof_url;
                
                if (!proofUrl) {
                    this.displayNotification({
                        title: _t('Erreur'),
                        message: _t('Aucun lien de preuve disponible.'),
                        type: 'danger',
                    });
                    return;
                }
                
                // Copier dans le presse-papiers
                navigator.clipboard.writeText(proofUrl).then(function() {
                    self.displayNotification({
                        title: _t('Lien copié'),
                        message: _t('Le lien de preuve a été copié dans le presse-papiers.'),
                        type: 'success',
                    });
                }).catch(function(err) {
                    self.displayNotification({
                        title: _t('Erreur'),
                        message: _t('Impossible de copier le lien.'),
                        type: 'danger',
                    });
                });
                
                event.stopPropagation();
                return;
            }
            return this._super.apply(this, arguments);
        },
    });
});
```

**Fichier** : `__manifest__.py`

```python
{
    'assets': {
        'web.assets_backend': [
            'dorevia_vault_pos_z_connector/static/src/js/vault_z_report.js',
        ],
    },
}
```

### Résultat attendu

- **Au survol** : Tooltip visible `Copier le lien de preuve`
- **Au clic** : Notification toast `Lien copié` (type: success, non sticky)

---

## 🔧 P3 — Tentatives : visibles seulement quand c'est utile

### Objectif

Masquer la section "Tentatives de vaultérisation" en état "Scellé" (succès) pour éviter l'encombrement visuel, tout en la gardant visible en cas d'erreur ou de tentative multiple.

### Solution technique

Afficher la section "Tentatives" uniquement si :
- `vault_evidence_state in ('pending', 'processing', 'error')` (états non-succès)
- OU `vault_z_attempts > 1` (cas anormal / intéressant)

### Implémentation

#### Option 1 : Masquer avec `attrs` (recommandé)

**Fichier** : `views/pos_session_vault_z_report_views.xml`

**Avant** :
```xml
<group string="Tentatives de vaultérisation" col="2">
    <field name="vault_z_attempts"/>
    <field name="vault_z_last_attempt_date"/>
    <field name="vault_z_last_attempt_error"/>
</group>
```

**Après** :
```xml
<group string="Tentatives de vaultérisation" 
       col="2"
       attrs="{'invisible': [
           ('vault_evidence_state', '=', 'sealed'),
           ('vault_z_attempts', '<=', 1)
       ]}">
    <field name="vault_z_attempts"/>
    <field name="vault_z_last_attempt_date"/>
    <field name="vault_z_last_attempt_error"/>
</group>
```

**Note** : La condition `attrs` avec `OR` n'est pas directement supportée. Utilisez une approche avec un computed field :

#### Option 2 : Utiliser un computed field (plus propre)

**Fichier** : `models/pos_session.py`

```python
@api.depends('vault_evidence_state', 'vault_z_attempts')
def _compute_show_vault_attempts(self):
    for record in self:
        # Afficher si :
        # - État non-succès (pending, processing, error)
        # - OU plus d'une tentative (cas anormal)
        record.show_vault_attempts = (
            record.vault_evidence_state in ('pending', 'processing', 'error') or
            (record.vault_z_attempts or 0) > 1
        )

show_vault_attempts = fields.Boolean(
    string="Afficher les tentatives",
    compute='_compute_show_vault_attempts',
    store=False,
)
```

**Fichier** : `views/pos_session_vault_z_report_views.xml`

```xml
<group string="Tentatives de vaultérisation" 
       col="2"
       attrs="{'invisible': [('show_vault_attempts', '=', False)]}">
    <field name="vault_z_attempts"/>
    <field name="vault_z_last_attempt_date"/>
    <field name="vault_z_last_attempt_error"/>
</group>
```

#### Option 3 : Déplacer dans "Audit technique" (repliable)

Si vous avez une section "Audit technique" repliable :

**Fichier** : `views/pos_session_vault_z_report_views.xml`

```xml
<notebook>
    <page string="Preuve" name="proof">
        <!-- Contenu principal -->
    </page>
    <page string="Conformité" name="compliance">
        <!-- Section Conformité -->
    </page>
    <page string="Chaînage" name="chaining">
        <!-- Section Chaînage -->
    </page>
    <page string="Audit technique" name="audit">
        <group string="Tentatives de vaultérisation" col="2">
            <field name="vault_z_attempts"/>
            <field name="vault_z_last_attempt_date"/>
            <field name="vault_z_last_attempt_error"/>
        </group>
        <!-- Autres informations d'audit -->
    </page>
</notebook>
```

### Résultat attendu

- **En succès (Scellé, 1 tentative)** : Section "Tentatives" masquée
- **En pending/error** : Section "Tentatives" visible
- **En succès mais > 1 tentative** : Section "Tentatives" visible (cas anormal)

---

## 📝 Checklist de validation

### P1 — Répétition "Scellé"
- [ ] Le terme "Scellé" n'apparaît qu'une seule fois (dans le header)
- [ ] La section Conformité affiche un badge générique ("Conforme" ou icône)
- [ ] La hiérarchie visuelle reste claire

### P2 — Bouton copier
- [ ] Tooltip visible au survol : `Copier le lien de preuve`
- [ ] Notification toast après clic : `Lien copié` (type: success)
- [ ] Le bouton est masqué si `vault_proof_url` est vide

### P3 — Tentatives
- [ ] Section "Tentatives" masquée en état "Scellé" avec 1 tentative
- [ ] Section "Tentatives" visible en état pending/processing/error
- [ ] Section "Tentatives" visible si `vault_z_attempts > 1` (même en succès)

### Conformité globale
- [ ] La hiérarchie "Preuve > Conformité > Chaînage > Audit" reste intacte
- [ ] Aucune régression visuelle
- [ ] Tests manuels effectués

---

## 🧪 Tests de validation

### Test 10 secondes (utilisateur non-tech)

1. Ouvrir la vue POS Vault Z-Report
2. Demander : "Qu'est-ce que tu peux faire ici ?"
3. **Résultat attendu** : "Ouvrir la preuve" est cité immédiatement

### Test 30 secondes (utilisateur métier)

1. "Quelle société ? quel tenant ? à quelle date ?"
2. **Résultat attendu** : Réponse sans scroller et sans confusion Société/Tenant

### Test fonctionnel P1

1. Ouvrir une session POS avec état "Scellé"
2. Vérifier que "Scellé" n'apparaît qu'une fois (header)
3. Vérifier que la section Conformité affiche "Conforme" (ou icône)

### Test fonctionnel P2

1. Survoler le bouton copier
2. Vérifier le tooltip : `Copier le lien de preuve`
3. Cliquer sur le bouton
4. Vérifier la notification : `Lien copié`
5. Vérifier que le lien est bien dans le presse-papiers

### Test fonctionnel P3

1. Ouvrir une session POS avec état "Scellé" et 1 tentative
2. Vérifier que la section "Tentatives" est masquée
3. Ouvrir une session POS avec état "error"
4. Vérifier que la section "Tentatives" est visible
5. Ouvrir une session POS avec état "Scellé" mais 2 tentatives
6. Vérifier que la section "Tentatives" est visible

---

## 📚 Références

- **Charte UX** : Dorevia Vault Views v1.0
- **Module Odoo** : `dorevia_vault_pos_z_connector`
- **Vue** : `pos.session` → Onglet "Vault Z-Report"
- **Version Odoo** : 18.0

---

## 🔄 Notes d'implémentation

### Compatibilité Odoo 18

- Utiliser `attrs` au lieu de `attrs` déprécié (Odoo 17+)
- Utiliser `widget="badge"` avec `options` pour les textes personnalisés
- Utiliser `display_notification` pour les toasts (Odoo 14+)

### Performance

- Les computed fields pour `show_vault_attempts` ne sont pas stockés (store=False) pour éviter les requêtes inutiles
- Le tooltip utilise l'attribut natif `title` (pas de JavaScript supplémentaire)

### Accessibilité

- Le tooltip est accessible via l'attribut `title` (compatible lecteurs d'écran)
- Les notifications toast sont non-sticky pour ne pas bloquer l'interface

---

**Fin du document.**

