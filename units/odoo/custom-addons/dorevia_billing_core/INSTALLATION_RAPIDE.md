# Installation Rapide — Module Dorevia Billing CORE

**Odoo CORE** : https://odoo.lab.core.doreviateam.com

---

## 🚀 Installation en 5 étapes

### 1. Installer les dépendances Python

```bash
# Sur le serveur Odoo CORE
pip install PyJWT requests
```

Ou via `requirements.txt` :
```bash
pip install -r /opt/dorevia-plateform/units/odoo/custom-addons/dorevia_billing_core/requirements.txt
```

### 2. Copier le module dans Odoo CORE

```bash
# Sur le serveur Odoo CORE
# Remplacer /path/to/odoo/addons/ par le chemin réel des addons Odoo
cp -r /opt/dorevia-plateform/units/odoo/custom-addons/dorevia_billing_core \
      /path/to/odoo/addons/
```

**Note** : Vérifier que le chemin est dans `addons_path` du fichier de configuration Odoo.

### 3. Installer le module via l'interface Odoo

1. **Se connecter à Odoo CORE**
   - URL : https://odoo.lab.core.doreviateam.com
   - Compte administrateur

2. **Activer le Mode Développeur**
   - Menu : `Paramètres` → `Activer le mode développeur`

3. **Mettre à jour la liste des applications**
   - Menu : `Applications`
   - Cliquer sur `Mettre à jour la liste des applications`

4. **Installer le module**
   - Rechercher : `Dorevia Billing Core`
   - Cliquer sur `Installer`

### 4. Configurer les paramètres système

**Menu** : `Paramètres` → `Technique` → `Paramètres` → `Paramètres système`

| Clé | Valeur | Description |
|:----|:-------|:------------|
| `dorevia_billing.core_api_token` | `sk_live_...` | Token API pour authentifier les requêtes du Vault |
| `dorevia_billing.jws_verification_enabled` | `False` | Activer la vérification JWS (optionnel) |
| `dorevia_billing.jwks_url` | `https://vault.../jwks.json` | URL JWKS (si JWS activé) |
| `dorevia_billing.auto_post_invoice` | `False` | Valider automatiquement les factures (optionnel) |

### 5. Créer un tenant et un contrat de test

#### a) Créer un tenant

**Menu** : `Contacts` → `Créer`

- **Nom** : `Client Test`
- **Code** : `test-tenant-1` ⚠️ **Important** : Ce code doit correspondre au `tenant` envoyé par le Vault
- **Type** : `Entreprise`

#### b) Créer un contrat

**Menu** : `Dorevia Billing` → `Contrats` → `Créer`

- **Nom** : `Contrat Premium`
- **Tenant** : Sélectionner le tenant créé
- **Date de début** : `2026-01-01`
- **Taux de TVA** : `20.0`
- **Exonéré de TVA** : Non

#### c) Ajouter des règles tarifaires

Dans le contrat, onglet `Règles tarifaires` :

**Règle 1** :
- Type : `Facture client`
- Prix unitaire HT : `1.00`
- Volume Min : `0`
- Volume Max : `100`
- Remise : `0%`
- Séquence : `10`

**Règle 2** :
- Type : `Facture client`
- Prix unitaire HT : `0.90`
- Volume Min : `100`
- Volume Max : (vide)
- Remise : `5%`
- Séquence : `20`

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

## 🐛 Dépannage rapide

| Problème | Solution |
|:---------|:---------|
| Module non trouvé | Vérifier le chemin dans `addons_path` et mettre à jour la liste des applications |
| 401 Unauthorized | Vérifier que `dorevia_billing.core_api_token` est configuré |
| Tenant non trouvé | Vérifier que le `Code` du tenant correspond au `tenant` envoyé |
| Aucun contrat actif | Créer un contrat actif pour le tenant et la période |

---

**Documentation complète** : Voir `README_INSTALLATION.md`

