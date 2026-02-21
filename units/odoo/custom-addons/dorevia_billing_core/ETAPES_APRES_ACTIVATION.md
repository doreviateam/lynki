# Étapes après activation du module

Une fois le module "Dorevia Billing CORE" activé dans Odoo, suivez ces étapes pour le configurer.

---

## ✅ Étape 1 : Vérifier l'installation

Après avoir cliqué sur "Activer", vérifiez que :

1. **Le module est installé**
   - Le statut doit passer de "Activer" à "Installé" ou "Activé"
   - Aucune erreur ne doit apparaître

2. **Les menus sont visibles**
   - Menu principal : `Dorevia Billing` doit apparaître dans la barre de menu
   - Sous-menus : `Constats`, `Contrats`, `Règles tarifaires`

---

## ⚙️ Étape 2 : Configurer les paramètres système

**Menu** : `Paramètres` → `Technique` → `Paramètres` → `Paramètres système`

### Paramètres obligatoires

| Clé | Valeur | Description |
|:----|:-------|:------------|
| `dorevia_billing.core_api_token` | `sk_live_...` | **OBLIGATOIRE** - Token API pour authentifier les requêtes du Vault |

### Paramètres optionnels

| Clé | Valeur | Description |
|:----|:-------|:------------|
| `dorevia_billing.jws_verification_enabled` | `False` | Activer la vérification JWS (défaut: `False`) |
| `dorevia_billing.jwks_url` | `https://vault.../jwks.json` | URL JWKS (requis si JWS activé) |
| `dorevia_billing.auto_post_invoice` | `False` | Valider automatiquement les factures (défaut: `False`) |

**Comment créer un paramètre** :
1. Cliquer sur `Créer`
2. Remplir le champ `Clé` avec la clé exacte (ex: `dorevia_billing.core_api_token`)
3. Remplir le champ `Valeur` avec la valeur
4. Sauvegarder

---

## 👥 Étape 3 : Créer un tenant

**Menu** : `Contacts` → `Créer`

**Champs importants** :
- **Nom** : Nom du client (ex: "Client Test")
- **Code** : ⚠️ **CRITIQUE** - Code tenant (ex: `test-tenant-1`)
  - Ce code doit **exactement** correspondre au champ `tenant` envoyé par le Vault
  - Utilisé pour le rattachement automatique des constats
- **Type** : `Entreprise`

**Exemple** :
```
Nom : Client Test Premium
Code : test-tenant-1
Type : Entreprise
```

---

## 📄 Étape 4 : Créer un contrat de facturation

**Menu** : `Dorevia Billing` → `Contrats` → `Créer`

**Champs obligatoires** :
- **Nom** : Nom du contrat (ex: "Contrat Premium")
- **Tenant** : Sélectionner le tenant créé à l'étape 3
- **Date de début** : Date de début du contrat (ex: `2026-01-01`)
- **Taux de TVA** : Taux de TVA en pourcentage (ex: `20.0`)
- **Exonéré de TVA** : Cocher si exonéré (défaut: Non)

**Exemple** :
```
Nom : Contrat Premium
Tenant : Client Test Premium
Date de début : 2026-01-01
Taux de TVA : 20.0
Exonéré de TVA : Non
```

---

## 💰 Étape 5 : Ajouter des règles tarifaires

Dans le contrat créé, onglet `Règles tarifaires` → Cliquer sur `Ajouter une ligne`

### Exemple de configuration avec paliers

**Règle 1 - Premier palier (0-100)** :
- **Type de mouvement** : `Facture client`
- **Prix unitaire HT** : `1.00`
- **Devise** : EUR (ou la devise de votre entreprise)
- **Volume Min** : `0`
- **Volume Max** : `100`
- **Remise (%)** : `0`
- **Séquence** : `10`
- **Actif** : Oui

**Règle 2 - Deuxième palier (100-200)** :
- **Type de mouvement** : `Facture client`
- **Prix unitaire HT** : `0.90`
- **Devise** : EUR
- **Volume Min** : `100`
- **Volume Max** : `200` (ou laisser vide pour illimité)
- **Remise (%)** : `5`
- **Séquence** : `20`
- **Actif** : Oui

**Règle 3 - Troisième palier (200+)** :
- **Type de mouvement** : `Facture client`
- **Prix unitaire HT** : `0.80`
- **Devise** : EUR
- **Volume Min** : `200`
- **Volume Max** : (laisser vide = illimité)
- **Remise (%)** : `10`
- **Séquence** : `30`
- **Actif** : Oui

**Note** : Les règles sont appliquées dans l'ordre de la séquence (plus petit = prioritaire).

---

## 🧪 Étape 6 : Tester la réception d'un constat

### Via curl (ligne de commande)

```bash
curl -X POST https://odoo.lab.core.doreviateam.com/api/v1/constats \
  -H "Authorization: api_key YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Remplacez** :
- `YOUR_API_TOKEN` par le token configuré dans `dorevia_billing.core_api_token`
- `test-tenant-1` par le code du tenant créé

### Réponse attendue

```json
{
  "message": "Constat received and processed",
  "constat_id": "550e8400-e29b-41d4-a716-446655440000",
  "odoo_id": 1,
  "status": "validated"
}
```

---

## ✅ Étape 7 : Vérifier le constat et la facture

### Vérifier le constat

**Menu** : `Dorevia Billing` → `Constats`

- Le constat doit apparaître dans la liste
- Vérifier que :
  - Le `tenant_id` est correctement rattaché
  - Le `contract_id` est présent
  - Le `state` est `validated` (ou `validated_with_warning` si JWS invalide)
  - Les volumes sont corrects

### Vérifier la facture générée

**Menu** : `Facturation` → `Clients` → `Factures`

- La facture doit être créée automatiquement (si `auto_post_invoice = True`)
- Vérifier que :
  - Le partenaire correspond au tenant
  - Les lignes de facturation correspondent aux volumes
  - Les montants HT et TTC sont corrects
  - La TVA est appliquée correctement

---

## 🐛 Problèmes courants

### Le constat n'apparaît pas

**Vérifications** :
1. Vérifier les logs Odoo pour les erreurs
2. Vérifier que le token API est correct
3. Vérifier que le tenant existe avec le bon code

### "Tenant non trouvé"

**Solution** :
- Vérifier que le `Code` du tenant correspond exactement au `tenant` envoyé par le Vault
- Le code est sensible à la casse

### "Aucun contrat actif"

**Solution** :
- Vérifier qu'un contrat existe pour le tenant
- Vérifier que le contrat est `Actif` (checkbox cochée)
- Vérifier que la période du constat est dans la plage du contrat

### La facture n'est pas générée automatiquement

**Vérifications** :
1. Vérifier que `contract_id` est présent sur le constat
2. Vérifier que `state = 'validated'`
3. Vérifier que `invoice_status = 'pending'`
4. Générer manuellement via le bouton "Générer la facture" sur le constat

---

## 📚 Documentation

- **Guide d'installation complet** : `README_INSTALLATION.md`
- **Guide rapide** : `INSTALLATION_RAPIDE.md`
- **Spécification** : `ZeDocs/V2/SPEC3_ODOO_CORE_RECEPTION_CONSTATS_FACTURATION_v1.0.md`

---

**Date de création** : 2026-01-04

