# 🔍 Diagnostic - Endpoint /api/v1/pos-tickets

**Date** : 2025-01-14  
**Problème** : 404 Not Found sur `/api/v1/pos-tickets`

---

## ✅ Vérification du Code

L'endpoint `/api/v1/pos-tickets` est **implémenté** dans le code (commit `374add5`, v1.4.0).

**Fichier** : `cmd/vault/main.go` (lignes 331-352)

**Condition d'activation** : L'endpoint n'est activé que si :
- ✅ `db != nil` (base de données configurée)
- ✅ `jwsService != nil` (service JWS configuré)

---

## 🔍 Diagnostic du Problème

### Causes Possibles

1. **Code non déployé** : Le serveur de production n'a pas la version v1.4.0
2. **DB non configurée** : `DATABASE_URL` non configuré ou invalide
3. **JWS non configuré** : Clés JWS manquantes ou invalides
4. **Migration non appliquée** : Migration `005_add_pos_fields.sql` non exécutée

### Vérifications à Effectuer

#### 1. Vérifier la Version Déployée

```bash
curl https://vault.doreviateam.com/version
# Devrait retourner : {"version":"1.4.0"}
```

#### 2. Vérifier les Logs du Serveur

```bash
# Vérifier si l'endpoint est activé
journalctl -u dorevia-vault | grep "POS tickets endpoint"
# Devrait afficher : "POS tickets endpoint enabled: /api/v1/pos-tickets"
# OU : "POS tickets endpoint disabled (requires DB and JWS)"
```

#### 3. Vérifier la Configuration

**Variables d'environnement requises** :
- `DATABASE_URL` : Doit être configuré
- `JWS_ENABLED=true` : Doit être activé
- `JWS_PRIVATE_KEY_PATH` : Doit pointer vers une clé valide
- `JWS_PUBLIC_KEY_PATH` : Doit pointer vers une clé valide

#### 4. Vérifier la Migration DB

```sql
-- Vérifier si les champs POS existent
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'documents' 
  AND column_name IN ('payload_json', 'source_id_text', 'pos_session', 'cashier', 'location');
-- Devrait retourner 5 colonnes
```

---

## 🚀 Solution : Déploiement

### Étapes de Déploiement

1. **Appliquer la migration DB** :
   ```bash
   psql $DATABASE_URL -f migrations/005_add_pos_fields.sql
   ```

2. **Compiler la nouvelle version** :
   ```bash
   go build -o vault cmd/vault/main.go
   ```

3. **Redémarrer le service** :
   ```bash
   sudo systemctl restart dorevia-vault
   ```

4. **Vérifier les logs** :
   ```bash
   journalctl -u dorevia-vault -f
   # Devrait afficher : "POS tickets endpoint enabled: /api/v1/pos-tickets"
   ```

5. **Tester l'endpoint** :
   ```bash
   curl -X POST https://vault.doreviateam.com/api/v1/pos-tickets \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "tenant": "test",
       "source_model": "pos.order",
       "source_id": "POS/001",
       "ticket": {"lines": []}
     }'
   ```

---

## 📋 Checklist de Déploiement

- [ ] Code v1.4.0 déployé
- [ ] Migration DB `005_add_pos_fields.sql` appliquée
- [ ] `DATABASE_URL` configuré et valide
- [ ] `JWS_ENABLED=true` configuré
- [ ] Clés JWS configurées et valides
- [ ] Service redémarré
- [ ] Logs vérifiés (endpoint activé)
- [ ] Test de l'endpoint réussi

---

**Auteur** : Diagnostic Dorevia Vault  
**Date** : 2025-01-14  
**Version** : 1.0

