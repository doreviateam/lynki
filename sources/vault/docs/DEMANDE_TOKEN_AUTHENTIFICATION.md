# 🔐 Demande de Token d'Authentification Dorevia Vault

**Date** : 2025-01-14  

**Projet** : Connecteur Dorevia Vault pour Odoo 18  

**Instance** : rdo18

---

## 📋 Informations sur l'instance

- **Nom de l'instance Odoo** : `rdo18`
- **Environnement** : Production / Test / Développement (à préciser)
- **Version Odoo** : 18.0
- **URL de l'instance** : (à compléter si nécessaire)

---

## 🎯 Type de token demandé

- **Méthode d'authentification** : JWT Bearer Token (recommandé)
- **Rôle requis** : `operator` (pour envoyer des documents)
- **Permissions nécessaires** :
  - `documents:write` (pour `/api/v1/invoices`)
  - `documents:write` (pour `/api/v1/pos-tickets`)

---

## 📝 Usage prévu

Le token sera utilisé pour :

1. **Vaultérisation des factures** (`account.move`)
   - Endpoint : `POST /api/v1/invoices`
   - Format : PDF Factur-X avec métadonnées

2. **Vaultérisation des tickets POS** (`pos.order`)
   - Endpoint : `POST /api/v1/pos-tickets`
   - Format : JSON avec données complètes du ticket

---

## ⏱️ Durée de validité

- **Option 1** : Token sans expiration (recommandé pour la production)
- **Option 2** : Token avec expiration (à définir : ___ jours/mois)
- **Option 3** : Token de test temporaire (pour développement)

---

## 🔒 Sécurité

- Le token sera stocké dans Odoo via `ir.config_parameter` (chiffré)
- Le token sera masqué dans les logs
- Connexion HTTPS uniquement avec validation SSL stricte

---

## 📧 Informations de contact

- **Nom** : (à compléter)
- **Email** : (à compléter)
- **Téléphone** : (optionnel)
- **Organisation** : (à compléter)

---

## ✅ Checklist avant envoi

- [ ] Environnement précisé (Production / Test / Développement)
- [ ] Durée de validité choisie
- [ ] Informations de contact complétées
- [ ] URL de l'instance Odoo (si nécessaire)

---

## 📞 Contact pour cette demande

**À envoyer à** : support@doreviateam.com (à vérifier)  
**Sujet** : Demande de Token JWT - Instance Odoo rdo18

---

## 📎 Informations techniques supplémentaires

### Configuration actuelle Odoo

- **URL Vault** : `https://vault.doreviateam.com/api/v1/invoices`
- **Endpoint POS** : `/api/v1/pos-tickets`
- **Timeout** : 30 secondes
- **Module** : `dorevia_vault_connector` + `dorevia_vault_pos_connector`

### Format d'authentification attendu

```http
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

### Format du token

- Type : JWT (JSON Web Token)
- Algorithme : RS256 (RSA avec SHA-256)
- Claims requis :
  - `sub` : User ID
  - `role` : `operator`
  - `iat` : Issued at (timestamp)
  - `exp` : Expiration (timestamp, optionnel)

---

**Note** : Une fois le token reçu, il sera configuré immédiatement dans Odoo pour activer la vaultérisation automatique des documents.

---

**Auteur** : Demande de token Dorevia Vault  
**Date** : 2025-01-14  
**Version** : 1.0

