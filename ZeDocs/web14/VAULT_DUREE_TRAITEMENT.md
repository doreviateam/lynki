# Durée du traitement côté Vault

Le traitement d’un événement (POST /api/v1/events) est **synchrone** : stockage, JWS et ledger sont faits dans la même requête. Quand Vault renvoie 200, le document est déjà « Protégée » (status verified).

---

## Où part le temps dans Vault

Tout se passe dans `StoreDocumentWithEvidence` (storage) :

1. Vérification idempotence (SELECT)
2. INSERT document + écriture fichier
3. Signature JWS (si activée)
4. Append ledger (si activé)
5. UPDATE evidence_jws / ledger_hash
6. COMMIT

Aucun job asynchrone : la réponse HTTP 200 est envoyée **après** que le document soit en base avec EvidenceJWS. Donc côté Vault, il n’y a pas de « traitement lent après réception » : si la requête est lente, c’est l’une de ces étapes (souvent DB ou disque).

---

## Vérifier la durée côté Vault

### 1. Log (à partir du correctif)

Le log de succès inclut `duration_ms` (temps total du handler, dont StoreDocumentWithEvidence) :

```bash
docker logs vault-core-stinger 2>&1 | grep "Event vaulted successfully"
```

Exemple : `"duration_ms": 45` → traitement en ~45 ms.

### 2. Métrique Prometheus

La métrique `document_storage_duration_seconds{operation="store"}` est déjà enregistrée dans `StoreDocumentWithEvidence` (storage). Pour un traitement typique, on reste en général sous 100–200 ms.

```bash
curl -s http://localhost:8080/metrics | grep document_storage_duration
```

---

## Conclusion

Si les logs ou la métrique montrent des durées faibles (< 200 ms), le goulot n’est **pas** le traitement Vault. Le délai perçu (1–2 min jusqu’à « Protégée » dans Odoo) vient alors surtout du **fetch_proof** Odoo (planification du job, backoff [1,2,4,8,20] en cas de retry). Si au contraire `duration_ms` ou la métrique sont souvent > 1 s, investiguer DB, disque ou JWS/ledger côté Vault.
