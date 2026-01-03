# 🔑 Génération de Token JWT pour Dorevia Vault

**Date** : 2025-01-14  
**Version** : 1.0

---

## 🎯 Vue d'Ensemble

Ce guide explique comment générer un token JWT pour authentifier les requêtes vers Dorevia Vault.

---

## 🛠️ Outil de Génération

Un outil CLI est disponible : `bin/token-gen`

### Installation

```bash
# Compiler l'outil
go build -o bin/token-gen ./cmd/token-gen/main.go
```

### Utilisation

```bash
./bin/token-gen [options]
```

### Options

| Option | Description | Défaut | Requis |
|:-------|:------------|:-------|:-------|
| `-key` | Chemin vers la clé privée RSA | `/opt/dorevia-vault/keys/private.pem` | Non |
| `-sub` | User ID (subject) | `rdo18` | Non |
| `-role` | Rôle utilisateur | `operator` | Non |
| `-email` | Email utilisateur | *(vide)* | Non |
| `-exp` | Durée de validité en jours (0 = pas d'expiration) | `365` | Non |

### Rôles Disponibles

- `admin` : Toutes les permissions
- `operator` : Permissions `documents:write` (pour `/api/v1/invoices` et `/api/v1/pos-tickets`)
- `auditor` : Permissions lecture uniquement
- `viewer` : Permissions lecture limitée

---

## 📝 Exemples d'Utilisation

### Token pour instance Odoo rdo18 (opérateur, 1 an)

```bash
./bin/token-gen -sub rdo18 -role operator -exp 365
```

**Sortie** :
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTQ3NDQyMzgsImlhdCI6MTc2MzIwODIzOCwicm9sZSI6Im9wZXJhdG9yIiwic3ViIjoicmRvMTgifQ.R3EbyAIkZWFB4WZyc_KmcuoBjHUqSGZ0Ds4RgWpxg58aqqG4FW_Nl8r4rDCFptEksyZ-r0fsRt_2vV5jjp_ybpuUftFEnQY0zb1kibEaHSv8t11eZNqcqQw9y1N4bN2rH1Vly05SnUl7iyPjB-b9Oly__NKHsJxBKb9KpEbwyMTkJSedHz_eheLCuf8GZ58mFW54fAuRvSk3qiZVJRh7IXY74zTtr3GW4eaeHywWIllEBc0Kc-eqj2FdsJgwNgTntp8OJ0AjfX2W4XqmlpJp-7ciBmdxryXw8COTGa5tyFJl3aJhHfmhkPbyWjSeIh7YV81okghZVkzpsXaY9SuHjw
```

### Token de test temporaire (30 jours)

```bash
./bin/token-gen -sub test-user -role operator -exp 30
```

### Token sans expiration (production)

```bash
./bin/token-gen -sub rdo18 -role operator -exp 0
```

### Token avec email

```bash
./bin/token-gen -sub rdo18 -role operator -email admin@example.com -exp 365
```

### Token administrateur

```bash
./bin/token-gen -sub admin -role admin -exp 365
```

---

## 🔐 Token Généré pour rdo18

**Instance** : rdo18  
**Rôle** : operator  
**Durée** : 365 jours (expire le 2026-01-14)  
**Permissions** : `documents:write` (pour `/api/v1/invoices` et `/api/v1/pos-tickets`)

### Token JWT

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTQ3NDQyMzgsImlhdCI6MTc2MzIwODIzOCwicm9sZSI6Im9wZXJhdG9yIiwic3ViIjoicmRvMTgifQ.R3EbyAIkZWFB4WZyc_KmcuoBjHUqSGZ0Ds4RgWpxg58aqqG4FW_Nl8r4rDCFptEksyZ-r0fsRt_2vV5jjp_ybpuUftFEnQY0zb1kibEaHSv8t11eZNqcqQw9y1N4bN2rH1Vly05SnUl7iyPjB-b9Oly__NKHsJxBKb9KpEbwyMTkJSedHz_eheLCuf8GZ58mFW54fAuRvSk3qiZVJRh7IXY74zTtr3GW4eaeHywWIllEBc0Kc-eqj2FdsJgwNgTntp8OJ0AjfX2W4XqmlpJp-7ciBmdxryXw8COTGa5tyFJl3aJhHfmhkPbyWjSeIh7YV81okghZVkzpsXaY9SuHjw
```

**⚠️ Important** : Ce token est valide jusqu'au **2026-01-14**. Pour générer un nouveau token, utilisez :

```bash
./bin/token-gen -sub rdo18 -role operator -exp 365
```

### Claims du Token

```json
{
  "sub": "rdo18",
  "role": "operator",
  "iat": 1763208238,
  "exp": 1794744238
}
```

### Utilisation

```bash
# Exemple avec curl
curl -X POST https://vault.doreviateam.com/api/v1/invoices \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTQ3NDQyMzgsImlhdCI6MTc2MzIwODIzOCwicm9sZSI6Im9wZXJhdG9yIiwic3ViIjoicmRvMTgifQ.R3EbyAIkZWFB4WZyc_KmcuoBjHUqSGZ0Ds4RgWpxg58aqqG4FW_Nl8r4rDCFptEksyZ-r0fsRt_2vV5jjp_ybpuUftFEnQY0zb1kibEaHSv8t11eZNqcqQw9y1N4bN2rH1Vly05SnUl7iyPjB-b9Oly__NKHsJxBKb9KpEbwyMTkJSedHz_eheLCuf8GZ58mFW54fAuRvSk3qiZVJRh7IXY74zTtr3GW4eaeHywWIllEBc0Kc-eqj2FdsJgwNgTntp8OJ0AjfX2W4XqmlpJp-7ciBmdxryXw8COTGa5tyFJl3aJhHfmhkPbyWjSeIh7YV81okghZVkzpsXaY9SuHjw" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## 🔒 Sécurité

### Stockage du Token

- **Odoo** : Stocker dans `ir.config_parameter` (chiffré)
- **Masquer dans les logs** : Ne jamais logger le token complet
- **HTTPS uniquement** : Utiliser HTTPS avec validation SSL stricte

### Rotation du Token

- **Recommandation** : Régénérer le token tous les 6-12 mois
- **En cas de compromission** : Régénérer immédiatement et révoquer l'ancien

### Validation

Le token est vérifié par Dorevia Vault avec :
- Algorithme RS256 (RSA avec SHA-256)
- Clé publique configurée via `AUTH_JWT_PUBLIC_KEY_PATH`
- Vérification de l'expiration (si présente)
- Vérification du rôle et des permissions

---

## 📋 Checklist de Configuration

- [ ] Token généré avec le bon `sub` (user ID)
- [ ] Rôle `operator` configuré
- [ ] Durée de validité appropriée
- [ ] Token stocké de manière sécurisée dans Odoo
- [ ] Token masqué dans les logs
- [ ] HTTPS activé avec validation SSL
- [ ] Test d'authentification réussi

---

## 🧪 Test du Token

### Test avec curl

```bash
# Tester l'authentification
curl -X GET https://vault.doreviateam.com/api/v1/invoices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v
```

**Résultat attendu** : `200 OK` ou `405 Method Not Allowed` (si GET n'est pas autorisé)

### Test avec endpoint POS

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

**Résultat attendu** : `201 Created` avec document créé

---

## ⚠️ Dépannage

### Erreur 401 Unauthorized

- Vérifier que le token est correctement formaté : `Bearer <token>`
- Vérifier que le token n'est pas expiré
- Vérifier que la clé publique JWT est configurée dans Dorevia Vault
- Vérifier que `AUTH_ENABLED=true` et `AUTH_JWT_ENABLED=true`

### Erreur 403 Forbidden

- Vérifier que le rôle a les permissions nécessaires
- Pour `/api/v1/invoices` et `/api/v1/pos-tickets` : rôle `operator` requis

### Token invalide

- Vérifier que le token a été signé avec la clé privée correspondant à la clé publique configurée
- Vérifier le format du token (3 parties séparées par des points)

---

## 📞 Support

Pour toute question ou problème :
- **Email** : support@doreviateam.com
- **Documentation** : [`docs/POS_TICKETS_API.md`](POS_TICKETS_API.md)

---

**Auteur** : Documentation Dorevia Vault  
**Date** : 2025-01-14  
**Version** : 1.0

