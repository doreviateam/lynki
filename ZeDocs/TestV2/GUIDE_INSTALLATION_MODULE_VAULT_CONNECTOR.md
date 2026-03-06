# 🚀 Guide d'installation : Module Dorevia Vault Connector

**Date** : 2026-01-10  
**Module** : `dorevia_vault_connector`  
**Instance** : Odoo STINGER - sarl-la-platine

---

## ✅ Prérequis vérifiés

- ✅ Container Odoo en cours d'exécution : `odoo_stinger_sarl-la-platine`
- ✅ Module créé dans `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_vault_connector/`
- ✅ Volume `custom-addons` monté dans le container
- ✅ Configuration DVIG déjà configurée dans Odoo

---

## 📋 Étapes d'installation

### Étape 1 : Vérifier que le module est accessible

Le module devrait déjà être accessible dans le container car le volume est monté.

**Vérification** :
```bash
docker exec odoo_stinger_sarl-la-platine ls -la /mnt/custom-addons/ | grep dorevia_vault_connector
```

**Résultat attendu** : Liste des fichiers du module

---

### Étape 2 : Redémarrer Odoo (si nécessaire)

Pour que Odoo détecte le nouveau module, redémarrer le container :

```bash
docker restart odoo_stinger_sarl-la-platine
```

**Attendre** : ~30 secondes pour que Odoo redémarre complètement

**Vérification** :
```bash
docker ps --filter "name=odoo_stinger_sarl-la-platine" --format "{{.Status}}"
```

---

### Étape 3 : Mettre à jour la liste des modules dans Odoo

1. **Se connecter à Odoo** :
   - URL : `https://odoo.stinger.sarl-la-platine.doreviateam.com`
   - Se connecter avec vos identifiants

2. **Aller dans les paramètres** :
   - Menu : **Paramètres** (⚙️ en haut à droite)
   - Ou : **Paramètres → Applications**

3. **Mettre à jour la liste** :
   - Cliquer sur **"Mettre à jour la liste des applications"**
   - Attendre la fin de la mise à jour

---

### Étape 4 : Installer le module

1. **Rechercher le module** :
   - Dans la barre de recherche, taper : **"Dorevia Vault Connector"**
   - Ou filtrer par catégorie : **"Comptabilité"**

2. **Installer** :
   - Cliquer sur le module **"Dorevia Vault Connector"**
   - Cliquer sur le bouton **"Installer"**
   - Attendre la fin de l'installation (~10-30 secondes)

3. **Vérifier l'installation** :
   - Le statut doit passer à **"Installé"**
   - Un message de confirmation s'affiche

---

### Étape 5 : Vérifier le cron

1. **Aller dans les actions planifiées** :
   - **Paramètres → Technique → Automatisation → Actions planifiées**

2. **Rechercher le cron** :
   - Rechercher : **"Vault posted invoices (Dorevia)"**

3. **Vérifier** :
   - ✅ État : **"Actif"**
   - ✅ Intervalle : **15 minutes**
   - ✅ Modèle : **account.move**

---

### Étape 6 : Tester le vaulting

#### Option A : Via le bouton "Vault"

1. **Ouvrir la facture** :
   - Aller dans **Facturation → Factures clients**
   - Ouvrir la facture **FAC/2026/00001**

2. **Cliquer sur "Vault"** :
   - Le bouton "Vault" apparaît dans la barre d'actions (en haut à droite)
   - Cliquer sur "Vault"
   - Attendre la confirmation

3. **Vérifier** :
   - Le champ "Vaulted?" doit passer à `True`
   - Un message de succès s'affiche

#### Option B : Attendre le cron (automatique)

Le cron va automatiquement vaultériser la facture dans les 15 prochaines minutes.

**Vérification** :
```bash
docker compose -f tenants/sarl-la-platine/apps/odoo/stinger/docker-compose.yml logs odoo | grep -i "cron vaulting" | tail -10
```

---

## 🔍 Vérifications post-installation

### 1. Vérifier les logs Odoo

```bash
docker compose -f tenants/sarl-la-platine/apps/odoo/stinger/docker-compose.yml logs odoo | grep -i "dorevia_vault_connector" | tail -20
```

**Rechercher** :
- `Module dorevia_vault_connector installed`
- `Cron vaulting: X facture(s) à vaultériser`

### 2. Vérifier que le module est installé

Dans Odoo :
- **Paramètres → Applications**
- Rechercher "Dorevia Vault Connector"
- Statut : ✅ **Installé**

### 3. Vérifier le cron

Dans Odoo :
- **Paramètres → Technique → Automatisation → Actions planifiées**
- Rechercher "Vault posted invoices (Dorevia)"
- État : ✅ **Actif**

---

## ⚠️ Dépannage

### Le module n'apparaît pas dans la liste

**Solutions** :
1. ✅ Vérifier que le module est dans `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_vault_connector/`
2. ✅ Redémarrer Odoo : `docker restart odoo_stinger_sarl-la-platine`
3. ✅ Vérifier les logs : `docker logs odoo_stinger_sarl-la-platine | grep -i error`

### Erreur lors de l'installation

**Vérifications** :
1. ✅ Le module `dorevia_posted_lock` est installé (dépendance)
2. ✅ Les permissions sont correctes sur les fichiers
3. ✅ Vérifier les logs Odoo pour les erreurs détaillées

### Le bouton "Vault" n'apparaît pas

**Vérifications** :
1. ✅ Le module est installé et activé
2. ✅ La facture est en état `posted`
3. ✅ La facture n'est pas déjà vaultée
4. ✅ Rafraîchir la page (F5)

### Le cron ne s'exécute pas

**Vérifications** :
1. ✅ Le cron est actif dans Odoo
2. ✅ Vérifier les logs : `docker logs odoo_stinger_sarl-la-platine | grep -i cron`
3. ✅ Déclencher manuellement pour tester

---

## 📝 Résumé

| Étape | Action | Statut |
|-------|--------|--------|
| 1 | Vérifier module accessible | ⏳ À faire |
| 2 | Redémarrer Odoo | ⏳ À faire |
| 3 | Mettre à jour liste modules | ⏳ À faire |
| 4 | Installer module | ⏳ À faire |
| 5 | Vérifier cron | ⏳ À faire |
| 6 | Tester vaulting | ⏳ À faire |

---

## 🎯 Après installation

Une fois le module installé :

1. ✅ **Vaulting automatique** : Toutes les nouvelles factures validées seront automatiquement vaultées
2. ✅ **Bouton "Vault"** : Possibilité de vaultériser manuellement les factures existantes
3. ✅ **Cron job** : Rattrape automatiquement les factures postées non vaultées toutes les 15 minutes

---

**Version** : 1.0  
**Date** : 2026-01-10
