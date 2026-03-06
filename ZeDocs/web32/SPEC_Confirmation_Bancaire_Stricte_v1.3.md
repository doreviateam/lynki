# SPEC — Confirmation Bancaire Stricte des Événements Financiers (v1.3)

**Date :** 2026-02-25  
**Statut :** P0 — Implémentable  
**Auteur :** Dorevia — Équipe Architecture & Développement  
**Référence :** Consolidation de v1.2 + amendements actés (RAPPORT_AVIS_EXPERT)

---

## 1. Objectif

Mettre en place dans le Vault un mécanisme strict de confirmation bancaire des événements financiers vaultés, **indépendant d'Odoo après ingestion**, supportant :

- Rapprochements complets et partiels
- Annulations de rapprochement (unreconcile)
- Idempotence forte
- Agrégation fiable pour indicateurs CFO

---

## 2. Architecture à deux axes

| Couche | Table | Rôle |
|--------|-------|------|
| **Axe bancaire** | `bank_reconciliation_projection` | Position nette bancaire — réalité brute des lignes de relevé |
| **Axe événementiel** | `financial_recon_deltas` | Confirmation des événements financiers — engagement validé par la banque |

**Conservation de RECONCIL :** La projection `bank_reconciliation_projection` est **conservée** pour Position, audit, forensic et traçabilité. On retire uniquement le **proxy pour confirmation** (Process).

---

## 3. Définitions

### 3.1 Événement financier

Document Vault représentant un mouvement financier entrant ou sortant.

**Champs requis (documents) — amendement A :**

| Champ | Type | Obligatoire |
|-------|------|-------------|
| id | UUID | Oui |
| tenant | TEXT | Oui |
| source | TEXT | Oui |
| odoo_model | TEXT | Oui |
| odoo_id | INT | Oui |
| **amount_signed** | **NUMERIC(16,2)** | **Oui** (nouvelle colonne) |
| currency | TEXT | Oui |
| occurred_at | TIMESTAMP | Oui |
| company_id | TEXT | Optionnel (multi-société) |

**Convention de signe :** encaissement = +, décaissement = −.

**Backfill amount_signed :** depuis `payload_json->>'amount'` ou `total_ttc` pour les documents existants.

### 3.2 Périmètre X (base des métriques) — amendement C

En V1, les événements financiers éligibles sont :

```sql
documents WHERE odoo_model IN ('account.payment', 'pos.payment')
  AND tenant = :tenant
  AND (company_id = :company_id OR company_id IS NULL)
```

OD manuelles et écritures techniques exclues en V1. Élargissement possible ultérieurement.

---

## 4. Modèle de données

### 4.1 Table : financial_recon_deltas

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| tenant | TEXT | Tenant |
| document_id | UUID | FK documents.id |
| odoo_move_id | INT, nullable | Traçabilité / debug uniquement. **Pas de dépendance logique** — la clé métier est `document_id`. Si ERPNext ou autre source : concept move disparaît. |
| bank_statement_line_id | INT | Ligne bancaire source |
| delta_amount_abs | NUMERIC(16,2) | Montant absolu confirmé |
| direction | CHAR(1) | '+' ou '-' — `CHECK (direction IN ('+','-'))` ou ENUM |
| currency | TEXT | Devise |
| event_uid | TEXT | Clé idempotente (UNIQUE). Si idempotency_key Odoo → string directe. Si hash → hex ou base64 (documenter) |
| occurred_at | TIMESTAMPTZ | Date métier fournie par Odoo |
| ingested_at | TIMESTAMPTZ | Date ingestion Vault — `DEFAULT now()` en SQL. Règle : occurred_at = Odoo, ingested_at = NOW() côté Vault |

**Contraintes :**
- `UNIQUE(tenant, event_uid)`
- `INDEX (tenant, document_id)`
- `INDEX (tenant, odoo_move_id)` — optionnel (debug)

---

## 5. Logique d'ingestion

### 5.1 Événement bank.move.reconciled

**impacted_documents obligatoire** — amendement B. Construit par **Odoo uniquement**.

**Payload requis :**

```json
{
  "event_type": "bank.move.reconciled",
  "tenant": "sarl-la-platine",
  "bank_statement_line_id": 123,
  "impacted_documents": [
    {"odoo_model": "account.payment", "odoo_id": 901, "amount_abs": 700.00},
    {"odoo_model": "account.payment", "odoo_id": 902, "amount_abs": 300.00}
  ],
  "occurred_at": "2026-02-25T14:00:00Z",
  "idempotency_key": "reconcil:sarl-la-platine:bsl:123:reconcile"
}
```

**Traitement :**
1. Résolution `document_id` depuis `odoo_model` + `odoo_id` (documents existants)
2. Si document inexistant ou écriture non vaultée : **ignorer** + log warning (Q3)
3. **Cross-currency :** Si devise delta ≠ devise document → **ignorer** + log warning (voir §13.4)
4. Insertion d’un delta par entrée de `impacted_documents` (direction '+')
5. Idempotence via `event_uid`

### 5.2 Événement bank.move.unreconciled

Même structure, `direction = '-'`. `amount_abs` = montant à retirer.

### 5.3 Formule event_uid — idempotence

```
event_uid = hash(
  tenant + "|" +
  event_type + "|" +
  str(bank_statement_line_id) + "|" +
  "|".join(sorted(f"{d.odoo_model}:{d.odoo_id}:{d.amount_abs}" for d in impacted_documents))
  -- Ne pas inclure occurred_at (risque double delta si timestamp different)
)
```

**Priorité :** `idempotency_key` stable fourni par Odoo (évite tout risque). Voir §13.2.

---

## 6. Calcul confirmation par document

**Formule :**

```
confirmed_abs(document_id) = clamp(
  SUM(delta_amount_abs × CASE direction WHEN '+' THEN 1 ELSE -1 END)
  WHERE document_id = :document_id,
  min = 0,
  max = ABS(d.amount_signed)
)
```

**Statuts :** `full` | `partial` | `none`

**Ordre :** Pas de réordonnancement (Q6). Le modèle delta + clamp est résilient ; SUM des deltas suffit même en ingestion hors ordre.

**Underflow (Q9) :** Si unreconcile > confirmed_abs → clamp à 0 + log warning. Ne jamais rejeter l’événement.

**Règle dégradée :** Si `amount_signed` NULL (document ancien sans backfill) → `confirmed_abs = 0`, log warning `missing_amount_signed` — évite NaN silencieux.

---

## 7. Métriques globales

| Métrique | Formule |
|----------|---------|
| X_abs | SUM(ABS(amount_signed)) sur périmètre §3.2 |
| Y_abs | SUM(confirmed_abs) sur même périmètre |
| Z_abs | X_abs − Y_abs |
| confirmation_rate | CASE WHEN X_abs = 0 THEN 1 ELSE Y_abs / X_abs END |

**Devise :** Tous les calculs se font dans la **devise du document**. Agrégation multi-devise non supportée en V1 (voir §13.4).

---

## 8. API Treasury

Extension JSON de la réponse existante :

```json
{
  "confirmation": {
    "total_amount_abs": 2403503.01,
    "confirmed_amount_abs": 483400.60,
    "unconfirmed_amount_abs": 1920102.41,
    "confirmation_rate": 0.20,
    "full_count": 5,
    "partial_count": 2,
    "unconfirmed_count": 66
  }
}
```

Les compteurs (`full_count`, `partial_count`, `unconfirmed_count`) portent sur les **documents** (événements financiers).

---

## 9. Contrat Odoo v1.2

### 9.1 Règle multi-split — répartition

Un événement = **une bank_statement_line**. Si une ligne est rapprochée avec **plusieurs paiements** :

1. `impacted_documents` contient **une entrée par paiement** impacté.
2. **Source amount_abs (règle V1) :** `amount_abs = ABS(montant sur move_line rapprochée attribuée à ce payment)` — **pas** le montant du payment (dangereux si partiel). Puis regroupement par payment.
3. **Règle de cohérence :** `SUM(amount_abs)` sur impacted_documents = montant total de la ligne rapprochée.

**Exemple :** Ligne 500 € rapprochée avec paiement A (300 €) + paiement B (200 €) :
```json
"impacted_documents": [
  {"odoo_model": "account.payment", "odoo_id": 901, "amount_abs": 300},
  {"odoo_model": "account.payment", "odoo_id": 902, "amount_abs": 200}
]
```

### 9.2 Backfill — snapshot état courant

**Principe :** Backfill = émission d’événements `bank.move.reconciled` correspondant à l’**état courant** des rapprochements. Pas de replay chronologique complet (sauf si historique événementiel disponible).

Pour chaque `account.bank.statement.line` avec `is_reconciled = true` :
- Reconstituer `impacted_documents` depuis `reconciled_move_line_ids` → move → payment.
- Répartir les montants (voir §9.1).
- Fournir `idempotency_key` stable (ex. `reconcil:tenant:bsl:{line_id}:reconcile`) — voir §5.3, §13.2.
- **Devise :** Ne pas rapprocher cross-currency. Si ligne bancaire en EUR et paiement en USD → exclure du backfill (voir §13.4).
- Émettre un événement au format v1.2.

---

## 10. Cas à tester

- Partiel (reconcile partiel d’un paiement)
- Full (reconcile complet)
- Unreconcile (total ou partiel)
- Double ingestion (idempotence)
- Underflow (clamp + log)
- Multi-split (une ligne, plusieurs paiements)
- **Cross-currency** (devise delta ≠ document → ignorer + warning)

---

## 11. Plan de migration

| Phase | Action |
|-------|--------|
| **0** | Odoo : implémenter payload v1.2 + script/endpoint backfill |
| **1** | Vault : migration SQL (`financial_recon_deltas`, `amount_signed` sur documents) |
| **2** | Vault : handler ingestion format v1.2 (impacted_documents obligatoire) |
| **3** | Double écriture (projection RECONCIL + deltas) pour recette |
| **4** | Backfill Odoo → envoi événements état courant |
| **5** | Bascule API Treasury sur métriques confirmation |
| **6** | Retrait proxy Process. **Conserver** projection RECONCIL pour Position. |

---

## 12. DoD

- [ ] Table `financial_recon_deltas` créée
- [ ] Colonne `amount_signed` sur `documents` + backfill
- [ ] Handlers bank.move.reconciled/unreconciled v1.2 opérationnels
- [ ] Tests unitaires (Partiel, Full, Unreconcile, Idempotence, Underflow, Multi-split, Cross-currency)
- [ ] API Treasury exposant `confirmation`
- [ ] Backfill validé sur tenant de qualification
- [ ] Contrat Odoo v1.2 documenté et implémenté

---

## 13. Points à surveiller (architecture)

### 13.1 odoo_move_id

`odoo_move_id` est **traçabilité / debug** uniquement. La dépendance logique est `document_id`. Si demain ERPNext ou une autre source : le concept `move_id` disparaît. Ne pas en faire une contrainte métier.

### 13.2 occurred_at dans event_uid

Voir §5.3. **Ne pas inclure** `occurred_at` dans le hash si on n'utilise pas d'idempotency_key Odoo — sinon risque de double delta sur réémission avec timestamp légèrement différent.

### 13.3 Performance — agrégation future

La formule `confirmed_abs(document_id) = SUM(deltas)` est un calcul dynamique. OK à court terme (10k paiements, 100k deltas).  
À l'échelle (1M paiements, 5M deltas) : latence à prévoir.

**Décision :** Pas de matérialisation maintenant. Mais **prévoir dans le schéma mental** :
- Champ nullable `confirmed_amount_abs_cached` sur `documents`, ou
- Table `document_confirmation_projection`

À mettre en place quand la latence devient perceptible. Ne pas implémenter en V1.

### 13.4 Multi-devise — cross-currency interdit

**Problème :** Paiement en USD, ligne bancaire en EUR, Vault stocke `amount_signed` en devise d'origine. Le `confirmation_rate` dans quelle devise ?

**Décision :** Tous les calculs confirmation se font dans la **devise du document**. On interdit les cross-currency delta.

| Cas | Comportement |
|-----|--------------|
| `currency` delta = `currency` document | ✅ Accepter |
| `currency` delta ≠ `currency` document | ❌ **Ignorer** + log warning |

Pas de conversion FX. Sinon ouverture d'une complexité (taux, date, arrondis) non traitée en V1.

---

## 14. Références

- Spec d’origine : `SPEC_Confirmation_Bancaire_Stricte_v1.2`
- Rapport avis expert : `RAPPORT_AVIS_EXPERT_SPEC_Confirmation_Bancaire_Stricte_v1.2.md`
- Spec Trésorerie v4.1 : `Carte_Trésorerie_Validée_v4.1_Hybride.md`
