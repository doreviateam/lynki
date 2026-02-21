# Installation — Étape Finale

**Build Docker réussi ! ✅**

L'image `odoo:18.0-dorevia` a été créée avec PyJWT et requests installés.

---

## 🚀 Prochaines étapes

### 1. Redémarrer le service Odoo

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

# Redémarrer avec la nouvelle image
docker compose up -d odoo

# Vérifier que le conteneur tourne
docker compose ps
```

### 2. Vérifier que PyJWT est installé

```bash
# Vérifier PyJWT dans le conteneur
docker compose exec odoo python3 -c "import jwt; print('✅ PyJWT version:', jwt.__version__)"

# Vérifier requests
docker compose exec odoo python3 -c "import requests; print('✅ requests version:', requests.__version__)"
```

**Résultat attendu** :
```
✅ PyJWT version: 2.x.x
✅ requests version: 2.x.x
```

### 3. Installer le module dans Odoo

1. **Accéder à Odoo CORE**
   - URL : https://odoo.lab.core.doreviateam.com
   - Se connecter avec un compte administrateur

2. **Mettre à jour la liste des applications**
   - Menu : `Applications`
   - Cliquer sur `Mettre à jour la liste des applications`

3. **Rechercher et installer**
   - Rechercher : `dorevia`
   - Le module "Dorevia Billing CORE" doit apparaître
   - Cliquer sur **"Activer"**

✅ **Le module devrait s'installer sans erreur** (PyJWT est maintenant disponible).

---

## ✅ Vérification post-installation

### 1. Vérifier les menus

**Menu** : `Dorevia Billing`

Doit contenir :
- `Constats`
- `Contrats`
- `Règles tarifaires`

### 2. Configurer les paramètres

**Menu** : `Paramètres` → `Technique` → `Paramètres` → `Paramètres système`

Créer :
- `dorevia_billing.core_api_token` : Votre token API

### 3. Créer un tenant et un contrat

- **Tenant** : `Contacts` → `Créer` (avec un `Code`)
- **Contrat** : `Dorevia Billing` → `Contrats` → `Créer` (avec règles tarifaires)

---

## 🎯 Le module est prêt !

Toutes les fonctionnalités sont disponibles :
- ✅ Réception des constats via API
- ✅ Rattachement tenant + contrat
- ✅ Calcul des montants
- ✅ Génération de factures MRR
- ✅ Vérification JWS (PyJWT installé)

---

**Date de création** : 2026-01-04

