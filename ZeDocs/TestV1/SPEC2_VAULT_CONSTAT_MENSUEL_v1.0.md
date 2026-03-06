# ✅ SPEC 2 — Vault → Constat Mensuel (v1.0)

**Statut** : Spécification technique  
**Version** : 1.0  
**Date** : 2026-01-03  
**Référence** : `REFLECTION_FACTURATION_MRR_VAULT_V2.1`  
**Périmètre** : Dorevia Vault — Génération et transmission de constats mensuels vers Odoo CORE

> **Prérequis** : SPEC 1 complétée (vaulting `account.move` `posted`)

> **⚠️ Règle de facturation MRR** :  
> La facturation MRR est basée sur des **constats mensuels établis sur des périodes closes**.  
> Chaque facture émise au mois N porte sur les volumes constatés durant le mois N-1.  
> Dorevia facture des **faits constatés**, jamais des **faits en cours**.

---

## 1. Objectif

Spécifier l'implémentation de la génération et de la transmission de **constats mensuels** depuis Dorevia Vault vers Odoo CORE, pour permettre la facturation centralisée basée sur les volumes attestés.

Cette SPEC définit :
- l'agrégation des documents vaultés par tenant et par période **close**,
- le format du constat mensuel,
- le mécanisme de transmission vers Odoo CORE,
- les métadonnées incluses (volumes, conformité Factur-X, preuves),
- les critères d'acceptation.

> **Principe fondamental** : Le Vault **constate et atteste des volumes**. Odoo CORE **calcule et facture**. Le Vault ne connaît ni les prix, ni les contrats, ni la TVA.

> **⚠️ Règle de facturation MRR** :  
> Dorevia facture des **faits constatés**, jamais des **faits en cours**.  
> Chaque facture émise au mois N porte sur les volumes constatés durant le mois N-1 (période close).

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
  ▼
ODOO CORE (centralisé)
  │
  │ Réception constats
  │ └─► Rattachement tenant + contrat
  │
  │ Calcul et facturation (SPEC 3)
  │ └─► Facture par tenant et par période
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
- ✅ Reçoit les constats Vault
- ✅ Rattache chaque constat à un tenant et un contrat
- ✅ Applique les règles contractuelles et fiscales
- ✅ Calcule les montants
- ✅ Génère les factures

---

## 3. Unité de Vérité

L'unité de vérité facturable est :

> **1 tenant × 1 période × 1 constat Vault**

Un constat Vault est :
- **Horodaté** : Date/heure de génération
- **Signé** : Preuve cryptographique (JWS)
- **Autonome** : Contient toutes les informations nécessaires
- **Opposable** : Traçable et vérifiable
- **Strictement descriptif** : Volumes uniquement, aucun montant

---

## 4. Période de Constat

### 4.1 Définition

- **Période** : Mois calendaire clos (ex: 2026-01 pour janvier 2026)
- **Format** : `YYYY-MM` (ISO 8601)
- **Génération** : Après la clôture de la période (début du mois suivant)

> **⚠️ Règle de facturation MRR** :  
> La facturation MRR est basée sur des **constats mensuels établis sur des périodes closes**.  
> Chaque facture émise au mois N porte sur les volumes constatés durant le mois N-1.  
> Dorevia facture des **faits constatés**, jamais des **faits en cours**.

**Exemple** :
- Constat pour période `2026-01` (janvier) → Généré en février 2026
- Facture de février 2026 → Porte sur les volumes de janvier 2026 (période close)
- Les documents du mois en cours (février) ne sont pas facturés avant mars

### 4.2 Documents inclus dans un constat

Un constat mensuel inclut **tous les documents vaultés** pour un tenant donné pendant la période :
- Documents avec `created_at` dans la période
- Documents `account.move` en état `posted`
- Tous les `move_type` : `out_invoice`, `in_invoice`, `out_refund`, `in_refund`

**Borne temporelle explicite** :
> Les documents inclus sont ceux dont `created_at` ∈ [`start_of_period`, `end_of_period`], en UTC.
> 
> - `start_of_period` : Premier jour du mois à 00:00:00 UTC (ex: `2026-01-01T00:00:00Z`)
> - `end_of_period` : Dernier jour du mois à 23:59:59 UTC (ex: `2026-01-31T23:59:59Z`)

Cette précision évite toute ambiguïté liée au fuseau horaire ou aux cas limites (edge cases).

---

## 5. Format du Constat Mensuel

### 5.1 Structure JSON

```json
{
  "constat_id": "uuid-du-constat",
  "tenant": "laplatine",
  "period": "2026-01",
  "generated_at": "2026-02-01T00:00:00Z",
  "vault_id": "vault-instance-id",
  "volumes": {
    "out_invoice": 1250,
    "in_invoice": 342,
    "out_refund": 12,
    "in_refund": 5
  },
  "compliance": {
    "compliant": 890,
    "non_compliant_2026": 234,
    "out_of_scope": 485
  },
  "proofs": {
    "jws": "eyJhbGciOiJSUzI1NiIs...",
    "ledger_hash": "abc123def456...",
    "documents_count": 1609,
    "documents_sha256_list": [
      "sha256_doc1",
      "sha256_doc2",
      "..."
    ]
  },
  "metadata": {
    "first_document_date": "2026-01-02T10:30:00Z",
    "last_document_date": "2026-01-31T23:45:00Z",
    "total_documents": 1609
  }
}
```

### 5.2 Champs obligatoires

| Champ | Type | Description |
|-------|------|-------------|
| `constat_id` | UUID | Identifiant unique du constat |
| `tenant` | string | Identifiant du tenant |
| `period` | string | Période au format `YYYY-MM` |
| `generated_at` | ISO 8601 | Date/heure de génération du constat |
| `vault_id` | string | Identifiant de l'instance Vault |
| `volumes` | object | Volumes par type de document |
| `proofs` | object | Preuves cryptographiques |

### 5.3 Champs optionnels

| Champ | Type | Description |
|-------|------|-------------|
| `compliance` | object | Statistiques de conformité Factur-X |
| `metadata` | object | Métadonnées additionnelles |

### 5.4 Détail des volumes

```json
{
  "volumes": {
    "out_invoice": 1250,    // Nombre de factures clients
    "in_invoice": 342,      // Nombre de factures fournisseurs
    "out_refund": 12,      // Nombre d'avoirs clients
    "in_refund": 5         // Nombre d'avoirs fournisseurs
  }
}
```

**Total** : Somme de tous les volumes = nombre total de documents vaultés pour la période.

### 5.5 Détail de la conformité (optionnel)

```json
{
  "compliance": {
    "compliant": 890,              // Documents avec Factur-X présent
    "non_compliant_2026": 234,     // Documents B2B sans Factur-X
    "out_of_scope": 485            // Documents B2C ou non qualifiés
  }
}
```

**Note** : Ces statistiques sont **informatives** pour Odoo CORE. Elles n'influencent pas le calcul des montants.

### 5.6 Détail des preuves

```json
{
  "proofs": {
    "jws": "eyJhbGciOiJSUzI1NiIs...",  // JWS signant le constat complet
    "ledger_hash": "abc123def456...",   // Hash dans le ledger (si activé)
    "documents_count": 1609,            // Nombre de documents inclus
    "documents_sha256_list": [          // Liste des SHA256 (optionnel, peut être limitée)
      "sha256_doc1",
      "sha256_doc2"
    ]
  }
}
```

**Note** : La liste complète des `documents_sha256_list` peut être omise si trop volumineuse. 

> **Référence d'intégrité** : Si `documents_sha256_list` est tronquée ou omise, le **JWS** et le **ledger_hash** restent la **référence d'intégrité** et garantissent l'opposabilité du constat.

---

## 6. Génération du Constat

### 6.1 Déclencheur

**Option 1 : Automatique (recommandé)**
- Déclenchement automatique après la clôture de la période
- Exécution le 1er jour du mois suivant à 00:00 UTC (ou après un délai de sécurité)
- Job/cron configuré dans le Vault
- **Période close** : Le constat couvre uniquement les documents de la période précédente (mois N-1)

**Exemple** :
- Le 1er février 2026 à 00:00 UTC → Génération du constat pour période `2026-01` (janvier, période close)
- Le 1er mars 2026 à 00:00 UTC → Génération du constat pour période `2026-02` (février, période close)

**Option 2 : Manuel**
- Endpoint API pour déclencher la génération manuellement
- Utile pour tests, corrections, ou périodes personnalisées

### 6.2 Processus de génération

1. **Sélection des documents** :
   - Filtrer par `tenant`
   - Filtrer par `created_at` dans la période **close** (voir §4.2 pour la borne temporelle explicite)
   - Filtrer par `model = 'account.move'` et `state = 'posted'`
   
   **Note sur le champ temporel** : Le champ `created_at` (nom canonique) correspond à la date/heure d'ingestion du document dans le Vault, tel que défini dans la SPEC 1. Ce champ est stocké en UTC dans la base de données.
   
   **⚠️ Période close uniquement** : Seuls les documents de la période **close** (mois précédent) sont inclus dans le constat. Les documents du mois en cours ne sont jamais inclus.

2. **Agrégation des volumes** :
   - Compter par `move_type` (`out_invoice`, `in_invoice`, `out_refund`, `in_refund`)

3. **Calcul de la conformité** (optionnel) :
   - Compter par `compliance_status` (`compliant`, `non_compliant_2026`, `out_of_scope`)

4. **Génération des preuves** :
   - Créer un JWS signant le constat complet
   - Ajouter au ledger si activé
   - Générer `constat_id` (UUID)

5. **Stockage du constat** :
   - Stocker en base de données (table `constats` ou équivalent)
   - Marquer comme "généré" avec `generated_at`

6. **Transmission vers CORE** :
   - Envoyer le constat à Odoo CORE (API ou webhook)

---

## 7. Transmission vers Odoo CORE

### 7.1 Méthode de transmission

**Option 1 : API REST (recommandé)**
- Endpoint Odoo CORE : `POST /api/v1/constats` (à définir dans SPEC 3)
- Format : JSON avec le constat complet
- Authentification : JWT ou API Key

**Option 2 : Webhook**
- Odoo CORE expose un webhook
- Vault envoie le constat via POST HTTP
- Retry automatique en cas d'échec

**Option 3 : File-based (temporaire)**
- Export du constat en JSON
- Transfert via SFTP ou stockage partagé
- Import manuel ou automatique dans CORE

### 7.2 Gestion des erreurs

**Erreurs permanentes** (400, 401, 403) :
- Ne pas retry
- Logger l'erreur
- Notifier l'administrateur
- Marquer le constat comme "échec transmission"

**Erreurs temporaires** (429, 500, 502, 503, 504) :
- Retry avec backoff exponentiel
- Maximum 5 tentatives
- Marquer comme "en attente" puis "transmis" ou "échec"

### 7.3 Idempotence

- Si un constat pour `(tenant, period)` existe déjà, Odoo CORE doit retourner `200 OK`
- Le Vault peut vérifier avant envoi si le constat a déjà été transmis
- En cas de doublon, ne pas générer d'erreur

---

## 8. Stockage des Constats

### 8.1 Table `constats` (à créer)

```sql
CREATE TABLE constats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant VARCHAR(255) NOT NULL,
    period VARCHAR(7) NOT NULL,  -- YYYY-MM
    generated_at TIMESTAMP NOT NULL,
    vault_id VARCHAR(255),
    volumes_out_invoice INTEGER DEFAULT 0,
    volumes_in_invoice INTEGER DEFAULT 0,
    volumes_out_refund INTEGER DEFAULT 0,
    volumes_in_refund INTEGER DEFAULT 0,
    compliance_compliant INTEGER DEFAULT 0,
    compliance_non_compliant_2026 INTEGER DEFAULT 0,
    compliance_out_of_scope INTEGER DEFAULT 0,
    proofs_jws TEXT,
    proofs_ledger_hash VARCHAR(255),
    proofs_documents_count INTEGER DEFAULT 0,
    transmitted_at TIMESTAMP,
    transmission_status VARCHAR(50),  -- pending, transmitted, failed
    transmission_error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant, period)
);

CREATE INDEX idx_constats_tenant_period ON constats(tenant, period);
CREATE INDEX idx_constats_transmission_status ON constats(transmission_status);
```

### 8.2 Relation avec documents

Les constats référencent les documents via :
- Filtrage par `tenant` et `created_at` dans la période (voir §4.2 pour la borne temporelle explicite)
- Pas de relation directe en DB (agrégation à la volée)

**Champ temporel canonique** : Le champ `created_at` (nom canonique utilisé dans la SPEC 1 et dans le modèle `Document`) correspond à la date/heure d'ingestion du document dans le Vault, stockée en UTC. Ce champ est la référence temporelle pour l'agrégation mensuelle.

---

## 9. API Vault — Endpoints

### 9.1 Génération automatique

**Pas d'endpoint public** : Génération automatique via cron/job interne.

### 9.2 Génération manuelle

**Endpoint** : `POST /api/v1/constats/generate`

**Payload** :
```json
{
  "tenant": "laplatine",
  "period": "2026-01"
}
```

**Réponse** :
```json
{
  "constat_id": "uuid-du-constat",
  "tenant": "laplatine",
  "period": "2026-01",
  "generated_at": "2026-02-01T00:00:00Z",
  "volumes": {
    "out_invoice": 1250,
    "in_invoice": 342,
    "out_refund": 12,
    "in_refund": 5
  },
  "status": "generated"
}
```

### 9.3 Consultation d'un constat

**Endpoint** : `GET /api/v1/constats/:tenant/:period`

**Exemple** : `GET /api/v1/constats/laplatine/2026-01`

**Réponse** : Constat complet (voir format §5.1)

### 9.4 Liste des constats

**Endpoint** : `GET /api/v1/constats?tenant=laplatine&limit=10&offset=0`

**Réponse** :
```json
{
  "constats": [
    {
      "constat_id": "uuid-1",
      "tenant": "laplatine",
      "period": "2026-01",
      "generated_at": "2026-02-01T00:00:00Z",
      "transmission_status": "transmitted"
    },
    {
      "constat_id": "uuid-2",
      "tenant": "laplatine",
      "period": "2025-12",
      "generated_at": "2026-01-01T00:00:00Z",
      "transmission_status": "transmitted"
    }
  ],
  "total": 24,
  "limit": 10,
  "offset": 0
}
```

### 9.5 Retransmission d'un constat

**Endpoint** : `POST /api/v1/constats/:tenant/:period/retransmit`

**Réponse** :
```json
{
  "constat_id": "uuid-du-constat",
  "tenant": "laplatine",
  "period": "2026-01",
  "transmitted_at": "2026-02-01T10:30:00Z",
  "transmission_status": "transmitted"
}
```

---

## 10. Critères d'Acceptation

### AC-1 : Génération automatique mensuelle
- [ ] Un constat est généré automatiquement à la fin de chaque mois
- [ ] Le constat inclut tous les documents vaultés pour la période
- [ ] Le constat est stocké en base de données

### AC-2 : Agrégation par tenant et période close
- [ ] Les volumes sont correctement agrégés par `move_type`
- [ ] Un seul constat par `(tenant, period)`
- [ ] Les documents sont correctement filtrés par période **close** uniquement
- [ ] Aucun document du mois en cours n'est inclus dans un constat

### AC-3 : Inclusion des preuves
- [ ] Le constat inclut un JWS signant le contenu complet
- [ ] Le constat inclut le `ledger_hash` si ledger activé
- [ ] Les preuves sont vérifiables

### AC-4 : Transmission vers CORE
- [ ] Le constat est transmis à Odoo CORE après génération
- [ ] La transmission est idempotente (pas de doublon)
- [ ] Les erreurs de transmission sont gérées (retry, logging)

### AC-5 : Consultation et retransmission
- [ ] Un constat peut être consulté via API
- [ ] Un constat peut être retransmis manuellement
- [ ] L'historique des transmissions est traçable

### AC-6 : Conformité Factur-X (optionnel)
- [ ] Les statistiques de conformité sont incluses si disponibles
- [ ] Les compteurs `compliant`, `non_compliant_2026`, `out_of_scope` sont corrects

---

## 11. Implémentation Technique (Vault Go)

### 11.1 Modèle de données

**Fichier** : `sources/vault/internal/models/constat.go`

```go
type Constat struct {
    ID                    uuid.UUID
    Tenant                string
    Period                string  // YYYY-MM
    GeneratedAt           time.Time
    VaultID               string
    Volumes               Volumes
    Compliance            *Compliance
    Proofs                Proofs
    TransmittedAt          *time.Time
    TransmissionStatus    string
    TransmissionError     *string
    CreatedAt             time.Time
}

type Volumes struct {
    OutInvoice  int
    InInvoice   int
    OutRefund   int
    InRefund    int
}

type Compliance struct {
    Compliant           int
    NonCompliant2026    int
    OutOfScope          int
}

type Proofs struct {
    JWS              string
    LedgerHash       *string
    DocumentsCount   int
    DocumentsSHA256  []string  // Optionnel, peut être limité
}
```

### 11.2 Service de génération

**Fichier** : `sources/vault/internal/services/constat.go`

- Fonction `GenerateConstat(tenant, period) (*Constat, error)`
- Fonction `TransmitConstat(constat *Constat) error`
- Fonction `GetConstat(tenant, period) (*Constat, error)`

### 11.3 Job/Cron automatique

**Fichier** : `sources/vault/cmd/vault/jobs.go` (ou équivalent)

- Job exécuté le 1er de chaque mois à 00:00 UTC (ou après délai de sécurité)
- Calcul de la période close (mois précédent)
- Génère les constats pour tous les tenants actifs (période close uniquement)
- Transmet automatiquement vers CORE

**⚠️ Règle de période close** : Le job génère le constat pour la période **close** (mois N-1), jamais pour le mois en cours. Exemple : Le 1er février 2026, génération du constat pour janvier 2026 (période close).

---

## 12. Rétrocompatibilité et Génération Rétroactive

- Les documents vaultés avant l'implémentation de SPEC 2 ne sont pas affectés
- Les constats peuvent être générés rétroactivement pour les périodes passées
- L'API `/api/v1/invoices` (SPEC 1) reste inchangée

> **Génération rétroactive** : La génération rétroactive de constats pour des périodes passées **ne modifie pas les documents vaultés** ; elle ne fait qu'**agréger des faits existants**. Cette opération est **idempotente** et **non destructive**.

---

## 13. Définition de "Fait" (DoD)

La SPEC 2 est terminée si :
- ✅ La génération automatique mensuelle fonctionne
- ✅ Les constats sont correctement agrégés par tenant et période
- ✅ Les preuves cryptographiques sont incluses
- ✅ La transmission vers Odoo CORE fonctionne
- ✅ Les tests AC-1..AC-6 passent
- ✅ La documentation API est à jour
- ✅ Le déploiement en environnement de test est validé

---

## 14. Suite

- **SPEC 3** : `dorevia_billing_core` (CORE only) — Réception des constats et facturation

---

**Fin de la SPEC 2 (v1.0).**

