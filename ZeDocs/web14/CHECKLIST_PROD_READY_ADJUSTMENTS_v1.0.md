# CHECKLIST_PROD_READY_ADJUSTMENTS_v1.0

**Version** : v1.0  
**Date** : 2026-02-10  
**Statut** : Production Readiness Checklist  
**Scope** : Vault Aggregations Adjustments (Avoirs & Remboursements) — Phase 1 Derived Model  

**Related Specs** :
- SPEC_DOREVIA_ADJUSTMENTS_v1.0
- ADDENDUM_IMPL_PHASES_ADJUSTMENTS_v1.0
- SPEC_DOREVIA_PAYMENTS_v1.1

**Prise en compte** : Les règles §1 (event_date canonical), §3 (is_refund inbound fournisseur) et le mapping §4 sont intégrées dans l’ADDENDUM et le PLAN_IMPLEMENTATION_ADJUSTMENTS_SCRUM (US-1.1, US-2.1, section Go-Live). La checklist est référencée comme critère Go/No-Go avant mise en prod.

---

## 0) Objectif

Valider que l’implémentation Adjustments est prête pour production sans :
- incohérences CFO
- dérives data
- erreurs d’agrégation
- mauvaise classification remboursement fournisseur
- divergences dates métier

---

## 1) Event Date Canonical Rule

### Règle officielle

**event_date** DOIT être :
- **payment_date** pour payments
- **invoice_date** pour credit notes (avoirs)

**Jamais** : created_at, vault_timestamp (sauf pour created_at en tant que champ distinct d’audit).

### Tests à faire

**Test 1 — Paiement rétro-daté**  
- Créer paiement Odoo avec payment_date dans le passé  
- Vérifier que dans la réponse adjustments (events[] ou agrégation), event_date = payment_date

**Test 2 — Avoir avec invoice_date différent de created_at**  
- Vérifier event_date = invoice_date pour les documents type credit_note

---

## 2) Multi-Currency Safety (Minimum Phase 1)

### Minimum attendu

Retourner : **currency** (au moins une devise représentative ou par agrégat).

### Tests

**Test 3 — Multi currency documents**  
- Si plusieurs devises en base : vérifier agrégation cohérente par currency (ou champ currency présent et non ambigu).

---

## 3) Règle is_refund Inbound Fournisseur

### Règle production recommandée

**is_refund = TRUE** si :
- **(outbound + customer)** OU
- **(inbound + supplier + réconcilié avec au moins un avoir fournisseur (in_refund))**

Cela évite de marquer comme remboursement un paiement fournisseur normal (inbound sans avoir).

### Tests

**Test 4 — Remboursement fournisseur réel**  
- Paiement inbound, réconcilié avec avoir fournisseur (in_refund)  
- is_refund doit être TRUE

**Test 5 — Paiement fournisseur normal**  
- Paiement inbound sans réconciliation avec avoir  
- is_refund doit être FALSE

---

## 4) Event Type Derivation Validation

### Mapping officiel

- payment + is_refund + outbound → refund.customer.paid
- payment + is_refund + inbound → refund.supplier.received
- sales + move_type = out_refund → credit_note.customer.issued
- purchase + move_type = in_refund → credit_note.supplier.received

### Tests

**Test 6** — Tous les cas doivent matcher le mapping ci-dessus (vérification sur jeu de données ou scénarios ciblés).

---

## 5) list=1 Forensic Mode

### Doit retourner

**events[]** avec : document_id, source_model, source_id, event_type, amount, **event_date** (canonical), created_at, partner_id

### Tests

**Test 7** — list=1 doit retourner des données auditables complètes (tous les champs présents, event_date = date métier).

---

## 6) Data Sanity Checks (SQL à exécuter)

**Refund supplier suspects**  
- Lister les paiements inbound (supplier) sans is_refund TRUE qui sont réconciliés avec un in_refund (avoir fournisseur).  
- Ou : lister inbound + partner_type supplier + reconciled_to_credit_note où is_refund = FALSE (à corriger côté connecteur).

---

## 7) Performance Baseline

### Requête adjustments doit

- Répondre **< 300 ms** sur dataset prod moyen
- S’appuyer sur index (tenant, date métier : payment_date / invoice_date)

---

## 8) Linky Consistency Checks

### Vérifier

- SUM(Avoirs Clients) + cohérence avec factures / net sales (selon règle métier retenue)
- Pas de double compte entre Décaissements (hors remboursements) et Remboursements clients

---

## 9) Post Deploy Monitoring (Semaine 1)

Surveiller :
- Ratio refunds (volume remboursements vs paiements totaux)
- Volume adjustments (avoirs + remboursements)
- Latence endpoint adjustments

---

## 10) Go / No Go Criteria

**GO** si :
- ✔ Mapping event_type correct (Test 6)
- ✔ Remboursements inbound fournisseur corrects (Tests 4, 5)
- ✔ event_date cohérent (Tests 1, 2)
- ✔ Cards Linky cohérentes (§8)
- ✔ Perf acceptable (< 300 ms, §7)

---

# FIN
