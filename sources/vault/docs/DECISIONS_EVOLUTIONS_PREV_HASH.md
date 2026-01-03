# 📋 Décisions — Évolutions `prev_hash` pour dorevia_vault_report v3.0

**Date** : 2025-11-24  
**Statut** : ⏳ **En Attente de Décision**

---

## 🎯 Contexte

L'équipe Odoo a besoin de `prev_hash` pour la version 3.0 du module `dorevia_vault_report`. 

**Décision prise par Odoo** : Utiliser l'endpoint `/api/v1/ledger/export` pour la v3.0.

**Questions posées** :
1. Support bulk pour ledger/export ?
2. Format document_id ?
3. Planning Option B (prev_hash dans proof) ?

---

## 📊 État Actuel

### Endpoint Ledger Export

**URL** : `GET /api/v1/ledger/export`

**Paramètres actuels** :
- `format` : `json` ou `csv`
- `limit` : 1-10000 (défaut: 100)
- `offset` : Décalage (défaut: 0)

**Limitation** : ❌ **Ne supporte pas le filtrage par `document_id`**

**Impact** : Pour récupérer le `prev_hash` d'un document, il faut :
- Parcourir l'export complet du ledger
- Trouver l'entrée correspondante au `document_id`
- Extraire le `prev_hash`

**Performance** : ⚠️ **Non optimal** pour récupération individuelle

---

## 🔄 Options Disponibles

### Option A : Améliorer l'Endpoint Ledger Export

**Description** : Ajouter un paramètre optionnel `document_id` à `/api/v1/ledger/export`

**Format** :
```
GET /api/v1/ledger/export?document_id=<uuid>&format=json
```

**Réponse** :
```json
{
  "document_id": "uuid",
  "hash": "...",
  "prev_hash": "...",
  "timestamp": "..."
}
```

**Avantages** :
- ✅ Rétrocompatibilité (paramètre optionnel)
- ✅ Performance optimale (1 requête ciblée)
- ✅ Implémentation rapide (1h)

**Inconvénients** :
- ⚠️ Nécessite 1 appel API supplémentaire par document

**Temps d'implémentation** : ~1 heure

---

### Option B : Ajouter `prev_hash` dans Endpoints Proof

**Description** : Ajouter le champ `prev_hash` directement dans les réponses `/api/v1/proof/*`

**Format** :
```json
{
  "id": "uuid",
  "hash": "...",
  "ledger": "...",
  "prev_hash": "...",  // ← Nouveau champ
  "timestamp": "...",
  "jws": "...",
  "status": "verified"
}
```

**Avantages** :
- ✅ Toutes les informations en un seul appel
- ✅ Performance optimale (1 requête au lieu de 2)
- ✅ Format cohérent

**Inconvénients** :
- ⚠️ Légèrement plus lent (< 10ms supplémentaire par requête)
- ⚠️ Nécessite jointure avec table ledger

**Temps d'implémentation** : ~2 heures

---

### Option C : Endpoint Bulk Ledger

**Description** : Créer un endpoint dédié `/api/v1/ledger/bulk` pour récupérer plusieurs `prev_hash`

**Format** :
```
POST /api/v1/ledger/bulk
{
  "document_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Avantages** :
- ✅ Performance optimale pour bulk (1 appel pour N documents)
- ✅ Format cohérent avec `/api/v1/proof/bulk`

**Inconvénients** :
- ⚠️ Nouvel endpoint à maintenir
- ⚠️ Nécessite coordination avec endpoint proof/bulk

**Temps d'implémentation** : ~2 heures

---

## 📊 Comparaison des Options

| Critère | Option A | Option B | Option C |
|---------|----------|----------|----------|
| **Temps implémentation** | 1h | 2h | 2h |
| **Performance individuelle** | ⚠️ 2 appels | ✅ 1 appel | ⚠️ 2 appels |
| **Performance bulk** | ❌ N appels | ✅ N appels (1 chacun) | ✅ 1 appel |
| **Rétrocompatibilité** | ✅ Oui | ✅ Oui | ✅ Oui |
| **Complexité** | 🟢 Simple | 🟡 Moyenne | 🟡 Moyenne |
| **Utilité pour v3.0** | ✅ Bonne | ✅ Excellente | ✅ Excellente |

---

## 🎯 Recommandations

### Recommandation 1 : Option B (Priorité Haute)

**Pourquoi** :
- ✅ Résout le besoin immédiat de l'équipe Odoo
- ✅ Performance optimale (1 appel au lieu de 2)
- ✅ Format cohérent et complet
- ✅ Implémentation rapide (2h)

**Impact** : ✅ **Très positif** pour l'équipe Odoo

---

### Recommandation 2 : Option A (Priorité Moyenne)

**Pourquoi** :
- ✅ Améliore l'endpoint existant
- ✅ Utile même si Option B implémentée
- ✅ Implémentation très rapide (1h)

**Impact** : ✅ **Positif** comme complément

---

### Recommandation 3 : Option C (Priorité Basse)

**Pourquoi** :
- ✅ Utile pour optimiser les rapports volumineux
- ⚠️ Moins prioritaire si Option B implémentée
- ⚠️ Peut être ajouté plus tard si besoin

**Impact** : 🟡 **Utile mais non critique**

---

## ✅ Décision Proposée

### Scénario Recommandé : Option B + Option A

**Implémentation** :
1. ✅ **Option B** : Ajouter `prev_hash` dans endpoints proof (2h)
2. ✅ **Option A** : Améliorer ledger/export avec paramètre `document_id` (1h)

**Total** : 3 heures de développement

**Avantages** :
- ✅ Solution complète et optimale
- ✅ Rétrocompatibilité garantie
- ✅ Performance maximale
- ✅ Utile pour d'autres cas d'usage

**Déploiement** : Sprint 8 (version 1.6.1)

---

## 📅 Planning Proposé

### Si Option B + Option A

- **Développement** : 3 heures
- **Tests** : 1 heure
- **Documentation** : 30 minutes
- **Déploiement** : Immédiat (version 1.6.1)

**Disponibilité** : **Aujourd'hui ou demain**

---

## ⚠️ Alternative : Attendre Retour Odoo

**Si l'équipe Odoo préfère** :
- Utiliser l'endpoint ledger/export actuel avec cache
- Implémenter la v3.0 sans améliorations
- Évaluer les besoins après tests

**Alors** : Nous attendons leur retour avant d'implémenter.

---

## 📝 Statut

**En attente de** :
1. ⏳ Décision de l'équipe Odoo sur les améliorations souhaitées
2. ⏳ Validation de l'approche recommandée (Option B + Option A)

**Action immédiate** : Aucune (attendre retour Odoo)

**Action si validation** : Implémentation rapide (3h) et déploiement

---

**Document créé le** : 2025-11-24  
**Statut** : ⏳ **En Attente de Décision**

