# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.tools.translate import _
import logging

_logger = logging.getLogger(__name__)


class PosPayment(models.Model):
    _inherit = 'pos.payment'
    
    # Champs Vault
    vault_id = fields.Char(string="Vault ID", readonly=True, help="Identifiant unique du document dans Dorevia Vault")
    vault_evidence_state = fields.Selection([
        ('sealed', 'Scellé'),
        ('pending', 'En attente'),
        ('processing', 'En cours'),
        ('error', 'Erreur'),
    ], string="État Vault", readonly=True, help="État de vaultérisation du paiement")
    vault_date = fields.Datetime(string="Date de scellement", readonly=True, help="Date à laquelle le paiement a été scellé dans Vault")
    vault_tenant = fields.Char(string="Tenant", readonly=True, help="Identifiant du tenant Vault")
    vault_proof_url = fields.Char(
        string="URL de Preuve",
        compute='_compute_vault_proof_url',
        store=False,
        readonly=True,
        help="URL pour accéder à la preuve cryptographique"
    )
    vault_hash_sha256 = fields.Char(string="Hash SHA-256", readonly=True, help="Hash SHA-256 du document")
    vault_ledger_hash = fields.Char(string="Ledger Hash", readonly=True, help="Hash dans le ledger Vault")
    vault_hash_prev = fields.Char(string="Hash précédent", readonly=True, help="Hash du document précédent dans la chaîne")
    vault_evidence_jws = fields.Text(string="JWS (Evidence)", readonly=True, help="Jeton JWS signé (preuve cryptographique)")
    vault_request_id = fields.Char(string="Request ID", readonly=True, help="Identifiant de la requête Vault")
    vault_last_error = fields.Text(string="Dernière erreur", readonly=True, help="Dernière erreur de vaultérisation")
    vault_attempts = fields.Integer(string="Tentatives", readonly=True, default=0, help="Nombre de tentatives de vaultérisation")
    
    # Computed fields
    show_vault_audit = fields.Boolean(
        string="Afficher l'audit technique",
        compute='_compute_show_vault_audit',
        store=False,
        help="Affiche la section audit technique si nécessaire (erreur ou > 1 tentative)"
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
                _logger.error("Failed to generate proof URL for payment %s: %s", record.id, str(e))
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

