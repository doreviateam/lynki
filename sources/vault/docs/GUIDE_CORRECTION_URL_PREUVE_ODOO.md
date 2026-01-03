# 🔧 Guide Pratique — Correction URL de Preuve dans Odoo

**Date** : 2025-12-13  
**Problème** : Erreur 500 lors du clic sur "Ouvrir la preuve"  
**Solution** : Corriger la génération de l'URL de preuve

---

## 🎯 Problème Identifié

### Symptôme

Lorsque l'utilisateur clique sur le bouton "Ouvrir la preuve" dans Odoo, une erreur HTTP 500 est retournée.

### Cause

L'URL générée est incorrecte :
```
❌ https://vault.doreviateam.com/api/v1/push_document/verify/eyJhbGciOiJSUzI1NiIs...
```

Cette URL n'existe pas dans l'API Vault. L'endpoint correct est :
```
✅ https://vault.doreviateam.com/api/v1/ledger/verify/88d73c8a-efd2-481c-9ede-8196e30705a1
```

---

## 🔍 Étape 1 : Identifier Où l'URL est Générée

### Recherche dans le Code Odoo

Cherchez les fichiers suivants dans votre module Odoo :

1. **Modèle Python** (ex: `models/account_move.py`, `models/pos_order.py`, etc.)
   - Cherchez : `vault_proof_url`, `proof_url`, `evidence_jws`
   - Cherchez : `@api.depends`, `@api.model`, méthodes qui génèrent l'URL

2. **Vue XML** (ex: `views/account_move_vault_views.xml`)
   - Cherchez : `<field name="vault_proof_url">`
   - Cherchez : `<button name="action_open_proof">`

### Exemple de Code Problématique

```python
# ❌ CODE INCORRECT (à corriger)
@api.depends('vault_evidence_jws')
def _compute_vault_proof_url(self):
    for record in self:
        if record.vault_evidence_jws:
            vault_url = self.env['ir.config_parameter'].sudo().get_param(
                'dorevia.vault.url', 
                'https://vault.doreviateam.com'
            )
            # ❌ PROBLÈME : Utilise le JWT directement dans l'URL
            record.vault_proof_url = f"{vault_url}/api/v1/push_document/verify/{record.vault_evidence_jws}"
        else:
            record.vault_proof_url = False
```

---

## ✅ Étape 2 : Corriger la Génération de l'URL

### Solution : Extraire le `document_id` du JWT

Le JWT (`evidence_jws`) contient un champ `document_id` qu'il faut extraire pour construire l'URL correcte.

### Code Python Corrigé

```python
import jwt
import logging

_logger = logging.getLogger(__name__)

@api.depends('vault_evidence_jws')
def _compute_vault_proof_url(self):
    """
    Génère l'URL de preuve à partir du JWT (evidence_jws).
    
    Extrait le document_id du JWT et construit l'URL :
    https://vault.doreviateam.com/api/v1/ledger/verify/{document_id}
    """
    for record in self:
        if not record.vault_evidence_jws:
            record.vault_proof_url = False
            continue
        
        try:
            # Décoder le JWT sans vérifier la signature
            # On veut juste extraire le document_id
            decoded = jwt.decode(
                record.vault_evidence_jws,
                options={"verify_signature": False}  # Important : pas de vérification
            )
            
            # Extraire le document_id
            document_id = decoded.get("document_id")
            
            if not document_id:
                _logger.warning(
                    "JWT does not contain document_id: %s",
                    record.id
                )
                record.vault_proof_url = False
                continue
            
            # Construire l'URL correcte
            vault_url = self.env['ir.config_parameter'].sudo().get_param(
                'dorevia.vault.url',
                'https://vault.doreviateam.com'
            )
            
            # ✅ URL CORRECTE : Utilise /api/v1/ledger/verify/{document_id}
            record.vault_proof_url = f"{vault_url}/api/v1/ledger/verify/{document_id}"
            
        except jwt.DecodeError as e:
            _logger.error(
                "Failed to decode JWT for record %s: %s",
                record.id,
                str(e)
            )
            record.vault_proof_url = False
        except Exception as e:
            _logger.error(
                "Unexpected error generating proof URL for record %s: %s",
                record.id,
                str(e)
            )
            record.vault_proof_url = False
```

### Dépendances Python

Assurez-vous que le package `PyJWT` est installé :

```python
# Dans __manifest__.py
{
    'name': 'Dorevia Vault Connector',
    'depends': ['base'],
    'external_dependencies': {
        'python': ['PyJWT'],
    },
    # ...
}
```

**Installation** :
```bash
pip install PyJWT
```

---

## 🔧 Étape 3 : Exemple Complet par Modèle

### Pour `account.move` (Factures)

**Fichier** : `models/account_move.py`

```python
import jwt
import logging
from odoo import models, fields, api

_logger = logging.getLogger(__name__)

class AccountMove(models.Model):
    _inherit = 'account.move'
    
    vault_proof_url = fields.Char(
        string="URL de Preuve",
        compute='_compute_vault_proof_url',
        store=False,
        readonly=True,
    )
    
    @api.depends('vault_evidence_jws')
    def _compute_vault_proof_url(self):
        """Génère l'URL de preuve à partir du JWT."""
        for record in self:
            if not record.vault_evidence_jws:
                record.vault_proof_url = False
                continue
            
            try:
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
```

### Pour `pos.order` (Tickets POS)

**Fichier** : `models/pos_order.py`

```python
import jwt
import logging
from odoo import models, fields, api

_logger = logging.getLogger(__name__)

class PosOrder(models.Model):
    _inherit = 'pos.order'
    
    vault_proof_url = fields.Char(
        string="URL de Preuve",
        compute='_compute_vault_proof_url',
        store=False,
        readonly=True,
    )
    
    @api.depends('vault_evidence_jws')
    def _compute_vault_proof_url(self):
        """Génère l'URL de preuve à partir du JWT."""
        for record in self:
            if not record.vault_evidence_jws:
                record.vault_proof_url = False
                continue
            
            try:
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
```

### Pour `pos.session` (Z-Reports)

**Fichier** : `models/pos_session.py`

```python
import jwt
import logging
from odoo import models, fields, api

_logger = logging.getLogger(__name__)

class PosSession(models.Model):
    _inherit = 'pos.session'
    
    vault_proof_url = fields.Char(
        string="URL de Preuve Z-Report",
        compute='_compute_vault_proof_url',
        store=False,
        readonly=True,
    )
    
    @api.depends('vault_evidence_jws')
    def _compute_vault_proof_url(self):
        """Génère l'URL de preuve à partir du JWT."""
        for record in self:
            if not record.vault_evidence_jws:
                record.vault_proof_url = False
                continue
            
            try:
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
```

---

## 🧪 Étape 4 : Tester la Correction

### Test 1 : Vérifier l'URL Générée

1. **Ouvrir un document vaulté** dans Odoo (facture, ticket POS, etc.)
2. **Vérifier le champ `vault_proof_url`** :
   - L'URL doit être : `https://vault.doreviateam.com/api/v1/ledger/verify/{uuid}`
   - L'URL ne doit **PAS** contenir le JWT complet

### Test 2 : Tester le Clic sur "Ouvrir la Preuve"

1. **Cliquer sur le bouton "Ouvrir la preuve"**
2. **Vérifier** :
   - ✅ Une nouvelle fenêtre s'ouvre
   - ✅ L'URL est correcte (contient un UUID, pas un JWT)
   - ✅ La page affiche la preuve JSON (pas d'erreur 500)

### Test 3 : Vérifier avec curl

```bash
# Remplacer {document_id} par l'UUID extrait du JWT
curl -X GET "https://vault.doreviateam.com/api/v1/ledger/verify/88d73c8a-efd2-481c-9ede-8196e30705a1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Résultat attendu** :
```json
{
  "document_id": "88d73c8a-efd2-481c-9ede-8196e30705a1",
  "valid": true,
  "checks": [
    {
      "name": "file_exists",
      "status": "ok"
    },
    {
      "name": "hash_match",
      "status": "ok"
    }
  ]
}
```

---

## 🔍 Étape 5 : Débogage

### Problème : JWT Non Décodable

**Symptôme** : `vault_proof_url` reste `False` même avec un `vault_evidence_jws` présent.

**Solution** :
1. Vérifier que `PyJWT` est installé
2. Vérifier les logs Odoo pour les erreurs de décodage
3. Tester le décodage manuellement :

```python
import jwt

jwt_token = "eyJhbGciOiJSUzI1NiIs..."  # Votre JWT
decoded = jwt.decode(jwt_token, options={"verify_signature": False})
print(decoded.get("document_id"))
```

### Problème : `document_id` Absent dans le JWT

**Symptôme** : Le JWT se décode mais `document_id` est `None`.

**Solution** :
1. Vérifier le contenu du JWT décodé :
```python
decoded = jwt.decode(jwt_token, options={"verify_signature": False})
print(decoded)  # Afficher tout le contenu
```

2. Vérifier que le JWT provient bien de Vault (format correct)

### Problème : URL Toujours Incorrecte

**Symptôme** : L'URL générée contient encore `/api/v1/push_document/verify/`.

**Solution** :
1. Vérifier que le code a bien été modifié
2. Redémarrer Odoo (recharger le module)
3. Vérifier qu'il n'y a pas d'autre méthode qui génère l'URL

---

## 📋 Checklist de Correction

### Avant la Correction

- [ ] Identifier tous les modèles qui ont un champ `vault_proof_url`
- [ ] Identifier toutes les méthodes `_compute_vault_proof_url`
- [ ] Vérifier que `PyJWT` est installé

### Pendant la Correction

- [ ] Modifier chaque méthode `_compute_vault_proof_url`
- [ ] Extraire le `document_id` du JWT
- [ ] Construire l'URL : `/api/v1/ledger/verify/{document_id}`
- [ ] Ajouter la gestion d'erreurs

### Après la Correction

- [ ] Redémarrer Odoo
- [ ] Mettre à jour les enregistrements existants (recalculer `vault_proof_url`)
- [ ] Tester avec un document vaulté
- [ ] Vérifier que le clic sur "Ouvrir la preuve" fonctionne

---

## 🔄 Mise à Jour des Enregistrements Existants

Si vous avez déjà des enregistrements avec des URLs incorrectes, vous pouvez les mettre à jour :

```python
# Script de mise à jour (à exécuter dans Odoo shell)
import jwt

# Pour les factures
invoices = self.env['account.move'].search([
    ('vault_evidence_jws', '!=', False),
    ('vault_proof_url', 'ilike', '/api/v1/push_document/verify/')
])

for invoice in invoices:
    try:
        decoded = jwt.decode(
            invoice.vault_evidence_jws,
            options={"verify_signature": False}
        )
        document_id = decoded.get("document_id")
        if document_id:
            vault_url = self.env['ir.config_parameter'].sudo().get_param(
                'dorevia.vault.url',
                'https://vault.doreviateam.com'
            )
            invoice.vault_proof_url = f"{vault_url}/api/v1/ledger/verify/{document_id}"
    except Exception as e:
        _logger.error("Failed to update proof URL for invoice %s: %s", invoice.id, str(e))
```

---

## 📞 Support

Si le problème persiste après avoir appliqué cette correction :

1. **Vérifier les logs Odoo** pour les erreurs
2. **Tester manuellement** le décodage du JWT
3. **Vérifier l'endpoint Vault** avec curl
4. **Contacter l'équipe Vault** avec :
   - L'URL générée
   - Le JWT (première partie seulement pour la sécurité)
   - Les logs d'erreur

---

**Fin du guide.**

