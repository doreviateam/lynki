# 🔧 Correction URL de Preuve — Cas Concret

**Date** : 2025-12-13  
**Document ID** : `a4d51a95-0c5d-41e0-9725-705be475b5b4`

---

## ❌ URL Incorrecte (Actuelle)

```
https://vault.doreviateam.com/api/v1/push_document/verify/eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleS0yMDI1LVExIiwidHlwIjoiSldUIn0.eyJkb2N1bWVudF9pZCI6ImE0ZDUxYTk1LTBjNWQtNDFlMC05NzI1LTcwNWJlNDc1YjViNCIsImlhdCI6MTc2NTU1Mjg5Nywic2hhMjU2IjoiM2YzNGE2OTM5ZDE0ZDRjYTY3NzQ1NDJkYmU3Yjg5NDljYzhjZDk0NjQ3MGI1MjJkODIxMDQxNWMzZjVlNTgzOCIsInRpbWVzdGFtcCI6IjIwMjUtMTItMTJUMTU6MjE6MzdaIn0.HlWZo7GB1X6zAh16zUywJLO1qyLISprnbkc2LCGDrxsKM6ZqW5px0IhtS0OaSWJgAJ9dSYb8FEsYvY8eMjY9yqCCea9b9iNGgXxi8KKYy1_OOAb18KWqyqY5oOF10PXnniYHEa4rsaW-BIghwgSOK3P0j2PpF1-XSXVuUMXJ141LWk0SYZN66gLJcdP01DSY_bts80KJKkuCEHscPDS4V8vWqnukoOlTRln0fWmvG5Qf6ofg253ckf9Iwj6eeKoQaqUj-EdHh_n8-PPsGASZcVfxJe8w9NH_-XTNX3tS6835R5j9i3S84kTMjGKYkAb0nz2iUATar_VgK2PuWiYKqg
```

**Problème** : Cette URL n'existe pas dans l'API Vault → Erreur 500

---

## ✅ URL Correcte (À Utiliser)

```
https://vault.doreviateam.com/api/v1/ledger/verify/a4d51a95-0c5d-41e0-9725-705be475b5b4
```

**Solution** : Utiliser le `document_id` extrait du JWT

---

## 📊 Informations Extraites du JWT

**JWT décodé** :
```json
{
  "header": {
    "alg": "RS256",
    "kid": "key-2025-Q1",
    "typ": "JWT"
  },
  "payload": {
    "document_id": "a4d51a95-0c5d-41e0-9725-705be475b5b4",
    "iat": 1765552897,
    "sha256": "3f34a6939d14d4ca6774542dbe7b8949cc8cd946470b522d8210415c3f5e5838",
    "timestamp": "2025-12-12T15:21:37Z"
  }
}
```

**Informations clés** :
- **Document ID** : `a4d51a95-0c5d-41e0-9725-705be475b5b4` ← **À utiliser dans l'URL**
- **Hash SHA256** : `3f34a6939d14d4ca6774542dbe7b8949cc8cd946470b522d8210415c3f5e5838`
- **Timestamp** : `2025-12-12T15:21:37Z`

---

## 🔧 Correction dans Odoo

### Code Python à Modifier

**Avant (incorrect)** :
```python
# ❌ INCORRECT
record.vault_proof_url = f"{vault_url}/api/v1/push_document/verify/{record.vault_evidence_jws}"
```

**Après (correct)** :
```python
# ✅ CORRECT
import jwt

decoded = jwt.decode(
    record.vault_evidence_jws,
    options={"verify_signature": False}
)
document_id = decoded.get("document_id")
record.vault_proof_url = f"{vault_url}/api/v1/ledger/verify/{document_id}"
```

### Exemple Complet

```python
@api.depends('vault_evidence_jws')
def _compute_vault_proof_url(self):
    """Génère l'URL de preuve à partir du JWT."""
    for record in self:
        if not record.vault_evidence_jws:
            record.vault_proof_url = False
            continue
        
        try:
            import jwt
            decoded = jwt.decode(
                record.vault_evidence_jws,
                options={"verify_signature": False}
            )
            document_id = decoded.get("document_id")
            
            if document_id:
                vault_url = self.env['ir.config_parameter'].sudo().get_param(
                    'dorevia.vault.url',
                    'https://vault.doreviateam.com'
                )
                # ✅ URL CORRECTE
                record.vault_proof_url = f"{vault_url}/api/v1/ledger/verify/{document_id}"
            else:
                record.vault_proof_url = False
        except Exception as e:
            _logger.error("Failed to generate proof URL: %s", str(e))
            record.vault_proof_url = False
```

---

## 🧪 Test de l'URL Correcte

### Avec curl

```bash
curl -X GET "https://vault.doreviateam.com/api/v1/ledger/verify/a4d51a95-0c5d-41e0-9725-705be475b5b4" \
  -H "Content-Type: application/json"
```

### Résultat Obtenu (2025-12-13)

```json
{
  "valid": false,
  "document_id": "a4d51a95-0c5d-41e0-9725-705be475b5b4",
  "checks": [
    {
      "component": "database",
      "status": "ok",
      "message": "Document found: payment-PAY/3.json"
    },
    {
      "component": "file",
      "status": "missing",
      "message": "No stored_path in database"
    }
  ],
  "errors": ["No stored_path in database"],
  "timestamp": "2025-12-13T23:52:51Z"
}
```

**✅ Important** : L'endpoint fonctionne maintenant (pas d'erreur 500) !  
**⚠️ Note** : Le document existe dans la base de données mais le fichier n'est pas trouvé. C'est un problème de stockage séparé, mais l'URL est correcte.

---

## 📚 Références

- **Guide complet** : `GUIDE_CORRECTION_URL_PREUVE_ODOO.md`
- **Réponse technique** : `REPONSE_EQUIPE_ODOO_ERREUR_500_PREUVE_JWS.md`

---

**Fin du document.**

