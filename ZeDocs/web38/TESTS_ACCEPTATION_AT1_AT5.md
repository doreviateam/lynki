# Tests d'acceptation AT1–AT5 — Reste à rapprocher (SPEC web38)

**Date :** 2026-03-03  
**Référence :** ZeDocs/web38/SPEC_RESTE_A_RAPPROCHER.md §9, PLAN_IMPLEMENTATION §4

---

## Prérequis

- Vault opérationnel (GET /ui/aggregations/treasury)
- Tenant laplatine2026 (ou autre) avec données paiements
- Linky accessible pour vérification UI

---

## AT1 — Masquage si complétude KO

**Given** snapshot completeness ok=false  
**Then** la card affiche « Données incomplètes »  
**And** le % est « — » (non affiché)

### Procédure

1. Simuler complétude KO : couper DVIG ou proxy completeness-snapshot
2. Ouvrir Linky → Carte Paiements
3. Vérifier : badge « Données incomplètes », pas de % Reste à rapprocher

### Vérification API (si completeness exposée)

```bash
# Treasury avec completeness_check
curl -s "http://vault-core-stinger:8080/ui/aggregations/treasury?tenant=laplatine2026&company_id=1" \
  -H "X-Tenant: laplatine2026" | jq '.reconciliation_metrics, .completeness'
```

---

## AT2 — Calcul correct

**Given** 10 paiements total A=1000  
**And** 4 paiements rapprochés R=250  
**Then** reste = 75 %

### Procédure (données réelles)

Avec laplatine2026 :

```bash
# Vérifier les métriques
docker exec dvig-core-stinger curl -s \
  "http://vault-core-stinger:8080/ui/aggregations/treasury?tenant=laplatine2026&company_id=1" \
  -H "X-Tenant: laplatine2026" | jq '.reconciliation_metrics'
```

**Attendu :** `remaining_ratio` cohérent avec `(total_amount_abs - reconciled_amount_abs) / total_amount_abs`

Exemple : A=393934, R=10750 → reste ≈ 97,3 %

---

## AT3 — A=0

**Given** aucun paiement sur période  
**Then** « Aucun paiement sur la période »  
**And** pas de %

### Procédure

1. Utiliser un tenant sans paiements sur la période demandée
2. Ou filtrer date_debut/date_fin hors période des paiements
3. Vérifier Linky : message « Aucun paiement sur la période », pas de jauge

```bash
# Période sans paiements (ex. 1990)
curl -s "http://vault-core-stinger:8080/ui/aggregations/treasury?tenant=laplatine2026&company_id=1&date_debut=1990-01-01&date_fin=1990-12-31" \
  -H "X-Tenant: laplatine2026" | jq '.reconciliation_metrics'
```

**Attendu :** `total_amount_abs: 0` ou absence de reconciliation_metrics ; Linky affiche le message adapté.

---

## AT4 — Idempotence projection

**Given** rejouer 2 fois le même event `bank.move.reconciled`  
**Then** `financial_recon_deltas` n'a pas de doublons (event_uid unique)

### Procédure

1. Envoyer 2 fois la même confirmation (même idempotency_key) :

```bash
# Premier envoi
docker exec dvig-core-stinger curl -s -X POST \
  "http://vault-core-stinger:8080/api/v1/bank-reconciliation/confirmation-events" \
  -H "Content-Type: application/json" -H "X-Tenant: laplatine2026" \
  -d '{"tenant":"laplatine2026","event_type":"bank.move.reconciled","bank_statement_line_id":5,
  "impacted_documents":[{"odoo_model":"account.payment","odoo_id":678,"amount_abs":7000}],
  "occurred_at":"2026-03-03T12:00:00Z","idempotency_key":"test-idem:bsl:5:678:7000"}'

# Deuxième envoi (identique)
docker exec dvig-core-stinger curl -s -X POST \
  "http://vault-core-stinger:8080/api/v1/bank-reconciliation/confirmation-events" \
  -H "Content-Type: application/json" -H "X-Tenant: laplatine2026" \
  -d '{"tenant":"laplatine2026","event_type":"bank.move.reconciled","bank_statement_line_id":5,
  "impacted_documents":[{"odoo_model":"account.payment","odoo_id":678,"amount_abs":7000}],
  "occurred_at":"2026-03-03T12:00:00Z","idempotency_key":"test-idem:bsl:5:678:7000"}'
```

2. Vérifier qu'une seule ligne existe :

```sql
SELECT event_uid, COUNT(*) FROM financial_recon_deltas
WHERE tenant='laplatine2026' AND event_uid LIKE 'test-idem%'
GROUP BY event_uid;
```

**Attendu :** 1 ligne par event_uid (ON CONFLICT DO NOTHING).

---

## AT5 — Complétude OK et deltas vides

**Given** completeness_check.ok = true  
**And** financial_recon_deltas vide (aucun rapprochement)  
**Then** remaining_ratio = 1.0  
**And** couleur 🟠 (fort)  
**And** pas de masquage du problème métier

### Procédure

1. Tenant avec paiements vaultés mais aucun rapprochement (financial_recon_deltas vide)
2. Vérifier treasury : `reconciliation_metrics.remaining_ratio = 1.0`
3. Vérifier Linky : affichage 100 % en orange (🟠), pas masqué

```bash
# Si deltas vides pour un sous-ensemble (company_id différent)
curl -s "http://vault-core-stinger:8080/ui/aggregations/treasury?tenant=laplatine2026&company_id=2" \
  -H "X-Tenant: laplatine2026" | jq '.reconciliation_metrics'
```

---

## Résumé exécution

| AT  | Description              | Statut |
|-----|--------------------------|--------|
| AT1 | Masquage complétude KO   | ⏳     |
| AT2 | Calcul correct           | ⏳     |
| AT3 | A=0                      | ⏳     |
| AT4 | Idempotence              | ⏳     |
| AT5 | Deltas vides → 100 % 🟠  | ⏳     |

---

## Références

* `units/dorevia-linky/components/TreasuryCardWithPolling.tsx` — affichage %
* `sources/vault/internal/handlers/bank_reconciliation_confirmation.go` — idempotence event_uid
* `sources/vault/internal/storage/aggregations_payments.go` — GetReconciliationMetrics
