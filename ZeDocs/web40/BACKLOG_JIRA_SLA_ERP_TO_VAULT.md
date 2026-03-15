# Backlog Jira prêt à coller

## Programme: SLA ERP -> Vault + SLO UX Linky

Références:

- `ZeDocs/web40/SPEC_SLA_ERP_EVENT_CAPTURED_TO_VAULT_SEALED.md`
- `ZeDocs/web40/PLAN_IMPLEMENTATION_SLA_ERP_TO_VAULT_SCRUM.md`
- `ZeDocs/web40/PLAN_TESTS_ACCEPTATION_SLA_ERP_TO_VAULT.md`

**État global au 09/03/2026**
- SLA ERP->Vault validé (`P95 ~= 1.02 s` sur 500 événements).
- Pipeline preuve stable (`0 perte`, `0 doublon`, `failed_soft = 0`).
- Prochain objectif prioritaire: Sprint 3 UX Linky (`Vault sealed -> Linky data available <= 2 s (P95)`).

Convention labels suggérée:

- `program:sla-erp-vault`
- `domain:odoo` / `domain:dvig` / `domain:vault` / `domain:linky` / `domain:mco` / `domain:qa`
- `sprint:0` ... `sprint:4`
- `type:story` / `type:task`
- `priority:high|medium`

---

## Avancement Jira (mise à jour exécution)

| Sprint | Statut | Commentaire de pilotage |
|---|---|---|
| Sprint 0 | Partiellement clôturé | Instrumentation active; preuves NTP/dashboard/alertes à consolider |
| Sprint 1 | Majoritairement clôturé | Temps réel opérationnel; preuve consolidée `queue_job_latency_p95_ms` à archiver |
| Sprint 2 | Clôturé techniquement | Campagnes 20/100/500 validées, `failed_soft=0`; clôture documentaire UAT/métriques à finaliser |
| Sprint 3 | Prêt clôture | `T_ux` mesuré, campagne 60 échantillons, UAT-005/006 PASS, runbook alertes UX publié |
| Sprint 4 | En cours | Passe 1 recette exécutée (preuves SLA/UX/fiabilité); restent rapprochement final `events_lost` et signatures COPIL |

---

## EPIC 1 - Baseline et observabilité (Sprint 0)

### STORY S0-OBS-001 - Instrumenter les timestamps SLA

- **Description**: propager et collecter `erp_event_captured_at` et `vault_sealed_at`.
- **Acceptance Criteria**
  - événements ERP portent `erp_event_captured_at`
  - Vault expose/consigne `vault_sealed_at`
  - `T_sla` calculable de bout en bout
- **Labels**: `program:sla-erp-vault`, `domain:odoo`, `domain:vault`, `sprint:0`, `priority:high`

#### TASKS

- S0-T1 Ajouter `erp_event_captured_at` dans le flux émission ERP
- S0-T2 Exposer/consigner `vault_sealed_at` côté Vault
- S0-T3 Calculer et publier `T_sla`/`T_ux` en métriques

### STORY S0-OPS-002 - Dashboard et alertes SLA/UX

- **Description**: rendre visible P50/P95/P99 et alertes de dérive.
- **Acceptance Criteria**
  - dashboard SLA/UX accessible MOA/MCO
  - alertes SLA et UX déclenchables en simulation
  - baseline archivée sur tenant `o19`
- **Labels**: `program:sla-erp-vault`, `domain:mco`, `sprint:0`, `priority:high`

#### TASKS

- S0-T4 Créer dashboard SLA/UX
- S0-T5 Configurer alertes SLA/UX/perte
- S0-T6 Vérifier/forcer NTP sur tous les composants (écart < 100 ms)

---

## EPIC 2 - Temps réel ERP -> DVIG (Sprint 1)

### STORY S1-ODOO-001 - Activer queue_job temps réel paiements

- **Description**: supprimer l’attente batch CRON sur ERP -> DVIG.
- **Acceptance Criteria**
  - job créé au posting ERP en < 1 s
  - worker dédié actif et supervisé
  - CRON de secours conservé pour rattrapage
- **Labels**: `program:sla-erp-vault`, `domain:odoo`, `sprint:1`, `priority:high`

#### TASKS

- S1-T1 Réactiver `queue_job` sur paiements
- S1-T2 Créer worker dédié + supervision
- S1-T3 Maintenir CRON de fallback

### STORY S1-REL-002 - Durcir idempotence et latence queue_job

- **Description**: garantir non-doublon et capter saturation worker.
- **Acceptance Criteria**
  - rejouage sans doublon métier
  - `queue_job_latency_p95_ms < 200 ms`
  - tests techniques verts
- **Labels**: `program:sla-erp-vault`, `domain:odoo`, `domain:qa`, `sprint:1`, `priority:high`

#### TASKS

- S1-T4 Durcir idempotence émission ERP
- S1-T5 Exécuter `TST-TECH-001/002`
- S1-T6 Publier métrique latence `queue_job` (P95)

---

## EPIC 3 - DVIG -> Vault sealed (Sprint 2)

**Note d'exécution (Sprint 2)**  
Reset Vault DB appliqué suite à corruption storage PostgreSQL, opération valable en environnement **lab** uniquement.

### STORY S2-DVIG-001 - Réduire la latence outbox DVIG

- **Description**: traitement immédiat outbox + retry/backoff fiable.
- **Acceptance Criteria**
  - forwarding DVIG court/immédiat
  - retry/backoff validé en panne simulée
  - corrélation logs par `event_id`/`idempotency_key`
- **Labels**: `program:sla-erp-vault`, `domain:dvig`, `domain:vault`, `sprint:2`, `priority:high`

#### TASKS

- S2-T1 Optimiser traitement outbox DVIG
- S2-T2 Paramétrer retry/backoff
- S2-T3 Activer corrélation logs

### STORY S2-GATE-002 - Gate fin Sprint 2 (preuve stable)

- **Description**: valider la couche preuve avant optimisation UX.
- **Acceptance Criteria**
  - `events_lost = 0`
  - doublons métier = 0
  - P95 `ERP event captured -> Vault sealed <= 5 s` sur >= 500 événements
  - variance P95 entre campagnes 100 et 500 `< 0.5 %`
  - backlog outbox sous seuil (`P95 backlog < 50` ou `avg outbox < 500 ms`)
  - `dvig_ingest_p95_ms < 800 ms`
- **Labels**: `program:sla-erp-vault`, `domain:dvig`, `domain:qa`, `sprint:2`, `priority:high`

#### TASKS

- S2-T4 Exécuter `TST-UAT-003/004`
- S2-T5 Instrumenter backlog outbox (taille/âge)
- S2-T6 Publier métrique `DVIG ingest` P95
- S2-T7 Archiver preuve stabilité P95 (100 vs 500)

---

## EPIC 4 - Objectif UX complémentaire (Sprint 3)

### STORY S3-LINKY-001 - Atteindre `Vault sealed -> Linky <= 2 s` (P95)

- **Description**: optimiser disponibilité des données scellées dans Linky.
- **Acceptance Criteria**
  - P95 `T_ux <= 2 s`
  - P99 `T_ux <= 4 s`
  - alertes UX actives
- **Labels**: `program:sla-erp-vault`, `domain:linky`, `domain:mco`, `sprint:3`, `priority:high`

#### TASKS

- S3-T1 Durcir lecture Linky (`no-store`/refresh court)
- S3-T2 Mesurer `T_ux`
- S3-T3 Configurer alertes UX P95/P99
- S3-T4 Exécuter `TST-UAT-005/006`

---

## EPIC 5 - Recette finale et COPIL (Sprint 4)

### STORY S4-UAT-001 - Campagne d’acceptation finale

- **Description**: exécuter la recette complète et produire les preuves.
- **Acceptance Criteria**
  - plan d’acceptation exécuté
  - checklist signée MOA/MOE/MCO
  - dossier de preuves complet
- **Labels**: `program:sla-erp-vault`, `domain:qa`, `domain:mco`, `sprint:4`, `priority:high`

#### TASKS

- S4-T1 Exécuter `PLAN_TESTS_ACCEPTATION`
- S4-T2 Exécuter `CHECKLIST_EXECUTION_RECETTE`
- S4-T3 Produire rapport de preuves

### STORY S4-GOV-002 - Décision COPIL Go/No-Go

- **Description**: valider la généralisation à partir des résultats pilote.
- **Acceptance Criteria**
  - P95/P99 SLA conformes
  - P95/P99 UX conformes
  - 0 perte, 0 doublon
  - décision COPIL documentée
- **Labels**: `program:sla-erp-vault`, `domain:moa`, `sprint:4`, `priority:high`

#### TASKS

- S4-T4 Préparer support COPIL + décision formelle

---

## Template Jira (copier-coller)

### Template STORY

- **Summary**: `[Sprint X] <titre story>`
- **Description**:
  - Contexte
  - Objectif
  - Périmètre
  - Dépendances
- **Acceptance Criteria**:
  - [ ] AC1
  - [ ] AC2
  - [ ] AC3
- **Labels**: `program:sla-erp-vault`, `domain:*`, `sprint:X`, `priority:*`, `type:story`

### Template TASK

- **Summary**: `[Sx-Ty] <titre tâche>`
- **Description**:
  - Action détaillée
  - Owner
  - Sortie attendue
- **Definition of Done**:
  - [ ] Implémenté
  - [ ] Vérifié
  - [ ] Preuve jointe
- **Labels**: `program:sla-erp-vault`, `domain:*`, `sprint:X`, `type:task`

## Addendum execution (2026-03-09)

### Points executes hors backlog initial (stabilisation MOA)

- Nettoyage Odoo lab des donnees de campagne `SLA-*`:
  - `721` paiements supprimes.
  - Base de demonstration ramenee a `4` paiements metier (`FAC/*`).
- Correctif card **Paiements** (detail):
  - Formule imposee: `A rapprocher = Total periode - Rapproche`.
  - Valeurs de reference: `4 387 / 996 / 3 391`.
- Correctif card **Tresorerie**:
  - `Position validee (Vault)` corrigee en mode `proxy`.
  - Valeur de reference: `996,00 EUR`.
