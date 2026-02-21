# 📋 Explication des paramètres système Dorevia Billing CORE

## Vue d'ensemble

Ces paramètres système contrôlent le comportement du module **Dorevia Billing CORE** dans Odoo. Ils sont accessibles via **Paramètres → Technique → Paramètres → Paramètres Système**.

---

## 1. `dorevia_billing.core_api_token`

### Description
**Token d'authentification pour l'API de réception des constats**

### Valeur actuelle
`sk_test_abc123xyz789`

### À quoi ça sert ?
- Authentifie les requêtes HTTP provenant de **Dorevia Vault**
- Le Vault doit envoyer ce token dans le header `Authorization: api_key <TOKEN>`
- Si le token ne correspond pas → **401 Unauthorized**

### Comment ça fonctionne ?
1. Le Vault envoie un constat avec le header : `Authorization: api_key sk_test_abc123xyz789`
2. Odoo CORE compare ce token avec la valeur stockée dans ce paramètre
3. Si identique → constat accepté
4. Si différent → rejeté avec erreur 401

### Configuration recommandée
- **En production** : Utilisez un token fort et unique (ex: généré avec `openssl rand -hex 32`)
- **En test/développement** : Vous pouvez utiliser `sk_test_abc123xyz789` (comme actuellement)

### Sécurité
⚠️ **Important** : Ce token doit être gardé secret. Ne le partagez pas publiquement.

---

## 2. `dorevia_billing.jws_verification_enabled`

### Description
**Active ou désactive la vérification des signatures JWS (JSON Web Signature)**

### Valeur actuelle
`False` (désactivé)

### À quoi ça sert ?
- Si `True` : Odoo vérifie la signature cryptographique du constat (JWS)
- Si `False` : La vérification JWS est ignorée (mode non bloquant)

### Comportement selon la valeur

#### Si `True` (activé) :
1. Odoo récupère les clés publiques depuis l'URL JWKS configurée
2. Vérifie la signature JWS du constat
3. Si **valide** → constat stocké avec `state = 'validated'`
4. Si **invalide** → constat stocké avec `state = 'validated_with_warning'`, **pas de facturation automatique**

#### Si `False` (désactivé) :
- La vérification JWS est ignorée
- Tous les constats sont stockés avec `state = 'validated'`
- La facturation automatique fonctionne normalement

### Quand l'activer ?
- **En production** : Recommandé de l'activer (`True`) pour garantir l'intégrité des constats
- **En test/développement** : Peut rester à `False` si vous n'avez pas configuré le JWKS

### Prérequis pour activation
- `dorevia_billing.jwks_url` doit être configuré avec une URL valide
- Le module `PyJWT` doit être installé (généralement via Docker)

---

## 3. `dorevia_billing.jwks_url`

### Description
**URL du JWKS (JSON Web Key Set) pour récupérer les clés publiques de vérification JWS**

### Valeur actuelle
`(vide)`

### À quoi ça sert ?
- Point d'accès pour récupérer les clés publiques utilisées pour vérifier les signatures JWS
- Format attendu : URL HTTPS (ex: `https://vault.example.com/.well-known/jwks.json`)

### Comment ça fonctionne ?
1. Quand un constat arrive avec un JWS
2. Odoo fait une requête HTTP GET vers cette URL
3. Récupère les clés publiques au format JWKS
4. Utilise ces clés pour vérifier la signature du constat

### Exemple d'URL JWKS
```
https://vault.lab.doreviateam.com/.well-known/jwks.json
```

### Configuration
- **Format** : URL complète avec `https://`
- **Doit être accessible** depuis le serveur Odoo CORE
- **Doit retourner un JSON** au format JWKS standard

### Quand le configurer ?
- **Obligatoire** si `jws_verification_enabled = True`
- **Optionnel** si `jws_verification_enabled = False`

---

## 4. `dorevia_billing.auto_post_invoice`

### Description
**Active ou désactive la validation automatique des factures MRR générées**

### Valeur actuelle
`False` (désactivé)

### À quoi ça sert ?
- Si `True` : Les factures générées sont automatiquement **validées/comptabilisées** (`action_post()`)
- Si `False` : Les factures sont créées en **brouillon** et doivent être validées manuellement

### Comportement selon la valeur

#### Si `True` (activé) :
1. Constat reçu → facture générée automatiquement
2. Facture créée → **automatiquement validée** (`state = 'posted'`)
3. La facture apparaît directement dans la comptabilité comme validée

#### Si `False` (désactivé) :
1. Constat reçu → facture générée automatiquement
2. Facture créée → reste en **brouillon** (`state = 'draft'`)
3. Un utilisateur doit manuellement cliquer sur **"Confirmer"** pour valider la facture

### Quand l'activer ?
- **En production** : Peut être activé (`True`) si vous faites confiance au système et voulez automatiser complètement
- **En test/développement** : Recommandé de le laisser à `False` pour pouvoir vérifier les factures avant validation

### Avantages/Inconvénients

**Avantages de `True`** :
- ✅ Automatisation complète
- ✅ Pas d'intervention manuelle nécessaire
- ✅ Factures immédiatement comptabilisées

**Avantages de `False`** :
- ✅ Contrôle manuel avant validation
- ✅ Possibilité de vérifier/modifier la facture avant validation
- ✅ Moins de risque d'erreur

---

## 📊 Récapitulatif des paramètres

| Paramètre | Valeur actuelle | Rôle | Impact si modifié |
|-----------|----------------|------|-------------------|
| `core_api_token` | `sk_test_abc123xyz789` | Authentification API | ❌ Le Vault ne pourra plus envoyer de constats |
| `jws_verification_enabled` | `False` | Vérification JWS | ⚠️ Impact sur la sécurité/intégrité |
| `jwks_url` | `(vide)` | URL des clés publiques | ⚠️ Nécessaire si JWS activé |
| `auto_post_invoice` | `False` | Validation auto factures | ✅ Impact sur le workflow (brouillon vs validé) |

---

## 🔧 Comment modifier un paramètre

1. **Paramètres → Technique → Paramètres → Paramètres Système**
2. Recherchez le paramètre (ex: `dorevia_billing.core_api_token`)
3. Cliquez sur la ligne pour éditer
4. Modifiez la **Valeur**
5. Cliquez sur **Enregistrer**

---

## ⚠️ Précautions

1. **`core_api_token`** : Ne changez pas sans mettre à jour la configuration du Vault
2. **`jws_verification_enabled`** : Activez seulement si `jwks_url` est configuré
3. **`auto_post_invoice`** : En production, testez d'abord avec `False` pour valider le processus

---

## 💡 Recommandations par environnement

### Développement/Test
- `core_api_token` : `sk_test_abc123xyz789` (OK)
- `jws_verification_enabled` : `False` (OK)
- `jwks_url` : `(vide)` (OK)
- `auto_post_invoice` : `False` (OK pour contrôle manuel)

### Production
- `core_api_token` : Token fort et unique
- `jws_verification_enabled` : `True` (recommandé)
- `jwks_url` : URL JWKS du Vault en production
- `auto_post_invoice` : `True` ou `False` selon votre workflow

