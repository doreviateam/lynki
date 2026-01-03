# 🚀 Guide de Déploiement Complet — Module POS Payment Vault

**Date** : 2025-12-14  
**Module** : `dorevia_vault_pos_payment`  
**Version** : 1.0.0

---

## 📋 Vue d'ensemble

Ce guide vous accompagne étape par étape pour déployer le module Dorevia Vault POS Payment dans votre instance Odoo.

---

## 🎯 Méthodes de Déploiement

### Méthode 1 : Script Automatique (Recommandé)

**Avantages** :
- ✅ Automatique
- ✅ Vérifie les prérequis
- ✅ Configure les permissions

**Commande** :
```bash
cd /opt/dorevia-vault/docs
./SCRIPT_DEPLOIEMENT_ODOO_POS_PAYMENT.sh /path/to/odoo/addons
```

**Exemple** :
```bash
./SCRIPT_DEPLOIEMENT_ODOO_POS_PAYMENT.sh /opt/odoo/addons
```

---

### Méthode 2 : Déploiement Manuel

#### Étape 1 : Copier le Module

```bash
# Depuis le dépôt Vault
cd /opt/dorevia-vault/docs

# Copier vers votre répertoire addons Odoo
cp -r ODOO_MODULE_POS_PAYMENT_VAULT /path/to/odoo/addons/dorevia_vault_pos_payment

# OU créer un lien symbolique (développement)
ln -s /opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT /path/to/odoo/addons/dorevia_vault_pos_payment
```

#### Étape 2 : Définir les Permissions

```bash
chmod -R 755 /path/to/odoo/addons/dorevia_vault_pos_payment
find /path/to/odoo/addons/dorevia_vault_pos_payment -type f -exec chmod 644 {} \;
```

#### Étape 3 : Installer PyJWT

```bash
# Installer PyJWT (requis pour décoder les JWT)
pip3 install PyJWT

# OU dans l'environnement virtuel Odoo
/path/to/odoo/venv/bin/pip install PyJWT
```

#### Étape 4 : Configurer Odoo

1. **Redémarrer Odoo** (si nécessaire)
2. **Mettre à jour la liste des modules** :
   - Odoo > Apps > Update Apps List
3. **Installer le module** :
   - Apps > Rechercher "Dorevia Vault POS Payment"
   - Cliquer sur "Install"

---

## ⚙️ Configuration Post-Installation

### Paramètre Système (Optionnel)

**Clé** : `dorevia.vault.url`  
**Valeur** : `https://vault.doreviateam.com` (par défaut)

**Configuration** :
1. Odoo > Paramètres > Technique > Paramètres Système
2. Créer un nouveau paramètre :
   - **Clé** : `dorevia.vault.url`
   - **Valeur** : `https://vault.doreviateam.com`
3. Sauvegarder

**OU via SQL** :
```sql
INSERT INTO ir_config_parameter (key, value, create_date, write_date)
VALUES ('dorevia.vault.url', 'https://vault.doreviateam.com', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## ✅ Vérification du Déploiement

### Test 1 : Vérifier que le Module est Installé

**Via Interface Odoo** :
1. Apps > Rechercher "Dorevia Vault POS Payment"
2. Vérifier que le statut est "Installed"

**Via Shell Odoo** :
```python
# Dans Odoo shell
self.env['ir.module.module'].search([('name', '=', 'dorevia_vault_pos_payment')]).state
# Doit retourner : 'installed'
```

### Test 2 : Vérifier les Champs

**Via Shell Odoo** :
```python
# Dans Odoo shell
payment = self.env['pos.payment'].browse(1)  # Remplacer 1 par un ID existant
print(payment.vault_evidence_state)  # Doit fonctionner
print(payment.vault_proof_url)       # Doit fonctionner
```

### Test 3 : Vérifier la Vue

1. **Point of Sale** > **Paiements**
2. Ouvrir un paiement
3. Vérifier que l'onglet **"Vault"** est présent
4. Vérifier que le layout avec 3 cartes s'affiche

### Test 4 : Tester les Actions

1. Cliquer sur **"Ouvrir la preuve"** → Doit ouvrir la preuve dans un nouvel onglet
2. Cliquer sur **"Copier"** → Doit afficher une notification "Lien copié"
3. Cliquer sur **"Télécharger"** → Doit télécharger la preuve

---

## 🐛 Dépannage

### Problème : Module non visible dans Apps

**Causes possibles** :
- Module pas dans le bon répertoire
- Permissions incorrectes
- Erreur dans le manifest

**Solutions** :
```bash
# 1. Vérifier l'emplacement
ls -la /path/to/odoo/addons/dorevia_vault_pos_payment

# 2. Vérifier les permissions
chmod -R 755 /path/to/odoo/addons/dorevia_vault_pos_payment

# 3. Vérifier le manifest
cat /path/to/odoo/addons/dorevia_vault_pos_payment/__manifest__.py

# 4. Vérifier les logs Odoo
tail -f /var/log/odoo/odoo.log | grep -i "dorevia_vault_pos_payment"
```

### Problème : Erreur "PyJWT not found"

**Solution** :
```bash
# Installer PyJWT
pip3 install PyJWT

# OU dans l'environnement Odoo
/path/to/odoo/venv/bin/pip install PyJWT

# Vérifier l'installation
python3 -c "import jwt; print('PyJWT OK')"
```

### Problème : Vue ne s'affiche pas

**Causes possibles** :
- Module `point_of_sale` non installé
- Erreur dans la vue XML
- Cache Odoo

**Solutions** :
```bash
# 1. Vérifier que point_of_sale est installé
# Dans Odoo: Apps > Rechercher "Point of Sale" > Vérifier "Installed"

# 2. Vérifier la vue XML
cat /path/to/odoo/addons/dorevia_vault_pos_payment/views/pos_payment_vault_views.xml

# 3. Vider le cache Odoo
# Dans Odoo: Paramètres > Technique > Base de données > Vider le cache
```

### Problème : Boutons ne fonctionnent pas

**Causes possibles** :
- Méthodes Python absentes
- Erreur dans les méthodes
- Module non rechargé

**Solutions** :
```bash
# 1. Vérifier les méthodes
grep -n "def action_open_proof" /path/to/odoo/addons/dorevia_vault_pos_payment/models/pos_payment.py

# 2. Vérifier les logs Odoo
tail -f /var/log/odoo/odoo.log | grep -i "error\|traceback"

# 3. Redémarrer Odoo
sudo systemctl restart odoo
# OU
sudo service odoo restart
```

---

## 📊 Checklist de Déploiement

### Pré-déploiement

- [ ] Odoo 18.0 installé et fonctionnel
- [ ] Module `point_of_sale` installé
- [ ] Accès au répertoire addons Odoo
- [ ] Permissions d'écriture sur le répertoire addons

### Déploiement

- [ ] Module copié dans `/addons/dorevia_vault_pos_payment`
- [ ] Permissions définies (755 pour dossiers, 644 pour fichiers)
- [ ] PyJWT installé (`pip3 install PyJWT`)
- [ ] Odoo redémarré (si nécessaire)

### Post-déploiement

- [ ] Liste des modules mise à jour (Apps > Update Apps List)
- [ ] Module installé (Apps > Install)
- [ ] Paramètre `dorevia.vault.url` configuré (optionnel)
- [ ] Vue Vault visible dans un paiement POS
- [ ] Boutons fonctionnels (Ouvrir, Copier, Télécharger)

---

## 🔄 Mise à Jour du Module

### Mettre à jour vers une nouvelle version

```bash
# 1. Sauvegarder les données (si modifications personnalisées)
cp -r /path/to/odoo/addons/dorevia_vault_pos_payment /path/to/backup/

# 2. Copier la nouvelle version
cp -r /opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT/* \
      /path/to/odoo/addons/dorevia_vault_pos_payment/

# 3. Redéfinir les permissions
chmod -R 755 /path/to/odoo/addons/dorevia_vault_pos_payment

# 4. Mettre à jour dans Odoo
# Apps > Rechercher le module > Upgrade
```

---

## 🗑️ Désinstallation

### Désinstaller le module

1. **Dans Odoo** :
   - Apps > Rechercher "Dorevia Vault POS Payment"
   - Cliquer sur "Uninstall"

2. **Supprimer les fichiers** (optionnel) :
```bash
rm -rf /path/to/odoo/addons/dorevia_vault_pos_payment
```

3. **Supprimer les paramètres** (optionnel) :
```sql
DELETE FROM ir_config_parameter WHERE key = 'dorevia.vault.url';
```

---

## 📞 Support

En cas de problème :

1. **Vérifier les logs Odoo** :
```bash
tail -f /var/log/odoo/odoo.log
```

2. **Vérifier les logs Python** :
```bash
journalctl -u odoo -f
```

3. **Consulter la documentation** :
   - `IMPLEMENTATION_VUE_POS_PAYMENT_VAULT.md`
   - `GUIDE_INSTALLATION_MODULE_POS_PAYMENT.md`

---

## 📚 Références

- **Module source** : `/opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT/`
- **Script de déploiement** : `SCRIPT_DEPLOIEMENT_ODOO_POS_PAYMENT.sh`
- **Charte UX** : `CHARTE_UX_DOREVIA_VAULT_VIEWS.md`

---

**Fin du guide.**

