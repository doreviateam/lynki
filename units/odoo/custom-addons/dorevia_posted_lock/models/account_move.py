# -*- coding: utf-8 -*-

from odoo import models, fields, api, Command
from odoo.exceptions import UserError
from odoo import _


class AccountMove(models.Model):
    _inherit = 'account.move'

    # Constantes
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
        # Totaux indirects (computed mais peuvent être modifiés via lignes)
        'amount_untaxed', 'amount_tax', 'amount_total', 'amount_residual',
    }

    RECONCILIATION_FIELDS = {
        # Champs techniques modifiés par Odoo lors de la réconciliation
        # Note: Ces champs sont sur account.move.line, pas directement sur account.move
        # Mais ils peuvent apparaître dans vals via line_ids
    }

    CHATTER_FIELDS = {
        # Chatter et pièces jointes (whitelist si allow_chatter=True)
        'message_follower_ids', 'message_ids', 'activity_ids', 'attachment_ids',
    }

    INVOICE_TYPES = {'out_invoice', 'in_invoice', 'out_refund', 'in_refund'}

    # Champ pour préparation v1.1 (verrouillage renforcé si vaulted)
    dorevia_vaulted = fields.Boolean(
        string='Vaulted',
        default=False,
        help='Indique si cette facture a été vaultée dans Dorevia Vault. '
             'Si True et posted, le verrouillage est renforcé (même chatter interdit).'
    )
    
    # Informations détaillées du vault
    dorevia_vault_id = fields.Char(
        string='Référence de preuve',
        readonly=True,
        help='Identifiant unique du document dans Dorevia Vault (UUID)'
    )
    dorevia_vault_sha256 = fields.Char(
        string='Empreinte numérique',
        readonly=True,
        help='Hash SHA256 du document vaulté (empreinte numérique)'
    )
    dorevia_vault_date = fields.Datetime(
        string='Date de sécurisation',
        readonly=True,
        help='Date et heure de sécurisation du document (scellement numérique)'
    )
    dorevia_vault_evidence_jws = fields.Text(
        string='Attestation technique (signature)',
        readonly=True,
        help='Preuve cryptographique JWS (réservé support / audit)'
    )
    dorevia_vault_ledger_hash = fields.Char(
        string='Journal de preuve',
        readonly=True,
        help='Hash dans le ledger (journal de preuve)'
    )

    def _is_lock_enabled(self):
        """Vérifie si le verrouillage est activé via paramètre système"""
        return self.env['ir.config_parameter'].sudo().get_param(
            'dorevia_posted_lock.enabled', 'True'
        ).lower() == 'true'

    def _is_chatter_allowed(self):
        """Vérifie si le chatter est autorisé via paramètre système"""
        return self.env['ir.config_parameter'].sudo().get_param(
            'dorevia_posted_lock.allow_chatter', 'True'
        ).lower() == 'true'

    def _is_draft_allowed(self):
        """Vérifie si button_draft() est autorisé via paramètre système"""
        return self.env['ir.config_parameter'].sudo().get_param(
            'dorevia_posted_lock.allow_draft', 'False'
        ).lower() == 'true'

    def _should_apply_lock(self, move):
        """Détermine si le verrouillage doit s'appliquer à ce move"""
        if not self._is_lock_enabled():
            return False
        
        # Vérifier si c'est une facture/avoir
        if move.move_type not in self.INVOICE_TYPES:
            # Vérifier si apply_to_entries est activé
            apply_to_entries = self.env['ir.config_parameter'].sudo().get_param(
                'dorevia_posted_lock.apply_to_entries', 'False'
            ).lower() == 'true'
            if not apply_to_entries or move.move_type != 'entry':
                return False
        
        # Vérifier si posted
        if move.state != 'posted':
            return False
        
        return True

    def _get_lock_error_message(self, fields_modified):
        """Génère un message d'erreur contextuel selon les champs modifiés"""
        if 'invoice_line_ids' in fields_modified or 'line_ids' in fields_modified:
            return _(
                "Facture postée : modification des lignes interdite.\n\n"
                "Pour corriger : créez un avoir ou une facture de correction."
            )
        elif 'partner_id' in fields_modified:
            return _(
                "Facture postée : modification du partenaire interdite.\n\n"
                "Pour corriger : créez un avoir et une nouvelle facture."
            )
        elif 'invoice_date' in fields_modified or 'date' in fields_modified:
            return _(
                "Facture postée : modification de la date interdite.\n\n"
                "Pour corriger : créez un avoir et une nouvelle facture."
            )
        else:
            return _(
                "Facture postée : modification interdite.\n"
                "Champs concernés : %s\n\n"
                "Utilisez une annulation / avoir (ou une écriture de correction) "
                "pour ajuster la comptabilité."
            ) % ', '.join(sorted(fields_modified))

    def _get_unlink_error_message(self):
        """Génère un message d'erreur pour la suppression"""
        return _(
            "Facture postée : suppression interdite.\n\n"
            "Pour corriger : créez un avoir ou une facture de correction."
        )

    def _check_one2many_commands(self, vals):
        """Détecte les Command.UPDATE et Command.DELETE sur invoice_line_ids et line_ids"""
        protected_commands = []
        
        for field_name in ['invoice_line_ids', 'line_ids']:
            if field_name not in vals:
                continue
            
            for cmd in vals[field_name]:
                if isinstance(cmd, (list, tuple)) and len(cmd) >= 2:
                    command_type = cmd[0]
                    # Command.UPDATE = 1, Command.DELETE = 2
                    if command_type in (Command.UPDATE, Command.DELETE):
                        protected_commands.append((field_name, command_type))
        
        return protected_commands

    def write(self, vals):
        """Override write() pour bloquer les modifications de factures posted"""
        # Early exit si lock désactivé
        if not self._is_lock_enabled():
            return super().write(vals)
        
        # Early exit si bypass migration activé
        if self.env.context.get('skip_posted_lock'):
            return super().write(vals)
        
        # Early exit si pas de champs protégés modifiés
        real_fields = {k for k in vals.keys() if k in self._fields}
        if not (real_fields & (self.PROTECTED_FIELDS | self.CHATTER_FIELDS)):
            return super().write(vals)
        
        # Vérifier chaque move
        for move in self:
            if not self._should_apply_lock(move):
                continue
            
            # Détecter les Command.UPDATE/DELETE sur One2many
            protected_commands = self._check_one2many_commands(vals)
            if protected_commands:
                raise UserError(_(
                    "Facture postée : modification des lignes interdite.\n\n"
                    "Pour corriger : créez un avoir ou une facture de correction."
                ))
            
            # Filtrer whitelist (chatter si activé)
            allowed_fields = set()
            # SPEC v1.1 : Utiliser dorevia_vault_status='vaulted' au lieu de dorevia_vaulted
            is_vaulted = move.dorevia_vault_status == 'vaulted' if hasattr(move, 'dorevia_vault_status') else move.dorevia_vaulted
            if self._is_chatter_allowed() and not is_vaulted:
                # Si vaulted, même chatter interdit (verrouillage renforcé)
                allowed_fields |= self.CHATTER_FIELDS
            
            # Vérifier champs protégés
            protected = (real_fields & self.PROTECTED_FIELDS) - allowed_fields
            if protected:
                raise UserError(self._get_lock_error_message(protected))
        
        return super().write(vals)

    def button_draft(self):
        """Override button_draft() pour bloquer le reset to draft"""
        if not self._is_lock_enabled():
            return super().button_draft()
        
        # Vérifier si allow_draft est activé
        if self._is_draft_allowed():
            return super().button_draft()
        
        # Vérifier chaque move
        for move in self:
            if self._should_apply_lock(move):
                raise UserError(_(
                    "Impossible de remettre en brouillon une facture postée.\n\n"
                    "Utilisez une annulation ou un avoir pour corriger."
                ))
        
        return super().button_draft()

    def unlink(self):
        """Override unlink() pour bloquer la suppression de factures posted"""
        if not self._is_lock_enabled():
            return super().unlink()
        
        # Early exit si bypass migration activé
        if self.env.context.get('skip_posted_lock'):
            return super().unlink()
        
        # Vérifier chaque move
        for move in self:
            if self._should_apply_lock(move):
                raise UserError(self._get_unlink_error_message())
        
        return super().unlink()

