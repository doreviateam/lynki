# Installation des Dépendances Python — Module Dorevia Billing CORE

## ❌ Erreur rencontrée

```
error: externally-managed-environment
× This environment is externally managed
```

Cette erreur apparaît sur Python 3.12+ qui protège l'environnement système.

---

## ✅ Solutions

### Option 1 : Installer dans l'environnement virtuel d'Odoo (Recommandé)

Si Odoo utilise un environnement virtuel, installez-y les dépendances :

```bash
# Trouver le chemin de l'environnement virtuel Odoo
# (généralement dans /opt/odoo/venv ou /usr/lib/odoo/venv)

# Activer l'environnement virtuel Odoo
source /path/to/odoo/venv/bin/activate

# Installer les dépendances
pip install PyJWT requests

# Désactiver l'environnement virtuel
deactivate
```

**Comment trouver le chemin de l'environnement virtuel Odoo** :
```bash
# Vérifier le processus Odoo
ps aux | grep odoo-bin

# Ou vérifier le fichier de configuration Odoo
grep -i venv /path/to/odoo/odoo.conf
```

---

### Option 2 : Installer via apt (Debian/Ubuntu)

Si les packages sont disponibles dans les dépôts :

```bash
sudo apt-get update
sudo apt-get install python3-pyjwt python3-requests
```

**Note** : Les versions peuvent être plus anciennes que celles requises.

---

### Option 3 : Utiliser --break-system-packages (Non recommandé)

⚠️ **Attention** : Cette option peut casser l'environnement Python système.

```bash
pip install --break-system-packages PyJWT requests
```

**Utilisez cette option uniquement si** :
- Vous êtes sûr de ce que vous faites
- Vous avez un environnement de test
- Aucune autre solution ne fonctionne

---

### Option 4 : Installer dans un environnement virtuel utilisateur

Créer un environnement virtuel pour l'utilisateur :

```bash
# Créer un environnement virtuel
python3 -m venv ~/.local/venv

# Activer l'environnement virtuel
source ~/.local/venv/bin/activate

# Installer les dépendances
pip install PyJWT requests

# Désactiver
deactivate
```

**Note** : Cette solution fonctionne, mais Odoo devra utiliser cet environnement virtuel.

---

### Option 5 : Installer via pipx (Pour applications isolées)

```bash
# Installer pipx si nécessaire
sudo apt-get install pipx

# Installer PyJWT et requests dans des environnements isolés
pipx install PyJWT
pipx install requests
```

**Note** : Cette solution isole les packages mais peut ne pas être compatible avec Odoo.

---

## 🎯 Solution recommandée pour Odoo

**La meilleure solution est d'installer dans l'environnement virtuel d'Odoo.**

### Étapes détaillées

1. **Trouver le chemin de l'environnement virtuel Odoo** :
   ```bash
   # Méthode 1 : Vérifier le processus Odoo
   ps aux | grep odoo-bin | grep -oP 'python\d+\.\d+'
   
   # Méthode 2 : Vérifier le fichier de configuration
   cat /etc/odoo/odoo.conf | grep -i python
   
   # Méthode 3 : Chercher les environnements virtuels communs
   ls -la /opt/odoo/venv/bin/python* 2>/dev/null
   ls -la /usr/lib/odoo/venv/bin/python* 2>/dev/null
   ```

2. **Activer l'environnement virtuel** :
   ```bash
   source /path/to/odoo/venv/bin/activate
   ```

3. **Vérifier que c'est le bon Python** :
   ```bash
   which python
   # Doit afficher : /path/to/odoo/venv/bin/python
   ```

4. **Installer les dépendances** :
   ```bash
   pip install PyJWT requests
   ```

5. **Vérifier l'installation** :
   ```bash
   python -c "import jwt; print('PyJWT OK')"
   python -c "import requests; print('requests OK')"
   ```

6. **Désactiver l'environnement virtuel** :
   ```bash
   deactivate
   ```

---

## 🔍 Vérifier que Odoo peut importer PyJWT

Après l'installation, vérifiez que Odoo peut importer PyJWT :

```bash
# Utiliser le même Python qu'Odoo
/path/to/odoo/venv/bin/python -c "import jwt; print('OK')"
```

Si cette commande fonctionne, Odoo pourra utiliser PyJWT.

---

## 📝 Note importante

**Le module fonctionne sans PyJWT** !

- Si PyJWT n'est **pas installé** : Le module s'installe, mais la vérification JWS est désactivée
- Si PyJWT **est installé** : La vérification JWS peut être activée via les paramètres système

**Vous pouvez installer le module maintenant et ajouter PyJWT plus tard si nécessaire.**

---

## 🚀 Réessayer l'installation du module

Après avoir installé les dépendances (ou décidé de ne pas les installer) :

1. **Recharger la page Odoo Apps**
2. **Rechercher à nouveau** "dorevia"
3. **Cliquer sur "Activer"**

Le module devrait s'installer sans erreur.

---

## 🐛 Dépannage

### Erreur : "Module installed but PyJWT still not found"

**Solution** :
1. Vérifier que vous avez installé PyJWT dans le bon environnement Python
2. Redémarrer Odoo
3. Vérifier les logs Odoo pour les erreurs d'import

### Erreur : "pip: command not found"

**Solution** :
```bash
sudo apt-get install python3-pip
```

### Erreur : "Permission denied"

**Solution** :
- Utiliser l'environnement virtuel Odoo (pas besoin de sudo)
- Ou utiliser `sudo` si nécessaire (non recommandé)

---

## 📚 Documentation

- **Guide d'installation complet** : `README_INSTALLATION.md`
- **Guide rapide** : `INSTALLATION_RAPIDE.md`
- **Étapes après activation** : `ETAPES_APRES_ACTIVATION.md`

---

**Date de création** : 2026-01-04  
**Mise à jour** : 2026-01-04 (ajout solutions pour externally-managed-environment)
