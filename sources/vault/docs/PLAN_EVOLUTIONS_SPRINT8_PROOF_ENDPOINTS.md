# 🚀 Plan d'Évolutions — Sprint 8 : Endpoints Proof pour dorevia_vault_report

**Date** : 2025-11-24  

**Sprint** : Sprint 8  

**Priorité** : 🔴 Haute  

**Statut** : 📋 Planifié

---

## 🎯 Objectif

Implémenter les endpoints `/api/v1/proof/*` et l'endpoint bulk pour permettre au module `dorevia_vault_report` de récupérer facilement les preuves d'intégrité par ID Odoo.

---

## 📋 Évolutions à Prévoir

### 1. 🔍 Nouvelle Méthode de Recherche dans le Storage

#### Besoin

Ajouter une méthode `GetDocumentBySourceID` dans le repository pour rechercher un document par `source_model` et `source_id`.

#### Fichier à Modifier

`internal/storage/queries.go`

#### Implémentation

```go
// GetDocumentBySourceID récupère un document par source_model et source_id
func (db *DB) GetDocumentBySourceID(ctx context.Context, sourceModel, sourceID string) (*models.Document, error) {
	var doc models.Document
	var odooID *int
	var sourceIDText *string
	
	// Requête qui gère à la fois odoo_id (int) et source_id_text (string)
	err := db.Pool.QueryRow(ctx, `
		SELECT id, filename, content_type, size_bytes, sha256_hex, stored_path, created_at,
		       source, odoo_model, odoo_id, odoo_state, pdp_required, dispatch_status,
		       invoice_number, invoice_date, total_ht, total_ttc, currency, seller_vat, buyer_vat,
		       evidence_jws, ledger_hash, source_id_text
		FROM documents
		WHERE odoo_model = $1 
		  AND (
		      (odoo_id IS NOT NULL AND odoo_id::text = $2)
		      OR (source_id_text IS NOT NULL AND source_id_text = $2)
		  )
		LIMIT 1
	`, sourceModel, sourceID).Scan(
		&doc.ID,
		&doc.Filename,
		&doc.ContentType,
		&doc.SizeBytes,
		&doc.SHA256Hex,
		&doc.StoredPath,
		&doc.CreatedAt,
		&doc.Source,
		&doc.OdooModel,
		&odooID,
		&doc.OdooState,
		&doc.PDPRequired,
		&doc.DispatchStatus,
		&doc.InvoiceNumber,
		&doc.InvoiceDate,
		&doc.TotalHT,
		&doc.TotalTTC,
		&doc.Currency,
		&doc.SellerVAT,
		&doc.BuyerVAT,
		&doc.EvidenceJWS,
		&doc.LedgerHash,
		&sourceIDText,
	)
	
	if err == pgx.ErrNoRows {
		return nil, nil // Document non trouvé (pas une erreur)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get document by source: %w", err)
	}
	
	// Assigner les valeurs selon le type
	if odooID != nil {
		doc.OdooID = odooID
	}
	if sourceIDText != nil {
		doc.SourceIDText = sourceIDText
	}
	
	return &doc, nil
}
```

#### Index à Créer (Migration)

**Fichier** : `migrations/008_add_source_lookup_index.sql`

```sql
-- Index pour recherche rapide par source_model + source_id
CREATE INDEX IF NOT EXISTS idx_documents_source_lookup 
ON documents(odoo_model, odoo_id) 
WHERE odoo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_source_text_lookup 
ON documents(odoo_model, source_id_text) 
WHERE source_id_text IS NOT NULL;
```

---

### 2. 📡 Nouveaux Handlers pour les Endpoints Proof

#### Fichier à Créer

`internal/handlers/proof.go`

#### Implémentation

```go
package handlers

import (
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
)

// ProofResponse représente la réponse standardisée pour les preuves
type ProofResponse struct {
	ID        string  `json:"id"`
	Hash      string  `json:"hash"`
	Ledger    *string `json:"ledger,omitempty"`
	Timestamp string  `json:"timestamp"`
	JWS       *string `json:"jws,omitempty"`
	Status    string  `json:"status"`
	SourceModel *string `json:"source_model,omitempty"`
	SourceID    *string `json:"source_id,omitempty"`
}

// GetProofAccountMove récupère la preuve d'une facture par ID Odoo
func GetProofAccountMove(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}
		
		odooID := c.Params("id")
		if odooID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing id parameter",
			})
		}
		
		doc, err := db.GetDocumentBySourceID(c.Context(), "account.move", odooID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to retrieve proof",
			})
		}
		
		if doc == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Proof not found",
			})
		}
		
		// Construire la réponse standardisée
		proof := buildProofResponse(doc)
		return c.JSON(proof)
	}
}

// GetProofAccountPayment récupère la preuve d'un paiement par ID Odoo
func GetProofAccountPayment(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}
		
		odooID := c.Params("id")
		if odooID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing id parameter",
			})
		}
		
		doc, err := db.GetDocumentBySourceID(c.Context(), "account.payment", odooID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to retrieve proof",
			})
		}
		
		if doc == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Proof not found",
			})
		}
		
		proof := buildProofResponse(doc)
		return c.JSON(proof)
	}
}

// GetProofPosOrder récupère la preuve d'un ticket POS par ID Odoo
func GetProofPosOrder(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}
		
		odooID := c.Params("id")
		if odooID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing id parameter",
			})
		}
		
		doc, err := db.GetDocumentBySourceID(c.Context(), "pos.order", odooID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to retrieve proof",
			})
		}
		
		if doc == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Proof not found",
			})
		}
		
		proof := buildProofResponse(doc)
		return c.JSON(proof)
	}
}

// GetProofPosPayment récupère la preuve d'un paiement POS par ID Odoo
func GetProofPosPayment(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}
		
		odooID := c.Params("id")
		if odooID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing id parameter",
			})
		}
		
		doc, err := db.GetDocumentBySourceID(c.Context(), "pos.payment", odooID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to retrieve proof",
			})
		}
		
		if doc == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Proof not found",
			})
		}
		
		proof := buildProofResponse(doc)
		return c.JSON(proof)
	}
}

// GetProofPosZreport récupère la preuve d'un Z-Report par ID Odoo
// Note: Les Z-Reports sont stockés dans le ledger filesystem, pas dans PostgreSQL
// Cette fonction nécessitera une intégration avec le service Z-Reports
func GetProofPosZreport(zreportService interface{}) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// TODO: Implémenter avec le service Z-Reports
		return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
			"error": "Z-Report proof retrieval not yet implemented",
		})
	}
}

// buildProofResponse construit une réponse standardisée depuis un document
func buildProofResponse(doc *models.Document) ProofResponse {
	status := "verified"
	if doc.EvidenceJWS == nil {
		status = "pending"
	}
	
	var sourceID *string
	if doc.OdooID != nil {
		idStr := fmt.Sprintf("%d", *doc.OdooID)
		sourceID = &idStr
	} else if doc.SourceIDText != nil {
		sourceID = doc.SourceIDText
	}
	
	return ProofResponse{
		ID:          doc.ID.String(),
		Hash:        doc.SHA256Hex,
		Ledger:      doc.LedgerHash,
		Timestamp:   doc.CreatedAt.Format(time.RFC3339),
		JWS:         doc.EvidenceJWS,
		Status:      status,
		SourceModel: doc.OdooModel,
		SourceID:    sourceID,
	}
}
```

---

### 3. 🔄 Endpoint Bulk pour Récupération Multiple

#### Fichier à Modifier

`internal/handlers/proof.go` (ajout)

#### Implémentation

```go
// BulkProofRequest représente une requête bulk
type BulkProofRequest struct {
	Requests []ProofRequest `json:"requests"`
}

type ProofRequest struct {
	Type string `json:"type"` // account_move, account_payment, pos_order, etc.
	ID   string `json:"id"`    // ID Odoo
}

// BulkProofResponse représente la réponse bulk
type BulkProofResponse struct {
	Results []BulkProofResult `json:"results"`
}

type BulkProofResult struct {
	Type  string         `json:"type"`
	ID    string         `json:"id"`
	Proof *ProofResponse `json:"proof,omitempty"`
}

// GetProofsBulk récupère plusieurs preuves en une fois
func GetProofsBulk(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}
		
		var req BulkProofRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request body",
			})
		}
		
		// Limite de 100 requêtes par appel
		if len(req.Requests) > 100 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Too many requests (maximum 100)",
			})
		}
		
		results := make([]BulkProofResult, 0, len(req.Requests))
		
		// Traiter chaque requête
		for _, proofReq := range req.Requests {
			result := BulkProofResult{
				Type: proofReq.Type,
				ID:   proofReq.ID,
			}
			
			// Mapper le type vers source_model
			sourceModel := mapTypeToSourceModel(proofReq.Type)
			if sourceModel == "" {
				result.Proof = nil
				results = append(results, result)
				continue
			}
			
			// Récupérer le document
			doc, err := db.GetDocumentBySourceID(c.Context(), sourceModel, proofReq.ID)
			if err != nil || doc == nil {
				result.Proof = nil
			} else {
				proof := buildProofResponse(doc)
				result.Proof = &proof
			}
			
			results = append(results, result)
		}
		
		return c.JSON(BulkProofResponse{
			Results: results,
		})
	}
}

// mapTypeToSourceModel mappe le type de requête vers source_model
func mapTypeToSourceModel(proofType string) string {
	mapping := map[string]string{
		"account_move":   "account.move",
		"account_payment": "account.payment",
		"pos_order":      "pos.order",
		"pos_payment":    "pos.payment",
		"pos_zreport":    "pos.zreport",
	}
	return mapping[proofType]
}
```

---

### 4. 🛣️ Enregistrement des Routes

#### Fichier à Modifier

`cmd/vault/main.go`

#### Ajout des Routes

```go
// Routes Proof (Sprint 8) - permission documents:read
proofGroup := apiGroup.Group("/proof")
if rbacService != nil {
	proofGroup.Use(auth.RequirePermission(rbacService, auth.PermissionReadDocuments, *log))
}

if db != nil {
	// Endpoints individuels
	proofGroup.Get("/account_move/:id", handlers.GetProofAccountMove(db))
	proofGroup.Get("/account_payment/:id", handlers.GetProofAccountPayment(db))
	proofGroup.Get("/pos_order/:id", handlers.GetProofPosOrder(db))
	proofGroup.Get("/pos_payment/:id", handlers.GetProofPosPayment(db))
	
	// Endpoint bulk
	proofGroup.Post("/bulk", handlers.GetProofsBulk(db))
	
	// Z-Report (nécessite service Z-Reports)
	// TODO: Implémenter quand le service sera disponible
	// proofGroup.Get("/pos_zreport/:id", handlers.GetProofPosZreport(zreportService))
	
	log.Info().Msg("Proof endpoints enabled: /api/v1/proof/*")
} else {
	log.Warn().Msg("Proof endpoints disabled (requires DB)")
}
```

---

### 5. 🧪 Tests Unitaires

#### Fichier à Créer

`internal/handlers/proof_test.go`

#### Tests à Implémenter

1. **Test GetProofAccountMove** : Vérifier la récupération d'une preuve de facture
2. **Test GetProofAccountMoveNotFound** : Vérifier le 404 pour ID inexistant
3. **Test GetProofsBulk** : Vérifier la récupération bulk
4. **Test GetProofsBulkLimit** : Vérifier la limite de 100 requêtes
5. **Test GetProofsBulkPartial** : Vérifier le retour partiel en cas d'erreur

---

### 6. 📚 Documentation

#### Fichier à Créer

`docs/PROOF_API.md`

#### Contenu

- Documentation complète des endpoints `/api/v1/proof/*`
- Exemples de requêtes/réponses
- Codes d'erreur
- Limitations (rate limiting, quotas)

---

### 7. 🔧 Endpoints de Test (Optionnel)

#### Besoin

Endpoints pour simuler les timeouts et erreurs serveur dans l'environnement de test.

#### Fichier à Créer

`internal/handlers/test.go`

#### Implémentation

```go
// GetTestTimeout simule un timeout (uniquement en environnement de test)
func GetTestTimeout() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Vérifier que nous sommes en environnement de test
		if os.Getenv("ENVIRONMENT") != "test" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Not found",
			})
		}
		
		// Attendre 10 secondes pour simuler un timeout
		time.Sleep(10 * time.Second)
		return c.JSON(fiber.Map{"message": "This should timeout"})
	}
}

// GetTestError simule une erreur serveur (uniquement en environnement de test)
func GetTestError() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Vérifier que nous sommes en environnement de test
		if os.Getenv("ENVIRONMENT") != "test" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Not found",
			})
		}
		
		// Récupérer le code d'erreur depuis la query string
		codeStr := c.Query("code", "500")
		code, _ := strconv.Atoi(codeStr)
		if code < 500 || code >= 600 {
			code = 500
		}
		
		return c.Status(code).JSON(fiber.Map{
			"error": fmt.Sprintf("Simulated server error %d", code),
		})
	}
}
```

#### Enregistrement des Routes (uniquement en test)

```go
// Routes de test (uniquement en environnement de test)
if os.Getenv("ENVIRONMENT") == "test" {
	testGroup := apiGroup.Group("/test")
	testGroup.Get("/timeout", handlers.GetTestTimeout())
	testGroup.Get("/error", handlers.GetTestError())
	log.Info().Msg("Test endpoints enabled: /api/v1/test/*")
}
```

---

## 📊 Checklist d'Implémentation

### Phase 1 : Infrastructure (Priorité Haute)

- [ ] **Migration de base de données** : Créer les index pour la recherche par source
- [ ] **Méthode storage** : Implémenter `GetDocumentBySourceID` dans `queries.go`
- [ ] **Tests unitaires storage** : Tester la nouvelle méthode

### Phase 2 : Handlers (Priorité Haute)

- [ ] **Handler proof.go** : Créer le fichier avec tous les handlers
- [ ] **Handler account_move** : Implémenter `GetProofAccountMove`
- [ ] **Handler account_payment** : Implémenter `GetProofAccountPayment`
- [ ] **Handler pos_order** : Implémenter `GetProofPosOrder`
- [ ] **Handler pos_payment** : Implémenter `GetProofPosPayment`
- [ ] **Handler bulk** : Implémenter `GetProofsBulk`
- [ ] **Helper buildProofResponse** : Implémenter la construction de réponse standardisée

### Phase 3 : Routes (Priorité Haute)

- [ ] **Enregistrement routes** : Ajouter les routes dans `main.go`
- [ ] **Protection RBAC** : Vérifier les permissions `documents:read`
- [ ] **Rate limiting** : Appliquer le rate limiting approprié

### Phase 4 : Tests (Priorité Moyenne)

- [ ] **Tests unitaires handlers** : Créer `proof_test.go`
- [ ] **Tests d'intégration** : Tester les endpoints end-to-end
- [ ] **Tests de performance** : Vérifier les performances avec bulk

### Phase 5 : Documentation (Priorité Moyenne)

- [ ] **Documentation API** : Créer `PROOF_API.md`
- [ ] **Mise à jour README** : Ajouter les nouveaux endpoints
- [ ] **Exemples** : Ajouter des exemples curl

### Phase 6 : Z-Reports (Priorité Basse)

- [ ] **Handler pos_zreport** : Implémenter avec intégration ledger filesystem
- [ ] **Tests Z-Reports** : Tester la récupération de preuves Z-Reports

### Phase 7 : Endpoints de Test (Optionnel)

- [ ] **Handler test.go** : Créer les endpoints de test
- [ ] **Routes de test** : Enregistrer uniquement en environnement de test
- [ ] **Documentation** : Documenter les endpoints de test

---

## ⏱️ Timeline Estimée

| Phase | Durée Estimée | Dépendances |
|-------|---------------|-------------|
| Phase 1 : Infrastructure | 2 jours | Aucune |
| Phase 2 : Handlers | 3 jours | Phase 1 |
| Phase 3 : Routes | 1 jour | Phase 2 |
| Phase 4 : Tests | 2 jours | Phase 3 |
| Phase 5 : Documentation | 1 jour | Phase 3 |
| Phase 6 : Z-Reports | 2 jours | Phase 2 |
| Phase 7 : Endpoints de Test | 1 jour | Phase 3 |

**Total estimé** : **12 jours** (environ 2,5 semaines)

---

## 🎯 Critères d'Acceptation

### Fonctionnels

- ✅ Tous les endpoints `/api/v1/proof/*` retournent le format standardisé
- ✅ L'endpoint bulk supporte jusqu'à 100 requêtes
- ✅ Les erreurs 404 sont retournées pour les documents non trouvés
- ✅ Les permissions RBAC sont respectées
- ✅ Le rate limiting est appliqué

### Techniques

- ✅ Les index de base de données sont créés
- ✅ Les performances sont acceptables (< 100ms par requête)
- ✅ Les tests unitaires couvrent > 80% du code
- ✅ La documentation est complète et à jour

### Qualité

- ✅ Aucune régression sur les fonctionnalités existantes
- ✅ Le code respecte les conventions du projet
- ✅ Les logs sont appropriés pour le debugging

---

## 📝 Notes Techniques

### Gestion des Types de Source

Les documents peuvent avoir deux types d'identifiants :
- **`odoo_id`** (int) : Pour les factures et paiements classiques
- **`source_id_text`** (string) : Pour les tickets POS (format "POS/2025/0001")

La méthode `GetDocumentBySourceID` doit gérer les deux cas.

### Performance

Les index créés permettront des recherches rapides :
- Index sur `(odoo_model, odoo_id)` pour les IDs numériques
- Index sur `(odoo_model, source_id_text)` pour les IDs textuels

### Compatibilité

Les nouveaux endpoints sont **additifs** et n'affectent pas les endpoints existants :
- `GET /documents/:id` continue de fonctionner
- `GET /api/v1/evidence/:tenant/:z_id` continue de fonctionner

---

## 🔗 Références

- [Réponse à l'équipe dorevia_vault_report](../docs/REPONSE_EQUIPE_DOREVIA_VAULT_TESTS_INTEGRATION.md)
- [Documentation API existante](../docs/POS_TICKETS_API.md)
- [Documentation Z-Reports](../docs/ZREPORTS_API.md)

---

**Document créé le** : 2025-11-24  
**Dernière mise à jour** : 2025-11-24  
**Statut** : 📋 Planifié pour Sprint 8

