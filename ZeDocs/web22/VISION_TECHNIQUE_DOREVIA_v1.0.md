# Vision Technique — Dorevia Platform
## Architecture, flux et roadmap technique

Version : v1.1  
Date : 2026-02-16 — Mise à jour : intégration recommandations (chaîne causale, snapshot, isolation DIVA, modèle DLP)  
Complément : DOREVIA_THE_BIG_PICTURE.md (vision produit), RECOMMANDATIONS_VISION_TECHNIQUE_v1.0.md  
Portée : Architecture technique, implémentation actuelle et cible  

---

# 1. Synthèse exécutive

La plateforme Dorevia repose sur trois piliers techniques :

1. **Vault** — Moteur de scellement cryptographique (Go) : données immuables, JWS, ledger hash-chaîné.
2. **DVIG** — Passerelle d’ingestion (Python) : normalisation ERP → Vault, multi-tenant, résilience.
3. **Linky** — Cockpit de lecture (Next.js) : agrégats Vault uniquement, aucune décision sur données non scellées.

La chaîne **Vérité scellée → Synthèse → Intention → DLP** (vision produit) s’appuie sur ce socle. La phase « Synthèse / Intention / DLP » (DIVA) est **non implémentée** à ce jour.

---

# 2. Architecture globale

## 2.1 Vue logique actuelle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DOREVIA PLATFORM                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  SOURCES                      INGESTION              STOCKAGE / PREUVE            │
│  ┌──────────┐                 ┌──────────┐           ┌─────────────────┐         │
│  │  Odoo    │  POST /ingest   │   DVIG   │  REST     │  Dorevia Vault  │         │
│  │  (ERP)   │ ───────────────▶│ (Python) │──────────▶│    (Go)         │         │
│  │  POS     │                 │          │           │                 │         │
│  └──────────┘                 └────┬─────┘           │  PostgreSQL     │         │
│       │                            │                  │  Storage FS     │         │
│       │                            │ outbox            │  Ledger         │         │
│       │                            ▼                  └────────┬────────┘         │
│       │                     ┌──────────┐                       │                  │
│       │                     │ outbox_  │                       │ GET /ui/aggregations
│       │                     │ events   │                       │ GET /api/v1/proof
│       │                     └──────────┘                       │                  │
│       │                                                         ▼                  │
│       │                                              ┌─────────────────┐          │
│       │         GET /api/v1/proof                    │    LINKY         │          │
│       └─────────────────────────────────────────────▶│  (Next.js)       │          │
│                                                      │  Cockpit lecture │          │
│                                                      └─────────────────┘          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Vue cible (avec DIVA)

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  Sources  →  DVIG  →  Vault  →  Linky                                               │
│                               ↘    ↗                                                │
│                            DIVA (Mistral)  ←── Avis humain                           │
│                                  │                                                   │
│                                  ▼                                                   │
│                            Registre DLP (à venir)                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## 2.3 Chaîne causale (Vision Produit ↔ Technique)

Pont explicite entre preuve scellée et gouvernance :

```
Vault (fait économique scellé)
    ↓
Agrégats Vault (/ui/aggregations/*)
    ↓
Résumé DIVA (Mistral)
    ↓
Avis humain
    ↓
DLP (marqueur d'intention)
    ↓
Impact observable futur sur indicateurs
```

---

# 3. Stack technologique

| Composant | Technologie | Version | Rôle |
|-----------|-------------|---------|------|
| **Vault** | Go, Fiber | 1.23+ | Scellement, ledger, API REST |
| **DVIG** | Python, FastAPI | 3.9+ | Passerelle ingestion, outbox |
| **Linky** | React.js, Next.js | 18+ | UI cockpit, agrégats |
| **Odoo** | Odoo CE, Python | 18.0 | ERP source (factures, paiements, POS) |
| **PostgreSQL** | PostgreSQL | 16 | Métadonnées Vault, outbox DVIG |
| **Caddy** | Caddy | 2 | Reverse proxy, TLS |
| **Mistral AI** | Installé localement (`units/mistral/`) | — | Moteur IA interne (DIVA) — non exposé, synthèse/qualification DLP |

---

# 4. Composants détaillés

## 4.1 Dorevia Vault (Go)

**Rôle** : Moteur cryptographique et stockage sécurisé des preuves.

**Responsabilités** :
- Ingestion documents : factures, paiements, tickets POS, Z-Reports
- Scellement : SHA-256, signature JWS (RS256/EdDSA)
- Ledger : hash-chaîné append-only (PostgreSQL + filesystem)
- Vérification intégrité : `GET /api/v1/ledger/verify/:id`
- Agrégations UI : routes `/ui/aggregations/*` pour Linky

**APIs principales** :

| Méthode | Route | Usage |
|---------|-------|--------|
| POST | `/api/v1/invoices` | Ingestion factures Odoo |
| POST | `/api/v1/events` | Événements DVIG (spec v1.1) |
| POST | `/api/v1/payments` | Paiements |
| POST | `/api/v1/pos-tickets` | Tickets POS |
| POST | `/api/v1/pos/zreports` | Z-Reports |
| GET | `/api/v1/proof/account_move/:id` | Preuve facture Odoo |
| GET | `/ui/aggregations/treasury` | Trésorerie (reliability_rate) |
| GET | `/ui/aggregations/payments-in` | Encaissements |
| GET | `/ui/aggregations/payments-out` | Décaissements |
| GET | `/ui/aggregations/sales` | Ventes HT |
| GET | `/ui/aggregations/purchases` | Achats HT |
| GET | `/ui/aggregations/adjustments` | Avoirs, remboursements |
| GET | `/ui/aggregations/pos-sessions` | Sessions POS |
| GET | `/ui/system/vault-health` | Santé intégrité (Linky badge) |

**Stockage** :
- `documents` : métadonnées, hash, JWS, source_id, tenant
- `storage/YYYY/MM/DD/` : fichiers (PDF, JSON)
- Ledger : chaîne hash pour auditabilité

**Principe** : Règle des 3V — **Validé → Vaulté → Vérifiable**. Aucune modification des données scellées.

---

## 4.2 DVIG — Dorevia Vault Integration Gateway (Python)

**Rôle** : Passerelle universelle entre sources (Odoo) et Vault.

**Flux** :
1. **Ingestion** : `POST /ingest` reçoit les événements Odoo (factures, paiements)
2. **Outbox** : Stockage dans `outbox_events` (status: `accepted` → `forwarded`)
3. **Worker** : Traitement asynchrone `outbox_events` → `POST` Vault (`/api/v1/events` ou endpoints dédiés)
4. **Idempotence** : `event_id` unique, pas de doublon côté Vault

**Configuration** :
- `VAULT_URL` : cible Vault
- `DVIG_INTERNAL_TOKEN` : authentification Bearer
- Multi-tenant : `tenant` propagé dans tous les flux

**Résilience** :
- Retry sur échec réseau
- Timeout configurable
- Health checks : liveness, readiness

---

## 4.3 Linky (Next.js)

**Rôle** : Cockpit décisionnel en lecture seule sur données scellées.

**Principe** : Linky **ne lit que** le Vault (via APIs proxy Next.js). Aucune décision basée sur données non scellées.

**APIs internes** (Next.js → Vault) :
- `GET /api/dashboard-metrics` : agrège 8 KPIs (trésorerie, cash, business, taxes, etc.) depuis Vault `/ui/aggregations/*`
- `GET /api/platform/status` : badge intégrité (Vault health, sealed_ratio, sources)
- `GET /api/companies` : sociétés (via Vault ou DVIG)
- `GET /api/years-with-data` : années/mois avec données

**Composants clés** :
- `DashboardWithFilters` : layout, filtres société/période, viewMode
- `IconGrid` : grille 8 tuiles KPI (page d’accueil, mode focus)
- `ReportHeader` : header 2 lignes, badge intégrité, menu
- `LinkyFooter` : footer fixe (Vault, DVIG, Sources, Sync, version)
- Cards KPI : `TreasuryCardWithPolling`, `FluxCashCardWithPolling`, etc.

**Chemin projet** : `units/dorevia-linky/`

---

## 4.4 Odoo — Connecteur Vault

**Module** : `dorevia_vault_connector`

**Flux** :
1. **CRON #1** (toutes les 5 min) : Envoi factures `posted` vers DVIG `POST /ingest`
2. **DVIG → Vault** : Worker traite outbox
3. **CRON #2** (toutes les 5 min) : Odoo récupère preuve via `GET /api/v1/proof/account_move/:id`
4. **Statut** : `todo` → `pending_proof` → `vaulted` (ou `failed_soft` / `failed_hard`)

**Champs Odoo** : `dorevia_vault_id`, `dorevia_vault_evidence_jws`, `dorevia_vault_ledger_hash`, `dorevia_vault_date`

---

# 5. Principes techniques

## 5.1 Règle des 3V

| Étape | Signification | Responsable |
|-------|---------------|-------------|
| **Validé** | Document juridiquement engageant (ex: facture `posted`) | Odoo |
| **Vaulté** | Hash SHA-256 + JWS + entrée ledger | Vault |
| **Vérifiable** | Preuve consultable, JWKS public, export ledger | Vault |

## 5.2 Multi-tenant

- **Isolation** : Toutes les requêtes sont filtrées par `tenant`
- **Convention** : `tenant` = slug (ex: `core`, `sarl-la-platine`, `dido`)
- **Manifest** : `tenants/<tenant>/state/manifest.json` définit URLs, domaines, universes

## 5.3 Lecture seule côté cockpit

Linky ne modifie aucune donnée. Il consomme :
- Agrégats pré-calculés (Vault)
- Données de configuration (tenant, companies)
- Statut plateforme (vault-health)

## 5.4 Intention déploiement vs intention métier

| Concept | Portée | Implémenté | Stockage |
|---------|--------|------------|----------|
| **Intention déploiement** | Configuration opérateur (domaines, serveur, env) | Oui | `tenants/*/state/intents/intent-*.json` |
| **Intention métier (DLP)** | Marqueur stratégique rattaché à un snapshot économique | Non | À définir (registre DLP) |

Les `intent` actuels sont **uniquement** pour le CLI `dorevia.sh prompt` et le déploiement. Ils ne doivent pas être confondus avec les DLP.

---

# 6. Flux de données détaillés

## 6.1 Flux ingestion (Odoo → Vault)

```
Odoo account.move posted
    │
    │ CRON #1 (cron_vault_send_dvig)
    ▼
POST /ingest (DVIG)
    │ stocke dans outbox_events (status=accepted)
    ▼
DVIG Outbox Worker
    │ POST /api/v1/events (Vault)
    ▼
Vault : hash + JWS + ledger
    │
    │ CRON #2 (cron_vault_fetch_proof)
    ▼
Odoo GET /api/v1/proof/account_move/:id
    │
    ▼
Odoo : dorevia_vault_status = vaulted
```

## 6.2 Flux lecture (Linky)

```
Linky (navigateur)
    │
    │ GET /api/dashboard-metrics?tenant=...&date_debut=...&date_fin=...
    ▼
Next.js API Route
    │
    │ Promise.all([treasury, payments-in, payments-out, sales, purchases, adjustments, pos-sessions])
    ▼
Vault GET /ui/aggregations/*
    │
    ▼
Linky : affichage grille + cards KPI
```

## 6.3 Flux badge intégrité

```
Linky IntegrityBadge
    │
    │ GET /api/platform/status?tenant=...
    ▼
Next.js → Vault GET /ui/system/vault-health
    │ (ou fallback DVIG /internal/vault-health)
    ▼
Réponse : integrity_state, sealed_ratio, pending_events, sources, last_sync_formatted
```

---

# 7. Modèle de données (Vault)

## 7.1 Tables principales

| Table | Rôle |
|-------|------|
| `documents` | Métadonnées documents scellés (factures, paiements, tickets, etc.) |
| `payments` | Paiements (encaissements, décaissements) |
| `pos_sessions` | Sessions POS |
| Ledger | Entrées hash-chaînées (PostgreSQL + fichier selon type) |

## 7.2 Champs clés document

- `id`, `tenant`, `source_id`, `document_type`
- `hash_current`, `hash_prev`
- `evidence_jws` : jeton signé
- `created_at`, `vault_status` (sealed, etc.)
- Métadonnées métier : `invoice_number`, `total_ttc`, `invoice_date`, etc.

---

# 8. Sécurité

## 8.1 Authentification

- **Vault** : API Keys, JWT (RBAC : 4 rôles), Bearer Token pour DVIG
- **Linky** : Pas d’auth utilisateur en v1 (tenant fixe ou cookie)
- **DVIG** : `DVIG_INTERNAL_TOKEN` pour appels Vault

## 8.2 Isolation

- CORS configuré
- Rate limiting (middleware Vault)
- Pas de mélange de tenants (filtrage systématique)
- **IA (Mistral)** : interne uniquement, non exposée (pas d’API publique)

## 8.3 Conformité

- NF525 (POS)
- Préparation PDP/PPF 2026 (facturation électronique)
- Archivage probatoire (Code du commerce)

---

# 9. Roadmap technique (DIVA & DLP)

## 9.1 Phase actuelle (réalisée)

- [x] Vault : scellement, agrégations, proof
- [x] DVIG : ingestion, outbox, forwarding
- [x] Linky : cockpit, grille KPI, badge intégrité
- [x] Odoo : connecteur, CRON, fetch proof
- [x] Multi-tenant, manifest, intents déploiement

## 9.2 Phase DIVA

**Spec v1.1** : `SPEC_DIVA_API_v1.0.md` — service `units/diva/`, endpoint `POST /diva/explain`, flux Linky → proxy → DIVA → Mistral. Périmètre v1 : synthèse Flash uniquement (sans DLP).

**Moteur IA** : Mistral (installé localement — Option B : `units/mistral/`, llama.cpp + GGUF) — interne uniquement, non exposé.

**Isolation stricte** (Vault = Preuve, DIVA = Cognition, Linky = Lecture) :
- DIVA n’a aucun accès direct à la base PostgreSQL Vault
- DIVA consomme **uniquement** les APIs publiques Vault
- DIVA n’écrit jamais dans Vault
- DLP stockées dans un registre distinct

**Position IA (Mistral)** :
- Utilisation : synthèse, qualification, formalisation DLP
- Aucun accès direct à la base Vault
- Aucun pouvoir d’écriture sur données scellées
- Aucune détention de clés cryptographiques

**Prérequis techniques** :
- Mistral appelé via HTTP local (`http://mistral-llamacpp:8000/v1`) — DIVA est le seul consommateur
- Service DIVA dédié : `units/diva/` (Go, aligné Vault), réseau `dorevia-network`

**Flux cible** :
1. Utilisateur saisit un « avis pour action » (texte libre)
2. DIVA appelle Vault : agrégats, snapshot périodique
3. DIVA qualifie : pertinence, impact, conformité
4. Si validé : DIVA génère 5 DLP structurées
5. Utilisateur valide ou rejette
6. DLP validées → archivage (registre probant)

**APIs** :
- v1 (implémentée en spec) : `POST /diva/explain` — synthèse Flash des KPI Linky
- v2+ : `POST /api/diva/avis` (qualification avis), `GET /api/diva/dlps` (registre DLP)

**Modèle DLP recommandé** (append-only, pas de modification après validation) :

| Champ | Description |
|-------|-------------|
| `id` | Identifiant unique |
| `tenant` | Tenant |
| `snapshot_id` | Référence snapshot immuable |
| `created_at`, `created_by` | Date, responsable |
| `enonce_long`, `enonce_court` | Version longue (registre probant) / courte (fil d’actualité) |
| `categorie_impact` | Coûts, revenus, organisation, fiscalité… |
| `status` | draft, validated, archived |
| `version` | Numéro de version |

## 9.3 Snapshot économique — Point critique

**Constat** : Les agrégats Vault sont dynamiques. Une DLP doit être rattachée à un **contexte figé**. Sans snapshot, la valeur probante serait affaiblie.

**Structure snapshot proposée** :

| Champ | Description |
|-------|-------------|
| `id` | Identifiant unique |
| `tenant` | Tenant |
| `created_at` | Date de création |
| `period_start`, `period_end` | Période couverte |
| `data_hash` | Hash des données |
| `json_payload` | Données agrégées figées |
| `ledger_hash` | Référence ledger |

Les DLP référenceront `snapshot_id`. À implémenter en amont de la Phase DIVA.

## 9.4 Priorités techniques Phase DIVA

| Priorité | Sujet | Impact |
|----------|-------|--------|
| Haute | Snapshot immuable | Cohérence probante DLP |
| Moyenne | Registre DLP dédié | Structuration gouvernance |
| Faible | Clarification doc IA | Lisibilité architecture |

---

# 10. Contraintes et choix d’architecture

## 10.1 Choix assumés

| Choix | Justification |
|-------|---------------|
| Vault en Go | Performance, concurrence, cryptographie native |
| DVIG en Python | Alignement écosystème Odoo, FastAPI |
| Linky en React.js / Next.js | SSR, API routes |
| Mistral pour DIVA | Moteur IA interne, non exposé ; Vault reste sans IA (séparation des responsabilités) |
| Intents ≠ DLP | Éviter confusion déploiement / stratégie |

## 10.2 Limites connues

- **Snapshot** : Pas d’API dédiée snapshot horodaté (agrégats en temps réel uniquement)
- **DIVA** : Implémentée (2026-02-17) — service `units/diva/`, proxy Linky, bloc UI
- **DLP** : Modèle de données à définir
- **Auth Linky** : Multi-utilisateur non géré en v1

## 10.3 Évolutivité

- Vault : horizontal scaling (stateless, PostgreSQL partagé)
- DVIG : workers multiples sur outbox
- Linky : déploiement classique Next.js (Vercel, Docker)

---

# 11. Références

| Document | Rôle |
|----------|------|
| `INDEX.md` | Index et navigation ZeDocs/web22 |
| `DOREVIA_THE_BIG_PICTURE.md` | Vision produit (DIVA, DLP) |
| `RECOMMANDATIONS_VISION_TECHNIQUE_v1.0.md` | Recommandations architecturales Phase DIVA |
| `SPEC_INSTALLATION_MISTRAL.v0.1.md` | Installation Mistral on-prem (vLLM, Docker, runbook) |
| `RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md` | Option B (llama.cpp, implémentée) |
| `SPEC_DIVA_API_v1.0.md` | Spec API DIVA (v1.1, Flash) |
| `units/mistral/README.md` | Runbook unit Mistral |
| `RAPPORT_INTEGRATION_MISTRAL_DIVA_v1.0.md` | Rapport intégration Mistral/DIVA |
| `ZeDocs/web21/SPEC_LINKY_HOME_GRID_ICONS_KPI_CARDS_v0.1.md` | Spec grille Linky |
| `ZeDocs/web21/SPEC_LINKY_LAYOUT_HEADER_FOOTER_v0.1.md` | Spec header/footer Linky |
| `sources/vault/docs/FICHE_DE_CONCEPTION_TECHNIQUE_PHASE_3.MD` | Conception Vault/PDP |
| `lib/intent/README.md` | Intent déploiement (CLI) |
| `schemas/intent.README.md` | Schéma intention déploiement |

---

**Fin du document.**
