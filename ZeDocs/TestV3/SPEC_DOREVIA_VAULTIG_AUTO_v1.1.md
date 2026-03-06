
# 📜 SPEC — Dorevia Vaulting Automatique v1.1

**Version** : 1.1  
**Date** : 2026-01-11  
**Statut** : Validée (post review Dorevia Team)

---

## 🎯 Objectif

Mettre en place un système de **vaulting automatique, asynchrone, robuste et observable** pour les documents comptables (factures), sans intervention utilisateur.

Philosophie :  
> *La sécurité doit être invisible pour l’utilisateur.*

---

## 🧱 Principes d’Architecture

- ❌ Aucun appel réseau dans `action_post()`
- ✅ 100% asynchrone via CRON
- ✅ Séparation des responsabilités
- ✅ Idempotence garantie
- ✅ Observabilité native
- ✅ Compatible multi-tenant

---

## 🔄 Machine d’état

Champ principal :

```
dorevia_vault_status (Char)
- todo
- pending_proof
- vaulted
- failed_soft
- failed_hard
```

Champs associés :

| Champ | Type |
|--------|------|
| dorevia_vault_last_try_at | Datetime |
| dorevia_vault_attempt_count | Integer |
| dorevia_vault_last_error | Text |
| dorevia_vault_next_retry_at | Datetime |
| dorevia_dvig_event_id | Char |
| dorevia_vault_idempotency_key | Char |

---

## 🔐 Idempotence

Clé logique stockée côté Odoo :

```
SHA256(
  source +
  model +
  record_id +
  event_type +
  posted_at
)
```

➡️ Stockée dans :
`dorevia_vault_idempotency_key`

Garantit :
- pas de doublon
- protection contre race conditions
- indépendance vis-à-vis de DVIG

---

## ⏱️ CRON Jobs

### CRON #1 — Envoi DVIG

- Fréquence : toutes les 5 minutes
- Sélection :
  - status = todo | failed_soft
  - next_retry_at <= now()
- Batch : 50 max

Actions :
1. Construction payload
2. Envoi DVIG
3. Succès :
   - status = pending_proof
   - stocke event_id
4. Échec :
   - classification erreur
   - backoff

---

### CRON #2 — Récupération preuve

- Fréquence : toutes les 5 minutes
- Sélection :
  - status = pending_proof
- Batch : 50

Actions :
1. Appel Vault
2. Si preuve OK :
   - status = vaulted
   - stockage :
     - vault_id
     - sha256
     - jws
     - ledger_hash
3. Si erreur :
   - soft → retry
   - hard → failed_hard

---

## 🔁 Backoff exponentiel

Formule officielle :

```
next_retry = now() + min(2 ** attempt_count * 60, 3600)
```

| Tentative | Délai |
|------------|-------|
| 1 | 2 min |
| 2 | 4 min |
| 3 | 8 min |
| 4 | 16 min |
| 5+ | 60 min (plafond) |

---

## 🚨 Classification erreurs

### failed_soft
- timeout
- 502
- 503
- erreur réseau

### failed_hard
- 400 (payload invalide)
- 401 (auth)
- 403 (forbidden)
- 404 (document inexistant)

---

## 📊 Observabilité

Modèle : `dorevia.vault.metric`

Champs :
- date
- total_sent
- success
- failed_soft
- failed_hard
- backlog

Alimentation :
- via CRON

Objectifs :
- dashboard
- SLA
- billing futur

---

## 🧩 Interface Utilisateur

- ❌ Aucun bouton utilisateur
- ℹ️ Bloc informatif :
  - statut
  - date vault
  - hash
  - preuve

Mode debug :
- boutons visibles uniquement pour admins

---

## 🔄 Migration

Script obligatoire :

1. dorevia_vaulted=True → status=vaulted
2. Factures posted non vaultées → status=todo
3. Suppression boutons manuels

---

## 📌 Roadmap technique

- Ajout champs
- Implémentation CRON #1
- Implémentation CRON #2
- Backoff
- Metrics
- Migration

---

## 🏁 Conclusion

Cette v1.1 formalise une architecture :

- robuste
- scalable
- industrialisable
- prête audit / conformité

➡️ Système **production-grade**.

---

**Auteur** : Dorevia AMOA  
**Licence** : AGPL
