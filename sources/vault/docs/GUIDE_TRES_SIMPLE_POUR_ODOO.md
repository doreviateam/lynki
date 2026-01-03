# 📖 Guide Très Simple — Pour Comprendre et Utiliser

**Date** : 2025-12-14

---

## 🎯 En 30 secondes : Qu'est-ce que j'ai fait ?

J'ai créé des **fichiers Odoo** qui ajoutent une **vue "Vault"** sur les paiements POS.

**Résultat** : Quand vous ouvrez un paiement POS dans Odoo, vous avez maintenant un nouvel onglet "Vault" avec une belle interface.

---

## 📦 Ce que j'ai créé (en détail)

### 1. Un dossier avec des fichiers Odoo

**Emplacement** :
```
/opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT/
```

**Contenu** :
- Des fichiers Python (la logique)
- Des fichiers XML (l'interface)
- Un fichier CSS (le style)
- Un fichier de configuration

**C'est un module Odoo standard**, prêt à être utilisé.

---

## 🚀 Comment l'utiliser ? (Étape par étape)

### Étape 1 : Trouver où sont vos modules Odoo

**Question** : Où Odoo cherche les modules ?

**Réponses possibles** :
- `/opt/odoo/addons/`
- `/usr/lib/python3/dist-packages/odoo/addons/`
- `/var/lib/odoo/addons/`

**Comment trouver** :
```bash
# Méthode 1 : Chercher dans la config Odoo
grep -r "addons_path" /etc/odoo/odoo.conf

# Méthode 2 : Dans Odoo
# Paramètres > Technique > Base de données > Liste des modules
# Regarder le chemin d'un module existant
```

**Exemple** : Si vous voyez `/opt/odoo/addons/account`, alors vos modules sont dans `/opt/odoo/addons/`

---

### Étape 2 : Copier le module

**Action** : Copier le dossier que j'ai créé dans votre répertoire addons Odoo.

**Commande** :
```bash
cp -r /opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT \
      /CHEMIN/VERS/VOS/ADDONS/dorevia_vault_pos_payment
```

**Exemple concret** :
```bash
# Si vos modules sont dans /opt/odoo/addons/
cp -r /opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT \
      /opt/odoo/addons/dorevia_vault_pos_payment
```

**Vérification** :
```bash
ls -la /opt/odoo/addons/dorevia_vault_pos_payment
# Doit afficher : __manifest__.py, models/, views/, etc.
```

---

### Étape 3 : Installer PyJWT

**Pourquoi ?** Le module a besoin de PyJWT pour décoder les tokens JWT.

**Commande** :
```bash
pip3 install PyJWT
```

**OU si Odoo utilise un environnement virtuel** :
```bash
# Trouver l'environnement virtuel Odoo
which odoo
# Exemple : /opt/odoo/venv/bin/odoo

# Installer dans cet environnement
/opt/odoo/venv/bin/pip install PyJWT
```

**Vérification** :
```bash
python3 -c "import jwt; print('OK')"
# Doit afficher : OK
```

---

### Étape 4 : Dans Odoo — Mettre à jour la liste

1. **Ouvrir Odoo** dans votre navigateur
2. Aller dans **Apps** (Applications)
3. Cliquer sur **"Update Apps List"** (Mettre à jour la liste des applications)
4. Attendre que ça se termine

**Pourquoi ?** Pour qu'Odoo découvre le nouveau module.

---

### Étape 5 : Dans Odoo — Installer le module

1. Dans **Apps**, rechercher : **"Dorevia Vault POS Payment"**
2. Cliquer sur le module trouvé
3. Cliquer sur **"Install"** (Installer)
4. Attendre que l'installation se termine

**C'est fait !** 🎉

---

## ✅ Vérifier que ça marche

### Test 1 : Voir l'onglet "Vault"

1. Aller dans **Point of Sale** > **Paiements**
2. Ouvrir un paiement (n'importe lequel)
3. **Vérifier** : Un nouvel onglet **"Vault"** doit apparaître

### Test 2 : Voir les 3 cartes

1. Cliquer sur l'onglet **"Vault"**
2. **Vérifier** : Vous devez voir :
   - Un bandeau en haut (avec "DOREVIA VAULT" et le statut)
   - 3 cartes alignées : Conformité | Preuve | Chaînage

### Test 3 : Tester un bouton

1. Si une preuve existe, cliquer sur **"Ouvrir la preuve"**
2. **Vérifier** : Une nouvelle fenêtre s'ouvre avec la preuve

---

## 🎨 À quoi ça ressemble ?

### Schéma simple

```
┌─────────────────────────────────────────────┐
│  Paiement POS #123                         │
├─────────────────────────────────────────────┤
│  [Onglet Info] [Onglet Paiement] [Vault] ← │
├─────────────────────────────────────────────┤
│                                             │
│  [🔒 DOREVIA VAULT] [✅ Scellé]            │
│  Société • Tenant • Date                    │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Conformité│ │ Preuve   │ │Chaînage  │   │
│  │          │ │          │ │          │   │
│  │ État: ✅ │ │[Ouvrir]   │ │ Hash: ...│   │
│  │ Date: .. │ │[Copier]   │ │          │   │
│  │ Société  │ │[Téléch.]  │ │          │   │
│  │ Tenant   │ │           │ │          │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## ❓ Questions et Réponses

### Q : "Je ne sais pas où sont mes modules Odoo"

**Solution** :
1. Ouvrir Odoo
2. Aller dans **Paramètres** > **Technique** > **Base de données** > **Liste des modules**
3. Regarder le chemin d'un module existant (ex: `/opt/odoo/addons/account`)
4. Utiliser ce chemin (sans le nom du module) : `/opt/odoo/addons/`

---

### Q : "Je ne peux pas copier (permission denied)"

**Solution** :
```bash
# Utiliser sudo
sudo cp -r /opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT \
           /opt/odoo/addons/dorevia_vault_pos_payment

# Puis corriger les permissions
sudo chown -R odoo:odoo /opt/odoo/addons/dorevia_vault_pos_payment
sudo chmod -R 755 /opt/odoo/addons/dorevia_vault_pos_payment
```

---

### Q : "Le module n'apparaît pas dans Apps"

**Solutions** :
1. Vérifier que le module est bien copié :
   ```bash
   ls -la /opt/odoo/addons/dorevia_vault_pos_payment
   ```

2. Vérifier le manifest :
   ```bash
   cat /opt/odoo/addons/dorevia_vault_pos_payment/__manifest__.py
   ```

3. Vérifier les permissions :
   ```bash
   chmod -R 755 /opt/odoo/addons/dorevia_vault_pos_payment
   ```

4. Redémarrer Odoo :
   ```bash
   sudo systemctl restart odoo
   ```

5. Mettre à jour la liste dans Odoo : **Apps > Update Apps List**

---

### Q : "J'ai une erreur Python"

**Vérifier les logs** :
```bash
# Logs Odoo
tail -f /var/log/odoo/odoo.log

# OU
journalctl -u odoo -f
```

**Erreur courante** : "No module named 'jwt'"
- **Solution** : `pip3 install PyJWT`

---

## 📋 Checklist Ultra-Simple

**Avant** :
- [ ] Je sais où sont mes modules Odoo
- [ ] J'ai les droits pour copier des fichiers

**Actions** :
- [ ] 1. Copier : `cp -r ... /addons/dorevia_vault_pos_payment`
- [ ] 2. Installer PyJWT : `pip3 install PyJWT`
- [ ] 3. Dans Odoo : Apps > Update Apps List
- [ ] 4. Dans Odoo : Installer "Dorevia Vault POS Payment"

**Vérification** :
- [ ] Ouvrir un paiement POS
- [ ] Voir l'onglet "Vault"
- [ ] Voir les 3 cartes

---

## 🎯 Résumé en 1 phrase

**J'ai créé un module Odoo que vous copiez dans votre installation, puis vous l'installez via l'interface Odoo pour avoir une vue "Vault" sur les paiements POS.**

---

## 💡 Si vous êtes bloqué

**Dites-moi** :
1. À quelle étape vous êtes bloqué
2. Quelle erreur vous voyez (si erreur)
3. Où se trouve votre Odoo (chemin)

**Je peux** :
- Adapter les commandes à votre configuration
- Créer un guide encore plus simple
- Vous aider étape par étape

---

**Fin du guide.**

