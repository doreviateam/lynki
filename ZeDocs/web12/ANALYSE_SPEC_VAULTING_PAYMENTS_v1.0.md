# Analyse — SPEC_DOREVIA_VAULTING_PAYMENTS_v1.0

**Date** : 2026-02-05  
**Référence** : Spec vaulting paiements v1.0 (draft implémentable)  
**Contexte** : Comparaison spec ↔ implémentation actuelle (Odoo `dorevia_vault_connector` 1.2.0, Vault POST `/api/v1/payments`, GET proof v1.0/v1.1).

---

## 1) Synthèse

La spec est **globalement alignée** avec ce qui est en place. L’essentiel (déclencheur `action_post`, Option A Odoo→Vault, champs statut/preuve, GET proof v1.0 et v1.1, idempotence, bloc « Sécurité du paiement ») est couvert. Les écarts concernent surtout :

- Le **format du payload** (canonical CFO §6.2 vs payload actuel).
- L’**idempotence** (clé explicite vs hash du payload).
- Quelques **détails UI / API** (bouton « Rafraîchir la preuve », bloc « Factures soldées », identifiant GET proof).
- Le **retry automatique** (policy + statuts pending/retrying) et le **POS** (hors scope actuel).

---

## 2) Alignement spec ↔ implémentation

| Spec | Implémentation | Statut |
|------|-----------------|--------|
| **§3.1** Déclencheur `account.payment.action_post()` | `AccountPayment.action_post()` appelle `_vault_payment_send()` après `super().action_post()` | ✅ |
| **§4** Option A — Odoo → Vault direct | Envoi direct `POST /api/v1/payments` depuis Odoo | ✅ |
| **§5.1** POST /api/v1/payments, X-Tenant, Bearer | Handler Vault accepte X-Tenant + Bearer ; Odoo envoie les deux | ✅ |
| **§5.2** GET /api/v1/proof/account_payment/:source_id, ?format=1.1 | `GetProofAccountPayment` avec param `:id`, query `format=1.1` → ProofResponseV11 | ✅ |
| **§7.1** Idempotence (pas de doublon ledger) | Vault déduplique par **SHA256 du payload** (pas par `idempotency_key`) | ⚠️ Voir §6 |
| **§9.1** Champs account.payment | Statut, proof_id, sealed_at, ledger_hash, last_error, next_retry_at (+ sha256, evidence_jws, attempt_count, idempotency_key) | ✅ (noms légèrement différents) |
| **§9.2** Bloc « Sécurité du paiement » | Vue formulaire avec bloc « Sécurité du paiement », badge, « Télécharger l’attestation » | ✅ |
| **§12 DoD** Appel Vault à l’action_post, preuve GET v1.0/v1.1, pas de doublon, correction par contre-paiement | Couvert sauf retry auto et idempotency_key explicite | ✅ (partiel) |

---

## 3) Écarts et recommandations

### 3.1 Payload canonique (§6.2) vs payload actuel

**Spec** : payload CFO-first avec `schema_version`, `event_type`, `payment_reference`, `allocations[]` (invoice_number, invoice_id, amount_applied), `issuer_name`, `counterparty_name`, `counterparty_vat`, `journal`, `source` (ex. `odoo.stinger.sarl-la-platine`), `source_event_id`, `idempotency_key`.

**Actuel (Odoo)** :  
`tenant`, `source_system`, `source_model`, `source_id`, `payment_date`, `amount`, `currency`, `method`, `source` (= `"account"`), `payment_direction`, `is_refund`, `company_id`, `payment` (objet avec payment_id, name, partner_id, communication, reconciled_invoice_ids/names).

**Écarts principaux** :

- Pas de `schema_version` ni `event_type` côté Odoo.
- Pas d’`allocations[]` structuré (invoice_number + amount_applied) ; les factures sont dans `payment.reconciled_invoice_*`.
- Pas de `payment_reference`, `issuer_name`, `counterparty_name`, `counterparty_vat`, `journal` au niveau racine.
- `source` = `"account"` (type de source) au lieu de l’identifiant environnement/tenant (ex. `odoo.stinger.sarl-la-platine`).
- Pas de `source_event_id` ni `idempotency_key` dans le corps.

**Recommandation** :  
- **Court terme** : Documenter le mapping spec ↔ payload actuel (équivalence sémantique) et laisser Vault inchangé (il accepte déjà le format actuel).  
- **Évolution** : Proposer une évolution du payload Odoo (ou un second endpoint) pour envoyer le canonical §6.2, avec `allocations[]`, `payment_reference`, `issuer_name`, `counterparty_name`, `counterparty_vat`, `journal`, `source` (env/tenant), `source_event_id`, `idempotency_key`.

---

### 3.2 Idempotence (§6.3, §7.1)

**Spec** : `idempotency_key` MUST stable (ex. `sha256(tenant|source_model|source_id|posted_at)`), Vault déduplique par cette clé.

**Actuel** :  
- Odoo calcule une clé (`_compute_vault_idempotency_key`) mais **ne l’envoie pas** dans le body.  
- Vault déduplique par **SHA256 du payload** reçu.

**Conséquence** : Un retry avec payload strictement identique reste idempotent. En revanche, tout champ qui change (ex. `write_date` si un jour inclus dans la clé Odoo, ou champs dans `payment`) change le hash → risque de doublon en cas de retry.

**Recommandation** :  
1. **Odoo** : Envoyer `idempotency_key` dans le payload (déjà calculée).  
2. **Vault** :  
   - Soit accepter `idempotency_key` en entrée et dédupliquer par `(tenant, idempotency_key)` en priorité (comme pour les events/invoices),  
   - Soit au minimum documenter que l’idempotence repose aujourd’hui sur le hash du payload et que l’envoi d’une clé stable est recommandé pour les évolutions.

---

### 3.3 GET proof — Paramètre :source_id

**Spec** : `GET /api/v1/proof/account_payment/:source_id`.

**Actuel** :  
- Odoo envoie `source_id` = `self.name or str(self.id)` → soit le numéro (ex. `PBNK1/2026/00008`), soit l’id numérique.  
- Vault stocke `source_id_text` = cette valeur et `odoo_id` = `company_id` (pour les payments).  
- GET avec `:id` interprété comme entier ou texte : recherche par `odoo_id` OU `source_id_text`.

Si Odoo envoie `source_id` = **name**, alors GET `/api/v1/proof/account_payment/1234` (id technique) **ne trouve pas** le document (car `source_id_text` = name, pas 1234). L’attestation Odoo utilise pourtant `payment.id` dans l’URL (`/dorevia/vault/attestation/payment/<id>`).

**Recommandation** :  
- Envoyer **toujours** `source_id` = `str(self.id)` dans le payload (identifiant stable et cohérent avec l’URL d’attestation).  
- Garder `payment_reference` (ou équivalent) pour l’affichage / audit (ex. `name` dans un champ dédié ou dans `payment`).

---

### 3.4 UI — Boutons « Voir la preuve » et « Rafraîchir la preuve » (§9.2)

**Spec** :  
- Bouton **« Voir la preuve »** (ouvre URL proof).  
- Bouton **« Rafraîchir la preuve »** (manual trigger).

**Actuel** :  
- **« Télécharger l’attestation »** → ouvre `/dorevia/vault/attestation/payment/<id>` (attestation JWS côté Odoo).  
- Pas de bouton « Voir la preuve » (URL directe vers Vault GET proof).  
- Pas de bouton « Rafraîchir la preuve » (retry manuel).

**Recommandation** :  
- Conserver « Télécharger l’attestation » et ajouter si besoin **« Voir la preuve »** (lien vers `{VAULT_URL}/api/v1/proof/account_payment/{id}?format=1.1` ou page intermédiaire).  
- Ajouter **« Rafraîchir la preuve »** qui relance `_vault_payment_send()` pour les statuts `failed_soft` / `pending_proof` (sans modifier l’historique si déjà vaulted).

---

### 3.5 Bloc « Factures soldées » (§9.3)

**Spec** : Afficher les allocations (invoice_number + montant appliqué).

**Actuel** : Pas de bloc dédié « Factures soldées » sur la vue paiement ; les factures réconciliées sont disponibles dans le modèle mais pas exposées dans ce bloc.

**Recommandation** : Ajouter un petit bloc (ou une ligne dans le bloc Sécurité) listant les factures soldées (numéro + amount_applied) quand des réconciliations existent, en lecture seule.

---

### 3.6 Retry et statuts (§7.2, §9.1)

**Spec** : Retry (ex. exponentiel, max tentatives), statuts `pending` / `retrying`, puis `verified` ou `failed` (action requise).

**Actuel** :  
- En échec, passage en `failed_soft` + `last_error`, pas de CRON ni de retry automatique dédié aux paiements.  
- Statuts : `todo`, `pending_proof`, `vaulted`, `failed_soft`, `failed_hard` (équivalent sémantique à verified/failed).

**Recommandation** :  
- Soit un CRON (ou job queue) qui relance les paiements en `failed_soft` / `pending_proof` avec backoff (comme pour les factures),  
- Soit au minimum le bouton « Rafraîchir la preuve » pour un retry manuel.  
- Documenter la politique (401/403 = pas de retry, 5xx = retry, 4xx schéma = action requise) dans le runbook.

---

### 3.7 Méthode « mixed » (Annexe A)

**Spec** : Mapping `method` : cash, card, bank/transfer, check, autre → `other`.

**Actuel** : Vault accepte `cash`, `card`, `mixed`, `check`, `transfer`, `other`. Odoo mappe vers `transfer`, `cash`, `card`, `check`, `other` (pas de `mixed`).

Aligné avec la spec (spec ne mentionne pas `mixed`). Pas de changement requis ; éventuellement préciser dans la spec que `mixed` est accepté par l’API si besoin POS.

---

### 3.8 POS et paiement consolidé (§3.2, §4)

**Spec** : V1.0 peut commencer par (B) paiement consolidé (clôture session). Option B Odoo→DVIG→Vault en évolution.

**Actuel** : Uniquement `account.payment`. Pas de `pos.payment` ni de flux DVIG pour les paiements.

Aligné avec la décision « Option A par défaut, Option B ultérieure » et « commencer par account.payment ». POS = évolution ultérieure.

---

## 4) Checklist de conformité (DoD §12)

| Critère | Statut |
|---------|--------|
| 1. Paiement validé (`action_post`) → appel Vault POST /api/v1/payments | ✅ |
| 2. Preuve récupérable GET /api/v1/proof/account_payment/:id (v1.0) | ✅ (à condition d’utiliser le même `source_id` que celui envoyé, idéalement id numérique) |
| 3. En ?format=1.1 : hashes, proof, ledger, verification, event, status | ✅ |
| 4. Idempotence : réémission → pas de doublon | ✅ (par hash payload) ; ⚠️ renforcer avec idempotency_key |
| 5. Retry 5xx → statut pending/retrying puis verified | ⚠️ Manquant (retry manuel ou CRON à ajouter) |
| 6. Correction : contre-paiement + nouveau paiement → 3 preuves distinctes | ✅ (comportement métier, pas de modification d’historique) |

---

## 5) Tests (§13)

**Spec** :  
- Unitaire : mapping Odoo → payload (method, direction, allocations).  
- Intégration : POST /payments + GET proof v1.0 et v1.1.  
- Idempotence (double POST).  
- Erreur 502 simulée + retry Odoo → succès.

**À faire** :  
- Test unitaire Odoo (ou Python) pour `_build_vault_payload` (method, direction, contenu `payment` / allocations si ajouté).  
- Tests d’intégration Vault déjà partiellement présents (payments_test.go, etc.) ; ajouter un scénario avec `idempotency_key` si Vault l’accepte.  
- Test E2E : 502 + retry (manuel ou CRON) jusqu’au succès.

---

## 6) Conclusion

La spec **vaulting paiements v1.0** est **implémentable et déjà largement couverte** par l’existant. Les écarts sont surtout :

1. **Payload** : format canonical §6.2 (allocations, payment_reference, issuer/counterparty, source env, source_event_id, idempotency_key) à faire évoluer côté Odoo et éventuellement Vault.  
2. **Idempotence** : envoyer `idempotency_key` et, côté Vault, l’utiliser pour la déduplication (ou documenter l’usage actuel).  
3. **GET proof** : utiliser `source_id` = `str(payment.id)` pour cohérence avec l’URL d’attestation.  
4. **UI** : « Rafraîchir la preuve », optionnellement « Voir la preuve » et bloc « Factures soldées ».  
5. **Retry** : politique explicite + CRON ou bouton « Rafraîchir la preuve ».

En appliquant ces points, la spec peut être considérée **conforme** pour la v1.0, avec des évolutions possibles (canonical payload, POS, Option B DVIG) en phase suivante.
