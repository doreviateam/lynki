# ✅ Réponse Support — Erreur 500 Z-Reports sans tickets

**Date** : 2025-01-16  
**À** : Équipe Odoo — Module `dorevia_vault_pos_z_connector`  
**De** : Équipe Vault Backend (doreviateam)  
**Version Vault** : 1.5.1  
**Sujet** : Diagnostic et correction — Erreur 500 lors de la vaultérisation Z-Reports sans tickets

---

## 📋 Diagnostic

Bonjour,

Nous avons analysé le problème et identifié plusieurs causes potentielles pour l'erreur 500. Nous avons également appliqué une amélioration pour faciliter le diagnostic.

---

## 🔍 Causes Probables

### 1. Service JWS non initialisé

Le service JWS est requis pour signer les preuves (evidence). Si le service n'est pas correctement initialisé, la signature échoue et génère une erreur 500.

**Vérification** :
```bash
# Vérifier que JWS est configuré
echo $JWS_ENABLED
echo $JWS_PRIVATE_KEY_PATH

# Vérifier les logs
journalctl -u dorevia-vault -f | grep -i "jws\|sign"
```

### 2. Repository PostgreSQL non initialisé

Le repository PostgreSQL est requis pour valider `last_ticket_hash` (même si optionnel pour `tickets_count = 0`). Si `DATABASE_URL` n'est pas configuré, le repository pourrait être `nil`.

**Vérification** :
```bash
# Vérifier que DATABASE_URL est configuré
echo $DATABASE_URL

# Vérifier les logs
journalctl -u dorevia-vault -f | grep -i "database\|postgres"
```

### 3. Ledger Filesystem inaccessible

Le ledger filesystem doit être accessible en écriture pour stocker les Z-Reports.

**Vérification** :
```bash
# Vérifier que le répertoire existe et est accessible
ls -la /opt/dorevia-vault/ledger

# Vérifier les permissions
stat /opt/dorevia-vault/ledger
```

### 4. Erreur lors de la signature ou du stockage

Une erreur peut survenir lors de la signature JWS ou du stockage dans le ledger filesystem.

---

## ✅ Amélioration Appliquée

Nous avons modifié le handler pour retourner **plus de détails dans les erreurs 500**, ce qui facilitera le diagnostic.

### Avant

```json
{
  "error": "Failed to ingest Z-Report"
}
```

### Après (Version 1.5.2)

```json
{
  "error": "Failed to ingest Z-Report",
  "details": "failed to sign evidence: JWS service not initialized"
}
```

**Note** : Cette modification sera disponible dans la prochaine version (1.5.2).

---

## 🧪 Tests de Diagnostic

### Test 1 : Vérifier les Logs Serveur

```bash
# Vérifier les logs du service Vault
journalctl -u dorevia-vault -n 100 | grep -i "z-report\|error\|failed"

# Ou si le service tourne en arrière-plan
tail -f /tmp/vault.log | grep -i "z-report\|error\|failed"
```

### Test 2 : Test avec Détails d'Erreur

Avec la version améliorée, vous devriez maintenant recevoir plus de détails :

```bash
curl -X POST https://vault.doreviateam.com/api/v1/pos/zreports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: 1" \
  -d '{
    "z_id": "Z2025-11-16-963",
    "company_id": 1,
    "sequence": 1,
    "date_open": "2025-11-16T16:44:50Z",
    "date_close": "2025-11-16T16:44:50Z",
    "totals": {
      "amount_total": 0.0,
      "amount_tax": 0.0,
      "amount_net": 0.0
    },
    "payments": [],
    "tickets": [],
    "tickets_count": 0,
    "hash_prev": null,
    "chain_level": "z-report",
    "tenant": "1"
  }'
```

**Résultat attendu** : Une erreur avec plus de détails, par exemple :
```json
{
  "error": "Failed to ingest Z-Report",
  "details": "failed to sign evidence: JWS service not initialized"
}
```

---

## 🔧 Actions Recommandées

### Côté Vault (Équipe Backend)

1. **Vérifier la configuration** :
   - `DATABASE_URL` est configuré
   - `JWS_ENABLED=true` et `JWS_PRIVATE_KEY_PATH` pointent vers un fichier existant
   - `LEDGER_FILESYSTEM_PATH` est configuré et accessible

2. **Vérifier les logs** :
   - Identifier l'erreur exacte dans les logs
   - Vérifier que tous les services sont initialisés

3. **Déployer la version améliorée** (1.5.2) :
   - Les erreurs 500 retourneront maintenant plus de détails
   - Facilite le diagnostic

### Côté Odoo

1. **Réessayer après le déploiement** :
   - La nouvelle version retournera plus de détails
   - Facilite l'identification du problème

2. **Partager les détails d'erreur** :
   - Si l'erreur persiste, partager le message d'erreur détaillé
   - Cela nous permettra d'identifier rapidement la cause

---

## 📊 Checklist de Vérification

- [ ] `DATABASE_URL` configuré
- [ ] `JWS_ENABLED=true` et clés JWS disponibles
- [ ] `LEDGER_FILESYSTEM_PATH` configuré et accessible
- [ ] Service Vault redémarré avec la nouvelle configuration
- [ ] Logs vérifiés pour identifier l'erreur exacte
- [ ] Test effectué avec le nouveau payload

---

## ⏱️ Prochaines Étapes

1. **Immédiat** : Vérifier les logs serveur pour identifier l'erreur exacte
2. **Court terme** : Déployer la version 1.5.2 avec les détails d'erreur améliorés
3. **Suivi** : Tester à nouveau avec le payload Odoo et partager les résultats

---

## 📞 Support

En cas de problème persistant :

1. Vérifier les logs : `journalctl -u dorevia-vault -f`
2. Vérifier la configuration : Variables d'environnement et fichiers
3. Partager les détails d'erreur (avec la version 1.5.2)

---

**Date** : 2025-01-16  
**Statut** : 🔍 **En diagnostic**  
**Version** : 1.5.1 (1.5.2 en préparation avec améliorations)

---

**Merci pour votre patience !** 🙏

