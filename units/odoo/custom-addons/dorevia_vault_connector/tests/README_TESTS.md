# 🧪 Tests — Dorevia Vault Connector v1.1

**Version** : 1.0  
**Date** : 2026-01-11  
**Statut** : ⏳ Structure créée, tests à implémenter

---

## 📋 Structure Recommandée

```
tests/
├── __init__.py
├── test_vault_status.py          # Tests machine d'état
├── test_idempotence.py           # Tests idempotence
├── test_backoff.py               # Tests backoff exponentiel
├── test_classification.py        # Tests classification erreurs
├── test_cron_send_dvig.py        # Tests CRON #1
├── test_cron_fetch_proof.py      # Tests CRON #2
└── integration/
    ├── __init__.py
    └── test_end_to_end.py        # Tests d'intégration end-to-end
```

---

## 🎯 Couverture Cible

### Machine d'État (test_vault_status.py)

- [ ] Transition `todo` → `pending_proof` (CRON #1 succès)
- [ ] Transition `pending_proof` → `vaulted` (CRON #2 succès)
- [ ] Transition `todo` → `failed_soft` (CRON #1 erreur soft)
- [ ] Transition `todo` → `failed_hard` (CRON #1 erreur hard)
- [ ] Transition `pending_proof` → `failed_soft` (CRON #2 erreur soft)
- [ ] Transition `pending_proof` → `failed_hard` (CRON #2 erreur hard)
- [ ] Transition `failed_soft` → `todo` (retry après backoff)

### Idempotence (test_idempotence.py)

- [ ] Calcul clé SHA256 correct
- [ ] Clé identique pour même facture
- [ ] Clé différente pour factures différentes
- [ ] Détection doublons (clé existante)
- [ ] Index UNIQUE fonctionne

### Backoff (test_backoff.py)

- [ ] Tentative 1 : 2 min
- [ ] Tentative 2 : 4 min
- [ ] Tentative 3 : 8 min
- [ ] Tentative 4 : 16 min
- [ ] Tentative 5+ : 60 min (plafond)

### Classification Erreurs (test_classification.py)

- [ ] Timeout → failed_soft
- [ ] 502 → failed_soft
- [ ] 503 → failed_soft
- [ ] ConnectionError → failed_soft
- [ ] 400 → failed_hard
- [ ] 401 → failed_hard
- [ ] 403 → failed_hard
- [ ] 404 → failed_hard

### CRON #1 (test_cron_send_dvig.py)

- [ ] Sélection correcte (todo + failed_soft)
- [ ] Batch limit 50
- [ ] Envoi DVIG réussi
- [ ] Stockage event_id
- [ ] Gestion erreurs
- [ ] Vérification idempotence

### CRON #2 (test_cron_fetch_proof.py)

- [ ] Sélection correcte (pending_proof)
- [ ] Batch limit 50
- [ ] Récupération preuve réussie
- [ ] Stockage preuves (vault_id, sha256, jws, ledger_hash)
- [ ] Gestion erreurs
- [ ] Gestion 404 (document pas encore traité)

### Intégration (test_end_to_end.py)

- [ ] Flux complet : action_post() → todo → pending_proof → vaulted
- [ ] Flux avec erreur soft : todo → failed_soft → todo → pending_proof → vaulted
- [ ] Flux avec erreur hard : todo → failed_hard (bloqué)
- [ ] Multiples factures en parallèle
- [ ] Performance (batch 50)

---

## 📊 Couverture Cible

**Objectif** : >= 90% de couverture de code

---

## 🚀 Exécution

```bash
# Tous les tests
odoo -d test_db --test-enable --stop-after-init

# Tests spécifiques
odoo -d test_db --test-enable --stop-after-init --test-tags=dorevia_vault_connector
```

---

**Note** : Les tests seront implémentés dans le cadre du Sprint 3 (US-3.3).

---

**Document créé** : 2026-01-11  
**Auteur** : Dorevia Team
