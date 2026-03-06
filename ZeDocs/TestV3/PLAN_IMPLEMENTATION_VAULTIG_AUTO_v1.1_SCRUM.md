# 🎯 Plan d'Implémentation — SPEC Dorevia Vaulting Automatique v1.1 — Mode Scrum

**Version** : 1.1 (mise à jour avec recommandations techniques validées)  
**Date** : 2026-01-11  
**Base** : `SPEC_DOREVIA_VAULTIG_AUTO_v1.1.md` (Validée post review Dorevia Team)  
**Durée estimée** : 3 sprints (3 semaines)  
**Équipe** : Dev plateforme / Vault

---

## 📋 Vue d'Ensemble

### Objectif SPEC v1.1

Mettre en place un système de **vaulting automatique, asynchrone, robuste et observable** pour les documents comptables (factures), sans intervention utilisateur.

**Philosophie** : *La sécurité doit être invisible pour l'utilisateur.*

### Tenant de Référence

Le tenant **`core`** sera utilisé comme tenant de référence pour la SPEC v1.1. Toutes les fonctionnalités sont d'abord implémentées et validées sur le tenant `core` avant d'être étendues aux autres tenants.

### Définition de "Fait" (DoD)

La SPEC v1.1 est terminée si :
- ✅ Machine d'état complète avec tous les champs (status, last_try, attempt_count, etc.)
- ✅ CRON #1 (envoi DVIG) opérationnel et asynchrone
- ✅ CRON #2 (récupération preuve) opérationnel
- ✅ Backoff exponentiel implémenté avec formule précise
- ✅ Classification erreurs (failed_soft vs failed_hard) opérationnelle
- ✅ Idempotence garantie via clé logique SHA256
- ✅ Métriques observabilité collectées et stockées
- ✅ Migration état actuel → nouveau système complétée
- ✅ Tests unitaires et d'intégration passent (100% couverture)
- ✅ Interface utilisateur mise à jour (bloc informatif, mode debug)
- ✅ Compatibilité `dorevia_posted_lock` assurée

**Statut** : ⏳ **À démarrer**

---

## 🏃 Structure Scrum

### Sprints

- **Sprint 1** : Machine d'état + Migration (1 semaine) — 18 points
- **Sprint 2** : CRON #1 + CRON #2 + Backoff (1 semaine) — 21 points
- **Sprint 3** : Observabilité + UI + Tests + Documentation (1 semaine) — 13 points

**Total** : 3 semaines — 52 points

---

## 📦 Sprint 1 : Machine d'état + Migration (1 semaine)

**Points** : 18 points  
**Objectif** : Préparer la base de données avec la machine d'état complète, implémenter l'idempotence, et migrer les données existantes.

### User Stories

#### US-1.1 : Migration base de données — Machine d'état

**En tant que** développeur plateforme  
**Je veux** ajouter tous les champs de la machine d'état à `account.move`  
**Afin de** supporter le vaulting asynchrone avec traçabilité complète

**Points** : 5

**Critères d'acceptation** :
- [ ] Migration Odoo créée (ajout champs dans `account.move`)
- [ ] Champs ajoutés :
  - `dorevia_vault_status` (Char) : todo, pending_proof, vaulted, failed_soft, failed_hard
  - `dorevia_vault_last_try_at` (Datetime)
  - `dorevia_vault_attempt_count` (Integer, default=0)
  - `dorevia_vault_last_error` (Text)
  - `dorevia_vault_next_retry_at` (Datetime)
  - `dorevia_dvig_event_id` (Char)
  - `dorevia_vault_idempotency_key` (Char)
- [ ] Index créés pour optimiser les requêtes CRON
- [ ] Index UNIQUE sur `dorevia_dvig_event_id` (anti-replay)
- [ ] Index UNIQUE sur `dorevia_vault_idempotency_key` (idempotence)
- [ ] Migration testée et réversible
- [ ] Valeurs par défaut définies pour les factures existantes

**Tâches techniques** :
- [ ] Créer migration Odoo dans `dorevia_vault_connector/models/`
- [ ] Ajouter champs dans `dorevia_posted_lock/models/account_move.py` ou créer nouveau module
- [ ] Créer index : `idx_account_move_vault_status`, `idx_account_move_vault_next_retry`
- [ ] Créer index UNIQUE : `idx_account_move_dvig_event_id_unique` sur `dorevia_dvig_event_id`
- [ ] Créer index UNIQUE : `idx_account_move_idempotency_key_unique` sur `dorevia_vault_idempotency_key`
- [ ] Tester migration sur environnement de développement
- [ ] Documenter migration et rollback

**Livrables** :
- ✅ Migration Odoo avec tous les champs
- ✅ Documentation migration

---

#### US-1.2 : Implémentation idempotence — Clé logique SHA256

**En tant que** développeur Vault  
**Je veux** calculer et stocker une clé d'idempotence pour chaque facture  
**Afin de** garantir l'absence de doublons et protéger contre les race conditions

**Points** : 3

**Critères d'acceptation** :
- [ ] Fonction `_compute_idempotency_key()` créée
- [ ] Formule SHA256 implémentée : `SHA256(source + model + record_id + event_type + posted_at)`
- [ ] Clé stockée dans `dorevia_vault_idempotency_key` lors de la création/validation
- [ ] Vérification idempotence avant envoi DVIG (évite doublons)
- [ ] Tests unitaires pour calcul clé

**Tâches techniques** :
- [ ] Créer méthode `_compute_idempotency_key()` dans `account_move.py`
- [ ] Implémenter calcul SHA256 avec `hashlib`
- [ ] Appeler lors de `action_post()` si conditions vaulting remplies
- [ ] Vérifier clé existante avant envoi dans CRON #1
- [ ] Tests unitaires

**Livrables** :
- ✅ Méthode `_compute_idempotency_key()` fonctionnelle
- ✅ Tests unitaires

---

#### US-1.3 : Migration données existantes — État actuel → Machine d'état

**En tant que** développeur plateforme  
**Je veux** migrer les données existantes vers la nouvelle machine d'état  
**Afin de** assurer la continuité sans perte de données

**Points** : 5

**Critères d'acceptation** :
- [ ] Script de migration créé
- [ ] `dorevia_vaulted=True` → `dorevia_vault_status='vaulted'`
- [ ] Factures `posted` non vaultées → `dorevia_vault_status='todo'`
- [ ] Calcul `dorevia_vault_idempotency_key` pour factures existantes
- [ ] Migration testée sur environnement de développement
- [ ] Script réversible (rollback possible)
- [ ] Logs détaillés de la migration

**Tâches techniques** :
- [ ] Créer script Python Odoo `migrate_vault_status.py`
- [ ] Identifier toutes les factures avec `dorevia_vaulted=True`
- [ ] Mettre à jour `dorevia_vault_status='vaulted'` pour ces factures
- [ ] Identifier factures `posted` avec `dorevia_vaulted=False`
- [ ] Mettre à jour `dorevia_vault_status='todo'` pour ces factures
- [ ] Calculer et stocker `dorevia_vault_idempotency_key` pour toutes
- [ ] Tester migration sur copie de production
- [ ] Documenter procédure migration

**Livrables** :
- ✅ Script de migration `migrate_vault_status.py`
- ✅ Documentation procédure migration

---

#### US-1.4 : Suppression vaulting synchrone — action_post()

**En tant que** développeur plateforme  
**Je veux** supprimer les appels réseau dans `action_post()`  
**Afin de** respecter le principe "Aucun appel réseau dans action_post()"

**Points** : 3

**Critères d'acceptation** :
- [ ] Suppression appel `_vault_to_dvig()` dans `action_post()`
- [ ] Remplacement par simple initialisation `dorevia_vault_status='todo'`
- [ ] Calcul et stockage `dorevia_vault_idempotency_key` lors de `action_post()`
- [ ] Tests unitaires pour vérifier absence d'appels réseau
- [ ] Documentation mise à jour

**Tâches techniques** :
- [ ] Modifier `action_post()` dans `dorevia_vault_connector/models/account_move.py`
- [ ] Supprimer appel `_vault_to_dvig()`
- [ ] Ajouter initialisation `dorevia_vault_status='todo'` si conditions vaulting remplies
- [ ] Appeler `_compute_idempotency_key()` et stocker
- [ ] Tests unitaires
- [ ] Mettre à jour documentation

**Livrables** :
- ✅ `action_post()` sans appels réseau
- ✅ Tests unitaires

---

#### US-1.5 : Compatibilité dorevia_posted_lock — Adaptation nouveau statut

**En tant que** développeur plateforme  
**Je veux** adapter `dorevia_posted_lock` pour utiliser le nouveau statut  
**Afin de** maintenir le verrouillage renforcé avec la machine d'état

**Points** : 2

**Critères d'acceptation** :
- [ ] `dorevia_posted_lock` vérifie `dorevia_vault_status='vaulted'` au lieu de `dorevia_vaulted=True`
- [ ] Verrouillage renforcé maintenu (même comportement)
- [ ] Tests unitaires pour vérifier compatibilité
- [ ] Documentation mise à jour

**Tâches techniques** :
- [ ] Modifier `dorevia_posted_lock/models/account_move.py`
- [ ] Remplacer vérification `dorevia_vaulted=True` par `dorevia_vault_status='vaulted'`
- [ ] Tests unitaires
- [ ] Mettre à jour documentation

**Livrables** :
- ✅ `dorevia_posted_lock` compatible avec nouveau statut
- ✅ Tests unitaires

---

### Backlog Sprint 1

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-1.1 | Migration base de données — Machine d'état | 5 | P0 |
| US-1.2 | Implémentation idempotence — Clé logique SHA256 | 3 | P0 |
| US-1.3 | Migration données existantes | 5 | P0 |
| US-1.4 | Suppression vaulting synchrone — action_post() | 3 | P0 |
| US-1.5 | Compatibilité dorevia_posted_lock | 2 | P0 |

**Total Sprint 1** : 18 points

---

## 📦 Sprint 2 : CRON #1 + CRON #2 + Backoff (1 semaine)

**Points** : 21 points  
**Objectif** : Implémenter les deux CRON jobs asynchrones, le backoff exponentiel, et la classification des erreurs.

### User Stories

#### US-2.1 : CRON #1 — Envoi DVIG asynchrone

**En tant que** développeur Vault  
**Je veux** un CRON qui envoie les factures vers DVIG de manière asynchrone  
**Afin de** éviter tout blocage utilisateur lors de la validation

**Points** : 8

**Critères d'acceptation** :
- [ ] CRON créé avec fréquence 5 minutes
- [ ] Sélection : `status = todo | failed_soft` ET `next_retry_at <= now()`
- [ ] Batch : 50 max par exécution
- [ ] Construction payload DVIG (format existant)
- [ ] Envoi DVIG asynchrone
- [ ] Succès : `status = pending_proof`, stockage `dorevia_dvig_event_id`
- [ ] Échec : classification erreur (soft/hard) et backoff
- [ ] Vérification idempotence avant envoi (évite doublons)
- [ ] Logs détaillés (succès, échecs, erreurs)
- [ ] Tests unitaires et d'intégration

**Tâches techniques** :
- [ ] Créer CRON `ir_cron_vault_send_dvig` dans `data/ir_cron.xml`
- [ ] Créer méthode `cron_vault_send_dvig()` dans `account_move.py`
- [ ] Implémenter sélection avec domain : `[('dorevia_vault_status', 'in', ['todo', 'failed_soft']), ('dorevia_vault_next_retry_at', '<=', datetime.now())]`
- [ ] Limiter à 50 avec `.limit(50)`
- [ ] Réutiliser `_build_dvig_payload()` existant
- [ ] Appel DVIG avec gestion erreurs
- [ ] Classification erreurs (US-2.3)
- [ ] Mise à jour statut et champs associés
- [ ] Tests unitaires et d'intégration

**Livrables** :
- ✅ CRON #1 opérationnel
- ✅ Tests unitaires et d'intégration

---

#### US-2.2 : CRON #2 — Récupération preuve

**En tant que** développeur Vault  
**Je veux** un CRON qui récupère les preuves depuis Vault  
**Afin de** finaliser le vaulting avec stockage des preuves

**Points** : 8

**Critères d'acceptation** :
- [ ] CRON créé avec fréquence 5 minutes
- [ ] Sélection : `status = pending_proof`
- [ ] Batch : 50 max par exécution
- [ ] Appel Vault pour récupérer preuve : `/api/v1/proof/{dorevia_dvig_event_id}`
- [ ] Si preuve OK : `status = vaulted`, stockage :
  - `dorevia_vault_id`
  - `dorevia_vault_sha256`
  - `dorevia_vault_evidence_jws`
  - `dorevia_vault_ledger_hash`
- [ ] Si erreur : classification (soft → retry, hard → failed_hard)
- [ ] Logs détaillés
- [ ] Tests unitaires et d'intégration

**Tâches techniques** :
- [ ] Créer CRON `ir_cron_vault_fetch_proof` dans `data/ir_cron.xml`
- [ ] Créer méthode `cron_vault_fetch_proof()` dans `account_move.py`
- [ ] Implémenter sélection : `[('dorevia_vault_status', '=', 'pending_proof')]`
- [ ] Limiter à 50 avec `.limit(50)`
- [ ] Appel Vault API : `/api/v1/proof/{dorevia_dvig_event_id}` (endpoint validé)
- [ ] Parsing réponse Vault
- [ ] Stockage preuves dans champs existants
- [ ] Classification erreurs (US-2.3)
- [ ] Mise à jour statut
- [ ] Tests unitaires et d'intégration

**Livrables** :
- ✅ CRON #2 opérationnel
- ✅ Tests unitaires et d'intégration

---

#### US-2.3 : Classification erreurs — failed_soft vs failed_hard

**En tant que** développeur Vault  
**Je veux** classifier les erreurs en soft (retry) ou hard (pas de retry)  
**Afin de** éviter les tentatives inutiles sur erreurs définitives

**Points** : 3

**Critères d'acceptation** :
- [ ] Fonction `_classify_error()` créée
- [ ] Règles classification implémentées :
  - **failed_soft** : timeout, 502, 503, erreur réseau
  - **failed_hard** : 400, 401, 403, 404
- [ ] Utilisée dans CRON #1 et CRON #2
- [ ] Mise à jour `dorevia_vault_status` selon classification
- [ ] Tests unitaires pour chaque type d'erreur

**Tâches techniques** :
- [ ] Créer méthode `_classify_error(exception, status_code)` dans `account_move.py`
- [ ] Implémenter règles classification
- [ ] Retourner `'failed_soft'` ou `'failed_hard'`
- [ ] Utiliser dans CRON #1 et CRON #2
- [ ] Tests unitaires pour chaque cas

**Livrables** :
- ✅ Fonction `_classify_error()` fonctionnelle
- ✅ Tests unitaires

---

#### US-2.4 : Backoff exponentiel — Retry intelligent

**En tant que** développeur Vault  
**Je veux** implémenter un backoff exponentiel pour les retries  
**Afin de** éviter de surcharger DVIG/Vault en cas de panne

**Points** : 2

**Critères d'acceptation** :
- [ ] Fonction `_calculate_next_retry()` créée
- [ ] Formule implémentée : `next_retry = now() + min(2 ** attempt_count * 60, 3600)`
- [ ] Table de délais respectée :
  - Tentative 1 : 2 min
  - Tentative 2 : 4 min
  - Tentative 3 : 8 min
  - Tentative 4 : 16 min
  - Tentative 5+ : 60 min (plafond)
- [ ] Mise à jour `dorevia_vault_next_retry_at` et `dorevia_vault_attempt_count`
- [ ] Utilisée dans CRON #1 et CRON #2
- [ ] Tests unitaires pour chaque tentative

**Tâches techniques** :
- [ ] Créer méthode `_calculate_next_retry(attempt_count)` dans `account_move.py`
- [ ] Implémenter formule : `datetime.now() + timedelta(seconds=min(2 ** attempt_count * 60, 3600))`
- [ ] Utiliser dans CRON #1 et CRON #2 après échec
- [ ] Incrémenter `dorevia_vault_attempt_count`
- [ ] Mettre à jour `dorevia_vault_next_retry_at`
- [ ] Tests unitaires pour chaque tentative

**Livrables** :
- ✅ Fonction `_calculate_next_retry()` fonctionnelle
- ✅ Tests unitaires

---

### Backlog Sprint 2

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-2.1 | CRON #1 — Envoi DVIG asynchrone | 8 | P0 |
| US-2.2 | CRON #2 — Récupération preuve | 8 | P0 |
| US-2.3 | Classification erreurs | 3 | P0 |
| US-2.4 | Backoff exponentiel | 2 | P0 |

**Total Sprint 2** : 21 points

---

## 📦 Sprint 3 : Observabilité + UI + Tests + Documentation (1 semaine)

**Points** : 13 points  
**Objectif** : Implémenter les métriques d'observabilité, mettre à jour l'interface utilisateur, compléter les tests, et finaliser la documentation.

### User Stories

#### US-3.1 : Modèle métriques — Observabilité

**En tant que** développeur plateforme  
**Je veux** un modèle pour stocker les métriques de vaulting  
**Afin de** monitorer le système et détecter les problèmes

**Points** : 5

**Critères d'acceptation** :
- [ ] Modèle `dorevia.vault.metric` créé
- [ ] Champs : `date`, `total_sent`, `success`, `failed_soft`, `failed_hard`, `backlog`
- [ ] CRON pour calculer métriques (fréquence à définir : toutes les heures ?)
- [ ] Alimentation automatique depuis CRON #1 et CRON #2
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Créer modèle `dorevia_vault_metrics.py` dans nouveau module ou existant
- [ ] Définir champs dans modèle
- [ ] Créer CRON `ir_cron_vault_metrics` (fréquence à définir)
- [ ] Créer méthode `_compute_metrics()` pour calculer métriques
- [ ] Alimenter depuis CRON #1 et CRON #2 (logs ou compteurs)
- [ ] Tests unitaires

**Livrables** :
- ✅ Modèle `dorevia.vault.metric` opérationnel
- ✅ CRON calcul métriques
- ✅ Tests unitaires

---

#### US-3.2 : Interface utilisateur — Bloc informatif + Mode debug

**En tant que** développeur plateforme  
**Je veux** mettre à jour l'interface utilisateur pour afficher le nouveau statut  
**Afin de** informer l'utilisateur sans complexité

**Points** : 3

**Critères d'acceptation** :
- [ ] Bloc informatif mis à jour avec `dorevia_vault_status`
- [ ] Affichage : statut, date vault, hash, preuve (si vaulted)
- [ ] Boutons manuels masqués par défaut
- [ ] Mode debug : boutons visibles uniquement pour admins
- [ ] Tests fonctionnels

**Tâches techniques** :
- [ ] Modifier vue `account_move_views.xml` dans `dorevia_vault_connector`
- [ ] Mettre à jour bloc informatif avec nouveau statut
- [ ] Masquer boutons `action_vault` et `action_refresh_vault_info` par défaut
- [ ] Ajouter condition mode debug (groupe admin)
- [ ] Tests fonctionnels

**Livrables** :
- ✅ Interface utilisateur mise à jour
- ✅ Tests fonctionnels

---

#### US-3.3 : Tests complets — Couverture 100%

**En tant que** développeur plateforme  
**Je veux** une couverture de tests complète pour la SPEC v1.1  
**Afin de** garantir la qualité et la robustesse

**Points** : 3

**Critères d'acceptation** :
- [ ] Tests unitaires machine d'état (tous les statuts)
- [ ] Tests backoff exponentiel (toutes les tentatives)
- [ ] Tests classification erreurs (tous les cas)
- [ ] Tests idempotence (doublons, race conditions)
- [ ] Tests CRON #1 (envoi DVIG)
- [ ] Tests CRON #2 (récupération preuve)
- [ ] Tests d'intégration end-to-end
- [ ] Couverture >= 90%

**Tâches techniques** :
- [ ] Créer tests unitaires dans `tests/test_vault_status.py`
- [ ] Créer tests CRON dans `tests/test_cron_vault.py`
- [ ] Créer tests d'intégration dans `tests/integration/`
- [ ] Exécuter tous les tests
- [ ] Vérifier couverture avec `coverage`

**Livrables** :
- ✅ Suite de tests complète
- ✅ Rapport de couverture

---

#### US-3.4 : Documentation — Guide utilisateur + Technique

**En tant que** développeur plateforme  
**Je veux** une documentation complète pour la SPEC v1.1  
**Afin de** faciliter la maintenance et l'utilisation

**Points** : 2

**Critères d'acceptation** :
- [ ] Documentation technique (architecture, CRON, backoff)
- [ ] Guide utilisateur (interface, statuts)
- [ ] Guide migration (procédure étape par étape)
- [ ] Documentation API (endpoints Vault utilisés)
- [ ] README module mis à jour

**Tâches techniques** :
- [ ] Créer `GUIDE_VAULTING_AUTO_v1.1.md`
- [ ] Créer `MIGRATION_V1.0_TO_V1.1.md`
- [ ] Mettre à jour README module
- [ ] Documenter architecture et flux

**Livrables** :
- ✅ Documentation complète

---

### Backlog Sprint 3

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-3.1 | Modèle métriques — Observabilité | 5 | P0 |
| US-3.2 | Interface utilisateur — Bloc informatif + Mode debug | 3 | P0 |
| US-3.3 | Tests complets — Couverture 100% | 3 | P0 |
| US-3.4 | Documentation — Guide utilisateur + Technique | 2 | P0 |

**Total Sprint 3** : 13 points

---

## 📊 Backlog Global SPEC v1.1

### Vue d'ensemble

| Sprint | Durée | Points | Objectif Principal |
|--------|-------|--------|-------------------|
| Sprint 1 | 1 semaine | 18 | Machine d'état + Migration |
| Sprint 2 | 1 semaine | 21 | CRON #1 + CRON #2 + Backoff |
| Sprint 3 | 1 semaine | 13 | Observabilité + UI + Tests + Doc |
| **Total** | **3 semaines** | **52 points** | |

### Backlog par Priorité

#### P0 — Must have (SPEC v1.1)

Toutes les user stories listées ci-dessus sont **P0** (must have) pour la SPEC v1.1.

#### P1 — Should have (Post v1.1)

| ID | User Story | Points | Sprint |
|----|------------|--------|--------|
| US-P1.1 | Dashboard métriques (visualisation) | 5 | Post v1.1 |
| US-P1.2 | Alertes automatiques (backlog, taux d'échec) | 3 | Post v1.1 |
| US-P1.3 | Export métriques (CSV, JSON) | 2 | Post v1.1 |

#### P2 — Nice to have (Post v1.1)

| ID | User Story | Points | Sprint |
|----|------------|--------|--------|
| US-P2.1 | Retry manuel depuis interface (admin) | 3 | Post v1.1 |
| US-P2.2 | Historique des tentatives (table dédiée) | 5 | Post v1.1 |

---

## 🎯 Critères d'Acceptation Globaux

### Definition of Done (DoD) SPEC v1.1

La SPEC v1.1 est terminée si :

1. **Machine d'état complète** :
   - [ ] Tous les champs ajoutés et fonctionnels
   - [ ] Migration données existantes complétée
   - [ ] Idempotence opérationnelle

2. **CRON asynchrones** :
   - [ ] CRON #1 (envoi DVIG) opérationnel
   - [ ] CRON #2 (récupération preuve) opérationnel
   - [ ] Aucun appel réseau dans `action_post()`

3. **Robustesse** :
   - [ ] Backoff exponentiel implémenté
   - [ ] Classification erreurs opérationnelle
   - [ ] Retry intelligent fonctionnel

4. **Observabilité** :
   - [ ] Métriques collectées et stockées
   - [ ] Logs détaillés

5. **Interface utilisateur** :
   - [ ] Bloc informatif mis à jour
   - [ ] Mode debug opérationnel
   - [ ] Boutons manuels masqués

6. **Tests** :
   - [ ] Couverture >= 90%
   - [ ] Tous les tests passent

7. **Documentation** :
   - [ ] Documentation technique complète
   - [ ] Guide migration disponible
   - [ ] README mis à jour

---

## 🔄 Dépendances et Risques

### Dépendances

- **DVIG API** : Doit être disponible et stable
- **Vault API** : Endpoint récupération preuve validé : `/api/v1/proof/{dorevia_dvig_event_id}`
- **dorevia_posted_lock** : Compatibilité assurée (US-1.5)

### Risques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Migration données volumineuses | Faible | Élevé | Tester sur copie production, migration incrémentale |
| Performance CRON (batch 50) | Faible | Faible | Monitoring, ajustement batch si nécessaire |

---

## 📝 Notes Techniques

### Endpoint Vault — Validé ✅

- **CRON #2** : Endpoint pour récupération preuve
  - **Validé** : `/api/v1/proof/{dorevia_dvig_event_id}`
  - **Justification** : Découplage Odoo ↔ Vault, event-based, compatible futur ERP
  - **Référence** : `RECOMMANDATIONS_TECHNIQUES_VAULTIG_AUTO_v1.1.md` §5

### Index Base de Données — Validé ✅

- **Index UNIQUE sur `dorevia_dvig_event_id`** : Garantir unicité cross-système, anti-replay
- **Index UNIQUE sur `dorevia_vault_idempotency_key`** : Recommandé pour idempotence
- **Référence** : `RECOMMANDATIONS_TECHNIQUES_VAULTIG_AUTO_v1.1.md` §1 et §2

### Fréquence Métriques

- **Question** : À quelle fréquence calculer les métriques ?
- **Options** :
  - Option A : Toutes les heures (CRON dédié) — **Recommandé**
  - Option B : À chaque exécution CRON #1/#2 (toutes les 5 min)
  - Option C : Calcul à la demande (dashboard)
- **Recommandation** : Option A (toutes les heures) pour éviter surcharge

---

## 🏁 Conclusion

Ce plan d'implémentation Scrum structure la SPEC v1.1 en **3 sprints** pour un total de **52 points** sur **3 semaines**.

**Priorités** :
1. ✅ Machine d'état + Migration (Sprint 1)
2. ✅ CRON asynchrones + Backoff (Sprint 2)
3. ✅ Observabilité + UI + Tests (Sprint 3)

**Prochaines étapes** :
1. ✅ Plan validé avec équipe
2. ✅ Endpoint Vault clarifié : `/api/v1/proof/{dorevia_dvig_event_id}`
3. ✅ Recommandations techniques validées (voir `RECOMMANDATIONS_TECHNIQUES_VAULTIG_AUTO_v1.1.md`)
4. ➡️ **Démarrer Sprint 1**

---

**Auteur** : Dorevia Team — Lead Dev  
**Date** : 2026-01-11  
**Version** : 1.1 (mise à jour avec recommandations techniques validées)

---

## 📚 Références

- **SPEC** : `SPEC_DOREVIA_VAULTIG_AUTO_v1.1.md`
- **Analyse** : `ANALYSE_SPEC_VAULTIG_AUTO_v1.1_LEAD_DEV.md`
- **Recommandations techniques** : `RECOMMANDATIONS_TECHNIQUES_VAULTIG_AUTO_v1.1.md`
- **État d'implémentation** : `ETAT_IMPLEMENTATION_VAULTIG_AUTO_v1.1_SCRUM.md`
