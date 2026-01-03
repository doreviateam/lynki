# 💳 Implémentation Vue POS Payment — Dorevia Vault

**Date** : 2025-12-14  
**Modèle** : `pos.payment`  
**Layout** : Premium — 3 cartes alignées  
**Conformité** : Charte UX Dorevia Vault Views v1.0

---

## 📋 Vue d'ensemble

Cette vue implémente le layout premium pour les paiements POS avec :
- **Bandeau synthèse** en haut
- **3 cartes alignées** : Conformité | Preuve | Chaînage
- **Audit technique** en accordéon en bas

---

## 📐 Structure Complète

### Template XML — Vue POS Payment

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_pos_payment_vault_form" model="ir.ui.view">
        <field name="name">POS Payment Vault Form (Premium Layout)</field>
        <field name="model">pos.payment</field>
        <field name="arch" type="xml">
            <form string="Vault" class="o_form_view">
                <!-- HEADER : Badge état unique -->
                <header>
                    <field name="vault_evidence_state" 
                           widget="badge" 
                           decoration-success="vault_evidence_state == 'sealed'"
                           decoration-info="vault_evidence_state == 'pending'"
                           decoration-warning="vault_evidence_state == 'processing'"
                           decoration-danger="vault_evidence_state == 'error'"
                           options="{'text_map': {
                               'sealed': '✅ Scellé',
                               'pending': '⏳ En attente',
                               'processing': '🔄 En cours',
                               'error': '❌ Erreur'
                           }}"/>
                </header>
                
                <sheet>
                    <notebook>
                        <page string="Vault" name="vault">
                            <!-- Bandeau synthèse -->
                            <div class="dorevia_vault_band" 
                                 style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <i class="fa fa-lock" style="color: #6c757d; margin-right: 8px;"/>
                                    <strong style="font-size: 16px; color: #495057;">DOREVIA VAULT</strong>
                                    <field name="vault_evidence_state" 
                                           widget="badge"
                                           decoration-success="vault_evidence_state == 'sealed'"
                                           decoration-info="vault_evidence_state == 'pending'"
                                           decoration-warning="vault_evidence_state == 'processing'"
                                           decoration-danger="vault_evidence_state == 'error'"
                                           options="{'text_map': {
                                               'sealed': '✅ Scellé',
                                               'pending': '⏳ En attente',
                                               'processing': '🔄 En cours',
                                               'error': '❌ Erreur'
                                           }}"/>
                                </div>
                                <div style="font-size: 13px; color: #6c757d; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                    <span><field name="company_id" readonly="1" invisible="not company_id"/></span>
                                    <span style="display: none;" attrs="{'invisible': [('company_id', '=', False)]}">•</span>
                                    <span>Tenant: <field name="vault_tenant" readonly="1"/></span>
                                    <span>•</span>
                                    <span>Scellé: <field name="vault_date" readonly="1"/></span>
                                </div>
                            </div>

                            <!-- 3 cartes alignées -->
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 24px;">
                                <!-- Carte 1 : Conformité -->
                                <div style="border: 1px solid rgba(0,0,0,.08); border-radius: 12px; padding: 20px; background: #fff; min-height: 280px;">
                                    <div style="font-weight: 600; font-size: 16px; margin-bottom: 16px; color: #495057;">
                                        Conformité
                                    </div>
                                    
                                    <div style="display: flex; justify-content: space-between; gap: 10px; padding: 12px 0; border-top: 1px dashed rgba(0,0,0,.08);">
                                        <div style="color: rgba(0,0,0,.55); font-size: 13px;">État</div>
                                        <div style="font-weight: 500;">
                                            <field name="vault_evidence_state" 
                                                   widget="badge"
                                                   decoration-success="vault_evidence_state == 'sealed'"
                                                   decoration-info="vault_evidence_state == 'pending'"
                                                   decoration-warning="vault_evidence_state == 'processing'"
                                                   decoration-danger="vault_evidence_state == 'error'"
                                                   options="{'text_map': {
                                                       'sealed': '✅ Conforme',
                                                       'pending': '⏳ En attente',
                                                       'processing': '🔄 En cours',
                                                       'error': '❌ Erreur'
                                                   }}"/>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; justify-content: space-between; gap: 10px; padding: 12px 0; border-top: 1px dashed rgba(0,0,0,.08);">
                                        <div style="color: rgba(0,0,0,.55); font-size: 13px;">Date</div>
                                        <div style="font-weight: 500;">
                                            <field name="vault_date" readonly="1"/>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; justify-content: space-between; gap: 10px; padding: 12px 0; border-top: 1px dashed rgba(0,0,0,.08);">
                                        <div style="color: rgba(0,0,0,.55); font-size: 13px;">Société</div>
                                        <div style="font-weight: 500; text-align: right;">
                                            <field name="company_id" readonly="1"/>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; justify-content: space-between; gap: 10px; padding: 12px 0; border-top: 1px dashed rgba(0,0,0,.08);">
                                        <div style="color: rgba(0,0,0,.55); font-size: 13px;">Tenant</div>
                                        <div style="font-weight: 500; text-align: right;">
                                            <field name="vault_tenant" readonly="1"/>
                                        </div>
                                    </div>
                                </div>

                                <!-- Carte 2 : Preuve -->
                                <div style="border: 1px solid rgba(40,167,69,.2); border-radius: 12px; padding: 20px; background: rgba(40,167,69,.08); min-height: 280px;">
                                    <div style="font-weight: 600; font-size: 16px; margin-bottom: 16px; color: #155724;">
                                        Preuve
                                    </div>
                                    
                                    <div style="color: #666; margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                                        <i class="fa fa-shield" style="color: #28a745;"/>
                                        <span>Preuve disponible</span>
                                    </div>
                                    
                                    <button type="object" 
                                            name="action_open_proof" 
                                            class="btn btn-primary"
                                            style="width: 100%; padding: 12px 24px; font-size: 14px; border-radius: 6px; margin-bottom: 12px;"
                                            attrs="{'invisible': [('vault_proof_url', '=', False)]}">
                                        <i class="fa fa-external-link" style="margin-right: 8px;"/>
                                        Ouvrir la preuve
                                    </button>
                                    
                                    <div style="display: flex; gap: 8px;">
                                        <button type="object" 
                                                name="copy_proof_link" 
                                                class="btn btn-light btn-sm"
                                                title="Copier le lien de preuve"
                                                style="flex: 1; padding: 8px 12px; border-radius: 6px;"
                                                attrs="{'invisible': [('vault_proof_url', '=', False)]}">
                                            <i class="fa fa-copy" style="margin-right: 4px;"/>
                                            Copier
                                        </button>
                                        <button type="object" 
                                                name="action_download_proof" 
                                                class="btn btn-light btn-sm"
                                                title="Télécharger la preuve"
                                                style="flex: 1; padding: 8px 12px; border-radius: 6px;"
                                                attrs="{'invisible': [('vault_proof_url', '=', False)]}">
                                            <i class="fa fa-download" style="margin-right: 4px;"/>
                                            Télécharger
                                        </button>
                                    </div>
                                </div>

                                <!-- Carte 3 : Chaînage -->
                                <div style="border: 1px solid rgba(13,110,253,.2); border-radius: 12px; padding: 20px; background: rgba(13,110,253,.08); min-height: 280px;">
                                    <div style="font-weight: 600; font-size: 16px; margin-bottom: 16px; color: #0c5460;">
                                        Chaînage cryptographique
                                    </div>
                                    
                                    <div style="color: #666; margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                                        <i class="fa fa-link" style="color: #17a2b8;"/>
                                        <span>Garantie d'intégrité</span>
                                    </div>
                                    
                                    <div style="font-size: 12px; margin-bottom: 12px; font-family: monospace; color: #495057; word-break: break-all;">
                                        <div style="margin-bottom: 8px; color: rgba(0,0,0,.55); font-size: 11px;">Ledger Hash</div>
                                        <field name="vault_ledger_hash" readonly="1" 
                                               attrs="{'invisible': [('vault_ledger_hash', '=', False)]}"
                                               style="font-family: monospace; font-size: 11px;"/>
                                    </div>
                                    
                                    <div style="font-size: 12px; margin-bottom: 12px; font-family: monospace; color: #495057; word-break: break-all;"
                                         attrs="{'invisible': [('vault_hash_prev', '=', False)]}">
                                        <div style="margin-bottom: 8px; color: rgba(0,0,0,.55); font-size: 11px;">Hash précédent</div>
                                        <field name="vault_hash_prev" readonly="1"
                                               style="font-family: monospace; font-size: 11px;"/>
                                    </div>
                                    
                                    <button type="object" 
                                            name="action_focus_audit" 
                                            class="btn btn-outline-secondary btn-sm"
                                            style="width: 100%; padding: 8px 16px; border-radius: 6px; font-size: 13px; margin-top: 8px;">
                                        <i class="fa fa-chevron-down" style="margin-right: 4px;"/>
                                        Voir le détail
                                    </button>
                                </div>
                            </div>

                            <!-- Audit technique (accordéon) -->
                            <div style="margin-top: 24px;">
                                <group string="Audit technique" 
                                       style="padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;"
                                       attrs="{'invisible': [('show_vault_audit', '=', False)]}">
                                    <div style="margin-bottom: 16px;">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            Vault ID
                                        </label>
                                        <field name="vault_id" readonly="1" style="font-family: monospace; font-size: 12px;"/>
                                    </div>
                                    
                                    <div style="margin-bottom: 16px;"
                                         attrs="{'invisible': [('vault_request_id', '=', False)]}">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            Request ID
                                        </label>
                                        <field name="vault_request_id" readonly="1" 
                                               style="font-family: monospace; font-size: 12px;"/>
                                    </div>
                                    
                                    <div style="margin-bottom: 16px;"
                                         attrs="{'invisible': [('vault_hash_sha256', '=', False)]}">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            Hash SHA-256
                                        </label>
                                        <field name="vault_hash_sha256" readonly="1" 
                                               style="font-family: monospace; font-size: 12px;"/>
                                    </div>
                                    
                                    <div style="margin-bottom: 16px;"
                                         attrs="{'invisible': [('vault_ledger_hash', '=', False)]}">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            Ledger Hash
                                        </label>
                                        <field name="vault_ledger_hash" readonly="1" 
                                               style="font-family: monospace; font-size: 12px;"/>
                                    </div>
                                    
                                    <div style="margin-bottom: 16px;"
                                         attrs="{'invisible': [('vault_evidence_jws', '=', False)]}">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            JWS (Evidence)
                                        </label>
                                        <field name="vault_evidence_jws" readonly="1" widget="text"
                                               style="font-family: monospace; font-size: 11px;"/>
                                    </div>
                                    
                                    <div style="margin-bottom: 16px;"
                                         attrs="{'invisible': [('vault_last_error', '=', False)]}">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            Dernière erreur
                                        </label>
                                        <field name="vault_last_error" readonly="1" widget="text"
                                               style="color: #dc3545;"/>
                                    </div>
                                </group>
                            </div>
                        </page>
                    </notebook>
                </sheet>
            </form>
        </field>
    </record>
</odoo>
```

---

## 🔧 Modèle Python — Champs Requis

### Champs à Ajouter dans `pos.payment`

```python
from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)

class PosPayment(models.Model):
    _inherit = 'pos.payment'
    
    # Champs Vault
    vault_id = fields.Char(string="Vault ID", readonly=True)
    vault_evidence_state = fields.Selection([
        ('sealed', 'Scellé'),
        ('pending', 'En attente'),
        ('processing', 'En cours'),
        ('error', 'Erreur'),
    ], string="État Vault", readonly=True)
    vault_date = fields.Datetime(string="Date de scellement", readonly=True)
    vault_tenant = fields.Char(string="Tenant", readonly=True)
    vault_proof_url = fields.Char(
        string="URL de Preuve",
        compute='_compute_vault_proof_url',
        store=False,
        readonly=True,
    )
    vault_hash_sha256 = fields.Char(string="Hash SHA-256", readonly=True)
    vault_ledger_hash = fields.Char(string="Ledger Hash", readonly=True)
    vault_hash_prev = fields.Char(string="Hash précédent", readonly=True)
    vault_evidence_jws = fields.Text(string="JWS (Evidence)", readonly=True)
    vault_request_id = fields.Char(string="Request ID", readonly=True)
    vault_last_error = fields.Text(string="Dernière erreur", readonly=True)
    vault_attempts = fields.Integer(string="Tentatives", readonly=True)
    
    # Computed fields
    show_vault_audit = fields.Boolean(
        string="Afficher l'audit technique",
        compute='_compute_show_vault_audit',
        store=False,
    )
    
    @api.depends('vault_evidence_state', 'vault_attempts', 'vault_last_error')
    def _compute_show_vault_audit(self):
        """Affiche l'audit technique si nécessaire."""
        for record in self:
            record.show_vault_audit = (
                record.vault_evidence_state in ('pending', 'processing', 'error') or
                (record.vault_attempts or 0) > 1 or
                bool(record.vault_last_error)
            )
    
    @api.depends('vault_evidence_jws')
    def _compute_vault_proof_url(self):
        """Génère l'URL de preuve à partir du JWT."""
        for record in self:
            if not record.vault_evidence_jws:
                record.vault_proof_url = False
                continue
            
            try:
                import jwt
                decoded = jwt.decode(
                    record.vault_evidence_jws,
                    options={"verify_signature": False}
                )
                document_id = decoded.get("document_id")
                
                if document_id:
                    vault_url = self.env['ir.config_parameter'].sudo().get_param(
                        'dorevia.vault.url',
                        'https://vault.doreviateam.com'
                    )
                    record.vault_proof_url = f"{vault_url}/api/v1/ledger/verify/{document_id}"
                else:
                    record.vault_proof_url = False
            except Exception as e:
                _logger.error("Failed to generate proof URL: %s", str(e))
                record.vault_proof_url = False
    
    def action_open_proof(self):
        """Ouvre la preuve dans un nouvel onglet."""
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
        
        return {
            'type': 'ir.actions.act_url',
            'url': self.vault_proof_url,
            'target': 'new',
        }
    
    def copy_proof_link(self):
        """Copie le lien de preuve dans le presse-papiers."""
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
        
        action = {
            'type': 'ir.actions.clipboard',
            'value': self.vault_proof_url,
        }
        
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
    
    def action_download_proof(self):
        """Télécharge la preuve."""
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
        
        return {
            'type': 'ir.actions.act_url',
            'url': self.vault_proof_url,
            'target': 'self',
        }
    
    def action_focus_audit(self):
        """Ouvre l'accordéon audit et le met en focus."""
        self.ensure_one()
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Audit technique'),
                'message': _('Voir la section "Audit technique" ci-dessous.'),
                'type': 'info',
                'sticky': False,
            },
        }
```

---

## 📋 Checklist d'Implémentation

### Fichiers à Créer/Modifier

- [ ] **Vue XML** : `views/pos_payment_vault_views.xml`
- [ ] **Modèle Python** : `models/pos_payment.py` (ajouter les champs et méthodes)
- [ ] **Manifest** : `__manifest__.py` (ajouter la vue et les dépendances)

### Dépendances

- [ ] **PyJWT** : `pip install PyJWT` (pour décoder le JWT)
- [ ] **Dépendance Odoo** : Vérifier que le module dépend de `base`

### Tests

- [ ] Vérifier que les 3 cartes sont alignées
- [ ] Vérifier que le bandeau synthèse affiche les bonnes informations
- [ ] Tester le bouton "Ouvrir la preuve"
- [ ] Tester le bouton "Copier"
- [ ] Vérifier que l'audit technique est masqué en succès
- [ ] Vérifier le responsive (mobile)

---

## 📚 Références

- **Préconisation UX** : `PRECONISATION_UX_PAIEMENTS_POS_VAULT.md`
- **Charte UX** : `CHARTE_UX_DOREVIA_VAULT_VIEWS.md`
- **Guide correction URL** : `GUIDE_CORRECTION_URL_PREUVE_ODOO.md`

---

**Fin du document.**

