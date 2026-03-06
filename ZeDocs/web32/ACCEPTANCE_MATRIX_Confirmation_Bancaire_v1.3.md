# Matrice d'acceptation — Confirmation Bancaire Stricte v1.3

**Date :** 2026-02-25  
**Référence :** `ZeDocs/web32/SPEC_Confirmation_Bancaire_Stricte_v1.3.md`  
**Objectif :** Valider la cohérence fonctionnelle de la confirmation bancaire (deltas)  
**Format :** Scénarios Given / When / Then

---

## 1️⃣ Scénario — Aucun rapprochement

**Given**
- Document D1
- `amount_signed = +1000`
- Aucun delta dans `financial_recon_deltas`

**When**
- Agrégation Treasury est exécutée

**Then**
- `confirmed_abs(D1) = 0`
- Statut = `none`
- X_abs = 1000
- Y_abs = 0
- Z_abs = 1000
- `confirmation_rate = 0`

---

## 2️⃣ Scénario — Rapprochement complet (full)

**Given**
- Document D1
- `amount_signed = +1000`

**When**
- Événement `bank.move.reconciled`
- `impacted_documents = [{D1, amount_abs=1000}]`
- Delta inséré : +1000

**Then**
- `confirmed_abs(D1) = 1000`
- Statut = `full`
- `confirmation_rate = 1`

---

## 3️⃣ Scénario — Rapprochement partiel

**Given**
- Document D1
- `amount_signed = +1000`

**When**
- Événement `bank.move.reconciled`
- `impacted_documents = [{D1, amount_abs=400}]`
- Delta inséré : +400

**Then**
- `confirmed_abs(D1) = 400`
- Statut = `partial`
- X_abs = 1000
- Y_abs = 400
- Z_abs = 600
- `confirmation_rate = 0.4`

---

## 4️⃣ Scénario — Multi-split (une ligne, plusieurs paiements)

**Given**
- Document D1 : `amount_signed = +300`
- Document D2 : `amount_signed = +200`
- Ligne bancaire = 500

**When**
- Événement `bank.move.reconciled`
- `impacted_documents = [{D1, amount_abs=300}, {D2, amount_abs=200}]`

**Then**
- `confirmed_abs(D1) = 300` (full)
- `confirmed_abs(D2) = 200` (full)
- **Invariant multi-split :** `SUM(deltas sur bank_statement_line) = 500`

---

## 5️⃣ Scénario — Unreconcile total

**Given**
- Document D1
- `amount_signed = +1000`
- Delta existant : +1000

**When**
- Événement `bank.move.unreconciled`
- `impacted_documents = [{D1, amount_abs=1000}]`
- Delta inséré : -1000

**Then**
- `confirmed_abs(D1) = 0`
- Statut = `none`
- `confirmation_rate = 0`

---

## 6️⃣ Scénario — Unreconcile partiel

**Given**
- Document D1
- `amount_signed = +1000`
- Delta existant : +800

**When**
- Événement `bank.move.unreconciled`
- `impacted_documents = [{D1, amount_abs=300}]`
- Delta inséré : -300

**Then**
- `confirmed_abs(D1) = 500`
- Statut = `partial`

---

## 7️⃣ Scénario — Underflow (sécurité clamp)

**Given**
- Document D1
- `amount_signed = +1000`
- Delta existant : +200

**When**
- Événement `bank.move.unreconciled`
- `impacted_documents = [{D1, amount_abs=500}]`
- Delta inséré : -500

**Then**
- `confirmed_abs(D1) = 0` (clamp)
- Log warning : `UNDERFLOW`
- Aucun rejet d'événement

---

## 7️⃣bis — Over-confirmation (clamp supérieur)

**Given**
- Document D1
- `amount_signed = +1000`
- Delta existant : +900

**When**
- Événement `bank.move.reconciled`
- `impacted_documents = [{D1, amount_abs=300}]`
- Delta inséré : +300

**Then**
- `confirmed_abs(D1) = 1000` (clamp max)
- Log warning : `OVER_CONFIRMATION`
- Aucun rejet d'événement

*Si Odoo bug ou si multi-split est mal reconstruit, on ne doit jamais dépasser le montant du document.*

---

## 8️⃣ Scénario — Idempotence double ingestion

**Given**
- Document D1
- `amount_signed = +1000`

**When**
- Événement reconcile envoyé 2 fois
- Même `idempotency_key`

**Then**
- 1 seul delta inséré
- `confirmed_abs(D1) = 1000`
- `COUNT(deltas)` inchangé après 2e appel

---

## 9️⃣ Scénario — Idempotence backfill

**Given**
- 10 lignes rapprochées existantes
- Backfill exécuté

**When**
- Backfill relancé une 2e fois

**Then**
- `COUNT(financial_recon_deltas)` stable
- Aucune duplication

---

## 🔟 Scénario — Document inexistant

**Given**
- `impacted_document` référence un `odoo_id` non vaulté

**When**
- Événement ingestion

**Then**
- Aucun delta inséré
- Log warning : `DOC_NOT_FOUND`
- Pas de crash

---

## 1️⃣1️⃣ Scénario — Cross-currency interdit

**Given**
- Document D1 devise = EUR
- Ligne bancaire devise = USD

**When**
- `impacted_document` contient D1

**Then**
- Delta ignoré
- Log warning : `CROSS_CURRENCY`
- `confirmed_abs(D1)` inchangé

---

## 1️⃣2️⃣ Scénario — amount_signed NULL (doc legacy)

**Given**
- Document D1
- `amount_signed = NULL`

**When**
- Agrégation confirmation exécutée

**Then**
- `confirmed_abs(D1) = 0`
- Log warning : `MISSING_AMOUNT_SIGNED`
- Pas de NaN
- `confirmation_rate` calculé proprement

---

## 1️⃣3️⃣ Scénario — Agrégation multi-documents (vision CFO)

**Given**
- D1 : `amount_signed = +1000`
- D2 : `amount_signed = +500`
- D3 : `amount_signed = +500`
- Deltas :
  - D1 : +1000
  - D2 : +200
  - D3 : aucun

**When**
- Agrégation Treasury exécutée

**Then**
- X_abs = 2000
- Y_abs = 1200
- Z_abs = 800
- full_count = 1
- partial_count = 1
- unconfirmed_count = 1
- `confirmation_rate = 0.6`

*Valide que la logique documentaire tient au niveau CFO.*

---

## ✅ Invariants globaux (à vérifier en Sprint 4)

**Pour tout document :**
```
0 ≤ confirmed_abs ≤ ABS(amount_signed)
```

*Clarification :* `SUM(deltas '+' − '-')` (ledger brut) peut être négatif ou dépasser `amount_signed`, mais `confirmed_abs` est **toujours** clampé à `[0, ABS(amount_signed)]`. Le ledger brut peut donc diverger ; l'exposition CFO ne l'est jamais.

**Pour toute ligne bancaire :**
```
SUM(deltas "+" sur bank_statement_line_id) = montant ligne (abs)
```
(hors exclusions cross-currency)

**Idempotence :**
- Double ingestion → aucune duplication.
