# 🔐 Plan d'Implémentation Phase 4 "Auto-Renew Tokens DVIG" — Mode Scrum

**Version** : 1.0  
**Date** : 2026-01-03  
**Base** : `SPEC_Auto_Renew_Tokens_DVIG_Caddy_like_v1.0.md` (v1.0)  
**Durée estimée** : 3 sprints (3 semaines)  
**Équipe** : Dev plateforme / DVIG

---

## 📋 Vue d'Ensemble

### Objectif Phase 4

Mettre en place un mécanisme d'**expiration** et de **renouvellement automatique** des tokens DVIG, inspiré de Caddy (pre-renew + grace period), permettant une rotation transparente des tokens sans interruption de service.

### Tenant de Référence

Le tenant **`core`** sera utilisé comme tenant de référence pour la Phase 4. Toutes les fonctionnalités sont d'abord implémentées et validées sur le tenant `core` avant d'être étendues aux autres tenants.

### Définition de "Fait" (DoD)

La Phase 4 est terminée si :
- ✅ Les tokens DVIG peuvent avoir une date d'expiration (`expires_at`)
- ✅ Les tokens peuvent être renouvelés avant expiration (pre-renew)
- ✅ Les tokens anciens restent acceptés pendant une période de grâce (grace period)
- ✅ Les endpoints DVIG `/auth/token-status` et `/auth/renew` sont opérationnels
- ✅ La CLI `dorevia.sh token` supporte `status` et `renew`
- ✅ Les tokens legacy (sans expiration) continuent de fonctionner (rétrocompatibilité)
- ✅ Un module Odoo (optionnel) peut renouveler automatiquement les tokens

---

## 🏃 Structure Scrum

### Sprints

- **Sprint 1** : Migration DB + Validation (1 semaine)
- **Sprint 2** : API DVIG + CLI + Tests (1 semaine)
- **Sprint 3** : Intégration Odoo (optionnel) (1 semaine)

**Total** : 3 semaines

---

## 📦 Sprint 1 : Migration DB + Validation (1 semaine)

**Points** : 8 points  
**Objectif** : Préparer la base de données et implémenter la validation des tokens avec expiration et grace period.

### User Stories

#### US-1.1 : Migration base de données — Champs expiration et grace

**En tant que** développeur plateforme  
**Je veux** ajouter les champs nécessaires à la table `dvig_tokens` pour supporter l'expiration et la grace period  
**Afin de** stocker les informations d'expiration et de statut des tokens

**Points** : 3

**Critères d'acceptation** :
- [ ] Migration SQL créée (`005_add_expiration_grace.sql`)
- [ ] Champs ajoutés : `expires_at`, `status`, `grace_until`, `replaces_token_id`
- [ ] Index créés pour optimiser les requêtes
- [ ] Tokens existants migrés vers `status='legacy'` avec `expires_at=NULL`
- [ ] Migration testée et réversible

**Tâches techniques** :
- [ ] Créer migration `sources/dvig/migrations/005_add_expiration_grace.sql`
- [ ] Ajouter colonnes : `expires_at TIMESTAMPTZ NULL`, `status TEXT NOT NULL DEFAULT 'legacy'`, `grace_until TIMESTAMPTZ NULL`, `replaces_token_id INTEGER NULL`
- [ ] Créer index : `idx_dvig_tokens_status`, `idx_dvig_tokens_expires_at`, `idx_dvig_tokens_grace_until`
- [ ] Script de migration des tokens existants : `UPDATE dvig_tokens SET status='legacy' WHERE expires_at IS NULL`
- [ ] Tester migration sur environnement de développement
- [ ] Documenter migration et rollback

**Livrables** :
- ✅ `sources/dvig/migrations/005_add_expiration_grace.sql`
- ✅ Script de migration des tokens existants
- ✅ Documentation migration

---

#### US-1.2 : Validation tokens avec expiration et grace

**En tant que** développeur DVIG  
**Je veux** étendre la validation des tokens pour supporter l'expiration et la grace period  
**Afin de** rejeter automatiquement les tokens expirés et accepter les tokens en grace period

**Points** : 5

**Critères d'acceptation** :
- [ ] Logique de validation étendue dans `bearer.py`
- [ ] Tokens avec `status='revoked'` sont refusés
- [ ] Tokens avec `expires_at IS NOT NULL` et `now >= expires_at` sont refusés
- [ ] Tokens avec `status='grace'` sont acceptés si `grace_until > now`
- [ ] Tokens legacy (`status='legacy'`) sont acceptés comme avant
- [ ] Logs structurés pour événements : `token_expired`, `token_grace_ended`, `token_accepted`

**Tâches techniques** :
- [ ] Modifier `sources/dvig/auth/bearer.py` : fonction `_validate_token_and_get_record()`
- [ ] Ajouter vérification `status == 'revoked'` → refuser
- [ ] Ajouter vérification `expires_at IS NOT NULL` et `now >= expires_at` → refuser
- [ ] Ajouter vérification `status == 'grace'` et `grace_until > now` → accepter
- [ ] Conserver logique legacy (tokens sans expiration)
- [ ] Ajouter logs structurés pour chaque cas de validation
- [ ] Tests unitaires pour chaque cas de validation
- [ ] Tests d'intégration avec tokens réels

**Livrables** :
- ✅ `sources/dvig/auth/bearer.py` : Validation étendue
- ✅ Tests unitaires validation
- ✅ Tests d'intégration validation

---

## 📦 Sprint 2 : API DVIG + CLI + Tests (1 semaine)

**Points** : 13 points  
**Objectif** : Implémenter les endpoints DVIG pour le renouvellement et étendre la CLI.

### User Stories

#### US-2.1 : Endpoint GET /auth/token-status

**En tant que** application (Odoo)  
**Je veux** consulter l'état de mon token actif et savoir s'il doit être renouvelé  
**Afin de** déclencher le renouvellement au bon moment

**Points** : 3

**Critères d'acceptation** :
- [ ] Endpoint `GET /auth/token-status` créé
- [ ] Authentification Bearer requise
- [ ] Retourne informations token actif : `token_id`, `expires_at`
- [ ] Retourne recommandation renouvellement : `should_renew`, `renew_after`, `renew_before`, `grace_period`
- [ ] Gestion erreurs (token invalide, scope mismatch)
- [ ] Tests unitaires et intégration

**Tâches techniques** :
- [ ] Créer route `sources/dvig/dvig/api_fastapi/routes/token_status.py`
- [ ] Implémenter endpoint `GET /auth/token-status`
- [ ] Utiliser dépendance d'authentification existante (`get_auth_info`)
- [ ] Requête DB pour trouver token actif du scope
- [ ] Calcul `should_renew` : `expires_at - now <= renew_before`
- [ ] Format réponse JSON conforme à la spec
- [ ] Gestion erreurs (401, 403)
- [ ] Tests unitaires
- [ ] Tests d'intégration

**Livrables** :
- ✅ `sources/dvig/dvig/api_fastapi/routes/token_status.py`
- ✅ Endpoint `GET /auth/token-status` opérationnel
- ✅ Tests unitaires et intégration

---

#### US-2.2 : Endpoint POST /auth/renew

**En tant que** application (Odoo)  
**Je veux** renouveler mon token avant expiration  
**Afin de** éviter l'interruption de service

**Points** : 5

**Critères d'acceptation** :
- [ ] Endpoint `POST /auth/renew` créé
- [ ] Authentification Bearer requise
- [ ] Génère nouveau token si nécessaire (idempotent)
- [ ] Transition ancien token → `status='grace'`, `grace_until=now+grace_period`
- [ ] Nouveau token → `status='active'`, `expires_at=now+TTL`
- [ ] Retourne token en clair **une seule fois** (sécurité)
- [ ] Token en clair jamais loggé
- [ ] Tests unitaires et intégration

**Tâches techniques** :
- [ ] Créer route `sources/dvig/dvig/api_fastapi/routes/token_renew.py`
- [ ] Implémenter endpoint `POST /auth/renew`
- [ ] Vérifier si token successeur existe déjà (idempotence)
- [ ] Générer nouveau token (réutiliser logique existante)
- [ ] Transaction DB atomique : créer nouveau + mettre à jour ancien
- [ ] Calcul `expires_at = now + TTL` (configurable)
- [ ] Calcul `grace_until = now + grace_period` (configurable)
- [ ] Retourner token en clair dans réponse (une seule fois)
- [ ] Ne jamais logger token en clair
- [ ] Tests unitaires et intégration
- [ ] Tests idempotence (2 appels = 1 token)

**Livrables** :
- ✅ `sources/dvig/dvig/api_fastapi/routes/token_renew.py`
- ✅ Endpoint `POST /auth/renew` opérationnel
- ✅ Tests unitaires et intégration
- ✅ Tests idempotence

---

#### US-2.3 : Extension CLI — token status et renew

**En tant que** opérateur plateforme  
**Je veux** consulter le statut d'un token et le renouveler via la CLI  
**Afin de** gérer les tokens depuis la ligne de commande

**Points** : 3

**Critères d'acceptation** :
- [ ] Commande `dorevia.sh token status <univers> <env> <tenant>` créée
- [ ] Commande `dorevia.sh token renew <univers> <env> <tenant>` créée
- [ ] Extension `token issue` avec option `--ttl` (ex. `--ttl 365d`)
- [ ] Affichage clair du statut et recommandations
- [ ] Token en clair affiché une seule fois lors du renew
- [ ] Tests CLI

**Tâches techniques** :
- [ ] Modifier `bin/dorevia.sh` : ajouter `cmd_token_status()`
- [ ] Modifier `bin/dorevia.sh` : ajouter `cmd_token_renew()`
- [ ] Modifier `cmd_token_issue()` : ajouter option `--ttl`
- [ ] Parser `--ttl` (format `365d`, `12m`, etc.)
- [ ] Calcul `expires_at` lors de l'émission
- [ ] Appel API DVIG pour `status` et `renew` (ou logique directe DB)
- [ ] Affichage formaté et lisible
- [ ] Tests CLI (scripts de test)

**Livrables** :
- ✅ `bin/dorevia.sh` : Commandes `token status` et `token renew`
- ✅ Extension `token issue --ttl`
- ✅ Tests CLI

---

#### US-2.4 : Tests complets et documentation

**En tant que** développeur plateforme  
**Je veux** des tests complets et une documentation à jour  
**Afin de** garantir la qualité et faciliter la maintenance

**Points** : 2

**Critères d'acceptation** :
- [ ] Tests unitaires pour tous les composants
- [ ] Tests d'intégration end-to-end (issue → status → renew → validation)
- [ ] Tests de rétrocompatibilité (tokens legacy)
- [ ] Tests de grace period (ancien token accepté puis refusé)
- [ ] Documentation technique mise à jour
- [ ] Guide utilisateur pour renouvellement tokens

**Tâches techniques** :
- [ ] Tests unitaires : validation, expiration, grace
- [ ] Tests d'intégration : parcours complet token lifecycle
- [ ] Tests rétrocompatibilité : tokens legacy fonctionnent
- [ ] Tests grace period : ancien token accepté puis refusé après `grace_until`
- [ ] Mettre à jour documentation technique DVIG
- [ ] Créer guide utilisateur renouvellement tokens
- [ ] Documenter variables d'environnement (TTL, renew_before, grace_period)

**Livrables** :
- ✅ Suite de tests complète
- ✅ Documentation technique
- ✅ Guide utilisateur

---

## 📦 Sprint 3 : Intégration Odoo (optionnel) (1 semaine)

**Points** : 8 points  
**Objectif** : Créer un module Odoo pour le renouvellement automatique des tokens (optionnel, hors scope v1.0 mais recommandé).

### User Stories

#### US-3.1 : Module Odoo — Renouvellement automatique tokens

**En tant que** exploitant Odoo  
**Je veux** que les tokens DVIG soient renouvelés automatiquement  
**Afin de** éviter les interruptions de service dues à l'expiration

**Points** : 8

**Critères d'acceptation** :
- [ ] Module Odoo créé (ex. `dorevia_token_renewal`)
- [ ] Cron Odoo appelle périodiquement `GET /auth/token-status`
- [ ] Si `should_renew == true`, appelle `POST /auth/renew`
- [ ] Stocke nouveau token (ir.config_parameter ou secret file)
- [ ] Bascule usage sur nouveau token
- [ ] Gestion erreurs réseau (retry logic)
- [ ] Logging structuré
- [ ] Tests module Odoo

**Tâches techniques** :
- [ ] Créer structure module Odoo (`dorevia_token_renewal/`)
- [ ] Créer modèle `ir.config_parameter` pour stockage token
- [ ] Créer cron Odoo (ex. toutes les 24h)
- [ ] Implémenter méthode `_check_token_status()` : appel `GET /auth/token-status`
- [ ] Implémenter méthode `_renew_token()` : appel `POST /auth/renew`
- [ ] Implémenter méthode `_update_token()` : mise à jour token stocké
- [ ] Gestion erreurs réseau (retry, backoff)
- [ ] Logging structuré (événements renouvellement)
- [ ] Tests unitaires module Odoo
- [ ] Tests d'intégration avec DVIG réel

**Livrables** :
- ✅ Module Odoo `dorevia_token_renewal/`
- ✅ Cron de renouvellement automatique
- ✅ Tests module Odoo
- ✅ Documentation module

**Note** : Cette user story est **optionnelle** et peut être reportée si les priorités changent. L'API DVIG est stable et peut être utilisée manuellement ou par d'autres intégrations.

---

## 📊 Récapitulatif des Points

| Sprint | User Story | Points | Total Sprint |
|--------|-----------|--------|--------------|
| **Sprint 1** | US-1.1 : Migration DB | 3 | **8** |
| | US-1.2 : Validation tokens | 5 | |
| **Sprint 2** | US-2.1 : Endpoint token-status | 3 | **13** |
| | US-2.2 : Endpoint renew | 5 | |
| | US-2.3 : Extension CLI | 3 | |
| | US-2.4 : Tests & Documentation | 2 | |
| **Sprint 3** | US-3.1 : Module Odoo (optionnel) | 8 | **8** |
| **TOTAL** | | | **29 points** |

---

## 🎯 Critères d'Acceptation Globaux (Phase 4)

La Phase 4 est terminée si :

- ✅ Migration DB appliquée avec succès (tokens existants migrés)
- ✅ Validation tokens avec expiration et grace opérationnelle
- ✅ Endpoints `/auth/token-status` et `/auth/renew` disponibles et testés
- ✅ CLI `token status` et `token renew` fonctionnelles
- ✅ Tokens legacy continuent de fonctionner (rétrocompatibilité)
- ✅ Tests unitaires et intégration passent
- ✅ Aucun token en clair dans les logs
- ✅ Documentation technique et utilisateur à jour
- ✅ Module Odoo (optionnel) fonctionnel si implémenté

---

## ⚠️ Risques et Mitigations

### Risques Techniques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Token en clair exposé dans logs | Faible | 🔴 Critique | Code review strict + tests automatiques |
| Race condition lors du renew | Moyenne | 🟡 Moyen | Transaction DB atomique |
| Migration tokens legacy échoue | Faible | 🟢 Faible | Script de migration testé + rollback |

### Risques Opérationnels

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Applications non mises à jour | Moyenne | 🟡 Moyen | Documentation + support + monitoring |
| Tokens expirés en production | Faible | 🟡 Moyen | Monitoring + alertes proactives |
| Coordination DVIG ↔ Odoo | Moyenne | 🟡 Moyen | Contrat API stable + tests |

---

## 📅 Planning Détaillé

### Sprint 1 (Semaine 1) : Migration DB + Validation

**Lundi-Mardi** :
- US-1.1 : Migration DB (3 points)
  - Création migration SQL
  - Tests migration
  - Documentation

**Mercredi-Vendredi** :
- US-1.2 : Validation tokens (5 points)
  - Extension `bearer.py`
  - Tests unitaires
  - Tests intégration

**Livrables Sprint 1** :
- ✅ Migration DB appliquée
- ✅ Validation tokens avec expiration/grace opérationnelle

---

### Sprint 2 (Semaine 2) : API + CLI + Tests

**Lundi-Mardi** :
- US-2.1 : Endpoint token-status (3 points)
- US-2.2 : Endpoint renew (5 points) — début

**Mercredi-Jeudi** :
- US-2.2 : Endpoint renew (5 points) — fin
- US-2.3 : Extension CLI (3 points)

**Vendredi** :
- US-2.4 : Tests & Documentation (2 points)

**Livrables Sprint 2** :
- ✅ Endpoints DVIG opérationnels
- ✅ CLI étendue
- ✅ Tests complets
- ✅ Documentation

---

### Sprint 3 (Semaine 3) : Intégration Odoo (optionnel)

**Lundi-Mercredi** :
- US-3.1 : Module Odoo (8 points)
  - Structure module
  - Cron de renouvellement
  - Gestion erreurs

**Jeudi-Vendredi** :
- US-3.1 : Module Odoo (8 points) — fin
  - Tests module
  - Documentation

**Livrables Sprint 3** :
- ✅ Module Odoo fonctionnel (si implémenté)
- ✅ Tests module
- ✅ Documentation

---

## 🔗 Dépendances

### Dépendances Externes

- ✅ Phase 3 complète (domaines clients, serveurs clients)
- ✅ DVIG opérationnel avec authentification Bearer
- ✅ Base de données PostgreSQL accessible

### Dépendances Internes

- **Sprint 1 → Sprint 2** : La validation (Sprint 1) doit être terminée avant les endpoints API (Sprint 2)
- **Sprint 2 → Sprint 3** : Les endpoints API (Sprint 2) doivent être stables avant le module Odoo (Sprint 3)

---

## 📚 Documentation Associée

- **Spécification** : `ZeDocs/V2/SPEC_Auto_Renew_Tokens_DVIG_Caddy_like_v1.0.md`
- **Évaluation de faisabilité** : `ZeDocs/V2/EVALUATION_FAISABILITE_AUTO_RENEW_TOKENS_DVIG.md`
- **Recommandation sécurité** : `ZeDocs/V2/RECOMMANDATION_SECURITE_EXPIRATION_TOKENS_DVIG.md`

---

## ✅ Checklist de Démarrage

Avant de commencer le Sprint 1 :

- [ ] Spécification Phase 4 validée
- [ ] Évaluation de faisabilité approuvée
- [ ] Environnement de développement préparé
- [ ] Accès base de données DVIG
- [ ] Tests Phase 3 passent (prérequis)
- [ ] Équipe formée sur la spec

---

**Fin du plan d'implémentation**

