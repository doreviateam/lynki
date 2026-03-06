# RELEASE_NOTE_PROOF_FORMAT_v1.1 — Dorevia Vault

## Date

2026-02-05

## Contexte

Introduction du **format de preuve v1.1** visant à renforcer :
- l’auditabilité
- la vérification tierce
- la clarté cryptographique

tout en conservant la rétro-compatibilité avec le format v1.0.

**Référence d’architecture** : [AMENDEMENTS_FORMAT_PREUVE_DOREVIA_VAULT_v1.1.md](AMENDEMENTS_FORMAT_PREUVE_DOREVIA_VAULT_v1.1.md).

---

## Nouveautés majeures

### 1. Séparation hash / signature

**Avant (v1.0)** : un champ type `hash` ou `jws` pouvait mélanger empreinte et JWS.

**Après (v1.1)** : empreintes dans `hashes` (payload_sha256, pdf_sha256), signature dans `proof.attestation_jws`. Plus aucune ambiguïté entre empreinte et preuve cryptographique.

### Structure versionnée

- Racine : `id` (UUID preuve), `status` (`verified` | `pending`), `canonicalization` (ex. `internal_v1`).
- Bloc `proof` : `proof_format_version = "1.1"`.

### Hashs explicites

- `hashes.payload_sha256` (obligatoire)
- `hashes.pdf_sha256` (optionnel ; non renseigné si le document n’a pas de hash PDF dédié)

### Bloc cryptographique enrichi (métadonnées crypto auditables)

- `proof.proof_id`, `proof.sealed_at`
- `proof.attestation_jws` (JWS signé ; absent si preuve en attente)
- `proof.signature_alg` (ex. `RS256`)
- `proof.key_id`
- `proof.proof_format_version` (`"1.1"`)

### Vérification indépendante

- `verification.jwks_uri` : URL des clés publiques (même origine que la requête + `/jwks.json`)
- `verification.public_key_fingerprint` : fingerprint SHA-256 de la clé publique (SPKI), en hex.

*(Le bloc `verification` est absent si le service JWS n’est pas configuré.)*

### Ledger traçable

- `ledger.seq`, `ledger.hash`, `ledger.prev_hash`

*(Le bloc `ledger` est absent si l’entrée n’est pas encore dans le ledger.)*

### Identité événementielle

- `event.source` (ex. `account.move`)
- `event.source_event_id` (ex. `event_id` DVIG ou ID Odoo)
- `event.idempotency_key` (clé d’idempotence transmise par DVIG, si présente)

---

## Rétro-compatibilité

| Version | Accès |
|--------|--------|
| v1.0 (défaut) | `GET /api/v1/proof/account_move/:id` (et autres types) sans paramètre |
| v1.1 | `GET /api/v1/proof/account_move/:id?format=1.1` (idem pour les autres endpoints) |

Aucune rupture pour Odoo et usages existants : sans `?format=1.1`, la réponse reste au format v1.0 (champs plats `id`, `hash`, `ledger`, `prev_hash`, `timestamp`, `jws`, `status`, `source_model`, `source_id`).

**Endpoints concernés par `?format=1.1` :**

- `GET /api/v1/proof/account_move/:id`
- `GET /api/v1/proof/account_payment/:id`
- `GET /api/v1/proof/pos_order/:id`
- `GET /api/v1/proof/pos_payment/:id`
- `GET /api/v1/proof/event/:event_id`

*(L’endpoint `POST /api/v1/proof/bulk` reste en v1.0 pour l’instant.)*

---

## Structure cible (v1.1)

```json
{
  "id": "uuid-du-document",
  "canonicalization": "internal_v1",
  "hashes": {
    "payload_sha256": "...",
    "pdf_sha256": null
  },
  "proof": {
    "proof_id": "uuid-du-document",
    "sealed_at": "2026-02-05T12:00:00Z",
    "attestation_jws": "eyJ...",
    "signature_alg": "RS256",
    "key_id": "key-2025-Q1",
    "proof_format_version": "1.1"
  },
  "ledger": {
    "seq": 1842,
    "hash": "...",
    "prev_hash": "..."
  },
  "verification": {
    "jwks_uri": "https://<host>/jwks.json",
    "public_key_fingerprint": "<sha256-hex>"
  },
  "event": {
    "source": "account.move",
    "source_event_id": "...",
    "idempotency_key": "..."
  },
  "status": "verified"
}
```

*(`ledger` et `verification` peuvent être absents selon la configuration et l’état du document. Champs optionnels : `pdf_sha256`, `source_event_id`, `idempotency_key`, `prev_hash`.)*

---

## Procédure de vérification d’une preuve

### 1. Récupérer les clés publiques

L’URL est fournie dans la preuve : `verification.jwks_uri` (ex. même hôte que l’API + `/jwks.json`).

```bash
curl -s "https://<vault-host>/jwks.json" -o jwks.json
```

*(Remplacer `<vault-host>` par l’hôte du déploiement, ex. `vault.core-stinger.doreviateam.com`.)*

### 2. Vérifier la signature du JWS

Avec une librairie JWS/JWT standard (recommandé) :

- Charger le JWKS depuis `jwks_uri`.
- Vérifier la signature de `proof.attestation_jws` avec la clé identifiée par `proof.key_id`.

Exemple avec `jwt-cli` (si disponible) :

```bash
jwt verify --jwks jwks.json --alg RS256 "<ATTESTATION_JWS>"
```

*(Le payload JWS est encodé en Base64URL ; pour une inspection manuelle du payload, utiliser un décodeur Base64URL puis JSON.)*

### 3. Vérifier le chaînage (optionnel)

À l’aide de `ledger.seq`, `ledger.hash` et `ledger.prev_hash`, vérifier la cohérence avec l’export ledger (`GET /api/v1/ledger/export`) si besoin.

---

## Bénéfices (gains globaux amendements)

- Clarté juridique
- Audit indépendant (JWKS + fingerprint)
- Sécurité cryptographique propre (séparation hash / signature)
- Chaînage ledger vérifiable (seq, prev_hash) — scalabilité vers Merkle
- Conformité future (NF525 / LNE 2026)
- Aucun retraitement métier côté existant (v1.0 inchangé — zéro rupture legacy)

---

## Conclusion

Le format v1.1 transforme la preuve Dorevia : **preuve technique → registre financier probant et auditable**.

Ces amendements constituent la référence d’architecture pour toute nouvelle intégration. Pour les intégrations existantes, continuer à utiliser le format v1.0 (sans `?format=1.1`) sauf besoin explicite d’audit ou de vérification tierce.
