# 🎯 The Big Detailed Picture — Vue d'ensemble complète du système Dorevia Billing

**Date de création** : 2026-01-04  
**Dernière mise à jour** : 2026-01-05  
**Statut global** : ✅ **Système opérationnel et testé**

---

## 📋 Table des matières

1. [Vue d'ensemble du système](#vue-densemble-du-système)
2. [SPEC 1 : Vaulting `account.move` `posted`](#spec-1-vaulting-accountmove-posted)
3. [SPEC 2 : Vault → Constat mensuel](#spec-2-vault--constat-mensuel)
4. [SPEC 3 : Odoo CORE → Réception des Constats et Facturation](#spec-3-odoo-core--réception-des-constats-et-facturation)
5. [Architecture technique](#architecture-technique)
6. [Fonctionnalités clés](#fonctionnalités-clés)
7. [Modèles de facturation](#modèles-de-facturation)
8. [Tests et validation](#tests-et-validation)
9. [Configuration et déploiement](#configuration-et-déploiement)
10. [Points d'attention et bonnes pratiques](#points-dattention-et-bonnes-pratiques)

---

## 🎯 Vue d'ensemble du système

### 📜 Règles fondatrices

> **⚠️ IMPORTANT** : Ce système repose sur les **Règles Fondatrices Dorevia v1.0** définies dans [`REGLES_FONDATRICES_DOREVIA_v1.0.md`](./REGLES_FONDATRICES_DOREVIA_v1.0.md).  
> Ces règles constituent le **socle irréversible** de l'architecture et ne peuvent être remises en cause sans rupture de version majeure.

**Principes clés** :
- La vérité vient du Vault, pas de l'ERP
- Immutabilité des documents comptables `POSTED`
- Facturation basée sur des faits constatés (périodes closes)
- Modèle tarifaire standard, prix contractuel

### Objectif global

Créer un système de facturation MRR (Monthly Recurring Revenue) automatisé basé sur les volumes de documents traités par la plateforme Dorevia, avec :

- **Vault** : Stockage sécurisé et traçable des documents comptables
- **Constat mensuel** : Agrégation des volumes par période close
- **Odoo CORE** : Calcul des montants facturables et génération automatique des factures

### Principe fondamental

> **"Dorevia facture des faits constatés, jamais des faits en cours"**

- Chaque facture émise au mois **N** porte sur les volumes constatés durant le mois **N-1**
- Les constats sont établis sur des **périodes closes**
- La facturation est basée sur des **faits constatés**, pas sur des estimations

### Architecture multi-tenant

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Odoo Clients   │         │  Dorevia Vault   │         │  Odoo CORE      │
│  (Souverains)   │ ──────> │  (Distribué)     │ ──────> │  (Centralisé)   │
│                 │         │                  │         │                 │
│ - Tenant A      │         │ - Documents      │         │ - Constats      │
│ - Tenant B      │         │ - Constats       │         │ - Contrats      │
│ - Tenant C      │         │ - Preuves (JWS)  │         │ - Factures MRR  │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

---

## 📦 SPEC 1 : Vaulting `account.move` `posted`

### Statut
✅ **Référence figée (définitive)**

### Objectif

Enregistrer dans le Vault uniquement les écritures comptables `account.move` avec l'état `posted`, en appliquant des validations strictes et en stockant les métadonnées nécessaires pour la facturation future.

### Frontière Vault/CORE

**Vault** :
- ✅ Enregistre les documents `account.move` `posted`
- ✅ Stocke les métadonnées (move_type, tenant, etc.)
- ✅ Génère les preuves cryptographiques (JWS, Ledger hash)
- ✅ Détecte la conformité Factur-X

**CORE** :
- ✅ Reçoit les constats mensuels
- ✅ Calcule les montants facturables
- ✅ Génère les factures MRR

**Question tranchée** : "Qu'est-ce qu'on enregistre ?" → **Uniquement `account.move` `posted`**

### Validations strictes (fail-fast)

1. **`model = "account.move"`** → Rejet si différent
2. **`state = "posted"`** → Rejet si différent
3. **`move_type` présent dans `meta`** → Rejet si absent
4. **Cohérence `source` ↔ `move_type`** :
   - `source = "sales"` → `move_type` doit être `out_invoice` ou `out_refund`
   - `source = "purchase"` → `move_type` doit être `in_invoice` ou `in_refund`
5. **`meta.tenant` présent et non vide** → Rejet si absent

### Métadonnées stockées

| Champ | Source | Description |
|-------|--------|-------------|
| `move_type` | `meta.move_type` | Type de mouvement (out_invoice, in_invoice, etc.) |
| `tenant` | `meta.tenant` | Identifiant fonctionnel stable du tenant |
| `invoice_number` | `meta.number` | Numéro de facture |
| `invoice_date` | `meta.invoice_date` | Date de facture |
| `total_ht` | `meta.total_ht` | Montant HT |
| `total_ttc` | `meta.total_ttc` | Montant TTC |
| `currency` | `meta.currency` | Devise |
| `seller_vat` | `meta.seller_vat` | TVA vendeur |
| `buyer_vat` | `meta.buyer_vat` | TVA acheteur |

### Conformité Factur-X 2026

Le système détecte automatiquement la présence de Factur-X et assigne un `compliance_status` :

- **`compliant`** : Document Factur-X conforme 2026
- **`non_compliant_2026`** : Document Factur-X mais non conforme 2026
- **`out_of_scope`** : Pas de Factur-X ou pas de TVA (hors périmètre)

**Détection** :
1. Vérifie la présence de Factur-X dans le PDF
2. Vérifie la présence de TVA (seller_vat ET buyer_vat)
3. Identifie les documents "probable B2B" (TVA présente)
4. Assigne le statut de conformité

### Preuves cryptographiques

- **JWS (JSON Web Signature)** : Signature cryptographique du document
- **Ledger hash** : Hash en chaîne pour traçabilité immuable
- **SHA256** : Hash du contenu du document

### Idempotence

- Basée sur `(tenant, sha256)`
- Tentative de réception d'un document déjà vaulté → **409 Conflict** avec infos du document existant
- Garantit qu'un même document n'est jamais enregistré deux fois

### Livrables SPEC 1

✅ **US-1.1** : Validations strictes (5 validations fail-fast)  
✅ **US-1.2** : Stockage des métadonnées Odoo  
✅ **US-1.3** : Génération des preuves (JWS, Ledger)  
✅ **US-2.1** : Migration DB et modèle Document  
✅ **US-2.2** : Tests unitaires et d'intégration (100% couverture fonctions critiques)  
✅ **US-2.3** : Documentation API et connecteur Odoo

### Fichiers clés

- `sources/vault/internal/handlers/invoices.go` : Handler principal
- `sources/vault/internal/handlers/invoices_validation_test.go` : Tests unitaires
- `sources/vault/tests/integration/test_account_move_vaulting.go` : Tests d'intégration
- `sources/vault/docs/REPONSES_INTEGRATION_API.md` : Documentation API
- `sources/vault/docs/CONNECTEUR_ODOO_SPEC1.md` : Guide connecteur Odoo

---

## 📊 SPEC 2 : Vault → Constat mensuel

### Statut
✅ **Complété (100%)**

### Objectif

Générer automatiquement des constats mensuels qui agrègent les volumes de documents vaultés par période close, avec des preuves cryptographiques d'intégrité.

### Règle de facturation MRR

> **"La facturation MRR est basée sur des constats mensuels établis sur des périodes closes. Chaque facture émise au mois N porte sur les volumes constatés durant le mois N-1. Dorevia facture des faits constatés, jamais des faits en cours."**

### Format du constat

```json
{
  "constat_id": "aB3dE5fG7h",
  "tenant": "tenant-code",
  "period": "2026-01",
  "generated_at": "2026-02-01T00:05:23Z",
  "vault_id": "vault-rozas",
  "volumes": {
    "out_invoice": 150,
    "in_invoice": 45,
    "out_refund": 3,
    "in_refund": 1
  },
  "compliance": {
    "compliant": 120,
    "non_compliant_2026": 20,
    "out_of_scope": 10
  },
  "proofs": {
    "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "ledger_hash": "abc123def456...",
    "documents_count": 199
  }
}
```

**Note sur `constat_id`** :
- Format : **10 caractères alphanumériques** (0-9, a-z, A-Z)
- Généré de manière cryptographiquement sécurisée (`crypto/rand`)
- Garantie d'unicité : contrainte `UNIQUE` dans la base de données
- Exemple : `aB3dE5fG7h`, `1WmAw4bsrf`
- Avantage : Plus court et plus lisible qu'un UUID v4 (36 caractères), tout en conservant l'unicité et la sécurité

### Période de constat

**Définition précise** :
- Les documents inclus sont ceux dont `created_at` ∈ [`start_of_period`, `end_of_period`], en UTC
- `start_of_period` : Premier jour du mois à 00:00:00 UTC
- `end_of_period` : Dernier jour du mois à 23:59:59 UTC

**Exemple** : Constat pour `2026-01` inclut tous les documents créés entre `2026-01-01T00:00:00Z` et `2026-01-31T23:59:59Z`.

### Génération rétroactive

> **"La génération rétroactive de constats pour des périodes passées ne modifie pas les documents vaultés ; elle ne fait qu'agréger des faits existants. Cette opération est idempotente et non destructive."**

- Permet de générer des constats pour des périodes passées
- N'altère jamais les documents déjà vaultés
- Idempotente : générer deux fois le même constat → même résultat

### Preuves d'intégrité

**Référence d'intégrité** :
- Si `documents_sha256_list` est tronquée ou omise, le **JWS** et le **ledger_hash** restent la **référence d'intégrité** et garantissent l'opposabilité du constat.

**Triple preuve** :
1. **JWS** : Signature cryptographique du constat complet
2. **Ledger hash** : Hash en chaîne pour traçabilité immuable
3. **documents_sha256_list** : Liste des SHA256 des documents (optionnelle, peut être tronquée)

### Transmission à Odoo CORE

**HTTP Client avec retry** :
- Retry avec backoff exponentiel pour erreurs temporaires (429, 5xx)
- Pas de retry pour erreurs permanentes (400, 401, 403)
- Statut de transmission stocké dans la DB (`transmitted`, `failed`, `pending`)

**Idempotence** :
- Basée sur `constat_id` (10 caractères alphanumériques)
- Tentative de réception d'un constat déjà reçu → **409 Conflict**

### Job automatique mensuel

**Scheduler** :
- Exécution automatique le **1er de chaque mois à 00:00 UTC**
- Génère les constats pour le mois précédent (N-1)
- Transmet automatiquement à Odoo CORE

**Vérification quotidienne** :
- Vérifie si le job du mois en cours a été exécuté
- Permet de rattraper en cas de redémarrage du service

### API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/v1/constats/generate` | POST | Génération manuelle d'un constat |
| `/api/v1/constats/:tenant/:period` | GET | Récupération d'un constat |
| `/api/v1/constats` | GET | Liste paginée des constats |
| `/api/v1/constats/:tenant/:period/retransmit` | POST | Retransmission manuelle |

### Livrables SPEC 2

✅ **US-2.1** : Migration DB (table `constats`)  
✅ **US-2.2** : Modèle Constat et service d'agrégation  
✅ **US-2.3** : Génération avec preuves (JWS, Ledger)  
✅ **US-2.4** : Transmission HTTP avec retry  
✅ **US-2.5** : Job automatique mensuel  
✅ **US-2.6** : API endpoints (generate, get, list, retransmit)  
✅ **US-2.7** : Tests unitaires et d'intégration

### Fichiers clés

- `sources/vault/migrations/020_create_constats_table.sql` : Migration DB
- `sources/vault/internal/models/constat.go` : Modèles de données
- `sources/vault/internal/services/constat.go` : Service d'agrégation et génération
- `sources/vault/internal/jobs/constat_monthly.go` : Job automatique
- `sources/vault/internal/handlers/constats.go` : Handlers API
- `sources/vault/tests/integration/constat_integration_test.go` : Tests d'intégration

---

## 💰 SPEC 3 : Odoo CORE → Réception des Constats et Facturation

### Statut
✅ **Complété (100%)**

### Objectif

Recevoir les constats mensuels depuis le Vault, les valider, les rattacher aux contrats clients, calculer les montants facturables selon des règles tarifaires configurables, et générer automatiquement les factures MRR.

### Architecture Odoo CORE

**Modèles Odoo** :
- `dorevia.constat` : Constats reçus du Vault
- `dorevia.contract` : Contrats clients avec règles tarifaires
- `dorevia.pricing.rule` : Règles tarifaires (paliers, remises, montant fixe)

**Workflow** :
```
Constat reçu → Validation → Rattachement tenant/contrat → Calcul montants → Génération facture
```

### API Endpoint de réception

**Route** : `POST /api/v1/constats`

**Authentification** : API Key (Bearer token)
- Header : `Authorization: api_key <TOKEN>`
- Token configuré dans : `dorevia_billing.core_api_token`

**Validation** :
- Champs obligatoires
- Format 10 caractères alphanumériques pour `constat_id` (0-9, a-z, A-Z)
- Format YYYY-MM pour `period`
- Volumes non négatifs
- Format ISO 8601 UTC pour `generated_at`

**Idempotence** :
- Basée sur `constat_id`
- Tentative de réception d'un constat déjà reçu → **409 Conflict**

### Validation JWS (non bloquante)

**Comportement v1** :
- Si JWS **valide** → `state = 'validated'` → facturation auto possible
- Si JWS **invalide** → `state = 'validated_with_warning'` → **pas de facturation auto**, alerte
- Si JWS **désactivé** → `state = 'validated'` → facturation auto possible

**Configuration** :
- `dorevia_billing.jws_verification_enabled` : Active/désactive la vérification
- `dorevia_billing.jwks_url` : URL du JWKS pour récupérer les clés publiques

**Avantage** : Évite de bloquer la chaîne pour un problème crypto transitoire, tout en restant strict.

### Rattachement tenant et contrat

**Tenant** :
- Recherche via `res.partner.ref = tenant` (code tenant)
- Si non trouvé → constat stocké avec `tenant_id = False`, `invoice_status = 'pending'`
- **Le constat n'est jamais perdu**, peut être rattaché ultérieurement

**Contrat actif** :
- Recherche d'un contrat avec :
  - `active = True`
  - `start_date <= period`
  - `end_date >= period` (ou `end_date = False`)
- Si trouvé → `contract_id` rattaché
- Si non trouvé → `contract_id = False`, `invoice_status = 'pending'`

**Règle importante** :
> **"Un constat sans contrat actif n'est jamais perdu et peut être facturé ultérieurement sans régénération."**

### Calcul des montants facturables

**Modèle hybride (fixe + variable)** :

Chaque règle tarifaire peut avoir :
- **Montant fixe** : Montant qui s'ajoute toujours (ex: 80 € HT)
- **Paliers variables** : Calcul selon le volume (ex: 0,10 € par document)

**Exemple de calcul** :
- Règle : `fixed_amount = 80€`, palier 0-1000 → `0,10€` par document
- Volume : 150 factures
- Calcul :
  - Montant fixe : 80,00 € HT
  - Montant variable : 150 × 0,10 € = 15,00 € HT
  - **Total HT** : 95,00 €

**Application des paliers** :
- Les paliers sont appliqués séquentiellement
- Le montant fixe est ajouté **une seule fois** (première règle applicable)
- Les montants variables sont calculés par tranche selon les paliers

**Remises** :
- Remise en pourcentage applicable sur chaque règle
- Calcul : `montant × (1 - discount_percent / 100)`

**TVA** :
- Taux configurable par contrat (`tax_rate`)
- Exonération possible (`tax_exempt`)
- Calcul : `TTC = HT × (1 + tax_rate / 100)`

### Génération de factures MRR

**Deux lignes de facture** :

1. **Ligne "Montant fixe"** :
   - Libellé : `"Factures clients - Période 2026-01 - Montant fixe"`
   - Quantité : `1`
   - Prix unitaire : `80,00 €` (montant fixe exact)
   - Montant : `80,00 € HT`

2. **Ligne "Part variable"** :
   - Libellé : `"Factures clients - Période 2026-01 - Part variable (150 documents)"`
   - Quantité : `150`
   - Prix unitaire : `0,10 €`
   - Montant : `15,00 € HT`

**Avantage** : Garantit un montant total exact (pas d'erreur d'arrondi).

**Métadonnées de la facture** :
- `invoice_date` : `received_at` (date de réception du constat, UTC)
- `ref` : `constat_id` (référence du constat)
- `invoice_origin` : `"Constat 2026-01 - Vault vault-rozas"`

**Validation automatique** :
- Configurable via `dorevia_billing.auto_post_invoice`
- Si `True` → facture automatiquement validée (`posted`)
- Si `False` → facture en brouillon (`draft`)

### États du constat

| État | Signification | Facturation auto |
|------|---------------|------------------|
| `draft` | Constat créé, en attente de validation | ❌ |
| `validated` | Constat validé, JWS valide (ou désactivé) | ✅ |
| `validated_with_warning` | Constat validé mais JWS invalide | ❌ |
| `invoiced` | Facture générée | - |

### Livrables SPEC 3

✅ **US-3.1** : Migration DB (modèles Odoo)  
✅ **US-3.2** : Modèles Odoo (constat, contract, pricing_rule)  
✅ **US-3.3** : Endpoint de réception avec validation  
✅ **US-3.4** : Rattachement tenant + contrat  
✅ **US-3.5** : Calcul des montants avec règles tarifaires  
✅ **US-3.6** : Génération de factures MRR  
✅ **US-3.7** : Vérification JWS non bloquante + tests

### Fichiers clés

- `units/odoo/custom-addons/dorevia_billing_core/models/dorevia_constat.py` : Modèle constat
- `units/odoo/custom-addons/dorevia_billing_core/models/dorevia_contract.py` : Modèle contrat
- `units/odoo/custom-addons/dorevia_billing_core/models/dorevia_pricing_rule.py` : Modèle règles tarifaires
- `units/odoo/custom-addons/dorevia_billing_core/controllers/constat_controller.py` : Endpoint API
- `units/odoo/custom-addons/dorevia_billing_core/utils/jws.py` : Helper vérification JWS

---

## 🏗️ Architecture technique

### Stack technologique

**Vault (Go)** :
- Framework : **Go Fiber**
- Base de données : **PostgreSQL**
- Cryptographie : **JWS (RS256)**, **Ledger hashing**
- Logging : **zerolog**

**Odoo CORE (Python)** :
- Version : **Odoo 18.0**
- Base de données : **PostgreSQL**
- Dépendances Python : **PyJWT**, **requests** (optionnels)
- Déploiement : **Docker** avec venv pour PEP 668

### Flux de données complet

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX COMPLET DE FACTURATION MRR              │
└─────────────────────────────────────────────────────────────────┘

ÉTAPE 1 : Vaulting des documents
─────────────────────────────────
Odoo Client (Tenant A)
  │
  ├─> POST /api/v1/invoices
  │   Payload: { source, model, state, file, meta }
  │
  └─> Dorevia Vault
      ├─> Validations strictes (5 validations fail-fast)
      ├─> Stockage document + métadonnées
      ├─> Génération JWS + Ledger hash
      └─> Réponse: 201 Created { id, sha256, compliance_status }

ÉTAPE 2 : Génération du constat mensuel
────────────────────────────────────────
Dorevia Vault (1er du mois, 00:00 UTC)
  │
  ├─> Job automatique mensuel
  │   ├─> Période: mois N-1 (ex: 2026-01)
  │   ├─> Agrégation par tenant
  │   │   ├─> Volumes par move_type
  │   │   └─> Statistiques de conformité
  │   ├─> Génération JWS du constat
  │   ├─> Ajout au Ledger
  │   └─> Stockage dans table `constats`
  │
  └─> Transmission automatique
      └─> POST https://odoo.core.doreviateam.com/api/v1/constats

ÉTAPE 3 : Réception et facturation
───────────────────────────────────
Odoo CORE
  │
  ├─> Réception constat
  │   ├─> Validation payload
  │   ├─> Vérification idempotence (constat_id)
  │   ├─> Recherche tenant (res.partner.ref)
  │   ├─> Recherche contrat actif
  │   ├─> Vérification JWS (non bloquante)
  │   └─> Stockage dans dorevia.constat
  │
  ├─> Calcul des montants
  │   ├─> Récupération règles tarifaires
  │   ├─> Application montant fixe (une fois)
  │   ├─> Application paliers variables
  │   ├─> Application remises
  │   └─> Application TVA
  │
  └─> Génération facture MRR
      ├─> Ligne 1: Montant fixe (80,00 €)
      ├─> Ligne 2: Part variable (15,00 €)
      ├─> Total HT: 95,00 €
      ├─> Total TTC: 114,00 €
      └─> Facture créée (draft ou posted selon config)
```

### Isolation multi-tenant

**Par design** :
- Chaque document est isolé par `tenant`
- Chaque constat est isolé par `tenant` + `period`
- Chaque contrat est isolé par `tenant`
- Les factures sont générées par tenant

**Sécurité** :
- API Key pour authentification Vault → CORE
- JWS pour vérification d'intégrité
- Ledger hash pour traçabilité immuable

---

## ⚙️ Fonctionnalités clés

### 1. Idempotence à tous les niveaux

**Document** :
- Basée sur `(tenant, sha256)`
- Tentative de réception d'un document déjà vaulté → **409 Conflict**

**Constat** :
- Basée sur `(tenant, period)`
- Tentative de génération d'un constat existant → retour du constat existant

**Réception constat** :
- Basée sur `constat_id` (10 caractères alphanumériques)
- Tentative de réception d'un constat déjà reçu → **409 Conflict**

### 2. Non-perte de données

**Constat sans tenant** :
- Stocké avec `tenant_id = False`, `invoice_status = 'pending'`
- Peut être rattaché ultérieurement

**Constat sans contrat** :
- Stocké avec `contract_id = False`, `invoice_status = 'pending'`
- Peut être facturé ultérieurement sans régénération

**Règle** :
> **"Un constat sans contrat actif n'est jamais perdu et peut être facturé ultérieurement sans régénération."**

### 3. Génération rétroactive

**Constat** :
- Permet de générer des constats pour des périodes passées
- N'altère jamais les documents déjà vaultés
- Idempotente et non destructive

**Facture** :
- Un constat peut être facturé à tout moment (même si le contrat n'était pas actif à la réception)
- Pas besoin de régénérer le constat

### 4. Validation non bloquante

**JWS invalide** :
- Constat stocké avec `state = 'validated_with_warning'`
- Pas de facturation automatique
- Alerte pour intervention manuelle
- Permet de ne pas bloquer la chaîne pour un problème crypto transitoire

### 5. Retry intelligent

**Transmission Vault → CORE** :
- Retry avec backoff exponentiel pour erreurs temporaires (429, 5xx)
- Pas de retry pour erreurs permanentes (400, 401, 403)
- Statut stocké dans la DB pour suivi

---

## 💰 Modèles de facturation

### Modèle 1 : Paliers simples

**Configuration** :
- Règle 1 : 0-1000 → 0,10 € HT
- Règle 2 : 1000-5000 → 0,08 € HT
- Règle 3 : 5000+ → 0,05 € HT

**Exemple** : 2500 factures
- Tranche 0-1000 : 1000 × 0,10 € = 100,00 €
- Tranche 1000-2500 : 1500 × 0,08 € = 120,00 €
- **Total HT** : 220,00 €

### Modèle 2 : Montant fixe uniquement

**Configuration** :
- Règle : `fixed_amount = 80€`, `tier_to = 1`

**Exemple** : Volume = 1 (toujours)
- Montant fixe : 80,00 € HT
- **Total HT** : 80,00 €

### Modèle 3 : Hybride (Fixe + Variable) ⭐

**Configuration** :
- Règle : `fixed_amount = 80€`, palier 0-1000 → 0,10 € HT

**Exemple** : 150 factures
- Montant fixe : 80,00 € HT
- Montant variable : 150 × 0,10 € = 15,00 € HT
- **Total HT** : 95,00 €

**Facture générée** :
- Ligne 1 : "Montant fixe" → 80,00 € HT
- Ligne 2 : "Part variable (150 documents)" → 15,00 € HT
- **Total HT** : 95,00 € (exact)

---

## 🧪 Tests et validation

### Tests SPEC 1

**Tests unitaires** :
- ✅ `TestValidateAccountMovePayload_ValidPayloads` (AC-1 à AC-4)
- ✅ `TestValidateAccountMovePayload_InvalidModel` (AC-5)
- ✅ `TestValidateAccountMovePayload_InvalidState` (AC-6)
- ✅ `TestValidateAccountMovePayload_InvalidMoveType` (AC-7)
- ✅ `TestValidateAccountMovePayload_SourceMoveTypeMismatch` (AC-8)
- ✅ `TestValidateAccountMovePayload_MissingTenant` (AC-9)
- ✅ `TestDetectFacturXCompliance_*` (AC-17, AC-18)

**Tests d'intégration** :
- ✅ `TestAccountMoveIntegration_OdooMetadata` (AC-11, AC-12)
- ✅ `TestAccountMoveIntegration_JWSLedgerProofs` (AC-13)
- ✅ `TestAccountMoveIntegration_MultiTenantIsolation` (AC-14)
- ✅ `TestAccountMoveNonRegression_OtherDocumentTypes` (AC-15)
- ✅ `TestAccountMoveNonRegression_APIConsistency` (AC-16)

**Couverture de code** :
- ✅ `validateAccountMovePayload()` : **100%**
- ✅ `detectFacturXCompliance()` : **100%**

### Tests SPEC 2

**Tests unitaires** :
- ✅ `TestParsePeriod` : Validation format période
- ✅ `TestVolumesTotal` : Calcul total volumes
- ✅ `TestComplianceTotal` : Calcul total conformité
- ✅ `TestGetComplianceValue` : Extraction valeurs conformité

**Tests d'intégration** :
- ✅ `TestConstatIntegration_GenerateAndGet` : Génération et récupération
- ✅ `TestConstatIntegration_ListConstats` : Liste paginée
- ✅ `TestConstatIntegration_APIEndpoints` : Tous les endpoints
- ✅ `TestConstatIntegration_Idempotence` : Vérification idempotence

### Tests SPEC 3

**Tests unitaires** :
- ✅ `test_constat_reception.py` : Validation payload, idempotence, rattachement
- ✅ `test_constat_integration.py` : Flux complet, génération facture, gestion erreurs

**Tests manuels validés** :
- ✅ Réception constat avec montant fixe + paliers
- ✅ Génération facture avec 2 lignes (fixe + variable)
- ✅ Montant total exact (95,00 € HT)

---

## 🔧 Configuration et déploiement

### Configuration Vault

**Variables d'environnement** :
- `DATABASE_URL` : URL PostgreSQL
- `JWS_PRIVATE_KEY` : Clé privée pour signature JWS
- `LEDGER_ENABLED` : Activer/désactiver le Ledger
- `CORE_URL` : URL Odoo CORE (ex: `https://odoo.core.doreviateam.com`)
- `CORE_TOKEN` : Token API pour authentification
- `VAULT_ID` : Identifiant du Vault (ex: `vault-rozas`)
- `CONSTAT_JOB_ENABLED` : Activer/désactiver le job mensuel

### Configuration Odoo CORE

**Paramètres système** (`ir.config_parameter`) :

1. **`dorevia_billing.core_api_token`** :
   - Token d'authentification API
   - Format : `sk_test_abc123xyz789` (test) ou token fort (production)

2. **`dorevia_billing.jws_verification_enabled`** :
   - Active/désactive la vérification JWS
   - Valeurs : `True` / `False`

3. **`dorevia_billing.jwks_url`** :
   - URL du JWKS pour récupérer les clés publiques
   - Format : `https://vault.example.com/.well-known/jwks.json`

4. **`dorevia_billing.auto_post_invoice`** :
   - Active/désactive la validation automatique des factures
   - Valeurs : `True` / `False`

### Configuration des contrats

**Étapes** :
1. Créer un tenant (`res.partner` avec `ref` = code tenant)
2. Créer un contrat (`dorevia.contract`)
3. Ajouter des règles tarifaires (`dorevia.pricing_rule`)
   - Configurer le montant fixe (défaut : 80 €)
   - Configurer les paliers variables
   - Configurer les remises si nécessaire

### Déploiement Docker

**Vault** :
- Image Go compilée
- Variables d'environnement via `.env` ou `docker-compose.yml`

**Odoo CORE** :
- Image custom : `odoo:18.0-dorevia`
- Dockerfile avec venv pour dépendances Python (PEP 668)
- Module `dorevia_billing_core` installé dans `custom-addons`

---

## ⚠️ Points d'attention et bonnes pratiques

### 1. Gestion des erreurs

**Vault** :
- Erreurs permanentes (400, 401, 403) → pas de retry
- Erreurs temporaires (429, 5xx) → retry avec backoff exponentiel
- Logging structuré avec `zerolog`

**Odoo CORE** :
- Validation JWS non bloquante (évite de bloquer la chaîne)
- Constats sans tenant/contrat stockés (jamais perdus)
- Logging Python standard avec gestion d'exceptions

### 2. Traçabilité

**Chaque facture référence** :
- `ref` = `constat_id` (10 caractères alphanumériques du constat)
- `invoice_origin` = `"Constat 2026-01 - Vault vault-rozas"`
- Lignes de facture détaillées avec période et volumes

**Chaque constat référence** :
- `vault_id` : Identifiant de la source
- `generated_at` : Date/heure de génération
- `received_at` : Date/heure de réception

### 3. Sécurité

**Authentification** :
- API Key pour Vault → CORE
- Token fort en production
- Rotation possible sans impact (changement côté Vault et CORE)

**Intégrité** :
- JWS pour vérification cryptographique
- Ledger hash pour traçabilité immuable
- SHA256 pour identification unique des documents

### 4. Performance

**Agrégation** :
- Index sur `(tenant, period)` pour recherche rapide
- Index sur `created_at` pour filtrage par période
- Agrégation SQL optimisée

**Transmission** :
- Retry avec backoff pour éviter la surcharge
- Statut stocké pour éviter les doublons
- Endpoint de retransmission manuelle pour récupération

### 5. Maintenance

**Monitoring** :
- Logs structurés pour traçabilité
- Statuts de transmission stockés dans la DB
- Alertes si JWS invalide (`validated_with_warning`)

**Récupération** :
- Retransmission manuelle possible
- Génération rétroactive de constats
- Facturation ultérieure de constats sans contrat

---

## 📈 Métriques et KPIs

### Volumes traités

**Par constat** :
- Volumes par `move_type` (out_invoice, in_invoice, etc.)
- Statistiques de conformité Factur-X
- Nombre total de documents

### Facturation

**Par facture** :
- Montant HT (fixe + variable)
- Montant TTC (avec TVA)
- Période facturée
- Volume de documents

### Traçabilité

**Par document** :
- SHA256 pour identification unique
- JWS pour preuve d'intégrité
- Ledger hash pour chaînage

**Par constat** :
- `constat_id` (10 caractères alphanumériques)
- `vault_id` (source)
- `generated_at` / `received_at` (timestamps)

---

## 🎯 Règles métier clés

### Règle 1 : Facturation sur périodes closes

> **"Chaque facture émise au mois N porte sur les volumes constatés durant le mois N-1."**

**Implémentation** :
- Job automatique le 1er du mois à 00:00 UTC
- Génère les constats pour le mois précédent
- Transmet automatiquement à Odoo CORE

### Règle 2 : Montant fixe + variable

> **"Chaque règle tarifaire peut avoir un montant fixe (défaut : 80 €) et des paliers variables."**

**Implémentation** :
- Champ `fixed_amount` dans `dorevia.pricing.rule` (défaut : 80 €)
- Montant fixe ajouté une seule fois (première règle applicable)
- Paliers variables appliqués selon le volume

### Règle 3 : Non-perte de constats

> **"Un constat sans contrat actif n'est jamais perdu et peut être facturé ultérieurement sans régénération."**

**Implémentation** :
- Constat stocké même sans contrat
- `invoice_status = 'pending'` si pas de contrat
- Génération de facture possible ultérieurement

### Règle 4 : Validation JWS non bloquante

> **"Si JWS invalide : stocker avec `state = 'validated_with_warning'`, ne pas facturer automatiquement, alerter."**

**Implémentation** :
- Vérification JWS optionnelle (configurable)
- Si invalide → `validated_with_warning`
- Pas de facturation automatique
- Alerte pour intervention manuelle

---

## 🔄 Flux de données détaillé

### Scénario complet : 150 factures clients en janvier

**Étape 1 : Vaulting (Janvier 2026)**
```
Odoo Client → POST /api/v1/invoices (150 fois)
  ↓
Vault stocke 150 documents
  - move_type: out_invoice
  - tenant: test-tenant-1
  - created_at: 2026-01-01 à 2026-01-31
```

**Étape 2 : Génération constat (1er février 2026, 00:00 UTC)**
```
Job automatique mensuel
  ↓
Agrégation documents janvier 2026
  - Volumes: out_invoice = 150
  - Compliance: compliant = 120, non_compliant_2026 = 20, out_of_scope = 10
  ↓
Génération constat
  - constat_id: aB3dE5fG7h (10 caractères alphanumériques)
  - period: 2026-01
  - JWS: signature cryptographique
  - Ledger hash: hash en chaîne
  ↓
Transmission automatique
  POST https://odoo.core.doreviateam.com/api/v1/constats
```

**Étape 3 : Réception et facturation (1er février 2026)**
```
Odoo CORE reçoit constat
  ↓
Validation payload
  ↓
Recherche tenant (ref = test-tenant-1)
  ↓
Recherche contrat actif (période 2026-01)
  ↓
Vérification JWS (non bloquante)
  ↓
Calcul montants
  - Montant fixe: 80,00 €
  - Montant variable: 150 × 0,10 € = 15,00 €
  - Total HT: 95,00 €
  ↓
Génération facture MRR
  - Ligne 1: Montant fixe (80,00 €)
  - Ligne 2: Part variable (15,00 €)
  - Total HT: 95,00 €
  - Total TTC: 114,00 €
  ↓
Facture créée (draft ou posted selon config)
```

---

## 📊 Exemples de calculs

### Exemple 1 : Volume faible (150 factures)

**Configuration** :
- Montant fixe : 80,00 €
- Palier 0-1000 : 0,10 € HT

**Calcul** :
- Montant fixe : 80,00 € HT
- Montant variable : 150 × 0,10 € = 15,00 € HT
- **Total HT** : 95,00 €
- **Total TTC** : 114,00 € (TVA 20%)

### Exemple 2 : Volume moyen (2500 factures)

**Configuration** :
- Montant fixe : 80,00 €
- Palier 0-1000 : 0,10 € HT
- Palier 1000-5000 : 0,08 € HT

**Calcul** :
- Montant fixe : 80,00 € HT
- Tranche 0-1000 : 1000 × 0,10 € = 100,00 € HT
- Tranche 1000-2500 : 1500 × 0,08 € = 120,00 € HT
- **Total HT** : 300,00 €
- **Total TTC** : 360,00 € (TVA 20%)

### Exemple 3 : Volume élevé (6000 factures)

**Configuration** :
- Montant fixe : 80,00 €
- Palier 0-1000 : 0,10 € HT
- Palier 1000-5000 : 0,08 € HT
- Palier 5000+ : 0,05 € HT

**Calcul** :
- Montant fixe : 80,00 € HT
- Tranche 0-1000 : 1000 × 0,10 € = 100,00 € HT
- Tranche 1000-5000 : 4000 × 0,08 € = 320,00 € HT
- Tranche 5000-6000 : 1000 × 0,05 € = 50,00 € HT
- **Total HT** : 550,00 €
- **Total TTC** : 660,00 € (TVA 20%)

---

## 🛡️ Garanties et sécurité

### Idempotence

- ✅ Document : `(tenant, sha256)` → pas de doublon
- ✅ Constat : `(tenant, period)` → pas de doublon
- ✅ Réception : `constat_id` → pas de doublon

### Intégrité

- ✅ JWS : Signature cryptographique vérifiable
- ✅ Ledger hash : Chaînage immuable
- ✅ SHA256 : Identification unique

### Traçabilité

- ✅ Chaque facture référence son constat (`ref = constat_id`)
- ✅ Chaque constat référence sa source (`vault_id`)
- ✅ Timestamps UTC pour toutes les opérations

### Non-perte

- ✅ Constat sans tenant → stocké, rattachable ultérieurement
- ✅ Constat sans contrat → stocké, facturable ultérieurement
- ✅ Génération rétroactive possible

---

## 📚 Documentation disponible

### Règles fondatrices
- `ZeDocs/V2/REGLES_FONDATRICES_DOREVIA_v1.0.md` : **Doctrine fondatrice irréversible** (socle de référence)

### SPEC 1
- `ZeDocs/V2/SPEC1_VAULTING_ACCOUNT_MOVE_POSTED_v1.0.md` : Spécification complète
- `ZeDocs/V2/PLAN_IMPLEMENTATION_SPEC1_VAULTING_ACCOUNT_MOVE_SCRUM.md` : Plan d'implémentation
- `ZeDocs/V2/ETAT_IMPLEMENTATION_SPEC1_SCRUM.md` : État d'avancement
- `sources/vault/docs/REPONSES_INTEGRATION_API.md` : Documentation API
- `sources/vault/docs/CONNECTEUR_ODOO_SPEC1.md` : Guide connecteur Odoo

### SPEC 2
- `ZeDocs/V2/SPEC2_VAULT_CONSTAT_MENSUEL_v1.0.md` : Spécification complète
- `ZeDocs/V2/PLAN_IMPLEMENTATION_SPEC2_CONSTAT_MENSUEL_SCRUM.md` : Plan d'implémentation
- `ZeDocs/V2/ETAT_IMPLEMENTATION_SPEC2_SCRUM.md` : État d'avancement
- `sources/vault/tests/README_CONSTAT_TESTS.md` : Guide tests

### SPEC 3
- `ZeDocs/V2/SPEC3_ODOO_CORE_RECEPTION_CONSTATS_FACTURATION_v1.0.md` : Spécification complète
- `ZeDocs/V2/PLAN_IMPLEMENTATION_SPEC3_ODOO_CORE_SCRUM.md` : Plan d'implémentation
- `ZeDocs/V2/ETAT_IMPLEMENTATION_SPEC3_SCRUM.md` : État d'avancement
- `units/odoo/custom-addons/dorevia_billing_core/FONCTIONNEMENT_SYSTEME.md` : Fonctionnement détaillé
- `units/odoo/custom-addons/dorevia_billing_core/EXPLICATION_PARAMETRES_SYSTEME.md` : Explication paramètres

---

## 🎉 Résultats et validation

### Tests réussis

✅ **SPEC 1** :
- Validations strictes fonctionnelles
- Métadonnées stockées correctement
- JWS et Ledger hash générés
- Conformité Factur-X détectée
- Idempotence vérifiée
- 100% couverture code fonctions critiques

✅ **SPEC 2** :
- Génération constats mensuels fonctionnelle
- Agrégation volumes et conformité correcte
- Transmission HTTP avec retry opérationnelle
- Job automatique mensuel configuré
- API endpoints fonctionnels
- Tests unitaires et d'intégration passés

✅ **SPEC 3** :
- Réception constats fonctionnelle
- Rattachement tenant/contrat opérationnel
- Calcul montants (fixe + variable) exact
- Génération factures MRR avec 2 lignes
- Montant total exact (95,00 € HT)
- Validation JWS non bloquante implémentée
- Tests validés

### Validation métier

✅ **Règle MRR** : Facturation sur périodes closes (N-1 facturé en N)  
✅ **Modèle hybride** : Montant fixe (80 €) + part variable (paliers)  
✅ **Non-perte** : Constats sans contrat stockés et facturables ultérieurement  
✅ **Idempotence** : Aucun doublon à tous les niveaux  
✅ **Traçabilité** : Chaque facture référence son constat et sa période

---

## 🚀 Prochaines étapes possibles

### Améliorations futures

1. **Dashboard de suivi** :
   - Vue d'ensemble des constats par tenant
   - Statistiques de facturation
   - Alertes (JWS invalide, constats sans contrat)

2. **Export et reporting** :
   - Export CSV/Excel des constats
   - Rapports de facturation par période
   - Analyse des volumes et conformité

3. **Notifications** :
   - Email lors de réception d'un constat
   - Alerte si JWS invalide
   - Notification si constat sans contrat

4. **Optimisations** :
   - Cache des règles tarifaires
   - Agrégation optimisée pour gros volumes
   - Compression des payloads de transmission

5. **Sécurité renforcée** :
   - Rotation automatique des tokens API
   - Audit trail complet
   - Chiffrement des données sensibles

---

## 📞 Support et maintenance

### En cas de problème

**Vault** :
- Vérifier les logs : `docker compose logs vault`
- Vérifier la configuration : variables d'environnement
- Vérifier la base de données : migrations appliquées

**Odoo CORE** :
- Vérifier les logs : `docker compose logs odoo`
- Vérifier les paramètres système : `dorevia_billing.*`
- Vérifier les contrats : actifs et règles tarifaires configurées

### Commandes utiles

**Vault** :
```bash
# Appliquer migrations
go run ./cmd/vault/main.go migrate

# Lancer les tests
go test ./internal/handlers/...
go test ./tests/integration/...
```

**Odoo CORE** :
```bash
# Mettre à jour le module
docker compose exec odoo odoo -u dorevia_billing_core -d odoo_lab_core --stop-after-init

# Vérifier les logs
docker compose logs odoo --tail 50
```

---

## ✅ Checklist de déploiement production

### Vault

- [ ] Token API fort configuré
- [ ] JWS activé avec clés privées/publiques
- [ ] Ledger activé
- [ ] `CORE_URL` et `CORE_TOKEN` configurés
- [ ] `VAULT_ID` unique configuré
- [ ] `CONSTAT_JOB_ENABLED = true`
- [ ] Base de données avec migrations appliquées
- [ ] Tests d'intégration validés

### Odoo CORE

- [ ] Module `dorevia_billing_core` installé
- [ ] `core_api_token` configuré (identique au Vault)
- [ ] `jws_verification_enabled = True` (si JWS activé)
- [ ] `jwks_url` configuré (si JWS activé)
- [ ] `auto_post_invoice` configuré selon workflow
- [ ] Tenants créés avec `ref` correct
- [ ] Contrats créés et actifs
- [ ] Règles tarifaires configurées
- [ ] Tests de réception validés

---

## 🎯 Conclusion

Le système **Dorevia Billing MRR** est **opérationnel et testé**, avec :

✅ **3 SPECs complétées** (Vaulting, Constats, Facturation)  
✅ **Architecture robuste** (idempotence, non-perte, traçabilité)  
✅ **Modèle de facturation flexible** (fixe + variable, paliers, remises)  
✅ **Tests complets** (unitaires, intégration, validation métier)  
✅ **Documentation exhaustive** (spécifications, guides, API)

**Le système est prêt pour la production** après configuration des paramètres de sécurité (tokens, JWS, etc.).

---

**Date de finalisation** : 2026-01-04  
**Dernière mise à jour** : 2026-01-05 (Format `constat_id` : 10 caractères alphanumériques)  
**Version** : 1.0.0  
**Statut** : ✅ **Production Ready**

