# Changelog — Dorevia Vault Connector

## [1.1.2] — 2026-02-28

### Corrections (revue code robustesse prod)

- **datetime** : Uniformisation `datetime.now()` → `fields.Datetime.now()` dans `_check_abandon_thresholds()` et `_can_enqueue_proof()` pour cohérence timezone Odoo.
- **cron_vault_fetch_proof** : Respect de `next_retry_at` (backoff) — même logique que `cron_vault_send_dvig`. Les factures en `pending_proof` avec `next_retry_at` dans le futur ne sont plus sélectionnées.
- **_fetch_and_apply_proof** : Garde anti-routage — vérification de `source_model == 'account.move'` et `source_id == move.id` avant passage en `vaulted`. Rejet si mismatch (multi-tenant).
- **action_securiser_maintenant** : Suppression du polling bloquant (`time.sleep` x4). Enqueue `_job_fetch_proof` via queue_job ou laisse le CRON prendre le relais. Évite de bloquer le thread HTTP 8+ secondes.

### Améliorations

- **next_retry_at** : Remise à `False` après succès (passage en `pending_proof` ou `vaulted`) pour éviter des traces de retry obsolètes.
- **Erreurs** : Troncature systématique à 500 caractères (`str(e)[:500]`) dans `_vault_init_moves()`, `_check_abandon_thresholds()` et tous les blocs d’erreur.

### Tests

- Nouveau fichier `test_proof_validation.py` : validation `source_model`/`source_id`, respect de `next_retry_at` dans `cron_vault_fetch_proof`.
- Mise à jour `test_cron.py` : domaine CRON #2 aligné sur `next_retry_at`.
- Mise à jour `test_action_securiser_maintenant.py` : adaptation au flux non bloquant (mock `with_delay` pour exécution sync en test).

---

## [1.1.1] — 2026-01-11

- SPEC v1.1.1 : Addendum reconciler, backoff fetch proof, politique no_abandon.
- Intégration queue_job pour orchestration temps réel.
- Vaulting des paiements (card Linky).
