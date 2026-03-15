# Rapport d'implémentation — Linky

**Date :** 13 mars 2026  
**Rédigé à la main** — Synthèse des livrables

---

## 1. Contexte

Suite au plan Scrum (PLAN_IMPLEMENTATION_SCRUM_LINKY_v1.0.md) et à l’avis expert, l’équipe a réalisé l’implémentation des 10 user stories prévues, puis une mise à jour du backend Vault (Go) et le branchement des nouvelles APIs dans le cockpit.

---

## 2. Livrables réalisés

### 2.1 Event Registry (US-01)

- **SPEC_DVIG_EVENT_REGISTRY_v1.0.md** créé
- Nomenclature des événements : raw, canonical, adjustment, reconciliation
- Mapping vers les métriques du Metric Registry
- Événement **payroll.charge.posted** documenté (§3.6)

### 2.2 Instruments BFR, Encours, EBE (US-02, US-03, US-04)

| Instrument | Composant | Statut |
|------------|-----------|--------|
| BFR | `WorkingCapitalCard` | ✅ Créances clients + dettes fournisseurs (si AP dispo) |
| Encours | `EncoursCard` | ✅ Encours clients, retard, top créanciers |
| EBE | `EbeCard` | ✅ Proxy marge brute ; EBE complet si payroll dispo |

### 2.3 Metric Engine (US-05, US-06, US-07)

- **DAG** : graphe de dépendances, tri topologique, détection de cycles
- **Cache** : TTL par métrique, invalidation granulaire par type d’événement
- **Executor** : calcul des métriques base + dérivées
- **Fetcher** : appels Vault (sales, purchases, payments, ar-by-partner, ap-by-partner, payroll)
- **API** : `GET /api/instruments` opérationnelle

### 2.4 Migration cockpit (US-08)

- Feature flag `NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE`
- `adaptInstrumentsToDashboard()` pour compatibilité avec les cartes existantes
- Bascule possible entre `dashboard-metrics` et `instruments`

### 2.5 Tests (US-09)

- **41 tests Vitest** : graph, cache, Pareto ABC, IconGrid
- Scripts `npm test` et `npm run test:watch`

### 2.6 Dépréciation (US-10)

- Headers HTTP sur `dashboard-metrics` : `Deprecation`, `Sunset: 2026-12-31`, `Link: /api/instruments`

---

## 3. Mise à jour Vault (Go)

### 3.1 GET /ui/aggregations/ap-by-partner

- Agrégation dettes fournisseurs (`in_invoice`, `amount_residual > 0`)
- Même structure que `ar-by-partner` : totaux, partenaires, meta
- **Impact** : BFR = AR − AP calculable avec données réelles

### 3.2 GET /ui/aggregations/payroll

- Agrégation charges de personnel (`odoo_model = 'hr.payslip'`)
- Total charges, nombre de bulletins, séries temporelles
- **Impact** : EBE complet = marge brute − charges personnel

### 3.3 Événement payroll.charge.posted

- Mapper DVIG : `mapPayrollChargePosted()` → canonical `payroll_charge`
- Stockage Vault : `documents` avec `odoo_model = 'hr.payslip'`
- Prêt à recevoir les événements dès qu’Odoo les envoie

---

## 4. Branchement Linky

### 4.1 Metric Engine

- `payables_open` : fetch `ap-by-partner`
- `payroll_charges` : fetch `payroll`
- `working_capital` : formule AR − AP (réelle si AP dispo)
- `ebitda_full` : marge − charges personnel (si payroll dispo)

### 4.2 Proxies Next.js

- `/api/ap-by-partner` → Vault
- `/api/payroll` → Vault

### 4.3 Cartes UI

- **BFR** : deux colonnes AR / AP, BFR net signé
- **EBE** : badge « Proxy » ou « Complet » selon présence de bulletins de paie

---

## 5. État actuel

| Composant | Statut |
|-----------|--------|
| 12 instruments dans la grille | ✅ |
| Metric Engine (DAG, cache, executor) | ✅ |
| API /api/instruments | ✅ |
| Tests unitaires (41) | ✅ |
| Vault ap-by-partner, payroll | ✅ |
| Event Registry payroll.charge.posted | ✅ |
| dashboard-metrics déprécié | ✅ |

---

## 6. Prochaines étapes suggérées

1. **Connecter Odoo** : émettre `payroll.charge.posted` vers DVIG (module RH)
2. **Valider sur tenant** : o19 ou laplatine2026 avec données réelles
3. **Activer le Metric Engine** : `NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE=true` en prod
4. **Supprimer dashboard-metrics** : après Sunset 2026-12-31

---

*Rapport rédigé le 13 mars 2026.*
