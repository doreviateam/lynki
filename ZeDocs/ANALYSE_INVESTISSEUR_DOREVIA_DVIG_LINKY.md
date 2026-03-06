# Analyse pour investisseur — Dorevia, DVIG, Linky

**Date** : 2026-02-23  
**Public** : Investisseur potentiel  
**Durée** : 15–20 min  
**Objectif** : Expliquer clairement à quoi servent les composants Dorevia, DVIG et Linky

---

## 1. Résumé exécutif (2 min)

**Dorevia** construit l’**infrastructure de preuve financière** pour les PME : chaque document (facture, paiement, vente POS) devient une preuve cryptographique irréfutable.

| Composant | Rôle en une phrase |
|-----------|--------------------|
| **dorevia_*** | Modules Odoo qui branchent l’ERP à Dorevia (envoi, récupération preuves, UX). |
| **DVIG** | Passerelle qui reçoit les documents de l’ERP et les transmet au Vault (résilience, multi-tenant). |
| **Linky** | Tableau de bord exécutif qui affiche les KPIs basés *uniquement* sur des données scellées. |

**Chaîne fonctionnelle** : `ERP (Odoo) → DVIG → Vault → Linky`  
**Principe clé** : aucune décision sur données non scellées.

---

## 2. Positionnement business

### 2.1 Promesse

> *« Une entreprise ne se pilote pas sur des chiffres. Elle se pilote sur des chiffres prouvables. »*

Dorevia ne remplace pas l’ERP ni la comptabilité. Elle ajoute une **couche de preuve** : chaque fait économique validé est scellé (hash SHA-256, signature JWS, ledger immuable).

### 2.2 Problème adressé

| Situation | Risque | Réponse Dorevia |
|-----------|--------|-----------------|
| Contrôle fiscal | Chiffres Excel/PDF modifiables | Attestation cryptographique vérifiable |
| Litiges fournisseurs/clients | Mémoire floue, données invérifiables | Ledger hash-chaîné, traçabilité |
| Décisions stratégiques | Pilotage sur estimations | Indicateurs fondés sur preuves |
| Conformité PDP/PPF, NF525 | Normes exigeant traçabilité | Stack alignée réglementairement |

### 2.3 Modèle économique (ordre de grandeur)

| Offre | Prix | Cible |
|-------|------|-------|
| Starter | 30 €/mois | TPE, artisans |
| Business | 80 €/mois | PME 1–50 sal. |
| Scale | 150 €/mois+ | Entreprises structurées |

Usage au-delà des paliers (ex. 0,10–0,15 €/facture). **TAM** : plusieurs centaines de milliers d’entreprises en France.

---

## 3. Les composants détaillés

### 3.1 Les modules dorevia_* (côté Odoo)

Ce sont les **extensions Odoo** qui permettent à l’ERP de communiquer avec la plateforme Dorevia.

| Module | Rôle | Impact business |
|--------|------|------------------|
| **dorevia_vault_connector** | Envoie factures et paiements vers DVIG, récupère les preuves cryptographiques | Coeur de l’intégration : factures et paiements « Protégés » |
| **dorevia_core** | Config partagée (URL Vault, tokens, tenant) | Base commune pour tous les modules Dorevia |
| **dorevia_session_guard** | Auto-déconnexion après inactivité, redirection Linky pour certains utilisateurs | UX dirigeants : accès direct au cockpit |
| **dorevia_adapter_odoo18** | Endpoints pour « replay » depuis Vault (régénération depuis preuves) | Résilience et réconciliation en cas de perte ERP |
| **dorevia_posted_lock** | Verrouillage des factures postées | Cohérence entre ERP et preuves |
| **dorevia_sale_reports**, **dorevia_report_pdf_layout_fix**, etc. | Personnalisation rapports PDF, mise en page | Qualité de sortie documentaire |

**dorevia_vault_connector** est le plus central :

- Machine d’état : `todo` → `pending_proof` → `vaulted` (ou `failed_soft` / `failed_hard`)
- Orchestration temps réel : queue_job + CRON
- Métriques de vaulting, attestation téléchargeable
- Idempotence par clé SHA-256 pour éviter les doublons

Sans ces modules, Odoo ne parlerait pas à Dorevia. C’est le **point d’entrée métier** pour chaque client Odoo.

---

### 3.2 DVIG (Dorevia Vault Integration Gateway)

**DVIG** est la **passerelle** entre l’ERP et le Vault. Il ne stocke pas les documents à long terme ; il assure la **résilience** et la **normalisation**.

#### Pourquoi DVIG existe

Le Vault est le **coeur cryptographique** : scellement, ledger, preuves. DVIG découple l’ERP du Vault pour :

- **Résilience réseau** : si le Vault est indisponible, les événements sont mis en file d’attente (outbox)
- **Retry automatique** : réessais en cas d’erreur
- **Multi-tenant** : isolation stricte par `tenant` (client / entité)
- **Normalisation** : format unique pour tous les types de sources (Odoo aujourd’hui, autres ERP demain)

#### Flux technique

```
Odoo (POST /ingest) → DVIG outbox (accepted)
                           ↓
              Worker DVIG (scheduler 10s)
                           ↓
              Vault (POST /api/v1/events ou /invoices, /payments…)
```

- **POST /ingest** : reçoit les événements Odoo (factures, paiements)
- **Outbox** : table `outbox_events` (status : `accepted` → `forwarded` / `failed`)
- **Worker** : traitement asynchrone vers le Vault
- **Idempotence** : `event_id` unique, pas de doublon côté Vault

#### Stack technique

- **Python, FastAPI**
- Scheduler interne pour l’outbox
- Auth par tokens (YAML store), multi-tenant via headers
- Health checks liveness/readiness pour orchestration (Kubernetes, Docker)

**En bref** : DVIG est la « couche tampon » qui garantit que chaque document émis par l’ERP finit vaulté, même en cas de coupure réseau ou de maintenance Vault.

---

### 3.3 Linky (cockpit exécutif)

**Linky** est le **tableau de bord** en lecture seule. Il affiche des KPIs calculés à partir des données **scellées** dans le Vault.

#### Principe clé

> **Linky ne lit que le Vault.** Aucune décision basée sur des données non scellées.

C’est ce qui le distingue d’une BI classique : les chiffres affichés sont **prouvés**, pas estimés.

#### Indicateurs affichés

| KPI | Signification |
|-----|---------------|
| **Trésorerie** | Réconcilié / non réconcilié, total, devise |
| **Encaissements** | Paiements entrants |
| **Décaissements** | Paiements sortants |
| **Ventes HT** | Agrégat factures clients |
| **Achats HT** | Agrégat factures fournisseurs |
| **Ajustements** | Avoirs, remboursements |
| **Sessions POS** | Données points de vente |
| **Badge intégrité** | Ratio documents scellés vs documents source |

#### Flux technique

```
Linky (navigateur)
    │ GET /api/dashboard-metrics?tenant=...&date_debut=...&date_fin=...
    ▼
Next.js API Route (proxy)
    │ Promise.all([treasury, payments-in, payments-out, sales, purchases, …])
    ▼
Vault GET /ui/aggregations/*
    │
    ▼
Affichage grille + cards KPI
```

- **Stack** : Next.js, React
- **Composants** : `IconGrid`, `TreasuryCardWithPolling`, `IntegrityBadge`, etc.
- **Filtres** : société, période, mode vue

Le badge d’intégrité indique au dirigeant à quel point ses indicateurs reposent sur des preuves (taux de documents scellés).

---

## 4. Architecture globale (vue investisseur)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Odoo      │     │   DVIG      │     │  Dorevia Vault  │     │   Linky     │
│  (ERP)      │────▶│ (passerelle)│────▶│  (Go, cœur      │◀────│ (Next.js,   │
│ dorevia_*   │     │ outbox      │     │  cryptographique)│     │  cockpit)   │
└─────────────┘     └─────────────┘     └─────────────────┘     └─────────────┘
      │                    │                      │                    │
      │ Factures,          │ Résilience,           │ Scellement,        │ Lecture seule
      │ paiements,         │ retry, multi-tenant  │ preuves, agrégats  │ KPIs prouvés
      │ POS                │                      │                    │
```

**Règle des 3V** (fil conducteur) :

1. **Validé** : document officiel dans l’ERP
2. **Vaulté** : hash + JWS + entrée ledger
3. **Vérifiable** : preuve consultable à tout moment

---

## 5. Différenciation

| Concurrent / alternative | Limite | Dorevia |
|--------------------------|--------|---------|
| Logiciels caisse / TPE | Pas de preuve cryptographique | Chaque document scellé JWS + ledger |
| Archivage / GED | Stockage sans preuve d’intégrité | Signature + chaîne de hash |
| Pennylane, Agicap, BI classique | Données estimées, non attestées | Indicateurs uniquement sur données scellées |
| Solutions conformité génériques | Complexité, coût, lock-in | Intégration légère Odoo, pricing accessible |

**Atouts techniques** : stack souveraine (Go, Python, hébergement France), alignée PDP/PPF 2026, NF525, Factur-X.

---

## 6. Traction et maturité

| Composant | État |
|-----------|------|
| **Vault** | Opérationnel — scellement, preuves, agrégats |
| **DVIG** | Opérationnel — outbox, forwarding |
| **Linky** | Opérationnel — cockpit, KPIs, badge intégrité |
| **dorevia_vault_connector** | Opérationnel — vaulting automatique factures + paiements |
| **Client-pilote** | sarl-la-platine (tenant actif) |
| **DIVA** (synthèse IA) | Expérimental |
| **DLP** (marqueur intention) | En réflexion |

---

## 7. Synthèse pour l’investisseur

| Question | Réponse |
|---------|---------|
| **À quoi ça sert ?** | Transformer chaque document financier en preuve cryptographique et fournir un tableau de bord fondé sur ces preuves. |
| **dorevia_*** ? | Extensions Odoo pour brancher l’ERP à Dorevia (envoi, preuves, UX). |
| **DVIG ?** | Passerelle de résilience ERP → Vault (file d’attente, retry, multi-tenant). |
| **Linky ?** | Cockpit exécutif en lecture seule sur données scellées. |
| **Différence vs concurrents ?** | Preuve cryptographique + règle « aucune décision sur données non scellées ». |
| **Maturité ?** | Produit opérationnel, client-pilote, pricing défini. |

---

**Document maintenu par** : Équipe Dorevia  
**Références** :  
- `ZeDocs/web22/VISION_TECHNIQUE_DOREVIA_v1.0.md`  
- `ZeDocs/ONBOARDING_CONSULTANT_FONCTIONNEL_DOREVIA.md`  
- `ZeDocs/web20/RAPPORT_DOREVIA_POUR_INCONNU.md`
