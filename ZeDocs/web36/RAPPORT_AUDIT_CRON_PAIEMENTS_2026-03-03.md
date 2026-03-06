# Rapport d'audit — CRON ingestion paiements Vault

**Date :** 2026-03-03  
**Contexte :** Carte Paiements (Étape 2 — Garantir ingestion exhaustive)  
**Référence :** PLAN_IMPLEMENTATION_CARTE_PAIEMENTS_v1.0.md §3

---

## 1. Objectif

Vérifier que les CRON Odoo garantissant l'ingestion exhaustive des paiements `posted` vers le Vault sont actifs et correctement paramétrés.

---

## 2. CRON vérifiés

| CRON | Fichier | Intervalle | Actif | Conforme plan |
|------|---------|------------|-------|---------------|
| **Vault Send Payments** | `ir_cron.xml` (l.66) | 2 min | Oui | Oui (≤ 2 min requis) |
| **Vault Fetch Proof Payments** | `ir_cron.xml` (l.78) | 1 min | Oui | Oui (≤ 1 min requis) |

**Source :** `units/odoo/custom-addons/dorevia_vault_connector/data/ir_cron.xml`

---

## 3. Détails techniques

### 3.1 cron_vault_send_payments

| Attribut | Valeur |
|----------|--------|
| **Modèle** | `account.payment` |
| **Code** | `model.cron_vault_send_payments()` |
| **Intervalle** | 2 minutes |
| **Limit par run** | 50 paiements |
| **États ciblés** | todo, failed_soft (avec next_retry_at ≤ now) |
| **États payment** | posted, paid, in_process, sent, reconciled |

**Comportement :** Envoie vers DVIG `/ingest` les paiements en attente. Déclenche `trigger_worker(limit=50)` après envoi réussi.

### 3.2 cron_vault_fetch_proof_payments

| Attribut | Valeur |
|----------|--------|
| **Modèle** | `account.payment` |
| **Code** | `model.cron_vault_fetch_proof_payments()` |
| **Intervalle** | 1 minute |
| **Limit par run** | 50 paiements |
| **États ciblés** | pending_proof |

**Comportement :** Récupère la preuve Vault pour les paiements déjà envoyés à DVIG mais dont la preuve n'est pas encore appliquée dans Odoo.

---

## 4. Dépendances

| Élément | Vérification |
|---------|--------------|
| **Config DVIG** | `dorevia.dvig.url`, `dorevia.dvig.token` (ir.config_parameter Odoo) |
| **Worker DVIG** | Outbox DVIG doit traiter les événements (ingest → Vault) |
| **Volume tenant** | Scripts backfill dans `/mnt/tenant-scripts` si backfill manuel |

---

## 5. Scripts de backfill

| Script | Rôle |
|--------|------|
| `tenants/laplatine2026/scripts/backfill_all_payments_to_vault.py` | Tous paiements → backfill_vault_todo + 15 rounds cron |
| `tenants/laplatine2026/scripts/backfill_2026_payments_and_send.py` | Paiements 2026 uniquement |
| `tenants/laplatine2026/scripts/resend_missing_payments_to_vault.py` | Ré-envoi paiements listés |

**Référence :** RUNBOOK_BACKFILL_VAULT.md, RUNBOOK_PAIEMENTS_NON_VAULTES.md

---

## 6. Conclusion

| Critère | Statut |
|---------|--------|
| CRON actifs | Conforme |
| Intervalles conformes (≤ 2 min / ≤ 1 min) | Conforme |
| Script backfill documenté | Conforme |
| Runbook Paiements non vaultés | Conforme (RUNBOOK_PAIEMENTS_NON_VAULTES.md) |

**Étape 2.1 — Audit CRON : réalisé.**

---

**Fin du rapport d'audit**
