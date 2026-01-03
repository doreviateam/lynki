# 📦 Guide d'Installation — Module POS Payment Vault

**Date** : 2025-12-14  
**Module** : `dorevia_vault_pos_payment`  
**Version** : 1.0.0

---

## 📋 Vue d'ensemble

Le module complet pour la vue POS Payment Vault est disponible dans :
```
/opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT/
```

---

## 📁 Structure des Fichiers Créés

```
ODOO_MODULE_POS_PAYMENT_VAULT/
├── __init__.py                          # Point d'entrée du module
├── __manifest__.py                      # Manifest Odoo (dépendances, données, assets)
├── README.md                            # Documentation du module
├── models/
│   ├── __init__.py                      # Point d'entrée des modèles
│   └── pos_payment.py                   # Modèle avec champs et méthodes
├── views/
│   └── pos_payment_vault_views.xml      # Vue XML avec layout premium
└── static/
    └── src/
        └── css/
            └── vault_pos_payment_views.css  # Styles CSS premium
```

---

## 🚀 Installation

### Étape 1 : Copier le Module

```bash
# Depuis le dépôt Vault
cd /opt/dorevia-vault/docs

# Copier vers votre répertoire addons Odoo
cp -r ODOO_MODULE_POS_PAYMENT_VAULT /path/to/odoo/addons/dorevia_vault_pos_payment

# OU créer un lien symbolique (développement)
ln -s /opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT /path/to/odoo/addons/dorevia_vault_pos_payment
```

### Étape 2 : Installer les Dépendances Python

```bash
# Installer PyJWT (requis pour décoder les JWT)
pip install PyJWT

# OU avec pip3
pip3 install PyJWT
```

### Étape 3 : Configurer Odoo

1. **Mettre à jour la liste des modules** :
   - Odoo > Apps > Update Apps List

2. **Installer le module** :
   - Apps > Rechercher "Dorevia Vault POS Payment"
   - Cliquer sur "Install"

### Étape 4 : Configuration (Optionnel)

**Paramètre système** : `dorevia.vault.url`
- **Valeur par défaut** : `https://vault.doreviateam.com`
- **Configuration** : Paramètres > Technique > Paramètres Système

---

## ✅ Vérification de l'Installation

### Test 1 : Vérifier que le module est installé

```python
# Dans Odoo shell
self.env['ir.module.module'].search([('name', '=', 'dorevia_vault_pos_payment')]).state
# Doit retourner : 'installed'
```

### Test 2 : Vérifier que les champs sont présents

```python
# Dans Odoo shell
payment = self.env['pos.payment'].browse(1)  # Remplacer 1 par un ID existant
payment.vault_evidence_state  # Doit fonctionner
payment.vault_proof_url       # Doit fonctionner
```

### Test 3 : Vérifier que la vue est chargée

1. Ouvrir un paiement POS : `Point of Sale > Paiements`
2. Vérifier que l'onglet **"Vault"** est présent
3. Vérifier que le layout avec 3 cartes s'affiche

---

## 🔧 Utilisation

### Accéder à la Vue Vault

1. **Point of Sale** > **Paiements**
2. Ouvrir un paiement
3. Cliquer sur l'onglet **"Vault"**

### Actions Disponibles

- **Ouvrir la preuve** : Ouvre la preuve cryptographique dans un nouvel onglet
- **Copier** : Copie le lien de preuve dans le presse-papiers (avec notification)
- **Télécharger** : Télécharge la preuve
- **Voir le détail** : Affiche une notification pour voir l'audit technique

---

## 🐛 Dépannage

### Problème : Module non visible dans Apps

**Solution** :
1. Vérifier que le module est dans le répertoire `addons`
2. Vérifier les permissions : `chmod -R 755 dorevia_vault_pos_payment`
3. Mettre à jour la liste : Apps > Update Apps List
4. Vérifier les logs Odoo pour les erreurs

### Problème : Erreur "PyJWT not found"

**Solution** :
```bash
# Installer PyJWT
pip install PyJWT

# OU dans l'environnement Odoo
/path/to/odoo/venv/bin/pip install PyJWT
```

### Problème : Vue ne s'affiche pas

**Solution** :
1. Vérifier que le module `point_of_sale` est installé
2. Vérifier que la vue hérite correctement : `inherit_id="point_of_sale.view_pos_payment_form"`
3. Vérifier les logs Odoo pour les erreurs XML

### Problème : Boutons ne fonctionnent pas

**Solution** :
1. Vérifier que les méthodes Python sont présentes dans `models/pos_payment.py`
2. Redémarrer Odoo (recharger le module)
3. Vérifier les logs Odoo pour les erreurs Python

---

## 📚 Fichiers du Module

### 1. `__manifest__.py`

Définit :
- Nom, version, dépendances
- Fichiers de données (vues)
- Assets (CSS)
- Dépendances externes (PyJWT)

### 2. `models/pos_payment.py`

Contient :
- Tous les champs Vault
- Computed fields (`vault_proof_url`, `show_vault_audit`)
- Méthodes d'action (`action_open_proof`, `copy_proof_link`, etc.)

### 3. `views/pos_payment_vault_views.xml`

Contient :
- Vue qui hérite de `point_of_sale.view_pos_payment_form`
- Onglet "Vault" avec layout premium
- Bandeau synthèse + 3 cartes + Audit technique

### 4. `static/src/css/vault_pos_payment_views.css`

Contient :
- Styles pour les cartes
- Styles responsive
- Transitions et effets hover

---

## 🔄 Mise à Jour

### Mettre à jour le module

1. **Copier les nouveaux fichiers** :
```bash
cp -r ODOO_MODULE_POS_PAYMENT_VAULT/* /path/to/odoo/addons/dorevia_vault_pos_payment/
```

2. **Mettre à jour dans Odoo** :
   - Apps > Rechercher le module
   - Cliquer sur "Upgrade"

3. **Redémarrer Odoo** (si nécessaire)

---

## 📞 Support

En cas de problème :
1. Vérifier les logs Odoo
2. Vérifier que toutes les dépendances sont installées
3. Vérifier la configuration (`dorevia.vault.url`)
4. Consulter la documentation : `IMPLEMENTATION_VUE_POS_PAYMENT_VAULT.md`

---

**Fin du guide.**

