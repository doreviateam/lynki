# Checklist recette — Lot 6 Valeur du stock (Option B) laplatine2026

**Version :** 1.0  
**Date :** 2026-03-15  
**Référence :** ZeDocs/web52/PLAN_IMPLEMENTATION_VALEUR_STOCK_OPTION_B_v1.0.md (Lot 6), RAPPORT_EXECUTION_PLAN_VALEUR_STOCK_OPTION_B_v1.0.md

---

## Prérequis

- [ ] **Vault** : service démarré, migration 044 exécutée (table `stock_valuation_snapshots` présente).
- [ ] **Vault** : variable `STOCK_VALUATION_INTERNAL_TOKEN` (ou config équivalente) renseignée.
- [ ] **Odoo** : module `dorevia_vault_connector` à jour ; `stock_account` installé (pour calcul valorisation).
- [ ] **Odoo** : paramètres ou env : `dorevia.vault.url`, `dorevia.stock_valuation.token`, `dorevia.tenant` (ex. `laplatine2026`), optionnel `dorevia.stock_valuation.company_ids` (ex. `1`).
- [ ] **Linky** : `VAULT_URL` pointant vers le Vault de recette ; accès à la carte BFR pour le tenant laplatine2026.

**Conventions pour la checklist :**  
`VAULT_URL` = base URL du Vault (ex. `https://vault.xxx.doreviateam.com`)  
`TOKEN` = token interne stock valuation  
`TENANT` = `laplatine2026`  
`COMPANY_ID` = `odoo:1`

**Exécution automatique R6.1 (Vault) :**  
Un script exécute les scénarios R6.1.1 à R6.1.5 (POST, GET, 404, stock-series, upsert). À lancer une fois le Vault démarré et le token configuré :
```bash
VAULT_URL=http://localhost:8080 STOCK_VALUATION_INTERNAL_TOKEN=<token> ./scripts/recette_stock_valuation_lot6.sh
```
Depuis le réseau Docker : `VAULT_URL=http://vault-core-stinger:8080 STOCK_VALUATION_INTERNAL_TOKEN=... ./scripts/recette_stock_valuation_lot6.sh`  
Ou depuis un conteneur sur le même réseau (si le Vault n’expose pas de port sur l’hôte) :
```bash
docker run --rm --network dorevia-network -v $(pwd)/scripts/recette_stock_valuation_lot6.sh:/recette.sh:ro \
  -e VAULT_URL=http://vault-core-stinger:8080 -e STOCK_VALUATION_INTERNAL_TOKEN=<token> \
  alpine:latest sh -c "apk add --no-cache bash curl && bash /recette.sh"
```
**Note :** L’image Vault doit inclure les routes stock-valuation (ZeDocs/web52). Si POST renvoie 404, reconstruire et redéployer le Vault avec les sources à jour.

---

## R6.1 — Recette Vault

### R6.1.1 — POST avec body valide → 200

- [ ] Envoyer une requête **POST** vers `VAULT_URL/internal/stock-valuation-snapshot` avec :
  - Header : `Authorization: Bearer TOKEN`, `Content-Type: application/json`
  - Body : `{ "tenant": "TENANT", "company_id": "COMPANY_ID", "as_of_date": "YYYY-MM-DD", "value": 12345.67, "currency": "EUR", "source": "odoo.inventory.valuation" }`
- [ ] **Résultat attendu :** HTTP 200, body contenant `"ok": true` et `"as_of_date"`.

*Exemple curl :*
```bash
curl -s -w "\n%{http_code}" -X POST "$VAULT_URL/internal/stock-valuation-snapshot" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tenant":"laplatine2026","company_id":"odoo:1","as_of_date":"2026-03-14","value":12345.67,"currency":"EUR","source":"odoo.inventory.valuation"}'
```

### R6.1.2 — GET stock-valuation après POST → 200 + même valeur

- [ ] Envoyer **GET** `VAULT_URL/ui/aggregations/stock-valuation?tenant=TENANT&company_id=COMPANY_ID` (sans `as_of_date` pour avoir le dernier).
- [ ] **Résultat attendu :** HTTP 200 ; body avec `value`, `currency`, `as_of_date`, `company_id` cohérents avec le POST.

### R6.1.3 — GET sans snapshot → 404

- [ ] Envoyer **GET** pour un couple (tenant, company_id) ou un `as_of_date` pour lequel **aucun** snapshot n’existe.
- [ ] **Résultat attendu :** HTTP 404 (pas de 200 avec body vide).

### R6.1.4 — GET stock-series sur une plage

- [ ] Créer au moins 2 snapshots (dates différentes) ou utiliser une plage contenant plusieurs dates.
- [ ] **GET** `VAULT_URL/ui/aggregations/stock-series?tenant=TENANT&company_id=COMPANY_ID&date_debut=YYYY-MM-DD&date_fin=YYYY-MM-DD`
- [ ] **Résultat attendu :** HTTP 200 ; body `{ "series": [ { "period": "...", "amount": ... }, ... ], "currency": "EUR" }`, série ordonnée par date.

### R6.1.5 — Upsert : second POST même (tenant, company_id, as_of_date)

- [ ] Noter le `created_at` (en base ou via un outil) pour une ligne existante, ou le considérer comme « premier enregistrement ».
- [ ] Envoyer un **second POST** avec le **même** (tenant, company_id, as_of_date) et une **nouvelle** valeur (ex. 99999).
- [ ] **Résultat attendu :** HTTP 200.
- [ ] **GET** stock-valuation pour ce (tenant, company_id) et éventuellement as_of_date → la **nouvelle** valeur est retournée.
- [ ] **En base :** pour cette ligne, `updated_at` a changé ; **created_at** est **inchangé** (pas de nouvelle ligne, une seule ligne mise à jour).

**Validation R6.1 :** [x] Tous les points ci-dessus sont OK. *(Exécuté le 2026-03-15 après build `dorevia/vault:stock-valuation-2026-03-15` et redéploiement Vault core-stinger.)*

---

## R6.2 — Recette Odoo

### R6.2.1 — Exécution du cron (ou manuel) pour J-1

- [ ] S’assurer que la date du jour est au moins J+1 par rapport à une date pour laquelle Odoo a des données de valorisation (ex. hier = J-1).
- [ ] Déclencher le cron **« Vault Stock Valuation Snapshot (J-1) »** (Paramètres → Technique → Actions planifiées → Exécuter maintenant) ou appeler en shell : `model.env["dorevia.stock.valuation.push"].cron_push_stock_valuation_snapshot()`.
- [ ] **Résultat attendu :** pas d’erreur bloquante ; dans les logs, recherche de `stock_valuation_push: ok` pour le tenant/société configurée.

### R6.2.2 — Snapshot présent et as_of_date = J-1

- [ ] Appeler **GET** stock-valuation (Vault ou via Linky API) pour le tenant et company_id configurés.
- [ ] **Résultat attendu :** HTTP 200 ; `as_of_date` = date de la veille (J-1) du jour d’exécution.

### R6.2.3 — (Optionnel) Simulation échec calcul → aucun snapshot

- [ ] Désactiver temporairement le module `stock_account` (ou utiliser une société sans stock) ou provoquer une erreur dans le calcul.
- [ ] Relancer le cron.
- [ ] **Résultat attendu :** aucun nouveau snapshot écrit pour cette société (pas de POST ou POST non envoyé en cas d’erreur) ; erreur loguée, pas de crash.

**Validation R6.2 :** [x] Job exécuté (shell `odoo shell -d laplatine2026`) ; snapshot présent en Vault (as_of_date=2026-03-14, value=5122.03 €). Config Odoo : dorevia.vault.url, dorevia.stock_valuation.token, dorevia.tenant.

---

## R6.3 — Recette Linky (point de validation critique)

### R6.3.1 — Carte BFR laplatine2026

- [x] **API** : `GET /api/stock-valuation?tenant=laplatine2026&company_id=odoo:1` → 200 + body `{ value, currency, as_of_date, company_id }` *(vérifié le 2026-03-15 après déploiement image `dorevia/linky:stock-valuation-2026-03-15`).*
- [x] **UI** : Carte BFR laplatine2026 — bloc Stocks « Valorisation inventaire » : **5 122,03 €**, « Valeur au 14/03/2026 ». *(Valeur issue du cron Odoo ; capture après R6.2.)*

### R6.3.2 — Alignement avec le rapport Odoo Valorisation (critique)

- [ ] Noter la **valeur** et l’**as_of_date** affichées sur la carte BFR Linky.
- [ ] Dans Odoo (même société, ex. company_id = 1), ouvrir **Inventaire → Analyse → Valorisation** (rapport de valorisation des stocks).
- [ ] Filtrer ou sélectionner la **même date** que l’`as_of_date` du snapshot (J-1).
- [ ] **Résultat attendu :** la valeur totale affichée dans le rapport Odoo pour cette date est **alignée** avec la valeur affichée dans Linky (même montant, même devise). Écart toléré : arrondis ou délai de calcul (à documenter si besoin).

**Validation R6.3 :** [x] Carte BFR affiche **5 122,03 €** au 14/03/2026. [x] **Alignement métier :** calcul Odoo (stock.valuation.layer, 14/03/2026) = **5122,03 €** *(vérifié par script `scripts/odoo_stock_valuation_at_date.py` en shell laplatine2026).*

---

## R6.4 — Idempotence

- [ ] Choisir une date J-1 pour laquelle un snapshot existe déjà (ex. après R6.2).
- [ ] Noter la valeur actuelle retournée par GET stock-valuation pour (tenant, company_id) à cette date.
- [ ] Déclencher **une première fois** le cron Odoo (ou un POST manuel avec la même date) → 200.
- [ ] Noter `created_at` et `updated_at` de la ligne en base (si accès).
- [ ] Déclencher **une deuxième fois** le cron (ou un second POST identique) → 200.
- [ ] **Résultat attendu :**
  - Une seule ligne en base pour (tenant, company_id, as_of_date) ; pas de doublon.
  - GET stock-valuation retourne la même valeur (et la même date).
  - En base : `updated_at` a été mis à jour ; **created_at** est **inchangé**.

**Validation R6.4 :** [x] Deux runs même (tenant, company_id, as_of_date) → une seule ligne ; `updated_at` mis à jour (2026-03-15 16:48:17) ; `created_at` inchangé (2026-03-15 16:45:56). *(Vérifié en base après POST upsert.)*

---

## Clôture Lot 6

| Critère | OK |
|---------|-----|
| R6.1 — Recette Vault (POST, GET, 404, series, upsert) | [x] |
| R6.2 — Recette Odoo (cron J-1, snapshot présent, as_of_date) | [x] *Cron exécuté (DB laplatine2026) ; config dorevia.vault.url + stock_valuation.token + tenant ; snapshot poussé : as_of_date=2026-03-14, value=5122.03 €.* |
| R6.3 — Recette Linky (carte BFR + **alignement valeur Odoo**) | [x] |
| R6.4 — Idempotence | [x] |

**Livrable Option B considéré « accepté » lorsque les quatre critères sont cochés.** ✅ Les quatre critères R6.1 à R6.4 sont validés (alignement Odoo vérifié par calcul stock.valuation.layer au 14/03/2026 = 5122,03 €).

---

*ZeDocs/web52 — Checklist recette Lot 6 valeur du stock Option B v1.0 — 2026-03-15.*
