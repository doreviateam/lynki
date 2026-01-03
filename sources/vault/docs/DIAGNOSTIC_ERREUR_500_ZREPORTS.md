# 🔍 Diagnostic — Erreur 500 Z-Reports sans tickets

**Date** : 2025-01-16  
**Version** : 1.5.1  
**Problème** : Erreur 500 lors de la vaultérisation de Z-Reports sans tickets

---

## 📋 Analyse du Code

### Points de Défaillance Potentiels

1. **Signature JWS** (ligne 308-311 `service.go`)
   - Si `s.signer` est `nil` ou non initialisé → panic
   - Si la signature échoue → erreur 500

2. **Stockage Ledger** (ligne 338-340 `service.go`)
   - Si le ledger filesystem n'est pas accessible → erreur 500
   - Si les permissions sont incorrectes → erreur 500

3. **Repository** (ligne 244 `service.go`)
   - Si `s.repo` est `nil` → panic
   - Si la connexion DB échoue → erreur 500

4. **Handler** (ligne 169-171 `pos_zreports.go`)
   - L'erreur est générique : `"Failed to ingest Z-Report"`
   - Les détails de l'erreur ne sont pas retournés au client

---

## 🔧 Amélioration Proposée

### 1. Améliorer les Messages d'Erreur

Le handler devrait retourner plus de détails dans les erreurs (en mode développement au moins) :

```go
// Dans pos_zreports.go, ligne 169-171
// Erreur générique
return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
    "error": "Failed to ingest Z-Report",
    "details": err.Error(), // Ajouter les détails
})
```

### 2. Vérifier l'Initialisation

Vérifier que tous les services sont correctement initialisés avant utilisation.

---

## 🧪 Tests de Diagnostic

### Test 1 : Vérifier les Logs

```bash
# Vérifier les logs du service
journalctl -u dorevia-vault -f | grep -i "z-report\|error\|failed"

# Ou si le service tourne en arrière-plan
tail -f /tmp/vault.log | grep -i "z-report\|error\|failed"
```

### Test 2 : Vérifier la Configuration

```bash
# Vérifier que DATABASE_URL est configuré
echo $DATABASE_URL

# Vérifier que JWS est configuré
echo $JWS_ENABLED
echo $JWS_PRIVATE_KEY_PATH

# Vérifier que le ledger filesystem existe
ls -la /opt/dorevia-vault/ledger
```

### Test 3 : Test Manuel

```bash
curl -X POST http://localhost:8080/api/v1/pos/zreports \
  -H "Content-Type: application/json" \
  -H "X-Tenant: test" \
  -d '{
    "z_id": "Z-TEST",
    "tickets_count": 0,
    "chain_level": "z-report",
    "tenant": "test"
  }'
```

---

## 🔍 Causes Probables

1. **JWS non initialisé** : Le service JWS n'est pas correctement initialisé
2. **Repository nil** : Le repository PostgreSQL n'est pas initialisé
3. **Ledger inaccessible** : Le répertoire ledger n'est pas accessible en écriture
4. **Erreur de signature** : La signature JWS échoue pour une raison quelconque

---

## ✅ Solution Immédiate

Modifier le handler pour retourner plus de détails dans les erreurs (au moins en mode développement).

