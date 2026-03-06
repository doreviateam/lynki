# Plan d’implémentation — Dorevia-UI Agrégations v1.0

**Références** : SPEC_DOREVIA_UI_AGGREGATIONS_v1.0, unit_appSmith.md, EVALUATION_SPEC_DOREVIA_UI_AGGREGATIONS_v1.0, VERIFICATION_VAULT_DATE_AMOUNT_PAR_SCOPE.  
**Périmètre v1** : factures (ventes / achats) + paiements certifiés. POS reporté à plus tard.

---

## 1. Vue d’ensemble

| Phase | Objectif | Livrable principal |
|-------|----------|--------------------|
| **0** | Prérequis | Appsmith opérationnel, DNS, Caddy, accès read-only à la donnée Vault |
| **1** | API agrégations | Endpoint read-only tenant-scoped exposant agrégations (factures, paiements) |
| **2** | Données côté Vault | Vue SQL ou requêtes d’agrégation sur `documents` (factures en colonnes, paiements via `payload_json`) |
| **3** | Appsmith — cards | Pages avec filtres (période, granularité) + cards Ventes certifiées + Paiements certifiés |
| **4** | Optionnel v1 | Achats, mini-graphs, polish UX |

---

## 2. Phase 0 — Prérequis (déjà en grande partie faits)

| # | Tâche | Statut | Note |
|---|--------|--------|------|
| 0.1 | Unit Appsmith déployée (`units/appsmith/`) | ✅ | docker-compose, volumes, Caddy |
| 0.2 | DNS `ui.lab.<tenant>.doreviateam.com` | À valider | core + sarl-la-platine |
| 0.3 | Appsmith accessible (Hello Dorevia-UI) | À valider | Première page créée |
| 0.4 | Décision : où héberger l’API Dorevia-UI ? | À faire | Vault (nouvel endpoint) vs microservice dédié vs autre |

**Definition of Done Phase 0** : On peut ouvrir https://ui.lab.<tenant>.doreviateam.com, se connecter à Appsmith, et une page « Hello Dorevia-UI » existe. Choix d’architecture pour l’API agrégations acté.

---

## 3. Phase 1 — API agrégations (read-only, tenant-scoped)

**Principe** : Appsmith consomme **uniquement** une API Dorevia-UI read-only. Pas d’accès direct Appsmith → DB Vault.

### 3.1 Spécification de l’API

| Élément | Contenu |
|--------|--------|
| **Méthode** | `GET` |
| **Chemin proposé** | `/api/v1/aggregations` (ou `/api/v1/ui/aggregations`) |
| **Paramètres** | `scope`, `date_debut`, `date_fin`, `granularity`, `tenant` (ou déduit du token / header) |
| **Réponse** | Liste de `{ period, total }` (ex. période = jour/semaine/mois, total = somme des montants) |

**Scopes v1** :

- `invoice.posted` (ventes) — colonnes `invoice_date`, `total_ttc` ; filtre `odoo_model = 'account.move'` et éventuellement `move_type` pour ventes.
- `invoice.posted.achats` (achats) — même modèle, filtre `move_type` achats.
- `payment.posted` (paiements) — extraction `payload_json->>'payment_date'`, `payload_json->>'amount'`.

**Sécurité** : authentification + tenant-scoped (aucune donnée inter-tenant).

### 3.2 Tâches Phase 1

| # | Tâche | Dépendance |
|---|--------|-------------|
| 1.1 | Définir le contrat API (OpenAPI ou doc) : paramètres, réponses, codes erreur | — |
| 1.2 | Décider où implémenter l’endpoint (Vault vs service dédié) | 0.4 |
| 1.3 | Implémenter l’endpoint agrégations (backend) | 1.1, 1.2, Phase 2 |
| 1.4 | Exposer l’API à Appsmith (URL, auth, CORS si besoin) | 1.3 |

**Definition of Done Phase 1** : `GET /api/v1/aggregations?scope=invoice.posted&date_debut=2026-01-01&date_fin=2026-01-31&granularity=month&tenant=core` retourne un JSON `[{ "period": "2026-01", "total": 12345.67 }, ...]` avec des données cohérentes (lecture Vault read-only, tenant-scoped).

---

## 4. Phase 2 — Données côté Vault (agrégation)

**Objectif** : Pouvoir exécuter les agrégations soit en SQL (vue ou requête), soit dans le code du service qui expose l’API.

### 4.1 Factures (invoice.posted)

| # | Tâche | Détail |
|---|--------|--------|
| 2.1 | Requête / vue « ventes » | `SELECT invoice_date AS event_date, total_ttc AS amount FROM documents WHERE odoo_model = 'account.move' AND tenant = $1 AND invoice_date BETWEEN $2 AND $3` (et filtre move_type ventes si besoin). |
| 2.2 | Agrégation par période | Dans l’API ou en SQL : `time_bucket(event_date, granularity)` (PostgreSQL) ou équivalent, `SUM(amount)`, `GROUP BY period`. |

**Source** : table `documents`, colonnes `invoice_date`, `total_ttc` (ou `total_ht`).

### 4.2 Paiements (payment.posted)

| # | Tâche | Détail |
|---|--------|--------|
| 2.3 | Extraire date et montant | `(payload_json->>'payment_date')::date AS event_date`, `(payload_json->>'amount')::numeric AS amount` depuis `documents` où `source = 'payment'`. |
| 2.4 | Option : vue SQL | Créer une vue `v_documents_payments` (tenant, event_date, amount) pour simplifier l’API et les performances. |
| 2.5 | Agrégation par période | Même logique que 2.2 sur `event_date` et `amount`. |

**Definition of Done Phase 2** : Le backend de l’API agrégations peut, pour un tenant donné et une période, retourner les totaux par période pour les scopes `invoice.posted` (ventes) et `payment.posted` (paiements), sans écriture, en lecture seule sur `documents`.

---

## 5. Phase 3 — Appsmith (cards et filtres)

**Objectif** : Tableau de bord avec filtres globaux et cards « Ventes certifiées » et « Paiements certifiés ».

### 5.1 Filtres globaux

| # | Tâche | Détail |
|---|--------|--------|
| 3.1 | Filtre période | Champs `date_debut`, `date_fin` (DatePicker ou équivalent), valeur par défaut (ex. mois en cours). |
| 3.2 | Filtre granularité | Sélection `day` / `week` / `month`. |
| 3.3 | Lier les filtres aux appels API | Tous les appels vers l’API agrégations utilisent ces paramètres. |

### 5.2 Cards

| # | Tâche | Détail |
|---|--------|--------|
| 3.4 | Card « Ventes certifiées » | Appel API `scope=invoice.posted` (et filtre ventes si besoin), affichage du total sur la période (et optionnellement par sous-période). Texte type : « Ventes certifiées », montant, période, badge « Données certifiées ». |
| 3.5 | Card « Paiements certifiés » | Appel API `scope=payment.posted`, même principe. |
| 3.6 | (Optionnel) Mini-graph | Courbe ou barres par période (day/week/month) à partir de la liste `[{ period, total }]`. |

### 5.3 Intégration

| # | Tâche | Détail |
|---|--------|--------|
| 3.7 | Configurer l’URL de l’API dans Appsmith | Base URL de l’API Dorevia-UI (tenant-scoped si besoin). |
| 3.8 | Gestion des erreurs et chargement | Messages clairs si l’API est indisponible ou renvoie une erreur. |

**Definition of Done Phase 3** : Sur une page Appsmith, l’utilisateur choisit une période et une granularité, et voit les cards « Ventes certifiées » et « Paiements certifiés » avec les montants corrects (données issues de l’API read-only). Pas d’accès direct à la DB Vault depuis Appsmith.

---

## 6. Phase 4 — Optionnel v1

| # | Tâche | Priorité |
|---|--------|----------|
| 4.1 | Scope achats | `invoice.posted` filtré par `move_type` achats ; card « Achats certifiés ». |
| 4.2 | Mini-graphs | Graph par période pour ventes et/ou paiements. |
| 4.3 | UX / polish | Libellés, unités (€), format des dates, responsive. |
| 4.4 | Nomenclature | Unifier `payment.captured` → `payment.posted` dans la spec et le code si ce n’est pas déjà fait. |

---

## 7. Hors périmètre v1 (plus tard)

| Élément | Commentaire |
|--------|-------------|
| **POS** | Scope `ticket.closed` et cards POS : on verra le POS après (voir SPEC et VERIFICATION_VAULT_DATE_AMOUNT_PAR_SCOPE). |
| **Impayés / Cash net / Ratios** | Peuvent s’appuyer sur le même socle d’agrégation une fois ventes + paiements en place. |

---

## 8. Ordre recommandé et jalons

```
Phase 0 (prérequis)     → Phase 1 (contrat API + décision hébergement)
                       → Phase 2 (requêtes / vues Vault)
                       → Phase 1.3–1.4 (implémentation endpoint + exposition)
                       → Phase 3 (Appsmith : filtres + cards)
                       → Phase 4 (optionnel)
```

**Jalons** :

1. **J1** : Contrat API validé + décision Vault vs microservice.
2. **J2** : Endpoint agrégations opérationnel pour `invoice.posted` et `payment.posted` (testé en curl/Postman).
3. **J3** : Page Appsmith avec filtres + 2 cards (Ventes, Paiements) alimentées par l’API.
4. **J4** : Optionnel — achats, mini-graphs, polish.

---

## 9. Risques et parades

| Risque | Parade |
|--------|--------|
| Accès DB Vault depuis un nouveau service | Utiliser un utilisateur PostgreSQL en lecture seule (SELECT uniquement) et une connexion dédiée. |
| Performance agrégations sur gros volumes | Index sur (tenant, invoice_date), (tenant, source) ; vue matérialisée si besoin pour paiements. |
| Auth API pour Appsmith | Token ou API key tenant-scoped ; pas d’auth utilisateur Vault complète exposée à Appsmith. |

---

## 10. Références

- **Spec** : `ZeDocs/web13/SPEC_DOREVIA_UI_AGGREGATIONS_v1.0.md`
- **Demande initiale** : `ZeDocs/web13/unit_appSmith.md`
- **Évaluation** : `ZeDocs/web13/EVALUATION_SPEC_DOREVIA_UI_AGGREGATIONS_v1.0.md`
- **Vérification Vault** : `ZeDocs/web13/VERIFICATION_VAULT_DATE_AMOUNT_PAR_SCOPE.md`
- **Rapport installation Appsmith** : `ZeDocs/web13/RAPPORT_INSTALLATION_APPSMITH_DOREVIA_UI.md`
