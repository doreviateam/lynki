# Plan d’implémentation — Adjustments (Avoirs & Remboursements) — Scrum-like

**Réf. spec** : SPEC_DOREVIA_ADJUSTMENTS_v1.0  
**Réf. addendum** : ADDENDUM_IMPL_PHASES_ADJUSTMENTS_v1.0 (Phase 1 = Derived Event Model)  
**Réf. checklist prod** : CHECKLIST_PROD_READY_ADJUSTMENTS_v1.0 (event_date, is_refund fournisseur, perf, Go/No-Go)  
**Périmètre** : Phase 1 — agrégation dérivée, aucun nouveau flux d’ingestion  
**Objectif** : Livrer l’endpoint Vault `GET /ui/aggregations/adjustments`, les cards Linky (Avoirs / Remboursements) et la cohérence connecteur Odoo (is_refund inbound).

**Dernière mise à jour** : 2026-02-10

---

## 1. Vue d’ensemble

| Epic | Résumé | Priorité |
|------|--------|----------|
| **E1** | Vault — Endpoint agrégation adjustments (données dérivées payments + invoices) | P0 |
| **E2** | Connecteur Odoo — is_refund pour paiements inbound (remboursement fournisseur) | P1 |
| **E3** | Linky — Proxy API + cards Avoirs / Remboursements | P0 |

**Ordre recommandé** : E1 → E2 (en parallèle possible avec E3 après E1) → E3. E1 est le bloc central (Vault) ; E2 assure la complétude des données ; E3 consomme l’API.

---

## 2. Epic 1 — Vault : agrégation adjustments

**Valeur** : Une seule API expose les corrections (avoirs + remboursements) avec event_type dérivé, sans dupliquer les documents.

### US-1.1 — Endpoint GET /ui/aggregations/adjustments

**En tant que** consommateur (Linky, audit),  
**je veux** appeler `GET /ui/aggregations/adjustments` avec tenant et période,  
**afin que** j’obtienne les totaux et séries des adjustments (avoirs + remboursements) dérivés des documents existants.

**Critères d’acceptation**
- [x] Endpoint implémenté (handler + storage + RBAC). À faire : enregistrer la route dans le main (voir sources/vault/docs/ROUTE_AGGREGATIONS_ADJUSTMENTS.md). Paramètres : tenant, date_debut, date_fin (requis), event_type, company_id, granularity, list=1 (optionnels).
- [x] Réponse : total_amount, event_count, currency, series[], events[] (si list=1). Lecture seule sur documents (payment is_refund ; sales/purchase move_type out_refund/in_refund).
- [x] event_date canonique (CHECKLIST §1) : payment_date pour payments, invoice_date pour credit notes ; jamais created_at.
- [x] event_type dérivé selon ADDENDUM (refund.customer.paid, refund.supplier.received, credit_note.customer.issued, credit_note.supplier.received).

**Tâches techniques**
- Créer handler `AdjustmentsAggregationHandler` (ou équivalent), appeler une couche storage `AdjustmentsAggregation(ctx, tenant, dateDebut, dateFin, eventType, companyID, granularity)`. Utiliser les query params date_debut, date_fin (comme aggregations_payments.go).
- En storage : requêtes SQL sur `documents` — (1) payments : source='payment', payload_json->>'is_refund' = 'true', payload_json->>'payment_direction' in ('inbound','outbound') ; (2) invoices : source in ('sales','purchase'), move_type in ('out_refund','in_refund'). Filtrer par date (payment_date pour payments, invoice_date ou équivalent pour invoices), tenant, company_id. Dériver event_type pour chaque ligne.
- Agrégation : SUM(amount), COUNT(*), séries par période (date_trunc). Si list=1, renvoyer la liste des événements (document_id, source_model, source_id, event_type, amount, event_date, created_at, partner_id si dispo).
- Enregistrer la route dans le routeur et la table RBAC si nécessaire (PermissionReadDocuments).

**Estimation** : 5 points

---

### US-1.2 — Filtre event_type et direction

**En tant que** consommateur,  
**je veux** filtrer par event_type (ex. uniquement refund.customer.paid) ou par direction (inbound / outbound),  
**afin que** je puisse alimenter des cards ou des exports ciblés.

**Critères d’acceptation**
- [x] Query param event_type (optionnel) : si présent, ne retourner que les événements de ce type (refund.customer.paid | refund.supplier.received | credit_note.customer.issued | credit_note.supplier.received).
- [x] Query param direction (optionnel) : si présent, filtrer côté dérivation (outbound = refund.customer.paid + credit_note.customer.issued ? ; inbound = refund.supplier.received + credit_note.supplier.received). À aligner avec la spec si direction s’applique aux 4 types.

**Tâches techniques**
- Ajouter les filtres dans la requête storage (WHERE dérivé selon event_type / direction).
- Documenter les paramètres dans l’addendum ou la spec.

**Estimation** : 2 points

---

## 3. Epic 2 — Connecteur Odoo : is_refund pour remboursement fournisseur

**Valeur** : Les remboursements fournisseurs (paiement inbound + is_refund) sont bien envoyés au Vault avec is_refund=true pour alimenter refund.supplier.received.

### US-2.1 — Vérification et complément is_refund inbound

**En tant que** responsable plateforme,  
**je veux** que tout paiement inbound correspondant à un remboursement fournisseur envoie is_refund=true au Vault,  
**afin que** l’agrégation adjustments compte bien refund.supplier.received.

**Critères d’acceptation**
- [x] Règle is_refund (CHECKLIST_PROD_READY §3) : is_refund = True si (outbound + customer) **OU** (inbound + supplier **et** réconcilié avec au moins un avoir in_refund).
- [x] Connecteur (account_payment.py) : _build_vault_payload() dérive is_refund (reconciled_invoice_ids / reconciled_bill_ids + move_type in_refund).
- [x] Aucune régression : outbound + customer reste is_refund=True.
- [ ] Tests 4 et 5 de la checklist (manuels) : remboursement fournisseur réel → is_refund TRUE ; paiement fournisseur normal → is_refund FALSE.

**Tâches techniques**
- Utiliser reconciled_invoice_ids / reconciled_bill_ids : si au moins un move a move_type == 'in_refund' et partner_type == 'supplier', alors is_refund = True pour le paiement inbound.
- Adapter _build_vault_payload() : is_refund = (outbound and partner_type == 'customer') or (inbound and partner_type == 'supplier' and any(m.move_type == 'in_refund' for m in reconciled)).
- Test manuel ou unitaire aligné checklist (Tests 4, 5).

**Estimation** : 3 points

---

## 4. Epic 3 — Linky : proxy et cards Avoirs / Remboursements

**Valeur** : L’utilisateur CFO voit les 4 cards (ou 2+2 regroupées) Avoirs Accordés Clients, Avoirs Fournisseurs, Remboursements Clients, Remboursements Fournisseurs avec totaux et période.

### US-3.1 — Proxy API GET /api/adjustments

**En tant que** app Linky,  
**je veux** appeler une route Next.js (ex. GET /api/adjustments) qui proxy vers Vault GET /ui/aggregations/adjustments,  
**afin que** les données adjustments soient disponibles côté client sans exposer le Vault.

**Critères d’acceptation**
- [x] Route GET /api/adjustments (app/api/adjustments/route.ts), paramètres : tenant, date_debut, date_fin, event_type, company_id, granularity, list.
- [x] Proxy vers VAULT_URL/ui/aggregations/adjustments ; retour JSON (total_amount, event_count, currency, series, events).
- [x] Gestion des erreurs (502 si Vault indisponible, 400 si paramètres invalides).

**Tâches techniques**
- Créer le fichier route, lire searchParams, construire l’URL Vault, fetch, retourner NextResponse.json(data).
- Utiliser TENANT_ID par défaut si tenant absent.

**Estimation** : 1 point

---

### US-3.2 — Cards Linky : Avoirs et Remboursements

**En tant qu’** utilisateur Linky,  
**je veux** voir au moins 2 cards (ou 4) : Avoirs (clients + fournisseurs) et Remboursements (clients + fournisseurs),  
**afin que** les corrections financières soient visibles comme prévu en SPEC §6.

**Critères d’acceptation**
- [x] Card « Avoirs accordés (clients) » : total_amount + event_count (event_type credit_note.customer.issued).
- [x] Card « Avoirs fournisseurs » : event_type credit_note.supplier.received.
- [x] Card « Remboursements clients » : event_type refund.customer.paid.
- [x] Card « Remboursements fournisseurs » : event_type refund.supplier.received.
- [x] Même période et company_id que le reste du dashboard (AdjustmentsCardWithPolling).
- [x] Affichage cohérent (AdjustmentsCard : montant, nombre d’événements, période, badge certifié).

**Tâches techniques**
- Créer composants AdjustmentsCard ou réutiliser un pattern PaymentsCard avec 4 appels (ou 1 appel adjustments avec event_type filtré 4 fois, ou 1 appel global et filtrage côté client). Préférer 1 appel avec event_type pour chaque card pour limiter les requêtes.
- Intégrer les 4 cards dans le dashboard (page ou onglet), alimentation via GET /api/adjustments?event_type=... (ou un seul appel sans filtre et agrégation côté client).
- Types TypeScript : AdjustmentsAggregationResponse (total_amount, event_count, currency, series, events).

**Estimation** : 5 points

---

## 5. Backlog récapitulatif

| Id | US | Epic | Points |
|----|-----|------|--------|
| 1 | US-1.1 | E1 Vault adjustments endpoint | 5 |
| 2 | US-1.2 | E1 Filtre event_type / direction | 2 |
| 3 | US-2.1 | E2 Connecteur is_refund inbound | 3 |
| 4 | US-3.1 | E3 Linky proxy /api/adjustments | 1 |
| 5 | US-3.2 | E3 Cards Linky (4 cards) | 5 |

**Total estimé** : 16 points.

---

## 6. Sprints suggérés

- **Sprint 1** (Vault) : US-1.1 + US-1.2 → livrable = GET /ui/aggregations/adjustments opérationnel.
- **Sprint 2** (Connecteur + Linky) : US-2.1 + US-3.1 + US-3.2 → livrable = données complètes remboursement fournisseur + dashboard Linky avec 4 cards.

Ou en 3 sprints courts : S1 = US-1.1 ; S2 = US-1.2 + US-3.1 + US-3.2 ; S3 = US-2.1 (complément connecteur).

---

## 7. Dépendances

- E1 ne dépend d’aucun autre epic (données déjà en base).
- E2 peut être fait en parallèle de E1/E3 ; utile avant ou pendant E3 pour que la card « Remboursements Fournisseurs » soit alimentée.
- E3 dépend de E1 (API Vault disponible).

---

## 8. Cohérence inter-documents

| Élément | Spec Adjustments | Addendum | Plan | Implémentation actuelle |
|--------|------------------|----------|------|--------------------------|
| **Event types** | §2.1 credit_note.*, refund.* | Mapping dérivé identique | US-1.1 | Implémenté (storage + handler) ✓ |
| **Mapping Odoo** | §3.1–3.4 (move_type, is_refund, direction) | Idem | E2 US-2.1 | Connecteur : is_refund outbound+customer + inbound+supplier (reconciled in_refund) ✓ |
| **Sources Vault** | — | payment, sales, purchase | US-1.1 | payment (payments.go) ; sales/purchase (invoices.go move_type) ✓ |
| **Params API** | §8 list=1 | date_debut, date_fin, tenant | US-1.1, US-3.1 | Agrégations existantes : date_debut, date_fin, tenant ✓ |
| **event_date** | — | payment_date / invoice_date (CHECKLIST §1) | US-1.1 | Implémenté (storage) ✓ |
| **currency** | §4.1 | Retour dans réponse (CHECKLIST §2) | US-1.1 | Réponse contient currency ✓ |
| **Idempotence** | §2.2 | Payments = tenant+source_model+source_id ; Avoirs = DVIG | — | Déjà en place ✓ |
| **Cards Linky** | §6 (4 cards) | — | US-3.2 | Implémenté (4 cards dashboard) ✓ |

**Alignement effectué** : paramètres d’agrégation nommés **date_debut** / **date_fin** (et non date_from/date_to) dans l’Addendum et le Plan pour cohérence avec GET /ui/aggregations/payments-*, sales, purchases.

**Go-Live** : Avant mise en production des adjustments, valider **CHECKLIST_PROD_READY_ADJUSTMENTS_v1.0** (§10 Go/No-Go : mapping correct, refunds inbound corrects, event_date cohérent, cards Linky cohérentes, perf < 300 ms).

---

## 9. État d’implémentation et suite

**Fait** : Handler + storage + RBAC Vault (adjustments) ; point d'entrée `cmd/vault/main.go` (route adjustments enregistrée) ; connecteur is_refund inbound+supplier ; proxy Linky GET /api/adjustments ; 4 cards. Tableau de cohérence §8 aligné.

**Reste à faire** :
1. **Vault** : Enregistrer la route dans le point d’entrée HTTP (main) — voir `sources/vault/docs/ROUTE_AGGREGATIONS_ADJUSTMENTS.md`. Puis build image (ex. v1.7.0-adjustments) et déploiement.
2. **Tests manuels** : Voir `scripts/GUIDE_TESTS_MANUELS_ADJUSTMENTS.md` (Tests 4 et 5 : remboursement fournisseur → is_refund TRUE ; paiement normal → FALSE).
3. **Go/No-Go** : Exécuter `scripts/check_adjustments_gonogo.sh` (perf, structure). Valider checklist §10 (Tests 4 et 5, cohérence Linky).

---

## 10. Références

- sources/vault/docs/ROUTE_AGGREGATIONS_ADJUSTMENTS.md (enregistrement route)
- scripts/check_adjustments_gonogo.sh (vérif perf + structure endpoint)
- scripts/GUIDE_TESTS_MANUELS_ADJUSTMENTS.md (Tests 4 et 5 is_refund)
- SPEC_DOREVIA_ADJUSTMENTS_v1.0.md
- ADDENDUM_IMPL_PHASES_ADJUSTMENTS_v1.0.md
- CHECKLIST_PROD_READY_ADJUSTMENTS_v1.0.md (event_date, is_refund fournisseur, perf, Go/No-Go)
- EVALUATION_SPEC_DOREVIA_ADJUSTMENTS_v1.0.md
- SPEC_DOREVIA_PAYMENTS_v1.1.md (§7.2 exclusion is_refund Décaissements)
