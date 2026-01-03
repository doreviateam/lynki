# 📋 Demande à l'Équipe Dorevia-Vault — Tests d'Intégration

**Date** : 2025-11-24  

**Module** : `dorevia_vault_report` v2.4  

**Auteur** : Doreviateam  

**Statut** : 📋 En attente de réponse

---

## 🎯 Objectif

Ce document liste les besoins et requêtes pour permettre l'implémentation des **tests d'intégration** (US-7.2) du module `dorevia_vault_report`.

Les tests d'intégration nécessitent un accès à l'API Vault réelle (environnement de test) pour valider le comportement end-to-end du module.

---

## 📋 Besoins Identifiés

### 1. 🔐 Environnement de Test API Vault

#### Besoin
Accès à un **environnement de test/staging** de l'API Dorevia-Vault pour les tests d'intégration.

#### Détails
- **URL de l'environnement de test** : `https://vault-test.doreviateam.com` (exemple)
- **Token d'authentification de test** : Token dédié aux tests (non production)
- **Isolation** : Environnement séparé de la production pour éviter les impacts

#### Questions
- ✅ Existe-t-il un environnement de test/staging disponible ?
- ✅ Quel est l'URL de cet environnement ?
- ✅ Comment obtenir un token de test ?
- ✅ Y a-t-il des limitations (rate limiting, quotas) ?

---

### 2. 📡 Endpoints API Requis

#### ⚠️ Question Critique : Endpoints GET /api/v1/proof/*

Le module `dorevia_vault_report` a besoin de récupérer les **preuves** (proofs) depuis Vault pour les afficher dans le rapport.

#### Endpoints Attendus par le Module

Le module utilise actuellement ces endpoints (selon la spécification) :

```
GET /api/v1/proof/account_move/<id>
GET /api/v1/proof/account_payment/<id>
GET /api/v1/proof/pos_order/<id>
GET /api/v1/proof/pos_payment/<id>
GET /api/v1/proof/pos_zreport/<id>
```

#### ⚠️ Question Importante

**Ces endpoints existent-ils réellement dans l'API Vault ?**

D'après la documentation existante, nous avons trouvé :

- ✅ `POST /api/v1/invoices` (ingestion factures)
- ✅ `POST /api/v1/payments` (ingestion paiements)
- ✅ `POST /api/v1/pos-tickets` (ingestion tickets POS)
- ✅ `POST /api/v1/pos/zreports` (ingestion Z-Reports)
- ✅ `GET /documents/:id` (récupération document par ID Vault)

**Mais nous n'avons pas trouvé de confirmation pour** :

- ❓ `GET /api/v1/proof/account_move/<id>` (récupération preuve par ID Odoo)
- ❓ `GET /api/v1/proof/account_payment/<id>`
- ❓ `GET /api/v1/proof/pos_order/<id>`
- ❓ `GET /api/v1/proof/pos_payment/<id>`
- ❓ `GET /api/v1/proof/pos_zreport/<id>`

#### Alternatives Possibles

Si ces endpoints n'existent pas, nous avons besoin de connaître :

1. **Comment récupérer une preuve par ID Odoo ?**
   - Faut-il utiliser `GET /documents/:vault_id` avec le `vault_id` stocké dans Odoo ?
   - Y a-t-il un mapping ID Odoo → ID Vault ?

2. **Format de réponse pour les preuves**
   - Le format JSON attendu (hash, ledger, timestamp, jws, status)
   - Comment obtenir ces informations depuis l'API existante ?

#### Besoin
Confirmation que :

- ✅ Ces endpoints existent OU alternative documentée
- ✅ Format de réponse JSON documenté
- ✅ Méthode de mapping ID Odoo → ID Vault (si nécessaire)

#### Format de Réponse Attendu

```json
{
  "hash": "sha256_hash_here",
  "ledger": "ledger_id_here",
  "timestamp": "2025-01-15T10:30:00Z",
  "jws": "jws_token_here",
  "status": "verified"
}
```

#### Questions
- ✅ Ces endpoints sont-ils tous disponibles ?
- ✅ Y a-t-il des endpoints bulk pour récupérer plusieurs preuves en une fois ?
- ✅ Quelle est la documentation complète de l'API ?

---

### 3. 🧪 Données de Test

#### Besoin
Données de test pré-existantes dans l'environnement de test pour valider les scénarios.

#### Scénarios de Test Nécessaires

1. **Preuve trouvée et vérifiée** :
   - Facture avec preuve Vault valide
   - Statut : `verified`
   - Toutes les données présentes (hash, ledger, timestamp, jws)

2. **Preuve en attente** :
   - Facture vaultée mais statut `pending`
   - Permet de tester l'affichage "En attente"

3. **Preuve non trouvée** :
   - ID de facture qui n'existe pas dans Vault
   - Retourne 404
   - Permet de tester l'affichage "Non trouvée"

4. **Erreur API (timeout)** :
   - Simulation de timeout
   - Permet de tester la gestion d'erreurs

5. **Erreur API (indisponible)** :
   - Simulation d'erreur serveur (500+)
   - Permet de tester le retry automatique

#### Questions
- ✅ Y a-t-il des données de test pré-configurées dans l'environnement de test ?
- ✅ Pouvons-nous créer nos propres données de test ?
- ✅ Y a-t-il des IDs de test documentés pour chaque scénario ?

---

### 4. 🔄 Endpoints Bulk (Optionnel mais Recommandé)

#### Besoin
Endpoints pour récupérer plusieurs preuves en une fois (bulk fetch).

#### Avantage
- Réduction drastique du nombre d'appels API
- Amélioration des performances
- Réduction de la charge serveur

#### Format Suggéré

```
POST /api/v1/proof/bulk
Content-Type: application/json

{
  "requests": [
    {"type": "account_move", "id": 123},
    {"type": "account_move", "id": 124},
    {"type": "account_payment", "id": 456}
  ]
}

Response:
{
  "results": [
    {"type": "account_move", "id": 123, "proof": {...}},
    {"type": "account_move", "id": 124, "proof": {...}},
    {"type": "account_payment", "id": 456, "proof": null}
  ]
}
```

#### Questions
- ✅ Existe-t-il des endpoints bulk ?
- ✅ Si non, est-ce prévu dans la roadmap ?
- ✅ Y a-t-il des limitations sur le nombre de preuves par requête bulk ?

---

### 5. 📊 Rate Limiting et Quotas

#### Besoin
Connaître les limitations de l'API pour adapter les tests.

#### Informations Requises
- **Rate limiting** : Nombre de requêtes par seconde/minute/heure
- **Quotas** : Limites quotidiennes/mensuelles
- **Timeout** : Délai maximum pour une requête
- **Retry** : Politique de retry recommandée

#### Questions
- ✅ Quelles sont les limites de rate limiting ?
- ✅ Y a-t-il des quotas pour l'environnement de test ?
- ✅ Quel est le timeout recommandé ?
- ✅ Quelle politique de retry est recommandée ?

---

### 6. 📚 Documentation API

#### Besoin
Documentation complète et à jour de l'API Vault.

#### Informations Requises
- **Documentation Swagger/OpenAPI** : Si disponible
- **Exemples de requêtes/réponses** : Pour chaque endpoint
- **Codes d'erreur** : Liste complète avec signification
- **Changelog** : Historique des changements API

#### Questions
- ✅ Où se trouve la documentation de l'API ?
- ✅ Y a-t-il une documentation Swagger/OpenAPI ?
- ✅ La documentation est-elle à jour ?

---

### 7. 🔔 Notifications et Monitoring

#### Besoin
Méthode pour être informé des changements API ou problèmes.

#### Informations Requises
- **Changelog API** : Notification des changements
- **Status page** : Page de statut de l'API
- **Alertes** : Notification en cas de maintenance

#### Questions
- ✅ Y a-t-il un changelog ou un système de notification pour les changements API ?
- ✅ Y a-t-il une page de statut de l'API ?
- ✅ Comment être informé des maintenances planifiées ?

---

## ✅ Checklist des Requêtes

### Requêtes Prioritaires (Critiques)

- [ ] **Environnement de test disponible** : URL et credentials
- [ ] **Endpoints confirmés** : Tous les endpoints `/api/v1/proof/*` fonctionnels
- [ ] **Données de test** : IDs de test documentés pour chaque scénario
- [ ] **Documentation API** : Accès à la documentation complète

### Requêtes Secondaires (Souhaitables)

- [ ] **Endpoints bulk** : Si disponibles ou prévus
- [ ] **Rate limiting** : Informations sur les limitations
- [ ] **Monitoring** : Accès au statut de l'API

---

## 🎯 Scénarios de Test à Valider

### Scénario 1 : Récupération Preuve Facture

**Test** :
```python
proof = vault_client.get_proof('account_move', 123)
assert proof['status'] == 'verified'
assert 'hash' in proof
assert 'ledger' in proof
```

**Besoin** : ID de facture de test avec preuve vérifiée

---

### Scénario 2 : Preuve Non Trouvée

**Test** :
```python
proof = vault_client.get_proof('account_move', 99999)
assert proof is None
```

**Besoin** : Confirmation que 404 est retourné pour ID inexistant

---

### Scénario 3 : Bulk Fetch

**Test** :
```python
proofs = vault_client.get_proofs_bulk('account_move', [123, 124, 125])
assert len(proofs) == 3
```

**Besoin** : Endpoint bulk ou confirmation que plusieurs appels séquentiels sont OK

---

### Scénario 4 : Gestion Timeout

**Test** :
```python
# Simuler un timeout
# Vérifier que l'erreur est gérée gracieusement
```

**Besoin** : Méthode pour simuler un timeout (ou endpoint de test)

---

### Scénario 5 : Retry Automatique

**Test** :
```python
# Simuler une erreur 500
# Vérifier que le retry fonctionne avec backoff exponentiel
```

**Besoin** : Endpoint de test pour simuler erreurs serveur

---

## 📞 Contact et Communication

### Prochaines Étapes

1. **Transmission de ce document** à l'équipe dorevia-vault
2. **Réunion de coordination** (si nécessaire) pour clarifier les besoins
3. **Mise en place de l'environnement de test** avec accès et credentials
4. **Documentation partagée** des endpoints et données de test
5. **Implémentation des tests d'intégration** une fois les accès obtenus

### Questions Urgentes

Pour avancer rapidement sur les tests d'intégration, nous avons besoin de :

1. ✅ **Accès à l'environnement de test** (URL + token)
2. ✅ **Confirmation des endpoints** utilisés
3. ✅ **Données de test** ou méthode pour en créer

---

## 📝 Notes Techniques

### Endpoints Actuellement Utilisés

Le module utilise actuellement ces endpoints :

| Endpoint | Type | Usage |
|----------|------|-------|
| `GET /api/v1/proof/account_move/<id>` | Factures | Récupération preuve facture |
| `GET /api/v1/proof/account_payment/<id>` | Paiements | Récupération preuve paiement |
| `GET /api/v1/proof/pos_order/<id>` | Tickets POS | Récupération preuve ticket |
| `GET /api/v1/proof/pos_payment/<id>` | Paiements POS | Récupération preuve paiement POS |
| `GET /api/v1/proof/pos_zreport/<id>` | Z-Reports | Récupération preuve Z-Report |

### Gestion d'Erreurs Actuelle

Le module gère actuellement :

- ✅ **404** : Preuve non trouvée → `None`
- ✅ **500+** : Erreur serveur → Retry avec backoff exponentiel
- ✅ **Timeout** : Retry avec backoff exponentiel
- ✅ **Connection Error** : Erreur API

### Optimisations Implémentées

- ✅ **Bulk fetch** : Regroupement des appels API
- ✅ **Cache** : Évite les appels dupliqués
- ✅ **Retry automatique** : 3 tentatives avec backoff exponentiel
- ✅ **Timeout configurable** : Paramètre Odoo (défaut : 3s)

---

## ✅ Conclusion

Pour finaliser les **tests d'intégration** (US-7.2), nous avons besoin de :

1. **Accès à l'environnement de test** de l'API Vault
2. **Confirmation des endpoints** et de leur format de réponse
3. **Données de test** pour valider les différents scénarios
4. **Documentation API** complète

Une fois ces éléments obtenus, nous pourrons implémenter les tests d'intégration et finaliser complètement le module.

---

**Document créé le** : 2025-11-24  
**Dernière mise à jour** : 2025-11-24  
**Statut** : 📋 En attente de réponse de l'équipe dorevia-vault

