# 📧 Réponse Équipe Vault — Erreur HTTP 500 sur `/api/v1/push_payload`

**Date** : 2025-12-14  
**À** : Équipe Dorevia Odoo  
**De** : Équipe Dorevia Vault  
**Priorité** : 🔴 **Haute** (endpoint inexistant)

---

## 1. Diagnostic

### 1.1 Cause Racine Identifiée

**L'endpoint `/api/v1/push_payload` n'existe pas dans l'API Vault.**

C'est la cause directe des erreurs HTTP 500 observées. Le serveur Vault (ou le reverse proxy) retourne une erreur 500 car la route n'est pas enregistrée.

### 1.2 Endpoints Disponibles Actuellement

L'API Vault expose actuellement les endpoints suivants :

| Endpoint | Méthode | Description | Format Payload |
|----------|---------|-------------|----------------|
| `/api/v1/invoices` | POST | Ingestion documents Odoo (factures) | Format `InvoicePayload` |
| `/api/v1/payments` | POST | Ingestion paiements | Format `PaymentPayload` |
| `/api/v1/pos/tickets` | POST | Ingestion tickets POS | Format JSON canonicalisé |
| `/api/v1/pos/zreports` | POST | Ingestion Z-Reports | Format JSON avec chaînage |
| `/api/v1/push_document` | POST | Upload générique de documents | Format `PushDocumentPayload` |

**Note** : Aucun endpoint `/api/v1/push_payload` n'est actuellement implémenté.

---

## 2. Réponses aux Questions

### 2.1 Questions Générales

#### Q1 : Le service Vault est-il opérationnel sur l'environnement Lab ?

**Réponse** : ✅ **Oui**, le service Vault est opérationnel sur l'environnement Lab.

**Health Check** :
- Endpoint : `https://vault.lab.demo.doreviateam.com/health`
- Si l'endpoint retourne une erreur, cela peut être dû à :
  - Un problème de configuration du reverse proxy
  - Un problème de réseau
  - Un problème de certificat SSL

**Recommandation** : Vérifier l'endpoint `/health/detailed` pour un diagnostic plus précis :
```bash
curl https://vault.lab.demo.doreviateam.com/health/detailed
```

#### Q2 : Y a-t-il des incidents connus sur l'environnement Lab récemment ?

**Réponse** : ❌ **Aucun incident connu** sur l'environnement Lab récemment.

Les erreurs HTTP 500 sont dues à l'absence de l'endpoint `/api/v1/push_payload`, pas à un incident système.

#### Q3 : Le format payload JSON v1.0 est-il correctement supporté par l'endpoint `/api/v1/push_payload` ?

**Réponse** : ❌ **Non**, l'endpoint `/api/v1/push_payload` n'existe pas encore.

Le format payload JSON v1.0 (selon `AB_SPEC_DOREVIA_VAULT_PAYLOAD_v1.0.md`) n'est pas encore supporté par un endpoint dédié.

---

### 2.2 Questions Techniques

#### Q4 : Quelle est la cause exacte des erreurs HTTP 500 ?

**Réponse** : 🔴 **L'endpoint `/api/v1/push_payload` n'existe pas.**

**Détails** :
- Le serveur Vault ne reconnaît pas la route `/api/v1/push_payload`
- Le reverse proxy (Caddy) ou le serveur Fiber retourne une erreur 500
- **Ce n'est pas** :
  - ❌ Un problème de base de données
  - ❌ Une erreur de traitement du payload
  - ❌ Un problème de ressources (surcharge)
  - ❌ Une erreur de validation du payload

**Cause** : Route non implémentée.

#### Q5 : Y a-t-il des logs côté Vault pour les requêtes suivantes ?

**Réponse** : ⚠️ **Non**, car l'endpoint n'existe pas.

Les requêtes vers `/api/v1/push_payload` ne sont pas traitées par le serveur Vault, donc :
- Aucun log n'est généré côté Vault
- Aucun `correlation_id` n'est traité
- Aucune trace dans les logs d'audit

**Recommandation** : Vérifier les logs du reverse proxy (Caddy) pour voir les requêtes rejetées.

#### Q6 : Le payload JSON v1.0 est-il correctement parsé par le Vault ?

**Réponse** : ❌ **Non**, car l'endpoint n'existe pas.

Le payload n'atteint jamais le code de parsing du Vault.

#### Q7 : Y a-t-il des limitations sur l'endpoint `/api/v1/push_payload` ?

**Réponse** : ❌ **L'endpoint n'existe pas**, donc aucune limitation n'est applicable.

**Limitations des endpoints existants** :
- `/api/v1/invoices` : Taille max base64 = 15 MB (configurable)
- `/api/v1/payments` : Taille max = 64 KB (configurable)
- Rate limiting : Configuré via middleware (si activé)

---

### 2.3 Questions de Diagnostic

#### Q8 : Comment pouvons-nous obtenir plus de détails sur l'erreur HTTP 500 ?

**Réponse** : 

**Options disponibles** :

1. **Logs du reverse proxy (Caddy)** :
   ```bash
   # Vérifier les logs Caddy
   journalctl -u caddy -f
   ```

2. **Logs du serveur Vault** :
   ```bash
   # Vérifier les logs Vault
   journalctl -u vault -f
   # OU
   docker logs vault -f
   ```

3. **Endpoint de diagnostic** (si disponible) :
   - `/health/detailed` : État détaillé du système
   - `/metrics` : Métriques Prometheus

4. **Correlation ID** : 
   - Actuellement, aucun `correlation_id` n'est retourné dans les erreurs
   - **Amélioration proposée** : Ajouter un `correlation_id` dans les réponses d'erreur

#### Q9 : Y a-t-il des métriques disponibles sur les erreurs HTTP 500 ?

**Réponse** : ⚠️ **Partiellement**.

**Métriques disponibles** :
- `vault_http_requests_total` : Compteur de requêtes par route/méthode/code
- **Problème** : Les requêtes vers des routes inexistantes peuvent ne pas être comptabilisées correctement

**Recommandation** : Vérifier les métriques Prometheus :
```bash
curl https://vault.lab.demo.doreviateam.com/metrics | grep http_requests
```

---

## 3. Solutions Proposées

### 3.1 Solution Immédiate : Utiliser `/api/v1/invoices`

**Recommandation** : Utiliser l'endpoint `/api/v1/invoices` qui existe déjà et supporte l'ingestion de documents Odoo.

**Format actuel de `/api/v1/invoices`** :

```json
{
  "source": "sales",
  "model": "account.move",
  "odoo_id": 123,
  "state": "posted",
  "pdp_required": true,
  "file": "<base64_encoded_pdf>",
  "meta": {
    "name": "FAC/2025/00123",
    "partner_id": 45,
    "date": "2025-11-24",
    "amount_total": 540.20,
    "move_type": "out_invoice",
    "content_type": "application/pdf"
  }
}
```

**Avantages** :
- ✅ Endpoint existant et testé
- ✅ Support JWS + Ledger
- ✅ Idempotence basée sur SHA256
- ✅ Support multi-tenant

**Inconvénients** :
- ⚠️ Format différent du payload JSON v1.0
- ⚠️ Nécessite une adaptation du code Odoo

---

### 3.2 Solution Long Terme : Implémenter `/api/v1/push_payload`

**Recommandation** : Créer l'endpoint `/api/v1/push_payload` pour supporter le format payload JSON v1.0.

**Spécifications** :
- **Format** : Payload JSON v1.0 selon `AB_SPEC_DOREVIA_VAULT_PAYLOAD_v1.0.md`
- **Canonicalisation** : RFC 8785 (déjà supportée pour les tickets POS)
- **Idempotence** : Basée sur hash SHA256 du payload canonicalisé
- **Support** : JWS + Ledger (si configurés)

**Estimation** : 2-3 jours de développement + tests

**Plan d'implémentation** :
1. Créer le handler `PushPayloadHandler` dans `internal/handlers/push_payload.go`
2. Créer le service `PushPayloadService` dans `internal/services/push_payload_service.go`
3. Enregistrer la route dans `cmd/server/main.go`
4. Ajouter les tests unitaires et d'intégration
5. Documenter l'endpoint

---

## 4. Actions Immédiates

### 4.1 Côté Vault (Équipe Vault)

1. ✅ **Diagnostic** : Identifié la cause (endpoint inexistant)
2. 🔄 **À faire** : Implémenter l'endpoint `/api/v1/push_payload`
3. 🔄 **À faire** : Améliorer les messages d'erreur pour les routes inexistantes (retourner 404 au lieu de 500)
4. 🔄 **À faire** : Ajouter un `correlation_id` dans les réponses d'erreur

### 4.2 Côté Odoo (Équipe Odoo)

**Option A : Utiliser `/api/v1/invoices` (immédiat)**

1. Modifier le code Odoo pour utiliser `/api/v1/invoices` au lieu de `/api/v1/push_payload`
2. Adapter le format du payload au format `InvoicePayload`
3. Tester l'intégration

**Option B : Attendre l'implémentation de `/api/v1/push_payload`**

1. Attendre l'implémentation de l'endpoint (2-3 jours)
2. Tester avec le format payload JSON v1.0
3. Déployer en production

---

## 5. Améliorations Proposées

### 5.1 Messages d'Erreur Améliorés

**Problème actuel** : Les routes inexistantes retournent HTTP 500.

**Amélioration proposée** : Retourner HTTP 404 avec un message clair :

```json
{
  "error": "Route not found",
  "route": "/api/v1/push_payload",
  "method": "POST",
  "available_routes": [
    "/api/v1/invoices",
    "/api/v1/payments",
    "/api/v1/pos/tickets",
    "/api/v1/pos/zreports",
    "/api/v1/push_document"
  ],
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 5.2 Correlation ID dans les Réponses

**Amélioration proposée** : Ajouter un `correlation_id` dans toutes les réponses (succès et erreur) pour faciliter le debugging.

### 5.3 Documentation des Endpoints

**Amélioration proposée** : Créer une documentation OpenAPI/Swagger pour tous les endpoints disponibles.

---

## 6. Plan d'Action

### Phase 1 : Correctif Immédiat (1 jour)

1. ✅ **Diagnostic** : Identifié la cause
2. 🔄 **Amélioration** : Modifier le serveur pour retourner 404 au lieu de 500 pour les routes inexistantes
3. 🔄 **Communication** : Informer l'équipe Odoo de la solution immédiate (`/api/v1/invoices`)

### Phase 2 : Implémentation `/api/v1/push_payload` (2-3 jours)

1. 🔄 **Développement** : Implémenter l'endpoint `/api/v1/push_payload`
2. 🔄 **Tests** : Tests unitaires et d'intégration
3. 🔄 **Documentation** : Documenter l'endpoint
4. 🔄 **Déploiement** : Déployer en Lab puis en production

### Phase 3 : Améliorations (1 semaine)

1. 🔄 **Correlation ID** : Ajouter dans toutes les réponses
2. 🔄 **Messages d'erreur** : Améliorer pour faciliter le diagnostic
3. 🔄 **Documentation** : Créer une documentation OpenAPI

---

## 7. Recommandations

### 7.1 Solution Immédiate

**Recommandation** : Utiliser `/api/v1/invoices` en attendant l'implémentation de `/api/v1/push_payload`.

**Avantages** :
- ✅ Solution immédiate (pas d'attente)
- ✅ Endpoint testé et stable
- ✅ Support complet (JWS + Ledger)

**Action** : Adapter le code Odoo pour utiliser `/api/v1/invoices`.

### 7.2 Solution Long Terme

**Recommandation** : Implémenter `/api/v1/push_payload` pour supporter le format payload JSON v1.0.

**Avantages** :
- ✅ Format standardisé (payload JSON v1.0)
- ✅ Support canonicalisation RFC 8785
- ✅ Compatible avec la spécification `AB_SPEC_DOREVIA_VAULT_PAYLOAD_v1.0.md`

**Action** : Planifier l'implémentation (2-3 jours).

---

## 8. Conclusion

### Résumé

1. **Cause identifiée** : L'endpoint `/api/v1/push_payload` n'existe pas
2. **Solution immédiate** : Utiliser `/api/v1/invoices`
3. **Solution long terme** : Implémenter `/api/v1/push_payload`
4. **Améliorations** : Messages d'erreur, correlation_id, documentation

### Prochaines Étapes

1. **Équipe Odoo** : Décider entre Option A (utiliser `/api/v1/invoices`) ou Option B (attendre `/api/v1/push_payload`)
2. **Équipe Vault** : Implémenter `/api/v1/push_payload` et améliorer les messages d'erreur
3. **Communication** : Coordonner le déploiement

---

**Contact** : Équipe Dorevia Vault  
**Date** : 2025-12-14

---

## Annexe : Format Payload JSON v1.0

Pour référence, voici le format attendu par `/api/v1/push_payload` (à implémenter) :

```json
{
  "payload_class": "nf525",
  "payload_version": "1.0",
  "source": "odoo",
  "source_version": "18.0",
  "source_model": "account.move",
  "source_id": "89",
  "generated_at": "2025-12-14T17:15:51Z",
  "context": {
    "tenant_id": "1",
    "company_id": 1,
    "company_country": "FR"
  },
  "sequence": {...},
  "amounts": {...},
  "taxes": [...],
  "customer": {...},
  "lines": [...],
  "payments": [...],
  "chain": {...}
}
```

**Note** : Ce format sera supporté une fois l'endpoint `/api/v1/push_payload` implémenté.

