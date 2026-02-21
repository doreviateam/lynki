# Guide d'Installation — Module Dorevia Billing CORE

**Module** : `dorevia_billing_core`  
**Version** : 1.0.0  
**Odoo CORE** : https://odoo.lab.core.doreviateam.com

---

## 📋 Prérequis

### 1. Dépendances Python

Le module nécessite les packages Python suivants :
- `PyJWT` (pour la vérification JWS)
- `requests` (pour la récupération JWKS)

**Installation** :
```bash
pip install PyJWT requests
```

Ou via `requirements.txt` :
```
PyJWT>=2.8.0
requests>=2.31.0
```

### 2. Modules Odoo requis

Le module dépend des modules Odoo suivants (déjà dans `__manifest__.py`) :
- `base`
- `account`
- `contacts`

Ces modules doivent être installés dans Odoo CORE.

---

## 🚀 Installation

### Option 1 : Installation via Interface Odoo (Recommandé)

1. **Accéder à Odoo CORE**
   - URL : https://odoo.lab.core.doreviateam.com
   - Se connecter avec un compte administrateur

2. **Activer le Mode Développeur**
   - Menu : `Paramètres` → `Activer le mode développeur`
   - Ou : `Paramètres` → `Activer le mode sans échec`

3. **Copier le module dans le répertoire des addons**
   ```bash
   # Sur le serveur Odoo CORE
   cp -r /opt/dorevia-plateform/units/odoo/custom-addons/dorevia_billing_core \
        /path/to/odoo/addons/
   ```
   
   **Note** : Remplacer `/path/to/odoo/addons/` par le chemin réel des addons Odoo CORE.

4. **Mettre à jour la liste des applications**
   - Menu : `Applications`
   - Cliquer sur `Mettre à jour la liste des applications`

5. **Installer le module**
   - Rechercher : `Dorevia Billing Core`
   - Cliquer sur `Installer`

### Option 2 : Installation via ligne de commande

```bash
# Sur le serveur Odoo CORE
cd /path/to/odoo

# Installer le module
./odoo-bin -c odoo.conf -d dorevia_core -u dorevia_billing_core --stop-after-init
```

**Note** : Remplacer :
- `/path/to/odoo` par le chemin réel d'Odoo
- `odoo.conf` par le fichier de configuration
- `dorevia_core` par le nom de la base de données

---

## ⚙️ Configuration

### 1. Paramètres système

Après l'installation, configurer les paramètres système suivants :

**Menu** : `Paramètres` → `Technique` → `Paramètres` → `Paramètres système`

#### a) Token API pour l'authentification

- **Clé** : `dorevia_billing.core_api_token`
- **Valeur** : Token secret pour authentifier les requêtes du Vault
- **Exemple** : `sk_live_abc123xyz789...`

#### b) Vérification JWS (optionnel)

- **Clé** : `dorevia_billing.jws_verification_enabled`
- **Valeur** : `True` ou `False` (par défaut : `False`)
- **Description** : Active la vérification JWS des constats

#### c) URL JWKS (si vérification JWS activée)

- **Clé** : `dorevia_billing.jwks_url`
- **Valeur** : URL du JWKS du Vault
- **Exemple** : `https://vault.doreviateam.com/.well-known/jwks.json`

#### d) Validation automatique des factures

- **Clé** : `dorevia_billing.auto_post_invoice`
- **Valeur** : `True` ou `False` (par défaut : `False`)
- **Description** : Valide automatiquement les factures MRR générées

### 2. Créer un tenant de test

**Menu** : `Contacts` → `Créer`

- **Nom** : Nom du tenant (ex: "Client Test")
- **Code** : Code tenant (ex: `test-tenant-1`)
  - ⚠️ **Important** : Ce code doit correspondre au `tenant` envoyé par le Vault
- **Type** : `Entreprise`

### 3. Créer un contrat de facturation

**Menu** : `Dorevia Billing` → `Contrats` → `Créer`

- **Nom** : Nom du contrat (ex: "Contrat Premium")
- **Tenant** : Sélectionner le tenant créé
- **Date de début** : Date de début du contrat
- **Date de fin** : (optionnel) Date de fin
- **Taux de TVA** : Taux de TVA (ex: 20.0)
- **Exonéré de TVA** : Cocher si exonéré

### 4. Créer des règles tarifaires

**Menu** : `Dorevia Billing` → `Contrats` → Ouvrir le contrat → Onglet `Règles Tarifaires`

**Exemple de règles** :
- **Règle 1** :
  - Type de mouvement : `Facture Client`
  - Prix unitaire HT : `1.00`
  - Volume Min : `0`
  - Volume Max : `100`
  - Remise : `0%`
  - Séquence : `10`

- **Règle 2** :
  - Type de mouvement : `Facture Client`
  - Prix unitaire HT : `0.90`
  - Volume Min : `100`
  - Volume Max : (vide = illimité)
  - Remise : `5%`
  - Séquence : `20`

---

## 🧪 Tests

### 1. Test de réception d'un constat

**Endpoint** : `POST /api/v1/constats`

**URL complète** : `https://odoo.lab.core.doreviateam.com/api/v1/constats`

**Headers** :
```
Authorization: api_key YOUR_API_TOKEN
Content-Type: application/json
```

**Payload exemple** :
```json
{
  "constat_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant": "test-tenant-1",
  "period": "2026-01",
  "generated_at": "2026-02-01T00:05:23Z",
  "vault_id": "vault-test",
  "volumes": {
    "out_invoice": 150,
    "in_invoice": 45,
    "out_refund": 3,
    "in_refund": 1
  },
  "compliance": {
    "compliant": 120,
    "non_compliant_2026": 25,
    "out_of_scope": 54
  },
  "proofs": {
    "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "ledger_hash": "abc123...",
    "documents_count": 199
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

### 2. Vérifier le constat reçu

**Menu** : `Dorevia Billing` → `Constats`

- Le constat doit apparaître dans la liste
- Vérifier que le tenant et le contrat sont rattachés
- Vérifier que la facture a été générée (si `auto_post_invoice = True`)

### 3. Vérifier la facture générée

**Menu** : `Facturation` → `Clients` → `Factures`

- La facture doit être créée avec :
  - Type : `Facture client`
  - Partenaire : Tenant du constat
  - Lignes de facturation correspondant aux volumes
  - Montants HT et TTC calculés

---

## 🔍 Vérification de l'installation

### 1. Vérifier les modèles créés

**Menu** : `Paramètres` → `Technique` → `Base de données` → `Modèles`

Rechercher :
- `dorevia.constat`
- `dorevia.contract`
- `dorevia.pricing.rule`

### 2. Vérifier les menus

**Menu** : `Dorevia Billing`

Doit contenir :
- `Constats`
- `Contrats`
- `Règles Tarifaires`

### 3. Vérifier les permissions

**Menu** : `Paramètres` → `Utilisateurs et entreprises` → `Groupes`

Vérifier que les groupes suivants existent :
- `Dorevia Billing / Utilisateur`
- `Dorevia Billing / Gestionnaire`

---

## 🐛 Dépannage

### Erreur : "Module non trouvé"

**Solution** :
1. Vérifier que le module est dans le répertoire des addons
2. Vérifier que le chemin est dans `addons_path` du fichier de configuration Odoo
3. Mettre à jour la liste des applications

### Erreur : "Dépendances manquantes"

**Solution** :
1. Installer les modules Odoo requis : `base`, `account`, `contacts`
2. Installer les packages Python : `PyJWT`, `requests`

### Erreur : "401 Unauthorized" lors de la réception

**Solution** :
1. Vérifier que le token API est configuré : `dorevia_billing.core_api_token`
2. Vérifier que le header `Authorization: api_key TOKEN` est correct
3. Vérifier que le token correspond à celui configuré

### Erreur : "Tenant non trouvé"

**Solution** :
1. Vérifier que le tenant existe dans `Contacts`
2. Vérifier que le champ `Code` du tenant correspond au `tenant` envoyé par le Vault
3. Créer le tenant si nécessaire

### Erreur : "Aucun contrat actif"

**Solution** :
1. Vérifier qu'un contrat existe pour le tenant
2. Vérifier que le contrat est actif (`active = True`)
3. Vérifier que la période du constat est dans la plage du contrat (`start_date` ≤ période ≤ `end_date`)

### Erreur : "JWS verification failed"

**Solution** :
1. Vérifier que `dorevia_billing.jwks_url` est configuré
2. Vérifier que l'URL JWKS est accessible depuis Odoo CORE
3. Vérifier que le JWS est valide (format, signature)
4. **Note** : En v1, cette erreur ne bloque pas la réception (state = `validated_with_warning`)

---

## 📚 Documentation

- **Spécification** : `ZeDocs/V2/SPEC3_ODOO_CORE_RECEPTION_CONSTATS_FACTURATION_v1.0.md`
- **Plan d'implémentation** : `ZeDocs/V2/PLAN_IMPLEMENTATION_SPEC3_ODOO_CORE_SCRUM.md`
- **État d'implémentation** : `ZeDocs/V2/ETAT_IMPLEMENTATION_SPEC3_SCRUM.md`

---

## ✅ Checklist d'installation

- [ ] Module copié dans le répertoire des addons
- [ ] Dépendances Python installées (`PyJWT`, `requests`)
- [ ] Modules Odoo requis installés (`base`, `account`, `contacts`)
- [ ] Module `dorevia_billing_core` installé
- [ ] Paramètres système configurés :
  - [ ] `dorevia_billing.core_api_token`
  - [ ] `dorevia_billing.jws_verification_enabled` (optionnel)
  - [ ] `dorevia_billing.jwks_url` (si JWS activé)
  - [ ] `dorevia_billing.auto_post_invoice` (optionnel)
- [ ] Tenant de test créé avec code
- [ ] Contrat de test créé avec règles tarifaires
- [ ] Test de réception d'un constat réussi
- [ ] Facture générée et vérifiée

---

**Date de création** : 2026-01-04  
**Version** : 1.0

