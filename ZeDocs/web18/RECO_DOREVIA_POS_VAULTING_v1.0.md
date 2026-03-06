# RECO_DOREVIA_POS_VAULTING_v1.0

**Date:** 2026-02-13\
**Context:** Strategic and technical recommendations following
SPEC_DOREVIA_VAULTING_POS_v1.0\
**Objective:** Secure coherence, reduce scope risk, and maximize Cantine
demo impact.

------------------------------------------------------------------------

## 1. Strategic Positioning Recommendation

### 1.1 Do NOT build a proprietary POS

Dorevia must remain:

-   ERP-agnostic
-   POS-agnostic
-   Infrastructure-layer focused

Building a proprietary cash register system would:

-   Explode scope
-   Slow traction
-   Shift positioning from infrastructure to vertical SaaS

Dorevia's strength is being the **truth layer**, not the transaction
layer.

------------------------------------------------------------------------

## 2. Pipeline Coherence Recommendation

### 2.1 Unify all flows through DVIG

All events MUST pass through:

Odoo → DVIG → Vault

Remove any remaining direct Vault calls from Odoo.

Benefits:

-   Consistent idempotency
-   Unified retry logic
-   Reliable `last_sync_at`
-   Operational observability

------------------------------------------------------------------------

## 3. POS Scope Control (Critical)

### 3.1 Keep Z-Report as the only POS event in V1

Do NOT implement:

-   Ticket-level vaulting
-   Product-level analytics
-   Per-payment POS granular vaulting

The Z-report snapshot at session closure is:

-   Retail-native
-   Aggregated
-   Stable
-   Sufficient for territory comparison

------------------------------------------------------------------------

## 4. Payload Hardening Recommendations

### 4.1 Clarify financial semantics

Explicitly define in the spec:

-   `total_sales` = TTC or HT
-   Refund inclusion rules
-   Currency handling rules
-   Multi-company considerations

Retail ambiguity must be eliminated at specification level.

------------------------------------------------------------------------

### 4.2 Optional Integrity Enhancement

Add an optional field:

    "hash_source_snapshot": "<sha256_of_raw_odoo_snapshot>"

Purpose:

-   Forensic traceability
-   Future audit defense
-   Immutable snapshot verification

Not required for Cantine demo, but aligned with long-term vision.

------------------------------------------------------------------------

## 5. Linky Product Discipline

For Cantine V1:

Cards must:

-   Be readable in \<10 seconds
-   Avoid charts
-   Avoid drill-down complexity
-   Avoid predictive messaging

Each card must answer:

"Is this aligned with what I expect?"

------------------------------------------------------------------------

## 6. Cantine Demo Impact Focus

For investor perception:

They must see:

-   Clear architectural boundaries
-   Controlled scope
-   Strong product discipline
-   Retail understanding
-   Execution focus

Avoid over-engineering discussion.

------------------------------------------------------------------------

## 7. 10-Day Execution Order

1.  Refactor payment flow → DVIG
2.  Implement `pos.session.closed` ingestion
3.  Extend Vault handler for session event
4.  Expose minimal aggregate endpoint
5.  Finalize Linky territory cards
6.  Validate sync indicator coherence
7.  End-to-end demo rehearsal

------------------------------------------------------------------------

## 8. Core Reminder

Dorevia is:

-   Not a POS
-   Not an ERP
-   Not an accounting system

Dorevia is:

A certified, append-only truth layer powering a retail decision cockpit.

------------------------------------------------------------------------

END OF DOCUMENT
