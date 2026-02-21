# -*- coding: utf-8 -*-

import json
import logging
from datetime import datetime, timezone
from odoo import http, SUPERUSER_ID
from odoo.http import request, Response
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)


class ConstatController(http.Controller):
    """Contrôleur pour la réception des constats mensuels depuis Dorevia Vault"""

    @http.route('/api/v1/constats', methods=['POST'], type='http', auth='public', csrf=False, cors='*')
    def receive_constat(self, **kwargs):
        """
        Endpoint pour recevoir un constat mensuel depuis Dorevia Vault
        
        Authentification : API Key (Bearer token)
        
        Payload JSON attendu :
        {
            "constat_id": "aB3dE5fG7h",  # 10 caractères alphanumériques
            "tenant": "tenant-code",
            "period": "2026-01",
            "generated_at": "2026-02-01T00:05:23Z",
            "vault_id": "vault-rozas",
            "volumes": {
                "out_invoice": 150,
                "in_invoice": 45,
                "out_refund": 3,
                "in_refund": 1
            },
            "compliance": {...},
            "proofs": {
                "jws": "...",
                "ledger_hash": "...",
                "documents_count": 199
            }
        }
        
        Returns:
            - 201 Created : Constat reçu et traité
            - 400 Bad Request : Payload invalide
            - 401 Unauthorized : Token invalide
            - 409 Conflict : Constat déjà reçu (idempotence)
            - 422 Unprocessable Entity : Validation échouée
            - 500 Internal Server Error : Erreur serveur
        """
        try:
            # Créer un environnement avec utilisateur système (car auth='none')
            env = request.env(user=SUPERUSER_ID)
            
            # Vérification de l'authentification API Key
            auth_header = request.httprequest.headers.get('Authorization', '')
            if not auth_header.startswith('api_key '):
                return self._http_error_response(401, 'unauthorized', 'Header Authorization manquant ou invalide (format attendu: api_key TOKEN)')
            
            provided_token = auth_header.replace('api_key ', '').strip()
            if not provided_token:
                return self._http_error_response(401, 'unauthorized', 'Token API manquant')
            
            # Récupérer le token configuré
            config_token = env['ir.config_parameter'].sudo().get_param('dorevia_billing.core_api_token', '')
            if not config_token:
                _logger.error('Token API non configuré dans dorevia_billing.core_api_token')
                return self._http_error_response(500, 'configuration_error', 'Token API non configuré côté serveur')
            
            # Vérifier le token
            if provided_token != config_token:
                _logger.warning('Token API invalide: fourni=%s', provided_token[:10] + '...' if len(provided_token) > 10 else provided_token)
                return self._http_error_response(401, 'unauthorized', 'Token API invalide')
            
            # Récupérer le payload JSON
            try:
                payload = json.loads(request.httprequest.data.decode('utf-8'))
            except (ValueError, AttributeError):
                return self._http_error_response(400, 'invalid_payload', 'Payload JSON manquant ou invalide')

            _logger.info('Réception constat: constat_id=%s, tenant=%s, period=%s',
                        payload.get('constat_id'), payload.get('tenant'), payload.get('period'))

            # Validation du payload
            validation_error = self._validate_payload(payload)
            if validation_error:
                return self._http_error_response(422, 'validation_failed', validation_error)

            # Vérification idempotence
            existing = env['dorevia.constat'].sudo().search([
                ('constat_id', '=', payload['constat_id'])
            ], limit=1)

            if existing:
                _logger.info('Constat déjà reçu (idempotence): constat_id=%s', payload['constat_id'])
                return self._http_success_response({
                    'status': 'duplicate',
                    'constat_id': existing.constat_id,
                    'tenant': existing.tenant_id.ref if existing.tenant_id else None,
                    'period': existing.period,
                    'processed_at': existing.received_at.isoformat() if existing.received_at else None,
                    'invoice_id': existing.invoice_id.id if existing.invoice_id else None,
                }, 409)

            # Trouver le tenant avant de créer le constat (tenant_id est required)
            tenant_code = payload.get('tenant')
            tenant = None
            if tenant_code:
                # Utiliser 'ref' au lieu de 'code' (ref est le champ standard Odoo pour identifiant externe)
                tenant = env['res.partner'].sudo().search([
                    ('ref', '=', tenant_code)
                ], limit=1)
                if not tenant:
                    _logger.warning('Tenant non trouvé: code=%s', tenant_code)
                    return self._http_error_response(422, 'tenant_not_found', f'Tenant non trouvé: {tenant_code}')
            
            # Créer le constat avec le tenant
            constat = self._create_constat(env, payload, tenant.id if tenant else None)

            # Rattachement contrat (US-3.4) - le tenant est déjà rattaché
            if tenant:
                self._attach_contract(env, constat, tenant.id, payload.get('period'))

            # Vérification JWS (non bloquante, US-3.7)
            self._verify_jws(env, constat, payload.get('proofs', {}).get('jws'))

            # Génération automatique de facture si contrat présent et state = validated
            if constat.contract_id and constat.state == 'validated' and constat.invoice_status == 'pending':
                try:
                    constat.action_generate_invoice()
                    _logger.info('Facture générée automatiquement: constat_id=%s, invoice_id=%s',
                                constat.constat_id, constat.invoice_id.id if constat.invoice_id else None)
                except Exception as e:
                    _logger.error('Erreur lors de la génération automatique de facture: %s', str(e), exc_info=True)
                    # Ne pas bloquer la réception du constat en cas d'erreur de facturation

            # Retourner la réponse
            return self._http_success_response({
                'status': 'received',
                'constat_id': constat.constat_id,
                'tenant': constat.tenant_id.ref if constat.tenant_id else None,
                'period': constat.period,
                'processed_at': constat.received_at.isoformat() if constat.received_at else None,
                'invoice_id': constat.invoice_id.id if constat.invoice_id else None,
            }, 201)

        except ValidationError as e:
            _logger.error('Erreur de validation: %s', str(e))
            return self._http_error_response(422, 'validation_failed', str(e))
        except Exception as e:
            _logger.error('Erreur lors de la réception du constat: %s', str(e), exc_info=True)
            return self._http_error_response(500, 'internal_error', 'Erreur serveur lors du traitement du constat')

    def _validate_payload(self, payload):
        """
        Valide le payload JSON
        
        Returns:
            str: Message d'erreur si invalide, None si valide
        """
        # Champs obligatoires
        required_fields = ['constat_id', 'tenant', 'period', 'generated_at', 'volumes', 'proofs']
        for field in required_fields:
            if field not in payload:
                return f'Champ obligatoire manquant: {field}'

        # Validation constat_id (10 caractères alphanumériques)
        import re
        if not isinstance(payload['constat_id'], str) or len(payload['constat_id']) != 10:
            return 'constat_id doit être une chaîne de 10 caractères alphanumériques'
        if not re.match(r'^[0-9a-zA-Z]{10}$', payload['constat_id']):
            return 'constat_id doit contenir uniquement des caractères alphanumériques (0-9, a-z, A-Z)'

        # Validation period (YYYY-MM)
        import re
        if not re.match(r'^\d{4}-\d{2}$', payload['period']):
            return 'period doit être au format YYYY-MM (ex: 2026-01)'

        # Validation generated_at (ISO 8601)
        try:
            datetime.fromisoformat(payload['generated_at'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return 'generated_at doit être au format ISO 8601 (ex: 2026-02-01T00:05:23Z)'

        # Validation volumes
        volumes = payload.get('volumes', {})
        if not isinstance(volumes, dict):
            return 'volumes doit être un objet'
        for vol_type in ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']:
            if vol_type not in volumes:
                return f'volumes.{vol_type} est obligatoire'
            if not isinstance(volumes[vol_type], int) or volumes[vol_type] < 0:
                return f'volumes.{vol_type} doit être un entier positif'

        # Validation proofs
        proofs = payload.get('proofs', {})
        if not isinstance(proofs, dict):
            return 'proofs doit être un objet'
        if 'jws' not in proofs:
            return 'proofs.jws est obligatoire'
        if 'documents_count' not in proofs:
            return 'proofs.documents_count est obligatoire'
        if not isinstance(proofs['documents_count'], int) or proofs['documents_count'] < 0:
            return 'proofs.documents_count doit être un entier positif'

        return None

    def _create_constat(self, env, payload, tenant_id=None):
        """Crée un enregistrement dorevia.constat à partir du payload"""
        volumes = payload.get('volumes', {})
        compliance = payload.get('compliance', {})
        proofs = payload.get('proofs', {})

        # Parse generated_at (Odoo attend un datetime "naive" sans timezone)
        generated_at_str = payload['generated_at'].replace('Z', '+00:00')
        generated_at_aware = datetime.fromisoformat(generated_at_str)
        # Convertir en UTC puis retirer le timezone pour obtenir un datetime "naive"
        if generated_at_aware.tzinfo:
            generated_at = generated_at_aware.astimezone(timezone.utc).replace(tzinfo=None)
        else:
            generated_at = generated_at_aware

        values = {
            'constat_id': payload['constat_id'],
            'period': payload['period'],
            'generated_at': generated_at,
            'received_at': datetime.now(),
            'vault_id': payload.get('vault_id'),
            'volumes_out_invoice': volumes.get('out_invoice', 0),
            'volumes_in_invoice': volumes.get('in_invoice', 0),
            'volumes_out_refund': volumes.get('out_refund', 0),
            'volumes_in_refund': volumes.get('in_refund', 0),
            'compliance_compliant': compliance.get('compliant', 0),
            'compliance_non_compliant_2026': compliance.get('non_compliant_2026', 0),
            'compliance_out_of_scope': compliance.get('out_of_scope', 0),
            'proofs_jws': proofs.get('jws'),
            'proofs_ledger_hash': proofs.get('ledger_hash'),
            'proofs_documents_count': proofs.get('documents_count', 0),
            'state': 'draft',
            'invoice_status': 'pending',
        }
        
        # Ajouter tenant_id si fourni (requis par le modèle)
        if tenant_id:
            values['tenant_id'] = tenant_id

        constat = env['dorevia.constat'].sudo().create(values)
        _logger.info('Constat créé: id=%s, constat_id=%s, tenant_id=%s', constat.id, constat.constat_id, constat.tenant_id.id if constat.tenant_id else None)

        return constat

    def _attach_contract(self, env, constat, tenant_id, period):
        """
        Rattache le constat à un contrat actif
        
        US-3.4 : Rattachement contrat (le tenant est déjà rattaché)
        """
        if not tenant_id:
            _logger.warning('Tenant ID manquant pour constat_id=%s', constat.constat_id)
            return

        # Recherche du contrat actif
        contract_model = env['dorevia.contract']
        contract = contract_model._get_active_contract(tenant_id, period)

        if contract:
            constat.contract_id = contract.id
            _logger.info('Contrat rattaché: constat_id=%s, contract_id=%s', constat.constat_id, contract.id)
            # Mettre à jour l'état si contrat trouvé
            if constat.state == 'draft':
                constat.state = 'validated'
        else:
            _logger.info('Aucun contrat actif trouvé: tenant_id=%s, period=%s', tenant_id, period)
            constat.contract_id = False
            constat.invoice_status = 'pending'
            # Note: Le constat n'est pas perdu et peut être facturé ultérieurement
            # Mettre à jour l'état même sans contrat (pour permettre facturation ultérieure)
            if constat.state == 'draft':
                constat.state = 'validated'

    def _verify_jws(self, env, constat, jws_token):
        """
        Vérifie la signature JWS du constat (non bloquant en v1)
        
        US-3.7 : Vérification JWS non bloquante
        
        Comportement v1 :
        - Si JWS invalide : stocker avec state = 'validated_with_warning', ne pas facturer automatiquement
        - Si JWS valide : state = 'validated' (déjà fait dans _attach_tenant_and_contract)
        - Si vérification désactivée : state = 'validated' (déjà fait)
        """
        if not jws_token:
            _logger.debug('JWS token manquant pour constat_id=%s', constat.constat_id)
            return

        # Vérifier si la vérification JWS est activée
        jws_enabled = env['ir.config_parameter'].sudo().get_param(
            'dorevia_billing.jws_verification_enabled', 'False'
        )
        if jws_enabled.lower() != 'true':
            _logger.debug('Vérification JWS désactivée pour constat_id=%s', constat.constat_id)
            return

        # Récupérer l'URL du JWKS
        jwks_url = env['ir.config_parameter'].sudo().get_param(
            'dorevia_billing.jwks_url', ''
        )
        if not jwks_url:
            _logger.warning('JWKS URL non configurée, impossible de vérifier JWS pour constat_id=%s', constat.constat_id)
            constat.state = 'validated_with_warning'
            return

        # Vérifier la signature JWS
        try:
            is_valid = self._verify_jws_signature(jws_token, jwks_url)
            if not is_valid:
                _logger.warning('JWS invalide pour constat_id=%s - Marqué validated_with_warning', constat.constat_id)
                constat.state = 'validated_with_warning'
                # Ne pas facturer automatiquement si JWS invalide
            else:
                _logger.info('JWS valide pour constat_id=%s', constat.constat_id)
                # state reste 'validated' (déjà fait dans _attach_tenant_and_contract)
        except Exception as e:
            _logger.error('Erreur lors de la vérification JWS pour constat_id=%s: %s', constat.constat_id, str(e), exc_info=True)
            # En cas d'erreur (réseau, etc.), marquer avec warning pour intervention manuelle
            constat.state = 'validated_with_warning'

    def _verify_jws_signature(self, jws_token, jwks_url):
        """
        Vérifie la signature JWS en récupérant les clés publiques depuis JWKS
        
        Utilise le helper centralisé utils.jws pour une gestion robuste.
        
        :param jws_token: Token JWS à vérifier
        :param jwks_url: URL du JWKS (JSON Web Key Set)
        :return: True si valide ou PyJWT non disponible, False si invalide
        """
        from ..utils import jws as jws_utils
        
        return jws_utils.verify_jws_with_jwks(jws_token, jwks_url)

    def _error_response(self, status_code, error_type, message):
        """Retourne une réponse d'erreur standardisée (pour type='json')"""
        return {
            'error': error_type,
            'details': message,
        }, status_code

    def _http_error_response(self, status_code, error_type, message):
        """Retourne une réponse d'erreur HTTP standardisée (pour type='http')"""
        return Response(
            json.dumps({
                'error': error_type,
                'details': message,
            }),
            status=status_code,
            mimetype='application/json'
        )

    def _http_success_response(self, data, status_code=200):
        """Retourne une réponse HTTP de succès (pour type='http')"""
        return Response(
            json.dumps(data),
            status=status_code,
            mimetype='application/json'
        )

