# SPEC_DOREVIA_PAYMENTS_v1.1 — Payments (IN/OUT) + liens documents (facture / ticket / commande)

**Version** : v1.1  
**Date** : 2026-02-09  
**Statut** : Production spec (implémentable)  
**Périmètre** : Événements de paiement (cash IN/OUT) scellés dans Vault + agrégations Linky (cards IN/OUT)  
**Principe** : *Event → Proof → Storage → Visible* (quasi temps réel)  
**Réf. invariants** : Dorevia Truth Layer — Event-first, Proof-first, Append-only, Source duale, POS+ACCOUNT unifiés  
**Addendum** : ZeDocs/web14/AMENDEMENTS_SPEC_DOREVIA_PAYMENTS_v1.1.md (zones verrouillées, Event Universe)

---

## 0) Objectif

Garantir une **preuve immuable** et **vérifiable** pour chaque paiement réel (entrant/sortant), quel que soit le système source (POS, compta, e‑commerce, PSP, banque), et permettre une **vision économique multi‑magasins** en quasi temps réel via 2 cards :

- **Encaissements (IN)** : cash entrant
- **Décaissements (OUT)** : cash sortant

---

## 1) Ce qui est vaulté (scope)

### 1.1 Paiements (OBLIGATOIRE)

- **Objet économique** : un paiement réel (cash mouvement)
- **Événement canonique Vault** : `payment.posted`
- **Granularité** : 1 paiement = 1 preuve (1..n preuves par facture/document)

### 1.2 Liens économiques (OBLIGATOIRE)

Chaque preuve de paiement DOIT référencer **le/les documents économiques** concernés **lorsque l’information est disponible** :

- **Facture / avoir** (monde compta)
- **Ticket POS** (le cas le plus fréquent en retail)
- **Commande e‑commerce**
- etc.

> Important : en retail POS, **le document n’est pas toujours une facture**. Le document principal est souvent un **ticket / reçu**. La spec est donc **document économique agnostique**.

---

## 2) Ce qui n’est PAS vaulté (non‑scope)

- Réconciliation comptable / lettrage (traitement ERP)
- Rapprochement bancaire (traitement ERP/banque)
- États dérivés type “invoice paid” comme source de vérité (peut être affiché, mais pas “source”)

Dorevia scelle **les événements source**, pas les traitements.

---

## 3) Modèle canonique — `payment.posted`

### 3.1 Champs obligatoires

#### (A) Identité / horodatage
- `event_id` (UUID) — identifiant technique unique généré par Vault (traçabilité) ; distinct de l’idempotency_key (voir amendements).
- `tenant_id` (string) — tenant Dorevia
- `occurred_at` (RFC3339) — moment où le flux économique devient effectif (ex. validation paiement POS, capture PSP, booking banque). Voir amendements zone B.
- `ingested_at` (RFC3339) — date/heure d’ingestion dans Vault (preuve)

#### (B) Nature financière
- `direction` : `inbound` | `outbound`
- `amount` : nombre décimal (devise)
- `currency` : ISO 4217 (ex. `EUR`)

#### (C) Source duale (OBLIGATOIRE)
- `business_source` : `POS` | `ACCOUNT` | `ECOM` | `PSP` | `BANK`
- `technical_source` : string libre (ex. `odoo_pos`, `odoo_account`, `sylius`, `stripe`…)

#### (D) Source technique (traçabilité)
- `source_model` : ex. `pos.payment`, `account.payment`, `psp.charge`
- `source_id` : identifiant stable dans la source

#### (E) Dimension organisation (multi‑magasins)
- `company_id` : identifiant “magasin / entité” au **format normatif** (voir ci‑dessous)
- `company_name` : libellé

**Convention `company_id` normative** : `technical_source:raw_company_id`

Exemples : `odoo_account:1`, `odoo_pos:3`, `sylius:shop_2`. Le Vault doit **persister** `tenant` et `company_id` (string) pour permettre agrégations et filtres multi‑magasins.

### 3.2 Liens économiques — `allocations[]`

**Quand obligatoires ?**
- **ACCOUNT** : obligatoire si paiement réconcilié ; facultatif sinon.
- **POS** : toujours obligatoire (lien vers receipt / ticket).

`allocations[]` = liste des documents économiques impactés par ce paiement.

Chaque allocation contient :

- `document_type` : `invoice` | `credit_note` | `receipt` | `order` | `other`
- `document_number` : référence métier (ex. `FAC/2026/00123`, `TICKET/000987`, `WEB-ORDER-123`)
- `document_source_model` : ex. `account.move`, `pos.order`, `sale.order`, …
- `document_source_id` : id stable côté source
- `allocated_amount` : montant de ce paiement affecté à ce document

**Règles** :
- `allocations` peut contenir **plusieurs** documents (paiement groupé).
- `allocated_amount` peut être **partiel**.
- `sum(allocated_amount)` peut être **≤ amount** (avance / non affecté).  
  Le reste est dérivable : `unallocated_amount = amount - sum(allocated_amount)`.

> En POS : très souvent, `document_type = receipt` et `document_source_model = pos.order`.

---

## 4) Règles de vérité (invariants appliqués)

### R1 — Event-first
Dorevia ne vault pas des états ; il vault des événements (`payment.posted`).

### R2 — Proof-first
La vérité exploitable (cards) provient de Vault, pas de l’ERP.

### R3 — Append-only
Aucune mutation d’un événement scellé. Correction = nouvel événement (ex. remboursement / contre-paiement).

### R4 — Source duale obligatoire
Toujours `business_source` + `technical_source`.

### R5 — IN / OUT séparés
Deux cards distinctes : IN et OUT (pas de “net cash” en card primaire).

---

## 5) Idempotence

**Clé normative** : `tenant_id + technical_source + source_model + source_id`

But : un paiement source ne produit qu’**une seule** preuve.

**Règle** : `event_id` ≠ `idempotency_key` (identité technique vs identité métier ; voir amendements zone A).

**Stratégie de transition** (compatibilité existant) :
- **Phase 1** : si `idempotency_key` fournie → utilisée ; sinon → fallback SHA payload.
- **Phase 2** : log des warnings lorsque le fallback SHA est utilisé.
- **Phase 3** : idempotency normative obligatoire.

---

## 6) Quasi temps réel

Objectif UX : paiement visible dans Linky en :

- **SLO** : < 30 secondes  
- **Cible** : 5–10 secondes

**Temps dans les agrégations** :
- Période / filtrage par date : **occurred_at** (date de l’événement côté source).
- **last_proof_at** (dernier scellement) : max(`ingested_at`).

---

## 7) Cards Linky — spécification

### 7.1 Card “Encaissements (IN)”

**Filtre** :
- `event_type = payment.posted`
- `direction = inbound`

**KPI macro** :
- `total_amount` : somme `amount`
- `payment_count` : nombre d’événements
- `last_proof_at` : max(`ingested_at`)

**Dimensions d’agrégation (obligatoires)** :
- par `company_id` (magasin)
- total réseau (toutes company)

**Context (détail léger, max 5 lignes)** :
- Top magasins (montant)
- Répartition par `business_source` (POS vs ACCOUNT vs …)
- Top documents (tickets/factures) par `allocated_amount` (optionnel)

### 7.2 Card “Décaissements (OUT)”

**Filtre** :
- `direction = outbound`
- **Exclure** les remboursements / paiements d’avoirs : `is_refund = false` (les avoirs et remboursements auront une card dédiée)

Même KPIs + agrégations.

Context possible :
- Top magasins
- Top partenaires payés (si dispo)
- Top documents (factures fournisseur)

---

## 8) Edge cases à supporter

- Paiement couvrant plusieurs documents (allocations multiples)
- Paiement partiel
- Paiement non affecté (allocations vide ou somme < amount)
- Remboursement client (OUT) lié à un ticket/facture
- POS “ticket only” (aucune facture) — document_type = `receipt`

---

## 9) DoD (Definition of Done)

La spec est considérée implémentée si :

- Les paiements entrants/sortants sont vaultés en `payment.posted`
- Chaque preuve contient source duale + company_id (format normatif)
- Vault persiste **tenant** et **company_id** (string) pour chaque paiement
- Les paiements POS **sans facture** (tickets) sont correctement liés via `receipt`
- Linky affiche 2 cards (IN/OUT) :
  - total
  - nb paiements
  - dernier scellement
  - ventilation par magasin
- Aucune dépendance au champ “paid” de facture pour les agrégations
- **Aucune duplication** paiement (idempotence respectée)
- Paiement visible dans Linky **< 30 s** (SLO)
- **Compatibilité payload legacy** pendant la transition (phases idempotence)

---

## 10) Mapping Odoo (notes de mise en œuvre — non normatif)

- `business_source = POS` :
  - paiement issu POS (`pos.payment` ou équivalent)
  - allocation vers `pos.order` (ticket / receipt)

- `business_source = ACCOUNT` :
  - paiement comptable (`account.payment`)
  - allocation vers `account.move` (invoice / credit note)

### 10.1 Constat sur les états Odoo (POS / Account)

En pratique, on constate que Odoo n’utilise pas toujours le même flux d’états pour les paiements `account.payment` :

- **Compta (ACCOUNT)** : selon la configuration du journal (compte « Encaissements à l’encaissement » / Outstanding Receipts), un paiement peut passer directement à **paid** ou rester en **in_process** jusqu’au rapprochement bancaire.
- **POS / flux hybrides** : les paiements sont souvent en **in_process** avant de passer à **paid** (ou équivalent).

Un même modèle peut donc se trouver en `posted`, **in_process** ou **paid** selon le parcours. Pour le connecteur :

- **Éligibilité au vault** : on considère **posted**, **in_process** et **paid** comme éligibles (paiement déjà validé, hors brouillon).

### 10.2 Pourquoi on masque « Remettre en brouillon » pour les paiements

Le bouton « Remettre en brouillon » est masqué pour les paiements en **in_process** ou **paid** (et interdit côté serveur si le paiement est déjà **vaulted**). Raisons :

- **Cohérence métier** : dès qu’un paiement est validé (en cours ou réglé), le remettre en brouillon contredirait la réalité économique (encaissement déjà effectué ou en cours de rapprochement). On n’expose pas une action qui n’a pas de sens.
- **Règle R3 (Append-only)** : un événement scellé ne doit pas être modifié ; si le paiement est vaulté, toute modification invaliderait la preuve. En masquant le bouton (et en bloquant l’action si vaulted), on aligne l’interface sur cette règle.
- **UX** : éviter de proposer une action que l’utilisateur ne doit pas utiliser ; en in_process/paid, la correction se fait par contre-paiement ou rapprochement, pas par retour en brouillon.

### 10.3 POS : paiements en compta à la fermeture de session

En POS, les paiements ne sont pas encore en comptabilité tant que la session n'est pas fermée. Pendant la session, les commandes et paiements existent côté POS (`pos.order`, `pos.payment`) ; Odoo ne crée les écritures et les `account.payment` qu’**à la fermeture de session** (posting). C’est volontaire : on peut corriger ou annuler en caisse avant de figer les mouvements en compta.

Conséquence pour le vault : on ne peut vaulter un paiement POS qu’une fois qu’il existe en `account.payment`, donc **après** fermeture de session. Le flux est donc : valider en caisse → fermer la session → les paiements apparaissent en facturation / compta → vault (manuel ou automatique).

> Les détails exacts des hooks Odoo sont hors du périmètre de cette spec (ils sont couverts par les specs connecteur Odoo).

### 10.4 Auditer les constats (liste des événements vaultés)

Pour comparer ce que la card Linky affiche avec la source (ex. Odoo), on peut lister les **constats** (un par paiement vaulté) sans faire de calcul côté Vault. L’API d’agrégation décaissements accepte le paramètre **`list=1`** :

- **GET** `/ui/aggregations/payments-out?tenant=...&date_debut=...&date_fin=...&list=1`
- La réponse inclut alors un tableau **`events`** : chaque élément a `document_id`, **`source_id`** (ID du paiement côté source, ex. `account.payment` Odoo), `amount`, `payment_date`, `created_at`.

En comparant les `source_id` avec les paiements fournisseurs dans Odoo (Facturation → Paiements fournisseurs), on voit quels événements alimentent la card et on repère un éventuel doublon ou enregistrement inattendu.

---

## 11) Référence implémentation

- **Rapport conséquences / stratégie** : ZeDocs/web14/RAPPORT_CONSEQUENCES_SPEC_PAYMENTS_v1.1_SUR_EXISTANT.md (version finale).
- **Amendements architecture** : ZeDocs/web14/AMENDEMENTS_SPEC_DOREVIA_PAYMENTS_v1.1.md (event_id vs idempotency_key, occurred_at, Event Universe).
- **Plan minimal** : Step 0 Queryable (tenant + company_id) → Step 1 Stable (idempotence normative) → Step 2 Usable (agrégations IN/OUT) → Step 3 Correct (allocations POS + ACCOUNT). Backfill recommandé pour données existantes.

