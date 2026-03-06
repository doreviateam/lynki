# Tests manuels Adjustments (Checklist prod Tests 4 et 5)

Ref: CHECKLIST_PROD_READY_ADJUSTMENTS_v1.0, Plan US-2.1.

## Test 4 — Remboursement fournisseur reel -> is_refund = TRUE

1. Odoo : creer un avoir fournisseur (in_refund), valider.
2. Creer un paiement fournisseur qui reconcilie cet avoir. Valider.
3. Verifier statut Vault « Protege » pour ce paiement.
4. Verifier is_refund = true : GET /ui/aggregations/adjustments?list=1&event_type=refund.supplier.received ou en base (payload_json->>'is_refund' = 'true' pour ce paiement inbound).

Succes : le paiement apparait dans refund.supplier.received.

## Test 5 — Paiement fournisseur normal -> is_refund = FALSE

1. Odoo : facture fournisseur normale (in_invoice), valider.
2. Paiement fournisseur qui reconcilie cette facture. Valider.
3. Verifier is_refund = false ; ce paiement ne doit pas apparaitre dans event_type=refund.supplier.received.

Succes : pas de double compte avec les remboursements.

## Go/No-Go

Executer scripts/check_adjustments_gonogo.sh (perf + structure). Valider aussi Tests 4 et 5 et coherence cards Linky (checklist 10).
