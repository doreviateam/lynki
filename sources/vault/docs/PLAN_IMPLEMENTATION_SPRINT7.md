# 📋 Plan d'Implémentation Sprint 7 — Z-Reports avec Double Chaînage

**Version** : 1.0  
**Date** : Janvier 2025  
**Basé sur** : `Dorevia_Vault_Phase2_Specification.md` + `ANALYSE_EXPERTE_SPRINT7.md`  
**Cible** : v1.5.0

---

## 🎯 Décisions Architecturales

### ✅ Option Retenue : Ledger Filesystem Dédié pour Z-Reports

**Décision** : Créer un système de ledger filesystem dédié pour les Z-Reports, séparé du ledger PostgreSQL existant.

**Justification** :
- ✅ Conforme à la spécification officielle
- ✅ Isolation Z-Reports vs Documents (chaînage horizontal vs vertical)
- ✅ Auditabilité directe (fichiers JSON lisibles)
- ✅ Compatibilité TSE/NF525-like (structure filesystem standard)
- ✅ Multi-tenant naturel (répertoires par tenant)

**Structure** :
```
ledger/
 └── tenants/<tenant_id>/pos/z/YYYY/MM/
      ├── <z_id>.json
      ├── index.json
      └── last.json
```

---

## 📐 Architecture

### 2.1 Composants Impactés

#### Nouveaux Fichiers
- `internal/handlers/pos_zreports.go` — Handler endpoint `/api/v1/pos/zreports`
- `internal/services/zreports/service.go` — Service métier Z-Reports
- `internal/services/zreports/types.go` — Types Z-Report
- `internal/validators/zreport.go` — Validation payload + tenant
- `internal/ledger/filesystem/zreports.go` — Gestion ledger filesystem Z-Reports
- `internal/ledger/filesystem/index.go` — Gestion index.json et last.json
- `internal/crypto/zreport_evidence.go` — Payload JWS spécifique Z-Reports
- `tests/integration/zreports_test.go` — Tests d'intégration

#### Fichiers Modifiés
- `internal/config/config.go` — Ajout config ledger filesystem path
- `cmd/vault/main.go` — Enregistrement routes Z-Reports
- `internal/metrics/prometheus.go` — Métriques Z-Reports

#### Fichiers Réutilisés
- `internal/utils/json_canonical.go` — Canonicalisation JSON (Sprint 6)
- `internal/crypto/signer.go` — Interface Signer (Sprint 6)
- `internal/crypto/local_signer.go` — Implémentation locale (Sprint 6)
- `internal/storage/repository.go` — Pour vérifier `last_ticket_hash`

---

## 🗃️ Modèle de Données

### 3.1 Types Go

**Fichier** : `internal/services/zreports/types.go`

```go
package zreports

import "time"

// ZReportInput représente le payload d'entrée pour le service
type ZReportInput struct {
    ZID           string                 `json:"z_id"`
    CompanyID     int                    `json:"company_id"`
    Sequence      int                    `json:"sequence"`
    DateOpen      time.Time              `json:"date_open"`
    DateClose     time.Time              `json:"date_close"`
    Totals        Totals                 `json:"totals"`
    Payments      []Payment              `json:"payments"`
    Tickets       []string               `json:"tickets"`
    TicketsCount  int                    `json:"tickets_count"`
    HashPrev      *string                `json:"hash_prev,omitempty"`
    LastTicketHash string                `json:"last_ticket_hash"`
    ChainLevel    string                 `json:"chain_level"` // "z-report"
    Tenant        string                 `json:"tenant"`
}

type Totals struct {
    AmountTotal float64 `json:"amount_total"`
    AmountTax   float64 `json:"amount_tax"`
    AmountNet   float64 `json:"amount_net"`
}

type Payment struct {
    Method string  `json:"method"`
    Amount float64 `json:"amount"`
}

// ZReportResult représente le résultat de l'ingestion
type ZReportResult struct {
    ZID          string    `json:"z_id"`
    Tenant       string    `json:"tenant"`
    HashCurrent  string    `json:"hash_current"`
    HashPrev     *string   `json:"hash_prev,omitempty"`
    EvidenceJWS  string    `json:"evidence_jws"`
    Timestamp    time.Time `json:"timestamp"`
    ProofURL     string    `json:"proof_url"`
}

// ZReport représente un Z-Report stocké dans le ledger filesystem
type ZReport struct {
    Payload     ZReportInput `json:"payload"`
    HashCurrent string       `json:"hash_current"`
    HashPrev    *string      `json:"hash_prev,omitempty"`
    Timestamp   time.Time    `json:"timestamp"`
    ProofURL    string       `json:"proof_url"`
}
```

### 3.2 Structure Ledger Filesystem

**Format fichier Z** : `ledger/tenants/<tenant>/pos/z/YYYY/MM/<z_id>.json`
```json
{
  "payload": { ... ZReportInput complet ... },
  "hash_current": "abcd1234...",
  "hash_prev": "789eff...",
  "timestamp": "2025-11-15T18:00:00Z",
  "proof_url": "/api/v1/evidence/1/Z2025-11-15-01"
}
```

**Format index.json** : `ledger/tenants/<tenant>/pos/z/YYYY/MM/index.json`
```json
{
  "last_z_id": "Z2025-11-15-01",
  "last_hash": "abcd1234...",
  "count": 23,
  "z_reports": [
    "Z2025-11-10-01",
    "Z2025-11-11-01",
    ...
  ]
}
```

**Format last.json** : `ledger/tenants/<tenant>/pos/z/YYYY/MM/last.json`
```json
{
  "z_id": "Z2025-11-15-01",
  "hash": "abcd1234..."
}
```

---

## 🔧 Phases d'Implémentation

### Phase 0 : Préparation Architecturale (1 jour)

**Objectif** : Créer la structure de base et les interfaces.

**Tâches** :
- [ ] Créer `internal/services/zreports/types.go` avec tous les types
- [ ] Créer `internal/ledger/filesystem/` (répertoire)
- [ ] Créer interface `ZReportLedger` dans `internal/ledger/filesystem/zreports.go`
- [ ] Ajouter config `LedgerFilesystemPath` dans `internal/config/config.go`
- [ ] Créer `internal/crypto/zreport_evidence.go` avec `ZReportEvidencePayload`

**Critères de complétion** :
- ✅ Types compilent sans erreur
- ✅ Interface `ZReportLedger` définie
- ✅ Config accessible

---

### Phase 1 : Ledger Filesystem (2 jours)

**Objectif** : Implémenter le stockage filesystem avec atomicité et durabilité.

**Tâches** :
- [ ] Implémenter `ZReportLedger.StoreZReport()` (écriture atomique avec fsync)
- [ ] Implémenter `ZReportLedger.GetLastHash()` (lecture last.json)
- [ ] Implémenter `ZReportLedger.GetZReport()` (lecture z_id.json)
- [ ] Implémenter gestion `index.json` (mise à jour atomique)
- [ ] Implémenter gestion `last.json` (mise à jour atomique)
- [ ] Tests unitaires : écriture, lecture, atomicité, fsync

**Pattern atomicité** :
```go
// 1. Écrire fichier temporaire
tmpPath := filepath.Join(dir, zID+".tmp")
if err := os.WriteFile(tmpPath, data, 0644); err != nil { ... }

// 2. Fsync
file, _ := os.Open(tmpPath)
file.Sync()
file.Close()

// 3. Rename (atomique)
finalPath := filepath.Join(dir, zID+".json")
if err := os.Rename(tmpPath, finalPath); err != nil { ... }
```

**Critères de complétion** :
- ✅ Stockage fonctionnel avec atomicité
- ✅ Fsync après chaque écriture
- ✅ Tests unitaires passent (écriture, lecture, erreurs)

---

### Phase 2 : Validation & Canonicalisation (1 jour)

**Objectif** : Créer le validateur et intégrer la canonicalisation.

**Tâches** :
- [ ] Créer `internal/validators/zreport.go`
- [ ] Implémenter validation tenant (X-Tenant, payload.tenant, company_id)
- [ ] Implémenter validation payload (champs obligatoires, dates, totals)
- [ ] Implémenter validation `tickets_count == len(tickets)`
- [ ] Implémenter validation `hash_prev` (si fourni, doit exister)
- [ ] Intégrer `utils.CanonicalizeJSON()` pour calcul hash
- [ ] Tests unitaires validateur

**Validation tenant** :
```go
func ValidateTenant(headerTenant, payloadTenant string, companyID int) error {
    if headerTenant != payloadTenant {
        return fmt.Errorf("tenant mismatch: header=%s, payload=%s", headerTenant, payloadTenant)
    }
    // Vérifier cohérence tenant ↔ company_id (si mapping disponible)
    return nil
}
```

**Critères de complétion** :
- ✅ Validateur complet avec tous les cas
- ✅ Tests unitaires passent (succès, erreurs)

---

### Phase 3 : Service Métier (2 jours)

**Objectif** : Implémenter la logique métier d'ingestion Z-Reports.

**Tâches** :
- [ ] Créer `internal/services/zreports/service.go`
- [ ] Implémenter `ZReportsService.Ingest()`
  - [ ] Validation via `validators.ZReportValidator`
  - [ ] Récupération `hash_prev` (ledger filesystem ou nil si premier)
  - [ ] Vérification `last_ticket_hash` (repository documents)
  - [ ] Canonicalisation JSON (supprimer `hash_current`, trier clés)
  - [ ] Calcul `hash_current = SHA256(canonical_json)`
  - [ ] Génération JWS (via `crypto.Signer`)
  - [ ] Stockage dans ledger filesystem
- [ ] Tests unitaires service (mocks pour ledger, signer, repository)

**Algorithme canonicalisation** :
```go
// 1. Copier payload
canonicalPayload := copyPayload(input)

// 2. Supprimer hash_current (toujours null dans input)
canonicalPayload.HashCurrent = nil

// 3. Trier clés selon ordre canonique (section 11 spec)
// Ordre : chain_level, company_id, date_close, date_open, hash_prev, 
//         last_ticket_hash, payments, sequence, tickets, tickets_count, 
//         totals, z_id, tenant

// 4. Marshal + canonicaliser
jsonBytes, _ := json.Marshal(canonicalPayload)
canonicalBytes, _ := utils.CanonicalizeJSON(jsonBytes)

// 5. Calcul hash
hash := sha256.Sum256(canonicalBytes)
hashCurrent := hex.EncodeToString(hash[:])
```

**Critères de complétion** :
- ✅ Service fonctionnel avec tous les cas
- ✅ Tests unitaires passent (succès, erreurs, chaînage)

---

### Phase 4 : Handler HTTP (1 jour)

**Objectif** : Créer le handler HTTP avec validation et gestion d'erreurs.

**Tâches** :
- [ ] Créer `internal/handlers/pos_zreports.go`
- [ ] Implémenter `POST /api/v1/pos/zreports`
  - [ ] Validation headers (Authorization, X-Tenant, Content-Type)
  - [ ] Parser payload JSON
  - [ ] Validation taille payload (configurable)
  - [ ] Appel service
  - [ ] Gestion erreurs (400, 403, 500)
  - [ ] Logs structurés
- [ ] Implémenter `GET /api/v1/evidence/:tenant/:z_id`
  - [ ] Récupération Z-Report (ledger filesystem)
  - [ ] Retour JWS
- [ ] Implémenter `GET /api/v1/health/zreports`
  - [ ] Vérification accès ledger filesystem
  - [ ] Retour statut
- [ ] Tests unitaires handler (mocks service)

**Critères de complétion** :
- ✅ Handler fonctionnel avec tous les endpoints
- ✅ Tests unitaires passent (succès, erreurs)

---

### Phase 5 : Routes & Intégration (1 jour)

**Objectif** : Intégrer les routes dans l'application principale.

**Tâches** :
- [ ] Modifier `cmd/vault/main.go`
  - [ ] Enregistrer route `POST /api/v1/pos/zreports`
  - [ ] Enregistrer route `GET /api/v1/evidence/:tenant/:z_id`
  - [ ] Enregistrer route `GET /api/v1/health/zreports`
  - [ ] Middleware validation tenant (réutilisable)
  - [ ] Middleware RBAC (permission `documents:write`)
- [ ] Ajouter métriques Prometheus dans `internal/metrics/prometheus.go`
  - [ ] `zreports_ingested_total{status, tenant}`
  - [ ] `zreports_chain_errors_total{tenant, error_type}`
  - [ ] `zreports_storage_duration_seconds{tenant}`
- [ ] Tests d'intégration basiques (démarrage serveur, routes accessibles)

**Critères de complétion** :
- ✅ Routes accessibles et fonctionnelles
- ✅ Métriques enregistrées
- ✅ Tests d'intégration passent

---

### Phase 6 : Tests d'Intégration (2 jours)

**Objectif** : Tests complets end-to-end avec scénarios réels.

**Tâches** :
- [ ] Test : Premier Z-Report (sans hash_prev)
- [ ] Test : Z-Report avec hash_prev correct
- [ ] Test : Z-Report rejeté (hash_prev incorrect)
- [ ] Test : Z-Report rejeté (tenant incorrect)
- [ ] Test : Z-Report rejeté (tickets_count != len(tickets))
- [ ] Test : Z-Report accepté + preuve consultable
- [ ] Test : Chaînage 30 jours de suite
- [ ] Test : Reconstruction ledger complète
- [ ] Test : Vérification absence de trous
- [ ] Test : Performance (hash < 20ms, écriture < 10ms)
- [ ] Test : Charge (500 Z/minute par tenant)
- [ ] Test : Multi-tenant (isolation stricte)

**Critères de complétion** :
- ✅ Tous les tests passent
- ✅ Performance respectée (< 20ms hash, < 10ms écriture)
- ✅ Charge supportée (500 Z/minute)

---

### Phase 7 : Observabilité & Documentation (1 jour)

**Objectif** : Finaliser observabilité et documentation.

**Tâches** :
- [ ] Logs structurés (tenant, z_id, hash_current, hash_prev)
- [ ] Métriques Prometheus complètes
- [ ] Documentation API (`docs/ZREPORTS_API.md`)
- [ ] Documentation déploiement (`docs/DEPLOIEMENT_SPRINT7.md`)
- [ ] Mise à jour `README.md` (endpoint Z-Reports)
- [ ] Mise à jour `CHANGELOG.md` (v1.5.0)

**Critères de complétion** :
- ✅ Logs structurés complets
- ✅ Métriques enregistrées
- ✅ Documentation à jour

---

## 📊 Résumé des Phases

| Phase | Objectif | Durée | Prerequisites |
|-------|----------|-------|---------------|
| **Phase 0** | Préparation architecturale | 1 jour | Spécification validée |
| **Phase 1** | Ledger filesystem | 2 jours | Phase 0 |
| **Phase 2** | Validation & canonicalisation | 1 jour | Phase 0 |
| **Phase 3** | Service métier | 2 jours | Phase 1, Phase 2 |
| **Phase 4** | Handler HTTP | 1 jour | Phase 3 |
| **Phase 5** | Routes & intégration | 1 jour | Phase 4 |
| **Phase 6** | Tests d'intégration | 2 jours | Phase 5 |
| **Phase 7** | Observabilité & documentation | 1 jour | Phase 6 |

**Total estimé** : **11 jours** (2 semaines + 1 jour)

---

## 🧪 Tests

### Tests Unitaires

- **Ledger filesystem** : écriture, lecture, atomicité, fsync, erreurs
- **Validateur** : tenant, payload, hash_prev, tickets_count
- **Service** : ingestion, chaînage, erreurs (mocks)
- **Handler** : parsing, validation, erreurs (mocks)

### Tests d'Intégration

- **API** : premier Z, chaînage, erreurs, preuve
- **Chaînage** : 30 jours, reconstruction, absence de trous
- **Performance** : hash < 20ms, écriture < 10ms
- **Charge** : 500 Z/minute par tenant
- **Multi-tenant** : isolation stricte

---

## 📝 Configuration

**Variables d'environnement** :

```bash
# Ledger filesystem path
LEDGER_FILESYSTEM_PATH=/opt/dorevia-vault/ledger

# Z-Reports max size (bytes)
ZREPORT_MAX_SIZE_BYTES=1048576  # 1 MB

# Performance
ZREPORT_FSYNC_ENABLED=true
```

---

## 🎯 Critères de Succès

### Fonctionnels
- ✅ Endpoint `POST /api/v1/pos/zreports` opérationnel
- ✅ Chaînage horizontal fonctionnel (hash_prev correct)
- ✅ Validation tenant stricte
- ✅ Preuve JWS générée et consultable
- ✅ Ledger filesystem multi-tenant

### Techniques
- ✅ Performance : < 20ms hash, < 10ms écriture fichier
- ✅ Atomicité : pas de fichiers partiels
- ✅ Durabilité : fsync après chaque écriture
- ✅ Tests : couverture > 80%

### Sécurité
- ✅ Multi-tenant strict (pas de mélange)
- ✅ Validation tenant systématique
- ✅ JWS avec clé privée Vault

---

**Fin du Plan d'Implémentation — Sprint 7**

