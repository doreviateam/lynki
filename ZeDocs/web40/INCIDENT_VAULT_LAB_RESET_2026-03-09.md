# Incident Vault Lab - Decision Reset (2026-03-09)

## Constat avant reset

- Corruption PostgreSQL confirmée sur la base Vault lab:
  - `could not read block`
  - `unexpected data beyond EOF`
  - `No such file or directory` sur fichiers `base/...`
- Purge des doublons `diva_insights` réalisée avec sauvegarde (`diva_insights_dedup_backup_20260309`).
- `REINDEX DATABASE dorevia_vault` exécuté mais insuffisant pour restaurer un état d'écriture fiable.
- Erreurs `500` persistantes sur `POST /api/v1/payments` pendant les relances DVIG.

## Décision technique

- Abandon de la base Vault lab corrompue.
- Reconstruction propre par reset DB + remigration.
- Objectif: restaurer un pipeline ERP -> DVIG -> Vault fiable pour campagne SLA.

## Portée opérationnelle

- Environnement: lab.
- Impact accepté: perte de l'historique Vault lab.
- Suites prévues:
  1. reset DB Vault lab,
  2. remigration + vérifications santé,
  3. replay des 17 événements en échec,
  4. campagne 20, puis 100 et 500 événements pour mesure SLA.

## Addendum de cloture (2026-03-09)

Les suites prevues ont ete executees et ont permis la reprise complete des campagnes SLA.  
Apres validation technique, l'environnement Odoo lab a ete nettoye des donnees de campagne `SLA-*` pour revenir a un etat de demonstration metier lisible pour la MOA.
