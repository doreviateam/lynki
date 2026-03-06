# Vérification Vault — Date + montant par scope (agrégations Dorevia-UI)

**Contexte** : SPEC_DOREVIA_UI_AGGREGATIONS_v1.0 — valider que chaque scope expose bien **date** et **montant** pour les agrégations.  
**Méthode** : lecture du code et du schéma Vault (table `documents`, handlers, services).  
**Périmètre** : POS reporté à plus tard ; focus v1 sur factures et paiements.

---

## 1. Où sont stockés les événements ?

Tous les types (factures, paiements, tickets POS) sont stockés dans la **même table `documents`** (sources Vault : `internal/storage`, `internal/models/document.go`). Le type est distingué par :

- **`source`** : ex. `sales`, `purchase`, `pos`, **`payment`**
- **`odoo_model`** : ex. `account.move`, **`account.payment`**, `pos.order`

---

## 2. Factures (invoice.posted) — ventes / achats

| Élément | Dans Vault |
|--------|------------|
| **Date** | Colonne **`invoice_date`** (DATE) — remplie par `handlers/events.go` depuis `payload.invoice_date` ou `payload.date` |
| **Montant** | Colonnes **`total_ht`**, **`total_ttc`** (DECIMAL) — remplies depuis `payload.amount_untaxed` et `payload.amount_total` |
| **Filtre type** | `odoo_model = 'account.move'` (+ `move_type` pour ventes vs achats) |

**Verdict** : ✅ **Date et montant sont en colonnes dédiées.** Une agrégation SQL (ou une API Dorevia-UI) peut utiliser `invoice_date` et `total_ttc` (ou `total_ht`) directement, avec filtres `date_debut` / `date_fin` et `time_bucket` sur `invoice_date`.

**Accès possible** :  
- En **SQL** (accès direct à la base Vault) : `SELECT invoice_date, total_ttc FROM documents WHERE odoo_model = 'account.move' AND invoice_date BETWEEN ...`  
- En **API** : l’endpoint actuel `ListDocuments` ne renvoie pas `invoice_date` ni `total_ttc` dans la liste ; il faudrait soit un nouvel endpoint d’agrégation (recommandé pour Dorevia-UI), soit étendre la liste pour inclure ces champs (et filtrer par `invoice_date`).

---

## 3. Paiements (payment.posted)

| Élément | Dans Vault |
|--------|------------|
| **Date** | **Uniquement dans `payload_json`** : champ `payment_date` (RFC3339) — pas de colonne dédiée |
| **Montant** | **Uniquement dans `payload_json`** : champ `amount` — pas de colonne dédiée |
| **Identification** | `source = 'payment'`, `odoo_model = 'account.payment'` |

**Verdict** : ⚠️ **Date et montant ne sont pas en colonnes.** Ils sont dans le JSON stocké en `payload_json`. Pour agréger sans toucher au schéma, il faut soit :

- une **vue SQL** ou une requête qui fait `payload_json->>'payment_date'` et `(payload_json->>'amount')::numeric`,  
- soit une **API d’agrégation** côté Vault (ou Dorevia-UI) qui lit `payload_json` et agrège en mémoire ou via une vue.

**Accès possible** :  
- En **SQL** :  
  `SELECT (payload_json->>'payment_date')::date AS event_date, (payload_json->>'amount')::numeric AS amount FROM documents WHERE source = 'payment' AND ...`  
- En **API** : pas d’endpoint d’agrégation aujourd’hui ; à ajouter ou à fournir par une couche “Dorevia-UI API” qui interroge la base (read-only).

---

## 4. POS (ticket.closed) — reporté à plus tard

**Périmètre** : le POS n’est pas dans le scope v1 ; on verra le POS après.

| Élément | Dans Vault |
|--------|------------|
| **Date** | **`created_at`** (timestamp d’ingestion) disponible ; date du ticket éventuellement dans **`payload_json`** (à confirmer selon le format d’envoi) |
| **Montant** | **Dans `payload_json`** : typiquement `total_incl_tax` / `total_excl_tax` ou noms proches (voir `pos_tickets_types.go` : `TotalInclTax`, `TotalExclTax`) — pas de colonnes dédiées |
| **Identification** | `source = 'pos'`, `odoo_model = 'pos.order'` (ou équivalent) |

**Verdict** : ⚠️ **Montant (et éventuellement date métier) dans `payload_json`.** Pour une agrégation “par date de ticket”, il faudra une date explicite dans le payload ou utiliser `created_at`. Le montant s’obtient en extrayant du JSON. À détailler quand le scope POS sera à l’ordre du jour.

---

## 5. Synthèse pour “vérifier en accédant au Vault”

| Scope | Date | Montant | Vérifiable comment ? |
|-------|------|---------|----------------------|
| **Factures (invoice.posted)** | ✅ Colonne `invoice_date` | ✅ Colonnes `total_ht` / `total_ttc` | Requête SQL sur `documents` ou future API list/aggregation avec ces champs |
| **Paiements (payment.posted)** | ⚠️ Dans `payload_json` (`payment_date`) | ⚠️ Dans `payload_json` (`amount`) | SQL avec `payload_json->>'...'` ou API qui lit le JSON |
| **POS (ticket.closed)** | ⚠️ `created_at` ou dans `payload_json` | ⚠️ Dans `payload_json` (total_incl_tax / total_excl_tax) | Idem |

**Réponse directe** :  
- **Oui**, on peut vérifier en “accédant au Vault” :  
  - soit par **accès direct à la base** (requêtes SQL ci-dessus),  
  - soit en s’appuyant sur le **code** (modèles, handlers, services) comme fait dans cette note.  
- Pour les **factures**, date + montant sont **déjà exposables** via des colonnes.  
- Pour **paiements** et **POS**, date et montant sont **présents mais dans `payload_json`** ; l’agrégation nécessite extraction JSON (vue SQL ou API dédiée).

---

## 6. Recommandations pour l’API Dorevia-UI (read-only)

1. **Factures** : exposer un endpoint d’agrégation (ou une liste enrichie) qui filtre sur `invoice_date` et somme `total_ttc` (ou `total_ht`), sans accès direct à la DB depuis Appsmith.  
2. **Paiements** : soit une **vue SQL** dans Vault qui expose `(payload_json->>'payment_date')::date` et `(payload_json->>'amount')::numeric`, soit un endpoint d’agrégation qui lit `documents` et agrège côté serveur.  
3. **POS** : à traiter plus tard (hors périmètre v1). Même logique (vue ou endpoint) quand ce sera à l’ordre du jour.  
4. **Tenant** : toutes les requêtes doivent filtrer par `tenant` (déjà présent dans `documents`).

Ainsi, on valide bien “par scope” que le Vault **contient** date et montant, et on précise comment y accéder (SQL ou API) pour les agrégations Dorevia-UI.
