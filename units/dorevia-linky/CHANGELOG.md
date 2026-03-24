# Changelog — Dorevia Lynki

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [0.2.0-reste-a-rapprocher] - 2026-03-03

### Added
- **Indicateur « Reste à rapprocher »** (SPEC web38) sur la Card Paiements :
  - Affichage du pourcentage de paiements non rapprochés sur la période
  - Couleurs : Vert (&lt; 10 %), Jaune (10–30 %), Orange (&gt; 30 %) + texte « Fiabilité faible »
  - Masquage si complétude KO (données non garanties)
  - Lignes « Rapproché (période) » et « Total (période) » dans le détail
  - Tooltip : « Cet indicateur ne mesure pas la qualité comptable, mais la couverture probante des flux par des preuves bancaires »
- Extension de l'API `/api/treasury` : pass-through de `reconciliation_metrics` depuis le Vault

### Changed
- N/A

### Fixed
- N/A

---

## Format

- **Added** : nouvelles fonctionnalités
- **Changed** : modifications de fonctionnalités existantes
- **Deprecated** : fonctionnalités bientôt supprimées
- **Removed** : fonctionnalités supprimées
- **Fixed** : corrections de bugs
- **Security** : correctifs de sécurité
