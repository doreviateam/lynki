# Résultats Sprint 3 UX (2026-03-09)

## Objectif

Valider l'objectif UX complémentaire:

`Vault sealed -> Linky data available <= 2 s (P95)`

## Implémentations livrées

1. Instrumentation UX côté Linky:
   - `linky_data_available_at`
   - `ux_t_ms` (proxy backend-to-cockpit)
2. Endpoint métrique dédié:
   - `GET /api/ux-metrics`
   - Expose `count`, `p50_ms`, `p95_ms`, `p99_ms`, `min_ms`, `max_ms`, `slo_state`
3. Visibilité cockpit:
   - Indicateur `UX P95` ajouté dans le footer Linky

## Campagne UX dédiée (tenant o19)

### Paramètres

- Période test: `2026-03-01` -> `2026-03-09`
- Scope: `company_id=odoo:1`
- Volume: `60` rafraîchissements dashboard (`minimal=1`)
- Fenêtre agrégation UX: `30 minutes`

Note de validité:

- Ce volume est suffisant pour valider le comportement UX dans le contexte **lab**.
- Une campagne élargie pourra être exécutée ultérieurement en **pré-production** pour renforcer la robustesse statistique.

### Résultat officiel (après optimisation)

- `count = 60`
- `P50 = 859 ms`
- `P95 = 905.25 ms`
- `P99 = 920.28 ms`
- `min = 852 ms`
- `max = 925 ms`
- `slo_state = ok`

Conclusion:

- Objectif Sprint 3 UX **atteint** (`P95 <= 2 s`, `P99 <= 4 s`) sur la campagne dédiée.
- Les campagnes Sprint 2 et Sprint 3 démontrent que la plateforme Dorevia capture un événement financier ERP, scelle sa preuve et le rend visible dans le cockpit Linky en environ **2 secondes**, avec stabilité et sans perte d’événement.

## Preuve d'alerte / simulation MCO

Avant optimisation UX, une campagne intermédiaire sur la même instrumentation produisait:

- `count = 61`
- `P95 = 5130 ms`
- `P99 = 5134.4 ms`
- `slo_state = alert`

Cause identifiée:

- Timeout DLP trop élevé dans `dashboard-metrics` (`5000 ms`) qui retardait la disponibilité cockpit.

Correction appliquée:

- Passage du timeout DLP à `800 ms` (fail-fast pour bloc informatif non critique).

Effet:

- Retour à un état `slo_state = ok` sur la campagne officielle.

## Statut Sprint 3

- Technique: KPI UX validé sur campagne dédiée, `TST-UAT-005/006` passés.
- Alerting: règles et escalade formalisées dans `RUNBOOK_ALERTES_UX_SPRINT3.md`.
- Sprint 3: **prêt clôture**.
- Point de passage Sprint 4: joindre journal d'alertes horodaté en pièce de recette finale.

## Addendum coherence demo MOA (2026-03-09)

- Ce rapport UX reste valide.
- Les donnees fonctionnelles cockpit presentees a la MOA ont ensuite ete nettoyees/normalisees:
  - Paiements: `4 387 / 996 / 3 391`.
  - Tresorerie: `Position validee (Vault) = 996,00 EUR`.
