# 📑 Réorganisation Notebook — Vues Vault (Odoo 18)

**Date** : 2025-12-13  
**Problème** : Agencement des blocs dans le notebook pas bien ordonné  
**Objectif** : Organiser les onglets de manière logique et hiérarchique

---

## 📋 Constat

L'organisation actuelle du notebook n'est pas optimale :
- ❌ Ordre des onglets peu logique
- ❌ Informations importantes dispersées
- ❌ Hiérarchie visuelle confuse
- ❌ Manque de cohérence entre les sections

---

## ✅ Organisation Recommandée

### Ordre Logique des Onglets

**Principe** : Du plus important au moins important, du général au détaillé.

```
1. PREUVE (Principal)        → Information centrale, action principale
2. CONFORMITÉ                 → État et validation
3. CHAÎNAGE                   → Intégrité cryptographique
4. AUDIT TECHNIQUE (Repliable) → Détails techniques, tentatives
```

---

## 📐 Structure Détaillée

### Onglet 1 : PREUVE (Principal)

**Objectif** : Information centrale et action principale (ouvrir la preuve)

**Contenu** :
- ✅ Boîte "Preuve disponible" avec bouton "Ouvrir la preuve"
- ✅ Bouton "Copier le lien"
- ✅ Hash SHA-256 (visible mais discret)
- ✅ JWS (masqué par défaut, accessible si besoin)

**Ordre des éléments** :
```xml
<page string="Preuve" name="proof">
    <!-- 1. Boîte principale : Preuve disponible -->
    <div class="alert alert-success">
        <strong>Preuve disponible</strong>
        <p>La preuve cryptographique est disponible.</p>
        <button>Ouvrir la preuve</button>
        <button>Copier</button>
    </div>
    
    <!-- 2. Informations techniques (repliable ou discret) -->
    <group string="Informations techniques" col="2" 
           attrs="{'invisible': [('show_technical_info', '=', False)]}">
        <field name="vault_hash_sha256" readonly="1" string="Hash SHA-256"/>
        <field name="vault_evidence_jws" readonly="1" widget="text" 
               attrs="{'invisible': [('vault_evidence_jws', '=', False)]}"/>
    </group>
</page>
```

---

### Onglet 2 : CONFORMITÉ

**Objectif** : État de vaultérisation et informations de conformité

**Contenu** :
- ✅ État (badge générique : "Conforme", pas "Scellé")
- ✅ Date de vaultérisation
- ✅ Société
- ✅ Tenant

**Ordre des éléments** :
```xml
<page string="Conformité" name="compliance">
    <group string="Conformité" col="2" style="padding: 20px;">
        <!-- 1. État (le plus important) -->
        <div class="o_row" style="margin-bottom: 20px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">
                État Vault ?
            </label>
            <field name="vault_evidence_state" widget="badge"
                   options="{'text_map': {'sealed': '✅ Conforme', ...}}"/>
        </div>
        
        <!-- 2. Date -->
        <div class="o_row" style="margin-bottom: 20px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">
                Date de scellement ?
            </label>
            <field name="vault_date" readonly="1"/>
        </div>
        
        <!-- 3. Société -->
        <div class="o_row" style="margin-bottom: 20px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">
                Société ?
            </label>
            <field name="vault_company" readonly="1"/>
        </div>
        
        <!-- 4. Tenant -->
        <div class="o_row" style="margin-bottom: 20px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">
                Tenant ?
            </label>
            <field name="vault_tenant" readonly="1"/>
        </div>
    </group>
</page>
```

---

### Onglet 3 : CHAÎNAGE CRYPTOGRAPHIQUE

**Objectif** : Informations de chaînage et intégrité

**Contenu** :
- ✅ Boîte explicative "Chaînage cryptographique — Garantie d'Intégrité"
- ✅ Hash précédent (si disponible)
- ✅ Hash suivant (si disponible)
- ✅ Ledger ID (si disponible)

**Ordre des éléments** :
```xml
<page string="Chaînage" name="chaining">
    <!-- 1. Boîte explicative -->
    <div class="alert alert-info" style="padding: 24px; margin-bottom: 24px;">
        <i class="fa fa-link"/>
        <strong>Chaînage cryptographique — Garantie d'Intégrité</strong>
        <p>Chaque document est lié au précédent par un hash cryptographique.</p>
    </div>
    
    <!-- 2. Informations de chaînage -->
    <group string="Chaînage cryptographique" col="2"
           attrs="{'invisible': [
               ('vault_hash_prev', '=', False),
               ('vault_ledger_id', '=', False)
           ]}">
        <div class="o_row" style="margin-bottom: 20px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">
                Hash précédent
            </label>
            <field name="vault_hash_prev" readonly="1"
                   attrs="{'invisible': [('vault_hash_prev', '=', False)]}"/>
        </div>
        
        <div class="o_row" style="margin-bottom: 20px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">
                Hash suivant
            </label>
            <field name="vault_hash_next" readonly="1"
                   attrs="{'invisible': [('vault_hash_next', '=', False)]}"/>
        </div>
        
        <div class="o_row" style="margin-bottom: 20px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">
                Ledger ID
            </label>
            <field name="vault_ledger_id" readonly="1"
                   attrs="{'invisible': [('vault_ledger_id', '=', False)]}"/>
        </div>
    </group>
</page>
```

---

### Onglet 4 : AUDIT TECHNIQUE (Repliable)

**Objectif** : Détails techniques et tentatives (masqué en succès)

**Contenu** :
- ✅ Tentatives de vaultérisation (si > 1 ou erreur)
- ✅ Dernière erreur (si présente)
- ✅ Métadonnées techniques

**Ordre des éléments** :
```xml
<page string="Audit technique" name="audit"
      attrs="{'invisible': [('show_vault_audit', '=', False)]}">
    <group string="Tentatives de vaultérisation" col="2">
        <div class="o_row" style="margin-bottom: 20px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">
                Nombre de tentatives
            </label>
            <field name="vault_attempts" readonly="1"/>
        </div>
        
        <div class="o_row" style="margin-bottom: 20px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">
                Dernière tentative
            </label>
            <field name="vault_last_attempt_date" readonly="1"/>
        </div>
        
        <div class="o_row" style="margin-bottom: 20px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">
                Dernière erreur
            </label>
            <field name="vault_last_error" readonly="1" widget="text"
                   attrs="{'invisible': [('vault_last_error', '=', False)]}"/>
        </div>
    </group>
</page>
```

---

## 📋 Template XML Complet Réorganisé

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_account_move_vault_form" model="ir.ui.view">
        <field name="name">Account Move Vault Form (Réorganisé)</field>
        <field name="model">account.move</field>
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
                        <!-- ONGLET 1 : PREUVE (Principal) -->
                        <page string="Preuve" name="proof">
                            <!-- Boîte principale : Preuve disponible -->
                            <div class="alert alert-success" 
                                 role="alert" 
                                 style="padding: 24px; margin-bottom: 24px; border-radius: 8px; border-left: 4px solid #28a745;">
                                <div style="margin-bottom: 16px;">
                                    <i class="fa fa-shield" style="margin-right: 8px; color: #28a745;"/>
                                    <strong style="font-size: 16px; color: #155724;">
                                        Preuve disponible
                                    </strong>
                                </div>
                                <p style="margin-bottom: 20px; color: #666; line-height: 1.6;">
                                    La preuve cryptographique est disponible.
                                </p>
                                <div style="display: flex; gap: 12px; align-items: center;">
                                    <button name="action_open_proof" 
                                            type="object" 
                                            class="btn btn-primary"
                                            style="padding: 12px 24px; font-size: 14px; border-radius: 6px;">
                                        <i class="fa fa-external-link" style="margin-right: 8px;"/>
                                        Ouvrir la preuve
                                    </button>
                                    <button name="copy_proof_link" 
                                            type="object" 
                                            class="btn btn-secondary"
                                            title="Copier le lien de preuve"
                                            style="padding: 10px 16px; border-radius: 6px;">
                                        <i class="fa fa-copy"/>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Informations techniques (discret, repliable) -->
                            <group string="Informations techniques" col="2"
                                   style="padding: 16px; background-color: #f8f9fa; border-radius: 8px;"
                                   attrs="{'invisible': [('show_technical_info', '=', False)]}">
                                <div class="o_row" style="margin-bottom: 16px;">
                                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #666; font-size: 13px;">
                                        Hash SHA-256
                                    </label>
                                    <field name="vault_hash_sha256" readonly="1" 
                                           style="font-family: monospace; font-size: 12px;"/>
                                </div>
                                <div class="o_row" style="margin-bottom: 16px;">
                                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #666; font-size: 13px;">
                                        JWS (Evidence)
                                    </label>
                                    <field name="vault_evidence_jws" readonly="1" widget="text"
                                           attrs="{'invisible': [('vault_evidence_jws', '=', False)]}"
                                           style="font-family: monospace; font-size: 11px;"/>
                                </div>
                            </group>
                        </page>
                        
                        <!-- ONGLET 2 : CONFORMITÉ -->
                        <page string="Conformité" name="compliance">
                            <group string="Conformité" col="2" 
                                   style="padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                                <!-- État (le plus important) -->
                                <div class="o_row" style="margin-bottom: 20px;">
                                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                        État Vault ?
                                    </label>
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
                                
                                <!-- Date -->
                                <div class="o_row" style="margin-bottom: 20px;">
                                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                        Date de scellement ?
                                    </label>
                                    <field name="vault_date" readonly="1"/>
                                </div>
                                
                                <!-- Société -->
                                <div class="o_row" style="margin-bottom: 20px;">
                                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                        Société ?
                                    </label>
                                    <field name="vault_company" readonly="1"/>
                                </div>
                                
                                <!-- Tenant -->
                                <div class="o_row" style="margin-bottom: 20px;">
                                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                        Tenant ?
                                    </label>
                                    <field name="vault_tenant" readonly="1"/>
                                </div>
                            </group>
                        </page>
                        
                        <!-- ONGLET 3 : CHAÎNAGE CRYPTOGRAPHIQUE -->
                        <page string="Chaînage" name="chaining">
                            <!-- Boîte explicative -->
                            <div class="alert alert-info" 
                                 role="alert" 
                                 style="padding: 24px; margin-bottom: 24px; border-radius: 8px; border-left: 4px solid #17a2b8;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                    <i class="fa fa-play" style="color: #17a2b8;"/>
                                    <i class="fa fa-link" style="color: #17a2b8;"/>
                                    <strong style="font-size: 16px; color: #0c5460;">
                                        Chaînage cryptographique — Garantie d'Intégrité
                                    </strong>
                                </div>
                                <p style="color: #666; line-height: 1.6; margin: 0;">
                                    Chaque document est lié au précédent par un hash cryptographique, garantissant l'intégrité de la chaîne.
                                </p>
                            </div>
                            
                            <!-- Informations de chaînage -->
                            <group string="Chaînage cryptographique" col="2"
                                   style="padding: 20px; background-color: #f8f9fa; border-radius: 8px;"
                                   attrs="{'invisible': [
                                       ('vault_hash_prev', '=', False),
                                       ('vault_ledger_id', '=', False)
                                   ]}">
                                <div class="o_row" style="margin-bottom: 20px;">
                                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                        Hash précédent
                                    </label>
                                    <field name="vault_hash_prev" readonly="1"
                                           attrs="{'invisible': [('vault_hash_prev', '=', False)]}"
                                           style="font-family: monospace; font-size: 12px;"/>
                                </div>
                                
                                <div class="o_row" style="margin-bottom: 20px;">
                                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                        Hash suivant
                                    </label>
                                    <field name="vault_hash_next" readonly="1"
                                           attrs="{'invisible': [('vault_hash_next', '=', False)]}"
                                           style="font-family: monospace; font-size: 12px;"/>
                                </div>
                                
                                <div class="o_row" style="margin-bottom: 20px;">
                                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                        Ledger ID
                                    </label>
                                    <field name="vault_ledger_id" readonly="1"
                                           attrs="{'invisible': [('vault_ledger_id', '=', False)]}"/>
                                </div>
                            </group>
                        </page>
                        
                        <!-- ONGLET 4 : AUDIT TECHNIQUE (Repliable) -->
                        <page string="Audit technique" name="audit"
                              attrs="{'invisible': [('show_vault_audit', '=', False)]}">
                            <group string="Tentatives de vaultérisation" col="2"
                                   style="padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                                <div class="o_row" style="margin-bottom: 20px;">
                                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                        Nombre de tentatives
                                    </label>
                                    <field name="vault_attempts" readonly="1"/>
                                </div>
                                
                                <div class="o_row" style="margin-bottom: 20px;">
                                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                        Dernière tentative
                                    </label>
                                    <field name="vault_last_attempt_date" readonly="1"/>
                                </div>
                                
                                <div class="o_row" style="margin-bottom: 20px;">
                                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                        Dernière erreur
                                    </label>
                                    <field name="vault_last_error" readonly="1" widget="text"
                                           attrs="{'invisible': [('vault_last_error', '=', False)]}"
                                           style="color: #dc3545;"/>
                                </div>
                            </group>
                        </page>
                    </notebook>
                </sheet>
            </form>
        </field>
    </record>
</odoo>
```

---

## 📊 Hiérarchie Visuelle

### Ordre d'Importance

1. **PREUVE** (Onglet 1)
   - Action principale : "Ouvrir la preuve"
   - Information centrale
   - Visible immédiatement

2. **CONFORMITÉ** (Onglet 2)
   - État de vaultérisation
   - Informations de contexte (Société, Tenant)
   - Validation

3. **CHAÎNAGE** (Onglet 3)
   - Intégrité cryptographique
   - Informations techniques avancées
   - Garantie d'intégrité

4. **AUDIT TECHNIQUE** (Onglet 4)
   - Détails techniques
   - Tentatives (masqué en succès)
   - Dépannage

---

## ✅ Avantages de cette Organisation

1. **Logique** : Du plus important au moins important
2. **Action principale visible** : "Ouvrir la preuve" en premier
3. **Hiérarchie claire** : Informations essentielles d'abord
4. **Masquage intelligent** : Audit technique masqué en succès
5. **Cohérence** : Même structure pour tous les modèles

---

## 📚 Références

- **Charte UX** : `CHARTE_UX_DOREVIA_VAULT_VIEWS.md`
- **Amélioration espacement** : `AMELIORATION_ESPACEMENT_UX_VAULT_VIEWS.md`

---

**Fin du document.**

