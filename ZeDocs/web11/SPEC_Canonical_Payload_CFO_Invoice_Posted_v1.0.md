# SPEC — Canonical Payload CFO (Invoice Posted) — v1.0

**Produit** : Dorevia-Vault  
**Scope** : Payload canonique “preuve événementielle” pour `invoice.posted` (ERP/POS agnostique)  
**Objectif** : fournir un snapshot stable, prouvable et exploitable par une future Dorevia UI (KPIs CFO)  
**Statut** : Draft validable (MVP)

---

## 1. Contexte & intention

Dorevia-Vault scelle des **événements financiers** dès leur validation dans l'ERP/caisses afin de produire une **preuve vérifiable** (horodatage + intégrité + signature).  
Ce document spécifie un **payload canonique minimal** orienté CFO pour l'événement :

- `event_type = "invoice.posted"`

Ce payload doit :
- être **stable** dans le temps (pas dépendant des champs techniques Odoo),
- être **ERP-agnostique**,
- être **suffisant** pour répondre aux questions CFO : *qui doit quoi, combien, quand ça rentre, et est-ce prouvable ?*

---

## 2. Terminologie

- **Event** : fait métier validé (ex. facture postée).
- **Proof / Receipt** : métadonnées de scellage permettant la vérification indépendante.
- **Canonical payload** : format JSON stable, versionné, consommable par n'importe quel client (UI, BI, API).
- **Counterparty** : partie avec qui on a la facture (client pour facture sortante, fournisseur pour facture entrante).
- **Issuer** : société émettrice de la facture (notre société pour facture client, fournisseur pour facture fournisseur).

---

## 3. Identité & versioning

### 3.1 Event type
- Valeur : `invoice.posted`

### 3.2 Schema version
Le payload DOIT contenir un champ de version afin d'assurer la rétro-compatibilité.

- Champ : `schema_version`
- Valeur : `1.0`

---

## 4. Spécification du payload (JSON)

### 4.1 Schéma (champs requis + recommandés)

```json
{
  "schema_version": "1.0",
  "event_type": "invoice.posted",

  "invoice_number": "FAC/2026/00023",
  "invoice_date": "2026-01-29",
  "due_date": "2026-02-28",

  "invoice_direction": "out",
  "invoice_kind": "invoice",

  "counterparty_name": "Client X",
  "counterparty_vat": "FR123456789",

  "issuer_name": "Ma Société SAS",
  "issuer_vat": "FR987654321",
  "issuer_siret": "12345678901234",

  "amount_untaxed": 1000.00,
  "amount_tax": 200.00,
  "amount_total": 1200.00,
  "amount_residual": 1200.00,
  "currency": "EUR",

  "payment_status": "unpaid",

  "sealed_at": "2026-01-29T18:00:47Z",
  "proof_id": "a68e22c7-6a31-4090-ab22-ed341b684d9c",
  "ledger_hash": "d76ad6f0...",
  "attestation_jws": "eyJhbGc...",

  "source": "odoo.stinger.sarl-la-platine"
}
```

---

## 5. Détails champs, formats, contraintes

### 5.1 Champs “événement” (CFO)

| Champ | Type | Requis | Format/Contraintes | Sens CFO |
|-------|------|--------|--------------------|----------|
| `schema_version` | string | ✅ | `"1.0"` | gouvernance format |
| `event_type` | string | ✅ | `"invoice.posted"` | nature événement |
| `invoice_number` | string | ✅ | stable & humain | identifiant facture |
| `invoice_date` | string | ✅ | `YYYY-MM-DD` | date d'émission |
| `due_date` | string | ✅ | `YYYY-MM-DD` | date d'échéance |
| `invoice_direction` | string | ✅ | `"out"` \| `"in"` | sens : client (out) vs fournisseur (in) |
| `invoice_kind` | string | ✅ | `"invoice"` \| `"refund"` | facture vs avoir |
| `counterparty_name` | string | ✅ | min 1 char | qui : client (out) ou fournisseur (in) |
| `counterparty_vat` | string | cond. | FR + VAT si B2B ; sinon `""` | identifiant légal contrepartie |
| `issuer_name` | string | ✅ | min 1 char | société émettrice (notre société si out, fournisseur si in) |
| `issuer_vat` | string | opt. | TVA émetteur | audit / multi-société |
| `issuer_siret` | string | opt. | SIRET émetteur | audit / contrôle |
| `amount_untaxed` | number | ✅ | >= 0, 2 décimales | base HT |
| `amount_tax` | number | ✅ | >= 0, 2 décimales | TVA |
| `amount_total` | number | ✅ | >= 0, 2 décimales | total TTC |
| `amount_residual` | number | opt. | >= 0, 2 décimales | encours au moment de l'événement |
| `currency` | string | ✅ | ISO 4217 (`EUR`) | devise |
| `payment_status` | string | ✅ | `unpaid` \| `partial` \| `paid` | état cash au moment du post |
| `source` | string | opt. | ex. `unit.env.tenant` | traçabilité multi-tenant / connecteur |

**Contrepartie** : pour `invoice_direction = "out"` = client ; pour `"in"` = fournisseur.  
**counterparty_vat** : requis lorsque la facture est B2B et que le n° TVA de la contrepartie est connu. Sinon `""` (recommandé pour stabilité du schéma) ou omission selon règle d'implémentation (voir 7.1).

### 5.2 Champs “preuve”

| Champ | Type | Requis | Contraintes | Rôle |
|-------|------|--------|-------------|------|
| `sealed_at` | string | ✅ | ISO 8601 UTC (`...Z`) | horodatage preuve |
| `proof_id` | string | ✅ | UUID | id de preuve |
| `ledger_hash` | string | ✅ | hex/base64 (selon impl) | ancrage registre |
| `attestation_jws` | string | ✅ | JWS compact | vérification cryptographique |

---

## 6. Règles de cohérence (MUST)

1. `amount_total = amount_untaxed + amount_tax` (tolérance d'arrondi 0,01).
2. `due_date >= invoice_date`.
3. `payment_status` reflète l'état **au moment du post** (événement `invoice.posted`), pas au moment du scellage.
4. `sealed_at` est la date de scellage effective par Vault (UTC).
5. `attestation_jws` DOIT signer au minimum l'identité de preuve (incluant `proof_id`) et l'empreinte des champs événement.
6. Pour factures fournisseur et avoirs, `invoice_direction` et `invoice_kind` sont cohérents ; les KPIs (facturé client / fournisseur, encours) restent calculables.

---

## 7. Règles d'optionalité & cas particuliers

### 7.1 B2C (pas de TVA contrepartie)
- `counterparty_vat` :
  - option A : `""` (string vide) — **recommandé** pour stabilité du schéma,
  - option B : champ omis.
- Décision d'implémentation : **A recommandé**.

### 7.2 Facture sans échéance explicite
Si `due_date` non connue :
- règle MVP : `due_date = invoice_date` (paiement comptant) **ou**
- `due_date` calculée depuis les conditions de paiement ERP (préféré).

### 7.3 Issuer (émetteur)
- Pour facture client (`out`) : émetteur = notre société → `issuer_name` (requis), `issuer_vat` / `issuer_siret` optionnels.
- Pour facture fournisseur (`in`) : émetteur = fournisseur → `issuer_*` = contrepartie ; peut être déduit de `counterparty_*` selon implémentation.

---

## 8. Vérification de preuve (principe)

Le consommateur (Odoo, UI, auditeur) doit pouvoir vérifier :

1. que `attestation_jws` est valide (signature RS256 / clé `kid` reconnue),
2. que le payload signé correspond bien aux champs visibles,
3. que `ledger_hash` ancre la preuve dans un registre append-only.

> Note : la méthode exacte de vérification (endpoints, clés publiques, rotation) est hors scope de cette SPEC v1.0 mais doit être cohérente avec DVIG/Vault (JWS/RS256).

---

## 9. Exploitation CFO (KPIs calculables dès v1)

À partir de ce payload, une UI peut calculer (sans retraitement ERP) :

- **Facturé TTC/HT** (clients) : somme `amount_total` / `amount_untaxed` où `invoice_direction = "out"` et `invoice_kind = "invoice"`.
- **Facturé fournisseur** : idem avec `invoice_direction = "in"`.
- **Avoirs** : filtrer `invoice_kind = "refund"` pour exclusion ou montant négatif selon convention.
- **TVA collectée** : somme `amount_tax` (out).
- **Encours clients à date** : somme `amount_total` (ou `amount_residual` si présent) où `payment_status != "paid"` et `invoice_direction = "out"`.
- **Échéances à venir / en retard** : comparaison `due_date` vs date du jour.
- **Aging simple** : buckets J+0 / J+30 / J+60 (basé sur `due_date`).

---

## 10. Non-objectifs (volontairement exclu en v1)

- champs techniques ERP (IDs Odoo, state internes, journaux comptables, etc.)
- lignes de facture détaillées
- lettrage / rapprochement / réconciliation
- multi-devises avancé, taux de change, etc.

---

## 11. Checklist DoD (Definition of Done)

- [ ] un événement `invoice.posted` produit un JSON conforme à cette SPEC
- [ ] les champs requis sont présents, formats respectés
- [ ] `invoice_direction` et `invoice_kind` permettent les KPIs client/fournisseur/avoir
- [ ] la preuve (`attestation_jws`) est vérifiable avec une clé publique connue
- [ ] `sealed_at`, `proof_id`, `ledger_hash` correspondent à la preuve Vault réelle
- [ ] tests d'arrondi (tolérance 0,01) validés
- [ ] pour factures fournisseur / avoirs, les champs direction/kind sont cohérents

---

## 12. Implémentation (référence)

Le payload canonique CFO est exposé dans l'attestation téléchargeable (bouton « Télécharger l'attestation ») sous la clé **`canonical_cfo`**.  
Voir module Odoo `dorevia_vault_connector`, controller `VaultController.download_attestation`, et SPEC UX v1.1.1.
