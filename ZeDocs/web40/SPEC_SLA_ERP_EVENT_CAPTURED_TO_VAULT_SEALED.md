# SPECIFICATION FONCTIONNELLE ET TECHNIQUE

## SLA `ERP event captured -> Vault sealed <= 5 s`

Version: 1.1  
Date: 09/03/2026  
Statut: Proposition pour validation MOA/MOE  
Périmètre initial: tenant `o19` (généralisation multi-tenant ensuite)

---

## 1) Contexte

Le cockpit Linky consomme des agrégations Vault. La valeur métier repose sur la fraîcheur et la fiabilité du flux:

`ERP (Odoo) -> DVIG -> Vault -> Linky`

L'objectif de cette spécification est de rendre contractuel et mesurable le délai maximal entre capture d'un événement ERP et scellement Vault.

**Principe d'architecture et de preuve**

Vault constitue la source de vérité scellée du système.  
Linky est une interface de lecture et de pilotage reposant exclusivement sur ces données probantes.

**Principe de valeur**

Le système doit minimiser le **temps de vérité financière**, défini comme le délai entre capture de l'événement ERP, scellement Vault, puis disponibilité Linky.

---

## 2) Exigence contractuelle

### Exigence principale (SLA)

`ERP event captured -> Vault sealed <= 5 s`

ID exigence: `REQ-SLA-001`

### Objectif UX complémentaire (SLO)

`Vault sealed -> Linky data available <= 2 s` (P95)

IDs associés:

- `REQ-UX-001` (P95 <= 2 s)
- `REQ-UX-002` (P99 <= 4 s)

### Définition métrique

- `erp_event_captured_at`: horodatage de capture de l'événement dans le connecteur ERP.
- `vault_sealed_at`: horodatage de persistance scellée dans Vault.
- `T_sla = vault_sealed_at - erp_event_captured_at`.

### Objectifs chiffrés

- P95: `T_sla <= 5 s`
- P99: `T_sla <= 10 s`
- Taux de perte: `0` événement perdu
- Taux de doublon métier: `0` (idempotence obligatoire)

IDs associés:

- `REQ-SLA-002` (P95 <= 5 s)
- `REQ-SLA-003` (P99 <= 10 s)
- `REQ-REL-001` (0 perte)
- `REQ-REL-002` (0 doublon)

---

## 2.1) Convention d'identifiants (normative)

- `REQ-*`: exigence fonctionnelle/contractuelle
- `NFR-*`: exigence non fonctionnelle
- `OBS-*`: observabilité/monitoring/alerting
- `TST-*`: test/recette
- `DEP-*`: déploiement/rollback

---

## 3) Périmètre

### In scope

- Flux paiements ERP (posting -> capture événement -> DVIG ingest -> Vault sealed)
- Transport multi-tenant (`tenant`, `source`, clés d'idempotence)
- Observabilité SLA bout en bout
- Runbook d'exploitation et alerting

### Out of scope (phase 1)

- Optimisation d'affichage front en dessous de 1 s
- Historisation analytique long terme hors besoin SLA
- Refonte complète des agrégations non liées au flux paiements

---

## 4) Exigences fonctionnelles

- `REQ-FUNC-001`: Chaque événement de paiement posté est capturé exactement une fois logiquement (idempotence).
- `REQ-FUNC-002`: Chaque événement capturé est transmis à DVIG sans attente batch > 1 s.
- `REQ-FUNC-003`: Chaque événement accepté par DVIG est forwardé vers Vault sans attente batch prolongée.
- `REQ-FUNC-004`: Le scellement Vault expose un horodatage fiable (`vault_sealed_at`) exploitable pour le SLA.
- `REQ-FUNC-005`: Les événements en échec sont repris automatiquement (retry + backoff), sans création de doublons.
- `REQ-FUNC-006`: Le système produit les métriques P50/P95/P99 de `T_sla` par tenant et globalement.
- `REQ-FUNC-007`: Le système expose la latence UX `T_ux = linky_data_available_at - vault_sealed_at`.

---

## 5) Exigences non fonctionnelles

### Performance

- `NFR-PERF-001`: Respect du SLA principal P95 <= 5 s.
- `NFR-PERF-002`: Charge cible phase 1 configurable et validée en pré-prod (cf. plan de tests).
- `NFR-PERF-003`: Objectif UX P95 <= 2 s entre `vault_sealed_at` et disponibilité des données Linky.

### Fiabilité

- `NFR-REL-001`: Idempotence stricte par clé métier.
- `NFR-REL-002`: Retry résilient (erreurs réseau, indisponibilité temporaire).
- `NFR-REL-003`: Mécanisme de rattrapage (CRON de secours) maintenu en filet de sécurité.

### Sécurité

- `NFR-SEC-001`: Authentification DVIG par token tenant.
- `NFR-SEC-002`: Propagation stricte du tenant (`X-Tenant`).
- `NFR-SEC-003`: Aucune donnée sensible en clair dans le dépôt.

### Exploitabilité

- `NFR-OPS-001`: Traces corrélables via `event_id`/`idempotency_key`.
- `NFR-OPS-002`: Dashboard SLA accessible MOA/MCO.
- `NFR-OPS-003`: Alertes proactives sur dérive de latence.

---

## 6) Architecture cible

### 6.1 Flux logique

1. Odoo `action_post` -> capture événement (`erp_event_captured_at`)  
2. enqueue immédiat via `queue_job`  
3. worker `queue_job` -> `DVIG /ingest`  
4. DVIG outbox -> forward immédiat Vault  
5. Vault persiste et scelle (`vault_sealed_at`)  
6. Agrégations Vault disponibles pour Linky

### 6.2 Décisions clés

- Réactivation `queue_job` pour supprimer la latence structurelle CRON 2 min.
- Conservation d'un CRON de secours uniquement pour reprise/rattrapage.
- Traitement DVIG outbox en mode court/immédiat après ingest.

---

## 7) Contrats d'interface (minimum attendu)

### ERP -> DVIG

- Champs obligatoires: `event_id`, `tenant`, `source`, payload paiement, `erp_event_captured_at`, `idempotency_key`.
- Réponse attendue: acceptation explicite + corrélation (`event_id`).

### DVIG -> Vault

- Propagation obligatoire: `tenant`, `event_id`, `idempotency_key`, timestamp capture.
- Réponse attendue: statut de persistance + horodatage de scellement.

### Vault (audit SLA)

- Exposition des timestamps nécessaires au calcul de `T_sla`.
- Endpoint(s) de contrôle pour statistiques percentiles par période/tenant.

---

## 8) Budget temps de référence (P95)

- Capture ERP + enqueue job: `< 0,2 s`
- Exécution job + DVIG ingest: `< 0,8 s`
- DVIG outbox -> Vault sealed: `< 3,0 s`
- **Total P95: `< 5,0 s`**

Remarque: ces budgets servent de cible d'ingénierie; les valeurs réelles seront validées en test de charge.

---

## 9) Observabilité et alerting

### Métriques obligatoires

- `OBS-MET-001`: `sla_t_seconds` (distribution)
- `OBS-MET-002`: `sla_p50_seconds`, `sla_p95_seconds`, `sla_p99_seconds`
- `OBS-MET-003`: `events_total`, `events_failed`, `events_retried`, `events_lost`
- `OBS-MET-004`: `idempotency_conflicts_total`
- `OBS-MET-005`: `ux_t_seconds`, `ux_p50_seconds`, `ux_p95_seconds`, `ux_p99_seconds`

### Dimensions minimales

- tenant
- source
- event_type

### Alertes

- `OBS-ALT-001`: Alerte warning si P95 > 5 s pendant 5 min.
- `OBS-ALT-002`: Alerte critique si P99 > 10 s pendant 5 min.
- `OBS-ALT-003`: Alerte critique si perte d'événement > 0.
- `OBS-ALT-004`: Alerte warning si `ux_p95_seconds > 2 s` pendant 5 min.
- `OBS-ALT-005`: Alerte critique si `ux_p99_seconds > 4 s` pendant 5 min.

---

## 10) Plan de tests et recette

### Tests techniques

1. `TST-TECH-001`: Test unitaire idempotence (même événement rejoué N fois).
2. `TST-TECH-002`: Test intégration ERP -> DVIG -> Vault sur jeu nominal.
3. `TST-TECH-003`: Test retry sur panne DVIG temporaire.
4. `TST-TECH-004`: Test retry sur panne Vault temporaire.

### Tests de performance

1. `TST-PERF-001`: Mesure baseline (avant `queue_job`).
2. `TST-PERF-002`: Mesure après activation `queue_job`.
3. `TST-PERF-003`: Mesure sous charge soutenue (profil à définir).

### Critères de recette

- `TST-UAT-001`: P95 <= 5 s
- `TST-UAT-002`: P99 <= 10 s
- `TST-UAT-003`: 0 perte
- `TST-UAT-004`: 0 doublon métier
- `TST-UAT-005`: UX P95 <= 2 s (Vault sealed -> Linky data available)
- `TST-UAT-006`: UX P99 <= 4 s (Vault sealed -> Linky data available)

---

## 11) Déploiement et rollback

### Stratégie de déploiement

1. `DEP-ROL-001`: Activation sur tenant pilote `o19`.
2. `DEP-ROL-002`: Observation 48h avec dashboard SLA.
3. `DEP-ROL-003`: COPIL Go/No-Go.
4. `DEP-ROL-004`: Extension progressive multi-tenant.

### Rollback

- `DEP-RBK-001`: Désactivation `queue_job` temps réel.
- `DEP-RBK-002`: Retour mode CRON de secours.
- `DEP-RBK-003`: Conservation des métriques pour post-mortem.

---

## 12) Gouvernance et responsabilités

- MOA: valide SLA, critères de recette, seuils d'alerte
- MOE Applicatif: implémentation Odoo/DVIG/Vault
- MCO: supervision, alerting, runbook d'incident
- Data/Qualité: audit périodique latence, pertes, doublons

---

## 13) Décisions à valider

1. Validation formelle du SLA contractuel.
2. Validation de la réactivation `queue_job` sur flux paiements.
3. Validation des seuils P95/P99 et des alertes.
4. Validation du planning pilote o19 -> généralisation.

---

## 13.1) Matrice de traçabilité (exigence -> test -> preuve)

| Exigence | Description courte | Test(s) de vérification | Preuve attendue |
|---|---|---|---|
| `REQ-SLA-001` | `ERP event captured -> Vault sealed <= 5 s` | `TST-PERF-002`, `TST-UAT-001` | Rapport percentiles + export métriques |
| `REQ-SLA-003` | P99 <= 10 s | `TST-PERF-003`, `TST-UAT-002` | Rapport de charge + dashboard |
| `REQ-REL-001` | 0 perte d'événement | `TST-TECH-002`, `TST-UAT-003` | Comptage source vs scellé |
| `REQ-REL-002` | 0 doublon métier | `TST-TECH-001`, `TST-UAT-004` | Audit idempotency key |
| `REQ-UX-001` | Vault sealed -> Linky data available <= 2 s (P95) | `TST-PERF-002`, `TST-UAT-005` | Mesure UX + trace horodatée |
| `REQ-UX-002` | Vault sealed -> Linky data available <= 4 s (P99) | `TST-PERF-003`, `TST-UAT-006` | Rapport UX P99 |
| `NFR-OPS-003` | Alertes dérive SLA | `TST-TECH-003` | Journal d'alerte simulée |

---

## 14) Annexes (références)

- `ZeDocs/web40/RAPPORT_SITUATION_MOA.md`
- `ZeDocs/web39/PLAN_CORRECTION_ODOO_DVIG_VAULT_O19.md`
- Connecteur Odoo: `units/odoo/custom-addons/dorevia_vault_connector/`
- Linky API: `units/dorevia-linky/app/api/dashboard-metrics/route.ts`

---

## 15) Addendum execution (2026-03-09)

### Donnees de reference recette o19

- Donnees de campagne `SLA-*` retirees de la base Odoo lab (`721` paiements supprimes).
- Jeu metier expose a la MOA:
  - Total paiements: `4 387,00 EUR`
  - Rapproche: `996,00 EUR`
  - A rapprocher: `3 391,00 EUR`

### Alignement d'affichage Linky

- Correctif applique sur la card **Paiements**: `A rapprocher = Total - Rapproche`.
- Correctif applique sur la card **Tresorerie**: `Position validee (Vault)` alignee sur le volume rapproche en mode `proxy` (`996,00 EUR` dans l'etat de reference).
