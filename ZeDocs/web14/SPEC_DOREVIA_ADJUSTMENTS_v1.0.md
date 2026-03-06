# SPEC_DOREVIA_ADJUSTMENTS_v1.0 — Avoirs & Remboursements

**Version** : v1.0  
**Date** : 2026-02-10  
**Statut** : Production Spec (implémentable)  
**Périmètre** :
- Avoirs clients
- Avoirs fournisseurs
- Remboursements clients
- Remboursements fournisseurs
- Intégration Odoo → DVIG → Vault → Linky

**Principe Dorevia** : Event → Proof → Append-only → Projection métier (Linky)

**Addendum implémentation** : ZeDocs/web14/ADDENDUM_IMPL_PHASES_ADJUSTMENTS_v1.0.md (Phase 1 = modèle dérivé, pas de nouveau flux d’ingestion).  
**Plan Scrum** : ZeDocs/web14/PLAN_IMPLEMENTATION_ADJUSTMENTS_SCRUM.md

------------------------------------------------------------------------

# 0) Objectif

Garantir une **preuve opposable, immuable et auditée** des corrections
financières :

-   Réduction de revenu (avoirs clients)\
-   Correction de charges (avoirs fournisseurs)\
-   Sortie cash correctrice (remboursements clients)\
-   Entrée cash correctrice (remboursements fournisseurs)

Sans jamais modifier l'histoire financière.

------------------------------------------------------------------------

# 1) Définitions métier

## 1.1 Avoir client (Credit Note Client)

Réduction d'une facture client.

Impact : - Réduction revenu - Réduction créance client - Pas forcément
mouvement cash

------------------------------------------------------------------------

## 1.2 Avoir fournisseur

Correction d'une facture fournisseur.

Impact : - Réduction charge - Réduction dette fournisseur - Pas
forcément cash

------------------------------------------------------------------------

## 1.3 Remboursement client

Paiement effectué vers le client.

Impact : - Cash OUT - Correction revenue ou trop perçu

------------------------------------------------------------------------

## 1.4 Remboursement fournisseur

Paiement reçu du fournisseur.

Impact : - Cash IN - Correction charge ou trop payé

------------------------------------------------------------------------

# 2) Event Universe --- Vault

## 2.1 Event Types

credit_note.customer.issued\
credit_note.supplier.received\
refund.customer.paid\
refund.supplier.received

------------------------------------------------------------------------

## 2.2 Invariants

-   Event immuable\
-   Correction = nouvel event\
-   Jamais modification post preuve\
-   Timestamp source obligatoire\
-   Idempotence obligatoire\
-   Source ERP traçable

------------------------------------------------------------------------

# 3) Mapping Odoo → Event Vault

## 3.1 Avoir Client

Source Odoo : - model = account.move\
- move_type = out_refund\
- state = posted

Event Vault : credit_note.customer.issued

------------------------------------------------------------------------

## 3.2 Avoir Fournisseur

Source Odoo : - model = account.move\
- move_type = in_refund\
- state = posted

Event Vault : credit_note.supplier.received

------------------------------------------------------------------------

## 3.3 Remboursement Client

Source Odoo : - model = account.payment\
- is_refund = true\
- direction = outbound\
- state IN (posted, paid, in_process)

Event Vault : refund.customer.paid

------------------------------------------------------------------------

## 3.4 Remboursement Fournisseur

Source Odoo : - model = account.payment\
- is_refund = true\
- direction = inbound\
- state IN (posted, paid, in_process)

Event Vault : refund.supplier.received

------------------------------------------------------------------------

# 4) Canonical Payload Vault

## 4.1 Champs obligatoires

-   event_type\
-   tenant_id\
-   source_system = odoo\
-   source_model\
-   source_id\
-   partner_id\
-   currency\
-   amount\
-   event_date\
-   created_at

------------------------------------------------------------------------

## 4.2 Champs recommandés

-   invoice_origin_id\
-   payment_method\
-   journal_code\
-   reference\
-   is_cash_related\
-   payment_state

------------------------------------------------------------------------

# 5) Règles Append-Only

## 5.1 Avoirs

Interdit : - Modifier montant après vault\
- Annuler via modification

Autorisé : - Nouvel avoir correctif\
- Facture corrective

------------------------------------------------------------------------

## 5.2 Remboursements

Interdit : - Modifier paiement après vault

Autorisé : - Paiement inverse correctif

------------------------------------------------------------------------

# 6) Linky --- Projection CFO

## Cards prévues

-   Avoirs Accordés Clients\
-   Avoirs Fournisseurs\
-   Remboursements Clients\
-   Remboursements Fournisseurs

------------------------------------------------------------------------

# 7) Séparation Cash vs Correction

Cash pur : - Encaissements\
- Décaissements

Correction économique : - Avoirs\
- Remboursements

------------------------------------------------------------------------

# 8) Audit & Forensic

Endpoint : GET /ui/aggregations/adjustments?list=1

Retour : events\[\] : - document_id\
- source_id\
- event_type\
- amount\
- event_date\
- created_at

------------------------------------------------------------------------

# 9) Compatibilité POS

POS Refund → refund.customer.paid

------------------------------------------------------------------------

# 10) Sécurité & Cohérence

Si Vault OK : - Lock modification Odoo\
- UI statut preuve visible\
- Blocage remise en brouillon si vaulted

------------------------------------------------------------------------

# 11) KPI Linky Possibles

-   Ratio Avoirs / CA\
-   Ratio Remboursements / Cash OUT\
-   Corrections par client\
-   Corrections par fournisseur

------------------------------------------------------------------------

# 12) Roadmap V2

-   Economic Net Revenue Truth Layer\
-   Refund lifecycle tracking\
-   Root cause classification\
-   Linking credit note → refund → original invoice chain

------------------------------------------------------------------------

# 13) Résumé Stratégique

Dorevia distingue : - Cash réel\
- Corrections économiques\
- Historique financier immuable

Objectif : Rendre la réalité financière impossible à déformer.

------------------------------------------------------------------------

# FIN
