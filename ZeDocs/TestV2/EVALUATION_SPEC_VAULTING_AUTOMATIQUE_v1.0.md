# 📊 Évaluation - SPEC Vaulting Automatique Dorevia v1.0

**Date** : 2026-01-11  
**Évaluateur** : Dorevia Team 
**Statut** : Analyse complète

---

## 🎯 Résumé Exécutif

La spécification proposée représente une **évolution majeure** vers une architecture **production-ready** et **scalable**. Elle corrige les limitations de l'implémentation actuelle et aligne le système avec les meilleures pratiques d'architecture asynchrone.

**Verdict** : ✅ **Spécification excellente, alignée avec les bonnes pratiques**

---

## 📋 Comparaison État Actuel vs Vision Cible

### 1. Architecture Asynchrone

| Aspect | État Actuel | Vision Cible | Évaluation |
|--------|-------------|--------------|------------|
| **Vaulting** | Synchrone dans `action_post()` | 100% asynchrone (cron) | ✅ **Amélioration majeure** |
| **Récupération preuve** | `time.sleep(2)` dans thread utilisateur | Cron séparé | ✅ **Correction critique** |
| **Blocage utilisateur** | Potentiel (timeout DVIG) | Aucun | ✅ **UX améliorée** |

**Analyse** :
- L'état actuel fait un appel synchrone dans `action_post()`, ce qui peut bloquer l'utilisateur si DVIG est lent ou down
- La vision cible élimine complètement ce risque avec une architecture 100% asynchrone
- **Recommandation** : ✅ **Adopter la vision cible**

---

### 2. Machine d'État

| Aspect | État Actuel | Vision Cible | Évaluation |
|--------|-------------|--------------|------------|
| **Statut** | Boolean `dorevia_vaulted` | Machine d'état (todo, pending_proof, vaulted, failed_soft, failed_hard) | ✅ **Amélioration significative** |
| **Traçabilité** | Limitée | Complète (last_try, attempt_count, last_error) | ✅ **Observabilité améliorée** |
| **Gestion erreurs** | Basique | Sophistiquée (retry avec backoff) | ✅ **Robustesse améliorée** |

**Analyse** :
- L'état actuel ne permet pas de distinguer "en cours de traitement" de "échec temporaire"
- La machine d'état permet un suivi précis et une récupération automatique
- **Recommandation** : ✅ **Adopter la machine d'état**

---

### 3. Idempotence

| Aspect | État Actuel | Vision Cible | Évaluation |
|--------|-------------|--------------|------------|
| **Clé logique** | Aucune | `(source + model + record_id + event_type + posted_at)` | ✅ **Nouvelle fonctionnalité** |
| **Protection doublons** | Basique (vérifie `dorevia_vaulted`) | Robuste (clé logique) | ✅ **Sécurité améliorée** |

**Analyse** :
- L'état actuel peut envoyer deux fois si le cron et `action_post()` s'exécutent en parallèle
- La clé logique garantit l'idempotence même en cas de race condition
- **Recommandation** : ✅ **Implémenter la clé logique**

---

### 4. CRON Jobs

| Aspect | État Actuel | Vision Cible | Évaluation |
|--------|-------------|--------------|------------|
| **Nombre** | 1 cron (15 min) | 2 crons (5 min chacun) | ✅ **Séparation des responsabilités** |
| **CRON #1** | Envoi + récupération | Envoi uniquement | ✅ **Clarté** |
| **CRON #2** | N/A | Récupération preuve uniquement | ✅ **Nouvelle fonctionnalité** |
| **Batch** | 50 max | 50 max | ✅ **Cohérent** |

**Analyse** :
- La séparation en 2 crons permet une meilleure scalabilité et observabilité
- La fréquence de 5 min est plus réactive que 15 min
- **Recommandation** : ✅ **Adopter 2 crons séparés**

---

### 5. Gestion des Erreurs

| Aspect | État Actuel | Vision Cible | Évaluation |
|--------|-------------|--------------|------------|
| **Retry** | Cron simple | Backoff exponentiel | ✅ **Efficacité améliorée** |
| **Classification** | Aucune | failed_soft vs failed_hard | ✅ **Intelligence** |
| **Next retry** | Immédiat | Calculé (backoff) | ✅ **Évite surcharge** |

**Analyse** :
- Le backoff exponentiel évite de surcharger DVIG/Vault en cas de panne
- La distinction soft/hard permet de ne pas retenter indéfiniment les erreurs définitives
- **Recommandation** : ✅ **Implémenter backoff + classification**

---

### 6. Interface Utilisateur

| Aspect | État Actuel | Vision Cible | Évaluation |
|--------|-------------|--------------|------------|
| **Boutons** | `action_vault`, `action_refresh_vault_info` | Aucun bouton | ⚠️ **Débat UX** |
| **Bloc informatif** | Présent | Présent (amélioré) | ✅ **Cohérent** |
| **Visibilité** | Onglet "Autres informations" | Onglet "Autres informations" | ✅ **Cohérent** |

**Analyse** :
- **Point de débat** : Les boutons manuels peuvent être utiles pour le debug/admin
- **Compromis possible** : Garder les boutons mais les masquer par défaut (mode debug uniquement)
- **Recommandation** : ⚠️ **Conserver boutons en mode debug uniquement**

---

## ✅ Points Forts de la Spécification

### 1. Architecture Solide
- ✅ Séparation claire des responsabilités (envoi vs récupération)
- ✅ Asynchrone by design (pas de blocage utilisateur)
- ✅ Idempotence garantie

### 2. Observabilité
- ✅ Métriques claires (taux succès, backlog)
- ✅ Alertes définies
- ✅ Traçabilité complète

### 3. Robustesse
- ✅ Gestion d'erreurs sophistiquée
- ✅ Retry intelligent (backoff)
- ✅ Classification erreurs (soft/hard)

### 4. Scalabilité
- ✅ Batch processing (50 max)
- ✅ Fréquence adaptative (5 min)
- ✅ Architecture multi-tenant ready

### 5. Philosophie Produit
- ✅ "Couche de sécurité invisible" (excellente vision)
- ✅ UX clean (pas de complexité exposée)
- ✅ Conformité by design

---

## ⚠️ Points d'Attention / Améliorations Suggérées

### 1. Champs Odoo à Ajouter

**Spécification propose** :
```python
dorevia_vault_status          # Char (todo, pending_proof, vaulted, failed_soft, failed_hard)
dorevia_vault_last_try_at     # Datetime
dorevia_vault_attempt_count   # Integer
dorevia_vault_last_error      # Text
dorevia_dvig_event_id         # Char (UUID)
dorevia_vault_next_retry_at   # Datetime (pour backoff)
```

**État actuel** : Ces champs n'existent pas encore

**Recommandation** : ✅ **Ajouter tous ces champs**

---

### 2. Clé Logique pour Idempotence

**Spécification propose** :
```
(source + model + record_id + event_type + posted_at)
```

**Question** : Où stocker cette clé ?
- Option A : Champ dédié `dorevia_vault_idempotency_key`
- Option B : Calculer à la volée (risque de divergence)
- Option C : Utiliser `dorevia_dvig_event_id` comme clé (si DVIG garantit l'unicité)

**Recommandation** : ⚠️ **Clarifier avec DVIG si `event_id` est unique et idempotent**

---

### 3. Backoff Exponentiel

**Spécification** : Mentionne "calcul backoff" mais pas de formule

**Suggestion** :
```python
next_retry_at = now() + (2 ** attempt_count) * 60  # secondes
# Exemples :
# attempt 1: +2 min
# attempt 2: +4 min
# attempt 3: +8 min
# attempt 4: +16 min
# Max: +60 min (plafond)
```

**Recommandation** : ✅ **Définir formule précise dans la spec**

---

### 4. Classification Erreurs (failed_soft vs failed_hard)

**Spécification** : Mentionne la distinction mais pas les critères

**Suggestion** :
- **failed_soft** : Erreurs temporaires (timeout, 503, 502, connexion)
- **failed_hard** : Erreurs définitives (401, 403, 400 validation, 404 si document n'existe pas)

**Recommandation** : ✅ **Définir règles de classification précises**

---

### 5. Observabilité - Métriques

**Spécification** : Mentionne métriques mais pas d'implémentation

**Suggestion** :
- Utiliser `ir.config_parameter` pour stocker compteurs
- Ou créer un modèle `dorevia_vault_metrics` pour historique
- Ou utiliser les logs Odoo + parsing externe

**Recommandation** : ⚠️ **Définir méthode de collecte métriques**

---

### 6. Compatibilité avec Implémentation Actuelle

**Migration nécessaire** :
- Migrer `dorevia_vaulted=True` → `dorevia_vault_status='vaulted'`
- Initialiser `dorevia_vault_status='todo'` pour factures posted non vaultées
- Supprimer boutons manuels (ou les masquer)

**Recommandation** : ✅ **Créer script de migration**

---

## 📊 Matrice de Décision

| Critère | Poids | État Actuel | Vision Cible | Gain |
|---------|------|-------------|--------------|------|
| **UX (non-bloquant)** | ⭐⭐⭐⭐⭐ | 3/5 | 5/5 | +2 |
| **Robustesse** | ⭐⭐⭐⭐⭐ | 2/5 | 5/5 | +3 |
| **Observabilité** | ⭐⭐⭐⭐ | 2/5 | 5/5 | +3 |
| **Scalabilité** | ⭐⭐⭐⭐ | 3/5 | 5/5 | +2 |
| **Maintenabilité** | ⭐⭐⭐ | 3/5 | 5/5 | +2 |
| **Conformité** | ⭐⭐⭐⭐⭐ | 4/5 | 5/5 | +1 |

**Score global** : État actuel **17/30** → Vision cible **30/30** (+13 points)

---

## 🎯 Recommandations Finales

### ✅ À Implémenter (Priorité Haute)

1. **Machine d'état** : Ajouter `dorevia_vault_status` et champs associés
2. **CRON #1** : Séparer envoi DVIG (toutes les 5 min)
3. **CRON #2** : Nouveau cron pour récupération preuve (toutes les 5 min)
4. **Backoff** : Implémenter retry avec backoff exponentiel
5. **Classification erreurs** : Distinguer failed_soft vs failed_hard

### ⚠️ À Clarifier (Priorité Moyenne)

1. **Clé idempotence** : Confirmer avec DVIG si `event_id` suffit
2. **Formule backoff** : Définir formule précise
3. **Règles classification** : Définir critères soft/hard
4. **Métriques** : Définir méthode de collecte

### 💡 Améliorations Suggérées (Priorité Basse)

1. **Boutons debug** : Conserver en mode debug uniquement
2. **Migration** : Script de migration état actuel → nouveau système
3. **Tests** : Tests unitaires pour machine d'état et backoff

---

## 📝 Conclusion

La spécification proposée est **excellente** et représente une **évolution naturelle et nécessaire** de l'implémentation actuelle. Elle corrige les limitations architecturales et aligne le système avec les meilleures pratiques.

**Recommandation finale** : ✅ **Adopter la spécification avec les clarifications suggérées**

**Effort estimé** : 
- Développement : 3-5 jours
- Tests : 1-2 jours
- Migration : 0.5 jour
- **Total** : ~1 semaine

**Risques** : Faibles (architecture éprouvée, changements incrémentaux)

**Bénéfices** : Très élevés (robustesse, scalabilité, observabilité)

---

## 🔗 Références

- Code actuel : `units/odoo/custom-addons/dorevia_vault_connector/`
- SPEC actuelle : SPEC 1 (vaulting account_move)
- Vision cible : SPEC Vaulting Automatique v1.0 (ce document)
