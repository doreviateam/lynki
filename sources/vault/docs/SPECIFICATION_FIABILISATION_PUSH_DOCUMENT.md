# 📘 Spécification Technique --- Fiabilisation Définitive de l'Endpoint `/push_document`

Version : **Dorevia Vault v1.6.0**  
Auteur : **Doreviateam**  
Date : **2025-11-25**  
Statut : **VALIDÉ --- À IMPLÉMENTER**

---

# 1. 🎯 Objectif

Corriger définitivement l'erreur :

    VaultPermanentError: Réponse vide du Vault

provenant de l'API `/push_document`.

Cette spec impose un **contrat API strict**, une **réponse JSON obligatoire**, et un **système anti-panic** rendant impossible toute réponse vide, quel que soit l'état interne du Vault.

---

# 2. 🧩 Contexte

Le Vault renvoie parfois un body vide :
- Panic Go
- Timeout interne
- FormData incorrect
- Échec dans la sérialisation JSON
- Retour Fiber sans `return`

Odoo interprète logiquement cela comme une **erreur permanente**.

**Ceci doit devenir impossible.**

---

# 3. 🔍 Analyse Technique des Causes

### 3.1 Panics non interceptés

Fiber sans middleware `recover()` → body vide.

### 3.2 JSON non écrit (write-after-header)

Cas courant en Go :  
`c.JSON()` sans `return`.

### 3.3 EOF interne / connexion coupée

Goroutine interrompue → header envoyé mais pas le body.

### 3.4 Timeout silencieux

`Context deadline exceeded` → Fiber renvoie rien.

---

# 4. 🎯 Contrat API Obligatoire

### 4.1 En cas de succès

```json
{
  "status": "success",
  "document_id": "uuid",
  "hash": "sha256",
  "timestamp": "rfc3339"
}
```

### 4.2 Erreur temporaire (retryable)

```json
{
  "status": "error",
  "type": "temporary",
  "message": "hash timeout",
  "retryable": true
}
```

### 4.3 Erreur permanente

```json
{
  "status": "error",
  "type": "permanent",
  "message": "invalid PDF",
  "retryable": false
}
```

### 4.4 Panic interne

```json
{
  "status": "error",
  "type": "system",
  "message": "internal panic",
  "retryable": true
}
```

---

# 5. 🛡️ Middleware Anti-Panic Global

```go
app.Use(func(c *fiber.Ctx) error {
    defer func() {
        if r := recover(); r != nil {
            log.Errorf("panic recovered: %v", r)
            _ = c.Status(500).JSON(fiber.Map{
                "status": "error",
                "type": "system",
                "message": "internal panic",
                "retryable": true,
            })
        }
    }()

    return c.Next()
})
```

**Effet :** plus aucun panic ne peut renvoyer un body vide.

---

# 6. 🔐 Correctif de `/push_document`

```go
func PushDocument(c *fiber.Ctx) error {
    input, err := parseFormData(c)
    if err != nil {
        return c.Status(400).JSON(errorPermanent(err))
    }

    docID, hash, err := vault.Store(input)
    if err != nil {
        if errors.Is(err, ErrTemporary) {
            return c.Status(503).JSON(errorTemporary(err))
        }
        return c.Status(400).JSON(errorPermanent(err))
    }

    return c.JSON(fiber.Map{
        "status": "success",
        "document_id": docID,
        "hash": hash,
        "timestamp": time.Now().Format(time.RFC3339),
    })
}
```

### Règle absolue :

**Chaque chemin de code se termine par un `return c.JSON(...)`**

---

# 7. 🛠️ Helpers Officiels

```go
func errorTemporary(err error) fiber.Map {
    return fiber.Map{
        "status": "error",
        "type": "temporary",
        "message": err.Error(),
        "retryable": true,
    }
}

func errorPermanent(err error) fiber.Map {
    return fiber.Map{
        "status": "error",
        "type": "permanent",
        "message": err.Error(),
        "retryable": false,
    }
}
```

---

# 8. 📡 Mise à jour du client Odoo

Dans `vault_client.py`, remplacer :

-   Body vide = PermanentError  
    par  
-   Body vide = **TemporaryError** (car le Vault corrigé garantit un JSON)

---

# 9. 🧪 Tests Go Obligatoires

### 9.1 Unitaires

-   panic recovery
-   JSON non vide
-   erreur temporaire
-   erreur permanente
-   succès standard

### 9.2 Intégration

-   envoi PDF réel
-   envoi PDF vide
-   Metadata malformée
-   stress test (100 req/sec)

---

# 10. 🧪 Tests Odoo Obligatoires

| Test                      | Objectif                                                      |
|---------------------------|---------------------------------------------------------------|
| test_response_not_empty   | Vérifie que Vault renvoie toujours du JSON                   |
| test_retry_on_temporary   | DVUW doit requeue automatiquement                            |
| test_fail_on_permanent    | DVUW doit marquer failed                                     |
| test_push_valid           | Flux nominal                                                 |
| test_pdf_zero             | Erreur permanente propre                                    |

---

# 11. 🔁 Compatibilité Ascendante

Aucun breaking change.  
Odoo reçoit **plus d'informations** qu'avant.

---

# 12. 📂 Versioning & Déploiement

-   Introduire en **v1.6.0**  
-   Mise à jour hot‑compatible  
-   Aucun changement client requis côté Odoo

---

# 13. ✔️ Checklist finale

-   [ ] Middleware anti-panic activé
-   [ ] `/push_document` → JSON garanti
-   [ ] Jamais de body vide
-   [ ] Tests Go OK
-   [ ] Tests Odoo OK
-   [ ] Monitoring Prometheus complet

---

# 14. ✅ Conclusion

Cette spec garantit **la fiabilité absolue** de `/push_document`.  
Plus jamais un body vide.  
Plus jamais une erreur silencieuse.  
Plus jamais un panic non intercepté.

**Dorevia Vault devient certifiable, stable et conforme au design DVUW.**

---

Document officiel --- Dorevia Vault 2025

