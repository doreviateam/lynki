# ANNEXE — Odoo 18 : Architecture des modules `dorevia_*` (Adapter ERP)

**Date :** 2026-02-21  
**Rattachement :** `SPEC_ERP_Reconnect_v1.2.md` (Vault Replay / ERP Reconnect)  
**But :** Définir la structure des modules Odoo 18 `dorevia_*` nécessaires à l'adaptation ERP (Odoo = adapter #1, mais architecture ERP‑agnostic côté Vault/Runner).

---

## 1. Principes

1. **Un module = une responsabilité.**
2. **Aucune dépendance circulaire** entre modules `dorevia_*`.
3. **L'adapter ne modifie pas le core d'Odoo** (pas de patching massif, pas de surcharge intrusive).
4. **Idempotence obligatoire** : un `event_id` Vault ne doit s'appliquer qu'une seule fois.
5. **Odoo reste passif** : l'ordonnancement (Partners → Invoices → Payments → Balances) est réalisé par le Runner.
6. **Vault reste canonique** : Odoo ne stocke pas de "vérité" concurrente, seulement un état ERP reconstruit + mapping d'audit.

---

## 2. Vue d'ensemble des modules

### 2.1 Graphe de dépendances (MVP)

```
base
 └─ dorevia_core
     └─ dorevia_adapter_odoo18
         ├─ account
         └─ product
```

> `account` et `product` sont des modules Odoo standards requis par l'adapter pour créer factures/paiements et une ligne synthétique.

### 2.2 Liste des modules `dorevia_*`

| Module | Statut | Rôle | Dépend de | Remarques |
|--------|--------|------|-----------|-----------|
| `dorevia_core` | P0 | Config + utilitaires communs Dorevia | `base` | Aucune logique métier ERP |
| `dorevia_adapter_odoo18` | P0 | Adapter ERP Odoo 18 : endpoints + apply events | `dorevia_core`, `account`, `product` | Implémentation #1 de l'interface ERPAdapter |
| `dorevia_replay_ui` | P1 | UI Odoo (optionnelle) pour visualiser état replay | `dorevia_core` | Le bouton principal reste côté Vault |
| `dorevia_vault_link` | P1 | Ingestion directe Odoo→Vault (sans DVIG) | `dorevia_core` | Option future ; DVIG reste la voie actuelle |
| `dorevia_linky_bridge` | P2 | Exposition KPI/Linky dans Odoo | `dorevia_core` | Hors scope reconnect MVP |

**Note** : `dorevia_vault_connector` (existant) = ERP **source**, envoie vers DVIG→Vault. `dorevia_adapter_odoo18` = ERP **cible**, reçoit du Runner.

---

## 3. Module `dorevia_core` (P0)

### 3.1 Objectif

Fournir une couche minimale partagée par tous les modules `dorevia_*` :
- Paramètres (Vault URL, tokens, timeouts, tenant, company mapping)
- Logging structuré (préfixes, corrélation)
- Helpers de validation payload
- Helpers multi-société (si `company_id` fourni)

### 3.2 Données / Paramètres

Proposition : `ir.config_parameter`

Clés :
- `dorevia.vault.base_url`
- `dorevia.vault.token` (ou référence secret manager si disponible)
- `dorevia.adapter.timeout_ms`
- `dorevia.tenant.default` (optionnel)
- `dorevia.company.default_id` (optionnel)

### 3.3 Sécurité

- Stocker secrets hors code.
- Restreindre l'accès aux écrans de config à un groupe admin (ex : `base.group_system`).

---

## 4. Module `dorevia_adapter_odoo18` (P0)

### 4.1 Objectif

Appliquer des événements canoniques `dorevia.economic_event.v1` dans Odoo 18 via endpoints techniques (appelés par le Runner).

Responsabilités :
- Exposer endpoints HTTP internes (authentifiés)
- Créer/mettre à jour : partners, invoices (synthétiques), payments, recompute balances
- Garantir idempotence par `event_id`
- Produire un résultat exploitable par le Runner (status + ids + warnings)

Non‑responsabilités :
- Ne pas décider l'ordre d'application (Runner)
- Ne pas faire de mapping Vault (Vault)
- Ne pas fournir une UI métier complète (P1)

### 4.2 Authentification des endpoints

**Tranché** : session admin (login/password). Par défaut `admin/admin`. En prod : credentials via secret manager. Endpoints appelés par le Runner avec Basic Auth ou session cookie selon implémentation Odoo.

### 4.3 Dépendances Odoo requises (MVP)

Modules Odoo standards :
- `base`
- `account`
- `product`
- (souvent auto‑tiré : `mail` via `account` selon config)

Modules Dorevia :
- `dorevia_core`
- `dorevia_adapter_odoo18`

Installation minimale recommandée :
```
base
account
product
dorevia_core
dorevia_adapter_odoo18
```

### 4.4 Schéma counterparty (partner/upsert)

Champs obligatoires : `name`, `partner_ref` (ou `ref`). Optionnels : `vat`, `email`, `street`, `city`, `zip`, `country`.

**`partner_ref`** : valeur stable issue du raw (ex : `partner_id`, `vat` ou identifiant métier source). Jamais générée dynamiquement (pas le nom, pas un hash de champs variables). Clé de déduplication — garantir stabilité pour l'idempotence (spec §8 D).

### 4.5 Modèle d'idempotence

#### Table / Modèle : `dorevia.replay.mapping`

**S'applique aux events invoice, payment, balances uniquement.** Les partners ne créent pas d'entrée (idempotence par `(tenant, partner_ref)`).

Champs :
- `event_id` (unique)
- `tenant`
- `model`
- `res_id`
- `applied_at`
- `status` (applied|skipped|failed)
- `details_json` (optionnel : warnings / ids / allocations)

Contraintes :
- unique(event_id)

**Status** : `skipped` = event_id déjà appliqué (idempotence). `failed` = erreur lors de l'application.

### 4.6 Endpoints (MVP)

> Les endpoints sont volontairement "techniques", destinés au Runner, pas à un utilisateur final.

1) `POST /dorevia/replay/partner/upsert`
- input : payload counterparty (spec §8 E) + `tenant`
- Le counterparty est **extrait par le Runner** des événements `invoice_issued` et `payment_received` (partner_ref, etc.) — pas d'event dédié en MVP (spec §8 🧠 C)
- **Idempotence** : par `(tenant, partner_ref)`. Pas d'entrée dans `dorevia.replay.mapping` (spec §8 D). `event_id` optionnel en corrélation uniquement.
- output : `partner_id`, `status`, `warnings[]`

2) `POST /dorevia/replay/invoice/create_synth`
- input : invoice_issued canonique + `event_id`
- crée `account.move` avec 1 ligne synthétique "Vente HT (Vault)"
- output : `move_id`, `status`, `warnings[]`

3) `POST /dorevia/replay/payment/create`
- input : payment_received/payment_sent canonique + `event_id`
- crée `account.payment` et tente allocation FIFO best‑effort (si applicable)
- output : `payment_id`, `allocations[]`, `status`, `warnings[]`

4) `POST /dorevia/replay/balances/recompute`
- input : `tenant`, `company_id` (optionnel)
- output : `status`, `warnings[]`

### 4.7 Produit / ligne synthétique

Créer un produit service générique :
- Nom : `Vente HT (Vault)`
- Type : service
- Utilisé pour générer une ligne unique sur facture
- Paramétrage minimal : compte de vente par défaut de la société

**Tranché** : créé automatiquement à l'installation du module (`post_init_hook` ou `data`). Option : stocker l'ID dans `ir.config_parameter` (`dorevia.adapter.generic_product_id`).

### 4.8 Journal des allocations FIFO (P0 – audit)

Même en MVP, tracer :
- payment_event_id → invoices_allocated[] + remainder

Stockage recommandé :
- soit dans `dorevia.replay.mapping.details_json`
- soit table dédiée `dorevia.replay.payment_allocation` (P1)

Le Runner doit inclure ces allocations dans le report final.

---

## 5. Convention de nommage et packaging

### 5.1 Dépôt / arborescence recommandée

```
odoo-addons/
  dorevia_core/
  dorevia_adapter_odoo18/
  (optionnel P1) dorevia_replay_ui/
```

### 5.2 Manifest (exemples)

#### `dorevia_core/__manifest__.py`

- name: Dorevia Core
- depends: `['base']`
- data: security + vues de configuration (si P0 UI)

#### `dorevia_adapter_odoo18/__manifest__.py`

- name: Dorevia Adapter Odoo 18
- depends: `['dorevia_core', 'account', 'product']`
- data: security, generic product, routes controllers

---

## 6. Definition of Done (Annexe P0)

- `dorevia_core` installé et configurable
- `dorevia_adapter_odoo18` installé
- mapping `event_id` unique opérationnel
- endpoints répondent (200/409/400) et sont authentifiés
- facture synthétique créée avec ligne `Vente HT (Vault)`
- paiement créé + allocations tracées (au moins en report)
- aucune logique d'ordonnancement dans Odoo (Runner only)

---

*Fin d'annexe.*
