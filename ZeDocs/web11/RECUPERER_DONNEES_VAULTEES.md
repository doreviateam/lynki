# Récupérer les données vaultées (preuves Dorevia-Vault)

**Date :** 2026-01  
**Périmètre :** Factures (et autres documents) scellés via Odoo + Dorevia Vault.

---

## 1. Depuis Odoo (interface)

Pour chaque facture protégée :

1. Ouvrez la facture dans **Facturation > Factures clients** (ou fournisseurs).
2. Dans la section **« Sécurité de la facture »** :
   - Consultez le statut (**Protégée**), la date de sécurisation, la référence de preuve, l’empreinte, le JWS.
   - Cliquez sur **« Télécharger l’attestation »** pour obtenir le document de preuve (PDF ou JSON selon le module).

Aucune API à appeler : tout est affiché et téléchargeable depuis la fiche facture.

---

## 2. Via l’API Vault (une preuve par ID)

Pour récupérer **une** preuve par son **ID Odoo** (ex. facture `1946`), utilisez l’endpoint **GET** du Vault.

### Facture (account.move)

```bash
# Remplacez VAULT_URL et TOKEN par votre URL Vault et le token (dorevia.vault.url / dorevia.vault.token)
curl -X GET "https://vault.lab.core.doreviateam.com/api/v1/proof/account_move/1946" \
  -H "Authorization: Bearer VOTRE_TOKEN_VAULT"
```

- **`1946`** = ID Odoo de la facture (visible dans l’URL Odoo : `.../customer-invoices/1946`).
- **Réponse 200** : JSON avec `id`, `hash`, `ledger`, `timestamp`, `jws`, `status`, `source_model`, `source_id`.
- **Réponse 404** : preuve non trouvée pour cet ID.

### Autres types

- Paiement : `GET /api/v1/proof/account_payment/:id`
- Ticket POS : `GET /api/v1/proof/pos_order/:id`
- Paiement POS : `GET /api/v1/proof/pos_payment/:id`

Référence : `sources/vault/docs/PROOF_API.md` et `sources/vault/README.md`.

---

## 3. Récupération en lot (bulk)

Pour plusieurs preuves en une seule requête :

```bash
curl -X POST "https://vault.lab.core.doreviateam.com/api/v1/proof/bulk" \
  -H "Authorization: Bearer VOTRE_TOKEN_VAULT" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      { "type": "account_move", "id": "1946" },
      { "type": "account_move", "id": "1947" }
    ]
  }'
```

Réponse : tableau `results` avec, pour chaque entrée, `type`, `id` et éventuellement `proof` (même structure que GET ci‑dessus).

---

## 4. Résumé

| Besoin              | Où / Comment                                      |
|---------------------|---------------------------------------------------|
| Voir / télécharger  | Odoo > fiche facture > « Sécurité de la facture » |
| Une preuve par API  | `GET /api/v1/proof/account_move/:id` + Bearer     |
| Plusieurs preuves   | `POST /api/v1/proof/bulk` + JSON `requests`       |

**Token** : celui configuré dans Odoo (`dorevia.vault.token`). Permission requise côté Vault : `documents:read`.
