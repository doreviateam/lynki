# 📘 Plan d'Implémentation SPEC 2 — Vault → Constat Mensuel — Mode Scrum

**Version** : 1.0  
**Date** : 2026-01-03  
**Base** : `SPEC2_VAULT_CONSTAT_MENSUEL_v1.0.md`  
**Durée estimée** : 2 sprints (2 semaines)  
**Équipe** : Dev plateforme / Vault

> **Prérequis** : SPEC 1 complétée et déployée

---

## 📋 Vue d'Ensemble

### Objectif SPEC 2

Implémenter la génération et la transmission de constats mensuels depuis Dorevia Vault vers Odoo CORE, pour permettre la facturation centralisée basée sur les volumes attestés.

Cette SPEC définit :
- L'agrégation des documents vaultés par tenant et par période **close**
- Le format du constat mensuel
- Le mécanisme de transmission vers Odoo CORE
- Les métadonnées incluses (volumes, conformité Factur-X, preuves)

### Principe Fondamental

> **Le Vault constate et atteste des volumes. Odoo CORE calcule et facture.**

Le Vault ne connaît ni les prix, ni les contrats, ni la TVA. Toute logique commerciale et comptable vit exclusivement dans Odoo CORE.

### Règle de Facturation MRR

> **⚠️ IMPORTANT** :  
> La facturation MRR est basée sur des **constats mensuels établis sur des périodes closes**.  
> Chaque facture émise au mois N porte sur les volumes constatés durant le mois N-1.  
> Dorevia facture des **faits constatés**, jamais des **faits en cours**.

**Exemple** :
- Constat pour période `2026-01` (janvier, **close**) → Généré en février 2026
- Facture de février 2026 → Porte sur les volumes de janvier 2026 (période close)
- Les documents du mois en cours (février) ne sont pas facturés avant mars

### Définition de "Fait" (DoD)

La SPEC 2 est terminée si :
- ✅ La génération automatique mensuelle fonctionne
- ✅ Les constats sont correctement agrégés par tenant et période
- ✅ Les preuves cryptographiques sont incluses (JWS, Ledger hash)
- ✅ La transmission vers Odoo CORE fonctionne
- ✅ Les tests AC-1..AC-6 passent
- ✅ La documentation API est à jour
- ✅ Le déploiement en environnement de test est validé

---

## 🏃 Structure Scrum

### Sprints

- **Sprint 1** : Migration DB + Agrégation + Génération (1 semaine)
- **Sprint 2** : Transmission + Tests + Documentation (1 semaine)

**Total** : 2 semaines

---

## 📦 Sprint 1 : Migration DB + Agrégation + Génération (1 semaine)

**Points** : 13 points  
**Objectif** : Préparer la base de données, implémenter l'agrégation des documents, et générer les constats mensuels.

### User Stories

#### US-2.1 : Migration base de données — Table constats

**En tant que** développeur plateforme  
**Je veux** créer la table `constats` pour stocker les constats mensuels  
**Afin de** persister les constats générés et leur statut de transmission

**Points** : 3

**Critères d'acceptation** :
- [ ] Migration SQL créée (ex: `020_create_constats_table.sql`)
- [ ] Table `constats` créée avec tous les champs nécessaires
- [ ] Index créés pour optimiser les requêtes (`idx_constats_tenant_period`, `idx_constats_transmission_status`)
- [ ] Contrainte UNIQUE sur `(tenant, period)`
- [ ] Migration testée et réversible

**Tâches techniques** :
- [ ] Créer migration `sources/vault/migrations/020_create_constats_table.sql`
- [ ] Ajouter colonnes :
  - `id UUID PRIMARY KEY`
  - `tenant VARCHAR(255) NOT NULL`
  - `period VARCHAR(7) NOT NULL` (YYYY-MM)
  - `generated_at TIMESTAMP NOT NULL`
  - `vault_id VARCHAR(255)`
  - `volumes_out_invoice INTEGER DEFAULT 0`
  - `volumes_in_invoice INTEGER DEFAULT 0`
  - `volumes_out_refund INTEGER DEFAULT 0`
  - `volumes_in_refund INTEGER DEFAULT 0`
  - `compliance_compliant INTEGER DEFAULT 0`
  - `compliance_non_compliant_2026 INTEGER DEFAULT 0`
  - `compliance_out_of_scope INTEGER DEFAULT 0`
  - `proofs_jws TEXT`
  - `proofs_ledger_hash VARCHAR(255)`
  - `proofs_documents_count INTEGER DEFAULT 0`
  - `transmitted_at TIMESTAMP`
  - `transmission_status VARCHAR(50)` (pending, transmitted, failed)
  - `transmission_error TEXT`
  - `created_at TIMESTAMP DEFAULT NOW()`
- [ ] Créer contrainte UNIQUE `(tenant, period)`
- [ ] Créer index : `idx_constats_tenant_period`, `idx_constats_transmission_status`
- [ ] Tester migration sur environnement de développement
- [ ] Documenter migration et rollback

**Livrables** :
- ✅ `sources/vault/migrations/020_create_constats_table.sql`
- ✅ Documentation migration

---

#### US-2.2 : Modèle et service d'agrégation

**En tant que** développeur Vault  
**Je veux** créer le modèle `Constat` et le service d'agrégation  
**Afin de** calculer les volumes par tenant et période

**Points** : 5

**Critères d'acceptation** :
- [ ] Modèle `Constat` créé dans `models/constat.go`
- [ ] Service `ConstatService` créé avec fonction d'agrégation
- [ ] Agrégation par `move_type` fonctionnelle
- [ ] Agrégation par `compliance_status` fonctionnelle (optionnel)
- [ ] Filtrage correct par `tenant` et période (`created_at` ∈ [start, end])
- [ ] Calcul du nombre total de documents

**Tâches techniques** :
- [ ] Créer `sources/vault/internal/models/constat.go`
  - Struct `Constat` avec tous les champs
  - Struct `Volumes`
  - Struct `Compliance` (optionnel)
  - Struct `Proofs`
- [ ] Créer `sources/vault/internal/services/constat.go`
  - Fonction `AggregateDocuments(tenant, period) (*Volumes, *Compliance, error)`
  - Requête SQL avec filtrage par `tenant` et `created_at`
  - GROUP BY sur `move_type` et `compliance_status`
- [ ] Tester l'agrégation avec données de test

**Livrables** :
- ✅ Modèle `Constat` dans `models/constat.go`
- ✅ Service d'agrégation dans `services/constat.go`
- ✅ Tests unitaires d'agrégation

---

#### US-2.3 : Génération de constat avec preuves

**En tant que** développeur Vault  
**Je veux** générer un constat complet avec preuves cryptographiques  
**Afin de** créer un constat opposable et vérifiable

**Points** : 5

**Critères d'acceptation** :
- [ ] Fonction `GenerateConstat(tenant, period) (*Constat, error)` créée
- [ ] Génération de `constat_id` (UUID)
- [ ] Génération de JWS signant le constat complet
- [ ] Ajout au ledger si activé (génération de `ledger_hash`)
- [ ] Stockage du constat en base de données
- [ ] Gestion de l'idempotence (un seul constat par `(tenant, period)`)

**Tâches techniques** :
- [ ] Modifier `sources/vault/internal/services/constat.go`
  - Fonction `GenerateConstat(tenant, period) (*Constat, error)`
  - Appel à `AggregateDocuments()` pour obtenir volumes
  - Génération UUID pour `constat_id`
  - Création JWS avec contenu du constat
  - Ajout au ledger si activé
  - INSERT dans table `constats`
- [ ] Gérer l'idempotence : vérifier si constat existe avant création
- [ ] Tester la génération avec différents scénarios

**Livrables** :
- ✅ Fonction `GenerateConstat()` complète
- ✅ Génération JWS et ledger hash
- ✅ Stockage en DB
- ✅ Tests unitaires de génération

---

## 📦 Sprint 2 : Transmission + Tests + Documentation (1 semaine)

**Points** : 12 points  
**Objectif** : Implémenter la transmission vers Odoo CORE, compléter les tests, et finaliser la documentation.

### User Stories

#### US-2.4 : Transmission vers Odoo CORE

**En tant que** développeur Vault  
**Je veux** transmettre les constats générés vers Odoo CORE  
**Afin de** permettre la facturation centralisée

**Points** : 5

**Critères d'acceptation** :
- [ ] Fonction `TransmitConstat(constat *Constat) error` créée
- [ ] Transmission via API REST vers Odoo CORE
- [ ] Gestion des erreurs permanentes (400, 401, 403) — pas de retry
- [ ] Gestion des erreurs temporaires (429, 5xx) — retry avec backoff exponentiel
- [ ] Mise à jour du statut de transmission en DB
- [ ] Idempotence de la transmission

**Tâches techniques** :
- [ ] Modifier `sources/vault/internal/services/constat.go`
  - Fonction `TransmitConstat(constat *Constat) error`
  - Client HTTP pour appeler Odoo CORE
  - Construction payload JSON
  - Gestion retry avec backoff exponentiel
  - Mise à jour `transmission_status` et `transmitted_at`
- [ ] Configuration URL Odoo CORE via variables d'environnement
- [ ] Authentification (JWT ou API Key)
- [ ] Tester avec différents scénarios d'erreur

**Livrables** :
- ✅ Fonction `TransmitConstat()` complète
- ✅ Gestion d'erreurs et retry
- ✅ Tests d'intégration de transmission

---

#### US-2.5 : Job automatique mensuel

**En tant que** développeur Vault  
**Je veux** un job automatique qui génère et transmet les constats mensuels  
**Afin de** automatiser le processus de facturation

**Points** : 3

**Critères d'acceptation** :
- [ ] Job/cron configuré pour exécution le 1er de chaque mois à 00:00 UTC (ou après délai de sécurité)
- [ ] Génération automatique pour tous les tenants actifs
- [ ] Génération uniquement pour la période **close** (mois précédent)
- [ ] Transmission automatique après génération
- [ ] Logs structurés pour chaque étape
- [ ] Gestion des erreurs (notification si échec)

**⚠️ Règle de période close** : Le job génère le constat pour la période **close** (mois N-1), jamais pour le mois en cours.

**Tâches techniques** :
- [ ] Créer `sources/vault/cmd/vault/jobs.go` (ou équivalent)
  - Fonction `GenerateMonthlyConstats() error`
  - Calcul de la période close (mois précédent)
  - Récupération liste des tenants actifs
  - Boucle sur chaque tenant
  - Appel à `GenerateConstat(tenant, period_close)` puis `TransmitConstat()`
- [ ] Configurer cron/job scheduler (1er du mois à 00:00 UTC)
- [ ] Vérifier que seule la période close est traitée
- [ ] Ajouter logs structurés
- [ ] Tester le job manuellement

**Livrables** :
- ✅ Job automatique mensuel
- ✅ Configuration cron/scheduler
- ✅ Logs structurés

---

#### US-2.6 : API endpoints pour constats

**En tant que** développeur Vault  
**Je veux** exposer des endpoints API pour gérer les constats  
**Afin de** permettre la consultation et la génération manuelle

**Points** : 2

**Critères d'acceptation** :
- [ ] Endpoint `POST /api/v1/constats/generate` (génération manuelle)
- [ ] Endpoint `GET /api/v1/constats/:tenant/:period` (consultation)
- [ ] Endpoint `GET /api/v1/constats` (liste avec pagination)
- [ ] Endpoint `POST /api/v1/constats/:tenant/:period/retransmit` (retransmission)
- [ ] Authentification requise (si `AUTH_ENABLED=true`)

**Tâches techniques** :
- [ ] Créer `sources/vault/internal/handlers/constats.go`
  - Handler `GenerateConstatHandler`
  - Handler `GetConstatHandler`
  - Handler `ListConstatsHandler`
  - Handler `RetransmitConstatHandler`
- [ ] Ajouter routes dans `cmd/vault/main.go`
- [ ] Tester tous les endpoints

**Livrables** :
- ✅ Handlers API complets
- ✅ Routes configurées
- ✅ Tests d'intégration API

---

#### US-2.7 : Tests unitaires et d'intégration complets

**En tant que** développeur Vault  
**Je veux** créer des tests complets couvrant tous les critères d'acceptation  
**Afin de** garantir la qualité et la conformité à la SPEC 2

**Points** : 2

**Critères d'acceptation** :
- [ ] Tests unitaires AC-1..AC-6 passent
- [ ] Tests d'intégration de génération passent
- [ ] Tests d'intégration de transmission passent
- [ ] Tests de génération rétroactive passent
- [ ] Couverture de code > 80% pour les nouvelles fonctions

**Tâches techniques** :
- [ ] Créer `sources/vault/tests/unit/test_constat_aggregation.go`
  - Test AC-1 : Génération automatique mensuelle
  - Test AC-2 : Agrégation par tenant et période
  - Test AC-3 : Inclusion des preuves
- [ ] Créer `sources/vault/tests/integration/test_constat_transmission.go`
  - Test AC-4 : Transmission vers CORE
  - Test AC-5 : Consultation et retransmission
  - Test AC-6 : Conformité Factur-X
- [ ] Créer tests de génération rétroactive
- [ ] Générer rapport de couverture de code

**Livrables** :
- ✅ Tests unitaires complets
- ✅ Tests d'intégration complets
- ✅ Rapport de couverture de code

---

## 📊 Récapitulatif des Points

| Sprint | User Story | Points | Statut |
|--------|------------|--------|--------|
| **Sprint 1** | US-2.1 : Migration DB constats | 3 | ⏳ En attente |
| | US-2.2 : Modèle et service d'agrégation | 5 | ⏳ En attente |
| | US-2.3 : Génération constat avec preuves | 5 | ⏳ En attente |
| **Sprint 2** | US-2.4 : Transmission vers CORE | 5 | ⏳ En attente |
| | US-2.5 : Job automatique mensuel | 3 | ⏳ En attente |
| | US-2.6 : API endpoints | 2 | ⏳ En attente |
| | US-2.7 : Tests complets | 2 | ⏳ En attente |
| **TOTAL** | | **25** | |

---

## 🔄 Dépendances

### Dépendances internes

- **SPEC 1** → **US-2.1** : Les documents doivent être vaultés (SPEC 1) avant de pouvoir être agrégés
- **US-2.1** → **US-2.2** : La table `constats` doit exister avant l'agrégation
- **US-2.2** → **US-2.3** : L'agrégation doit fonctionner avant la génération
- **US-2.3** → **US-2.4** : Les constats doivent être générés avant transmission
- **US-2.4** → **US-2.5** : La transmission doit fonctionner avant l'automatisation
- **US-2.1, US-2.2, US-2.3, US-2.4** → **US-2.6** : Les fonctionnalités doivent être implémentées avant les endpoints API
- **US-2.1, US-2.2, US-2.3, US-2.4** → **US-2.7** : Les fonctionnalités doivent être implémentées avant les tests

### Dépendances externes

- **SPEC 1 complétée** : Les documents `account.move` doivent être vaultés
- **Odoo CORE** : Endpoint de réception des constats (à définir dans SPEC 3)
- **JWS Service** : Service de signature JWS existant (si activé)
- **Ledger Service** : Service de ledger existant (si activé)

---

## 🧪 Stratégie de Tests

### Tests unitaires

- **Fichier** : `sources/vault/tests/unit/test_constat_aggregation.go`
- **Couverture** : Fonction d'agrégation, génération de constat
- **Outils** : Go testing standard

### Tests d'intégration

- **Fichier** : `sources/vault/tests/integration/test_constat_transmission.go`
- **Couverture** : Génération complète, transmission vers CORE (mock), endpoints API
- **Outils** : Go testing + PostgreSQL de test + Mock HTTP server

### Tests de non-régression

- Vérifier que la SPEC 1 continue de fonctionner
- Vérifier que les documents existants sont correctement agrégés

---

## 📝 Notes d'Implémentation

### Migration DB

La migration `020_create_constats_table.sql` doit être :
- **Réversible** : Script de rollback inclus
- **Idempotente** : Utiliser `IF NOT EXISTS` pour éviter erreurs si table existe
- **Sûre** : Pas d'impact sur les documents existants

### Agrégation

La fonction d'agrégation doit :
- **Filtrer correctement** : `created_at` ∈ [start_of_period, end_of_period] en UTC
- **Respecter l'isolation tenant** : Uniquement les documents du tenant concerné
- **Compter précisément** : GROUP BY sur `move_type` et `compliance_status`
- **⚠️ Période close uniquement** : Ne jamais inclure les documents du mois en cours

### Génération

La génération de constat doit :
- **Être idempotente** : Un seul constat par `(tenant, period)`
- **Inclure toutes les preuves** : JWS et ledger hash
- **Être horodatée** : `generated_at` en UTC

### Transmission

La transmission vers CORE doit :
- **Gérer les erreurs** : Distinguer permanentes vs temporaires
- **Retry intelligent** : Backoff exponentiel pour erreurs temporaires
- **Traçable** : Logs structurés pour chaque tentative

### Job automatique

Le job mensuel doit :
- **S'exécuter au bon moment** : 1er du mois à 00:00 UTC (ou après délai de sécurité)
- **Traiter uniquement la période close** : Générer le constat pour le mois précédent (N-1), jamais pour le mois en cours
- **Gérer les erreurs** : Ne pas bloquer si un tenant échoue
- **Être monitorable** : Logs structurés et métriques
- **Respecter la règle MRR** : Facturer des faits constatés, jamais des faits en cours

---

## ✅ Checklist de Déploiement

Avant déploiement en production :

- [ ] Toutes les US du Sprint 1 complétées
- [ ] Toutes les US du Sprint 2 complétées
- [ ] Tous les tests passent (AC-1..AC-6)
- [ ] Migration DB testée sur environnement de staging
- [ ] Job automatique testé sur environnement de staging
- [ ] Transmission vers Odoo CORE testée (endpoint mock ou réel)
- [ ] Documentation API à jour
- [ ] Code review validé
- [ ] Déploiement en environnement de test validé
- [ ] Monitoring et alertes configurés
- [ ] Plan de rollback préparé

---

## 🔗 Références

- **SPEC 2** : `SPEC2_VAULT_CONSTAT_MENSUEL_v1.0.md`
- **SPEC 1** : `SPEC1_VAULTING_ACCOUNT_MOVE_POSTED_v1.0.md` (prérequis)
- **Réflexion** : `REFLECTION_FACTURATION_MRR_VAULT_V2.1.md`
- **Code existant** : `sources/vault/internal/models/document.go`
- **Code existant** : `sources/vault/internal/storage/postgres.go`

---

**Fin du Plan d'Implémentation SPEC 2**

*Document de planification Scrum pour l'implémentation des constats mensuels Vault → CORE*

