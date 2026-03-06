# Spécification technique — Backfill ventilation Espèces/Banque (paiements historiques)

**Date :** 2026-02-28  
**Version :** 1.0  
**Contexte :** Les paiements vaultés avant le 2026-02-28 n'ont pas de `method` correct (tous en `transfer`). Ce backfill permet de réattribuer la méthode (cash/transfer/check) en s'appuyant sur Odoo.

---

## 1. Objectif

Corriger la ventilation Espèces/Banque dans Linky pour les **paiements historiques** déjà enregistrés dans le Vault, sans modifier les documents existants (immutabilité).

---

## 2. Principe

### 2.1 Contrainte d'immutabilité

Les documents du Vault ne sont **pas modifiés**. On ajoute une **table d'override** contenant les corrections de méthode, lue par l'agrégation en priorité sur le `payload_json`.

### 2.2 Flux

```
1. Table payment_method_overrides(document_id, method)
2. Backfill : pour chaque document payment avec method absent ou 'transfer',
   → interroger Odoo (journal_id.type) → insérer override si cash/check
3. Agrégation : COALESCE(override.method, payload->>'method', 'transfer')
```

### 2.3 Pattern architectural : projection correctrice

Cette approche introduit un **niveau 2** dans l'architecture Vault :

- **Niveau 1** : événements ingérés, documents immuables
- **Niveau 2** : projections correctrices postérieures à l'ingestion

Sans toucher aux events, on permet demain des reclassements similaires pour : catégories analytiques, enrichissements, corrections sémantiques.

---

## 3. Modifications Vault

### 3.1 Migration SQL

**Fichier :** `sources/vault/migrations/038_payment_method_overrides.sql`

```sql
-- Table d'override pour réattribuer la méthode de paiement (backfill historique)
CREATE TABLE IF NOT EXISTS payment_method_overrides (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('cash', 'transfer', 'check', 'card', 'mixed', 'other')),
    -- Conserver la liste complète pour évolution (ex. direct_debit) sans nouvelle migration
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (document_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_method_overrides_document 
  ON payment_method_overrides(document_id);

COMMENT ON TABLE payment_method_overrides IS 
  'Override méthode paiement (backfill). Prioritaire sur payload_json->>method.';
COMMENT ON COLUMN payment_method_overrides.reason IS 
  'Traçabilité : backfill_2026_02_28, manual_correction, etc. Audit fonctionnel.';

-- Index pour le backfill : curseur stable (source, tenant, created_at, id)
-- Garantit une pagination sans sequence scan ; id pour tie-break
CREATE INDEX IF NOT EXISTS idx_documents_payment_tenant_created
  ON documents(source, tenant, created_at, id)
  WHERE source = 'payment';
```

### 3.2 Modifier l'agrégation

**Fichier :** `sources/vault/internal/storage/aggregations_payments.go`

La requête `by_method` doit utiliser l'override quand il existe :

```sql
SELECT LOWER(COALESCE(o.method, NULLIF(TRIM(d.payload_json->>'method'), ''), 'transfer')) AS method,
       COALESCE(SUM((d.payload_json->>'amount')::numeric), 0) AS amount
FROM documents d
LEFT JOIN payment_method_overrides o ON o.document_id = d.id
WHERE [baseWhere sur d]
GROUP BY LOWER(COALESCE(o.method, NULLIF(TRIM(d.payload_json->>'method'), ''), 'transfer'))
```

> **Recommandation :** Dans le backfill, logger le nombre de paiements qui tombent en fallback `transfer` (payload sans method). Un volume élevé (ex. 3000) indiquerait un souci d'ingestion initiale à investiguer.

---

## 4. Endpoint Odoo pour le backfill

> **Note sur la dépendance Odoo :** Le Vault s'appuie ponctuellement sur Odoo pour corriger l'historique. Ce n'est pas une dépendance runtime — uniquement un backfill one-shot. Acceptable dans ce cadre.

### 4.1 Contrat API

**Route :** `GET /dorevia/vault/payment_journal_types`  
**Paramètres :**
- `payment_ids` (obligatoire) — liste d'IDs Odoo séparés par virgule, ex. `1,2,3,45`
- `token` (recommandé en prod) — comparé à `ir.config_parameter` ou env. Rejette si absent/invalide.

**Auth :** `auth="public"` acceptable pour backfill one-shot ; en prod, ajouter un garde-fou minimal (token ou `auth="user"` si session API disponible).

**Réponse :**
```json
{
  "1": "cash",
  "2": "transfer",
  "3": "transfer",
  "45": "check"
}
```

Mapping Odoo → Vault (à documenter pour traçabilité) :

| Odoo | Vault method |
|------|--------------|
| `journal.type == 'cash'` | `cash` |
| `journal.type == 'bank'` + `payment_method.code == 'check'` | `check` |
| `journal.type == 'bank'` + SEPA / virement / CB | `transfer` |
| `journal.type == 'general'` | `transfer` |

> **Note :** Les paiements CB (carte bancaire) passent souvent par un journal `bank` en Odoo → ils sortent en `transfer`. C'est voulu tant qu'il n'y a pas de distinction CB explicite (payment_method dédié).

### 4.2 Implémentation Odoo

**Fichier :** `units/odoo/custom-addons/dorevia_vault_connector/controllers/payment_journal_types.py` (nouveau)

```python
# GET /dorevia/vault/payment_journal_types?payment_ids=1,2,3&token=XXX
# Retourne { "1": "cash", "2": "transfer", ... }
# Garde-fou (optionnel) : vérifier token via ir.config_parameter ou env avant de répondre
@http.route("/dorevia/vault/payment_journal_types", type="http", methods=["GET"], auth="public", csrf=False)
def payment_journal_types(self, payment_ids=None, token=None, **kwargs):
    # if token_required and token != expected: return 403
    if not payment_ids:
        return request.make_response(json.dumps({}), headers=[("Content-Type", "application/json")])
    ids = [int(x.strip()) for x in payment_ids.split(",") if x.strip().isdigit()]
    if not ids:
        return request.make_response(json.dumps({}), headers=[("Content-Type", "application/json")])
    env = request.env(su=True)
    Payment = env["account.payment"]
    payments = Payment.browse(ids).exists()
    result = {}
    for p in payments:
        method = "transfer"
        if p.journal_id and p.journal_id.type == "cash":
            method = "cash"
        elif p.payment_method_id and (p.payment_method_id.code or "").lower() == "check":
            method = "check"
        result[str(p.id)] = method
    return request.make_response(json.dumps(result), headers=[("Content-Type", "application/json")])
```

---

## 5. Script de backfill

### 5.1 Champ pivot : ID paiement Odoo

**Invariant backfill :** `payload_json` DOIT contenir `source_id` (string = ID Odoo account.payment) pour `source='payment'`.

| Champ Vault | Type | Exemple | Rôle |
|-------------|------|---------|------|
| `payload_json->>'source_id'` | string | `"12345"` | ID Odoo `account.payment` — **champ pivot** pour appeler Odoo |

Fallback : `payload_json->'payment'->>'id'` (nested, selon schéma). En pratique le payload stocké a `source_id` à la racine (cf. `payments_service.go`).

### 5.2 Option A — Commande Go intégrée Vault (recommandée)

**Commande :** `vault backfill payment-methods --tenant X --odoo-url Y [--dry-run]`

**Pourquoi Option A :** versionnable, tenant-aware, loggable, intégrable dans `dorevia.sh`, rejouable.

**Algorithme :**
1. **Snapshot borne max** : au démarrage, `SELECT MAX(created_at), MAX(id) FROM documents WHERE ...` — ne traiter que les documents `(created_at, id) <= snapshot` (évite d'inclure des paiements créés pendant le backfill)
2. Lit les documents `source='payment'` du tenant, **LEFT JOIN payment_method_overrides WHERE o.document_id IS NULL** pour ne pas charger les rows déjà override
3. **Skip** : `payload_json->>'method'` déjà = `cash` ou `check` → ne pas appeler Odoo
4. Pour les documents restants : extraire `odoo_payment_id` = `payload_json->>'source_id'` (ou `payment.id`)
5. **Documents sans source_id** : logger dans `documents_without_odoo_payment_id.csv` (doc_id, tenant, created_at) pour correction manuelle éventuelle
6. Par lots de 50, appeler Odoo `GET /dorevia/vault/payment_journal_types?payment_ids=...`
7. Pour chaque paiement dont Odoo retourne `cash` ou `check`, insérer dans `payment_method_overrides` :
   ```sql
   INSERT INTO payment_method_overrides (document_id, method, reason)
   VALUES ($1, $2, 'backfill_2026_02_28')
   ON CONFLICT (document_id) DO UPDATE SET
     method = EXCLUDED.method,
     reason = EXCLUDED.reason
   WHERE payment_method_overrides.method IS DISTINCT FROM EXCLUDED.method;
   ```
   (Évite réécriture inutile si identique)
8. **Logger les fallbacks** : compter les documents qui tombent en `transfer` par défaut (payload sans method) — si volume élevé, indique un souci d'ingestion

### 5.3 Option B — Script Python standalone

**Fichier :** `scripts/backfill_payment_method_from_odoo.py`

Fallback si Option A non disponible. Même logique.

### 5.4 Paramètres requis

| Paramètre    | Description                          |
|--------------|--------------------------------------|
| `VAULT_DB`  | URL connexion PostgreSQL Vault       |
| `ODOO_URL`   | Base URL Odoo (ex. https://odoo.lab.laplatine2026...) |
| `TENANT`     | Tenant ID (ex. laplatine2026)        |
| `DRY_RUN`    | Si true, log uniquement sans insérer |

---

## 6. Ordre d'exécution

1. **Migration 038** — Créer la table `payment_method_overrides`
2. **Modifier aggregations_payments.go** — Joindre la table override
3. **Déployer le connecteur Odoo** — Ajouter la route `payment_journal_types`
4. **Exécuter le backfill** — Script ou commande Vault
5. **Vérifier** — Requêtes SQL de sanity-check (cf. §7.1) + Recharger Linky (Espèces ~110 550 €)

---

## 7. Idempotence, rejouabilité et vérification

### 7.1 Idempotence

- **Skip already correct** : si `payload_json->>'method'` = `cash` ou `check` → ne pas appeler Odoo ni écrire override
- **Skip override exists** : si `payment_method_overrides` contient déjà `document_id` → skip
- **UPSERT** : `ON CONFLICT (document_id) DO UPDATE` — relance possible, correction, audit

### 7.2 Requêtes de contrôle post-backfill

```sql
-- Nombre d'overrides créés par ce backfill
SELECT COUNT(*) AS overrides_count
FROM payment_method_overrides
WHERE reason = 'backfill_2026_02_28';

-- Distribution finale des méthodes (effective method)
SELECT LOWER(COALESCE(o.method, NULLIF(TRIM(d.payload_json->>'method'), ''), 'transfer')) AS effective_method,
       COUNT(*) AS n,
       SUM((d.payload_json->>'amount')::numeric) AS total
FROM documents d
LEFT JOIN payment_method_overrides o ON o.document_id = d.id
WHERE d.source = 'payment' AND d.tenant = :tenant
GROUP BY 1
ORDER BY n DESC;
```

Objectif : vérifier que `cash` et `check` ont bien des lignes après le backfill.

**Comparaison avant/après :** Exécuter la requête de distribution **avant** et **après** le backfill pour mesurer le delta (ex. transfer -X, cash +Y, check +Z).

---

## 8. Estimation

| Tâche                         | Effort      |
|------------------------------|-------------|
| Migration 038                | 0.5 j       |
| Modif aggregations_payments  | 0.5 j       |
| Route Odoo payment_journal_types | 0.5 j  |
| Script backfill (Go ou Python)| 1 j         |
| Tests et déploiement         | 0.5 j       |
| **Total**                    | **~3 j**    |

---

## 9. Roadmap — Limites à anticiper

| Volume | Risque |
|--------|--------|
| ~300 paiements | OK, backfill rapide |
| 50 000+ paiements | Appels Odoo par lot de 50 : charge Odoo, couplage, lenteur |

**Note :** Ce n'est pas un problème actuel. À documenter pour les tenants à fort volume : envisager un **export Odoo → fichier** (CSV/JSON) puis ingestion batch, plutôt que des appels HTTP répétés.

---

## 10. Squelette commande Go (pour implémentation)

```
vault backfill payment-methods \
  --tenant laplatine2026 \
  --odoo-url https://odoo.lab.laplatine2026... \
  [--dry-run] \
  [--batch-size 50] \
  [--limit 0]
```

**Flags :**
- `--tenant` (obligatoire)
- `--odoo-url` (obligatoire)
- `--dry-run` : log uniquement, pas d'INSERT
- `--batch-size` : taille des lots Odoo (défaut 50)
- `--limit` : 0 = tous ; N = limiter à N documents (tests)

**Pagination stable :** `ORDER BY created_at, id` avec **snapshot de borne max au démarrage** — ne traiter que `(created_at, id) <= (max_created_at, max_id)` au T0.

**Logs :** tenant, documents lus, skipped (already correct/override), overrides créés, fallbacks (sans method), erreurs Odoo.

**Output CSV :** `documents_without_odoo_payment_id.csv` — documents sans `source_id` utilisable (pour correction manuelle).

---

## 11. Références

- Plan d'implémentation : `ZeDocs/web34/PLAN_IMPLEMENTATION_BACKFILL_ESPECES_BANQUE_2026-02-28.md`
- Implémentation actuelle : `ZeDocs/web34/IMPLEMENTATION_VAULT_ESPECES_BANQUE_2026-02-28.md`
- Rapport MOA : `ZeDocs/web34/RAPPORT_MOA_VAULT_ESPECES_VIREMENTS_2026-02-28.md`
