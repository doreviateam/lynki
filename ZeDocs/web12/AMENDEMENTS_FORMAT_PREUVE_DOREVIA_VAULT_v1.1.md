# AMENDEMENTS — Format de preuve Dorevia Vault v1.1

## Date

2026-02-05

## Objectif

Formaliser les améliorations apportées au format de preuve afin de le rendre :
- juridiquement opposable
- audit-ready
- vérifiable par un tiers
- robuste à long terme

Tout en conservant la rétro-compatibilité avec le format v1.0.

---

## 1. Séparation claire hash / signature

### Avant

`empreinte_numerique` (ou champ équivalent) contenait directement un JWS complet.

### Après

Bloc dédié aux empreintes :

```json
"hashes": {
  "payload_sha256": "...",
  "pdf_sha256": null
}
```

et bloc dédié à la preuve cryptographique :

```json
"proof": {
  "attestation_jws": "..."
}
```

### Bénéfice

Plus aucune ambiguïté entre empreinte et signature cryptographique.

---

## 2. Canonicalisation explicite

Ajout du champ racine :

```json
"canonicalization": "internal_v1"
```

(ou futur RFC8785)

### Bénéfice

Hash déterministe, stable et vérifiable dans le temps.

---

## 3. Métadonnées crypto auditables

Ajout dans `proof` :
- `signature_alg`
- `key_id`
- `proof_format_version`

### Bénéfice

Audit immédiat sans introspection du JWS.

---

## 4. Vérification indépendante

Nouveau bloc :

```json
"verification": {
  "jwks_uri": ".../jwks.json",
  "public_key_fingerprint": "..."
}
```

### Bénéfice

Un tiers peut vérifier la preuve sans dépendre de Vault.

---

## 5. Ledger chaîné

Bloc dédié :

```json
"ledger": {
  "seq": 1842,
  "hash": "...",
  "prev_hash": "..."
}
```

### Bénéfice

Traçabilité chronologique complète et future compatibilité Merkle.

---

## 6. Identité événementielle

Bloc :

```json
"event": {
  "source": "...",
  "source_event_id": "...",
  "idempotency_key": "..."
}
```

### Bénéfice

Causalité claire, rejouabilité sûre, aucune ambiguïté métier.

---

## 7. Status de preuve

Champ racine :

```json
"status": "verified" | "pending"
```

### Bénéfice

Gestion propre de l’asynchrone et des retries.

---

## Structure cible consolidée

```json
{
  "id": "...",
  "canonicalization": "internal_v1",
  "hashes": {
    "payload_sha256": "...",
    "pdf_sha256": null
  },
  "proof": {
    "proof_id": "...",
    "sealed_at": "...",
    "attestation_jws": "...",
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
    "jwks_uri": "...",
    "public_key_fingerprint": "..."
  },
  "event": {
    "source": "...",
    "source_event_id": "...",
    "idempotency_key": "..."
  },
  "status": "verified"
}
```

---

## Gains globaux

- Clarté juridique
- Audit indépendant
- Sécurité cryptographique propre
- Scalabilité long terme
- Conformité future (NF525 / LNE 2026)
- Zéro rupture legacy

---

## Conclusion

Le format v1.1 fait évoluer Dorevia-Vault :

**preuve technique → registre financier probant et auditable**.

Ces amendements constituent désormais la référence d’architecture pour toute nouvelle intégration.

---

## Références

- Implémentation : `sources/vault/internal/handlers/proof.go` (ProofResponseV11, buildProofResponseV11)
- Release note : `ZeDocs/web12/RELEASE_NOTE_PROOF_FORMAT_v1.1.md`
