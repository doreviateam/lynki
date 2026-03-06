# 📜 SPEC — Vaultérisation des PDF de Factures (Reformulée)

**Version** : v1.0  
**Date** : 2026-01-12  
**Statut** : ✅ **Draft validé — Prêt pour implémentation**  
**Auteur** : Dorevia Team

---

## 📋 Table des Matières

1. [Objectif](#objectif)
2. [Contexte et Principes Fondateurs](#contexte-et-principes-fondateurs)
3. [Architecture et Typologie des Preuves](#architecture-et-typologie-des-preuves)
4. [Spécification Technique](#spécification-technique)
5. [Flux et Machine d'État](#flux-et-machine-détat)
6. [Implémentation](#implémentation)
7. [Sécurité et Conformité](#sécurité-et-conformité)
8. [Tests et Validation](#tests-et-validation)

---

## 🎯 Objectif

Définir précisément **quand**, **comment** et **pourquoi** les PDF de factures doivent être vaultés dans l'architecture Dorevia (Odoo → DVIG → Vault).

Cette SPEC complète la vaultérisation existante du snapshot comptable (`invoice.posted`) en ajoutant la vaultérisation du PDF documentaire (`invoice.pdf_issued`).

**Principe fondateur** :
> **On ne prouve pas une intention, on prouve un acte.**  
> L'acte = communication réelle du document au client.

---

## 🧱 Contexte et Principes Fondateurs

### Principes Fondateurs Dorevia

1. **Le Vault ne dépend jamais de l'ERP** : Le Vault est indépendant et peut fonctionner sans Odoo
2. **Aucune intervention humaine dans le process** : Vaulting 100% automatisé
3. **Tout événement significatif est prouvé** : Traçabilité complète
4. **On ne vaulte jamais un brouillon** : Seulement les documents validés
5. **La preuve porte sur ce qui est réellement communiqué** : PDF exact transmis au client

### Architecture Actuelle

**Flux existant** :
```
Odoo action_post() 
  → invoice.posted (snapshot comptable)
  → DVIG /ingest
  → DVIG outbox worker
  → Vault /api/v1/events
  → Document vaulté (métadonnées)
```

**Flux proposé (nouveau)** :
```
Odoo action_invoice_sent() 
  → invoice.pdf_issued (PDF documentaire)
  → DVIG /ingest
  → DVIG outbox worker
  → Vault /api/v1/events
  → Document vaulté (PDF binaire + métadonnées)
```

---

## 🧩 Architecture et Typologie des Preuves

### Typologie des Preuves

| Type | Nom | Description | Déclencheur | Contenu |
|------|-----|-------------|-------------|---------|
| **1** | `invoice.posted` | Snapshot comptable | `action_post()` | Métadonnées facture (montants, lignes, etc.) |
| **2** | `invoice.pdf_issued` | PDF communiqué | `action_invoice_sent()` | PDF binaire + métadonnées |

### Séparation des Responsabilités

- **`invoice.posted`** : Preuve de la **vérité comptable** (état au moment de la validation)
- **`invoice.pdf_issued`** : Preuve du **document communiqué** (PDF exact transmis au client)

➡️ **Deux preuves indépendantes** pour une traçabilité complète.

---

## 📦 Spécification Technique

### 1. Déclencheur : `invoice.pdf_issued`

#### Conditions de Déclenchement

| Condition | Vérification | Statut |
|-----------|--------------|--------|
| Facture validée | `move.state = 'posted'` | ✅ Requis |
| PDF généré | `ir.attachment` créé avec `mimetype = 'application/pdf'` | ✅ Requis |
| PDF lié à facture | `res_model = 'account.move'` ET `res_id = move.id` | ✅ Requis |
| PDF envoyé | `move.is_move_sent = True` OU présence dans `mail.message` | ✅ Requis |
| Pas déjà vaulté | `dorevia_pdf_vault_status != 'vaulted'` | ✅ Requis |

#### Cas d'Exclusion

| Action | Vault ? | Raison |
|--------|---------|--------|
| Prévisualisation PDF | ❌ | PDF non communiqué |
| Génération PDF (non envoyé) | ❌ | PDF non communiqué |
| Brouillon | ❌ | Principe fondateur |
| PDF déjà vaulté | ❌ | Idempotence |

### 2. Détection de l'Envoi PDF

#### Mécanisme Recommandé : Observer `ir.attachment`

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/ir_attachment.py` (nouveau)

```python
class IrAttachment(models.Model):
    _inherit = 'ir.attachment'
    
    def create(self, vals):
        result = super().create(vals)
        
        # Détecter PDF lié à account.move
        if (result.res_model == 'account.move' and 
            result.mimetype == 'application/pdf' and
            result.res_id):
            
            move = self.env['account.move'].browse(result.res_id)
            
            # Vérifier conditions
            if (move.state == 'posted' and 
                move.is_move_sent and  # PDF envoyé
                move._should_vault_pdf(move, result)):  # Conditions spécifiques PDF
                
                # Déclencher vaulting asynchrone
                move._trigger_pdf_vaulting_async(result)
        
        return result
```

#### Filtrage des PDF

**Critères de vaulting** :
1. ✅ `res_model = 'account.move'`
2. ✅ `res_id = <invoice_id>`
3. ✅ `mimetype = 'application/pdf'`
4. ✅ `move.state = 'posted'`
5. ✅ `move.is_move_sent = True` (Odoo standard)
6. ✅ `attachment.create_date` récent (< 1h) pour éviter prévisualisations

### 3. Construction du Payload `invoice.pdf_issued`

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`

```python
def _build_dvig_payload_pdf(self, move, attachment):
    """
    Construire le payload pour invoice.pdf_issued
    
    Args:
        move: account.move (facture)
        attachment: ir.attachment (PDF)
    
    Returns:
        dict: Payload DVIG format P1
    """
    import base64
    import hashlib
    
    # Récupérer la configuration
    dvig_source = self.env['ir.config_parameter'].sudo().get_param('dorevia.dvig.source')
    if not dvig_source:
        raise UserError(_('Configuration DVIG incomplète (source manquante)'))
    
    # Timestamp ISO 8601 UTC
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # Récupérer le PDF binaire
    pdf_bytes = base64.b64decode(attachment.datas)
    
    # Calculer SHA256 du PDF (idempotence)
    sha256 = hashlib.sha256(pdf_bytes).hexdigest()
    
    # Détecter type PDF (classic ou facturx)
    pdf_type = 'classic'
    # TODO: Détecter Factur-X (parser PDF ou vérifier module)
    
    # Détecter mode d'envoi
    issued_via = 'email'  # Par défaut
    # TODO: Détecter depuis mail.message ou autre source
    
    # Construire le payload
    payload = {
        'event_type': 'invoice.pdf_issued',
        'source': dvig_source,
        'timestamp': timestamp,
        'data': {
            'move_id': move.id,
            'move_name': move.name or '',
            'move_type': move.move_type,
            'state': move.state,
            'attachment_id': attachment.id,
            'filename': attachment.name or f'Facture - {move.name}.pdf',
            'sha256': sha256,
            'mimetype': 'application/pdf',
            'pdf_type': pdf_type,  # 'classic' ou 'facturx'
            'issued_via': issued_via,  # 'email', 'print', 'portal'
            'issued_at': attachment.create_date.isoformat(),
            'size_bytes': attachment.file_size or len(pdf_bytes),
        },
        'idempotency_key': sha256,  # SHA256 du PDF = clé d'idempotence
    }
    
    return payload
```

### 4. Envoi vers DVIG

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`

```python
def _vault_pdf_attachment(self, move, attachment):
    """
    Vaultériser un PDF attachment
    
    Args:
        move: account.move (facture)
        attachment: ir.attachment (PDF)
    """
    try:
        # Vérifier les conditions
        if not move._should_vault_pdf(move, attachment):
            _logger.debug(f"PDF {attachment.name} ne peut pas être vaulté pour {move.name}")
            return
        
        # Construire le payload
        payload = self._build_dvig_payload_pdf(move, attachment)
        
        # Récupérer la configuration
        dvig_url = self.env['ir.config_parameter'].sudo().get_param('dorevia.dvig.url')
        dvig_token = self.env['ir.config_parameter'].sudo().get_param('dorevia.dvig.token')
        
        if not dvig_url or not dvig_token:
            _logger.warning(f"Configuration DVIG incomplète pour PDF {attachment.name}")
            return
        
        # Nettoyer l'URL
        dvig_url = dvig_url.rstrip('/')
        url = f'{dvig_url}/ingest'
        
        # Headers
        headers = {
            'Authorization': f'Bearer {dvig_token}',
            'Content-Type': 'application/json'
        }
        
        # Envoyer vers DVIG
        _logger.debug(f"Envoi PDF {attachment.name} vers DVIG /ingest")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Parser la réponse
        result = response.json()
        event_id = result.get('event_id') or result.get('id')
        
        if event_id:
            # Succès : mettre à jour statut
            move.write({
                'dorevia_pdf_vault_status': 'pending_proof',
                'dorevia_pdf_dvig_event_id': event_id,
                'dorevia_pdf_attachment_id': attachment.id,
                'dorevia_pdf_sha256': payload['data']['sha256'],
                'dorevia_pdf_last_try_at': fields.Datetime.now(),
                'dorevia_pdf_attempt_count': (move.dorevia_pdf_attempt_count or 0) + 1,
                'dorevia_pdf_last_error': None,
            })
            _logger.info(f"PDF {attachment.name} envoyé avec succès vers DVIG (event_id: {event_id})")
        else:
            _logger.warning(f"Pas d'event_id dans la réponse DVIG pour PDF {attachment.name}")
    
    except Exception as e:
        _logger.error(f"Erreur lors du vaulting PDF {attachment.name}: {str(e)}")
        # Mettre à jour statut d'erreur
        move.write({
            'dorevia_pdf_vault_status': 'failed_soft',
            'dorevia_pdf_last_error': str(e),
            'dorevia_pdf_last_try_at': fields.Datetime.now(),
        })
```

### 5. Machine d'État PDF

#### Nouveaux Champs dans `account.move`

| Champ | Type | Description |
|-------|------|-------------|
| `dorevia_pdf_vault_status` | Selection | Statut vaulting PDF (`todo`, `pending_proof`, `vaulted`, `failed_soft`, `failed_hard`) |
| `dorevia_pdf_vault_id` | Char | ID Vault du PDF (UUID) |
| `dorevia_pdf_dvig_event_id` | Char | ID événement DVIG (UUID) |
| `dorevia_pdf_attachment_id` | Integer | ID de l'attachment vaulté |
| `dorevia_pdf_sha256` | Char(64) | SHA256 du PDF |
| `dorevia_pdf_last_try_at` | Datetime | Date/heure dernière tentative |
| `dorevia_pdf_attempt_count` | Integer | Nombre de tentatives |
| `dorevia_pdf_last_error` | Text | Dernière erreur |
| `dorevia_pdf_next_retry_at` | Datetime | Prochaine tentative (backoff) |

#### États

| État | Description | Transition |
|------|-------------|------------|
| `todo` | PDF détecté, en attente d'envoi | → `pending_proof` (après envoi DVIG) |
| `pending_proof` | PDF envoyé à DVIG, en attente de preuve | → `vaulted` (preuve récupérée) |
| `vaulted` | PDF vaulté avec succès | ✅ Final |
| `failed_soft` | Échec temporaire (retry) | → `pending_proof` (retry) ou `failed_hard` (abandon) |
| `failed_hard` | Échec définitif | ✅ Final |

### 6. Format du Payload DVIG

```json
{
  "event_type": "invoice.pdf_issued",
  "source": "odoo.stinger.sarl-la-platine",
  "timestamp": "2026-01-12T14:30:00.123456+00:00",
  "idempotency_key": "a1b2c3d4e5f6...",
  "data": {
    "move_id": 1234,
    "move_name": "FAC/2026/00011",
    "move_type": "out_invoice",
    "state": "posted",
    "attachment_id": 5678,
    "filename": "Facture - FAC/2026/00011.pdf",
    "sha256": "a1b2c3d4e5f6...",
    "mimetype": "application/pdf",
    "pdf_type": "classic",
    "issued_via": "email",
    "issued_at": "2026-01-12T14:30:00.000000+00:00",
    "size_bytes": 45678
  }
}
```

---

## 🔄 Flux et Machine d'État

### Flux Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utilisateur valide facture (action_post())               │
│    └─> invoice.posted → Vault (snapshot comptable)          │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Utilisateur envoie facture (action_invoice_sent())       │
│    └─> Odoo génère PDF                                       │
│    └─> Odoo crée ir.attachment (PDF)                        │
│    └─> Observer détecte PDF                                   │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Vaulting PDF déclenché                                    │
│    └─> dorevia_pdf_vault_status = 'todo'                    │
│    └─> Construction payload invoice.pdf_issued                │
│    └─> Envoi vers DVIG /ingest                                │
│    └─> dorevia_pdf_vault_status = 'pending_proof'            │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. DVIG traite l'événement                                   │
│    └─> Outbox worker                                         │
│    └─> Forward vers Vault /api/v1/events                     │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Vault stocke le PDF                                        │
│    └─> Document créé avec PDF binaire                        │
│    └─> JWS + Ledger (si activés)                              │
│    └─> dorevia_pdf_vault_status = 'vaulted'                  │
└─────────────────────────────────────────────────────────────┘
```

### Machine d'État Combinée

```
Facture
  │
  ├─> action_post()
  │   └─> invoice.posted → Vault (métadonnées)
  │   └─> dorevia_vault_status = 'vaulted'
  │
  └─> action_invoice_sent()
      └─> PDF généré + attachment créé
      └─> invoice.pdf_issued → Vault (PDF binaire)
      └─> dorevia_pdf_vault_status = 'vaulted'
```

**Indépendance** : Les deux vaultings sont **indépendants** et peuvent échouer séparément.

---

## ⚙️ Implémentation

### Phase 1 : Odoo (Détection et Envoi)

#### 1.1 Observer `ir.attachment`

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/ir_attachment.py` (nouveau)

```python
# -*- coding: utf-8 -*-

from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)


class IrAttachment(models.Model):
    _inherit = 'ir.attachment'
    
    def create(self, vals):
        """
        Observer création d'attachments pour détecter PDF de factures
        """
        result = super().create(vals)
        
        # Détecter PDF lié à account.move
        if (result.res_model == 'account.move' and 
            result.mimetype == 'application/pdf' and
            result.res_id):
            
            move = self.env['account.move'].browse(result.res_id)
            
            # Vérifier conditions
            if (move.exists() and 
                move.state == 'posted' and 
                move.is_move_sent and
                move._should_vault_pdf(move, result)):
                
                # Déclencher vaulting asynchrone (via queue_job ou CRON)
                move._trigger_pdf_vaulting_async(result)
        
        return result
```

#### 1.2 Méthodes dans `account_move.py`

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`

```python
def _should_vault_pdf(self, move, attachment):
    """
    Vérifier si un PDF doit être vaulté
    
    Args:
        move: account.move
        attachment: ir.attachment
    
    Returns:
        bool: True si le PDF doit être vaulté
    """
    # Vérifier configuration DVIG
    if not self._should_vault(move):
        return False
    
    # Vérifier que le PDF n'est pas déjà vaulté
    if move.dorevia_pdf_vault_status == 'vaulted':
        return False
    
    # Vérifier que l'attachment est récent (< 1h) pour éviter prévisualisations
    from datetime import timedelta
    if attachment.create_date < fields.Datetime.now() - timedelta(hours=1):
        return False
    
    return True

def _trigger_pdf_vaulting_async(self, attachment):
    """
    Déclencher le vaulting PDF de manière asynchrone
    
    Args:
        attachment: ir.attachment (PDF)
    """
    # Option 1 : Via queue_job (si disponible)
    if hasattr(self.env['dorevia.dvig.service'], 'with_delay'):
        self.env['dorevia.dvig.service'].with_delay(
            priority=10,
            identity_key=f"pdf_vault:{self.env.cr.dbname}:{self.id}:{attachment.id}"
        ).job_vault_pdf(self.id, attachment.id)
    else:
        # Option 2 : Via CRON (fallback)
        # Le CRON #3 rattrapera les PDF en 'todo'
        self.write({
            'dorevia_pdf_vault_status': 'todo',
            'dorevia_pdf_attachment_id': attachment.id,
        })
```

#### 1.3 Job queue_job pour PDF

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/dorevia_dvig_service.py`

```python
def job_vault_pdf(self, move_id, attachment_id):
    """
    Job queue_job pour vaultériser un PDF
    
    Args:
        move_id: ID de la facture
        attachment_id: ID de l'attachment PDF
    """
    move = self.env['account.move'].browse(move_id)
    attachment = self.env['ir.attachment'].browse(attachment_id)
    
    if not move.exists() or not attachment.exists():
        return
    
    # Vaultériser le PDF
    move._vault_pdf_attachment(move, attachment)
```

#### 1.4 CRON Rattrapage PDF

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`

```python
def cron_vault_pdf_send_dvig(self):
    """
    CRON #3 : Rattraper les PDF non vaultés
    
    Fréquence : Toutes les 5 minutes
    Batch : 50 max
    """
    # Sélectionner PDF en 'todo' ou 'failed_soft'
    moves = self.search([
        ('state', '=', 'posted'),
        ('is_move_sent', '=', True),
        ('dorevia_pdf_vault_status', 'in', ['todo', 'failed_soft']),
        '|',
        ('dorevia_pdf_next_retry_at', '<=', fields.Datetime.now()),
        ('dorevia_pdf_next_retry_at', '=', False),
    ], limit=50)
    
    for move in moves:
        if move.dorevia_pdf_attachment_id:
            attachment = self.env['ir.attachment'].browse(move.dorevia_pdf_attachment_id)
            if attachment.exists():
                move._vault_pdf_attachment(move, attachment)
```

### Phase 2 : DVIG (Traitement)

#### 2.1 Accepter `invoice.pdf_issued`

**Fichier** : `sources/dvig/dvig/api_fastapi/routes/ingest.py`

```python
# Ajouter validation pour invoice.pdf_issued
ALLOWED_EVENT_TYPES = [
    'invoice.posted',
    'invoice.refund.posted',
    'invoice.pdf_issued',  # NOUVEAU
]
```

#### 2.2 Traiter dans outbox_worker

**Fichier** : `sources/dvig/workers/outbox_worker.py`

```python
# Ajouter traitement pour invoice.pdf_issued
# Même logique que invoice.posted
# Forwarder vers Vault /api/v1/events
```

### Phase 3 : Vault (Stockage)

#### 3.1 Gérer `invoice.pdf_issued`

**Fichier** : `sources/vault/internal/handlers/events.go`

```go
// Ajouter gestion invoice.pdf_issued
if payload.EventType == "invoice.pdf_issued" {
    // Récupérer PDF depuis payload (si fourni) ou depuis Odoo
    // Stocker PDF binaire
    // Créer document avec PDF
}
```

#### 3.2 Stockage PDF

**Option A : Table séparée** (Recommandé)

```sql
CREATE TABLE document_pdfs (
    id UUID PRIMARY KEY,
    document_id UUID REFERENCES documents(id),
    pdf_content BYTEA,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Option B : Champ dans documents**

```sql
ALTER TABLE documents ADD COLUMN pdf_content BYTEA;
```

**Recommandation** : **Option A** (table séparée pour performance)

---

## 🛡️ Sécurité et Conformité

### Idempotence

**Clé d'idempotence** : `SHA256(pdf_bytes)`

➡️ Si le même PDF est envoyé plusieurs fois, le Vault retourne le document existant.

### Factur-X

**Traitement** : **STRICTEMENT IDENTIQUE** au PDF classique

- Factur-X = PDF avec XML embarqué
- Techniquement = toujours un PDF
- Détection automatique par Vault (parser PDF)

### Conformité

- ✅ **NF525-like** : Preuve d'intégrité et de traçabilité
- ✅ **eIDAS-ready** : Horodatage et signature
- ✅ **PDP / PPF future-proof** : Format standard

---

## 🧪 Tests et Validation

### Tests Unitaires

1. **Test détection PDF**
   - Créer `ir.attachment` PDF lié à facture
   - Vérifier déclenchement vaulting

2. **Test construction payload**
   - Vérifier format payload `invoice.pdf_issued`
   - Vérifier SHA256 calculé

3. **Test idempotence**
   - Envoyer même PDF 2 fois
   - Vérifier retour document existant

### Tests d'Intégration

1. **Test flux complet**
   - Valider facture → `invoice.posted` vaulté
   - Envoyer facture → `invoice.pdf_issued` vaulté
   - Vérifier 2 documents dans Vault

2. **Test Factur-X**
   - Envoyer facture Factur-X
   - Vérifier détection automatique

### Tests de Non-Régression

1. **Vérifier `invoice.posted` inchangé**
2. **Vérifier machine d'état existante**
3. **Vérifier CRONs existants**

---

## 📋 Checklist Implémentation

### Phase 1 : Odoo

- [ ] Créer `models/ir_attachment.py` (observer)
- [ ] Ajouter `_build_dvig_payload_pdf()` dans `account_move.py`
- [ ] Ajouter `_vault_pdf_attachment()` dans `account_move.py`
- [ ] Ajouter `_should_vault_pdf()` dans `account_move.py`
- [ ] Ajouter `_trigger_pdf_vaulting_async()` dans `account_move.py`
- [ ] Ajouter champs `dorevia_pdf_*` dans `account_move.py`
- [ ] Migration SQL pour nouveaux champs
- [ ] Ajouter champs dans vue `account_move_views.xml`
- [ ] Ajouter `job_vault_pdf()` dans `dorevia_dvig_service.py`
- [ ] Ajouter CRON #3 `cron_vault_pdf_send_dvig()`
- [ ] Tests unitaires

### Phase 2 : DVIG

- [ ] Accepter `invoice.pdf_issued` dans `/ingest`
- [ ] Valider payload PDF
- [ ] Traiter dans `outbox_worker.py`
- [ ] Tests

### Phase 3 : Vault

- [ ] Gérer `invoice.pdf_issued` dans `events.go`
- [ ] Créer table `document_pdfs` (ou champ)
- [ ] Stocker PDF binaire
- [ ] Détecter Factur-X automatiquement
- [ ] Tests

---

## 🔄 Rétrocompatibilité

### Factures Déjà Envoyées

**Problème** : Factures envoyées avant implémentation

**Solution** : CRON de rattrapage

```python
def cron_vault_pdf_retroactive(self):
    """
    CRON de rattrapage pour factures déjà envoyées
    """
    # Sélectionner factures posted + is_move_sent + pas de PDF vaulté
    moves = self.search([
        ('state', '=', 'posted'),
        ('is_move_sent', '=', True),
        ('dorevia_pdf_vault_status', '=', False),  # Pas encore vaulté
    ], limit=100)
    
    for move in moves:
        # Récupérer PDF le plus récent
        attachment = self.env['ir.attachment'].search([
            ('res_model', '=', 'account.move'),
            ('res_id', '=', move.id),
            ('mimetype', '=', 'application/pdf'),
        ], order='create_date DESC', limit=1)
        
        if attachment:
            move._vault_pdf_attachment(move, attachment)
```

---

## 📊 Métriques et Observabilité

### Métriques à Ajouter

- `dorevia_pdf_vaulted_count` : Nombre de PDF vaultés
- `dorevia_pdf_vault_failed_count` : Nombre d'échecs
- `dorevia_pdf_vault_latency_ms` : Latence vaulting PDF

### Logs

- `PDF {filename} détecté pour facture {move_name}`
- `PDF {filename} envoyé vers DVIG (event_id: {event_id})`
- `PDF {filename} vaulté avec succès (vault_id: {vault_id})`

---

## 🏁 Conclusion

Cette SPEC définit la vaultérisation des PDF de factures comme **complément** à la vaultérisation du snapshot comptable.

**Bénéfices** :
- ✅ Traçabilité complète (comptable + documentaire)
- ✅ Preuve du document réellement communiqué
- ✅ Conformité juridique renforcée
- ✅ Non-répudiation

**Principe** :
> **On ne prouve pas une intention, on prouve un acte.**  
> L'acte = communication réelle du document au client.

---

**Date** : 2026-01-12  
**Version** : v1.0  
**Statut** : ✅ **PRÊT POUR IMPLÉMENTATION**
