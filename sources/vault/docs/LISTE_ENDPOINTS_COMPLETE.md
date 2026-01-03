# 📋 Liste Complète des Endpoints — Dorevia Vault v1.6.2

**Date** : 2025-11-26  
**Version** : v1.6.2 (Sprint 8.1 - Compatibilité DVIG)  
**Total Endpoints** : **30+ endpoints**

---

## 📊 Vue d'Ensemble

| Catégorie | Nombre | Authentification |
|-----------|--------|------------------|
| Routes de base | 7 | Aucune |
| Routes DB | 5 | Variable |
| API v1 | 18+ | Variable (JWT/API Key) |

---

## 🔓 Routes de Base (Publiques)

| Méthode | Route | Description | Sprint |
|---------|-------|-------------|--------|
| `GET` | `/` | Page d'accueil | Sprint 1 |
| `GET` | `/health` | Vérifie l'état du service | Sprint 1 |
| `GET` | `/health/detailed` | Health check détaillé multi-systèmes | Sprint 3 |
| `GET` | `/health/live` | Health check liveness (Kubernetes) | Sprint 3 |
| `GET` | `/health/ready` | Health check readiness (Kubernetes) | Sprint 3 |
| `GET` | `/version` | Retourne la version déployée | Sprint 1 |
| `GET` | `/metrics` | Métriques Prometheus (17 métriques) | Sprint 3+4 |

---

## 🗄️ Routes Base de Données

| Méthode | Route | Description | Auth | Sprint |
|---------|-------|-------------|------|--------|
| `GET` | `/dbhealth` | Vérifie l'état PostgreSQL | Aucune | Sprint 1 |
| `POST` | `/upload` | Upload fichier (multipart) | `documents:write` | Sprint 1 |
| `GET` | `/documents` | Liste paginée documents | `documents:read` | Sprint 1 |
| `GET` | `/documents/:id` | Récupère document par ID | `documents:read` | Sprint 1 |
| `GET` | `/download/:id` | Télécharge document par ID | `documents:read` | Sprint 1 |

---

## 📡 API v1 — Ingestion Documents

| Méthode | Route | Description | Auth | Sprint |
|---------|-------|-------------|------|--------|
| `POST` | `/api/v1/invoices` | Ingestion documents Odoo (JSON + base64) + Compatibilité DVIG | `documents:write` | Sprint 1 + 8.1 |
| `GET` | `/api/v1/invoices` | 405 Method Not Allowed | - | Sprint 1 |
| `POST` | `/api/v1/push_document` | Push document avec garantie JSON | `documents:write` | Sprint 8 |

---

## 🔐 API v1 — Vérification & Preuves

| Méthode | Route | Description | Auth | Sprint |
|---------|-------|-------------|------|--------|
| `GET` | `/jwks.json` | JWKS (JSON Web Key Set) | Aucune | Sprint 2 |
| `GET` | `/api/v1/ledger/export` | Export ledger (JSON/CSV) avec pagination | `ledger:read` | Sprint 2 |
| `GET` | `/api/v1/ledger/export?document_id=<uuid>` | Export ledger par document_id | `ledger:read` | Sprint 8 |
| `GET` | `/api/v1/ledger/verify/:document_id` | Vérification intégrité | `documents:verify` | Sprint 3 |
| `GET` | `/api/v1/ledger/verify/:document_id?signed=true` | Vérification avec preuve JWS | `documents:verify` | Sprint 3 |

---

## 📋 API v1 — Endpoints Proof (Sprint 8)

| Méthode | Route | Description | Auth | Note |
|---------|-------|-------------|------|------|
| `GET` | `/api/v1/proof/account_move/:id` | Preuve facture par ID Odoo | `documents:read` | Inclut `prev_hash` |
| `GET` | `/api/v1/proof/account_payment/:id` | Preuve paiement par ID Odoo | `documents:read` | Inclut `prev_hash` |
| `GET` | `/api/v1/proof/pos_order/:id` | Preuve ticket POS par ID Odoo | `documents:read` | Inclut `prev_hash` |
| `GET` | `/api/v1/proof/pos_payment/:id` | Preuve paiement POS par ID Odoo | `documents:read` | Inclut `prev_hash` |
| `GET` | `/api/v1/proof/pos_zreport/:id` | Preuve Z-Report par ID Odoo | `documents:read` | Non implémenté |
| `POST` | `/api/v1/proof/bulk` | Récupération bulk de preuves | `documents:read` | Inclut `prev_hash` |

---

## 🎫 API v1 — Tickets POS (Sprint 6)

| Méthode | Route | Description | Auth | Sprint |
|---------|-------|-------------|------|--------|
| `POST` | `/api/v1/pos-tickets` | Ingestion tickets POS (JSON) | `documents:write` | Sprint 6 |
| `GET` | `/api/v1/pos-tickets` | 405 Method Not Allowed | - | Sprint 6 |

---

## 💳 API v1 — Paiements

| Méthode | Route | Description | Auth | Sprint |
|---------|-------|-------------|------|--------|
| `POST` | `/api/v1/payments` | Vaultérisation paiements/remboursements | `documents:write` | Payments |
| `GET` | `/api/v1/payments` | 405 Method Not Allowed | - | Payments |

---

## 📊 API v1 — Z-Reports (Sprint 7)

| Méthode | Route | Description | Auth | Sprint |
|---------|-------|-------------|------|--------|
| `POST` | `/api/v1/pos/zreports` | Ingestion Z-Report avec double chaînage | `documents:write` | Sprint 7 |
| `GET` | `/api/v1/evidence/:tenant/:z_id` | Récupération preuve Z-Report | `documents:read` | Sprint 7 |
| `GET` | `/api/v1/health/zreports` | Health check Z-Reports | Aucune | Sprint 7 |

---

## 📝 API v1 — Audit & Observabilité

| Méthode | Route | Description | Auth | Sprint |
|---------|-------|-------------|------|--------|
| `GET` | `/audit/export` | Export logs d'audit paginé (JSON/CSV) | `audit:read` | Sprint 4 |
| `GET` | `/audit/dates` | Liste dates disponibles dans logs | `audit:read` | Sprint 4 |

---

## 🚨 API v1 — Alertes

| Méthode | Route | Description | Auth | Sprint |
|---------|-------|-------------|------|--------|
| `POST` | `/api/v1/alerts/webhook` | Webhook alertes Alertmanager | Aucune | Sprint 4 |

---

## 🔑 Permissions Requises

| Permission | Endpoints |
|------------|-----------|
| `documents:read` | `/documents/*`, `/download/*`, `/api/v1/proof/*`, `/api/v1/evidence/*` |
| `documents:write` | `/upload`, `/api/v1/invoices`, `/api/v1/push_document`, `/api/v1/pos-tickets`, `/api/v1/payments`, `/api/v1/pos/zreports` |
| `documents:verify` | `/api/v1/ledger/verify/*` |
| `ledger:read` | `/api/v1/ledger/export` |
| `audit:read` | `/audit/export`, `/audit/dates` |

---

## 📊 Statistiques

- **Total Endpoints** : 30+
- **Endpoints Publics** : 7
- **Endpoints Protégés** : 23+
- **Endpoints POST** : 8
- **Endpoints GET** : 22+
- **Endpoints avec Auth** : 23+
- **Endpoints sans Auth** : 7

---

## 🆕 Nouveautés Sprint 8

### Option A — Ledger Export Amélioré
- `GET /api/v1/ledger/export?document_id=<uuid>` : Récupération entrée spécifique

### Option B — Prev Hash dans Proof
- Tous les endpoints `/api/v1/proof/*` incluent maintenant `prev_hash`
- Endpoint `/api/v1/proof/bulk` inclut `prev_hash` pour chaque preuve

### Fiabilisation push_document
- `POST /api/v1/push_document` : Garantie JSON obligatoire, middleware anti-panic

---

## 📚 Documentation Complémentaire

- [`PROOF_API.md`](PROOF_API.md) — Documentation complète API Proof
- [`LEDGER_EXPORT_API.md`](LEDGER_EXPORT_API.md) — Documentation Ledger Export
- [`POS_TICKETS_API.md`](POS_TICKETS_API.md) — Documentation Tickets POS
- [`SPECIFICATION_FIABILISATION_PUSH_DOCUMENT.md`](SPECIFICATION_FIABILISATION_PUSH_DOCUMENT.md) — Spécification push_document

---

## 📋 Notes de Compatibilité DVIG (Sprint 8.1)

**Compatibilité DVIG v1.1** : L'API Vault accepte automatiquement les champs DVIG dans `meta` (tenant, correlation_id, dvig_version, etc.) sans impact sur le traitement métier. Ces champs sont ignorés mais `correlation_id` et `tenant` sont loggés pour traçabilité.

**Endpoints compatibles** :
- ✅ `POST /api/v1/invoices` — Logge `correlation_id` et `tenant` depuis `meta`
- ✅ `POST /api/v1/payments` — Logge `correlation_id` depuis `payment`
- ✅ `POST /api/v1/pos-tickets` — Logge `correlation_id` depuis `ticket`
- ✅ `POST /api/v1/push_document` — Logge `correlation_id` et `tenant` depuis `meta`

**Documentation** : Voir `docs/DVIG_COMPATIBILITY.md` pour plus de détails.

---

**Document créé le** : 2025-11-25  
**Dernière mise à jour** : 2025-11-26 (Sprint 8.1 - Compatibilité DVIG)  
**Version API** : v1.6.2

