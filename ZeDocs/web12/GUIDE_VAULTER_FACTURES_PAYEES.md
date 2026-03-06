# Guide — Vaulter les factures payées (paiements)

**Date** : 2026-02-05  
**Contexte** : Les factures validées sont déjà vaultées (via DVIG → Vault `/api/v1/events`). Ce guide décrit comment **vaulter les paiements** (factures payées) pour avoir une preuve par paiement.

---

## 1. Vue d’ensemble

| Élément | Facture validée | Facture payée (paiement) |
|--------|------------------|---------------------------|
| **Déclencheur** | `account.move` `action_post()` | `account.payment` posté / réconciliation |
| **Côté Vault** | `POST /api/v1/events` (payload facture) | `POST /api/v1/payments` (payload paiement) |
| **Preuve** | `GET /api/v1/proof/account_move/:id` | `GET /api/v1/proof/account_payment/:id` |

Pour « vaulter les factures payées », on vault **chaque paiement** (`account.payment`) via `POST /api/v1/payments`. La preuve du paiement est ensuite disponible sur `GET /api/v1/proof/account_payment/:id`.

---

## 2. Côté Vault (déjà en place)

### 2.1 Route activée

- **POST /api/v1/payments** est activé lorsque la base et le service JWS sont configurés.
- Header obligatoire : **X-Tenant** (identique au champ `tenant` du body).
- Payload : voir [Spécification endpoint payments](sources/vault/docs/SPECIFICATION_ENDPOINT_PAYMENTS_VAULT.md).

### 2.2 Exemple minimal (curl)

```bash
curl -X POST "https://<vault-host>/api/v1/payments" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: core" \
  -d '{
    "tenant": "core",
    "source_system": "odoo",
    "source_model": "account.payment",
    "source_id": "PAY/2026/00042",
    "payment_date": "2026-02-05T14:00:00Z",
    "amount": 120.50,
    "currency": "EUR",
    "method": "transfer",
    "source": "account",
    "payment_direction": "inbound",
    "is_refund": false,
    "company_id": 1,
    "payment": {
      "reconciled_invoice_ids": [123],
      "move_id": 456
    }
  }'
```

### 2.3 Récupérer la preuve d’un paiement

```bash
curl "https://<vault-host>/api/v1/proof/account_payment/PAY%2F2026%2F00042"
# ou par ID numérique Odoo si source_id = "42" :
curl "https://<vault-host>/api/v1/proof/account_payment/42"
```

Avec format preuve v1.1 : `?format=1.1`.

---

## 3. Côté Odoo — Envoyer les paiements au Vault

Deux options : **direct Vault** ou **via DVIG** (si vous centralisez tout par événements).

### 3.1 Option A — Connecteur intégré (dorevia_vault_connector)

Le module **dorevia_vault_connector** inclut désormais le vaulting des paiements et une **vue formulaire** alignée sur les factures : sur chaque paiement (Comptabilité → Paiements clients/fournisseurs), un bloc **« Sécurité du paiement »** s’affiche une fois le paiement posté (statut, date de sécurisation, référence de preuve, bouton « Télécharger l’attestation »). Configuration : `dorevia.vault.url`, `dorevia.vault.token` (optionnel), `dorevia.vault.tenant` (optionnel).

Pour une implémentation manuelle ou un autre module :

1. **Hooks** : Surcharger `account.payment` pour intercepter la validation du paiement (ex. `action_post()` ou bouton « Valider »).
2. **Quand** : Dès que le paiement est posté (et éventuellement quand une facture est marquée payée / réconciliée, selon la règle métier).
3. **Action** : Construire le payload JSON comme dans la spec payments, puis `POST /api/v1/payments` vers l’URL Vault configurée (paramètre système ou config du connecteur).
4. **Sécurité** : Utiliser une URL et un token dédiés (service account), comme pour les factures. Ne pas exposer de secret dans le front.

Champs à remplir depuis `account.payment` (à adapter selon votre version Odoo) :

- `tenant` : paramètre ou config tenant (ex. `core`, `lab`).
- `source_model` : `"account.payment"`.
- `source_id` : identifiant unique du paiement (ex. `name` ou `id`).
- `payment_date` : date du paiement (RFC3339).
- `amount`, `currency` : montant et devise.
- `method` : mapping depuis le mode de paiement Odoo (`cash`, `card`, `transfer`, etc.).
- `source` : `"account"` (paiement facture) ou `"pos"` (paiement POS).
- `payment_direction` : `inbound` / `outbound`.
- `is_refund` : selon type de paiement.
- `company_id` : société.
- `payment` : objet libre (ex. `reconciled_invoice_ids`, `move_id`, références factures).

Idempotence : le Vault s’appuie sur le hash du payload ; un même payload renvoyé ne crée pas de doublon.

### 3.2 Option B — Passer par DVIG (événements)

- Odoo envoie à DVIG un événement de type `payment.posted` (ou équivalent) avec les données du paiement dans `data`.
- Le worker DVIG doit alors soit :
  - appeler Vault **POST /api/v1/payments** pour les événements de type paiement, soit
  - Vault expose un **POST /api/v1/events** qui route `event_type = payment.posted` vers le même traitement que `/api/v1/payments`.

Actuellement, le worker DVIG envoie tout vers Vault **POST /api/v1/events**, et le handler Vault ne traite que les factures (`invoice.posted`). Pour utiliser DVIG pour les paiements, il faudrait soit :

- étendre le handler **events** côté Vault pour qu’il appelle le service payments lorsque `event_type == "payment.posted"`, soit  
- faire en sorte que le worker DVIG envoie les événements paiement vers **POST /api/v1/payments** au lieu de `/api/v1/events`.

Option A (Odoo → Vault direct) évite ces changements et suffit pour vaulter les factures payées.

---

## 4. Ordre de mise en œuvre recommandé

1. **Vault** : Vérifier que `POST /api/v1/payments` est bien exposé (déjà activé si DB + JWS sont configurés).
2. **Test manuel** : Envoyer un paiement de test avec `curl` (comme ci‑dessus), puis récupérer la preuve avec `GET /api/v1/proof/account_payment/:id`.
3. **Odoo** : Implémenter l’envoi des paiements (option A direct Vault) sur `account.payment` posté, avec paramétrage URL Vault + tenant.
4. **Optionnel** : Lier affichage facture / paiement à la preuve (lien vers `GET /api/v1/proof/account_payment/:id` ou rapport intégré).

---

## 5. Références

- **Spécification payments** : `sources/vault/docs/SPECIFICATION_ENDPOINT_PAYMENTS_VAULT.md`
- **Proof API** : `sources/vault/docs/PROOF_API.md` (dont `GET /api/v1/proof/account_payment/:id`)
- **Format preuve v1.1** : `ZeDocs/web12/RELEASE_NOTE_PROOF_FORMAT_v1.1.md`
