# PLAN DE TESTS D'ACCEPTATION

## SLA `ERP event captured -> Vault sealed <= 5 s`

Version: 1.0  
Date: 09/03/2026  
Référence: `ZeDocs/web40/SPEC_SLA_ERP_EVENT_CAPTURED_TO_VAULT_SEALED.md`

---

## 1) Objectif

Valider en recette que la solution respecte l'exigence contractuelle:

`ERP event captured -> Vault sealed <= 5 s`

et les exigences associées:

- P95 <= 5 s
- P99 <= 10 s
- UX P95 <= 2 s (`Vault sealed -> Linky data available`)
- UX P99 <= 4 s (`Vault sealed -> Linky data available`)
- 0 perte d'événement
- 0 doublon métier

---

## 2) Périmètre de recette

- Flux paiements ERP (tenant pilote `o19`)
- Chaîne complète ERP -> DVIG -> Vault
- Restitution de preuve via métriques/exports de contrôle

Hors périmètre:

- UX détaillée Linky
- Tests de charge multi-tenant massif (phase ultérieure)

---

## 3) Pré-requis

1. Environnement de recette stable (ERP, DVIG, Vault, Linky démarrés).
2. Horloges synchronisées (NTP) sur tous les composants.
3. `queue_job` activé sur le flux paiements + worker dédié.
4. Métriques observabilité actives:
   - `sla_t_seconds`, `sla_p95_seconds`, `sla_p99_seconds`
   - `ux_t_seconds`, `ux_p95_seconds`, `ux_p99_seconds`
   - `events_total`, `events_failed`, `events_retried`, `events_lost`
   - `idempotency_conflicts_total`
5. Journalisation corrélable via `event_id`/`idempotency_key`.
6. Horodatage `linky_data_available_at` disponible (ou trace équivalente front/API).
7. Jeu de données recette préparé (partenaires, journaux, modes de paiement).

---

## 4) Données de test

### Jeu A - Nominal

- 50 paiements postés (montants variés, même devise)
- répartition temporelle sur 10 minutes

### Jeu B - Robustesse

- 200 paiements postés sur 15 minutes
- pics par rafales (burst)

### Jeu C - Idempotence

- 20 événements rejoués (même `idempotency_key`)

### Jeu D - Résilience

- pannes temporaires DVIG simulées
- pannes temporaires Vault simulées

---

## 5) Cas de tests d'acceptation

## 5.1 Fonctionnels

### TST-UAT-001 - Latence P95

- **Exigences couvertes**: `REQ-SLA-001`, `REQ-SLA-002`
- **Précondition**: jeu A exécuté
- **Etapes**:
  1. Poster 50 paiements ERP.
  2. Capturer `erp_event_captured_at` et `vault_sealed_at`.
  3. Calculer distribution de `T_sla`.
- **Résultat attendu**: P95 <= 5 s.
- **Preuve**: export percentiles + capture dashboard SLA.

### TST-UAT-002 - Latence P99

- **Exigences couvertes**: `REQ-SLA-003`
- **Précondition**: jeu B exécuté
- **Etapes**:
  1. Poster 200 paiements en charge.
  2. Mesurer `T_sla` sur l'ensemble.
- **Résultat attendu**: P99 <= 10 s.
- **Preuve**: rapport de charge + série temporelle.

### TST-UAT-003 - Perte d'événement

- **Exigences couvertes**: `REQ-REL-001`
- **Etapes**:
  1. Comparer nombre d'événements capturés ERP vs scellés Vault.
  2. Vérifier `events_lost`.
- **Résultat attendu**: 0 perte.
- **Preuve**: table de rapprochement + métrique `events_lost=0`.

### TST-UAT-004 - Doublon métier

- **Exigences couvertes**: `REQ-REL-002`, `NFR-REL-001`
- **Etapes**:
  1. Rejouer des événements du jeu C.
  2. Vérifier unicité côté Vault par clé d'idempotence.
- **Résultat attendu**: 0 doublon.
- **Preuve**: audit `idempotency_key`, `idempotency_conflicts_total`.

## 5.2 Objectif UX complémentaire

### TST-UAT-005 - UX Latence P95

- **Exigences couvertes**: `REQ-UX-001`, `NFR-PERF-003`
- **Etapes**:
  1. Sur jeu A, relever `vault_sealed_at`.
  2. Relever `linky_data_available_at` (API/UI).
  3. Calculer `T_ux = linky_data_available_at - vault_sealed_at`.
- **Résultat attendu**: P95 `T_ux <= 2 s`.
- **Preuve**: export métrique UX + traces horodatées.

### TST-UAT-006 - UX Latence P99

- **Exigences couvertes**: `REQ-UX-002`
- **Etapes**:
  1. Sur jeu B, mesurer `T_ux`.
  2. Calculer P99.
- **Résultat attendu**: P99 `T_ux <= 4 s`.
- **Preuve**: rapport UX charge.

## 5.3 Résilience

### TST-UAT-007 - Reprise après panne DVIG

- **Exigences couvertes**: `REQ-FUNC-005`, `NFR-REL-002`
- **Etapes**:
  1. Simuler indisponibilité DVIG 2 min.
  2. Poster des paiements pendant l'incident.
  3. Rétablir DVIG.
  4. Vérifier reprise et scellement final.
- **Résultat attendu**: pas de perte, retries visibles, convergence complète.
- **Preuve**: logs retries + rapprochement final.

### TST-UAT-008 - Reprise après panne Vault

- **Exigences couvertes**: `REQ-FUNC-005`, `NFR-REL-002`
- **Etapes**:
  1. Simuler indisponibilité Vault 2 min.
  2. Poster des paiements.
  3. Rétablir Vault.
  4. Vérifier rattrapage.
- **Résultat attendu**: pas de perte, pas de doublon.
- **Preuve**: logs outbox DVIG + contrôle final Vault.

## 5.4 Observabilité et alertes

### TST-UAT-009 - Disponibilité métriques SLA

- **Exigences couvertes**: `OBS-MET-001..004`, `NFR-OPS-002`
- **Etapes**:
  1. Exécuter jeu A.
  2. Vérifier disponibilité des métriques.
- **Résultat attendu**: métriques complètes par tenant.
- **Preuve**: export métriques + capture dashboard.

### TST-UAT-010 - Alertes de seuil

- **Exigences couvertes**: `OBS-ALT-001..003`
- **Etapes**:
  1. Dégrader artificiellement latence.
  2. Vérifier déclenchement warning/critique.
- **Résultat attendu**: alertes conformes aux seuils.
- **Preuve**: journal d'alerte horodaté.

## 6) Matrice synthétique (exigence -> tests)

| Exigence | Tests d'acceptation |
|---|---|
| `REQ-SLA-001`, `REQ-SLA-002` | `TST-UAT-001` |
| `REQ-SLA-003` | `TST-UAT-002` |
| `REQ-REL-001` | `TST-UAT-003`, `TST-UAT-007`, `TST-UAT-008` |
| `REQ-REL-002` | `TST-UAT-004` |
| `REQ-FUNC-005` | `TST-UAT-007`, `TST-UAT-008` |
| `OBS-MET-001..004` | `TST-UAT-009` |
| `OBS-ALT-001..003` | `TST-UAT-010` |
| `REQ-UX-001`, `NFR-PERF-003` | `TST-UAT-005` |
| `REQ-UX-002` | `TST-UAT-006` |

---

## 7) Critères Go / No-Go recette

## GO si:

- `TST-UAT-001` et `TST-UAT-002` validés
- `TST-UAT-005` et `TST-UAT-006` validés
- `TST-UAT-003` et `TST-UAT-004` validés (0 perte, 0 doublon)
- `TST-UAT-009` validé (observabilité disponible)
- `TST-UAT-010` validé (alertes opérationnelles)

## NO-GO si:

- P95 > 5 s ou P99 > 10 s
- UX P95 > 2 s ou UX P99 > 4 s
- perte d'événement > 0
- doublon métier détecté
- impossibilité d'auditer la chaîne (métriques/logs insuffisants)

---

## 8) Livrables de recette

1. Rapport de campagne de tests signé MOA/MOE.
2. Exports métriques (P50/P95/P99) par tenant.
3. Preuves de non-perte / non-doublon.
4. Journal des alertes (tests simulés).
5. Décision COPIL Go/No-Go.

---

## 9) Planning recommandé (pilote o19)

- J1-J2: préparation environnement + données + instrumentation
- J3: exécution tests fonctionnels et idempotence
- J4: tests résilience et alerting
- J5: consolidation preuves + comité de validation

## 10) Addendum jeu de donnees de recette MOA (2026-03-09)

Pour les tests de lisibilite fonctionnelle MOA, utiliser le jeu de donnees de reference suivant:

- Odoo lab sans donnees `SLA-*` (purge executee).
- Flux paiements attendus:
  - Total periode: `4 387,00 EUR`
  - Rapproche: `996,00 EUR`
  - A rapprocher: `3 391,00 EUR`
- Tresorerie attendue:
  - Solde comptable (ERP): `996,00 EUR`
  - Position validee (Vault): `996,00 EUR`

