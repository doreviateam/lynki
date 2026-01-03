# 📘 Documentation CLI Token — Phase 4

**Version** : 1.0  
**Date** : 2026-01-03  
**Phase** : Phase 4 "Auto-Renew Tokens DVIG"

---

## 1. Vue d'ensemble

La Phase 4 ajoute deux nouvelles commandes à la CLI `dorevia.sh` pour gérer le statut et le renouvellement des tokens :

- `token status <univers> <env> <tenant>` : Affiche le statut d'un token
- `token renew <univers> <env> <tenant>` : Renouvelle un token

Ces commandes permettent de vérifier l'état des tokens et de les renouveler depuis la ligne de commande.

---

## 2. Commande `token status`

### 2.1 Description

Affiche le statut détaillé d'un token pour un univers, environnement et tenant donnés.

**Note** : Cette commande nécessite le token brut pour appeler l'API DVIG. Le token brut n'est pas stocké dans le YAML (seulement le hash). Pour obtenir le statut complet, utilisez directement l'API DVIG.

### 2.2 Syntaxe

```bash
dorevia.sh token status <univers> <env> <tenant>
```

**Paramètres** :
- `univers` : Univers applicatif (ex. `odoo`)
- `env` : Environnement (`lab`, `stinger`, `prod`)
- `tenant` : Identifiant du tenant

### 2.3 Exemple

```bash
$ dorevia.sh token status odoo prod core
⚠️  Fonctionnalité en développement
📋 Token ID: tok_prod_core_001
📋 Source: odoo.prod.core
🌐 URL DVIG: https://dvig.core.doreviateam.com

💡 Pour obtenir le statut complet, utilisez directement l'API DVIG:
   curl -H 'Authorization: Bearer <token>' https://dvig.core.doreviateam.com/auth/token-status
```

### 2.4 Utilisation directe de l'API

Pour obtenir le statut complet, utilisez directement l'API DVIG :

```bash
curl -H "Authorization: Bearer <token>" \
     https://dvig.core.doreviateam.com/auth/token-status
```

**Réponse** :
```json
{
  "status": "active",
  "tenant": "core",
  "env": "prod",
  "scope_unit": "odoo",
  "expires_at": "2027-01-03T10:00:00Z",
  "grace_until": null,
  "created_at": "2026-01-03T10:00:00Z",
  "days_until_expiration": 365,
  "days_until_grace_end": null
}
```

---

## 3. Commande `token renew`

### 3.1 Description

Renouvelle un token pour un univers, environnement et tenant donnés, avec pre-renew et grace period.

**Note** : Cette commande nécessite le token brut pour appeler l'API DVIG. Le token brut n'est pas stocké dans le YAML (seulement le hash). Pour renouveler le token, utilisez directement l'API DVIG.

### 3.2 Syntaxe

```bash
dorevia.sh token renew <univers> <env> <tenant> [--pre-renew-days <days>] [--grace-days <days>]
```

**Paramètres** :
- `univers` : Univers applicatif (ex. `odoo`)
- `env` : Environnement (`lab`, `stinger`, `prod`)
- `tenant` : Identifiant du tenant

**Flags optionnels** :
- `--pre-renew-days <days>` : Jours avant expiration pour pré-renouvellement (défaut: 30)
- `--grace-days <days>` : Jours de période de grâce (défaut: 7)

### 3.3 Exemple

```bash
$ dorevia.sh token renew odoo prod core --pre-renew-days 30 --grace-days 7
⚠️  Fonctionnalité en développement
📋 Token ID: tok_prod_core_001
📋 Source: odoo.prod.core
🌐 URL DVIG: https://dvig.core.doreviateam.com

💡 Pour renouveler le token, utilisez directement l'API DVIG:
   curl -X POST -H 'Authorization: Bearer <token>' \
        -H 'Content-Type: application/json' \
        -d '{"pre_renew_days": 30, "grace_days": 7}' \
        https://dvig.core.doreviateam.com/auth/renew
```

### 3.4 Utilisation directe de l'API

Pour renouveler le token, utilisez directement l'API DVIG :

```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"pre_renew_days": 30, "grace_days": 7}' \
     https://dvig.core.doreviateam.com/auth/renew
```

**Réponse** :
```json
{
  "status": "renewed",
  "new_token": "dvig_<nouveau_token>",
  "old_token_id": 1,
  "new_token_id": 2,
  "expires_at": "2027-01-03T10:00:00Z",
  "grace_until": "2026-01-10T10:00:00Z"
}
```

**⚠️ IMPORTANT** : Stockez immédiatement le nouveau token (`new_token`) retourné par l'API. Il ne sera plus affiché.

---

## 4. Commandes existantes (rappel)

### 4.1 `token issue`

Crée un nouveau token :

```bash
dorevia.sh token issue <univers> <env> <tenant> [--force]
```

### 4.2 `token list`

Liste tous les tokens d'un tenant :

```bash
dorevia.sh token list <tenant>
```

### 4.3 `token revoke`

Révoque un token :

```bash
dorevia.sh token revoke <tenant> <token_id>
```

### 4.4 `token rotate`

Effectue une rotation de token :

```bash
dorevia.sh token rotate <univers> <env> <tenant> [--revoke-old]
```

---

## 5. Limitations actuelles

### 5.1 Token brut non stocké

Les commandes `token status` et `token renew` nécessitent le token brut pour appeler l'API DVIG. Cependant, le token brut n'est pas stocké dans le fichier YAML (`tenants/<tenant>/secrets/dvig.tokens.yml`) — seulement le hash est stocké.

**Solution actuelle** : Utiliser directement l'API DVIG avec le token brut.

**Solution future** : Stocker le token brut de manière sécurisée (ex. fichier chiffré, secret manager) pour permettre l'utilisation complète des commandes CLI.

### 5.2 Workaround

Pour utiliser les fonctionnalités de statut et renouvellement :

1. **Récupérer le token brut** depuis le stockage sécurisé de l'application (ex. Odoo `ir.config_parameter`)
2. **Utiliser directement l'API DVIG** avec `curl` ou un script personnalisé
3. **Stocker le nouveau token** après renouvellement

---

## 6. Exemples de workflow

### 6.1 Vérification statut token

```bash
# 1. Récupérer le token brut (ex. depuis Odoo)
TOKEN=$(odoo_get_token)

# 2. Vérifier le statut
curl -H "Authorization: Bearer $TOKEN" \
     https://dvig.core.doreviateam.com/auth/token-status | jq

# 3. Vérifier si renouvellement nécessaire
DAYS_LEFT=$(curl -s -H "Authorization: Bearer $TOKEN" \
                  https://dvig.core.doreviateam.com/auth/token-status | \
                  jq -r '.days_until_expiration')

if [[ "$DAYS_LEFT" != "null" ]] && [[ "$DAYS_LEFT" -le 30 ]]; then
    echo "Renouvellement nécessaire (expire dans $DAYS_LEFT jours)"
fi
```

### 6.2 Renouvellement token

```bash
# 1. Récupérer le token brut
TOKEN=$(odoo_get_token)

# 2. Renouveler
RESPONSE=$(curl -s -X POST \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json" \
                -d '{"pre_renew_days": 30, "grace_days": 7}' \
                https://dvig.core.doreviateam.com/auth/renew)

# 3. Extraire le nouveau token
NEW_TOKEN=$(echo "$RESPONSE" | jq -r '.new_token')

# 4. Stocker le nouveau token
odoo_store_token "$NEW_TOKEN"
```

---

## 7. Sécurité

- **Ne jamais logger de token en clair**
- **HTTPS obligatoire** pour tous les appels API
- **Stockage sécurisé** : Utiliser des fichiers chiffrés ou un secret manager pour stocker les tokens bruts
- **Rotation régulière** : Renouveler les tokens avant expiration (recommandé: 30 jours avant)

---

**Dernière mise à jour** : 2026-01-03

