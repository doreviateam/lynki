# Guide d'Installation Final — Dorevia Billing CORE

**Module** : `dorevia_billing_core`  
**Version** : 1.0.0  
**Odoo CORE** : https://odoo.lab.core.doreviateam.com  
**Date** : 2026-01-04

---

## ✅ État du module : PRÊT POUR INSTALLATION

### Vérifications effectuées

- ✅ **Structure complète** : 19 fichiers Python/XML
- ✅ **`__manifest__.py`** : Dépendances optionnelles (PyJWT non bloquant)
- ✅ **Modèles** : `dorevia.constat`, `dorevia.contract`, `dorevia.pricing.rule`
- ✅ **Contrôleur** : `POST /api/v1/constats` avec helper JWS centralisé
- ✅ **Vues** : Liste, formulaire, recherche pour tous les modèles
- ✅ **Sécurité** : Groupes et permissions configurés
- ✅ **Dockerfile** : Avec venv et PyJWT installé
- ✅ **Helper JWS** : `utils/jws.py` avec pattern anti-crash

---

## 🚀 Installation en 3 étapes

### Étape 1 : Reconstruire l'image Docker (si nécessaire)

**Si vous utilisez Docker** (recommandé pour Lab/Stinger/Prod) :

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

# Reconstruire l'image avec PyJWT
docker-compose build odoo

# Redémarrer le service
docker-compose up -d odoo

# Vérifier que PyJWT est installé
docker exec odoo_lab_core python3 -c "import jwt; print('✅ PyJWT OK')"
```

**Si vous n'utilisez pas Docker** : Le module s'installera sans PyJWT (JWS désactivée).

---

### Étape 2 : Installer le module dans Odoo

1. **Accéder à Odoo CORE**
   - URL : https://odoo.lab.core.doreviateam.com
   - Se connecter avec un compte administrateur

2. **Activer le Mode Développeur** (si nécessaire)
   - Menu : `Paramètres` → `Activer le mode développeur`

3. **Mettre à jour la liste des applications**
   - Menu : `Applications`
   - Cliquer sur `Mettre à jour la liste des applications`

4. **Rechercher et installer**
   - Rechercher : `dorevia`
   - Le module "Dorevia Billing CORE" doit apparaître
   - Cliquer sur **"Activer"**

✅ **Le module devrait s'installer sans erreur** (PyJWT est optionnel).

---

### Étape 3 : Configuration initiale

#### a) Paramètres système (obligatoire)

**Menu** : `Paramètres` → `Technique` → `Paramètres` → `Paramètres système`

Créer le paramètre :
- **Clé** : `dorevia_billing.core_api_token`
- **Valeur** : Votre token API secret

#### b) Créer un tenant

**Menu** : `Contacts` → `Créer`

- **Nom** : Nom du client
- **Code** : ⚠️ **CRITIQUE** - Code tenant (ex: `test-tenant-1`)
  - Ce code doit correspondre au `tenant` envoyé par le Vault
- **Type** : `Entreprise`

#### c) Créer un contrat

**Menu** : `Dorevia Billing` → `Contrats` → `Créer`

- **Nom** : Nom du contrat
- **Tenant** : Sélectionner le tenant créé
- **Date de début** : Date de début
- **Taux de TVA** : Taux de TVA (ex: 20.0)
- Ajouter des règles tarifaires dans l'onglet `Règles tarifaires`

---

## ✅ Vérification de l'installation

### 1. Vérifier les menus

**Menu** : `Dorevia Billing`

Doit contenir :
- `Constats`
- `Contrats`
- `Règles tarifaires`

### 2. Vérifier les modèles

**Menu** : `Paramètres` → `Technique` → `Base de données` → `Modèles`

Rechercher :
- `dorevia.constat` ✅
- `dorevia.contract` ✅
- `dorevia.pricing.rule` ✅

### 3. Tester la réception d'un constat

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

---

## 🎯 Fonctionnalités disponibles

### ✅ Avec ou sans PyJWT

| Fonctionnalité | Sans PyJWT | Avec PyJWT |
|:---------------|:-----------|:-----------|
| Réception constats | ✅ | ✅ |
| Rattachement tenant + contrat | ✅ | ✅ |
| Calcul montants | ✅ | ✅ |
| Génération factures MRR | ✅ | ✅ |
| Vérification JWS | ⚠️ Désactivée | ✅ Active |

---

## 📚 Documentation disponible

- **Guide complet** : `README_INSTALLATION.md`
- **Guide rapide** : `INSTALLATION_RAPIDE.md`
- **Installation Docker** : `INSTALLATION_DOCKER.md`
- **Installation sans PyJWT** : `INSTALLATION_SANS_PYJWT.md`
- **Étapes après activation** : `ETAPES_APRES_ACTIVATION.md`
- **Évaluation dépendances** : `EVALUATION_DOCUMENT_DEPENDANCES.md`

---

## ✅ Checklist d'installation

- [ ] Image Docker reconstruite (si Docker)
- [ ] Module installé dans Odoo Apps
- [ ] Menu "Dorevia Billing" visible
- [ ] Paramètre `dorevia_billing.core_api_token` configuré
- [ ] Tenant créé avec code
- [ ] Contrat créé avec règles tarifaires
- [ ] Test de réception constat réussi
- [ ] Facture générée (si `auto_post_invoice = True`)

---

**Le module est prêt pour installation ! 🚀**

---

**Date de création** : 2026-01-04

