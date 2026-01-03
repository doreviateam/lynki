# 🎨 Amélioration Espacement UX — Vues Vault (Odoo 18)

**Date** : 2025-12-13  
**Problème** : Interface trop compacte, manque d'espacement  
**Objectif** : Rendre l'interface plus aérée et confortable à lire

---

## 📋 Constat

L'interface actuelle est **trop compacte** avec :
- ❌ Espacement insuffisant entre les sections
- ❌ Padding trop faible dans les boîtes
- ❌ Labels et valeurs trop proches
- ❌ Manque de respiration visuelle

---

## ✅ Solutions Proposées

### 1. Espacement entre les Sections

#### Avant (trop compact)
```xml
<group string="CONFORMITÉ" col="2">
    <!-- Contenu -->
</group>
<group string="PREUVE" col="2">
    <!-- Contenu -->
</group>
```

#### Après (plus aéré)
```xml
<!-- Section CONFORMITÉ -->
<group string="CONFORMITÉ" col="2" class="oe_read_only">
    <!-- Contenu -->
</group>

<!-- Espacement vertical -->
<div class="o_row" style="margin: 20px 0;"/>

<!-- Section PREUVE -->
<group string="PREUVE" col="2" class="oe_read_only">
    <!-- Contenu -->
</div>

<!-- Espacement vertical -->
<div class="o_row" style="margin: 20px 0;"/>

<!-- Section CHAÎNAGE -->
<group string="CHAÎNAGE CRYPTOGRAPHIQUE" col="2" class="oe_read_only">
    <!-- Contenu -->
</group>
```

**Recommandation** : Utiliser des `<div>` avec `margin: 20px 0` entre les sections principales.

---

### 2. Padding dans les Boîtes (Preuve et Chaînage)

#### Avant (trop compact)
```xml
<div class="alert alert-info" role="alert">
    <strong>Preuve disponible</strong>
    <p>La preuve cryptographique est disponible.</p>
    <button>Ouvrir la preuve</button>
</div>
```

#### Après (plus aéré)
```xml
<div class="alert alert-info" role="alert" style="padding: 24px; margin: 16px 0;">
    <div style="margin-bottom: 16px;">
        <strong style="font-size: 16px;">Preuve disponible</strong>
    </div>
    <p style="margin-bottom: 20px; color: #666;">La preuve cryptographique est disponible.</p>
    <button class="btn btn-primary" style="padding: 12px 24px; font-size: 14px;">
        Ouvrir la preuve
    </button>
</div>
```

**Recommandations** :
- Padding : `24px` (au lieu de `12px` par défaut)
- Margin bottom : `16px` entre les éléments
- Font-size : `16px` pour les titres, `14px` pour les boutons

---

### 3. Espacement dans les Groupes (Labels/Valeurs)

#### Avant (trop compact)
```xml
<group string="CONFORMITÉ" col="2">
    <field name="vault_evidence_state" string="État Vault ?"/>
    <field name="vault_date" string="Date de scellement ?"/>
</group>
```

#### Après (plus aéré)
```xml
<group string="CONFORMITÉ" col="2" class="oe_read_only">
    <div class="o_row" style="margin-bottom: 20px;">
        <label for="vault_evidence_state" string="État Vault ?" 
               style="font-weight: 600; margin-bottom: 8px; display: block;"/>
        <field name="vault_evidence_state" widget="badge"/>
    </div>
    <div class="o_row" style="margin-bottom: 20px;">
        <label for="vault_date" string="Date de scellement ?" 
               style="font-weight: 600; margin-bottom: 8px; display: block;"/>
        <field name="vault_date"/>
    </div>
</group>
```

**Recommandations** :
- Margin-bottom : `20px` entre chaque champ
- Label : `font-weight: 600` et `margin-bottom: 8px`
- Display block pour les labels

---

### 4. Template XML Complet avec Espacement Amélioré

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_account_move_vault_form" model="ir.ui.view">
        <field name="name">Account Move Vault Form (Aéré)</field>
        <field name="model">account.move</field>
        <field name="arch" type="xml">
            <form string="Vault" class="o_form_view">
                <sheet>
                    <!-- Section CONFORMITÉ -->
                    <div class="oe_title" style="margin-bottom: 24px;">
                        <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 0;">
                            CONFORMITÉ
                        </h2>
                    </div>
                    
                    <group string="" col="2" class="oe_read_only" 
                           style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 32px;">
                        <div class="o_row" style="margin-bottom: 20px;">
                            <label for="vault_evidence_state" 
                                   style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                État Vault ?
                            </label>
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
                        
                        <div class="o_row" style="margin-bottom: 20px;">
                            <label for="vault_date" 
                                   style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                Date de scellement ?
                            </label>
                            <field name="vault_date" readonly="1"/>
                        </div>
                        
                        <div class="o_row" style="margin-bottom: 20px;">
                            <label for="vault_company" 
                                   style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                Société ?
                            </label>
                            <field name="vault_company" readonly="1"/>
                        </div>
                        
                        <div class="o_row" style="margin-bottom: 20px;">
                            <label for="vault_tenant" 
                                   style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                                Tenant ?
                            </label>
                            <field name="vault_tenant" readonly="1"/>
                        </div>
                    </group>
                    
                    <!-- Section PREUVE -->
                    <div class="oe_title" style="margin-bottom: 24px;">
                        <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 0;">
                            PREUVE
                        </h2>
                    </div>
                    
                    <div class="alert alert-success" role="alert" 
                         style="padding: 24px; margin-bottom: 32px; border-radius: 8px; border-left: 4px solid #28a745;">
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
                    
                    <!-- Section CHAÎNAGE CRYPTOGRAPHIQUE -->
                    <div class="oe_title" style="margin-bottom: 24px;">
                        <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 0;">
                            CHAÎNAGE CRYPTOGRAPHIQUE
                        </h2>
                    </div>
                    
                    <div class="alert alert-info" role="alert" 
                         style="padding: 24px; margin-bottom: 32px; border-radius: 8px; border-left: 4px solid #17a2b8;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fa fa-play" style="color: #17a2b8;"/>
                            <i class="fa fa-link" style="color: #17a2b8;"/>
                            <strong style="font-size: 16px; color: #0c5460;">
                                Chaînage cryptographique — Garantie d'Intégrité
                            </strong>
                        </div>
                    </div>
                </sheet>
            </form>
        </field>
    </record>
</odoo>
```

---

## 📐 Standards d'Espacement Recommandés

### Marges et Padding

| Élément | Margin | Padding | Notes |
|---------|--------|---------|-------|
| **Sections principales** | `32px` (bottom) | - | Entre CONFORMITÉ, PREUVE, CHAÎNAGE |
| **Groupes** | `20px` (bottom) | `20px` | À l'intérieur des groupes |
| **Champs** | `20px` (bottom) | - | Entre chaque champ |
| **Labels** | `8px` (bottom) | - | Entre label et valeur |
| **Boîtes alert** | `16px` (bottom) | `24px` | Preuve et Chaînage |
| **Boutons** | `12px` (gap) | `12px 24px` | Entre boutons et padding interne |

### Tailles de Police

| Élément | Taille | Poids | Notes |
|---------|--------|-------|-------|
| **Titres de section** | `18px` | `600` | CONFORMITÉ, PREUVE, CHAÎNAGE |
| **Labels** | `14px` | `600` | État Vault ?, Date, etc. |
| **Valeurs** | `14px` | `400` | Valeurs des champs |
| **Boutons** | `14px` | `500` | Texte des boutons |
| **Descriptions** | `13px` | `400` | Textes explicatifs |

### Couleurs et Bordures

| Élément | Couleur | Bordure | Notes |
|---------|---------|---------|-------|
| **Groupe CONFORMITÉ** | `#f8f9fa` (fond) | `8px` radius | Fond gris clair |
| **Boîte PREUVE** | `#d4edda` (fond) | `4px solid #28a745` (gauche) | Vert clair |
| **Boîte CHAÎNAGE** | `#d1ecf1` (fond) | `4px solid #17a2b8` (gauche) | Bleu clair |
| **Labels** | `#495057` | - | Gris foncé |

---

## 🎨 Classes CSS Personnalisées (Optionnel)

Si vous voulez centraliser le style, créez un fichier CSS :

**Fichier** : `static/src/css/vault_views.css`

```css
/* Espacement sections */
.vault-section {
    margin-bottom: 32px;
}

.vault-section-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 24px;
}

/* Groupes */
.vault-group {
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 32px;
}

/* Champs */
.vault-field {
    margin-bottom: 20px;
}

.vault-label {
    font-weight: 600;
    margin-bottom: 8px;
    display: block;
    color: #495057;
}

/* Boîtes alert */
.vault-proof-box {
    padding: 24px;
    margin-bottom: 32px;
    border-radius: 8px;
    border-left: 4px solid #28a745;
}

.vault-chaining-box {
    padding: 24px;
    margin-bottom: 32px;
    border-radius: 8px;
    border-left: 4px solid #17a2b8;
}

/* Boutons */
.vault-button-primary {
    padding: 12px 24px;
    font-size: 14px;
    border-radius: 6px;
}

.vault-button-secondary {
    padding: 10px 16px;
    border-radius: 6px;
}
```

**Utilisation dans XML** :
```xml
<div class="vault-section">
    <h2 class="vault-section-title">CONFORMITÉ</h2>
    <group class="vault-group">
        <div class="vault-field">
            <label class="vault-label">État Vault ?</label>
            <field name="vault_evidence_state"/>
        </div>
    </group>
</div>
```

---

## ✅ Checklist d'Application

### Espacement

- [ ] Ajouter `margin-bottom: 32px` entre les sections principales
- [ ] Ajouter `padding: 20px` dans les groupes
- [ ] Ajouter `margin-bottom: 20px` entre les champs
- [ ] Ajouter `margin-bottom: 8px` entre labels et valeurs

### Boîtes (Preuve et Chaînage)

- [ ] Augmenter le padding à `24px`
- [ ] Ajouter `margin-bottom: 32px`
- [ ] Augmenter la taille des titres à `16px`
- [ ] Augmenter l'espacement entre les éléments (`16px`)

### Boutons

- [ ] Padding : `12px 24px` pour les boutons principaux
- [ ] Gap : `12px` entre les boutons
- [ ] Font-size : `14px`

### Typographie

- [ ] Titres de section : `18px`, `font-weight: 600`
- [ ] Labels : `14px`, `font-weight: 600`
- [ ] Valeurs : `14px`, `font-weight: 400`

---

## 📚 Références

- **Charte UX** : `CHARTE_UX_DOREVIA_VAULT_VIEWS.md`
- **Spécification UX Premium** : `SPECIFICATION_UX_PREMIUM_VAULT_Z_REPORT.md`

---

**Fin du document.**

