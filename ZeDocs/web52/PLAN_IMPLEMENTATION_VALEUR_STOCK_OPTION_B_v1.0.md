# Plan d'implémentation — Valeur du stock (Option B) laplatine2026

**Version :** 1.0  
**Date :** 2026-03-15  
**Référence :** ZeDocs/web52/SPEC_VALEUR_STOCK_OPTION_B_LAPLATINE2026_v1.0.md — version 1.1 du document (spec).  
**Document d'entrée :** RAPPORT_VALEUR_STOCK_LAPLATINE2026_v1.0.md (Option B retenue).

**Objectif :** Plan opérationnel pour livrer la valeur du stock (valorisation inventaire) dans Linky pour le tenant laplatine2026, via snapshots en base Vault (Option B). Doctrine : **Odoo calcule → Vault historise → Linky affiche**. Snapshot de clôture J-1, 404 si absent, pas de snapshot invalide.

---

## 1. Critères de clôture (livrable)

La fonctionnalité est considérée livrée lorsque :

- [x] **Vault :** Table `stock_valuation_snapshots` en place (migration 044) ; `POST /internal/stock-valuation-snapshot` (token interne) accepte le body minimal et fait upsert (created_at immuable, updated_at mis à jour) ; `GET /ui/aggregations/stock-valuation` (tenant, company_id obligatoires) retourne 200 + valeur ou **404** si aucun snapshot ; `GET /ui/aggregations/stock-series` (tenant, company_id, date_debut, date_fin) retourne la série.
- [x] **Odoo :** Un job (cron B1 ou script B2) tourne **une fois par nuit** (ex. 02:00), calcule la valeur du stock pour la société configurée avec **as_of_date = J-1** ; en cas de succès (y compris valeur 0), envoie un POST au Vault ; en cas d'échec de calcul, **aucun snapshot n'est écrit** (log + monitoring).
- [x] **Linky :** Routes `GET /api/stock-valuation` et `GET /api/stock-evolution` (proxy Vault) ; carte BFR affiche la valeur du dernier snapshot (montant + devise + date, microcopy « Valeur au … ») ou « Aucun snapshot disponible » / « Hors périmètre » si 404.
- [x] **Recette :** Valeur affichée dans Linky alignée avec le calcul Odoo (stock.valuation.layer) pour la même société et la même date ; idempotence du job vérifiée. *(R6.1 à R6.4 validés ; alignement vérifié par script au 14/03/2026 = 5122,03 €.)*

---

## 2. Backlog par lot

### Lot 1 — Vault : migration et modèle

| Id | Tâche | DoD |
|----|--------|-----|
| V1.1 | Exécuter la migration **044_stock_valuation_snapshots.sql** (table `stock_valuation_snapshots` : id, tenant, company_id, as_of_date, value, currency, source, valuation_method, created_at, updated_at ; UNIQUE(tenant, company_id, as_of_date) ; index). | Table créée ; pas de colonne `status`. |
| V1.2 | Vérifier que le mécanisme de migration Vault (démarrage ou outil dédié) exécute bien la 044. | Smoke test ou script de vérification : table présente après déploiement. |

---

### Lot 2 — Vault : endpoint d'écriture

| Id | Tâche | DoD |
|----|--------|-----|
| V2.1 | Handler **POST /internal/stock-valuation-snapshot** : route enregistrée sous le préfixe interne, protégée par token interne (même convention que les autres routes `/internal/`). | Route exposée ; 401 si token manquant ou invalide. |
| V2.2 | Validation du body : tenant, company_id, as_of_date (YYYY-MM-DD), value, currency, source obligatoires ; `source === "odoo.inventory.valuation"` (ou accepté tel quel). Rejet 400 si champ manquant ou date invalide. | 400 avec message explicite en cas d'erreur de validation. |
| V2.3 | Upsert en base : `INSERT ... ON CONFLICT (tenant, company_id, as_of_date) DO UPDATE SET value, currency, source, valuation_method, updated_at = now()` — **ne pas modifier created_at**. | 200 retourné ; en base, created_at inchangé à l'update. |
| V2.4 | Réponse 200 avec body minimal (ex. `{ "ok": true }`). Gestion 500 en cas d'erreur DB. | Comportement conforme à la spec § 2.1. |

---

### Lot 3 — Vault : endpoints de lecture

| Id | Tâche | DoD |
|----|--------|-----|
| V3.1 | Handler **GET /ui/aggregations/stock-valuation** : paramètres **obligatoires** tenant, company_id ; optionnel as_of_date. Rejet 400 si tenant ou company_id manquant. | Route enregistrée ; 400 si paramètre manquant. |
| V3.2 | Logique de lecture : si as_of_date fourni → SELECT pour (tenant, company_id, as_of_date) ; sinon → SELECT dernier snapshot (ORDER BY as_of_date DESC LIMIT 1). **Si aucune ligne : 404 Not Found** (pas de 200 avec body nul). | 200 + body { value, currency, as_of_date, company_id } ou 404. |
| V3.3 | Handler **GET /ui/aggregations/stock-series** : paramètres **obligatoires** tenant, company_id, date_debut, date_fin. Rejet 400 si manquant ou date invalide ou date_fin < date_debut. | Route enregistrée ; 400 si invalide. |
| V3.4 | SELECT as_of_date, value, currency WHERE tenant, company_id, as_of_date BETWEEN date_debut AND date_fin ORDER BY as_of_date ; construction de `{ series: [{ period, amount }], currency }`. **Si aucun point sur la plage : 200 + `{ "series": [], "currency": "EUR" }`** (pas de 404). | 200 + body conforme à la spec § 2.3. |

---

### Lot 4 — Odoo : calcul et job (B1)

| Id | Tâche | DoD |
|----|--------|-----|
| O4.1 | **Logique de calcul** (réutilisable) : lecture de la valorisation pour une société et une date (ex. `stock.valuation.layer` ou logique équivalente alignée sur le rapport *Inventaire → Analyse → Valorisation*) ; somme des valeurs ; devise de la société. **Valeur légitime à 0** (stock nul) → snapshot valide avec `value = 0`. **Échec de calcul** (module désactivé, erreur technique, impossibilité d'obtenir une valeur) → pas de snapshot, log + monitoring. | Succès → (value, currency) y compris value=0 ; échec → pas d'appel Vault. |
| O4.2 | **Cron (B1)** : planification une fois par nuit (ex. 02:00). **as_of_date = J-1** (date de la veille du jour d'exécution). Pour chaque société configurée : calcul pour as_of_date ; construction du body JSON (tenant, company_id, as_of_date, value, currency, source) ; POST vers `VAULT_URL/internal/stock-valuation-snapshot` avec token. | Cron déclenché ; as_of_date bien J-1 ; body conforme ; erreurs loguées. |
| O4.3 | **Configuration** : URL Vault, token interne, tenant, company_id (ex. laplatine2026, odoo:1) configurables (paramètres Odoo ou variables d'environnement). | Config documentée ; job utilisable pour laplatine2026. |
| O4.4 | **Idempotence** : relancer le job pour la même date (J-1) ne crée pas de doublon ; upsert côté Vault. | Recette : deux runs même date → même ligne, updated_at mis à jour, created_at inchangé. |

---

### Lot 5 — Linky : routes API et carte BFR

| Id | Tâche | DoD |
|----|--------|-----|
| L5.1 | Route **GET /api/stock-valuation** : proxy vers `VAULT_URL/ui/aggregations/stock-valuation` ; transmission des query params tenant, company_id, as_of_date ; pas d'exposition du token interne. Retour du code HTTP et du body Vault (200 ou 404). Timeout ex. 10 s. | Route opérationnelle ; 404 propagé si aucun snapshot. |
| L5.2 | Route **GET /api/stock-evolution** (ou nom dédié) : proxy vers `VAULT_URL/ui/aggregations/stock-series` ; paramètres tenant, company_id, date_debut, date_fin transmis au Vault. | Route opérationnelle ; body { series, currency }. |
| L5.3 | **Carte BFR (WorkingCapitalCard)** : appel à `GET /api/stock-valuation` avec le tenant et company_id du contexte. Si 200 : afficher valeur formatée (montant + devise) + date du snapshot ; microcopy du type « Valeur au DD/MM/AAAA ». **Si 404 :** afficher « Aucun snapshot disponible » ou conserver « Hors périmètre ». | Comportement conforme spec § 6.3. |
| L5.4 | (Optionnel) Bloc « Évolution » sur la carte ou vue dédiée, alimenté par `GET /api/stock-evolution`. | Si réalisé : série affichée (courbe ou tableau). |

---

### Lot 6 — Recette et mise en service

| Id | Tâche | DoD |
|----|--------|-----|
| R6.1 | **Recette Vault** : POST avec body valide → 200 ; GET stock-valuation après POST → 200 + même valeur ; GET sans snapshot → 404 ; GET stock-series sur une plage avec plusieurs snapshots → série ordonnée. Upsert : second POST même (tenant, company_id, as_of_date) → 200, GET retourne la nouvelle valeur ; created_at inchangé en base. | Scénarios passés. |
| R6.2 | **Recette Odoo** : exécution du cron (ou déclenchement manuel) pour J-1 ; vérification en base ou via GET que le snapshot est présent ; vérification que as_of_date = J-1. En cas de simulation d'échec (ex. module désactivé), aucun snapshot écrit. | Job validé. |
| R6.3 | **Recette Linky** : ouverture carte BFR pour laplatine2026 ; affichage de la valeur + date ou « Aucun snapshot disponible » si 404. **Alignement Odoo** : comparer la valeur affichée (et as_of_date) avec le rapport *Inventaire → Analyse → Valorisation* Odoo pour la même société et la même date. | Valeur cohérente avec Odoo. |
| R6.4 | **Idempotence** : relancer le job deux fois pour la même date (J-1) ; pas de doublon ; même valeur retournée par GET. | AC7 satisfait. |

---

## 3. Ordre d'exécution recommandé

1. **Lot 1** (Vault migration) — prérequis technique.
2. **Lot 2** (Vault POST) — permet d'envoyer des snapshots (manuel ou script de test).
3. **Lot 3** (Vault GET) — lecture point + série ; recette Vault possible.
4. **Lot 4** (Odoo calcul + cron) — alimentation automatique J-1 ; dépend de Lot 2.
5. **Lot 5** (Linky routes + carte BFR) — dépend de Lot 3.
6. **Lot 6** (Recette) — après mise en service du cron et au moins un snapshot disponible.

**Parallélisme possible :** Lot 2 et Lot 3 peuvent être développés en parallèle après Lot 1. Lot 5 peut démarrer dès que le contrat API Vault est stable (mock ou Vault en dev).

---

## 4. Références

- **Spec détaillée :** ZeDocs/web52/SPEC_VALEUR_STOCK_OPTION_B_LAPLATINE2026_v1.0.md  
- **Rapport Option B :** ZeDocs/web52/RAPPORT_VALEUR_STOCK_LAPLATINE2026_v1.0.md  
- **Migration SQL :** sources/vault/migrations/044_stock_valuation_snapshots.sql  
- **Carte BFR Linky :** units/dorevia-linky/components/WorkingCapitalCard.tsx  
- **Connecteur Odoo :** units/odoo/custom-addons/dorevia_vault_connector/  
- **ADR-001 :** ZeDocs/web51/ADR-001_LINKY_VAULT_GATEWAY_UNIQUE.md  

---

*ZeDocs/web52 — Plan implémentation valeur du stock Option B laplatine2026 v1.0 — 2026-03-15.*
