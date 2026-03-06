# Rapport d'analyse d'expert — SPEC Reste à rapprocher

**Document analysé** : `ZeDocs/web38/SPEC_RESTE_A_RAPPROCHER.md`  
**Date** : 2026-02-28  
**Mise à jour** : 2026-03-03 — Décisions validées intégrées  
**Contexte** : Linky laplatine2026, post-backfill Odoo → Vault (paiements, ventes, achats)

---

## 1. Synthèse exécutive

La spec « Reste à rapprocher » est **globalement alignée** avec l’existant. L’analyse identifie :

- **Réutilisation possible** : la table `financial_recon_deltas` couvre déjà le besoin de projection payment ↔ ligne de relevé ; une nouvelle table `payment_reconciliation_projection` n’est pas nécessaire.
- **Amendements techniques** : corrections de champs (`payment_date` vs `date`, absence de `state` dans le payload).
- **Point bloquant** : `financial_recon_deltas` est vide pour laplatine2026 car les confirmations ont été traitées avant le backfill des paiements ; un backfill de confirmation est requis.
- **Décisions** : extension dashboard-metrics, Ratio C en annexe, runbook créé.

---

## 2. Comparaison spec ↔ existant

### 2.1 Tables et modèles

| Spec §5 | Existant | Verdict |
|---------|----------|---------|
| `payment_reconciliation_projection` (payment_document_id, statement_line_odoo_id, reconciled_at) | `financial_recon_deltas` (document_id, bank_statement_line_id, occurred_at, direction) | **Équivalent fonctionnel** — `financial_recon_deltas` matérialise le lien payment ↔ ligne de relevé. |

**Amendement 1 (validé)** : Ne pas créer `payment_reconciliation_projection`. Utiliser `financial_recon_deltas` avec la règle **`SUM(direction) > 0`** :

```sql
AND (
  SELECT SUM(CASE WHEN f.direction = '+' THEN 1 ELSE -1 END)
  FROM financial_recon_deltas f
  WHERE f.tenant = d.tenant AND f.document_id = d.id
) > 0
```

Plus robuste que « existence d'un + » : gère le délettrage (+ puis - → 0 → non rapproché).

---

### 2.2 Champs documents (paiements)

| Spec §8.1 | Existant | Verdict |
|-----------|----------|---------|
| `payload_json->>'date'` | `payload_json->>'payment_date'` | **Correction** — utiliser `payment_date`. |
| Filtre `state = 'posted'` | Pas de `state` dans le payload des paiements | **À retirer** — tous les paiements en Vault sont postés (Odoo n’envoie que `payment.posted`). |

**Amendement 2 (validé)** : Remplacer dans la spec :

- `(payload_json->>'date')::date` → `(payload_json->>'payment_date')::timestamptz::date`
- Supprimer la condition `state = 'posted'`.

---

### 2.3 Flux de données

| Spec | Existant | Verdict |
|------|----------|---------|
| Événements `bank.move.reconciled` / `unreconciled` | DVIG → `bank-reconciliation/events` + `confirmation-events` | **Conforme** |
| `impacted_documents` (odoo_model, odoo_id, amount_abs) | Odoo `account_bank_statement_line` → `_traverse_to_impacted_documents()` | **Conforme** |
| Projection payment ↔ ligne | `financial_recon_deltas` alimentée par `confirmation-events` | **Conforme** |

---

### 2.4 État actuel laplatine2026

| Métrique | Valeur | Source |
|----------|--------|--------|
| Paiements (A) | 393 934 € | `documents` source=payment, période |
| Bank moves reconciled (B) | 14 500 € | `bank_reconciliation_projection` |
| Lignes `financial_recon_deltas` | **0** | Table vide |

**Cause** : Les événements `bank.move.reconciled` ont été traités **avant** le backfill des paiements. Lors de la confirmation, `GetDocumentByTenantOdooModelID` ne trouvait pas les documents payment → lignes ignorées, `financial_recon_deltas` reste vide.

**Action requise** : Exécuter le backfill de confirmation bancaire (action serveur Odoo ou CRON `dorevia_vault_connector`) pour ré-émettre `bank.move.reconciled` avec `impacted_documents`. Les paiements étant désormais en Vault, la confirmation peuplera `financial_recon_deltas`.

---

## 3. Amendements proposés

### 3.1 Réutilisation de `financial_recon_deltas`

**Spec §5** — Remplacer la création de `payment_reconciliation_projection` par :

> La projection payment ↔ ligne de relevé est matérialisée par la table existante `financial_recon_deltas`. Un paiement est rapproché si **SUM(direction) > 0** (avec + → 1, - → -1).

### 3.2 Requête SQL (Spec §8.1)

**Avant** (spec actuelle) :
```sql
WHERE ... AND (payload_json->>'date')::date BETWEEN $3 AND $4
  AND (payload_json->>'state') = 'posted'
```

**Après** (amendé) :
```sql
WHERE ... 
  AND (payload_json->>'payment_date')::timestamptz::date BETWEEN $3 AND $4
  -- state non requis : tous les paiements en Vault sont postés
```

### 3.3 Gestion des unreconciled

La spec ne traite pas explicitement les `bank.move.unreconciled`. L’existant insère des lignes `direction = '-'` dans `financial_recon_deltas`. Pour un paiement d’abord rapproché puis délettré :

- Une ligne `+` et une ligne `-` existent.
- La logique « rapproché » doit tenir compte des deux (ex. somme des `direction` ou règle métier).

**Amendement 3 (validé)** : Règle P0 robuste : **SUM(direction) > 0** par (tenant, document_id). Couvre : seul + → rapproché ; + puis - → 0 → non rapproché ; split → > 0 → rapproché.

---

## 4. Décisions validées (MOA)

| Question | Décision |
|----------|----------|
| **Q1. Ratio C** | Intégrer dans cette spec en annexe (P0). Extraction ultérieure si réutilisation ailleurs. |
| **Q2. Exposition API** | Extension `dashboard-metrics` — pas d’endpoint isolé. Le % dépend de la complétude ; le dashboard orchestre déjà. |
| **Q3. Filtres métier** | Période = filtre dashboard existant ; Société = scope actuel ; Devise = EUR only (P0). |
| **Q4. Backfill confirmation** | Runbook dédié : `ZeDocs/RUNBOOK_BACKFILL_CONFIRMATION.md`. |

---

## 5. Plan d’action recommandé

| Priorité | Action | Statut |
|----------|--------|--------|
| P0 | Exécuter le backfill confirmation bancaire pour laplatine2026 | À faire |
| P1 | Appliquer les amendements 1–3 à la spec | ✅ Fait |
| P2 | Implémenter la requête « reste à rapprocher » (Vault) avec `SUM(direction) > 0` | À faire |
| P3 | Étendre `dashboard-metrics` avec `reconciliation_metrics` | À faire |
| P4 | Intégrer l’affichage dans Linky (card / section) | À faire |
| — | Runbook backfill confirmation | ✅ Créé |

---

## 6. Références

- `sources/vault/internal/storage/bank_reconciliation.go` — `bank_reconciliation_projection`, `bank_reconciliation_events`
- `sources/vault/internal/storage/financial_recon_deltas.go` — `InsertFinancialReconDelta`, `GetDocumentByTenantOdooModelID`
- `sources/vault/internal/handlers/bank_reconciliation_confirmation.go` — handler `confirmation-events`
- `sources/vault/migrations/036_financial_recon_deltas_and_amount_signed.sql` — schéma
- `sources/dvig/workers/outbox_worker.py` — `format_vault_payload_bank_reconciliation_confirmation`
- `units/odoo/custom-addons/dorevia_vault_connector/models/account_bank_statement_line.py` — `_traverse_to_impacted_documents`
- `ZeDocs/web37/DIAGNOSTIC_LAPLATINE2026_2026-03-03.md` — diagnostic laplatine2026
- `ZeDocs/RUNBOOK_BACKFILL_CONFIRMATION.md` — runbook backfill confirmation
