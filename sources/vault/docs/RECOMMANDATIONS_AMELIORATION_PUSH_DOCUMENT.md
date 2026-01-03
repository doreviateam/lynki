# 🔧 Recommandations d'Amélioration - Handler `push_document`

**Date** : 2025-12-11  
**Contexte** : Investigation du document FAC/2025/00020 introuvable après vaultérisation réussie

---

## 📋 Problème Identifié

Dans le handler `PushDocumentHandler` (`internal/handlers/push_document.go`), si la récupération du document après stockage échoue (lignes 237-249), le handler retourne **quand même** un `vault_id` avec un message de succès.

**Code actuel** (lignes 237-249) :

```go
// Récupérer le document depuis la DB pour obtenir evidence_jws et ledger_hash
storedDoc, err := db.GetDocumentByID(ctx, docID)
if err != nil {
    // Si on ne peut pas récupérer le document, on retourne quand même une réponse avec les infos disponibles
    if log != nil {
        log.Warn().Err(err).Str("document_id", docID.String()).Msg("Failed to retrieve document after storage, returning partial response")
    }
    // Réponse minimale si on ne peut pas récupérer le document
    return c.Status(fiber.StatusCreated).JSON(fiber.Map{
        "id":         docID.String(),
        "sha256_hex": sha256Hex,
        "created_at": doc.CreatedAt.Format(time.RFC3339),
        "message":    "Document vaulted successfully",
    })
}
```

**Risque** : Si `GetDocumentByID` échoue pour une raison autre qu'un problème de timing (par exemple, le document n'a pas été réellement commité), le client reçoit un `vault_id` qui ne correspond à aucun document existant.

---

## 🎯 Recommandations

### 1. Ajouter un Retry avec Backoff

**Objectif** : Gérer les problèmes de timing (isolation de transaction, réplication, etc.) tout en garantissant que le document existe vraiment.

**Implémentation proposée** :

```go
// Récupérer le document depuis la DB pour obtenir evidence_jws et ledger_hash
// Ajouter un retry pour gérer les problèmes de timing
var storedDoc *models.Document
var err error
maxRetries := 3
retryDelay := 100 * time.Millisecond

for attempt := 0; attempt < maxRetries; attempt++ {
    storedDoc, err = db.GetDocumentByID(ctx, docID)
    if err == nil {
        break // Succès
    }
    
    // Si c'est la dernière tentative, on sort de la boucle
    if attempt == maxRetries-1 {
        break
    }
    
    // Attendre avant de réessayer
    if log != nil {
        log.Debug().
            Err(err).
            Str("document_id", docID.String()).
            Int("attempt", attempt+1).
            Msg("Retrying document retrieval after storage")
    }
    time.Sleep(retryDelay)
    retryDelay *= 2 // Backoff exponentiel
}

if err != nil {
    // Vérifier si c'est vraiment "document not found" ou une autre erreur
    if err.Error() == "document not found" {
        // ⚠️ CRITIQUE : Le document n'existe pas malgré le stockage réussi
        if log != nil {
            log.Error().
                Err(err).
                Str("document_id", docID.String()).
                Str("sha256", sha256Hex).
                Msg("CRITICAL: Document stored but not found in database - possible transaction rollback")
        }
        // Retourner une erreur temporaire pour permettre un retry côté client
        return c.Status(fiber.StatusInternalServerError).JSON(errorTemporary(
            fmt.Errorf("document stored but verification failed - please retry"),
        ))
    }
    
    // Autre erreur (timeout, connexion, etc.)
    if log != nil {
        log.Warn().
            Err(err).
            Str("document_id", docID.String()).
            Msg("Failed to retrieve document after storage (non-critical error)")
    }
    // Retourner une réponse partielle avec un avertissement
    return c.Status(fiber.StatusCreated).JSON(fiber.Map{
        "id":         docID.String(),
        "sha256_hex": sha256Hex,
        "created_at": doc.CreatedAt.Format(time.RFC3339),
        "message":    "Document vaulted successfully (verification pending)",
        "warning":    "Document verification failed - please verify document existence",
    })
}
```

### 2. Améliorer les Logs de Traçabilité

**Objectif** : Faciliter le diagnostic en cas de problème.

**Ajouter dans `StoreDocumentWithEvidence`** :

```go
// Après le COMMIT (ligne 177)
db.log.Info().
    Str("document_id", docID.String()).
    Str("sha256", sha256Hex).
    Str("tenant", func() string {
        if doc.Tenant != nil {
            return *doc.Tenant
        }
        return "none"
    }()).
    Bool("jws_generated", jws != "").
    Bool("ledger_appended", ledgerHash != "").
    Str("file_path", finalPath).
    Msg("Document transaction committed successfully")

// Après le déplacement de fichier (ligne 183)
db.log.Info().
    Str("document_id", docID.String()).
    Str("file_path", finalPath).
    Msg("Document file moved successfully")
```

### 3. Ajouter une Vérification Post-Commit

**Objectif** : Vérifier que le document est bien visible après le commit.

**Ajouter dans `StoreDocumentWithEvidence`** (après le COMMIT) :

```go
// 11. COMMIT (avec timeout)
if err := tx.Commit(txCtx); err != nil {
    os.Remove(tmpPath)
    return fmt.Errorf("failed to commit transaction: %w", err)
}

// 11.5. Vérification post-commit (nouveau)
// Vérifier que le document est bien visible après le commit
verifyCtx, verifyCancel := context.WithTimeout(context.Background(), 2*time.Second)
defer verifyCancel()

var verifyID uuid.UUID
err = db.Pool.QueryRow(verifyCtx, "SELECT id FROM documents WHERE id = $1", docID).Scan(&verifyID)
if err != nil {
    db.log.Error().
        Err(err).
        Str("document_id", docID.String()).
        Msg("WARNING: Document not visible after commit - possible replication delay")
    // Ne pas retourner d'erreur, mais logger l'avertissement
}
```

### 4. Endpoint de Diagnostic

**Créer un endpoint de diagnostic** pour vérifier l'état d'un document :

```go
// GET /api/v1/diagnostic/document/{id}
func DiagnosticDocumentHandler(db *storage.DB) fiber.Handler {
    return func(c *fiber.Ctx) error {
        idStr := c.Params("id")
        id, err := uuid.Parse(idStr)
        if err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "Invalid document ID",
            })
        }

        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()

        // Vérifier en base
        doc, err := db.GetDocumentByID(ctx, id)
        existsInDB := err == nil

        // Vérifier sur disque
        fileExists := false
        var fileSize int64
        if existsInDB {
            if info, err := os.Stat(doc.StoredPath); err == nil {
                fileExists = true
                fileSize = info.Size()
            }
        }

        response := fiber.Map{
            "vault_id":          idStr,
            "exists_in_database": existsInDB,
            "exists_on_disk":     fileExists,
        }

        if existsInDB {
            response["document"] = fiber.Map{
                "id":           doc.ID.String(),
                "filename":     doc.Filename,
                "sha256_hex":   doc.SHA256Hex,
                "created_at":   doc.CreatedAt.Format(time.RFC3339),
                "tenant":       doc.Tenant,
                "has_jws":      doc.EvidenceJWS != nil && *doc.EvidenceJWS != "",
                "has_ledger":   doc.LedgerHash != nil && *doc.LedgerHash != "",
                "file_path":    doc.StoredPath,
                "file_size":    fileSize,
            }
        } else {
            response["error"] = "Document not found in database"
        }

        return c.JSON(response)
    }
}
```

---

## 📊 Impact des Modifications

### Avantages

1. **Robustesse** : Réduction du risque de retourner un `vault_id` pour un document inexistant
2. **Traçabilité** : Logs améliorés pour faciliter le diagnostic
3. **Diagnostic** : Endpoint dédié pour vérifier l'état d'un document
4. **Résilience** : Gestion des problèmes de timing avec retry

### Risques

1. **Changement de comportement** : Les clients qui s'attendent à toujours recevoir un `vault_id` pourraient être impactés
2. **Performance** : Le retry ajoute une latence (max 300ms avec 3 tentatives)
3. **Complexité** : Code légèrement plus complexe

### Migration

**Recommandation** : Implémenter ces améliorations progressivement :

1. **Phase 1** : Ajouter les logs améliorés (pas de changement de comportement)
2. **Phase 2** : Ajouter le retry avec backoff (comportement amélioré mais compatible)
3. **Phase 3** : Ajouter l'endpoint de diagnostic (nouvelle fonctionnalité)
4. **Phase 4** : Ajouter la vérification post-commit (amélioration optionnelle)

---

## 🧪 Tests à Effectuer

### Tests Unitaires

1. **Test de retry** : Vérifier que le retry fonctionne correctement
2. **Test d'erreur critique** : Vérifier que les erreurs "document not found" sont bien gérées
3. **Test de timing** : Simuler un délai de réplication

### Tests d'Intégration

1. **Test end-to-end** : Vérifier le flux complet de vaultérisation
2. **Test de diagnostic** : Vérifier que l'endpoint de diagnostic fonctionne
3. **Test de charge** : Vérifier que le retry n'impacte pas les performances

---

## 📝 Checklist d'Implémentation

- [ ] Ajouter le retry avec backoff dans `push_document.go`
- [ ] Améliorer les logs dans `StoreDocumentWithEvidence`
- [ ] Ajouter la vérification post-commit (optionnel)
- [ ] Créer l'endpoint de diagnostic
- [ ] Ajouter les tests unitaires
- [ ] Ajouter les tests d'intégration
- [ ] Mettre à jour la documentation API
- [ ] Déployer en environnement de test
- [ ] Valider en environnement de test
- [ ] Déployer en production

---

## 🔗 Références

- **Handler push_document** : `internal/handlers/push_document.go`
- **Stockage avec evidence** : `internal/storage/document_with_evidence.go`
- **Récupération par ID** : `internal/storage/queries.go:GetDocumentByID`
- **Document d'investigation** : `INVESTIGATION_DOCUMENT_FAC_00020.md`

---

**Fin du Document de Recommandations**
