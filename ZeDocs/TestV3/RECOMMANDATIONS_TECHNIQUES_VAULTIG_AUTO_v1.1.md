# 📌 Recommandations Techniques — Dorevia Vaulting Auto v1.1

**Auteur** : Dorevia Team  
**Date** : 2026-01-11  
**Version** : 1.0  
**Basé sur** : `PLAN_IMPLEMENTATION_VAULTIG_AUTO_v1.1_SCRUM.md`

---

## 🎯 Objectif

Ce document formalise les recommandations techniques validées suite à la revue du plan Scrum de la SPEC v1.1.

---

## 1️⃣ Idempotence

### Décision

La clé d'idempotence officielle est :

```
SHA256(source + model + record_id + event_type + posted_at)
```

### Justification

- ✅ Stable
- ✅ Déterministe
- ✅ Auditable
- ✅ Traçable juridiquement
- ✅ Compatible multi-ERP

### Recommandations

- ✅ Calcul lors de `action_post()`
- ✅ Stockage en base
- ✅ Index unique recommandé
- ✅ Revalidation avant chaque envoi DVIG

---

## 2️⃣ Identifiants DVIG

### Recommandation

Créer un index UNIQUE sur :

```
dorevia_dvig_event_id
```

### Objectif

- ✅ Garantir l'unicité cross-système
- ✅ Éviter doublons DVIG
- ✅ Sécurité anti-replay

---

## 3️⃣ Machine d'état

Statuts validés :

```
todo
pending_proof
vaulted
failed_soft
failed_hard
```

### Règles

| Statut | Retry | Action |
|-------|-------|--------|
| todo | Oui | CRON #1 |
| pending_proof | Oui | CRON #2 |
| failed_soft | Oui | Backoff |
| failed_hard | Non | Blocage |
| vaulted | Non | Final |

> **Option future** : ajouter `dead_letter` (P1)

---

## 4️⃣ CRON #1 — Envoi DVIG

### Règles

- ✅ Batch max : 50
- ✅ Sélection :
  - `status IN (todo, failed_soft)`
  - `next_retry <= now()`
- ✅ Vérification idempotence obligatoire

---

## 5️⃣ CRON #2 — Récupération preuve

### Endpoint recommandé

```
/api/v1/proof/{dorevia_dvig_event_id}
```

### Justification

- ✅ Découplage Odoo ↔ Vault
- ✅ Event-based
- ✅ Pas dépendant ID Odoo
- ✅ Compatible futur ERP

---

## 6️⃣ Backoff

Formule validée :

```
next_retry = now() + min(2 ** attempt * 60, 3600)
```

| Tentative | Délai |
|-----------|-------|
| 1 | 2 min |
| 2 | 4 min |
| 3 | 8 min |
| 4 | 16 min |
| 5+ | 60 min |

---

## 7️⃣ Observabilité

Métriques minimales v1.1 :

- ✅ `total_sent`
- ✅ `success`
- ✅ `failed_soft`
- ✅ `failed_hard`
- ✅ `backlog`

> **P1** : latency, age queue, alerting

---

## 8️⃣ Sécurité

Validé :

- ✅ JWS obligatoire
- ✅ Horodatage Vault
- ✅ Anti-replay par idempotency_key
- ✅ Rotation clés DVIG

---

## 9️⃣ Gouvernance

Recommandé :

- ✅ Ajouter `schema_version` dans payload
- ✅ Compatibilité ascendante obligatoire
- ✅ Dépréciation versionnée

---

## 🔥 Conclusion

Le plan v1.1 est :

- ✅ Robuste
- ✅ Production-ready
- ✅ Auditable
- ✅ Conforme NF525-like

➡️ **Sprint 1 peut démarrer sans blocage.**

---

**Document validé pour commit Git.**
