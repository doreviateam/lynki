# Vérification : toutes les données Odoo sont-elles bien vaultées ?

**Objectif** : contrôler que les paiements (et si besoin les factures) présents dans Odoo ont bien été envoyés au Vault (chaîne Odoo → DVIG → Vault), afin que Linky affiche la même vérité que l’ERP.

**Périmètre** : tenant o19, paiements `account.payment` (encaissements / décaissements). Même logique adaptable pour les factures `account.move` si besoin.

---

## 1. Contrôle via l’API Vault (payments-completeness)

Le Vault expose un endpoint de **contrôle de complétude** qui compare ce qu’Odoo déclare (nombre + somme des paiements postés) et ce que le Vault a reçu.

### 1.1 Appel API

Depuis une machine ayant accès au Vault (même réseau Docker ou URL publique) :

```bash
# Remplacer VAULT_BASE par l’URL du Vault (ex. http://vault-core-stinger:8080 ou https://vault.xxx.doreviateam.com)
# Période : adapter date_from et date_to (ex. exercice en cours)

curl -s "${VAULT_BASE}/ui/aggregations/payments-completeness?tenant=o19&date_from=2026-01-01&date_to=2030-12-31&list_missing=1" | jq .
```

Avec **liste des IDs manquants** (paiements présents dans Odoo mais pas dans le Vault) :

```bash
curl -s "${VAULT_BASE}/ui/aggregations/payments-completeness?tenant=o19&date_from=2026-01-01&date_to=2030-12-31&company_id=odoo:1&list_missing=1" | jq .
```

### 1.2 Interprétation de la réponse

| Champ | Signification |
|-------|----------------|
| `ok` | `true` = contrôle OK (Vault aligné avec Odoo) ou données ERP utilisées ; `false` = Odoo inaccessible ou erreur. |
| `erp_count` | Nombre de paiements postés dans Odoo sur la période (source : endpoint Odoo `linky_bank_reconciliation`). |
| `payments_count` | Nombre de paiements enregistrés dans le Vault sur la période. |
| `erp_sum_amount_signed` | Somme signée (encaissements +, décaissements −) côté Odoo. |
| `payments_sum_amount_signed` | Somme signée côté Vault. |
| `missing_odoo_ids` | Liste des IDs Odoo (`account.payment.id`) présents dans l’ERP mais **pas** dans le Vault (présent si `list_missing=1`). |

**Données bien vaultées** si :

- `ok === true`
- `erp_count === payments_count`
- `|erp_sum_amount_signed - payments_sum_amount_signed| <= 0.01`
- `missing_odoo_ids` absent ou vide

Si `missing_odoo_ids` n’est pas vide : les paiements listés sont dans Odoo mais pas encore dans le Vault → vérifier la chaîne Odoo → DVIG → Vault (voir §3).

---

## 2. Contrôle dans Odoo (statut de vaultage)

Pour voir **côté Odoo** combien de paiements sont en attente, en erreur ou déjà vaultés.

### 2.1 Shell Odoo (compte par statut)

```bash
# Depuis la racine du projet, répertoire du compose Odoo o19 lab
cd /opt/dorevia-plateform/tenants/o19/apps/odoo/lab
docker compose -p dorevia_odoo_lab_o19 exec odoo odoo shell -d odoo_lab_o19 -c /etc/odoo/odoo.conf --no-http
```

En Python (dans le shell) :

```python
Payment = env['account.payment'].sudo()
# Paiements éligibles (postés) sur une période
domain = [
    ('state', 'in', ('posted', 'paid', 'in_process', 'sent', 'reconciled')),
    ('date', '>=', '2026-01-01'),
    ('date', '<=', '2030-12-31'),
]
payments = Payment.search(domain)

# Comptage par statut vault
from collections import Counter
statuses = Counter(payments.mapped('dorevia_vault_status'))
print('Par statut:', dict(statuses))
# Attendu si tout est vaulté : vaulted = total, ou todo/pending_proof/failed_soft à traiter

# Détail des non vaultés (todo, pending_proof, failed_soft)
non_vaulted = payments.filtered(lambda p: p.dorevia_vault_status != 'vaulted' and p.dorevia_vault_status)
print('Non vaulted (IDs):', non_vaulted.ids)
```

### 2.2 Backfill des paiements non encore marqués pour envoi

Si des paiements postés n’ont jamais été marqués pour le Vault (pas de `dorevia_vault_idempotency_key`, statut vide ou `todo`) :

```python
# Toujours dans le shell Odoo
count = env['account.payment'].backfill_vault_todo()  # tous types
# ou
count_in = env['account.payment'].backfill_vault_todo(payment_type='inbound')
count_out = env['account.payment'].backfill_vault_todo(payment_type='outbound')
print('Initialisés pour envoi:', count)
```

Ensuite : attendre l’exécution du cron « Vault Send Payments » (toutes les 2 min) et/ou que le worker DVIG outbox envoie les événements au Vault, puis relancer le contrôle §1.

---

## 3. Si des données ne sont pas vaultées : points à vérifier

| Point | Où vérifier | Action |
|-------|-------------|--------|
| **Tenant cohérent** | Token DVIG utilisé par Odoo = tenant **o19**. Linky et Vault interrogés avec `tenant=o19`. | Config Odoo : `dorevia.vault.tenant` ou tenant du token = **o19**. |
| **DVIG configuré** | Odoo : Paramètres système `dorevia.dvig.url`, `dorevia.dvig.token`, `dorevia.dvig.source`. | Renseigner les paramètres si vides. |
| **Cron « Vault Send Payments »** | Odoo : Paramètres → Technique → Actions planifiées. | Activer, exécuter manuellement si besoin. |
| **Worker DVIG outbox** | Process/container DVIG qui lit l’outbox et appelle le Vault. | S’assurer qu’il tourne et que les logs ne montrent pas d’échec. |
| **Paiements anciens** | Paiements postés avant activation du connecteur. | Lancer `backfill_vault_todo()` (§2.2). |

---

## 4. Script de vérification rapide

Un script `scripts/verifier_vaultage_o19.sh` (voir ci-dessous) peut centraliser l’appel à `payments-completeness` et afficher un résumé. Exemple d’utilisation :

```bash
export VAULT_URL="http://vault-core-stinger:8080"   # ou l’URL de votre Vault
./scripts/verifier_vaultage_o19.sh
```

---

**Références** : `DOCUMENT_REVUE_CODE_LINKY_VAULT_O19_2026-03.md` (§1.2 Diagnostic), `CONTROLE_ODOO_ENCAISSEMENTS_TRESORERIE.md`, `RUNBOOK_VAULT_RECONCIL_O19.md`.
