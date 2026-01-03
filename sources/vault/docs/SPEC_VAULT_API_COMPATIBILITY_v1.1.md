# 📘 Spécification — Compatibilité API Vault avec DVIG

**Version** : 1.1  
**Date** : 2025-11-26  
**Auteur** : Doreviateam  
**Destinataire** : Équipe Dorevia-Vault  
**Statut** : 🟦 À valider

---

## 🎯 Objectif

Ce document décrit les modifications apportées par **DVIG (Dorevia Vault Ingestion Gateway)** aux payloads envoyés vers l'API Vault, et les ajustements nécessaires côté Vault pour garantir la compatibilité totale.

**Vision globale** : DVIG enrichit chaque payload avec des champs de traçabilité, tenant isolation, et observabilité. Ces champs n'ont pas vocation à être utilisés par Vault — ils doivent être **acceptés**, **ignorés**, et éventuellement **loggés**, mais jamais bloquants.

---

## 📊 Contexte

**DVIG** est un gateway unifié qui :
- Normalise tous les appels Odoo → Vault
- Enrichit automatiquement les payloads avec des métadonnées de traçabilité
- Gère la retry, le circuit breaker, et le rate limiting
- Fournit une observabilité complète (logs structurés, métriques)

**Impact** : DVIG ajoute des champs supplémentaires dans les payloads pour la traçabilité et l'observabilité. Ces champs doivent être **tolérés sans erreur** par l'API Vault.

---

## 🔍 Analyse de Compatibilité

### Format Payload Actuel (Vault API v1.3+)

L'API Vault attend actuellement :

```json
{
  "source": "sales",
  "model": "account.move",
  "odoo_id": 123,
  "state": "posted",
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

### Format Payload avec DVIG (v1.1)

DVIG enrichit le payload avec des métadonnées supplémentaires dans `meta` :

```json
{
  "source": "sales",
  "model": "account.move",
  "odoo_id": 123,
  "state": "posted",
  "file": "<base64_encoded_pdf>",
  "meta": {
    // Champs existants (inchangés)
    "name": "FAC/2025/00123",
    "partner_id": 45,
    "date": "2025-11-24",
    "amount_total": 540.20,
    "move_type": "out_invoice",
    "content_type": "application/pdf",
    
    // NOUVEAUX CHAMPS ajoutés par DVIG (à ignorer par Vault)
    "tenant": "doreviateam",                    // Tenant (depuis header X-Tenant)
    "timestamp": "2025-11-26T10:30:00Z",       // Timestamp UTC ISO 8601
    "correlation_id": "550e8400-e29b-41d4-a716-446655440000",  // UUID v4 pour traçabilité
    "dvig_version": "1.1.0",                   // Version DVIG
    "dvig_signature": "abc123def456...",        // Signature SHA-256 DVIG (optionnel)
    "source_ip": "192.168.1.100",              // IP source (optionnel)
    "user_agent": "DVIG/1.1.0"                 // User-Agent (optionnel)
  }
}
```

**Important** : Ces champs n'ont **aucun impact fonctionnel** sur la logique métier Vault. Ils sont uniquement destinés à la traçabilité et l'observabilité.

---

## 📋 Champs Ajoutés par DVIG

| Champ | Type | Obligatoire | Description | Utilisation Vault |
|-------|------|-------------|-------------|-------------------|
| `tenant` | string | ✅ | Tenant (depuis header X-Tenant) | **Ignoré** (traçabilité) |
| `timestamp` | string (ISO 8601) | ✅ | Timestamp UTC de l'ingestion | **Ignoré** (traçabilité) |
| `correlation_id` | string (UUID v4) | ✅ | ID de corrélation pour traçabilité | **Ignoré** (traçabilité) |
| `dvig_version` | string | ✅ | Version DVIG (ex: "1.1.0") | **Ignoré** (traçabilité) |
| `dvig_signature` | string (hex) | ⚠️ | Signature SHA-256 DVIG (si secret configuré) | **Ignoré** (sécurité future) |
| `source_ip` | string | ⚠️ | IP source de la requête | **Ignoré** (traçabilité) |
| `user_agent` | string | ⚠️ | User-Agent de la requête | **Ignoré** (traçabilité) |

**Note** : Tous ces champs sont **optionnels** pour Vault et doivent être **ignorés** sans impact sur le traitement.

---

## ✅ Préconisations Techniques

### Préconisation 1 : API Vault doit ignorer les champs inconnus (OBLIGATOIRE)

**Résultat attendu** :
- ✅ Aucun rejet lors de l'envoi de champs non documentés dans `meta`
- ✅ Compatibilité future garantie, même si DVIG ajoute de nouveaux champs plus tard
- ✅ Comportement standard pour une API moderne orientée "extensibility-safe"

**Implémentation recommandée** :
- Ne pas valider strictement le schéma JSON
- Parcourir `meta` et ne traiter que les champs connus
- Logger en DEBUG les champs inconnus (optionnel, pour audit)

**Exemple de code (pseudo-code)** :
```go
// Pseudo-code — Go
for key, value := range meta {
    if !knownFields[key] {
        log.Debug("metafield ignored", "field", key)
        continue
    }
    // process known field…
}
```

**Avantage** : Aucune modification nécessaire côté Vault si comportement par défaut.

---

### Préconisation 2 : Si validation stricte : ajouter la whitelist DVIG (OPTIONNEL)

Pour les environnements où une validation stricte est nécessaire (tests, conformité interne), ajouter la liste des champs DVIG dans la whitelist.

**Champs DVIG recommandés côté Vault** :
```
tenant
timestamp
correlation_id
dvig_version
dvig_signature
source_ip
user_agent
```

**Comportement recommandé** :
- Ces champs doivent être **tolérés**
- Leur présence ne doit pas être obligatoire
- Ils ne doivent avoir **aucun impact fonctionnel** sur la logique métier Vault

**Exemple de code (pseudo-code)** :
```go
// Pseudo-code — Go
ALLOWED_META_FIELDS = [
    // Champs métier existants
    "name", "partner_id", "date", "amount_total", "move_type", "content_type",
    // Champs DVIG (optionnels, ignorés)
    "tenant", "timestamp", "correlation_id", "dvig_version",
    "dvig_signature", "source_ip", "user_agent"
]

func validate_meta(meta map[string]interface{}) error {
    for key := range meta {
        if !contains(ALLOWED_META_FIELDS, key) {
            // Option A : Ignorer (recommandé)
            log.Debug("metafield ignored", "field", key)
            // Option B : Rejeter (si validation stricte)
            // return ValidationError(f"Champ inconnu: {key}")
        }
    }
    return nil
}
```

---

### Préconisation 3 : Pas de modification du format API actuel (OBLIGATOIRE)

👉 **Aucune évolution de l'API Vault v1.3+ n'est requise**

Le modèle JSON racine reste identique :

```json
{
  "source": "...",
  "model": "...",
  "odoo_id": 123,
  "state": "posted",
  "file": "...",
  "meta": { ... }
}
```

La seule évolution concerne le **comportement de tolérance** dans `meta`.

**Avantage** : API stable, pas de breaking changes.

---

### Préconisation 4 : Tests automatiques recommandés côté Vault (OBLIGATOIRE)

Créer 3 tests d'intégration API pour garantir la compatibilité :

#### ✔️ Test A — Payload enrichi DVIG

**Objectif** : Accepte et ignore les champs non connus.

**Payload** :
```json
{
  "source": "sales",
  "model": "account.move",
  "odoo_id": 123,
  "state": "posted",
  "file": "<base64_pdf>",
  "meta": {
    "name": "FAC/2025/00123",
    "tenant": "doreviateam",
    "correlation_id": "test-correlation-123",
    "dvig_version": "1.1.0",
    "timestamp": "2025-11-26T10:30:00Z"
  }
}
```

**Résultat attendu** : ✅ 200 OK avec réponse normale (champs inconnus ignorés)

---

#### ✔️ Test B — Payload ancien sans meta DVIG

**Objectif** : Rétrocompatibilité.

**Payload** :
```json
{
  "source": "sales",
  "model": "account.move",
  "odoo_id": 123,
  "state": "posted",
  "file": "<base64_pdf>",
  "meta": {
    "name": "FAC/2025/00123"
  }
}
```

**Résultat attendu** : ✅ 200 OK (rétrocompatibilité maintenue)

---

#### ✔️ Test C — Payload avec champs totalement inconnus

**Objectif** : Stabilité (pas de 400).

**Payload** :
```json
{
  "source": "sales",
  "model": "account.move",
  "odoo_id": 123,
  "state": "posted",
  "file": "<base64_pdf>",
  "meta": {
    "name": "FAC/2025/00123",
    "unknown_field_xyz": "should_be_ignored"
  }
}
```

**Résultat attendu** : ✅ 200 OK (champs inconnus ignorés) OU ⚠️ 400 Bad Request (si validation stricte)

---

### Préconisation 5 : Log minimal pour audit interne Vault (OPTIONNEL)

**Recommandé (pas obligatoire)** :
- Logger `correlation_id` dans les logs Vault (pour debugging DVIG ↔ Vault)
- Logger `tenant` (si multi-tenant futur)
- Ajouter le champ en façade Prometheus *uniquement en DEBUG* si besoin

**Avantage** : Debugging puissant entre DVIG ↔ Vault.

**Exemple de log** :
```
[INFO] Document ingéré: id=uuid, correlation_id=550e8400-..., tenant=doreviateam
```

---

### Préconisation 6 : Documentation API (OBLIGATOIRE)

👉 **Aucune modification dans les schémas API publics.**

Ajouter un paragraphe dans la doc interne :

> "L'API accepte des champs supplémentaires dans `meta` fournis par DVIG ou autres systèmes d'ingestion. Ces champs sont ignorés pour le traitement métier mais peuvent être utilisés pour la traçabilité interne."

**Avantage** : Clarté interne, documentation future-proof.

---

### Préconisation 7 : Signature DVIG (future optional feature)

Si un jour `dvig_signature` est activé, Vault pourra :
- soit l'ignorer (recommandé court terme)
- soit vérifier que le hash est bien calculé à partir du payload (moyen terme)

**Pas de changement pour le moment**, juste **tolérer le champ**.

---

## 🔄 Autres Types de Documents

### Payment (`/api/v1/payments`)

DVIG ajoute les mêmes champs dans `meta` (si présent) ou dans le payload racine.

**Format attendu** :
```json
{
  "payment_id": 456,
  "amount": 540.20,
  "date": "2025-11-24",
  "meta": {
    "tenant": "doreviateam",
    "correlation_id": "550e8400-...",
    "dvig_version": "1.1.0",
    ...
  }
}
```

### POS Ticket (`/api/v1/pos-tickets`)

Même principe : champs DVIG ajoutés dans `meta` ou payload racine.

### Z-Report (`/api/v1/pos/zreports`)

Même principe : champs DVIG ajoutés dans `meta` ou payload racine.

---

## 📌 Synthèse Opérationnelle

| Préconisation | Obligatoire | Impact | Priorité |
|---------------|-------------|--------|----------|
| **Ignorer champs inconnus** | ✅ Oui | Aucune rupture, 100% compatible | 🔴 Critique |
| **Ajouter whitelist DVIG si validation stricte** | ⚠️ Optionnel | Compat avec mode "strict" | 🟡 Moyenne |
| **Aucun changement API** | ✅ Oui | API stable v1.3+ | 🔴 Critique |
| **Ajouter tests DVIG** | ✅ Oui | Sécurité et confiance | 🔴 Critique |
| **Logging minimal DVIG** | ⚠️ Optionnel | Aide au debug | 🟢 Faible |
| **Documenter tolérance meta** | ✅ Oui | Clarté interne | 🟡 Moyenne |

---

## 🚀 Conclusion

L'intégration DVIG → Vault nécessite **zéro changement structurel**, seulement une **tolérance explicite ou implicite** des nouveaux champs.

L'API de Vault devient :
- ✅ **future-proof** (accepte les champs futurs sans modification)
- ✅ **robuste** (pas de rejet sur champs inconnus)
- ✅ **tolérante** (compatible avec environnements multi-ingestion)
- ✅ **compatible** avec la montée en charge DVIG

---

## ✅ Checklist de Validation

- [ ] Test payload avec champs DVIG → ✅ 200 OK
- [ ] Test payload sans champs DVIG → ✅ 200 OK (rétrocompatibilité)
- [ ] Validation stricte → ✅ Champs ignorés ou autorisés
- [ ] Tests automatiques créés (Test A, B, C)
- [ ] Documentation API mise à jour (si nécessaire)
- [ ] Logging minimal implémenté (optionnel)
- [ ] Confirmation équipe Dorevia-Vault

---

## 📞 Actions Requises

### Pour l'Équipe Dorevia-Vault

1. **Valider la compatibilité** :
   - Tester un payload avec champs DVIG
   - Vérifier que l'API accepte et ignore les champs inconnus
   - Confirmer que la réponse reste identique

2. **Si validation stricte** :
   - Ajouter les champs DVIG dans la liste des champs autorisés
   - Documenter ces champs comme "optionnels, ignorés"
   - Mettre à jour la documentation API

3. **Implémenter les tests** :
   - Créer les 3 tests d'intégration (A, B, C)
   - Valider la rétrocompatibilité
   - Valider la tolérance des champs inconnus

4. **Confirmer le comportement** :
   - Répondre à ce document avec le comportement validé
   - Indiquer si des modifications sont nécessaires

---

### Pour l'Équipe DVIG

1. **Attendre la validation** de l'équipe Dorevia-Vault
2. **Ajuster si nécessaire** selon la réponse
3. **Tester en intégration** une fois la validation obtenue

---

## 📚 Références

- **Spécification DVIG v1.1** : `DVIG_v1.1_spec.md`
- **Format Payload Vault** : `REPONSES_VAULT_API.md` (dans `dorevia_vault_connector`)
- **Architecture DVIG** : `docs/architecture/dataflow.md`

---

**Document créé le** : 2025-11-26  
**Version** : 1.1  
**Statut** : 🟦 À valider par l'équipe Dorevia-Vault

