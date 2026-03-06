# 📘 Documentation API Authentification — Phase 4

**Version** : 1.0  
**Date** : 2026-01-03  
**Phase** : Phase 4 "Auto-Renew Tokens DVIG"

---

## 1. Vue d'ensemble

La Phase 4 ajoute deux nouveaux endpoints à l'API DVIG pour gérer le statut et le renouvellement automatique des tokens :

- `GET /auth/token-status` : Retourne le statut détaillé d'un token authentifié
- `POST /auth/renew` : Renouvelle un token avec pre-renew et grace period (inspiré de Caddy)

Ces endpoints permettent aux applications (ex. Odoo) de vérifier l'état de leurs tokens et de les renouveler automatiquement avant expiration.

---

## 2. Endpoint GET /auth/token-status

### 2.1 Description

Retourne le statut détaillé du token authentifié, incluant :
- Statut (active, grace, legacy, revoked)
- Informations d'expiration (expires_at, days_until_expiration)
- Informations de grace period (grace_until, days_until_grace_end)
- Métadonnées (tenant, env, scope_unit, created_at)

### 2.2 Requête

```http
GET /auth/token-status
Authorization: Bearer <token>
```

**Headers requis** :
- `Authorization: Bearer <token>` : Token DVIG valide

### 2.3 Réponse

**Code** : `200 OK`

**Body** :
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

**Champs** :
- `status` (string, requis) : Statut du token (`active`, `grace`, `legacy`, `revoked`)
- `tenant` (string, requis) : Identifiant du tenant
- `env` (string, requis) : Environnement (`lab`, `stinger`, `prod`)
- `scope_unit` (string, optionnel) : Unit du token (ex. `odoo`)
- `expires_at` (string, optionnel) : Date d'expiration ISO8601 (NULL pour tokens legacy)
- `grace_until` (string, optionnel) : Fin de la période de grâce ISO8601 (NULL si pas en grace)
- `created_at` (string, requis) : Date de création ISO8601
- `days_until_expiration` (integer, optionnel) : Jours jusqu'à expiration (NULL si pas d'expiration)
- `days_until_grace_end` (integer, optionnel) : Jours jusqu'à fin de grace (NULL si pas en grace)

### 2.4 Codes d'erreur

- `401 Unauthorized` : Token invalide, expiré, révoqué ou grace terminée
  ```json
  {
    "status": "error",
    "error": {
      "code": "TOKEN_EXPIRED",
      "message": "Token expiré"
    }
  }
  ```

### 2.5 Exemples

**Token legacy (sans expiration)** :
```bash
curl -H "Authorization: Bearer <token>" \
     https://dvig.core.doreviateam.com/auth/token-status
```

**Réponse** :
```json
{
  "status": "legacy",
  "tenant": "core",
  "env": "lab",
  "scope_unit": "odoo",
  "expires_at": null,
  "grace_until": null,
  "created_at": "2025-12-01T10:00:00Z",
  "days_until_expiration": null,
  "days_until_grace_end": null
}
```

**Token actif avec expiration** :
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

**Token en grace period** :
```json
{
  "status": "grace",
  "tenant": "core",
  "env": "prod",
  "scope_unit": "odoo",
  "expires_at": "2026-01-10T10:00:00Z",
  "grace_until": "2026-01-17T10:00:00Z",
  "created_at": "2025-12-01T10:00:00Z",
  "days_until_expiration": null,
  "days_until_grace_end": 7
}
```

---

## 3. Endpoint POST /auth/renew

### 3.1 Description

Renouvelle le token authentifié avec :
- **Pre-renew period** : Renouvellement automatique avant expiration (défaut: 30 jours)
- **Grace period** : Période de grâce pour l'ancien token (défaut: 7 jours)

**Algorithme** (inspiré de Caddy) :
1. Vérifier que le token actuel est valide
2. Si `expires_at IS NULL` (legacy) → créer nouveau token avec expiration (365 jours)
3. Si `expires_at - now <= pre_renew_days` → créer nouveau token
4. Sinon → retourner erreur `RENEW_NOT_NEEDED`
5. Marquer ancien token en grace period (`grace_until = now + grace_days`)
6. Retourner nouveau token

### 3.2 Requête

```http
POST /auth/renew
Authorization: Bearer <token>
Content-Type: application/json
```

**Headers requis** :
- `Authorization: Bearer <token>` : Token DVIG valide
- `Content-Type: application/json`

**Body** :
```json
{
  "pre_renew_days": 30,
  "grace_days": 7
}
```

**Champs** :
- `pre_renew_days` (integer, optionnel, défaut: 30) : Jours avant expiration pour pré-renouvellement (1-90)
- `grace_days` (integer, optionnel, défaut: 7) : Jours de période de grâce (1-30)

### 3.3 Réponse

**Code** : `200 OK`

**Body** :
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

**Champs** :
- `status` (string, requis) : Statut du renouvellement (`renewed`)
- `new_token` (string, requis) : Nouveau token (à stocker immédiatement)
- `old_token_id` (integer, optionnel) : ID du token précédent
- `new_token_id` (integer, requis) : ID du nouveau token
- `expires_at` (string, requis) : Date d'expiration du nouveau token ISO8601
- `grace_until` (string, optionnel) : Fin de la période de grâce de l'ancien token ISO8601

### 3.4 Codes d'erreur

- `400 Bad Request` : Token ne nécessite pas de renouvellement
  ```json
  {
    "status": "error",
    "error": {
      "code": "RENEW_NOT_NEEDED",
      "message": "Token ne nécessite pas de renouvellement (expire dans 100 jours, seuil: 30 jours)"
    }
  }
  ```

- `401 Unauthorized` : Token invalide, expiré, révoqué ou grace terminée
  ```json
  {
    "status": "error",
    "error": {
      "code": "TOKEN_EXPIRED",
      "message": "Token expiré"
    }
  }
  ```

- `500 Internal Server Error` : Échec de la création du nouveau token
  ```json
  {
    "status": "error",
    "error": {
      "code": "RENEW_FAILED",
      "message": "Échec de la création du nouveau token"
    }
  }
  ```

### 3.5 Exemples

**Renouvellement token legacy** :
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

**Renouvellement token actif (proche expiration)** :
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"pre_renew_days": 30, "grace_days": 7}' \
     https://dvig.core.doreviateam.com/auth/renew
```

**Renouvellement non nécessaire** :
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"pre_renew_days": 30, "grace_days": 7}' \
     https://dvig.core.doreviateam.com/auth/renew
```

**Réponse** (400) :
```json
{
  "status": "error",
  "error": {
    "code": "RENEW_NOT_NEEDED",
    "message": "Token ne nécessite pas de renouvellement (expire dans 100 jours, seuil: 30 jours)"
  }
}
```

---

## 4. Intégration côté application (Odoo)

### 4.1 Recommandation "pull"

L'application (ex. Odoo) doit :

1. **Appeler périodiquement** `GET /auth/token-status` (ex. toutes les 24h)
2. **Vérifier** `days_until_expiration <= pre_renew_days` (ex. 30 jours)
3. **Si renouvellement nécessaire** :
   - Appeler `POST /auth/renew`
   - Stocker le nouveau token (`new_token`)
   - Basculer l'usage sur le nouveau token
   - L'ancien token reste valide pendant la grace period (7 jours)

### 4.2 Stockage

- Dans Odoo : `ir.config_parameter` ou secret file monté dans container
- **Ne jamais stocker le token en clair dans des logs**

### 4.3 Exemple de workflow

```python
# Pseudo-code Odoo
def check_and_renew_token():
    # 1. Vérifier statut
    response = requests.get(
        "https://dvig.core.doreviateam.com/auth/token-status",
        headers={"Authorization": f"Bearer {current_token}"}
    )
    
    if response.status_code == 200:
        status = response.json()
        
        # 2. Vérifier si renouvellement nécessaire
        if status["days_until_expiration"] and status["days_until_expiration"] <= 30:
            # 3. Renouveler
            renew_response = requests.post(
                "https://dvig.core.doreviateam.com/auth/renew",
                headers={"Authorization": f"Bearer {current_token}"},
                json={"pre_renew_days": 30, "grace_days": 7}
            )
            
            if renew_response.status_code == 200:
                new_token_data = renew_response.json()
                # 4. Stocker nouveau token
                store_token(new_token_data["new_token"])
                current_token = new_token_data["new_token"]
```

---

## 5. Sécurité

- **Ne jamais logger de token en clair**
- **Logs d'audit** pour les événements :
  - `token_renewed` : Renouvellement réussi
  - `token_validation_failed` : Échec de validation
- **HTTPS obligatoire** pour tous les appels API
- **Tokens en grace period** : Acceptés pendant la période de grâce uniquement

---

## 6. Rétrocompatibilité

- **Tokens legacy** (`expires_at = NULL`, `status = legacy`) : Fonctionnent comme avant
- **Migration progressive** : Les tokens legacy sont automatiquement migrés vers des tokens avec expiration lors du premier renouvellement

---

**Dernière mise à jour** : 2026-01-03

