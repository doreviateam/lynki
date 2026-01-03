# 📋 Plan d'Implémentation — Compatibilité DVIG v1.1

**Version** : 1.0  
**Date** : 2025-11-26  
**Sprint** : Sprint 8.1 — Compatibilité DVIG  
**Durée estimée** : 2 jours (1 sprint)  
**Statut** : 🟦 À démarrer

---

## 🎯 Objectif du Sprint

Valider formellement la compatibilité de l'API Vault avec DVIG v1.1 et mettre en place les améliorations recommandées (tests, logging, documentation).

**Résultat attendu** : API Vault validée compatible avec DVIG, tests automatisés en place, documentation mise à jour, réponse officielle à l'équipe DVIG.

---

## 📊 Vue d'Ensemble

| Phase | Durée | Priorité | Statut |
|-------|-------|----------|--------|
| **Phase 1 : Tests de Validation** | 0.5 jour | 🔴 Critique | ⏳ À faire |
| **Phase 2 : Améliorations (Logging)** | 0.25 jour | 🟡 Recommandé | ⏳ À faire |
| **Phase 3 : Documentation** | 0.25 jour | 🟡 Recommandé | ⏳ À faire |
| **Phase 4 : Communication DVIG** | 0.5 jour | 🔴 Critique | ⏳ À faire |
| **Phase 5 : Validation & Déploiement** | 0.5 jour | 🔴 Critique | ⏳ À faire |

**Total** : 2 jours

---

## 📝 User Stories

### US-1 : Validation Compatibilité DVIG (Critique)

**En tant que** développeur Dorevia-Vault  
**Je veux** valider formellement que l'API accepte les payloads DVIG  
**Afin de** garantir la compatibilité et éviter les régressions futures

**Critères d'acceptation** :
- ✅ 3 tests d'intégration créés et passent (Test A, B, C)
- ✅ Tous les endpoints testés (`/api/v1/invoices`, `/api/v1/payments`, `/api/v1/pos-tickets`)
- ✅ Rétrocompatibilité validée (payloads sans champs DVIG)
- ✅ Compatibilité future validée (champs inconnus ignorés)

**Estimation** : 4 points (0.5 jour)

---

### US-2 : Amélioration Logging Traçabilité (Recommandé)

**En tant que** développeur Dorevia-Vault  
**Je veux** logger `correlation_id` et `tenant` dans les logs d'ingestion  
**Afin de** faciliter le debugging entre DVIG et Vault

**Critères d'acceptation** :
- ✅ `correlation_id` loggé dans les logs d'ingestion
- ✅ `tenant` loggé si présent
- ✅ Logs structurés (JSON) avec nouveaux champs
- ✅ Pas d'impact performance

**Estimation** : 2 points (0.25 jour)

---

### US-3 : Documentation API Mise à Jour (Recommandé)

**En tant que** utilisateur de l'API Vault  
**Je veux** savoir que les champs supplémentaires dans `meta` sont tolérés  
**Afin de** comprendre le comportement de l'API

**Critères d'acceptation** :
- ✅ Note ajoutée dans documentation API
- ✅ Exemples de payloads avec champs DVIG
- ✅ README.md mis à jour si nécessaire

**Estimation** : 2 points (0.25 jour)

---

### US-4 : Communication Équipe DVIG (Critique)

**En tant que** équipe Dorevia-Vault  
**Je veux** répondre officiellement à l'équipe DVIG  
**Afin de** confirmer la compatibilité et débloquer l'intégration

**Critères d'acceptation** :
- ✅ Document de réponse créé
- ✅ Résultats des tests inclus
- ✅ Confirmation de compatibilité
- ✅ Communication envoyée à l'équipe DVIG

**Estimation** : 3 points (0.5 jour)

---

### US-5 : Validation & Déploiement (Critique)

**En tant que** équipe Dorevia-Vault  
**Je veux** valider et déployer les changements  
**Afin de** mettre en production les améliorations

**Critères d'acceptation** :
- ✅ Tous les tests passent
- ✅ Code review effectué
- ✅ Déploiement en production réussi
- ✅ Monitoring vérifié

**Estimation** : 3 points (0.5 jour)

---

## 🔨 Tâches Détaillées

### Phase 1 : Tests de Validation (4h)

#### Tâche 1.1 : Créer Test A — Payload avec champs DVIG
**Fichier** : `tests/integration/dvig_compatibility_test.go`

**Description** :
- Créer test pour `/api/v1/invoices` avec payload enrichi DVIG
- Vérifier que la réponse est 200 OK
- Vérifier que les champs DVIG sont ignorés (pas d'erreur)

**Code de test** :
```go
func TestInvoicesHandler_WithDVIGFields(t *testing.T) {
    // Payload avec champs DVIG
    payload := map[string]interface{}{
        "source": "sales",
        "model": "account.move",
        "odoo_id": 123,
        "state": "posted",
        "file": base64PDF,
        "meta": map[string]interface{}{
            "name": "FAC/2025/00123",
            "tenant": "doreviateam",
            "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
            "dvig_version": "1.1.0",
            "timestamp": "2025-11-26T10:30:00Z",
        },
    }
    // ... test
}
```

**Estimation** : 1.5h

---

#### Tâche 1.2 : Créer Test B — Payload sans champs DVIG (rétrocompatibilité)
**Fichier** : `tests/integration/dvig_compatibility_test.go`

**Description** :
- Créer test pour `/api/v1/invoices` avec payload classique (sans champs DVIG)
- Vérifier que la réponse est 200 OK
- Valider la rétrocompatibilité

**Estimation** : 1h

---

#### Tâche 1.3 : Créer Test C — Payload avec champs totalement inconnus
**Fichier** : `tests/integration/dvig_compatibility_test.go`

**Description** :
- Créer test avec champs inconnus dans `meta`
- Vérifier que la réponse est 200 OK (champs ignorés)
- Valider la tolérance aux champs inconnus

**Estimation** : 1h

---

#### Tâche 1.4 : Étendre tests aux autres endpoints
**Fichier** : `tests/integration/dvig_compatibility_test.go`

**Description** :
- Créer tests similaires pour `/api/v1/payments`
- Créer tests similaires pour `/api/v1/pos-tickets`
- Créer tests similaires pour `/api/v1/push_document`

**Estimation** : 0.5h

---

### Phase 2 : Amélioration Logging (2h)

#### Tâche 2.1 : Extraire `correlation_id` depuis `meta`
**Fichier** : `internal/handlers/invoices.go`

**Description** :
- Ajouter extraction de `correlation_id` depuis `payload.Meta`
- Logger dans les logs d'ingestion
- Format : `log.Info().Str("correlation_id", correlationID).Msg("Document ingéré")`

**Code** :
```go
// Extraire correlation_id pour traçabilité
var correlationID string
if payload.Meta != nil {
    if cid, ok := payload.Meta["correlation_id"].(string); ok {
        correlationID = cid
    }
    if tenant, ok := payload.Meta["tenant"].(string); ok {
        log.Info().Str("tenant", tenant).Str("correlation_id", correlationID).Msg("Document ingéré")
    }
}
```

**Estimation** : 0.5h

---

#### Tâche 2.2 : Appliquer logging aux autres handlers
**Fichier** : `internal/handlers/payments.go`, `internal/handlers/pos_tickets_handler.go`

**Description** :
- Ajouter extraction et logging de `correlation_id` et `tenant` dans `payments.go`
- Ajouter extraction et logging de `correlation_id` et `tenant` dans `pos_tickets_handler.go`
- Maintenir cohérence du format de logs

**Estimation** : 1h

---

#### Tâche 2.3 : Tests unitaires pour logging
**Fichier** : `tests/unit/dvig_logging_test.go`

**Description** :
- Créer tests unitaires pour vérifier que `correlation_id` est loggé
- Vérifier que les logs contiennent les champs attendus

**Estimation** : 0.5h

---

### Phase 3 : Documentation (2h)

#### Tâche 3.1 : Mettre à jour PROOF_API.md
**Fichier** : `docs/PROOF_API.md`

**Description** :
- Ajouter section "Champs Meta Tolérés"
- Documenter que les champs supplémentaires dans `meta` sont ignorés
- Ajouter exemples avec champs DVIG

**Estimation** : 0.5h

---

#### Tâche 3.2 : Mettre à jour README.md
**Fichier** : `README.md`

**Description** :
- Ajouter note dans section "API v1 — Ingestion"
- Mentionner la tolérance aux champs `meta` supplémentaires
- Référencer la documentation DVIG

**Estimation** : 0.5h

---

#### Tâche 3.3 : Créer document de référence DVIG
**Fichier** : `docs/DVIG_COMPATIBILITY.md`

**Description** :
- Créer document de référence pour développeurs
- Lister les champs DVIG tolérés
- Exemples de payloads avec champs DVIG

**Estimation** : 1h

---

### Phase 4 : Communication DVIG (4h)

#### Tâche 4.1 : Créer document de réponse officielle
**Fichier** : `docs/REPONSE_EQUIPE_DVIG_COMPATIBILITY.md`

**Description** :
- Répondre au document `SPEC_VAULT_API_COMPATIBILITY_v1.1.md`
- Confirmer la compatibilité
- Inclure résultats des tests
- Indiquer les améliorations apportées

**Structure** :
```markdown
# Réponse — Compatibilité DVIG v1.1

## ✅ Confirmation de Compatibilité
- Compatibilité validée : OUI
- Tests passés : OUI (Test A, B, C)
- Modifications requises : NON

## 📊 Résultats des Tests
- Test A : ✅ PASS
- Test B : ✅ PASS
- Test C : ✅ PASS

## 🔧 Améliorations Apportées
- Logging correlation_id : ✅ Implémenté
- Documentation : ✅ Mise à jour

## 📅 Prochaines Étapes
- Intégration DVIG → Vault : Prêt
```

**Estimation** : 1h

---

#### Tâche 4.2 : Préparer communication email/issue
**Fichier** : `docs/COMMUNICATION_DVIG_EMAIL.md`

**Description** :
- Rédiger email/issue pour l'équipe DVIG
- Inclure lien vers document de réponse
- Indiquer que l'intégration peut démarrer

**Estimation** : 0.5h

---

#### Tâche 4.3 : Valider avec équipe interne
**Description** :
- Code review du document de réponse
- Validation technique
- Validation communication

**Estimation** : 0.5h

---

#### Tâche 4.4 : Envoyer communication à l'équipe DVIG
**Description** :
- Envoyer email/issue avec document de réponse
- Suivre la communication
- Répondre aux questions éventuelles

**Estimation** : 2h (inclut suivi)

---

### Phase 5 : Validation & Déploiement (4h)

#### Tâche 5.1 : Code Review
**Description** :
- Review de tous les changements
- Vérification des tests
- Vérification du logging
- Vérification de la documentation

**Estimation** : 1h

---

#### Tâche 5.2 : Tests finaux
**Description** :
- Exécuter tous les tests (unitaires + intégration)
- Vérifier que tous passent
- Vérifier couverture de code

**Estimation** : 0.5h

---

#### Tâche 5.3 : Build et vérification
**Description** :
- Build du binaire
- Vérification de la version
- Vérification des logs

**Estimation** : 0.5h

---

#### Tâche 5.4 : Déploiement
**Description** :
- Déploiement en staging (si applicable)
- Tests de smoke
- Déploiement en production
- Vérification post-déploiement

**Estimation** : 1.5h

---

#### Tâche 5.5 : Monitoring post-déploiement
**Description** :
- Vérifier les logs (correlation_id présent)
- Vérifier les métriques
- Vérifier qu'aucune erreur

**Estimation** : 0.5h

---

## 📅 Planning Détaillé

### Jour 1 — Matin (4h)

**09:00 - 10:30** : Tâche 1.1 — Test A (payload avec champs DVIG)  
**10:30 - 11:30** : Tâche 1.2 — Test B (rétrocompatibilité)  
**11:30 - 12:30** : Tâche 1.3 — Test C (champs inconnus)

### Jour 1 — Après-midi (4h)

**14:00 - 14:30** : Tâche 1.4 — Étendre tests aux autres endpoints  
**14:30 - 15:00** : Tâche 2.1 — Logging correlation_id (invoices)  
**15:00 - 16:00** : Tâche 2.2 — Logging autres handlers  
**16:00 - 16:30** : Tâche 2.3 — Tests unitaires logging  
**16:30 - 17:00** : Tâche 3.1 — Documentation PROOF_API.md

### Jour 2 — Matin (4h)

**09:00 - 09:30** : Tâche 3.2 — Documentation README.md  
**09:30 - 10:30** : Tâche 3.3 — Document référence DVIG  
**10:30 - 11:30** : Tâche 4.1 — Document réponse officielle  
**11:30 - 12:00** : Tâche 4.2 — Préparer communication

### Jour 2 — Après-midi (4h)

**14:00 - 14:30** : Tâche 4.3 — Valider avec équipe interne  
**14:30 - 16:30** : Tâche 4.4 — Envoyer communication DVIG  
**16:30 - 17:30** : Tâche 5.1 — Code Review  
**17:30 - 18:00** : Tâche 5.2 — Tests finaux

### Jour 3 — Matin (2h)

**09:00 - 09:30** : Tâche 5.3 — Build et vérification  
**09:30 - 11:00** : Tâche 5.4 — Déploiement  
**11:00 - 11:30** : Tâche 5.5 — Monitoring post-déploiement

---

## ✅ Definition of Done

### Critères de Complétion

- [x] ✅ Tous les tests d'intégration créés et passent (Test A, B, C)
- [x] ✅ Logging `correlation_id` et `tenant` implémenté
- [x] ✅ Documentation mise à jour (PROOF_API.md, README.md)
- [x] ✅ Document de réponse DVIG créé et validé
- [x] ✅ Communication envoyée à l'équipe DVIG
- [x] ✅ Code review effectué
- [x] ✅ Tous les tests passent (100%)
- [x] ✅ Déploiement en production réussi
- [x] ✅ Monitoring vérifié (logs, métriques)

---

## 🧪 Tests à Créer

### Test A : Payload avec champs DVIG

**Fichier** : `tests/integration/dvig_compatibility_test.go`

```go
func TestInvoicesHandler_WithDVIGFields(t *testing.T) {
    // Setup
    app := setupTestApp()
    base64PDF := encodeTestPDF()
    
    payload := map[string]interface{}{
        "source": "sales",
        "model": "account.move",
        "odoo_id": 123,
        "state": "posted",
        "file": base64PDF,
        "meta": map[string]interface{}{
            "name": "FAC/2025/00123",
            "tenant": "doreviateam",
            "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
            "dvig_version": "1.1.0",
            "timestamp": "2025-11-26T10:30:00Z",
            "dvig_signature": "abc123def456...",
            "source_ip": "192.168.1.100",
            "user_agent": "DVIG/1.1.0",
        },
    }
    
    // Test
    req := createPOSTRequest("/api/v1/invoices", payload)
    resp, err := app.Test(req)
    
    // Assertions
    assert.NoError(t, err)
    assert.Equal(t, 200, resp.StatusCode)
    
    var result InvoiceResponse
    json.NewDecoder(resp.Body).Decode(&result)
    assert.NotEmpty(t, result.ID)
    assert.NotEmpty(t, result.SHA256Hex)
}
```

---

### Test B : Payload sans champs DVIG (rétrocompatibilité)

```go
func TestInvoicesHandler_WithoutDVIGFields(t *testing.T) {
    // Payload classique sans champs DVIG
    payload := map[string]interface{}{
        "source": "sales",
        "model": "account.move",
        "odoo_id": 123,
        "state": "posted",
        "file": base64PDF,
        "meta": map[string]interface{}{
            "name": "FAC/2025/00123",
        },
    }
    
    // Test et assertions similaires
    // Vérifier que la réponse est identique à avant
}
```

---

### Test C : Payload avec champs totalement inconnus

```go
func TestInvoicesHandler_WithUnknownFields(t *testing.T) {
    payload := map[string]interface{}{
        "source": "sales",
        "model": "account.move",
        "odoo_id": 123,
        "state": "posted",
        "file": base64PDF,
        "meta": map[string]interface{}{
            "name": "FAC/2025/00123",
            "unknown_field_xyz": "should_be_ignored",
            "another_unknown": 12345,
        },
    }
    
    // Test et assertions
    // Vérifier que la réponse est 200 OK (champs ignorés)
}
```

---

## 📊 Métriques de Succès

### Critères de Validation

- ✅ **Taux de réussite tests** : 100%
- ✅ **Couverture de code** : Maintenue ou améliorée
- ✅ **Performance** : Aucune dégradation (logging minimal)
- ✅ **Compatibilité** : 100% des endpoints testés

### KPIs

- **Tests créés** : 3+ tests d'intégration
- **Handlers mis à jour** : 3+ handlers (invoices, payments, pos-tickets)
- **Documentation mise à jour** : 2+ documents
- **Communication** : 1 document de réponse + email

---

## 🚨 Risques et Mitigation

### Risque 1 : Tests échouent

**Probabilité** : 🟡 Faible  
**Impact** : 🔴 Élevé  
**Mitigation** : 
- Vérifier le comportement actuel avant d'écrire les tests
- Tester manuellement d'abord
- Ajuster les tests si nécessaire

---

### Risque 2 : Performance logging

**Probabilité** : 🟢 Très faible  
**Impact** : 🟡 Moyen  
**Mitigation** :
- Logging conditionnel (seulement si champs présents)
- Pas de traitement lourd dans le logging
- Monitoring post-déploiement

---

### Risque 3 : Communication DVIG retardée

**Probabilité** : 🟡 Faible  
**Impact** : 🟡 Moyen  
**Mitigation** :
- Préparer la communication en parallèle des tests
- Valider avec équipe interne rapidement
- Envoyer dès que tests validés

---

## 📞 Communication

### Interne

- **Daily Standup** : Mise à jour quotidienne sur l'avancement
- **Code Review** : Review avant merge
- **Démo Sprint** : Présentation des résultats

### Externe (DVIG)

- **Document de réponse** : `REPONSE_EQUIPE_DVIG_COMPATIBILITY.md`
- **Email/Issue** : Communication officielle
- **Suivi** : Répondre aux questions éventuelles

---

## 📚 Références

- **Spécification DVIG** : `docs/SPEC_VAULT_API_COMPATIBILITY_v1.1.md`
- **Avis Technique** : `docs/AVIS_TECHNIQUE_DVIG_COMPATIBILITY.md`
- **Documentation API** : `docs/PROOF_API.md`

---

## ✅ Checklist Sprint

### Avant de démarrer

- [ ] Sprint planifié et estimé
- [ ] Tâches créées dans le backlog
- [ ] Équipe informée
- [ ] Environnement de test préparé

### Pendant le sprint

- [ ] Tests créés et passent
- [ ] Logging implémenté
- [ ] Documentation mise à jour
- [ ] Code review effectué

### Fin de sprint

- [ ] Tous les tests passent
- [ ] Déploiement réussi
- [ ] Communication DVIG envoyée
- [ ] Monitoring vérifié
- [ ] Rétrospective effectuée

---

**Document créé le** : 2025-11-26  
**Version** : 1.0  
**Statut** : 🟦 À démarrer  
**Sprint** : Sprint 8.1 — Compatibilité DVIG

