# Avis — Amendements format de preuve Dorevia-Vault v1.1

**Date** : 5 février 2026  
**Contexte** : Proposition d’amendements pour renforcer l’opposabilité juridique, l’auditabilité et la robustesse cryptographique des preuves de vaulting.

---

## 1. Synthèse

**Verdict** : **Favorable.** Les amendements sont cohérents avec l’existant, alignés NF525 / LNE 2026, et la mise en œuvre est raisonnable (rétro‑compatibilité v1.0 possible).

---

## 2. Alignement avec le code actuel (Vault)

| Amendement proposé | État actuel dans le code | Commentaire |
|--------------------|---------------------------|-------------|
| **§1** `payload_sha256` / `pdf_sha256` / `attestation_jws` | `ProofResponse` : `hash` (= SHA256 du payload), `jws` (= EvidenceJWS). Pas de `pdf_sha256` exposé dans l’API proof (présent côté events/invoices). | Séparation déjà partielle ; renommer / structurer en `hashes.payload_sha256`, `proof.attestation_jws` et ajouter `hashes.pdf_sha256` (optionnel) clarifie la sémantique. |
| **§2** Canonicalisation explicite | `utils.CanonicalizeJSON` utilisé (constat, payments, pos_tickets, zreports) : tri des clés, suppression des null, normalisation des nombres. **Pas** RFC 8785 (JCS). | Ajouter un champ `canonicalization` (ex. `"internal_v1"` ou migrer vers JCS et mettre `"RFC8785_JCS"`) évite l’ambiguïté sur la méthode de hash. |
| **§3** `proof_format_version`, `signature_alg`, `key_id` | Non exposés dans `ProofResponse`. Le signer a un `KID` (GetKID()) ; l’algo est fixe (RS256 / ES256 selon config). | Ajout simple en lecture dans la réponse proof ; renforce l’audit. |
| **§4** Bloc `verification` (jwks_uri, public_key_fingerprint) | Pas d’endpoint `/.well-known/jwks.json` exposé aujourd’hui. | Nécessite d’exposer un JWKS (ou une clé publique) + optionnellement un fingerprint ; effort modéré, gros gain pour vérification tierce. |
| **§5** `ledger_seq`, `prev_ledger_hash` | Table `ledger` : `id` (seq), `hash`, `previous_hash`. `ProofResponse` a déjà `prev_hash` ; pas de `ledger_seq` (numéro d’ordre) dans l’API. | Ajouter `ledger.seq` (id du ledger) et conserver / renommer `prev_hash` en `ledger.prev_hash` : données déjà disponibles. |
| **§6** `source_event_id`, `idempotency_key` | Stockés : `PayloadJSON` (event_id), `Document.IdempotencyKey`. Non exposés dans `ProofResponse`. | Ajout en lecture dans la réponse ; pas de changement de persistance. |

Conclusion : la base (hash, JWS, ledger, canonicalisation, idempotence) existe ; les amendements consistent surtout à **structurer et exposer** des champs déjà présents ou facilement dérivables, plus un bloc **verification** et une **version de format**.

---

## 3. Points forts de la proposition

- **Clarté juridique** : Séparation nette hash / signature / vérification, et métadonnées de preuve (version, algo, clé) facilitent l’expertise et l’opposabilité.
- **Audit NF525 / LNE 2026** : `proof_format_version`, `signature_alg`, `key_id` et bloc `verification` permettent une vérification indépendante sans dépendre du seul backend.
- **Canonicalisation explicite** : Réduit le risque de désaccord sur le calcul du hash (deux implémentations qui canonisent différemment).
- **Chaînage ledger** : `ledger.seq` + `prev_hash` rend la position dans la chaîne explicite, utile pour preuve d’intégrité temporelle.
- **Traçabilité événementielle** : `source_event_id` et `idempotency_key` lient la preuve à l’événement source et évitent les ambiguïtés en cas de relecture ou replay.
- **Rétro‑compatibilité** : Versionner en `proof_format_version = 1.1` et conserver la réponse actuelle (ou un mode v1.0) est réaliste.

---

## 4. Points d’attention et effort

| Sujet | Risque / effort | Recommandation |
|-------|------------------|----------------|
| **RFC 8785 (JCS)** | L’actuel `CanonicalizeJSON` n’est pas JCS ; un changement pourrait modifier les hash existants. | Soit documenter le schéma actuel (ex. `"canonicalization": "internal_v1"`) et le garder pour v1.1, soit prévoir JCS pour les **nouveaux** documents et double‑calcul (v1.0 + v1.1) pendant une période de transition. |
| **JWKS / verification** | Il faut exposer un JWKS (ou une clé publique) et, si besoin, un fingerprint. | Ajouter une route `/.well-known/jwks.json` (ou équivalent) et la référencer dans `verification.jwks_uri` ; fingerprint = hash de la clé publique (SHA-256 en hex). |
| **Consommateurs actuels** | Odoo, rapports, intégrations qui lisent `hash`, `jws`, `ledger`, `prev_hash`. | Introduire la nouvelle structure en **additif** (nouveaux champs / sous‑objets) et garder les champs plats en dépréciation douce, ou proposer un paramètre `?format=1.1` pour la nouvelle forme. |
| **PDF SHA256** | Aujourd’hui le hash stocké peut être celui du payload JSON (métadonnées) ou du fichier selon les flux. | Clarifier dans le modèle : `payload_sha256` = hash du JSON canonique (événement / métadonnées), `pdf_sha256` = hash du binaire PDF si présent ; les deux optionnels selon le type de document. |

---

## 5. Recommandation

- **Adopter** les amendements en les traitant comme une **évolution du format de preuve en v1.1** :
  - Introduire la structure cible (hashes, proof avec version/algo/key_id, ledger avec seq/prev_hash, verification, event avec source_event_id/idempotency_key) en **extension** de l’API proof actuelle.
  - Documenter la canonicalisation (actuelle ou JCS) dans un champ dédié.
  - Exposer un endpoint JWKS (ou équivalent) et le lier dans `verification`.
- **Rétro‑compatibilité** : Conserver la réponse actuelle (champs plats) au moins pour une version d’API (ex. v1.0) ou un paramètre de requête, le temps que les consommateurs migrent.
- **Planification** : Faire la spec détaillée (schéma JSON, règles de remplissage des champs, cas sans PDF / sans ledger) puis implémentation par étapes : d’abord réponse proof enrichie (sans changer le stockage), puis JWKS + verification, puis option JCS si souhaité.

En résumé : la proposition fait passer le format de **preuve technique robuste** à **preuve réglementairement et audit-friendly** sans remettre en cause les fondations actuelles ; l’avis est favorable avec une mise en œuvre progressive et une attention à la canonicalisation et à la rétro‑compatibilité.
