# 🚀 Dorevia Vault

**Dorevia Vault** est un **proxy d'intégrité** pour documents électroniques, garantissant la traçabilité et la vérifiabilité selon la **règle des 3V** :
- **Validé** → Document validé dans Odoo
- **Vaulté** → Stocké de manière sécurisée dans Dorevia Vault
- **Vérifiable** → Preuve d'intégrité via JWS + Ledger

Il constitue la brique "coffre documentaire" du projet **Doreviateam**,  
destiné à héberger, indexer et archiver de manière souveraine  
les documents électroniques (Factur-X, pièces jointes, rapports, etc.)

---

## ✨ Fonctionnalités Principales

### Sprint 1 — MVP "Validé → Vaulté"
- ✅ **Ingestion Odoo** : Endpoint `/api/v1/invoices` pour documents Odoo
- ✅ **Transaction atomique** : Garantit cohérence fichier ↔ base de données
- ✅ **Idempotence** : Détection doublons par SHA256
- ✅ **Métadonnées enrichies** : Source, modèle Odoo, état, métadonnées facture

### Sprint 2 — Documents "Vérifiables"
- ✅ **Scellement JWS** : Signature RS256 (RSA-SHA256) conforme RFC 7515
- ✅ **Ledger hash-chaîné** : Traçabilité immuable avec verrou transactionnel
- ✅ **JWKS public** : Endpoint `/jwks.json` pour vérification externe
- ✅ **Export Ledger** : Export JSON/CSV avec pagination
- ✅ **Mode dégradé** : Continuité de service si JWS échoue (optionnel)

### Sprint 3 — "Expert Edition" (Complété)
- ✅ **Health checks avancés** : Endpoint `/health/detailed` avec vérification multi-systèmes
- ✅ **Métriques Prometheus** : 11 métriques actives (counters + histogrammes) via `/metrics`
- ✅ **Sécurité renforcée** : Middlewares Helmet, Recover, RequestID
- ✅ **Vérification intégrité** : Endpoint `/api/v1/ledger/verify/:id` avec preuve JWS signée
- ✅ **Réconciliation automatique** : CLI `bin/reconcile` pour détection et correction fichiers orphelins

### Sprint 4 — "Observabilité & Auditabilité Continue" (Complété — 100%)
- ✅ **Observabilité avancée** : 6 métriques système (CPU, RAM, disque) + `ledger_append_errors_total`
- ✅ **Collecteur automatique** : Mise à jour métriques système toutes les 30s
- ✅ **Journalisation auditable** : Logs signés JSONL avec export paginé (Phase 4.2)
- ✅ **Alerting & supervision** : Alertes Prometheus + Alertmanager + Export Odoo (Phase 4.3)
- ✅ **Audit & conformité** : Rapports signés mensuels/trimestriels (Phase 4.4)

### Sprint 5 — "Sécurité & Interopérabilité" (Complété — 100%)
- ✅ **Sécurité & Key Management** : Intégration HashiCorp Vault, rotation multi-KID, chiffrement au repos (Phase 5.1)
- ✅ **Authentification & Autorisation** : JWT/API Keys, RBAC avec 4 rôles, protection endpoints (Phase 5.2)
- ✅ **Interopérabilité** : Validation Factur-X EN 16931, webhooks asynchrones Redis (Phase 5.3)
- ✅ **Scalabilité** : Partitionnement ledger mensuel, optimisations base de données (Phase 5.4)

### Sprint 6 — "Ingestion Native Tickets POS" (Complété — 100%)
- ✅ **Architecture modulaire** : Interfaces abstraites (DocumentRepository, ledger.Service, crypto.Signer) pour extensibilité (Phase 0)
- ✅ **Canonicalisation JSON** : Tri des clés, suppression null, normalisation nombres pour stabilité des hash (Phase 1)
- ✅ **Service métier POS** : Idempotence métier stricte basée sur `ticket + source_id + pos_session` (Phase 3)
- ✅ **Endpoint API** : `POST /api/v1/pos-tickets` pour ingestion native tickets POS au format JSON (Phase 4)
- ✅ **Observabilité** : Métriques Prometheus et logs structurés pour monitoring (Phase 5)
- ✅ **Tests exhaustifs** : 25 tests (20 unitaires + 5 intégration) — 100% de réussite (Phase 6)

### Sprint 7 — "Z-Reports avec Double Chaînage Cryptographique" (Complété — 100%)
- ✅ **Ledger filesystem dédié** : Stockage immuable des Z-Reports séparé du ledger PostgreSQL (Phase 1)
- ✅ **Double chaînage** : Chaînage entre Z-Reports (`hash_prev`) et chaînage avec tickets POS (`last_ticket_hash`) (Phase 3)
- ✅ **Preuve JWS** : Signature cryptographique pour chaque Z-Report avec payload structuré (Phase 3)
- ✅ **Validation multi-niveaux** : Validation tenant, payload, hash_prev, last_ticket_hash (Phase 2)
- ✅ **Endpoints API** : `POST /api/v1/pos/zreports`, `GET /api/v1/evidence/:tenant/:z_id`, `GET /api/v1/health/zreports` (Phase 4-5)
- ✅ **Observabilité** : Métriques Prometheus spécifiques Z-Reports (Phase 5)
- ✅ **Tests d'intégration** : 6 tests end-to-end couvrant succès, erreurs et chaînage (Phase 6)
- ✅ **Améliorations v1.5.1** : `last_ticket_hash` optionnel pour Z-Reports sans tickets (`tickets_count = 0`)
- ✅ **Corrections v1.5.2** : Support signature JWS pour Z-Reports (ZReportEvidencePayload), amélioration messages d'erreur
- ✅ **Corrections Sécurité v1.5.3** : 12 corrections de sécurité (Path Traversal, Information Disclosure, DoS Protection, Rate Limiting, Log Sanitization, Validation MIME, CORS restrictif)

### Endpoint Payments — "Vaultérisation des Paiements" (Complété — 100%)
- ✅ **Endpoint API** : `POST /api/v1/payments` pour vaultérisation des paiements et remboursements
- ✅ **Support complet** : Paiements POS, factures clients/fournisseurs, remboursements
- ✅ **Idempotence** : Basée sur hash SHA256 du payload canonicalisé
- ✅ **Validation stricte** : Champs obligatoires, formats, valeurs autorisées, cohérence tenant
- ✅ **Intégration** : JWS + Ledger (si configurés), stockage dans table `documents`
- ✅ **Tests** : Tests unitaires et d'intégration complets

### Sprint 8 — "Endpoints Proof pour dorevia_vault_report" (Complété — 100%)
- ✅ **Endpoints Proof** : `GET /api/v1/proof/*` pour récupération preuves par ID Odoo (account_move, account_payment, pos_order, pos_payment)
- ✅ **Bulk Fetch** : `POST /api/v1/proof/bulk` pour récupération multiple de preuves en un appel
- ✅ **Option B - prev_hash inclus** : Champ `prev_hash` automatiquement inclus dans toutes les réponses proof (chaînage cryptographique)
- ✅ **Option A - Ledger Export amélioré** : Paramètre `document_id` dans `/api/v1/ledger/export` pour récupération entrée spécifique
- ✅ **Performance optimisée** : 1 appel API au lieu de 2 pour récupérer preuve + prev_hash
- ✅ **Index base de données** : Index composite pour recherche rapide par `source_model` + `source_id`
- ✅ **Fiabilisation push_document** : Endpoint `/api/v1/push_document` avec garantie JSON obligatoire, middleware anti-panic, contrat API strict
- ✅ **Documentation complète** : API Proof, Ledger Export, guides d'intégration

### Sprint 8.1 — "Compatibilité DVIG v1.1" (Complété — 100%)
- ✅ **Compatibilité DVIG** : L'API tolère et ignore les champs DVIG dans `meta` (tenant, correlation_id, dvig_version, etc.)
- ✅ **Logging de traçabilité** : `correlation_id` et `tenant` loggés dans tous les handlers pour debugging DVIG ↔ Vault
- ✅ **Rétrocompatibilité** : Les payloads sans champs DVIG continuent de fonctionner sans modification
- ✅ **Tests d'intégration** : 8 tests validant compatibilité DVIG (payloads enrichis, rétrocompatibilité, champs inconnus)
- ✅ **Documentation** : Guide de référence DVIG, réponse équipe DVIG, mise à jour API documentation

### Améliorations Robustesse — "Fiabilisation push_document" (Décembre 2025)
- ✅ **Retry avec backoff** : Mécanisme de retry (3 tentatives) avec backoff exponentiel pour gérer les problèmes de timing
- ✅ **Gestion d'erreur améliorée** : Distinction entre erreurs critiques (document inexistant) et erreurs temporaires
- ✅ **Logs améliorés** : Logs détaillés avec tenant, file_path, sha256 pour faciliter le diagnostic
- ✅ **Vérification post-commit** : Vérification que le document est visible après le commit avec logs d'avertissement
- ✅ **Endpoint de diagnostic** : Endpoint optionnel `/api/v1/diagnostic/document/:id` pour vérifier l'état d'un document

---

## 🌍 Environnement

| Élément | Détail |
| :-- | :-- |
| **Langage** | Go 1.23+ |
| **Framework HTTP** | [Fiber](https://github.com/gofiber/fiber) v2.52.9 |
| **Base de données** | PostgreSQL (avec pgxpool) |
| **Reverse Proxy** | Caddy (HTTPS automatique via Let's Encrypt) |
| **Logging** | Zerolog (JSON structuré) |
| **Domaine** | [https://vault.doreviateam.com](https://vault.doreviateam.com) |
| **Version actuelle** | **v1.2.0** (Améliorations robustesse push_document - Décembre 2025) |
| **Auteur / Mainteneur** | [David Baron – Doreviateam](https://doreviateam.com) |

---

## 🔧 Endpoints disponibles (v1.6.1+)

### Routes de base (toujours actives)

| Méthode | Route | Description |
| :-- | :-- | :-- |
| `GET` | `/` | Page d'accueil |
| `GET` | `/health` | Vérifie l'état du service |
| `GET` | `/health/detailed` | Health check détaillé multi-systèmes (Sprint 3) |
| `GET` | `/version` | Retourne la version déployée |
| `GET` | `/metrics` | Métriques Prometheus (17 métriques actives - Sprint 3+4) |
| `GET` | `/audit/export` | Export logs d'audit paginé (JSON/CSV) (Sprint 4 Phase 4.2) |
| `GET` | `/audit/dates` | Liste des dates disponibles dans les logs (Sprint 4 Phase 4.2) |

### Routes avec base de données (si `DATABASE_URL` configuré)

| Méthode | Route | Description |
| :-- | :-- | :-- |
| `GET` | `/dbhealth` | Vérifie l'état de la connexion PostgreSQL |
| `POST` | `/upload` | Upload de fichier (multipart/form-data) |
| `GET` | `/documents` | Liste paginée des documents (avec recherche et filtres) |
| `GET` | `/documents/:id` | Récupère un document par son ID (UUID) |
| `GET` | `/download/:id` | Télécharge un document par son ID |

### Routes Sprint 1 — Ingestion Odoo

| Méthode | Route | Description |
| :-- | :-- | :-- |
| `POST` | `/api/v1/invoices` | Ingestion documents Odoo (JSON + base64) avec JWS + Ledger |

**Note** : L'API accepte des champs supplémentaires dans `meta` (DVIG compatibility). Ces champs sont ignorés pour le traitement métier mais peuvent être utilisés pour la traçabilité. Le `correlation_id` et `tenant` sont automatiquement loggés pour faciliter le debugging. Voir `docs/DVIG_COMPATIBILITY.md` et `docs/PROOF_API.md` pour plus de détails.

### Routes Sprint 2 — Vérification & Export

| Méthode | Route | Description |
| :-- | :-- | :-- |
| `GET` | `/jwks.json` | JWKS (JSON Web Key Set) pour vérification JWS |
| `GET` | `/api/v1/ledger/export` | Export ledger (JSON/CSV) avec pagination ou par document_id (Sprint 8) |

### Routes Sprint 3 — Supervision & Vérification

| Méthode | Route | Description |
| :-- | :-- | :-- |
| `GET` | `/health/detailed` | Health check détaillé (Database, Storage, JWS, Ledger) |
| `GET` | `/metrics` | Métriques Prometheus (17 métriques : métier + système) |
| `GET` | `/api/v1/ledger/verify/:document_id` | Vérification intégrité (fichier ↔ DB ↔ Ledger) |
| `GET` | `/api/v1/ledger/verify/:document_id?signed=true` | Vérification avec preuve JWS signée |

### Routes Sprint 4 — Audit & Observabilité

| Méthode | Route | Description |
| :-- | :-- | :-- |
| `GET` | `/audit/export` | Export logs d'audit paginé (JSON/CSV) avec filtres date |
| `GET` | `/audit/dates` | Liste des dates disponibles dans les logs |

### Routes Sprint 5 — Sécurité & Interopérabilité

| Méthode | Route | Description | Authentification |
| :-- | :-- | :-- | :-- |
| `POST` | `/api/v1/invoices` | Ingestion avec validation Factur-X (Phase 5.3) | `documents:write` |
| `GET` | `/api/v1/ledger/verify/:id` | Vérification intégrité (webhook émis) | `documents:verify` |
| `GET` | `/audit/export` | Export audit (protégé) | `audit:read` |
| `GET` | `/api/v1/ledger/export` | Export ledger (protégé) | `ledger:read` |

### Routes Sprint 6 — Ingestion Native Tickets POS

| Méthode | Route | Description | Authentification |
| :-- | :-- | :-- | :-- |
| `POST` | `/api/v1/pos-tickets` | Ingestion native tickets POS (JSON) avec idempotence métier | `documents:write` |
| `GET` | `/api/v1/pos-tickets` | 405 Method Not Allowed (seul POST autorisé) | - |

### Routes Payments — Vaultérisation des Paiements

| Méthode | Route | Description | Authentification |
| :-- | :-- | :-- | :-- |
| `POST` | `/api/v1/payments` | Vaultérisation paiements et remboursements (POS et factures) | `documents:write` |
| `GET` | `/api/v1/payments` | 405 Method Not Allowed (seul POST autorisé) | - |

### Routes Sprint 7 — Z-Reports avec Double Chaînage

| Méthode | Route | Description | Authentification |
| :-- | :-- | :-- | :-- |
| `POST` | `/api/v1/pos/zreports` | Ingestion Z-Report avec double chaînage cryptographique | `documents:write` |
| `GET` | `/api/v1/evidence/:tenant/:z_id` | Récupération preuve d'intégrité Z-Report | `documents:read` |
| `GET` | `/api/v1/health/zreports` | Health check système Z-Reports (ledger filesystem) | Aucune |

### Routes Sprint 8 — Endpoints Proof pour dorevia_vault_report

| Méthode | Route | Description | Authentification |
| :-- | :-- | :-- | :-- |
| `GET` | `/api/v1/proof/account_move/:id` | Récupération preuve facture par ID Odoo (inclut `prev_hash`) | `documents:read` |
| `GET` | `/api/v1/proof/account_payment/:id` | Récupération preuve paiement par ID Odoo (inclut `prev_hash`) | `documents:read` |
| `GET` | `/api/v1/proof/pos_order/:id` | Récupération preuve ticket POS par ID Odoo (inclut `prev_hash`) | `documents:read` |
| `GET` | `/api/v1/proof/pos_payment/:id` | Récupération preuve paiement POS par ID Odoo (inclut `prev_hash`) | `documents:read` |
| `GET` | `/api/v1/proof/pos_zreport/:id` | Récupération preuve Z-Report par ID Odoo (non implémenté) | `documents:read` |
| `POST` | `/api/v1/proof/bulk` | Récupération bulk de plusieurs preuves (inclut `prev_hash` pour chaque) | `documents:read` |
| `POST` | `/api/v1/push_document` | Push document avec garantie JSON + retry + logs améliorés | `documents:write` |
| `GET` | `/api/v1/diagnostic/document/:id` | Diagnostic état document (optionnel) | `documents:read` |

**Note Sprint 8** : Tous les endpoints proof incluent automatiquement le champ `prev_hash` (Option B) pour le chaînage cryptographique. Le paramètre `document_id` est également supporté dans `/api/v1/ledger/export` (Option A). L'endpoint `/api/v1/push_document` garantit toujours une réponse JSON, même en cas d'erreur ou de panic, avec retry automatique et logs améliorés pour faciliter le diagnostic.

**Exemples** :
```bash
# Version
curl -s https://vault.doreviateam.com/version
# → {"version":"1.0"}

# Health check DB
curl -s https://vault.doreviateam.com/dbhealth
# → {"status":"ok","message":"Database connection healthy"}

# Upload fichier
curl -F "file=@document.pdf" https://vault.doreviateam.com/upload

# Ingestion Odoo (Sprint 1)
curl -X POST https://vault.doreviateam.com/api/v1/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "source": "sales",
    "model": "account.move",
    "odoo_id": 123,
    "state": "posted",
    "file": "base64_encoded_content",
    "filename": "invoice_001.pdf"
  }'
# → {"id":"uuid","sha256_hex":"...","evidence_jws":"...","ledger_hash":"..."}

# JWKS (Sprint 2)
curl https://vault.doreviateam.com/jwks.json
# → {"keys":[{"kty":"RSA","kid":"key-2025-Q1",...}]}

# Export Ledger (Sprint 2)
curl "https://vault.doreviateam.com/api/v1/ledger/export?format=json&limit=10"

# Export Ledger par document_id (Sprint 8 - Option A)
curl "https://vault.doreviateam.com/api/v1/ledger/export?document_id=550e8400-e29b-41d4-a716-446655440000&format=json"

# Health détaillé (Sprint 3)
curl https://vault.doreviateam.com/health/detailed

# Métriques Prometheus (Sprint 3+4)
curl https://vault.doreviateam.com/metrics
# → Expose 17 métriques : métier (Sprint 3) + système (Sprint 4)

# Export logs d'audit (Sprint 4 Phase 4.2)
curl "https://vault.doreviateam.com/audit/export?from=2025-01-15&to=2025-01-17&page=1&limit=100&format=json"
# → Export paginé des logs d'audit

# Liste dates disponibles (Sprint 4 Phase 4.2)
curl https://vault.doreviateam.com/audit/dates
# → {"dates":["2025-01-15","2025-01-16"],"count":2}

# Génération rapport d'audit (Sprint 4 Phase 4.4)
./bin/audit --period monthly --year 2025 --month 1 --format json --sign --output report-2025-01.json
# → Rapport mensuel JSON signé

./bin/audit --period quarterly --year 2025 --quarter 1 --format pdf --sign --output report-Q1-2025.pdf
# → Rapport trimestriel PDF signé (8 pages)

# Vérification intégrité (Sprint 3)
curl https://vault.doreviateam.com/api/v1/ledger/verify/123e4567-e89b-12d3-a456-426614174000

# Vérification avec preuve JWS (Sprint 3)
curl "https://vault.doreviateam.com/api/v1/ledger/verify/123e4567-e89b-12d3-a456-426614174000?signed=true"

# Liste documents avec recherche
curl "https://vault.doreviateam.com/documents?search=facture&page=1&limit=20"

# Téléchargement
curl -O https://vault.doreviateam.com/download/{uuid}

# Ingestion ticket POS (Sprint 6)
curl -X POST https://vault.doreviateam.com/api/v1/pos-tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tenant": "laplatine",
    "source_model": "pos.order",
    "source_id": "POS/2025/0001",
    "currency": "EUR",
    "total_incl_tax": 12.50,
    "total_excl_tax": 10.42,
    "pos_session": "SESSION/2025/01/14-01",
    "cashier": "Verena",
    "location": "La Platine - Boutique",
    "ticket": {
      "lines": [{"product": "Crêpe Manioc Sucre", "quantity": 2, "unit_price": 3.50}],
      "payments": [{"method": "CB", "amount": 12.50}]
    }
  }'
# → {"id":"uuid","tenant":"laplatine","sha256_hex":"...","ledger_hash":"...","evidence_jws":"...","created_at":"..."}

# Ingestion paiement (Payments)
curl -X POST https://vault.doreviateam.com/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant: laplatine" \
  -d '{
    "tenant": "laplatine",
    "source_system": "odoo",
    "source_model": "account.payment",
    "source_id": "PAY/2025/00123",
    "payment_date": "2025-01-18T10:00:00Z",
    "amount": 100.50,
    "currency": "EUR",
    "method": "cash",
    "source": "pos",
    "payment_direction": "inbound",
    "is_refund": false,
    "company_id": 1,
    "payment": {
      "pos_order_ref": "ORDER/001",
      "session_id": "SESSION/001"
    }
  }'

# Récupération preuve facture (Sprint 8 - Option B : prev_hash inclus)
curl -X GET https://vault.doreviateam.com/api/v1/proof/account_move/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
# → {"id":"uuid","hash":"sha256","ledger":"ledger_id","prev_hash":"previous_hash","timestamp":"2025-01-15T10:30:00Z","jws":"...","status":"verified"}

# Récupération preuve paiement (Sprint 8)
curl -X GET https://vault.doreviateam.com/api/v1/proof/account_payment/456 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Récupération preuve ticket POS (Sprint 8)
curl -X GET "https://vault.doreviateam.com/api/v1/proof/pos_order/POS%2F2025%2F0001" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Récupération bulk de preuves (Sprint 8 - Option B : prev_hash inclus pour chaque)
curl -X POST https://vault.doreviateam.com/api/v1/proof/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {"type": "account_move", "id": "123"},
      {"type": "account_move", "id": "124"},
      {"type": "account_payment", "id": "456"}
    ]
  }'
# → {"results":[{"type":"account_move","id":"123","proof":{"id":"uuid","hash":"sha256","prev_hash":"...","timestamp":"...","status":"verified"}}, ...]}
```

---

## 🧱 Structure

```
/opt/dorevia-vault/
 ├── cmd/
 │   ├── vault/main.go          # Point d'entrée de l'application
 │   ├── keygen/main.go         # Générateur de clés RSA + JWKS (Sprint 2)
 │   ├── reconcile/main.go      # Script réconciliation fichiers orphelins (Sprint 3)
 │   ├── audit/main.go          # CLI génération rapports d'audit (Sprint 4 Phase 4.4)
 │   └── token-gen/main.go      # Générateur de tokens JWT (Sprint 6)
 ├── internal/
 │   ├── config/                # Configuration centralisée
 │   ├── handlers/              # Handlers HTTP (13+ handlers incluant POS)
 │   ├── middleware/            # Middlewares (CORS, rate limiting, logger)
 │   ├── models/                # Modèles de données
 │   ├── storage/               # PostgreSQL + requêtes + transactions + Repository interface (Sprint 6)
 │   ├── crypto/                # Module JWS (Sprint 2) + Signer interface (Sprint 6)
 │   ├── ledger/                # Module Ledger hash-chaîné (Sprint 2) + Service interface (Sprint 6)
 │   ├── services/              # Services métier incluant POS (Sprint 6)
 │   ├── utils/                 # Utilitaires incluant canonicalisation JSON (Sprint 6)
 │   ├── health/                # Health checks avancés (Sprint 3)
 │   ├── metrics/               # Métriques Prometheus (Sprint 3+4)
 │   ├── verify/                # Vérification intégrité (Sprint 3)
 │   ├── reconcile/             # Réconciliation fichiers orphelins (Sprint 3)
 │   └── audit/                 # Journalisation auditable + rapports (Sprint 4 Phase 4.2+4.4)
 │       ├── log.go             # Logger audit JSONL signé (Phase 4.2)
 │       ├── export.go          # Export logs paginé (Phase 4.2)
 │       ├── sign.go            # Signature journalière (Phase 4.2)
 │       ├── report.go          # Génération rapports JSON/CSV (Phase 4.4)
 │       └── pdf.go             # Génération rapports PDF (Phase 4.4)
 ├── pkg/logger/                # Logger structuré (zerolog)
 ├── tests/
 │   ├── unit/                  # Tests unitaires (165+ tests)
 │   └── integration/           # Tests d'intégration (Sprint 2 + Sprint 6)
 ├── migrations/                # Migrations SQL (001, 002, 003, 004, 005)
 ├── scripts/
 │   ├── deploy.sh              # Script de déploiement général
 │   ├── deploy_sprint6.sh      # Script de déploiement Sprint 6 (Sprint 6)
 │   └── build.sh               # Script de build avec métadonnées
 ├── storage/                   # Stockage fichiers (YYYY/MM/DD/)
 └── docs/                      # Documentation complète
```

---

## ⚙️ Configuration

Le service utilise des variables d'environnement pour la configuration :

### Configuration de base

| Variable | Description | Défaut |
| :-- | :-- | :-- |
| `PORT` | Port d'écoute du serveur | `8080` |
| `LOG_LEVEL` | Niveau de log (debug, info, warn, error) | `info` |
| `DATABASE_URL` | URL de connexion PostgreSQL | *(optionnel)* |
| `STORAGE_DIR` | Répertoire de stockage des fichiers | `/opt/dorevia-vault/storage` |
| `AUDIT_DIR` | Répertoire de stockage des logs d'audit | `/opt/dorevia-vault/audit` |

### Configuration JWS (Sprint 2)

| Variable | Description | Défaut |
| :-- | :-- | :-- |
| `JWS_ENABLED` | Activer le scellement JWS | `true` |
| `JWS_REQUIRED` | JWS obligatoire (sinon mode dégradé) | `true` |
| `JWS_PRIVATE_KEY_PATH` | Chemin clé privée RSA (PEM) | *(optionnel)* |
| `JWS_PUBLIC_KEY_PATH` | Chemin clé publique RSA (PEM) | *(optionnel)* |
| `JWS_KID` | Key ID pour JWKS | `key-2025-Q1` |

### Configuration Ledger (Sprint 2)

| Variable | Description | Défaut |
| :-- | :-- | :-- |
| `LEDGER_ENABLED` | Activer le ledger hash-chaîné | `true` |

**Exemple de configuration complète** :
```bash
# Configuration de base
export PORT=8080
export LOG_LEVEL=info
export DATABASE_URL="postgres://vault:password@localhost:5432/dorevia_vault?sslmode=disable"
export STORAGE_DIR="/opt/dorevia-vault/storage"

# Configuration JWS (Sprint 2)
export JWS_ENABLED=true
export JWS_REQUIRED=true
export JWS_PRIVATE_KEY_PATH="/opt/dorevia-vault/keys/private.pem"
export JWS_PUBLIC_KEY_PATH="/opt/dorevia-vault/keys/public.pem"
export JWS_KID="key-2025-Q1"

# Configuration Ledger (Sprint 2)
export LEDGER_ENABLED=true

# Configuration Audit (Sprint 4 Phase 4.2)
export AUDIT_DIR="/opt/dorevia-vault/audit"

# Configuration Authentification (Sprint 5 Phase 5.2)
export AUTH_ENABLED=true
export AUTH_JWT_ENABLED=true
export AUTH_APIKEY_ENABLED=true
export AUTH_JWT_PUBLIC_KEY_PATH="/opt/dorevia-vault/keys/jwt-public.pem"

# Configuration HashiCorp Vault (Sprint 5 Phase 5.1 - optionnel)
export VAULT_ENABLED=false
# export VAULT_ADDR="https://vault.example.com:8200"
# export VAULT_TOKEN="hvs.xxxxx"
# export VAULT_KEY_PATH="secret/data/dorevia/keys"

# Configuration Factur-X (Sprint 5 Phase 5.3)
export FACTURX_VALIDATION_ENABLED=true
export FACTURX_VALIDATION_REQUIRED=false

# Configuration Webhooks (Sprint 5 Phase 5.3 - optionnel)
export WEBHOOKS_ENABLED=false
# export WEBHOOKS_REDIS_URL="redis://localhost:6379/0"
# export WEBHOOKS_SECRET_KEY="$(openssl rand -hex 32)"
# export WEBHOOKS_WORKERS=3
# export WEBHOOKS_URLS="document.vaulted:https://example.com/webhook/vaulted"

# Configuration POS (Sprint 6)
export POS_TICKET_MAX_SIZE_BYTES=65536  # 64 KB par défaut

# Configuration Payments
export PAYMENT_MAX_SIZE_BYTES=65536  # 64 KB par défaut

# Configuration Z-Reports (Sprint 7)
export LEDGER_FILESYSTEM_PATH=/opt/dorevia-vault/ledger
export ZREPORT_MAX_SIZE_BYTES=1048576  # 1 MB par défaut
export ZREPORT_FSYNC_ENABLED=true

# ✅ SÉCURITÉ : Limites upload (Phase 2 - Janvier 2025)
export MAX_UPLOAD_SIZE_BYTES=10485760      # 10 MB par défaut
export MAX_BASE64_SIZE_BYTES=15728640       # 15 MB (compense overhead base64 ~33%)

# ✅ SÉCURITÉ : Rate Limiting (Phase 3 - Janvier 2025)
export RATE_LIMIT_MAX_REQUESTS=100          # Requêtes/min (défaut)
export RATE_LIMIT_EXPIRATION_SEC=60         # Période en secondes (défaut)
export RATE_LIMIT_UPLOAD_MAX=20             # Uploads/min (défaut)
export RATE_LIMIT_UPLOAD_EXP_SEC=60         # Période uploads (défaut)

# ✅ SÉCURITÉ : CORS (Phase 3 - Janvier 2025)
export CORS_ALLOWED_ORIGINS="*"             # Toutes origines (défaut)
# Exemple restrictif pour production:
# export CORS_ALLOWED_ORIGINS="https://vault.doreviateam.com,https://app.doreviateam.com"
```

**Génération des clés RSA** :
```bash
# Générer paire de clés + JWKS
go run ./cmd/keygen/main.go \
  --out /opt/dorevia-vault/keys \
  --kid key-2025-Q1 \
  --bits 2048

# Sécuriser les permissions
chmod 600 /opt/dorevia-vault/keys/private.pem
chmod 644 /opt/dorevia-vault/keys/public.pem
```

**Génération de tokens JWT** (Sprint 6) :
```bash
# Compiler l'outil
go build -o bin/token-gen ./cmd/token-gen/main.go

# Générer un token pour instance Odoo (opérateur, 1 an)
./bin/token-gen -sub rdo18 -role operator -exp 365

# Générer un token de test (30 jours)
./bin/token-gen -sub test-user -role operator -exp 30

# Générer un token sans expiration
./bin/token-gen -sub rdo18 -role operator -exp 0
```

Voir [`docs/GENERATION_TOKEN_JWT.md`](docs/GENERATION_TOKEN_JWT.md) pour plus de détails.

**Configuration rapide** :
```bash
# Utiliser le script de configuration automatique
source /opt/dorevia-vault/setup_env.sh

# Le script configure toutes les variables d'environnement
# et vérifie les prérequis (clés RSA, PostgreSQL, etc.)
# Inclut maintenant les variables Sprint 5 (Auth, Vault, Factur-X, Webhooks)
```

---

## 🚀 Déploiement

Voir la documentation complète :  
👉 [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)  
👉 [`docs/INTEGRATION_POSTGRESQL_DOREVIA_VAULT_v0.1.md`](docs/INTEGRATION_POSTGRESQL_DOREVIA_VAULT_v0.1.md)

Pour un déploiement rapide :
```bash
# Déploiement général
./scripts/deploy.sh

# Déploiement Sprint 6 spécifique (avec vérifications)
sudo ./scripts/deploy_sprint6.sh

# ✅ Déploiement Corrections Sécurité (Janvier 2025)
sudo ./scripts/deploy_security_fixes.sh
```

**Note** : Pour le Sprint 6, appliquer d'abord la migration DB :
```bash
psql $DATABASE_URL -f migrations/005_add_pos_fields.sql
```

**Documentation déploiement sécurité** :
- [`docs/PLAN_REDEPLOIEMENT_SECURITE.md`](docs/PLAN_REDEPLOIEMENT_SECURITE.md) — Plan de déploiement détaillé
- [`docs/RESUME_DEPLOIEMENT_SECURITE.md`](docs/RESUME_DEPLOIEMENT_SECURITE.md) — Guide rapide
- [`docs/SUIVI_CORRECTIONS_SECURITE.md`](docs/SUIVI_CORRECTIONS_SECURITE.md) — Suivi des corrections

Voir [`docs/DEPLOIEMENT_SPRINT6.md`](docs/DEPLOIEMENT_SPRINT6.md) pour le guide complet Sprint 6.

---

## 🧪 Tests

Le projet inclut une suite de tests unitaires complète :

```bash
# Exécuter tous les tests
go test ./tests/unit/... -v

# Tests spécifiques
go test ./tests/unit/... -run TestJWS -v      # Tests JWS (15 tests)
go test ./tests/unit/... -run TestLedger -v   # Tests Ledger (4 tests)

# Avec couverture
go test ./tests/unit/... -coverprofile=coverage.out

# Tests d'intégration (nécessitent DATABASE_URL)
export TEST_DATABASE_URL="postgres://user:pass@localhost/dorevia_vault_test"
go test ./tests/integration/... -v
```

**Statistiques** :
- ✅ **165+ tests unitaires** — 100% de réussite
  - 19 tests existants (Sprint 1)
  - 15 tests JWS (Sprint 2)
  - 4 tests Ledger (Sprint 2)
  - 15 tests Health (Sprint 3 Phase 1)
  - 22 tests Verify/Reconcile (Sprint 3 Phase 3)
  - 11 tests Metrics System (Sprint 4 Phase 4.1)
  - 16 tests Audit (Sprint 4 Phase 4.2)
  - 15+ tests Report (Sprint 4 Phase 4.4)
  - 14 tests PDF (Sprint 4 Phase 4.4)
  - 10 tests CLI (Sprint 4 Phase 4.4)
  - 20 tests Sprint 6 (canonicalisation, service, handler, signer)
  - 13 tests autres
- ✅ **Tests d'intégration** — 5 tests Sprint 6 (end-to-end, idempotence, canonicalisation, métriques)

---

## 📊 Génération Rapports d'Audit

**Dorevia Vault** permet de générer des **rapports d'audit** consolidés (mensuels/trimestriels) pour la conformité réglementaire (PDP/PPF 2026).

### Formats Disponibles

| Format | Description | Usage |
|:-------|:------------|:------|
| **JSON** | Format structuré complet avec toutes les données | Intégration, traitement automatique |
| **CSV** | Format simplifié avec colonnes principales | Analyse Excel, import dans outils |
| **PDF** | Document professionnel signé (8 pages) | Conformité, archivage, présentation |

### Installation CLI

```bash
# Compiler le binaire
go build -o bin/audit ./cmd/audit

# Ou avec version/commit
go build -ldflags "-X main.Version=$(git describe --tags) -X main.Commit=$(git rev-parse HEAD)" -o bin/audit ./cmd/audit
```

### Exemples d'Utilisation

#### Rapport mensuel JSON

```bash
./bin/audit --period monthly --year 2025 --month 1 --format json --output report-2025-01.json
```

#### Rapport trimestriel PDF signé

```bash
./bin/audit --period quarterly --year 2025 --quarter 1 --format pdf --sign --output report-Q1-2025.pdf
```

#### Rapport personnalisé CSV

```bash
./bin/audit --period custom --from 2025-01-15 --to 2025-01-31 --format csv --output report-custom.csv
```

#### Rapport mensuel JSON signé (mois actuel)

```bash
./bin/audit --period monthly --format json --sign --output report-current.json
```

### Flags Disponibles

| Flag | Description | Défaut | Requis |
|:-----|:------------|:-------|:-------|
| `--period` | Type de période (monthly, quarterly, custom) | - | ✅ |
| `--year` | Année (pour monthly/quarterly) | Année actuelle | - |
| `--month` | Mois 1-12 (pour monthly) | Mois actuel | - |
| `--quarter` | Trimestre 1-4 (pour quarterly) | Trimestre actuel | - |
| `--from` | Date début YYYY-MM-DD (pour custom) | - | Si custom |
| `--to` | Date fin YYYY-MM-DD (pour custom) | - | Si custom |
| `--format` | Format (json, csv, pdf) | json | - |
| `--output` | Chemin fichier de sortie | stdout (json/csv) ou report-YYYY-MM-DD.pdf | - |
| `--sign` | Signer le rapport avec JWS | false | - |
| `--jws-key-path` | Chemin clé privée JWS | JWS_PRIVATE_KEY_PATH env | - |
| `--audit-dir` | Répertoire audit | AUDIT_DIR env | - |
| `--database-url` | URL base de données | DATABASE_URL env | - |
| `--verbose` | Mode verbeux | false | - |
| `--help` | Afficher l'aide | - | - |

### Contenu des Rapports

Les rapports incluent :

- **Résumé exécutif** : Total documents, taux d'erreur, taille stockage
- **Statistiques documents** : Répartition par statut, source, type MIME, distribution tailles
- **Statistiques erreurs** : Top 10 erreurs critiques avec détails
- **Performance** : Durées moyennes (P50, P95, P99) pour stockage, JWS, ledger, transactions
- **Ledger** : Statistiques ledger (entrées, erreurs, intégrité)
- **Réconciliation** : Statistiques réconciliations (runs, fichiers orphelins)
- **Signatures journalières** : Liste des signatures JWS de la période
- **Métadonnées** : Version, date génération, hash SHA256, signature JWS

### Structure PDF

Le PDF contient **8 pages** :

1. **Page de garde** : Titre, période, QR code du hash SHA256
2. **Résumé exécutif** : Tableau récapitulatif avec indicateurs clés
3. **Statistiques Documents** : Répartition par statut, source, distribution tailles
4. **Statistiques Erreurs** : Top 10 erreurs critiques
5. **Performance** : Durées moyennes (P50, P95, P99)
6. **Ledger & Réconciliation** : Statistiques ledger et réconciliations
7. **Signatures Journalières** : Tableau des signatures JWS
8. **Métadonnées** : Informations système, signature JWS complète

### Configuration Requise

- **Logs d'audit** : Doivent être disponibles dans `AUDIT_DIR/logs/`
- **Base de données** : Optionnelle, mais recommandée pour statistiques complètes
- **Clés JWS** : Requises uniquement si `--sign` est utilisé

### Documentation Complète

Pour plus de détails sur les formats, la structure et la vérification des signatures :

👉 [`docs/audit_export_spec.md`](docs/audit_export_spec.md)

---

## 🛣️ Roadmap

### ✅ Sprint 1 — MVP "Validé → Vaulté" (Complété)
- [x] Extension modèle Document (métadonnées Odoo)
- [x] Migration SQL (003_add_odoo_fields.sql)
- [x] Transaction atomique (fichier ↔ DB)
- [x] Endpoint `/api/v1/invoices` (ingestion Odoo)
- [x] Idempotence par SHA256
- [x] Tests unitaires (19 tests)

### ✅ Sprint 2 — Documents "Vérifiables" (Complété)
- [x] Module JWS (signature RS256, vérification, JWKS)
- [x] Module Ledger (hash-chaîné avec verrou FOR UPDATE)
- [x] Intégration transactionnelle (JWS + Ledger)
- [x] Endpoint `/jwks.json` (JWKS public)
- [x] Endpoint `/api/v1/ledger/export` (export JSON/CSV)
- [x] Générateur de clés (`cmd/keygen`)
- [x] Tests unitaires JWS (15 tests) + Ledger (4 tests)

### ✅ Sprint 3 — "Expert Edition" — De Vérifiable à Supervisable (Complété)
**Durée** : 15 jours ouvrés (Janvier 2025)

**Phase 1 : Health & Timeouts** ✅
- [x] Health checks avancés (`/health/detailed`)
- [x] Timeout transaction 30s
- [x] Tests unitaires health (15 tests)

**Phase 2 : Métriques Prometheus** ✅
- [x] Module métriques Prometheus (11 métriques actives)
- [x] Route `/metrics` opérationnelle
- [x] Middlewares Helmet, RequestID
- [x] Intégration métriques dans handlers et storage

**Phase 3 : Vérification & Réconciliation** ✅
- [x] Endpoint vérification (`/api/v1/ledger/verify/:id` avec option `?signed=true`)
- [x] Script réconciliation (`cmd/reconcile` avec --dry-run, --fix, --output)

### ✅ Sprint 4 — "Observabilité & Auditabilité Continue" (Complété — 100%)
**Durée** : 16 jours ouvrés (Février 2025)

**Phase 4.0 : Corrections Document** ✅
- [x] Harmonisation noms métriques
- [x] Définition seuils d'alerte
- [x] Documentation technique complétée

**Phase 4.1 : Observabilité avancée** ✅
- [x] Métriques système (CPU, RAM, disque) via `gopsutil`
- [x] Métrique `ledger_append_errors_total`
- [x] Collecteur automatique (30s)
- [x] Tests unitaires métriques système (11 tests)
- [x] Documentation `observability_metrics_spec.md`

**Phase 4.2 : Journalisation auditable** ✅
- [x] Module audit/log.go (JSONL writer avec buffer)
- [x] Module audit/sign.go (signature journalière optimisée)
- [x] Module audit/export.go (export paginé JSON/CSV)
- [x] Module audit/rotation.go (rotation automatique + rétention)
- [x] Endpoints `/audit/export` et `/audit/dates`
- [x] Intégration dans handlers (invoices, verify)
- [x] Tests unitaires (16 tests)
- [x] Documentation `audit_log_spec.md`

**Phase 4.3 : Alerting & supervision** ⏳
- [ ] Règles Prometheus détaillées
- [ ] Configuration Alertmanager
- [ ] Export Odoo

**Phase 4.4 : Audit & conformité** ✅
- [x] Module report.go (génération JSON/CSV avec statistiques complètes)
- [x] Module pdf.go (génération PDF 8 pages avec QR code)
- [x] CLI cmd/audit/main.go (tous les flags, validation, signature JWS)
- [x] Tests unitaires (39 tests : 15 report + 14 PDF + 10 CLI)
- [x] Documentation `audit_export_spec.md`

### ✅ Sprint 6 — "Ingestion Native Tickets POS" (Complété — 100%)
- [x] Architecture modulaire avec interfaces abstraites (Phase 0)
- [x] Canonicalisation JSON pour stabilité des hash (Phase 1)
- [x] Abstraction crypto (interface Signer HSM-ready) (Phase 2)
- [x] Service métier POS avec idempotence stricte (Phase 3)
- [x] Endpoint API `/api/v1/pos-tickets` (Phase 4)
- [x] Observabilité (métriques Prometheus + logs structurés) (Phase 5)
- [x] Tests exhaustifs (25 tests : 20 unitaires + 5 intégration) (Phase 6)
- [x] Documentation complète (Phase 7)

### ✅ Endpoint Payments — "Vaultérisation des Paiements" (Complété — 100%)
- [x] Service métier Payments avec idempotence basée sur SHA256
- [x] Endpoint API `/api/v1/payments` avec validation complète
- [x] Support paiements POS, factures clients/fournisseurs, remboursements
- [x] Intégration JWS + Ledger (si configurés)
- [x] Tests unitaires et d'intégration
- [x] Documentation technique complète

### ✅ Corrections de Sécurité (Janvier 2025) — Complété
- [x] **Phase 1 - Corrections Critiques** : Path Traversal, Information Disclosure, Headers HTTP
- [x] **Phase 2 - Améliorations Élevées** : Validation centralisée, DoS Protection, SQL sécurisé
- [x] **Phase 3 - Améliorations Moyennes** : Rate Limiting avancé, Log Sanitization, Validation MIME, CORS restrictif

**Documentation** : [`docs/SUIVI_CORRECTIONS_SECURITE.md`](docs/SUIVI_CORRECTIONS_SECURITE.md)

### ✅ Sprint 8 — "Endpoints Proof + Fiabilisation push_document" (Complété — 100%)
- [x] **Endpoints Proof individuels** : `/api/v1/proof/account_move/:id`, `/api/v1/proof/account_payment/:id`, `/api/v1/proof/pos_order/:id`, `/api/v1/proof/pos_payment/:id`
- [x] **Endpoint Bulk** : `POST /api/v1/proof/bulk` pour récupération multiple
- [x] **Option B - prev_hash inclus** : Champ `prev_hash` automatiquement inclus dans toutes les réponses (chaînage cryptographique)
- [x] **Option A - Ledger Export amélioré** : Paramètre `document_id` dans `/api/v1/ledger/export` pour récupération entrée spécifique
- [x] **Index base de données** : Index composite pour recherche rapide par `source_model` + `source_id`
- [x] **Fiabilisation push_document** : Endpoint `/api/v1/push_document` avec garantie JSON, middleware anti-panic, contrat API strict
- [x] **Documentation complète** : API Proof, Ledger Export, guides d'intégration

### ✅ Sprint 8.1 — "Compatibilité DVIG v1.1" (Complété — 100%)
- [x] **Compatibilité DVIG** : Tolérance des champs DVIG dans `meta` (tenant, correlation_id, dvig_version, etc.)
- [x] **Logging traçabilité** : `correlation_id` et `tenant` loggés dans handlers (invoices, payments, pos-tickets, push_document)
- [x] **Rétrocompatibilité** : Payloads sans champs DVIG fonctionnent toujours
- [x] **Tests d'intégration** : 8 tests validant compatibilité (payloads enrichis, rétrocompatibilité, champs inconnus)
- [x] **Documentation** : Guide de référence DVIG, réponse équipe DVIG, mise à jour API documentation

**Documentation** :
- [`docs/PROOF_API.md`](docs/PROOF_API.md) — Documentation complète API Proof
- [`docs/LEDGER_EXPORT_API.md`](docs/LEDGER_EXPORT_API.md) — Documentation Ledger Export avec Option A
- [`docs/SPECIFICATION_FIABILISATION_PUSH_DOCUMENT.md`](docs/SPECIFICATION_FIABILISATION_PUSH_DOCUMENT.md) — Spécification fiabilisation push_document

### 🔄 Sprint 7+ — Recherche & Analytics (À venir)
- [ ] Recherche avancée dans tickets POS (filtres JSON)
- [ ] Export tickets POS (CSV, JSON)
- [ ] Statistiques POS (revenus, produits, sessions)
- [ ] Intégration avec systèmes de paiement

---

## 📚 Documentation

### Documentation Générale
- [`CHANGELOG.md`](CHANGELOG.md) — **Historique des versions**
- [`RELEASE_NOTES_v1.2.0-rc1.md`](RELEASE_NOTES_v1.2.0-rc1.md) — **Notes de version v1.2.0-rc1**
- [`docs/RESUME_SPRINTS_ET_PLAN_SPRINT3.md`](docs/RESUME_SPRINTS_ET_PLAN_SPRINT3.md) — **Résumé Sprints 1 & 2 + Plan Sprint 3**
- [`docs/plan_A.md`](docs/plan_A.md) — Plan d'action détaillé initial
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Guide de déploiement

### Documentation Sprint 1
- [`docs/SPRINT_1_PLAN.md`](docs/SPRINT_1_PLAN.md) — Plan détaillé Sprint 1
- [`docs/RESUME_SPRINT_1.md`](docs/RESUME_SPRINT_1.md) — Résumé Sprint 1

### Documentation Sprint 2
- [`docs/Dorevia_Vault_Sprint2.md`](docs/Dorevia_Vault_Sprint2.md) — Plan détaillé Sprint 2
- [`docs/INTEGRATION_JWS_LEDGER_COMPLETE.md`](docs/INTEGRATION_JWS_LEDGER_COMPLETE.md) — Intégration JWS + Ledger
- [`docs/AVIS_EXPERT_SPRINT2_RESUME.md`](docs/AVIS_EXPERT_SPRINT2_RESUME.md) — Avis expert Sprint 2
- [`docs/TESTS_JWS_UNITAIRES.md`](docs/TESTS_JWS_UNITAIRES.md) — Tests JWS unitaires

### Documentation Sprint 3
- [`docs/FICHE_DE_CONCEPTION_TECHNIQUE_PHASE_3.MD`](docs/FICHE_DE_CONCEPTION_TECHNIQUE_PHASE_3.MD) — Conception Phase 3
- [`docs/CHECKLIST_PHASE3_AMELIOREE.md`](docs/CHECKLIST_PHASE3_AMELIOREE.md) — Checklist améliorée
- [`docs/PHASE3_VERIFICATION_RECONCILIATION_RESUME.md`](docs/PHASE3_VERIFICATION_RECONCILIATION_RESUME.md) — Résumé Phase 3

### Documentation Sprint 4
- [`docs/Dorevia_Vault_Sprint4.md`](docs/Dorevia_Vault_Sprint4.md) — Plan détaillé Sprint 4 (révisé)
- [`docs/ANALYSE_EXPERT_SPRINT4.md`](docs/ANALYSE_EXPERT_SPRINT4.md) — Analyse experte Sprint 4
- [`docs/SPRINT4_PHASE4.4_PLAN.md`](docs/SPRINT4_PHASE4.4_PLAN.md) — Plan détaillé Phase 4.4 (Audit & conformité)
- [`docs/observability_metrics_spec.md`](docs/observability_metrics_spec.md) — Spécification métriques Prometheus
- [`docs/audit_log_spec.md`](docs/audit_log_spec.md) — Spécification journalisation auditable (Phase 4.2)
- [`docs/audit_export_spec.md`](docs/audit_export_spec.md) — Spécification export rapports d'audit (Phase 4.4)
- [`docs/CORRECTION_ROUTE_METRICS.md`](docs/CORRECTION_ROUTE_METRICS.md) — Correction route `/metrics`

### Documentation Sprint 5

- [`docs/SPRINT5_PLAN.md`](docs/SPRINT5_PLAN.md) — Plan détaillé Sprint 5 (Sécurité & Interopérabilité)
- [`docs/security_vault_spec.md`](docs/security_vault_spec.md) — Spécification HSM/Vault & Key Management
- [`docs/auth_rbac_spec.md`](docs/auth_rbac_spec.md) — Spécification authentification & autorisation
- [`docs/facturx_validation_spec.md`](docs/facturx_validation_spec.md) — Spécification validation Factur-X
- [`docs/webhooks_spec.md`](docs/webhooks_spec.md) — Spécification webhooks asynchrones
- [`docs/partitioning_spec.md`](docs/partitioning_spec.md) — Spécification partitionnement ledger

### Documentation Sprint 6

- [`docs/Dorevia_Vault_Sprint6_Specification.md`](docs/Dorevia_Vault_Sprint6_Specification.md) — Spécification initiale Sprint 6
- [`docs/ANALYSE_EXPERTE_SPRINT6.md`](docs/ANALYSE_EXPERTE_SPRINT6.md) — Analyse experte de la spécification
- [`docs/PLAN_IMPLEMENTATION_SPRINT6_CORRIGE.md`](docs/PLAN_IMPLEMENTATION_SPRINT6_CORRIGE.md) — Plan d'implémentation corrigé (7 phases)
- [`docs/Avis_Architeque_Team.md`](docs/Avis_Architeque_Team.md) — Avis de l'équipe architecte
- [`docs/POS_TICKETS_API.md`](docs/POS_TICKETS_API.md) — Documentation complète de l'API POS
- [`docs/VALIDATION_SPRINT6.md`](docs/VALIDATION_SPRINT6.md) — Rapport de validation Sprint 6
- [`docs/RAPPORT_SPRINT6_DETAILLE.md`](docs/RAPPORT_SPRINT6_DETAILLE.md) — Rapport détaillé Sprint 6
- [`docs/RESUME_FINAL_SPRINT6.md`](docs/RESUME_FINAL_SPRINT6.md) — Résumé final Sprint 6
- [`docs/GENERATION_TOKEN_JWT.md`](docs/GENERATION_TOKEN_JWT.md) — Guide de génération de tokens JWT
- [`docs/DEPLOIEMENT_SPRINT6.md`](docs/DEPLOIEMENT_SPRINT6.md) — Guide de déploiement Sprint 6
- [`docs/DIAGNOSTIC_ENDPOINT_POS.md`](docs/DIAGNOSTIC_ENDPOINT_POS.md) — Diagnostic et dépannage endpoint POS
- [`RELEASE_NOTES_v1.4.0.md`](RELEASE_NOTES_v1.4.0.md) — Notes de version v1.4.0

### Documentation Endpoint Payments

- [`docs/SPECIFICATION_ENDPOINT_PAYMENTS_VAULT.md`](docs/SPECIFICATION_ENDPOINT_PAYMENTS_VAULT.md) — Spécification technique complète de l'endpoint `/api/v1/payments`
- [`docs/demande_endpoint_payment.md`](docs/demande_endpoint_payment.md) — Document de demande initiale avec contexte métier

### Documentation Sprint 8 — Endpoints Proof

- [`docs/PROOF_API.md`](docs/PROOF_API.md) — Documentation complète API Proof (endpoints individuels et bulk)
- [`docs/LEDGER_EXPORT_API.md`](docs/LEDGER_EXPORT_API.md) — Documentation Ledger Export avec Option A (paramètre `document_id`)
- [`docs/COMMUNICATION_EQUIPE_ODOO_OPTIONS_AB.md`](docs/COMMUNICATION_EQUIPE_ODOO_OPTIONS_AB.md) — Communication équipe Odoo (Options A + B)
- [`docs/REPONSE_EQUIPE_ODOO_V3_DECISIONS.md`](docs/REPONSE_EQUIPE_ODOO_V3_DECISIONS.md) — Réponse officielle équipe Odoo (décisions finales)
- [`docs/REPONSE_EQUIPE_ODOO_PREV_HASH_VERSION.md`](docs/REPONSE_EQUIPE_ODOO_PREV_HASH_VERSION.md) — Réponse initiale sur prev_hash et version
- [`docs/DEPLOIEMENT_OPTIONS_AB_REUSSI.md`](docs/DEPLOIEMENT_OPTIONS_AB_REUSSI.md) — Confirmation déploiement réussi

### Documentation Sprint 8.1 — Compatibilité DVIG

- [`docs/DVIG_COMPATIBILITY.md`](docs/DVIG_COMPATIBILITY.md) — Guide de référence complet pour compatibilité DVIG v1.1
- [`docs/REPONSE_EQUIPE_DVIG_COMPATIBILITY.md`](docs/REPONSE_EQUIPE_DVIG_COMPATIBILITY.md) — Réponse officielle à l'équipe DVIG (compatibilité validée)
- [`docs/SPEC_VAULT_API_COMPATIBILITY_v1.1.md`](docs/SPEC_VAULT_API_COMPATIBILITY_v1.1.md) — Spécification DVIG v1.1 (document source)
- [`docs/AVIS_TECHNIQUE_DVIG_COMPATIBILITY.md`](docs/AVIS_TECHNIQUE_DVIG_COMPATIBILITY.md) — Avis technique sur la compatibilité
- [`docs/PLAN_IMPLEMENTATION_DVIG_COMPATIBILITY.md`](docs/PLAN_IMPLEMENTATION_DVIG_COMPATIBILITY.md) — Plan d'implémentation Scrum
- [`docs/DEPLOIEMENT_SPRINT8_1_DVIG.md`](docs/DEPLOIEMENT_SPRINT8_1_DVIG.md) — Rapport de déploiement Sprint 8.1

### Documentation Améliorations Robustesse

- [`INVESTIGATION_DOCUMENT_FAC_00020.md`](INVESTIGATION_DOCUMENT_FAC_00020.md) — Investigation technique du document FAC/2025/00020
- [`docs/RECOMMANDATIONS_AMELIORATION_PUSH_DOCUMENT.md`](docs/RECOMMANDATIONS_AMELIORATION_PUSH_DOCUMENT.md) — Recommandations détaillées d'amélioration
- [`docs/RESUME_AMELIORATIONS_PUSH_DOCUMENT.md`](docs/RESUME_AMELIORATIONS_PUSH_DOCUMENT.md) — Résumé des améliorations implémentées
- [`docs/ENREGISTREMENT_ROUTE_DIAGNOSTIC.md`](docs/ENREGISTREMENT_ROUTE_DIAGNOSTIC.md) — Instructions pour enregistrer l'endpoint de diagnostic
- [`DEPLOIEMENT_AMELIORATIONS_PRINCIPALES.md`](DEPLOIEMENT_AMELIORATIONS_PRINCIPALES.md) — Guide de déploiement des améliorations
- [`VALIDATION_DEPLOIEMENT.md`](VALIDATION_DEPLOIEMENT.md) — Checklist de validation post-déploiement
- [`REPONSE_EQUIPE_ODOO_DOCUMENT_FAC_00020.md`](REPONSE_EQUIPE_ODOO_DOCUMENT_FAC_00020.md) — Réponse à l'équipe Odoo sur l'investigation

### Documentation Sécurité

- [`docs/SUIVI_CORRECTIONS_SECURITE.md`](docs/SUIVI_CORRECTIONS_SECURITE.md) — Suivi complet des corrections de sécurité (12 corrections, 3 phases)
- [`docs/PLAN_REDEPLOIEMENT_SECURITE.md`](docs/PLAN_REDEPLOIEMENT_SECURITE.md) — Plan de déploiement des corrections de sécurité
- [`docs/RESUME_DEPLOIEMENT_SECURITE.md`](docs/RESUME_DEPLOIEMENT_SECURITE.md) — Guide rapide de déploiement
- [`docs/RAPPORT_SECURITE_FAILLES_POTENTIELLES.md`](docs/RAPPORT_SECURITE_FAILLES_POTENTIELLES.md) — Rapport initial d'analyse de sécurité
- [`docs/EVALUATION_CSRF.md`](docs/EVALUATION_CSRF.md) — Évaluation de la nécessité de protection CSRF
- [`docs/EVALUATION_FACTURX_VALIDATION.md`](docs/EVALUATION_FACTURX_VALIDATION.md) — Évaluation de la validation Factur-X stricte

---

## 🔒 Sécurité

### Mesures de Base
- **CORS** : Configuré avec origines configurables (défaut: toutes, production: restrictif)
- **Rate Limiting** : Limites configurables par endpoint (général: 100 req/min, uploads: 20 req/min)
- **JWS** : Signature RS256 (RSA-SHA256) conforme RFC 7515
- **Ledger** : Hash-chaînage immuable avec verrou transactionnel
- **Clés privées** : Permissions 600 (lecture/écriture propriétaire uniquement)
- **Mode dégradé** : Continuité de service si JWS échoue (si `JWS_REQUIRED=false`)
- **Authentification** : ✅ JWT/API Keys + RBAC (Sprint 5)
- **Key Management** : ✅ HashiCorp Vault / fichiers locaux (Sprint 5)
- **Chiffrement au repos** : ✅ AES-256-GCM pour audit (Sprint 5)

### Corrections de Sécurité (Janvier 2025)
- ✅ **Path Traversal Protection** : Sanitization automatique des noms de fichiers
- ✅ **Information Disclosure Prevention** : Messages d'erreur sécurisés (SafeError)
- ✅ **Header Injection Protection** : Échappement sécurisé des headers HTTP (Content-Disposition)
- ✅ **Input Validation** : Validateur centralisé pour tous les paramètres (tenant, UUID, dates, pagination)
- ✅ **DoS Protection** : Limites de taille configurables pour uploads (10MB par défaut)
- ✅ **SQL Injection Prevention** : Whitelist de colonnes pour requêtes dynamiques
- ✅ **Rate Limiting Avancé** : Limites différenciées par type d'endpoint avec headers informatifs
- ✅ **Log Sanitization** : Masquage automatique des informations sensibles (passwords, tokens, clés)
- ✅ **MIME Type Validation** : Détection du type réel via magic bytes (protection contre uploads malveillants)
- ✅ **CORS Restrictif** : Configuration par origine pour production

**Documentation** : Voir [`docs/SUIVI_CORRECTIONS_SECURITE.md`](docs/SUIVI_CORRECTIONS_SECURITE.md) pour les détails complets.

---

## 📊 Statistiques

- **Fichiers Go** : 66+ fichiers
- **Tests unitaires** : 165+ tests (100% réussite)
  - 19 tests Sprint 1
  - 15 tests JWS (Sprint 2)
  - 4 tests Ledger (Sprint 2)
  - 15 tests Health (Sprint 3)
  - 22 tests Verify/Reconcile (Sprint 3)
  - 11 tests Metrics System (Sprint 4 Phase 4.1)
  - 16 tests Audit (Sprint 4 Phase 4.2)
  - 20 tests Sprint 6 (canonicalisation, service, handler, signer)
  - 13 tests autres
- **Tests d'intégration** : 5 tests Sprint 6 + tests Payments (end-to-end, idempotence, canonicalisation, métriques)
- **Endpoints** : 19+ endpoints
  - 5 routes de base (/, /health, /health/detailed, /version, /metrics)
  - 5 routes DB (Sprint 1)
  - 4 routes Sprint 2+3 (invoices, jwks, ledger/export, ledger/verify)
  - 2 routes Sprint 4 (audit/export, audit/dates)
  - 1 route Sprint 6 (pos-tickets)
  - 1 route Payments (payments)
  - 1 route Diagnostic (diagnostic/document/:id - optionnel)
- **Métriques Prometheus** : 17 métriques actives
  - 11 métriques métier (Sprint 3)
  - 6 métriques système (Sprint 4 Phase 4.1)
  - Réutilisation pour tickets POS (Sprint 6)
- **Modules** : 15+ packages modulaires
  - `internal/crypto` (JWS + Signer interface)
  - `internal/ledger` (hash-chaîné + Service interface)
  - `internal/storage` (PostgreSQL + DocumentRepository interface)
  - `internal/services` (Services métier incluant POS et Payments)
  - `internal/utils` (Canonicalisation JSON)
  - `internal/health` (health checks)
  - `internal/metrics` (Prometheus + système)
  - `internal/verify` (vérification intégrité)
  - `internal/reconcile` (réconciliation)
  - `internal/audit` (journalisation auditable)
  - `cmd/keygen` (génération clés)
  - `cmd/reconcile` (CLI réconciliation)
  - `cmd/token-gen` (génération tokens JWT - Sprint 6)
- **Migrations SQL** : 5 migrations (001, 002, 003, 004, 005)
- **Binaires** : 3 (vault 25M, reconcile 17M, token-gen)
- **Scripts** : 3 (deploy.sh, deploy_sprint6.sh, build.sh)
- **Version** : v1.2.0 (Améliorations robustesse push_document - Décembre 2025)

---

© 2025 Doreviateam – Projet sous licence MIT
