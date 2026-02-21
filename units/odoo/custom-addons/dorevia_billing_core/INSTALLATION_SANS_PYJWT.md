# Installation du Module sans PyJWT

## ✅ Le module fonctionne sans PyJWT !

Le package `python3-pyjwt` n'est pas disponible dans les dépôts Ubuntu par défaut, mais **ce n'est pas un problème**.

Le module `dorevia_billing_core` a été conçu pour fonctionner **avec ou sans PyJWT**.

---

## 🎯 Fonctionnalités disponibles sans PyJWT

✅ **Toutes les fonctionnalités principales fonctionnent** :
- Réception des constats via API REST (`POST /api/v1/constats`)
- Rattachement automatique tenant + contrat
- Calcul des montants avec règles tarifaires (paliers, remises, TVA)
- Génération automatique des factures MRR
- Gestion des contrats et règles tarifaires

⚠️ **Seule la vérification JWS est désactivée** :
- La vérification JWS est une fonctionnalité de sécurité optionnelle
- Les constats sont acceptés et traités normalement
- Le statut sera `validated` au lieu de vérifier la signature JWS

---

## 🚀 Installation immédiate

### Étapes

1. **Recharger la page Odoo Apps**
   - Dans votre navigateur, recharger la page Odoo Apps

2. **Rechercher le module**
   - Rechercher : `dorevia`
   - Le module "Dorevia Billing CORE" doit apparaître

3. **Activer le module**
   - Cliquer sur le bouton **"Activer"** (violet)
   - L'installation devrait se faire sans erreur

4. **Vérifier l'installation**
   - Le menu **"Dorevia Billing"** doit apparaître dans la barre de menu
   - Sous-menus : `Constats`, `Contrats`, `Règles tarifaires`

---

## ⚙️ Configuration après installation

### 1. Paramètres système (obligatoire)

**Menu** : `Paramètres` → `Technique` → `Paramètres` → `Paramètres système`

Créer le paramètre :
- **Clé** : `dorevia_billing.core_api_token`
- **Valeur** : Votre token API secret (pour authentifier les requêtes du Vault)

### 2. Créer un tenant

**Menu** : `Contacts` → `Créer`

- **Nom** : Nom du client
- **Code** : ⚠️ **Important** - Code tenant (ex: `test-tenant-1`)
  - Ce code doit correspondre au `tenant` envoyé par le Vault
- **Type** : `Entreprise`

### 3. Créer un contrat

**Menu** : `Dorevia Billing` → `Contrats` → `Créer`

- **Nom** : Nom du contrat
- **Tenant** : Sélectionner le tenant créé
- **Date de début** : Date de début
- **Taux de TVA** : Taux de TVA (ex: 20.0)
- Ajouter des règles tarifaires dans l'onglet `Règles tarifaires`

---

## 📝 Note sur la vérification JWS

**Sans PyJWT** :
- Le paramètre `dorevia_billing.jws_verification_enabled` sera ignoré
- Tous les constats seront acceptés avec `state = 'validated'`
- La vérification JWS sera automatiquement désactivée

**Si vous installez PyJWT plus tard** :
- Vous pourrez activer la vérification JWS via les paramètres système
- Les constats futurs seront vérifiés si activé
- Aucune modification du code n'est nécessaire

---

## 🔄 Installer PyJWT plus tard (optionnel)

Si vous souhaitez activer la vérification JWS plus tard, vous pouvez installer PyJWT avec :

```bash
# Option 1 : Utiliser --break-system-packages (non recommandé mais fonctionne)
pip install --break-system-packages PyJWT requests

# Option 2 : Installer dans un environnement virtuel utilisateur
python3 -m venv ~/.local/venv
source ~/.local/venv/bin/activate
pip install PyJWT requests
deactivate
```

**Note** : L'installation de PyJWT n'est **pas nécessaire** pour utiliser le module.

---

## ✅ Vérification

### Test de réception d'un constat

**Endpoint** : `POST https://odoo.lab.core.doreviateam.com/api/v1/constats`

**Headers** :
```
Authorization: api_key YOUR_API_TOKEN
Content-Type: application/json
```

**Payload** :
```json
{
  "constat_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant": "test-tenant-1",
  "period": "2026-01",
  "generated_at": "2026-02-01T00:05:23Z",
  "vault_id": "vault-test",
  "volumes": {
    "out_invoice": 150,
    "in_invoice": 0,
    "out_refund": 0,
    "in_refund": 0
  },
  "proofs": {
    "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "documents_count": 150
  }
}
```

**Réponse attendue** :
```json
{
  "message": "Constat received and processed",
  "constat_id": "550e8400-e29b-41d4-a716-446655440000",
  "odoo_id": 1,
  "status": "validated"
}
```

### Vérifier le constat et la facture

1. **Menu** : `Dorevia Billing` → `Constats`
   - Le constat doit apparaître
   - Vérifier que le tenant et le contrat sont rattachés

2. **Menu** : `Facturation` → `Clients` → `Factures`
   - La facture doit être créée (si `auto_post_invoice = True`)

---

## 📚 Documentation

- **Guide d'installation complet** : `README_INSTALLATION.md`
- **Guide rapide** : `INSTALLATION_RAPIDE.md`
- **Étapes après activation** : `ETAPES_APRES_ACTIVATION.md`
- **Installation des dépendances** : `INSTALLATION_DEPENDANCES.md`

---

**Date de création** : 2026-01-04

