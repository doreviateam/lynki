# Spécification détaillée — Valeur du stock (Option B) pour laplatine2026

**Version :** 1.1  
**Date :** 2026-03-15  
**Référence :** ZeDocs/web52/RAPPORT_VALEUR_STOCK_LAPLATINE2026_v1.0.md (Option B retenue)

**Statut livraison :** ✅ Option B livrée et acceptée (2026-03-15). Recette Lot 6 clôturée (R6.1–R6.4) ; alignement métier vérifié (valorisation 14/03/2026 = 5122,03 €). Voir ZeDocs/web52/BILAN_RECETTE_LOT6_VALEUR_STOCK_OPTION_B_v1.0.md.

---

## 1. Objectifs et périmètre

### 1.1 Objectifs

- Exposer dans **Linky** la **valeur du stock** (valorisation inventaire) pour le tenant **laplatine2026**, en remplacement du badge « Hors périmètre » actuel sur la carte BFR.
- **Historiser** cette valeur dans le **Vault** par snapshots (Option B) : pas d’appel Odoo à la volée, série temporelle disponible pour un éventuel bloc « Évolution ».
- Rester conforme à l’**ADR-001** : Linky ne consomme que des APIs exposées par le Vault.

### 1.2 Périmètre

- **Tenant cible :** laplatine2026 (SARL La Platine).  
- **Société :** `company_id = odoo:1` (ou toute société configurée).  
- **Source de la valeur :** Odoo 18 (base `laplatine2026`), rapport *Inventaire → Analyse → Valorisation* (mode développeur activé ; source de vérité fonctionnelle).  
- **Fréquence des snapshots :** snapshot **quotidien de clôture** (job une fois par nuit, `as_of_date` = jour clos ; la journée est considérée figée).

### 1.3 Doctrine

- **Odoo** décide comment la valeur est calculée (méthode de valorisation, règles comptables).
- **Vault** n’interprète pas la méthode de valorisation ; Vault **historise** la valeur de stock produite par Odoo à une date donnée.
- **Linky** affiche cette valeur comme snapshot historisé.

Le snapshot ne décrit pas la méthode de valorisation Odoo, mais **historise la valeur de stock calculée par Odoo** pour une société donnée à une date donnée.

### 1.4 Sémantique temporelle

**Snapshot quotidien de clôture :** le job tourne **une fois par nuit** (ex. 02:00) ; `as_of_date` = **J-1 (toujours la veille du jour d’exécution)**. Ex. : exécution le 16/03 à 02:00 → snapshot enregistré pour le 15/03. La journée est figée ; idempotence garantie. Une seule valeur par (tenant, company_id, as_of_date).

**Règle canonique :** le snapshot ne stocke **que des valeurs valides**. Si Odoo n'arrive pas à produire une valeur (module désactivé, erreur, pas de donnée), **aucun snapshot n'est écrit** ; l'erreur part dans les logs / monitoring du job.

**Vue d'ensemble des endpoints :** écriture `POST /internal/stock-valuation-snapshot` ; lecture point `GET /ui/aggregations/stock-valuation` ; lecture série `GET /ui/aggregations/stock-series`.

---

## 2. Contrat d’API détaillé

### 2.1 Écriture — POST /internal/stock-valuation-snapshot

**Rôle :** enregistrer ou mettre à jour un snapshot de valorisation stock (upsert par `tenant` + `company_id` + `as_of_date`).

| Attribut | Valeur |
|----------|--------|
| **Méthode** | POST |
| **Chemin** | `/internal/stock-valuation-snapshot` |
| **Authentification** | Token interne (header ex. `Authorization: Bearer <token>` ou `X-Internal-Token` selon convention Vault). |
| **Content-Type** | `application/json` |

**Body (contrat minimal) :**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `tenant` | string | oui | Identifiant tenant (ex. `laplatine2026`). |
| `company_id` | string | oui | Identifiant société (ex. `odoo:1`). |
| `as_of_date` | string | oui | Date de référence, format `YYYY-MM-DD`. |
| `value` | number | oui | Valeur totale du stock (montant). |
| `currency` | string | oui | Devise (ex. `EUR`). |
| `source` | string | oui | Valeur fixe : `odoo.inventory.valuation`. |

**Exemple de body :**

```json
{
  "tenant": "laplatine2026",
  "company_id": "odoo:1",
  "as_of_date": "2026-03-15",
  "value": 12345.67,
  "currency": "EUR",
  "source": "odoo.inventory.valuation"
}
```

**Réponses :**

| Code | Signification |
|------|----------------|
| 200 | Snapshot enregistré ou mis à jour (upsert). Body optionnel : `{ "ok": true, "as_of_date": "2026-03-15" }`. |
| 400 | Paramètre manquant ou invalide (tenant, company_id, as_of_date, value, currency, source). Body : `{ "error": "message" }`. |
| 401 | Token interne manquant ou invalide. |
| 500 | Erreur interne (ex. base indisponible). |

**Comportement :** pour un même `(tenant, company_id, as_of_date)`, un nouvel envoi **remplace** l’enregistrement existant (upsert). Pas de création de doublon.

---

### 2.2 Lecture — GET /ui/aggregations/stock-valuation

**Rôle :** retourner la valeur de stock pour **un** point : soit le dernier snapshot connu, soit le snapshot à une date donnée.

| Attribut | Valeur |
|----------|--------|
| **Méthode** | GET |
| **Chemin** | `/ui/aggregations/stock-valuation` |
| **Authentification** | Selon politique Vault des routes `/ui/aggregations/*` (ex. aucune pour usage Linky interne). |

**Paramètres de requête :**

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `tenant` | string | oui | Ex. `laplatine2026`. |
| `company_id` | string | oui | Ex. `odoo:1`. |
| `as_of_date` | string (YYYY-MM-DD) | non | Si présent : retourne le snapshot à cette date. Si absent : retourne le **dernier** snapshot (as_of_date max) pour ce (tenant, company_id). |

**Réponse 200 (succès) :**

```json
{
  "value": 12345.67,
  "currency": "EUR",
  "as_of_date": "2026-03-15",
  "company_id": "odoo:1"
}
```

**Absence de snapshot :** si aucun snapshot n'existe pour les critères demandés, le serveur répond **404 Not Found** (pas de 200 avec body nul). Le client (Linky) doit traiter le 404 pour afficher « Aucun snapshot disponible » ou « Hors périmètre ».

**Réponses d'erreur :** 400 (tenant ou company_id manquant), 404 (aucun snapshot pour ce tenant/company_id/date), 500 (erreur interne).

---

### 2.3 Lecture — GET /ui/aggregations/stock-series

**Rôle :** retourner une **série** de snapshots sur une plage de dates (pour bloc « Évolution » Linky).

| Attribut | Valeur |
|----------|--------|
| **Méthode** | GET |
| **Chemin** | `/ui/aggregations/stock-series` |
| **Authentification** | Idem routes `/ui/aggregations/*`. |

**Paramètres de requête :**

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `tenant` | string | oui | Ex. `laplatine2026`. |
| `company_id` | string | oui | Ex. `odoo:1`. |
| `date_debut` | string (YYYY-MM-DD) | oui | Borne basse (inclusive) de la plage. |
| `date_fin` | string (YYYY-MM-DD) | oui | Borne haute (inclusive) de la plage. |

**Réponse 200 (succès) :**

```json
{
  "series": [
    { "period": "2026-03-01", "amount": 12000.00 },
    { "period": "2026-03-02", "amount": 12100.50 },
    { "period": "2026-03-15", "amount": 12345.67 }
  ],
  "currency": "EUR"
}
```

- `period` : date du snapshot (`as_of_date`).  
- `amount` : valeur (`value`) à cette date.  
- Les points sont ordonnés par `period` croissant. Les dates sans snapshot peuvent être omises (pas de trou comblé par 0 sans décision explicite).

**Série vide :** s'il n'y a **aucun point** sur la plage demandée, le serveur répond **200 OK** avec `{ "series": [], "currency": "EUR" }` (pas de 404). Plus pratique côté front pour une série vide.

**Réponses d'erreur :** 400 (paramètre manquant — tenant, company_id ou dates — ou date invalide), 500 (erreur interne).

---

## 3. Modèle de données Vault

### 3.1 Table `stock_valuation_snapshots`

Une seule table ; pas de table dédiée par tenant.

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Identifiant technique. |
| `tenant` | TEXT | NOT NULL | Ex. `laplatine2026`. |
| `company_id` | TEXT | NOT NULL | Ex. `odoo:1`. |
| `as_of_date` | DATE | NOT NULL | Date du snapshot. |
| `value` | NUMERIC(18,4) | NOT NULL | Valeur totale du stock. |
| `currency` | TEXT | NOT NULL, DEFAULT 'EUR' | Devise. |
| `source` | TEXT | NOT NULL, DEFAULT 'odoo.inventory.valuation' | Source fonctionnelle. |
| `valuation_method` | TEXT | NULL | Métadonnée optionnelle (hors contrat). |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Horodatage de **première** insertion (immuable à l'upsert). |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Horodatage de dernière modification. |

**Contrainte d’unicité :** `UNIQUE(tenant, company_id, as_of_date)`.

**Index :** `(tenant, company_id, as_of_date)` pour les requêtes par plage de dates et par tenant/company.

### 3.2 Migration SQL

Fichier : `sources/vault/migrations/044_stock_valuation_snapshots.sql`. Contenu canonique :

```sql
CREATE TABLE IF NOT EXISTS stock_valuation_snapshots (
  id                BIGSERIAL PRIMARY KEY,
  tenant            TEXT NOT NULL,
  company_id        TEXT NOT NULL,
  as_of_date        DATE NOT NULL,
  value             NUMERIC(18,4) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'EUR',
  source            TEXT NOT NULL DEFAULT 'odoo.inventory.valuation',
  valuation_method  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant, company_id, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_stock_valuation_tenant_company_date
  ON stock_valuation_snapshots(tenant, company_id, as_of_date);
```

---

## 4. Spécification Vault (implémentation)

### 4.1 Migration

- Ajouter un fichier de migration SQL exécuté au démarrage ou via outil de migration Vault.
- Vérifier l’existence de la table après déploiement (smoke test ou script de vérification).

### 4.2 Handler — POST /internal/stock-valuation-snapshot

- **Route :** enregistrée sur le groupe des routes internes (ex. préfixe `/internal/`), protégée par token interne.
- **Logique :**
  - Lire le body JSON ; valider la présence de `tenant`, `company_id`, `as_of_date`, `value`, `currency`, `source`.
  - Vérifier `source === "odoo.inventory.valuation"` (ou accepter toute valeur et stocker telle quelle selon politique).
  - `as_of_date` : parser en date (YYYY-MM-DD) ; rejeter en 400 si invalide.
  - Upsert en base : `INSERT INTO stock_valuation_snapshots (..., created_at, updated_at) VALUES (..., now(), now()) ON CONFLICT (tenant, company_id, as_of_date) DO UPDATE SET value = EXCLUDED.value, currency = EXCLUDED.currency, source = EXCLUDED.source, valuation_method = EXCLUDED.valuation_method, updated_at = now()` — **ne pas modifier `created_at`** (reste la date de première insertion).
  - Répondre 200 avec body minimal (ex. `{ "ok": true }`).
- **Erreurs :** 400 (validation), 401 (token), 500 (DB).

### 4.3 Handler — GET /ui/aggregations/stock-valuation

- **Route :** enregistrée sous le préfixe des agrégations UI (ex. `/ui/aggregations/stock-valuation`).
- **Logique :**
  - Lire `tenant`, `company_id` (obligatoires), `as_of_date` (optionnel). Rejeter 400 si tenant ou company_id manquant.
  - Si `as_of_date` fourni : `SELECT value, currency, as_of_date, company_id FROM stock_valuation_snapshots WHERE tenant = $1 AND company_id = $2 AND as_of_date = $3 LIMIT 1`.
  - Si `as_of_date` absent : `SELECT value, currency, as_of_date, company_id FROM stock_valuation_snapshots WHERE tenant = $1 AND company_id = $2 ORDER BY as_of_date DESC LIMIT 1`.
  - Si aucune ligne : **404 Not Found** (convention retenue : pas de 200 avec body nul).
  - Sinon 200 avec body `{ "value", "currency", "as_of_date", "company_id" }`.

### 4.4 Handler — GET /ui/aggregations/stock-series

- **Logique :**
  - Lire `tenant`, `company_id`, `date_debut`, `date_fin` (tous obligatoires). Rejeter 400 si l’un manque.
  - Parser les dates ; rejeter 400 si invalides ou si `date_fin < date_debut`.
  - `SELECT as_of_date, value, currency FROM stock_valuation_snapshots WHERE tenant = $1 AND company_id = $2 AND as_of_date >= $3 AND as_of_date <= $4 ORDER BY as_of_date`.
  - Construire `series: [ { period: as_of_date (format YYYY-MM-DD), amount: value }, ... ]`, `currency` (ex. première ligne ou défaut EUR). **Si aucun point : 200 avec `{ "series": [], "currency": "EUR" }`** (pas de 404).
  - Réponse 200 avec `{ "series", "currency" }`.

### 4.5 Configuration

- Aucune URL Odoo à configurer côté Vault pour l’Option B (les snapshots sont **poussés** par Odoo ou un job).  
- Token interne pour `POST /internal/stock-valuation-snapshot` : même mécanisme que les autres routes internes (variable d’environnement ou config).

---

## 5. Spécification Odoo (dorevia_vault_connector)

### 5.1 Logique de calcul de la valeur

- **Source de vérité :** rapport Odoo *Inventaire → Analyse → Valorisation* (mode développeur activé ; sémantique métier). Implémentation recommandée : lecture depuis `stock.valuation.layer` (ou logique équivalente) pour la société courante, somme des valeurs, à la date demandée (ou date du jour pour le cron).
- **Sortie :** en cas de **succès du calcul**, `value` (float) et `currency` (ex. société) — **y compris si la valeur est 0** (stock légitimement nul). En cas d'**échec de calcul** (module désactivé, erreur technique, impossibilité d'obtenir une valeur), **ne pas écrire de snapshot** ; logger l'erreur et la remonter dans le monitoring. À ne pas confondre : **valeur légitime à 0 → snapshot valide avec `value = 0`** ; **échec de calcul → pas de snapshot**.
- **Pas de décision métier Dorevia :** Odoo reste seul responsable de la méthode de valorisation (Standard, AVCO, FIFO) ; le connecteur ne fait qu’exposer la valeur produite par Odoo.

### 5.2 Job (cron) — Variante B1

- **Déclenchement :** planification **une fois par nuit** (ex. 02:00), en **snapshot de clôture** : `as_of_date` = **J-1 (date de la veille)**. Le cron qui tourne à 02:00 le 16/03 enregistre donc le snapshot pour le 15/03 (jour clos, figé). Règle unique : **toujours la veille du jour d’exécution du job**.
- **Paramètres configurables :** tenant (ex. `laplatine2026`), company_id (ex. `odoo:1`), URL Vault (ex. `http://vault-core-stinger:8080`), token interne.
- **Algorithme :**
  1. Pour chaque société configurée (ou la société par défaut) : calculer la valeur du stock (voir § 5.1) pour `as_of_date` = date de clôture retenue.
  2. Construire le body JSON (contrat minimal : tenant, company_id, as_of_date, value, currency, source).
  3. `POST <VAULT_URL>/internal/stock-valuation-snapshot` avec header d’authentification (token). Gestion des erreurs (log, retry optionnel).
- **Idempotence :** relancer le job pour la même date de clôture doit produire le même snapshot (upsert côté Vault) ; la valeur Odoo pour cette date étant figée, le résultat est stable.

### 5.3 Variante B2 (job externe)

- Si le job est externe (script Python, worker) : le script appelle d’abord un endpoint Odoo (ex. GET `/dorevia/vault/linky_stock_valuation` — à implémenter comme en Option A pour réutilisation) pour obtenir `value` et `currency` ; en cas de succès, envoie un POST au Vault avec le contrat minimal. En cas d'échec côté Odoo, ne pas poster de snapshot. Odoo n’a pas besoin de connaître l’URL du Vault.

---

## 6. Spécification Linky

### 6.1 Route API — GET /api/stock-valuation

- **Comportement :** proxy vers `VAULT_URL/ui/aggregations/stock-valuation`.
- **Paramètres :** transmettre `tenant`, `company_id` (obligatoires), `as_of_date` (optionnel) depuis la requête Linky (query string).
- **Headers :** transmettre les headers nécessaires (ex. `X-Tenant` si utilisé par le Vault). Pas d’exposition de token interne côté front.
- **Réponse :** renvoyer le body et le code HTTP du Vault (ou normaliser en 200 + body avec value/currency/as_of_date, et 404 ou 503 en cas d’erreur).
- **Timeout :** ex. 10 s.

### 6.2 Route API — GET /api/stock-evolution (ou nom dédié)

- **Comportement :** proxy vers `VAULT_URL/ui/aggregations/stock-series`.
- **Paramètres :** `tenant`, `company_id` (obligatoires), `date_debut`, `date_fin` (obligatoires). Transmis tels quels au Vault.
- **Réponse :** `{ series: [{ period, amount }], currency }` pour alimenter un bloc « Évolution » (courbe ou tableau).

### 6.3 Carte BFR (WorkingCapitalCard)

- **Comportement actuel :** la ligne « Stocks — Valorisation inventaire » affiche le badge « Hors périmètre ».
- **Comportement cible :**
  - Appel à `GET /api/stock-valuation` avec le `tenant` et `company_id` du contexte (même que le reste de la carte).
  - Si une valeur est retournée : afficher la valeur formatée (montant + devise) et la date du snapshot (`as_of_date`).
  - **Microcopy :** indiquer clairement que la valeur correspond au **dernier snapshot disponible** (ex. « Valeur au 15/03/2026 »), et non à un temps réel. Éviter toute formulation laissant penser à une interrogation live Odoo.
  - **Si le Vault répond 404 :** afficher « Aucun snapshot disponible » ou conserver « Hors périmètre ».
- **Optionnel :** bloc « Évolution » (série) alimenté par `GET /api/stock-evolution`, sur le même modèle que le bloc Évolution BFR net.

### 6.4 Fraîcheur des données

- La valeur affichée est celle du **dernier snapshot** présent dans le Vault ; elle reflète l’état Odoo à la date `as_of_date` du snapshot, **pas** une interrogation temps réel d’Odoo. Les libellés et tooltips doivent le préciser.

---

## 7. Critères d’acceptation et recette

### 7.1 Critères d’acceptation

| # | Critère |
|---|---------|
| AC1 | Un job (Odoo ou externe) envoie au moins un snapshot de clôture par jour pour laplatine2026 / company_id=odoo:1 avec le contrat minimal (tenant, company_id, as_of_date, value, currency, source). |
| AC2 | Le Vault enregistre le snapshot (table `stock_valuation_snapshots`) et répond 200 à un POST valide ; un second POST pour le même (tenant, company_id, as_of_date) met à jour la ligne (upsert) en ne modifiant que `updated_at`, pas `created_at`. |
| AC3 | GET /ui/aggregations/stock-valuation (tenant, company_id obligatoires, as_of_date optionnel) retourne 200 + valeur ou **404** si aucun snapshot ; GET /ui/aggregations/stock-series retourne une série cohérente. |
| AC4 | Linky GET /api/stock-valuation et GET /api/stock-evolution retournent les données proxyfiées du Vault sans erreur lorsque des snapshots existent. |
| AC5 | Sur la carte BFR, la ligne Stocks affiche la valeur du dernier snapshot (montant + devise + date) avec une microcopy indiquant la nature snapshotée (ex. « Valeur au … »). |
| AC6 | La valeur affichée dans Linky est alignée avec le rapport *Valorisation* Odoo pour la même société et la même date (recette manuelle ou script de comparaison). |
| AC7 | Relancer le job deux fois pour la même date ne crée pas de doublon et ne change pas le résultat (idempotence). |

### 7.2 Scénarios de recette (résumé)

1. **Écriture :** envoyer un POST avec body valide → 200 ; vérifier en base ou via GET stock-valuation que la ligne existe.  
2. **Upsert :** renvoyer le même (tenant, company_id, as_of_date) avec une autre valeur → 200 ; GET stock-valuation retourne la nouvelle valeur.  
3. **Lecture série :** après plusieurs snapshots sur des dates différentes, GET stock-series sur une plage → série ordonnée avec period/amount.  
4. **Linky :** ouvrir la carte BFR pour laplatine2026 → la ligne Stocks affiche un montant et une date (ou « Aucun snapshot » si aucun snapshot).  
5. **Alignement Odoo :** comparer la valeur affichée (et as_of_date) avec le rapport Valorisation Odoo pour la même date.

---

## Annexe A — Payloads et réponses d'exemple

**POST /internal/stock-valuation-snapshot** (body conforme au contrat minimal) :

```json
{
  "tenant": "laplatine2026",
  "company_id": "odoo:1",
  "as_of_date": "2026-03-15",
  "value": 12345.67,
  "currency": "EUR",
  "source": "odoo.inventory.valuation"
}
```

Exemple pour un cron à 02:00 le 16/03 : `as_of_date` = `"2026-03-15"` (J-1).

**GET /ui/aggregations/stock-valuation?tenant=laplatine2026&company_id=odoo:1** — 200 OK :

```json
{
  "value": 12345.67,
  "currency": "EUR",
  "as_of_date": "2026-03-15",
  "company_id": "odoo:1"
}
```

**GET /ui/aggregations/stock-valuation** (aucun snapshot pour ce tenant/company_id ou cette date) : **404 Not Found** (pas de body, ou body d’erreur selon convention Vault).

**GET /ui/aggregations/stock-series?tenant=laplatine2026&company_id=odoo:1&date_debut=2026-03-01&date_fin=2026-03-15** — 200 OK :

```json
{
  "series": [
    { "period": "2026-03-01", "amount": 12000.00 },
    { "period": "2026-03-02", "amount": 12100.50 },
    { "period": "2026-03-15", "amount": 12345.67 }
  ],
  "currency": "EUR"
}
```

**GET /ui/aggregations/stock-series** (aucun snapshot sur la plage) : **200 OK** avec `{ "series": [], "currency": "EUR" }` (pas de 404).

---

## 8. Références

- **Rapport web52 (Option B) :** ZeDocs/web52/RAPPORT_VALEUR_STOCK_LAPLATINE2026_v1.0.md  
- **ADR-001 :** ZeDocs/web51/ADR-001_LINKY_VAULT_GATEWAY_UNIQUE.md  
- **Carte BFR Linky :** `units/dorevia-linky/components/WorkingCapitalCard.tsx`  
- **Connecteur Odoo (ex. bank reconciliation) :** `units/odoo/custom-addons/dorevia_vault_connector/controllers/linky_bank_reconciliation.py`  
- **Odoo 18 — Valorisation des stocks :** [Using inventory valuation](https://www.odoo.com/documentation/18.0/fr/applications/inventory_and_mrp/inventory/product_management/inventory_valuation/using_inventory_valuation.html)  
- **Odoo 18 — Configuration :** [Automatic inventory valuation](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/product_management/inventory_valuation/inventory_valuation_config.html)

---

*ZeDocs/web52 — Spécification valeur du stock Option B laplatine2026 v1.1 — 2026-03-15 — 404 si absent, J-1 clôture, updated_at, annexe payloads.*
