# AMENDEMENTS — SPEC_DOREVIA_PAYMENTS_v1.1

## Zones à verrouiller + Clarifications d'Architecture

**Date** : 2026-02-09  
**Statut** : Addendum architecture — Review ready  
**Référence** : SPEC_DOREVIA_PAYMENTS_v1.1

---

## 1. Objectif du document

Ce document formalise les **amendements architecturaux** identifiés après revue technique approfondie de la SPEC_DOREVIA_PAYMENTS_v1.1.

**But** :
- Verrouiller les zones à ambiguïté potentielle
- Éviter dette technique long terme
- Renforcer la cohérence Event Universe Dorevia

---

## 2. Zones à Verrouiller (CRITIQUES)

### 🔒 ZONE A — Event Identity vs Idempotence

**Problème potentiel**  
Risque de confusion entre :
- `event_id` (technique)
- `idempotency_key` (métier)

**Décision normative**

| Concept | Rôle |
|--------|------|
| **event_id** | Identifiant technique unique généré par Vault ; utilisé pour traçabilité interne |
| **idempotency_key** | Identité métier de l’événement ; basée sur : `tenant + technical_source + source_model + source_id` |

**Règle** : `event_id` ≠ `idempotency_key`

---

### 🔒 ZONE B — Définition stricte de occurred_at

**Problème potentiel**  
Différences selon systèmes :
- POS → instant paiement
- ERP → date comptable
- PSP → capture / settlement
- Banque → booking date

**Décision normative**

**occurred_at** = moment où le flux économique devient **effectif**.

| Source | Exemple |
|--------|--------|
| POS | Validation du paiement (caisse) |
| PSP | Capture confirmée |
| Bank | Booking confirmé |

---

### 🔒 ZONE C — Currency Future Proof (FX)

**Risque long terme**  
Multi-currency PSP / ECOM / Cross-border.

**Extension possible (non obligatoire v1.1)**  
Optionnel futur :
- `original_amount`
- `original_currency`
- `fx_rate`

---

## 3. Clarifications Métier Supplémentaires

### Allocations — Définition opérationnelle

- **ACCOUNT** : obligatoire si paiement réconcilié ; facultatif sinon.
- **POS** : toujours obligatoire (receipt / ticket).

### company_id Normatif (Confirmé)

- **Format** : `technical_source:raw_company_id`
- **Exemples** : `odoo_account:1`, `odoo_pos:3`, `stripe:account_eu_01`

---

## 4. Invariant Plateforme — Economic Event Universe

Dorevia est conçu pour supporter nativement :

- `payment.posted`
- `invoice.posted`
- `receipt.closed`
- `payout.settled`
- `chargeback.created`

Sans modification du modèle canonique.

---

## 5. Positionnement Architecture Produit

**Dorevia = Infrastructure de Vérité Économique**

| Pas | Mais |
|-----|------|
| ERP addon | Truth Layer |
| Data warehouse | Economic Event Infrastructure |
| Reporting tool | Proof-backed Financial Reality |

---

## 6. Impact Implémentation

**Aucun breaking change requis.**

Les amendements apportent :
- Clarification normative
- Sécurisation des évolutions futures
- Alignement multi-source long terme

---

## 7. Conclusion

La SPEC v1.1 reste valide. Ces amendements renforcent :

- Robustesse multi-sources
- Compatibilité PSP / Banking future
- Cohérence Event Universe
