# Rapport MOA — Carte Paiements (Rapprochement bancaire)

**Date :** 2026-03-03  
**Objet :** Indicateur « Quelle part de mes paiements ERP est confirmée par la banque ? »  
**Statut :** Réalisé et déployé (Étapes 1 et 3)  
**Référence :** SPEC_CARTE_PAIEMENTS_v1.0.md

---

## 1. Contexte

### 1.1 Objectif

Répondre à une seule question :

> **Quelle part de mes paiements ERP est confirmée par la banque ?**

La carte Paiements affiche :

- **À traiter** : montant des paiements vaultés non encore rapprochés avec une ligne de relevé bancaire
- **Traité** : montant des paiements rapprochés (confirmés par la banque)
- **Couverture probante** : taux de rapprochement (B / (A + B))

### 1.2 Périmètre

- **Paiements** : `account.payment` uniquement (paiements fournisseurs, encaissements clients — hors POS)
- **Filtrage** : tenant, société, période sélectionnée
- **Source** : Vault (Linky ne contacte jamais Odoo directement)

---

## 2. Solution livrée

### 2.1 Contrôle de complétude (Étape 1)

Avant d'afficher les KPI, le système vérifie que les données ERP et Vault sont alignées (même nombre de paiements, même somme à 0,01 € près).

| Situation | Affichage |
|-----------|-----------|
| **Données alignées** | A, B, Couverture probante affichés |
| **Écart détecté** | Badge « Données incomplètes », message explicatif, KPI masqués |
| **Odoo inaccessible** | Badge « Données incomplètes », message « Contrôle de complétude indisponible (Odoo inaccessible) » |

**Effet :** évite d'afficher des indicateurs trompeurs lorsque des paiements ERP ne sont pas encore vaultés ou lorsque Odoo ne répond pas.

### 2.2 Indicateurs (Étape 3 — Option A)

Lorsque la complétude est validée :

| Métrique | Libellé | Source |
|----------|---------|--------|
| À traiter | Montant des paiements non rapprochés | Vault (financial_recon_deltas) |
| Traité | Montant des paiements rapprochés | Vault (financial_recon_deltas) |
| Couverture probante | Taux de rapprochement (B / (A+B)) | Calculé |

**Messages contextuels :**

- « Tous les paiements sont rapprochés » (si A = 0)
- « Des paiements restent à rapprocher » (si A > 0)
- « Aucun paiement vaulté sur la période » (si A + B = 0)

### 2.3 Emplacement

**Carte Paiements** : intégrée au cockpit Linky (card Trésorerie / Paiements existante, enrichie).

---

## 3. Flux de données

```
Odoo (paiements posted)
        ↓
Connecteur → DVIG → Vault (documents)
        ↓
Odoo (rapprochement bancaire) → bank.move.reconciled + impacted_documents
        ↓
Vault (financial_recon_deltas)
        ↓
Linky (completeness_check + confirmation)
```

| Étape | Automatique ? |
|-------|----------------|
| Paiements → Vault | ✅ Connecteur Odoo |
| Rapprochement → Vault | ✅ Événements Odoo → confirmation-events |
| Vault → Linky | ✅ API treasury + payments-completeness |

---

## 4. Travail technique réalisé

### 4.1 Odoo

| Composant | Modification |
|-----------|--------------|
| `linky_bank_reconciliation` | Ajout de `payments_posted_count`, `payments_posted_sum_amount_signed` (filtre `payment_date`, `account.payment`) |

### 4.2 Vault

| Composant | Modification |
|-----------|--------------|
| `payments-completeness` | Nouvel endpoint : contrôle count + sum (tolérance 0,01 €), cache 45 s, messages distincts |
| `treasury` | Exposition du bloc `confirmation` (A, B, taux) |
| `GetConfirmationAggregation` | Périmètre limité à `account.payment` (P0) |

### 4.3 Linky

| Composant | Modification |
|-----------|--------------|
| `api/treasury` | Appel parallèle payments-completeness, mapping `completeness_check` |
| `api/treasury` | Si complétude OK et confirmation présente → A/B/couverture depuis confirmation |
| `TreasuryCardWithPolling` | Badge « Données incomplètes », masquage KPI si complétude KO |

---

## 5. Déploiement

**Date :** 2026-03-03

| Élément | Image / Action |
|---------|----------------|
| **Vault** | `dorevia/vault:carte-paiements-test` |
| **Odoo** | Redémarrage (code monté, `payments_posted_*` actifs) |
| **Linky** | `dorevia/linky:carte-paiements-test` |
| **Tenants** | laplatine2026 (lab) |

---

## 6. Tests réalisés

| Test | Résultat |
|------|----------|
| Vault `/ui/aggregations/payments-completeness` | ✅ Structure OK, messages distincts |
| Odoo `payments_posted_count` / `payments_posted_sum_amount_signed` | ✅ 416, 49 540,61 € (janv.–janv. 2026) |
| Linky `completeness_check` | ✅ Présent dans `/api/treasury` |
| Badge « Données incomplètes » | ✅ Affiché en cas d’écart Odoo vs Vault |

**Script de tests :** `./scripts/test_carte_paiements.sh`

---

## 7. Points d'attention

### 7.1 Complétude actuelle (laplatine2026)

Un écart est actuellement observé entre Odoo (416 paiements) et le Vault sur la période testée → badge « Données incomplètes » affiché. Les causes possibles :

- Délai d’ingestion des paiements (CRON)
- Filtre de période différent (Odoo vs Vault)
- Paiements anciens non vaultés

**Action recommandée :** auditer les paiements non vaultés et exécuter un backfill si besoin.

### 7.2 Données A/B (confirmation)

Les indicateurs À traiter / Traité proviennent de `financial_recon_deltas`, alimentée par les événements de rapprochement Odoo.

**Prérequis :** Odoo envoie `impacted_documents` dans les événements `bank.move.reconciled`. Si des rapprochements existent sans événements envoyés, exécuter le backfill `backfill_reconciliation_confirmation_events` dans Odoo.

### 7.3 Période

Le contrôle de complétude et les agrégats sont calculés **par période** (date_from, date_to). Un filtre de période incohérent entre Odoo et Vault peut provoquer un faux blocage.

---

## 8. Definition of Done — statut

| Critère | Statut | Commentaire |
|---------|--------|-------------|
| Contrôle de complétude | ✅ | Tolérance 0,01 €, messages distincts |
| Badge « Données incomplètes » | ✅ | Affiché si écart ou Odoo inaccessible |
| A, B, Couverture (Option A) | ✅ | Depuis confirmation si complétude OK |
| Périmètre account.payment | ✅ | pos.payment exclu (P0) |
| Tests unitaires Vault | ✅ | 3 tests passés |
| Tests d’intégration | ✅ | Chaîne Odoo → Vault → Linky validée |
| Étape 2 (runbook ingestion) | ⏳ | À réaliser |
| Étape 4 (spécification Option B) | ⏳ | À planifier |

---

## 9. Documents de référence

| Document | Rôle |
|----------|------|
| `SPEC_CARTE_PAIEMENTS_v1.0.md` | Spécification fonctionnelle |
| `PLAN_IMPLEMENTATION_CARTE_PAIEMENTS_v1.0.md` | Plan d’implémentation v1.1 |
| `RAPPORT_TESTS_CARTE_PAIEMENTS_2026-03-03.md` | Rapport des tests |
| `scripts/test_carte_paiements.sh` | Script de tests manuels |

---

## 10. Synthèse

La **Carte Paiements** est opérationnelle. Elle affiche le contrôle de complétude (badge « Données incomplètes » en cas d’écart) et les indicateurs À traiter / Traité / Couverture probante lorsque les données sont alignées. L’architecture respecte l’invariant « Toute donnée affichée dans Linky vient du Vault ». Les prochaines actions portent sur l’audit de l’ingestion des paiements (runbook) et la planification de l’Option B (flux `payment.reconciled`).

---

**Fin du rapport MOA**
