# 🔌 Connecteur Odoo — SPEC 1 : Vaulting `account.move` `posted`

**Version** : 1.0  
**Date** : 2026-01-03  
**Spécification** : SPEC 1 — Vaulting `account.move` `posted` v1.1  
**Statut** : ✅ Documentation complète

---

## 📋 Vue d'Ensemble

Ce document décrit l'implémentation du connecteur Odoo pour vaultériser les objets `account.move` en état `posted` vers Dorevia Vault, conformément à la SPEC 1.

### Périmètre

- ✅ **Modèle** : `account.move`
- ✅ **État** : `posted` uniquement
- ✅ **Types** : `out_invoice`, `in_invoice`, `out_refund`, `in_refund`
- ❌ **Exclus** : `draft`, `cancel`, états intermédiaires
- ❌ **Exclus** : POS, tickets, Z-Reports (hors scope v1)

---

## 🎯 Déclencheur

### Méthode : `action_post()`

Le vaulting est déclenché automatiquement lors de la validation d'une facture (`action_post()`).

**Fichier** : Module Odoo personnalisé (ex: `dorevia_vault_connector`)

**Méthode** : Surcharger `action_post()` sur `account.move`

```python
from odoo import models, fields, api, _
import logging
import base64
import requests
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

class AccountMove(models.Model):
    _inherit = 'account.move'
    
    vault_id = fields.Char(string='Vault ID', readonly=True, copy=False)
    vault_sha256 = fields.Char(string='Vault SHA256', readonly=True, copy=False)
    vault_jws = fields.Text(string='Vault JWS', readonly=True, copy=False)
    vault_ledger_hash = fields.Char(string='Vault Ledger Hash', readonly=True, copy=False)
    vaulted_at = fields.Datetime(string='Vaulted At', readonly=True, copy=False)
    
    def action_post(self):
        """
        Surcharge action_post() pour vaultériser après validation
        """
        # Appeler la méthode parente d'abord
        result = super().action_post()
        
        # Vaultériser si conditions remplies
        for move in self:
            if self._should_vault(move):
                try:
                    self._vault_to_dorevia(move)
                except Exception as e:
                    _logger.error(f"Erreur lors du vaulting de {move.name}: {str(e)}")
                    # Ne pas bloquer la validation si vaulting échoue
                    # Optionnel : lever une exception pour bloquer
                    # raise UserError(_('Erreur lors du vaulting: %s') % str(e))
        
        return result
    
    def _should_vault(self, move):
        """
        Vérifie si le move doit être vaulté selon SPEC 1
        """
        # Vérifier le modèle
        if move._name != 'account.move':
            return False
        
        # Vérifier l'état (doit être 'posted' après action_post())
        if move.state != 'posted':
            return False
        
        # Vérifier le move_type
        allowed_move_types = ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']
        if move.move_type not in allowed_move_types:
            return False
        
        # Vérifier que le tenant est configuré
        tenant = self.env['ir.config_parameter'].sudo().get_param('dorevia_vault.tenant')
        if not tenant:
            _logger.warning("Tenant Dorevia Vault non configuré, vaulting ignoré")
            return False
        
        return True
```

---

## 📦 Construction du Payload

### Méthode : `_build_vault_payload()`

```python
def _build_vault_payload(self, move):
    """
    Construit le payload pour l'API Dorevia Vault selon SPEC 1
    """
    # Récupérer la configuration
    vault_url = self.env['ir.config_parameter'].sudo().get_param('dorevia_vault.url', 'https://vault.doreviateam.com')
    tenant = self.env['ir.config_parameter'].sudo().get_param('dorevia_vault.tenant')
    
    # Déterminer le source selon move_type
    source = 'sales' if move.move_type in ['out_invoice', 'out_refund'] else 'purchase'
    
    # Générer le PDF
    pdf_content = self._get_pdf_content(move)
    if not pdf_content:
        raise UserError(_('Impossible de générer le PDF pour la facture %s') % move.name)
    
    # Encoder en base64 (SANS préfixe)
    file_base64 = base64.b64encode(pdf_content).decode('utf-8')
    
    # Construire le payload
    payload = {
        'source': source,
        'model': 'account.move',
        'odoo_id': move.id,
        'state': 'posted',
        'file': file_base64,
        'meta': {
            'move_type': move.move_type,
            'tenant': tenant,
            'number': move.name or '',
            'invoice_date': move.invoice_date.isoformat() if move.invoice_date else None,
            'total_ht': float(move.amount_untaxed),
            'total_ttc': float(move.amount_total),
            'currency': move.currency_id.name if move.currency_id else 'EUR',
        }
    }
    
    # Ajouter seller_vat et buyer_vat si disponibles
    if move.company_id.vat:
        payload['meta']['seller_vat'] = move.company_id.vat
    
    if move.partner_id.vat:
        payload['meta']['buyer_vat'] = move.partner_id.vat
    
    # Ajouter correlation_id
    payload['meta']['correlation_id'] = f"account.move_{move.id}_{move.name}"
    
    return payload, vault_url

def _get_pdf_content(self, move):
    """
    Génère le PDF de la facture via le moteur de report Odoo
    """
    try:
        # Utiliser le report standard Odoo
        report = self.env.ref('account.account_invoices')
        pdf_content, _ = report._render_qweb_pdf(move.ids)
        return pdf_content
    except Exception as e:
        _logger.error(f"Erreur lors de la génération du PDF: {str(e)}")
        return None
```

---

## 🚀 Envoi vers Vault

### Méthode : `_vault_to_dorevia()`

```python
def _vault_to_dorevia(self, move):
    """
    Envoie le move vers Dorevia Vault
    """
    # Construire le payload
    payload, vault_url = self._build_vault_payload(move)
    
    # Récupérer le token
    vault_token = self.env['ir.config_parameter'].sudo().get_param('dorevia_vault.token')
    if not vault_token:
        raise UserError(_('Token Dorevia Vault non configuré'))
    
    # Headers
    headers = {
        'Authorization': f'Bearer {vault_token}',
        'Content-Type': 'application/json'
    }
    
    # URL de l'endpoint
    url = f'{vault_url}/api/v1/invoices'
    
    # Envoyer la requête
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Parser la réponse
        result = response.json()
        
        # Stocker les informations dans Odoo
        move.write({
            'vault_id': result['id'],
            'vault_sha256': result['sha256_hex'],
            'vault_jws': result.get('evidence_jws'),
            'vault_ledger_hash': result.get('ledger_hash'),
            'vaulted_at': fields.Datetime.now()
        })
        
        _logger.info(f"Facture {move.name} vaultérisée avec succès (ID: {result['id']})")
        
        return result
        
    except requests.exceptions.HTTPError as e:
        error_msg = f"Erreur HTTP {e.response.status_code}"
        if e.response.status_code == 400:
            # Erreur de validation
            error_data = e.response.json()
            error_msg = f"Erreur de validation: {error_data.get('error', 'Unknown error')}"
            _logger.error(f"Erreur de validation pour {move.name}: {error_msg}")
            raise UserError(_('Erreur de validation Vault: %s') % error_msg)
        elif e.response.status_code == 401:
            error_msg = "Token invalide ou expiré"
            _logger.error(f"Erreur d'authentification: {error_msg}")
            raise UserError(_('Erreur d\'authentification Vault: %s') % error_msg)
        else:
            _logger.error(f"Erreur HTTP {e.response.status_code}: {e.response.text}")
            raise UserError(_('Erreur Vault (%s): %s') % (e.response.status_code, error_msg))
            
    except requests.exceptions.RequestException as e:
        error_msg = f"Erreur de connexion: {str(e)}"
        _logger.error(f"Erreur de connexion pour {move.name}: {error_msg}")
        raise UserError(_('Erreur de connexion Vault: %s') % error_msg)
```

---

## ⚙️ Configuration

### Paramètres `ir.config_parameter`

Les paramètres suivants doivent être configurés dans Odoo :

| Clé | Description | Exemple | Obligatoire |
|-----|-------------|---------|-------------|
| `dorevia_vault.url` | URL de l'API Vault | `https://vault.doreviateam.com` | ✅ Oui |
| `dorevia_vault.token` | Token JWT ou API Key | `eyJhbGciOiJSUzI1NiIs...` | ✅ Oui |
| `dorevia_vault.tenant` | Identifiant du tenant | `laplatine` | ✅ Oui |

### Configuration via Interface Odoo

**Menu** : Paramètres → Technique → Paramètres → Paramètres Système

**Ajout des paramètres** :

1. **URL Vault** :
   - Clé : `dorevia_vault.url`
   - Valeur : `https://vault.doreviateam.com`
   - Type : Texte

2. **Token Vault** :
   - Clé : `dorevia_vault.token`
   - Valeur : `<token_jwt_ou_api_key>`
   - Type : Texte (sensible)

3. **Tenant** :
   - Clé : `dorevia_vault.tenant`
   - Valeur : `<identifiant_tenant>`
   - Type : Texte

### Configuration via Fichier `odoo.conf`

```ini
[dorevia_vault]
url = https://vault.doreviateam.com
token = eyJhbGciOiJSUzI1NiIs...
tenant = laplatine
```

**Note** : Les paramètres `ir.config_parameter` ont priorité sur `odoo.conf`.

---

## 🔄 Gestion des Erreurs

### Erreurs Permanentes (400, 401, 403)

Ces erreurs indiquent un problème de configuration ou de payload. **Ne pas retry**.

**Exemples** :
- `400 Bad Request` : Payload invalide (validation SPEC 1 échouée)
- `401 Unauthorized` : Token invalide ou expiré
- `403 Forbidden` : Permissions insuffiantes

**Action** : Corriger la configuration ou le payload, puis réessayer manuellement.

### Erreurs Temporaires (429, 500, 502, 503, 504)

Ces erreurs peuvent être temporaires. **Retry avec backoff exponentiel**.

**Stratégie de retry recommandée** :
- Tentative 1 : Immédiate
- Tentative 2 : Après 1 seconde
- Tentative 3 : Après 2 secondes
- Tentative 4 : Après 4 secondes
- Tentative 5 : Après 8 secondes
- Maximum : 5 tentatives

**Implémentation** :

```python
import time

def _vault_to_dorevia_with_retry(self, move, max_retries=5):
    """
    Envoie le move vers Vault avec retry automatique
    """
    for attempt in range(max_retries):
        try:
            return self._vault_to_dorevia(move)
        except requests.exceptions.HTTPError as e:
            # Erreurs permanentes : ne pas retry
            if e.response.status_code in [400, 401, 403]:
                raise
            
            # Erreurs temporaires : retry
            if e.response.status_code in [429, 500, 502, 503, 504]:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Backoff exponentiel
                    _logger.warning(f"Erreur temporaire {e.response.status_code}, retry dans {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    raise UserError(_('Erreur Vault après %d tentatives') % max_retries)
            else:
                raise
        except requests.exceptions.RequestException as e:
            # Erreurs de connexion : retry
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                _logger.warning(f"Erreur de connexion, retry dans {wait_time}s...")
                time.sleep(wait_time)
                continue
            else:
                raise UserError(_('Erreur de connexion Vault après %d tentatives') % max_retries)
```

---

## 📊 Idempotence

### Gestion du 200 OK

Si un document avec le même `(tenant, sha256)` existe déjà, Vault retourne **200 OK** au lieu de 201 Created.

**Comportement recommandé** :
- ✅ Traiter comme un succès
- ✅ Mettre à jour les champs `vault_id`, `vault_sha256`, etc. avec les valeurs retournées
- ✅ Ne pas lever d'erreur

**Exemple** :

```python
response = requests.post(url, json=payload, headers=headers, timeout=30)
response.raise_for_status()  # Ne lève pas d'exception pour 200 OK

result = response.json()

# Mettre à jour même si 200 OK (idempotence)
move.write({
    'vault_id': result['id'],
    'vault_sha256': result['sha256_hex'],
    'vault_jws': result.get('evidence_jws'),
    'vault_ledger_hash': result.get('ledger_hash'),
    'vaulted_at': fields.Datetime.now()
})

if response.status_code == 200:
    _logger.info(f"Facture {move.name} déjà vaultérisée (idempotence)")
else:
    _logger.info(f"Facture {move.name} vaultérisée avec succès")
```

---

## 🧪 Tests

### Test Manuel

1. **Créer une facture** dans Odoo
2. **Configurer les paramètres** Vault
3. **Valider la facture** (`action_post()`)
4. **Vérifier les champs** `vault_id`, `vault_sha256`, etc.

### Test Automatisé

```python
def test_vault_invoice(self):
    """
    Test unitaire pour le vaulting
    """
    # Créer une facture de test
    invoice = self.env['account.move'].create({
        'move_type': 'out_invoice',
        'partner_id': self.partner.id,
        'invoice_date': fields.Date.today(),
        'invoice_line_ids': [(0, 0, {
            'product_id': self.product.id,
            'quantity': 1,
            'price_unit': 100.0,
        })],
    })
    
    # Configurer les paramètres
    self.env['ir.config_parameter'].sudo().set_param('dorevia_vault.url', 'https://vault-test.doreviateam.com')
    self.env['ir.config_parameter'].sudo().set_param('dorevia_vault.token', 'test_token')
    self.env['ir.config_parameter'].sudo().set_param('dorevia_vault.tenant', 'test-tenant')
    
    # Valider la facture
    invoice.action_post()
    
    # Vérifier que les champs sont remplis
    self.assertTrue(invoice.vault_id, "vault_id doit être rempli")
    self.assertTrue(invoice.vault_sha256, "vault_sha256 doit être rempli")
```

---

## 📝 Checklist d'Implémentation

- [ ] Créer le module Odoo `dorevia_vault_connector`
- [ ] Ajouter les champs `vault_id`, `vault_sha256`, `vault_jws`, `vault_ledger_hash`, `vaulted_at` sur `account.move`
- [ ] Surcharger `action_post()` pour déclencher le vaulting
- [ ] Implémenter `_should_vault()` pour vérifier les conditions SPEC 1
- [ ] Implémenter `_build_vault_payload()` pour construire le payload
- [ ] Implémenter `_get_pdf_content()` pour générer le PDF
- [ ] Implémenter `_vault_to_dorevia()` pour envoyer vers Vault
- [ ] Implémenter la gestion d'erreurs (permanentes vs temporaires)
- [ ] Implémenter le retry avec backoff exponentiel
- [ ] Gérer l'idempotence (200 OK)
- [ ] Configurer les paramètres `ir.config_parameter`
- [ ] Tester avec factures valides (out_invoice, in_invoice, out_refund, in_refund)
- [ ] Tester avec factures invalides (draft, cancel)
- [ ] Tester la gestion d'erreurs (400, 401, 500, etc.)
- [ ] Tester l'idempotence (envoi double)

---

## 🔗 Références

- **SPEC 1** : `/opt/dorevia-plateform/ZeDocs/V2/SPEC1_VAULTING_ACCOUNT_MOVE_POSTED_v1.0.md`
- **Documentation API** : `/opt/dorevia-plateform/sources/vault/docs/REPONSES_INTEGRATION_API.md`
- **Endpoint** : `POST /api/v1/invoices`

---

**Dernière mise à jour** : 2026-01-03  
**Version** : 1.0

