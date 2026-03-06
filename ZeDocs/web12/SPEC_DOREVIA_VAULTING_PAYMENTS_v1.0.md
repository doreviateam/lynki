# SPEC_DOREVIA_VAULTING_PAYMENTS_v1.0 — Spécification du vaultage des paiements

**Version** : v1.0  
**Date** : 2026-02-05  
**Statut** : Spécification complète — **implémentée** (voir §9 État d’implémentation)  
**Périmètre v1.0** : Odoo → Vault — paiements comptables **`account.payment` uniquement**. POS (`pos.payment` / clôture session) = **phase ultérieure** (on se concentrera sur le POS après si possible).  
**Objectif** : Produire une **preuve opposable** pour chaque paiement, sans jamais « modifier l’histoire » (correction par contre-écriture).

---

## 0) Contexte & principes

- Les factures sont déjà vaultées sur l’événement `invoice.posted` (preuve de créance).
- Pour « vaulter les factures payées », on **vaulte les paiements** (preuve d’encaissement/décaissement).
- Une fois un paiement **vaulté**, il ne doit plus être rendu modifiable : la correction se fait par **paiement inverse** (contre-paiement / remboursement), puis nouveau paiement correct.
- La preuve est **événementielle** et **minimale** (CFO-first), puis enrichissable plus tard.

---

## 1) Objectifs / Non-objectifs

### 1.1 Objectifs

1. Sceller chaque paiement validé : **`payment.posted`**.
2. Supporter (v1.0) :
   - paiement inbound/outbound ;
   - paiement partiel / multiple factures.
   - *(POS : phase ultérieure, si possible.)*
3. Produire une preuve consultable :
   - API : `GET /api/v1/proof/account_payment/:id`
   - format v1.0 et v1.1 (`?format=1.1`).
4. Garantir idempotence, retries, auditabilité (ledger + JWS).

### 1.2 Non-objectifs (v1.0)

- **POS** : on se concentrera sur le POS **après**, si possible ; v1.0 = `account.payment` uniquement.
- Recalcul complet BFR / cashflow (Phase 2).
- Merkle ledger / preuves agrégées.
- PDP / e-invoicing (hors scope).

---

## 2) Terminologie

| Terme | Définition |
|-------|------------|
| **Paiement** | Écriture de règlement (Odoo `account.payment`) ou paiement POS (`pos.payment` / `pos.order` selon modélisation). |
| **Vaultage** | Ingestion d’un fait financier + scellement (hash + horodatage + JWS + ledger). |
| **Preuve** | Objet JSON « audit-ready » renvoyé par Vault (v1.0 / v1.1). |
| **Contre-paiement** | Paiement inverse (annulation comptable) utilisé pour corriger une erreur après validation. |
| **source_id** | Identifiant unique du paiement côté source (Odoo) : **recommandé** id numérique (`str(payment.id)`) pour cohérence avec GET proof et URL d’attestation. |

---

## 3) Déclencheurs côté Odoo

### 3.1 Paiements comptables (Account)

- **Déclencheur principal** : `account.payment.action_post()`.
- Alternative (si besoin) : post de l’écriture associée (`move_id.posted`) — **non recommandé** ; `action_post()` est le point le plus stable.

### 3.2 Paiements POS (POS) — phase ultérieure

**Décision v1.0** : on se concentrera sur le **POS après**, si possible. La v1.0 ne couvre que `account.payment`.

Pour la phase POS (à spécifier plus tard), deux options restent envisageables :

- **(A)** Vaulter **chaque paiement POS** (granularité maximale).
- **(B)** Vaulter **un paiement consolidé** « Banque / Carte / Espèces » issu de la clôture de session (souvent plus simple, plus proche du cash réel).

---

## 4) Architecture d’envoi

### Option A — Odoo → Vault direct (recommandé v1.0)

- Odoo envoie le payload paiement vers Vault `POST /api/v1/payments`.
- Odoo stocke le statut de vaultage + lien preuve sur le paiement.

**Avantages** : simple, moins de moving parts, plus facile à opérer.

### Option B — Odoo → DVIG → Vault

- Odoo émet un événement `payment.posted` vers DVIG `/ingest`.
- DVIG route vers Vault `POST /api/v1/payments` (ou étend `/events` pour supporter `payment.posted`).

**Avantages** : centralisation, homogénéité event bus.  
**Inconvénient** : nécessite routing additionnel.

**Décision v1.0** : Option A par défaut, Option B ultérieure.

---

## 5) API Vault

### 5.1 Ingestion paiement

| Élément | Spécification |
|--------|----------------|
| **Endpoint** | `POST /api/v1/payments` |
| **Header requis** | `X-Tenant: <tenant>` |
| **Auth** | Bearer token (même modèle que factures) — idéalement token dédié « payments » (moindre privilège) |
| **Corps** | JSON (voir §6) |
| **Réponse succès** | 200/201 + `id`, `sha256_hex`, `ledger_hash`, `evidence_jws`, `created_at` |
| **Taille max** | 64 KB (configurable côté Vault) |

### 5.2 Lecture preuve

| Élément | Spécification |
|--------|----------------|
| **Endpoint** | `GET /api/v1/proof/account_payment/:id` |
| **Paramètre** | `:id` = `source_id` du paiement (recommandé : id numérique Odoo pour cohérence avec l’URL d’attestation) |
| **Query** | `?format=1.1` pour réponse au format v1.1 (audit-ready) |
| **Réponse v1.0** | `id`, `hash`, `ledger`, `prev_hash`, `timestamp`, `jws`, `status`, `source_model`, `source_id` |
| **Réponse v1.1** | `hashes`, `proof`, `ledger`, `verification`, `event`, `status` (voir amendements format preuve v1.1) |

---

## 6) Payload paiement

### 6.1 Deux représentations

La spec décrit :

1. **Payload canonique CFO (cible)** : format stable, audit-ready, exploitable BI/rapports (§6.2).
2. **Payload d’échange actuel (API Vault)** : format accepté par `POST /api/v1/payments` aujourd’hui (§6.3). Un mapping explicite permet d’évoluer vers le canonical sans casser l’existant.

### 6.2 Payload canonique CFO (cible, v1.0)

Format recommandé pour évolution (enrichissement rapports, audit, conformité).

```json
{
  "schema_version": "1.0",
  "event_type": "payment.posted",
  "payment_direction": "inbound",
  "payment_kind": "payment",
  "payment_reference": "PBNK1/2026/00008",
  "payment_date": "2026-02-03",
  "amount": 404.58,
  "currency": "EUR",
  "method": "transfer",
  "journal": "Banque",
  "counterparty_name": "SARL AVENIR SERVICE",
  "counterparty_vat": "FR85381797521",
  "issuer_name": "SARL La Platine",
  "company_id": 1,
  "allocations": [
    {
      "invoice_number": "FAC/2026/00029",
      "invoice_id": 1954,
      "amount_applied": 404.58
    }
  ],
  "source": "odoo.stinger.sarl-la-platine",
  "source_model": "account.payment",
  "source_id": "1234",
  "source_event_id": "odoo:account.payment:1234:posted",
  "idempotency_key": "sha256-hex-or-guid"
}
```

**Règles** :

- `payment_reference` : `name` Odoo si disponible (ex. `PBNK1/2026/00008`), sinon fallback `source_id`.
- `allocations[]` : MUST contenir au moins une entrée si le paiement est réconcilié à des factures ; `invoice_number` recommandé (lisible, stable) ; `invoice_id` optionnel (ID Odoo).
- `method` : valeurs contrôlées (`cash`, `card`, `transfer`, `check`, `other`) — voir Annexe A.
- `source` : identifiant environnement/tenant (ex. `odoo.stinger.sarl-la-platine`), pas le type de source.
- `source_id` : **recommandé** id numérique (`str(payment.id)`) pour cohérence GET proof et attestation.
- `source_event_id` : format `odoo:<model>:<id>:posted` (voir Annexe B).
- `idempotency_key` : MUST stable pour un même paiement posté (ex. `sha256(tenant|source_model|source_id|posted_at)`).

### 6.3 Payload d’échange actuel (POST /api/v1/payments)

Format accepté par Vault en v1.0 (implémentation actuelle).

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `tenant` | string | Oui | Identifiant tenant (doit égaler `X-Tenant`) |
| `source_system` | string | Non (défaut: `odoo`) | Système source |
| `source_model` | string | Oui | Ex. `account.payment` |
| `source_id` | string | Oui | **Recommandé** : `str(payment.id)` pour cohérence GET proof |
| `payment_date` | string | Oui | RFC3339 (ex. `2026-02-03T00:00:00Z`) |
| `amount` | number | Oui | Montant (> 0) |
| `currency` | string | Oui | Ex. `EUR` |
| `method` | string | Oui | `cash`, `card`, `mixed`, `check`, `transfer`, `other` |
| `source` | string | Oui | Type : `account` ou `pos` |
| `payment_direction` | string | Oui | `inbound` ou `outbound` |
| `is_refund` | boolean | Oui | Remboursement client |
| `company_id` | integer | Oui | ID société Odoo |
| `payment` | object | Oui | Données additionnelles (ex. `payment_id`, `name`, `partner_id`, `communication`, `reconciled_invoice_ids`, `reconciled_invoice_names`) |
| `idempotency_key` | string | Recommandé | Clé stable pour déduplication (voir §7.1) |

**Exemple minimal** :

```json
{
  "tenant": "sarl-la-platine",
  "source_system": "odoo",
  "source_model": "account.payment",
  "source_id": "1234",
  "payment_date": "2026-02-03T00:00:00Z",
  "amount": 404.58,
  "currency": "EUR",
  "method": "transfer",
  "source": "account",
  "payment_direction": "inbound",
  "is_refund": false,
  "company_id": 1,
  "payment": {
    "payment_id": 1234,
    "name": "PBNK1/2026/00008",
    "partner_id": 42,
    "communication": "FAC/2026/00029",
    "reconciled_invoice_ids": [1954],
    "reconciled_invoice_names": ["FAC/2026/00029"]
  },
  "idempotency_key": "a1b2c3..."
}
```

### 6.4 Mapping canonique ↔ échange actuel

| Canonical (§6.2) | Échange actuel (§6.3) |
|------------------|------------------------|
| `payment_reference` | `payment.name` |
| `allocations[]` | `payment.reconciled_invoice_names` + montants (à dériver des réconciliations) |
| `issuer_name` / `counterparty_name` | Non envoyé (à ajouter dans `payment` si besoin) |
| `journal` | Non envoyé (à ajouter dans `payment` si besoin) |
| `source` (env) | À dériver de config (ex. `dorevia.dvig.source`) ; aujourd’hui `source` = type `account`/`pos` |
| `source_event_id` | Peut être ajouté en racine ou dans `payment` |
| `idempotency_key` | À envoyer en racine (recommandé) |

---

## 7) Idempotence, retries, erreurs

### 7.1 Idempotence

- **Recommandation** : Odoo envoie `idempotency_key` stable (ex. `sha256(tenant|source_model|source_id|write_date)`).
- **Vault** :  
  - Soit déduplique par `(tenant, idempotency_key)` si le champ est accepté (comportement cible).  
  - Soit déduplique par SHA256 du payload reçu (comportement actuel) ; dans ce cas, un retry avec payload strictement identique est idempotent, mais toute modification du payload peut créer un doublon.
- Une réémission du même paiement ne doit **pas** créer de doublon dans le ledger.

### 7.2 Retries

- Odoo (ou DVIG) applique une politique de retry (ex. exponentielle + max tentatives).
- Statuts côté Odoo : `pending_proof` / (futur `retrying`), `vaulted`, `failed_soft`, `failed_hard`.
- En cas de 5xx ou timeout : retry automatique (CRON ou queue job) ou bouton « Rafraîchir la preuve ».

### 7.3 Erreurs

| Code / situation | Comportement |
|------------------|--------------|
| 401 / 403 | Token/tenant invalide — **pas de retry** (ou retry très limité) |
| 5xx / timeout | **Retry** automatique ou manuel |
| 4xx schéma / validation | **Action requise** (corriger payload ou config) |

---

## 8) Modèle de correction (après validation)

### 8.1 Principe

Après `action_post()`, si le paiement est vaulté, on **n’édite pas**. On corrige par contre-écriture.

### 8.2 Scénarios

1. **Montant/date erronés**  
   Créer un **paiement inverse** (outbound/inbound opposé, même montant) → vaulter → créer le paiement correct → vaulter.

2. **Mauvaise facture rattachée**  
   Contre-paiement (annule) → paiement correct avec bonnes allocations.

### 8.3 Résultat probant

Le ledger montre : `+X`, `-X`, `+Y` (historique intact, 3 preuves distinctes).

---

## 9) Évolution UI Odoo (paiement)

### 9.1 Champs à ajouter (sur `account.payment`)

| Champ spec | Exemple nom technique Odoo | Description |
|------------|----------------------------|-------------|
| Statut | `dorevia_vault_status` | `todo` / `pending_proof` / `vaulted` / `failed_soft` / `failed_hard` |
| Référence preuve | `dorevia_vault_id` | UUID / id preuve Vault |
| Date scellement | `dorevia_vault_date` | datetime |
| Ledger | `dorevia_vault_ledger_hash` | string |
| Dernière erreur | `dorevia_vault_last_error` | text (si failed) |
| Prochaine retry | `dorevia_vault_next_retry_at` | datetime (si retry) |
| (Optionnel) | `dorevia_vault_sha256`, `dorevia_vault_evidence_jws`, `dorevia_vault_idempotency_key`, `dorevia_vault_attempt_count`, `dorevia_vault_last_try_at` | Audit et debug |

### 9.2 Vue « Paiement client » (UX)

- **Bloc** : **SÉCURITÉ DU PAIEMENT** (visible lorsque `state == 'posted'`).
- Contenu :
  - Statut (badge) : Protégé / En cours / Échec.
  - proof_id, sealed_at, ledger_hash (si vaulted).
  - Bouton **« Télécharger l’attestation »** (ouvre attestation JWS, ex. `/dorevia/vault/attestation/payment/<id>`). ✅ **Implémenté**
  - Bouton **« Voir la preuve »** : ouvre l’URL Vault `GET /api/v1/proof/account_payment/<id>?format=1.1`. ✅ **Implémenté**
  - Bouton **« Rafraîchir la preuve »** : relance l’envoi pour les statuts `failed_soft` / `pending_proof` (retry manuel). ✅ **Implémenté**
  - **« Remettre en brouillon »** : masqué et bloqué si `vaulted` (override `action_draft()` + xpath). ✅ **Implémenté**

### 9.3 Bloc « Factures soldées »

Afficher les allocations : numéro de facture + montant appliqué (lecture seule), lorsque des réconciliations existent. ✅ **Implémenté** (liste des factures réconciliées + montant total).

### 9.4 État d’implémentation v1.0 (module `dorevia_vault_connector`)

| Élément | Statut |
|--------|--------|
| Déclencheur `action_post()` → POST /api/v1/payments | ✅ |
| Payload avec `source_id` = id numérique, `idempotency_key`, `source_event_id` | ✅ |
| GET proof v1.0 et ?format=1.1 | ✅ (Vault) |
| Champs statut / preuve / ledger sur `account.payment` | ✅ |
| Bloc « Sécurité du paiement » + badge | ✅ |
| Bouton « Télécharger l’attestation » | ✅ |
| Bouton « Voir la preuve » | ✅ |
| Bouton « Rafraîchir la preuve » | ✅ |
| « Remettre en brouillon » masqué/bloqué si vaulted | ✅ |
| Bloc « Factures soldées » | ✅ |
| Idempotence (Vault : hash payload ; Odoo envoie idempotency_key) | ✅ (Odoo envoie la clé ; Vault déduplique par hash si non utilisé) |

---

## 10) Observabilité & exploitation

- **Logs (Odoo)** : payload envoyé (ou hash), http_status, correlation_id, proof_id.
- **Logs (Vault)** : tenant, source_id, idempotency_key (si présent), ledger seq.
- **Métriques** : taux de succès, retry, latence, 4xx/5xx.
- **Runbook** : « Paiement en échec temporaire » (analogue à facture) — 5xx → retry ; 4xx → vérifier config / payload.

---

## 11) Sécurité

- Token dédié « payments » (scope minimal) si possible.
- Vérification tenant via `X-Tenant` + `body.tenant` (cohérence obligatoire).
- Rotation de clés JWS via `kid` + `jwks.json`.
- Stockage des secrets : paramètres système Odoo (server-side), jamais exposés en UI.

---

## 12) Critères d’acceptation (DoD)

1. Un paiement validé (`action_post`) génère un appel Vault `POST /api/v1/payments`.
2. La preuve est récupérable sur `GET /api/v1/proof/account_payment/:id` (v1.0).
3. En `?format=1.1`, présence de `hashes`, `proof`, `ledger`, `verification`, `event`, `status`.
4. Idempotence : réémission du même paiement (même idempotency_key ou même payload) → pas de doublon ledger.
5. Retry : en cas de 5xx, statut Odoo « pending_proof » ou retrying, puis « vaulted » après retour OK (manuel ou CRON).
6. Correction : contre-paiement + nouveau paiement → 3 preuves distinctes, trace cohérente.

---

## 13) Tests (minimum)

- **Unitaire** : mapping Odoo → payload (method, direction, allocations / reconciled_invoice_*).
- **Intégration** : POST /payments + GET proof (v1.0 + v1.1).
- **Idempotence** : double POST (même idempotency_key ou même payload) → une seule entrée ledger.
- **Erreur 502** (simulée) + retry Odoo → succès après rétablissement.

---

## Annexes

### A) Mapping `method`

| Odoo / usage | Valeur Vault |
|--------------|--------------|
| Espèces / cash | `cash` |
| Carte | `card` |
| Virement / banque / transfer | `transfer` |
| Chèque | `check` |
| Mixte (POS) | `mixed` (si accepté par l’API) |
| Autre | `other` |

### B) Naming `source_event_id`

Format recommandé : `odoo:<model>:<id>:posted`  
Ex. : `odoo:account.payment:1234:posted`

### C) Références

- Amendements format preuve v1.1 : `ZeDocs/web12/AMENDEMENTS_FORMAT_PREUVE_DOREVIA_VAULT_v1.1.md`
- Analyse spec ↔ implémentation : `ZeDocs/web12/ANALYSE_SPEC_VAULTING_PAYMENTS_v1.0.md`
- Guide vaulter factures payées : `ZeDocs/web12/GUIDE_VAULTER_FACTURES_PAYEES.md`
- Implémentation : module Odoo `dorevia_vault_connector` v1.2.1+ (`units/odoo/custom-addons/dorevia_vault_connector`).

### D) Évolution POS (phase ultérieure)

- V1.0 : **account.payment** uniquement.
- POS : on se concentrera sur le POS **après**, si possible (spécification dédiée à rédiger : déclencheurs `pos.payment` / clôture session, payload, GET proof `pos_payment` / `pos_order`).

---

**Fin de la spécification.**
