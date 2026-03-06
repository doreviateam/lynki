# 📊 Évaluation — SPEC Vaultérisation PDF de Factures v1.0

**Date** : 2026-01-12  
**SPEC** : Vaultérisation des PDF de Factures v1.0  
**Statut** : ✅ **ÉVALUATION COMPLÉTÉE**

---

## 📋 Résumé Exécutif

### Verdict Global

**✅ SPEC VALIDE et COHÉRENTE** — Implémentation recommandée

- **Cohérence** : ✅ Excellente avec l'architecture existante
- **Faisabilité** : ✅ Technique (nécessite développement)
- **Impact** : 🟡 **MOYEN** (nouveau type d'événement, nouveau flux)
- **Priorité** : 🟡 **MOYEN** (amélioration traçabilité, pas critique)

---

## 🎯 Analyse de la SPEC

### Points Forts

1. ✅ **Principe clair** : "On prouve l'acte, pas l'intention"
2. ✅ **Cohérence** : Respecte les principes fondateurs (pas d'intervention humaine, pas de brouillon)
3. ✅ **Séparation des responsabilités** : `invoice.posted` (comptable) vs `invoice.pdf_issued` (documentaire)
4. ✅ **Idempotence** : Basée sur SHA256 du PDF (robuste)
5. ✅ **Factur-X transparent** : Traitement identique (cohérent)

### Points d'Attention

1. ⚠️ **Nouveau type d'événement** : Nécessite développement dans Odoo, DVIG et Vault
2. ⚠️ **Détection de l'envoi** : Intercepter `action_invoice_sent()` ou `account.move.send.wizard`
3. ⚠️ **Récupération du PDF** : Accéder à `ir.attachment` pour récupérer le binaire
4. ⚠️ **Machine d'état** : Gérer deux types de vaulting par facture
5. ⚠️ **Rétrocompatibilité** : Factures déjà envoyées avant implémentation

---

## 🔍 Cohérence avec l'Architecture Actuelle

### ✅ Cohérence avec Principes Fondateurs

| Principe | Vérification | Statut |
|----------|-------------|--------|
| **Le Vault ne dépend jamais de l'ERP** | ✅ PDF vaulté indépendamment | ✅ OK |
| **Aucune intervention humaine** | ✅ Détection automatique de l'envoi | ✅ OK |
| **Tout événement significatif est prouvé** | ✅ POST + ENVOI = 2 preuves | ✅ OK |
| **On ne vaulte jamais un brouillon** | ✅ Seulement si `posted` + `sent` | ✅ OK |
| **La preuve porte sur ce qui est réellement communiqué** | ✅ PDF exact transmis | ✅ OK |

### ✅ Cohérence avec Architecture Technique

**Flux actuel** :
```
action_post() → invoice.posted → DVIG → Vault
```

**Flux proposé** :
```
action_post() → invoice.posted → DVIG → Vault
action_invoice_sent() → invoice.pdf_issued → DVIG → Vault
```

➡️ **Cohérent** : Même architecture, nouveau type d'événement

---

## 🔧 Faisabilité Technique

### 1. Détection de l'Envoi PDF

#### Option A : Intercepter `action_invoice_sent()`

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`

```python
def action_invoice_sent(self):
    """
    Surcharge pour détecter l'envoi PDF et vaultériser
    """
    result = super().action_invoice_sent()
    
    # Détecter si un PDF a été généré et envoyé
    # Vérifier ir.attachment créé récemment
    # ...
    
    return result
```

**Avantages** :
- ✅ Simple à implémenter
- ✅ Intercepte tous les envois

**Inconvénients** :
- ⚠️ Ne détecte pas l'envoi réel (juste l'ouverture du wizard)
- ⚠️ Le PDF peut ne pas être envoyé (annulation)

#### Option B : Intercepter `account.move.send.wizard.action_send_and_print()`

**Fichier** : Nouveau fichier `wizards/account_move_send_wizard.py`

```python
class AccountMoveSendWizard(models.TransientModel):
    _inherit = 'account.move.send.wizard'
    
    def action_send_and_print(self):
        result = super().action_send_and_print()
        
        # Détecter les attachments créés
        # Vaultériser les PDF
        # ...
        
        return result
```

**Avantages** :
- ✅ Détecte l'envoi réel (après confirmation)
- ✅ Accès direct aux attachments créés

**Inconvénients** :
- ⚠️ Nécessite héritage du wizard Odoo standard
- ⚠️ Plus complexe

#### Option C : Observer `ir.attachment` (Recommandé)

**Fichier** : Nouveau fichier `models/ir_attachment.py`

```python
class IrAttachment(models.Model):
    _inherit = 'ir.attachment'
    
    def create(self, vals):
        result = super().create(vals)
        
        # Si attachment lié à account.move + PDF + récent
        if (result.res_model == 'account.move' and 
            result.mimetype == 'application/pdf' and
            result.res_id):
            # Déclencher vaulting PDF
            # ...
        
        return result
```

**Avantages** :
- ✅ Détecte automatiquement tous les PDF créés
- ✅ Indépendant du wizard
- ✅ Fonctionne pour tous les cas (email, print, portal)

**Inconvénients** :
- ⚠️ Peut détecter des PDF non envoyés (prévisualisation)
- ⚠️ Nécessite filtrage (vérifier si vraiment envoyé)

**Recommandation** : **Option C avec filtrage** (vérifier `is_move_sent` ou présence dans email)

### 2. Récupération du PDF

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`

```python
def _get_pdf_attachment(self, move):
    """
    Récupère le PDF attachment le plus récent pour une facture
    """
    attachment = self.env['ir.attachment'].search([
        ('res_model', '=', 'account.move'),
        ('res_id', '=', move.id),
        ('mimetype', '=', 'application/pdf'),
    ], order='create_date DESC', limit=1)
    
    if attachment:
        return attachment.datas  # Base64
    return None
```

**Faisabilité** : ✅ **TRÈS FAIBLE** — Accès direct à `ir.attachment`

### 3. Construction du Payload `invoice.pdf_issued`

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`

```python
def _build_dvig_payload_pdf(self, move, attachment):
    """
    Construire le payload pour invoice.pdf_issued
    """
    # Calculer SHA256 du PDF
    pdf_bytes = base64.b64decode(attachment.datas)
    sha256 = hashlib.sha256(pdf_bytes).hexdigest()
    
    payload = {
        'event_type': 'invoice.pdf_issued',
        'source': dvig_source,
        'timestamp': fields.Datetime.now().isoformat(),
        'data': {
            'move_id': move.id,
            'move_name': move.name,
            'attachment_id': attachment.id,
            'filename': attachment.name,
            'sha256': sha256,
            'mimetype': 'application/pdf',
            'pdf_type': 'classic',  # ou 'facturx' si détecté
            'issued_via': 'email',  # ou 'print', 'portal'
            'issued_at': attachment.create_date.isoformat(),
        },
        'idempotency_key': sha256,  # SHA256 du PDF = clé d'idempotence
    }
    
    return payload
```

**Faisabilité** : ✅ **FAIBLE** — Logique similaire à `_build_dvig_payload()`

### 4. Envoi vers DVIG

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`

```python
def _vault_pdf_attachment(self, move, attachment):
    """
    Vaultériser un PDF attachment
    """
    # Construire payload
    payload = self._build_dvig_payload_pdf(move, attachment)
    
    # Envoyer vers DVIG /ingest
    # (même logique que _vault_invoice_posted)
    
    # Mettre à jour statut (nouveau champ ou extension machine d'état)
    move.write({
        'dorevia_pdf_vault_status': 'todo',  # Nouveau champ
        # ...
    })
```

**Faisabilité** : ✅ **FAIBLE** — Réutilisation de la logique existante

### 5. Machine d'État

#### Option A : Champs Séparés (Recommandé)

**Nouveaux champs** :
- `dorevia_pdf_vault_status` : Statut vaulting PDF
- `dorevia_pdf_vault_id` : ID Vault du PDF
- `dorevia_pdf_attachment_id` : ID de l'attachment vaulté
- `dorevia_pdf_sha256` : SHA256 du PDF

**Avantages** :
- ✅ Séparation claire (comptable vs documentaire)
- ✅ Indépendance des deux vaultings
- ✅ Traçabilité complète

#### Option B : Extension Machine d'État

**Champs existants** :
- `dorevia_vault_status` : Statut global
- Extension : `dorevia_vault_status_pdf` (sous-statut)

**Avantages** :
- ✅ Moins de champs
- ✅ Vue unifiée

**Inconvénients** :
- ⚠️ Plus complexe à gérer
- ⚠️ Risque de confusion

**Recommandation** : **Option A** (champs séparés)

---

## 📊 Impact sur le Projet

### 1. Impact Code Odoo

#### Fichiers à Modifier

1. **`models/account_move.py`**
   - Ajouter `_build_dvig_payload_pdf()`
   - Ajouter `_vault_pdf_attachment()`
   - Ajouter `_get_pdf_attachment()`
   - Ajouter champs `dorevia_pdf_*`

2. **Nouveau fichier : `models/ir_attachment.py`**
   - Observer création `ir.attachment`
   - Détecter PDF liés à `account.move`
   - Déclencher vaulting

3. **`views/account_move_views.xml`**
   - Ajouter champs `dorevia_pdf_*` dans la vue

4. **`__manifest__.py`**
   - Ajouter dépendance si nécessaire

#### Nouveaux CRONs (Optionnel)

- **CRON #3** : Rattrapage PDF non vaultés
  - Sélection : `posted` + `attachment PDF` + `dorevia_pdf_vault_status = 'todo'`

### 2. Impact DVIG

#### Fichiers à Modifier

1. **`dvig/api_fastapi/routes/ingest.py`**
   - Accepter `event_type: invoice.pdf_issued`
   - Valider payload PDF

2. **`dvig/workers/outbox_worker.py`**
   - Traiter `invoice.pdf_issued` (même logique que `invoice.posted`)

**Impact** : 🟡 **MOYEN** — Nouveau type d'événement à gérer

### 3. Impact Vault

#### Fichiers à Modifier

1. **`vault/internal/handlers/events.go`**
   - Gérer `invoice.pdf_issued`
   - Stocker le PDF (nouveau champ ou table)

2. **`vault/internal/handlers/invoices.go`**
   - Traiter PDF dans le payload
   - Stocker binaire PDF

**Impact** : 🟡 **MOYEN** — Stockage PDF nécessaire

### 4. Impact Base de Données

#### Odoo

**Nouveaux champs** :
```sql
ALTER TABLE account_move ADD COLUMN dorevia_pdf_vault_status VARCHAR;
ALTER TABLE account_move ADD COLUMN dorevia_pdf_vault_id UUID;
ALTER TABLE account_move ADD COLUMN dorevia_pdf_attachment_id INTEGER;
ALTER TABLE account_move ADD COLUMN dorevia_pdf_sha256 VARCHAR(64);
```

**Index** :
```sql
CREATE INDEX idx_account_move_pdf_vault_status ON account_move(dorevia_pdf_vault_status);
```

#### Vault

**Stockage PDF** :
- Option A : Champ `pdf_content` dans table `documents` (BLOB)
- Option B : Table séparée `document_pdfs` (recommandé pour performance)

**Impact** : 🟡 **MOYEN** — Stockage binaire nécessaire

---

## ⚠️ Points d'Attention

### 1. Détection de l'Envoi Réel

**Problème** : Comment distinguer :
- PDF envoyé par email ✅
- PDF imprimé ✅
- PDF téléchargé depuis portail ✅
- PDF prévisualisé ❌
- PDF généré mais non envoyé ❌

**Solution** :
- Vérifier `is_move_sent` (Odoo standard)
- Vérifier présence dans `mail.message` (si email)
- Vérifier `create_date` de l'attachment (récent = probablement envoyé)
- Optionnel : Flag explicite `pdf_issued` dans `account.move`

### 2. Factur-X

**Problème** : Comment détecter si le PDF est Factur-X ?

**Solution** :
- Parser le PDF pour détecter XML embarqué
- Ou vérifier si module Factur-X actif + facture éligible
- Ou laisser Vault détecter automatiquement

### 3. Rétrocompatibilité

**Problème** : Factures déjà envoyées avant implémentation

**Solution** :
- CRON de rattrapage pour factures `posted` + `is_move_sent=True` + `dorevia_pdf_vault_status IS NULL`
- Vaultériser le PDF le plus récent

### 4. Performance

**Problème** : Stockage de PDF binaires dans Vault

**Solution** :
- Table séparée `document_pdfs` (évite charger PDF inutilement)
- Compression (gzip) si nécessaire
- Archivage après X années

### 5. Idempotence

**Problème** : Même PDF envoyé plusieurs fois

**Solution** :
- `idempotency_key = SHA256(pdf_bytes)` ✅
- Vérifier dans Vault avant stockage
- Retourner document existant si hash identique

---

## ✅ Recommandations

### 1. Implémentation Progressive

**Phase 1** : Détection et envoi vers DVIG
- Observer `ir.attachment`
- Construire payload `invoice.pdf_issued`
- Envoyer vers DVIG

**Phase 2** : Traitement DVIG
- Accepter `invoice.pdf_issued`
- Forwarder vers Vault

**Phase 3** : Stockage Vault
- Stocker PDF binaire
- Gérer Factur-X

### 2. Architecture Recommandée

#### Odoo

```python
# models/ir_attachment.py (nouveau)
class IrAttachment(models.Model):
    _inherit = 'ir.attachment'
    
    def create(self, vals):
        result = super().create(vals)
        # Détecter PDF account.move
        # Déclencher vaulting asynchrone
        return result

# models/account_move.py (modifié)
def _vault_pdf_attachment(self, move, attachment):
    # Construire payload invoice.pdf_issued
    # Envoyer vers DVIG
    # Mettre à jour dorevia_pdf_vault_status
```

#### Machine d'État

**Champs séparés** (recommandé) :
- `dorevia_vault_status` : Vaulting snapshot comptable
- `dorevia_pdf_vault_status` : Vaulting PDF documentaire

**Avantages** :
- ✅ Indépendance des deux vaultings
- ✅ Traçabilité complète
- ✅ Gestion d'erreurs séparée

### 3. Filtrage des PDF

**Critères de vaulting PDF** :
1. ✅ `res_model = 'account.move'`
2. ✅ `res_id = <invoice_id>`
3. ✅ `mimetype = 'application/pdf'`
4. ✅ `move.state = 'posted'`
5. ✅ `move.is_move_sent = True` (Odoo standard)
6. ✅ `attachment.create_date` récent (< 1h)

### 4. Gestion Factur-X

**Détection** :
- Option A : Parser PDF pour détecter XML embarqué
- Option B : Vérifier module Factur-X + facture éligible
- Option C : Laisser Vault détecter

**Recommandation** : **Option C** (Vault détecte automatiquement)

---

## 📋 Checklist Implémentation

### Phase 1 : Odoo

- [ ] Créer `models/ir_attachment.py` (observer création)
- [ ] Ajouter `_build_dvig_payload_pdf()` dans `account_move.py`
- [ ] Ajouter `_vault_pdf_attachment()` dans `account_move.py`
- [ ] Ajouter champs `dorevia_pdf_*` dans `account_move.py`
- [ ] Migration SQL pour nouveaux champs
- [ ] Ajouter champs dans vue `account_move_views.xml`
- [ ] Tests unitaires

### Phase 2 : DVIG

- [ ] Accepter `event_type: invoice.pdf_issued` dans `/ingest`
- [ ] Valider payload PDF
- [ ] Traiter dans `outbox_worker.py`
- [ ] Tests

### Phase 3 : Vault

- [ ] Gérer `invoice.pdf_issued` dans `events.go`
- [ ] Stocker PDF binaire (table `document_pdfs`)
- [ ] Détecter Factur-X automatiquement
- [ ] Tests

### Phase 4 : CRON Rattrapage

- [ ] CRON #3 : Rattraper PDF non vaultés
- [ ] Tests

---

## 🎯 Conclusion

### Verdict

**✅ SPEC VALIDE et IMPLÉMENTABLE**

**Justification** :
1. ✅ Cohérence avec architecture existante
2. ✅ Respect des principes fondateurs
3. ✅ Faisabilité technique démontrée
4. ✅ Impact maîtrisable (développement progressif)

### Priorité

**🟡 MOYENNE** — Amélioration traçabilité, pas critique

**Recommandation** :
- ✅ Implémenter après stabilisation de `invoice.posted`
- ✅ Approche progressive (Phase 1 → Phase 2 → Phase 3)
- ✅ Tests complets à chaque phase

### Effort Estimé

- **Phase 1 (Odoo)** : 2-3 jours
- **Phase 2 (DVIG)** : 1 jour
- **Phase 3 (Vault)** : 2-3 jours
- **Phase 4 (CRON)** : 0.5 jour
- **Tests** : 1-2 jours

**Total** : **6-9 jours** (1.5-2 semaines)

---

## 📚 Références

- **SPEC** : Document fourni par l'utilisateur
- **Architecture actuelle** : `units/odoo/custom-addons/dorevia_vault_connector/`
- **Analyse PDF** : `ZeDocs/TestV3/ANALYSE_REPORTS_PDF_FACTURES.md`

---

**Date** : 2026-01-12  
**Statut** : ✅ **ÉVALUATION COMPLÉTÉE**  
**Recommandation** : ✅ **IMPLÉMENTATION RECOMMANDÉE** (priorité moyenne)
