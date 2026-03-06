# SPEC — Alimentation expected_count (Phase DVIG)

**Version :** 1.0  
**Date :** 2026-03-03  
**Référence :** SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1, PLAN_IMPLEMENTATION_COMPLETUDE_AVANT_AFFICHAGE_v1.1

---

## 1. Contexte

`expected_count` est la source de vérité pour afficher la progression « X / Y preuves scellées » dans Linky, **avant** que toutes les preuves soient scellées.

**Origine :** DVIG (couche d'abstraction). Pas de requête live ERP depuis le Vault.

```
ERP (Odoo) → DVIG POST /internal/expected-counts → Vault POST /api/v1/expected-counts
```

---

## 2. Flux technique

### 2.1 DVIG — POST /internal/expected-counts

| Élément | Détail |
|--------|--------|
| **URL** | `POST {DVIG_URL}/internal/expected-counts` |
| **Auth** | `Authorization: Bearer {DVIG_INTERNAL_TOKEN}` |
| **Payload** | Voir §2.3 |

### 2.2 Vault — POST /api/v1/expected-counts

| Élément | Détail |
|---------|--------|
| **URL** | `POST {VAULT_URL}/api/v1/expected-counts` |
| **Auth** | Aucune (appelé par DVIG, réseau interne) |
| **Payload** | Voir §2.3 |
| **Réponse** | 204 No Content |

### 2.3 Payload

```json
{
  "tenant": "core",
  "company_id": "1",
  "period_from": "2026-01-01",
  "period_to": "2026-01-31",
  "generated_at": "2026-03-03T10:45:00Z",
  "counts": [
    { "source": "sales", "expected_count": 42 },
    { "source": "purchases", "expected_count": 38 },
    { "source": "paymentsIn", "expected_count": 156 },
    { "source": "paymentsOut", "expected_count": 120 },
    { "source": "pos", "expected_count": 45 }
  ]
}
```

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| `tenant` | Oui | Identifiant tenant |
| `company_id` | Non | Vide = agrégat tous sociétés |
| `period_from` | Non | Défaut 2000-01-01 |
| `period_to` | Non | Défaut 2030-12-31 |
| `generated_at` | Non | ISO 8601 — traçabilité, debug, audit, futur « Dernière synchronisation » |
| `counts` | Oui | **Exactement 5 sources** (sales, purchases, paymentsIn, paymentsOut, pos) — pas une de plus, pas une de moins |

**Validation stricte :** Le payload `expected_count` doit contenir exactement 5 sources. Toute source manquante ou en trop → 400 Bad Request. Un connecteur qui enverrait 4 sources par erreur rendrait le système ambigu — rejet explicite.

### 2.4 Idempotence explicite

| Élément | Règle |
|--------|-------|
| **Clé logique** | `(tenant, company_id, period_from, period_to, source)` |
| **Sémantique** | Upsert strict — aucune création de doublon |
| **Historique** | Aucun — pas de versionning, pas d’audit trail des valeurs passées |
| **Écrasement** | Autorisé — un nouvel envoi remplace la valeur précédente |

**Réponse à l’auditeur :** *Si expected_count change (ex. annulation, correction), un nouvel envoi écrase. La valeur courante est toujours celle du dernier push réussi.*

### 2.5 Sources

| Source | Objet ERP | Requête Odoo indicative | Contrainte d’alignement |
|--------|-----------|-------------------------|-------------------------|
| `sales` | Factures clients | `account.move` posted, move_type in (out_invoice, out_refund) | — |
| `purchases` | Factures fournisseurs | `account.move` posted, move_type in (in_invoice, in_refund) | — |
| `paymentsIn` | Encaissements | `account.payment` posted, payment_type = inbound | — |
| `paymentsOut` | Décaissements | `account.payment` posted, payment_type = outbound | — |
| `pos` | Sessions ou tickets | **Voir §2.6** | **Critique : doit matcher sealed_count** |

### 2.6 POS — Alignement sessions vs tickets

**Règle impérative :** Le granularité du comptage POS doit être identique à celle du Vault.

| Si le Vault scelle… | Odoo doit compter… |
|--------------------|--------------------|
| Par session | `pos.session` state = closed |
| Par ticket | `pos.order` (ou équivalent) |

Si les deux diffèrent (`expected_count = 45 sessions` vs `sealed_count = 240 tickets`), la progression X / Y devient incohérente. **À aligner côté modèle Vault + connecteur.**

### 2.7 Cas critique : expected_count diminue (note future)

Exemple : hier sales = 42, aujourd’hui sales = 39 (annulation, correction).

| Comportement actuel | Écrasement — la nouvelle valeur remplace |
|---------------------|-------------------------------------------|
| **Évolution possible** | Logger l’évolution ; détecter les deltas négatifs ; générer un événement d’intégrité |

*Pas pour l’instant. À garder en tête pour une future évolution produit.*

---

## 3. CRON Odoo (implémenté)

Le CRON **Expected Counts Push (Phase DVIG)** dans le connecteur `dorevia_vault_connector` :

1. Pour chaque tenant/société/période pertinente (ex. mois en cours + mois précédent) :
2. Compter les documents dans Odoo par type (cf. §2.5)
3. Appeler `POST {DVIG_URL}/internal/expected-counts` avec `Authorization: Bearer {DVIG_INTERNAL_TOKEN}`

**Fréquence recommandée :** **Après chaque cycle de vaulting** (ex. après trigger worker DVIG).

*Pourquoi ?* Si on pousse `expected_count` une fois par jour, on peut avoir : `sealed_count = 41`, `expected_count = 42`, alors que la 42e preuve vient d’être créée. L’UX resterait bloquée artificiellement. Recalculer et pousser en fin de sync garantit la cohérence.

**Périodes à alimenter :** Au minimum le mois en cours. Option : 3 derniers mois glissants.

---

## 4. Fichiers implémentés

| Composant | Fichier |
|-----------|---------|
| **Vault migration** | `039_expected_counts.sql`, `040_expected_counts_generated_at.sql` |
| **Vault storage** | `expected_counts.go` — UpsertExpectedCount(generatedAt), ExpectedCountsGeneratedAt |
| **Vault handler** | `expected_counts.go` — payload `generated_at` (optionnel) |
| **Vault snapshot** | `completeness_snapshot.go` — retourne `generated_at` pour « Dernière synchronisation » |
| **DVIG route** | `internal.py` — payload `generated_at` (optionnel), forward vers Vault |
| **Linky** | `dashboard-metrics/route.ts` — expose `generated_at` ; `SyncInProgress` affiche « Dernière synchronisation » |
| **Odoo CRON** | `dorevia_vault_connector` — `push_expected_counts` ; CRON 2 min ; comptages sales, purchases, paymentsIn, paymentsOut, pos |

---

## 5. Exemple curl

```bash
# Via DVIG (auth interne) — avec generated_at optionnel
curl -X POST "http://dvig-core-stinger:8080/internal/expected-counts" \
  -H "Authorization: Bearer ${DVIG_INTERNAL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": "core",
    "company_id": "",
    "period_from": "2026-01-01",
    "period_to": "2026-01-31",
    "generated_at": "2026-03-03T10:45:00Z",
    "counts": [
      {"source": "sales", "expected_count": 42},
      {"source": "purchases", "expected_count": 38},
      {"source": "paymentsIn", "expected_count": 156},
      {"source": "paymentsOut", "expected_count": 120},
      {"source": "pos", "expected_count": 45}
    ]
  }'
```

---

## 6. Vision produit

La complétude n’est plus déduite — elle est **déclarée par la source métier**.

| Couche | Rôle |
|--------|------|
| **Vault** | Vérité scellée — stocke et expose |
| **DVIG** | Couche d’abstraction — transporte |
| **ERP** | Fournisseur de volumétrie — compte |

Architecture ERP-agnostique : demain Odoo, ERPNext, SAP, Sage — il suffit qu’ils envoient un `expected_count`. Linky fonctionne.

---

*SPEC alimentation expected_count — Phase DVIG.*
