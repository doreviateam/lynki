# Diagnostic Linky laplatine2026 — 2026-03-03

**Objet :** Investiguer les symptômes affichés sur https://ui.lab.laplatine2026.doreviateam.com/

---

## 1. Résumé exécutif

| Symptôme | Cause identifiée |
|----------|------------------|
| **Vault ✖** | vault_rate = null (DVIG stub ou proxy) |
| **0 / — preuves scellées** | Base Vault dorevia_vault **invalide** → agrégations échouent |
| **Solde comptable : non configuré** | Treasury retourne stub car GetBankReconciliationProjectionSums échoue (DB invalide) |
| **Toutes sources false** | completeness-snapshot échoue (DB invalide) |

**Cause racine :** La base PostgreSQL `dorevia_vault` du conteneur `vault-db-core-stinger` est marquée « invalid » par PostgreSQL. Aucune requête sur cette base ne peut aboutir.

---

## 2. Détail des tests

### 2.1 Vault vault-health (200 OK)
- Route accessible (proxie vers DVIG ou stub)
- vault_rate: null → footer affiche Vault ✖
- Pas d'erreur HTTP

### 2.2 Odoo bank-reconciliation (200 OK)
- Odoo répond correctement (erp_balance: -21500, accounting_balance: 21500, etc.)
- ODOO_BANK_RECONCILIATION_URL_LAPLATINE2026 configuré dans le Vault
- Le problème ne vient pas d'Odoo

### 2.3 Vault completeness-snapshot (échec)
- Toutes les sources à false → requêtes agrégation échouent
- Cohérent avec base inaccessible

### 2.4 Vault treasury (stub erp_balance: null)
- treasuryFromProjectionAndOdoo retourne nil car GetBankReconciliationProjectionSums échoue
- Fallback buildTreasuryStub() → erp_balance: null → « Solde comptable : non configuré »

### 2.5 Base Vault (invalid)
```
psql -U vault -d dorevia_vault -c "SELECT 1;"
FATAL: cannot connect to invalid database "dorevia_vault"
HINT: Use DROP DATABASE to drop invalid databases.
```

---

## 3. Actions recommandées

### 3.1 Réparer la base Vault (P0)

1. Arrêter le Vault : `docker stop vault-core-stinger`
2. Supprimer la base invalide : `docker exec vault-db-core-stinger psql -U vault -d postgres -c "DROP DATABASE dorevia_vault;"`
3. Recréer : `docker exec vault-db-core-stinger psql -U vault -d postgres -c "CREATE DATABASE dorevia_vault OWNER vault;"`
4. Appliquer les migrations Vault (sources/vault/migrations/)
5. Redémarrer le Vault
6. (Optionnel) Backfill Odoo → Vault pour laplatine2026

### 3.2 Vault health (P1)
- Vérifier DVIG /internal/vault-health renvoie vault_rate
- Ou adapter Linky si vault_rate null mais Vault 200 OK

### 3.3 Expected counts (P2)
- Une fois base saine : CRON Odoo push_expected_counts pour laplatine2026

---

---

## 4. Réparation effectuée (2026-03-03)

| Étape | Statut |
|-------|--------|
| Arrêt Vault | OK |
| DROP DATABASE dorevia_vault | OK |
| CREATE DATABASE dorevia_vault | OK |
| Redémarrage Vault (migrations auto) | OK — 40 migrations appliquées |
| Treasury erp_balance | OK — -21500 € (Odoo) |
| Connexion DB | OK |

**Résultat :** Solde comptable doit maintenant s'afficher. Les données laplatine2026 (documents, projections) sont vides — backfill Odoo → Vault à lancer si nécessaire pour preuves scellées.

---

## 5. Backfill Odoo → Vault (2026-03-03)

| Étape | Statut |
|-------|--------|
| Réinit events outbox en accepted | OK |
| Traitement outbox DVIG (2040 forwarded) | OK |
| Documents Vault laplatine2026 | OK |

**État final Vault laplatine2026 :**

| Source  | move_type  | Count |
|---------|------------|-------|
| payment | —          | 671   |
| purchase | in_invoice | 302  |
| purchase | in_refund  | 10   |
| sales   | out_invoice | 334  |

**Outbox DVIG :** 2040 forwarded, 2 failed_hard, 0 accepted.

---

## 6. Résolution failed_hard (2026-03-03)

Les 2 événements `bank.move.reconciled` (account.bank.statement.line, move_id 5 et 6) échouaient avec 404 sur `/api/v1/bank-reconciliation/events` — probablement incident transitoire (base Vault invalide).

**Procédure :**

1. A) Vérification : `SELECT id, event_type, model, move_id FROM outbox_events WHERE id IN (2039, 2041)`
2. B) Reset : `UPDATE outbox_events SET status='accepted', attempt_count=0, last_error=NULL WHERE id IN (2039, 2041)`
3. C) Retraitement via worker : erreur "client has been closed" (httpx) — contournement
4. D) Envoi manuel au Vault (POST bank-reconciliation/events) + marquage `forwarded`

**État final outbox :** 2042 forwarded, 0 failed_hard.

---

## 7. Backfill Cash (ventilation espèces)

Les paiements étaient tous en `method=transfer` dans le payload (Odoo n'envoie pas le method au moment du backfill initial). La table `payment_method_overrides` permet de corriger rétroactivement.

**Commande exécutée :**
```bash
docker exec vault-core-stinger ./vault backfill payment-methods \
  --tenant laplatine2026 --odoo-url http://odoo_lab_laplatine2026:8069
```

**Résultat :** 255 overrides cash créés.

| Méthode effective | N paiements | Total (€) |
|-------------------|-------------|-----------|
| cash              | 255         | 166 343,23 |
| transfer          | 416         | 227 590,79 |

La tuile Cash dans Linky affiche désormais le net espèces (encaissements - décaissements cash).

---

*Diagnostic 2026-03-03 — Base Vault invalid = blocage principal. Réparation réalisée. Backfills complétés (documents + cash). failed_hard résolus (2042 forwarded).*
