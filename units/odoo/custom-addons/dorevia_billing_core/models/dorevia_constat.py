# -*- coding: utf-8 -*-

from odoo import models, fields, api, Command, tools
from odoo.exceptions import ValidationError
import re


class DoreviaConstat(models.Model):
    _name = 'dorevia.constat'
    _description = 'Constat mensuel reçu du Vault'
    _order = 'received_at desc, period desc'
    _sql_constraints = [
        ('constat_id_unique', 'UNIQUE(constat_id)', 'Un constat avec le même constat_id existe déjà'),
        ('tenant_period_unique', 'UNIQUE(tenant_id, period)', 'Un constat existe déjà pour ce tenant et cette période'),
        ('period_format_check', "CHECK(period ~ '^[0-9]{4}-[0-9]{2}$')", 'Le format de période doit être YYYY-MM'),
    ]

    # Champs de base
    constat_id = fields.Char(string='ID Constat', required=True, index=True, size=10, help='ID du constat généré par le Vault (10 caractères alphanumériques)')
    tenant_id = fields.Many2one('res.partner', string='Tenant', required=True, index=True, ondelete='cascade',
                                help='Partenaire tenant (identifié par le champ code)')
    period = fields.Char(string='Période', required=True, size=7, index=True,
                         help='Période au format YYYY-MM (ex: 2026-01)')
    generated_at = fields.Datetime(string='Généré le', required=True,
                                  help='Date/heure de génération par le Vault (UTC)')
    received_at = fields.Datetime(string='Reçu le', required=True, default=fields.Datetime.now,
                                   help='Date/heure de réception par Odoo CORE (UTC)')
    vault_id = fields.Char(string='Vault ID', help='Identifiant du Vault source')

    # Volumes
    volumes_out_invoice = fields.Integer(string='Factures clients', default=0,
                                         help='Nombre de factures clients (out_invoice)')
    volumes_in_invoice = fields.Integer(string='Factures fournisseurs', default=0,
                                        help='Nombre de factures fournisseurs (in_invoice) - Usage plateforme')
    volumes_out_refund = fields.Integer(string='Avoirs clients', default=0,
                                        help='Nombre d\'avoirs clients (out_refund)')
    volumes_in_refund = fields.Integer(string='Avoirs fournisseurs', default=0,
                                       help='Nombre d\'avoirs fournisseurs (in_refund) - Usage plateforme')

    # Conformité Factur-X
    compliance_compliant = fields.Integer(string='Conformes Factur-X', default=0,
                                          help='Nombre de documents conformes Factur-X 2026')
    compliance_non_compliant_2026 = fields.Integer(string='Non conformes Factur-X 2026', default=0,
                                                    help='Nombre de documents non conformes Factur-X 2026')
    compliance_out_of_scope = fields.Integer(string='Hors périmètre Factur-X', default=0,
                                              help='Nombre de documents hors périmètre Factur-X')

    # Preuves cryptographiques
    proofs_jws = fields.Text(string='Preuve JWS', help='Signature JWS du constat (stockage pour audit)')
    proofs_ledger_hash = fields.Char(string='Ledger Hash', size=255,
                                      help='Hash du ledger (si disponible)')
    proofs_documents_count = fields.Integer(string='Nombre de documents', default=0,
                                            help='Nombre total de documents agrégés')

    # Rattachement et facturation
    contract_id = fields.Many2one('dorevia.contract', string='Contrat', ondelete='set null',
                                  help='Contrat actif au moment de la réception')
    invoice_id = fields.Many2one('account.move', string='Facture', readonly=True,
                                 help='Facture générée (si facturé)')
    invoice_status = fields.Selection([
        ('pending', 'En attente'),
        ('invoiced', 'Facturé'),
        ('cancelled', 'Annulé'),
    ], string='Statut facturation', default='pending', required=True, index=True,
        help='Statut de facturation du constat')
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('validated', 'Validé'),
        ('validated_with_warning', 'Validé avec avertissement'),
        ('invoiced', 'Facturé'),
        ('cancelled', 'Annulé'),
    ], string='État', default='draft', required=True, index=True,
        help='État du constat')

    # Champs calculés
    total_volumes = fields.Integer(string='Total volumes', compute='_compute_total_volumes', store=True,
                                   help='Total des volumes (tous types confondus)')
    total_compliance = fields.Integer(string='Total conformité', compute='_compute_total_compliance', store=True,
                                      help='Total des documents avec statut de conformité')

    @api.depends('volumes_out_invoice', 'volumes_in_invoice', 'volumes_out_refund', 'volumes_in_refund')
    def _compute_total_volumes(self):
        for record in self:
            record.total_volumes = (
                record.volumes_out_invoice +
                record.volumes_in_invoice +
                record.volumes_out_refund +
                record.volumes_in_refund
            )

    @api.depends('compliance_compliant', 'compliance_non_compliant_2026', 'compliance_out_of_scope')
    def _compute_total_compliance(self):
        for record in self:
            record.total_compliance = (
                record.compliance_compliant +
                record.compliance_non_compliant_2026 +
                record.compliance_out_of_scope
            )

    @api.constrains('period')
    def _check_period_format(self):
        for record in self:
            if not re.match(r'^\d{4}-\d{2}$', record.period):
                raise ValidationError('Le format de période doit être YYYY-MM (ex: 2026-01)')

    @api.constrains('volumes_out_invoice', 'volumes_in_invoice', 'volumes_out_refund', 'volumes_in_refund')
    def _check_volumes_non_negative(self):
        for record in self:
            if (record.volumes_out_invoice < 0 or
                record.volumes_in_invoice < 0 or
                record.volumes_out_refund < 0 or
                record.volumes_in_refund < 0):
                raise ValidationError('Les volumes ne peuvent pas être négatifs')

    def _compute_amounts(self):
        """
        Calcule les montants facturables en appliquant les règles tarifaires
        
        US-3.5 : Calcul des montants avec règles tarifaires
        
        Returns:
            dict: {
                'out_invoice': {'ht': float, 'ttc': float},
                'in_invoice': {'ht': float, 'ttc': float},
                'out_refund': {'ht': float, 'ttc': float},
                'in_refund': {'ht': float, 'ttc': float},
                'total_ht': float,
                'total_ttc': float,
            }
        """
        if not self.contract_id:
            return {
                'out_invoice': {'ht': 0.0, 'ttc': 0.0},
                'in_invoice': {'ht': 0.0, 'ttc': 0.0},
                'out_refund': {'ht': 0.0, 'ttc': 0.0},
                'in_refund': {'ht': 0.0, 'ttc': 0.0},
                'total_ht': 0.0,
                'total_ttc': 0.0,
            }

        amounts = {}
        total_ht = 0.0

        # Calcul pour chaque move_type
        for move_type in ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']:
            volume = getattr(self, f'volumes_{move_type}', 0)
            if volume == 0:
                amounts[move_type] = {'ht': 0.0, 'ttc': 0.0}
                continue

            # Récupérer les règles tarifaires pour ce move_type
            rules = self._get_pricing_rules(move_type)
            if not rules:
                amounts[move_type] = {'ht': 0.0, 'ttc': 0.0}
                continue

            # Calculer le montant HT avec paliers et remises
            amount_ht = self._apply_tier_pricing(volume, rules)
            amounts[move_type] = {'ht': amount_ht, 'ttc': 0.0}
            total_ht += amount_ht

        # Application TVA globale
        tax_rate = self.contract_id.tax_rate if not self.contract_id.tax_exempt else 0.0
        total_ttc = self._apply_tax(total_ht, tax_rate, self.contract_id.tax_exempt)

        # Calcul TTC par move_type (proportionnel)
        for move_type in amounts:
            if total_ht > 0:
                proportion = amounts[move_type]['ht'] / total_ht
                amounts[move_type]['ttc'] = amounts[move_type]['ht'] * (1 + tax_rate / 100.0)
            else:
                amounts[move_type]['ttc'] = 0.0

        amounts['total_ht'] = total_ht
        amounts['total_ttc'] = total_ttc

        return amounts

    def _get_pricing_rules(self, move_type):
        """
        Récupère les règles tarifaires actives pour un move_type donné
        
        :param move_type: Type de document (out_invoice, in_invoice, etc.)
        :return: Recordset des règles triées par sequence
        """
        if not self.contract_id:
            return self.env['dorevia.pricing.rule']

        return self.contract_id.pricing_rule_ids.filtered(
            lambda r: r.move_type == move_type and r.active
        ).sorted('sequence')

    def _apply_tier_pricing(self, volume, rules):
        """
        Applique les règles tarifaires pour un volume donné.
        
        Chaque règle calcule : montant_fixe + calcul_par_paliers(volume_dans_le_palier)
        Les montants de toutes les règles sont additionnés.
        
        Exemple avec volume=150 et une règle :
        - Règle : fixed_amount=80€, tier_from=0, tier_to=1000, price_unit=0.10€
        - Calcul : 80€ (fixe) + (150 × 0.10€) = 80€ + 15€ = 95€
        
        :param volume: Volume total à facturer
        :param rules: Recordset des règles tarifaires (triées par sequence)
        :return: Montant HT calculé
        """
        if volume <= 0 or not rules:
            return 0.0

        total_amount = 0.0
        volume_processed = 0  # Volume déjà traité pour les paliers
        fixed_amount_applied = False  # Flag pour n'appliquer le montant fixe qu'une seule fois
        
        # Appliquer chaque règle dans l'ordre de séquence
        for rule in rules:
            rule_amount = 0.0
            
            tier_start = rule.tier_from
            tier_end = rule.tier_to if rule.tier_to is not None else float('inf')
            
            # Vérifier si cette règle s'applique au volume restant
            if volume_processed < volume and volume >= tier_start:
                # Cette règle s'applique
                
                # Ajouter le montant fixe UNE SEULE FOIS (première règle qui a un montant fixe)
                if not fixed_amount_applied and rule.fixed_amount > 0:
                    rule_amount += self._apply_discount(rule.fixed_amount, rule.discount_percent)
                    fixed_amount_applied = True
                
                # Calculer la part variable selon les paliers
                effective_start = max(tier_start, volume_processed)
                effective_end = min(volume, tier_end) if tier_end != float('inf') else volume
                
                volume_in_tier = effective_end - effective_start
                if volume_in_tier > 0:
                    # Calcul montant variable pour ce palier
                    variable_amount = volume_in_tier * rule.price_unit
                    rule_amount += self._apply_discount(variable_amount, rule.discount_percent)
                    volume_processed = effective_end
            
            total_amount += rule_amount

        return total_amount
    
    def _apply_tier_pricing_detailed(self, volume, rules):
        """
        Applique les règles tarifaires et retourne le montant fixe et variable séparément.
        
        :param volume: Volume total à facturer
        :param rules: Recordset des règles tarifaires (triées par sequence)
        :return: dict avec 'fixed' et 'variable' (montants HT)
        """
        if volume <= 0 or not rules:
            return {'fixed': 0.0, 'variable': 0.0}

        fixed_amount = 0.0
        variable_amount = 0.0
        volume_processed = 0
        fixed_amount_applied = False
        
        for rule in rules:
            tier_start = rule.tier_from
            tier_end = rule.tier_to if rule.tier_to is not None else float('inf')
            
            if volume_processed < volume and volume >= tier_start:
                # Montant fixe (une seule fois)
                if not fixed_amount_applied and rule.fixed_amount > 0:
                    fixed_amount += self._apply_discount(rule.fixed_amount, rule.discount_percent)
                    fixed_amount_applied = True
                
                # Montant variable
                effective_start = max(tier_start, volume_processed)
                effective_end = min(volume, tier_end) if tier_end != float('inf') else volume
                
                volume_in_tier = effective_end - effective_start
                if volume_in_tier > 0:
                    variable_amount += self._apply_discount(volume_in_tier * rule.price_unit, rule.discount_percent)
                    volume_processed = effective_end

        return {'fixed': fixed_amount, 'variable': variable_amount}

    def _apply_discount(self, amount, discount_percent):
        """
        Applique une remise en pourcentage
        
        :param amount: Montant initial
        :param discount_percent: Remise en pourcentage (0-100)
        :return: Montant après remise
        """
        return amount * (1 - discount_percent / 100.0)

    def _apply_tax(self, amount_ht, tax_rate, tax_exempt):
        """
        Applique la TVA
        
        :param amount_ht: Montant hors taxes
        :param tax_rate: Taux de TVA en pourcentage
        :param tax_exempt: Si True, TVA = 0
        :return: Montant TTC
        """
        if tax_exempt:
            return amount_ht
        return amount_ht * (1 + tax_rate / 100.0)

    def action_generate_invoice(self):
        """
        Génère une facture MRR à partir du constat
        
        US-3.6 : Génération de factures MRR
        
        Returns:
            account.move: Facture créée
        """
        self.ensure_one()

        # Vérifications préalables
        if self.state != 'validated' and self.state != 'validated_with_warning':
            raise ValidationError('Le constat doit être validé avant de générer une facture')
        
        if not self.contract_id:
            raise ValidationError('Aucun contrat actif pour ce constat. Impossible de générer la facture.')
        
        if self.invoice_status != 'pending':
            raise ValidationError(f'Le constat a déjà été traité (statut: {self.invoice_status})')

        # Calcul des montants
        amounts = self._compute_amounts()
        
        if amounts['total_ht'] <= 0:
            raise ValidationError('Aucun montant à facturer (total HT = 0)')

        # Préparer les lignes de facturation
        move_type_labels = {
            'out_invoice': 'Factures clients',
            'in_invoice': 'Factures fournisseurs (usage plateforme)',
            'out_refund': 'Avoirs clients',
            'in_refund': 'Avoirs fournisseurs (usage plateforme)',
        }

        # Récupérer le produit MRR
        product = self._get_mrr_product()
        
        # Récupérer la taxe TVA si applicable
        tax_ids = []
        if not self.contract_id.tax_exempt:
            tax = self._get_tax(self.contract_id.tax_rate)
            if tax:
                tax_ids = [Command.set([tax.id])]

        # Construire les lignes de facturation
        # On crée deux lignes : une pour le montant fixe, une pour le montant variable
        # Cela garantit que le montant total soit exactement celui calculé
        invoice_line_ids = []
        for move_type in ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']:
            amount_ht = amounts[move_type]['ht']
            if amount_ht <= 0:
                continue

            volume = getattr(self, f'volumes_{move_type}', 0)
            if volume <= 0:
                continue
            
            # Récupérer les règles pour séparer fixe et variable
            rules = self._get_pricing_rules(move_type)
            detailed = self._apply_tier_pricing_detailed(volume, rules)
            
            fixed_amount = detailed['fixed']
            variable_amount = detailed['variable']
            
            # Ligne 1 : Montant fixe (si > 0)
            if fixed_amount > 0:
                invoice_line_ids.append(Command.create({
                    'product_id': product.id if product else False,
                    'name': f"{move_type_labels[move_type]} - Période {self.period} - Montant fixe",
                    'quantity': 1,
                    'price_unit': fixed_amount,  # Prix unitaire = montant fixe exact
                    'tax_ids': tax_ids,
                }))
            
            # Ligne 2 : Montant variable (si > 0)
            if variable_amount > 0:
                # Calculer le prix unitaire variable pour obtenir exactement variable_amount
                price_unit_variable = variable_amount / volume if volume > 0 else 0.0
                # Utiliser la précision de la devise de la société
                currency = self.env.company.currency_id
                precision = currency.decimal_places if currency else 2
                price_unit_variable = tools.float_round(price_unit_variable, precision_digits=precision + 2)
                price_unit_variable = tools.float_round(price_unit_variable, precision_digits=precision)
                
                invoice_line_ids.append(Command.create({
                    'product_id': product.id if product else False,
                    'name': f"{move_type_labels[move_type]} - Période {self.period} - Part variable ({volume} documents)",
                    'quantity': volume,
                    'price_unit': price_unit_variable,
                    'tax_ids': tax_ids,
                }))

        # Créer la facture avec les lignes
        invoice_vals = {
            'move_type': 'out_invoice',
            'partner_id': self.tenant_id.id,
            'invoice_date': self.received_at.date() if self.received_at else fields.Date.today(),
            'ref': self.constat_id,  # Référence constat
            'invoice_origin': f'Constat {self.period} - Vault {self.vault_id or "N/A"}',
            'invoice_line_ids': invoice_line_ids,
        }

        # Créer la facture
        invoice = self.env['account.move'].create(invoice_vals)

        # Rattacher la facture au constat
        self.write({
            'invoice_id': invoice.id,
            'invoice_status': 'invoiced',
            'state': 'invoiced',
        })

        # Validation automatique si configuré
        auto_post = self.env['ir.config_parameter'].sudo().get_param(
            'dorevia_billing.auto_post_invoice', 'False'
        )
        if auto_post.lower() == 'true':
            invoice.action_post()

        return invoice

    def _get_mrr_product(self):
        """
        Récupère ou crée le produit MRR pour la facturation
        
        :return: product.product record
        """
        # Rechercher un produit existant avec référence "MRR"
        product = self.env['product.product'].search([
            ('default_code', '=', 'MRR')
        ], limit=1)

        if not product:
            # Créer le produit MRR si inexistant
            product = self.env['product.product'].create({
                'name': 'Service MRR - Conservation probante',
                'default_code': 'MRR',
                'type': 'service',
                'sale_ok': True,
                'purchase_ok': False,
                'description': 'Service de conservation probante et conformité Factur-X',
            })

        return product

    def _get_tax(self, tax_rate):
        """
        Récupère ou crée la taxe TVA avec le taux spécifié
        
        :param tax_rate: Taux de TVA en pourcentage (ex: 20.0 pour 20%)
        :return: account.tax record
        """
        if tax_rate <= 0:
            return False

        # Rechercher une taxe existante avec ce taux
        tax = self.env['account.tax'].search([
            ('type_tax_use', '=', 'sale'),
            ('amount', '=', tax_rate),
        ], limit=1)

        if not tax:
            # Créer la taxe si inexistante
            tax = self.env['account.tax'].create({
                'name': f'TVA {tax_rate}%',
                'type_tax_use': 'sale',
                'amount': tax_rate,
                'amount_type': 'percent',
            })

        return tax
