# ⏱️ Pourquoi le Vaulting Prend 5-10 Minutes ?

**Date** : 2026-01-11  
**Question** : Pourquoi le vaulting automatique prend-il 5-10 minutes au lieu d'être immédiat ?

---

## 🎯 Raisons de l'Architecture Asynchrone

### 1. **Performance Utilisateur** ⚡

**Problème résolu** : Éviter de bloquer l'utilisateur lors de la validation de facture

- **Avant (synchrone)** : L'utilisateur clique sur "Valider" → Attente 2-5 secondes pour l'appel réseau DVIG/Vault → Facture validée
- **Maintenant (asynchrone)** : L'utilisateur clique sur "Valider" → Facture validée **immédiatement** (< 100ms) → Vaulting en arrière-plan

**Bénéfice** : L'interface Odoo reste **réactive** même si DVIG ou Vault est lent ou indisponible.

---

### 2. **Résilience** 🛡️

**Problème résolu** : Gérer les pannes temporaires sans impact utilisateur

- Si DVIG est **indisponible** : La facture reste en `todo`, le CRON réessayera automatiquement
- Si Vault est **indisponible** : La facture passe en `pending_proof`, le CRON réessayera automatiquement
- **Backoff exponentiel** : Retry intelligent avec délais progressifs (1 min, 2 min, 4 min, 8 min, 16 min, 60 min max)

**Bénéfice** : Le système **continue de fonctionner** même en cas de panne temporaire.

---

### 3. **Batch Processing** 📦

**Problème résolu** : Optimiser les appels réseau

- Le CRON traite **50 factures à la fois** (batch)
- Évite de surcharger DVIG/Vault avec des milliers d'appels individuels
- Réduit la charge réseau et améliore les performances globales

**Bénéfice** : **Meilleure scalabilité** pour les environnements avec beaucoup de factures.

---

### 4. **Séparation des Responsabilités** 🏗️

**Problème résolu** : Découpler Odoo de DVIG/Vault

```
Odoo (Validation) → CRON (Orchestration) → DVIG (Gateway) → Vault (Stockage)
```

- **Odoo** : Se contente de valider la facture (métier)
- **CRON** : Gère le vaulting (infrastructure)
- **DVIG** : Centralise l'ingestion (architecture)
- **Vault** : Stocke les documents (persistance)

**Bénéfice** : **Architecture modulaire** et maintenable.

---

## ⏱️ Délai de 5 Minutes : Pourquoi ?

### Configuration Actuelle

```xml
<field name="interval_number">5</field>
<field name="interval_type">minutes</field>
```

**CRON #1** (Envoi DVIG) : Toutes les **5 minutes**  
**CRON #2** (Récupération preuve) : Toutes les **5 minutes**

### Pourquoi 5 Minutes ?

1. **Compromis performance/rapidité** :
   - Trop court (1 min) : Surcharge inutile si peu de factures
   - Trop long (15 min) : Délai trop important pour l'utilisateur
   - **5 min** : Bon compromis pour la plupart des cas d'usage

2. **Charge réseau raisonnable** :
   - Évite de surcharger DVIG/Vault avec des appels trop fréquents
   - Permet le traitement par batch (50 factures max)

3. **Standard industriel** :
   - Beaucoup de systèmes asynchrones utilisent des intervalles de 5 minutes
   - Facilite la maintenance et le monitoring

---

## 🚀 Solutions pour Accélérer (Tests)

### Option 1 : Réduire l'Intervalle du CRON (Temporaire)

**Pour les tests uniquement**, on peut réduire l'intervalle à **1 minute** :

```xml
<field name="interval_number">1</field>
<field name="interval_type">minutes</field>
```

**Délai** : 1-2 minutes au lieu de 5-10 minutes

⚠️ **Attention** : À remettre à 5 minutes après les tests pour éviter la surcharge en production.

---

### Option 2 : Vaulting Immédiat (Mode Debug)

Pour les tests, on peut ajouter un **bouton "Vault Maintenant"** qui déclenche le vaulting immédiatement :

```python
def action_vault_now(self):
    """Vaulting immédiat pour les tests"""
    for move in self:
        if move.state == 'posted':
            move._vault_to_dvig(move)
            # Attendre quelques secondes
            time.sleep(2)
            move._fetch_vault_proof(move)
```

**Délai** : **Quelques secondes** (synchrone)

---

### Option 3 : Webhook/Queue (Futur)

Pour une solution plus élégante, on pourrait utiliser :
- **Webhook** : Odoo notifie DVIG immédiatement après validation
- **Queue** : Message queue (RabbitMQ, Redis) pour traitement immédiat

**Délai** : **Quelques secondes** (quasi-synchrone)

---

## 📊 Comparaison : Synchrone vs Asynchrone

| Critère | Synchrone | Asynchrone (5 min) |
|---------|-----------|-------------------|
| **Délai utilisateur** | 2-5 secondes | < 100ms |
| **Résilience** | ❌ Bloque si DVIG/Vault down | ✅ Continue de fonctionner |
| **Scalabilité** | ❌ Limite le débit | ✅ Batch processing |
| **Expérience utilisateur** | ⚠️ Attente visible | ✅ Transparent |
| **Complexité** | ✅ Simple | ⚠️ Plus complexe |

---

## ✅ Conclusion

Le délai de **5-10 minutes** est un **choix architectural** pour :
1. ✅ **Performance** : Interface Odoo reste réactive
2. ✅ **Résilience** : Gestion automatique des pannes
3. ✅ **Scalabilité** : Traitement par batch
4. ✅ **Maintenabilité** : Séparation des responsabilités

**Pour les tests**, on peut réduire l'intervalle à **1 minute** ou utiliser un **vaulting manuel immédiat**.

---

## 🔧 Recommandation

**En production** : Garder **5 minutes** (bon compromis)  
**En test/développement** : Réduire à **1 minute** pour accélérer les tests

Souhaitez-vous que je réduise l'intervalle du CRON à 1 minute pour accélérer les tests ?
