# 📊 Évaluation : Recommandations d'Architecture v1.1.0

**Date** : 2026-01-12  
**Évaluateur** : Analyse technique des recommandations  
**Statut** : ✅ **ÉVALUÉ** - Implémentation recommandée pour les points critiques

---

## 🎯 Résumé Exécutif

Les recommandations sont **excellentes** et visent à durcir la solution avant la production.  
**Verdict** : ✅ **IMPLÉMENTER** les points 1, 2, 3, 4 (critiques)  
**Reporter** : Points 5, 6, 7 (configuration/documentation)

---

## 📋 Évaluation Détaillée

### 1️⃣ Anti-duplication des jobs Proof

**Pertinence** : 🔴 **CRITIQUE**  
**Faisabilité** : ✅ **FAISABLE**  
**Effort** : Faible (~30 lignes)

**Analyse** :
- ✅ **Problème réel** : Avec queue_job + scheduler + CRON, risque de jobs multiples pour une même facture
- ✅ **Solution proposée** : Vérification avant enqueue (statut + délai depuis dernière tentative)
- ✅ **Bénéfices** : Évite la tempête de jobs, protège le channel `dorevia_vault`

**Recommandation** : ✅ **IMPLÉMENTER IMMÉDIATEMENT**

**Amélioration proposée** :
- Utiliser aussi `identity_key` de queue_job pour éviter les doublons au niveau queue_job
- Vérifier les jobs en cours (state IN ('pending', 'enqueued', 'started'))

---

### 2️⃣ Backoff intelligent sur le fetch proof

**Pertinence** : 🟡 **IMPORTANT**  
**Faisabilité** : ✅ **FAISABLE**  
**Effort** : Moyen (~50 lignes)

**Analyse** :
- ✅ **Problème réel** : Retry fixe à 5s peut créer des rafales HTTP
- ✅ **Solution proposée** : Backoff progressif + jitter
- ✅ **Bénéfices** : Protège Vault, comportement cloud-native

**Recommandation** : ✅ **IMPLÉMENTER** (améliore la résilience)

**Amélioration proposée** :
- Utiliser `attempt_count` depuis queue_job si disponible
- Sinon, utiliser `dorevia_vault_attempt_count` depuis la facture

---

### 3️⃣ Normalisation stricte des source_ids DVIG

**Pertinence** : 🟡 **IMPORTANT**  
**Faisabilité** : ✅ **FAISABLE**  
**Effort** : Faible (~20 lignes)

**Analyse** :
- ✅ **Problème réel** : Formats variables (`account.move`, `account_move`, `move_id`)
- ✅ **Solution proposée** : Normalisation dans DVIG avant retour
- ✅ **Bénéfices** : Contrat clair, parsing robuste côté Odoo

**Recommandation** : ✅ **IMPLÉMENTER** (robustesse)

**Amélioration proposée** :
- Normaliser dans `outbox_worker.py` lors de l'extraction
- Tests unitaires pour valider les formats

---

### 4️⃣ Sécurité endpoint /internal

**Pertinence** : 🟡 **IMPORTANT**  
**Faisabilité** : ✅ **PARTIELLEMENT FAISABLE**  
**Effort** : Moyen (~30 lignes)

**Analyse** :
- ✅ **Déjà en place** : Token interne, comparaison constant-time
- ⚠️ **Amélioration** : Logging du hash du token (pas le token brut)
- ⚠️ **Limitation** : Contrôle réseau (Docker/IP) doit être fait au niveau infrastructure

**Recommandation** : ✅ **IMPLÉMENTER** (logging amélioré)  
**Reporter** : Contrôle réseau (infrastructure)

---

### 5️⃣ Dimensionnement workers Odoo

**Pertinence** : 🟢 **CONFIGURATION**  
**Faisabilité** : ✅ **CONFIGURATION UNIQUEMENT**  
**Effort** : Aucun (configuration)

**Analyse** :
- ✅ **Recommandation valide** : `workers = 4` pour production
- ⚠️ **Dépend du CPU** : À ajuster selon les ressources

**Recommandation** : 📝 **DOCUMENTER** dans le guide de déploiement

---

### 6️⃣ Invariants à documenter

**Pertinence** : 🟢 **DOCUMENTATION**  
**Faisabilité** : ✅ **DOCUMENTATION UNIQUEMENT**  
**Effort** : Faible (documentation)

**Analyse** :
- ✅ **Important pour audit** : Idempotence, garanties
- ✅ **Déjà implémenté** : UNIQUE(tenant, idempotency_key) dans DVIG et Vault

**Recommandation** : 📝 **DOCUMENTER** dans la SPEC v1.1.1

---

### 7️⃣ Scénarios de test recommandés

**Pertinence** : 🟢 **DOCUMENTATION**  
**Faisabilité** : ✅ **DOCUMENTATION UNIQUEMENT**  
**Effort** : Faible (documentation)

**Recommandation** : 📝 **DOCUMENTER** dans le guide de test

---

## 🎯 Plan d'Implémentation Recommandé

### Phase 1 : Critiques (À implémenter maintenant)

1. ✅ **Anti-duplication jobs Proof** (30 min)
   - Méthode `_can_enqueue_proof()`
   - Vérification avant enqueue dans `job_trigger_worker` et `action_refresh_vault_proof`
   - Utilisation de `identity_key` queue_job si disponible

2. ✅ **Backoff intelligent** (45 min)
   - Calcul du délai basé sur `attempt_count`
   - Tableau de délais progressifs
   - Ajout de jitter aléatoire

3. ✅ **Normalisation source_ids** (20 min)
   - Fonction `make_source_id()` dans DVIG
   - Normalisation dans `outbox_worker.py`

4. ✅ **Logging sécurité** (15 min)
   - Hash du token dans les logs (6 premiers caractères)
   - Ne jamais logger le token brut

**Total Phase 1** : ~2 heures

### Phase 2 : Documentation (À documenter)

5. 📝 **Dimensionnement workers** : Ajouter dans guide déploiement
6. 📝 **Invariants** : Ajouter dans SPEC v1.1.1
7. 📝 **Scénarios de test** : Ajouter dans guide test

---

## ✅ Décision

**Implémenter** : Points 1, 2, 3, 4 (critiques)  
**Documenter** : Points 5, 6, 7 (configuration/documentation)

**Priorité** : 🔴 **HAUTE** pour la production

---

## 📝 Notes Techniques

### Queue_job et Duplication

Queue_job ne prévient pas automatiquement les doublons. Il faut :
1. Vérifier manuellement avant enqueue (recommandation #1)
2. Utiliser `identity_key` si disponible (amélioration)

### Backoff et Attempt Count

Queue_job gère `attempt_count` automatiquement. On peut l'utiliser pour le backoff intelligent.

### Normalisation Source IDs

Format standardisé : `{model_normalized}:{record_id}`
- `account.move` → `account_move`
- `account_move` → `account_move` (déjà normalisé)
