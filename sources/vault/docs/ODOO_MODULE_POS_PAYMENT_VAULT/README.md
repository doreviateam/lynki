# 💳 Module Odoo — Dorevia Vault POS Payment

**Version** : 1.0.0  
**Odoo** : 18.0  
**Conformité** : Charte UX Dorevia Vault Views v1.0

---

## 📋 Description

Ce module ajoute une vue Vault premium pour les paiements POS (`pos.payment`) avec un layout à 3 cartes alignées :
- **Bandeau synthèse** en haut
- **3 cartes alignées** : Conformité | Preuve | Chaînage
- **Audit technique** en accordéon en bas

---

## 🚀 Installation

### 1. Copier le module

```bash
# Copier le dossier dans votre addons Odoo
cp -r ODOO_MODULE_POS_PAYMENT_VAULT /path/to/odoo/addons/dorevia_vault_pos_payment
```

### 2. Installer les dépendances Python

```bash
pip install PyJWT
```

### 3. Mettre à jour la liste des modules Odoo

```bash
# Dans Odoo
Apps > Update Apps List
```

### 4. Installer le module

```bash
# Dans Odoo
Apps > Rechercher "Dorevia Vault POS Payment" > Installer
```

---

## ⚙️ Configuration

### Paramètre système

**Clé** : `dorevia.vault.url`  
**Valeur** : `https://vault.doreviateam.com` (par défaut)

**Configuration** :
```
Paramètres > Technique > Paramètres Système
```

---

## 📐 Structure du Module

```
dorevia_vault_pos_payment/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   └── pos_payment.py
├── views/
│   └── pos_payment_vault_views.xml
├── static/
│   └── src/
│       └── css/
│           └── vault_pos_payment_views.css
└── README.md
```

---

## 🔧 Utilisation

### Vue Vault

1. Ouvrir un paiement POS (`Point of Sale > Paiements`)
2. Cliquer sur l'onglet **"Vault"**
3. Voir le bandeau synthèse avec le statut
4. Consulter les 3 cartes : Conformité | Preuve | Chaînage
5. Cliquer sur "Ouvrir la preuve" pour accéder à la preuve cryptographique

### Actions Disponibles

- **Ouvrir la preuve** : Ouvre la preuve dans un nouvel onglet
- **Copier** : Copie le lien de preuve dans le presse-papiers
- **Télécharger** : Télécharge la preuve
- **Voir le détail** : Focus sur l'audit technique

---

## 📚 Documentation

- **Charte UX** : `docs/CHARTE_UX_DOREVIA_VAULT_VIEWS.md`
- **Préconisation UX** : `docs/PRECONISATION_UX_PAIEMENTS_POS_VAULT.md`
- **Implémentation** : `docs/IMPLEMENTATION_VUE_POS_PAYMENT_VAULT.md`

---

## ✅ Checklist de Déploiement

- [ ] Module copié dans `/addons/dorevia_vault_pos_payment`
- [ ] PyJWT installé (`pip install PyJWT`)
- [ ] Module installé dans Odoo
- [ ] Paramètre `dorevia.vault.url` configuré
- [ ] Test avec un paiement POS vaulté
- [ ] Vérification du layout (3 cartes alignées)
- [ ] Test des boutons (Ouvrir, Copier, Télécharger)

---

**Fin du README.**

