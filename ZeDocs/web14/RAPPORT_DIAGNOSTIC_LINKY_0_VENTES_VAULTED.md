# Rapport de diagnostic — Pourquoi Dorevia Linky affiche 0 € alors que toutes les factures de vente sont vaultées avec attestation individuelle

**Date** : 2026-02
**Contexte** : Tenant sarl-la-platine ; Linky en HTTPS opérationnel ; carte « Ventes certifiées » affiche **0,00 €** alors que les factures clients Odoo sont protégées (statut « Facture protégée — Preuve validée par le coffre-fort numérique », attestation téléchargeable).
**Références** : SPEC_DOREVIA_LINKY_UI_v2.0, SPEC_DOREVIA_UI_CARD_SALES_v1.0, VERIFICATION_VAULT_DATE_AMOUNT_PAR_SCOPE.

---

## 1. Constat

| Élément             | État                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Dorevia Linky**   | Accessible en HTTPS (ui.lab.sarl-la-platine.doreviateam.com), carte « Ventes certifiées » affichée                 |
| **Montant affiché** | **0,00 €** (période affichée ex. 2026-01-31 → 2026-02-07)                                                          |
| **Odoo**            | Factures clients (FAC/2026/00030, etc.) avec total TTC ~914 093,53 € ; statut « Protégée », attestation disponible |
| **Vault**           | Les factures sont bien scellées (preuve, empreinte, référence de preuve visibles dans Odoo)                        |

**Question** : Pourquoi l’agrégation « Ventes certifiées » dans Linky ne reflète-t-elle pas ces montants ?

---

## 2. Chaîne de données : de Linky au Vault

1. **Linky** (page d’accueil) appelle en SSR le **Vault** via `GET /ui/aggregations/sales` avec les paramètres :

   * `tenant=sarl-la-platine`
   * `date_debut` / `date_fin` (période du mois en cours par défaut)
   * `granularity=month`

2. Le **Vault** exécute la fonction d’agrégation **ventes** (fichier `sources/vault/internal/storage/aggregations_sales.go`) qui interroge la table **`documents`** avec une requête SQL du type :

```sql
SELECT COALESCE(SUM(total_ttc), 0), ...
FROM documents
WHERE tenant = $1
  AND odoo_model = 'account.move'
  AND move_type = 'out_invoice'
  AND invoice_date IS NOT NULL
  AND total_ttc IS NOT NULL
  AND invoice_date >= $2
  AND invoice_date <= $3
```

3. **Conclusion technique** : Seuls les enregistrements qui ont **à la fois** `invoice_date` et `total_ttc` **non NULL** sont pris en compte dans le total. Si ces colonnes sont NULL pour les documents du tenant, le résultat est **0**.

---

## 2.1 Non-objectif

Pour éviter tout malentendu :

* **Linky ne lit pas Odoo** (aucune connexion directe à la base ou à l’API Odoo).
* **Linky ne lit pas l’attestation** (le fichier d’attestation téléchargeable n’est pas la source des données affichées).
* **Linky lit uniquement l’agrégation Vault** : elle appelle `GET /ui/aggregations/sales` sur le Vault et affiche le JSON retourné (total, période, badge certifié). La source de vérité pour la carte « Ventes certifiées » est donc **uniquement** la table `documents` du Vault et la requête d’agrégation qui la lit.

---

## 3. Cause racine à confirmer : métadonnées facture non remplies dans `documents`

Les factures sont bien **vaultées** (preuve, attestation) : une ligne existe dans le Vault pour chaque facture scellée. En revanche, **deux chemins distincts** alimentent le Vault :

| Chemin                                      | Rôle                                                                                                                                 | Remplit `invoice_date` / `total_ttc` ?                                                                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **POST /api/v1/events** (flux DVIG → Vault) | Création/mise à jour du document avec **métadonnées métier** (date, montants, move_type, etc.)                                       | **Oui** — le handler `events.go` extrait `payload.Payload["invoice_date"]`, `payload.Payload["amount_total"]`, etc. et remplit les colonnes `invoice_date`, `total_ttc`, `move_type`, `odoo_model`. |
| **Réception de la preuve / scellement**     | Enregistrement de la preuve (hash, JWS, ledger, statut « protégée ») sur le **même** document ou un document créé par un autre biais | **Pas automatiquement** — si le document a été créé ou mis à jour par un endpoint qui ne renseigne pas ces champs, ils restent NULL.                                                                |

**Hypothèse** : Pour sarl-la-platine, les documents sont bien créés et scellés (d’où l’attestation individuelle et le statut « Protégée »), mais les lignes en base n’auraient **pas** été remplies avec `invoice_date` et `total_ttc` (ou mismatch `move_type`/`odoo_model`, ou absence de ligne pour ce tenant). **À confirmer** : la preuve DB manque pour l’instant — il faut exécuter les requêtes SQL de la section 4 et interpréter les résultats (ex. `total_ttc` NULL, ou `total_documents = 0`, ou `eligibles_agregation = 0`). Causes possibles tant que non vérifié :

1. **Flux utilisé** : Les factures arrivent au Vault par un chemin qui n’est pas **POST /api/v1/events** (ou une variante qui remplit ces champs), par exemple uniquement via un endpoint de preuve qui ne met à jour que les champs de preuve.
2. **Format du payload** : Le flux DVIG → Vault envoie bien vers `/api/v1/events`, mais le payload ne contient pas les clés attendues (`invoice_date` ou `date`, `amount_total`, `move_type`, etc.) ou les types sont différents (chaîne au lieu de float pour le montant, etc.), donc le handler ne remplit pas les colonnes.
3. **Ordre des opérations** : Le document est d’abord créé avec preuve mais sans métadonnées ; l’event avec métadonnées n’est jamais envoyé ou n’est pas associé au même document (ex. autre tenant_id ou source_id).

Dans tous les cas, la requête d’agrégation **exclut** ces lignes à cause des conditions `invoice_date IS NOT NULL AND total_ttc IS NOT NULL`, d’où un total **0**.

---

## 3.1 Exemple d’attestation : les données existent côté Odoo

L’attestation téléchargeable (ex. FAC/2026/00030) a la structure suivante (extrait) :

```json
{
  "document": {
    "numero": "FAC/2026/00030",
    "date_facture": "2026-02-06",
    "montant_ttc": 2160.0,
    "devise": "EUR",
    ...
  },
  "preuve": {
    "reference_preuve": "8565fdce-c5e5-422b-b86d-70a95fcba4aa",
    "date_securisation": "2026-02-05T23:58:51",
    ...
  },
  "canonical_cfo": {
    "event_type": "invoice.posted",
    "invoice_number": "FAC/2026/00030",
    "invoice_date": "2026-02-06",
    "amount_total": 2160.0,
    "currency": "EUR",
    "invoice_direction": "out",
    "invoice_kind": "invoice",
    "proof_id": "8565fdce-c5e5-422b-b86d-70a95fcba4aa",
    "source": "odoo.stinger.sarl-la-platine",
    ...
  }
}
```

**Origine de ces blocs** : L’attestation complète (document + preuve + canonical_cfo) est **construite par Odoo** (module `dorevia_vault_connector`, controller `vault_controller.py`) au moment du téléchargement. Odoo fusionne :

* les **données métier** de la facture (move) → blocs `document` et `canonical_cfo` (numero, date_facture, montant_ttc, invoice_date, amount_total, etc.) ;
* les **données de preuve** déjà stockées dans Odoo après récupération au Vault (reference_preuve, attestation_jws, etc.) → bloc `preuve`.

Donc **invoice_date**, **amount_total** (TTC), **currency**, **event_type** sont bien disponibles — mais dans Odoo et dans le fichier d’attestation, pas nécessairement dans la table **`documents`** du Vault. L’agrégation Linky lit uniquement cette table ; si `invoice_date` et `total_ttc` n’y sont pas renseignés, le total reste 0.

**Piste de correction** : Voir section 5 (flux principal = event au moment du posted ; backfill = sync metadata depuis Odoo si besoin).

---

## 4. Vérification recommandée (base Vault)

### 4.1 Anti-hypothèse — valeurs réellement présentes

```sql
SELECT odoo_model, move_type, COUNT(*) AS n
FROM documents
WHERE tenant = 'sarl-la-platine'
GROUP BY 1,2
ORDER BY n DESC;
```

---

### 4.2 Diagnostic ciblé — factures client

```sql
SELECT
  COUNT(*) AS total_documents,
  COUNT(invoice_date) AS avec_invoice_date,
  COUNT(total_ttc) AS avec_total_ttc,
  COUNT(CASE WHEN invoice_date IS NOT NULL AND total_ttc IS NOT NULL THEN 1 END) AS eligibles_agregation
FROM documents
WHERE tenant = 'sarl-la-platine'
  AND odoo_model = 'account.move'
  AND move_type = 'out_invoice';
```

**Interprétation** :

* **total_documents = 0** → Aucune ligne facture client pour ce tenant ; problème en amont (flux d’envoi au Vault, tenant_id, ou filtre odoo_model/move_type).
* **total_documents > 0** mais **eligibles_agregation = 0** → Les factures sont bien présentes et marquées comme out_invoice, mais **invoice_date** et/ou **total_ttc** sont NULL → **cause confirmée** (métadonnées non remplies).
* **eligibles_agregation > 0** → Vérifier alors la **période** : s’assurer que `invoice_date` des lignes est bien dans la plage utilisée par Linky (ex. 2026-01-31 → 2026-02-07). Si toutes les dates sont hors période, le total peut encore être 0.

---

### 4.3 Facture témoin

```sql
SELECT id, tenant, invoice_number, invoice_date, total_ttc, odoo_model, move_type, currency, created_at
FROM documents
WHERE tenant = 'sarl-la-platine'
  AND invoice_number = 'FAC/2026/00030'
ORDER BY created_at DESC
LIMIT 5;
```

---

### 4.4 Résultats exécutés (2026-02-01)

Requêtes exécutées sur la base **vault-db-sarl-la-platine** (base `dorevia_vault`).

| Requête | Résultat |
|--------|----------|
| **4.1** (odoo_model, move_type) | Aucune ligne — aucun document pour `tenant = 'sarl-la-platine'`. |
| **4.2** (total_documents, avec_invoice_date, avec_total_ttc, eligibles_agregation) | **0 \| 0 \| 0 \| 0** → aucune ligne facture client pour ce tenant. |
| **4.3** (facture FAC/2026/00030) | Aucune ligne. |
| **Complément** — `SELECT COUNT(*) FROM documents` | **0** — la table `documents` est **vide** pour cette base. |

**Conclusion** : La cause n’est pas des métadonnées NULL sur des lignes existantes, mais **l’absence totale de lignes** dans `documents`. Soit les events (invoice.posted) ne sont pas envoyés vers ce Vault, soit ils ciblent une autre base / un autre tenant_id, soit le flux d’écriture en base n’est pas utilisé. Les attestations côté Odoo sont générées à partir des données Odoo + preuve récupérée au Vault ; la table `documents` utilisée par l’agrégation n’est pas alimentée pour sarl-la-platine.

---

## 5. Pistes de correction

**Stratégie recommandée** : La métadonnée (invoice_date, total_ttc, move_type, odoo_model) doit arriver au Vault **au moment de l’event** (invoice.posted), car c’est la source de vérité comptable. En complément, si les events n’ont pas été envoyés historiquement, un mécanisme de backfill (sync metadata depuis Odoo) peut rattraper les documents existants.

### 5.1 P0 — Flux principal : métadonnées à l’event (invoice.posted)

* **Objectif** : Chaque facture postée déclenche un envoi vers le Vault **POST /api/v1/events** (flux DVIG → Vault) avec un payload contenant au minimum :

  * `tenant`, `odoo_model` = `"account.move"`, `move_type` = `"out_invoice"`
  * `invoice_date` (format YYYY-MM-DD ou ISO 8601) ou `date`
  * `amount_total` (nombre, TTC) pour remplir `total_ttc`
  * éventuellement `amount_untaxed`, `currency_name`, etc.
* **Côté Vault** : le handler `events.go` remplit déjà `invoice_date`, `total_ttc`, `move_type`, etc. à partir de ce payload. Le flux principal doit donc être corrigé / vérifié en priorité pour que les **futures** factures alimentent correctement l’agrégation.

### 5.2 P1 — Backfill : sync metadata depuis Odoo (pragmatique si historique non couvert)

Si les events n’ont pas été envoyés (ou sans les bons champs) pour les factures déjà vaultées, Odoo peut effectuer un **sync metadata** idempotent : après récupération de la preuve (GET proof/account_move/:id) ou à la génération de l’attestation, Odoo envoie au Vault un **PATCH** ou **POST** « sync metadata » avec `invoice_date`, `total_ttc`, `move_type`, `odoo_model`, `tenant`, pour le document identifié par `proof_id` (ou odoo_id). Le Vault met à jour la ligne `documents` en conséquence. Prévoir un endpoint côté Vault (ex. PATCH /api/v1/documents/:id/metadata ou POST /api/v1/sync-invoice-metadata) et l’appeler depuis le connecteur Odoo (après fetch proof réussi, ou via un job/cron de backfill). Ce mécanisme est un **complément** pour rattraper l’historique, pas le flux principal.

### 5.3 Remplir les métadonnées à la réception de la preuve côté Vault (complément)

Si le document est créé ou mis à jour au moment du scellement (endpoint de preuve) et que le payload de preuve contient déjà date et montant, **adapter le handler de preuve** pour qu’il mette à jour `invoice_date` et `total_ttc` (et si besoin `move_type`, `odoo_model`) sur le document concerné.

### 5.4 Backfill ponctuel (optionnel)

Pour les documents **déjà** en base avec `invoice_date` et `total_ttc` à NULL, un script ou une requête de mise à jour (à partir d’une source fiable : export Odoo, API, ou payload stocké en JSON dans le Vault) peut renseigner ces colonnes pour les lignes concernées. À n’envisager qu’après avoir corrigé le flux pour les futurs documents.

---

## 6. Synthèse

| Question                               | Réponse                                                                                                                                                                                                                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pourquoi Linky affiche 0 € ?**       | **Cause confirmée** : la table `documents` du Vault (base sarl-la-platine) est **vide** (0 lignes). L’agrégation ne peut donc retourner que 0. Les attestations Odoo existent car Odoo construit l’attestation à partir de ses propres données + preuve ; les lignes d’agrégation ne sont pas créées dans le Vault. |
| **Les factures sont-elles vaultées ?** | Côté Odoo : **oui** (preuve, attestation). Côté Vault : **aucune ligne** dans `documents` pour ce tenant — le flux qui alimente cette table (events ou preuve) n’écrit pas dans cette base ou n’est pas utilisé.                                                                                             |
| **Que faire en priorité ?**            | (1) **P0** : Mettre en place ou corriger le flux Odoo → DVIG → Vault **POST /api/v1/events** à chaque invoice.posted, avec payload contenant `tenant`, `invoice_date`, `amount_total`, `move_type`, `odoo_model`, pour que les **futures** factures créent des lignes dans `documents`. (2) **P1** : Backfill (sync metadata ou ré-envoi d’events) pour les factures déjà scellées si besoin d’historique. |

---

## 7. Références techniques (code)

| Fichier                                                    | Rôle                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `sources/vault/internal/storage/aggregations_sales.go`     | Requête SQL d’agrégation ventes (`invoice_date`, `total_ttc` obligatoires).                           |
| `sources/vault/internal/handlers/events.go`                | Remplissage de `invoice_date`, `total_ttc`, `move_type`, etc. depuis `payload.Payload` (format DVIG). |
| `sources/vault/internal/handlers/invoices.go`              | Remplissage depuis `payload.Meta` (endpoint /api/v1/invoices).                                        |
| `ZeDocs/web13/VERIFICATION_VAULT_DATE_AMOUNT_PAR_SCOPE.md` | Document de référence sur date/montant par scope.                                                     |
| `ZeDocs/web14/OU_SONT_STOCKEES_LES_DONNEES_VAULTEES.md`   | Où sont stockées les données vaultées (Odoo, Vault, DVIG) et pourquoi Linky voit 0 €.                 |
