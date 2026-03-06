# 📋 Plan Prochaines Étapes — Addendum "No Human In The Loop" v1.1.1-add1

**Date** : 2026-01-12  
**Statut** : ✅ **IMPLÉMENTATION TERMINÉE** — Prochaines étapes recommandées

---

## 🎯 Résumé

L'implémentation de l'addendum est **complète**. Voici les prochaines étapes pour finaliser et valider la solution avant production.

---

## ✅ État Actuel

### Implémenté
- ✅ Flag PROD pour boutons debug
- ✅ CRON Reconciler léger
- ✅ Seuils d'abandon (MAX_ATTEMPTS + MAX_AGE)
- ✅ Identity_key queue_job
- ✅ Code compilé sans erreur

### Restant
- 📝 Documentation FORB-2 (interdiction SQL/curl)
- 🧪 Tests fonctionnels
- 📝 Mise à jour SPEC v1.1.1
- 🚀 Déploiement et validation

---

## 📋 Prochaines Étapes Recommandées

### 1️⃣ Documentation FORB-2 (Priorité : 🟡 Moyenne)

**Objectif** : Documenter l'interdiction des scripts SQL/curl pour corriger les factures dans les runbooks.

**Actions** :
- [ ] Mettre à jour `sources/dvig/docs/RUNBOOK_PRODUCTION.md`
  - Ajouter section "Interdictions explicites"
  - Documenter que les corrections manuelles de factures sont interdites
  - Lister les procédures autorisées uniquement (redémarrage, vérification métriques, rotation token, consultation logs)
  
- [ ] Mettre à jour les autres runbooks Odoo si existants
  - `ZeDocs/TestV1/RUNBOOK_*.md` (si applicable)

**Livrable** : Runbooks mis à jour avec interdictions explicites

**Temps estimé** : 30 minutes

---

### 2️⃣ Tests Fonctionnels (Priorité : 🔴 Haute)

**Objectif** : Valider que toutes les nouvelles fonctionnalités fonctionnent correctement.

**Scénarios à tester** :

#### 2.1 Flag PROD (boutons debug)
- [ ] **Test 1** : Vérifier que les boutons sont masqués si `dorevia.debug.actions = 0`
- [ ] **Test 2** : Vérifier que les boutons sont visibles si `dorevia.debug.actions = 1`
- [ ] **Test 3** : Vérifier que l'utilisation en PROD (flag=0) génère une erreur avec message clair
- [ ] **Test 4** : Vérifier que l'utilisation en DEV (flag=1) fonctionne normalement

#### 2.2 CRON Reconciler
- [ ] **Test 1** : Créer une facture `pending_proof` et attendre 3 minutes → vérifier que le CRON l'a traitée
- [ ] **Test 2** : Vérifier que le CRON respecte la limite de 50 factures
- [ ] **Test 3** : Vérifier que le CRON applique l'anti-duplication (`_can_enqueue_proof()`)
- [ ] **Test 4** : Vérifier que le CRON utilise `identity_key` pour éviter les doublons

#### 2.3 Seuils d'abandon
- [ ] **Test 1** : Simuler 20 tentatives → vérifier transition vers `failed_hard`
- [ ] **Test 2** : Simuler facture bloquée 24h → vérifier transition vers `failed_hard`
- [ ] **Test 3** : Vérifier que le logging structuré est correct (incident_type, reason, etc.)
- [ ] **Test 4** : Vérifier que les métriques sont incrémentées (si module métriques disponible)

#### 2.4 Identity_key queue_job
- [ ] **Test 1** : Enqueue 2 jobs `fetch_proof` identiques simultanément → vérifier qu'un seul est créé
- [ ] **Test 2** : Enqueue 2 jobs `trigger_worker` identiques simultanément → vérifier qu'un seul est créé
- [ ] **Test 3** : Vérifier que les `identity_key` sont correctement formatés (`proof:{db}:{id}`, `dvig_trigger:{db}:{tenant}`)

**Livrable** : Rapport de tests avec résultats

**Temps estimé** : 2-3 heures

---

### 3️⃣ Mise à Jour SPEC v1.1.1 (Priorité : 🟡 Moyenne)

**Objectif** : Intégrer l'addendum dans la SPEC principale.

**Actions** :
- [ ] Créer `ZeDocs/TestV3/SPEC_ORCHESTRATION_TEMPS_REEL_QUEUE_JOB_Odoo_DVIG_Vault_v1.1.1.md`
  - Copier la SPEC v1.1.0
  - Ajouter section "Invariants & Ops" avec :
    - INV-1 : Zéro intervention humaine
    - INV-2 : Idempotence bout-en-bout
    - INV-3 : Auto-récupération
    - INV-4 : Anti-duplication
  - Ajouter section "Interdictions explicites (PROD)" :
    - FORB-1 : Boutons d'action manuelle
    - FORB-2 : Scripts SQL/curl
  - Ajouter section "Seuils d'abandon" :
    - MAX_ATTEMPTS_PROOF
    - MAX_AGE_PENDING_PROOF
    - Transition automatique vers `failed_hard`
  - Ajouter section "Filets de sécurité" :
    - Filet #1 : DVIG Scheduler
    - Filet #2 : CRON Reconciler

**Livrable** : SPEC v1.1.1 complète

**Temps estimé** : 1 heure

---

### 4️⃣ Déploiement et Validation (Priorité : 🔴 Haute)

**Objectif** : Déployer et valider en environnement de test/staging.

**Actions** :
- [ ] **Pré-déploiement** :
  - [ ] Vérifier que tous les tests fonctionnels passent
  - [ ] Vérifier que le code compile sans erreur
  - [ ] Vérifier que la documentation est à jour

- [ ] **Déploiement** :
  - [ ] Mettre à jour le module Odoo (`dorevia_vault_connector`)
  - [ ] Mettre à jour DVIG (si nécessaire)
  - [ ] Configurer les paramètres système :
    - `dorevia.debug.actions = 0` (PROD)
    - `dorevia.vault.max_attempts_proof = 20`
    - `dorevia.vault.max_age_pending_proof_hours = 24`
  - [ ] Vérifier que le CRON reconciler est actif

- [ ] **Validation** :
  - [ ] Tester le chemin principal (queue_job temps réel)
  - [ ] Tester le filet #1 (DVIG Scheduler)
  - [ ] Tester le filet #2 (CRON Reconciler)
  - [ ] Tester les seuils d'abandon
  - [ ] Vérifier que les boutons debug sont masqués en PROD
  - [ ] Vérifier les métriques et logs

**Livrable** : Environnement validé et prêt pour production

**Temps estimé** : 2-3 heures

---

## 🎯 Ordre de Priorité Recommandé

1. **🔴 Tests fonctionnels** (2-3h) — Validation critique avant déploiement
2. **🔴 Déploiement et validation** (2-3h) — Validation en environnement réel
3. **🟡 Documentation FORB-2** (30min) — Compléter la conformité
4. **🟡 Mise à jour SPEC v1.1.1** (1h) — Documentation finale

**Total estimé** : 5-7 heures

---

## 📝 Checklist Finale

Avant passage en production :

- [ ] Tests fonctionnels passés
- [ ] Documentation FORB-2 complétée
- [ ] SPEC v1.1.1 créée
- [ ] Déploiement validé en staging
- [ ] Paramètres système configurés (flag PROD, seuils)
- [ ] CRON reconciler actif
- [ ] Métriques et logs vérifiés
- [ ] Runbooks mis à jour

---

## 🔗 Références

- **Implémentation** : `ZeDocs/TestV3/IMPLEMENTATION_ADDENDUM_NO_HUMAN_IN_THE_LOOP_v1.1.1-add1.md`
- **Évaluation** : `ZeDocs/TestV3/EVALUATION_ADDENDUM_NO_HUMAN_IN_THE_LOOP_v1.1.1-add1.md`
- **Runbook DVIG** : `sources/dvig/docs/RUNBOOK_PRODUCTION.md`

---

**Date de création** : 2026-01-12  
**Statut** : 📋 Plan d'action recommandé
