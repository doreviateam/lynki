# 📧 Modèle d'Email - Demande Endpoint POS Tickets

**À** : support@doreviateam.com  

**Sujet** : Demande de Déploiement - Endpoint /api/v1/pos-tickets pour Odoo POS Connector  

**Date** : 2025-01-14

---

## Corps de l'Email

Bonjour,

Nous avons développé et déployé le module **dorevia_vault_pos_connector** pour Odoo 18, qui permet la vaultérisation automatique des tickets de caisse (Point of Sale) vers Dorevia Vault.

Le module est fonctionnel côté Odoo et le token d'authentification JWT est configuré. Cependant, nous rencontrons une erreur lors de l'envoi des tickets POS au service Vault.

### Problème Identifié

Lors de l'envoi d'un ticket POS vers l'endpoint `/api/v1/pos-tickets`, nous recevons une erreur **404 Not Found** :

```json
{
  "error": "Cannot POST /api/v1/pos-tickets"
}
```

**Test effectué** :
```bash
curl -X POST https://vault.doreviateam.com/api/v1/pos-tickets \
  -H "Authorization: Bearer <token_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": "test",
    "source_model": "pos.order",
    "source_id": "POS/001",
    "ticket": {"lines": []}
  }'
```

**Résultat** : `404 Not Found`

### Configuration Actuelle

- **URL de base** : `https://vault.doreviateam.com/api/v1/invoices`
- **Endpoint POS** : `/api/v1/pos-tickets`
- **URL complète** : `https://vault.doreviateam.com/api/v1/pos-tickets`
- **Authentification** : JWT Bearer Token (instance `rdo18`, rôle `operator`)
- **Token** : Configuré et valide

### Questions

1. **L'endpoint `/api/v1/pos-tickets` est-il déployé sur le serveur Vault ?**
   - Si oui, quelle est l'URL exacte ?
   - Si non, quelle est la date prévue de déploiement ?

2. **Y a-t-il un endpoint alternatif pour les tickets POS ?**
   - Par exemple : `/api/v1/pos/tickets`, `/api/v1/tickets`, etc.

3. **Le format du payload est-il correct ?**
   - Y a-t-il des champs manquants ou incorrects ?

4. **Y a-t-il des prérequis ou des configurations supplémentaires nécessaires ?**
   - Migration DB requise ?
   - Variables d'environnement spécifiques ?

### État du Développement

**Côté Odoo** :
- ✅ Module développé et testé
- ✅ Token JWT configuré
- ✅ Client Vault opérationnel
- ✅ Payload construit selon la spécification
- ✅ Gestion d'erreurs implémentée

**Côté Vault** :
- ❌ Endpoint `/api/v1/pos-tickets` non disponible (404)
- ✅ Authentification fonctionne
- ✅ Endpoint `/api/v1/invoices` fonctionne (pour les factures)

### Impact

- **Bloquant pour** : La vaultérisation automatique des tickets POS
- **Non bloquant pour** : La vaultérisation des factures (fonctionne)

### Documents de Référence

- Spécification Sprint 6 : `docs/Dorevia_Vault_Sprint6_Specification.md`
- Documentation API POS : `docs/POS_TICKETS_API.md`
- Plan d'implémentation : `docs/PLAN_IMPLEMENTATION_SPRINT6_CORRIGE.md`
- Release Notes : `RELEASE_NOTES_v1.4.0.md`

### Informations de Contact

- **Instance Odoo** : rdo18
- **Environnement** : (Production / Test / Développement)
- **Nom** : (à compléter)
- **Email** : (à compléter)
- **Organisation** : (à compléter)

### Informations Techniques

**Version Vault attendue** : v1.4.0 (Sprint 6)

**Prérequis de déploiement** :
- Migration DB : `migrations/005_add_pos_fields.sql`
- Variables d'environnement : `POS_TICKET_MAX_SIZE_BYTES` (optionnel, défaut: 65536)
- Clés JWS : Requises pour signature des documents

**Format du payload** :
```json
{
  "tenant": "laplatine",
  "source_model": "pos.order",
  "source_id": "POS/2025/0001",
  "currency": "EUR",
  "total_incl_tax": 12.50,
  "total_excl_tax": 10.42,
  "pos_session": "SESSION/2025/01/14-01",
  "cashier": "Verena",
  "location": "La Platine - Boutique",
  "ticket": {
    "lines": [...],
    "payments": [...]
  }
}
```

Merci de nous indiquer la disponibilité de l'endpoint ou la date prévue de déploiement.

Cordialement,  
[Votre nom]

---

**Pièces jointes** :
- `docs/POS_TICKETS_API.md` (documentation complète de l'API)
- `RELEASE_NOTES_v1.4.0.md` (notes de version)
- `docs/DEMANDE_TOKEN_AUTHENTIFICATION.md` (demande de token)

---

**Auteur** : Modèle d'email Dorevia Vault  
**Date** : 2025-01-14  
**Version** : 1.0

