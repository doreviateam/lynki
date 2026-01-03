# 📖 Explication Simple — Module Odoo POS Payment Vault

**Date** : 2025-12-14

---

## 🎯 Ce que j'ai créé

J'ai créé un **module Odoo complet** qui ajoute une vue "Vault" pour les paiements POS.

### 📁 Où se trouve le module ?

```
/opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT/
```

Ce dossier contient tous les fichiers nécessaires pour un module Odoo.

---

## 🔍 Qu'est-ce qu'un module Odoo ?

Un module Odoo est un **dossier avec des fichiers** que vous copiez dans votre installation Odoo pour ajouter des fonctionnalités.

### Structure simple :

```
dorevia_vault_pos_payment/     ← Nom du module
├── __manifest__.py            ← Fichier de configuration
├── models/                    ← Code Python (logique)
│   └── pos_payment.py
├── views/                     ← Fichiers XML (interface)
│   └── pos_payment_vault_views.xml
└── static/                    ← Fichiers CSS (styles)
    └── css/
        └── vault_pos_payment_views.css
```

---

## 🚀 Comment l'utiliser ? (3 étapes simples)

### Étape 1 : Copier le module dans Odoo

**Où copier ?**  
Dans le répertoire où Odoo cherche les modules (généralement `/opt/odoo/addons/` ou `/usr/lib/python3/dist-packages/odoo/addons/`)

**Commande** :
```bash
cp -r /opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT \
      /path/to/odoo/addons/dorevia_vault_pos_payment
```

**Exemple concret** :
```bash
# Si votre Odoo est dans /opt/odoo/addons/
cp -r /opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT \
      /opt/odoo/addons/dorevia_vault_pos_payment
```

---

### Étape 2 : Installer PyJWT (une seule fois)

**Pourquoi ?**  
Le module a besoin de PyJWT pour décoder les JWT (tokens de preuve).

**Commande** :
```bash
pip3 install PyJWT
```

**OU si vous utilisez un environnement virtuel Odoo** :
```bash
/path/to/odoo/venv/bin/pip install PyJWT
```

---

### Étape 3 : Installer le module dans Odoo

**Dans l'interface Odoo** :

1. Aller dans **Apps** (Applications)
2. Cliquer sur **"Update Apps List"** (Mettre à jour la liste)
3. Rechercher **"Dorevia Vault POS Payment"**
4. Cliquer sur **"Install"** (Installer)

**C'est tout !** 🎉

---

## 📸 À quoi ça ressemble ?

### Avant (sans le module)

Quand vous ouvrez un paiement POS, vous voyez :
- Onglet "Informations"
- Onglet "Paiement"
- etc.

### Après (avec le module)

Quand vous ouvrez un paiement POS, vous voyez maintenant :
- Onglet "Informations"
- Onglet "Paiement"
- **Onglet "Vault"** ← **NOUVEAU !**

Dans l'onglet "Vault", vous voyez :
- **Bandeau en haut** : Statut (Scellé, En attente, etc.) + Tenant + Date
- **3 cartes alignées** :
  - Carte 1 : **Conformité** (État, Date, Société, Tenant)
  - Carte 2 : **Preuve** (Bouton "Ouvrir la preuve", Copier, Télécharger)
  - Carte 3 : **Chaînage** (Hash, Ledger)
- **Audit technique** en bas (masqué si tout va bien)

---

## 🎨 Exemple Visuel

```
┌─────────────────────────────────────────────────────────┐
│ [🔒 DOREVIA VAULT] [✅ Scellé]  Société • Tenant • Date │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Conformité  │  │   Preuve    │  │  Chaînage   │     │
│  │             │  │             │  │             │     │
│  │ État: ✅    │  │ [Ouvrir]    │  │ Hash: ...   │     │
│  │ Date: ...   │  │ [Copier]    │  │             │     │
│  │ Société: .. │  │ [Téléch.]   │  │             │     │
│  │ Tenant: ... │  │             │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Audit technique (masqué si tout va bien)       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## ❓ Questions Fréquentes

### Q1 : Où trouver le chemin des addons Odoo ?

**Méthode 1** : Regarder la configuration Odoo
```bash
# Chercher dans la configuration
grep -r "addons_path" /etc/odoo/odoo.conf
# OU
grep -r "addons_path" ~/.odoorc
```

**Méthode 2** : Chercher dans Odoo
- Paramètres > Technique > Paramètres Système
- Chercher `web.base.url` ou regarder les chemins de modules

**Méthode 3** : Emplacements courants
- `/opt/odoo/addons/`
- `/usr/lib/python3/dist-packages/odoo/addons/`
- `/var/lib/odoo/addons/`

---

### Q2 : Comment savoir si ça marche ?

**Test simple** :
1. Ouvrir un paiement POS dans Odoo
2. Vérifier qu'un onglet **"Vault"** apparaît
3. Cliquer dessus
4. Voir les 3 cartes (Conformité, Preuve, Chaînage)

**Si l'onglet n'apparaît pas** :
- Vérifier que le module est installé (Apps > rechercher)
- Vérifier les logs Odoo pour les erreurs
- Vérifier que PyJWT est installé

---

### Q3 : Que faire si j'ai une erreur ?

**Erreur "Module not found"** :
- Vérifier que le module est bien copié dans le bon répertoire
- Vérifier les permissions : `chmod -R 755 /path/to/module`

**Erreur "PyJWT not found"** :
- Installer : `pip3 install PyJWT`

**Erreur dans la vue** :
- Vérifier les logs Odoo : `tail -f /var/log/odoo/odoo.log`
- Vérifier que le module `point_of_sale` est installé

---

## 📋 Checklist Simple

Avant de commencer :
- [ ] Je sais où se trouve le répertoire addons de mon Odoo
- [ ] J'ai les droits pour copier des fichiers dans ce répertoire
- [ ] Je peux installer des packages Python (pip3)

Étapes :
- [ ] 1. Copier le module : `cp -r ... /path/to/odoo/addons/`
- [ ] 2. Installer PyJWT : `pip3 install PyJWT`
- [ ] 3. Dans Odoo : Apps > Update Apps List
- [ ] 4. Dans Odoo : Installer "Dorevia Vault POS Payment"
- [ ] 5. Tester : Ouvrir un paiement POS > Onglet "Vault"

---

## 🎯 Résumé en 1 phrase

**J'ai créé un module Odoo que vous copiez dans votre installation Odoo, puis vous l'installez via l'interface Odoo pour avoir une belle vue "Vault" sur les paiements POS.**

---

## 📞 Besoin d'aide ?

Si quelque chose n'est pas clair :
1. Dites-moi quelle étape pose problème
2. Je peux créer un guide encore plus détaillé
3. Je peux adapter les fichiers à votre configuration

---

**Fin de l'explication.**

