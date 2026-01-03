# 🔍 Analyse Experte — Sprint 7 (Phase 2 : Z-Reports)

**Date** : Janvier 2025  
**Version** : 1.0  
**Statut** : Analyse pré-implémentation  
**Basé sur** : `Dorevia_Vault_Phase2_Specification.md`

---

## 📋 Résumé Exécutif

Le Sprint 7 introduit les **Z-Reports POS** avec un système de **double chaînage cryptographique** (vertical : Ticket-Chain, horizontal : Z-Chain) et un **ledger filesystem multi-tenant**. Cette analyse identifie les points forts, les risques, et les recommandations architecturales.

---

## ✅ Points Forts de la Spécification

### 1. Vision claire et complète
- ✅ Objectifs bien définis (TSE/NF525-like, immuabilité, multi-tenant)
- ✅ Structure de stockage filesystem explicite
- ✅ Chaînage cryptographique double-niveau bien documenté
- ✅ API versionnée et backward compatible

### 2. Séparation des préoccupations
- ✅ Handler → Service → Validator → Ledger (structure claire)
- ✅ Canonicalisation JSON déjà implémentée (Sprint 6)
- ✅ Interface `Signer` existante (Sprint 6) réutilisable

### 3. Observabilité
- ✅ Logs structurés demandés
- ✅ Métriques Prometheus (à étendre)
- ✅ Endpoint health dédié

---

## ⚠️ Points Critiques à Clarifier

### 1. **Ledger Filesystem vs PostgreSQL** 🔴 CRITIQUE

**Problème** :
- Spécification demande : `ledger/tenants/<tenant>/pos/z/YYYY/MM/` (filesystem)
- Architecture actuelle : Ledger PostgreSQL (table `ledger`)

**Options** :

#### Option A : Ledger Filesystem dédié (recommandé)
- ✅ Conforme à la spécification
- ✅ Isolation Z-Reports vs Documents
- ✅ Auditabilité directe (fichiers JSON lisibles)
- ⚠️ Double système de ledger (PostgreSQL + Filesystem)
- ⚠️ Cohérence à maintenir entre les deux

#### Option B : PostgreSQL avec colonne `chain_level`
- ✅ Un seul système de ledger
- ✅ Cohérence garantie par transactions
- ❌ Non conforme à la spécification
- ❌ Moins d'auditabilité directe

**Recommandation** : **Option A** (ledger filesystem dédié) pour respecter la spécification et permettre une auditabilité indépendante.

---

### 2. **Chaînage Horizontal (Z-Chain) vs Vertical (Document-Chain)** 🟠 IMPORTANT

**Problème** :
- Chaînage vertical existant : `hash = SHA256(previous_hash + document_sha256)`
- Chaînage horizontal demandé : `hash_current = SHA256(canonical_json)` avec `hash_prev` du dernier Z du même tenant/mois

**Clarification nécessaire** :
- Les Z-Reports doivent-ils aussi être dans le ledger PostgreSQL vertical ?
- Ou uniquement dans le ledger filesystem horizontal ?

**Recommandation** : 
- **Ledger filesystem uniquement** pour les Z-Reports (chaînage horizontal)
- **Pas d'ajout au ledger PostgreSQL** (séparation des chaînes)
- **Lien cryptographique** : `last_ticket_hash` fait le pont entre les deux chaînes

---

### 3. **Validation Tenant Stricte** 🟠 IMPORTANT

**Exigences** :
- Vérifier `X-Tenant` header
- Vérifier `payload.tenant`
- Vérifier cohérence `tenant ↔ company_id`
- Refuser si incohérence

**Recommandation** :
- Créer un validateur dédié `internal/validators/zreport.go`
- Middleware Fiber pour validation tenant (réutilisable)
- Erreurs HTTP 403 Forbidden pour incohérences tenant

---

### 4. **Canonicalisation JSON** ✅ DÉJÀ IMPLÉMENTÉE

**État actuel** :
- `internal/utils/json_canonical.go` existe (Sprint 6)
- Algorithme : tri clés, suppression null, normalisation nombres

**Action** :
- ✅ Réutiliser `utils.CanonicalizeJSON()`
- ⚠️ Vérifier que l'ordre canonique spécifié (section 11) est respecté
- ⚠️ Supprimer `hash_current` avant canonicalisation (spécification section 5.1)

---

### 5. **Structure JWS pour Z-Reports** 🟡 À ADAPTER

**Payload JWS actuel (Sprint 6)** :
```json
{
  "document_id": "uuid",
  "sha256": "hex",
  "timestamp": "RFC3339"
}
```

**Payload JWS demandé (Sprint 7)** :
```json
{
  "z_id": "Z2025-11-15-01",
  "tenant": "1",
  "hash_current": "hex",
  "hash_prev": "hex",
  "iat": 1736965273,
  "iss": "dorevia-vault"
}
```

**Recommandation** :
- Créer un type `ZReportEvidencePayload` dans `internal/crypto/`
- Étendre `Signer.SignPayload()` pour accepter ce nouveau type
- Ou créer une méthode dédiée `SignZReportEvidence()`

---

### 6. **Gestion des Fichiers Ledger (fsync, atomicité)** 🟠 IMPORTANT

**Exigences** :
- Écritures `fsync` pour durabilité
- Aucune suppression possible (append-only)
- Atomicité : création fichier + mise à jour `index.json` + mise à jour `last.json`

**Recommandation** :
- Utiliser `os.WriteFile()` avec `os.O_CREATE|os.O_WRONLY|os.O_EXCL` (atomique)
- Appeler `file.Sync()` après écriture
- Pattern : écriture temporaire → `fsync` → `rename` (atomique)
- Gestion d'erreurs : rollback si échec partiel

---

### 7. **Endpoint `/api/v1/evidence/:tenant/:z_id`** 🟡 À CLARIFIER

**Problème** :
- Endpoint existant `/api/v1/evidence/...` pour documents
- Nouveau besoin : `/api/v1/evidence/:tenant/:z_id` pour Z-Reports

**Recommandation** :
- Étendre l'endpoint existant pour supporter les deux types
- Ou créer un endpoint dédié `/api/v1/evidence/zreports/:tenant/:z_id`
- Vérifier la spécification pour confirmation

---

### 8. **Validation `tickets_count` vs `len(tickets)`** 🟡 MINEUR

**Exigence** :
- Rejeter si `tickets_count < len(tickets)`

**Clarification** :
- Que faire si `tickets_count > len(tickets)` ? (tickets manquants)
- Que faire si `tickets_count == 0` mais `len(tickets) > 0` ?

**Recommandation** :
- Validation stricte : `tickets_count == len(tickets)` (exact match)
- Erreur HTTP 400 Bad Request si incohérence

---

## 🏗️ Recommandations Architecturales

### 1. Structure de Code

```
internal/
├── handlers/
│   └── pos_zreports.go          # Handler HTTP
├── services/
│   └── zreports/
│       ├── service.go           # Service métier
│       └── types.go             # Types Z-Report
├── validators/
│   └── zreport.go               # Validation payload + tenant
├── ledger/
│   └── filesystem/
│       ├── zreports.go          # Gestion ledger filesystem Z-Reports
│       └── index.go             # Gestion index.json et last.json
└── crypto/
    └── zreport_evidence.go      # Payload JWS spécifique Z-Reports
```

### 2. Interface Ledger Filesystem

```go
type ZReportLedger interface {
    // StoreZReport stocke un Z-Report dans le ledger filesystem
    StoreZReport(ctx context.Context, tenant string, zReport *ZReport) error
    
    // GetLastHash récupère le hash du dernier Z du tenant/mois
    GetLastHash(ctx context.Context, tenant string, year, month int) (string, error)
    
    // GetZReport récupère un Z-Report par ID
    GetZReport(ctx context.Context, tenant, zID string) (*ZReport, error)
}
```

### 3. Service Z-Reports

```go
type ZReportsService interface {
    Ingest(ctx context.Context, input ZReportInput) (*ZReportResult, error)
}
```

**Dépendances** :
- `ZReportLedger` (ledger filesystem)
- `crypto.Signer` (JWS)
- `validators.ZReportValidator` (validation)
- `storage.DocumentRepository` (pour vérifier `last_ticket_hash`)

---

## 📊 Plan d'Implémentation Recommandé

### Phase 0 : Préparation Architecturale (1 jour)
- [ ] Créer structure `internal/ledger/filesystem/`
- [ ] Créer interface `ZReportLedger`
- [ ] Créer types `internal/services/zreports/types.go`
- [ ] Analyser compatibilité avec système existant

### Phase 1 : Ledger Filesystem (2 jours)
- [ ] Implémenter `ZReportLedger` (stockage, index, last.json)
- [ ] Gestion atomicité (fsync, rename)
- [ ] Tests unitaires ledger filesystem

### Phase 2 : Validation & Canonicalisation (1 jour)
- [ ] Créer `validators/zreport.go`
- [ ] Validation tenant stricte
- [ ] Validation payload (tickets_count, dates, etc.)
- [ ] Intégration canonicalisation JSON (Sprint 6)

### Phase 3 : Service Métier (2 jours)
- [ ] Implémenter `ZReportsService`
- [ ] Calcul `hash_current` (canonicalisation)
- [ ] Récupération `hash_prev` (ledger filesystem)
- [ ] Vérification `last_ticket_hash` (repository documents)
- [ ] Génération JWS (extension `Signer`)

### Phase 4 : Handler HTTP (1 jour)
- [ ] Créer `handlers/pos_zreports.go`
- [ ] Validation headers (X-Tenant, Authorization)
- [ ] Mapping payload → service input
- [ ] Gestion erreurs (400, 403, 500)
- [ ] Logs structurés

### Phase 5 : Routes & Intégration (1 jour)
- [ ] Enregistrer routes dans `cmd/vault/main.go`
- [ ] Middleware validation tenant
- [ ] Endpoint `/api/v1/evidence/:tenant/:z_id`
- [ ] Endpoint `/api/v1/health/zreports`

### Phase 6 : Tests d'Intégration (2 jours)
- [ ] Tests API (premier Z, chaînage, erreurs)
- [ ] Tests chaînage 30 jours
- [ ] Tests performance (500 Z/minute)
- [ ] Tests multi-tenant

### Phase 7 : Observabilité & Documentation (1 jour)
- [ ] Métriques Prometheus (zreports_ingested, zreports_chain_errors)
- [ ] Logs structurés (tenant, z_id, hash_current)
- [ ] Documentation API
- [ ] Documentation déploiement

**Total estimé** : **11 jours** (2 semaines + 1 jour)

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

## 📝 Notes Finales

### Points à Valider avec l'Équipe
1. **Ledger filesystem vs PostgreSQL** : Confirmer choix Option A (filesystem dédié)
2. **Endpoint evidence** : Confirmer structure (`/api/v1/evidence/:tenant/:z_id` ou dédié)
3. **Validation tickets_count** : Confirmer règle exacte (== ou >=)
4. **Chaînage double** : Confirmer que Z-Reports ne vont pas dans ledger PostgreSQL

### Risques Identifiés
- 🔴 **Risque 1** : Double système de ledger (complexité opérationnelle)
- 🟠 **Risque 2** : Performance filesystem (500 Z/minute par tenant)
- 🟠 **Risque 3** : Atomicité multi-fichiers (index.json + last.json + z_id.json)

### Mitigations
- **Risque 1** : Documentation claire, monitoring séparé
- **Risque 2** : Tests de charge, optimisation I/O (buffers, batch)
- **Risque 3** : Pattern transactionnel filesystem (write-temp → fsync → rename)

---

**Fin de l'Analyse Experte — Sprint 7**

