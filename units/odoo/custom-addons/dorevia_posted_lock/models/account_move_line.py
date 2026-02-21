# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import UserError
from odoo import _


class AccountMoveLine(models.Model):
    _inherit = 'account.move.line'

    # Constantes
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

    RECONCILIATION_FIELDS = {
        # Champs techniques modifiés par Odoo lors de la réconciliation
        # Ces champs DOIVENT être modifiables pour permettre la réconciliation normale
        'matched_debit_ids', 'matched_credit_ids',
        'amount_residual', 'amount_residual_currency',
        'full_reconcile_id', 'reconciled',
    }

    INVOICE_TYPES = {'out_invoice', 'in_invoice', 'out_refund', 'in_refund'}

    def _is_lock_enabled(self):
        """Vérifie si le verrouillage est activé via paramètre système"""
        return self.env['ir.config_parameter'].sudo().get_param(
            'dorevia_posted_lock.enabled', 'True'
        ).lower() == 'true'

    def _should_apply_lock(self, line):
        """Détermine si le verrouillage doit s'appliquer à cette ligne"""
        if not self._is_lock_enabled():
            return False
        
        # Vérifier le parent move
        if not line.move_id:
            return False
        
        move = line.move_id
        
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
        """Génère un message d'erreur contextuel"""
        return _(
            "Ligne de facture postée : modification interdite.\n"
            "Champs concernés : %s\n\n"
            "Pour corriger : créez un avoir ou une facture de correction."
        ) % ', '.join(sorted(fields_modified))

    def _get_unlink_error_message(self):
        """Génère un message d'erreur pour la suppression"""
        return _(
            "Ligne de facture postée : suppression interdite.\n\n"
            "Pour corriger : créez un avoir ou une facture de correction."
        )

    def write(self, vals):
        """Override write() pour bloquer les modifications de lignes de factures posted"""
        # Early exit si lock désactivé
        if not self._is_lock_enabled():
            return super().write(vals)
        
        # Early exit si bypass migration activé
        if self.env.context.get('skip_posted_lock'):
            return super().write(vals)
        
        # Early exit si pas de champs protégés modifiés
        real_fields = {k for k in vals.keys() if k in self._fields}
        if not (real_fields & (self.PROTECTED_LINE_FIELDS | self.RECONCILIATION_FIELDS)):
            return super().write(vals)
        
        # Vérifier chaque ligne
        for line in self:
            if not self._should_apply_lock(line):
                continue
            
            # Exclure les champs de réconciliation (whitelist)
            protected = (real_fields & self.PROTECTED_LINE_FIELDS) - self.RECONCILIATION_FIELDS
            if protected:
                raise UserError(self._get_lock_error_message(protected))
        
        return super().write(vals)

    def unlink(self):
        """Override unlink() pour bloquer la suppression de lignes de factures posted"""
        if not self._is_lock_enabled():
            return super().unlink()
        
        # Early exit si bypass migration activé
        if self.env.context.get('skip_posted_lock'):
            return super().unlink()
        
        # Vérifier chaque ligne
        for line in self:
            if self._should_apply_lock(line):
                raise UserError(self._get_unlink_error_message())
        
        return super().unlink()

