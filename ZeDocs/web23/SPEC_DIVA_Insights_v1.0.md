# SPEC — DIVA Insights (Lecture instantanée)

**Version :** 1.1  
**Date :** 2026-02-18  
**Statut :** Implémenté (2026-02-16) — voir `POINT_ETAPE_IMPLEMENTATION_DIVA_INSIGHTS_2026-02-16.md`  
**Scope :** Backend DIVA (Go + Postgres) + Linky (Next.js) + Runner  
**Compatibilité :** Dorevia Platform (mono-instance compatible, multi-instance ready)

**Références :**
- `SPEC_DIVA_Async_Persistent_Analysis_Store_v1.0.md` — store existant
- `SPEC_DIVA_Warmup_Runner_CODIR_v1.0.md` — runner existant
- `SPEC_CARD_CONTEXT_IA_v1.md` — format JSON envoyé à l'IA

**Changelog v1.0 :** Index unique partiel `WHERE status = 'ok'` ; champ `generated_from_runner` ; protection `pg_advisory_xact_lock` ; mode A lecture à la minute.

**Changelog v1.1 (consolidation amendements) :**
- **context_key** vs **payload_hash** : deux identifiants distincts (context_key = slot/lock, payload_hash = idempotence).
- Schéma SQL : colonne `context_key`, CHECK `card_key`/`mode`, index unique `(context_key, payload_hash)`.
- Lock sur `context_key` (et non payload_hash) + `lock_timeout` 120 s.
- Requête GET explicite avec `ORDER BY created_at DESC LIMIT 1`.
- Validation payload POST /generate (champs requis).
- Timezone pour périodes YTD/MTD (`INSIGHTS_TIMEZONE`).
- Note UX : pas de re-fetch en boucle si GET 404 ; warmup fire-and-forget uniquement.
- **§5.5 Robustesse SQL** : lock session vs xact ; purge par lots ; index context_key ; format context_key ; traitement unique_violation.
- Lock : SHA-256 direct `substr(1,16)::bit(64)::bigint` (plus de hashtext). GET par `context_key` uniquement. Variables pool : `DB_MAX_OPEN_CONNS`, `DB_MAX_IDLE_CONNS`, `DB_CONN_MAX_LIFETIME`.
- **§5.5 v1.1 corrigée** : timeout lock (SET vs SET LOCAL, 2 options) ; séquence détaillée double-check + INSERT ; purge avec `ORDER BY id` ; big-endian Go explicite.
- **§4.4 Payload IA** : structure JSON, périmètre payload_hash, canonicalisation, robustesse (données manquantes).
- **hash_input** : payload_hash calculé sur objet stable (sans formatted/label/float) ; centimes, basis points ; schémas `dorevia.diva.hash_input.v1`, `dorevia.card.*.details.v1`.
- **§4.4.5 normatif** : séparation payload for AI / hash_input ; source-of-truth cards vs details ; interdiction floats ; arrondi `round_half_away_from_zero` ; `_details_minor` optionnel.
- Exclusions hash_input : `locale`, `timezone` ; cards en **map** (forme canonique) ; confidence = sortie IA, pas d'entrée hash.
- **Règles blindées** : zéro absent (map complète) ; CARD_VALUE_SCALE (scale par key) ; arrondi `round_half_away_from_zero` ; condition dates figées ; currency/minor_unit v2.
- **FOCUS_CARD_DETAILS_SCALE** : mapping champs details par carte (treasury, cash, business, credit_notes, refunds).
- Mapping treasury : `focus_card = treasury_validated_pct` → `_details.treasury` (→ *_minor). Canonical JSON : warning Go map order. Arrondi : value null → *_minor null. Règle pos_z null.

---

## 0. Résumé exécutif

**Design cible (mode A — lecture à la minute) :**

| Couche | Rôle |
|--------|------|
| **diva_insights** | Cache applicatif volatil, TTL court (5–15 min), remplaçable. Uniquement du consommable (`status = ok`). |
| **Vault** | Mémoire (événements scellés) + vérité durable. |
| **Linky** | Lecture instantanée d'un **état** (pas d'un historique). |

Séparer **calcul/IA** (en coulisse) de **lecture UX** (instantanée). Linky ne déclenche plus d'appel IA bloquant : il lit uniquement des insights pré-calculés via des endpoints GET.

**Bénéfices :**
- Affichage instantané (aucune attente Mistral côté UX)
- Discours DIVA stabilisé (cache idempotent)
- Réduction du thundering herd (1 requête GET vs N poll)
- Architecture claire : DIVA « lit » des chiffres, Linky « sert » des messages prêts

---

## 1. Objectifs

| Objectif | Description |
|----------|-------------|
| **UX instantanée** | Aucun appel IA depuis le navigateur. Lecture seule via API. |
| **Idempotence** | `payload_hash` inchangé → pas de régénération. |
| **Best effort** | En cas d'échec runner, conserver le dernier message valide. |
| **Compatibilité** | Réutiliser Postgres Vault existant. Pas de Redis, pas de queue externe. |
| **Évolutivité** | Schéma `diva_insights` queryable (tenant, mode, card_key, period). |

---

## 2. Non-objectifs (v1)

- Event-driven sur tous les événements Vault
- Personnalisation par utilisateur
- Historique long terme des analyses
- Alerting (SMS/email)
- Multi-région / multi-datacenter

---

## 3. Architecture

### 3.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           GÉNÉRATION (coulisse)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Runner planifié (1–2 min)     │     Warmup opportuniste (page load)    │
│  - Récupère dashboard-metrics  │     - Si cache expiré, POST /generate  │
│  - Construit JSON normalisé    │     - Fire-and-forget, ignore réponse   │
│  - POST /diva/generate         │                                         │
│  - Stocke dans diva_insights   │                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              STOCKAGE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Table diva_insights (Postgres) — cache volatil, TTL 5–15 min           │
│  - tenant, company_id, mode, card_key, date_start, date_end             │
│  - context_key, payload_hash, message_text, flash_json, expires_at       │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           LECTURE (instantanée)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Linky Home : GET /api/diva/insight?mode=cockpit&period=YTD             │
│  Linky Carte : GET /api/diva/insight?mode=card&card_key=cash&period=YTD  │
│  → 200 + message_text OU 404 / fallback "Analyse en cours"              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Composants

| Composant | Rôle |
|-----------|------|
| **Linky** | Affiche les insights. GET uniquement. Pas d'appel Mistral. |
| **DIVA** | API `GET /diva/insights`, `POST /diva/generate` (interne). Consomme Mistral. |
| **Runner** | Cron 1–2 min. Génère insights pour contextes CODIR prioritaires. |
| **Postgres** | Table `diva_insights`. Source de vérité. |

---

## 4. Clés de cache et idempotence

### 4.1 Distinction context_key / payload_hash

Deux identifiants distincts :

| Élément | Rôle | Construction |
|---------|------|---------------|
| **context_key** | Identifie le **contexte d'insight** (tenant, company, mode, card, période). Stable tant que le contexte ne change pas. Utilisé pour le **verrouillage concurrent** (advisory lock). | `SHA-256(tenant + "|" + company_id + "|" + mode + "|" + (card_key ou "") + "|" + date_start + "|" + date_end)` — pour cockpit, card_key → chaîne vide. |
| **payload_hash** | SHA-256 du JSON canonicalisé (context + cards + details). Change si les données changent. Utilisé pour l'**idempotence** (ne pas régénérer si données identiques). | `SHA-256(JSON canonicalisé complet)` |

- `context_key` → lock (un seul processus génère pour ce contexte à la fois).
- `payload_hash` → si identique et insight frais → 204 (déjà à jour).

### 4.2 Périodes prédéfinies

| `period` (paramètre API) | `date_start` | `date_end` |
|--------------------------|--------------|------------|
| `YTD` | 1er janvier année courante | Aujourd'hui (dans le timezone) |
| `MTD` | 1er jour du mois courant | Aujourd'hui |
| `current_month` | 1er jour du mois | Dernier jour du mois |
| `custom` | Fourni via `date_start` / `date_end` | — |

**Timezone :** Le calcul de « aujourd'hui » utilise `INSIGHTS_TIMEZONE` (défaut `Europe/Paris`). Évite les décalages selon le fuseau du serveur.

### 4.3 Anti-spam

Si `payload_hash` est identique à l'insight déjà stocké et non expiré : **ne pas régénérer**. La réponse IA ne changerait pas (données inchangées).

### 4.4 Payload IA (données JSON envoyées à Mistral)

**Référence :** `SPEC_CARD_CONTEXT_IA_v1.md` (structure conceptuelle) ; `INVENTAIRE_DONNEES_IA_PAR_CARTE.md` (traçabilité par carte). Le format wire est identique à `POST /diva/explain/async`.

#### Structure du payload (for AI)

Optionnel mais recommandé : `schema: "dorevia.diva.generate_payload.v1"` ; `options.mode_scope: "cockpit" | "card"` (explicite).

```json
{
  "schema": "dorevia.diva.generate_payload.v1",
  "context": {
    "tenant": "string",
    "company_id": 0,
    "date_start": "YYYY-MM-DD",
    "date_end": "YYYY-MM-DD",
    "timezone": "Europe/Paris",
    "currency": "EUR",
    "locale": "fr-FR"
  },
  "dashboard": {
    "cards": [
      { "key": "...", "label": "...", "value": number|null, "formatted": "...", "unit": "..." }
    ]
  },
  "options": {
    "mode": "flash",
    "mode_scope": "card",
    "focus_card": "cash",
    "focus_card_details": { ... }
  }
}
```

- **Mode cockpit** : `dashboard.cards` contient toutes les cartes (8 KPIs) ; `options.focus_card` absent ou ignoré ; `focus_card_details` absent.
- **Mode card** : `dashboard.cards` idem ; `options.focus_card` requis ; `options.focus_card_details` = détails de la carte ciblée (ex. encaissements, décaissements, net pour `cash`).

**Source des données :** `GET /api/dashboard-metrics` (Linky) — agrégation + `_details` par carte. Le runner et le warmup construisent le payload à partir de cette réponse.

#### 4.4.5 Normalisation & payload_hash (anti-floats, anti-variations JSON)

### A) Séparation stricte : payload for AI vs hash_input

- Le **payload for AI** (envoyé à Mistral) peut contenir des champs « présentation » (`label`, `formatted`, etc.).
- Le **payload_hash** **NE DOIT JAMAIS** être calculé sur le payload for AI.
- Le **payload_hash** est calculé **uniquement** sur `hash_input` (structure stable), afin d'éviter :
  - variations de `formatted` (espaces, signes, localisations),
  - instabilité des floats (`1686.84`),
  - différences d'ordre des clés / des arrays non triés.

### B) Source-of-truth : cards vs details (règle de cohérence)

- En **mode cockpit** : `payload_hash` dépend **uniquement** de `hash_input.cards` (et du contexte). Les `_details` **n'impactent pas** le hash en cockpit.
- En **mode card** : `payload_hash` dépend de `hash_input.cards` **et** de `hash_input.focus_card_details` (pour la carte focus uniquement).

> **Règle métier** : la valeur d'une carte `cards[key]` représente le résumé « officiel » affiché. Les détails (`_details.*`) sont considérés comme **complémentaires**, utilisés uniquement pour l'analyse de la carte focus.

> **confidence** : c'est une **sortie** IA (annotation qualité), pas une entrée de hash_input. Un changement de confidence seul **ne déclenche pas** de régénération — le hash évolue uniquement quand la donnée métier change.

### C) Représentation stable des montants (interdiction des floats)

Dans `hash_input`, les valeurs numériques sont **strictement** encodées en :

- `*_minor` (entiers) pour les montants monétaires (EUR → centimes),
- `*_basis_points` (entiers) pour les pourcentages (1 % = 100 bp),
- ou `null` si la donnée est indisponible.

**Interdit dans hash_input :** float / decimal, string de nombre (sauf si explicitement défini).

### D) Règle d'arrondi float → int (normative)

La source (`dashboard-metrics`) peut contenir des floats (ex. `2186.84`). La conversion vers `hash_input` doit être **déterministe** :

```
value_minor = round_half_away_from_zero(value * 10^minor_unit)
```

avec `minor_unit = 2` pour EUR (centimes). Exemples normatifs : `1.005 → 101`, `1.004 → 100`, `-1.005 → -101`, `-1.004 → -100`.

- Si `value == null` → `*_minor = null` (donnée indisponible).
- Si `currency != EUR` (v2) → `minor_unit` variable selon mapping ISO 4217.

> Note : ne pas utiliser le « banker's rounding » (half-even) car le résultat varie selon langages/librairies. Une seule règle pour tout le pipeline.

### E) Champs context : locale et timezone (exclusions hash_input)

- **locale** : **exclure** du hash_input (garder dans payload for AI). Sinon un simple changement de langue invaliderait tout le cache sans évolution métier.
- **timezone** : **exclure** du hash_input lorsque `date_start` et `date_end` sont déjà calculés. Redondant pour l'idempotence.

> **Condition explicite** : `date_start` et `date_end` sont **déjà résolus et figés** avant construction de hash_input (ex. YTD/MTD résolus par le résolveur de période). La timezone sert au résolveur, pas à l'idempotence.

Champs **inclus** dans `hash_input.context` : `tenant`, `company_id`, `date_start`, `date_end`, `currency`.

### F) Règle « zéro absent » (normative)

`hash_input.cards` **DOIT** contenir **toutes** les clés du cockpit attendues, même si la valeur est `null`. Sinon « carte absente » vs « carte présente mais null » produirait des hash différents sans différence métier.

**Map complète** : les 8 clés (voir tableau G) sont toujours présentes ; valeurs `null` autorisées.

> Une carte peut être `null` (donnée indisponible) sans invalider les autres — ex. `pos_z.value_minor: null`.

### G) Règle « scale par key » : CARD_VALUE_SCALE (normative)

Une table `CARD_VALUE_SCALE` définit le type de valeur attendu par `card_key` pour éviter qu'un dev utilise `value_minor` pour un pourcentage :

| `card_key` | Scale | Champ hash_input |
|------------|-------|------------------|
| `treasury_validated_pct` | basis_points | `value_basis_points` |
| `cash` | minor | `value_minor` |
| `business` | minor | `value_minor` |
| `taxes` | minor | `value_minor` |
| `credit_notes` | minor | `value_minor` |
| `refunds` | minor | `value_minor` |
| `pos_shops` | minor | `value_minor` |
| `pos_z` | minor | `value_minor` |

**focus_card_details** : tous les montants en `*_minor`. Table `FOCUS_CARD_DETAILS_SCALE` (voir §4.4.5 G bis) : mapping champ source → champ hash_input par carte.

### G bis) FOCUS_CARD_DETAILS_SCALE (champs details par carte)

| `focus_card` | Schema hash_input | Champs `data` (tous minor) |
|--------------|-------------------|-----------------------------|
| `treasury_validated_pct` | `dorevia.card.treasury.details.v1` | `reconciled_minor`, `unreconciled_minor`, `total_minor`, `currency` |
| `cash` | `dorevia.card.cash.details.v1` | `encaissements_minor`, `decaissements_minor`, `net_minor`, `currency` |
| `business` | `dorevia.card.business.details.v1` | `ventes_minor`, `achats_minor`, `net_minor`, `currency` |
| `credit_notes` | `dorevia.card.credit_notes.details.v1` | `clients_minor`, `fournisseurs_minor`, `flux_minor`, `currency` |
| `refunds` | `dorevia.card.refunds.details.v1` | `clients_minor`, `fournisseurs_minor`, `flux_minor`, `currency` |
| `taxes` | — | Pas de details en v1 (format proposé : `tva_collectee_minor`, `tva_deductible_minor`, `flux_minor`) |
| `pos_shops` | — | Pas de details en v1 |
| `pos_z` | — | Pas de details en v1 |

*Conversion : `{champ}_minor = round_half_away_from_zero({champ} * 100)` pour EUR.*

### H) Règle « currency » (v2)

Par défaut EUR → 2 décimales (`minor_unit = 2`). Pour un futur multi-currency : `minor_unit` doit provenir d'un mapping ISO 4217 (ex. JPY = 0, USD = 2). À documenter en v2.

### I) Tri / canonicalisation (normative)

1. Construire `hash_input` : **cards en map** complète (règle F) ; scale selon `CARD_VALUE_SCALE` (règle G).
2. Sérialiser en JSON **canonical** : clés triées lexicographiquement (y compris dans les objets `cards` et `focus_card_details`) ; pas d'espaces inutiles ; types stables (int/bool/null/string uniquement).
3. Calculer : `payload_hash = SHA256(canonical_json(hash_input))`.

> **Attention Go** : une `map` en Go itère dans un ordre **non déterministe**. Le JSON utilisé pour `payload_hash` **DOIT** être canonicalisé (tri lexicographique des clés). L'implémentation ne doit **pas** dépendre de l'ordre d'itération des `map`. Solutions : struct intermédiaire triée (`[]KV` par key), ou passage dans un canonicalizer qui trie les clés avant sérialisation.

### J) Structure de référence hash_input

**Cockpit :**

```json
{
  "schema": "dorevia.diva.hash_input.v1",
  "context": {
    "tenant": "sarl-la-platine",
    "company_id": 0,
    "date_start": "2026-01-01",
    "date_end": "2026-02-16",
    "currency": "EUR"
  },
  "mode": "cockpit",
  "cards": {
    "business": { "value_minor": 4300000 },
    "cash": { "value_minor": 3400000 },
    "credit_notes": { "value_minor": -40000 },
    "pos_shops": { "value_minor": 1250000 },
    "pos_z": { "value_minor": null },
    "refunds": { "value_minor": 168684 },
    "taxes": { "value_minor": 850000 },
    "treasury_validated_pct": { "value_basis_points": 0 }
  }
}
```

**Card :**

```json
{
  "schema": "dorevia.diva.hash_input.v1",
  "context": {
    "tenant": "sarl-la-platine",
    "company_id": 0,
    "date_start": "2026-01-01",
    "date_end": "2026-02-16",
    "currency": "EUR"
  },
  "mode": "card",
  "focus_card": "cash",
  "cards": { "business": { "value_minor": 4300000 }, "cash": { "value_minor": 3400000 }, "..." },
  "focus_card_details": {
    "schema": "dorevia.card.cash.details.v1",
    "data": {
      "encaissements_minor": 16200000,
      "decaissements_minor": 12800000,
      "net_minor": 3400000,
      "currency": "EUR"
    }
  }
}
```

### K) Option recommandée : _details_minor (si évolution API)

Pour éliminer toute propagation de floats côté Linky/Runner, l'endpoint `dashboard-metrics` peut (optionnellement) exposer :

```json
"_details_minor": {
  "refunds": {
    "clients_minor": 50000,
    "fournisseurs_minor": 218684,
    "flux_minor": 168684
  }
}
```

Voir `EXEMPLES_PAYLOAD_IA_DASHBOARD_METRICS.md` pour les exemples complets.

#### Robustesse des données

| Situation | Comportement |
|-----------|--------------|
| Carte sans `_details` | `focus_card_details = {}` ; l'IA reçoit la carte avec value/formatted uniquement |
| `value` null | Envoyer `null` ; l'IA adapte le discours (« donnée indisponible ») |
| Erreur dashboard-metrics | Ne pas appeler `generate` ; retour 500 ou skip dans le runner |
| Cartes partielles | Envoyer les cartes disponibles ; l'IA travaille sur ce qui est fourni |

Ne jamais tronquer une carte : si une carte existe dans `dashboard.cards`, elle doit avoir au minimum `key`, `label`, `unit`, `value` (ou null), `formatted`.

---

## 5. Schéma base de données

### 5.1 Table `diva_insights`

```sql
CREATE TABLE diva_insights (
    id              BIGSERIAL PRIMARY KEY,
    tenant          TEXT NOT NULL,
    company_id      INTEGER NOT NULL DEFAULT 0,
    mode            TEXT NOT NULL CHECK (mode IN ('cockpit', 'card')),
    card_key        TEXT,
    date_start      DATE NOT NULL,
    date_end        DATE NOT NULL,
    context_key     TEXT NOT NULL,
    payload_hash    TEXT NOT NULL,
    message_text    TEXT NOT NULL,
    flash_json      JSONB NOT NULL,
    status          TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'error')),  -- error réservé v2, jamais écrit en v1
    confidence      TEXT CHECK (confidence IN ('low', 'medium', 'high')),
    model           TEXT,
    latency_ms      INTEGER,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    expires_at      TIMESTAMP NOT NULL,
    generated_from_runner BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT chk_mode_card_key CHECK (
        (mode = 'cockpit' AND card_key IS NULL)
        OR (mode = 'card' AND card_key IS NOT NULL AND length(card_key) > 0)
    )
);

-- Idempotence : un seul insight consommable par (context_key, payload_hash).
CREATE UNIQUE INDEX idx_diva_insights_unique_ok
    ON diva_insights (context_key, payload_hash) WHERE status = 'ok';
CREATE INDEX idx_diva_insights_lookup
    ON diva_insights (tenant, company_id, mode, COALESCE(card_key, ''), date_start, date_end);
CREATE INDEX idx_diva_insights_expires
    ON diva_insights (expires_at);
CREATE INDEX idx_diva_insights_context_ok
    ON diva_insights (context_key) WHERE status = 'ok';
```

### 5.2 Contraintes

- `context_key` : SHA-256 du contexte (tenant, company_id, mode, card_key, date_start, date_end). Permet le lock et la recherche rapide.
- `card_key` : NULL pour `mode = cockpit`, requis et non vide pour `mode = card` (contrainte CHECK).
- `flash_json` : Flash complet `{ headline, what_i_see, to_check, confidence }` pour flexibilité UI, future DLP, debug sans repasser par Mistral. Affichage par défaut : `message_text`.
- `generated_from_runner` : `true` si créé par le runner planifié ; `false` si warmup opportuniste ou refresh manuel.

### 5.3 TTL et politique de purge

- **TTL** : 5–15 min (configurable via `INSIGHTS_TTL_MINUTES`). Au-delà de `expires_at`, l'insight n'est plus considéré frais.
- **Purge** : job exécuté toutes les heures (cron ou tâche planifiée). Préférer une **suppression par lots** (voir §5.5) plutôt qu'un `DELETE` massif, pour éviter les blocages longs.

### 5.4 Politique d'erreur : ne rien écrire

**Si Mistral échoue : ne rien écrire dans la table.**

- On conserve le dernier insight `ok` existant (s'il y en a un).
- La table reste **pure** : uniquement du consommable.
- Optionnel : log + métrique (Prometheus, etc.) pour monitoring.
- Pas d'insert `status = error` en v1. Le schéma autorise `error` (réservé v2 pour suivi des erreurs récurrentes) mais **jamais écrit en v1** — table pure.

### 5.5 Robustesse SQL (consolidée — v1.1 corrigée)

#### Périmètre transactionnel et verrou

| Approche | Verrou | Pendant l'appel Mistral | Risque |
|----------|--------|-------------------------|--------|
| **A (xact)** | `pg_advisory_xact_lock` | Transaction ouverte, connexion tenue | Longues transactions, « idle in transaction » |
| **B (session)** | `pg_advisory_lock` (session) | Pas de transaction pendant Mistral, lock tenu | Connexion tenue pour le lock, mais transactions courtes |

**Recommandation :** Approche **B** (session lock) pour éviter toute transaction longue pendant l'appel Mistral.

#### Timeout du lock (important)

`SET LOCAL lock_timeout` ne s'applique que dans une transaction. Pour un lock session, deux options valides :

**Option 1 (recommandée)** : appliquer le timeout au niveau connexion, puis restaurer (ou utiliser une connexion dédiée du pool pour generate) :

```sql
SET lock_timeout = '120s';
SELECT pg_advisory_lock(lock_key_bigint);
-- ... travail ...
SELECT pg_advisory_unlock(lock_key_bigint);
RESET lock_timeout;
```

**Option 2** : envelopper l'acquisition dans une transaction courte (le lock session restera tenu après COMMIT) :

```sql
BEGIN;
SET LOCAL lock_timeout = '120s';
SELECT pg_advisory_lock(lock_key_bigint);
COMMIT;
```

En cas de dépassement du timeout, l'API retourne **503 Service Unavailable**.

#### Construction de la clé de lock (éviter collisions)

Ne pas utiliser `hashtext()` (32 bits) : on dispose déjà de `context_key` (SHA-256 hex 64 chars). La clé de lock est un bigint dérivé des 64 premiers bits du SHA-256.

**PostgreSQL (référence) :**

```sql
SELECT pg_advisory_lock(
    ('x' || substr(context_key, 1, 16))::bit(64)::bigint
);
```

**Go (implémentation) :**

1. Calculer SHA-256 binaire du contexte
2. Prendre les 8 premiers octets
3. Interpréter en big-endian
4. Convertir en `int64` et passer à `pg_advisory_lock`

*Note :* le big-endian doit être explicite pour garantir la même clé de lock entre SQL et Go.

**Format `context_key`** : `tenant|company_id|mode|{card_key ou ''}|date_start|date_end`. Pour cockpit, `card_key` → chaîne vide (jamais `"null"`).

#### Séquence robuste (session lock, double-check)

Objectif : éviter les doubles appels Mistral, éviter les longues transactions, et garantir l'idempotence même sous retry.

1. **Acquérir le lock** session sur `lock_key_bigint` avec timeout (cf. ci-dessus).

2. **Transaction courte — check #1** : si insight frais identique → 204
   ```sql
   BEGIN;
   SELECT 1
   FROM diva_insights
   WHERE context_key = $1
     AND status = 'ok'
     AND expires_at > now()
     AND payload_hash = $2
   LIMIT 1;
   COMMIT;
   ```
   Si trouvé : `pg_advisory_unlock` puis retour 204.

3. **Appel Mistral** hors transaction (lock toujours tenu).

4. **Transaction courte — check #2 + insert** : re-check puis insert
   ```sql
   BEGIN;
   -- Re-check pour éviter insert en cas de course (retry, double call, etc.)
   SELECT 1
   FROM diva_insights
   WHERE context_key = $1
     AND status = 'ok'
     AND expires_at > now()
     AND payload_hash = $2
   LIMIT 1;
   -- Si non trouvé, INSERT
   INSERT INTO diva_insights (
     tenant, company_id, mode, card_key,
     date_start, date_end,
     context_key, payload_hash,
     message_text, flash_json,
     status, confidence, model, latency_ms,
     expires_at, generated_from_runner
   ) VALUES (
     $tenant, $company_id, $mode, $card_key,
     $date_start, $date_end,
     $context_key, $payload_hash,
     $message_text, $flash_json,
     'ok', $confidence, $model, $latency_ms,
     $expires_at, $generated_from_runner
   );
   COMMIT;
   ```

5. **Libérer le lock** session : `SELECT pg_advisory_unlock(lock_key_bigint);`

#### Insert : idempotence et unique_violation

Avec le lock, les conflits sont rares. En cas de `unique_violation` (Postgres 23505) sur l'index unique `(context_key, payload_hash) WHERE status='ok'` : traiter comme succès (équivalent 204/200 selon convention), puis unlock.

#### Index pour la lecture GET (context_key)

GET calcule `context_key` côté API et filtre par `WHERE context_key = $1`. Index recommandé (déjà présent) :

```sql
CREATE INDEX idx_diva_insights_context_ok
    ON diva_insights (context_key) WHERE status = 'ok';
```

#### Purge : suppression par lots (déterministe)

Éviter les `DELETE` massifs. Purge par lots, avec ordre déterministe :

```sql
-- À exécuter en boucle jusqu'à 0 lignes supprimées
WITH batch AS (
  SELECT id
  FROM diva_insights
  WHERE expires_at < now() - interval '1 hour'
  ORDER BY id
  LIMIT 500
)
DELETE FROM diva_insights
WHERE id IN (SELECT id FROM batch);
```

#### Pool de connexions

Un appel `generate` garde une connexion pendant la durée du lock + Mistral.

- **Règle** : `DB_MAX_OPEN_CONNS ≥ (max jobs Mistral simultanés + marge GET)`.
- Variables formelles : `DB_MAX_OPEN_CONNS`, `DB_MAX_IDLE_CONNS`, `DB_CONN_MAX_LIFETIME` (voir §11).

#### Notes d'implémentation

- **Go — unlock en defer** : toujours appeler `pg_advisory_unlock` dans un `defer`, même si Mistral crash, timeout ou `context.Context` annulé. Sinon le lock reste tenu et bloque les générations ultérieures pour ce contexte.
- **Option 1 — RESET en erreur** : avec `SET lock_timeout`, faire `RESET lock_timeout` même en cas d'erreur, sinon la connexion retournée au pool garde le timeout et peut impacter d'autres requêtes. Variante simple : utiliser une connexion dédiée du pool pour `generate` et la rendre propre à la fin (unlock + reset) avant restitution.

---

## 6. API

### 6.1 GET /diva/insights (DIVA) — lecture insight

**But :** Retourner l'insight le plus récent non expiré pour le contexte demandé.

**Requête SQL (explicite) :**

Calculer `context_key` côté API à partir des paramètres (`tenant`, `company_id`, `mode`, `card_key`, `date_start`, `date_end`) puis :

```sql
SELECT *
FROM diva_insights
WHERE context_key = $1
  AND status = 'ok'
  AND expires_at > now()
ORDER BY created_at DESC
LIMIT 1;
```

Paramètre : `$1` = context_key (SHA-256 du contexte). Plus simple, plus rapide et plus robuste qu'un filtre sur 6 colonnes.

**Paramètres API :**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `tenant` | string | ✓ | Identifiant tenant |
| `company_id` | integer | | 0 par défaut |
| `mode` | string | ✓ | `cockpit` ou `card` |
| `card_key` | string | si mode=card | `treasury_validated_pct`, `cash`, etc. |
| `period` | string | * | `YTD`, `MTD`, `current_month` |
| `date_start` | string | * | Si `period` absent |
| `date_end` | string | * | Si `period` absent |
| `timezone` | string | | Fuseau pour résoudre period → dates (défaut `INSIGHTS_TIMEZONE`) |

*Au moins `period` ou `(date_start, date_end)` requis.*

**Réponse 200 :**

```json
{
  "insight": {
    "message_text": "La trésorerie disponible s'établit à 1 400 952 €. L'activité enregistrée atteint 1 162 748 €. Aucune trésorerie n'est certifiée à ce jour.",
    "flash": { "headline": "...", "what_i_see": [], "to_check": [], "confidence": "medium" },
    "confidence": "medium",
    "created_at": "2026-02-16T14:30:00Z",
    "expires_at": "2026-02-16T14:45:00Z"
  }
}
```

**Réponse 404 :** Aucun insight valide (expiré ou jamais généré).

**Réponse 400 :** Paramètres invalides.

---

### 6.2 GET /api/diva/insight (Linky) — proxy

**But :** Proxy vers DIVA avec paramètres dérivés du contexte utilisateur.

**Exemples :**

```
GET /api/diva/insight?mode=cockpit&period=YTD
GET /api/diva/insight?mode=card&card_key=cash&period=YTD
GET /api/diva/insight?mode=cockpit&date_start=2026-01-01&date_end=2026-02-16
```

Linky enrichit avec `tenant`, `company_id` depuis la session / configuration. Réponse : relaye le JSON DIVA ou 404.

---

### 6.3 POST /diva/generate (DIVA) — interne, runner uniquement

**But :** Générer un insight et le stocker. **Non exposé** au public. Appelé uniquement par le runner ou le warmup.

**Payload :** Identique à `POST /diva/explain/async` (context, dashboard, options). Structure détaillée : **§4.4 Payload IA**. Paramètre optionnel `generated_from_runner: boolean` pour tracer l'origine.

**Validation (400 Bad Request si invalide) :**

| Champ | Requis | Message si manquant |
|-------|--------|---------------------|
| `context.tenant` | ✓ | `context.tenant requis` |
| `context.date_start` | ✓ | `context.date_start requis` |
| `context.date_end` | ✓ | `context.date_end requis` |
| `dashboard.cards` | ✓, non vide | `dashboard.cards requis et non vide` |
| `options.focus_card` | ✓ si mode=card | `options.focus_card requis en mode card` |

**Comportement :**

1. Valider le payload ; si invalide → **400** avec message explicite.
2. Calculer `context_key` et `payload_hash`.
3. Acquérir le **lock session** sur context_key avec timeout (voir §5.5).
4. Si le lock n'est pas acquis avant le timeout → **503 Service Unavailable**.
5. Vérifier si insight existant `status = ok` et `expires_at > now()` avec même `payload_hash` → **204 No Content** (déjà à jour).
6. Sinon : appeler Mistral. **Si succès** : insérer dans `diva_insights` (context_key, message_text, flash_json, generated_from_runner). **Si échec** : ne rien écrire, log + métrique optionnels.
7. Relâcher le lock. Réponse : `200` (nouveau) ou `204` (inchangé) ou `500` (erreur Mistral).

**Authentification :** Token interne ou réseau privé. Non callable depuis l'Internet.

### 6.4 Protection contre la génération concurrente

**Problème :** Runner + warmup peuvent déclencher un `generate` pour le même contexte simultanément → double appel Mistral, race condition sur l'insert.

**Solution :** Verrouillage session sur **context_key**. Séquence complète (lock, double-check, Mistral, insert, unlock) : **§5.5 Robustesse SQL**. Timeout du lock : Option 1 (`SET lock_timeout` + `RESET`) ou Option 2 (transaction courte pour l'acquisition). Si timeout : **503 Service Unavailable**.

---

## 7. Runner

### 7.1 Fréquence

Toutes les **1 à 2 minutes** (configurable via `RUNNER_INTERVAL_SECONDS`).

### 7.2 Priorisation v1 (mode A)

**Objectif :** « Perçu instantané », pas « couverture totale ». Équilibre charge Mistral / valeur UX.

| Contexte | Runner | Warmup opportuniste |
|----------|--------|---------------------|
| **Cockpit** | YTD + MTD | — |
| **Cartes** | 2–3 max : `treasury_validated_pct`, `cash`, `business` | taxes, credit_notes, refunds, pos_shops, pos_z (quand l'utilisateur ouvre la carte) |

Les cartes non prioritaires ne sont générées **que** via warmup quand l'utilisateur ouvre une carte détaillée.

### 7.3 Boucle

Pour chaque (tenant, company_id) configuré :

1. **Périodes :** YTD, MTD.
2. **Source métriques :** Appel `GET /api/dashboard-metrics` (Linky) ou équivalent.
3. **Contextes à générer :**
   - 1 × cockpit par période
   - 2–3 × card par période (treasury_validated_pct, cash, business)
4. Pour chaque contexte : `POST /diva/generate` avec payload construit.
5. Concurrence : max 1–2 jobs Mistral simultanés (guard).

### 7.4 Priorisation future (v2)

Étendre à 8 cartes par période si la charge Mistral le permet.

### 7.5 Résilience

- Erreur : log warning, passer au contexte suivant. Ne jamais bloquer le runner.
- Pas de panic. Retry au cycle suivant.

---

## 8. Warmup opportuniste (Linky)

### 8.1 Déclenchement

Au chargement de la Home ou d'une carte Linky :

1. Récupérer `dashboard-metrics` (existant).
2. Vérifier si insight correspondant existe et est frais (GET /diva/insights).
3. Si **expiré ou absent** : déclencher `POST /diva/generate` en **fire-and-forget** (timeout 500–1000 ms).
4. Ne jamais bloquer l'affichage. Afficher le dernier insight valide ou « Analyse en cours ».

**Note UX (pas de boucle) :** En cas de **404** (insight absent ou expiré), Linky **ne fait pas de re-fetch en boucle**. Le warmup est déclenché une seule fois en fire-and-forget. La prochaine lecture proviendra du runner planifié ou d’une action utilisateur (ex. bouton Rafraîchir). Cela évite les requêtes répétitives et la charge inutile.

### 8.2 Fallback affichage

| Situation | Affichage |
|-----------|-----------|
| Insight trouvé, non expiré | `message_text` |
| Insight expiré, génération en cours | Dernier `message_text` si dispo, sinon « Analyse en cours » |
| Aucun insight | « Analyse en cours. Les données sont en cours de traitement. » |

---

## 9. Intégration Linky (affichage)

### 9.1 Home (cockpit)

1. Au mount : `GET /api/diva/insight?mode=cockpit&period=YTD` (ou période sélectionnée).
2. Afficher le bloc DIVA avec `message_text`.
3. Si 404 : afficher fallback, déclencher warmup en arrière-plan.

### 9.2 Vue carte (mode card)

1. Au mount : `GET /api/diva/insight?mode=card&card_key={key}&period=YTD`.
2. Afficher le message pour cette carte.
3. Si 404 : fallback + warmup.

### 9.3 Bouton « Rafraîchir »

Déclenche `POST /diva/generate` avec `force_refresh` (ou équivalent) pour forcer une nouvelle génération. Puis poll GET ou attendre prochain cycle selon implémentation.

---

## 10. Migration et compatibilité

### 10.1 Coexistence avec diva_analysis

- `diva_analysis` (existant) : reste pour le flux `POST explain/async` + poll (rétrocompat).
- `diva_insights` (nouveau) : table dédiée lecture instantanée.
- Option : le runner écrit dans les deux pendant transition, ou uniquement dans `diva_insights` si Linky bascule entièrement sur GET.

### 10.2 Dépréciation explain/async (optionnelle, v2)

Une fois GET insights stable, `POST /diva/explain/async` peut être déprécié pour l'UI Linky. Il reste utilisable en interne pour le runner / generate.

---

## 11. Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DIVA_DATABASE_URL` | — | URL Postgres (Vault). Requis pour diva_insights. |
| `DB_MAX_OPEN_CONNS` | — | Max connexions ouvertes. Règle : ≥ max jobs Mistral simultanés + marge GET. |
| `DB_MAX_IDLE_CONNS` | — | Max connexions idle. Éviter l'épuisement sous charge. |
| `DB_CONN_MAX_LIFETIME` | — | Durée max d'une connexion avant recyclage (ex. `1h`). |
| `RUNNER_INTERVAL_SECONDS` | `90` | Intervalle du runner (secondes). |
| `INSIGHTS_TTL_MINUTES` | `10` | TTL des insights (expires_at). |
| `INSIGHTS_TIMEZONE` | `Europe/Paris` | Fuseau pour le calcul des périodes YTD/MTD. |
| `INSIGHTS_LOCK_TIMEOUT` | `120` | Timeout du lock advisory (secondes). Si dépassé → 503. |
| *(purge)* | Cron horaire | Purge par lots (voir §5.5) : CTE + `ORDER BY id` + `LIMIT 500` en boucle jusqu'à 0 lignes |
| `RUNNER_TENANT_CONFIG` | — | Format `tenant:company_id1,company_id2;tenant2:0` |
| `DIVA_GENERATE_SECRET` | — | Secret pour authentifier POST /generate (optionnel). |

---

## 12. Plan d'implémentation

**Plan détaillé Scrum :** `PLAN_IMPLEMENTATION_DIVA_INSIGHTS_SCRUM.md` (sprints, stories, AC).

| Phase | Tâche | Estimation |
|-------|-------|------------|
| 1 | Créer table `diva_insights`, migrations SQL + job purge horaire | 0,5 j |
| 2 | hash_input + canonicalJSON (buildHashInput, toMinor, CARD_VALUE_SCALE) | 1 j |
| 3 | Implémenter `GET /diva/insights` (DIVA) | 0,5 j |
| 4 | Implémenter `POST /diva/generate` (lock, double-check, Mistral, insert) | 1,5 j |
| 5 | Adapter runner (cockpit + 2–3 cartes) pour alimenter diva_insights | 1 j |
| 6 | Créer `GET /api/diva/insight` (Linky proxy) | 0,5 j |
| 7 | Adapter DivaFlashBlock pour lecture GET uniquement | 1 j |
| 8 | Warmup opportuniste Linky | 0,5 j |
| 9 | Tests e2e, documentation | 1 j |

**Total estimé :** 6–8 jours.

---

## 13. Références

- `units/diva/internal/handlers/explain_async.go` — flux existant (buildHashInput à implémenter à part)
- `units/diva/internal/store/postgres_analysis_store.go` — schéma diva_analysis
- `units/dorevia-linky/app/api/dashboard-metrics/route.ts` — source métriques
- `units/dorevia-linky/app/api/diva/explain/async/route.ts` — payload explain
- `ZeDocs/web23/prompt_1.md` — prompt système DIVA v2
- `ZeDocs/web23/SPEC_CARD_CONTEXT_IA_v1.md` — format payload IA
- `ZeDocs/web23/INVENTAIRE_DONNEES_IA_PAR_CARTE.md` — traçabilité données par carte
- `ZeDocs/web23/PLAN_IMPLEMENTATION_DIVA_INSIGHTS_SCRUM.md` — plan Scrum (sprints, stories, AC)

---

**FIN SPEC — DIVA Insights v1.1**
