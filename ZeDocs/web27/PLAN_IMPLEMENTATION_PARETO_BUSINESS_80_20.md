# Plan d'implémentation — Pareto 80/20 sur la card Business

**Date :** 2026-02-22  
**Contexte :** Identifier les ~20 % de clients qui représentent ~80 % du CA  
**Référence :** Card Business, SPEC Linky dashboard-metrics

---

## 1. Vue d’ensemble

| Phase | Objectif | Livrables |
|-------|----------|-----------|
| **1** | Persister `partner_name` à l’ingestion | DVIG + Vault |
| **2** | Agrégation ventes par partenaire | Route Vault |
| **3** | Affichage Pareto sur la card | Linky UI |

---

## 2. Phase 1 — Persister partner_name à l’ingestion

### 2.1 Constat actuel

- La colonne `documents.partner_name` existe (migration 032) mais est vide.
- Les factures (`out_invoice`) ont `source='odoo'` mais `partner_name` NULL.
- Odoo envoie `partner_name` dans `data.partner_name` (connecteur `account_move._build_dvig_payload`).
- DVIG route `invoice.posted` vers `POST /api/v1/events` avec `format_vault_payload_events` → payload sans `meta.partner_name`.
- Le format `format_vault_payload_invoices` existe mais n’est pas utilisé.

### 2.2 Option A — Routage vers /api/v1/invoices (recommandé)

**Fichier :** `sources/dvig/workers/outbox_worker.py`

```python
# Dans _resolve_vault_endpoint()
if event_type == 'invoice.posted':
    url = f"{vault_base}/api/v1/invoices"
    payload = format_vault_payload_invoices(event)  # meta.partner_name déjà inclus
    extra_headers = {"X-Tenant": event.tenant}
    return url, payload, extra_headers
```

- `format_vault_payload_invoices` met déjà `meta["partner_name"] = data.get('partner_name', '')`.
- Le handler `InvoicesHandler` (`sources/vault/internal/handlers/invoices.go` L249–252) remplit `doc.PartnerName` depuis `payload.Meta["partner_name"]`.

### 2.3 Option B — Conserver /api/v1/events et enrichir le handler

Si le flux reste sur `/api/v1/events` :

1. Trouver le handler qui crée les documents à partir des events.
2. Extraire `partner_name` depuis `payload.data` ou `payload.payload` et le passer à `documents.partner_name`.

### 2.4 Backfill des documents existants

**Script SQL :**

```sql
-- Mise à jour depuis payload_json pour les factures (odoo ou economic_events)
UPDATE documents d
SET partner_name = COALESCE(
  d.partner_name,
  (SELECT payload_json->'data'->>'partner_name' FROM documents d2 WHERE d2.id = d.id),
  (SELECT payload_json->'meta'->>'partner_name' FROM documents d2 WHERE d2.id = d.id)
)
WHERE d.odoo_model = 'account.move'
  AND d.move_type = 'out_invoice'
  AND (d.partner_name IS NULL OR d.partner_name = '');
```

**Script optionnel (Go) :** migration ou script dans `scripts/` pour faire un backfill depuis `economic_events.payload_json` ou d’autres sources si besoin.

---

## 3. Phase 2 — Route /ui/aggregations/sales-by-partner

### 3.1 Spécification

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `tenant` | string | oui | Tenant |
| `date_debut` | string | oui | YYYY-MM-DD |
| `date_fin` | string | oui | YYYY-MM-DD |
| `company_id` | string | non | Filtre société |
| `limit` | int | non | Nombre de partenaires (défaut 50) |

### 3.2 Réponse

```json
{
  "total_ht": 125000.50,
  "partners_count": 24,
  "items": [
    {
      "partner_name": "Client A",
      "total_ht": 45000.00,
      "invoices_count": 12,
      "pct_of_total": 36.0,
      "cumulative_pct": 36.0
    },
    ...
  ],
  "pareto_80_cutoff": 5,
  "pareto_80_partners": ["Client A", "Client B", ...]
}
```

### 3.3 Implémentation

**Fichiers à créer/modifier :**

1. `sources/vault/internal/models/aggregations.go` — ajouter `SalesByPartnerResponse`, `SalesByPartnerItem`.
2. `sources/vault/internal/storage/aggregations_sales_by_partner.go` — requête SQL :

   ```sql
   SELECT COALESCE(partner_name, '(sans client)') AS partner_name,
          SUM(total_ht) AS total_ht, COUNT(*) AS invoices_count
   FROM (SELECT odoo_id, total_ht, partner_name, 
                ROW_NUMBER() OVER (PARTITION BY odoo_id ORDER BY created_at DESC) AS rn
         FROM documents
         WHERE tenant = $1 AND odoo_model = 'account.move' AND move_type = 'out_invoice'
           AND invoice_date >= $2 AND invoice_date <= $3 ...)
   WHERE rn = 1
   GROUP BY partner_name
   ORDER BY total_ht DESC
   LIMIT $n
   ```

3. `sources/vault/internal/handlers/aggregations_sales_by_partner.go` — handler GET.
4. `sources/vault/internal/server/replay.go` — enregistrer la route.

### 3.4 Calcul Pareto

- Trier les partenaires par `total_ht` décroissant.
- Calculer le cumul en %.
- Identifier le premier partenaire pour lequel `cumulative_pct >= 80`.
- Retourner `pareto_80_cutoff` (nombre de partenaires) et `pareto_80_partners` (liste des noms).

---

## 4. Phase 3 — Enrichissement de la card Business (Linky)

### 4.1 Modifications

1. **`units/dorevia-linky/app/api/dashboard-metrics/route.ts`**
   - Appeler `GET /ui/aggregations/sales-by-partner` en parallèle des autres agrégations.
   - Inclure `sales_by_partner` dans `_details.business`.

2. **`units/dorevia-linky/components/BusinessCard.tsx`**
   - Afficher une section repliable : « Top clients (Pareto 80/20) ».
   - Tableau : partenaire | CA HT | % du total | cumul %.
   - Indicateur visuel (badge, couleur) pour les partenaires dans le top 80 %.

3. **`units/dorevia-linky/components/BusinessChart.tsx`** (optionnel)
   - Graphique en barres horizontales des 10 premiers clients.
   - Ou courbe de Lorenz (cumul des ventes vs cumul des clients).

### 4.2 Structure des props

```ts
// Dans _details.business
sales_by_partner?: {
  total_ht: number;
  partners_count: number;
  items: Array<{
    partner_name: string;
    total_ht: number;
    invoices_count: number;
    pct_of_total: number;
    cumulative_pct: number;
  }>;
  pareto_80_cutoff: number;
  pareto_80_partners: string[];
};
```

---

## 5. Ordre d’exécution recommandé

1. Phase 1 : routage DVIG + backfill (ou correction du flux events si différent).
2. Phase 2 : storage + handler + route Vault.
3. Phase 3 : dashboard-metrics + composants Business.

---

## 6. Vérifications

| Point | Contrôle |
|-------|----------|
| partner_name persisté | `SELECT COUNT(*) FROM documents WHERE partner_name IS NOT NULL AND odoo_model='account.move'` > 0 |
| Route sales-by-partner | `curl "…/ui/aggregations/sales-by-partner?tenant=X&date_debut=..."` → JSON valide |
| Pareto cohérent | Somme des `total_ht` des `pareto_80_partners` ≈ 80 % du `total_ht` |

---

## 7. Annexes

### 7.1 Sources de partner_name

- **Odoo** : `account_move._build_dvig_payload` → `data.partner_name`.
- **DVIG format invoices** : `meta.partner_name`.
- **Vault InvoicesHandler** : `payload.Meta["partner_name"]` ou Factur-X `BuyerName`.

### 7.2 Index recommandé

```sql
CREATE INDEX IF NOT EXISTS idx_documents_partner_name_sales 
ON documents(tenant, partner_name) 
WHERE odoo_model = 'account.move' AND move_type = 'out_invoice';
```

(À adapter si la requête finale utilise d’autres colonnes.)
