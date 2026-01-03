# 📌 Préconisation UX — Organisation des blocs « Dorevia Vault » (Paiement POS)

**Version** : v1.0 — 2025-12-14  
**Contexte** : Vue formulaire `account.payment` (POS / Paiements) — Onglet **Vault**  
**Objectif** : Recomposer les blocs pour une lecture *plus logique*, un rendu *plus premium*, et une cohérence *Charte UX Dorevia Vault Views*

---

## 1) Diagnostic — Ce qui ne marche pas

### Problèmes identifiés

1. **Hiérarchie visuelle faible** : "Conformité" est éclatée en mini-colonnes à gauche, tandis que "Preuve" et "Chaînage" sont des cartes à droite → on ne sait pas où regarder en premier.

2. **Déséquilibre de largeur / hauteur** : bloc Conformité très "plat", cartes à droite plus "denses" → impression de layout cassé.

3. **Trop d'espace mort** en haut de l'onglet Vault (avant le contenu), et manque d'alignement entre les 3 zones.

4. **CTA (Ouvrir la preuve)** présent mais pas au "bon endroit" dans le flux : on s'attend à un bandeau de statut + actions groupées.

5. **Audit technique** est "posé" sans structure (il mérite d'être un bloc plein largeur, repliable, en bas).

---

## 2) Layout Recommandé

### Principes

- **Bandeau de synthèse** en haut : statut + tenant + date de scellement (et éventuellement identifiants) → 1 coup d'œil.

- **3 cartes alignées** (même hauteur) juste en dessous :  
  **Conformité** | **Preuve** | **Chaînage**

- **Audit technique** en accordéon (plein largeur) en bas.

### Wireframe (desktop)

```
[ DOREVIA VAULT ]   [Badge Statut: Scellé]   Société • Tenant   Date de scellement

┌───────────────┬────────────────┬──────────────────────────┐
│ Conformité    │ Preuve         │ Chaînage cryptographique │
│ - État        │ - Preuve dispo │ - Ledger/Chain OK        │
│ - Date        │ [Ouvrir preuve]│ [Voir détail] (option)   │
│ - Société/Tnt │ (copy/download)│ hash tronqué (option)    │
└───────────────┴────────────────┴──────────────────────────┘

▼ Audit technique (replié)
```

### Variante responsive (mobile)

- Bandeau synthèse en haut (stack)
- Cartes en 1 colonne (Conformité → Preuve → Chaînage)
- Audit technique en bas

---

## 3) Contenu Exact des Cartes

### Carte 1 — Conformité (neutre)

- **État** : badge (Scellé / En attente / Échec)
- **Date de scellement**
- **Société / Tenant**
- *(Optionnel)* : Document type / Source (POS Payment)

> **But** : *informer*, pas "faire joli". C'est un résumé.

### Carte 2 — Preuve (succès)

- Titre : **Preuve**
- Statut : "Preuve disponible"
- **CTA primaire** : "Ouvrir la preuve"
- Actions secondaires (icônes) : copier l'ID, télécharger, ouvrir dans un nouvel onglet

### Carte 3 — Chaînage (info)

- Titre : **Chaînage cryptographique**
- Message court : "Garantie d'intégrité"
- *(Optionnel)* : `ledger_hash` tronqué (ex: `a91f…2c10`)
- *(Optionnel)* : CTA secondaire "Voir le détail" (ouvre l'accordéon audit + focus)

### Audit technique (accordéon)

- Identifiants Vault (vault_id, request_id)
- Hashes (payload_hash, file_hash, ledger_hash)
- JWKS kid / alg / timestamp
- Lien "Ouvrir la preuve brute" (JWS)
- Bloc erreurs si statut KO

---

## 4) Implémentation Odoo — Template XML Complet

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_account_payment_vault_form" model="ir.ui.view">
        <field name="name">Account Payment Vault Form (Premium Layout)</field>
        <field name="model">account.payment</field>
        <field name="arch" type="xml">
            <form string="Vault" class="o_form_view">
                <!-- HEADER : Badge état unique -->
                <header>
                    <field name="vault_evidence_state" 
                           widget="badge" 
                           decoration-success="vault_evidence_state == 'sealed'"
                           decoration-info="vault_evidence_state == 'pending'"
                           decoration-warning="vault_evidence_state == 'processing'"
                           decoration-danger="vault_evidence_state == 'error'"
                           options="{'text_map': {
                               'sealed': '✅ Scellé',
                               'pending': '⏳ En attente',
                               'processing': '🔄 En cours',
                               'error': '❌ Erreur'
                           }}"/>
                </header>
                
                <sheet>
                    <notebook>
                        <page string="Vault" name="vault">
                            <!-- Bandeau synthèse -->
                            <div class="dorevia_vault_band d-flex align-items-center justify-content-between mb-3" 
                                 style="padding: 16px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 24px;">
                                <div class="d-flex align-items-center gap-2">
                                    <i class="fa fa-lock text-muted" style="margin-right: 8px;"/>
                                    <strong style="font-size: 16px; color: #495057;">DOREVIA VAULT</strong>
                                    <field name="vault_evidence_state" 
                                           widget="badge"
                                           decoration-success="vault_evidence_state == 'sealed'"
                                           decoration-info="vault_evidence_state == 'pending'"
                                           decoration-warning="vault_evidence_state == 'processing'"
                                           decoration-danger="vault_evidence_state == 'error'"
                                           options="{'text_map': {
                                               'sealed': '✅ Scellé',
                                               'pending': '⏳ En attente',
                                               'processing': '🔄 En cours',
                                               'error': '❌ Erreur'
                                           }}"/>
                                </div>
                                <div class="text-muted small" style="font-size: 13px;">
                                    <span><field name="company_id" readonly="1"/></span>
                                    <span class="mx-2">•</span>
                                    <span>Tenant: <field name="vault_tenant" readonly="1"/></span>
                                    <span class="mx-2">•</span>
                                    <span>Scellé: <field name="vault_date" readonly="1"/></span>
                                </div>
                            </div>

                            <!-- 3 cartes alignées -->
                            <div class="row g-3" style="margin-bottom: 24px;">
                                <!-- Carte 1 : Conformité -->
                                <div class="col-12 col-lg-4">
                                    <div class="dorevia_card" style="border: 1px solid rgba(0,0,0,.08); border-radius: 12px; padding: 20px; background: #fff; height: 100%;">
                                        <div class="dorevia_card__title" style="font-weight: 600; font-size: 16px; margin-bottom: 16px; color: #495057;">
                                            Conformité
                                        </div>
                                        
                                        <div class="dorevia_kv" style="display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-top: 1px dashed rgba(0,0,0,.08);">
                                            <div class="dorevia_kv__k" style="color: rgba(0,0,0,.55); font-size: 13px;">État</div>
                                            <div class="dorevia_kv__v" style="font-weight: 500;">
                                                <field name="vault_evidence_state" 
                                                       widget="badge"
                                                       decoration-success="vault_evidence_state == 'sealed'"
                                                       decoration-info="vault_evidence_state == 'pending'"
                                                       decoration-warning="vault_evidence_state == 'processing'"
                                                       decoration-danger="vault_evidence_state == 'error'"
                                                       options="{'text_map': {
                                                           'sealed': '✅ Conforme',
                                                           'pending': '⏳ En attente',
                                                           'processing': '🔄 En cours',
                                                           'error': '❌ Erreur'
                                                       }}"/>
                                            </div>
                                        </div>
                                        
                                        <div class="dorevia_kv" style="display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-top: 1px dashed rgba(0,0,0,.08);">
                                            <div class="dorevia_kv__k" style="color: rgba(0,0,0,.55); font-size: 13px;">Date</div>
                                            <div class="dorevia_kv__v" style="font-weight: 500;">
                                                <field name="vault_date" readonly="1"/>
                                            </div>
                                        </div>
                                        
                                        <div class="dorevia_kv" style="display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-top: 1px dashed rgba(0,0,0,.08);">
                                            <div class="dorevia_kv__k" style="color: rgba(0,0,0,.55); font-size: 13px;">Société / Tenant</div>
                                            <div class="dorevia_kv__v" style="font-weight: 500; text-align: right;">
                                                <field name="company_id" readonly="1"/> — <field name="vault_tenant" readonly="1"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Carte 2 : Preuve -->
                                <div class="col-12 col-lg-4">
                                    <div class="dorevia_card dorevia_card--success" 
                                         style="border: 1px solid rgba(40,167,69,.2); border-radius: 12px; padding: 20px; background: rgba(40,167,69,.08); height: 100%;">
                                        <div class="dorevia_card__title" style="font-weight: 600; font-size: 16px; margin-bottom: 16px; color: #155724;">
                                            Preuve
                                        </div>
                                        
                                        <div class="text-muted mb-2" style="color: #666; margin-bottom: 16px; font-size: 14px;">
                                            <i class="fa fa-shield" style="margin-right: 8px; color: #28a745;"/>
                                            Preuve disponible
                                        </div>
                                        
                                        <button type="object" 
                                                name="action_open_proof" 
                                                class="btn btn-primary"
                                                style="width: 100%; padding: 12px 24px; font-size: 14px; border-radius: 6px; margin-bottom: 12px;">
                                            <i class="fa fa-external-link me-1" style="margin-right: 8px;"/>
                                            Ouvrir la preuve
                                        </button>
                                        
                                        <div class="mt-2 d-flex gap-2" style="display: flex; gap: 8px;">
                                            <button type="object" 
                                                    name="copy_proof_link" 
                                                    class="btn btn-light btn-sm"
                                                    title="Copier le lien de preuve"
                                                    style="flex: 1; padding: 8px 12px; border-radius: 6px;">
                                                <i class="fa fa-copy" style="margin-right: 4px;"/>
                                                Copier
                                            </button>
                                            <button type="object" 
                                                    name="action_download_proof" 
                                                    class="btn btn-light btn-sm"
                                                    title="Télécharger la preuve"
                                                    style="flex: 1; padding: 8px 12px; border-radius: 6px;">
                                                <i class="fa fa-download" style="margin-right: 4px;"/>
                                                Télécharger
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Carte 3 : Chaînage -->
                                <div class="col-12 col-lg-4">
                                    <div class="dorevia_card dorevia_card--info" 
                                         style="border: 1px solid rgba(13,110,253,.2); border-radius: 12px; padding: 20px; background: rgba(13,110,253,.08); height: 100%;">
                                        <div class="dorevia_card__title" style="font-weight: 600; font-size: 16px; margin-bottom: 16px; color: #0c5460;">
                                            Chaînage cryptographique
                                        </div>
                                        
                                        <div class="text-muted mb-2" style="color: #666; margin-bottom: 16px; font-size: 14px;">
                                            <i class="fa fa-link" style="margin-right: 8px; color: #17a2b8;"/>
                                            Garantie d'intégrité
                                        </div>
                                        
                                        <div class="small" style="font-size: 12px; margin-bottom: 12px; font-family: monospace; color: #495057;">
                                            Hash: <field name="vault_ledger_hash" readonly="1" 
                                                         attrs="{'invisible': [('vault_ledger_hash', '=', False)]}"
                                                         style="font-family: monospace; font-size: 11px;"/>
                                        </div>
                                        
                                        <button type="object" 
                                                name="action_focus_audit" 
                                                class="btn btn-outline-secondary btn-sm mt-2"
                                                style="width: 100%; padding: 8px 16px; border-radius: 6px; font-size: 13px;">
                                            <i class="fa fa-chevron-down" style="margin-right: 4px;"/>
                                            Voir le détail
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Audit technique (accordéon) -->
                            <div class="mt-3" style="margin-top: 24px;">
                                <group string="Audit technique" 
                                       class="dorevia_audit"
                                       style="padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;"
                                       attrs="{'invisible': [('show_vault_audit', '=', False)]}">
                                    <div class="o_row" style="margin-bottom: 16px;">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            Vault ID
                                        </label>
                                        <field name="vault_id" readonly="1" style="font-family: monospace; font-size: 12px;"/>
                                    </div>
                                    
                                    <div class="o_row" style="margin-bottom: 16px;">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            Request ID
                                        </label>
                                        <field name="vault_request_id" readonly="1" 
                                               attrs="{'invisible': [('vault_request_id', '=', False)]}"
                                               style="font-family: monospace; font-size: 12px;"/>
                                    </div>
                                    
                                    <div class="o_row" style="margin-bottom: 16px;">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            Payload Hash
                                        </label>
                                        <field name="vault_payload_hash" readonly="1" 
                                               attrs="{'invisible': [('vault_payload_hash', '=', False)]}"
                                               style="font-family: monospace; font-size: 12px;"/>
                                    </div>
                                    
                                    <div class="o_row" style="margin-bottom: 16px;">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            File Hash
                                        </label>
                                        <field name="vault_file_hash" readonly="1" 
                                               attrs="{'invisible': [('vault_file_hash', '=', False)]}"
                                               style="font-family: monospace; font-size: 12px;"/>
                                    </div>
                                    
                                    <div class="o_row" style="margin-bottom: 16px;">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            Ledger Hash
                                        </label>
                                        <field name="vault_ledger_hash" readonly="1" 
                                               attrs="{'invisible': [('vault_ledger_hash', '=', False)]}"
                                               style="font-family: monospace; font-size: 12px;"/>
                                    </div>
                                    
                                    <div class="o_row" style="margin-bottom: 16px;">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            JWS (Evidence)
                                        </label>
                                        <field name="vault_evidence_jws" readonly="1" widget="text"
                                               attrs="{'invisible': [('vault_evidence_jws', '=', False)]}"
                                               style="font-family: monospace; font-size: 11px;"/>
                                    </div>
                                    
                                    <div class="o_row" style="margin-bottom: 16px;">
                                        <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                            Dernière erreur
                                        </label>
                                        <field name="vault_last_error" readonly="1" widget="text"
                                               attrs="{'invisible': [('vault_last_error', '=', False)]}"
                                               style="color: #dc3545;"/>
                                    </div>
                                </group>
                            </div>
                        </page>
                    </notebook>
                </sheet>
            </form>
        </field>
    </record>
</odoo>
```

---

## 5) CSS Minimal (Optionnel)

**Fichier** : `static/src/css/vault_payment_views.css`

```css
/* Bandeau synthèse */
.dorevia_vault_band {
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 24px;
}

/* Cartes */
.dorevia_card {
    border: 1px solid rgba(0,0,0,.08);
    border-radius: 12px;
    padding: 20px;
    background: #fff;
    height: 100%;
    transition: box-shadow 0.2s;
}

.dorevia_card:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,.1);
}

.dorevia_card__title {
    font-weight: 600;
    font-size: 16px;
    margin-bottom: 16px;
    color: #495057;
}

.dorevia_card--success {
    background: rgba(40,167,69,.08);
    border-color: rgba(40,167,69,.2);
}

.dorevia_card--success .dorevia_card__title {
    color: #155724;
}

.dorevia_card--info {
    background: rgba(13,110,253,.08);
    border-color: rgba(13,110,253,.2);
}

.dorevia_card--info .dorevia_card__title {
    color: #0c5460;
}

/* Key-Value pairs */
.dorevia_kv {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px dashed rgba(0,0,0,.08);
}

.dorevia_kv:first-of-type {
    border-top: none;
}

.dorevia_kv__k {
    color: rgba(0,0,0,.55);
    font-size: 13px;
}

.dorevia_kv__v {
    font-weight: 500;
    text-align: right;
}

/* Audit technique */
.dorevia_audit {
    padding: 20px;
    background-color: #fff3cd;
    border-radius: 8px;
    border-left: 4px solid #ffc107;
}

/* Responsive */
@media (max-width: 992px) {
    .dorevia_vault_band {
        flex-direction: column;
        align-items: flex-start !important;
        gap: 12px;
    }
    
    .dorevia_card {
        margin-bottom: 16px;
    }
}
```

**Enregistrement dans `__manifest__.py`** :
```python
{
    'name': 'Dorevia Vault Payment Connector',
    'assets': {
        'web.assets_backend': [
            'dorevia_vault_payment/static/src/css/vault_payment_views.css',
        ],
    },
}
```

---

## 6) Décisions Produit (À Garder Stables)

- **Ordre** fixe : Conformité → Preuve → Chaînage → Audit.
- **1 CTA primaire** maximum dans l'onglet (ici : "Ouvrir la preuve").
- Les détails crypto doivent être **toujours** derrière "Audit technique" (sinon ça fait "outil d'ingé", pas "outil business").

---

## 7) Checklist de Validation

### Layout

- [ ] Les 3 cartes sont alignées et de même hauteur.
- [ ] Le bandeau synthèse donne l'état en 2 secondes.
- [ ] Le CTA "Ouvrir la preuve" est visible sans scroller.
- [ ] L'audit est présent mais non intrusif (repliable / en bas).

### Responsive

- [ ] Sur mobile, les cartes s'empilent verticalement.
- [ ] Le bandeau synthèse reste lisible sur petit écran.
- [ ] Les boutons restent accessibles.

### Cohérence

- [ ] Respecte la Charte UX Dorevia Vault Views v1.0.
- [ ] Badges et couleurs conformes aux standards.
- [ ] Espacement conforme aux recommandations.

---

## 8) Méthodes Python Requises

### Méthode `action_open_proof`

```python
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
```

### Méthode `action_focus_audit`

```python
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
```

---

## 📚 Références

- **Charte UX** : `CHARTE_UX_DOREVIA_VAULT_VIEWS.md`
- **Amélioration espacement** : `AMELIORATION_ESPACEMENT_UX_VAULT_VIEWS.md`
- **Réorganisation notebook** : `REORGANISATION_NOTEBOOK_VAULT_VIEWS.md`

---

**Fin du document.**

