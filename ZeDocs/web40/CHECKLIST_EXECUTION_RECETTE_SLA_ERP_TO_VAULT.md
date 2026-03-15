# CHECKLIST D'EXECUTION RECETTE

## SLA `ERP event captured -> Vault sealed <= 5 s`

Version: 1.0  
Date: 09/03/2026  
Références:

- `ZeDocs/web40/SPEC_SLA_ERP_EVENT_CAPTURED_TO_VAULT_SEALED.md`
- `ZeDocs/web40/PLAN_TESTS_ACCEPTATION_SLA_ERP_TO_VAULT.md`

---

## 1) Informations de session

- [ ] Tenant testé: `o19`
- [ ] Environnement: `lab` / `preprod` / `prod-like`
- [ ] Date/heure début:
- [ ] Responsable exécution:
- [ ] Observateur MOA:
- [ ] Version applicative déployée (ERP/DVIG/Vault/Linky):

---

## 2) Pré-check environnement

- [ ] ERP accessible et authentification OK
- [ ] DVIG accessible (`/health` OK)
- [ ] Vault accessible (`/health` ou endpoint équivalent OK)
- [ ] Linky accessible
- [ ] `queue_job` activé pour paiements
- [ ] Worker `queue_job` dédié actif
- [ ] Horloges synchronisées (NTP)
- [ ] Logs corrélables via `event_id` / `idempotency_key`
- [ ] Métriques SLA disponibles (`sla_t_seconds`, P95, P99, etc.)
- [ ] Métriques UX disponibles (`ux_t_seconds`, UX P95, UX P99)
- [ ] Alerting configuré (warning P95, critique P99, perte)

Evidence à joindre:

- [ ] Capture état services
- [ ] Capture dashboard métriques

---

## 3) Jeu A - Nominal (50 paiements)

### Exécution

- [ ] Poster 50 paiements ERP (montants variés)
- [ ] Vérifier capture horodatée `erp_event_captured_at`
- [ ] Vérifier scellement `vault_sealed_at`
- [ ] Exporter la distribution `T_sla`

### Résultats attendus

- [ ] P95 <= 5 s
- [ ] Aucune erreur bloquante pipeline

Evidence à joindre:

- [ ] Export percentiles
- [ ] Extrait logs corrélés

---

## 4) Jeu B - Robustesse (200 paiements en charge)

### Exécution

- [ ] Injecter 200 paiements sur 15 min (rafales incluses)
- [ ] Mesurer P95/P99 de `T_sla`

### Résultats attendus

- [ ] P95 <= 5 s
- [ ] P99 <= 10 s

Evidence à joindre:

- [ ] Rapport de charge
- [ ] Courbe temporelle latence

---

## 5) Idempotence (rejeu d'événements)

### Exécution

- [ ] Rejouer 20 événements (même `idempotency_key`)
- [ ] Contrôler unicité métier côté Vault

### Résultats attendus

- [ ] 0 doublon métier
- [ ] `idempotency_conflicts_total` conforme

Evidence à joindre:

- [ ] Audit clés d'idempotence

---

## 6) Résilience - panne DVIG

### Exécution

- [ ] Simuler indisponibilité DVIG (2 min)
- [ ] Poster paiements pendant incident
- [ ] Rétablir DVIG
- [ ] Vérifier reprise via retries

### Résultats attendus

- [ ] 0 perte
- [ ] Convergence complète après reprise

Evidence à joindre:

- [ ] Logs retries
- [ ] Rapprochement final ERP vs Vault

---

## 7) Résilience - panne Vault

### Exécution

- [ ] Simuler indisponibilité Vault (2 min)
- [ ] Poster paiements pendant incident
- [ ] Rétablir Vault
- [ ] Vérifier rattrapage DVIG -> Vault

### Résultats attendus

- [ ] 0 perte
- [ ] 0 doublon

Evidence à joindre:

- [ ] Logs outbox / retries
- [ ] Rapport de rattrapage

---

## 8) Observabilité et alertes

### Exécution

- [ ] Vérifier présence métriques obligatoires
- [ ] Simuler dérive latence > 5 s
- [ ] Vérifier alerte warning
- [ ] Simuler dérive > 10 s
- [ ] Vérifier alerte critique
- [ ] Simuler dérive UX > 2 s
- [ ] Vérifier alerte warning UX
- [ ] Simuler dérive UX > 4 s
- [ ] Vérifier alerte critique UX
- [ ] Simuler perte d'événement
- [ ] Vérifier alerte critique perte

### Résultats attendus

- [ ] Alertes déclenchées selon seuils
- [ ] Alertes horodatées et traçables

Evidence à joindre:

- [ ] Journal alertes
- [ ] Captures dashboard

---

## 9) Vérification finale de cohérence

- [ ] `events_lost = 0`
- [ ] `events_failed` dans la tolérance définie
- [ ] `P95 <= 5 s`
- [ ] `P99 <= 10 s`
- [ ] `UX P95 <= 2 s` (`Vault sealed -> Linky data available`)
- [ ] `UX P99 <= 4 s` (`Vault sealed -> Linky data available`)
- [ ] ERP total capturé = Vault total scellé
- [ ] Aucune anomalie bloquante ouverte

### Vérification explicite UAT UX (Sprint 3)

- [ ] `TST-UAT-005` validé (UX P95 <= 2 s) avec export `/api/ux-metrics`
- [ ] `TST-UAT-006` validé (UX P99 <= 4 s) avec export `/api/ux-metrics`
- [ ] Volume d'échantillons documenté (`count`) et contexte (`tenant`, fenêtre, période)
- [ ] Captures cockpit jointes (footer UX P95 + état)

---

## 10) Décision recette

### GO

- [ ] Tous les critères obligatoires validés
- [ ] Preuves archivées
- [ ] Validation MOA signée

### NO-GO

- [ ] Critère(s) non respecté(s)
- [ ] Plan d'actions correctives défini
- [ ] Nouvelle date de re-test fixée

Commentaires de décision:

---

---

Signatures:

- MOA:
- MOE:
- MCO:
- Date:

## Addendum execution (2026-03-09)

Points complementaires a verifier en fin de recette:

- [ ] Odoo lab ne contient plus de paiements de campagne `SLA-*` (`0` attendu).
- [ ] Card Paiements:
  - Total = `4 387,00 EUR`
  - Rapproche = `996,00 EUR`
  - A rapprocher = `3 391,00 EUR`
- [ ] Card Tresorerie:
  - Solde comptable (ERP) = `996,00 EUR`
  - Position validee (Vault) = `996,00 EUR`

