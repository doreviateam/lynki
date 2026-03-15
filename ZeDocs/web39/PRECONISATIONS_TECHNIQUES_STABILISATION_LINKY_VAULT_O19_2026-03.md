# Préconisations techniques — Stabilisation Linky / Vault / Odoo o19

**Auteur :** Revue technique indépendante  
**Date :** Mars 2026  
**Contexte :** Stabilisation du cockpit Linky après intégration Odoo 19 / DVIG / Vault

---

## 1. Résumé exécutif

L’architecture actuelle du système est globalement saine :

- **ERP (Odoo)** = source de vérité pour les chiffres opérationnels  
- **Vault** = source de vérité pour les preuves scellées  
- **Linky** = cockpit de visualisation  

Les préconisations ci-dessous ont été appliquées pour renforcer la **sécurité**, la **performance**, la **cohérence des données** et la **traçabilité des dégradations**.

---

## 2. Plan d’action et état d’implémentation

| Priorité | Préconisation | État | Fichiers / détails |
|----------|----------------|------|--------------------|
| 1 | Sécuriser l’endpoint Odoo (token interne) | ✅ Fait | Odoo : `_check_internal_token()` ; paramètre `dorevia.linky.internal.token` ou `ODOO_LINKY_INTERNAL_TOKEN`. Linky : `ODOO_O19_INTERNAL_TOKEN` / `LINKY_ODOO_INTERNAL_TOKEN` envoyé en `Authorization: Bearer`. |
| 2 | Remplacer `search` par `read_group` (agrégation SQL) | ✅ Fait | `linky_business_aggregation.py` : `_aggregate_moves_read_group()` avec `read_group(..., ["invoice_date:month"])`. |
| 3 | Tracer les fallbacks Vault (header + log) | ✅ Fait | Linky API : header `X-Data-Source: vault-fallback` lorsque les données business viennent du Vault après échec Odoo ; `console.warn` structuré. UI : « Source temporaire : Vault (ERP indisponible) ». |
| 4 | Valider le tenant côté serveur | ✅ Fait | Routes sales, purchases, dashboard-metrics : `tenant = process.env.TENANT_ID ?? DEFAULT_TENANT` (ignorer le paramètre client). |
| 5 | Timeouts configurables (Odoo) | ✅ Fait | Variable d’environnement `ODOO_TIMEOUT_MS` (défaut 5000 ms) utilisée pour les appels Linky → Odoo. |
| 6 | Observabilité (logs structurés) | ✅ Fait | Logs type `[api/sales] source=erp unavailable, fallback=vault` et équivalents purchases / dashboard-metrics. |
| 7 | Devise : société (multi-devise) | ✅ Fait | Odoo : `company.currency_id.name` au lieu de la devise de la première facture. |
| 8 | UX : libellé « Source : ERP (Odoo) » | ✅ Fait | Footer et cartes : « Vérité : indicateurs ERP » remplacé par « Source : ERP (Odoo) » / « Source : Vault ». |

---

## 3. Détails techniques

### 3.1 Sécurisation endpoint Odoo

- **Côté Odoo** : le contrôleur vérifie un token interne (header `Authorization: Bearer <token>` ou `X-Internal-Token: <token>`). Le token attendu est lu depuis `ir.config_parameter` (`dorevia.linky.internal.token`) ou la variable d’environnement `ODOO_LINKY_INTERNAL_TOKEN`. Si un token est configuré et que la requête ne le fournit pas ou l’invalide, réponse 403.
- **Côté Linky** : si `ODOO_O19_INTERNAL_TOKEN` ou `LINKY_ODOO_INTERNAL_TOKEN` est défini, il est envoyé en `Authorization: Bearer` sur tous les appels à l’endpoint Odoo (sales, purchases, dashboard-metrics).

### 3.2 Performance Odoo (read_group)

- Agrégation par mois déléguée à PostgreSQL via `read_group(domain, ["amount_total:sum", "amount_untaxed:sum"], ["invoice_date:month"])` pour factures et avoirs, puis fusion des séries et totaux nets.

### 3.3 Traçabilité fallback

- Lorsque Odoo est indisponible et que Linky renvoie des données Vault pour les agrégats business, la réponse HTTP inclut l’en-tête `X-Data-Source: vault-fallback`.
- L’UI (carte Business) affiche « Source temporaire : Vault (ERP indisponible) » lorsque ce header est présent.

### 3.4 Validation du tenant

- Les routes API qui utilisent le tenant (sales, purchases, dashboard-metrics) n’utilisent plus le paramètre `tenant` fourni par le client pour la décision métier : le tenant effectif est toujours `process.env.TENANT_ID` (ou `DEFAULT_TENANT`). Cela évite toute manipulation côté client.

### 3.5 Timeouts

- `ODOO_TIMEOUT_MS` (défaut 5000) est utilisé pour les requêtes vers l’endpoint Odoo dans `/api/sales`, `/api/purchases` et dans `fetchSealedSourcesO19()` de `/api/dashboard-metrics`.

### 3.6 Observabilité

- Logs serveur : `[api/sales] source=erp unavailable, fallback=vault` (et équivalents pour purchases et dashboard-metrics) en cas de fallback.

---

## 4. Verdict et suite

- **Architecture** : Bonne.  
- **Sécurité** : Renforcée (token, tenant serveur).  
- **Performance** : Optimisée (read_group).  
- **Robustesse** : Améliorée (timeouts, traçabilité fallback).  

Recommandation : poursuivre l’observabilité (métriques type taux de fallback, temps de réponse Odoo/Vault) et, si le volume augmente, envisager cache Redis ou API Odoo dédiée aux dashboards.

---

## 5. Références

- `DOCUMENT_REVUE_CODE_LINKY_VAULT_O19_2026-03.md` — revue de code et inventaire des fichiers.
- `RUNBOOK_STABILISATION_DONNEES_LINKY_O19.md` — procédures opérationnelles.
