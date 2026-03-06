# SPEC — DIVA Cockpit Only v1.3

**Date :** 2026-02-18  
**Statut :** Stable  
**Scope :** Linky + DIVA + Runner + Mistral  
**Remplace :** v1.2

---

## 1. Décision structurante

DIVA fournit **une seule analyse décisionnelle au niveau cockpit**.

- ❌ Aucun texte IA sur les cards individuelles
- ❌ Aucun appel IA synchrone côté UI
- ✅ Lecture DB uniquement côté GET
- ✅ Génération IA asynchrone via runner

---

## 2. Clé de contexte (multi-société obligatoire)

Chaque société possède son propre cockpit.

### Format obligatoire

```
context_key = <context_scope>:<tenant>:<company_id>:<date_start>:<date_end>
```

Avec `context_scope = "cockpit"` (seule valeur aujourd'hui).

Le scope est explicite dans la clé pour permettre l'ajout futur d'autres scopes sans collision.

### Exemple

```
cockpit:sarl-la-platine:1:2026-01-01:2026-02-18
cockpit:sarl-la-platine:2:2026-01-01:2026-02-18
cockpit:sarl-la-platine:0:2026-01-01:2026-02-18   (consolidé)
```

⚠️ `company_id` est obligatoire. Sans lui → collision de données.

---

## 3. Découverte dynamique des sociétés (Runner)

### 3.1 Principe

Le runner ne doit PAS dépendre d'une config manuelle.

### 3.2 Implémentation recommandée (Approche A)

À **chaque tick** du runner (pas seulement au démarrage) :

1. Interroger Linky ou Odoo pour obtenir la liste des `company_id` actifs du tenant
2. Générer un insight cockpit pour chacun

Pseudo-process :

```
# À chaque tick
companies = fetch_companies(tenant)

for company_id in companies:
    generate_cockpit(tenant, company_id)
```

Cela garantit qu'une société ajoutée ou supprimée côté Odoo est prise en compte au prochain cycle, sans redémarrage du runner.

### 3.3 Interdiction

❌ Ne pas utiliser une config statique type :

```
RUNNER_TENANT_CONFIG=sarl-la-platine:0,1
```

→ Source d'oubli futur.

### 3.4 Société supprimée côté Odoo

Si une société est supprimée ou désactivée côté Odoo :

- Le runner **ne la découvre plus** → ne régénère plus d'insight pour elle
- Les insights existants en BDD **expirent naturellement** (TTL)
- Le runner **ne purge pas rétroactivement** les anciens insights
- Aucune action manuelle requise

---

## 4. TTL officiel (formalisé)

Cockpit Only permet d'augmenter la stabilité.

### TTL retenu

```
TTL = 3 minutes
```

### Règles

- `expires_at = generated_at + 3 minutes`
- Si `payload_hash` identique ET insight non expiré → skip génération
- Runner cadence recommandée : 2 minutes

Effet :
- 1 génération max toutes les 3 minutes par société
- Charge serveur maîtrisée

---

## 5. Payload Mistral

Le payload cockpit doit contenir toutes les cards actives du cockpit.

### Source de vérité des cards

La liste des cards n'est **pas définie dans cette spec**. Elle est gouvernée par la spec complémentaire **DIVA Cockpit Cards Governance v1.0** (`DIVA_Cockpit_Cards_Governance.md`).

Le runner découvre dynamiquement les cards via l'endpoint Linky `GET /api/cockpit/cards`. Le nombre de cards peut varier (ajout, suppression) sans modification du runner ni de cette spec.

### Cards actuelles (référence, au 2026-02-18)

À titre informatif, les cards actuellement implémentées dans Linky :

| `key` (spec) | Label | Unité | Source Linky |
|---|---|---|---|
| `treasury_validated_pct` | Trésorerie validée | percent | `TreasuryCardWithPolling` |
| `cash` | Cash | currency | `FluxCashCardWithPolling` |
| `business` | Business | currency | `BusinessCardWithPolling` |
| `taxes` | Taxes | currency | `TaxesCardWithPolling` |
| `credit_notes` | Notes de crédit | currency | `CreditNotesCardWithPolling` |
| `refunds` | Remboursements | currency | `RefundsCardWithPolling` |
| `pos_shops` | POS magasins | currency | `PosShopsView` |
| `pos_z` | Z de caisse | currency | `PosComingSoonView` |

Cette liste est **informative** et non normative. Seul l'endpoint `/api/cockpit/cards` fait foi.

### Structure minimale

```json
{
  "schema": "dorevia.cockpit_context.v1",
  "context_scope": "cockpit",
  "context": {
    "tenant": "...",
    "company_id": 1,
    "date_start": "...",
    "date_end": "...",
    "currency": "EUR"
  },
  "cards_spec": {
    "version": "2026-02-18.1",
    "keys": ["business", "cash", "..."],
    "required": ["business", "cash", "..."]
  },
  "cards": [
    { "key": "...", "value": 0, "unit": "...", "details": {} }
  ],
  "quality": {
    "is_complete": true,
    "missing_fields": []
  },
  "meta": {
    "payload_hash": "sha256:..."
  }
}
```

### Règles

- `context_scope` obligatoire dans le payload (même si redondant avec la clé) — le `payload_hash` doit inclure tout ce qui définit le scope, sinon un futur scope pourrait produire le même hash
- Toutes les cards `required=true` doivent être présentes (cf. Governance §3.2)
- Les cards `required=false` peuvent être `null` avec `details.reason`
- Ordre stable (tri alphabétique par `key`)
- Si une card affichée dans Linky → valeur obligatoire dans payload

---

## 6. API Contract

### Terminologie `state` (API) vs `status` (DB)

La spec utilise `state` dans les réponses API. La table `diva_insights` utilise la colonne `status` avec une contrainte `CHECK (status IN ('ok', 'error'))`.

Mapping :

| API (`state`) | DB (`status`) | Signification |
|---|---|---|
| `ready` | `ok` | Insight disponible |
| `failed` | `error` | Génération échouée |
| `pending` | *(pas de ligne)* | Aucun insight trouvé en DB, synthétisé par le handler GET |

L'implémentation n'a **pas besoin de migrer la colonne `status`**. Le handler GET traduit `ok` → `ready` et `error` → `failed` dans la réponse JSON.

### GET

```
GET /api/diva/insight?tenant=<t>&company_id=<c>&date_start=<d1>&date_end=<d2>&scope=cockpit
```

Toujours :

```json
{
  "state": "ready|pending|failed"
}
```

Jamais de 404.

### État `failed`

Si `state = "failed"` :

- Le runner **réessaie au cycle suivant**
- Un insight `failed` n'est jamais considéré comme frais par `payload_hash`
- Le GET retourne `state: "failed"` au client (Linky affiche un message neutre)

Sans ce comportement, un `failed` resterait bloqué indéfiniment.

### Mistral indisponible (OOM, timeout, service down)

Si l'appel Mistral échoue (timeout, 503, OOM, réseau) :

- L'insight passe en `state = "failed"` avec `error_code` renseigné
- Le runner réessaie au cycle suivant (pas d'escalade bloquante)
- Aucun message technique n'est exposé à l'utilisateur
- Linky affiche la chaîne exacte : **"Analyse temporairement indisponible (mise à jour automatique en cours)."**

Ce comportement est non négociable. Un dev futur ne doit pas introduire de retry bloquant ou de boucle d'attente sur Mistral.

### Codes erreur autorisés (enum fermé)

| `error_code` | Cause |
|---|---|
| `MISTRAL_TIMEOUT` | Appel Mistral expiré (> 120s) |
| `MISTRAL_UNAVAILABLE` | Service Mistral down ou 503 |
| `MISTRAL_OOM` | Out of memory côté Mistral |
| `MISTRAL_BAD_RESPONSE` | Réponse Mistral non parsable ou vide |
| `INVALID_PAYLOAD` | Payload envoyé à DIVA invalide (cards manquantes, champs requis absents) |

Aucun autre `error_code` n'est autorisé. Tout nouveau cas doit être ajouté à cette enum dans la spec avant implémentation.

### État `pending` (synthétisé, jamais stocké en DB)

`state = "pending"` signifie : **aucun insight disponible pour ce `context_key`**.

- `pending` n'est **jamais écrit en DB** — il est synthétisé par le handler GET quand aucune ligne `status='ok'` n'existe
- La protection contre les doubles runs est assurée par le **advisory lock Postgres** (§7), pas par un état `pending` en DB
- Si le runner crash pendant une génération, le lock advisory est libéré automatiquement par Postgres (fin de transaction) — le cycle suivant peut relancer
- Il n'existe aucune ligne `status='pending'` dans la table `diva_insights`

### POST (interne runner uniquement)

```
POST /api/diva/generate
```

Non exposé à l'UX.

---

## 7. Runner — Concurrency & Idempotence

### Règles obligatoires

- 1 job IA maximum simultané **par `context_key`** (le advisory lock est par clé ; plusieurs context_keys distincts peuvent être traités en parallèle si `RUNNER_CONCURRENCY > 1`)
- `payload_hash` obligatoire
- Si advisory lock refusé (`pg_try_advisory_lock` = false) → ne rien faire, un autre worker calcule déjà ce `context_key`
- Si insight existant avec `status='error'` → relancer (retry au cycle suivant)
- Si `payload_hash` identique ET `status='ok'` ET non expiré → skip

### Invariants `payload_hash` (point critique)

Le `payload_hash` doit être déterministe et stable. Règles :

- **Inclure `company_id`** dans le calcul du hash
- **JSON canonicalisé** : clés triées, ordre stable
- **Pas d'arrondi flottant instable** : arrondir les valeurs numériques à une précision fixe (2 décimales) avant hashage
- **Préserver les `null`** : un champ `null` et un champ absent produisent des hash différents

Un `payload_hash` instable provoque des régénérations inutiles (faux "payload changé").

### Lock (Postgres advisory)

- Utiliser `pg_try_advisory_lock(hash(context_key))` (ou équivalent 64-bit)
- Si lock refusé → ne rien faire (un autre worker calcule déjà)
- Toujours `pg_advisory_unlock` en fin de génération (`defer`)

### Contrainte d'implémentation Go

En Go, ne jamais hasher directement un `map[string]interface{}` brut (ordre d'itération non déterministe). Utiliser :

- Une struct typée avec `json.Marshal` (ordre des champs garanti par l'ordre de déclaration)
- Ou un encodeur canonical avec tri explicite des clés

L'implémentation actuelle (`hashinput/canonical.go`) utilise déjà une canonicalisation JSON avec tri des clés — **ne pas régresser vers un `map` brut**.

---

## 8. Suppression Cards IA

~~À implémenter :~~ ✅ Implémenté (2026-02-18)

- ~~Retirer boucle focus cards dans runner~~ ✅
- ~~Supprimer `DivaFlashBlock` des cards Linky~~ ✅
- ~~Ne conserver que `scope=cockpit`~~ ✅

---

## 9. Definition of Done

- [x] `context_scope` explicite dans `context_key`
- [x] `context_scope` présent dans le payload Mistral
- [x] `company_id` intégré dans `context_key`
- [x] Découverte dynamique des sociétés opérationnelle
- [x] TTL = 3 min implémenté
- [x] Cards dynamiques via `/api/cockpit/cards` (cf. Governance)
- [x] Suppression génération focus cards
- [x] Suppression bloc DIVA sur cards
- [x] État `failed` → retry au cycle suivant
- [x] Mistral indisponible → `failed` + `error_code` (enum fermé), aucun message technique en UI
- [x] Message UI en `failed` = "Analyse temporairement indisponible (mise à jour automatique en cours)."
- [x] `pending` synthétisé par le handler GET (jamais stocké en DB), doubles runs empêchés par advisory lock
- [x] `payload_hash` déterministe (JSON canonicalisé, arrondis stables, scope + company_id inclus)
- [x] Canonicalisation Go via struct typée ou encodeur stable (pas de `map[string]interface{}` brut)
- [x] Test sur `company_id` 0 / 1 / 2
- [x] Charge serveur mesurée après déploiement

**Implémenté le 2026-02-18 — Voir `RAPPORT_IMPLEMENTATION_DIVA_COCKPIT_ONLY_2026-02-18.md`**

---

## 10. Impact attendu

- ÷4 appels Mistral
- Cycle réduit à ~2-3 minutes
- UX simplifiée
- Cohérence analytique renforcée
- Dette technique réduite

---

**SPEC validée — prête commit.**
