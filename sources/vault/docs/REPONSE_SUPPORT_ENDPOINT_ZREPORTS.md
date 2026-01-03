# ✅ Réponse de Support — Endpoint Z-Reports Vault

**Date** : 2025-11-16  
**Module Odoo** : `dorevia_vault_pos_z_connector` v0.2.0  
**Version Vault** : 1.5.0 (Sprint 7)  
**Priorité** : 🔴 Haute

---

## 📋 Résumé Exécutif

**Statut** : ✅ L'endpoint `/api/v1/pos/zreports` est **implémenté et disponible** dans la version 1.5.0, mais il n'est **pas activé** sur le serveur de production car les variables d'environnement requises ne sont pas configurées.

**Action requise** : Configuration des variables d'environnement et redémarrage du service Vault.

**Temps estimé de résolution** : 5-10 minutes

---

## ✅ Réponses aux Questions

### 1. Disponibilité de l'Endpoint

#### ✅ L'endpoint `/api/v1/pos/zreports` est-il actif et déployé ?

**Réponse** : 
- ✅ **Code implémenté** : Oui, dans la version 1.5.0 (Sprint 7)
- ⚠️ **Endpoint activé** : Non, désactivé sur le serveur de production
- ✅ **Déployé** : Oui, le code est déployé mais l'endpoint nécessite une configuration

**Raison de la désactivation** : L'endpoint n'est activé que si **toutes** ces conditions sont remplies :
- Base de données PostgreSQL accessible (`DATABASE_URL`)
- Service JWS activé (`JWS_ENABLED=true`)
- Ledger filesystem configuré (`LEDGER_FILESYSTEM_PATH`)

**Référence code** : `cmd/vault/main.go:372-388`

#### ✅ L'endpoint est-il accessible depuis notre environnement Odoo ?

**Réponse** : Une fois activé, l'endpoint sera accessible depuis n'importe quel environnement Odoo avec un token valide.

#### ✅ Y a-t-il des restrictions d'accès (IP, firewall, etc.) ?

**Réponse** : Non, aucune restriction IP. L'accès est contrôlé uniquement par :
- Authentification JWT/API Key (header `Authorization`)
- Permission RBAC : `documents:write`

---

### 2. Format de la Requête

#### ✅ Le format du payload est-il correct selon la spécification Vault API 1.5.0 ?

**Réponse** : ✅ **Oui, le format est correct**. Votre payload correspond exactement à la spécification.

**Validation** :
- ✅ Tous les champs requis sont présents
- ✅ Format des dates RFC3339 correct (`2025-11-16T12:45:33Z`)
- ✅ Structure `totals`, `payments`, `tickets` correcte
- ✅ `chain_level: "z-report"` correct

#### ✅ Les headers requis sont-ils présents et corrects ?

**Réponse** : ✅ **Oui, les headers sont corrects** :
- ✅ `Authorization: Bearer <token>` — Correct
- ✅ `Content-Type: application/json` — Correct
- ✅ `X-Tenant: <tenant_id>` — Correct

#### ✅ Le format de date RFC3339 est-il accepté ?

**Réponse** : ✅ **Oui**, le format RFC3339 est le format requis et accepté.

---

### 3. Authentification

#### ✅ Le token JWT est-il valide pour cet endpoint ?

**Réponse** : Si le token fonctionne pour les autres endpoints (`/api/v1/invoices`, `/api/v1/pos-tickets`), il fonctionnera également pour `/api/v1/pos/zreports` une fois l'endpoint activé.

#### ✅ Le header `X-Tenant` est-il correctement interprété ?

**Réponse** : ✅ **Oui**, le header `X-Tenant` est requis et doit correspondre au champ `tenant` dans le payload.

#### ✅ Y a-t-il des permissions spécifiques requises pour cet endpoint ?

**Réponse** : ✅ **Oui**, la permission `documents:write` est requise (identique aux autres endpoints d'ingestion).

---

### 4. Réponse Attendue

#### ✅ Quel est le format de réponse attendu ?

**Réponse** : Format de réponse (201 Created) :

```json
{
  "z_id": "POS/00009",
  "tenant": "<tenant_id>",
  "hash_current": "abc123def456...",
  "hash_prev": null,
  "evidence_jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "timestamp": "2025-11-16T12:47:01Z",
  "proof_url": "/api/v1/evidence/<tenant_id>/POS/00009"
}
```

#### ✅ Quels sont les codes HTTP possibles ?

**Réponse** : Codes HTTP possibles :

| Code | Signification |
|------|---------------|
| `201 Created` | Z-Report créé avec succès |
| `400 Bad Request` | Erreur de validation (tenant mismatch, format invalide, etc.) |
| `401 Unauthorized` | Token manquant ou invalide |
| `403 Forbidden` | Permission insuffisante |
| `404 Not Found` | Endpoint non activé (votre cas actuel) |
| `413 Request Entity Too Large` | Payload > 1 MB |
| `500 Internal Server Error` | Erreur serveur (ticket non trouvé, etc.) |

#### ✅ Y a-t-il des cas d'erreur spécifiques à gérer ?

**Réponse** : Oui, cas d'erreur spécifiques :

1. **`last_ticket_hash` non trouvé** : Le ticket POS doit être vaulté avant le Z-Report
2. **`hash_prev` mismatch** : Le `hash_prev` doit correspondre au `hash_current` du Z précédent
3. **`tickets_count` mismatch** : `tickets_count` doit égaler `len(tickets)`
4. **Tenant mismatch** : Le `X-Tenant` header doit correspondre au champ `tenant` du payload

---

### 5. Logs et Diagnostic

#### ✅ Pouvez-vous vérifier les logs Vault pour voir si la requête arrive ?

**Réponse** : ⚠️ **Non, la requête n'arrive probablement pas** car l'endpoint n'est pas enregistré. Le serveur retourne une réponse vide car la route n'existe pas.

**Vérification effectuée** :
```bash
curl -X POST http://localhost:8080/api/v1/pos/zreports \
  -H "Content-Type: application/json" \
  -H "X-Tenant: test" \
  -d '{}'

# Résultat : {"error":"Cannot POST /api/v1/pos/zreports"}
```

#### ✅ Y a-t-il des erreurs côté Vault lors de la réception de la requête ?

**Réponse** : Non, car l'endpoint n'est pas activé. Aucune requête n'est traitée.

#### ✅ Pouvez-vous nous fournir un exemple de requête réussie ?

**Réponse** : Voir section "Exemple de Requête" ci-dessous.

---

## 🔧 Solution : Activation de l'Endpoint

### Diagnostic Effectué

**Problème identifié** : L'endpoint n'est pas activé car les variables d'environnement suivantes ne sont pas configurées au démarrage du service :

- ❌ `DATABASE_URL` — Non configuré
- ❌ `JWS_ENABLED` — Non activé
- ✅ `LEDGER_FILESYSTEM_PATH` — Configuré (répertoire existe)

### Solution Immédiate

**Action requise côté Vault** :

#### Étape 1 : Configurer les Variables d'Environnement

```bash
# Sur le serveur Vault
export DATABASE_URL=postgresql://user:password@localhost:5432/dorevia_vault
export JWS_ENABLED=true
export JWS_PRIVATE_KEY_PATH=/opt/dorevia-vault/keys/private.pem
export JWS_PUBLIC_KEY_PATH=/opt/dorevia-vault/keys/public.pem
export LEDGER_FILESYSTEM_PATH=/opt/dorevia-vault/ledger
```

**Ou créer un fichier `.env`** :

```bash
cd /opt/dorevia-vault
cat >> .env << 'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/dorevia_vault
JWS_ENABLED=true
JWS_PRIVATE_KEY_PATH=/opt/dorevia-vault/keys/private.pem
JWS_PUBLIC_KEY_PATH=/opt/dorevia-vault/keys/public.pem
LEDGER_FILESYSTEM_PATH=/opt/dorevia-vault/ledger
ZREPORT_MAX_SIZE_BYTES=1048576
ZREPORT_FSYNC_ENABLED=true
EOF
```

#### Étape 2 : Redémarrer le Service

```bash
# Arrêter le service actuel
pkill -f bin/vault

# Attendre 2 secondes
sleep 2

# Redémarrer avec les nouvelles variables
cd /opt/dorevia-vault
source .env  # Si vous utilisez .env
./bin/vault
```

**Ou via systemd** :

```bash
sudo systemctl restart dorevia-vault
```

#### Étape 3 : Vérifier l'Activation

```bash
# Test 1 : Vérifier que l'endpoint répond
curl -X POST http://localhost:8080/api/v1/pos/zreports \
  -H "Content-Type: application/json" \
  -H "X-Tenant: test" \
  -d '{}'

# Résultat attendu : Erreur de validation (pas "Cannot POST")
# Exemple : {"error":"Missing required field: z_id"}

# Test 2 : Health check Z-Reports
curl http://localhost:8080/api/v1/health/zreports

# Résultat attendu : {"status":"healthy","ledger_path":"/opt/dorevia-vault/ledger","fsync_enabled":true}
```

**Message attendu dans les logs** :
```
✅ "Z-Reports endpoint enabled: /api/v1/pos/zreports"
```

---

## 📝 Exemple de Requête Réussie

### Requête

```bash
curl -X POST https://vault.doreviateam.com/api/v1/pos/zreports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: laplatine" \
  -d '{
    "z_id": "POS/00009",
    "company_id": 1,
    "sequence": 1,
    "date_open": "2025-11-16T12:45:33Z",
    "date_close": "2025-11-16T12:47:01Z",
    "totals": {
      "amount_total": 3000.00,
      "amount_tax": 0.00,
      "amount_net": 3000.00
    },
    "payments": [
      {"method": "Espèces", "amount": 3000.00}
    ],
    "tickets": ["POS/00009"],
    "tickets_count": 1,
    "last_ticket_hash": "SHA256_DU_TICKET_VAULTE",
    "chain_level": "z-report",
    "tenant": "laplatine"
  }'
```

### Réponse Attendue (201 Created)

```json
{
  "z_id": "POS/00009",
  "tenant": "laplatine",
  "hash_current": "abc123def456789...",
  "hash_prev": null,
  "evidence_jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "timestamp": "2025-11-16T12:47:01Z",
  "proof_url": "/api/v1/evidence/laplatine/POS/00009"
}
```

---

## ⚠️ Points d'Attention

### 1. Prérequis : Ticket POS Vaulté

**Important** : Le `last_ticket_hash` doit correspondre à un ticket POS déjà vaulté via `POST /api/v1/pos-tickets`. Si le ticket n'existe pas, l'API retournera une erreur 500.

**Workflow recommandé** :
1. Vaultériser les tickets POS via `POST /api/v1/pos-tickets`
2. Récupérer le `sha256_hex` de chaque ticket
3. Utiliser le dernier `sha256_hex` comme `last_ticket_hash` dans le Z-Report

### 2. Validation du Tenant

Le header `X-Tenant` doit **exactement correspondre** au champ `tenant` dans le payload. Sinon, erreur 400.

### 3. Chaînage Cryptographique

- **Premier Z du mois** : `hash_prev` doit être `null` ou omis
- **Z suivants** : `hash_prev` doit correspondre au `hash_current` du Z précédent

---

## 📊 Checklist de Résolution

### Côté Vault (Action Requise)

- [ ] Configurer `DATABASE_URL`
- [ ] Configurer `JWS_ENABLED=true`
- [ ] Vérifier `JWS_PRIVATE_KEY_PATH` pointe vers fichier existant
- [ ] Vérifier `LEDGER_FILESYSTEM_PATH` configuré
- [ ] Redémarrer le service Vault
- [ ] Vérifier les logs montrent "Z-Reports endpoint enabled"
- [ ] Tester l'endpoint localement
- [ ] Confirmer que l'endpoint répond (même avec erreur de validation)

### Côté Odoo (Aucune Action Requise)

- [x] Code correct
- [x] Endpoint correct (`/api/v1/pos/zreports`)
- [x] Format payload correct
- [x] Headers corrects
- [x] Gestion d'erreurs en place

---

## 🔍 Scripts de Diagnostic

### Script de Diagnostic Automatique

Un script de diagnostic est disponible sur le serveur Vault :

```bash
cd /opt/dorevia-vault
./scripts/fix_zreports_endpoint.sh
```

Ce script :
- ✅ Vérifie si l'endpoint est activé
- ✅ Identifie les variables manquantes
- ✅ Propose la solution

### Script d'Activation Rapide

Un script d'activation automatique est également disponible :

```bash
cd /opt/dorevia-vault
./ACTIVATION_IMMEDIATE_ZREPORTS.sh
```

---

## 📚 Documentation de Référence

- **API Complète** : `docs/ZREPORTS_API.md`
- **Réponse Validation** : `docs/REPONSE_VALIDATION_ENDPOINT_ZREPORTS.md`
- **Déploiement** : `docs/DEPLOIEMENT_SPRINT7.md`
- **Solution Rapide** : `SOLUTION_RAPIDE_ENDPOINT_ZREPORTS.md`

---

## ⏰ Délai de Résolution

**Temps estimé** : 5-10 minutes

**Étapes** :
1. Configuration variables : 2 minutes
2. Redémarrage service : 1 minute
3. Vérification : 2 minutes
4. Test depuis Odoo : 1 minute

---

## 📞 Contact et Suivi

**Équipe Vault Backend** :
- **Version** : 1.5.0 (Sprint 7)
- **Statut** : Endpoint implémenté, nécessite activation
- **Action** : Configuration et redémarrage requis

**Prochaines étapes** :
1. ✅ Configuration des variables d'environnement
2. ✅ Redémarrage du service
3. ✅ Vérification de l'activation
4. ✅ Test depuis Odoo
5. ✅ Confirmation de fonctionnement

---

## ✅ Conclusion

**L'endpoint est implémenté et prêt**, mais nécessite une **activation via configuration** des variables d'environnement.

**Action immédiate** : Configurer `DATABASE_URL` et `JWS_ENABLED`, puis redémarrer le service Vault.

**Une fois activé** : L'endpoint sera immédiatement accessible depuis Odoo sans aucune modification du code Odoo.

---

**Date de réponse** : 2025-11-16  
**Version Vault** : 1.5.0  
**Statut** : ✅ Solution fournie, activation en attente

**Merci pour votre patience !** 🙏

