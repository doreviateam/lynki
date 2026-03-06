# ADDENDUM_IMPL_PHASES_ADJUSTMENTS_v1.0 — Implémentation Phases (Derived → Native Model)

**Version** : v1.0  
**Date** : 2026-02-10  
**Statut** : Décision d'architecture validée (Implémentation Phase 1)  
**Rattachement** : SPEC_DOREVIA_ADJUSTMENTS_v1.0  
**Compatibilité** : SPEC_DOREVIA_PAYMENTS_v1.1 / Implémentation Vault actuelle

---

## 0) Objectif

Formaliser la stratégie d'implémentation pour les Adjustments (Avoirs & Remboursements) afin de :

- Éviter toute duplication de données
- Réutiliser les documents déjà vaultés (payments / invoices)
- Permettre une implémentation rapide Phase 1 (Linky + agrégations Vault)
- Garder la porte ouverte à un modèle canonique natif Phase 2 si nécessaire

**Principe directeur** : *Projection métier dérivée > Nouveau flux ingestion*

---

## 1) Décision d'Architecture

### Phase 1 — Derived Event Model (Implémentation actuelle recommandée)

#### Aucun nouveau flux d'ingestion

On ne crée **PAS** :
- endpoint POST /adjustments
- nouveau type de document Vault
- nouveau flux DVIG dédié adjustments

#### Réutilisation des documents existants

**Payments**  
- Source : `source = payment`, metadata `is_refund`, metadata `direction`

**Invoices (Avoirs)**  
- Source : `source = sales` / `purchase`, `move_type = out_refund` / `in_refund`

#### Event Type = Champ dérivé (Aggregation Layer)

Mapping officiel :

| Source | Condition | event_type |
|--------|-----------|------------|
| payment | is_refund=true, direction=outbound | refund.customer.paid |
| payment | is_refund=true, direction=inbound | refund.supplier.received |
| sales | move_type=out_refund | credit_note.customer.issued |
| purchase | move_type=in_refund | credit_note.supplier.received |

#### Avantages Phase 1

- Zéro migration de données
- Zéro duplication documents
- Compatible rétro avec DVIG + Payments ingestion
- Implémentation rapide côté Vault + Linky
- Cohérent avec Event → Proof → Append-only

---

## 2) Endpoint Aggregation — Contrat Officiel

### GET /ui/aggregations/adjustments

#### Query Parameters

- **tenant** : requis (aligné sur les autres agrégations Vault).
- **date_debut**, **date_fin** : requis (YYYY-MM-DD), alignés sur payments/sales/purchases.
- **Optionnels** : event_type, direction, company_id, granularity (day | month), list=1

#### Response Format

```json
{
  "total_amount": number,
  "event_count": number,
  "currency": string,
  "series": [],
  "events": []  // si list=1
}
```

#### events[] Structure

Chaque élément : `document_id`, `source_model`, `source_id`, `event_type`, `amount`, **`event_date`** (date métier canonique), `created_at`, `partner_id`

**Règle event_date (canonical)** : `event_date` = **payment_date** pour les payments ; **invoice_date** (ou équivalent) pour les credit notes. Ne jamais utiliser created_at ou vault timestamp comme event_date (cf. CHECKLIST_PROD_READY_ADJUSTMENTS_v1.0 §1).

---

## 3) Idempotence

**Remboursements (Payments)**  
Clé officielle : `tenant_id` + `source_model` + `source_id`  
→ Identique SPEC PAYMENTS

**Avoirs (Invoices Refund)**  
Déjà géré via : clé d’idempotence DVIG (invoices)  
→ Aucun changement nécessaire

---

## 4) Mapping Odoo — Cas Critique Remboursement Fournisseur

**Règle officielle (production)**

- `refund.customer.paid` = payment + is_refund=true + direction=outbound (partner_type customer)
- `refund.supplier.received` = payment + is_refund=true + direction=inbound **et** réconcilié avec au moins un avoir fournisseur (move_type in_refund)

**Règle is_refund recommandée** (éviter faux positifs) :  
**is_refund = TRUE** si (outbound + customer) **OU** (inbound + supplier + réconcilié avec avoir fournisseur).  
Un paiement inbound fournisseur *normal* (sans avoir) reste is_refund = FALSE.

**Vérification connecteur Odoo**

Le connecteur **DOIT** remonter `is_refund` pour les paiements inbound quand partner_type = supplier et le paiement est réconcilié avec au moins une facture/avoir de type in_refund. Sinon : compléter le mapping côté connecteur.

---

## 5) Phase 2 — Native Canonical Event Model (Optionnel Futur)

Envisageable si : multi-ERP natif nécessaire, forensic niveau légal extrême, audit externalisé par tiers.

**Phase 2 apporte** : event_type stocké nativement, payload adjustments dédié, traçabilité métier directe sans dérivation.

**Phase 2 n’est PAS requise pour** : Linky CFO projection, logique NF/LNE append-only, audit opérationnel standard.

---

## 6) Règle Stratégique Dorevia

> Si la donnée existe déjà dans Vault → on dérive le sens métier via les agrégations → on ne duplique jamais l’événement.

---

## 7) Conclusion

Phase 1 (Derived Model) est :
- ✔ Suffisante produit
- ✔ Suffisante conformité
- ✔ Suffisante audit
- ✔ Suffisante Linky

Phase 2 reste une option d’évolution long terme.

---

# FIN
