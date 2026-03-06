# ✅ SPEC 3 — Odoo CORE : Réception des Constats et Facturation (v1.0)

**Statut** : Spécification technique  
**Version** : 1.0  
**Date** : 2026-01-04  
**Référence** : `REFLECTION_FACTURATION_MRR_VAULT_V2.1`, `SPEC2_VAULT_CONSTAT_MENSUEL_v1.0`  
**Périmètre** : Odoo CORE — Réception des constats mensuels et facturation MRR

> **Prérequis** : 
> - SPEC 1 complétée (vaulting `account.move` `posted`)
> - SPEC 2 complétée (génération et transmission des constats depuis le Vault)

> **⚠️ Règle de facturation MRR** :  
> La facturation MRR est basée sur des **constats mensuels établis sur des périodes closes**.  
> Chaque facture émise au mois N porte sur les volumes constatés durant le mois N-1.  
> Dorevia facture des **faits constatés**, jamais des **faits en cours**.

---

## 1. Objectif

Spécifier l'implémentation dans **Odoo CORE** de :
- la réception des constats mensuels transmis par Dorevia Vault,
- le rattachement des constats aux tenants et contrats,
- l'application des règles contractuelles et fiscales,
- le calcul des montants facturables,
- la génération automatique des factures MRR.

Cette SPEC définit :
- l'endpoint de réception des constats (`POST /api/v1/constats`),
- le modèle de données pour stocker les constats reçus,
- le processus de facturation basé sur les volumes constatés,
- les règles de calcul (prix unitaires, paliers, remises),
- les critères d'acceptation.

> **Principe fondamental** : Odoo CORE **calcule et facture** à partir des constats Vault. Le Vault **constate et atteste des volumes**. Odoo CORE applique les règles métier (prix, contrats, TVA).

---

## 2. Architecture et Frontière Vault / CORE

### 2.1 Schéma architectural

```
VAULT (distribué, multi-tenant)
  │
  │ Documents vaultés (SPEC 1)
  │ └─► account.move posted (par tenant)
  │
  │ Agrégation mensuelle (SPEC 2)
  │ └─► Constat mensuel (tenant, période, volumes, preuves)
  │
  │ Transmission HTTP POST
  │ └─► POST /api/v1/constats
  │
  ▼
ODOO CORE (centralisé)
  │
  │ Réception constats (SPEC 3)
  │ └─► Validation + stockage
  │
  │ Rattachement tenant + contrat
  │ └─► Identification du contrat actif
  │
  │ Calcul et facturation (SPEC 3)
  │ └─► Application règles contractuelles
  │ └─► Calcul montants (prix × volumes)
  │ └─► Génération facture MRR
```

### 2.2 Frontière de responsabilité

**Vault (SPEC 2)** :
- ✅ Agrège les documents vaultés par tenant et période
- ✅ Calcule les volumes par type (`out_invoice`, `in_invoice`, `out_refund`, `in_refund`)
- ✅ Constate la conformité Factur-X (statistiques)
- ✅ Génère les preuves cryptographiques (JWS, Ledger hash)
- ✅ Transmet le constat à Odoo CORE
- ❌ Ne calcule aucun montant
- ❌ Ne connaît pas les prix ni les contrats
- ❌ Ne stocke pas le MRR

**Odoo CORE (SPEC 3)** :
- ✅ Reçoit les constats Vault via API REST
- ✅ Valide l'intégrité des constats (JWS, Ledger hash)
- ✅ Rattache chaque constat à un tenant et un contrat
- ✅ Applique les règles contractuelles et fiscales
- ✅ Calcule les montants (prix unitaires × volumes)
- ✅ Génère les factures MRR
- ✅ Gère les paliers, remises, et règles tarifaires
- ❌ Ne modifie jamais les constats Vault
- ❌ Ne recalcule pas les volumes (fait confiance au Vault)

---

## 3. Unité de Vérité

L'unité de vérité facturable est :

> **1 tenant × 1 période × 1 constat Vault × 1 contrat actif**

Un constat Vault reçu par Odoo CORE est :
- **Horodaté** : Date/heure de génération par le Vault
- **Signé** : Preuve cryptographique (JWS) vérifiable
- **Autonome** : Contient toutes les informations nécessaires
- **Opposable** : Traçable et vérifiable
- **Strictement descriptif** : Volumes uniquement, aucun montant

---

## 4. Format du Constat Reçu

### 4.1 Payload JSON

Le Vault transmet un constat au format JSON suivant :

```json
{
  "constat_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant": "odoo-tenant-1",
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
    "non_compliant_2026": 25,
    "out_of_scope": 5
  },
  "proofs": {
    "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "ledger_hash": "a1b2c3d4e5f6...",
    "documents_count": 199
  }
}
```

### 4.2 Champs obligatoires

| Champ | Type | Description |
|:------|:-----|:------------|
| `constat_id` | UUID | Identifiant unique du constat (généré par le Vault) |
| `tenant` | String | Identifiant du tenant (correspond à `res.partner.code` dans Odoo). Le champ `tenant` est un **identifiant fonctionnel stable**, distinct du nom commercial, utilisé comme **clé de rattachement inter-systèmes**. |
| `period` | String | Période au format `YYYY-MM` (ex: `2026-01`) |
| `generated_at` | ISO 8601 | Date/heure de génération par le Vault (UTC) |
| `vault_id` | String | Identifiant du Vault source (ex: `vault-rozas`) |
| `volumes` | Object | Volumes par type de document (obligatoire) |
| `volumes.out_invoice` | Integer | Nombre de factures clients (`account.move` `out_invoice` `posted`) |
| `volumes.in_invoice` | Integer | Nombre de factures fournisseurs (`account.move` `in_invoice` `posted`) |
| `volumes.out_refund` | Integer | Nombre d'avoirs clients (`account.move` `out_refund` `posted`) |
| `volumes.in_refund` | Integer | Nombre d'avoirs fournisseurs (`account.move` `in_refund` `posted`) |
| `proofs` | Object | Preuves cryptographiques (obligatoire) |
| `proofs.jws` | String | Signature JWS du constat (opposabilité) |
| `proofs.documents_count` | Integer | Nombre total de documents agrégés |

> **Note importante** : Les volumes `in_invoice` et `in_refund` sont facturés en tant qu'**usage de la plateforme** (conservation / conformité), et non en tant que factures fournisseurs au sens comptable. Ces volumes représentent des documents comptables du tenant qui ont été vaultés et nécessitent des services de conservation probante.

### 4.3 Champs optionnels

| Champ | Type | Description |
|:------|:-----|:------------|
| `compliance` | Object | Statistiques de conformité Factur-X (si disponible) |
| `compliance.compliant` | Integer | Nombre de documents conformes Factur-X 2026 |
| `compliance.non_compliant_2026` | Integer | Nombre de documents non conformes Factur-X 2026 |
| `compliance.out_of_scope` | Integer | Nombre de documents hors périmètre Factur-X |
| `proofs.ledger_hash` | String | Hash du ledger (si ledger activé dans le Vault) |

---

## 5. Endpoint de Réception

### 5.1 Spécification HTTP

**Endpoint** : `POST /api/v1/constats`

**Authentification** : Token Bearer (configuré dans le Vault)

**Headers** :
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body** : Payload JSON du constat (voir section 4.1)

**Response 201 Created** :
```json
{
  "status": "received",
  "constat_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant": "odoo-tenant-1",
  "period": "2026-01",
  "processed_at": "2026-02-01T00:05:45Z",
  "invoice_id": null
}
```

**Response 400 Bad Request** :
```json
{
  "error": "invalid_constat",
  "details": "Missing required field: volumes"
}
```

**Response 409 Conflict** :
```json
{
  "error": "duplicate_constat",
  "details": "Constat already received for tenant=odoo-tenant-1, period=2026-01"
}
```

**Response 422 Unprocessable Entity** :
```json
{
  "error": "validation_failed",
  "details": "Invalid period format: expected YYYY-MM"
}
```

### 5.2 Validation

L'endpoint doit valider :

1. **Format JSON** : Le payload est un JSON valide
2. **Champs obligatoires** : Tous les champs obligatoires sont présents
3. **Types de données** : Les types correspondent aux spécifications
4. **Format période** : `period` au format `YYYY-MM` (regex: `^\d{4}-\d{2}$`)
5. **Volumes non négatifs** : Tous les volumes sont ≥ 0
6. **JWS valide** : La signature JWS est vérifiée (si vérification activée) — **non bloquant en v1** (voir section 9.1)
7. **Idempotence** : Un constat avec le même `(constat_id)` n'a pas déjà été reçu

### 5.3 Gestion des Erreurs

| Code HTTP | Scénario | Action |
|:----------|:---------|:-------|
| 201 | Constat reçu et traité | Stocker le constat, déclencher la facturation |
| 400 | Payload invalide (format, champs manquants) | Rejeter, ne pas stocker |
| 401 | Token invalide ou manquant | Rejeter, journaliser l'erreur |
| 409 | Constat déjà reçu (idempotence) | Retourner le constat existant |
| 422 | Validation échouée (période invalide, volumes négatifs) | Rejeter, retourner les détails |
| 500 | Erreur serveur (DB, calcul) | Rejeter, journaliser, permettre retry |

---

## 6. Modèle de Données Odoo

### 6.1 Table `dorevia_constat`

Stockage des constats reçus du Vault.

| Champ | Type | Description |
|:------|:-----|:------------|
| `id` | Integer | ID Odoo (auto) |
| `constat_id` | Char(36) | UUID du constat (unique, index) |
| `tenant_id` | Many2one(`res.partner`) | Partenaire tenant (relation) |
| `period` | Char(7) | Période `YYYY-MM` (index) |
| `generated_at` | Datetime | Date/heure de génération par le Vault (UTC) |
| `received_at` | Datetime | Date/heure de réception par Odoo CORE (UTC) |
| `vault_id` | Char(255) | Identifiant du Vault source |
| `volumes_out_invoice` | Integer | Nombre de factures clients |
| `volumes_in_invoice` | Integer | Nombre de factures fournisseurs |
| `volumes_out_refund` | Integer | Nombre d'avoirs clients |
| `volumes_in_refund` | Integer | Nombre d'avoirs fournisseurs |
| `compliance_compliant` | Integer | Documents conformes Factur-X |
| `compliance_non_compliant_2026` | Integer | Documents non conformes Factur-X 2026 |
| `compliance_out_of_scope` | Integer | Documents hors périmètre Factur-X |
| `proofs_jws` | Text | Signature JWS (stockage pour audit) |
| `proofs_ledger_hash` | Char(255) | Hash du ledger (si disponible) |
| `proofs_documents_count` | Integer | Nombre total de documents agrégés |
| `contract_id` | Many2one(`dorevia.contract`) | Contrat actif au moment de la réception |
| `invoice_id` | Many2one(`account.move`) | Facture générée (si facturé) |
| `invoice_status` | Selection | Statut : `pending`, `invoiced`, `cancelled` |
| `state` | Selection | État : `draft`, `validated`, `validated_with_warning`, `invoiced`, `cancelled` |

> **Note sur le statut `cancelled`** : Le statut `cancelled` est réservé aux cas exceptionnels (annulation administrative, erreur de contrat, correction post-facturation), et ne remet pas en cause l'existence du constat. Le constat reste traçable et opposable, seule sa facturation est annulée.
| `create_date` | Datetime | Date de création (Odoo) |
| `write_date` | Datetime | Date de modification (Odoo) |

**Contraintes** :
- `UNIQUE(constat_id)` : Un constat ne peut être reçu qu'une fois
- `UNIQUE(tenant_id, period)` : Un seul constat par tenant et période (idempotence)
- `CHECK(period ~ '^\d{4}-\d{2}$')` : Format période valide

**Index** :
- `idx_constat_tenant_period` : `(tenant_id, period)`
- `idx_constat_period` : `(period)`
- `idx_constat_invoice_status` : `(invoice_status)`

### 6.2 Table `dorevia_contract`

Stockage des contrats de facturation MRR.

| Champ | Type | Description |
|:------|:-----|:------------|
| `id` | Integer | ID Odoo (auto) |
| `name` | Char(255) | Nom du contrat |
| `tenant_id` | Many2one(`res.partner`) | Partenaire tenant |
| `start_date` | Date | Date de début du contrat |
| `end_date` | Date | Date de fin (optionnel) |
| `active` | Boolean | Contrat actif |
| `pricing_rule_ids` | One2many(`dorevia.pricing_rule`) | Règles tarifaires |
| `create_date` | Datetime | Date de création |
| `write_date` | Datetime | Date de modification |

### 6.3 Table `dorevia_pricing_rule`

Règles tarifaires (prix unitaires, paliers, remises).

| Champ | Type | Description |
|:------|:-----|:------------|
| `id` | Integer | ID Odoo (auto) |
| `contract_id` | Many2one(`dorevia.contract`) | Contrat parent |
| `move_type` | Selection | Type : `out_invoice`, `in_invoice`, `out_refund`, `in_refund` |
| `price_unit` | Monetary | Prix unitaire (HT) |
| `currency_id` | Many2one(`res.currency`) | Devise |
| `tier_from` | Integer | Paliers : volume minimum (inclus) |
| `tier_to` | Integer | Paliers : volume maximum (exclus, null = infini) |
| `discount_percent` | Float | Remise en pourcentage (0-100) |
| `sequence` | Integer | Ordre d'application des règles |
| `active` | Boolean | Règle active |

---

## 7. Processus de Facturation

### 7.1 Flux de Traitement

```
1. Réception constat (POST /api/v1/constats)
   │
   ├─► Validation format et champs
   ├─► Vérification idempotence (constat_id unique)
   ├─► Stockage dans dorevia_constat
   │
2. Rattachement tenant + contrat
   │
   ├─► Recherche tenant par code (tenant field)
   ├─► Recherche contrat actif pour ce tenant et cette période
   ├─► Mise à jour constat.contract_id
   │
3. Vérification JWS (si activée)
   │
   ├─► Vérifier signature JWS
   ├─► Si valide : constat.state = 'validated'
   └─► Si invalide : constat.state = 'validated_with_warning' (ne pas facturer automatiquement)
   │
4. Calcul des montants (si state = 'validated' et contract_id présent)
   │
   ├─► Application des règles tarifaires (dorevia_pricing_rule)
   ├─► Calcul par move_type : prix_unit × volume (avec paliers/remises)
   ├─► Agrégation des montants HT
   ├─► Application TVA (selon règles contractuelles)
   ├─► Calcul montant TTC
   │
5. Génération facture (si state = 'validated' et contract_id présent)
   │
   ├─► Création account.move (type: out_invoice)
   ├─► Lignes de facturation (une ligne par move_type ou par palier selon config)
   ├─► Rattachement constat.invoice_id
   ├─► Mise à jour constat.invoice_status = 'invoiced'
   │
6. Validation automatique (optionnel)
   │
   └─► account.move.action_post() si configuré
```

### 7.2 Règles de Calcul

#### 7.2.1 Prix Unitaires

Pour chaque `move_type` (out_invoice, in_invoice, out_refund, in_refund) :

1. Rechercher les règles tarifaires actives pour le contrat et le `move_type`
2. Trier par `sequence` (ordre croissant)
3. Appliquer les règles dans l'ordre jusqu'à couvrir le volume total

**Exemple** :
```
Contrat: Premium
move_type: out_invoice
Volume constaté: 150

Règles:
- Règle 1: tier_from=0, tier_to=100, price_unit=1.00€, discount=0%
- Règle 2: tier_from=100, tier_to=200, price_unit=0.90€, discount=5%
- Règle 3: tier_from=200, tier_to=null, price_unit=0.80€, discount=10%

Calcul:
- Tranche 0-100: 100 × 1.00€ × (1 - 0%) = 100.00€
- Tranche 100-150: 50 × 0.90€ × (1 - 5%) = 42.75€
- Total HT: 142.75€
```

#### 7.2.2 Remises

Les remises sont appliquées après le calcul par palier.

**Formule** :
```
Montant ligne = (volume × price_unit) × (1 - discount_percent / 100)
```

#### 7.2.3 TVA

La TVA est appliquée selon les règles contractuelles :

- **Taux par défaut** : 20% (TVA standard française)
- **Taux personnalisé** : Défini dans le contrat (`dorevia_contract.tax_rate`)
- **Exonération** : Si `dorevia_contract.tax_exempt = True`

**Formule** :
```
Montant TTC = Montant HT × (1 + tax_rate / 100)
```

### 7.3 Génération de la Facture

#### 7.3.1 Structure de la Facture

**Type** : `account.move` (type: `out_invoice`)

**Partenaire** : `tenant_id` (partenaire tenant)

**Date** : Date de réception du constat (UTC) — `received_at`

> **Règle figée** : La date de facture est toujours la date de réception du constat (`received_at`), en UTC. Cette règle garantit la cohérence avec la facturation N-1/N et l'opposabilité. Cette règle peut être rendue configurable ultérieurement si besoin.

**Lignes de facturation** :

| Description | Quantité | Prix unitaire | Remise | Montant HT |
|:------------|:---------|:--------------|:-------|:-----------|
| Factures clients (out_invoice) | 150 | 1.00€ | 0% | 100.00€ |
| Factures clients (palier 100-200) | 50 | 0.90€ | 5% | 42.75€ |
| Factures fournisseurs (in_invoice) | 45 | 0.50€ | 0% | 22.50€ |
| Avoirs clients (out_refund) | 3 | 0.30€ | 0% | 0.90€ |
| Avoirs fournisseurs (in_refund) | 1 | 0.20€ | 0% | 0.20€ |
| **Total HT** | | | | **166.35€** |
| **TVA (20%)** | | | | **33.27€** |
| **Total TTC** | | | | **199.62€** |

> **Note** : Les lignes de facturation peuvent être **agrégées** (une ligne par `move_type`) ou **détaillées par palier** (une ligne par tranche de palier) selon la configuration CORE. L'exemple ci-dessus montre un détail par palier pour illustration. La SPEC n'impose pas un format unique, laissant la liberté d'implémentation à Odoo CORE.

#### 7.3.2 Métadonnées de la Facture

La facture doit inclure des métadonnées de traçabilité :

- **Référence constat** : `constat_id` dans le champ `ref` ou `invoice_origin`
- **Période facturée** : `period` dans un champ personnalisé
- **Vault source** : `vault_id` dans un champ personnalisé
- **Preuve JWS** : Stockée dans `dorevia_constat.proofs_jws` (audit)

---

## 8. Idempotence

### 8.1 Principe

Un constat avec le même `constat_id` ne doit être traité qu'une seule fois.

**Mécanisme** :
1. Vérifier si `dorevia_constat` existe avec `constat_id` donné
2. Si oui, retourner le constat existant (HTTP 409 Conflict avec détails)
3. Si non, créer le nouveau constat

### 8.2 Gestion des Doublons

**Scénario 1 : Constat déjà reçu (même `constat_id`)**
- **Action** : Retourner HTTP 409 avec le constat existant
- **Log** : Journaliser l'événement (tentative de doublon)

**Scénario 2 : Constat pour même `(tenant, period)` mais `constat_id` différent**
- **Action** : Rejeter avec HTTP 409 (un seul constat par période)
- **Log** : Journaliser l'erreur (conflit de période)

**Scénario 3 : Retry après erreur temporaire**
- **Action** : Si `constat_id` existe déjà, retourner le constat existant (idempotence)
- **Log** : Journaliser le retry

---

## 9. Validation et Vérification

### 9.1 Vérification JWS (Optionnel, Non Bloquante en v1)

Si la vérification JWS est activée :

1. Récupérer la clé publique JWKS du Vault (endpoint `/api/v1/jwks`)
2. Vérifier la signature JWS du constat
3. **Comportement en v1 (recommandé)** : Si JWS invalide :
   - ✅ **Stocker le constat** (ne pas rejeter)
   - ✅ **Marquer `state = 'validated_with_warning'`** (au lieu de `validated`)
   - ✅ **Ne pas facturer automatiquement** (bloquer la génération de facture)
   - ✅ **Alerter** (notification, log d'erreur, dashboard)
   - ✅ **Permettre facturation manuelle ultérieure** (après vérification)

> **Principe v1** : La validation JWS est **non bloquante** pour éviter d'interrompre la chaîne de facturation en cas de problème crypto transitoire (expiration clé, réseau, etc.). Le constat est stocké avec un warning, permettant une intervention manuelle si nécessaire. Cette approche garantit la **non-perte de faits** tout en maintenant la **rigueur cryptographique**.

**Note** : La vérification JWS peut être désactivée en environnement de test. En production, la vérification est recommandée mais non bloquante en v1.

### 9.2 Vérification Ledger Hash (Optionnel)

Si le ledger hash est fourni :

1. Stocker le hash dans `dorevia_constat.proofs_ledger_hash`
2. (Optionnel) Vérifier la cohérence avec le ledger du Vault
3. Si incohérent, journaliser un avertissement (ne pas rejeter)

---

## 10. API et Endpoints

### 10.1 Endpoint de Réception

**POST** `/api/v1/constats`

Voir section 5 pour les détails.

### 10.2 Endpoint de Consultation

**GET** `/api/v1/constats/:constat_id`

Retourne les détails d'un constat reçu.

**Response 200 OK** :
```json
{
  "constat_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant": "odoo-tenant-1",
  "period": "2026-01",
  "generated_at": "2026-02-01T00:05:23Z",
  "received_at": "2026-02-01T00:05:45Z",
  "volumes": {
    "out_invoice": 150,
    "in_invoice": 45,
    "out_refund": 3,
    "in_refund": 1
  },
  "invoice_id": 12345,
  "invoice_status": "invoiced"
}
```

### 10.3 Endpoint de Liste

**GET** `/api/v1/constats?tenant=odoo-tenant-1&period=2026-01`

Liste les constats avec filtres optionnels.

**Query Parameters** :
- `tenant` : Filtrer par tenant
- `period` : Filtrer par période
- `invoice_status` : Filtrer par statut de facturation
- `limit` : Nombre de résultats (défaut: 50)
- `offset` : Pagination (défaut: 0)

---

## 11. Critères d'Acceptation

### AC-1 : Réception de Constat

- [ ] L'endpoint `POST /api/v1/constats` accepte un payload JSON valide
- [ ] Les champs obligatoires sont validés
- [ ] Le constat est stocké dans `dorevia_constat`
- [ ] Un constat avec le même `constat_id` n'est pas dupliqué (idempotence)
- [ ] Un constat pour le même `(tenant, period)` est rejeté si un autre existe déjà

### AC-2 : Rattachement Tenant + Contrat

- [ ] Le tenant est identifié par le champ `tenant` (correspond à `res.partner.code`). Le champ `tenant` est un identifiant fonctionnel stable, distinct du nom commercial, utilisé comme clé de rattachement inter-systèmes.
- [ ] Le contrat actif est identifié pour le tenant et la période
- [ ] Si aucun contrat actif, le constat est stocké avec `contract_id = null` et `invoice_status = 'pending'`
- [ ] **Règle explicite** : Un constat sans contrat actif **n'est jamais perdu** et peut être facturé ultérieurement sans régénération (après création/activation du contrat)
- [ ] Si plusieurs contrats actifs, le plus récent est sélectionné

### AC-3 : Calcul des Montants

- [ ] Les règles tarifaires sont appliquées dans l'ordre (`sequence`)
- [ ] Les paliers sont correctement calculés (tranches de volumes)
- [ ] Les remises sont appliquées après le calcul par palier
- [ ] La TVA est appliquée selon les règles contractuelles
- [ ] Les montants HT et TTC sont corrects

### AC-4 : Génération de Facture

- [ ] Une facture `account.move` (type: `out_invoice`) est créée
- [ ] Les lignes de facturation correspondent aux volumes constatés
- [ ] Le constat est rattaché à la facture (`constat.invoice_id`)
- [ ] Le statut est mis à jour (`constat.invoice_status = 'invoiced'`)
- [ ] Les métadonnées (constat_id, period, vault_id) sont incluses

### AC-5 : Gestion des Erreurs

- [ ] Les erreurs de validation retournent HTTP 400/422 avec détails
- [ ] Les doublons retournent HTTP 409 avec le constat existant
- [ ] Les erreurs serveur retournent HTTP 500 avec journalisation
- [ ] Les retries sont supportés (idempotence)

### AC-6 : Traçabilité

- [ ] Le `constat_id` est stocké et indexé
- [ ] La date de réception (`received_at`) est enregistrée
- [ ] Le `vault_id` est stocké pour traçabilité
- [ ] La preuve JWS est stockée pour audit
- [ ] Le lien constat ↔ facture est traçable

---

## 12. Implémentation Technique

### 12.1 Module Odoo

**Nom du module** : `dorevia_billing_core`

**Structure** :
```
dorevia_billing_core/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   ├── dorevia_constat.py
│   ├── dorevia_contract.py
│   └── dorevia_pricing_rule.py
├── controllers/
│   ├── __init__.py
│   └── constat_controller.py
├── security/
│   ├── ir.model.access.csv
│   └── security.xml
├── data/
│   └── ir_config_parameter.xml
└── tests/
    └── test_constat_reception.py
```

### 12.2 Dépendances

- `base` : Modèles de base Odoo
- `account` : Module comptable (factures)
- `contacts` : Partenaires (`res.partner`)

### 12.3 Configuration

**Paramètres système** (`ir.config_parameter`) :

- `dorevia_billing.core_api_token` : Token d'authentification pour l'API
- `dorevia_billing.jws_verification_enabled` : Activer la vérification JWS (bool)
- `dorevia_billing.jwks_url` : URL du JWKS du Vault
- `dorevia_billing.auto_post_invoice` : Valider automatiquement les factures (bool)

---

## 13. Tests

### 13.1 Tests Unitaires

- Test de validation du payload JSON
- Test de calcul des montants (paliers, remises)
- Test d'idempotence (doublons)
- Test de rattachement tenant + contrat

### 13.2 Tests d'Intégration

- Test de réception complète (endpoint → stockage → facturation)
- Test de génération de facture avec règles tarifaires
- Test de gestion des erreurs (validation, doublons)

---

## 14. Définition de "Fait" (DoD)

La SPEC 3 est terminée si :

- ✅ L'endpoint `POST /api/v1/constats` est implémenté et testé
- ✅ Le modèle `dorevia_constat` est créé avec toutes les migrations
- ✅ Le rattachement tenant + contrat fonctionne
- ✅ Le calcul des montants avec règles tarifaires est correct
- ✅ La génération de factures MRR est automatique
- ✅ Les tests AC-1..AC-6 passent
- ✅ La documentation API est à jour
- ✅ Le déploiement en environnement de test est validé

---

## 15. Suite

- **SPEC 4** : (À définir) — Améliorations et optimisations

---

**Fin de la SPEC 3 (v1.0).**

