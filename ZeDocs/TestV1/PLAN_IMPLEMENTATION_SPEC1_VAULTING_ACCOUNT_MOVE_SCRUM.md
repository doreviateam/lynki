# 📘 Plan d'Implémentation SPEC 1 — Vaulting `account.move` `posted` — Mode Scrum

**Version** : 1.0  
**Date** : 2026-01-03  
**Date de validation** : 2026-01-03  
**Base** : `SPEC1_VAULTING_ACCOUNT_MOVE_POSTED_v1.0.md` (v1.1 — **FIGÉE**)  
**Durée estimée** : 2 sprints (2 semaines)  
**Équipe** : Dev plateforme / Vault

> **⚠️ IMPORTANT — SPEC 1 Figée (Référence)**  
> La SPEC 1 est **figée** et sert de **référence définitive**.  
> La frontière **Vault / CORE** est **claire**.  
> La question **"qu'est-ce qu'on enregistre ?"** est **définitivement tranchée**.

---

## 📋 Vue d'Ensemble

### Objectif SPEC 1

Implémenter le vaulting des objets `account.move` en état `posted` dans Dorevia Vault, avec :
- Validations strictes (model, state, move_type, tenant)
- Stockage des métadonnées (notamment `move_type`)
- Idempotence basée sur `(tenant, sha256)`
- Conformité Factur-X 2026 (constat et étiquetage)
- Conservation probante uniquement (NF525 hors scope)

### Tenant de Référence

Le tenant **`core`** sera utilisé comme tenant de référence pour la SPEC 1. Toutes les fonctionnalités sont d'abord implémentées et validées sur le tenant `core` avant d'être étendues aux autres tenants.

### Définition de "Fait" (DoD)

La SPEC 1 est terminée si :
- ✅ Les validations `account.move posted` sont implémentées et fonctionnelles
- ✅ Le champ `move_type` est stocké en DB
- ✅ L'idempotence `(tenant, sha256)` est opérationnelle
- ✅ La conformité Factur-X est constatée et étiquetée (`compliance_status`)
- ✅ Les tests unitaires AC-1..AC-10 passent (100% couverture)
- ✅ Les tests d'intégration AC-11..AC-14 passent
- ✅ Les tests Factur-X AC-17/18 passent
- ✅ La documentation API et connecteur Odoo est à jour
- ⏳ Le déploiement en environnement de test est validé (en attente)

**Statut** : 🟢 **SPEC 1 COMPLÉTÉE** — Tous les critères d'acceptation sont remplis (sauf déploiement test)

---

## 🏃 Structure Scrum

### Sprints

- **Sprint 1** : Migration DB + Validations + Stockage (1 semaine)
- **Sprint 2** : Factur-X + Tests + Documentation (1 semaine)

**Total** : 2 semaines

---

## 📦 Sprint 1 : Migration DB + Validations + Stockage (1 semaine)

**Points** : 13 points  
**Objectif** : Préparer la base de données, implémenter les validations strictes, et assurer le stockage correct des métadonnées.

### User Stories

#### US-1.1 : Migration base de données — Champs SPEC 1

**En tant que** développeur plateforme  
**Je veux** ajouter les champs nécessaires à la table `documents` pour supporter la SPEC 1  
**Afin de** stocker `move_type`, `compliance_status`, et `facturx_present`

**Points** : 3

**Critères d'acceptation** :
- [x] Migration SQL créée (`010_add_spec1_fields.sql`)
- [x] Champs ajoutés : `move_type VARCHAR(50)`, `compliance_status VARCHAR(50)`, `facturx_present BOOLEAN`
- [x] Index créés pour optimiser les requêtes (`idx_documents_move_type`, `idx_documents_compliance_status`)
- [x] Migration testée et réversible
- [x] Valeurs par défaut définies pour les documents existants

**Tâches techniques** :
- [x] Créer migration `sources/vault/migrations/010_add_spec1_fields.sql`
- [x] Ajouter colonnes :
  - `move_type VARCHAR(50) NULL`
  - `compliance_status VARCHAR(50) NULL DEFAULT 'out_of_scope'`
  - `facturx_present BOOLEAN NULL DEFAULT FALSE`
- [x] Créer index : `idx_documents_move_type`, `idx_documents_compliance_status`
- [x] Tester migration sur environnement de développement
- [x] Documenter migration et rollback

**Livrables** :
- ✅ `sources/vault/migrations/010_add_spec1_fields.sql`
- ✅ Documentation migration

---

#### US-1.2 : Validation account.move posted

**En tant que** développeur Vault  
**Je veux** implémenter la fonction de validation spécifique pour `account.move`  
**Afin de** rejeter automatiquement les documents non conformes à la SPEC 1

**Points** : 5

**Critères d'acceptation** :
- [x] Fonction `validateAccountMovePayload()` créée dans `invoices.go`
- [x] Validation `model == "account.move"` implémentée
- [x] Validation `state == "posted"` implémentée
- [x] Validation `move_type` dans liste autorisée implémentée
- [x] Validation mapping `source` ↔ `move_type` implémentée
- [x] Validation `meta.tenant` non vide implémentée
- [x] Validation appliquée **avant** toute persistance
- [x] Messages d'erreur explicites retournés (400 Bad Request)

**Tâches techniques** :
- [x] Modifier `sources/vault/internal/handlers/invoices.go`
- [x] Créer fonction `validateAccountMovePayload(payload *InvoicePayload) error`
- [x] Implémenter les 5 validations dans l'ordre spécifié (fail-fast)
- [x] Intégrer l'appel à `validateAccountMovePayload()` dans `InvoicesHandler`
- [x] Ajouter logs structurés pour chaque validation échouée
- [x] Tester avec payloads valides et invalides

**Livrables** :
- ✅ Fonction `validateAccountMovePayload()` dans `invoices.go`
- ✅ Intégration dans le handler
- ✅ Tests unitaires de validation

---

#### US-1.3 : Stockage move_type et idempotence (tenant, sha256)

**En tant que** développeur Vault  
**Je veux** stocker `move_type` et implémenter l'idempotence basée sur `(tenant, sha256)`  
**Afin de** conserver les métadonnées de preuve et éviter les duplications par tenant

**Points** : 5

**Critères d'acceptation** :
- [x] `move_type` extrait de `payload.meta.move_type` et stocké en DB
- [x] Modèle `Document` mis à jour avec champ `MoveType`
- [x] Idempotence basée sur `(tenant, sha256)` implémentée
- [x] Recherche d'existant sur `(tenant, sha256)` avant insertion
- [x] Retour 200 OK avec document existant si trouvé
- [x] Aucune duplication si même `(tenant, sha256)`

**Tâches techniques** :
- [x] Modifier `sources/vault/internal/models/document.go` : ajouter `MoveType *string`
- [x] Modifier `sources/vault/internal/storage/postgres.go` : inclure `move_type` dans INSERT/UPDATE
- [x] Modifier `InvoicesHandler` : extraire `move_type` de `payload.Meta["move_type"]`
- [x] Modifier logique idempotence : rechercher sur `(tenant, sha256)` au lieu de `sha256` seul
- [x] Créer fonction helper `GetDocumentByTenantAndSHA256(tenant, sha256)`
- [x] Tester idempotence avec même tenant et tenant différent

**Livrables** :
- ✅ Modèle `Document` avec `MoveType`
- ✅ Stockage `move_type` en DB
- ✅ Idempotence `(tenant, sha256)` fonctionnelle
- ✅ Tests unitaires idempotence

---

## 📦 Sprint 2 : Factur-X + Tests + Documentation (1 semaine)

**Points** : 12 points  
**Objectif** : Implémenter la constatation et l'étiquetage Factur-X, compléter les tests, et finaliser la documentation.

### User Stories

#### US-2.1 : Conformité Factur-X 2026 (constat et étiquetage)

**En tant que** développeur Vault  
**Je veux** constater et étiqueter la conformité Factur-X des documents B2B  
**Afin de** informer Odoo CORE de la conformité réglementaire 2026

**Points** : 5

**Critères d'acceptation** :
- [x] Détection Factur-X dans le PDF (validation existante utilisée)
- [x] Détection "B2B probable" : `buyer_vat` ET `seller_vat` présents
- [x] Calcul `compliance_status` :
  - `compliant` si Factur-X présent
  - `non_compliant_2026` si B2B probable + Factur-X absent
  - `out_of_scope` sinon
- [x] Stockage `compliance_status` et `facturx_present` en DB
- [x] Logs structurés pour événements de conformité

**Tâches techniques** :
- [x] Modifier `sources/vault/internal/models/document.go` : ajouter `ComplianceStatus *string`, `FacturXPresent *bool`
- [x] Créer fonction `detectFacturXCompliance(facturXResult *validation.ValidationResult, meta map[string]interface{}, log *zerolog.Logger) (string, bool)`
- [x] Détecter Factur-X : utiliser validation existante
- [x] Détecter B2B : vérifier présence `buyer_vat` et `seller_vat` (priorité : métadonnées Factur-X > payload)
- [x] Calculer `compliance_status` selon règles §9.3
- [x] Stocker `compliance_status` et `facturx_present` dans `doc`
- [x] Intégrer dans `InvoicesHandler` après validation Factur-X
- [x] Tester avec PDF Factur-X, PDF standard B2B, PDF B2C

**Livrables** :
- ✅ Fonction `detectFacturXCompliance()`
- ✅ Stockage `compliance_status` et `facturx_present`
- ✅ Tests unitaires conformité

---

#### US-2.2 : Tests unitaires et d'intégration complets

**En tant que** développeur Vault  
**Je veux** créer des tests complets couvrant tous les critères d'acceptation  
**Afin de** garantir la qualité et la conformité à la SPEC 1

**Points** : 4

**Critères d'acceptation** :
- [x] Tests unitaires AC-1..AC-10 passent
- [x] Tests d'intégration AC-11..AC-14 passent
- [x] Tests Factur-X AC-17/18 passent
- [x] Couverture de code > 80% pour les nouvelles fonctions (100% atteint)
- [x] Tests de non-régression AC-15/16 passent

**Tâches techniques** :
- [x] Créer `sources/vault/internal/handlers/invoices_validation_test.go`
  - Test AC-1 : `out_invoice posted` accepté
  - Test AC-2 : `in_invoice posted` accepté
  - Test AC-3 : `out_refund posted` accepté
  - Test AC-4 : `in_refund posted` accepté
  - Test AC-5 : `draft` rejeté (via invalid model/state)
  - Test AC-6 : `cancel` rejeté (via invalid state)
  - Test AC-7 : `move_type` invalide rejeté
  - Test AC-8 : `source`/`move_type` mismatch rejeté
  - Test AC-9 : `tenant` manquant rejeté
  - Test AC-10 : idempotence `(tenant, sha256)`
  - Tests supplémentaires : `detectFacturXCompliance()` (8 tests)
- [x] Créer `sources/vault/tests/integration/test_account_move_vaulting.go`
  - Test AC-11 : intégration Odoo avec tenant
  - Test AC-12 : stockage métadonnées + isolation tenant
  - Test AC-13 : preuves JWS/Ledger avec tenant
  - Test AC-14 : isolation multi-tenant
- [x] Créer tests Factur-X (déjà présents dans `test_account_move_sprint1_test.go`)
  - Test AC-17 : Factur-X présent → `compliant`
  - Test AC-18 : B2B sans Factur-X → `non_compliant_2026`
- [x] Tests non-régression
  - Test AC-15 : autres types documents (POS) fonctionnent
  - Test AC-16 : API `/api/v1/invoices` reste compatible

**Livrables** :
- ✅ Tests unitaires complets
- ✅ Tests d'intégration complets
- ✅ Tests Factur-X
- ✅ Rapport de couverture de code

---

#### US-2.3 : Documentation API et connecteur Odoo

**En tant que** développeur plateforme  
**Je veux** documenter l'API et le connecteur Odoo pour la SPEC 1  
**Afin de** faciliter l'intégration et l'utilisation

**Points** : 3

**Critères d'acceptation** :
- [x] Documentation API `/api/v1/invoices` mise à jour
- [x] Validations spécifiques `account.move` documentées
- [x] Types `move_type` acceptés documentés
- [x] Exemples de payload valides et invalides
- [x] Documentation connecteur Odoo créée ou mise à jour
- [x] Exemples de configuration Odoo
- [x] Champs `meta` requis documentés

**Tâches techniques** :
- [x] Mettre à jour `sources/vault/docs/REPONSES_INTEGRATION_API.md`
  - Ajouter section "Validations account.move (SPEC 1)"
  - Documenter les 5 validations
  - Exemples payload avec `move_type` et `tenant`
  - Exemples erreurs 400
- [x] Créer `sources/vault/docs/CONNECTEUR_ODOO_SPEC1.md`
  - Déclencheur `action_post()`
  - Construction payload avec `move_type` et `tenant`
  - Gestion erreurs Vault (permanentes vs temporaires)
  - Retry avec backoff exponentiel
  - Configuration `ir.config_parameter`
- [x] Ajouter exemples dans documentation API
  - Payload complet avec Factur-X
  - Payload sans Factur-X
  - Réponses succès/erreur

**Livrables** :
- ✅ Documentation API mise à jour
- ✅ Documentation connecteur Odoo
- ✅ Exemples de payload et configuration

---

## 📊 Récapitulatif des Points

| Sprint | User Story | Points | Statut | Date Complétion |
|--------|------------|--------|--------|-----------------|
| **Sprint 1** | US-1.1 : Migration DB | 3 | 🟢 Complété | 2026-01-03 |
| | US-1.2 : Validation account.move | 5 | 🟢 Complété | 2026-01-03 |
| | US-1.3 : Stockage move_type + Idempotence | 5 | 🟢 Complété | 2026-01-03 |
| **Sprint 2** | US-2.1 : Conformité Factur-X | 5 | 🟢 Complété | 2026-01-03 |
| | US-2.2 : Tests complets | 4 | 🟢 Complété | 2026-01-03 |
| | US-2.3 : Documentation | 3 | 🟢 Complété | 2026-01-03 |
| **TOTAL** | | **25** | **🟢 Complété** | **2026-01-03** |

---

## 🔄 Dépendances

### Dépendances internes

- **US-1.1** → **US-1.2** : La migration DB doit être faite avant les validations
- **US-1.2** → **US-1.3** : Les validations doivent être en place avant le stockage
- **US-1.3** → **US-2.1** : Le stockage doit être fonctionnel avant Factur-X
- **US-1.2, US-1.3, US-2.1** → **US-2.2** : Les fonctionnalités doivent être implémentées avant les tests
- **US-1.2, US-1.3, US-2.1** → **US-2.3** : La documentation nécessite les fonctionnalités implémentées

### Dépendances externes

- Validation Factur-X existante dans Vault (si disponible)
- Modèle `Document` existant avec champs de base
- Infrastructure de tests existante

---

## 🧪 Stratégie de Tests

### Tests unitaires

- **Fichier** : `sources/vault/tests/unit/test_account_move_validation.go`
- **Couverture** : Fonction `validateAccountMovePayload()` et logique de conformité
- **Outils** : Go testing standard

### Tests d'intégration

- **Fichier** : `sources/vault/tests/integration/test_account_move_vaulting.go`
- **Couverture** : Endpoint `/api/v1/invoices` avec base de données réelle
- **Outils** : Go testing + PostgreSQL de test

### Tests de non-régression

- Vérifier que les autres types de documents (POS, etc.) continuent de fonctionner
- Vérifier que l'API reste compatible pour les clients existants

---

## 📝 Notes d'Implémentation

### Migration DB

La migration `010_add_spec1_fields.sql` doit être :
- **Réversible** : Script de rollback inclus
- **Idempotente** : Utiliser `IF NOT EXISTS` pour éviter erreurs si colonnes existent
- **Sûre** : Valeurs par défaut pour documents existants

### Validation

La fonction `validateAccountMovePayload()` doit :
- **Fail-fast** : Retourner immédiatement à la première validation échouée
- **Messages explicites** : Erreurs claires pour faciliter le débogage
- **Logs structurés** : Utiliser `zerolog` pour traçabilité

### Idempotence

L'idempotence `(tenant, sha256)` doit :
- **Rechercher avant insertion** : Éviter les doublons
- **Retourner document existant** : 200 OK avec infos existantes
- **Respecter l'isolation tenant** : Un même `sha256` peut exister pour plusieurs tenants

### Conformité Factur-X

La constatation Factur-X doit :
- **Ne jamais générer** : Seulement constater et étiqueter
- **Détecter B2B minimal** : `buyer_vat` + `seller_vat` présents
- **États clairs** : `compliant`, `non_compliant_2026`, `out_of_scope`
- **Informer CORE** : Via constats (SPEC 2) ou webhook si prévu

---

## ✅ Checklist de Déploiement

Avant déploiement en production :

- [x] Toutes les US du Sprint 1 complétées
- [x] Toutes les US du Sprint 2 complétées
- [x] Tous les tests passent (AC-1..AC-18)
- [x] Migration DB testée sur environnement de staging
- [x] Documentation API et Odoo à jour
- [ ] Code review validé
- [ ] Déploiement en environnement de test validé
- [ ] Monitoring et alertes configurés
- [ ] Plan de rollback préparé

**Statut** : 🟢 **Implémentation complétée** — Prêt pour code review et déploiement

---

## 🔗 Références

- **SPEC 1** : `SPEC1_VAULTING_ACCOUNT_MOVE_POSTED_v1.0.md` (v1.1)
- **Réflexion** : `REFLECTION_FACTURATION_MRR_VAULT_V2.1.md`
- **Code existant** : `sources/vault/internal/handlers/invoices.go`
- **Modèle** : `sources/vault/internal/models/document.go`

---

---

## 🎉 Résumé Final — SPEC 1 Complétée

**Date de complétion** : 2026-01-03  
**Statut** : 🟢 **COMPLÉTÉE**

### Progression Globale

- **Sprint 1** : 13/13 points (100%) — Complété
- **Sprint 2** : 12/12 points (100%) — Complété
- **Total** : 25/25 points (100%) — Complété

### Livrables

✅ **Migration DB** : `010_add_spec1_fields.sql` créée et testée  
✅ **Validation** : `validateAccountMovePayload()` avec 5 validations fail-fast  
✅ **Stockage** : `move_type` stocké, idempotence `(tenant, sha256)` opérationnelle  
✅ **Factur-X** : `detectFacturXCompliance()` avec étiquetage conforme  
✅ **Tests** : 100% couverture pour les fonctions principales  
✅ **Documentation** : API et connecteur Odoo complets

### Fichiers Créés/Modifiés

**Migrations** :
- `sources/vault/migrations/010_add_spec1_fields.sql`

**Code** :
- `sources/vault/internal/handlers/invoices.go` (modifié)
- `sources/vault/internal/models/document.go` (modifié)
- `sources/vault/internal/storage/postgres.go` (modifié)

**Tests** :
- `sources/vault/internal/handlers/invoices_validation_test.go` (créé)
- `sources/vault/tests/integration/test_account_move_vaulting.go` (créé)
- `sources/vault/tests/integration/test_account_move_sprint1_test.go` (existant, utilisé)

**Documentation** :
- `sources/vault/docs/REPONSES_INTEGRATION_API.md` (mis à jour)
- `sources/vault/docs/CONNECTEUR_ODOO_SPEC1.md` (créé)
- `sources/vault/tests/COUVERTURE_CODE_SPEC1.md` (créé)

### Prochaines Étapes

1. ⏳ Code review
2. ⏳ Déploiement en environnement de test
3. ⏳ Validation fonctionnelle
4. ⏳ Déploiement en production

---

**Fin du Plan d'Implémentation SPEC 1**

*Document de planification Scrum pour l'implémentation du vaulting `account.move` `posted`*  
*✅ SPEC 1 complétée le 2026-01-03*

