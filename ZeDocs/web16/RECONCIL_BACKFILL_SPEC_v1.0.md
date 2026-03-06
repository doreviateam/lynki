# SPEC RECONCIL — Backfill initial (projection)

**Version** : 1.0  
**Date** : 25 février 2026  
**Référence** : SPEC RECONCIL v1.1, ZeDocs/web16/RECONCIL.md  

---

## 1. Contexte

Les tables `bank_reconciliation_events` et `bank_reconciliation_projection` sont créées à vide. Les rapprochements déjà effectués dans Odoo n’ont jamais été vaultés. Un **backfill** initialise la projection avec l’état courant d’Odoo pour que la Trésorerie Linky affiche immédiatement des montants cohérents (Trésorerie validée / En attente).

---

## 2. Périmètre V1

| Élément | Décision |
|--------|----------|
| **Source Odoo** | `account.bank.statement.line` (lignes de relevé bancaire) uniquement |
| **Filtre** | `state = 'posted'`, société = tenant (company) |
| **move_id** | `line.id` (ID de la ligne de relevé) |
| **Fallback** | `account.move.line` (journal bancaire) : non supporté en V1 — à traiter ultérieurement si besoin |

---

## 3. Données à extraire (Odoo)

Pour chaque `account.bank.statement.line` :

| Champ Odoo | Mapping payload | Notes |
|------------|-----------------|-------|
| `line.id` | `move_id` | Identifiant unique de la ligne |
| `line.is_reconciled` | `event_type` | `true` → `bank.move.reconciled`, `false` → `bank.move.unreconciled` |
| `line.amount` | `amount` | Montant de la ligne (signé) |
| `line.date` ou `line.statement_id.date` | `occurred_at` | Date ISO 8601 |
| `line.journal_id.company_id.id` | `company_id` | Société |
| `line.journal_id.default_account_id.id` | `account_id` | Compte bancaire (optionnel) |
| Devise (statement ou company) | `currency` | Ex. EUR |

---

## 4. Clé d’idempotence

```
reconcil_backfill:{tenant}:bsl:{line_id}
```

- `tenant` : ex. `sarl-la-platine`
- `bsl` : source = account.bank.statement.line
- `line_id` : `line.id`

Garantit qu’un second lancement du backfill ne duplique pas d’événements (le Vault répond `ignored_idempotent`).

---

## 5. Flux technique

### 5.1 Option A (recommandée) : via DVIG

```
Odoo (script/CRON) → POST DVIG /ingest → outbox → Worker → POST Vault /api/v1/bank-reconciliation/events
```

**Avantages** : même chemin que les événements temps réel, file d’attente et retry DVIG, traçabilité.

**Payload DVIG** :

```json
{
  "event_type": "bank.move.reconciled",
  "source": "odoo.stinger.sarl-la-platine",
  "idempotency_key": "reconcil_backfill:sarl-la-platine:bsl:42",
  "timestamp": "2026-02-25T12:00:00Z",
  "data": {
    "model": "account.bank.statement.line",
    "move_id": 42,
    "move_line_id": 42,
    "amount": 1500.00,
    "currency": "EUR",
    "account_id": 12,
    "company_id": 1,
    "occurred_at": "2026-02-20T00:00:00Z"
  }
}
```

### 5.2 Option B : appel direct Vault

```
Odoo (script) → POST Vault /api/v1/bank-reconciliation/events
```

**Avantages** : pas de dépendance DVIG, plus simple pour un backfill manuel ponctuel.

**Payload** (identique au handler existant) :

```json
{
  "tenant": "sarl-la-platine",
  "event_type": "bank.move.reconciled",
  "move_id": 42,
  "amount": 1500.00,
  "currency": "EUR",
  "occurred_at": "2026-02-20T00:00:00Z",
  "account_id": 12,
  "company_id": 1,
  "idempotency": {
    "event_id": "reconcil_backfill:sarl-la-platine:bsl:42"
  }
}
```

---

## 6. Script Odoo (backfill)

### 6.1 Emplacement

- Module : `dorevia_vault_connector`
- Fichier : `controllers/bank_reconciliation_backfill.py` ou `models/account_bank_statement_line.py` (méthode de service)

### 6.2 Logique

```
1. Récupérer tenant, company (depuis paramètres ou argument)
2. Rechercher : account.bank.statement.line où state='posted', journal.company_id=company
3. Pour chaque ligne :
   a. event_type = 'bank.move.reconciled' si line.is_reconciled else 'bank.move.unreconciled'
   b. idempotency_key = f"reconcil_backfill:{tenant}:bsl:{line.id}"
   c. Construire payload (DVIG ou Vault)
   d. POST (DVIG /ingest OU Vault /api/v1/bank-reconciliation/events)
   e. Optionnel : batch de 50, sleep 0.1s entre batches
4. Logger : nb envoyés, nb erreurs, durée
```

### 6.3 Déclenchement

- **Manuel** : bouton “Lancer backfill rapprochement” dans les paramètres du connecteur, ou script Python externe.
- **CRON (optionnel)** : une fois au premier déploiement, puis désactivé.

### 6.4 Configuration requise

| Paramètre Odoo | Usage |
|----------------|-------|
| `dorevia.tenant` | Ex. `sarl-la-platine` |
| `dorevia.dvig.url` | Pour option A (DVIG) |
| `dorevia.dvig.token` | Pour option A |
| `dorevia.dvig.source` | Ex. `odoo.stinger.sarl-la-platine` |
| `dorevia.vault.url` (à ajouter) | Pour option B (appel direct Vault) |

---

## 7. Validation post-backfill

1. **Vault** :  
   ```sql
   SELECT COUNT(*), SUM(CASE WHEN is_reconciled THEN 1 ELSE 0 END) AS reconciled_count
   FROM bank_reconciliation_projection
   WHERE tenant = 'sarl-la-platine';
   ```

2. **API Treasury** :  
   `GET /ui/aggregations/treasury?tenant=sarl-la-platine`  
   Vérifier que `reconciled_balance` et `unreconciled_balance` sont non nuls (si Odoo a des lignes rapprochées).

3. **Cohérence** : comparer `reconciled_balance` avec le montant rapproché connu dans Odoo (ex. endpoint `linky_bank_reconciliation`).

---

## 8. Gestion d’erreurs

| Situation | Comportement |
|-----------|--------------|
| HTTP 4xx/5xx | Logger l’erreur, continuer avec les lignes suivantes (ou arrêter selon stratégie) |
| Ligne sans `journal_id.default_account_id` | `account_id` = null, envoi quand même |
| Doublon (re-run) | Vault répond `ignored_idempotent` → ignoré, pas d’erreur |
| Aucune ligne | Script termine sans erreur, 0 événement envoyé |

---

## 9. Annexe : modèle account.bank.statement.line (Odoo 18)

Champs utilisés pour le backfill :

- `id`
- `is_reconciled` (bool)
- `amount`
- `date`
- `statement_id` (pour `statement_id.date` si besoin)
- `journal_id` → `company_id`, `default_account_id`

---

## 10. Plan d’implémentation

| Étape | Tâche | Estimé |
|-------|-------|--------|
| 1 | Créer `bank_reconciliation_backfill.py` dans dorevia_vault_connector | 1h |
| 2 | Méthode `_build_backfill_payload(line, tenant)` | 30 min |
| 3 | Boucle + POST DVIG ou Vault (batch 50) | 1h |
| 4 | Bouton manuel ou action serveur “Lancer backfill” | 30 min |
| 5 | Tests manuels sur sarl-la-platine | 1h |
| 6 | Documentation runbook (lancement, vérification) | 30 min |

**Total estimé** : ~4h30

---

## 11. Exécution du backfill (implémenté)

### 11.1 Depuis Odoo

1. **Paramètres** > **Technique** > **Automatisation** > **Actions serveur**
2. Rechercher « Backfill rapprochement bancaire (RECONCIL) »
3. Cliquer sur **Exécuter**

Ou via Python (shell Odoo) :
```python
env['bank.reconciliation.backfill'].run_backfill(company_id=1)
```

### 11.2 Prérequis

- `dorevia.dvig.url` et `dorevia.dvig.token` configurés
- `dorevia.tenant` ou `dorevia.dvig.source` (ex. `odoo.stinger.sarl-la-platine`)
- Tables `bank_reconciliation_*` créées dans le Vault (migration 035)
- Worker DVIG actif pour traiter l'outbox après envoi
