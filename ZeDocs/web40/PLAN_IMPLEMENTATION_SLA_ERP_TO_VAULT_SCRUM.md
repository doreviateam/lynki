# Plan d'implémentation Scrum

## SLA `ERP event captured -> Vault sealed <= 5 s`

Date: 09/03/2026  
Version: 1.1 consolidée (mise à jour exécution)  
Références:

- `ZeDocs/web40/SPEC_SLA_ERP_EVENT_CAPTURED_TO_VAULT_SEALED.md` (v1.1)
- `ZeDocs/web40/PLAN_TESTS_ACCEPTATION_SLA_ERP_TO_VAULT.md`
- `ZeDocs/web40/CHECKLIST_EXECUTION_RECETTE_SLA_ERP_TO_VAULT.md`

## Schéma de lecture rapide

```text
ERP (Odoo)
   |
   | queue_job
   v
DVIG
   |
   | ingest
   v
Vault
   |
   | sealed event
   v
Linky
   |
   | dashboard
   v
Utilisateur
```

**État global au 09/03/2026**
- SLA ERP->Vault validé (`P95 ~= 1.02 s` sur 500 événements).
- Pipeline preuve stable (`0 perte`, `0 doublon`, `failed_soft = 0`).
- Prochain objectif prioritaire: validation UX Linky (`Vault sealed -> Linky data available <= 2 s (P95)`).

---

## 0) Vue d'ensemble

| Sprint | Périmètre | Durée estimée | Livrable | Dépendances |
|---|---|---:|---|---|
| Sprint 0 | Instrumentation et baseline | 3 jours | métriques `T_sla`/`T_ux` + baseline P50/P95/P99 | — |
| Sprint 1 | Temps réel ERP -> DVIG via `queue_job` | 5 jours | capture événement + enqueue immédiat + worker dédié | Sprint 0 |
| Sprint 2 | DVIG outbox -> Vault sealed (latence courte) | 5 jours | forwarding immédiat + idempotence renforcée | Sprint 1 |
| Sprint 3 | Objectif UX `Vault sealed -> Linky data available <= 2 s` | 4 jours | rafraîchissement Linky durci + métriques UX + alertes | Sprint 2 |
| Sprint 4 | Recette, hardening, Go/No-Go | 3 jours | rapport recette + décision COPIL | Sprint 3 |

**Objectif global:** atteindre le SLA contractuel P95 <= 5 s (P99 <= 10 s), sans perte ni doublon.

---

## 0 bis) Avancement réel au 09/03/2026

| Sprint | Statut | Réalisé | Reste à faire |
|---|---|---|---|
| Sprint 0 | Partiellement clôturé | Instrumentation ERP->DVIG->Vault active, baseline SLA mesurée | Formaliser preuves NTP (< 100 ms), dashboard/alertes archivés |
| Sprint 1 | Majoritairement clôturé | Flux temps réel opérationnel, `queue_job` actif, rejouage sans doublon | Publier preuve consolidée `queue_job_latency_p95_ms` + supervision/fallback |
| Sprint 2 | Clôturé techniquement | Reset lab propre, relance incidents OK, campagnes 20/100/500 validées, `failed_soft=0` | Clôture documentaire UAT-003/004 + preuves backlog/ingest |
| Sprint 3 | Prêt clôture | Instrumentation UX + campagne validée (`P95=905 ms`, `P99=920 ms`, `slo_state=ok`) + UAT-005/006 PASS + runbook alertes UX | Clôture administrative Sprint 3 |
| Sprint 4 | En cours | Passes 1+2 exécutées (preuves techniques + alerting + note COPIL préparée) | Finaliser checklist signée et décision COPIL formelle |

---

## Sprint 0 - Instrumentation et baseline

**Objectif:** mesurer l'existant avant changement.

**Statut au 09/03/2026:** **partiellement clôturé**
- Réalisé: propagation timestamps et mesure SLA ERP->Vault.
- À finaliser: preuve NTP, captures dashboard/alertes et archivage baseline officiel.

### User stories

- **US-0.1** En tant que MOA/MCO, je dispose des timestamps `erp_event_captured_at` et `vault_sealed_at`.
- **US-0.2** En tant que MOA/MCO, je visualise P50/P95/P99 de `T_sla` et `T_ux`.

### Backlog

| ID | Tâche | Owner | Exigence liée | Preuve attendue | Est. |
|---|---|---|---|---|---:|
| S0-T1 | Ajouter propagation `erp_event_captured_at` dans le flux événement | Odoo | `REQ-SLA-001` | Trace événement avec timestamp capture | 0,5 j |
| S0-T2 | Exposer/consigner `vault_sealed_at` côté Vault | Vault | `REQ-FUNC-004` | Trace scellement horodatée | 0,5 j |
| S0-T3 | Calculer `T_sla` et `T_ux` en métriques | Vault/Linky | `REQ-FUNC-006`, `REQ-FUNC-007` | Export métriques P50/P95/P99 | 1 j |
| S0-T4 | Dashboard SLA/UX (P50/P95/P99) | MCO | `NFR-OPS-002` | Capture dashboard opérationnel | 0,5 j |
| S0-T5 | Alertes de base (SLA + UX + perte) | MCO | `OBS-ALT-*` | Journal d'alertes simulées | 0,5 j |
| S0-T6 | Vérifier/forcer NTP sur Odoo, DVIG, Vault, Linky | MCO | `NFR-OPS-001` | Preuve sync NTP < 100 ms d'écart | 0,5 j |

### DoD Sprint 0

- Baseline capturée sur tenant `o19`
- Dashboard et alertes visibles
- Données de référence archivées

**Livrable Sprint 0**

- Instrumentation SLA/UX active
- Baseline signée et archivée
- NTP contrôlé sur tous les composants

---

## Sprint 1 - Temps réel ERP -> DVIG (`queue_job`)

**Objectif:** supprimer la latence structurelle CRON sur le segment ERP -> DVIG.

**Statut au 09/03/2026:** **majoritairement clôturé**
- Réalisé: traitement temps réel actif et stable sur campagnes 100/500.
- À finaliser: publication formelle des preuves de supervision worker et de latence `queue_job`.

### User stories

- **US-1.1** En tant que système, chaque posting ERP enfile un job immédiatement.
- **US-1.2** En tant qu'exploitant, un worker dédié traite ces jobs en continu.

### Backlog

| ID | Tâche | Owner | Exigence liée | Preuve attendue | Est. |
|---|---|---|---|---|---:|
| S1-T1 | Réactiver `queue_job` sur paiements | Odoo | `REQ-FUNC-002` | Job créé au posting (< 1 s) | 1 j |
| S1-T2 | Créer worker dédié + supervision | Odoo/MCO | `NFR-OPS-002` | Worker actif + métriques file | 1 j |
| S1-T3 | Garder CRON de secours rattrapage | Odoo | `NFR-REL-003` | Exécution CRON de fallback validée | 0,5 j |
| S1-T4 | Durcir idempotence émission ERP | Odoo | `NFR-REL-001` | Rejeu sans doublon | 1 j |
| S1-T5 | Tests techniques `TST-TECH-001/002` | QA/MOE | `REQ-REL-*` | Rapport tests vert | 1,5 j |
| S1-T6 | Mesurer latence `queue_job` (création -> démarrage exécution) | Odoo/MCO | `NFR-PERF-002` | `queue_job_latency_p95_ms` publiée | 0,5 j |

### DoD Sprint 1

- `queue_job` actif en recette
- Jobs traités sans attente batch
- Aucun doublon sur rejouage contrôlé

**Livrable Sprint 1**

- Connecteur Odoo en temps réel via `queue_job`
- Worker supervisé
- Preuve de non-doublon sur rejouage

---

## Sprint 2 - DVIG -> Vault (sealed)

**Objectif:** garantir un scellement rapide et fiable côté Vault.

**Statut au 09/03/2026:** **clôturé techniquement**
- Réalisé: relance des événements en échec, stabilité restaurée post-reset, validation sur 20/100/500.
- Clarification: reset Vault DB appliqué suite à corruption storage PostgreSQL, opération valable en environnement **lab** uniquement.
- Résultat clé: P95 `ERP event captured -> Vault sealed` ~ 1.02 s, `failed_soft=0`, `0 perte`, `0 doublon`.
- Indicateur de stabilité: variance P95 entre campagnes 100 et 500 = `0.47 %` (< 0.5 %).
- À finaliser: dossier de clôture UAT-003/004 et pièces de preuve métriques (backlog outbox, `DVIG ingest`).

### User stories

- **US-2.1** En tant que système, DVIG forwarde les événements sans délai batch.
- **US-2.2** En tant qu'exploitant, je vois retries et erreurs corrélés par `event_id`.

### Backlog

| ID | Tâche | Owner | Exigence liée | Preuve attendue | Est. |
|---|---|---|---|---|---:|
| S2-T1 | Outbox DVIG en traitement court/immédiat | DVIG | `REQ-FUNC-003` | Délai outbox réduit (logs) | 1,5 j |
| S2-T2 | Retry/backoff paramétré | DVIG | `REQ-FUNC-005`, `NFR-REL-002` | Scénarios panne/reprise validés | 1 j |
| S2-T3 | Corrélation logs `event_id/idempotency_key` | DVIG/Vault | `NFR-OPS-001` | Traces corrélées exploitables | 0,5 j |
| S2-T4 | Validation pertes/doublons (`TST-UAT-003/004`) | QA/MOE | `REQ-REL-*` | Rapport UAT 003/004 vert | 2 j |
| S2-T5 | Instrumenter backlog outbox DVIG (taille/âge) | DVIG/MCO | `NFR-OPS-002` | Métrique backlog disponible + seuil validé | 0,5 j |
| S2-T6 | Mesurer latence `DVIG /ingest` | DVIG/MCO | `NFR-PERF-002` | `dvig_ingest_p95_ms` publiée | 0,5 j |

### DoD Sprint 2

- Pertes = 0 sur campagne intermédiaire
- Doublons = 0
- Chaîne ERP -> Vault temps réel fonctionnelle

**Livrable Sprint 2**

- Pipeline preuve temps réel stable ERP -> DVIG -> Vault
- Rapprochement intermédiaire validé (0 perte / 0 doublon)

### Gate fin Sprint 2 (Go/No-Go intermédiaire)

Critères obligatoires pour engager Sprint 3:

- Pipeline preuve temps réel opérationnel
- `events_lost = 0`
- Doublons métier = 0
- P95 intermédiaire `ERP event captured -> Vault sealed` mesuré et documenté
- Backlog outbox DVIG sous contrôle (`P95 backlog < 50 événements` ou `temps moyen en outbox < 500 ms`)

---

## Sprint 3 - Objectif UX complémentaire

**Objectif:** tenir `Vault sealed -> Linky data available <= 2 s` (P95).

**Statut au 09/03/2026:** **prêt clôture**
- Réalisé: instrumentation `T_ux` initiale via `ux_t_ms` et `linky_data_available_at` sur `dashboard-metrics`.
- Réalisé: endpoint `/api/ux-metrics` (P50/P95/P99 sur fenêtre glissante) + indicateur UX P95 dans le footer.
- Réalisé: campagne UX dédiée (60 rafraîchissements) avec `P50=859 ms`, `P95=905 ms`, `P99=920 ms` (`slo_state=ok`).
- Réalisé: `TST-UAT-005/006` validés (voir `UAT_005_006_SPRINT3_2026-03-09.md`).
- Réalisé: runbook alertes UX et escalade (`RUNBOOK_ALERTES_UX_SPRINT3.md`).
- À finaliser: clôture administrative Sprint 3.

### User stories

- **US-3.1** En tant qu'utilisateur Linky, je vois les données scellées en quasi temps réel.
- **US-3.2** En tant que MCO, je suis alerté si l'objectif UX dérive.

### Backlog

| ID | Tâche | Owner | Exigence liée | Preuve attendue | Est. |
|---|---|---|---|---|---:|
| S3-T1 | Durcir lecture Linky no-store/rafraîchissement court | Linky | `REQ-UX-001`, `NFR-PERF-003` | Mesure latence UI/API améliorée | 1 j |
| S3-T2 | Mesurer `T_ux` (`linky_data_available_at - vault_sealed_at`) | Linky/MCO | `REQ-FUNC-007`, `OBS-MET-005` | Export UX P50/P95/P99 | 1 j |
| S3-T3 | Alertes UX P95/P99 | MCO | `OBS-ALT-004/005` | Journal alertes UX simulées | 0,5 j |
| S3-T4 | Tests `TST-UAT-005/006` | QA/MOE | `REQ-UX-*` | Rapport UAT 005/006 vert | 1,5 j |

### DoD Sprint 3

- UX P95 <= 2 s mesuré
- UX P99 <= 4 s mesuré
- Alertes UX opérationnelles

**Livrable Sprint 3**

- Restitution Linky alignée objectif UX
- Observabilité UX en production-like

---

## Sprint 4 - Recette finale et Go/No-Go

**Objectif:** valider officiellement la cible et décider la généralisation.

**Statut au 09/03/2026:** **en cours**
- Pré-requis techniques validés: UX P95/P99 conformes, `TST-UAT-005/006` PASS, runbook alertes UX disponible.
- Dossier d'exécution ouvert: `DOSSIER_EXECUTION_RECETTE_SPRINT4_2026-03-09.md`.
- Passe 1 exécutée: preuves techniques collectées (SLA, UX, fiabilité), reste la clôture gouvernance.

### Backlog

| ID | Tâche | Owner | Référence | Preuve attendue | Est. |
|---|---|---|---|---|---:|
| S4-T1 | Exécuter plan d'acceptation complet | QA/MOE | `PLAN_TESTS_ACCEPTATION_*` | Rapport tests complet | 1,5 j |
| S4-T2 | Exécuter checklist signée | MOA/MOE/MCO | `CHECKLIST_EXECUTION_*` | Checklist signée | 0,5 j |
| S4-T3 | Produire rapport de preuves | QA/MCO | `TST-UAT-*` | Dossier de preuves centralisé | 0,5 j |
| S4-T4 | COPIL Go/No-Go | MOA | `DEP-ROL-*` | Décision formelle COPIL | 0,5 j |

### DoD Sprint 4

- P95 SLA <= 5 s, P99 <= 10 s
- P95 UX <= 2 s, P99 <= 4 s
- 0 perte, 0 doublon
- Validation MOA/MOE/MCO signée

**Livrable Sprint 4**

- Dossier recette final
- Décision Go/No-Go documentée

### Métriques de succès par sprint

- **Sprint 0:** baseline `T_sla`/`T_ux` mesurée et validée; écart NTP < 100 ms.
- **Sprint 1:** P95 `ERP -> DVIG ingest` < 1 s + P95 `queue_job latency` < 200 ms.
- **Sprint 2:** P95 `ERP event captured -> Vault sealed` <= 5 s mesuré sur **au moins 500 événements** + backlog outbox sous seuil + P95 `DVIG ingest` < 800 ms.
- **Sprint 3:** P95 `Vault sealed -> Linky data available` <= 2 s.
- **Sprint 4:** validation finale P95/P99, 0 perte, 0 doublon, GO COPIL.

---

## 6) Risques et mitigation

| Risque | Impact | Mitigation |
|---|---|---|
| Saturation worker `queue_job` | Latence SLA | Autoscaling/paramétrage worker + supervision |
| Retards outbox DVIG | Dégradation P95 | Traitement immédiat + alertes de backlog |
| Horloges non synchronisées | Mesures fausses | NTP obligatoire + contrôle continu |
| Régression Linky | UX > 2 s | Tests non-régression + métriques UX |

---

## 7) Cérémonies Scrum recommandées

- **Daily** 15 min orienté blocages SLA/UX
- **Sprint planning** avec estimation par `ID` ci-dessus
- **Review** avec présentation des métriques P50/P95/P99
- **Rétrospective** centrée fiabilité/performance

---

## 8) Jalons

- J+3: baseline disponible
- J+8: `queue_job` opérationnel en recette
- J+13: flux DVIG->Vault stabilisé
- J+17: objectif UX validé
- J+20: recette finale + COPIL

### Jalons recalés après exécution réelle

- J+13 atteint: flux DVIG->Vault stabilisé et SLA ERP->Vault validé (campagnes 100/500).
- Prochain jalon: validation UX `Vault sealed -> Linky data available <= 2 s (P95)`.
- Jalons finaux inchangés: recette complète + décision COPIL.

## 9) Addendum cloture fonctionnelle (2026-03-09)

- Nettoyage Odoo lab execute: suppression des paiements de campagne `SLA-*` (`721` enregistrements).
- Jeu metier de demonstration conserve:
  - `Total paiements = 4 387,00 EUR`
  - `Rapproche = 996,00 EUR`
  - `A rapprocher = 3 391,00 EUR`
- Correctifs cockpit appliques:
  - Card Paiements: formule detail corrigee (`Total - Rapproche`).
  - Card Tresorerie: `Position validee (Vault)` corrigee et alignee sur le rapproche (`996,00 EUR`).

