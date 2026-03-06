# 🎯 Plan d'Implémentation — SPEC DVIG → Vault Forwarding v1.1 — Mode Scrum

**Version** : 1.0  
**Date** : 2026-01-11  
**Base** : `SPEC_DVIG_VAULT_FORWARDING_v1.1_CORRIGEE.md`  
**Durée estimée** : 3 sprints (3-4 semaines)  
**Équipe** : DVIG Team + Vault Team

---

## 📋 Vue d'Ensemble

### Objectif SPEC v1.1

Mettre en place un mécanisme **pérenne, fiable et observable** permettant à DVIG de transférer les événements validés vers Dorevia Vault en garantissant :

- ✅ Idempotence bout en bout **réelle** (SHA256)
- ✅ Persistance avant ACK (Outbox pattern)
- ✅ Asynchronisme (non bloquant)
- ✅ Retry automatique avec backoff exponentiel
- ✅ Traçabilité complète
- ✅ Compatibilité avec Odoo

### Définition de "Fait" (DoD)

La SPEC v1.1 est terminée si :
- ✅ Table `outbox_events` créée avec tous les champs et index
- ✅ Endpoint `/ingest` modifié pour accepter `idempotency_key` et persister dans outbox
- ✅ Worker asynchrone opérationnel avec sélection optimisée
- ✅ Backoff exponentiel implémenté avec formule précise
- ✅ Classification erreurs (soft vs hard) opérationnelle
- ✅ Endpoint Vault `/api/v1/events` créé et opérationnel
- ✅ Vérification idempotence Vault garantie
- ✅ Dead letter queue implémentée avec politique de rétention
- ✅ Métriques observabilité collectées (Prometheus)
- ✅ Tests unitaires et d'intégration passent (100% couverture)
- ✅ Tests end-to-end Odoo → DVIG → Vault validés
- ✅ Documentation complète

**Statut** : ⏳ **À démarrer**

---

## 🏃 Structure Scrum

### Sprints

- **Sprint A** : Infrastructure DVIG (1-2 semaines) — 25 points
- **Sprint B** : API Vault `/api/v1/events` (1 semaine) — 15 points
- **Sprint C** : Intégration End-to-End (3-5 jours) — 10 points

**Total** : 3-4 semaines — 50 points

---

## 📦 Sprint A : Infrastructure DVIG (1-2 semaines)

**Points** : 25 points  
**Objectif** : Créer l'infrastructure Outbox dans DVIG, modifier l'endpoint `/ingest`, et implémenter le worker asynchrone avec backoff et classification d'erreurs.

### User Stories

#### US-A.1 : Migration base de données — Table outbox_events

**En tant que** développeur DVIG  
**Je veux** créer la table `outbox_events` avec tous les champs nécessaires  
**Afin de** persister les événements avant envoi vers Vault (Outbox pattern)

**Points** : 5

**Critères d'acceptation** :
- [ ] Migration SQL créée dans `sources/dvig/migrations/`
- [ ] Table `outbox_events` créée avec tous les champs :
  - `id` (SERIAL PRIMARY KEY)
  - `event_id` (UUID NOT NULL UNIQUE)
  - `idempotency_key` (VARCHAR(64) NOT NULL)
  - `tenant` (VARCHAR(50) NOT NULL)
  - `env` (VARCHAR(50) NOT NULL)
  - `status` (VARCHAR(20) NOT NULL DEFAULT 'accepted')
  - `attempt_count` (INTEGER NOT NULL DEFAULT 0)
  - `last_try_at` (TIMESTAMP)
  - `next_retry_at` (TIMESTAMP)
  - `last_error` (TEXT)
  - `vault_receipt_id` (VARCHAR(100))
  - `payload` (JSONB NOT NULL)
  - `created_at` (TIMESTAMP DEFAULT NOW())
  - `updated_at` (TIMESTAMP DEFAULT NOW())
- [ ] Contrainte UNIQUE : `UNIQUE(tenant, idempotency_key)`
- [ ] Index créés :
  - `idx_outbox_worker` : `(status, next_retry_at)` WHERE `status IN ('accepted','failed_soft')`
  - `idx_outbox_event_id` : `(event_id)`
  - `idx_outbox_tenant_event` : `(tenant, event_id)`
- [ ] Migration testée et réversible
- [ ] Documentation migration

**Tâches techniques** :
- [ ] Créer fichier `sources/dvig/migrations/006_create_outbox_events.sql`
- [ ] Définir schéma SQLAlchemy dans `sources/dvig/models/outbox.py`
- [ ] Créer fonctions CRUD dans `sources/dvig/storage/outbox.py`
- [ ] Tester migration sur environnement de développement
- [ ] Documenter migration et rollback

**Livrables** :
- ✅ Migration SQL `006_create_outbox_events.sql`
- ✅ Modèle SQLAlchemy `models/outbox.py`
- ✅ Fonctions CRUD `storage/outbox.py`
- ✅ Documentation migration

---

#### US-A.2 : Modification endpoint `/ingest` — Acceptation idempotency_key

**En tant que** développeur DVIG  
**Je veux** modifier l'endpoint `/ingest` pour accepter `idempotency_key` et persister dans outbox  
**Afin de** garantir l'idempotence et la persistance avant ACK

**Points** : 6

**Critères d'acceptation** :
- [ ] Modèle Pydantic `IngestPayload` étendu avec champ optionnel `idempotency_key`
- [ ] Endpoint `/ingest` modifié pour :
  - Récupérer `idempotency_key` du payload (si présent)
  - Générer `event_id` (UUID) pour traçabilité
  - Vérifier idempotence via `UNIQUE(tenant, idempotency_key)`
  - Persister dans `outbox_events` avec `status='accepted'`
  - Retourner immédiatement `{"status": "accepted", "event_id": "..."}`
- [ ] Fallback : Si `idempotency_key` absent, générer depuis `event_id` (compatibilité)
- [ ] Gestion erreur : Si idempotence détectée, retourner `event_id` existant
- [ ] Tests unitaires pour validation payload
- [ ] Tests d'intégration pour persistance outbox

**Tâches techniques** :
- [ ] Modifier `sources/dvig/models/payload.py` : Ajouter `idempotency_key: Optional[str]`
- [ ] Modifier `sources/dvig/api/ingest.py` :
  - Récupérer `idempotency_key` du payload
  - Générer `event_id` (UUID)
  - Vérifier idempotence via `storage/outbox.py`
  - Persister dans outbox
  - Retourner ACK immédiat
- [ ] Créer fonction `storage/outbox.py::get_by_idempotency_key()`
- [ ] Créer fonction `storage/outbox.py::create_outbox_event()`
- [ ] Tests unitaires : `tests/unit/test_ingest_idempotency.py`
- [ ] Tests d'intégration : `tests/integration/test_ingest_outbox.py`

**Livrables** :
- ✅ Endpoint `/ingest` modifié
- ✅ Modèle Pydantic étendu
- ✅ Fonctions CRUD outbox
- ✅ Tests unitaires et intégration

---

#### US-A.3 : Worker asynchrone — Sélection et traitement

**En tant que** développeur DVIG  
**Je veux** implémenter un worker asynchrone qui sélectionne et traite les événements de l'outbox  
**Afin de** transférer les événements vers Vault de manière asynchrone et non bloquante

**Points** : 6

**Critères d'acceptation** :
- [ ] Worker créé dans `sources/dvig/workers/outbox_worker.py`
- [ ] Sélection optimisée : `status IN ('accepted','failed_soft') AND next_retry_at <= NOW()`
- [ ] Traitement par batch (limite 50 événements)
- [ ] Mise à jour état : `status = 'forwarding'` avant envoi
- [ ] Appel Vault : `POST /api/v1/events` avec payload formaté
- [ ] Gestion succès : `status = 'forwarded'`, stockage `vault_receipt_id`
- [ ] Gestion échec : Classification erreurs (soft vs hard)
- [ ] Tests unitaires pour sélection et traitement
- [ ] Tests d'intégration pour appel Vault

**Tâches techniques** :
- [ ] Créer `sources/dvig/workers/outbox_worker.py`
- [ ] Implémenter fonction `select_pending_events(db, limit=50)`
- [ ] Implémenter fonction `process_event(db, event)`
- [ ] Implémenter fonction `forward_to_vault(event)` utilisant `services/vault.py`
- [ ] Créer formatage payload pour Vault `/api/v1/events`
- [ ] Tests unitaires : `tests/unit/test_outbox_worker.py`
- [ ] Tests d'intégration : `tests/integration/test_worker_vault.py`

**Livrables** :
- ✅ Worker asynchrone opérationnel
- ✅ Sélection optimisée
- ✅ Tests unitaires et intégration

---

#### US-A.4 : Backoff exponentiel — Calcul next_retry_at

**En tant que** développeur DVIG  
**Je veux** implémenter le backoff exponentiel pour les erreurs temporaires  
**Afin de** éviter la surcharge du système en cas d'erreurs réseau ou Vault indisponible

**Points** : 4

**Critères d'acceptation** :
- [ ] Fonction `calculate_next_retry(attempt_count)` implémentée
- [ ] Formule : `next_retry = now + min(2^attempt_count * 60, 3600)`
- [ ] Exemples validés :
  - Tentative 1 : +60s (1 min)
  - Tentative 2 : +120s (2 min)
  - Tentative 3 : +240s (4 min)
  - Tentative 4 : +480s (8 min)
  - Tentative 5+ : +3600s (1h max)
- [ ] Mise à jour `next_retry_at` dans outbox après échec soft
- [ ] Incrément `attempt_count` après chaque tentative
- [ ] Tests unitaires pour formule backoff
- [ ] Tests d'intégration pour mise à jour outbox

**Tâches techniques** :
- [ ] Créer fonction `workers/outbox_worker.py::calculate_next_retry(attempt_count)`
- [ ] Intégrer dans `process_event()` pour mise à jour `next_retry_at`
- [ ] Tests unitaires : `tests/unit/test_backoff.py`
- [ ] Tests d'intégration : Vérifier mise à jour outbox

**Livrables** :
- ✅ Fonction backoff implémentée
- ✅ Tests unitaires validés

---

#### US-A.5 : Classification erreurs — Soft vs Hard

**En tant que** développeur DVIG  
**Je veux** classifier les erreurs en soft (retriable) et hard (non retriable)  
**Afin de** optimiser les retries et éviter les tentatives inutiles

**Points** : 4

**Critères d'acceptation** :
- [ ] Fonction `classify_error(error)` implémentée
- [ ] Erreurs **soft** (retriable) :
  - Timeout réseau
  - `502 Bad Gateway`
  - `503 Service Unavailable`
  - `429 Too Many Requests`
- [ ] Erreurs **hard** (non retriable) :
  - `400 Bad Request`
  - `401 Unauthorized`
  - `403 Forbidden`
  - `404 Not Found`
  - `422 Unprocessable Entity`
- [ ] Gestion soft : `status = 'failed_soft'`, backoff, retry
- [ ] Gestion hard : `status = 'failed_hard'`, déplacement dead letter
- [ ] Tests unitaires pour classification
- [ ] Tests d'intégration pour gestion erreurs

**Tâches techniques** :
- [ ] Créer fonction `workers/outbox_worker.py::classify_error(error)`
- [ ] Intégrer dans `process_event()` pour classification
- [ ] Gestion soft : Mise à jour `status`, `next_retry_at`, `attempt_count`
- [ ] Gestion hard : Mise à jour `status`, déplacement dead letter
- [ ] Tests unitaires : `tests/unit/test_classification.py`
- [ ] Tests d'intégration : Scénarios erreurs soft/hard

**Livrables** :
- ✅ Classification erreurs opérationnelle
- ✅ Tests unitaires et intégration

---

## 📦 Sprint B : API Vault `/api/v1/events` (1 semaine)

**Points** : 15 points  
**Objectif** : Créer l'endpoint Vault `/api/v1/events` avec vérification idempotence et intégration avec les services d'ingestion existants.

### User Stories

#### US-B.1 : Endpoint Vault `/api/v1/events` — Création

**En tant que** développeur Vault  
**Je veux** créer l'endpoint `/api/v1/events` pour recevoir les événements de DVIG  
**Afin de** ingérer les documents de manière standardisée et idempotente

**Points** : 6

**Critères d'acceptation** :
- [ ] Handler créé dans `sources/vault/internal/handlers/events.go`
- [ ] Route définie : `POST /api/v1/events`
- [ ] Authentification : Token service (Bearer)
- [ ] Validation payload : Structure complète
- [ ] Format payload accepté :
  ```json
  {
    "tenant": "sarl-la-platine",
    "event_id": "uuid",
    "idempotency_key": "sha256",
    "source": {...},
    "event_type": "invoice.posted",
    "occurred_at": "...",
    "payload": {...},
    "pdf_sha256": "..."
  }
  ```
- [ ] Réponse succès (200) :
  ```json
  {
    "status": "vaulted",
    "event_id": "uuid",
    "vault_id": "...",
    "vault_date": "...",
    "vault_sha256": "...",
    "vault_ledger_hash": "...",
    "vault_evidence_jws": "..."
  }
  ```
- [ ] Tests unitaires pour validation payload
- [ ] Tests d'intégration pour ingestion

**Tâches techniques** :
- [ ] Créer `sources/vault/internal/handlers/events.go`
- [ ] Définir struct Go pour payload
- [ ] Implémenter validation payload
- [ ] Intégrer avec services d'ingestion existants
- [ ] Tests unitaires : `sources/vault/tests/unit/events_test.go`
- [ ] Tests d'intégration : `sources/vault/tests/integration/events_test.go`

**Livrables** :
- ✅ Endpoint `/api/v1/events` opérationnel
- ✅ Validation payload
- ✅ Tests unitaires et intégration

---

#### US-B.2 : Vérification idempotence Vault — UNIQUE(tenant, idempotency_key)

**En tant que** développeur Vault  
**Je veux** vérifier l'idempotence via `UNIQUE(tenant, idempotency_key)`  
**Afin de** éviter les doublons et garantir l'idempotence bout en bout

**Points** : 5

**Critères d'acceptation** :
- [ ] Fonction `GetDocumentByIdempotencyKey(tenant, idempotency_key)` créée
- [ ] Vérification avant ingestion : Si document existant, retourner réponse idempotente
- [ ] Réponse idempotente (200) :
  ```json
  {
    "status": "idempotent",
    "event_id": "uuid",
    "vault_id": "existing_doc_id",
    "message": "Document already vaulted"
  }
  ```
- [ ] Stockage `idempotency_key` dans table `documents`
- [ ] Index UNIQUE créé : `UNIQUE(tenant, idempotency_key)`
- [ ] Tests unitaires pour vérification idempotence
- [ ] Tests d'intégration pour scénario idempotent

**Tâches techniques** :
- [ ] Modifier table `documents` : Ajouter colonne `idempotency_key VARCHAR(64)`
- [ ] Créer index UNIQUE : `CREATE UNIQUE INDEX idx_documents_tenant_idempotency ON documents(tenant, idempotency_key)`
- [ ] Créer fonction `internal/services/document.go::GetByIdempotencyKey()`
- [ ] Intégrer dans handler `events.go` : Vérification avant ingestion
- [ ] Tests unitaires : `sources/vault/tests/unit/idempotence_test.go`
- [ ] Tests d'intégration : Scénario idempotent

**Livrables** :
- ✅ Vérification idempotence opérationnelle
- ✅ Index UNIQUE créé
- ✅ Tests unitaires et intégration

---

#### US-B.3 : Endpoint optionnel `/api/v1/proof/event/{event_id}` — Traçabilité

**En tant que** développeur Vault  
**Je veux** créer l'endpoint optionnel `/api/v1/proof/event/{event_id}`  
**Afin de** permettre la récupération de preuve par event_id DVIG (traçabilité)

**Points** : 4

**Critères d'acceptation** :
- [ ] Handler créé : `GET /api/v1/proof/event/{event_id}`
- [ ] Recherche document par `event_id` (stocké dans `documents.metadata`)
- [ ] Réponse : Même format que `/api/v1/proof/account_move/{id}`
- [ ] Authentification : Token service (Bearer)
- [ ] Tests unitaires pour recherche par event_id
- [ ] Tests d'intégration pour récupération preuve

**Tâches techniques** :
- [ ] Créer handler `sources/vault/internal/handlers/proof_event.go`
- [ ] Fonction recherche : `GetDocumentByEventId(event_id)`
- [ ] Stockage `event_id` dans `documents.metadata` (JSONB)
- [ ] Tests unitaires : `sources/vault/tests/unit/proof_event_test.go`
- [ ] Tests d'intégration : Récupération preuve par event_id

**Livrables** :
- ✅ Endpoint `/api/v1/proof/event/{event_id}` opérationnel
- ✅ Tests unitaires et intégration

---

## 📦 Sprint C : Intégration End-to-End (3-5 jours)

**Points** : 10 points  
**Objectif** : Valider le flux complet Odoo → DVIG → Vault, tester l'idempotence bout en bout, et mettre en place le monitoring.

### User Stories

#### US-C.1 : Tests end-to-end — Odoo → DVIG → Vault

**En tant que** développeur plateforme  
**Je veux** tester le flux complet Odoo → DVIG → Vault  
**Afin de** valider que l'intégration fonctionne correctement

**Points** : 4

**Critères d'acceptation** :
- [ ] Test manuel : Valider une facture Odoo et vérifier le flux complet
- [ ] Test automatique : Script e2e créé
- [ ] Scénarios testés :
  - Facture validée → DVIG reçoit `idempotency_key`
  - DVIG persiste dans outbox → Worker traite
  - Worker envoie à Vault → Vault ingère
  - Vault retourne preuve → Odoo récupère via CRON #2
- [ ] Vérification logs : Traçabilité complète
- [ ] Documentation scénarios de test

**Tâches techniques** :
- [ ] Créer script `tests/e2e/test_odoo_dvig_vault_flow.sh`
- [ ] Scénario 1 : Facture normale (succès)
- [ ] Scénario 2 : Facture idempotente (même facture deux fois)
- [ ] Scénario 3 : Erreur réseau (retry avec backoff)
- [ ] Scénario 4 : Erreur hard (dead letter)
- [ ] Documentation : `tests/e2e/README_E2E_TESTS.md`

**Livrables** :
- ✅ Scripts e2e opérationnels
- ✅ Documentation tests

---

#### US-C.2 : Validation idempotence bout en bout

**En tant que** développeur plateforme  
**Je veux** valider que l'idempotence fonctionne bout en bout  
**Afin de** garantir qu'une même facture n'est pas traitée deux fois

**Points** : 3

**Critères d'acceptation** :
- [ ] Test : Envoyer la même facture deux fois depuis Odoo
- [ ] Vérification : DVIG détecte idempotence (même `idempotency_key`)
- [ ] Vérification : Vault détecte idempotence (même `idempotency_key`)
- [ ] Résultat : Document ingéré une seule fois
- [ ] Documentation scénario idempotence

**Tâches techniques** :
- [ ] Créer test `tests/e2e/test_idempotence_e2e.sh`
- [ ] Scénario : Facture envoyée deux fois
- [ ] Vérification : Logs DVIG (idempotence détectée)
- [ ] Vérification : Logs Vault (idempotence détectée)
- [ ] Vérification : Base de données (un seul document)

**Livrables** :
- ✅ Test idempotence e2e validé
- ✅ Documentation

---

#### US-C.3 : Monitoring et observabilité — Métriques Prometheus

**En tant que** développeur plateforme  
**Je veux** mettre en place les métriques Prometheus pour DVIG et Vault  
**Afin de** monitorer le système en production

**Points** : 3

**Critères d'acceptation** :
- [ ] Métriques DVIG créées :
  - `dvig_outbox_backlog{tenant,env}`
  - `dvig_forward_success_total{tenant,env}`
  - `dvig_forward_failed_soft_total{tenant,env}`
  - `dvig_forward_failed_hard_total{tenant,env}`
  - `dvig_forward_duration_seconds{tenant,env}`
  - `dvig_dead_letters_total{tenant,env}`
- [ ] Métriques Vault créées :
  - `vault_events_ingested_total{tenant,event_type}`
  - `vault_events_idempotent_total{tenant}`
  - `vault_events_failed_total{tenant,error_type}`
- [ ] Endpoint Prometheus : `/metrics` (DVIG et Vault)
- [ ] Documentation métriques

**Tâches techniques** :
- [ ] Intégrer Prometheus client dans DVIG (Python)
- [ ] Intégrer Prometheus client dans Vault (Go)
- [ ] Créer métriques dans `sources/dvig/metrics.py`
- [ ] Créer métriques dans `sources/vault/internal/metrics/metrics.go`
- [ ] Exposer endpoint `/metrics`
- [ ] Documentation : `docs/METRICS.md`

**Livrables** :
- ✅ Métriques Prometheus opérationnelles
- ✅ Documentation métriques

---

## 📊 Récapitulatif

### Progression Globale

| Sprint | Statut | Points | Complétion | Date Début | Date Fin |
|--------|--------|--------|------------|------------|----------|
| **Sprint A** | ⏳ **En attente** | 0/25 | 0% | - | - |
| **Sprint B** | ⏳ **En attente** | 0/15 | 0% | - | - |
| **Sprint C** | ⏳ **En attente** | 0/10 | 0% | - | - |
| **Total** | - | **0/50** | **0%** | - | - |

### Légende des Statuts

- ✅ **Complété** : Sprint/US terminé(e) et validé(e)
- 🟡 **En cours** : Sprint/US en cours d'implémentation
- ⏳ **En attente** : Sprint/US pas encore commencé(e)
- 🔴 **Bloqué** : Sprint/US bloqué(e) par une dépendance ou un problème

---

## 🔗 Références

- **SPEC corrigée** : `SPEC_DVIG_VAULT_FORWARDING_v1.1_CORRIGEE.md`
- **Analyse** : `ANALYSE_SPEC_DVIG_VAULT_FORWARDING_v1.1.md`
- **Modification Odoo** : `MODIFICATION_ODOO_IDEMPOTENCY_KEY.md`
- **Rapport diagnostic** : `RAPPORT_DIAGNOSTIC_VAULTING_20260111.md`

---

## ✅ Prochaines Étapes

1. **Valider le plan** avec les équipes DVIG et Vault
2. **Créer les tickets** pour Sprint A, B, C
3. **Démarrer Sprint A** : Infrastructure DVIG

---

**Plan d'implémentation créé** ✅
