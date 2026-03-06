# Changelog — Dorevia Vault

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.8.0-reste-a-rapprocher] - 2026-03-03

### Added
- **Indicateur « Reste à rapprocher »** (SPEC web38) : `GetReconciliationMetrics` dans storage, enrichissement de `GET /ui/aggregations/treasury` avec `reconciliation_metrics` (total_amount_abs, reconciled_amount_abs, remaining_amount_abs, remaining_ratio). Filtres alignés sur PaymentsAggregation (inbound + outbound hors remboursements). Règle rapproché : `COALESCE(SUM(direction), 0) > 0` via `financial_recon_deltas`.

### Changed
- N/A

### Fixed
- N/A

---

## [1.7.0-adjustments] - 2026-02-10 (Phase 1)

### Added
- **GET /ui/aggregations/adjustments** (SPEC_DOREVIA_ADJUSTMENTS_v1.0, ADDENDUM Phase 1) : agrégation dérivée des avoirs et remboursements (payments is_refund + invoices out_refund/in_refund). Paramètres : tenant, date_debut, date_fin (requis), event_type, direction, company_id, granularity (day|month), list=1. Réponse : total_amount, event_count, currency, series, events[] (si list=1). event_date canonique : payment_date pour les paiements, invoice_date pour les avoirs. RBAC : PermissionReadDocuments. Enregistrer la route dans le point d’entrée (ex. `app.Get("/ui/aggregations/adjustments", handlers.AdjustmentsAggregationHandler(db))`).

### Changed
- N/A

### Fixed
- N/A

---

## [1.6.2-payments] - 2026-02-09

### Added
- N/A

### Changed
- **Card Décaissements (payments-out)** : exclusion des remboursements / avoirs. Les documents avec `is_refund = true` ne sont plus inclus dans l’agrégation ni dans la liste (`list=1`). Alignement SPEC_DOREVIA_PAYMENTS_v1.1 §7.2 (card Avoirs/Remboursements à venir).

### Fixed
- N/A

---

## [1.6.1-payments] - 2026-02-09

### Added
- **Paramètre `list=1`** sur `GET /ui/aggregations/payments-in` et `payments-out` : la réponse inclut un tableau `events` (document_id, source_id, amount, payment_date, created_at) pour audit des constats sans calcul côté Vault (SPEC §10.4).

### Changed
- N/A

### Fixed
- N/A

---

## [1.2.0] - 2025-12-19

### Added
- Baseline version alignée avec `v1.2.0-rc1`
- Tag préfixé `vault/v1.2.0` pour intégration dans le système de versioning Dorevia

### Changed
- N/A (baseline pour versioning)

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## Notes

Cette version baseline (`vault/v1.2.0`) est alignée avec le tag existant `v1.2.0-rc1` et marque le début de l'intégration dans le système de versioning unifié de Dorevia Platform.

Les versions précédentes (v0.0.1, v1.2.0-rc1) restent disponibles dans l'historique Git mais ne sont pas documentées dans ce changelog.

---

## Format

Les types de changements sont :
- `Added` pour les nouvelles fonctionnalités
- `Changed` pour les changements dans les fonctionnalités existantes
- `Deprecated` pour les fonctionnalités bientôt supprimées
- `Removed` pour les fonctionnalités supprimées
- `Fixed` pour les corrections de bugs
- `Security` pour les vulnérabilités corrigées

[1.6.2-payments]: (image docker dorevia/vault:v1.6.2-payments)
[1.6.1-payments]: (image docker dorevia/vault:v1.6.1-payments)
[1.2.0]: https://github.com/doreviateam/dorevia-vault/releases/tag/vault/v1.2.0

