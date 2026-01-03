# 🎨 Charte UX Dorevia Vault Views — v1.0

**Date** : 2025-12-13  
**Version** : 1.0  
**Statut** : **OFFICIEL — DOCUMENT DE RÉFÉRENCE**  
**Applicabilité** : Toutes les vues vaultées Odoo 18 (factures, tickets POS, paiements, Z-Reports, etc.)

---

## 📋 Vue d'ensemble

Cette charte définit les **règles UX communes** pour toutes les vues vaultées dans Odoo 18, garantissant une expérience utilisateur **homogène, claire et premium** sur l'ensemble des modules Dorevia Vault.

### Portée

Cette charte s'applique à **toutes les vues vaultées** :
- ✅ Factures (`account.move` → Onglet "Vault")
- ✅ Tickets POS (`pos.order` → Onglet "Vault")
- ✅ Paiements (`account.payment` → Onglet "Vault")
- ✅ Z-Reports (`pos.session` → Onglet "Vault Z-Report")
- ✅ Toute future vue vaultée

### Objectifs

1. **Homogénéité** : Expérience identique sur toutes les vues vaultées
2. **Clarté** : Information immédiatement compréhensible
3. **Finition premium** : Détails soignés, pas de redondance
4. **Conformité** : Respect des standards Odoo 18 et des bonnes pratiques UX

---

## 🏗️ Structure standardisée des vues

### Hiérarchie des sections (ordre obligatoire)

Toutes les vues vaultées doivent suivre cette hiérarchie stricte :

```
┌─────────────────────────────────────┐
│ HEADER (Badge état + Actions)       │
├─────────────────────────────────────┤
│ 1. PREUVE (Preuve centrale)         │
│    - Lien de preuve                 │
│    - Bouton copier                  │
│    - Hash SHA-256                   │
│    - JWS (si disponible)            │
├─────────────────────────────────────┤
│ 2. CONFORMITÉ (État & validation)  │
│    - État (badge générique)         │
│    - Tenant                         │
│    - Date de vaultérisation        │
├─────────────────────────────────────┤
│ 3. CHAÎNAGE (Chaînage cryptographique)│
│    - Hash précédent                 │
│    - Hash suivant (si disponible)  │
│    - Ledger ID                      │
├─────────────────────────────────────┤
│ 4. AUDIT TECHNIQUE (Repliable)      │
│    - Tentatives (si pertinentes)    │
│    - Logs d'erreur                 │
│    - Métadonnées techniques        │
└─────────────────────────────────────┘
```

### Règle d'anti-redondance

> **Principe** : Une information importante ne doit apparaître qu'**une seule fois** dans la vue principale. Les répétitions sont tolérées uniquement dans la section "Audit technique" (repliable).

---

## 📐 Règles UX détaillées

### R1 — Header : Badge d'état unique

#### Règle

Le header affiche **un seul badge d'état** avec le terme fort approprié :
- `✅ Scellé` (pour `sealed`)
- `⏳ En attente` (pour `pending`)
- `🔄 En cours` (pour `processing`)
- `❌ Erreur` (pour `error`)

#### Implémentation

```xml
<!-- Header : Badge d'état unique -->
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
```

#### Interdictions

- ❌ Ne pas répéter le terme "Scellé" dans la section Conformité
- ❌ Ne pas utiliser plusieurs badges d'état dans le header

---

### R2 — Section Preuve : Bouton copier avec feedback

#### Règle

Le bouton de copie du lien de preuve doit :
1. Avoir un **tooltip explicite** : `Copier le lien de preuve`
2. Afficher un **feedback visuel** après clic : notification toast `Lien copié`
3. Être **masqué** si aucun lien de preuve n'est disponible

#### Implémentation

```xml
<!-- Section Preuve -->
<group string="Preuve" col="2">
    <field name="vault_proof_url" readonly="1"/>
    <button name="copy_proof_link" 
            type="object" 
            icon="fa-copy" 
            class="btn-secondary"
            title="Copier le lien de preuve"
            attrs="{'invisible': [('vault_proof_url', '=', False)]}"/>
    <field name="vault_hash_sha256" readonly="1" string="Hash SHA-256"/>
    <field name="vault_evidence_jws" readonly="1" widget="text" 
           attrs="{'invisible': [('vault_evidence_jws', '=', False)]}"/>
</group>
```

**Méthode Python** :
```python
def copy_proof_link(self):
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
    
    # Copier dans le presse-papiers
    action = {
        'type': 'ir.actions.clipboard',
        'value': self.vault_proof_url,
    }
    
    # Afficher une notification de confirmation
    return {
        'type': 'ir.actions.client',
        'tag': 'display_notification',
        'params': {
            'title': _('Lien copié'),
            'message': _('Le lien de preuve a été copié dans le presse-papiers.'),
            'type': 'success',
            'sticky': False,
        },
        'context': {'clipboard_action': action},
    }
```

#### Standards

- **Tooltip** : Toujours présent, texte explicite
- **Feedback** : Notification toast non-sticky (type: success)
- **Masquage** : Automatique si champ vide

---

### R3 — Section Conformité : Badge générique (pas de répétition)

#### Règle

La section Conformité affiche l'état avec un **badge générique** qui ne répète pas le terme utilisé dans le header.

#### Mapping des états

| État | Header | Conformité (État) |
|------|--------|-------------------|
| `sealed` | `✅ Scellé` | `✅ Conforme` |
| `pending` | `⏳ En attente` | `⏳ En attente` |
| `processing` | `🔄 En cours` | `🔄 En cours` |
| `error` | `❌ Erreur` | `❌ Erreur` |

#### Implémentation

```xml
<!-- Section Conformité -->
<group string="Conformité" col="2">
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
           }}"
           string="État"/>
    <field name="vault_tenant" readonly="1" string="Tenant"/>
    <field name="vault_date" readonly="1" string="Date de vaultérisation"/>
</group>
```

#### Interdictions

- ❌ Ne pas utiliser "Scellé" dans la section Conformité si le header affiche déjà "Scellé"
- ❌ Ne pas répéter le même terme exact dans header et conformité

---

### R4 — Section Chaînage : Affichage conditionnel

#### Règle

La section Chaînage affiche les informations de chaînage cryptographique uniquement si disponibles.

#### Implémentation

```xml
<!-- Section Chaînage -->
<group string="Chaînage cryptographique" 
       col="2"
       attrs="{'invisible': [
           ('vault_hash_prev', '=', False),
           ('vault_ledger_id', '=', False)
       ]}">
    <field name="vault_hash_prev" readonly="1" string="Hash précédent"
           attrs="{'invisible': [('vault_hash_prev', '=', False)]}"/>
    <field name="vault_hash_next" readonly="1" string="Hash suivant"
           attrs="{'invisible': [('vault_hash_next', '=', False)]}"/>
    <field name="vault_ledger_id" readonly="1" string="Ledger ID"
           attrs="{'invisible': [('vault_ledger_id', '=', False)]}"/>
</group>
```

---

### R5 — Section Audit technique : Masquage intelligent

#### Règle

La section "Audit technique" (ou "Tentatives") est **masquée par défaut** et affichée uniquement si :
1. L'état est non-succès (`pending`, `processing`, `error`)
2. OU il y a plus d'une tentative (cas anormal)
3. OU il y a des erreurs à afficher

#### Implémentation

**Option 1 : Masquage avec computed field (recommandé)**

```python
# models/[model].py
@api.depends('vault_evidence_state', 'vault_attempts', 'vault_last_error')
def _compute_show_vault_audit(self):
    for record in self:
        # Afficher si :
        # - État non-succès
        # - OU plus d'une tentative
        # - OU erreur présente
        record.show_vault_audit = (
            record.vault_evidence_state in ('pending', 'processing', 'error') or
            (record.vault_attempts or 0) > 1 or
            bool(record.vault_last_error)
        )

show_vault_audit = fields.Boolean(
    string="Afficher l'audit technique",
    compute='_compute_show_vault_audit',
    store=False,
)
```

```xml
<!-- Section Audit technique (repliable) -->
<notebook>
    <page string="Preuve" name="proof">
        <!-- Sections Preuve, Conformité, Chaînage -->
    </page>
    <page string="Audit technique" name="audit"
          attrs="{'invisible': [('show_vault_audit', '=', False)]}">
        <group string="Tentatives de vaultérisation" col="2">
            <field name="vault_attempts" readonly="1"/>
            <field name="vault_last_attempt_date" readonly="1"/>
            <field name="vault_last_error" readonly="1" widget="text"/>
        </group>
        <!-- Autres informations d'audit -->
    </page>
</notebook>
```

**Option 2 : Masquage direct (si pas de notebook)**

```xml
<group string="Tentatives de vaultérisation" 
       col="2"
       attrs="{'invisible': [
           '|',
           ('vault_evidence_state', '=', 'sealed'),
           ('vault_attempts', '<=', 1)
       ]}">
    <field name="vault_attempts" readonly="1"/>
    <field name="vault_last_attempt_date" readonly="1"/>
    <field name="vault_last_error" readonly="1" widget="text"/>
</group>
```

#### Standards

- **En succès (1 tentative)** : Section masquée
- **En erreur ou > 1 tentative** : Section visible
- **Format** : Repliable (notebook) si possible, sinon masquage conditionnel

---

## 🎨 Standards visuels

### Espacement (Anti-compacité)

**Problème** : Interface trop compacte, manque de respiration visuelle.

**Standards d'espacement** :

| Élément | Margin | Padding | Notes |
|---------|--------|---------|-------|
| **Sections principales** | `32px` (bottom) | - | Entre CONFORMITÉ, PREUVE, CHAÎNAGE |
| **Groupes** | `20px` (bottom) | `20px` | À l'intérieur des groupes |
| **Champs** | `20px` (bottom) | - | Entre chaque champ |
| **Labels** | `8px` (bottom) | - | Entre label et valeur |
| **Boîtes alert** | `16px` (bottom) | `24px` | Preuve et Chaînage |
| **Boutons** | `12px` (gap) | `12px 24px` | Entre boutons et padding interne |

**Exemple d'espacement** :
```xml
<!-- Espacement entre sections -->
<div class="o_row" style="margin: 32px 0;"/>

<!-- Groupe avec padding -->
<group string="CONFORMITÉ" col="2" style="padding: 20px; margin-bottom: 32px;">

<!-- Champ avec espacement -->
<div class="o_row" style="margin-bottom: 20px;">
    <label style="margin-bottom: 8px; display: block;">État Vault ?</label>
    <field name="vault_evidence_state"/>
</div>
```

**📚 Guide détaillé** : Voir `AMELIORATION_ESPACEMENT_UX_VAULT_VIEWS.md` pour un guide complet.

---

### Badges

#### Couleurs par état

| État | Couleur | Icône | Texte header | Texte conformité |
|------|---------|-------|--------------|------------------|
| `sealed` | `success` (vert) | `✅` | `Scellé` | `Conforme` |
| `pending` | `info` (bleu) | `⏳` | `En attente` | `En attente` |
| `processing` | `warning` (jaune) | `🔄` | `En cours` | `En cours` |
| `error` | `danger` (rouge) | `❌` | `Erreur` | `Erreur` |

#### Code XML standard

```xml
<field name="vault_evidence_state" 
       widget="badge" 
       decoration-success="vault_evidence_state == 'sealed'"
       decoration-info="vault_evidence_state == 'pending'"
       decoration-warning="vault_evidence_state == 'processing'"
       decoration-danger="vault_evidence_state == 'error'"/>
```

### Boutons

#### Bouton copier (standard)

```xml
<button name="copy_proof_link" 
        type="object" 
        icon="fa-copy" 
        class="btn-secondary"
        title="Copier le lien de preuve"
        attrs="{'invisible': [('vault_proof_url', '=', False)]}"/>
```

#### Bouton ouvrir preuve (standard)

```xml
<button name="action_open_proof" 
        type="object" 
        icon="fa-external-link" 
        class="btn-primary"
        title="Ouvrir la preuve dans le navigateur"
        attrs="{'invisible': [('vault_proof_url', '=', False)]}"/>
```

### Notifications

#### Format standard

```python
{
    'type': 'ir.actions.client',
    'tag': 'display_notification',
    'params': {
        'title': _('Titre'),
        'message': _('Message détaillé'),
        'type': 'success',  # success | warning | danger | info
        'sticky': False,     # Toujours False pour non-intrusif
    }
}
```

---

## 📋 Organisation du Notebook

### Ordre Logique des Onglets

**Principe** : Du plus important au moins important, du général au détaillé.

```
1. PREUVE (Principal)        → Information centrale, action principale
2. CONFORMITÉ                 → État et validation
3. CHAÎNAGE                   → Intégrité cryptographique
4. AUDIT TECHNIQUE (Repliable) → Détails techniques, tentatives
```

**📚 Guide détaillé** : Voir `REORGANISATION_NOTEBOOK_VAULT_VIEWS.md` pour la structure complète.

### Layout Premium (Paiements POS)

**Pour les paiements POS** (`account.payment` et `pos.payment`), un layout spécial avec **3 cartes alignées** est recommandé :

- **Bandeau synthèse** en haut (statut + tenant + date)
- **3 cartes alignées** : Conformité | Preuve | Chaînage
- **Audit technique** en accordéon en bas

**📚 Préconisation complète** : Voir `PRECONISATION_UX_PAIEMENTS_POS_VAULT.md` pour le template XML et CSS.

**📚 Implémentation POS Payment** : Voir `IMPLEMENTATION_VUE_POS_PAYMENT_VAULT.md` pour le code complet.

---

## 📋 Template XML complet

### Template de base (à adapter)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_[model]_vault_form" model="ir.ui.view">
        <field name="name">[Model] Vault Form</field>
        <field name="model">[model.name]</field>
        <field name="arch" type="xml">
            <form string="Vault">
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
                        <!-- ONGLET 1 : PREUVE (principal) -->
                        <page string="Preuve" name="proof">
                            <!-- Section Preuve -->
                            <group string="Preuve" col="2">
                                <field name="vault_proof_url" readonly="1" string="Lien de preuve"/>
                                <button name="copy_proof_link" 
                                        type="object" 
                                        icon="fa-copy" 
                                        class="btn-secondary"
                                        title="Copier le lien de preuve"
                                        attrs="{'invisible': [('vault_proof_url', '=', False)]}"/>
                                <button name="action_open_proof" 
                                        type="object" 
                                        icon="fa-external-link" 
                                        class="btn-primary"
                                        title="Ouvrir la preuve dans le navigateur"
                                        attrs="{'invisible': [('vault_proof_url', '=', False)]}"/>
                                <field name="vault_hash_sha256" readonly="1" string="Hash SHA-256"/>
                                <field name="vault_evidence_jws" readonly="1" widget="text" 
                                       string="JWS"
                                       attrs="{'invisible': [('vault_evidence_jws', '=', False)]}"/>
                            </group>
                            
                            <!-- Section Conformité -->
                            <group string="Conformité" col="2">
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
                                       }}"
                                       string="État"/>
                                <field name="vault_tenant" readonly="1" string="Tenant"/>
                                <field name="vault_date" readonly="1" string="Date de vaultérisation"/>
                            </group>
                            
                            <!-- Section Chaînage -->
                            <group string="Chaînage cryptographique" 
                                   col="2"
                                   attrs="{'invisible': [
                                       ('vault_hash_prev', '=', False),
                                       ('vault_ledger_id', '=', False)
                                   ]}">
                                <field name="vault_hash_prev" readonly="1" string="Hash précédent"
                                       attrs="{'invisible': [('vault_hash_prev', '=', False)]}"/>
                                <field name="vault_hash_next" readonly="1" string="Hash suivant"
                                       attrs="{'invisible': [('vault_hash_next', '=', False)]}"/>
                                <field name="vault_ledger_id" readonly="1" string="Ledger ID"
                                       attrs="{'invisible': [('vault_ledger_id', '=', False)]}"/>
                            </group>
                        </page>
                        
                        <!-- ONGLET 2 : AUDIT TECHNIQUE (repliable) -->
                        <page string="Audit technique" name="audit"
                              attrs="{'invisible': [('show_vault_audit', '=', False)]}">
                            <group string="Tentatives de vaultérisation" col="2">
                                <field name="vault_attempts" readonly="1"/>
                                <field name="vault_last_attempt_date" readonly="1"/>
                                <field name="vault_last_error" readonly="1" widget="text" 
                                       string="Dernière erreur"
                                       attrs="{'invisible': [('vault_last_error', '=', False)]}"/>
                            </group>
                            <!-- Autres informations d'audit -->
                        </page>
                    </notebook>
                </sheet>
            </form>
        </field>
    </record>
</odoo>
```

---

## ✅ Checklist de conformité

### Pour chaque nouvelle vue vaultée

- [ ] **R1** : Header avec badge d'état unique (terme fort)
- [ ] **R2** : Bouton copier avec tooltip + feedback
- [ ] **R3** : Section Conformité avec badge générique (pas de répétition)
- [ ] **R4** : Section Chaînage avec masquage conditionnel
- [ ] **R5** : Section Audit technique masquée en succès
- [ ] **Hiérarchie** : Ordre Preuve > Conformité > Chaînage > Audit respecté
- [ ] **Badges** : Couleurs et icônes conformes au standard
- [ ] **Notifications** : Format standard (non-sticky)
- [ ] **Tests** : Validation fonctionnelle effectuée

---

## 🧪 Tests de validation

### Test 10 secondes (utilisateur non-tech)

1. Ouvrir la vue vaultée
2. Demander : "Qu'est-ce que tu peux faire ici ?"
3. **Résultat attendu** : "Ouvrir la preuve" est cité immédiatement

### Test 30 secondes (utilisateur métier)

1. "Quelle société ? quel tenant ? à quelle date ?"
2. **Résultat attendu** : Réponse sans scroller et sans confusion

### Test anti-redondance

1. Vérifier que le terme "Scellé" n'apparaît qu'une fois (header)
2. Vérifier que la section Conformité affiche "Conforme" (ou équivalent)
3. **Résultat attendu** : Aucune répétition lourde

### Test feedback bouton copier

1. Survoler le bouton copier
2. Vérifier le tooltip : `Copier le lien de preuve`
3. Cliquer sur le bouton
4. Vérifier la notification : `Lien copié`
5. **Résultat attendu** : Tooltip + notification visibles

### Test masquage audit

1. Ouvrir un document avec état "Scellé" et 1 tentative
2. Vérifier que la section "Audit technique" est masquée
3. Ouvrir un document avec état "error"
4. Vérifier que la section "Audit technique" est visible
5. **Résultat attendu** : Masquage intelligent fonctionnel

---

## 📚 Références

### Documents associés

- **Spécification Z-Report** : `SPECIFICATION_UX_PREMIUM_VAULT_Z_REPORT.md` (exemple d'application)
- **API Vault** : Documentation endpoints `/api/v1/proof/*`
- **Odoo 18** : Documentation officielle Odoo 18

### Modules concernés

- `dorevia_vault_invoices` (factures)
- `dorevia_vault_pos_tickets` (tickets POS)
- `dorevia_vault_payments` (paiements)
- `dorevia_vault_pos_z_connector` (Z-Reports)
- Tous les futurs modules vaultés

---

## 🔄 Évolutions futures

### Version 1.1 (prévue)

- Support des thèmes sombres
- Amélioration de l'accessibilité (ARIA)
- Support des langues multiples (i18n)

### Version 2.0 (envisagée)

- Dashboard consolidé multi-documents
- Export PDF des preuves
- Intégration avec l'audit Vault

---

## 📝 Notes d'implémentation

### Compatibilité Odoo 18

- Utiliser `attrs` (pas `attrs` déprécié)
- Utiliser `widget="badge"` avec `options` pour les textes personnalisés
- Utiliser `display_notification` pour les toasts (Odoo 14+)

### Performance

- Les computed fields pour `show_vault_audit` ne sont pas stockés (store=False)
- Le tooltip utilise l'attribut natif `title` (pas de JavaScript supplémentaire)

### Accessibilité

- Le tooltip est accessible via l'attribut `title` (compatible lecteurs d'écran)
- Les notifications toast sont non-sticky pour ne pas bloquer l'interface
- Les badges utilisent des icônes Unicode pour la compatibilité

---

**Fin du document.**

**Statut** : ✅ **OFFICIEL — À APPLIQUER SUR TOUTES LES VUES VAULTÉES**

