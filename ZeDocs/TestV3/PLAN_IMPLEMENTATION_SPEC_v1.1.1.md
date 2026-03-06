# 📋 Plan d'Implémentation — SPEC Orchestration Temps Réel v1.1.1

**Date** : 2026-01-12  
**Version** : 1.1.1 (Finale)  
**Statut** : ✅ **IMPLÉMENTATION TERMINÉE** — Plan de validation et déploiement  
**SPEC** : Orchestration Temps Réel du Vaulting via OCA queue_job (Odoo → DVIG → Vault) v1.1.1

---

## 🎯 Objectif

Planifier la validation, les tests et le déploiement de la SPEC v1.1.1 qui intègre :
- ✅ Orchestration temps réel v1.1.0 (déjà implémentée)
- ✅ Recommandations architecture v1.1.0 (déjà implémentées)
- ✅ Addendum "No Human In The Loop" v1.1.1-add1 (déjà implémenté)
- 🧪 Tests fonctionnels (à réaliser)
- 🚀 Déploiement production (à planifier)

---

## 📊 État Actuel

### ✅ Implémenté

#### Phase 1 : Orchestration Temps Réel v1.1.0
- ✅ Endpoint DVIG `/internal/outbox/process` avec `forwarded_source_ids`
- ✅ Service Odoo `dorevia.dvig.service` avec `job_trigger_worker()`
- ✅ Méthode `job_vault_fetch_proof()` avec retries automatiques
- ✅ Enchaînement automatique `trigger_worker` → `fetch_proof`
- ✅ Boutons debug (outils de diagnostic)

#### Phase 2 : Recommandations Architecture v1.1.0
- ✅ Anti-duplication des jobs Proof (`_can_enqueue_proof()`)
- ✅ Backoff intelligent avec jitter (`_calculate_fetch_proof_retry_delay()`)
- ✅ Normalisation stricte des source_ids DVIG
- ✅ Logging sécurité amélioré (hash token)

#### Phase 3 : Addendum "No Human In The Loop" v1.1.1-add1
- ✅ Flag PROD pour boutons debug (`dorevia.debug.actions`)
- ✅ CRON Reconciler léger (`cron_vault_reconciler()`)
- ✅ Seuils d'abandon (MAX_ATTEMPTS + MAX_AGE → `failed_hard`)
- ✅ Identity_key queue_job (anti-duplication niveau queue)

### 🧪 À Réaliser

- Tests fonctionnels complets
- Déploiement en staging
- Validation production
- Documentation runbooks (FORB-2)

---

## 📋 Plan d'Implémentation Détaillé

### Phase 1 : Tests Fonctionnels (Priorité : 🔴 Haute)

**Objectif** : Valider que toutes les fonctionnalités implémentées fonctionnent correctement.

**Durée estimée** : 2-3 heures

#### 1.1 Tests Flag PROD (Boutons Debug)

**Responsable** : Développeur  
**Durée** : 30 minutes

**Scénarios** :
- [ ] **Test 1.1.1** : Vérifier que les boutons sont masqués si `dorevia.debug.actions = 0`
- [ ] **Test 1.1.2** : Vérifier que les boutons sont visibles si `dorevia.debug.actions = 1`
- [ ] **Test 1.1.3** : Vérifier que l'utilisation en PROD génère une erreur avec message clair
- [ ] **Test 1.1.4** : Vérifier que l'utilisation en DEV fonctionne normalement

**Critères d'acceptation** :
- ✅ Boutons invisibles en PROD
- ✅ Boutons visibles en DEV
- ✅ Message d'erreur explicite en PROD
- ✅ Fonctionnement normal en DEV

#### 1.2 Tests CRON Reconciler

**Responsable** : Développeur  
**Durée** : 45 minutes

**Scénarios** :
- [ ] **Test 1.2.1** : Créer facture `pending_proof` → attendre 3 min → vérifier traitement
- [ ] **Test 1.2.2** : Créer 100 factures `pending_proof` → vérifier limite 50
- [ ] **Test 1.2.3** : Vérifier anti-duplication (job déjà en cours)
- [ ] **Test 1.2.4** : Vérifier `identity_key` correct (`proof:{db}:{id}`)

**Critères d'acceptation** :
- ✅ Rattrapage automatique fonctionne
- ✅ Limite 50 factures respectée
- ✅ Pas de doublons
- ✅ `identity_key` correct

#### 1.3 Tests Seuils d'Abandon

**Responsable** : Développeur  
**Durée** : 45 minutes

**Scénarios** :
- [ ] **Test 1.3.1** : Simuler 20 tentatives → vérifier transition `failed_hard`
- [ ] **Test 1.3.2** : Simuler facture bloquée 24h → vérifier transition `failed_hard`
- [ ] **Test 1.3.3** : Vérifier logging structuré (incident_type, reason, etc.)
- [ ] **Test 1.3.4** : Vérifier métrique incident (si module disponible)

**Critères d'acceptation** :
- ✅ Transition `failed_hard` après MAX_ATTEMPTS
- ✅ Transition `failed_hard` après MAX_AGE
- ✅ Logging structuré correct
- ✅ Métrique incrémentée

#### 1.4 Tests Identity_key queue_job

**Responsable** : Développeur  
**Durée** : 30 minutes

**Scénarios** :
- [ ] **Test 1.4.1** : Enqueue 2 jobs `fetch_proof` identiques → vérifier 1 seul créé
- [ ] **Test 1.4.2** : Enqueue 2 jobs `trigger_worker` identiques → vérifier 1 seul créé
- [ ] **Test 1.4.3** : Vérifier format `identity_key` (`proof:{db}:{id}`, `dvig_trigger:{db}:{tenant}`)

**Critères d'acceptation** :
- ✅ Anti-duplication au niveau queue_job fonctionne
- ✅ Format `identity_key` correct

#### 1.5 Tests Backoff Intelligent

**Responsable** : Développeur  
**Durée** : 30 minutes

**Scénarios** :
- [ ] **Test 1.5.1** : Simuler 5 tentatives avec 404 → vérifier délais progressifs [5, 10, 20, 40, 120]s
- [ ] **Test 1.5.2** : Simuler 10 tentatives → vérifier jitter aléatoire (±3s)

**Critères d'acceptation** :
- ✅ Délais progressifs respectés
- ✅ Jitter aléatoire présent

#### 1.6 Tests Intégration End-to-End

**Responsable** : Développeur  
**Durée** : 1 heure

**Scénarios** :
- [ ] **Test 1.6.1** : Happy Path (post facture → `vaulted` en < 15s)
- [ ] **Test 1.6.2** : Vault 404 temporaire (60s) → retries avec backoff → `vaulted`
- [ ] **Test 1.6.3** : DVIG down temporaire (2 min) → rattrapage via filet de sécurité
- [ ] **Test 1.6.4** : Batch 20 factures → pas de tempête de jobs

**Critères d'acceptation** :
- ✅ Latence < 15s (p50)
- ✅ Retries fonctionnent
- ✅ Filets de sécurité fonctionnent
- ✅ Pas de tempête de jobs

**Livrable** : Rapport de tests avec résultats

---

### Phase 2 : Déploiement Staging (Priorité : 🔴 Haute)

**Objectif** : Déployer et valider en environnement de staging.

**Durée estimée** : 2-3 heures

#### 2.1 Pré-déploiement

**Responsable** : DevOps / Développeur  
**Durée** : 30 minutes

**Actions** :
- [ ] Vérifier que tous les tests fonctionnels passent
- [ ] Vérifier que le code compile sans erreur
- [ ] Vérifier que la documentation est à jour
- [ ] Préparer les paramètres système (flag PROD, seuils)

**Checklist** :
- [ ] Tests fonctionnels : ✅ Tous passent
- [ ] Compilation : ✅ Aucune erreur
- [ ] Documentation : ✅ À jour
- [ ] Paramètres : ✅ Préparés

#### 2.2 Déploiement Module Odoo

**Responsable** : DevOps  
**Durée** : 30 minutes

**Actions** :
- [ ] Mettre à jour le module `dorevia_vault_connector`
- [ ] Vérifier que le CRON reconciler est actif
- [ ] Configurer les paramètres système

**Commandes** :
```bash
# Mettre à jour le module
odoo -c /etc/odoo/odoo.conf -d <database> -u dorevia_vault_connector --stop-after-init

# Vérifier CRON reconciler
odoo -c /etc/odoo/odoo.conf -d <database> shell
>>> env['ir.cron'].search([('name', '=', 'Vault Reconciler')])
```

**Paramètres système à configurer** :
```python
# Flag PROD (obligatoire)
dorevia.debug.actions = 0  # PROD

# Seuils d'abandon (optionnel, valeurs par défaut)
dorevia.vault.max_attempts_proof = 20
dorevia.vault.max_age_pending_proof_hours = 24

# Configuration existante
dorevia.dvig.internal.token = <token>
dorevia.vault.url = <url>
dorevia.vault.token = <token>
```

#### 2.3 Déploiement DVIG (si nécessaire)

**Responsable** : DevOps  
**Durée** : 30 minutes

**Actions** :
- [ ] Vérifier que DVIG est à jour (version avec scheduler)
- [ ] Vérifier variables d'environnement :
  - `DVIG_SCHEDULER_ENABLED=1`
  - `DVIG_SCHEDULER_INTERVAL=30`
  - `DVIG_SCHEDULER_LIMIT=50`
- [ ] Redémarrer DVIG si nécessaire

#### 2.4 Validation Staging

**Responsable** : Développeur / QA  
**Durée** : 1-2 heures

**Actions** :
- [ ] Tester le chemin principal (queue_job temps réel)
- [ ] Tester le filet #1 (DVIG Scheduler)
- [ ] Tester le filet #2 (CRON Reconciler)
- [ ] Tester les seuils d'abandon
- [ ] Vérifier que les boutons debug sont masqués
- [ ] Vérifier les métriques et logs

**Scénarios de validation** :
- [ ] Post facture → `vaulted` en < 15s
- [ ] Vault 404 temporaire → retries → `vaulted`
- [ ] DVIG down → rattrapage via filet
- [ ] Batch factures → pas de tempête

**Critères d'acceptation** :
- ✅ Tous les scénarios passent
- ✅ Latence < 15s (p50)
- ✅ Filets de sécurité fonctionnent
- ✅ Métriques et logs corrects

**Livrable** : Rapport de validation staging

---

### Phase 3 : Documentation Runbooks (Priorité : 🟡 Moyenne)

**Objectif** : Mettre à jour les runbooks avec les interdictions explicites (FORB-2).

**Durée estimée** : 30 minutes

#### 3.1 Mise à Jour Runbook DVIG

**Responsable** : Développeur / DevOps  
**Durée** : 15 minutes

**Fichier** : `sources/dvig/docs/RUNBOOK_PRODUCTION.md`

**Contenu à ajouter** :
```markdown
## ⚠️ Interdictions Explicites (PROD)

### FORB-1 : Boutons d'action manuelle
Les boutons "Trigger DVIG Worker Now" et "Refresh Proof Now" sont des **outils de diagnostic** uniquement.
Ils sont **réservés à l'administrateur** en environnements non-PROD et **désactivés en production**.
Ils n'interviennent **jamais** dans le processus de vaulting, qui reste 100% automatisé.

### FORB-2 : Scripts SQL/curl pour corriger factures
**Interdit** :
- ❌ Patch SQL de `dorevia_vault_status`
- ❌ Curl pour "forcer" un vaulting
- ❌ Correction manuelle de statuts

**Autorisé** :
- ✅ Redémarrage service
- ✅ Vérification métriques
- ✅ Rotation token
- ✅ Consultation logs

Si une facture est bloquée, diagnostiquer la cause (logs, métriques) plutôt que corriger manuellement.
```

#### 3.2 Mise à Jour Runbooks Odoo (si existants)

**Responsable** : Développeur / DevOps  
**Durée** : 15 minutes

**Fichiers** : `ZeDocs/TestV1/RUNBOOK_*.md` (si applicable)

**Contenu** : Même section que ci-dessus

**Livrable** : Runbooks mis à jour

---

### Phase 4 : Déploiement Production (Priorité : 🔴 Haute)

**Objectif** : Déployer en production après validation staging.

**Durée estimée** : 2-3 heures

#### 4.1 Pré-déploiement Production

**Responsable** : DevOps / Lead Dev  
**Durée** : 30 minutes

**Actions** :
- [ ] Valider que tous les tests staging passent
- [ ] Valider que la documentation est complète
- [ ] Préparer le plan de rollback
- [ ] Communiquer le déploiement aux équipes

**Checklist** :
- [ ] Tests staging : ✅ Tous passent
- [ ] Documentation : ✅ Complète
- [ ] Plan rollback : ✅ Préparé
- [ ] Communication : ✅ Effectuée

#### 4.2 Déploiement Production

**Responsable** : DevOps  
**Durée** : 1 heure

**Actions** :
- [ ] Mettre à jour le module Odoo en production
- [ ] Configurer les paramètres système (flag PROD = 0)
- [ ] Vérifier que le CRON reconciler est actif
- [ ] Vérifier que DVIG scheduler est actif
- [ ] Redémarrer les services si nécessaire

**Paramètres système PROD** :
```python
# Flag PROD (obligatoire)
dorevia.debug.actions = 0  # PROD (boutons désactivés)

# Seuils d'abandon (optionnel, valeurs par défaut)
dorevia.vault.max_attempts_proof = 20
dorevia.vault.max_age_pending_proof_hours = 24
```

#### 4.3 Validation Production

**Responsable** : DevOps / QA  
**Durée** : 1-2 heures

**Actions** :
- [ ] Vérifier que les boutons debug sont masqués
- [ ] Tester le chemin principal avec une facture réelle
- [ ] Vérifier les métriques et logs
- [ ] Surveiller pendant 24h

**Scénarios de validation** :
- [ ] Post facture réelle → `vaulted` en < 15s
- [ ] Vérifier métriques Prometheus
- [ ] Vérifier logs structurés
- [ ] Vérifier que les filets de sécurité fonctionnent

**Critères d'acceptation** :
- ✅ Boutons debug masqués
- ✅ Latence < 15s (p50)
- ✅ Métriques correctes
- ✅ Logs structurés corrects
- ✅ Aucun incident pendant 24h

**Livrable** : Rapport de validation production

---

## 📊 Récapitulatif

### Progression Globale

| Phase | Statut | Durée | Priorité |
|-------|--------|-------|----------|
| **Phase 1** : Tests Fonctionnels | 🟡 **À réaliser** | 2-3h | 🔴 Haute |
| **Phase 2** : Déploiement Staging | 🟡 **À planifier** | 2-3h | 🔴 Haute |
| **Phase 3** : Documentation Runbooks | 🟡 **À réaliser** | 30min | 🟡 Moyenne |
| **Phase 4** : Déploiement Production | 🟡 **À planifier** | 2-3h | 🔴 Haute |
| **Total** | - | **7-10h** | - |

### Checklist Finale

Avant passage en production :

- [ ] Tests fonctionnels passés (Phase 1)
- [ ] Validation staging réussie (Phase 2)
- [ ] Documentation runbooks complétée (Phase 3)
- [ ] Déploiement production validé (Phase 4)
- [ ] Paramètres système configurés (flag PROD, seuils)
- [ ] CRON reconciler actif
- [ ] DVIG scheduler actif
- [ ] Métriques et logs vérifiés
- [ ] Surveillance 24h sans incident

---

## 🔗 Références

- **SPEC v1.1.1** : `ZeDocs/TestV3/SPEC_ORCHESTRATION_TEMPS_REEL_QUEUE_JOB_Odoo_DVIG_Vault_v1.1.1.md`
- **Rapport implémentation v1.1.0** : `ZeDocs/TestV3/RAPPORT_IMPLEMENTATION_v1.1.0.md`
- **Implémentation recommandations** : `ZeDocs/TestV3/IMPLEMENTATION_RECOMMANDATIONS_ARCHITECTURE_v1.1.0.md`
- **Implémentation addendum** : `ZeDocs/TestV3/IMPLEMENTATION_ADDENDUM_NO_HUMAN_IN_THE_LOOP_v1.1.1-add1.md`
- **Plan prochaines étapes** : `ZeDocs/TestV3/PLAN_PROCHAINES_ETAPES_v1.1.1-add1.md`

---

## 📝 Notes

### Ordre de Priorité Recommandé

1. **Phase 1** : Tests fonctionnels (validation avant déploiement)
2. **Phase 2** : Déploiement staging (validation en environnement réel)
3. **Phase 3** : Documentation runbooks (compléter la conformité)
4. **Phase 4** : Déploiement production (après validation staging)

### Risques Identifiés

- **Risque 1** : Tests fonctionnels non exhaustifs
  - **Mitigation** : Suivre scrupuleusement la SPEC v1.1.1 section 11

- **Risque 2** : Configuration incorrecte en production
  - **Mitigation** : Checklist de pré-déploiement stricte

- **Risque 3** : Performance dégradée en production
  - **Mitigation** : Surveillance métriques pendant 24h

---

**Date de création** : 2026-01-12  
**Version** : 1.0  
**Statut** : 📋 Plan d'action recommandé
