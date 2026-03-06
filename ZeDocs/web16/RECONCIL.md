# Rapport d'analyse d'impact — SPEC Vaulting des événements de rapprochement bancaire (RECONCIL)

**Version** : 1.1
**Date** : 11 février 2026
**Spécification source** : `ZeDocs/web16/RECONCIL.md` v1.0

---

## 1. Synthèse exécutive (Mise à jour)

La SPEC RECONCIL adopte désormais une architecture **Event + Projection** :

* Les transitions `reconciled ↔ unreconciled` sont stockées en **append-only**
* Une **projection optimisée** maintient l’état courant
* Le rejeu complet n’est utilisé que pour analyse historique exceptionnelle

Cette approche évite :

* ⚠️ Charge CPU permanente
* ⚠️ Recalcul complet à chaque requête
* ⚠️ Complexité excessive V1

| Aspect                | Impact                                                 | Niveau |
| --------------------- | ------------------------------------------------------ | ------ |
| **Odoo (connecteur)** | Émission des événements de transition                  | Majeur |
| **DVIG**              | Support des nouveaux event_types                       | Mineur |
| **Vault**             | Table événements + table projection + route agrégation | Majeur |
| **Linky**             | Nouvelle card Trésorerie                               | Majeur |
| **Base de données**   | Append-only + projection indexée                       | Majeur |

---

## 2. Nouveau paradigme retenu

### 2.1 Principe

Deux couches distinctes :

### 1️⃣ Vérité immuable (Event Store)

Table :

```
bank_reconciliation_events
```

Contient uniquement :

* `bank.move.reconciled`
* `bank.move.unreconciled`
* occurred_at
* move_id
* tenant
* idempotency_key

Jamais modifiée.
Jamais écrasée.

---

### 2️⃣ Projection optimisée (État courant)

Table :

```
bank_reconciliation_projection
```

Contient :

* tenant
* move_id
* is_reconciled (bool)
* last_transition_at
* amount
* account_id

Mise à jour à chaque nouvel événement.

---

## 3. Conséquences par composant

---

## 3.1 Odoo — Dorevia Vault Connector

**Impact : Majeur**

Détection des transitions :

```
reconciled: false → true
reconciled: true → false
```

Émission vers DVIG :

* `bank.move.reconciled`
* `bank.move.unreconciled`

Payload minimal :

* move_line_id
* account_id
* amount
* currency
* occurred_at
* tenant

Idempotence obligatoire.

Aucun calcul métier côté Odoo.

---

## 3.2 DVIG

Aucune modification structurelle.

Ajout optionnel :

* Monitoring spécifique par `event_type`
* Métriques Prometheus enrichies

---

## 3.3 Vault (Go)

**Impact : Majeur**

### 3.3.1 Table événements (append-only)

```sql
CREATE TABLE bank_reconciliation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  move_id INTEGER NOT NULL,
  amount DECIMAL(18,4) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant, idempotency_key)
);
```

---

### 3.3.2 Table projection

```sql
CREATE TABLE bank_reconciliation_projection (
  tenant TEXT NOT NULL,
  move_id INTEGER NOT NULL,
  is_reconciled BOOLEAN NOT NULL,
  amount DECIMAL(18,4) NOT NULL,
  last_transition_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant, move_id)
);
```

Index recommandé :

```
CREATE INDEX idx_projection_tenant_reconciled 
ON bank_reconciliation_projection(tenant, is_reconciled);
```

---

### 3.3.3 Mise à jour projection

À réception d’un événement :

* Insert dans `bank_reconciliation_events`
* Upsert dans `bank_reconciliation_projection`

Logique :

| Event        | Projection            |
| ------------ | --------------------- |
| reconciled   | is_reconciled = true  |
| unreconciled | is_reconciled = false |

---

## 4. Nouvelle route Trésorerie

```
GET /ui/aggregations/treasury?tenant=X&date=T
```

⚡ Version V1 (optimisée) :

Ne rejoue pas l’historique complet.

Calcule :

```
accounting_balance = somme des écritures 512 vaultées
reconciled_balance = somme projection where is_reconciled = true
unreconciled_balance = somme projection where is_reconciled = false
reliability_rate = reconciled_balance / accounting_balance
```

---

## 5. Philosophie technique

| Option        | Avantage                 | Inconvénient        |
| ------------- | ------------------------ | ------------------- |
| Rejeu complet | Historique parfait       | CPU élevé           |
| Projection    | Performance + simplicité | Historique complexe |

Choix retenu :
**Projection pour V1**
Rejeu historique seulement si nécessaire (V2).

---

## 6. Impact Linky

Nouvelle Card :

### 1️⃣ Trésorerie (Stock)

Solde comptable 512

### 2️⃣ Trésorerie validée

Somme projection reconciled

### 3️⃣ En attente de rapprochement

Somme projection unreconciled

### 4️⃣ Fiabilité bancaire (%)

reconciled / total

---

## 7. Relation avec l’existant

| Route                                   | Rôle                          |
| --------------------------------------- | ----------------------------- |
| `/ui/system/bank-reconciliation-health` | État temps réel (Odoo direct) |
| `/ui/aggregations/treasury`             | État consolidé event-based    |

Les deux coexistent.

---

## 8. Avantages de l’architecture retenue

✅ Performance constante
✅ Scalabilité
✅ Philosophie event-sourcing respectée
✅ Lisibilité du code
✅ Évolution possible vers snapshot mensuel

---

## 9. Risques maîtrisés

| Risque                    | Mitigation                       |
| ------------------------- | -------------------------------- |
| Volume d’événements       | Index + partition future         |
| Projection désynchronisée | Idempotence stricte              |
| Historique complexe       | Snapshot ultérieur si nécessaire |

---

## 10. Conclusion mise à jour

RECONCIL devient :

* Event-sourced
* Performant
* Industrialisable
* Aligné avec Dorevia Vault

Estimation réaliste :

**3 à 4 sprints** (et non plus 4–6)

Architecture mature validée.
