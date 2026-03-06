# 📦 Explication des modules Dorevia Odoo

**Date** : 2026-01-10  
**Version** : 1.0

---

## 📋 Vue d'ensemble

Les modules Dorevia Odoo sont des extensions personnalisées qui ajoutent des fonctionnalités spécifiques à la plateforme Dorevia, notamment pour la conformité comptable et l'intégration avec Dorevia Vault.

---

## 🔒 Module 1 : `dorevia_posted_lock`

### 📌 Rôle principal

**Verrouillage WORM-like des factures validées** pour garantir l'**immutabilité** des documents comptables.

### 🎯 Objectif

Conformément à la **Règle Fondatrice Dorevia #2** :
> "Tout document comptable à l'état POSTED est définitif et immuable.  
> Toute correction passe par un nouveau document comptable (annulation, avoir, contre-passation)."

### ✅ Fonctionnalités

1. **Blocage des modifications** :
   - Empêche toute modification de factures en état `posted`
   - Protège les champs critiques (montants, dates, partenaires, etc.)

2. **Blocage de la suppression** :
   - Empêche la suppression de factures `posted`

3. **Blocage du reset to draft** :
   - Désactive le bouton "Remettre en brouillon" pour les factures `posted`

4. **Protection des lignes de facture** :
   - Verrouille également les lignes de facture (`account.move.line`)

5. **Whitelist pour exceptions** :
   - Autorise la réconciliation (modifications techniques nécessaires)
   - Autorise le chatter/attachments (si configuré)

6. **Champ `dorevia_vaulted`** :
   - Indicateur visuel pour les factures vaultées
   - Si `dorevia_vaulted = True` : verrouillage renforcé (même chatter interdit)

### 📁 Structure

```
dorevia_posted_lock/
├── __manifest__.py
├── models/
│   ├── account_move.py          # Verrouillage account.move
│   └── account_move_line.py    # Verrouillage account.move.line
├── views/
│   └── account_move_views.xml  # Champ dorevia_vaulted + masquer button_draft
├── security/
│   └── ir.model.access.csv     # Permissions
└── data/
    └── ir_config_parameter.xml # Paramètres système
```

### 🔧 Fonctionnement technique

#### Surcharge de `write()`

```python
def write(self, vals):
    # Si lock activé et facture posted
    if self._is_lock_enabled() and self.state == 'posted':
        # Vérifier si champs protégés modifiés
        if self._has_protected_fields_modified(vals):
            # Bloquer la modification
            raise UserError("Facture posted : modification interdite")
    
    return super().write(vals)
```

#### Champs protégés

- Identité : `move_type`, `company_id`, `journal_id`
- Partenaire : `partner_id`, `commercial_partner_id`
- Dates : `invoice_date`, `invoice_date_due`, `date`
- Montants : `amount_untaxed`, `amount_tax`, `amount_total`
- Lignes : `line_ids`, `invoice_line_ids`
- Références : `ref`, `invoice_origin`, `name`

### 📊 Interface utilisateur

- **Champ "Vaulted?"** : Toggle visible dans la vue facture (lecture seule)
- **Bouton "Remettre en brouillon"** : Masqué pour les factures `posted`

### ⚙️ Configuration

**Paramètre système** : `dorevia.posted_lock.enabled` (par défaut : `True`)

**Bypass** : Contexte `skip_posted_lock=True` (pour migrations)

---

## 🔌 Module 2 : `dorevia_vault_connector`

### 📌 Rôle principal

**Connecteur automatique pour vaulting des factures vers Dorevia Vault via DVIG**.

### 🎯 Objectif

Vaultériser automatiquement toutes les factures validées vers Dorevia Vault pour :
- **Traçabilité** : Preuve d'existence horodatée
- **Conformité** : Archivage légal (PDP/PPF 2026)
- **Audit** : Historique immuable des événements financiers

### ✅ Fonctionnalités

1. **Vaulting automatique** :
   - Intercepte `action_post()` sur `account.move`
   - Vaultériser automatiquement après validation
   - Met à jour `dorevia_vaulted = True` après succès

2. **Vaulting manuel** :
   - Bouton "Vault" dans la vue facture
   - Permet de vaultériser manuellement une facture déjà postée

3. **Cron job de rattrapage** :
   - S'exécute toutes les 15 minutes
   - Rattrape les factures postées non vaultées
   - Limite : 50 factures par exécution

4. **Gestion d'erreurs** :
   - Ne bloque pas la validation si vaulting échoue
   - Log toutes les erreurs pour diagnostic
   - Retry automatique via cron

### 📁 Structure

```
dorevia_vault_connector/
├── __manifest__.py
├── models/
│   └── account_move.py          # Logique de vaulting
├── views/
│   └── account_move_views.xml  # Bouton "Vault"
├── data/
│   └── ir_cron.xml              # Cron job
└── security/
    └── ir.model.access.csv      # Permissions
```

### 🔧 Fonctionnement technique

#### 1. Vaulting automatique (`action_post()`)

```python
def action_post(self):
    # Valider la facture (méthode parente)
    result = super().action_post()
    
    # Vaultériser si conditions remplies
    for move in self:
        if self._should_vault(move):
            try:
                self._vault_to_dvig(move)
                move.write({'dorevia_vaulted': True})
            except Exception as e:
                _logger.error(f"Erreur vaulting: {e}")
                # Ne pas bloquer la validation
    
    return result
```

#### 2. Construction du payload DVIG

**Format P1** (ancien format) :
```json
{
  "event_type": "invoice.posted",
  "source": "odoo.stinger.sarl-la-platine",
  "timestamp": "2026-01-10T16:46:41.419000+00:00",
  "data": {
    "move_id": 1,
    "move_name": "FAC/2026/00001",
    "move_type": "out_invoice",
    "state": "posted",
    "amount_total": 30720.0,
    "currency_name": "EUR",
    ...
  }
}
```

#### 3. Envoi vers DVIG

```python
def _vault_to_dvig(self, move):
    # Construire payload
    payload = self._build_dvig_payload(move)
    
    # Récupérer config
    dvig_url = self.env['ir.config_parameter'].get_param('dorevia.dvig.url')
    dvig_token = self.env['ir.config_parameter'].get_param('dorevia.dvig.token')
    
    # Envoyer vers DVIG
    response = requests.post(
        f"{dvig_url}/ingest",
        json=payload,
        headers={"Authorization": f"Bearer {dvig_token}"}
    )
    response.raise_for_status()
```

#### 4. Cron job (`cron_vault_posted_invoices()`)

```python
@api.model
def cron_vault_posted_invoices(self):
    # Rechercher factures postées non vaultées
    invoices = self.search([
        ('state', '=', 'posted'),
        ('dorevia_vaulted', '=', False),
        ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund'])
    ], limit=50)
    
    # Vaultériser chaque facture
    for invoice in invoices:
        try:
            self._vault_to_dvig(invoice)
            invoice.write({'dorevia_vaulted': True})
        except Exception as e:
            _logger.error(f"Erreur: {e}")
```

### 📊 Interface utilisateur

- **Bouton "Vault"** : Visible dans la barre d'actions pour les factures `posted` non vaultées
- **Champ "Vaulted?"** : Mis à jour automatiquement après vaulting (via `dorevia_posted_lock`)

### ⚙️ Configuration requise

**Paramètres système** (Obligatoires) :

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `dorevia.dvig.url` | URL du DVIG | `https://dvig.core-stinger.doreviateam.com` |
| `dorevia.dvig.token` | Token Bearer | `dvig_HbQGNFHO5mWN6NY5ohUs6My0HVOZDpcL3KCZD_prJ9g` |
| `dorevia.dvig.source` | Source (format `unit.env.tenant`) | `odoo.stinger.sarl-la-platine` |

**Configuration** :
- Paramètres → Technique → Paramètres → Paramètres Système

### 🔄 Flux complet

```
1. Utilisateur valide une facture
   ↓
2. action_post() appelé
   ↓
3. dorevia_vault_connector intercepte
   ↓
4. Construit payload DVIG
   ↓
5. Envoie vers DVIG STINGER
   ↓
6. DVIG accepte et retourne event_id
   ↓
7. Met à jour dorevia_vaulted = True
   ↓
8. dorevia_posted_lock verrouille la facture
   ↓
9. ✅ Facture vaultée et protégée
```

---

## 🔗 Relation entre les modules

### Dépendance

```
dorevia_vault_connector
    ↓ dépend de
dorevia_posted_lock
    ↓ dépend de
account (module Odoo standard)
```

### Complémentarité

| Module | Rôle | Complément |
|--------|------|------------|
| `dorevia_posted_lock` | **Protection** | Verrouille les factures pour éviter les modifications |
| `dorevia_vault_connector` | **Vaulting** | Envoie les factures vers DVIG/Vault |

**Ensemble** : Les deux modules garantissent que les factures validées sont :
1. ✅ **Vaultées** (traçabilité)
2. ✅ **Verrouillées** (immutabilité)

### Champ `dorevia_vaulted`

- **Défini par** : `dorevia_posted_lock`
- **Mis à jour par** : `dorevia_vault_connector`
- **Utilisé par** : Les deux modules

**Rôle** :
- Indicateur visuel dans l'interface
- Verrouillage renforcé si `True` (même chatter interdit)

---

## 📊 Comparaison des modules

| Aspect | `dorevia_posted_lock` | `dorevia_vault_connector` |
|--------|----------------------|---------------------------|
| **Rôle** | Protection comptable | Intégration Vault |
| **Déclencheur** | `write()`, `unlink()`, `button_draft()` | `action_post()`, bouton "Vault", cron |
| **Action** | Bloque les modifications | Envoie vers DVIG |
| **Champ utilisé** | `dorevia_vaulted` (lecture) | `dorevia_vaulted` (écriture) |
| **Configuration** | Optionnelle (par défaut activé) | Obligatoire (DVIG URL, token, source) |
| **Dépendances externes** | Aucune | DVIG/Vault (réseau) |

---

## 🎯 Cas d'usage

### Scénario 1 : Validation normale

1. Utilisateur crée une facture
2. Utilisateur valide la facture (`action_post()`)
3. **`dorevia_vault_connector`** vaultériser automatiquement
4. **`dorevia_posted_lock`** verrouille la facture
5. ✅ Facture vaultée et protégée

### Scénario 2 : Rattrapage

1. Facture validée avant installation du module
2. **Cron job** détecte la facture non vaultée
3. **`dorevia_vault_connector`** vaultériser la facture
4. ✅ Facture rattrapée

### Scénario 3 : Tentative de modification

1. Utilisateur essaie de modifier une facture `posted`
2. **`dorevia_posted_lock`** bloque la modification
3. ❌ Erreur : "Facture posted : modification interdite"

### Scénario 4 : Vaulting manuel

1. Facture validée mais non vaultée (erreur réseau, etc.)
2. Utilisateur clique sur "Vault"
3. **`dorevia_vault_connector`** vaultériser manuellement
4. ✅ Facture vaultée

---

## 📝 Notes importantes

### Sécurité

- **Token DVIG** : Stocké dans `ir.config_parameter` (sensible)
- **Authentification** : Bearer Token dans header HTTP
- **Validation** : DVIG valide le token et la source

### Performance

- **Vaulting asynchrone** : Ne bloque pas la validation
- **Cron limité** : 50 factures par exécution (évite la surcharge)
- **Retry automatique** : Cron rattrape les échecs

### Idempotence

- **Event ID** : UUID unique par événement
- **DVIG** : Détecte les doublons (même event_id)
- **Odoo** : Vérifie `dorevia_vaulted` avant vaulting

---

## 🔍 Dépannage

### Le vaulting ne fonctionne pas

**Vérifications** :
1. ✅ Module `dorevia_vault_connector` installé
2. ✅ Paramètres `dorevia.dvig.*` configurés
3. ✅ Token DVIG valide
4. ✅ URL DVIG accessible
5. ✅ Logs Odoo pour erreurs détaillées

### La facture n'est pas verrouillée

**Vérifications** :
1. ✅ Module `dorevia_posted_lock` installé
2. ✅ Paramètre `dorevia.posted_lock.enabled = True`
3. ✅ Facture en état `posted`

---

## 📚 Documentation complémentaire

- `dorevia_posted_lock/README.md` : Documentation complète du module
- `dorevia_vault_connector/README.md` : Documentation du connecteur
- `RECAP_VAULTING_STINGER_SARL_LA_PLATINE.md` : Récapitulatif de l'implémentation

---

**Version** : 1.0  
**Date** : 2026-01-10
