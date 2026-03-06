# 🎯 Prochaines Étapes — DVIG → Vault Forwarding v1.1

**Date** : 2026-01-11  
**Statut** : ✅ **Odoo complété** — ⏳ **DVIG/Vault à implémenter**

---

## ✅ Ce qui est Fait

### Odoo (Complété)

- ✅ **Modification appliquée** : `idempotency_key` transmis dans payload DVIG
- ✅ **Module mis à jour** : Modification active dans `odoo_stinger_sarl-la-platine`
- ✅ **Tests validés** : 29/29 tests passent (100%)
- ✅ **Documentation** : 6 documents créés

### Documentation (Complétée)

- ✅ **SPEC corrigée** : `SPEC_DVIG_VAULT_FORWARDING_v1.1_CORRIGEE.md`
- ✅ **Analyse** : `ANALYSE_SPEC_DVIG_VAULT_FORWARDING_v1.1.md`
- ✅ **Plan Scrum** : `PLAN_IMPLEMENTATION_DVIG_VAULT_FORWARDING_v1.1_SCRUM.md`

---

## ⏳ Prochaines Étapes

### 1. Validation du Plan (Immédiat)

**Action** : Valider le plan d'implémentation avec les équipes DVIG et Vault

**Documents à partager** :
- `PLAN_IMPLEMENTATION_DVIG_VAULT_FORWARDING_v1.1_SCRUM.md`
- `SPEC_DVIG_VAULT_FORWARDING_v1.1_CORRIGEE.md`

**Points à valider** :
- ✅ Durée estimée (3-4 semaines)
- ✅ Répartition des points (Sprint A: 25, B: 15, C: 10)
- ✅ Priorités des User Stories
- ✅ Définition de "Fait" (DoD)

---

### 2. Création des Tickets (Après validation)

**Action** : Créer les tickets pour chaque User Story

**Sprint A** (Infrastructure DVIG) :
- [ ] US-A.1 : Migration base de données — Table outbox_events (5 points)
- [ ] US-A.2 : Modification endpoint `/ingest` — Acceptation idempotency_key (6 points)
- [ ] US-A.3 : Worker asynchrone — Sélection et traitement (6 points)
- [ ] US-A.4 : Backoff exponentiel — Calcul next_retry_at (4 points)
- [ ] US-A.5 : Classification erreurs — Soft vs Hard (4 points)

**Sprint B** (API Vault) :
- [ ] US-B.1 : Endpoint Vault `/api/v1/events` — Création (6 points)
- [ ] US-B.2 : Vérification idempotence Vault — UNIQUE(tenant, idempotency_key) (5 points)
- [ ] US-B.3 : Endpoint optionnel `/api/v1/proof/event/{event_id}` — Traçabilité (4 points)

**Sprint C** (Intégration End-to-End) :
- [ ] US-C.1 : Tests end-to-end — Odoo → DVIG → Vault (4 points)
- [ ] US-C.2 : Validation idempotence bout en bout (3 points)
- [ ] US-C.3 : Monitoring et observabilité — Métriques Prometheus (3 points)

---

### 3. Démarrage Sprint A (Après création tickets)

**Action** : Démarrer l'implémentation de l'infrastructure DVIG

**Priorité** : US-A.1 (Migration base de données)

**Fichiers à créer/modifier** :
- `sources/dvig/migrations/006_create_outbox_events.sql`
- `sources/dvig/models/outbox.py`
- `sources/dvig/storage/outbox.py`

---

## 📋 Checklist Pré-Démarrage

### Validation

- [ ] Plan validé par équipe DVIG
- [ ] Plan validé par équipe Vault
- [ ] Durée estimée validée
- [ ] Priorités validées

### Préparation

- [ ] Tickets créés dans le système de suivi
- [ ] Équipe assignée (DVIG + Vault)
- [ ] Environnement de développement préparé
- [ ] Accès aux bases de données (DVIG + Vault)

### Documentation

- [ ] SPEC corrigée partagée
- [ ] Plan Scrum partagé
- [ ] Modification Odoo documentée et partagée

---

## 🎯 Objectifs par Sprint

### Sprint A : Infrastructure DVIG (1-2 semaines)

**Objectif** : Créer l'infrastructure Outbox dans DVIG

**Livrables** :
- ✅ Table `outbox_events` créée
- ✅ Endpoint `/ingest` modifié
- ✅ Worker asynchrone opérationnel
- ✅ Backoff exponentiel implémenté
- ✅ Classification erreurs opérationnelle

### Sprint B : API Vault (1 semaine)

**Objectif** : Créer l'endpoint Vault `/api/v1/events`

**Livrables** :
- ✅ Endpoint `/api/v1/events` opérationnel
- ✅ Vérification idempotence garantie
- ✅ Endpoint optionnel `/api/v1/proof/event/{event_id}`

### Sprint C : Intégration End-to-End (3-5 jours)

**Objectif** : Valider le flux complet et mettre en place le monitoring

**Livrables** :
- ✅ Tests end-to-end validés
- ✅ Idempotence bout en bout validée
- ✅ Métriques Prometheus opérationnelles

---

## 🔗 Références

- **Plan Scrum** : `PLAN_IMPLEMENTATION_DVIG_VAULT_FORWARDING_v1.1_SCRUM.md`
- **SPEC corrigée** : `SPEC_DVIG_VAULT_FORWARDING_v1.1_CORRIGEE.md`
- **Modification Odoo** : `MODIFICATION_ODOO_IDEMPOTENCY_KEY.md`
- **Rapport diagnostic** : `RAPPORT_DIAGNOSTIC_VAULTING_20260111.md`

---

## ✅ Statut Global

| Composant | Statut | Progression |
|-----------|--------|-------------|
| **Odoo** | ✅ Complété | 100% |
| **Documentation** | ✅ Complétée | 100% |
| **DVIG** | ⏳ En attente | 0% |
| **Vault** | ⏳ En attente | 0% |
| **Intégration** | ⏳ En attente | 0% |

**Prochaine action** : Valider le plan avec les équipes DVIG et Vault

---

**Document créé** ✅
